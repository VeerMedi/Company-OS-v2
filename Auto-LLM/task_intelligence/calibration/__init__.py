"""
ML Calibration Module (Advisory Only)
======================================

CRITICAL: This module is COMPLETELY ISOLATED from the scoring engine.
It learns passively from feedback data and suggests calibration factors.

RULES:
- ML NEVER affects live scoring
- ML NEVER overrides the scoring engine
- All suggestions require human approval
- ML failure = no impact on system

Purpose: Learn from task completion data to suggest coefficient adjustments
Authority Level: ADVISORY ONLY
"""

__version__ = "0.1.0"

# Optional import - graceful degradation
try:
    from .feature_builder import FeatureBuilder
    from .calibration_model import CalibrationModel
    from .calibration_trainer import CalibrationTrainer
    from .calibration_store import CalibrationStore
    
    CALIBRATION_AVAILABLE = True
except ImportError as e:
    # If ML dependencies missing, system continues normally
    CALIBRATION_AVAILABLE = False
    FeatureBuilder = None
    CalibrationModel = None
    CalibrationTrainer = None
    CalibrationStore = None

__all__ = [
    'FeatureBuilder',
    'CalibrationModel',
    'CalibrationTrainer',
    'CalibrationStore',
    'CALIBRATION_AVAILABLE'
]
