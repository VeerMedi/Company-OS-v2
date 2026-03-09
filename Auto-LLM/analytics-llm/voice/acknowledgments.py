"""
Acknowledgment Phrases System
Provides immediate audio feedback while RAG processes the query
"""

import random
from typing import Optional, Dict, Any

class AcknowledgmentManager:
    """Manages acknowledgment phrases for natural voice interaction"""
    
    # Acknowledgments categorized by query type
    ACKNOWLEDGMENTS = {
        'search': [
            "Let me check that for you...",
            "Looking that up now...",
            "One moment, searching...",
            "Let me find that information...",
            "Checking the data...",
        ],
        'analysis': [
            "Let me analyze that...",
            "Good question, analyzing now...",
            "Let me look into that...",
            "Checking those details...",
            "Let me pull that report...",
        ],
        'action': [
            "Sure, working on that...",
            "Got it, processing...",
            "Okay, let me handle that...",
            "On it, one moment...",
            "Alright, setting that up...",
        ],
        'status': [
            "Checking the status...",
            "Let me see what's happening...",
            "Looking at the current state...",
            "Checking updates...",
            "Let me get you the latest...",
        ],
        'general': [
            "One moment...",
            "Let me check...",
            "Hmm, let me see...",
            "Looking into that...",
            "Give me a second...",
        ]
    }
    
    def __init__(self):
        """Initialize the acknowledgment manager"""
        pass
    
    def get_acknowledgment(self, query: str, category: Optional[str] = None) -> str:
        """
        Get appropriate acknowledgment phrase based on query
        
        Args:
            query: User's question
            category: Optional category hint
            
        Returns:
            Acknowledgment phrase
        """
        # Detect query type from keywords
        query_lower = query.lower()
        
        # Check for action keywords
        action_keywords = ['create', 'add', 'assign', 'update', 'delete', 'set']
        if any(word in query_lower for word in action_keywords):
            return random.choice(self.ACKNOWLEDGMENTS['action'])
        
        # Check for analysis keywords
        analysis_keywords = ['analyze', 'report', 'summary', 'insights', 'performance']
        if any(word in query_lower for word in analysis_keywords):
            return random.choice(self.ACKNOWLEDGMENTS['analysis'])
        
        # Check for status keywords
        status_keywords = ['status', 'progress', 'happening', 'current', 'latest']
        if any(word in query_lower for word in status_keywords):
            return random.choice(self.ACKNOWLEDGMENTS['status'])
        
        # Check for search keywords
        search_keywords = ['what', 'who', 'when', 'where', 'which', 'how many', 'show', 'list']
        if any(word in query_lower for word in search_keywords):
            return random.choice(self.ACKNOWLEDGMENTS['search'])
        
        # Default to general
        return random.choice(self.ACKNOWLEDGMENTS['general'])
    
    def should_acknowledge(self, query: str) -> bool:
        """
        Determine if acknowledgment should be played
        
        Args:
            query: User's question
            
        Returns:
            True if acknowledgment should play
        """
        # Don't acknowledge very short queries (greetings, etc.)
        if len(query.split()) <= 2:
            return False
        
        # Don't acknowledge simple confirmations
        confirmations = ['yes', 'no', 'okay', 'ok', 'sure', 'thanks']
        if query.lower().strip() in confirmations:
            return False
        
        return True


# Global instance
_acknowledgment_manager = None

def get_acknowledgment_manager() -> AcknowledgmentManager:
    """Get or create acknowledgment manager singleton"""
    global _acknowledgment_manager
    if _acknowledgment_manager is None:
        _acknowledgment_manager = AcknowledgmentManager()
    return _acknowledgment_manager
