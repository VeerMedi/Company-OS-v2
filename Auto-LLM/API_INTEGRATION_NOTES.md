# API Integration Notes

## Changes Made

### Consolidated API Services
- **Before**: Two separate Flask servers running on different ports
  - `Auto-LLM/api.py` on port 5001 (task generation only)
  - `Auto-LLM/analytics-llm/api.py` on port 5002 (analytics, RAG, voice)

- **After**: Single unified Flask server on port 5002
  - All endpoints now in `Auto-LLM/analytics-llm/api.py`
  - Task generation endpoint `/generate-tasks` added to analytics-llm API

### Updated Files
1. **Auto-LLM/analytics-llm/api.py**
   - Added `/generate-tasks` endpoint (POST)
   - Imports `task_breakdown.py` from parent directory
   - Handles project name and description for LLM task generation

2. **backend/controllers/projectController.js**
   - Updated LLM API URL from `http://localhost:5001/generate-tasks` to `http://localhost:5002/generate-tasks`
   - Now calls unified API server

### File to Delete
- `Auto-LLM/api.py` (root level) - no longer needed, functionality moved to analytics-llm

### Running the Server
```bash
cd Auto-LLM/analytics-llm
python api.py
```
Server runs on port 5002 with all endpoints:
- `/generate-tasks` - Task generation (from root api.py)
- `/api/analytics/*` - Analytics endpoints
- `/api/analytics/rag/*` - RAG query endpoints
- SocketIO events for streaming voice

### Testing
Test the unified endpoint:
```bash
curl -X POST http://localhost:5002/generate-tasks \
  -H "Content-Type: application/json" \
  -d '{"project_name":"Test","project_description":"Test project"}'
```
