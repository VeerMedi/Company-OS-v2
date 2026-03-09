"""
Task Scoring Engine
Calculates final complexity score using weighted dimensions
v1.1.0: Added position multipliers, manager bias, buzzword penalties
"""

from typing import Dict, Tuple, Optional
from .config import PHASE_WEIGHTS, DEFAULT_WEIGHTS, SCORE_TO_POINTS, POSITION_MULTIPLIERS, SCORING_VERSION
from .exceptions import ScoringError

# Manager bias normalization (future: load from DB)
# Range: [0.85, 1.15] to prevent extreme adjustments
MANAGER_BIAS_DB = {
    'default': 1.0,
    # Future: Populate from calibration data
}


class TaskScoringEngine:
    """
    Dynamic scoring engine that calculates final task complexity score
    using phase-weighted dimensions
    """
    
    def __init__(self):
        self.phase_weights = PHASE_WEIGHTS
        self.default_weights = DEFAULT_WEIGHTS
    
    
    def calculate_score(
        self, 
        dimensions: Dict[str, float], 
        phase: str,
        position_in_project: str = 'mid',
        manager_id: Optional[str] = None,
        inflation_penalty: float = 0.0
    ) -> Tuple[float, int, Dict]:
        """
        Calculate final complexity score with v1.1.0 enhancements
        
        Args:
            dimensions: Dictionary of dimension scores (0-10)
            phase: Task phase/bunch name
            position_in_project: 'early', 'mid', or 'late'
            manager_id: Optional manager ID for bias normalization
            inflation_penalty: Buzzword penalty (0.0-0.20)
            
        Returns:
            Tuple of (final_score, points, detailed_breakdown)
            
        Raises:
            ScoringError: If calculation fails
        """
        try:
            # Get phase-specific weights or use defaults
            weights = self.phase_weights.get(phase, self.default_weights)
            
            # Step 1: Calculate base score (0-100)
            base_score = 0.0
            dimension_contributions = {}
            
            for dim_name, dim_value in dimensions.items():
                weight = weights.get(dim_name, 0.0)
                contribution = dim_value * weight * 10  # Scale to 0-100
                base_score += contribution
                dimension_contributions[dim_name] = {
                    'value': round(dim_value, 2),
                    'weight': round(weight, 2),
                    'contribution': round(contribution, 2)
                }
            
            # Step 2: Apply position multiplier
            position_multiplier = POSITION_MULTIPLIERS.get(position_in_project, 1.0)
            position_adjusted_score = base_score * position_multiplier
            
            # Step 3: Apply buzzword penalty (reduces score)
            buzzword_adjusted_score = position_adjusted_score * (1.0 - inflation_penalty)
            
            # Step 4: Apply manager bias normalization
            manager_bias = self._get_manager_bias(manager_id)
            final_score = buzzword_adjusted_score * manager_bias
            
            # Ensure score is in valid range
            final_score = max(0.0, min(100.0, final_score))
            
            # Step 5: Convert to points
            points = self._score_to_points(final_score)
            
            # Step 6: Build detailed breakdown
            breakdown = {
                'base_score': round(base_score, 2),
                'position_multiplier': position_multiplier,
                'position_adjusted_score': round(position_adjusted_score, 2),
                'buzzword_penalty': inflation_penalty,
                'buzzword_adjusted_score': round(buzzword_adjusted_score, 2),
                'manager_bias': manager_bias,
                'final_score': round(final_score, 2),
                'dimension_contributions': dimension_contributions,
                'scoring_version': SCORING_VERSION
            }
            
            return final_score, points, breakdown
            
        except Exception as e:
            raise ScoringError(f"Score calculation failed: {str(e)}")
    
    def _get_manager_bias(self, manager_id: Optional[str]) -> float:
        """
        Get manager bias normalization factor
        
        Range: [0.85, 1.15]
        Default: 1.0 (no adjustment)
        
        Future: Load from calibration database
        """
        if not manager_id:
            return 1.0
        
        bias = MANAGER_BIAS_DB.get(manager_id, 1.0)
        
        # Safety clamp to prevent extreme adjustments
        return max(0.85, min(1.15, bias))
    
    def _score_to_points(self, score: float) -> int:
        """Convert raw score to point value"""
        for min_score, max_score, points in SCORE_TO_POINTS:
            if min_score <= score <= max_score:
                return points
        return 5  # Default minimum
    
    def get_score_breakdown(self, dimensions: Dict[str, float], phase: str) -> Dict:
        """
        Get detailed breakdown of how score was calculated
        
        Returns:
            Dictionary with breakdown information
        """
        weights = self.phase_weights.get(phase, self.default_weights)
        
        breakdown = {}
        for dim_name, dim_value in dimensions.items():
            weight = weights.get(dim_name, 0.0)
            contribution = dim_value * weight * 10
            breakdown[dim_name] = {
                'value': round(dim_value, 2),
                'weight': round(weight, 2),
                'contribution': round(contribution, 2)
            }
        
        return breakdown
