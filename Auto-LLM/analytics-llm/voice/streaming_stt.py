"""
Streaming Speech-to-Text using Hugging Face Transformers (Distil-Whisper)
Enables real-time transcription on Apple Silicon (MPS)
"""

import numpy as np
import threading
import time
from typing import Optional, Dict, Any

class StreamingSTT:
    """
    Streaming STT processor - uses fallback implementation
    Falls back to using faster-whisper via SpeechToText
    """
    
    def __init__(self, model_id: str = "distil-whisper/distil-small-v3"):
        print(f"🎤 Initializing StreamingSTT with fallback implementation")
        
        # Use faster-whisper instead of HF models
        from voice.speech_to_text import SpeechToText
        self.stt = SpeechToText()
        # Force CPU mode to match main STT
        self.device = "cpu"
        
        self.sample_rate = 16000
        self.audio_buffer = []
        self.buffer_lock = threading.Lock()
        self.total_audio_duration = 0.0
        self.last_transcript = ""
        self.is_active = False
        
        # Throttling
        self.last_transcription_time = 0.0
        self.transcription_interval = 0.5  # Transcribe at most every 500ms
        
        print(f"✓ StreamingSTT ready (Backend: faster-whisper on {self.device})")
    
    def start_session(self):
        """Start a new streaming session"""
        with self.buffer_lock:
            self.audio_buffer = []
            self.total_audio_duration = 0.0
            self.last_transcript = ""
            self.last_transcription_time = 0.0
            self.is_active = True
        print("🎙️ Streaming session started")
    
    def add_chunk(self, audio_bytes: bytes, sample_rate: int = 16000) -> Dict[str, Any]:
        """Add audio chunk and optionally transcribe"""
        if not self.is_active:
            return {"partial": True, "text": "", "is_final": False}
        
        # Convert bytes to floats
        audio_np = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        
        # Resample if needed
        if sample_rate != self.sample_rate:
            ratio = self.sample_rate / sample_rate
            new_length = int(len(audio_np) * ratio)
            audio_np = np.interp(
                np.linspace(0, len(audio_np) - 1, new_length),
                np.arange(len(audio_np)),
                audio_np
            )
        
        with self.buffer_lock:
            self.audio_buffer.append(audio_np)
            chunk_duration = len(audio_np) / self.sample_rate
            self.total_audio_duration += chunk_duration
        
        # Throttle transcription
        current_time = time.time()
        time_since_last = current_time - self.last_transcription_time
        
        if self.total_audio_duration >= 0.5 and time_since_last >= self.transcription_interval:
            self.last_transcription_time = current_time
            return self._transcribe_buffer()
        
        return {
            "partial": True, 
            "text": self.last_transcript, 
            "is_final": False, 
            "duration": self.total_audio_duration
        }
    
    def _transcribe_buffer(self) -> Dict[str, Any]:
        """Run inference on current buffer"""
        with self.buffer_lock:
            if not self.audio_buffer:
                return {"partial": True, "text": "", "is_final": False}
            audio_combined = np.concatenate(self.audio_buffer)
        
        try:
            # Use faster-whisper via temp file
            import tempfile
            import os
            import scipy.io.wavfile as wavfile
            
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                wavfile.write(f.name, self.sample_rate, (audio_combined * 32768).astype(np.int16))
                temp_path = f.name
            
            result = self.stt.transcribe(temp_path, language='en')
            os.unlink(temp_path)
            
            text = result.get("text", "").strip()
            
            # Simple heuristic: if text is same as last time, maybe don't update
            self.last_transcript = text
            
            return {
                "partial": True,
                "text": text,
                "is_final": False,
                "duration": self.total_audio_duration
            }
            
        except Exception as e:
            print(f"⚠️ Transcription error: {e}")
            return {"partial": True, "text": self.last_transcript, "is_final": False}
    
    def finalize(self) -> Dict[str, Any]:
        """Final transcription check"""
        if not self.is_active:
            return {"partial": False, "text": "", "is_final": True}
        
        # Do one last transcription
        result = self._transcribe_buffer()
        self.is_active = False
        
        print(f"✓ Final transcription: '{result['text'][:50]}...'")
        
        return {
            "partial": False,
            "text": result['text'],
            "is_final": True,
            "duration": self.total_audio_duration
        }

    def cancel(self):
        with self.buffer_lock:
            self.audio_buffer = []
            self.is_active = False
        print("🛑 Streaming session cancelled")

# Singleton
_streaming_stt = None

def get_streaming_stt() -> StreamingSTT:
    global _streaming_stt
    if _streaming_stt is None:
        _streaming_stt = StreamingSTT()
    return _streaming_stt
