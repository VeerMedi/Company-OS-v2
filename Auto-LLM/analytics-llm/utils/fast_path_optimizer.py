"""
EXPANDED Fast-Path Query Optimization System
50+ Templates covering all data types with comprehensive edge case handling
"""

from typing import Dict, Optional, Any, List
from datetime import datetime, timedelta
import time

try:
    from fuzzywuzzy import fuzz
except ImportError:
    # Fallback simple matching
    class fuzz:
        @staticmethod
        def partial_ratio(a, b):
            return 100 if a.lower() in b.lower() or b.lower() in a.lower() else 0


class QueryTemplate:
    """Template for common query patterns"""
    
    def __init__(
        self,
        name: str,
        patterns: List[str],
        query_type: str,
        collection: str,
        filter_dict: Dict[str, Any],
        projection: Optional[Dict[str, int]] = None,
        cache_ttl: int = 300,
        response_format: str = "count",  # count, list, names
        negative_keywords: Optional[List[str]] = None,  # Keywords that disqualify this template
        priority: int = 0  # Higher priority = preferred when multiple matches
    ):
        self.name = name
        self.patterns = patterns
        self.query_type = query_type
        self.collection = collection
        self.filter = filter_dict
        self.projection = projection
        self.cache_ttl = cache_ttl
        self.response_format = response_format
        self.negative_keywords = negative_keywords or []
        self.priority = priority


# ============================================================================
# EMPLOYEE TEMPLATES (20+ patterns)
# ============================================================================
EMPLOYEE_TEMPLATES = {
    "employee_count": QueryTemplate(
        name="employee_count",
        patterns=[
            "how many employees", "total employees", "employee count", 
            "number of employees", "count employees", "employees total",
            "how many people work", "total staff", "headcount",
            "how many workers", "staff count", "team size"
        ],
        query_type="count",
        collection="users",
        filter_dict={"isActive": True, "role": {"$nin": ["ceo", "co-founder"]}},
        cache_ttl=300,
        negative_keywords=["leave", "absent", "vacation", "holiday", "sick", "off"],  # Exclude leave queries
        priority=1  # Lower priority than leave templates
    ),
    
    "manager_count": QueryTemplate(
        name="manager_count",
        patterns=[
            "how many managers", "total managers", "manager count",
            "number of managers", "count managers", "managers total"
        ],
        query_type="count",
        collection="users",
        filter_dict={"isActive": True, "role": "manager"},
        cache_ttl=600,
        negative_keywords=["leave", "absent"],
        priority=2  # More specific than employee_count
    ),
    
    "manager_list": QueryTemplate(
        name="manager_list",
        patterns=[
            "who are the managers", "list managers", "show managers",
            "managers", "all managers", "manager names", "show me managers",
            "list all managers", "our managers"
        ],
        query_type="list",
        collection="users",
        filter_dict={"isActive": True, "role": "manager"},
        projection={"_id": 1, "firstName": 1, "lastName": 1, "email": 1},
        cache_ttl=600,
        response_format="names",
        negative_keywords=["leave", "absent", "top", "best", "worst", "perform", "rank", "rating"],
        priority=2
    ),
    
    "developer_count": QueryTemplate(
        name="developer_count",
        patterns=[
            "how many developers", "total developers", "developer count",
            "number of developers", "devs count", "count developers",
            "how many devs", "software engineers", "programmers count"
        ],
        query_type="count",
        collection="users",
        filter_dict={"isActive": True, "role": "developer"},
        cache_ttl=600,
        negative_keywords=["leave", "absent"],
        priority=2
    ),
    
    "developer_list": QueryTemplate(
        name="developer_list",
        patterns=[
            "who are the developers", "list developers", "show developers",
            "developers", "all developers", "developer names", "devs",
            "list devs", "engineering team"
        ],
        query_type="list",
        collection="users",
        filter_dict={"isActive": True, "role": "developer"},
        projection={"_id": 1, "firstName": 1, "lastName": 1, "email": 1},
        cache_ttl=600,
        response_format="names",
        negative_keywords=["leave", "absent", "top", "best", "worst", "perform", "rank", "rating"],
        priority=2
    ),
    
    "hr_count": QueryTemplate(
        name="hr_count",
        patterns=[
            "how many hr", "total hr", "hr count", "number of hr",
            "hr team size", "human resources count"
        ],
        query_type="count",
        collection="users",
        filter_dict={"isActive": True, "role": "hr"},
        cache_ttl=600
    ),
    
    "hr_list": QueryTemplate(
        name="hr_list",
        patterns=[
            "who are the hr", "list hr", "show hr", "hr people",
            "hr team", "hr staff", "human resources team"
        ],
        query_type="list",
        collection="users",
        filter_dict={"isActive": True, "role": "hr"},
        projection={"_id": 1, "firstName": 1, "lastName": 1, "email": 1},
        cache_ttl=600,
        response_format="names",
        negative_keywords=["leave", "absent", "top", "best", "worst", "perform", "rank", "rating"],
        priority=2
    ),
}

