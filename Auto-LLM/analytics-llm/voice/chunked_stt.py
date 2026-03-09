"""
Chunked Speech-to-Text Processor
Processes audio chunks with overlap for streaming while maintaining accuracy
"""
import io
import time
import numpy as np
from typing import Dict, Any, Optional, List
from pydub import AudioSegment
from voice.speech_to_text import SpeechToText


class ChunkedSTTProcessor:
    """
    Processes audio chunks for streaming STT with overlap
    
    Features:
    - Chunk-based processing for real-time feedback
    - Overlapping buffers for context preservation
    - Final full-context pass for accuracy
    """
    
    def __init__(self, overlap_ms: int = 500):
        """
        Initialize chunked STT processor
        
        Args:
            overlap_ms: Overlap between chunks in milliseconds (default: 500ms)
        """
        self.stt = SpeechToText()
        self.overlap_ms = overlap_ms
        self.audio_buffer = []
        print(f"✓ Chunked STT Processor initialized (overlap: {overlap_ms}ms)")
    
    def process_chunk(
        self, 
        audio_chunk: bytes,
        format: str = "webm",
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Process a single audio chunk (for partial results)
        
        Args:
            audio_chunk: Audio data bytes
            format: Audio format
            language: Language code
            
        Returns:
            Dict with partial transcription and confidence
        """
        try:
            # Store in buffer for final pass
            self.audio_buffer.append(audio_chunk)
            
            # Create temporary file for this chunk
            import tempfile
            chunk_file = tempfile.mktemp(suffix=f".{format}")
            
            with open(chunk_file, "wb") as f:
                f.write(audio_chunk)
            
            # Transcribe chunk
            result = self.stt.transcribe(chunk_file, language=language)
            
            # Cleanup
            import os
            os.remove(chunk_file)
            
            return {
                "success": True,
                "text": result.get("text", ""),
                "language": result.get("language"),
                "confidence": result.get("confidence", 0.7),
                "is_partial": True
            }
            
        except Exception as e:
            print(f"❌ Chunk processing error: {e}")
            return {
                "success": False,
                "text": "",
                "error": str(e),
                "is_partial": True
            }
    
    def process_with_overlap(
        self,
        current_chunk: bytes,
        previous_chunk: Optional[bytes] = None,
        format: str = "webm",
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Process chunk with overlap from previous chunk
        
        Args:
            current_chunk: Current audio chunk
            previous_chunk: Previous chunk for overlap
            format: Audio format
            language: Language code
            
        Returns:
            Dict with partial transcription
        """
        try:
            # Combine with overlap if previous chunk exists
            if previous_chunk:
                # Load audio segments
                current_audio = AudioSegment.from_file(
                    io.BytesIO(current_chunk), 
                    format=format
                )
                previous_audio = AudioSegment.from_file(
                    io.BytesIO(previous_chunk),
                    format=format
                )
                
                # Take last N ms from previous
                overlap = previous_audio[-self.overlap_ms:]
                
                # Combine: overlap + current
                combined = overlap + current_audio
                
                # Export to bytes
                buffer = io.BytesIO()
                combined.export(buffer, format=format)
                audio_data = buffer.getvalue()
            else:
                audio_data = current_chunk
            
            # Process combined chunk
            return self.process_chunk(audio_data, format, language)
            
        except Exception as e:
            print(f"❌ Overlap processing error: {e}")
            # Fallback to just current chunk
            return self.process_chunk(current_chunk, format, language)
    
    def finalize(
        self,
        format: str = "webm",
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Final pass with complete audio for maximum accuracy
        
        Args:
            format: Audio format
            language: Language code
            
        Returns:
            Dict with final accurate transcription
        """
        try:
            if not self.audio_buffer:
                return {
                    "success": False,
                    "error": "No audio data buffered",
                    "is_partial": False
                }
            
            print(f"🎯 Final accuracy pass on {len(self.audio_buffer)} chunks...")
            
            # Combine all chunks
            combined_audio = AudioSegment.empty()
            for chunk in self.audio_buffer:
                try:
                    audio_seg = AudioSegment.from_file(
                        io.BytesIO(chunk),
                        format=format
                    )
                    combined_audio += audio_seg
                except Exception as e:
                    print(f"⚠️ Skipping corrupted chunk: {e}")
            
            # Export to temp file
            import tempfile
            final_file = tempfile.mktemp(suffix=f".{format}")
            combined_audio.export(final_file, format=format)
            
            # Full transcription with complete context
            start_time = time.time()
            result = self.stt.transcribe(final_file, language=language)
            elapsed = time.time() - start_time
            
            # Cleanup
            import os
            os.remove(final_file)
            
            print(f"✓ Final transcription complete in {elapsed:.2f}s")
            
            return {
                "success": True,
                "text": result.get("text", ""),
                "language": result.get("language"),
                "confidence": result.get("confidence", 1.0),
                "is_partial": False,
                "processing_time": elapsed
            }
            
        except Exception as e:
            print(f"❌ Final pass error: {e}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e),
                "is_partial": False
            }
        finally:
            # Clear buffer
            self.audio_buffer.clear()
    
    def reset(self):
        """Reset the processor state"""
        self.audio_buffer.clear()


# Singleton instance
_chunked_stt = None

def get_chunked_stt() -> ChunkedSTTProcessor:
    """Get singleton chunked STT processor"""
    global _chunked_stt
    if _chunked_stt is None:
        _chunked_stt = ChunkedSTTProcessor(overlap_ms=500)
    return _chunked_stt
