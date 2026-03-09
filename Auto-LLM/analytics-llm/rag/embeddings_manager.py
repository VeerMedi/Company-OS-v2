"""
Embeddings Manager for RAG System
Handles text embedding generation using sentence-transformers
"""

from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
import hashlib

class EmbeddingsManager:
    """Manages text embedding generation with caching"""
    
    def __init__(self):
        self.cache: Dict[str, List[float]] = {}
        
        # Initialize sentence-transformers model
        print("Initializing embeddings model...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✓ Initialized embeddings: all-MiniLM-L6-v2")
    
    def _get_cache_key(self, text: str) -> str:
        """Generate cache key from text"""
        return hashlib.md5(text.encode()).hexdigest()
    
    def embed_text(self, text: str) -> List[float]:
        """
        Embed a single text string
        
        Args:
            text: Text to embed
            
        Returns:
            List of embedding values (floats)
        """
        # Check cache
        cache_key = self._get_cache_key(text)
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        # Generate embedding
        embedding = self.model.encode(text, convert_to_numpy=True)
        embedding_list = embedding.tolist()
        
        # Cache the result
        self.cache[cache_key] = embedding_list
        return embedding_list
    
    def embed_batch(self, texts: List[str], batch_size: int = 100) -> List[List[float]]:
        """
        Embed multiple texts efficiently in batches
        
        Args:
            texts: List of texts to embed
            batch_size: Number of texts to process at once
            
        Returns:
            List of embeddings (one per input text)
        """
        embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            print(f"Embedding batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}")
            
            batch_embeddings = [self.embed_text(text) for text in batch]
            embeddings.extend(batch_embeddings)
        
        return embeddings
    
    def embed_query(self, query: str) -> List[float]:
        """
        Embed a query for retrieval
        
        Args:
            query: Search query text
            
        Returns:
            Query embedding
        """
        return self.embed_text(query)
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "cache_size": len(self.cache),
            "model": "sentence-transformers/all-MiniLM-L6-v2"
        }
    
    def clear_cache(self):
        """Clear the embedding cache"""
        self.cache.clear()
        print("✓ Embedding cache cleared")
