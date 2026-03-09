"""
Calibration Store - Model Persistence & Versioning
===================================================

PURPOSE: Save/load trained models with full versioning and metadata
CRITICAL: Models are version-controlled and auditable

Each model save includes:
- Model file (.pkl)
- Metadata (training date, samples, metrics)
- Version number
"""

import os
import json
from datetime import datetime
from typing import Dict, Optional
import joblib


class CalibrationStore:
    """
    Manages model persistence and versioning
    
    Models are saved with:
    - Version number
    - Training timestamp
    - Performance metrics
    - Feature list
    """
    
    def __init__(self, models_dir: str = "models/calibration"):
        """
        Initialize calibration store
        
        Args:
            models_dir: Directory to store models
        """
        self.models_dir = models_dir
        os.makedirs(self.models_dir, exist_ok=True)
        
        self.metadata_file = os.path.join(self.models_dir, "metadata.json")
        self.metadata = self._load_metadata()
    
    def _load_metadata(self) -> Dict:
        """Load model metadata from disk"""
        if os.path.exists(self.metadata_file):
            with open(self.metadata_file, 'r') as f:
                return json.load(f)
        return {
            'models': [],
            'latest_version': None
        }
    
    def _save_metadata(self):
        """Save model metadata to disk"""
        with open(self.metadata_file, 'w') as f:
            json.dump(self.metadata, f, indent=2)
    
    def _generate_version(self) -> str:
        """Generate next version number"""
        if not self.metadata['models']:
            return "v0.1.0"
        
        # Parse latest version
        latest = self.metadata['latest_version'] or "v0.0.0"
        parts = latest.replace('v', '').split('.')
        major, minor, patch = map(int, parts)
        
        # Increment minor version
        return f"v{major}.{minor + 1}.{patch}"
    
    def save_model(
        self,
        model,
        training_metrics: Dict,
        description: str = ""
    ) -> str:
        """
        Save trained model with versioning
        
        Args:
            model: CalibrationModel instance
            training_metrics: Training performance metrics
            description: Optional description of this model
            
        Returns:
            Version string (e.g. "v0.2.0")
        """
        version = self._generate_version()
        timestamp = datetime.utcnow().isoformat()
        
        # Save model file
        model_filename = f"calib_{version}_{timestamp.split('T')[0]}.pkl"
        model_path = os.path.join(self.models_dir, model_filename)
        model.save(model_path)
        
        # Record metadata
        model_info = {
            'version': version,
            'filename': model_filename,
            'path': model_path,
            'trained_at': timestamp,
            'description': description,
            'metrics': training_metrics,
            'model_type': model.model_type,
            'feature_count': len(model.feature_names) if model.feature_names else 0
        }
        
        self.metadata['models'].append(model_info)
        self.metadata['latest_version'] = version
        self._save_metadata()
        
        return version
    
    def load_model(self, version: Optional[str] = None):
        """
        Load calibration model
        
        Args:
            version: Specific version to load (None = latest)
            
        Returns:
            CalibrationModel instance
        """
        # Import here to avoid circular dependency
        from .calibration_model import CalibrationModel
        
        if version is None:
            version = self.metadata.get('latest_version')
            if version is None:
                raise ValueError("No models available")
        
        # Find model info
        model_info = None
        for m in self.metadata['models']:
            if m['version'] == version:
                model_info = m
                break
        
        if model_info is None:
            raise ValueError(f"Model version {version} not found")
        
        # Load model
        model_path = model_info['path']
        model = CalibrationModel.load(model_path)
        
        return model, model_info
    
    def get_latest_version(self) -> Optional[str]:
        """Get latest model version"""
        return self.metadata.get('latest_version')
    
    def list_models(self) -> Dict:
        """List all available models"""
        return {
            'latest_version': self.metadata.get('latest_version'),
            'total_models': len(self.metadata.get('models', [])),
            'models': self.metadata.get('models', [])
        }
    
    def get_model_info(self, version: str) -> Optional[Dict]:
        """Get metadata for a specific model version"""
        for m in self.metadata.get('models', []):
            if m['version'] == version:
                return m
        return None
