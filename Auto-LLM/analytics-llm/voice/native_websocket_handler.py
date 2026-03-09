"""
Native WebSocket Handler for Voice Streaming
Replaces Socket.IO with pure WebSocket implementation
"""

import json
import base64
import numpy as np
from typing import Dict, Any
from voice.streaming_stt import get_streaming_stt
from voice.streaming_tts import get_streaming_tts

class VoiceWebSocketHandler:
    """Handles WebSocket connections for voice streaming"""
    
    def __init__(self, ws):
        self.ws = ws
        self.stt = None
        self.tts = None
        self.is_streaming = False
        print("🔌 VoiceWebSocketHandler initialized")
    
    def send_message(self, msg_type: str, data: Any = None):
        """Send a JSON message to the client"""
        try:
            message = {"type": msg_type, "data": data}
            self.ws.send(json.dumps(message))
        except Exception as e:
            print(f"❌ Error sending message: {e}")
    
    def handle_message(self, message_str: str):
        """Handle incoming WebSocket message"""
        try:
            message = json.loads(message_str)
            msg_type = message.get("type")
            data = message.get("data", {})
            
            print(f"📥 Received: {msg_type}")
            
            if msg_type == "start_stream":
                self.handle_start_stream(data)
            elif msg_type == "audio_chunk":
                self.handle_audio_chunk(data)
            elif msg_type == "end_stream":
                self.handle_end_stream()
            elif msg_type == "generate_tts":
                self.handle_generate_tts(data)
            else:
                print(f"⚠️ Unknown message type: {msg_type}")
                
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON: {e}")
            self.send_message("error", {"message": "Invalid JSON message"})
        except Exception as e:
            print(f"❌ Error handling message: {e}")
            import traceback
            traceback.print_exc()
            self.send_message("error", {"message": str(e)})
    
    def handle_start_stream(self, data: Dict[str, Any]):
        """Initialize streaming session"""
        sample_rate = data.get("sample_rate", 16000)
        category = data.get("category")
        use_hf = data.get("use_hf", True)
        
        print(f"🎤 Starting stream (sample_rate={sample_rate}, use_hf={use_hf})")
        
        # Initialize STT
        self.stt = get_streaming_stt()
        self.stt.start_session()
        
        # Initialize TTS
        self.tts = get_streaming_tts()
        self.tts.use_hf = use_hf
        
        self.is_streaming = True
        self.send_message("stream_started", {"sample_rate": sample_rate})
    
    def handle_audio_chunk(self, data: str):
        """Process incoming audio chunk"""
        if not self.is_streaming or not self.stt:
            print("⚠️ Received audio chunk but stream not active")
            return
        
        try:
            # Decode base64 audio
            audio_bytes = base64.b64decode(data)
            
            # Validate audio chunk size (reject chunks that are too small)
            if len(audio_bytes) < 100:
                print(f"⚠️ Audio chunk too small: {len(audio_bytes)} bytes - ignoring")
                return
            
            print(f"📦 Processing audio chunk: {len(audio_bytes)} bytes")
            
            # Process with STT
            result = self.stt.add_chunk(audio_bytes)
            
            if result.get("text"):
                # Send partial transcript
                self.send_message("transcript_partial", {
                    "text": result["text"],
                    "is_final": result.get("is_final", False),
                    "duration": result.get("duration", 0)
                })
                
        except base64.binascii.Error as e:
            print(f"❌ Invalid base64 audio data: {e}")
            self.send_message("error", {"message": "Invalid audio data encoding. Please try again."})
        except Exception as e:
            print(f"❌ Error processing audio chunk: {e}")
            import traceback
            traceback.print_exc()
            self.send_message("error", {"message": f"Failed to process audio: {str(e)}"})
    
    def handle_end_stream(self):
        """Finalize streaming session"""
        print("🛑 Ending stream")
        
        if self.stt:
            result = self.stt.finalize()
            self.send_message("transcript_final", {
                "text": result.get("text", ""),
                "is_final": True,
                "duration": result.get("duration", 0)
            })
        
        self.is_streaming = False
        self.send_message("stream_ended")
    
    def handle_generate_tts(self, data: Dict[str, Any]):
        """Generate TTS audio"""
        text = data.get("text", "")
        streaming = data.get("streaming", True)
        
        print(f"🔊 Generating TTS: '{text[:50]}...' (streaming={streaming})")
        
        if not self.tts:
            self.tts = get_streaming_tts()
        
        try:
            if streaming:
                # Stream TTS chunks
                for chunk in self.tts.generate_streaming(text):
                    # Convert numpy array to bytes
                    audio_bytes = chunk.tobytes()
                    audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                    
                    self.send_message("tts_chunk", {
                        "data": audio_base64,
                        "sample_rate": self.tts.sample_rate,
                        "format": "pcm_s16le"
                    })
                
                self.send_message("tts_complete")
            else:
                # Generate full audio
                audio_data = self.tts.generate(text)
                if audio_data is not None:
                    audio_base64 = base64.b64encode(audio_data).decode('utf-8')
                    self.send_message("tts_chunk", {
                        "data": audio_base64,
                        "sample_rate": self.tts.sample_rate,
                        "format": "pcm_s16le"
                    })
                    self.send_message("tts_complete")
                    
        except Exception as e:
            print(f"❌ TTS generation error: {e}")
            import traceback
            traceback.print_exc()
            self.send_message("error", {"message": f"TTS error: {str(e)}"})


def handle_voice_websocket(ws):
    """Main WebSocket handler function"""
    handler = VoiceWebSocketHandler(ws)
    
    print("✅ Voice WebSocket connected")
    handler.send_message("connected", {"status": "ready"})
    
    try:
        while not ws.closed:
            message = ws.receive()
            if message is None:
                break
            handler.handle_message(message)
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("🔌 Voice WebSocket disconnected")
        if handler.is_streaming:
            handler.handle_end_stream()
