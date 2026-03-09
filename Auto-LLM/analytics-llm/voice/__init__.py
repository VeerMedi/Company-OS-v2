"""
Voice Agent Module
Provides Speech-to-Text (STT) and Text-to-Speech (TTS) capabilities.

STT: Uses OpenAI Whisper (runs locally, no API key required)
     Enhanced with Hugging Face Distil-Whisper for streaming
TTS: Uses Microsoft Edge TTS (free, high-quality neural voices)
     Enhanced with chunked streaming for progressive playback
"""

from .speech_to_text import SpeechToText
from .text_to_speech import TextToSpeech
from .audio_utils import AudioUtils
from .pipeline import VoicePipeline

# Streaming components (lazy imports for optional dependencies)
try:
    from .streaming_stt import StreamingSTT, get_streaming_stt
    from .streaming_tts import StreamingTTS, get_streaming_tts
    from .chunked_tts import ChunkedTTS, get_chunked_tts
    from .parallel_pipeline import ParallelVoicePipeline, get_parallel_pipeline
    from .hf_models import HFModelManager, get_hf_manager, initialize_hf_models
    from .latency_logger import LatencyLogger, get_latency_stats
    from .instant_responses import InstantResponseManager, get_instant_response_manager
    from .tts_cache import TTSCache, get_tts_cache
    from .websocket_handler import VoiceStreamNamespace, register_socketio_handlers
    
    __all__ = [
        'SpeechToText', 'TextToSpeech', 'AudioUtils', 'VoicePipeline',
        'StreamingSTT', 'get_streaming_stt',
        'StreamingTTS', 'get_streaming_tts',
        'ChunkedTTS', 'get_chunked_tts',
        'ParallelVoicePipeline', 'get_parallel_pipeline',
        'HFModelManager', 'get_hf_manager', 'initialize_hf_models',
        'LatencyLogger', 'get_latency_stats',
        'InstantResponseManager', 'get_instant_response_manager',
        'TTSCache', 'get_tts_cache',
        'VoiceStreamNamespace', 'register_socketio_handlers'
    ]
except ImportError:
    # Streaming components not available
    __all__ = ['SpeechToText', 'TextToSpeech', 'AudioUtils', 'VoicePipeline']
