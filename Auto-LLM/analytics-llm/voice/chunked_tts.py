"""
Chunked Text-to-Speech for Streaming Audio Output

Provides sentence-level TTS streaming:
- Intelligent text chunking (acknowledgement → answer → follow-up)
- Async generator yielding audio chunks progressively
- Immediate audio delivery without waiting for full synthesis

Design: Uses Edge TTS (existing) but synthesizes in smaller chunks
for incremental delivery. This gives the perception of faster response
even if total synthesis time is similar.
"""

import asyncio
import re
import base64
import os
import tempfile
import uuid
from typing import Dict, Any, List, Generator, AsyncGenerator, Optional


class ChunkedTTS:
    """
    Chunked Text-to-Speech for streaming audio output.
    
    Splits text into natural speech chunks and synthesizes
    each independently for incremental delivery.
    """
    
    # Chunk types for different parts of response
    CHUNK_ACKNOWLEDGEMENT = "acknowledgement"
    CHUNK_ANSWER = "answer"
    CHUNK_FOLLOWUP = "follow_up"
    
    # Acknowledgement phrases to prepend
    ACKNOWLEDGEMENTS = [
        "Alright...",
        "Okay...",
        "Sure...",
        "Let me see...",
        "Here's what I found..."
    ]
    
    # Follow-up question patterns
    FOLLOWUP_PATTERNS = [
        r"(?:Do you |Would you |Should I |Want me to |Shall I |Can I ).+\?",
        r"(?:Anything else|Something else|Anything more).+\?",
        r"(?:Need|Want) (?:more|additional) (?:info|information|details).+\?"
    ]
    
    def __init__(self, voice: str = None):
        """Initialize with optional voice override."""
        self.voice = voice or "en-IN-NeerjaNeural"
        self._edge_tts = None
        self._temp_dir = os.path.join(tempfile.gettempdir(), 'voice_agent_chunks')
        os.makedirs(self._temp_dir, exist_ok=True)
    
    def _get_edge_tts(self):
        """Lazy import edge-tts."""
        if self._edge_tts is None:
            try:
                import edge_tts
                self._edge_tts = edge_tts
            except ImportError:
                raise ImportError(
                    "edge-tts not installed. Install with: pip install edge-tts"
                )
        return self._edge_tts
    
    def split_for_speech(self, text: str, include_ack: bool = False) -> List[Dict[str, str]]:
        """
        Split text into natural speech chunks.
        
        Args:
            text: Full response text
            include_ack: If True, prepend an acknowledgement chunk
            
        Returns:
            List of chunks with type and text
        """
        chunks = []
        
        # 1. Optional acknowledgement
        if include_ack:
            import random
            chunks.append({
                "type": self.CHUNK_ACKNOWLEDGEMENT,
                "text": random.choice(self.ACKNOWLEDGEMENTS)
            })
        
        # 2. Clean the text
        text = text.strip()
        if not text:
            return chunks
        
        # 3. Check for follow-up at end
        followup_text = None
        for pattern in self.FOLLOWUP_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                followup_text = match.group(0)
                text = text[:match.start()].strip()
                break
        
        # 4. Split main content into sentences
        # Use natural sentence boundaries
        sentences = self._split_into_sentences(text)
        
        # 5. Group sentences into reasonable chunks (2-3 sentences each)
        current_chunk = []
        current_length = 0
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            # Target ~50-80 characters per chunk for natural speech rhythm
            if current_length + len(sentence) > 80 and current_chunk:
                chunks.append({
                    "type": self.CHUNK_ANSWER,
                    "text": " ".join(current_chunk)
                })
                current_chunk = [sentence]
                current_length = len(sentence)
            else:
                current_chunk.append(sentence)
                current_length += len(sentence)
        
        # Add remaining sentences
        if current_chunk:
            chunks.append({
                "type": self.CHUNK_ANSWER,
                "text": " ".join(current_chunk)
            })
        
        # 6. Add follow-up if found
        if followup_text:
            chunks.append({
                "type": self.CHUNK_FOLLOWUP,
                "text": followup_text
            })
        
        return chunks
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        # Handle common abbreviations to avoid wrong splits
        text = re.sub(r'(Mr|Mrs|Ms|Dr|Prof|Jr|Sr)\.', r'\1<DOT>', text)
        
        # Split on sentence-ending punctuation followed by space and capital
        sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
        
        # Restore dots
        sentences = [s.replace('<DOT>', '.') for s in sentences]
        
        return sentences
    
    async def _synthesize_chunk_async(
        self,
        text: str,
        chunk_id: str
    ) -> Dict[str, Any]:
        """Async synthesis of a single chunk."""
        edge_tts = self._get_edge_tts()
        
        output_path = os.path.join(self._temp_dir, f"chunk_{chunk_id}.mp3")
        
        try:
            communicate = edge_tts.Communicate(text, self.voice)
            await communicate.save(output_path)
            
            # Read and encode
            with open(output_path, 'rb') as f:
                audio_data = f.read()
            
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Cleanup
            try:
                os.remove(output_path)
            except:
                pass
            
            return {
                "success": True,
                "audio_base64": audio_base64,
                "format": "mp3",
                "mime_type": "audio/mp3",
                "text_length": len(text)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def synthesize_chunk(self, text: str, chunk_id: str = None) -> Dict[str, Any]:
        """
        Synchronously synthesize a single chunk.
        
        Args:
            text: Text to synthesize
            chunk_id: Optional unique ID for the chunk
            
        Returns:
            Dictionary with audio data or error
        """
        chunk_id = chunk_id or uuid.uuid4().hex[:8]
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(
                self._synthesize_chunk_async(text, chunk_id)
            )
        finally:
            loop.close()
    
    def synthesize_streaming(
        self,
        text: str,
        include_ack: bool = False
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Synthesize text as streaming chunks.
        
        Yields audio chunks as they complete, allowing
        immediate playback while remaining chunks synthesize.
        
        Args:
            text: Full response text
            include_ack: Whether to include acknowledgement
            
        Yields:
            Dictionaries with:
            - type: "acknowledgement", "answer", or "follow_up"
            - text: The synthesized text
            - audio_base64: Base64 encoded audio
            - is_last: True for the final chunk
        """
        chunks = self.split_for_speech(text, include_ack=include_ack)
        
        if not chunks:
            return
        
        total = len(chunks)
        
        for i, chunk in enumerate(chunks):
            is_last = (i == total - 1)
            
            result = self.synthesize_chunk(
                chunk["text"],
                chunk_id=f"{uuid.uuid4().hex[:6]}_{i}"
            )
            
            if result.get("success"):
                yield {
                    "type": chunk["type"],
                    "text": chunk["text"],
                    "audio_base64": result["audio_base64"],
                    "format": result["format"],
                    "mime_type": result["mime_type"],
                    "is_last": is_last,
                    "chunk_index": i,
                    "total_chunks": total
                }
            else:
                yield {
                    "type": chunk["type"],
                    "text": chunk["text"],
                    "error": result.get("error"),
                    "is_last": is_last
                }


# Convenience singleton
_chunked_tts_instance = None

def get_chunked_tts(voice: str = None) -> ChunkedTTS:
    """Get chunked TTS instance."""
    global _chunked_tts_instance
    if _chunked_tts_instance is None or voice:
        _chunked_tts_instance = ChunkedTTS(voice=voice)
    return _chunked_tts_instance