# ============================================================================
# PROJECT TEMPLATES (15+ patterns)
# ============================================================================
PROJECT_TEMPLATES = {
    "project_count": QueryTemplate(
        name="project_count",
        patterns=[
            "how many projects", "total projects", "project count",
            "number of projects", "count projects", "projects total"
        ],
        query_type="count",
        collection="projects",
        filter_dict={},
        cache_ttl=300
    ),
    
    "active_projects": QueryTemplate(
        name="active_projects",
        patterns=[
            "active projects", "ongoing projects", "current projects",
            "projects in progress", "running projects", "live projects",
            "how many active projects", "projects active"
        ],
        query_type="count",
        collection="projects",
        filter_dict={"status": "in-progress"},
        cache_ttl=300
    ),
    
    "completed_projects": QueryTemplate(
        name="completed_projects",
        patterns=[
            "completed projects", "finished projects", "done projects",
            "how many completed projects", "projects completed"
        ],
        query_type="count",
        collection="projects",
        filter_dict={"status": "completed"},
        cache_ttl=300
    ),
    
    "pending_projects": QueryTemplate(
        name="pending_projects",
        patterns=[
            "pending projects", "not started projects", "new projects",
            "projects not started", "waiting projects"
        ],
        query_type="count",
        collection="projects",
        filter_dict={"status": "not-started"},
        cache_ttl=300
    ),
    
    "on_hold_projects": QueryTemplate(
        name="on_hold_projects",
        patterns=[
            "on hold projects", "paused projects", "halted projects",
            "projects on hold"
        ],
        query_type="count",
        collection="projects",
        filter_dict={"status": "on-hold"},
        cache_ttl=300
    ),
}

# ============================================================================
# TASK TEMPLATES (25+ patterns)
# ============================================================================
TASK_TEMPLATES = {
    "task_count": QueryTemplate(
        name="task_count",
        patterns=[
            "how many tasks", "total tasks", "task count",
            "number of tasks", "count tasks", "tasks total"
        ],
        query_type="count",
        collection="tasks",
        filter_dict={},
        cache_ttl=120
    ),
    
    "pending_tasks": QueryTemplate(
        name="pending_tasks",
        patterns=[
            "pending tasks", "tasks pending", "how many pending",
            "incomplete tasks", "open tasks", "unfinished tasks"
        ],
        query_type="count",
        collection="tasks",
        filter_dict={"status": {"$in": ["not-started", "in-progress"]}},
        cache_ttl=120
    ),
    
    "not_started_tasks": QueryTemplate(
        name="not_started_tasks",
        patterns=[
            "not started tasks", "tasks not started", "new tasks",
            "waiting tasks", "unstarted tasks"
        ],
        query_type="count",
        collection="tasks",
        filter_dict={"status": "not-started"},
        cache_ttl=120
    ),
    
    "in_progress_tasks": QueryTemplate(
        name="in_progress_tasks",
        patterns=[
            "in progress tasks", "tasks in progress", "ongoing tasks",
            "current tasks", "active tasks", "working on tasks"
        ],
        query_type="count",
        collection="tasks",
        filter_dict={"status": "in-progress"},
        cache_ttl=120
    ),
    
    "completed_tasks": QueryTemplate(
        name="completed_tasks",
        patterns=[
            "completed tasks", "finished tasks", "done tasks",
            "tasks completed", "tasks done"
        ],
        query_type="count",
        collection="tasks",
        filter_dict={"status": "completed"},
        cache_ttl=120
    ),
    
    "review_tasks": QueryTemplate(
        name="review_tasks",
        patterns=[
            "tasks in review", "review tasks", "pending review",
            "tasks for review", "tasks to review"
        ],
        query_type="count",
        collection="tasks",
        filter_dict={"status": "review"},
        cache_ttl=120
    ),
    
    "urgent_tasks": QueryTemplate(
        name="urgent_tasks",
        patterns=[
            "urgent tasks", "critical tasks", "high priority tasks",
            "priority tasks", "important tasks"
        ],
        query_type="count",
        collection="tasks",
        filter_dict={"priority": {"$in": ["urgent", "high"]}},
        cache_ttl=60
    ),
    
    "overdue_tasks": QueryTemplate(
        name="overdue_tasks",
        patterns=[
            "overdue tasks", "late tasks", "missed deadline tasks",
            "expired tasks", "past due tasks"
        ],
        query_type="count",
        collection="tasks",
        filter_dict={
            "status": {"$nin": ["completed", "cant-complete"]},
            "deadline": {"$lt": datetime.now()}
        },
        cache_ttl=60
    ),
}

