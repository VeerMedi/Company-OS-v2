# Task Bunch System - Quick Guide

## What Changed

### 1. Core Task Breakdown (task_breakdown.py)
- Updated LLM prompt to generate PARALLEL bunches (Frontend, Backend, AI, Testing, etc.)
- Outputs micro-tasks within each bunch for delegation
- Uses standardized phase names

### 2. Database Models

**User Model** (backend/models/User.js)
```javascript
skills: [String]                    // e.g., ['Frontend Developer', 'AI Developer']
seniorityLevel: String              // 'intern' | 'junior' | 'senior' | 'lead' | 'principal'
reportsTo: ObjectId                 // For hierarchy
canDelegate: Boolean                // Can assign tasks to others
```

**TaskBunch Model** (NEW: backend/models/TaskBunch.js)
```javascript
name: String                        // Phase name
project: ObjectId
tasks: [ObjectId]                   // Array of tasks
assignedTo: ObjectId                // Senior employee
status: String                      // 'pending-assignment' | 'assigned' | 'in-progress' | 'completed'
requiredSkills: [String]
deadline: Date
progress: Number                    // 0-100%
```

**Task Model** (backend/models/Task.js)
```javascript
taskBunch: ObjectId                 // Link to bunch
dependsOnTasks: [{                  // Inter-bunch dependencies
  task: ObjectId,
  taskBunch: ObjectId,
  status: String                    // 'pending' | 'accepted' | 'completed'
}]
```

### 3. Backend Changes

**Authorization Updates:**
- Managers can now create projects (previously co-founder only)
- Managers can trigger AI automation

**New Endpoints:**
- `GET /api/projects/:id/bunches` - Get bunches for project
- `POST /api/projects/:projectId/bunches/:bunchId/assign` - Assign bunch to employee
- `GET /api/tasks/my-bunches` - Get employee's assigned bunches

**Simplified Services:**
- Removed complex bunchAssignmentService
- Assignment logic simplified inline in routes
- Delegation handled through existing task update endpoints

### 4. Frontend Changes

**Keep:**
- BunchTaskView.jsx - For employee dashboard (shows bunches with tasks)

**Removed:**
- CreateProjectForm.jsx (use existing form)
- BunchAssignmentView.jsx (use existing manager dashboard)

## Setup

### 1. Seed Employees
```bash
node backend/scripts/seedEmployeeSkills.js
```

This sets up:
- Rahul: AI Developer, Senior, Can Delegate
- Veer: AI Developer, Senior, Can Delegate  
- Krishna: Full Stack, Senior, Can Delegate
- Mohit: Frontend, Senior, Can Delegate

### 2. Start LLM Service
```bash
cd Auto-LLM
python api.py
```

### 3. Restart Backend
```bash
cd backend
npm start
```

## Usage Flow

### Manager Creates Project with Bunches

1. **Create Project** (existing form in manager dashboard)
2. **Trigger AI**: Click automation button
3. **LLM generates bunches**: Frontend, Backend, AI, Testing bunches created automatically
4. **Manager reviews bunches**: See in project view
5. **Assign bunches**: Assign each bunch to a senior employee

### Senior Employee Works on Bunch

1. **View bunches**: Dashboard shows assigned bunches
2. **See tasks**: Expand bunch to view all micro-tasks
3. **Delegate tasks**: (Optional) Assign specific tasks to interns
4. **Track progress**: Bunch progress auto-calculated from task completion

## API Examples

### Get bunches for a project
```javascript
GET /api/projects/PROJECT_ID/bunches
Authorization: Bearer TOKEN
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "name": "Frontend Development",
      "tasks": [...],
      "requiredSkills": ["Frontend Developer"],
      "progress": 60,
      "assignedTo": { ... }
    }
  ]
}
```

### Assign bunch to employee
```javascript
POST /api/projects/PROJECT_ID/bunches/BUNCH_ID/assign
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "employeeId": "EMPLOYEE_ID"
}
```

### Get my bunches
```javascript
GET /api/tasks/my-bunches
Authorization: Bearer TOKEN
```

## Key Files

### Modified
- `Auto-LLM/task_breakdown.py` - Updated LLM prompt for parallel bunches
- `backend/models/User.js` - Added skills, seniority, hierarchy
- `backend/models/Task.js` - Added taskBunch, dependencies
- `backend/controllers/projectController.js` - Updated to create bunches
- `backend/utils/llmTaskParser.js` - Groups tasks into bunches
- `backend/routes/projects.js` - Added bunch endpoints
- `backend/routes/tasks.js` - Added my-bunches endpoint

### New
- `backend/models/TaskBunch.js` - Bunch model
- `backend/scripts/seedEmployeeSkills.js` - Seed script
- `frontend/src/components/BunchTaskView.jsx` - Employee bunch view

### Removed
- `backend/routes/bunches.js` (consolidated into projects.js)
- `backend/services/bunchAssignmentService.js` (simplified inline)
- `frontend/src/components/CreateProjectForm.jsx` (not needed)
- `frontend/src/components/BunchAssignmentView.jsx` (use existing UI)

## Integration with Existing System

The system works with your existing:
- Manager Dashboard - just enable automation button for managers
- Employee Dashboard - import BunchTaskView component
- Project creation flow - same form, just manager can access
- Task management - bunches are just grouped tasks

No major UI changes needed - just show bunches as grouped tasks!

## Troubleshooting

**LLM not creating bunches?**
- Check Auto-LLM/api.py is running on port 5001
- Verify task_breakdown.py has updated prompt

**Employees not showing skills?**
- Run: `node backend/scripts/seedEmployeeSkills.js`
- Check MongoDB: `db.users.find({skills: {$exists: true}})`

**Manager can't access automation?**
- Verify routes/projects.js has 'manager' in authorizeRoles
- Check user role in database

---

**That's it!** The system is simplified and ready to use.
