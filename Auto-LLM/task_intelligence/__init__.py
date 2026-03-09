"""
Task Intelligence Module
Multi-dimensional task complexity analysis and scoring
v1.1.0: Production-grade enhancements
"""

__version__ = "1.1.0"

from .semantic_analyzer import SemanticAnalyzer
from .dimension_calculators import DimensionCalculators
from .scoring_engine import TaskScoringEngine
from .explanation_generator import ExplanationGenerator
from .exceptions import (
    TaskIntelligenceError,
    SemanticAnalysisError,
    ScoringError,
    ConfigurationError
)
from .config import SCORING_VERSION

__all__ = [
    'SemanticAnalyzer',
    'DimensionCalculators', 
    'TaskScoringEngine',
    'ExplanationGenerator',
    'TaskIntelligenceError',
    'SemanticAnalysisError',
    'ScoringError',
    'ConfigurationError',
    'SCORING_VERSION'
]