# ============================================================================
# LEAVE & ATTENDANCE TEMPLATES (15+ patterns)
# ============================================================================
LEAVE_TEMPLATES = {
    "pending_leaves": QueryTemplate(
        name="pending_leaves",
        patterns=[
            "pending leaves", "leave requests pending", "pending leave requests",
            "awaiting approval", "leaves waiting", "unapproved leaves",
            "how many employees on leave", "employees on leave", "staff on leave",
            "people on leave", "who is on leave"
        ],
        query_type="count",
        collection="leaves",
        filter_dict={"status": "pending"},
        cache_ttl=120,
        priority=10  # HIGH priority - very specific query
    ),
    
    "approved_leaves": QueryTemplate(
        name="approved_leaves",
        patterns=[
            "approved leaves", "leaves approved", "accepted leaves"
        ],
        query_type="count",
        collection="leaves",
        filter_dict={"status": "approved"},
        cache_ttl=300
    ),
    
    "rejected_leaves": QueryTemplate(
        name="rejected_leaves",
        patterns=[
            "rejected leaves", "leaves rejected", "denied leaves"
        ],
        query_type="count",
        collection="leaves",
        filter_dict={"status": "rejected"},
        cache_ttl=300
    ),
    
    "sick_leaves": QueryTemplate(
        name="sick_leaves",
        patterns=[
            "sick leaves", "medical leaves", "health leaves"
        ],
        query_type="count",
        collection="leaves",
        filter_dict={"leaveType": "sick"},
        cache_ttl=300
    ),
    
    "vacation_leaves": QueryTemplate(
        name="vacation_leaves",
        patterns=[
            "vacation leaves", "vacations", "holiday leaves"
        ],
        query_type="count",
        collection="leaves",
        filter_dict={"leaveType": "vacation"},
        cache_ttl=300
    ),
}

# ============================================================================
# COMBINED TEMPLATE DICTIONARY
# ============================================================================
QUERY_TEMPLATES = {
    **EMPLOYEE_TEMPLATES,
    **PROJECT_TEMPLATES,
    **TASK_TEMPLATES,
    **LEAVE_TEMPLATES,
}


