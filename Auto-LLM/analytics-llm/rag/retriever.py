"""
Retriever for RAG System
Intelligent retrieval of relevant context based on cofounder queries
"""

from typing import Dict, List, Any, Optional
import re
from rag.mongo_vector_store import MongoVectorStore  # Changed from VectorStore
from config import AnalyticsLLMConfig

class Retriever:
    """Handles intelligent context retrieval for RAG"""
    
    def __init__(self):
        self.config = AnalyticsLLMConfig()
        self.vector_store = MongoVectorStore()
        
    def identify_intent(self, query: str) -> List[str]:
        """
        Identify which domains the query is about with support for all 12 models
        """
        if not query:
            return ["general"]
            
        domains = set()
        query_lower = query.lower()
        
        # Comprehensive Keyword mapping for ALL collections (14+ models)
        keywords = {
            "projects": ["project", "status", "progress", "deadline", "timeline", "milestone", "scrum", "delivery", "sprint"],
            "employees": ["employee", "team", "staff", "performance", "manager", "developer", "hr", "who", "worker", "member"],
            "tasks": ["task", "todo", "assignment", "work", "ticket", "issue", "bug", "feature", "backlog"],
            "leads": ["lead", "prospect", "customer", "client", "deal", "opportunity", "pipeline", "funnel", "conversion"],
            "companies": ["company", "business", "organization", "firm", "enterprise", "corporation"],
            "leaves": ["leave", "sick", "vacation", "holiday", "absent", "off", "time off", "pto", "leave request"],
            "attendances": ["attendance", "present", "late", "punch", "check-in", "check-out", "working hours", "shift"],
            "revenue": ["revenue", "income", "money", "profit", "earnings", "financial", "mrr", "arr"],
            "revenuetargets": ["revenue target", "goal", "forecast", "projection"],
            "sales": ["sale", "closed", "won", "booking", "contract", "invoice", "deal closed"],
            "salestargets": ["sales target", "rep target", "sales quota", "sales goal"],
            "payrolls": ["payroll", "salary", "wage", "compensation", "payslip", "pay", "payment"],
            "checkpoints": ["checkpoint", "review point", "gate", "milestone review"],
            # New collections
            "users": ["user", "account", "profile", "admin", "cofounder"],
            "vendors": ["vendor", "supplier", "partner", "third-party"],
            "inquiries": ["inquiry", "inquiries", "question", "request", "query", "support ticket"],
            "inventory": ["inventory", "stock", "item", "product", "sku", "warehouse"]
        }
        
        # Check for keywords
        for domain, domain_keywords in keywords.items():
            if any(k in query_lower for k in domain_keywords):
                domains.add(domain)
                
        # Advanced heuristics for specific questions
        if "how much" in query_lower or "how many" in query_lower:
            if "revenue" not in domains and "sales" not in domains:
                domains.add("revenue")
                domains.add("sales")
            if "lead" in query_lower:
                domains.add("leads")
            if "employee" in query_lower or "people" in query_lower:
                domains.add("employees")
            
        if "who" in query_lower:
            if "employees" not in domains:
                domains.add("employees")
            domains.add("tasks")  # Who is working on what
            
        if ("what" in query_lower or "which" in query_lower) and "working on" in query_lower:
            domains.add("tasks")
            domains.add("projects")
        
        # Financial queries
        if any(term in query_lower for term in ["target", "goal", "quota"]):
            if "sales" in query_lower:
                domains.add("salestargets")
            if "revenue" in query_lower:
                domains.add("revenuetargets")
        
        # Count queries - be comprehensive
        if "count" in query_lower or "number of" in query_lower or "total" in query_lower:
            # Add relevant domains for counting
            if not domains:
                domains.update(["projects", "employees", "tasks", "leads", "sales"])
            
        if not domains:
            # Smart default based on common business queries
            return ["projects", "employees", "tasks", "leads"]  # Core business objects
            
        return list(domains)
    
    def extract_filters(self, query: str) -> Dict[str, Any]:
        """
        Extract metadata filters from query
        
        Args:
            query: User query
            
        Returns:
            Dictionary of filters
        """
        filters = {}
        query_lower = query.lower()
        
        # Status filters
        if "at risk" in query_lower or "behind" in query_lower or "delayed" in query_lower:
            filters["status_intent"] = "at_risk"
        elif "completed" in query_lower or "done" in query_lower:
            filters["status"] = "completed"
        elif "in progress" in query_lower or "ongoing" in query_lower:
            filters["status"] = "in-progress"
        
        # Performance filters
        if "low performance" in query_lower or "struggling" in query_lower or "needs attention" in query_lower:
            filters["performance_intent"] = "low"
        elif "top performer" in query_lower or "best" in query_lower or "excellent" in query_lower:
            filters["performance_intent"] = "high"
        
        # Time filters
        if "this week" in query_lower:
            filters["time_range"] = "week"
        elif "this month" in query_lower:
            filters["time_range"] = "month"
        elif "this quarter" in query_lower or "q4" in query_lower or "q3" in query_lower:
            filters["time_range"] = "quarter"
        
        return filters
    
    def retrieve(
        self,
        query: str,
        domains: Optional[List[str]] = None,
        n_results: int = None,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieve relevant context for a query
        
        Args:
            query: User query
            domains: Specific domains to search (auto-detected if None)
            n_results: Number of results per domain
            category: Optional category filter (e.g., 'metals')
            
        Returns:
            Dictionary with results per domain and assembled context
        """
        # Auto-detect domains if not specified
        if domains is None:
            domains = self.identify_intent(query)
        
        # Extract any filters
        filters = self.extract_filters(query)
        if category:
            filters["category"] = category
        
        print(f"\n🔍 Retrieving context for query: '{query}'")
        print(f"   Domains: {domains}")
        if filters:
            print(f"   Filters: {filters}")
        
        n_results = n_results or self.config.TOP_K_RESULTS
        
        # Retrieve from each relevant domain
        results = {}
        total_retrieved = 0
        
        for domain in domains:
            # Map domain to collection name (comprehensive mapping)
            collection_map = {
                "projects": "projects",
                "employees": "employees", 
                "tasks": "tasks",
                "leads": "leads",
                "companies": "companies",
                "leaves": "leaves",
                "attendances": "attendances",
                "revenue": "revenue",
                "revenuetargets": "revenuetargets",
                "sales": "sales",
                "salestargets": "salestargets", 
                "payrolls": "payrolls",
                "checkpoints": "checkpoints",
                "users": "users",
                "vendors": "vendors",
                "inquiries": "inquiries",
                "inventory": "inventory"
            }
            
            collection_name = collection_map.get(domain)
            if not collection_name:
                continue
            
            # Search the collection with filters
            where_filter = {}
            if category:
                where_filter["category"] = category
            
            # Additional metadata filters could be added here
            if filters.get("status"):
                where_filter["status"] = filters["status"]
            
            domain_results = self.vector_store.search(
                collection_name=collection_name,
                query=query,
                n_results=n_results,
                where=where_filter if where_filter else None
            )
            
            if domain_results["ids"]:
                results[domain] = domain_results
                total_retrieved += len(domain_results["ids"])
                print(f"   ✓ Found {len(domain_results['ids'])} relevant {domain}")
        
        print(f"   Total: {total_retrieved} documents retrieved\n")
        
        # Assemble context
        context = self._assemble_context(results, query, filters)
        
        return {
            "query": query,
            "domains": domains,
            "filters": filters,
            "results": results,
            "context": context,
            "total_documents": total_retrieved
        }
    
    def _assemble_context(
        self,
        results: Dict[str, Dict[str, Any]],
        query: str,
        filters: Dict[str, Any]
    ) -> str:
        """
        Assemble retrieved documents into a coherent context string
        
        Args:
            results: Results from vector store search
            query: Original query
            filters: Extracted filters
            
        Returns:
            Assembled context string for LLM
        """
        context_parts = []
        
        context_parts.append(f"QUERY: {query}")
        context_parts.append("=" * 80)
        context_parts.append("\nRELEVANT CONTEXT:\n")
        
        # Add results from each domain
        for domain, domain_results in results.items():
            if not domain_results["documents"]:
                continue
            
            context_parts.append(f"\n--- {domain.upper()} ---\n")
            
            for i, (doc, metadata, distance) in enumerate(zip(
                domain_results["documents"],
                domain_results["metadatas"],
                domain_results["distances"]
            )):
                relevance_score = 1 - distance  # Convert distance to similarity
                context_parts.append(f"\n[{domain.upper()} {i+1}] (Relevance: {relevance_score:.2f})")
                context_parts.append(doc)
                context_parts.append("")  # Blank line
        
        # Add instructions for the LLM
        context_parts.append("\n" + "=" * 80)
        context_parts.append("\nINSTRUCTIONS:")
        context_parts.append("Use the above context to answer the query comprehensively.")
        context_parts.append("Cite specific projects, employees, or data points from the context.")
        context_parts.append("If the context doesn't contain enough information, say so.")
        context_parts.append("Be specific and data-driven in your response.")
        
        return "\n".join(context_parts)
    
    def cross_domain_search(
        self,
        query: str,
        n_results_per_domain: int = 2
    ) -> Dict[str, Any]:
        """
        Search across all domains for unified insights
        
        Args:
            query: Search query
            n_results_per_domain: Number of results per domain
            
        Returns:
            Unified results from all domains
        """
        # Search across all major domains for comprehensive insights
        all_domains = ["projects", "employees", "tasks", "leads", "sales", "revenue"]
        return self.retrieve(
            query=query,
            domains=all_domains,
            n_results=n_results_per_domain
        )
