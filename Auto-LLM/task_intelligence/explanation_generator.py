"""
Explanation Generator
Generates human-readable explanations for task scores
"""

from typing import Dict


class ExplanationGenerator:
    """Generates clear explanations for why a task received its score"""
    
    def generate(self, dimensions: Dict[str, float], score: float, 
                points: int, phase: str, breakdown: Dict = None) -> str:
        """
        Generate human-readable explanation
        
        Args:
            dimensions: Dictionary of dimension scores
            score: Raw complexity score (0-100)
            points: Final point value
            phase: Task phase
            breakdown: Optional score breakdown
            
        Returns:
            Human-readable explanation string
        """
        # Identify top contributing dimensions
        sorted_dims = sorted(dimensions.items(), key=lambda x: x[1], reverse=True)
        top_dims = sorted_dims[:3]
        
        # Build explanation
        explanation_parts = []
        
        # Opening statement
        score_level = self._get_score_level(score)
        explanation_parts.append(
            f"This task scores {points} points ({score_level} complexity) because "
        )
        
        # Top dimensions
        dim_descriptions = []
        for dim_name, dim_value in top_dims:
            if dim_value >= 7.0:
                level = "high"
            elif dim_value >= 4.0:
                level = "moderate"
            else:
                level = "low"
            
            dim_label = self._humanize_dimension(dim_name)
            dim_descriptions.append(f"{dim_label} ({int(dim_value)}/10)")
        
        if len(dim_descriptions) >= 3:
            explanation_parts.append(
                f"it requires {dim_descriptions[0]}, has {dim_descriptions[1]}, "
                f"and involves {dim_descriptions[2]}"
            )
        elif len(dim_descriptions) == 2:
            explanation_parts.append(
                f"it requires {dim_descriptions[0]} and has {dim_descriptions[1]}"
            )
        else:
            explanation_parts.append(f"it requires {dim_descriptions[0]}")
        
        # Phase context
        phase_context = self._get_phase_context(phase)
        if phase_context:
            explanation_parts.append(f". {phase_context}")
        
        # Skill recommendation
        skill_level = dimensions.get('skill_level', 5.0)
        skill_recommendation = self._get_skill_recommendation(skill_level, points)
        explanation_parts.append(f" {skill_recommendation}")
        
        return "".join(explanation_parts)
    
    def _get_score_level(self, score: float) -> str:
        """Get qualitative score level"""
        if score >= 81:
            return "expert-level"
        elif score >= 66:
            return "high"
        elif score >= 51:
            return "complex"
        elif score >= 36:
            return "medium"
        elif score >= 21:
            return "moderate"
        else:
            return "simple"
    
    def _humanize_dimension(self, dim_name: str) -> str:
        """Convert dimension name to human-readable phrase"""
        phrases = {
            'technical_depth': 'deep technical knowledge',
            'effort': 'significant development effort',
            'ambiguity': 'research and exploration',
            'dependencies': 'critical dependencies',
            'blast_radius': 'high impact on the system',
            'skill_level': 'advanced expertise',
            'cross_domain': 'cross-functional collaboration'
        }
        return phrases.get(dim_name, dim_name.replace('_', ' '))
    
    def _get_phase_context(self, phase: str) -> str:
        """Get phase-specific context"""
        contexts = {
            'AI Functionalities': "The AI phase prioritizes technical depth and specialized skills",
            'Backend Development': "Backend tasks emphasize dependencies and system integration",
            'Frontend Development': "Frontend work focuses on implementation effort and user experience",
            'DevOps & Deployment': "DevOps tasks carry high blast radius due to infrastructure impact",
            'Integration': "Integration work requires managing multiple system dependencies",
            'Database & Architecture': "Database tasks demand strong technical foundations"
        }
        return contexts.get(phase, "")
    
    def _get_skill_recommendation(self, skill_level: float, points: int) -> str:
        """Generate skill level recommendation"""
        if skill_level >= 8.0 or points >= 30:
            return "Best suited for senior developers or specialists."
        elif skill_level >= 5.0 or points >= 15:
            return "Suitable for mid-level developers with guidance."
        else:
            return "Can be delegated to junior developers or interns."
