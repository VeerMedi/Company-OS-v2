"""
Text-to-Speech using Microsoft Edge TTS.
Free, high-quality neural voices - no API key required.
"""
import asyncio
import base64
import os
import tempfile
import uuid
from typing import Dict, Any, Optional, List


class TextToSpeech:
    """
    Text-to-Speech synthesis using Microsoft Edge TTS.
    Uses edge-tts library (free, no API key required).
    """
    
    # Default voice (neural, high quality)
    DEFAULT_VOICE = "en-IN-NeerjaNeural"
    
    # Popular voice options
    VOICES = {
        # English voices
        "en-US-AriaNeural": "Aria (US Female)",
        "en-US-GuyNeural": "Guy (US Male)",
        "en-US-JennyNeural": "Jenny (US Female)",
        "en-GB-SoniaNeural": "Sonia (UK Female)",
        "en-GB-RyanNeural": "Ryan (UK Male)",
        "en-AU-NatashaNeural": "Natasha (AU Female)",
        "en-IN-NeerjaNeural": "Neerja (Indian Female)",
        "en-IN-PrabhatNeural": "Prabhat (Indian Male)",
        # Hindi voices
        "hi-IN-SwaraNeural": "Swara (Hindi Female)",
        "hi-IN-MadhurNeural": "Madhur (Hindi Male)",
    }
    
    # Format options
    FORMATS = {
        "mp3": {"codec": "audio-24khz-48kbitrate-mono-mp3", "mime": "audio/mp3"},
        "opus": {"codec": "audio-24khz-16bit-mono-opus", "mime": "audio/opus"},
        "webm": {"codec": "webm-24khz-16bit-mono-opus", "mime": "audio/webm"},
    }
    
    def __init__(self, voice: str = None):
        """
        Initialize Text-to-Speech with specified voice.
        
        Args:
            voice: Voice name (e.g., 'en-US-AriaNeural')
        """
        self.voice = voice or self.DEFAULT_VOICE
        self._edge_tts = None
        print(f"TextToSpeech initialized with voice: {self.voice}")
    
    def set_voice(self, voice: str):
        """Change the TTS voice"""
        self.voice = voice
        print(f"Voice changed to: {self.voice}")
    
    def _get_edge_tts(self):
        """Lazy import edge-tts"""
        if self._edge_tts is None:
            try:
                import edge_tts
                self._edge_tts = edge_tts
            except ImportError:
                raise ImportError(
                    "edge-tts not installed. Install with: pip install edge-tts"
                )
        return self._edge_tts
    
    async def _synthesize_async(
        self, 
        text: str, 
        output_path: str,
        format: str = "mp3"
    ) -> Dict[str, Any]:
        """Async synthesis using edge-tts"""
        edge_tts = self._get_edge_tts()
        
        # Get codec for format
        format_info = self.FORMATS.get(format, self.FORMATS["mp3"])
        
        # Create communicator
        communicate = edge_tts.Communicate(text, self.voice)
        
        # Save to file
        await communicate.save(output_path)
        
        return {
            "output_path": output_path,
            "format": format,
            "mime_type": format_info["mime"]
        }
    
    def synthesize(
        self, 
        text: str, 
        format: str = "mp3"
    ) -> Dict[str, Any]:
        """
        Convert text to speech.
        
        Args:
            text: Text to synthesize
            format: Output format ('mp3', 'opus', 'webm')
            
        Returns:
            Dictionary with:
                - success: bool
                - audio_base64: base64-encoded audio
                - output_path: path to audio file
                - format: audio format
                - mime_type: MIME type
                - voice: voice used
                - error: error message if failed
        """
        output_path = None
        
        try:
            if not text or not text.strip():
                return {
                    "success": False,
                    "error": "No text provided for synthesis"
                }
            
            # Clean text for TTS (remove markdown, excessive punctuation)
            clean_text = self._clean_text_for_tts(text)
            
            # Create temp file for output
            temp_dir = os.path.join(tempfile.gettempdir(), 'voice_agent')
            os.makedirs(temp_dir, exist_ok=True)
            
            ext = format if format in self.FORMATS else "mp3"
            output_path = os.path.join(temp_dir, f"tts_{uuid.uuid4().hex[:8]}.{ext}")
            
            print(f"Synthesizing speech ({len(clean_text)} chars) to: {output_path}")
            
            # Run async synthesis
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result = loop.run_until_complete(
                    self._synthesize_async(clean_text, output_path, format)
                )
            finally:
                loop.close()
            
            # Read and encode as base64
            with open(output_path, 'rb') as f:
                audio_data = f.read()
            
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            print(f"✓ TTS complete: {len(audio_data)} bytes, voice: {self.voice}")
            
            return {
                "success": True,
                "audio_base64": audio_base64,
                "output_path": output_path,
                "format": result["format"],
                "mime_type": result["mime_type"],
                "voice": self.voice,
                "text_length": len(clean_text)
            }
            
        except ImportError as e:
            error_msg = str(e)
            print(f"❌ Import error: {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }
        except Exception as e:
            error_msg = f"TTS synthesis failed: {str(e)}"
            print(f"❌ {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "output_path": output_path
            }
    
    def _clean_text_for_tts(self, text: str) -> str:
        """
        Clean text for better TTS output.
        Removes markdown formatting and normalizes punctuation.
        """
        import re
        
        # Remove markdown bold/italic
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
        text = re.sub(r'\*(.+?)\*', r'\1', text)
        text = re.sub(r'__(.+?)__', r'\1', text)
        text = re.sub(r'_(.+?)_', r'\1', text)
        
        # Remove markdown headers
        text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
        
        # Remove markdown links [text](url) -> text
        text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
        
        # Remove bullet points
        text = re.sub(r'^[\-\*]\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'^\d+\.\s*', '', text, flags=re.MULTILINE)
        
        # Replace multiple newlines with single pause
        text = re.sub(r'\n{2,}', '. ', text)
        text = re.sub(r'\n', ' ', text)
        
        # Clean up multiple spaces
        text = re.sub(r'\s{2,}', ' ', text)
        
        # Remove emojis that might confuse TTS
        text = re.sub(r'[✓✗❌⚠️📊📈📉💡🎯🔥⭐️❗️✅]', '', text)
        
        return text.strip()
    
    def is_available(self) -> bool:
        """Check if edge-tts is available"""
        try:
            import edge_tts
            return True
        except ImportError:
            return False
    
    @staticmethod
    def get_available_voices() -> List[Dict[str, str]]:
        """Get list of available voices"""
        return [
            {"id": voice_id, "name": name}
            for voice_id, name in TextToSpeech.VOICES.items()
        ]
