"""
MongoDB Atlas Vector Store for RAG System
Uses MongoDB Atlas Vector Search instead of ChromaDB for better integration
"""

from pymongo import MongoClient
import certifi
from typing import List, Dict, Any, Optional
from datetime import datetime
from config import AnalyticsLLMConfig
from rag.embeddings_manager import EmbeddingsManager

class MongoVectorStore:
    """Manages MongoDB Atlas Vector Search operations"""
    
    def __init__(self):
        self.config = AnalyticsLLMConfig()
        self.embeddings_manager = EmbeddingsManager()
        
        # Connect to MongoDB Atlas
        self.client = MongoClient(self.config.MONGODB_URI, tlsCAFile=certifi.where())
        self.db = self.client[self.config.DB_NAME]
        
        # Collections for different business domains (with vector embeddings)
        self.collections = {
            # Core
            "projects": self.db["rag_projects"],
            "employees": self.db["rag_employees"],
            "tasks": self.db["rag_tasks"],
            "leads": self.db["rag_leads"],
            "companies": self.db["rag_companies"],
            
            # HR & Operations
            "leaves": self.db["rag_leaves"],
            "attendances": self.db["rag_attendances"],
            "payrolls": self.db["rag_payrolls"],
            "checkpoints": self.db["rag_checkpoints"],
            
            # Finance & Sales
            "revenue": self.db["rag_revenues"], # Legacy name kept for compatibility
            "revenuetargets": self.db["rag_revenuetargets"],
            "sales": self.db["rag_sales"],
            "salestargets": self.db["rag_salestargets"],
            
            # General
            "general": self.db["rag_general"]
        }
        
        # Ensure indexes exist
        self._ensure_indexes()
        
        print(f"✓ MongoDB Vector Store initialized with {len(self.collections)} collections")
    
    def _ensure_indexes(self):
        """Create necessary indexes for vector search"""
        for name, collection in self.collections.items():
            # Create text index for fallback search
            try:
                collection.create_index([("document", "text")])
            except:
                pass  # Index might already exist
            
            # Create index on metadata fields
            collection.create_index([("metadata.type", 1)])
            collection.create_index([("metadata.category", 1)])
            collection.create_index([("created_at", -1)])
    
    def add_documents(
        self,
        collection_name: str,
        documents: List[str],
        metadatas: List[Dict[str, Any]],
        ids: List[str]
    ) -> bool:
        """
        Add documents with embeddings to MongoDB collection
        
        Args:
            collection_name: Name of the collection
            documents: List of text documents
            metadatas: List of metadata dicts
            ids: List of unique IDs
            
        Returns:
            Success boolean
        """
        try:
            collection = self.collections.get(collection_name)
            if collection is None:
                print(f"❌ Collection '{collection_name}' not found")
                return False
            
            # Generate embeddings
            print(f"Generating embeddings for {len(documents)} documents...")
            embeddings = self.embeddings_manager.embed_batch(documents)
            
            # Prepare documents for insertion
            docs_to_insert = []
            for i, (doc_id, document, metadata, embedding) in enumerate(zip(ids, documents, metadatas, embeddings)):
                docs_to_insert.append({
                    "_id": doc_id,
                    "document": document,
                    "embedding": embedding,
                    "metadata": metadata,
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                })
            
            # Insert or update documents
            for doc in docs_to_insert:
                collection.replace_one(
                    {"_id": doc["_id"]},
                    doc,
                    upsert=True
                )
            
            print(f"✓ Added {len(documents)} documents to '{collection_name}' collection")
            return True
            
        except Exception as e:
            print(f"❌ Error adding documents: {e}")
            import traceback
            traceback.print_exc()
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
            if collection is None:
                return False
            
            # Generate embedding
            embedding = self.embeddings_manager.embed_text(document)
            
            # Update in collection
            collection.update_one(
                {"_id": document_id},
                {
                    "$set": {
                        "document": document,
                        "embedding": embedding,
                        "metadata": metadata,
                        "updated_at": datetime.now()
                    }
                },
                upsert=True
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
            if collection is None:
                return False
            
            collection.delete_many({"_id": {"$in": ids}})
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
        Search for similar documents using cosine similarity
        
        Args:
            collection_name: Name of the collection to search
            query: Search query text
            n_results: Number of results to return
            where: Metadata filter
            
        Returns:
            Dictionary with ids, documents, metadatas, and distances
        """
        try:
            collection = self.collections.get(collection_name)
            if collection is None:
                print(f"❌ Collection '{collection_name}' not found")
                return {"ids": [], "documents": [], "metadatas": [], "distances": []}
            
            # Generate query embedding
            query_embedding = self.embeddings_manager.embed_query(query)
            
            n_results = n_results or self.config.TOP_K_RESULTS
            
            # Build aggregation pipeline for vector search
            pipeline = []
            
            # Add metadata filter if provided
            if where:
                match_conditions = {}
                for key, value in where.items():
                    match_conditions[f"metadata.{key}"] = value
                pipeline.append({"$match": match_conditions})
            
            # Get all documents and calculate cosine similarity manually
            # (MongoDB Atlas Vector Search requires Atlas Search index which needs M10+ cluster)
            # For now, we'll use a manual similarity calculation
            
            cursor = collection.find({} if not where else {f"metadata.{k}": v for k, v in where.items()})
            
            results_with_scores = []
            for doc in cursor:
                if "embedding" in doc:
                    # Calculate cosine similarity
                    similarity = self._cosine_similarity(query_embedding, doc["embedding"])
                    distance = 1 - similarity  # Convert similarity to distance
                    
                    results_with_scores.append({
                        "id": str(doc["_id"]),
                        "document": doc.get("document", ""),
                        "metadata": doc.get("metadata", {}),
                        "distance": distance
                    })
            
            # Sort by distance (lower is better)
            results_with_scores.sort(key=lambda x: x["distance"])
            
            # Take top n_results
            top_results = results_with_scores[:n_results]
            
            # Format results
            return {
                "ids": [r["id"] for r in top_results],
                "documents": [r["document"] for r in top_results],
                "metadatas": [r["metadata"] for r in top_results],
                "distances": [r["distance"] for r in top_results]
            }
            
        except Exception as e:
            print(f"❌ Search error: {e}")
            import traceback
            traceback.print_exc()
            return {"ids": [], "documents": [], "metadatas": [], "distances": []}
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        import math
        
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = math.sqrt(sum(a * a for a in vec1))
        magnitude2 = math.sqrt(sum(b * b for b in vec2))
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)
    
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
                count = collection.count_documents({})
                stats[name] = {"count": count}
            except Exception as e:
                stats[name] = {"count": 0, "error": str(e)}
        
        return stats
    
    def reset_collection(self, collection_name: str) -> bool:
        """
        Delete all documents in a collection
        
        Args:
            collection_name: Name of the collection to reset
            
        Returns:
            Success boolean
        """
        try:
            collection = self.collections.get(collection_name)
            if collection is None:
                return False
            
            collection.delete_many({})
            print(f"✓ Reset collection '{collection_name}'")
            return True
            
        except Exception as e:
            print(f"❌ Error resetting collection: {e}")
            return False
    
    def reset_all(self) -> bool:
        """Reset all vector collections"""
        try:
            for name in self.collections.keys():
                self.reset_collection(name)
            
            print("✓ Reset all collections")
            return True
            
        except Exception as e:
            print(f"❌ Error resetting database: {e}")
            return False
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            print("✓ MongoDB connection closed")
