"""
TTS Cache for Voice Agent
Pre-generates and caches common phrases for instant audio responses.
"""
import os
import json
import base64
from typing import Dict, Optional, List


class TTSCache:
    """
    Cache for pre-generated TTS audio (filler phrases, inst greetings).
    
    Features:
    - Pre-generate common phrases at startup
    - Store in memory + disk for persistence
    - Instant retrieval (<50ms vs 300ms generation)
    """
    
    # Common phrases to pre-cache
    PHRASES = [
        # Filler phrases (during processing)
        "Let me check that for you...",
        "One moment please...",
        "Looking that up...",
        "Give me just a second...",
        "Let me find that information...",
        "Checking now...",
        "On it...",
        "Got it...",
        "Sure...",
        "Okay...",
        
        # Instant greetings
        "Hello! How can I help you today?",
        "Hi there! What can I do for you?",
        "Hey! What would you like to know?",
        "Good morning! What can I help with?",
        "Good afternoon! What do you need?",
        "Good evening! What can I do for you?",
        "I'm listening.",
        "Go ahead.",
        "Yes, I'm here.",
        
        # Thanks responses
        "You're welcome!",
        "Happy to help!",
        "Anytime!",
        "Glad I could assist!",
        "My pleasure!",
        
        # Goodbyes
        "Goodbye! Have a great day!",
        "See you later! Take care!",
        "Bye! Feel free to ask anytime.",
        "Take care! Come back anytime.",
        
        # Confirmations
        "Got it!",
        "Understood.",
        "Okay!",
        "Sure thing!",
        "Alright!",
        
        # Small talk
        "I'm doing great, thanks for asking!",
        "I'm here and ready to help!",
        "All good! What can I do for you?",
        
        # Short acknowledgments
        "Yes",
        "No",
        "Maybe",
    ]
    
    def __init__(self, cache_dir: Optional[str] = None):
        """
        Initialize TTS cache.
        
        Args:
            cache_dir: Directory to store cached audio files
        """
        self.cache_dir = cache_dir or os.path.join(
            os.path.dirname(__file__), '.tts_cache'
        )
        os.makedirs(self.cache_dir, exist_ok=True)
        
        self.cache: Dict[str, Dict] = {}
        self._load_cache()
    
    def _load_cache(self):
        """Load cached audio from disk."""
        cache_index = os.path.join(self.cache_dir, 'index.json')
        if os.path.exists(cache_index):
            try:
                with open(cache_index, 'r') as f:
                    self.cache = json.load(f)
                print(f"✓ Loaded {len(self.cache)} cached TTS phrases")
            except Exception as e:
                print(f"Warning: Could not load TTS cache: {e}")
                self.cache = {}
    
    def _save_cache(self):
        """Save cache index to disk."""
        cache_index = os.path.join(self.cache_dir, 'index.json')
        try:
            with open(cache_index, 'w') as f:
                json.dump(self.cache, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save TTS cache: {e}")
    
    def get(self, text: str) -> Optional[Dict]:
        """
        Get cached audio for text.
        
        Args:
            text: Text to get audio for
            
        Returns:
            Dict with 'audio_base64' and 'mime_type' if cached, None otherwise
        """
        # Normalize text (lowercase, strip)
        key = text.lower().strip()
        return self.cache.get(key)
    
    def set(self, text: str, audio_base64: str, mime_type: str = 'audio/mp3'):
        """
        Cache audio for text.
        
        Args:
            text: Text that was synthesized
            audio_base64: Base64-encoded audio data
            mime_type: Audio MIME type
        """
        key = text.lower().strip()
        self.cache[key] = {
            'audio_base64': audio_base64,
            'mime_type': mime_type,
            'text': text  # Keep original for display
        }
        self._save_cache()
    
    def get_or_generate(self, text: str, tts_service) -> Optional[Dict]:
        """
        Get cached audio or generate new.
        
        Args:
            text: Text to synthesize
            tts_service: TTS service instance to use for generation
            
        Returns:
            Dict with 'audio_base64' and 'mime_type'
        """
        # Check cache first
        cached = self.get(text)
        if cached:
            print(f"⚡ TTS cache hit: '{text[:30]}...'")
            return cached
        
        # Generate and cache
        print(f"🔊 TTS cache miss: '{text[:30]}...', generating...")
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as f:
            temp_path = f.name
        try:
            result = tts_service.synthesize(text, temp_path)
            
            if result.get('success'):
                self.set(
                    text,
                    result['audio_base64'],
                    result.get('mime_type', 'audio/mp3')
                )
                return {
                    'audio_base64': result['audio_base64'],
                    'mime_type': result.get('mime_type', 'audio/mp3')
                }
        finally:
            try:
                os.unlink(temp_path)
            except:
                pass
        
        return None
    
    def preload(self, tts_service) -> int:
        """
        Pre-generate all common phrases at startup.
        
        Args:
            tts_service: TTS service instance
            
        Returns:
            Number of phrases cached
        """
        print("Pre-loading TTS cache...")
        cached_count = 0
        
        for phrase in self.PHRASES:
            # Skip if already cached
            if self.get(phrase):
                print(f"  ✓ Already cached: '{phrase[:40]}...'")
                cached_count += 1
                continue
            
            # Generate
            try:
                import tempfile
                with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as f:
                    temp_path = f.name
                try:
                    result = tts_service.synthesize(phrase, temp_path)
                    if result.get('success'):
                        self.set(
                            phrase,
                            result['audio_base64'],
                            result.get('mime_type', 'audio/mp3')
                        )
                        print(f"  ✓ Cached: '{phrase[:40]}...'")
                        cached_count += 1
                    else:
                        print(f"  ✗ Failed: '{phrase[:40]}...'")
                finally:
                    try:
                        os.unlink(temp_path)
                    except:
                        pass
            except Exception as e:
                print(f"  ✗ Error caching '{phrase[:40]}...': {e}")
        
        print(f"✓ TTS cache ready: {cached_count}/{len(self.PHRASES)} phrases")
        return cached_count
    
    def clear(self):
        """Clear all cached audio."""
        self.cache = {}
        self._save_cache()
        print("✓ TTS cache cleared")
    
    def get_stats(self) -> Dict:
        """Get cache statistics."""
        total_size = sum(
            len(item['audio_base64']) 
            for item in self.cache.values()
        )
        
        return {
            "cached_phrases": len(self.cache),
            "total_phrases": len(self.PHRASES),
            "cache_hit_rate": len(self.cache) / len(self.PHRASES) if self.PHRASES else 0,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2)
        }


# Singleton instance
_tts_cache = None

def get_tts_cache() -> TTSCache:
    """Get singleton TTS cache instance."""
    global _tts_cache
    if _tts_cache is None:
        _tts_cache = TTSCache()
    return _tts_cache
