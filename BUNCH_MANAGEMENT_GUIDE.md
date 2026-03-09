# Task Bunch Management - Manager Dashboard

## Overview
Task bunches allow managers to organize AI-generated project tasks into parallel execution phases and assign them to team members for efficient project management.

## Features

### 1. **AI-Generated Task Bunches**
When a manager creates a project with AI automation enabled, the system automatically:
- Breaks down the project into parallel execution phases (bunches)
- Groups tasks by technical domain (Frontend, Backend, AI, Testing, etc.)
- Identifies required skills for each bunch
- Calculates dependencies between bunches
- Sets start dates and deadlines for each phase

### 2. **Bunch Types**
The AI generates bunches for the following phases:
- 🎨 **Frontend Development** - UI/UX implementation
- ⚙️ **Backend Development** - Server-side logic
- 💻 **Full Stack Development** - End-to-end features
- 🤖 **AI Functionalities** - ML/AI integrations
- 🧪 **Testing & QA** - Quality assurance
- 🚀 **DevOps & Deployment** - Infrastructure setup
- 🔗 **Integration** - System integrations
- 🗄️ **Database & Architecture** - Data layer design
- 🔒 **Security & Performance** - Optimization tasks
- 📚 **Documentation** - Technical documentation

### 3. **Viewing Bunches**
1. Navigate to **Manager Dashboard** → **Project Status**
2. Expand an AI-generated project (marked with ✨ AI Generated badge)
3. Click **"View Bunches"** button (purple button with package icon)
4. View all task bunches with their metrics

### 4. **Bunch Information Display**
Each bunch card shows:
- **Phase Name** with emoji icon
- **Required Skills** (React, Node.js, Python, etc.)
- **Task Count** - Number of tasks in the bunch
- **Progress Percentage** - Completion status
- **Assigned Team Member** - Current assignee
- **Timeline** - Start date and deadline
- **Status Badge** - Not Started, In Progress, Completed, Blocked

### 5. **Assigning Bunches**
1. Click on a bunch card to expand details
2. Click **"Assign Bunch"** or **"Reassign Bunch"** button
3. Select an employee from the dropdown
   - Shows employee name and role
   - Dropdown includes all individuals (developers, seniors, etc.)
4. Click **"Confirm"** to assign
5. All tasks within the bunch are automatically assigned to the selected employee

### 6. **Backend API Endpoints**

#### Get Project Bunches
```javascript
GET /api/projects/:id/bunches
```
Returns all bunches for a project with populated assignee and task details.

#### Assign Bunch to Employee
```javascript
POST /api/projects/:projectId/bunches/:bunchId/assign
Body: { employeeId: "userId" }
```
Assigns a bunch and all its tasks to an employee.

### 7. **Database Model**

**TaskBunch Schema:**
```javascript
{
  name: String,              // "Frontend Development"
  phase: String,             // "PHASE 1: Development"
  project: ObjectId,         // Reference to Project
  tasks: [ObjectId],         // Array of Task references
  assignedTo: ObjectId,      // User reference
  assignedBy: ObjectId,      // Manager who assigned
  requiredSkills: [String],  // ["React", "TypeScript"]
  progress: Number,          // 0-100
  status: String,            // not-started, in-progress, completed, blocked
  startDate: Date,
  deadline: Date,
  estimatedDuration: Number, // days
  dependsOnBunches: [ObjectId], // Prerequisites
  order: Number              // Execution sequence
}
```

## User Flow

### Manager Workflow:
1. **Create Project** → Enable AI automation
2. **Wait for AI Generation** → System creates bunches automatically
3. **View Project Status** → See AI Generated badge
4. **Click "View Bunches"** → Navigate to bunch management
5. **Review Bunches** → Examine phases, skills, and timelines
6. **Assign to Team** → Select employee for each bunch
7. **Monitor Progress** → Track completion percentages

### Employee Workflow (Future):
1. **Receive Assignment** → Notification of bunch assignment
2. **View Bunch Details** → See all tasks in the phase
3. **Work on Tasks** → Complete tasks sequentially or in parallel
4. **Update Progress** → Bunch progress auto-calculates
5. **Delegate to Juniors** → Assign sub-tasks to interns

## Technical Implementation

### Frontend Components:
- **BunchManagement.jsx** - Main component for viewing/assigning bunches
- **ProjectStatus.jsx** - Updated to include "View Bunches" button
- **ManagerDashboard.jsx** - Added bunch-management view state

### Backend:
- **TaskBunch Model** - Database schema and methods
- **projectController.js** - automateProjectWithLLM creates bunches
- **routes/projects.js** - API endpoints for bunches

### AI Service:
- **task_breakdown.py** - Gemini AI generates parallel bunches
- **llmTaskParser.js** - Groups tasks into bunches with dependencies

## Benefits

1. **Parallel Execution** - Multiple team members work on different phases simultaneously
2. **Skill Matching** - Assign bunches based on required skills
3. **Clear Ownership** - Each bunch has one responsible person
4. **Dependency Management** - System tracks bunch prerequisites
5. **Progress Visibility** - Managers see real-time progress for each phase
6. **Automated Planning** - AI handles task breakdown and timeline estimation

## Example Use Case

**Project**: E-commerce Website Rebuild

**AI Generates Bunches:**
1. 🎨 Frontend Development (5 tasks) → Assign to Sarah (React Expert)
   - Skills: React, TypeScript, Tailwind CSS
   - Duration: 2 weeks
   
2. ⚙️ Backend Development (8 tasks) → Assign to John (Node.js Developer)
   - Skills: Node.js, Express, MongoDB
   - Duration: 3 weeks
   - Dependency: None (can start immediately)

3. 🤖 AI Functionalities (3 tasks) → Assign to Mike (ML Engineer)
   - Skills: Python, TensorFlow, NLP
   - Duration: 2 weeks
   - Dependency: Backend must be 50% complete

4. 🧪 Testing & QA (6 tasks) → Assign to Lisa (QA Lead)
   - Skills: Jest, Cypress, Load Testing
   - Duration: 1 week
   - Dependency: Frontend and Backend must be complete

**Result:** 
- All phases start in parallel where possible
- Dependencies ensure correct execution order
- Manager assigns bunches in 5 minutes instead of manually creating 22 individual tasks
- Team members have clear ownership and focus areas

## Next Steps

1. **Employee Dashboard Integration** - Show assigned bunches in employee view
2. **Delegation Feature** - Allow seniors to delegate tasks within their bunch to juniors
3. **Bunch Progress Auto-calculation** - Update bunch progress based on task completion
4. **Dependency Visualization** - Show dependency graph for bunches
5. **Notifications** - Alert team members when assigned a new bunch
6. **Bunch Templates** - Save common bunch structures for reuse

## Support

For issues or questions about bunch management, contact:
- Technical Support: [Your Support Email]
- Documentation: See PROJECT_AUTOMATION_GUIDE.md
