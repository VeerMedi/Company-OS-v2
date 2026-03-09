"""
Calibration Trainer - Offline Batch Training
=============================================

PURPOSE: Train calibration models from feedback data
CONSTRAINT: OFFLINE ONLY - Never during live requests

Training triggers:
- Manual CLI command
- Scheduled cron job
- Admin panel button

Minimum data requirement: 100 samples
"""

from typing import Dict, List
from datetime import datetime


class CalibrationTrainer:
    """
    Offline training pipeline for calibration models
    
    CRITICAL: Training happens OFFLINE, never during API requests
    """
    
    MIN_SAMPLES = 100  # Minimum samples before training
    
    def __init__(self, feature_builder, model, store):
        """
        Initialize trainer
        
        Args:
            feature_builder: FeatureBuilder instance
            model: CalibrationModel instance
            store: CalibrationStore instance
        """
        self.feature_builder = feature_builder
        self.model = model
        self.store = store
    
    def prepare_training_data(
        self,
        feedback_storage: List[Dict]
    ) -> tuple:
        """
        Prepare training data from feedback storage
        
        Args:
            feedback_storage: List of feedback entries from API
                [
                    {
                        'task_id': 'task_123',
                        'task_data': {...},
                        'feedback_data': {
                            'actual_hours': 12.5,
                            'rework': false,
                            'quality_rating': 4
                        }
                    },
                    ...
                ]
        
        Returns:
            (X, y, metadata)
        """
        # Extract features
        tasks_with_feedback = []
        for entry in feedback_storage:
            task_data = entry.get('task_data', {})
            feedback_data = entry.get('feedback_data', {})
            
            if task_data and feedback_data:
                tasks_with_feedback.append({
                    'task_data': task_data,
                    'feedback_data': feedback_data
                })
        
        # Build feature matrix
        X, y = self.feature_builder.extract_batch(tasks_with_feedback)
        
        metadata = {
            'total_feedback': len(feedback_storage),
            'valid_samples': len(X),
            'filtered_out': len(feedback_storage) - len(X)
        }
        
        return X, y, metadata
    
    def train(
        self,
        feedback_storage: List[Dict],
        description: str = ""
    ) -> Dict:
        """
        Train calibration model from feedback data
        
        Args:
            feedback_storage: List of completed tasks with feedback
            description: Optional description for this training run
            
        Returns:
            Training report
        """
        report = {
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'unknown',
            'metrics': {},
            'version': None
        }
        
        try:
            # Step 1: Prepare data
            X, y, data_metadata = self.prepare_training_data(feedback_storage)
            
            if len(X) < self.MIN_SAMPLES:
                report['status'] = 'insufficient_data'
                report['message'] = f"Need at least {self.MIN_SAMPLES} samples, got {len(X)}"
                return report
            
            # Step 2: Train model
            metrics = self.model.train(X, y)
            
            # Step 3: Validate model quality
            if metrics['test_rmse'] > 10.0:  # Hours - reject if error too high
                report['status'] = 'rejected_poor_performance'
                report['message'] = f"Test RMSE too high: {metrics['test_rmse']:.2f}"
                report['metrics'] = metrics
                return report
            
            # Step 4: Save model
            version = self.store.save_model(
                self.model,
                metrics,
                description=description
            )
            
            # Step 5: Generate report
            report['status'] = 'success'
            report['metrics'] = metrics
            report['version'] = version
            report['data'] = data_metadata
            report['feature_importance'] = self.model.get_top_features(n=10)
            
            return report
            
        except Exception as e:
            report['status'] = 'error'
            report['error'] = str(e)
            return report
    
    def evaluate_model(
        self,
        test_data: List[Dict]
    ) -> Dict:
        """
        Evaluate trained model on separate test data
        
        Args:
            test_data: List of tasks with feedback (for evaluation)
            
        Returns:
            Evaluation metrics
        """
        X, y, _ = self.prepare_training_data(test_data)
        
        if len(X) == 0:
            return {'status': 'no_data'}
        
        # Get predictions
        predictions = []
        for features in X:
            pred = self.model.predict(features)
            predictions.append(pred['predicted_error'])
        
        # Calculate metrics
        import numpy as np
        from sklearn.metrics import mean_squared_error, mean_absolute_error
        
        rmse = np.sqrt(mean_squared_error(y, predictions))
        mae = mean_absolute_error(y, predictions)
        
        return {
            'status': 'evaluated',
            'n_samples': len(X),
            'rmse': round(rmse, 2),
            'mae': round(mae, 2)
        }
