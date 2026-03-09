"""
Feature Builder - Extract Safe, Explainable Features
====================================================

PURPOSE: Convert task data + feedback into ML-ready features
CONSTRAINT: ONLY interpretable features allowed

NO raw text
NO embeddings
NO LLM features
ONLY numerical, categorical, and derived features

All features must have clear business meaning.
"""

from typing import Dict, List, Optional
import hashlib


class FeatureBuilder:
    """
    Extracts explainable features from completed tasks
    
    Input: Task data + feedback
    Output: Feature vector (interpretable only)
    """
    
    # Phase encoding (one-hot)
    PHASES = [
        'AI Functionalities',
        'Backend Development',
        'Frontend Development',
        'DevOps & Deployment',
        'Integration',
        'Full Stack Development',
        'Testing & QA',
        'Database & Architecture',
        'Design & UI/UX'
    ]
    
    # Position encoding (one-hot)
    POSITIONS = ['early', 'mid', 'late']
    
    def __init__(self):
        self.phase_mapping = {phase: idx for idx, phase in enumerate(self.PHASES)}
        self.position_mapping = {pos: idx for idx, pos in enumerate(self.POSITIONS)}
    
    def extract_features(
        self,
        task_data: Dict,
        feedback_data: Optional[Dict] = None
    ) -> Dict:
        """
        Extract safe, explainable features
        
        Args:
            task_data: {
                'dimensions': {<7 dimension scores>},
                'estimated_score': float,
                'estimated_points': int,
                'buzzword_density': float,
                'word_count': int,
                'phase': str,
                'position': str,
                'manager_id': str (optional)
            }
            feedback_data: {
                'actual_hours': float,
                'rework': bool,
                'quality_rating': int (1-5)
            } (optional, for training)
            
        Returns:
            Feature dictionary (all interpretable)
        """
        features = {}
        
        # 1. Dimension scores (7 features - core complexity metrics)
        dimensions = task_data.get('dimensions', {})
        features['dim_technical_depth'] = dimensions.get('technical_depth', 0.0)
        features['dim_effort'] = dimensions.get('effort', 0.0)
        features['dim_ambiguity'] = dimensions.get('ambiguity', 0.0)
        features['dim_dependencies'] = dimensions.get('dependencies', 0.0)
        features['dim_blast_radius'] = dimensions.get('blast_radius', 0.0)
        features['dim_skill_level'] = dimensions.get('skill_level', 0.0)
        features['dim_cross_domain'] = dimensions.get('cross_domain', 0.0)
        
        # 2. Phase encoding (one-hot)
        phase = task_data.get('phase', '')
        for p in self.PHASES:
            features[f'phase_{p.replace(" ", "_").replace("&", "and")}'] = 1.0 if p == phase else 0.0
        
        # 3. Position encoding (one-hot)
        position = task_data.get('position', 'mid')
        for pos in self.POSITIONS:
            features[f'position_{pos}'] = 1.0 if pos == position else 0.0
        
        # 4. Estimated metrics
        features['estimated_score'] = task_data.get('estimated_score', 0.0)
        features['estimated_points'] = task_data.get('estimated_points', 0)
        features['estimated_hours'] = task_data.get('estimated_points', 0) / 5.0  # Rough conversion
        
        # 5. Text-based features (safe)
        features['buzzword_density'] = task_data.get('buzzword_density', 0.0)
        features['word_count'] = task_data.get('word_count', 0)
        features['description_length_category'] = self._categorize_length(
            task_data.get('word_count', 0)
        )
        
        # 6. Manager encoding (hashed for privacy)
        manager_id = task_data.get('manager_id')
        if manager_id:
            # Hash to integer [0-99] for categorical encoding
            manager_hash = int(hashlib.md5(manager_id.encode()).hexdigest(), 16) % 100
            features['manager_hash'] = manager_hash
        else:
            features['manager_hash'] = -1  # Unknown
        
        # 7. Target variable (if feedback provided)
        if feedback_data:
            actual_hours = feedback_data.get('actual_hours', 0.0)
            estimated_hours = features['estimated_hours']
            
            features['actual_hours'] = actual_hours
            features['prediction_error'] = actual_hours - estimated_hours
            features['rework'] = 1.0 if feedback_data.get('rework', False) else 0.0
            features['quality_rating'] = feedback_data.get('quality_rating', 3)
            
            # Derived: Percentage error
            if estimated_hours > 0:
                features['error_percentage'] = (actual_hours - estimated_hours) / estimated_hours
            else:
                features['error_percentage'] = 0.0
        
        return features
    
    def _categorize_length(self, word_count: int) -> int:
        """Categorize description length (ordinal encoding)"""
        if word_count < 20:
            return 0  # Short
        elif word_count < 50:
            return 1  # Medium
        else:
            return 2  # Long
    
    def get_feature_names(self) -> List[str]:
        """
        Return list of all feature names (for model training)
        Useful for ensuring feature consistency
        """
        feature_names = [
            # Dimensions
            'dim_technical_depth',
            'dim_effort',
            'dim_ambiguity',
            'dim_dependencies',
            'dim_blast_radius',
            'dim_skill_level',
            'dim_cross_domain',
            
            # Phases (one-hot)
            *[f'phase_{p.replace(" ", "_").replace("&", "and")}' for p in self.PHASES],
            
            # Positions (one-hot)
            *[f'position_{pos}' for pos in self.POSITIONS],
            
            # Estimates
            'estimated_score',
            'estimated_points',
            'estimated_hours',
            
            # Text features
            'buzzword_density',
            'word_count',
            'description_length_category',
            
            # Manager (hashed)
            'manager_hash'
        ]
        
        return feature_names
    
    def extract_batch(self, tasks_with_feedback: List[Dict]) -> tuple:
        """
        Extract features for a batch of completed tasks
        
        Args:
            tasks_with_feedback: List of {task_data, feedback_data} dicts
            
        Returns:
            (X, y) where:
                X = feature matrix (list of feature dicts)
                y = target values (prediction errors)
        """
        X = []
        y = []
        
        for item in tasks_with_feedback:
            task_data = item.get('task_data', {})
            feedback_data = item.get('feedback_data', {})
            
            features = self.extract_features(task_data, feedback_data)
            
            # Only include if we have feedback
            if 'prediction_error' in features:
                X.append(features)
                y.append(features['prediction_error'])
        
        return X, y
    
    def get_feature_importance_labels(self) -> Dict[str, str]:
        """
        Return human-readable labels for features
        Used in explainability outputs
        """
        return {
            'dim_technical_depth': 'Technical Complexity',
            'dim_effort': 'Effort Required',
            'dim_ambiguity': 'Requirement Clarity',
            'dim_dependencies': 'Dependency Count',
            'dim_blast_radius': 'Impact Radius',
            'dim_skill_level': 'Skill Level Required',
            'dim_cross_domain': 'Cross-Domain Scope',
            'buzzword_density': 'Buzzword Density',
            'estimated_score': 'Initial Score Estimate',
            'manager_hash': 'Manager Calibration'
        }
