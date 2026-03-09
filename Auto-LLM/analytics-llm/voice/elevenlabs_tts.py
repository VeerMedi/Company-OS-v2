"""
ElevenLabs TTS with Edge TTS Fallback
High-quality, fast text-to-speech using ElevenLabs API
Falls back to Edge TTS if API fails
"""
import os
import base64
import tempfile
from typing import Dict, Any, Optional
from elevenlabs import VoiceSettings
from elevenlabs.client import ElevenLabs


class ElevenLabsTTS:
    """
    Text-to-Speech using ElevenLabs API with Edge TTS fallback
    
    Features:
    - High quality voices (9.5/10)
    - Fast synthesis (~200-300ms)
    - Multiple voice options
    - Automatic fallback to Edge TTS
    """
    
    # Available high-quality voices
    VOICES = {
        "female_indian": "pNInz6obpgDQGcFmaJgB",  # Adam (can be female-sounding)
        "male_professional": "21m00Tcm4TlvDq8ikWAM",  # Rachel (professional)
        "female_warm": "EXAVITQu4vr4xnSDxMaL",  # Bella (warm, friendly)
        "default": "pNInz6obpgDQGcFmaJgB"  # Default voice
    }
    
    def __init__(self, voice: str = "female_warm"):
        """
        Initialize ElevenLabs TTS
        
        Args:
            voice: Voice ID or preset name from VOICES dict
        """
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY not found in environment")
        
        self.client = ElevenLabs(api_key=self.api_key)
        
        # Resolve voice ID
        self.voice_id = self.VOICES.get(voice, voice)
        print(f"✓ ElevenLabs TTS initialized with voice: {voice}")
    
    def synthesize(
        self,
        text: str,
        output_file: str,
        voice: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Synthesize text to speech using ElevenLabs
        
        Args:
            text: Text to synthesize
            output_file: Path to save audio file (mp3)
            voice: Optional voice override
            
        Returns:
            Dict with success status and metadata
        """
        try:
            # Use provided voice or default
            voice_id = self.VOICES.get(voice, voice) if voice else self.voice_id
            
            print(f"🎤 ElevenLabs TTS: Synthesizing {len(text)} chars...")
            
            # Call ElevenLabs API
            audio_generator = self.client.text_to_speech.convert(
                voice_id=voice_id,
                optimize_streaming_latency="0",  # Max quality
                output_format="mp3_44100_128",  # High quality MP3
                text=text,
                model_id="eleven_turbo_v2_5",  # Turbo v2.5 (fastest, great quality)
                voice_settings=VoiceSettings(
                    stability=0.5,  # Balance between consistency and expressiveness
                    similarity_boost=0.75,  # High similarity to original voice
                    style=0.5,  # Moderate style exaggeration
                    use_speaker_boost=True  # Enhance clarity
                )
            )
            
            # Stream and save audio
            with open(output_file, "wb") as f:
                for chunk in audio_generator:
                    f.write(chunk)
            
            # Get file size
            file_size = os.path.getsize(output_file)
            
            # Encode to base64 for API response
            with open(output_file, "rb") as f:
                audio_base64 = base64.b64encode(f.read()).decode('utf-8')
            
            print(f"✓ ElevenLabs TTS complete: {file_size} bytes")
            
            return {
                "success": True,
                "audio_file": output_file,
                "audio_base64": audio_base64,
                "format": "mp3",
                "size": file_size,
                "engine": "elevenlabs",
                "voice": voice_id,
                "text_length": len(text)
            }
            
        except Exception as e:
            print(f"❌ ElevenLabs TTS failed: {e}")
            
            # Fallback to Edge TTS
            print("↩️  Falling back to Edge TTS...")
            return self._fallback_edge_tts(text, output_file)
    
    def _fallback_edge_tts(self, text: str, output_file: str) -> Dict[str, Any]:
        """Fallback to Edge TTS if ElevenLabs fails"""
        try:
            from voice.text_to_speech import TextToSpeech as EdgeTTS
            
            # Use Edge TTS with female voice (Neerja - Indian English female)
            edge_tts = EdgeTTS(voice="en-IN-NeerjaNeural")
            # Fix: synthesize takes only 2 arguments (text, output_path), format is auto-determined
            result = edge_tts.synthesize(text, output_file)
            
            if result.get("success"):
                result["engine"] = "edge_tts_fallback"
                print("✓ Edge TTS fallback succeeded")
                return result
            else:
                return {
                    "success": False,
                    "error": "Both ElevenLabs and Edge TTS failed",
                    "engine": "none"
                }
                
        except Exception as fallback_error:
            print(f"❌ Edge TTS fallback also failed: {fallback_error}")
            return {
                "success": False,
                "error": f"All TTS engines failed: {fallback_error}",
                "engine": "none"
            }


# Singleton instance
_elevenlabs_tts = None

def get_elevenlabs_tts(voice: str = "female_warm") -> ElevenLabsTTS:
    """Get singleton ElevenLabs TTS instance with female voice as default"""
    global _elevenlabs_tts
    if _elevenlabs_tts is None:
        _elevenlabs_tts = ElevenLabsTTS(voice=voice)
    return _elevenlabs_tts
