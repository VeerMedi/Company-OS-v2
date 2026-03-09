"""
Streaming Text-to-Speech with chunked audio generation
Enables real-time audio playback while LLM is still generating text
"""

import asyncio
import edge_tts
import base64
import io
from typing import Generator, Dict, Any, Optional, List
import re
import re
import threading
import base64
import io
import scipy.io.wavfile as wavfile
from queue import Queue
# from voice.hf_models import get_hf_model_manager  # Removed during cleanup


class StreamingTTS:
    """
    Streaming Text-to-Speech processor
    
    Features:
    - Chunks text by sentence for faster first audio
    - Generates audio chunks as they arrive
    - Uses edge-tts for high-quality voices
    - Concurrent audio generation
    """
    
    DEFAULT_VOICE = "en-IN-NeerjaNeural"
    
    def __init__(self, voice: str = None):
        """
        Initialize streaming TTS
        
        Args:
            voice: Edge TTS voice to use
        """
        self.voice = voice or self.DEFAULT_VOICE
        self.pending_chunks: Queue = Queue()
        self.is_active = False
        self.use_hf = False  # Always use edge-tts (no HF support)
        
        print(f"🔊 StreamingTTS initialized with voice: {self.voice}")
    
    def chunk_text(self, text: str) -> List[str]:
        """
        Split text into speakable chunks (sentences/phrases)
        
        Args:
            text: Full text to chunk
            
        Returns:
            List of text chunks suitable for TTS
        """
        if not text:
            return []
        
        # Split by sentence-ending punctuation
        # Keep the punctuation with the sentence
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        
        chunks = []
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            # If sentence is too long (>100 chars), split by comma/semicolon
            if len(sentence) > 100:
                sub_parts = re.split(r'(?<=[,;:])\s+', sentence)
                for part in sub_parts:
                    part = part.strip()
                    if part:
                        chunks.append(part)
            else:
                chunks.append(sentence)
        
        return chunks
    
    async def _generate_audio_chunk(self, text: str) -> Optional[Dict[str, Any]]:
        """Generate audio for a single text chunk"""
        try:
            # Always use edge-tts
            communicate = edge_tts.Communicate(text, self.voice)
            audio_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            mime_type = "audio/mp3"
            
            if audio_data:
                audio_base64 = base64.b64encode(audio_data).decode('utf-8')
                return {
                    "success": True,
                    "audio_base64": audio_base64,
                    "text": text,
                    "mime_type": mime_type,
                    "size": len(audio_data)
                }
            
            return None
            
        except Exception as e:
            print(f"⚠️ TTS chunk error: {e}")
            return None
    
    def generate_streaming(self, text: str) -> Generator[Dict[str, Any], None, None]:
        """
        Generate audio chunks from text as a generator
        
        Args:
            text: Full text to convert to speech
            
        Yields:
            Dict with audio chunk data
        """
        chunks = self.chunk_text(text)
        
        if not chunks:
            return
        
        print(f"🔊 Generating {len(chunks)} TTS chunks...")
        
        for i, chunk_text in enumerate(chunks):
            is_first = (i == 0)
            is_last = (i == len(chunks) - 1)
            
            # Run async TTS in sync context
            loop = asyncio.new_event_loop()
            try:
                result = loop.run_until_complete(self._generate_audio_chunk(chunk_text))
            finally:
                loop.close()
            
            if result:
                result["chunk_index"] = i
                result["total_chunks"] = len(chunks)
                result["is_first"] = is_first
                result["is_last"] = is_last
                
                if is_first:
                    print(f"  ⚡ First chunk ready ({len(chunk_text)} chars)")
                
                yield result
    
    async def generate_streaming_async(self, text: str):
        """
        Async generator for streaming TTS
        
        Args:
            text: Full text to convert to speech
            
        Yields:
            Dict with audio chunk data
        """
        chunks = self.chunk_text(text)
        
        if not chunks:
            return
        
        print(f"🔊 Generating {len(chunks)} TTS chunks (async)...")
        
        for i, chunk_text in enumerate(chunks):
            is_first = (i == 0)
            is_last = (i == len(chunks) - 1)
            
            result = await self._generate_audio_chunk(chunk_text)
            
            if result:
                result["chunk_index"] = i
                result["total_chunks"] = len(chunks)
                result["is_first"] = is_first
                result["is_last"] = is_last
                
                if is_first:
                    print(f"  ⚡ First chunk ready ({len(chunk_text)} chars)")
                
                yield result
    
    def generate_full(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Generate complete audio (non-streaming fallback)
        
        Args:
            text: Text to convert to speech
            
        Returns:
            Dict with complete audio data
        """
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(self._generate_audio_chunk(text))
        finally:
            loop.close()


# Singleton instance
_streaming_tts = None

def get_streaming_tts() -> StreamingTTS:
    """Get or create singleton StreamingTTS instance"""
    global _streaming_tts
    if _streaming_tts is None:
        _streaming_tts = StreamingTTS()
    return _streaming_tts
