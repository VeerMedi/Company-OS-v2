"""
Parallel Voice Pipeline for Low-Latency Streaming

Orchestrates voice interaction with parallel execution:
- Streaming STT with partial transcript callbacks
- Early intent detection on partial transcripts
- Filler audio while RAG/LLM runs asynchronously
- Chunked TTS for incremental speech output

Target: < 700ms perceived first audio response

Architecture:
    Audio Input
        │
        ▼
    [Streaming STT] ──partial──► [Intent Detection]
        │                              │
        │                     confidence > 0.7
        │                              │
        ▼                              ▼
    [Full Transcript]           [Filler Audio] ──► 🔊 OUT 1 (< 300ms)
        │                              │
        │◄─────────────────────────────┘
        ▼                           
    [RAG + LLM] ──async──► [Chunked TTS] ──► 🔊 OUT 2, 3, 4...
"""

import asyncio
import json
import time
import threading
from typing import Generator, Dict, Any, Optional, Callable
from concurrent.futures import ThreadPoolExecutor

# Latency logger removed during cleanup
from voice.intent_handler import IntentHandler


class ParallelVoicePipeline:
    """
    Parallel voice pipeline for low-latency streaming interaction.
    
    Key features:
    - Early intent detection on partial STT
    - Filler audio plays while RAG runs
    - Chunked TTS for progressive audio output
    - Latency instrumentation at every stage
    """
    
    # Configuration
    INTENT_CONFIDENCE_THRESHOLD = 0.7  # Trigger filler when intent is confident
    FILLER_AUDIO_ENABLED = True        # Enable filler audio feature
    CHUNKED_TTS_ENABLED = True         # Enable chunked TTS
    
    def __init__(self):
        """Initialize parallel pipeline components."""
        from voice.speech_to_text import SpeechToText
        from voice.text_to_speech import TextToSpeech
        from voice.conversationalist import ConversationalRewriter
        from voice.instant_responses import get_instant_response_manager
        from rag.rag_agent import RAGAgent
        
        # Core components (reuse singletons where possible)
        self.stt = SpeechToText()
        self.tts = TextToSpeech()
        self.intent_handler = IntentHandler()
        self.rewriter = ConversationalRewriter()
        self.rag_agent = RAGAgent()
        self.instant_responses = get_instant_response_manager()
        
        # Lazy load streaming/chunked modules
        self._streaming_stt = None
        self._chunked_tts = None
        
        # Thread pool for parallel execution
        self._executor = ThreadPoolExecutor(max_workers=3)
        
        print("ParallelVoicePipeline initialized with instant responses")
    
    def _get_streaming_stt(self):
        """Get streaming STT instance."""
        if self._streaming_stt is None:
            try:
                from voice.streaming_stt import get_streaming_stt
                self._streaming_stt = get_streaming_stt()
            except ImportError:
                self._streaming_stt = None
        return self._streaming_stt
    
    def _get_chunked_tts(self):
        """Get chunked TTS instance."""
        if self._chunked_tts is None:
            try:
                from voice.chunked_tts import get_chunked_tts
                self._chunked_tts = get_chunked_tts()
            except ImportError:
                self._chunked_tts = None
        return self._chunked_tts
    
    def process_request_streaming(
        self,
        audio_path: str,
        category: Optional[str] = None,
        conversation_state: Optional[Dict[str, Any]] = None,
        skip_filler: bool = False
    ) -> Generator[str, None, None]:
        """
        Process voice request with streaming, parallel execution.
        
        Yields JSON events:
        - {"type": "status", "payload": "..."}
        - {"type": "transcription", "payload": {"text": "...", "partial": bool}}
        - {"type": "intent", "payload": "intent_name"}
        - {"type": "audio", "payload": {"data": "base64", "is_filler": bool}}
        - {"type": "audio", "payload": {"data": "base64", "chunk": N, "is_last": bool}}
        - {"type": "action_data", "payload": {...}}
        - {"type": "latency", "payload": {...}}
        - {"type": "done", "payload": "complete"}
        
        Args:
            audio_path: Path to input audio file
            category: Optional category filter for RAG
            conversation_state: Previous conversation state
            skip_filler: If True, skip filler audio (frontend handles it)
            
        Yields:
            JSON-encoded event strings
        """
        # logger = LatencyLogger()  # Disabled - logger removed
        
        # Shared state for parallel processing
        detected_intent = {"intent": "unknown", "confidence": 0}
        full_transcript = {"text": "", "ready": False}
        filler_sent = {"sent": False}
        rag_result = {"result": None, "ready": False}
        
        def on_partial_transcript(text: str, is_final: bool):
            """Callback for partial transcripts - detect intent early."""
            nonlocal detected_intent
            
            if not is_final and not filler_sent["sent"]:
                # Try early intent detection
                intent_result = self.intent_handler.detect_intent(text)
                if intent_result.get("confidence", 0) > self.INTENT_CONFIDENCE_THRESHOLD:
                    detected_intent = intent_result
        
        try:
            yield self._event("status", "Listening...")
            
            # === Stage 1: Streaming STT ===
            logger.start_stage("stt")
            
            streaming_stt = self._get_streaming_stt()
            use_streaming = streaming_stt is not None and streaming_stt.is_available()
            
            if use_streaming:
                yield self._event("status", "Transcribing (streaming)...")
                
                # Stream transcription with partial callbacks
                for stt_event in streaming_stt.transcribe_streaming(
                    audio_path,
                    chunk_callback=on_partial_transcript
                ):
                    if stt_event.get("type") == "partial":
                        yield self._event("transcription", {
                            "text": stt_event["text"],
                            "partial": True,
                            "confidence": stt_event.get("confidence", 0)
                        })
                        
                        # Check if we should send filler now
                        if (self.FILLER_AUDIO_ENABLED and 
                            not skip_filler and 
                            not filler_sent["sent"] and
                            detected_intent.get("confidence", 0) > self.INTENT_CONFIDENCE_THRESHOLD):
                            
                            yield from self._generate_filler(
                                detected_intent["intent"],
                                logger
                            )
                            filler_sent["sent"] = True
                            
                    elif stt_event.get("type") == "final":
                        full_transcript["text"] = stt_event["text"]
                        full_transcript["ready"] = True
                        
                    elif stt_event.get("type") == "error":
                        yield self._event("error", stt_event.get("error"))
                        return
            else:
                # Fallback to standard STT
                yield self._event("status", "Transcribing...")
                stt_result = self.stt.transcribe(audio_path)
                
                if not stt_result.get("success"):
                    yield self._event("error", f"Transcription failed: {stt_result.get('error')}")
                    return
                    
                full_transcript["text"] = stt_result["text"].strip()
                full_transcript["ready"] = True
            
            logger.end_stage("stt")
            
            user_text = full_transcript["text"]
            
            # Validate transcript
            if not user_text or len(user_text) < 3:
                yield self._event("error", "No speech detected. Please try again.")
                return
                
            yield self._event("transcription", {
                "text": user_text,
                "partial": False
            })
            
            # === Stage 2: Intent Detection (IMMEDIATE for frontend filler) ===
            logger.start_stage("intent")
            
            # Detect intent from full transcript
            if detected_intent.get("intent") == "unknown":
                detected_intent = self.intent_handler.detect_intent(user_text)
            
            # Emit intent IMMEDIATELY so frontend can play contextual filler via browser TTS
            yield self._event("intent", detected_intent["intent"])
            logger.end_stage("intent")
            
            needs_rag = detected_intent.get("needs_rag", True)
            
            # NOTE: Frontend plays browser TTS filler now based on intent
            # We continue with RAG processing in parallel
            
            # Initialize final_answer
            final_answer = ""
            
            # === Stage 3: Check for instant responses FIRST ===
            instant_intent = self.instant_responses.detect_intent(user_text)
            instant_answer = None
            
            if instant_intent:
                # Get instant response without RAG
                logger.start_stage("instant_response")
                import datetime
                hour = datetime.datetime.now().hour
                time_of_day = "morning" if hour < 12 else ("afternoon" if hour < 18 else "evening")
                
                instant_answer = self.instant_responses.get_response(
                    instant_intent,
                    context={"time_of_day": time_of_day}
                )
                logger.end_stage("instant_response")
                
                if instant_answer:
                    yield self._event("instant_response", {
                        "intent": instant_intent,
                        "answer": instant_answer
                    })
                    final_answer = instant_answer
                    needs_rag = False
            
            # === Stage 4: RAG + LLM (only if no instant response) ===
            if not instant_answer and not needs_rag:
                # Handle small talk without RAG (fallback)
                final_answer = "I'm doing well! I'm here to help you with your analytics and projects."
            elif not instant_answer and needs_rag:
                logger.start_stage("rag")
                yield self._event("status", "Fetching data...")
                
                rag_response = self.rag_agent.query(
                    user_text,
                    category=category,
                    conversation_state=conversation_state,
                    is_voice=True
                )
                
                logger.end_stage("rag")
                
                raw_answer = rag_response.get("answer", "I couldn't find that information.")
                
                # Emit action data if present
                if rag_response.get("is_action") or rag_response.get("conversation_state"):
                    yield self._event("action_data", {
                        "is_action": rag_response.get("is_action", False),
                        "conversation_state": rag_response.get("conversation_state"),
                        "action_params": rag_response.get("action_params"),
                        "action_type": rag_response.get("action_type")
                    })
                
                # Conversational rewrite
                logger.start_stage("rewrite")
                yield self._event("status", "Formulating response...")
                final_answer = self.rewriter.rewrite(raw_answer, query=user_text)
                logger.end_stage("rewrite")
            
            # === Stage 5: Chunked TTS ===
            logger.start_stage("tts")
            yield self._event("status", "Speaking...")
            
            chunked_tts = self._get_chunked_tts()
            
            if self.CHUNKED_TTS_ENABLED and chunked_tts is not None:
                # Stream TTS chunks
                chunk_index = 0
                for tts_chunk in chunked_tts.synthesize_streaming(final_answer, include_ack=False):
                    if tts_chunk.get("audio_base64"):
                        is_first = (chunk_index == 0)
                        if is_first and not filler_sent["sent"]:
                            logger.mark_first_audio()
                        
                        yield self._event("audio", {
                            "data": tts_chunk["audio_base64"],
                            "text": tts_chunk.get("text", ""),
                            "chunk_type": tts_chunk.get("type"),
                            "chunk": chunk_index,
                            "is_last": tts_chunk.get("is_last", False)
                        })
                        chunk_index += 1
            else:
                # Fallback to full TTS
                final_audio = self.tts.synthesize(final_answer)
                
                if final_audio.get("success"):
                    if not filler_sent["sent"]:
                        logger.mark_first_audio()
                    
                    yield self._event("audio", {
                        "data": final_audio["audio_base64"],
                        "text": final_answer,
                        "is_final": True
                    })
                else:
                    yield self._event("error", "Failed to generate speech")
            
            logger.end_stage("tts")
            
            # === Finalize ===
            latency_data = logger.finalize()
            get_latency_stats().add_record(logger.record)
            
            yield self._event("latency", latency_data)
            yield self._event("done", "Interaction complete")
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            yield self._event("error", str(e))
    
    def _generate_filler(
        self,
        intent: str,
        # logger: removed - LatencyLogger was deleted
    ) -> Generator[str, None, None]:
        """Generate and yield filler audio."""
        logger.start_stage("filler")
        
        filler_phrase = self.intent_handler.get_filler_phrase(intent)
        
        try:
            # Try to get from cache first
            from voice.tts_cache import get_tts_cache
            tts_cache = get_tts_cache()
            
            cached_audio = tts_cache.get(filler_phrase)
            
            if cached_audio:
                # Use cached audio (instant!)
                logger.mark_first_audio()
                yield self._event("audio", {
                    "data": cached_audio["audio_base64"],
                    "text": filler_phrase,
                    "is_filler": True,
                    "cached": True
                })
            else:
                # Generate and cache for next time
                filler_audio = self.tts.synthesize(filler_phrase)
                
                if filler_audio.get("success"):
                    # Cache for future use
                    tts_cache.set(
                        filler_phrase,
                        filler_audio["audio_base64"],
                        filler_audio.get("mime_type", "audio/mp3")
                    )
                    
                    logger.mark_first_audio()
                    yield self._event("audio", {
                        "data": filler_audio["audio_base64"],
                        "text": filler_phrase,
                        "is_filler": True,
                        "cached": False
                    })
        except Exception as e:
            print(f"⚠️  Filler generation failed: {e}")
        
        logger.end_stage("filler")
    
    def _event(self, type_: str, payload: Any) -> str:
        """Format event as JSON string."""
        return json.dumps({
            "type": type_,
            "payload": payload,
            "timestamp": time.time()
        }) + "\n"


# Import Any for type hints
from typing import Any

# Default instance
_parallel_pipeline_instance = None

def get_parallel_pipeline() -> ParallelVoicePipeline:
    """Get the parallel pipeline instance."""
    global _parallel_pipeline_instance
    if _parallel_pipeline_instance is None:
        _parallel_pipeline_instance = ParallelVoicePipeline()
    return _parallel_pipeline_instance
