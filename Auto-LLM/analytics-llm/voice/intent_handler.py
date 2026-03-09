import re
import random
from typing import Dict, Any, List, Optional
from rag.rag_agent import RAGAgent

class IntentHandler:
    """
    Handles intent classification and filler response generation.
    Optimized for speed to allow instant feedback.
    """
    
    # Intents
    INTENT_LEAVE_BALANCE = "leave_balance"
    INTENT_APPLY_LEAVE = "apply_leave"
    INTENT_PROJECT_STATUS = "project_status"
    INTENT_TEAM_PERFORMANCE = "team_performance"
    INTENT_CREATE_TASK = "create_task"
    INTENT_SMALL_TALK = "small_talk"
    INTENT_UNKNOWN = "unknown"
    
    # Filler phrases mapped to intents
    FILLERS = {
        INTENT_LEAVE_BALANCE: [
            "Let me check your leave balance...",
            "Checking your leaves...",
            "One moment, pulling up your leave records...",
            "Let's see how many leaves you have..."
        ],
        INTENT_APPLY_LEAVE: [
            "Okay, opening the leave application...",
            "Right, let's get that leave sorted...",
            "Checking the calendar for you..."
        ],
        INTENT_PROJECT_STATUS: [
            "Pulling up project details...",
            "Let me check the latest project updates...",
            "Scanning project status..."
        ],
        INTENT_TEAM_PERFORMANCE: [
            "Analyzing team performance metrics...",
            "Let me look at the team's data...",
            "Gathering performance insights..."
        ],
        INTENT_CREATE_TASK: [
            "Okay, let's create that task...",
            "Noting that down...",
            "Setting up a new task..."
        ],
        INTENT_UNKNOWN: [
            "Hmm, let me think about that...",
            "Just a moment...",
            "Let me check on that...",
            "Processing that..."
        ]
    }
    
    def __init__(self):
        self.llm_agent = RAGAgent()
    
    def detect_intent(self, text: str) -> Dict[str, Any]:
        """
        Detect intent from text using hybrid approach (Rules -> LLM).
        Returns:
            {
                "intent": str,
                "needs_rag": bool,
                "urgency": "low|normal|high",
                "confidence": float
            }
        """
        text_lower = text.lower()
        
        # 1. Fast Rule-Based Detection
        
        # Leave Balance
        if any(p in text_lower for p in ["how many leaves", "leave balance", "leaves left", "paid leaves", "sick leaves"]):
            return {
                "intent": self.INTENT_LEAVE_BALANCE,
                "needs_rag": True, # Needs checking DB
                "urgency": "normal",
                "confidence": 0.9
            }
            
        # Apply Leave
        if any(p in text_lower for p in ["apply for leave", "take a leave", "want a leave", "taking off", "vacation"]):
            return {
                "intent": self.INTENT_APPLY_LEAVE,
                "needs_rag": True, # Needs checking calendar/policy
                "urgency": "normal",
                "confidence": 0.9
            }
            
        # Project Status
        if any(p in text_lower for p in ["project status", "project at risk", "how is project", "project update"]):
            return {
                "intent": self.INTENT_PROJECT_STATUS,
                "needs_rag": True,
                "urgency": "high" if "risk" in text_lower else "normal",
                "confidence": 0.8
            }
            
        # Create Task (Action) - EXPANDED patterns for voice
        task_patterns = [
            "create task", "assign task", "add task", "new task",
            "tell ", " to ", "remind ", "assign", "give ",
            "make a task", "set up a task", "task for"
        ]
        # Check for action patterns - must have "to [person]" or "for [person]" structure  
        has_task_pattern = any(p in text_lower for p in task_patterns)
        has_action_target = any(word in text_lower for word in [" to ", " for ", "tell ", "remind ", "assign "])
        
        if has_task_pattern or (has_action_target and len(text.split()) > 4):
            return {
                "intent": self.INTENT_CREATE_TASK,
                "needs_rag": True, # Needs context to fill details
                "urgency": "normal",
                "confidence": 0.9
            }
            
        # Small Talk (No RAG)
        if any(p in text_lower for p in ["hello", "hi", "hey", "how are you", "good morning", "good evening"]):
            # Only if it's short, otherwise might be "Hi, tell me about..."
            if len(text.split()) < 5:
                return {
                    "intent": self.INTENT_SMALL_TALK,
                    "needs_rag": False,
                    "urgency": "low",
                    "confidence": 0.95
                }

        # 2. Fallback to LLM Classification (slower but more accurate)
        # For now, return unknown so we don't block. 
        # In a full async pipeline, we could race this, but rule-based is sufficient for "Instant" requirement.
        
        return {
            "intent": self.INTENT_UNKNOWN,
            "needs_rag": True, # Default to True to be safe
            "urgency": "normal",
            "confidence": 0.5
        }

    def get_filler_phrase(self, intent: str) -> str:
        """Get a random filler phrase for the detected intent"""
        phrases = self.FILLERS.get(intent, self.FILLERS[self.INTENT_UNKNOWN])
        return random.choice(phrases)
