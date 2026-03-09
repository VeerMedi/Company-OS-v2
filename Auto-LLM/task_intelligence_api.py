"""
Task Intelligence API Service
FastAPI service for task complexity scoring
v1.1.0: Enhanced with confidence scoring, versioning, buzzword guards, and feedback loop
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uvicorn
import traceback
import os

from task_intelligence.semantic_analyzer import SemanticAnalyzer
from task_intelligence.dimension_calculators import DimensionCalculators
from task_intelligence.scoring_engine import TaskScoringEngine
from task_intelligence.explanation_generator import ExplanationGenerator
from task_intelligence.enhancements import TaskEnhancements
from task_intelligence.exceptions import (
    TaskIntelligenceError,
    SemanticAnalysisError,
    ScoringError
)
from task_intelligence.config import SCORING_VERSION

# MongoDB connection for persistent feedback storage
try:
    from pymongo import MongoClient
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/hustle_os')
    mongo_client = MongoClient(MONGODB_URI)
    db = mongo_client.get_database()
    feedback_collection = db.task_feedback
    MONGODB_AVAILABLE = True
    print(f"✅ Connected to MongoDB: {MONGODB_URI}")
except Exception as e:
    MONGODB_AVAILABLE = False
    feedback_collection = None
    print(f"⚠️  MongoDB not available: {e}")
    print(f"   Feedback will not be persisted (ML training disabled)")


app = FastAPI(
    title="Task Intelligence API",
    description="Multi-dimensional task complexity scoring engine v1.1.0",
    version="1.1.0"
)

# CORS middleware for integration with Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=[" *"],
)

# Initialize components
semantic_analyzer = SemanticAnalyzer()
dimension_calculators = DimensionCalculators()
scoring_engine = TaskScoringEngine()
explanation_generator = ExplanationGenerator()
enhancements = TaskEnhancements()


# === EXCEPTION HANDLERS ===
@app.exception_handler(SemanticAnalysisError)
async def semantic_analysis_error_handler(request: Request, exc: SemanticAnalysisError):
    """Handle semantic analysis errors (HTTP 400)"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "semantic_analysis_error",
            "message": str(exc) or exc.default_message,
            "version": SCORING_VERSION
        }
    )


@app.exception_handler(ScoringError)
async def scoring_error_handler(request: Request, exc: ScoringError):
    """Handle scoring calculation errors (HTTP 422)"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "scoring_error",
            "message": str(exc) or exc.default_message,
            "version": SCORING_VERSION
        }
    )


@app.exception_handler(TaskIntelligenceError)
async def task_intelligence_error_handler(request: Request, exc: TaskIntelligenceError):
    """Handle generic task intelligence errors (HTTP 500)"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "internal_error",
            "message": exc.default_message,  # Never leak specific error details
            "version": SCORING_VERSION
        }
    )


# === REQUEST/RESPONSE MODELS ===
class TaskData(BaseModel):
    """Request model for task scoring (v1.1.0)"""
    title: str = Field(..., min_length=1, description="Task title")
    description: str = Field(..., min_length=1, description="Task description")
    phase: str = Field(..., description="Task phase/bunch")
    dependencies: Optional[List[str]] = Field(default=None, description="Dependency task IDs")
    position: Optional[str] = Field(default='mid', description="Position in project: early, mid, late")
    manager_id: Optional[str] = Field(default=None, description="Manager ID for bias normalization")


class ScoringResponse(BaseModel):
    """Response model with scoring results (v1.1.0)"""
    points: int
    score: float
    dimensions: dict
    explanation: str
    breakdown: dict
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score (0-1)")
    scoring_version: str
    metadata: dict


class TaskFeedback(BaseModel):
    """Feedback payload for calibration (v1.1.0)"""
    task_id: str
    actual_hours: float = Field(..., gt=0, description="Actual time taken")
    rework: bool = Field(default=False, description="Whether rework was needed")
    quality_rating: int = Field(..., ge=1, le=5, description="Quality rating (1-5)")
    manager_id: Optional[str] = None
    notes: Optional[str] = None


