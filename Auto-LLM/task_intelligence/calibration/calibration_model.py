"""
Calibration Model - Simple, Explainable ML
==========================================

PURPOSE: Predict task estimation errors and suggest calibration factors
CONSTRAINT: ONLY simple, interpretable models allowed

Allowed:
- Ridge Regression ✓
- Gradient Boosted Trees (shallow) ✓

NOT Allowed:
- Deep Neural Networks ✗
- Complex ensembles ✗
- Anything requiring >1GB RAM ✗

Model output must be EXPLAINABLE with feature importance.
"""

from typing import Dict, List, Optional, Tuple
import numpy as np

try:
    from sklearn.linear_model import Ridge
    from sklearn.ensemble import GradientBoostingRegressor
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_squared_error, r2_score
    import joblib
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    Ridge = None
    GradientBoostingRegressor = None
    StandardScaler = None


class CalibrationModel:
    """
    Simple ML model for predicting task estimation errors
    
    Input: Feature vector (from FeatureBuilder)
    Output: Predicted error + calibration factor
    
    ADVISORY ONLY - Never affects live scoring
    """
    
    def __init__(self, model_type: str = 'ridge'):
        """
        Initialize calibration model
        
        Args:
            model_type: 'ridge' or 'gbr' (gradient boosted regressor)
        """
        if not SKLEARN_AVAILABLE:
            raise ImportError("scikit-learn not installed. Run: pip install scikit-learn")
        
        self.model_type = model_type
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = None
        self.metadata = {}
        
        # Initialize model
        if model_type == 'ridge':
            self.model = Ridge(alpha=1.0)  # L2 regularization
        elif model_type == 'gbr':
            self.model = GradientBoostingRegressor(
                max_depth=3,        # Shallow trees for interpretability
                n_estimators=50,    # Conservative
                learning_rate=0.1,
                random_state=42
            )
        else:
            raise ValueError(f"Unknown model type: {model_type}. Use 'ridge' or 'gbr'")
    
    def _features_to_matrix(self, features_list: List[Dict]) -> np.ndarray:
        """Convert list of feature dicts to numpy matrix"""
        if not self.feature_names:
            # First time - establish feature order
            self.feature_names = sorted(features_list[0].keys())
        
        # Extract values in consistent order
        matrix = []
        for features in features_list:
            row = [features.get(name, 0.0) for name in self.feature_names]
            matrix.append(row)
        
        return np.array(matrix)
    
    def train(
        self,
        X: List[Dict],
        y: List[float],
        test_size: float = 0.2
    ) -> Dict:
        """
        Train calibration model
        
        Args:
            X: List of feature dictionaries
            y: List of prediction errors (actual - estimated hours)
            test_size: Fraction for test set
            
        Returns:
            Training metrics
        """
        if len(X) < 20:
            raise ValueError("Insufficient data: Need at least 20 samples to train")
        
        # Convert to numpy
        X_matrix = self._features_to_matrix(X)
        y_array = np.array(y)
        
        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X_matrix, y_array,
            test_size=test_size,
            random_state=42
        )
        
        # Scale features (important for Ridge)
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred_train = self.model.predict(X_train_scaled)
        y_pred_test = self.model.predict(X_test_scaled)
        
        metrics = {
            'train_rmse': np.sqrt(mean_squared_error(y_train, y_pred_train)),
            'test_rmse': np.sqrt(mean_squared_error(y_test, y_pred_test)),
            'train_r2': r2_score(y_train, y_pred_train),
            'test_r2': r2_score(y_test, y_pred_test),
            'n_samples': len(X),
            'n_features': len(self.feature_names)
        }
        
        # Store metadata
        self.metadata = {
            'model_type': self.model_type,
            'feature_names': self.feature_names,
            'metrics': metrics
        }
        
        return metrics
    
    def predict(self, features: Dict) -> Dict:
        """
        Predict estimation error for a single task
        
        Args:
            features: Feature dictionary
            
        Returns:
            {
                'predicted_error': float,
                'calibration_factor': float,
                'confidence': float
            }
        """
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        # Convert to matrix
        X = self._features_to_matrix([features])
        X_scaled = self.scaler.transform(X)
        
        # Predict
        predicted_error = self.model.predict(X_scaled)[0]
        
        # Convert to calibration factor
        estimated_hours = features.get('estimated_hours', 1.0)
        if estimated_hours > 0:
            calibration_factor = 1.0 + (predicted_error / estimated_hours)
        else:
            calibration_factor = 1.0
        
        # Clamp to safe range [0.85, 1.15]
        calibration_factor = max(0.85, min(1.15, calibration_factor))
        
        # Estimate confidence (simplified - use prediction variance)
        # For Ridge: we don't have built-in intervals, so use heuristic
        confidence = min(0.95, 0.5 + (self.metadata.get('metrics', {}).get('test_r2', 0.0) / 2))
        
        return {
            'predicted_error': round(predicted_error, 2),
            'calibration_factor': round(calibration_factor, 3),
            'confidence': round(confidence, 2)
        }
    
    def get_feature_importance(self) -> Dict[str, float]:
        """
        Extract feature importance (explainability)
        
        Returns:
            Dictionary of {feature_name: importance_score}
        """
        if self.model is None:
            return {}
        
        if self.model_type == 'ridge':
            # For Ridge: Use absolute coefficients
            importance = np.abs(self.model.coef_)
        elif self.model_type == 'gbr':
            # For GBR: Use built-in feature importance
            importance = self.model.feature_importances_
        else:
            return {}
        
        # Normalize to sum to 1.0
        importance = importance / importance.sum()
        
        # Create dict
        feature_importance = {
            name: round(float(imp), 4)
            for name, imp in zip(self.feature_names, importance)
        }
        
        # Sort by importance
        feature_importance = dict(
            sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        )
        
        return feature_importance
    
    def get_top_features(self, n: int = 10) -> List[Tuple[str, float]]:
        """Get top N most important features"""
        importance = self.get_feature_importance()
        return list(importance.items())[:n]
    
    def save(self, filepath: str):
        """Save model to disk"""
        if self.model is None:
            raise ValueError("Cannot save untrained model")
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'metadata': self.metadata,
            'model_type': self.model_type
        }
        
        joblib.dump(model_data, filepath)
    
    @classmethod
    def load(cls, filepath: str) -> 'CalibrationModel':
        """Load model from disk"""
        model_data = joblib.load(filepath)
        
        instance = cls(model_type=model_data['model_type'])
        instance.model = model_data['model']
        instance.scaler = model_data['scaler']
        instance.feature_names = model_data['feature_names']
        instance.metadata = model_data['metadata']
        
        return instance
