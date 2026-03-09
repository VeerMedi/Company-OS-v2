"""
Follow-up Suggestion System
Generates intelligent follow-up questions based on query context
"""

import random
from typing import List, Optional, Dict, Any

class FollowUpGenerator:
    """Generates contextual follow-up suggestions"""
    
    # Follow-up templates by entity type
    FOLLOW_UPS = {
        'employee': [
            "Would you like to see their task list?",
            "Should I check their recent activity?",
            "Want to know their current workload?",
            "Interested in their performance metrics?",
        ],
        'project': [
            "Want to see who's assigned to this project?",
            "Should I show the task breakdown?",
            "Interested in the timeline?",
            "Want to know the completion status?",
        ],
        'task': [
            "Should I show similar tasks?",
            "Want to know who's working on this?",
            "Interested in the deadline?",
            "Need to update the priority?",
        ],
        'team': [
            "Want to see individual member stats?",
            "Should I break down by role?",
            "Interested in team capacity?",
            "Want to compare with other teams?",
        ],
        'status': [
            "Want to see what's behind schedule?",
            "Should I show top priorities?",
            "Interested in who needs support?",
            "Want to drill into the details?",
        ],
        'list': [
            "Want me to filter this list?",
            "Should I sort by priority?",
            "Need more details on any of these?",
            "Want to see the full breakdown?",
        ]
    }
    
    def __init__(self):
        """Initialize follow-up generator"""
        pass
    
    def generate_followup(
        self, 
        query: str, 
        answer: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Generate a follow-up suggestion
        
        Args:
            query: Original user question
            answer: Generated answer
            context: Optional context (citations, entities, etc.)
            
        Returns:
            Follow-up suggestion or None
        """
        # Detect entity type from query and answer
        entity_type = self._detect_entity_type(query, answer, context)
        
        if not entity_type:
            return None
        
        # Get appropriate follow-ups
        suggestions = self.FOLLOW_UPS.get(entity_type, [])
        
        if not suggestions:
            return None
        
        # Return a random suggestion
        return random.choice(suggestions)
    
    def _detect_entity_type(
        self, 
        query: str, 
        answer: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Detect the primary entity type discussed
        
        Args:
            query: User question
            answer: Generated answer
            context: Optional additional context
            
        Returns:
            Entity type or None
        """
        query_lower = query.lower()
        answer_lower = answer.lower()
        
        # Check for employee queries
        employee_keywords = ['employee', 'developer', 'manager', 'team member', 'staff', 'person']
        if any(word in query_lower for word in employee_keywords):
            # If asking about a specific person (name in query)
            if any(char.isupper() for char in query):
                return 'employee'
        
        # Check for project queries
        project_keywords = ['project', 'initiative', 'campaign']
        if any(word in query_lower for word in project_keywords):
            return 'project'
        
        # Check for task queries
        task_keywords = ['task', 'todo', 'assignment', 'work item']
        if any(word in query_lower for word in task_keywords):
            return 'task'
        
        # Check for team queries
        team_keywords = ['team', 'group', 'department']
        if any(word in query_lower for word in team_keywords):
            return 'team'
        
        # Check for status queries
        status_keywords = ['status', 'progress', 'at risk', 'delayed', 'overdue']
        if any(word in query_lower for word in status_keywords):
            return 'status'
        
        # Check if answer is a list
        list_indicators = ['\n-', '\n•', '\n1.', '\n2.', 'include:', 'are:']
        if any(indicator in answer for indicator in list_indicators):
            return 'list'
        
        return None
    
    def generate_multiple_followups(
        self,
        query: str,
        answer: str,
        context: Optional[Dict[str, Any]] = None,
        count: int = 2
    ) -> List[str]:
        """
        Generate multiple follow-up suggestions
        
        Args:
            query: Original question
            answer: Generated answer
            context: Optional context
            count: Number of suggestions to generate
            
        Returns:
            List of follow-up suggestions
        """
        entity_type = self._detect_entity_type(query, answer, context)
        
        if not entity_type:
            return []
        
        suggestions = self.FOLLOW_UPS.get(entity_type, [])
        
        if not suggestions:
            return []
        
        # Return random unique suggestions
        count = min(count, len(suggestions))
        return random.sample(suggestions, count)


# Global instance
_followup_generator = None

def get_followup_generator() -> FollowUpGenerator:
    """Get or create follow-up generator singleton"""
    global _followup_generator
    if _followup_generator is None:
        _followup_generator = FollowUpGenerator()
    return _followup_generator
