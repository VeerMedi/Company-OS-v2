#!/usr/bin/env python3
"""
Calibration Model Training Script
==================================

PURPOSE: Train ML calibration models from feedback data (OFFLINE)
TRIGGER: Manual CLI or cron job

Usage:
  python train_calibration.py

Requirements:
  - pip install -r requirements_calibration.txt
  - Minimum 100 feedback samples

CRITICAL: This script runs OFFLINE and NEVER affects live scoring.
"""

import sys
import json
from datetime import datetime

# Check if calibration module available
try:
    from task_intelligence.calibration import (
        FeatureBuilder,
        CalibrationModel,
        CalibrationTrainer,
        CalibrationStore,
        CALIBRATION_AVAILABLE
    )
except ImportError as e:
    print(f"❌ Error: Calibration module not available")
    print(f"   {str(e)}")
    print(f"\n📦 Install dependencies:")
    print(f"   pip install -r requirements_calibration.txt")
    sys.exit(1)

if not CALIBRATION_AVAILABLE:
    print("❌ Error: scikit-learn not installed")
    print("📦 Install: pip install -r requirements_calibration.txt")
    sys.exit(1)


def load_feedback_data():
    """
    Load feedback data from MongoDB (persistent storage)
    
    This is where self-learning happens - loads ALL completed tasks
    with feedback from the database.
    """
    print("📊 Loading feedback data from MongoDB...")
    
    try:
        from pymongo import MongoClient
        import os
        
        MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/hustle_os')
        client = MongoClient(MONGODB_URI)
        db = client.get_database()
        
        # Query all feedback
        feedback_docs = list(db.task_feedback.find({}))
        
        if len(feedback_docs) == 0:
            print("\n⚠️  No feedback data available yet")
            print("   Feedback is collected via POST /api/task-feedback")
            print("   Minimum 100 samples required for training")
            return None
        
        print(f"   Found {len(feedback_docs)} feedback samples")
        
        # Convert MongoDB docs to training format
        # TODO: Need to also fetch task data (title, description, dimensions)
        # For now, this is a placeholder showing the structure
        
        feedback_data = []
        for doc in feedback_docs:
            # In production, join with tasks collection to get full task data
            # For now, showing minimal structure
            feedback_data.append({
                'task_data': doc.get('task_snapshot', {}),  # If stored
                'feedback_data': {
                    'actual_hours': doc.get('actual_hours'),
                    'rework': doc.get('rework', False),
                    'quality_rating': doc.get('quality_rating')
                }
            })
        
        return feedback_data
        
    except Exception as e:
        print(f"\n❌ Error loading from MongoDB: {e}")
        print(f"   Make sure:")
        print(f"   1. MongoDB is running")
        print(f"   2. pip install pymongo")
        print(f"   3. Database contains task_feedback collection")
        return None


def main():
    """Main training pipeline"""
    print("🚀 Task Intelligence - Calibration Model Training")
    print("=" * 60)
    print(f"Timestamp: {datetime.utcnow().isoformat()}\n")
    
    # Load feedback data
    feedback_data = load_feedback_data()
    if feedback_data is None:
        sys.exit(1)
    
    # Initialize components
    print("🔧 Initializing components...")
    feature_builder = FeatureBuilder()
    model = CalibrationModel(model_type='ridge')  # Simple baseline
    store = CalibrationStore()
    trainer = CalibrationTrainer(feature_builder, model, store)
    
    # Train model
    print("\n🎓 Training calibration model...")
    report = trainer.train(
        feedback_storage=feedback_data,
        description="Automated training run"
    )
    
    # Display results
    print("\n" + "=" * 60)
    print("📈 TRAINING REPORT")
    print("=" * 60)
    
    status = report.get('status')
    print(f"Status: {status}")
    
    if status == 'success':
        print(f"\n✅ Model trained successfully!")
        print(f"Version: {report['version']}")
        print(f"\n📊 Metrics:")
        metrics = report['metrics']
        print(f"   Training RMSE: {metrics['train_rmse']:.2f} hours")
        print(f"   Test RMSE: {metrics['test_rmse']:.2f} hours")
        print(f"   R² Score: {metrics['test_r2']:.2f}")
        print(f"   Samples: {metrics['n_samples']}")
        
        print(f"\n🔍 Top Predictive Features:")
        for feature, importance in report['feature_importance']:
            print(f"   {feature}: {importance:.4f}")
        
        print(f"\n✨ Model saved and ready for suggestions")
        print(f"\n📡 View suggestions:")
        print(f"   GET http://localhost:8000/api/calibration/suggestions")
        
    elif status == 'insufficient_data':
        print(f"\n⚠️  {report['message']}")
        
    elif status == 'rejected_poor_performance':
        print(f"\n⚠️  Model rejected due to poor performance")
        print(f"   {report['message']}")
        print(f"\n   This can happen with:")
        print(f"   - Insufficient data diversity")
        print(f"   - Too few samples")
        print(f"   - Data quality issues")
        
    else:
        print(f"\n❌ Training failed")
        print(f"   Error: {report.get('error', 'Unknown')}")
    
    print("\n" + "=" * 60)
    
    # Save full report
    report_file = f"training_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    print(f"\n📝 Full report saved: {report_file}")
    
    return 0 if status == 'success' else 1


if __name__ == "__main__":
    sys.exit(main())
