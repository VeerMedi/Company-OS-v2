"""
Language Detection Utility for Voice Agent
Detects if user is speaking in English or Hinglish to enforce proper language in responses
"""

def detect_language(text: str) -> str:
    """
    Detect if text is in English, Hinglish, or Hindi with improved accuracy
    
    Args:
        text: User input text (transcribed query)
        
    Returns:
        'english', 'hinglish', or 'hindi'
    """
    if not text:
        return 'english'
    
    # Common Hindi words/phrases in Roman script
    hindi_keywords = {
        # Question words (STRONG indicators)
        'kya', 'kaise', 'kab', 'kahan', 'kyun', 'kon', 'kaun', 'kitna', 'kitne',
        # Common words
        'hai', 'hain', 'tha', 'thi', 'the', 'hoga', 'hogi', 'hoge',
        'aap', 'aapka', 'aapki', 'aapke', 'mere', 'mera', 'meri', 'mere',
        'batao', 'bata', 'bataye', 'dikha', 'dikhao', 'karo', 'karna', 'karke',
        'mujhe', 'humein', 'tumhe', 'tumhein', 'unhe', 'isko', 'usko',
        # Pronouns
        'main', 'hum', 'tum', 'wo', 'woh', 'yeh', 'ye', 'iske', 'uske',
        # Verbs
        'chahiye', 'chahta', 'chahti', 'chahte', 'chahe',
        'kar', 'karna', 'karo', 'karke', 'karte', 'karti', 'karta',
        'de', 'do', 'dena', 'dedo', 'deta', 'deti', 'dete',
        'le', 'lo', 'lena', 'lelo', 'leta', 'leti', 'lete',
        'ja', 'jao', 'jana', 'jata', 'jati', 'jate',
        'aa', 'aao', 'aana', 'aata', 'aati', 'aate',
        'ho', 'hona', 'hota', 'hoti', 'hote',
        'bol', 'bolo', 'bolna', 'bolta', 'bolti', 'bolte',
        # Prepositions
        'ka', 'ki', 'ke', 'ko', 'se', 'mein', 'par', 'pe', 'tak', 'liye',
        # Common phrases
        'achha', 'acha', 'theek', 'thik', 'nahi', 'nahin', 'haan', 'han', 'ha',
        'kuch', 'sabse', 'sabhi', 'koi', 'sab', 'bhi', 'toh', 'to',
        # Business terms in Hindi  
        'kaisa', 'kaise', 'kitna', 'kitne', 'kaam', 'log', 'baat',
        # Additional Hindi words
        'baare', 'bare', 'wale', 'wali', 'jan', 'sakte', 'sakta', 'sakti',
        'raha', 'rahe', 'rahi', 'gaya', 'gayi', 'gaye',
        # Conversational
        'dekho', 'dekh', 'suno', 'sun', 'pata', 'samajh', 'milega', 'hoga',
        'banao', 'banaya', 'koi', 'bhi', 'jo', 'agar', 'phir',
        # Greetings/Common
        'namaste', 'shukriya', 'dhanyavaad', 'alvida'
    }
    
    # Strong Hindi indicators (grammar markers, question words)
    strong_hindi_indicators = {
        'kya', 'kaise', 'kab', 'kahan', 'kyun', 'kon', 'kaun',
        'mujhe', 'batao', 'dikha', 'chahiye', 'hai', 'hain',
        'ka', 'ki', 'ke', 'ko', 'se'
    }
    
    # Common English technical/business words (helps distinguish from pure Hindi)
    english_keywords = {
        'project', 'task', 'status', 'team', 'manager', 'deadline',
        'employee', 'performance', 'analytics', 'report', 'data',
        'create', 'update', 'delete', 'show', 'list', 'get',
        'how', 'many', 'what', 'when', 'where', 'who', 'why',
        'the', 'is', 'are', 'was', 'were', 'have', 'has', 'had'
    }
    
    # Hindi sentence patterns (high confidence)
    hindi_patterns = [
        r'\b(mujhe|humein).*(batao|dikha|chahiye)\b',  # mujhe batao, humein dikha
        r'\b(kya|kaise|kab|kahan).*(hai|hain|tha|hogi)\b',  # kya hai, kaise hoga
        r'\b(mere|mera|meri).*(ka|ki|ke)\b',  # mere tasks ka
        r'\bke\s+baare\s+mein\b',  # ke baare mein
        r'\b(kitna|kitne|kaun|kon)\b',  # question words
    ]
    
    # Normalize and split text
    text_lower = text.lower().strip()
    words = text_lower.split()
    total_words = len(words)
    
    if total_words == 0:
        return 'english'
    
    # Check Hindi patterns first (HIGH confidence)
    import re
    pattern_matches = 0
    for pattern in hindi_patterns:
        if re.search(pattern, text_lower):
            pattern_matches += 1
    
    # If 2+ patterns match, it's definitely Hindi/Hinglish
    if pattern_matches >= 2:
        # Check if there are English words mixed
        english_count = sum(1 for word in words if word in english_keywords)
        if english_count > total_words * 0.3:  # >30% English
            return 'hinglish'
        else:
            return 'hindi'
    
    # Count Hindi and English words
    hindi_count = sum(1 for word in words if word in hindi_keywords)
    strong_hindi_count = sum(1 for word in words if word in strong_hindi_indicators)
    english_count = sum(1 for word in words if word in english_keywords)
    
    # Calculate percentages
    hindi_percentage = (hindi_count / total_words) * 100
    strong_percentage = (strong_hindi_count / total_words) * 100
    english_percentage = (english_count / total_words) * 100
    
    # Enhanced decision logic with confidence
    # If strong Hindi markers present (question words, grammar), prioritize Hindi
    if strong_percentage >= 15:  # 15%+ strong indicators = Hindi/Hinglish
        if english_percentage >= 40:  # But lots of English = Hinglish
            return 'hinglish'
        else:
            return 'hindi'
    
    # Pure Hindi: >60% Hindi words, <15% English
    if hindi_percentage >= 60 and english_percentage < 15:
        return 'hindi'
    
    # Hinglish: 15-60% Hindi with English mix
    elif hindi_percentage >= 15:
        return 'hinglish'
    
    # English: <15% Hindi words
    else:
        return 'english'



