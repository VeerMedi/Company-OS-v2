"""
WebSocket handler for streaming voice interactions
Handles real-time audio streaming for STT and TTS
"""

from flask_socketio import emit, Namespace
from typing import Dict, Any, Optional
import base64
import numpy as np
import time

# Import streaming modules
from voice.streaming_stt import get_streaming_stt
from voice.streaming_tts import get_streaming_tts
from voice.instant_responses import get_instant_response_manager


class VoiceStreamNamespace(Namespace):
    """
    WebSocket namespace for voice streaming
    
    Handles:
    - Audio chunk streaming for real-time STT
    - Instant greeting detection
    - Streaming TTS responses
    """
    
    def __init__(self, namespace='/voice-stream'):
        super().__init__(namespace)
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
    
    def on_connect(self):
        """Handle client connection"""
        session_id = self._get_session_id()
        print(f"🔌 Voice stream connected: {session_id[:8]}...")
        
        self.active_sessions[session_id] = {
            "connected_at": time.time(),
            "streaming": False,
            "chunks_received": 0
        }
        
        emit('connected', {'status': 'ready', 'session_id': session_id})
    
    def on_disconnect(self):
        """Handle client disconnection"""
        session_id = self._get_session_id()
        
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
        
        # Cancel any active STT session
        stt = get_streaming_stt()
        if stt.is_active:
            stt.cancel()
        
        print(f"🔌 Voice stream disconnected: {session_id[:8]}...")
    
    def on_start_stream(self, data: Dict[str, Any]):
        """
        Start audio streaming session
        
        Args:
            data: {
                'sample_rate': int (default 16000),
                'category': str (optional)
            }
        """
        session_id = self._get_session_id()
        print(f"🎙️ Starting stream for session: {session_id[:8]}...")
        
        # Initialize streaming STT
        stt = get_streaming_stt()
        stt.start_session()
        
        # Update session state
        if session_id in self.active_sessions:
            self.active_sessions[session_id].update({
                "streaming": True,
                "start_time": time.time(),
                "sample_rate": data.get('sample_rate', 16000),
                "category": data.get('category'),
                "use_hf": data.get('use_hf', False)
            })
        
        # Set HF usage in TTS
        tts = get_streaming_tts()
        tts.use_hf = data.get('use_hf', False)
        
        emit('stream_started', {'status': 'listening'})
    
    def on_audio_chunk(self, data: Dict[str, Any]):
        """
        Process incoming audio chunk
        
        Args:
            data: {
                'audio': base64 encoded audio bytes,
                'sample_rate': int
            }
        """
        session_id = self._get_session_id()
        session = self.active_sessions.get(session_id, {})
        
        if not session.get('streaming'):
            return
        
        # Decode audio
        try:
            audio_b64 = data.get('audio', '')
            audio_bytes = base64.b64decode(audio_b64)
            sample_rate = data.get('sample_rate', 16000)
        except Exception as e:
            emit('error', {'message': f'Invalid audio data: {e}'})
            return
        
        # Update chunk count
        session['chunks_received'] = session.get('chunks_received', 0) + 1
        
        # Process with streaming STT
        stt = get_streaming_stt()
        result = stt.add_chunk(audio_bytes, sample_rate)
        
        # Emit partial transcription if available
        if result.get('text'):
            emit('partial_transcript', {
                'text': result['text'],
                'duration': result.get('duration', 0),
                'is_final': False
            })
            
            # Check for instant greeting
            instant_response_mgr = get_instant_response_manager()
            intent = instant_response_mgr.detect_intent(result['text'])
            if intent:
                print(f"⚡ Instant greeting detected: {intent}")
                
                # Get response
                response = instant_response_mgr.get_response(intent)
                
                # Cancel STT session
                stt.cancel()
                session['streaming'] = False
                
                # Generate TTS for response
                tts = get_streaming_tts()
                audio_result = tts.generate_full(response)
                
                if audio_result:
                    emit('instant_response', {
                        'text': response,
                        'audio': audio_result['audio_base64'],
                        'mime_type': audio_result['mime_type'],
                        'is_greeting': True
                    })
                else:
                    emit('instant_response', {
                        'text': response,
                        'audio': None,
                        'is_greeting': True
                    })
                
                return
    
    def on_end_stream(self, data: Dict[str, Any] = None):
        """
        End audio streaming and get final transcription
        
        Args:
            data: Optional final data
        """
        session_id = self._get_session_id()
        session = self.active_sessions.get(session_id, {})
        
        print(f"🎙️ Ending stream for session: {session_id[:8]}...")
        
        # Finalize STT
        stt = get_streaming_stt()
        result = stt.finalize()
        
        session['streaming'] = False
        
        # Send final transcription
        emit('final_transcript', {
            'text': result.get('text', ''),
            'duration': result.get('duration', 0),
            'is_final': True,
            'language': result.get('language')
        })
    
    def on_generate_tts(self, data: Dict[str, Any]):
        """
        Generate streaming TTS for text
        
        Args:
            data: {
                'text': str,
                'streaming': bool (default True)
            }
        """
        text = data.get('text', '')
        use_streaming = data.get('streaming', True)
        use_hf = data.get('use_hf', False)
        
        if not text:
            emit('error', {'message': 'No text provided'})
            return
        
        tts = get_streaming_tts()
        tts.use_hf = use_hf
        
        if use_streaming:
            # Send audio chunks as they're generated
            for chunk in tts.generate_streaming(text):
                if chunk:
                    emit('tts_chunk', {
                        'audio': chunk['audio_base64'],
                        'text': chunk['text'],
                        'mime_type': chunk['mime_type'],
                        'chunk_index': chunk['chunk_index'],
                        'total_chunks': chunk['total_chunks'],
                        'is_first': chunk['is_first'],
                        'is_last': chunk['is_last']
                    })
            
            emit('tts_complete', {'status': 'done'})
        else:
            # Generate full audio at once
            result = tts.generate_full(text)
            
            if result:
                emit('tts_full', {
                    'audio': result['audio_base64'],
                    'text': text,
                    'mime_type': result['mime_type']
                })
            else:
                emit('error', {'message': 'TTS generation failed'})
    
    def _get_session_id(self) -> str:
        """Get current session ID from Flask request"""
        from flask import request
        return request.sid


def register_socketio_handlers(socketio):
    """
    Register WebSocket handlers with SocketIO instance
    
    Args:
        socketio: Flask-SocketIO instance
    """
    # Register the voice streaming namespace
    socketio.on_namespace(VoiceStreamNamespace('/voice-stream'))
    print("✓ WebSocket handlers registered for /voice-stream")
