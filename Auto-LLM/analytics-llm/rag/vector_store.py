"""
Vector Store Manager for RAG System
Manages ChromaDB vector database for storing and retrieving embedded business data
"""

import chromadb
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
from config import AnalyticsLLMConfig
from rag.embeddings_manager import EmbeddingsManager

class VectorStore:
    """Manages ChromaDB vector database operations"""
    
    def __init__(self):
        self.config = AnalyticsLLMConfig()
        self.embeddings_manager = EmbeddingsManager()
        
        # Initialize ChromaDB with persistent storage
        self.client = chromadb.PersistentClient(
            path=self.config.CHROMA_PERSIST_DIR
        )
        
        # Create or get collections for different business domains
        self.collections = {
            "projects": self._get_or_create_collection("projects"),
            "employees": self._get_or_create_collection("employees"),
            "revenue": self._get_or_create_collection("revenue"),
            "sales": self._get_or_create_collection("sales"),
            "general": self._get_or_create_collection("general")
        }
        
        print(f"✓ Vector store initialized with {len(self.collections)} collections")
    
    def _get_or_create_collection(self, name: str):
        """Get or create a collection"""
        try:
            return self.client.get_or_create_collection(
                name=name,
                metadata={"hnsw:space": "cosine"}  # Use cosine similarity
            )
        except Exception as e:
            print(f"Error creating collection {name}: {e}")
            raise
    
    def add_documents(
        self,
        collection_name: str,
        documents: List[str],
        metadatas: List[Dict[str, Any]],
        ids: List[str]
    ) -> bool:
        """
        Add documents to a collection
        
        Args:
            collection_name: Name of the collection
            documents: List of text documents
            metadatas: List of metadata dicts (one per document)
            ids: List of unique IDs (one per document)
            
        Returns:
            Success boolean
        """
        try:
            collection = self.collections.get(collection_name)
            if not collection:
                print(f"❌ Collection '{collection_name}' not found")
                return False
            
            # Generate embeddings for documents
            print(f"Generating embeddings for {len(documents)} documents...")
            embeddings = self.embeddings_manager.embed_batch(documents)
            
            # Add to collection
            collection.add(
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            
            print(f"✓ Added {len(documents)} documents to '{collection_name}' collection")
            return True
            
        except Exception as e:
            print(f"❌ Error adding documents: {e}")
            return False
    
    def update_document(
        self,
        collection_name: str,
        document_id: str,
        document: str,
        metadata: Dict[str, Any]
    ) -> bool:
        """
        Update a single document
        
        Args:
            collection_name: Name of the collection
            document_id: Unique ID of the document
            document: New document text
            metadata: New metadata
            
        Returns:
            Success boolean
        """
        try:
            collection = self.collections.get(collection_name)
            if not collection:
                return False
            
            # Generate embedding
            embedding = self.embeddings_manager.embed_text(document)
            
            # Update in collection
            collection.update(
                ids=[document_id],
                embeddings=[embedding],
                documents=[document],
                metadatas=[metadata]
            )
            
            print(f"✓ Updated document {document_id} in '{collection_name}'")
            return True
            
        except Exception as e:
            print(f"❌ Error updating document: {e}")
            return False
    
    def delete_documents(self, collection_name: str, ids: List[str]) -> bool:
        """
        Delete documents from a collection
        
        Args:
            collection_name: Name of the collection
            ids: List of document IDs to delete
            
        Returns:
            Success boolean
        """
        try:
            collection = self.collections.get(collection_name)
            if not collection:
                return False
            
            collection.delete(ids=ids)
            print(f"✓ Deleted {len(ids)} documents from '{collection_name}'")
            return True
            
        except Exception as e:
            print(f"❌ Error deleting documents: {e}")
            return False
    
    def search(
        self,
        collection_name: str,
        query: str,
        n_results: int = None,
        where: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Search for similar documents using semantic search
        
        Args:
            collection_name: Name of the collection to search
            query: Search query text
            n_results: Number of results to return (default: TOP_K_RESULTS from config)
            where: Metadata filter (e.g., {"category": "service-delivery"})
            
        Returns:
            Dictionary with ids, documents, metadatas, and distances
        """
        try:
            collection = self.collections.get(collection_name)
            if not collection:
                print(f"❌ Collection '{collection_name}' not found")
                return {"ids": [], "documents": [], "metadatas": [], "distances": []}
            
            # Generate query embedding
            query_embedding = self.embeddings_manager.embed_query(query)
            
            # Perform search
            n_results = n_results or self.config.TOP_K_RESULTS
            
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where
            )
            
            # Flatten results (query returns list of lists)
            return {
                "ids": results["ids"][0] if results["ids"] else [],
                "documents": results["documents"][0] if results["documents"] else [],
                "metadatas": results["metadatas"][0] if results["metadatas"] else [],
                "distances": results["distances"][0] if results["distances"] else []
            }
            
        except Exception as e:
            print(f"❌ Search error: {e}")
            return {"ids": [], "documents": [], "metadatas": [], "distances": []}
    
    def search_all_collections(
        self,
        query: str,
        n_results_per_collection: int = 3
    ) -> Dict[str, Dict[str, Any]]:
        """
        Search across all collections for unified results
        
        Args:
            query: Search query text
            n_results_per_collection: Number of results per collection
            
        Returns:
            Dictionary mapping collection names to search results
        """
        all_results = {}
        
        for collection_name in self.collections.keys():
            results = self.search(
                collection_name=collection_name,
                query=query,
                n_results=n_results_per_collection
            )
            
            if results["ids"]:  # Only include if results found
                all_results[collection_name] = results
        
        return all_results
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics for all collections"""
        stats = {}
        
        for name, collection in self.collections.items():
            try:
                count = collection.count()
                stats[name] = {"count": count}
            except Exception as e:
                stats[name] = {"count": 0, "error": str(e)}
        
        return stats
    
    def reset_collection(self, collection_name: str) -> bool:
        """
        Delete and recreate a collection
        
        Args:
            collection_name: Name of the collection to reset
            
        Returns:
            Success boolean
        """
        try:
            # Delete the collection
            self.client.delete_collection(name=collection_name)
            
            # Recreate it
            self.collections[collection_name] = self._get_or_create_collection(collection_name)
            
            print(f"✓ Reset collection '{collection_name}'")
            return True
            
        except Exception as e:
            print(f"❌ Error resetting collection: {e}")
            return False
    
    def reset_all(self) -> bool:
        """Reset the entire vector database"""
        try:
            self.client.reset()
            
            # Recreate collections
            for name in self.collections.keys():
                self.collections[name] = self._get_or_create_collection(name)
            
            print("✓ Reset all collections")
            return True
            
        except Exception as e:
            print(f"❌ Error resetting database: {e}")
            return False