# === ENDPOINTS ===
@app.post("/api/score-task", response_model=ScoringResponse)
async def score_task(task_data: TaskData):
    """
    Score a task and return complexity analysis (v1.1.0)
    
    Enhancements:
    - Confidence scoring
    - Buzzword detection & penalty
    - Position multipliers
    - Manager bias normalization
    - Detailed breakdown
    
    Example request:
    {
        "title": "Implement RAG pipeline",
        "description": "Build retrieval-augmented generation with vector embeddings",
        "phase": "AI Functionalities",
        "dependencies": ["database-setup"],
        "position": "mid",
        "manager_id": "mgr_123"
    }
    """
    try:
        # Step 1: Semantic analysis (returns features + confidence)
        semantic_features, confidence = semantic_analyzer.analyze_task(
            title=task_data.title,
            description=task_data.description,
            phase=task_data.phase,
            dependencies=task_data.dependencies
        )
        
        # Step 2: Calculate dimensions
        dimensions = dimension_calculators.calculate_all(
            semantic_features=semantic_features,
            phase=task_data.phase
        )
        
        # Step 3: Calculate score with v1.1.0 enhancements
        score, points, breakdown = scoring_engine.calculate_score(
            dimensions=dimensions,
            phase=task_data.phase,
            position_in_project=task_data.position,
            manager_id=task_data.manager_id,
            inflation_penalty=semantic_features['inflation_penalty']
        )
        
        # Step 4: Generate explanation
        explanation = explanation_generator.generate(
            dimensions=dimensions,
            score=score,
            points=points,
            phase=task_data.phase,
            breakdown=breakdown
        )
        
        # Step 5: Build metadata
        metadata = {
            "buzzwords_detected": semantic_features['buzzword_count'],
            "buzzword_density": semantic_features['buzzword_density'],
            "text_quality": "high" if confidence >= 0.7 else "medium" if confidence >= 0.4 else "low",
            "word_count": semantic_features['word_count']
        }
        
        return ScoringResponse(
            points=points,
            score=round(score, 2),
            dimensions={k: round(v, 2) for k, v in dimensions.items()},
            explanation=explanation,
            breakdown=breakdown,
            confidence=confidence,
            scoring_version=SCORING_VERSION,
            metadata=metadata
        )
        
    except (SemanticAnalysisError, ScoringError):
        # Re-raise specific errors (handled by exception handlers)
        raise
    except Exception as e:
        # Catch-all for unexpected errors (never leak stack trace)
        print(f"Unexpected error: {traceback.format_exc()}")  # Log internally
        raise TaskIntelligenceError("An unexpected error occurred during task analysis")


@app.post("/api/task-feedback")
async def submit_feedback(feedback: TaskFeedback):
    """
    Submit task feedback for future calibration (v1.1.0)
    
    Purpose:
    - Collect actual outcomes vs predictions
    - Enable ML-based calibration
    - Persist feedback to MongoDB (permanent storage)
    
    Self-Learning: Feedback automatically used for training when threshold reached
    """
    if not MONGODB_AVAILABLE:
        return {
            "success": False,
            "error": "MongoDB not available",
            "note": "Feedback cannot be persisted. ML training disabled."
        }
    
    try:
        # Prepare feedback document
        feedback_doc = {
            "task_id": feedback.task_id,
            "actual_hours": float(feedback.actual_hours),
            "rework": bool(feedback.rework),
            "quality_rating": int(feedback.quality_rating),
            "manager_id": feedback.manager_id if feedback.manager_id else None,
            "notes": feedback.notes if feedback.notes else "",
            "submitted_at": datetime.utcnow(),
            "used_in_training": False  # Will be set to True when used
        }
        
        # Insert into MongoDB
        result = feedback_collection.insert_one(feedback_doc)
        
        # Check if we have enough samples for training
        total_samples = feedback_collection.count_documents({})
        
        return {
            "success": True,
            "message": "Feedback saved to database",
            "feedback_id": str(result.inserted_id),
            "total_feedback_count": total_samples,
            "ml_status": "ready_for_training" if total_samples >= 100 else f"collecting_data ({total_samples}/100)",
            "note": "Feedback will be used for ML calibration"
        }
        
    except Exception as e:
        # Log full error for debugging
        error_details = traceback.format_exc()
        print(f"❌ Feedback save error: {error_details}")
        return {
            "success": False,
            "error": f"Failed to save feedback: {str(e)}",
            "note": "System continues normally"
        }


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Task Intelligence API",
        "status": "running",
        "version": SCORING_VERSION,
        "features": [
            "Confidence scoring",
            "Buzzword detection",
            "Position multipliers",
            "Manager bias normalization",
            "Feedback loop ready"
        ]
    }


@app.get("/api/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "version": SCORING_VERSION,
        "components": {
            "semantic_analyzer": "ready",
            "dimension_calculators": "ready",
            "scoring_engine": "ready",
            "explanation_generator": "ready"
        },
        "features": {
            "confidence_scoring": True,
            "buzzword_detection": True,
            "position_multipliers": True,
            "manager_bias": True,
            "feedback_loop": True
        }
    }


