"""
MongoDB Aggregation Cache
Caches expensive MongoDB aggregation queries with TTL
"""
import time
from typing import Dict, Any, Optional


class MongoAggregationCache:
    """Cache for MongoDB aggregation results with 60s TTL"""
    
    def __init__(self, ttl: int = 60):
        """
        Initialize cache with TTL
        
        Args:
            ttl: Time to live in seconds (default: 60s for near-real-time)
        """
        self._cache = {}
        self._timestamps = {}
        self._ttl = ttl
        print(f"✓ MongoDB Aggregation Cache initialized (TTL: {ttl}s)")
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get cached value if not expired
        
        Args:
            key: Cache key
            
        Returns:
            Cached value if valid, None if expired or missing
        """
        if key not in self._cache:
            return None
        
        # Check if expired
        age = time.time() - self._timestamps[key]
        if age > self._ttl:
            # Expired - remove from cache
            del self._cache[key]
            del self._timestamps[key]
            return None
        
        print(f"   ⚡ Aggregation cache HIT: {key} (age: {age:.1f}s)")
        return self._cache[key]
    
    def set(self, key: str, value: Any):
        """
        Set cache value
        
        Args:
            key: Cache key
            value: Value to cache
        """
        self._cache[key] = value
        self._timestamps[key] = time.time()
    
    def clear(self):
        """Clear all cached values"""
        self._cache.clear()
        self._timestamps.clear()
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "size": len(self._cache),
            "ttl": self._ttl,
            "keys": list(self._cache.keys())
        }


# Singleton instance
_aggregation_cache = None

def get_aggregation_cache() -> MongoAggregationCache:
    """Get singleton aggregation cache instance"""
    global _aggregation_cache
    if _aggregation_cache is None:
        _aggregation_cache = MongoAggregationCache(ttl=60)  # 60s TTL
    return _aggregation_cache
