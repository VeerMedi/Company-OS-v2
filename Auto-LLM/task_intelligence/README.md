# Task Intelligence Engine

Multi-dimensional task complexity scoring for Hustle OS

## Overview

Intelligent system that analyzes tasks semantically and assigns dynamic complexity scores with human-readable explanations. Goes beyond static labels (High/Medium/Low) to provide nuanced, multi-dimensional analysis.

## Architecture

```
Task Input
    ↓
Semantic Analyzer → Extract keywords, detect patterns
    ↓
Dimension Calculators → Score 7 dimensions (0-10 each)
    ↓
Scoring Engine → Weighted formula → Final points
    ↓
Explanation Generator → Human-readable justification
```

## 7 Complexity Dimensions

1. **Technical Depth** - Algorithmic/architectural complexity
2. **Effort Estimation** - Scope and implementation time
3. **Ambiguity** - Clarity of requirements, research needed
4. **Dependencies** - Blocking nature, integration requirements
5. **Blast Radius** - Impact of failure on system
6. **Skill Level** - Expertise required
7. **Cross-Domain** - Multiple technical areas involved

## Usage

### Python API

```python
from task_intelligence import (
    SemanticAnalyzer, DimensionCalculators,
    TaskScoringEngine, ExplanationGenerator
)

# Initialize
analyzer = SemanticAnalyzer()
calculator = DimensionCalculators()
engine = TaskScoringEngine()
explainer = ExplanationGenerator()

# Analyze task
features = analyzer.analyze_task(
    title="Build RAG pipeline",
    description="Implement retrieval-augmented generation with vector embeddings",
    phase="AI Functionalities",
    dependencies=["database-setup"]
)

# Calculate dimensions
dimensions = calculator.calculate_all(features, "AI Functionalities")

# Get score and points
score, points = engine.calculate_score(dimensions, "AI Functionalities")

# Generate explanation
explanation = explainer.generate(dimensions, score, points, "AI Functionalities")

print(f"Points: {points}")
print(f"Explanation: {explanation}")
```

### FastAPI Service

```bash
# Start the API server
python task_intelligence_api.py

# Service runs on http://localhost:8000
```

```bash
# Score a task via API
curl -X POST http://localhost:8000/api/score-task \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement authentication",
    "description": "Build JWT-based auth with login and register",
    "phase": "Backend Development",
    "dependencies": ["database"]
  }'
```

## Phase-Specific Weighting

Different phases prioritize different dimensions:

| Phase | Top Priority Dimensions |
|-------|------------------------|
| AI Functionalities | Technical Depth (25%), Skill Level (15%) |
| Backend Development | Dependencies (25%), Technical Depth (20%) |
| Frontend Development | Effort (20%), Technical Depth (15%) |
| DevOps & Deployment | Blast Radius (25%), Dependencies (20%) |
| Integration | Dependencies (30%), Ambiguity (15%) |

## Score to Points Conversion

- 0-20 → 5 points (Simple)
- 21-35 → 10 points (Easy)
- 36-50 → 15 points (Medium)
- 51-65 → 20 points (Complex)
- 66-80 → 30 points (Hard)
- 81-100 → 50 points (Expert)

## Integration with Hustle OS

The engine will be integrated into the task creation pipeline:

1. User creates task
2. Backend calls Task Intelligence API
3. Engine analyzes and scores
4. Points and explanation saved to task
5. Task displayed with intelligent score

## Files

```
task_intelligence/
├── __init__.py
├── config.py                    # Phase weights, keywords
├── semantic_analyzer.py         # Keyword extraction
├── dimension_calculators.py     # 7 dimension scorers
├── scoring_engine.py            # Weighted formula
└── explanation_generator.py     # Human explanations

task_intelligence_api.py         # FastAPI service
requirements_intelligence.txt    # Dependencies
```

## Installation

```bash
pip install -r requirements_intelligence.txt
```

## Testing

Test the engine:

```bash
python -c "from task_intelligence import *; # run inline test"
```

## Key Features

✅ Semantic understanding (not hardcoded rules)  
✅ Two "High" tasks can have different scores  
✅ Phase-specific weighting  
✅ Human-readable explanations  
✅ Works across all project types  
✅ REST API for integration  

---

Built for Hustle OS - Intelligent Task Management
