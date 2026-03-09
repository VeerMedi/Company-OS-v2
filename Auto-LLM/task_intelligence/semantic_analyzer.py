"""
Semantic Analyzer
Extracts semantic features from task title and description
v1.1.0: Added confidence scoring and buzzword detection
"""

import re
from typing import Dict, List, Tuple
from .config import (
    TECHNICAL_KEYWORDS, EFFORT_KEYWORDS, AMBIGUITY_KEYWORDS,
    DEPENDENCY_KEYWORDS, BLAST_RADIUS_KEYWORDS, SKILL_KEYWORDS,
    CROSS_DOMAIN_KEYWORDS, BUZZWORDS, BUZZWORD_THRESHOLD, MAX_BUZZWORD_PENALTY
)
from .exceptions import SemanticAnalysisError


class SemanticAnalyzer:
    """Analyzes task text to extract semantic features"""
    
    def __init__(self):
        self.stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'}
    
    
    def analyze_task(self, title: str, description: str, phase: str, dependencies: List[str] = None) -> Tuple[Dict, float]:
        """
        Analyze task and return semantic features with confidence score
        
        Args:
            title: Task title
            description: Task description
            phase: Task phase/bunch name
            dependencies: List of dependency task IDs or names
            
        Returns:
            Tuple of (features_dict, confidence_score)
            confidence_score ∈ [0.0, 1.0]
            
        Raises:
            SemanticAnalysisError: If text is invalid or too short
        """
        # Validation
        if not title or not title.strip():
            raise SemanticAnalysisError("Task title cannot be empty")
        if not description or not description.strip():
            raise SemanticAnalysisError("Task description cannot be empty")
        
        text = f"{title} {description}".lower()
        word_count = len(text.split())
        
        # Minimum text length check
        if word_count < 3:
            raise SemanticAnalysisError("Task description too short for analysis")
        
        # Extract semantic features
        features = {
            'technical_keywords': self._extract_technical_keywords(text),
            'effort_indicators':self._extract_effort_indicators(text),
            'ambiguity_markers': self._extract_ambiguity_markers(text),
            'dependency_count': len(dependencies) if dependencies else 0,
            'dependency_keywords': self._has_dependency_keywords(text),
            'blast_radius_level': self._assess_blast_radius(text),
            'skill_level_indicators': self._extract_skill_indicators(text),
            'cross_domain_detected': self._detect_cross_domain(text, phase),
            'word_count': word_count,
            'sentence_complexity': self._measure_sentence_complexity(description),
            'has_questions': '?' in text,
            'has_uncertainty': any(word in text for word in ['might', 'maybe', 'possibly', 'unclear', 'tbd'])
        }
        
        # v1.1.0: Buzzword detection
        buzzword_data = self._detect_buzzwords(text, word_count)
        features['buzzword_count'] = buzzword_data['count']
        features['buzzword_density'] = buzzword_data['density']
        features['inflation_penalty'] = buzzword_data['penalty']
        
        # v1.1.0: Calculate confidence score
        confidence = self._calculate_confidence(features, text)
        
        return features, confidence
    
    def _extract_technical_keywords(self, text: str) -> Dict[str, int]:
        """Count technical keywords by complexity level"""
        counts = {'high': 0, 'medium': 0, 'low': 0}
        
        for level, keywords in TECHNICAL_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    counts[level] += text.count(keyword)
        
        return counts
    
    def _extract_effort_indicators(self, text: str) -> Dict[str, int]:
        """Count effort indicator keywords"""
        counts = {'high': 0, 'medium': 0, 'low': 0}
        
        for level, keywords in EFFORT_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    counts[level] += 1
        
        return counts
    
    def _extract_ambiguity_markers(self, text: str) -> Dict[str, int]:
        """Count ambiguity markers"""
        counts = {'high': 0, 'medium': 0, 'low': 0}
        
        for level, keywords in AMBIGUITY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    counts[level] += 1
        
        return counts
    
    def _has_dependency_keywords(self, text: str) -> int:
        """Count dependency-related keywords"""
        count = 0
        for keyword in DEPENDENCY_KEYWORDS:
            if keyword in text:
                count += 1
        return count
    
    def _assess_blast_radius(self, text: str) -> str:
        """Assess impact level from keywords"""
        for level, keywords in BLAST_RADIUS_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    return level
        return 'minor'
    
    def _extract_skill_indicators(self, text: str) -> str:
        """Determine skill level from keywords"""
        for level, keywords in SKILL_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    return level
        return 'intermediate'
    
    def _detect_cross_domain(self, text: str, phase: str) -> bool:
        """Detect if task spans multiple domains"""
        # Check for cross-domain keywords
        for keyword in CROSS_DOMAIN_KEYWORDS:
            if keyword in text:
                return True
        
        # Check if phase itself indicates cross-domain
        if 'full stack' in phase.lower() or 'integration' in phase.lower():
            return True
        
        return False
    
    def _measure_sentence_complexity(self, description: str) -> float:
        """Measure sentence complexity (avg words per sentence)"""
        if not description:
            return 0.0
        
        sentences = re.split(r'[.!?]+', description)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if not sentences:
            return 0.0
        
        total_words = sum(len(s.split()) for s in sentences)
        return total_words / len(sentences)
    
    def _detect_buzzwords(self, text: str, word_count: int) -> Dict:
        """
        Detect buzzword stuffing and calculate inflation penalty
       
        Returns:
            {
                'count': int,           # Number of buzzwords found
                'density': float,       # Buzzwords / total words
                'penalty': float        # Inflation penalty (0.0-0.20)
            }
        """
        buzzword_count = 0
        for buzzword in BUZZWORDS:
            if buzzword in text:
                buzzword_count += text.count(buzzword)
        
        density = buzzword_count / word_count if word_count > 0 else 0.0
        
        # Apply penalty if density exceeds threshold
        if density > BUZZWORD_THRESHOLD:
            # Penalty increases with density, capped at MAX_BUZZWORD_PENALTY
            penalty = min(density * 0.4, MAX_BUZZWORD_PENALTY)
        else:
            penalty = 0.0
        
        return {
            'count': buzzword_count,
            'density': round(density, 4),
            'penalty': round(penalty, 4)
        }
    
    def _calculate_confidence(self, features: Dict, text: str) -> float:
        """
        Calculate confidence score (0.0-1.0) based on text quality
        
        Confidence factors:
        - Text length (sufficient content → +0.25)
        - Keyword matches (indicator signals → +0.25)
        - Low ambiguity (clear requirements → +0.25)
        - Sentence clarity (readable structure → +0.25)
        
        Returns:
            Confidence score ∈ [0.0, 1.0]
        """
        confidence = 0.0
        
        # Factor 1: Text length (20+ words = good)
        word_count = features['word_count']
        if word_count >= 50:
            confidence += 0.25
        elif word_count >= 20:
            confidence += 0.15
        elif word_count >= 10:
            confidence += 0.10
        
        # Factor 2: Keyword matches (indicators found)
        tech_total = sum(features['technical_keywords'].values())
        effort_total = sum(features['effort_indicators'].values())
        if tech_total > 0 or effort_total > 0:
            confidence += 0.25
        
        # Factor 3: Low ambiguity (clear task)
        if not features['has_questions'] and not features['has_uncertainty']:
            confidence += 0.25
        elif not features['has_questions'] or not features['has_uncertainty']:
            confidence += 0.15
        
        # Factor 4: Sentence clarity (10-25 words/sentence = readable)
        complexity = features['sentence_complexity']
        if 10.0 <= complexity <= 25.0:
            confidence += 0.25
        elif 5.0 <= complexity < 10.0 or 25.0 < complexity <= 35.0:
            confidence += 0.15
        
        # Confidence reduction for excessive buzzwords
        if features['buzzword_density'] > BUZZWORD_THRESHOLD:
            confidence *= 0.9  # 10% reduction
        
        return round(min(confidence, 1.0), 2)
