"""
STT Correction using LLM
Fixes common transcription errors in business context
"""
from openai import OpenAI
from typing import Dict, Any
import os


class STTCorrector:
    """Corrects STT transcription errors using lightweight LLM"""
    
    def __init__(self):
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY")
        )
        self.model = "openai/gpt-4o-mini"  # Fast and cheap
        
        # Common business domain corrections
        self.correction_prompt = """You are fixing speech-to-text errors in business queries.

CONTEXT: This is a business management system. Common topics:
- Employees, managers, developers, HR
- Projects, tasks, deadlines
- Leaves (vacation, sick leave)
- Analytics, reports

COMMON STT ERRORS:
- "release" → often should be "leave" (employee leave)
- "close contact" → often "employees" 
- "you have been" → often "employees are"
- Numbers misheard

TASK: Fix ONLY obvious errors. Keep the original if unclear.

Original: "{original}"

If this looks like a business query with STT errors, provide the corrected version.
If it seems correct already, return the original unchanged.

Corrected version (just the text, no explanation):"""
    
    def correct(self, transcribed_text: str) -> Dict[str, Any]:
        """
        Correct transcription errors using LLM
        
        Args:
            transcribed_text: Original STT output
            
        Returns:
            Dict with corrected text and metadata
        """
        # Skip correction for very short text (greetings, etc.)
        if len(transcribed_text.split()) < 3:
            return {
                "original": transcribed_text,
                "corrected": transcribed_text,
                "changed": False,
                "confidence": 1.0
            }
        
        # Skip if it's clearly a greeting
        greetings = ["hi", "hello", "hey", "thanks", "thank you", "bye", "goodbye"]
        if any(g in transcribed_text.lower() for g in greetings) and len(transcribed_text.split()) < 5:
            return {
                "original": transcribed_text,
                "corrected": transcribed_text,
                "changed": False,
                "confidence": 1.0
            }
        
        try:
            # Call LLM for correction
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": self.correction_prompt.format(original=transcribed_text)}
                ],
                temperature=0.1,  # Low temperature for consistent corrections
                max_tokens=100
            )
            
            corrected = response.choices[0].message.content.strip()
            
            # Remove quotes if LLM added them
            corrected = corrected.strip('"').strip("'")
            
            changed = corrected.lower() != transcribed_text.lower()
            
            return {
                "original": transcribed_text,
                "corrected": corrected,
                "changed": changed,
                "confidence": 0.9 if changed else 1.0
            }
            
        except Exception as e:
            print(f"⚠️ STT correction failed: {e}")
            # Return original on error
            return {
                "original": transcribed_text,
                "corrected": transcribed_text,
                "changed": False,
                "confidence": 0.5,
                "error": str(e)
            }


# Singleton instance
_stt_corrector = None

def get_stt_corrector() -> STTCorrector:
    """Get singleton STT corrector"""
    global _stt_corrector
    if _stt_corrector is None:
        _stt_corrector = STTCorrector()
    return _stt_corrector
