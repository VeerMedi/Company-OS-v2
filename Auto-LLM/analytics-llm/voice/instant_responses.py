"""
Instant Responses System for Voice Agent
Provides immediate responses for common queries without RAG overhead.
"""
from typing import Optional, Dict, List
import random


class InstantResponseManager:
    """
    Manages instant responses for common voice interactions.
    Bypasses RAG for greetings, thanks, small talk, etc.
    """
    
    # Response categories with variations
    RESPONSES = {
        "greeting": [
            "Hello! How can I help you today?",
            "Hi there! What can I do for you?",
            "Hey! What would you like to know?",
            "Hello! Ready when you are.",
            "Hi! What's on your mind?",
        ],
        "greeting_time_morning": [
            "Good morning! What can I help with?",
            "Morning! How can I assist you?",
            "Good morning! Ready to help.",
        ],
        "greeting_time_afternoon": [
            "Good afternoon! What do you need?",
            "Afternoon! How can I help?",
        ],
        "greeting_time_evening": [
            "Good evening! What can I do for you?",
            "Evening! How may I assist?",
        ],
        "goodbye": [
            "Goodbye! Have a great day!",
            "See you later! Take care!",
            "Bye! Feel free to ask anytime.",
            "Take care! Come back anytime.",
        ],
        "thanks": [
            "You're welcome!",
            "Happy to help!",
            "Anytime!",
            "Glad I could assist!",
            "My pleasure!",
        ],
        "small_talk_how_are_you": [
            "I'm doing great, thanks for asking! How can I help you?",
            "I'm here and ready to help! What do you need?",
            "All good! What can I do for you?",
        ],
        "small_talk_whats_up": [
            "Not much! Just ready to help. What do you need?",
            "Ready to assist! What's on your mind?",
            "All set! How can I help?",
        ],
        "confirmation": [
            "Got it!",
            "Understood.",
            "Okay!",
            "Sure thing!",
        ],
        "negative": [
            "Alright, no problem!",
            "Okay, cancelled.",
            "Understood, I won't do that.",
        ],
        "unclear": [
            "I didn't quite catch that. Could you repeat?",
            "Sorry, could you say that again?",
            "I'm not sure I understood. Can you rephrase?",
        ],
        "help": [
            "I can help you with tasks, analytics, project information, and team details. What would you like to know?",
            "You can ask me about your projects, tasks, team members, or analytics. What interests you?",
        ],
    }
    
    # Hinglish response variations
    RESPONSES_HINGLISH = {
        "greeting": [
            "Namaste! Main aapki kaise help kar sakta hoon?",
            "Hello! Bataiye, kya karna hai?",
            "Hey! Main ready hoon help karne ke liye.",
            "Hi! Kya janna chahte ho?",
        ],
        "greeting_time_morning": [
            "Subah ho gayi! Kya help chahiye?",
            "Good morning! Bataiye kya karna hai?",
        ],
        "greeting_time_afternoon": [
            "Good afternoon! Kaise madad karoon?",
            "Dopahar ho gayi! Kya chahiye?",
        ],
        "greeting_time_evening": [
            "Good evening! Kya help chahiye?",
            "Namaskar! Kaise madad karoon?",
        ],
        "goodbye": [
            "Alvida! Aapka din achha rahe!",
            "Bye bye! Koi help ho toh bata dena.",
            "Phir milenge! Take care!",
        ],
        "thanks": [
            "Koi baat nahi!",
            "Happy to help!",
            "Welcome ji!",
            "Anytime! Kuch aur chahiye?",
        ],
        "small_talk_how_are_you": [
            "Main badhiya! Aap bataiye, kya help chahiye?",
            "Sab theek! Kaise madad karoon?",
            "All good! Bolo kya karna hai?",
        ],
        "small_talk_whats_up": [
            "Bas ready hoon help karne ke liye! Bolo?",
            "Kuch nahi yaar, work hi work! Kya chahiye?",
        ],
        "confirmation": [
            "Achha!",
            "Theek hai!",
            "Samajh gaya!",
            "Done!",
        ],
        "negative": [
            "Theek hai, koi baat nahi!",
            "Okay, cancel kar diya.",
            "No problem!",
        ],
        "unclear": [
            "Sorry, samajh nahi aaya. Phir se bologe?",
            "Thoda clearly bologe please?",
            "Ek baar aur bolo, samajh nahi aaya.",
        ],
        "help": [
            "Main aapko tasks, projects, team aur analytics ke baare mein bata sakta hoon. Kya janna hai?",
            "Pooch lo jo bhi janna ho - projects, tasks, ya team ke baare mein!",
        ],
    }
    
    # Pure Hindi response variations (for 70%+ Hindi speech)
    RESPONSES_HINDI = {
        "greeting": [
            "Namaste! Main aapki kaise madad kar sakta hoon?",
            "Namaskar! Kya chahiye aapko?",
            "Namaste ji! Main yahan hoon madad karne ke liye.",
        ],
        "greeting_time_morning": [
            "Subah bakhair! Kya madad chahiye?",
            "Shubh prabhat! Kaise madad karoon?",
        ],
        "greeting_time_afternoon": [
            "Dopahar ko pranam! Kya chahiye?",
            "Namaste! Kaise madad kar sakta hoon?",
        ],
        "greeting_time_evening": [
            "Shubh sandhya! Kya madad chahiye?",
            "Namaste! Kaise madad karoon?",
        ],
        "goodbye": [
            "Namaste! Aapka din shubh rahe!",
            "Alvida! Dhanyavaad!",
            "Phir milenge!",
        ],
        "thanks": [
            "Koi baat nahi!",
            "Swagat hai!",
            "Khushi hui madad karke!",
        ],
        "small_talk_how_are_you": [
            "Main bilkul theek hoon! Aap bataiye, kya madad chahiye?",
            "Sab achha hai! Aap kaise hain?",
        ],
        "small_talk_whats_up": [
            "Bas aapki seva mein taiyaar hoon! Bataiye?",
            "Kuch khaas nahi! Aap bataiye kya chahiye?",
        ],
        "confirmation": [
            "Theek hai!",
            "Haan samjh gaya!",
            "Bilkul!",
        ],
        "negative": [
            "Theek hai, koi baat nahi!",
            "Samjh gaya, raddh kiya.",
        ],
        "unclear": [
            "Maaf kijiye, samajh nahi aaya. Dobara boliye?",
            "Kripya phir se kahiye, sunai nahi diya.",
        ],
        "help": [
            "Main aapko projects, tasks, team aur sabhi cheez ke baare mein bata sakta hoon. Kya jaanna chahte hain?",
            "Poochiye jo bhi jaanna ho - kaam, team ya kuch bhi!",
        ],
    }
    
    # Intent detection patterns (lowercase, stemmed)
    PATTERNS = {
        "greeting": {
            "keywords": ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", 
                        "morning", "afternoon", "evening", "namaste", "howdy", "hola"],
            "max_words": 7,
            "exclude_keywords": ["create", "make", "show", "tell", "what", "who", "when", "where"]  # Question words = not just greeting
        },
        "goodbye": {
            "keywords": ["bye", "goodbye", "good bye", "see you", "see ya", "goodnight", 
                        "good night", "bye bye", "later", "catch you later",
                        "alvida", "phir milenge", "ta ta", "tata", "namaste"],  # Hindi/Hinglish
            "max_words": 5,
            "exclude_keywords": ["create", "make"]
        },
        "thanks": {
            "keywords": ["thank you", "thanks", "thankyou", "thank", "thx", "ty", 
                        "appreciate it", "shukriya", "dhanyavaad"],
            "max_words": 6,
            "exclude_keywords": []
        },
        "small_talk_how_are_you": {
            "keywords": ["how are you", "how're you", "hows it going", "how's it going",
                        "how are things", "you okay", "you good", "kaise ho", "kya haal"],
            "max_words": 8,
            "exclude_keywords": []
        },
        "small_talk_whats_up": {
            "keywords": ["whats up", "what's up", "wassup", "sup", "what up"],
            "max_words": 5,
            "exclude_keywords": []
        },
        "confirmation": {
            "keywords": ["yes", "yeah", "yep", "yup", "sure", "ok", "okay", "alright",
                        "correct", "right", "exactly", "han", "haan"],
           "max_words": 3,
            "exclude_keywords": []
        },
        "negative": {
            "keywords": ["no", "nope", "nah", "not now", "never mind", "nevermind",
                        "forget it", "dont", "don't", "nahi"],
            "max_words": 4,
            "exclude_keywords": ["create", "make"]
        },
        "help": {
            "keywords": ["help", "what can you do", "how do i", "how can i",
                        "capabilities", "features", "commands"],
            "max_words": 10,
            "exclude_keywords": ["specific project", "specific task"]  # Specific help = RAG query
        },
    }
    
    def __init__(self):
        self.enabled = True
        self.usage_stats = {}  # Track usage for analytics
    
    def detect_intent(self, text: str) -> Optional[str]:
        """
        Detect if text matches an instant response intent.
        
        Args:
            text: User's transcribed text
            
        Returns:
            Intent name if matched, None otherwise
        """
        if not self.enabled:
            return None
            
        # Normalize text
        text_lower = text.lower().strip()
        text_clean = self._clean_text(text_lower)
        word_count = len(text_clean.split())
        
        # Check each pattern
        for intent, pattern in self.PATTERNS.items():
            max_words = pattern.get("max_words", 10)
            
            # Skip if too long (likely a real question)
            if word_count > max_words:
                continue
            
            # Check exclude keywords first
            exclude_keywords = pattern.get("exclude_keywords", [])
            if any(kw in text_clean for kw in exclude_keywords):
                continue
            
            # Check if any keyword matches
            keywords = pattern["keywords"]
            for keyword in keywords:
                # Use word boundary matching
                if self._matches_whole_phrase(text_clean, keyword):
                    # Track usage
                    self.usage_stats[intent] = self.usage_stats.get(intent, 0) + 1
                    return intent
        
        return None
    
    def get_response(self, intent: str, context: Optional[Dict] = None, user_text: str = None) -> Optional[str]:
        """
        Get instant response for the given intent.
        
        Args:
            intent: Detected intent
            context: Optional context (time of day, user info, etc.)
            user_text: Original user text for language detection
            
        Returns:
            Response text if available, None otherwise
        """
        # Detect language from user text (english/hinglish/hindi)
        language = 'english'
        if user_text:
            language = self._detect_language_simple(user_text)
        
        # Handle time-based greetings
        if intent == "greeting" and context and "time_of_day" in context:
            time_intent = f"greeting_time_{context['time_of_day']}"
            if time_intent in self.RESPONSES:
                intent = time_intent
        
        # Select response set based on detected language
        if language == 'hindi':
            responses = self.RESPONSES_HINDI.get(intent) or self.RESPONSES_HINGLISH.get(intent) or self.RESPONSES.get(intent)
        elif language == 'hinglish':
            responses = self.RESPONSES_HINGLISH.get(intent) or self.RESPONSES.get(intent)
        else:
            responses = self.RESPONSES.get(intent)
        
        if not responses:
            return None
        
        # Return random variation
        return random.choice(responses)
    
    def _detect_language_simple(self, text: str) -> str:
        """
        Simple language detection for instant responses.
        Returns 'english', 'hinglish', or 'hindi'
        """
        hindi_keywords = {
            'namaste', 'kaise', 'kya', 'haal', 'shukriya', 'dhanyavaad',
            'han', 'haan', 'nahi', 'achha', 'theek', 'bolo', 'batao',
            'hai', 'hain', 'mera', 'meri', 'aap', 'aapka',
            'chahiye', 'karo', 'batao', 'main', 'hum'
        }
        english_keywords = {'project', 'task', 'team', 'status', 'show', 'list'}
        
        words = set(text.lower().split())
        hindi_count = len(words.intersection(hindi_keywords))
        english_count = len(words.intersection(english_keywords))
        total_words = len(words)
        
        if total_words == 0:
            return 'english'
        
        hindi_pct = (hindi_count / total_words) * 100
        english_pct = (english_count / total_words) * 100
        
        # Pure Hindi: >70% Hindi, <10% English
        if hindi_pct >= 70 and english_pct < 10:
            return 'hindi'
        # Hinglish: 20-70% Hindi
        elif hindi_pct >= 20:
            return 'hinglish'
        # English: <20% Hindi
        else:
            return 'english'
    
    def _clean_text(self, text: str) -> str:
        """Remove punctuation and extra spaces."""
        import re
        text = re.sub(r'[?!.,;:]', '', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def _matches_whole_phrase(self, text: str, phrase: str) -> bool:
        """Check if phrase matches as whole words (not substring)."""
        import re
        # Create pattern for whole word/phrase matching
        pattern = r'\b' + re.escape(phrase) + r'\b'
        return bool(re.search(pattern, text))
    
    def get_stats(self) -> Dict:
        """Get usage statistics."""
        total = sum(self.usage_stats.values())
        return {
            "total_instant_responses": total,
            "by_intent": self.usage_stats.copy(),
            "enabled": self.enabled
        }
    
    def reset_stats(self):
        """Reset usage statistics."""
        self.usage_stats = {}


# Singleton instance
_instant_response_manager = None

def get_instant_response_manager() -> InstantResponseManager:
    """Get singleton instant response manager."""
    global _instant_response_manager
    if _instant_response_manager is None:
        _instant_response_manager = InstantResponseManager()
    return _instant_response_manager
