"""
Conversation Context Memory
Maintains conversation history and context for multi-turn dialogues
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import deque

class ConversationMemory:
    """Manages conversation context and history"""
    
    def __init__(self, max_turns: int = 10, context_timeout_minutes: int = 30):
        """
        Initialize conversation memory
        
        Args:
            max_turns: Maximum number of turns to remember
            context_timeout_minutes: How long to keep context before expiring
        """
        self.max_turns = max_turns
        self.context_timeout = timedelta(minutes=context_timeout_minutes)
        
        # Store conversations by session ID
        self.sessions: Dict[str, Dict[str, Any]] = {}
    
    def add_turn(
        self,
        session_id: str,
        user_query: str,
        agent_response: str,
        entities: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Add a conversation turn to memory
        
        Args:
            session_id: Unique session identifier
            user_query: What the user asked
            agent_response: Agent's response
            entities: Extracted entities (names, projects, etc.)
            metadata: Additional metadata
        """
        # Initialize session if needed
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                'created_at': datetime.now(),
                'last_activity': datetime.now(),
                'turns': deque(maxlen=self.max_turns),
                'entities': {},  # Accumulated entities
                'context': {}    # Current context
            }
        
        session = self.sessions[session_id]
        session['last_activity'] = datetime.now()
        
        # Add turn
        turn = {
            'timestamp': datetime.now(),
            'user_query': user_query,
            'agent_response': agent_response,
            'entities': entities or [],
            'metadata': metadata or {}
        }
        session['turns'].append(turn)
        
        # Update entity tracking
        if entities:
            for entity in entities:
                entity_type = entity.get('type')
                entity_name = entity.get('name')
                if entity_type and entity_name:
                    if entity_type not in session['entities']:
                        session['entities'][entity_type] = []
                    if entity_name not in session['entities'][entity_type]:
                        session['entities'][entity_type].append(entity_name)
        
        # Update context
        self._update_context(session, user_query, agent_response)
    
    def get_context(self, session_id: str) -> Dict[str, Any]:
        """
        Get current conversation context
        
        Args:
            session_id: Session identifier
            
        Returns:
            Context dictionary
        """
        # Clean expired sessions
        self._clean_expired_sessions()
        
        if session_id not in self.sessions:
            return {'turns': [], 'entities': {}, 'context': {}}
        
        session = self.sessions[session_id]
        
        return {
            'turns': list(session['turns']),
            'entities': session['entities'],
            'context': session['context'],
            'turn_count': len(session['turns'])
        }
    
    def get_recent_turns(self, session_id: str, count: int = 3) -> List[Dict[str, Any]]:
        """
        Get recent conversation turns
        
        Args:
            session_id: Session identifier
            count: Number of recent turns to retrieve
            
        Returns:
            List of recent turns
        """
        if session_id not in self.sessions:
            return []
        
        turns = list(self.sessions[session_id]['turns'])
        return turns[-count:] if turns else []
    
    def resolve_reference(self, session_id: str, pronoun: str) -> Optional[str]:
        """
        Resolve pronoun references (he, she, they, it)
        
        Args:
            session_id: Session identifier
            pronoun: Pronoun to resolve
            
        Returns:
            Resolved entity name or None
        """
        context = self.get_context(session_id)
        
        # Get most recent entity of appropriate type
        pronouns_map = {
            'he': ['employee', 'manager'],
            'she': ['employee', 'manager'],
            'they': ['employee', 'team'],
            'it': ['project', 'task']
        }
        
        entity_types = pronouns_map.get(pronoun.lower(), [])
        
        for entity_type in entity_types:
            if entity_type in context['entities'] and context['entities'][entity_type]:
                return context['entities'][entity_type][-1]  # Most recent
        
        return None
    
    def _update_context(self, session: Dict[str, Any], query: str, response: str):
        """
        Update conversation context based on latest turn
        
        Args:
            session: Session data
            query: User query
            response: Agent response
        """
        # Track topic/focus
        topics = {
            'tasks': ['task', 'todo', 'assignment'],
            'projects': ['project', 'initiative'],
            'employees': ['employee', 'developer', 'manager', 'person'],
            'performance': ['performance', 'metrics', 'stats'],
            'status': ['status', 'progress', 'at risk']
        }
        
        query_lower = query.lower()
        
        for topic, keywords in topics.items():
            if any(keyword in query_lower for keyword in keywords):
                session['context']['current_topic'] = topic
                break
    
    def _clean_expired_sessions(self):
        """Remove expired sessions"""
        now = datetime.now()
        expired = [
            sid for sid, session in self.sessions.items()
            if now - session['last_activity'] > self.context_timeout
        ]
        
        for sid in expired:
            del self.sessions[sid]
    
    def clear_session(self, session_id: str):
        """Clear a specific session"""
        if session_id in self.sessions:
            del self.sessions[session_id]


# Global instance
_conversation_memory = None

def get_conversation_memory() -> ConversationMemory:
    """Get or create conversation memory singleton"""
    global _conversation_memory
    if _conversation_memory is None:
        _conversation_memory = ConversationMemory()
    return _conversation_memory
