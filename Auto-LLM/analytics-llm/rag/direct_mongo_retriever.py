"""
Direct MongoDB Retriever for RAG System
Fetches data directly from MongoDB without vector embeddings
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import re
import hashlib
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from data_fetcher import DataFetcher
from config import AnalyticsLLMConfig


class DirectMongoRetriever:
    """Retrieves context directly from MongoDB using keyword matching and queries"""
    
    def __init__(self):
        self.config = AnalyticsLLMConfig()
        self.data_fetcher = DataFetcher()
        self.data_fetcher.connect()
        
        # Caching disabled for real-time data
        self._cache_enabled = True  # Enable caching for faster voice responses
        self._cache = {}
        self._cache_ttl = 300
        
        print("✓ Direct MongoDB Retriever initialized (caching enabled for faster responses)")
    
    def identify_intent(self, query: str) -> List[str]:
        """
        Identify which MongoDB collections the query is about
        
        Args:
            query: Natural language query
            
        Returns:
            List of collection names to query
        """
        if not query:
            return ["projects", "employees"]
            
        domains = set()
        query_lower = query.lower()
        
        # CRITICAL: Detect "company overview" queries
        # These should query internal operations, NOT external client companies
        company_overview_patterns = [
            "what's going on", "whats going on", "what is going on",
            "company status", "company overview", "company performance",
            "my company", "our company", "the company",
            "kya chal raha", "kya ho raha", "company ka status",
            "company mein kya"
        ]
        
        is_company_overview = any(pattern in query_lower for pattern in company_overview_patterns)
        
        if is_company_overview:
            # Return internal operations data ONLY
            print("   🏢 Company overview query detected - querying internal operations")
            return ["projects", "employees", "tasks"]
        
        # Comprehensive keyword mapping for all collections
        keywords = {
            "projects": ["project", "status", "progress", "deadline", "timeline", "milestone", "delivery", "sprint"],
            "employees": ["employee", "team", "staff", "performance", "manager", "developer", "hr", "who", "worker", "member", "people"],
            "tasks": ["task", "todo", "assignment", "work", "ticket", "issue", "bug", "feature", "backlog"],
            "leads": ["lead", "prospect", "customer", "client", "deal", "opportunity", "pipeline", "funnel"],
            "companies": ["client company", "client business", "external company"],  # Only match SPECIFIC phrases
            "leaves": ["leave", "sick", "vacation", "holiday", "absent", "off", "time off", "pto"],
            "attendances": ["attendance", "present", "late", "punch", "check-in", "check-out", "working hours"],
            "revenue": ["revenue", "income", "money", "profit", "earnings", "financial", "mrr", "arr"],
            "revenuetargets": ["revenue target", "goal", "forecast", "projection"],
            "sales": ["sale", "closed", "won", "booking", "contract", "invoice"],
            "salestargets": ["sales target", "rep target", "sales quota", "sales goal"],
            "payrolls": ["payroll", "salary", "wage", "compensation", "payslip", "pay", "payment"],
        }
        
        # Check for keywords
        for domain, domain_keywords in keywords.items():
            if any(k in query_lower for k in domain_keywords):
                domains.add(domain)
        
        # Advanced heuristics
        if "how much" in query_lower or "how many" in query_lower:
            if not domains:
                domains.update(["projects", "employees", "revenue", "sales"])
            if "lead" in query_lower:
                domains.add("leads")
                
        if "who" in query_lower:
            if "employees" not in domains:
                domains.add("employees")
            domains.add("tasks")
        
        if (("what" in query_lower or "which" in query_lower) and 
            ("working on" in query_lower or "assigned" in query_lower)):
            domains.add("tasks")
            domains.add("projects")
        
        # Financial queries
        if any(term in query_lower for term in ["target", "goal", "quota"]):
            if "sales" in query_lower:
                domains.add("salestargets")
            if "revenue" in query_lower:
                domains.add("revenuetargets")
        
        # Default to core business collections
        if not domains:
            return ["projects", "employees", "tasks"]
            
        return list(domains)
    
    def extract_filters(self, query: str) -> Dict[str, Any]:
        """
        Extract MongoDB filters from natural language query
        
        Args:
            query: User query
            
        Returns:
            Dictionary of filters and intents
        """
        filters = {}
        query_lower = query.lower()
        
        # Status filters
        if "at risk" in query_lower or "behind" in query_lower or "delayed" in query_lower:
            filters["status_intent"] = "at_risk"
        elif "completed" in query_lower or "done" in query_lower or "finished" in query_lower:
            filters["status_filter"] = "completed"
        elif "in progress" in query_lower or "ongoing" in query_lower or "active" in query_lower:
            filters["status_filter"] = "in-progress"
        elif "not started" in query_lower or "pending" in query_lower:
            filters["status_filter"] = "not-started"
        
        # Performance filters
        if "low performance" in query_lower or "struggling" in query_lower or "needs attention" in query_lower:
            filters["performance_intent"] = "low"
        elif "top performer" in query_lower or "best" in query_lower or "excellent" in query_lower or "high performance" in query_lower:
            filters["performance_intent"] = "high"
        
        # Time filters
        if "today" in query_lower:
            filters["time_range"] = "today"
        elif "this week" in query_lower:
            filters["time_range"] = "week"
        elif "this month" in query_lower:
            filters["time_range"] = "month"
        
        return filters
    
    def _get_cache_key(self, query: str, category: Optional[str] = None) -> str:
        """Generate cache key from query and category"""
        cache_str = f"{query}_{category or 'none'}"
        return hashlib.md5(cache_str.encode()).hexdigest()
    
    def _get_cached_result(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Get cached result if still valid"""
        if cache_key in self._cache:
            cached_entry = self._cache[cache_key]
            age = time.time() - cached_entry["timestamp"]
            
            if age < cached_entry.get("ttl", self._cache_ttl):
                print(f"   ⚡ Cache HIT (age: {age:.1f}s)")
                return cached_entry["result"]
            else:
                # Expired, remove from cache
                del self._cache[cache_key]
                print(f"   🗑️ Cache expired (age: {age:.1f}s)")
        
        return None
    
    def _cache_result(self, cache_key: str, result: Dict[str, Any], ttl: Optional[int] = None):
        """Cache a result with TTL"""
        self._cache[cache_key] = {
            "result": result,
            "timestamp": time.time(),
            "ttl": ttl or self._cache_ttl
        }
        print(f"   💾 Cached result (TTL: {ttl or self._cache_ttl}s)")
    
    def retrieve(
        self,
        query: str,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieve relevant context from MongoDB with caching and parallel execution
        
        Args:
            query: User query
            category: Optional category filter
            
        Returns:
            Dictionary with results and assembled context
        """
        start_time = time.time()
        
        print(f"\n🔍 Direct MongoDB Retrieval for: '{query}'")
        if category:
            print(f"   Category: {category}")
        
        # Check cache first (skip if caching disabled for real-time data)
        if self._cache_enabled:
            cache_key = self._get_cache_key(query, category)
            cached_result = self._get_cached_result(cache_key)
            
            if cached_result:
                elapsed = time.time() - start_time
                print(f"   ⏱️ Total time: {elapsed*1000:.0f}ms (from cache)\n")
                return cached_result
        
        # Identify which collections to query
        domains = self.identify_intent(query)
        print(f"   Collections to query: {domains}")
        
        # Extract filters
        filters = self.extract_filters(query)
        if filters:
            print(f"   Filters: {filters}")
        
        # Retrieve data from MongoDB in PARALLEL
        results = {}
        total_retrieved = 0
        
        print(f"   🚀 Executing {len(domains)} queries in parallel...")
        
        with ThreadPoolExecutor(max_workers=min(len(domains), 5)) as executor:
            # Submit all domain queries concurrently
            future_to_domain = {
                executor.submit(self._query_domain, domain, query, filters, category): domain
                for domain in domains
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_domain):
                domain = future_to_domain[future]
                try:
                    domain_data = future.result()
                    if domain_data:
                        results[domain] = domain_data
                        total_retrieved += len(domain_data.get("items", []))
                        print(f"   ✓ Found {len(domain_data.get('items', []))} items in {domain}")
                except Exception as e:
                    print(f"   ⚠️ Error querying {domain}: {e}")
        
        elapsed = time.time() - start_time
        print(f"   Total: {total_retrieved} items retrieved in {elapsed*1000:.0f}ms\n")
        
        # Assemble context for LLM
        context = self._assemble_context(results, query)
        
        result = {
            "query": query,
            "domains": domains,
            "filters": filters,
            "results": results,
            "context": context,
            "total_documents": total_retrieved
        }
        
        # Cache the result (skip if caching disabled for real-time data)
        if self._cache_enabled:
            self._cache_result(cache_key, result)
        else:
            print(f"   🔄 Real-time mode: Fetched fresh data from MongoDB")
        
        return result
    
    def _query_domain(
        self,
        domain: str,
        query: str,
        filters: Dict[str, Any],
        category: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Query a specific MongoDB collection
        
        Args:
            domain: Collection name
            query: User query
            filters: Extracted filters
            category: Optional category filter
            
        Returns:
            Dictionary with items and metadata
        """
        try:
            if domain == "projects":
                return self._query_projects(filters, category)
            elif domain == "employees":
                return self._query_employees(filters, category)
            elif domain == "tasks":
                return self._query_tasks(filters, category)
            elif domain == "leaves":
                return self._query_leaves(filters, category)
            elif domain == "attendances":
                return self._query_attendances(filters, category)
            elif domain == "revenue":
                return self._query_collection("revenue", filters)
            elif domain == "sales":
                return self._query_collection("sales", filters)
            elif domain == "leads":
                return self._query_collection("leads", filters)
            elif domain == "payrolls":
                return self._query_collection("payrolls", filters)
            else:
                # Generic collection query
                return self._query_collection(domain, filters)
                
        except Exception as e:
            print(f"   ⚠️ Error querying {domain}: {e}")
            return None
    
    def _query_projects(self, filters: Dict[str, Any], category: Optional[str] = None) -> Dict[str, Any]:
        """Query projects with filtering"""
        projects = self.data_fetcher.fetch_projects_data(category=category, limit=50)
        
        # Apply status filters
        if filters.get("status_filter"):
            projects = [p for p in projects if p.get("status") == filters["status_filter"]]
        
        # Apply intent-based filters
        if filters.get("status_intent") == "at_risk":
            # Projects at risk: low completion %, behind deadline, or many incomplete tasks
            projects = [
                p for p in projects 
                if (p.get("completion_percentage", 0) < 50 or 
                    p.get("status") in ["delayed", "at-risk"] or
                    p.get("in_progress_tasks", 0) > p.get("completed_tasks", 0) * 2)
            ]
        
        # Limit results
        projects = projects[:10]
        
        return {
            "items": projects,
            "count": len(projects),
            "type": "projects"
        }
    
    def _query_employees(self, filters: Dict[str, Any], category: Optional[str] = None) -> Dict[str, Any]:
        """Query employees with performance filtering"""
        employees = self.data_fetcher.fetch_employee_reports(days=30, category=category)
        
        # Apply performance filters
        if filters.get("performance_intent") == "low":
            # Low performers: completion rate < 60% or many pending tasks
            employees = [
                e for e in employees
                if (e.get("completion_rate", 0) < 60 or 
                    e.get("not_started_tasks", 0) > 5 or
                    e.get("revision_tasks", 0) > 2)
            ]
        elif filters.get("performance_intent") == "high":
            # High performers: completion rate > 80% and good on-time rate
            employees = [
                e for e in employees
                if (e.get("completion_rate", 0) > 80 and 
                    e.get("on_time_rate", 0) > 80)
            ]
        
        # Limit results
        employees = employees[:15]
        
        return {
            "items": employees,
            "count": len(employees),
            "type": "employees"
        }
    
    def _query_tasks(self, filters: Dict[str, Any], category: Optional[str] = None) -> Dict[str, Any]:
        """Query tasks"""
        mongo_filter = {}
        
        if filters.get("status_filter"):
            mongo_filter["status"] = filters["status_filter"]
        
        tasks = self.data_fetcher.fetch_collection_data("tasks", limit=20, query=mongo_filter)
        
        return {
            "items": tasks,
            "count": len(tasks),
            "type": "tasks"
        }
    
    def _query_leaves(self, filters: Dict[str, Any], category: Optional[str] = None) -> Dict[str, Any]:
        """Query leave requests"""
        status_filter = filters.get("status_filter") if filters.get("status_filter") else None
        leaves = self.data_fetcher.fetch_leave_requests(category=category, status_filter=status_filter)
        
        # Apply time filters
        if filters.get("time_range") == "today":
            today = datetime.now().date()
            leaves = [
                l for l in leaves
                if l.get("start_date") and datetime.fromisoformat(l["start_date"]).date() <= today
                and l.get("end_date") and datetime.fromisoformat(l["end_date"]).date() >= today
            ]
        
        return {
            "items": leaves[:15],
            "count": len(leaves[:15]),
            "type": "leaves"
        }
    
    def _query_attendances(self, filters: Dict[str, Any], category: Optional[str] = None) -> Dict[str, Any]:
        """Query attendance records"""
        mongo_filter = {}
        
        if filters.get("time_range") == "today":
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            mongo_filter["date"] = {"$gte": today}
        
        attendances = self.data_fetcher.fetch_collection_data("attendances", limit=20, query=mongo_filter)
        
        return {
            "items": attendances,
            "count": len(attendances),
            "type": "attendances"
        }
    
    def _query_collection(self, collection_name: str, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Generic collection query"""
        mongo_filter = {}
        
        if filters.get("status_filter"):
            mongo_filter["status"] = filters["status_filter"]
        
        items = self.data_fetcher.fetch_collection_data(collection_name, limit=15, query=mongo_filter)
        
        return {
            "items": items,
            "count": len(items),
            "type": collection_name
        }
    
    def _assemble_context(self, results: Dict[str, Dict[str, Any]], query: str) -> str:
        """
        Assemble MongoDB results into context string for LLM
        
        Args:
            results: Results from MongoDB queries
            query: Original query
            
        Returns:
            Formatted context string
        """
        context_parts = []
        
        context_parts.append(f"QUERY: {query}")
        context_parts.append("=" * 80)
        context_parts.append("\nRELEVANT CONTEXT FROM DATABASE:\n")
        
        # Format results from each domain
        for domain, domain_data in results.items():
            items = domain_data.get("items", [])
            if not items:
                continue
            
            context_parts.append(f"\n--- {domain.upper()} ({len(items)} items) ---\n")
            
            # Format items based on type
            for i, item in enumerate(items):
                context_parts.append(f"\n[{domain.upper()} {i+1}]")
                context_parts.append(self._format_item(domain, item))
                context_parts.append("")  # Blank line
        
        # Add instructions
        context_parts.append("\n" + "=" * 80)
        context_parts.append("\nINSTRUCTIONS:")
        context_parts.append("Use the above database records to answer the query comprehensively.")
        context_parts.append("Cite specific projects, employees, or data points from the context.")
        context_parts.append("Be specific and data-driven in your response.")
        context_parts.append("If asked for counts, calculate from the data provided.")
        
        return "\n".join(context_parts)
    
    def _format_item(self, domain: str, item: Dict[str, Any]) -> str:
        """Format a single item for context"""
        if domain == "projects":
            return (
                f"Name: {item.get('name')}\n"
                f"Status: {item.get('status')}\n"
                f"Progress: {item.get('completion_percentage')}%\n"
                f"Tasks: {item.get('completed_tasks')}/{item.get('total_tasks')} completed\n"
                f"Deadline: {item.get('deadline')}\n"
                f"Manager: {item.get('manager', {}).get('name', 'N/A') if isinstance(item.get('manager'), dict) else 'N/A'}"
            )
        elif domain == "employees":
            return (
                f"Name: {item.get('name')}\n"
                f"Role: {item.get('role')}\n"
                f"Email: {item.get('email')}\n"
                f"Completion Rate: {item.get('completion_rate')}%\n"
                f"On-Time Rate: {item.get('on_time_rate')}%\n"
                f"Active Tasks: {item.get('in_progress_tasks')}\n"
                f"Total Points: {item.get('total_points')}"
            )
        elif domain == "tasks":
            return (
                f"Title: {item.get('title')}\n"
                f"Status: {item.get('status')}\n"
                f"Priority: {item.get('priority')}\n"
                f"Deadline: {item.get('deadline')}"
            )
        elif domain == "leaves":
            return (
                f"Employee: {item.get('employee_name')}\n"
                f"Type: {item.get('leave_type')}\n"
                f"Duration: {item.get('start_date')} to {item.get('end_date')}\n"
                f"Days: {item.get('total_days')}\n"
                f"Status: {item.get('status')}\n"
                f"Reason: {item.get('reason', 'N/A')}"
            )
        else:
            # Generic formatting
            return str(item)
    
    def __del__(self):
        """Cleanup MongoDB connection"""
        if hasattr(self, 'data_fetcher'):
            self.data_fetcher.disconnect()
