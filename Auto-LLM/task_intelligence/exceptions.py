"""
Custom Exceptions for Task Intelligence API
Provides specific error handling with appropriate HTTP status codes
"""


class TaskIntelligenceError(Exception):
    """
    Base exception for all Task Intelligence errors
    Never shown directly to clients - use specific subclasses
    """
    status_code = 500
    default_message = "An error occurred during task analysis"


class SemanticAnalysisError(TaskIntelligenceError):
    """
    Raised when semantic analysis fails
    Indicates input validation or text processing issues
    
    HTTP 400 - Bad Request
    Common causes:
    - Empty title or description
    - Invalid characters
    - Text too short to analyze
    """
    status_code = 400
    default_message = "Unable to analyze task content"


class ScoringError(TaskIntelligenceError):
    """
    Raised when scoring calculation fails
    Indicates calculation or configuration issues
    
    HTTP 422 - Unprocessable Entity
    Common causes:
    - Invalid phase name
    - Calculation overflow
    - Missing configuration
    """
    status_code = 422
    default_message = "Unable to calculate task score"


class ConfigurationError(TaskIntelligenceError):
    """
    Raised when system configuration is invalid
    Should never happen in production if properly deployed
    
    HTTP 500 - Internal Server Error
    """
    status_code = 500
    default_message = "System configuration error"