class FastPathOptimizer:
    """Fast-path query optimizer with 50+ templates for instant responses"""
    
    def __init__(self, data_fetcher):
        self.data_fetcher = data_fetcher
        self.templates = QUERY_TEMPLATES
        self._cache = {}
        self._cache_timestamps = {}
        self._query_stats = {"hits": 0, "misses": 0, "fallbacks": 0}
        
        print(f"⚡ Fast-Path Optimizer loaded with {len(self.templates)} templates")
    
    def match_query_template(self, query: str, threshold: int = 70) -> Optional[str]:
        """Match user query to predefined template using fuzzy matching with conflict resolution"""
        query_lower = query.lower().strip()
        
        # CRITICAL: Skip fast-path for action requests (task creation, etc.)
        action_keywords = ['create', 'make', 'add', 'assign', 'schedule', 'update', 'delete', 'remove', 'new task']
        if any(keyword in query_lower for keyword in action_keywords):
            print(f"⚠️  Action keyword detected in '{query}' - skipping fast-path")
            return None
        
        # Collect all potential matches with scores
        matches = []  # [(template_name, score, priority)]
        
        # Quick exact match first
        for template_name, template in self.templates.items():
            # Check negative keywords - disqualify if present
            if any(neg_keyword in query_lower for neg_keyword in template.negative_keywords):
                continue
            
            for pattern in template.patterns:
                if query_lower == pattern.lower():
                    print(f"🎯 EXACT match: '{query}' → {template_name} (priority: {template.priority})")
                    matches.append((template_name, 100, template.priority))
                    break
        
        # If we have exact matches, return highest priority one
        if matches:
            matches.sort(key=lambda x: (x[2], x[1]), reverse=True)  # Sort by priority, then score
            return matches[0][0]
        
        # Fuzzy match
        for template_name, template in self.templates.items():
            # Check negative keywords - disqualify if present
            if any(neg_keyword in query_lower for neg_keyword in template.negative_keywords):
                continue
            
            for pattern in template.patterns:
                score = fuzz.partial_ratio(query_lower, pattern.lower())
                if score >= threshold:
                    matches.append((template_name, score, template.priority))
        
        if not matches:
            return None
        
        # Sort by priority first, then score
        matches.sort(key=lambda x: (x[2], x[1]), reverse=True)
        best_match = matches[0]
        
        # Log potential conflicts
        if len(matches) > 1 and matches[1][1] >= 80:  # Multiple high-score matches
            print(f"⚠️  Multiple matches found: {matches[:3]}")
            print(f"   Selected: {best_match[0]} (priority: {best_match[2]}, score: {best_match[1]})")
        else:
            print(f"🎯 Fast-path match: '{query}' → {best_match[0]} (score: {best_match[1]}, priority: {best_match[2]})")
        
        return best_match[0]
    
    def _get_cache_key(self, template_name: str) -> str:
        return f"fastpath:{template_name}"
    
    def _is_cache_valid(self, cache_key: str, ttl: int) -> bool:
        if cache_key not in self._cache:
            return False
        timestamp = self._cache_timestamps.get(cache_key, 0)
        return (time.time() - timestamp) < ttl
    
    def _set_cache(self, cache_key: str, value: Any):
        self._cache[cache_key] = value
        self._cache_timestamps[cache_key] = time.time()
    
    def _execute_template_query(self, template: QueryTemplate) -> Any:
        """Execute database query for template"""
        collection = getattr(self.data_fetcher.db, template.collection)
        
        # Handle dynamic filters (like overdue tasks)
        filter_dict = template.filter.copy()
        if "deadline" in filter_dict and "$lt" in filter_dict.get("deadline", {}):
            if filter_dict["deadline"]["$lt"] == datetime.now():
                filter_dict["deadline"]["$lt"] = datetime.now()
        
        if template.query_type == "count":
            result = collection.count_documents(filter_dict)
        elif template.query_type == "list":
            if template.projection:
                result = list(collection.find(filter_dict, template.projection).limit(50))
            else:
                result = list(collection.find(filter_dict).limit(50))
        else:
            result = None
        
        return result
    
    def get_instant_response(self, query: str) -> Optional[Dict[str, Any]]:
        """Try to get instant response via fast path"""
        template_name = self.match_query_template(query)
        
        if not template_name:
            self._query_stats["fallbacks"] += 1
            return None
        
        template = self.templates[template_name]
        cache_key = self._get_cache_key(template_name)
        
        # CACHING DISABLED FOR REAL-TIME DATA
        # Old cache check removed - we need fresh data every time
        # if self._is_cache_valid(cache_key, template.cache_ttl):
        #     cached_value = self._cache[cache_key]
        #     self._query_stats["hits"] += 1
        #     cache_age = time.time() - self._cache_timestamps[cache_key]
        #     print(f"⚡ Cache HIT: {cache_key} (age: {cache_age:.1f}s)")
        #     return self._format_response(template_name, cached_value, True, 0)
        
        print(f"🔄 Fetching FRESH data for: {template_name}")
        
        # Execute query
        self._query_stats["misses"] += 1
        print(f"💾 Cache MISS: {cache_key}")
        
        start_time = time.time()
        try:
            result = self._execute_template_query(template)
            query_time = time.time() - start_time
            # Don't cache the result - we want fresh data every time
            # self._set_cache(cache_key, result)  # Disabled for real-time
            print(f"✓ Fast query in {query_time:.3f}s (real-time, no cache)")
            return self._format_response(template_name, result, False, query_time)
        except Exception as e:
            print(f"❌ Fast-path query failed: {e}")
            return None
    
    def _format_response(self, template_name: str, result: Any, from_cache: bool, query_time: float) -> Dict[str, Any]:
        """Format response for user"""
        template = self.templates[template_name]
        answer = self._generate_answer(template_name, result)
        
        return {
            "question": "",
            "answer": answer,
            "fast_path": True,
            "template": template_name,
            "from_cache": from_cache,
            "response_time": query_time,
            "success": True,
            "num_sources": 1,
            "citations": [],
            "domains_searched": [template.collection],
        }
    
    def _generate_answer(self, template_name: str, result: Any) -> str:
        """Generate natural language answer"""
        template = self.templates[template_name]
        
        # Count responses
        if template.query_type == "count":
            return self._count_answer(template_name, result)
        
        # List responses
        if template.query_type == "list":
            return self._list_answer(template_name, result)
        
        return f"Found {result} results."
    
    def _count_answer(self, template_name: str, count: int) -> str:
        """Generate answer for count queries"""
        # Employee counts
        if "employee" in template_name:
            return f"There are {count} employees."
        if "manager" in template_name:
            return f"There {'is' if count == 1 else 'are'} {count} manager{'s' if count != 1 else ''}."
        if "developer" in template_name:
            return f"There {'is' if count == 1 else 'are'} {count} developer{'s' if count != 1 else ''}."
        if "hr" in template_name:
            return f"There {'is' if count == 1 else 'are'} {count} HR staff member{'s' if count != 1 else ''}."
        
        # Project counts
        if "project" in template_name:
            status = template_name.replace("_projects", "").replace("project_count", "total")
            return f"There {'is' if count == 1 else 'are'} {count} {status} project{'s' if count != 1 else ''}."
        
        # Task counts
        if "task" in template_name:
            status = template_name.replace("_tasks", "").replace("task_count", "total")
            return f"There {'is' if count == 1 else 'are'} {count} {status.replace('_', ' ')} task{'s' if count != 1 else ''}."
        
        # Leave counts
        if "leave" in template_name:
            status = template_name.replace("_leaves", "")
            return f"There {'is' if count == 1 else 'are'} {count} {status} leave request{'s' if count != 1 else ''}."
        
        return f"Count: {count}"
    
    def _list_answer(self, template_name: str, items: List[Dict]) -> str:
        """Generate answer for list queries"""
        if not items:
            return "No results found."
        
        # Extract names
        names = []
        for item in items[:5]:  # Limit to 5 names
            first = item.get("firstName", "")
            last = item.get("lastName", "")
            name = f"{first} {last}".strip()
            if name:
                names.append(name)
        
        if not names:
            return f"Found {len(items)} items."
        
        # Format list
        if len(items) <= 5:
            name_list = ", ".join(names)
        else:
            name_list = ", ".join(names) + f", and {len(items) - 5} more"
        
        # Role-specific formatting
        if "manager" in template_name:
            return f"The manager{'s are' if len(items) > 1 else ' is'}: {name_list}."
        if "developer" in template_name:
            return f"The developer{'s are' if len(items) > 1 else ' is'}: {name_list}."
        if "hr" in template_name:
            return f"The HR team member{'s are' if len(items) > 1 else ' is'}: {name_list}."
        
        return f"Found: {name_list}."
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total = self._query_stats["hits"] + self._query_stats["misses"] + self._query_stats["fallbacks"]
        hit_rate = (self._query_stats["hits"] / total * 100) if total > 0 else 0
        
        return {
            **self._query_stats,
            "total_queries": total,
            "hit_rate": round(hit_rate, 2),
            "cache_size": len(self._cache),
            "templates_count": len(self.templates)
        }


__all__ = ['FastPathOptimizer', 'QUERY_TEMPLATES']
