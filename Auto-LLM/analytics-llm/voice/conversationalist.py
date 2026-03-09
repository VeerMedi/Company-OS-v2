from rag.rag_agent import RAGAgent
import re

class ConversationalRewriter:
    """
    Rewrites formal RAG outputs into natural, conversational speech.
    """
    
    SYSTEM_PROMPT = """
You are rewriting text for VOICE OUTPUT. Be conversational but complete.

CRITICAL RULES:
1. **Answer the ACTUAL question asked** - If user asks "what is X about?", describe X first
2. **Context matters** - Prioritize information that directly answers the query
3. **Be complete** - Include key details (3-5 sentences for descriptions, 2-3 for facts)
4. **Natural speech** - Use contractions ("you've", "it's", "there's")
5. **No filler phrases** - Skip "According to", "Based on", "The data shows"
6. **Conversational flow** - Like explaining to a colleague

ANSWER QUALITY:
- Project questions → Start with description/purpose, then add stats
- Leave questions → State the numbers directly
- List questions → Give 2-3 examples + total count
- Status questions → Current status first, then details

VOICE STYLE:
- Friendly but professional
- Direct and actionable  
- Conversational

Examples:
❌ BAD (stats without context): "Project completion rate is 75% with 3 active tasks."
✅ GOOD: "Vlite is a service onboarding platform. It's 75% complete with 3 active tasks."

❌ BAD (too formal): "According to our records, you have 8 paid leave days remaining."
✅ GOOD: "You've got 8 paid leaves left."
    """
    
    def __init__(self):
        self.llm_agent = RAGAgent()
        
    def rewrite(self, text: str, query: str = "") -> str:
        """
        Rewrite text to be conversational.
        
        Args:
            text: The text to rewrite
            query: Original user query (helps determine if completeness is needed)
        """
        # OPTIMIZATION: Skip rewriting for task confirmations (already optimized)
        if any(keyword in text.lower() for keyword in ['creating', 'confirm?', 'task for', 'due ']):
            # This is likely a task confirmation - already optimized, don't rewrite
            return text
        
        # Check if user wants complete lists/all items
        wants_complete = any(word in query.lower() for word in ['all', 'list', 'name', 'every', 'each'])
        
        # If text is very short, just return it (save latency)
        if len(text.split()) < 5:
            return text
        
        # Build context-aware prompt
        if wants_complete:
            prompt_suffix = "\n\nIMPORTANT: User asked for COMPLETE information. DO NOT summarize or use 'and X more'. List everything."
        else:
            prompt_suffix = ""
            
        prompt = f"{self.SYSTEM_PROMPT}{prompt_suffix}\n\nInput Text: \"{text}\"\n\nOutput:"
        
        try:
            # Use the existing LLM agent to generate content
            rewritten = self.llm_agent._generate_content(prompt)
            return self._clean_output(rewritten)
        except Exception as e:
            print(f"Error in conversational rewrite: {e}")
            return text # Fallback to original
            
    def _clean_output(self, text: str) -> str:
        """Remove quotes and extra whitespace"""
        text = text.strip()
        if text.startswith('"') and text.endswith('"'):
            text = text[1:-1]
        return text.strip()