def get_language_instruction(language: str) -> str:
    """
    Get explicit language instruction for LLM based on detected language
    
    Args:
        language: 'english', 'hinglish', or 'hindi'
        
    Returns:
        Instruction string to prepend to system prompt
    """
    if language == 'hindi':
        return """CRITICAL: User is speaking in PURE HINDI (Romanized).
Respond ONLY in natural, conversational Hindi (Roman script).
Use Hindi words throughout - avoid English except for unavoidable technical terms.
Examples:
- "Aapke paanch projects hain jo abhi active hain."
- "Sabse zyada kaam Rahul kar rahe hain - unke barah tasks pending hain."
- "Team ka overall performance achha hai, pachassi percent tasks time pe complete ho rahe hain."
Keep it natural and conversational in Hindi."""
    elif language == 'hinglish':
        return """IMPORTANT: User is speaking in Hinglish (Hindi-English mix).
Respond in natural, conversational Hinglish. Use a mix of Hindi and English words as spoken in urban India.
Examples:
- "Aapke 5 projects hain jo abhi active hain."
- "Sabse zyada kaam Rahul kar raha hai - unke 12 tasks pending hain."
- "Team ka overall performance achha hai, 85% tasks time pe complete ho rahe hain."
Keep technical terms (project, task, deadline, status) in English but use Hindi for conversational flow."""
    else:
        return "IMPORTANT: User is speaking in English. Respond ONLY in fluent, professional English. Do NOT use Hindi words."


# Test cases
if __name__ == "__main__":
    test_cases = [
        ("Tell me about employees", "english"),
        ("What about the managers", "english"),
        ("Batao employees ke baare mein", "hinglish"),
        ("Kya hai projects ka status", "hinglish"),
        ("5 Of", "english"),  # Unclear transcription
        ("everyimblejay performic", "english"),  # Garbled English
        ("mujhe batao", "hinglish"),
        ("How many people on manager role", "english"),
        ("projects kitne hain", "hinglish"),
        ("hello how are you", "english"),
    ]
    
    print("Language Detection Tests:")
    print("=" * 60)
    for text, expected in test_cases:
        detected = detect_language(text)
        status = "✓" if detected == expected else "✗"
        print(f"{status} '{text}' → {detected} (expected: {expected})")
