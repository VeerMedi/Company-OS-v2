import json
import base64
import time
import threading
from typing import Generator, Dict, Any, Optional

from voice.speech_to_text import SpeechToText
from voice.text_to_speech import TextToSpeech
from voice.intent_handler import IntentHandler
from voice.conversationalist import ConversationalRewriter
from rag.rag_agent import RAGAgent

class VoicePipeline:
    """
    Orchestrates the voice interaction pipeline with streaming support.
    Pipeline: STT -> Intent -> Filler (Instant) -> RAG -> Rewrite -> TTS -> Output
    """
    
    def __init__(self):
        self.stt = SpeechToText()
        self.tts = TextToSpeech()
        self.intent_handler = IntentHandler()
        self.rewriter = ConversationalRewriter()
        # RAG Agent is heavy, lazy load or use shared instance
        self.rag_agent = RAGAgent()
        
    def process_request(self, audio_path: str, category: Optional[str] = None, conversation_state: Optional[Dict[str, Any]] = None, skip_filler: bool = False) -> Generator[str, None, None]:
        """
        Process a voice request and stream results as JSON events.
        Yields JSON strings:
        - {"type": "status", "message": "Listening..."}
        - {"type": "audio", "chunk": "<base64>", "is_filler": true}
        - {"type": "transcription", "text": "..."}
        - {"type": "audio", "chunk": "<base64>", "is_final": true}
        - {"type": "action_data", "payload": {...}}
        """
        
        # 1. Speech to Text
        yield self._event("status", "Transcribing speech...")
        stt_result = self.stt.transcribe(audio_path)
        
        if not stt_result['success']:
            yield self._event("error", f"Transcription failed: {stt_result.get('error')}")
            return
            
        user_text = stt_result['text'].strip()
        
        # Reject empty or very short transcriptions (likely silence/noise)
        if not user_text or len(user_text) < 3:
            yield self._event("error", "No speech detected. Please try again.")
            return
            
        yield self._event("transcription", user_text)
        
        # 2. Intent Detection (Skip if we are in a conversation flow)
        detected_intent = "unknown"
        needs_rag = True
        
        if conversation_state and conversation_state.get('step'):
            # If in conversation, we skip intent detection and go straight to RAG logic needed for the flow
            yield self._event("status", "Continuing conversation...")
            detected_intent = "conversation_flow"
        else:
            yield self._event("status", "Understanding intent...")
            intent_result = self.intent_handler.detect_intent(user_text)
            detected_intent = intent_result['intent']
            needs_rag = intent_result['needs_rag']
            yield self._event("intent", detected_intent)
        
        # 3. Instant Filler (Only if not in active flow and needs RAG)
        if needs_rag and detected_intent != "conversation_flow":
            filler_phrase = self.intent_handler.get_filler_phrase(detected_intent)
            yield self._event("status", f"Generating filler: {filler_phrase}")
            
            # If Client specifically requested to Skip Filer (Hybrid TTS), we don't generate audio
            if skip_filler:
                # Still yield an event saying we skipped it, or just do nothing
                # The frontend will handle browser TTS upon receiving 'intent' event
                pass
            else:
                # Synthesize filler (fast, no heavy processing)
                filler_audio = self.tts.synthesize(filler_phrase)
                if filler_audio['success']:
                    yield self._event("audio", {
                        "data": filler_audio['audio_base64'],
                        "text": filler_phrase,
                        "is_filler": True
                    })
        
        # 4. RAG / Response Generation
        final_answer_text = ""
        
        if not needs_rag:
            # Handle small talk
            final_answer_text = "I'm doing well! I'm here to help you with your analytics and projects."
        else:
            yield self._event("status", "Fetching data...")
            
            # Query RAG (Pass conversation state)
            rag_response = self.rag_agent.query(
                user_text, 
                category=category, 
                conversation_state=conversation_state,
                is_voice=True
            )
            
            raw_answer = rag_response.get('answer', "I couldn't find that information.")
            
            # Check for Action Data / Conversation State updates
            if rag_response.get('is_action') or rag_response.get('conversation_state'):
                yield self._event("action_data", {
                    "is_action": rag_response.get('is_action', False),
                    "conversation_state": rag_response.get('conversation_state'),
                    "action_params": rag_response.get('action_params'),
                    "action_type": rag_response.get('action_type')
                })
            
            # 5. Conversational Rewrite (Skip if it's a specific action question like "What is the priority?")
            # For now, we rewrite everything unless explicitly told not to, but actions usually need precise phrasing
            # The RAG agent's "is_voice=True" handles some of this, but the Rewriter puts conversational polish.
            
            yield self._event("status", "Formulating response...")
            final_answer_text = self.rewriter.rewrite(raw_answer, query=user_text)
        
        # 6. Final TTS
        yield self._event("status", "Speaking...")
        
        final_audio = self.tts.synthesize(final_answer_text)
        
        if final_audio['success']:
            yield self._event("audio", {
                "data": final_audio['audio_base64'],
                "text": final_answer_text,
                "is_final": True
            })
        else:
            yield self._event("error", "Failed to generate speech")
            
        yield self._event("done", "Interaction complete")

    def _event(self, type_: str, payload: Any) -> str:
        """Helper to format SSE/JSON events"""
        return json.dumps({
            "type": type_, 
            "payload": payload,
            "timestamp": time.time()
        }) + "\n"
