"""
Dimension Calculators
Calculate scores (0-10) for each complexity dimension
"""

from typing import Dict


class DimensionCalculators:
    """Calculate scores for all 7 complexity dimensions"""
    
    def calculate_all(self, semantic_features: Dict, phase: str) -> Dict[str, float]:
        """
        Calculate all dimension scores
        
        Returns:
            Dictionary with dimension scores (0-10)
        """
        return {
            'technical_depth': self.calculate_technical_depth(semantic_features, phase),
            'effort': self.calculate_effort(semantic_features),
            'ambiguity': self.calculate_ambiguity(semantic_features),
            'dependencies': self.calculate_dependencies(semantic_features),
            'blast_radius': self.calculate_blast_radius(semantic_features),
            'skill_level': self.calculate_skill_level(semantic_features),
            'cross_domain': self.calculate_cross_domain(semantic_features, phase)
        }
    
    def calculate_technical_depth(self, features: Dict, phase: str) -> float:
        """
        Calculate technical depth score (0-10)
        Higher for AI/Infrastructure tasks
        """
        tech_keywords = features['technical_keywords']
        
        # Base score from keywords
        score = (
            tech_keywords['high'] * 3.0 +
            tech_keywords['medium'] * 1.5 +
            tech_keywords['low'] * 0.5
        )
        
        # Phase multiplier
        phase_multipliers = {
            'AI Functionalities': 1.3,
            'Database & Architecture': 1.2,
            'DevOps & Deployment': 1.2,
            'Backend Development': 1.1,
            'Integration': 1.0,
            'Frontend Development': 0.9,
            'Design & UI/UX': 0.7
        }
        
        multiplier = phase_multipliers.get(phase, 1.0)
        score *= multiplier
        
        # Normalize to 0-10
        return min(10.0, score)
    
    def calculate_effort(self, features: Dict) -> float:
        """
        Calculate effort estimation score (0-10)
        Based on scope indicators and word count
        """
        effort_indicators = features['effort_indicators']
        
        # Base score from effort keywords
        score = (
            effort_indicators['high'] * 4.0 +
            effort_indicators['medium'] * 2.0 +
            effort_indicators['low'] * 0.5
        )
        
        # Adjust based on description length (longer = more complex)
        word_count = features['word_count']
        if word_count > 100:
            score += 2.0
        elif word_count > 50:
            score += 1.0
        
        # Sentence complexity factor
        complexity = features['sentence_complexity']
        if complexity > 20:
            score += 1.5
        elif complexity > 15:
            score += 1.0
        
        return min(10.0, score)
    
    def calculate_ambiguity(self, features: Dict) -> float:
        """
        Calculate ambiguity/uncertainty score (0-10)
        Higher = more research/exploration needed
        """
        ambiguity_markers = features['ambiguity_markers']
        
        score = (
            ambiguity_markers['high'] * 3.0 +
            ambiguity_markers['medium'] * 1.5 +
            ambiguity_markers['low'] * -1.0  # Clear requirements reduce ambiguity
        )
        
        # Additional markers
        if features['has_questions']:
            score += 2.0
        
        if features['has_uncertainty']:
            score += 2.0
        
        # Low score means clear, high score means ambiguous
        return max(0.0, min(10.0, score))
    
    def calculate_dependencies(self, features: Dict) -> float:
        """
        Calculate dependency criticality score (0-10)
        Based on number of dependencies and dependency keywords
        """
        dep_count = features['dependency_count']
        dep_keywords = features['dependency_keywords']
        
        # Base score from dependency count
        score = min(dep_count * 2.0, 6.0)
        
        # Additional score from dependency keywords in description
        score += min(dep_keywords * 1.5, 4.0)
        
        return min(10.0, score)
    
    def calculate_blast_radius(self, features: Dict) -> float:
        """
        Calculate blast radius score (0-10)
        Impact of failure on the system
        """
        level = features['blast_radius_level']
        
        level_scores = {
            'critical': 9.0,
            'major': 6.0,
            'minor': 2.0
        }
        
        return level_scores.get(level, 3.0)
    
    def calculate_skill_level(self, features: Dict) -> float:
        """
        Calculate required skill level score (0-10)
        """
        skill_level = features['skill_level_indicators']
        
        level_scores = {
            'expert': 9.0,
            'intermediate': 5.0,
            'junior': 2.0
        }
        
        base_score = level_scores.get(skill_level, 5.0)
        
        # Technical keywords also indicate skill requirement
        tech_high = features['technical_keywords']['high']
        if tech_high > 2:
            base_score = min(10.0, base_score + 2.0)
        elif tech_high > 0:
            base_score = min(10.0, base_score + 1.0)
        
        return base_score
    
    def calculate_cross_domain(self, features: Dict, phase: str) -> float:
        """
        Calculate cross-domain complexity score (0-10)
        Tasks spanning multiple technical areas
        """
        if features['cross_domain_detected']:
            base_score = 7.0
        else:
            base_score = 2.0
        
        # Integration and Full Stack phases inherently cross-domain
        if 'integration' in phase.lower() or 'full stack' in phase.lower():
            base_score = max(base_score, 6.0)
        
        # Technical diversity adds to cross-domain score
        tech_keywords = features['technical_keywords']
        tech_diversity = (
            (1 if tech_keywords['high'] > 0 else 0) +
            (1 if tech_keywords['medium'] > 0 else 0) +
            (1 if tech_keywords['low'] > 0 else 0)
        )
        
        if tech_diversity >= 3:
            base_score += 2.0
        elif tech_diversity >= 2:
            base_score += 1.0
        
        return min(10.0, base_score)