@app.get("/api/calibration/suggestions")
async def get_calibration_suggestions():
    """
    GET CALIBRATION SUGGEST IONS (ML - Advisory Only)
    
    ⚠️ CRITICAL: These suggestions DO NOT affect live scoring.
    They are passive observations from ML analysis of feedback data.
    
    Human review and manual approval required before applying.
    
    Returns:
        ML-suggested calibration factors (if available)
        Empty response if ML unavailable (system continues normally)
    """
    try:
        # Optional import - graceful degradation
        from task_intelligence.calibration import (
            CalibrationStore,
            FeatureBuilder,
            CALIBRATION_AVAILABLE
        )
        
        if not CALIBRATION_AVAILABLE:
            return {
                "status": "unavailable",
                "message": "ML calibration not installed",
                "note": "Scoring continues normally without ML",
                "install": "pip install -r requirements_calibration.txt"
            }
        
        # Load latest model
        store = CalibrationStore()
        latest_version = store.get_latest_version()
        
        if latest_version is None:
            return {
                "status": "no_model",
                "message": "No calibration model trained yet",
                "note": "Run: python train_calibration.py",
                "min_samples_required": 100
            }
        
        # Load model and metadata
        model, model_info = store.load_model(latest_version)
        
        # Generate suggestions (simplified for now - real version would analyze patterns)
        feature_labels = FeatureBuilder().get_feature_importance_labels()
        feature_importance = model.get_feature_importance()
        
        # Top features affecting estimation error
        top_features = model.get_top_features(n=10)
        
        suggestions = {
            "status": "ready",
            "model_info": {
                "version": model_info['version'],
                "trained_at": model_info['trained_at'],
                "data_points": model_info['metrics']['n_samples'],
                "test_rmse": model_info['metrics']['test_rmse'],
                "test_r2": model_info['metrics']['test_r2']
            },
            "top_predictive_features": [
                {
                    "feature": feature,
                    "importance": importance,
                    "label": feature_labels.get(feature, feature)
                }
                for feature, importance in top_features
            ],
            "note": "⚠️ ADVISORY ONLY - Human review required before applying",
            "explanation": "ML model suggests which factors most strongly predict estimation errors. Use this to inform manual coefficient adjustments."
        }
        
        return suggestions
        
    except ImportError:
        # ML module not available - continue normally
        return {
            "status": "unavailable",
            "message": "ML calibration module not installed",
            "note": "Scoring system continues normally"
        }
    except Exception as e:
        # ML failure never breaks the API
        print(f"Calibration error: {str(e)}")
        return {
            "status": "error",
            "message": "Calibration model unavailable",
            "note": "Scoring continues normally"
        }


@app.post("/api/predict-phase")
async def predict_phase(request: dict):
    """
    Predict task phase from title and description (v1.2.0)
    
    NEW FEATURE: Auto-suggest phase to reduce manual selection
    
    Request:
        {
            "title": "Deploy app to AWS",
            "description": "Setup ECS and configure load balancer"
        }
    
    Response:
        {
            "predicted_phase": "DevOps & Deployment",
            "confidence": 0.95,
            "matched_keywords": ["deploy", "aws", "ecs"],
            "alternatives": [
                {"phase": "Backend Development", "confidence": 0.25}
            ],
            "reason": "Matched 5 keywords for DevOps & Deployment"
        }
    """
    try:
        title = request.get('title', '')
        description = request.get('description', '')
        
        if not title or not description:
            return {
                "predicted_phase": "Backend Development",
                "confidence": 0.3,
                "reason": "Insufficient information, using default"
            }
        
        prediction = enhancements.predict_phase(title, description)
        return prediction
        
    except Exception as e:
        print(f"Phase prediction error: {str(e)}")
        return {
            "predicted_phase": "Backend Development",
            "confidence": 0.3,
            "error": "Prediction failed, using default"
        }


@app.post("/api/suggest-breakdown")
async def suggest_breakdown(request: dict):
    """
    Suggest task breakdown for large tasks (v1.2.0)
    
    NEW FEATURE: When task >20 points, suggest splitting into subtasks
    
    Request:
        {
            "title": "Build authentication system",
            "description": "Complete OAuth, JWT, sessions",
            "estimated_points": 50,
            "phase": "Backend Development"
        }
    
    Response:
        {
            "should_break": true,
            "reason": "Task complexity (50 pts) suggests breaking into 4 subtasks",
            "suggestions": [
                {
                    "title": "Implement token generation",
                    "description": "JWT/session token creation",
                    "estimated_points": 15
                },
                ...
            ]
        }
    """
    try:
        title = request.get('title', '')
        description = request.get('description', '')
        estimated_points = request.get('estimated_points', 0)
        phase = request.get('phase', 'Backend Development')
        
        if not title or not description:
            return {
                "should_break": False,
                "reason": "Insufficient task information"
            }
        
        breakdown = enhancements.suggest_task_breakdown(
            title=title,
            description=description,
            estimated_points=estimated_points,
            phase=phase
        )
        
        return breakdown
        
    except Exception as e:
        print(f"Task breakdown error: {str(e)}")
        return {
            "should_break": False,
            "error": "Failed to generate breakdown suggestions"
        }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
