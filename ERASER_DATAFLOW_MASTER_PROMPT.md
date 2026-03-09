# ERASER.IO DATAFLOW DIAGRAM - MASTER PROMPT

## Hustle OS v2 - Enterprise Management System with AI-Driven Analytics

---

## DIAGRAM PROMPT FOR ERASER.IO

```
title Hustle OS v2 - Complete System Dataflow Architecture

// ==========================================
// ACTORS - ORGANIZATIONAL HIERARCHY
// ==========================================

CEO [icon: crown, color: gold] {
  description: "Chief Executive Officer - Full system access, strategic decisions"
}

CoFounder [icon: star, color: purple] {
  description: "Co-Founder - Business insights, RAG queries, task delegation"
}

HR [icon: users, color: blue] {
  description: "HR Manager - Leave approval, attendance monitoring, payroll"
}

Manager [icon: briefcase, color: green] {
  description: "Project Manager - Task assignment, bunch management, team oversight"
}

TeamLead [icon: flag, color: teal] {
  description: "Team Lead - Task delegation, intern mentoring"
}

Developer [icon: code, color: orange] {
  description: "Senior/Junior Developer - Task execution, punch-in/out"
}

Intern [icon: graduation-cap, color: gray] {
  description: "Intern - Task completion, learning under mentorship"
}

// ==========================================
// FRONTEND LAYER
// ==========================================

ReactFrontend [icon: react, color: cyan] {
  description: "Vite + React UI - Role-based dashboards"
}

CEODashboard [icon: layout, color: gold]
CoFounderDashboard [icon: layout, color: purple]
HRDashboard [icon: layout, color: blue]
ManagerDashboard [icon: layout, color: green]
EmployeeDashboard [icon: layout, color: orange]

VoiceInterface [icon: mic, color: red] {
  description: "Voice Agent UI - Push-to-talk, real-time transcription"
}

// ==========================================
// BACKEND SERVICES
// ==========================================

NodeBackend [icon: server, color: green] {
  description: "Node.js + Express API Server"
}

AuthController [icon: lock]
AttendanceController [icon: clock]
LeaveController [icon: calendar]
TaskController [icon: check-square]
PerformanceController [icon: trending-up]
ProjectController [icon: folder]
HRController [icon: users]
AnalyticsController [icon: bar-chart]

// ==========================================
// AI/ML ENGINE (PYTHON)
// ==========================================

PythonAIEngine [icon: brain, color: yellow] {
  description: "Flask AI & RAG Engine"
}

RAGAgent [icon: search, color: purple] {
  description: "Retrieval Augmented Generation - Natural language Q&A"
}

DirectMongoRetriever [icon: database, color: green]
VectorStore [icon: grid, color: blue]
EmbeddingsManager [icon: cpu]

VoicePipeline [icon: mic, color: red] {
  description: "Voice Processing Pipeline"
}

SpeechToText [icon: message-circle] {
  description: "Whisper STT - Audio transcription"
}

TextToSpeech [icon: volume-2] {
  description: "Edge TTS - Neural voice synthesis"
}

IntentHandler [icon: target] {
  description: "Intent classification & routing"
}

TaskBreakdownAI [icon: layers, color: orange] {
  description: "Gemini AI - Project decomposition into parallel bunches"
}

// ==========================================
// DATABASE LAYER
// ==========================================

MongoDB [icon: database, color: green] {
  description: "MongoDB Atlas - Primary data store"
}

UsersCollection [icon: users]
TasksCollection [icon: check-square]
ProjectsCollection [icon: folder]
AttendanceCollection [icon: clock]
LeaveCollection [icon: calendar]
PerformanceCollection [icon: trending-up]
TaskBunchCollection [icon: package]

ChromaDB [icon: hexagon, color: purple] {
  description: "Vector database for RAG embeddings"
}

// ==========================================
// EXTERNAL SERVICES
// ==========================================

OpenRouter [icon: cloud, color: blue] {
  description: "LLM API Gateway - GPT/Claude"
}

GeminiAI [icon: sparkles, color: purple] {
  description: "Google Gemini - Task breakdown generation"
}

// ==========================================
// DATA FLOWS - AUTHENTICATION & HIERARCHY
// ==========================================

CEO --> ReactFrontend: Login
CoFounder --> ReactFrontend: Login
HR --> ReactFrontend: Login
Manager --> ReactFrontend: Login
TeamLead --> ReactFrontend: Login
Developer --> ReactFrontend: Login
Intern --> ReactFrontend: Login

ReactFrontend --> NodeBackend: JWT Auth Request
NodeBackend --> AuthController: Validate credentials
AuthController --> MongoDB: Query Users
MongoDB --> AuthController: User + Role data
AuthController --> NodeBackend: JWT Token + Role
NodeBackend --> ReactFrontend: Authenticated session

// Role-based dashboard routing
ReactFrontend --> CEODashboard: role=ceo
ReactFrontend --> CoFounderDashboard: role=co-founder
ReactFrontend --> HRDashboard: role=hr
ReactFrontend --> ManagerDashboard: role=manager
ReactFrontend --> EmployeeDashboard: role=developer/intern

// ==========================================
// DATA FLOWS - ATTENDANCE MANAGEMENT
// ==========================================

Developer --> ReactFrontend: Punch In/Out
Intern --> ReactFrontend: Punch In/Out

ReactFrontend --> NodeBackend: Attendance API call
NodeBackend --> AttendanceController: Process punch request
AttendanceController --> MongoDB: Check leave status
AttendanceController --> MongoDB: Create/Update attendance
MongoDB --> AttendanceController: Attendance record
AttendanceController --> NodeBackend: Response
NodeBackend --> ReactFrontend: Confirmation

HR --> HRDashboard: View attendance reports
HRDashboard --> NodeBackend: Get attendance data
NodeBackend --> AttendanceController: Aggregate attendance
AttendanceController --> MongoDB: Query all attendance
MongoDB --> AttendanceController: Attendance records
AttendanceController --> NodeBackend: Aggregated data
NodeBackend --> HRDashboard: Attendance reports

// ==========================================
// DATA FLOWS - LEAVE MANAGEMENT
// ==========================================

Developer --> ReactFrontend: Submit leave request
Intern --> ReactFrontend: Submit leave request

ReactFrontend --> NodeBackend: Create leave request
NodeBackend --> LeaveController: Process leave
LeaveController --> MongoDB: Check leave balance
LeaveController --> MongoDB: Create leave request (pending)
MongoDB --> LeaveController: Leave created
LeaveController --> NodeBackend: Pending approval

Manager --> ManagerDashboard: View pending leaves
HR --> HRDashboard: View pending leaves
ManagerDashboard --> NodeBackend: Get pending leaves
HRDashboard --> NodeBackend: Get pending leaves
NodeBackend --> LeaveController: Query pending
LeaveController --> MongoDB: Get leaves by status
MongoDB --> LeaveController: Pending leaves

Manager --> ManagerDashboard: Approve/Reject leave
HR --> HRDashboard: Approve/Reject leave
ManagerDashboard --> NodeBackend: Update leave status
HRDashboard --> NodeBackend: Update leave status
NodeBackend --> LeaveController: Update status
LeaveController --> MongoDB: Update leave + balance
MongoDB --> LeaveController: Updated record
LeaveController --> NodeBackend: Notification sent

// ==========================================
// DATA FLOWS - TASK & BUNCH MANAGEMENT
// ==========================================

Manager --> ManagerDashboard: Create Project (AI enabled)
ManagerDashboard --> NodeBackend: Create project request
NodeBackend --> ProjectController: Process project
ProjectController --> MongoDB: Save project
ProjectController --> PythonAIEngine: Trigger task breakdown

PythonAIEngine --> TaskBreakdownAI: Generate bunches
TaskBreakdownAI --> GeminiAI: Send project SRS
GeminiAI --> TaskBreakdownAI: Parallel bunches response
TaskBreakdownAI --> PythonAIEngine: Parsed bunches

PythonAIEngine --> NodeBackend: Bunches data
NodeBackend --> TaskController: Create tasks from bunches
TaskController --> MongoDB: Save TaskBunches
TaskController --> MongoDB: Save individual Tasks
MongoDB --> TaskController: Tasks created

Manager --> ManagerDashboard: View bunches
ManagerDashboard --> NodeBackend: Get project bunches
NodeBackend --> ProjectController: Fetch bunches
ProjectController --> MongoDB: Query TaskBunches
MongoDB --> ProjectController: Bunches with tasks
ProjectController --> NodeBackend: Bunches data
NodeBackend --> ManagerDashboard: Display bunches

Manager --> ManagerDashboard: Assign bunch to developer
ManagerDashboard --> NodeBackend: Assign bunch
NodeBackend --> TaskController: Update assignee
TaskController --> MongoDB: Update bunch + all tasks
MongoDB --> TaskController: Updated
TaskController --> NodeBackend: Assignment confirmed

Developer --> EmployeeDashboard: View assigned tasks
EmployeeDashboard --> NodeBackend: Get my tasks
NodeBackend --> TaskController: Query by assignee
TaskController --> MongoDB: Get tasks
MongoDB --> TaskController: Task list
TaskController --> NodeBackend: Tasks
NodeBackend --> EmployeeDashboard: Display tasks

Developer --> EmployeeDashboard: Update task status
EmployeeDashboard --> NodeBackend: Update task
NodeBackend --> TaskController: Update status
TaskController --> MongoDB: Update task + recalc bunch progress
MongoDB --> TaskController: Updated
TaskController --> NodeBackend: New progress
NodeBackend --> EmployeeDashboard: Updated view

// ==========================================
// DATA FLOWS - RAG SYSTEM (VOICE & TEXT)
// ==========================================

CoFounder --> VoiceInterface: Voice query
VoiceInterface --> PythonAIEngine: Audio stream (WebSocket)

PythonAIEngine --> VoicePipeline: Process audio
VoicePipeline --> SpeechToText: Transcribe
SpeechToText --> VoicePipeline: Text transcription
VoicePipeline --> IntentHandler: Classify intent

IntentHandler --> RAGAgent: Complex query
RAGAgent --> DirectMongoRetriever: Fetch relevant data
DirectMongoRetriever --> MongoDB: Query multiple collections
MongoDB --> DirectMongoRetriever: Raw documents
DirectMongoRetriever --> RAGAgent: Context documents

RAGAgent --> VectorStore: Semantic search
VectorStore --> ChromaDB: Vector similarity
ChromaDB --> VectorStore: Similar docs
VectorStore --> RAGAgent: Retrieved context

RAGAgent --> OpenRouter: Generate answer
OpenRouter --> RAGAgent: LLM response
RAGAgent --> VoicePipeline: Text answer

VoicePipeline --> TextToSpeech: Synthesize speech
TextToSpeech --> VoicePipeline: Audio chunks
VoicePipeline --> PythonAIEngine: Streaming audio
PythonAIEngine --> VoiceInterface: Audio + captions

// Text-based RAG
CoFounder --> CoFounderDashboard: Text query
CoFounderDashboard --> NodeBackend: RAG query
NodeBackend --> PythonAIEngine: Forward query
PythonAIEngine --> RAGAgent: Process query
RAGAgent --> DirectMongoRetriever: Retrieve
RAGAgent --> OpenRouter: Generate
OpenRouter --> RAGAgent: Answer
RAGAgent --> PythonAIEngine: Response
PythonAIEngine --> NodeBackend: Answer + citations
NodeBackend --> CoFounderDashboard: Display insights

// Action requests via RAG
CoFounder --> VoiceInterface: "Assign task to developer"
VoiceInterface --> PythonAIEngine: Action request
PythonAIEngine --> IntentHandler: Detect action intent
IntentHandler --> RAGAgent: Action flow
RAGAgent --> MongoDB: Validate entities
RAGAgent --> NodeBackend: Create task API
NodeBackend --> TaskController: Create task
TaskController --> MongoDB: Save task
MongoDB --> TaskController: Task created
TaskController --> NodeBackend: Confirmation
NodeBackend --> PythonAIEngine: Success
PythonAIEngine --> TextToSpeech: Confirm message
TextToSpeech --> VoiceInterface: "Task assigned successfully"

// ==========================================
// DATA FLOWS - PERFORMANCE ANALYTICS
// ==========================================

HR --> HRDashboard: View performance rankings
CEO --> CEODashboard: View performance analytics

HRDashboard --> NodeBackend: Get performance data
CEODashboard --> NodeBackend: Get performance data
NodeBackend --> PerformanceController: Aggregate metrics
PerformanceController --> MongoDB: Query tasks + users
MongoDB --> PerformanceController: Raw data
PerformanceController --> PerformanceController: Calculate metrics
PerformanceController --> NodeBackend: Rankings + scores
NodeBackend --> HRDashboard: Performance view
NodeBackend --> CEODashboard: Performance view

Manager --> ManagerDashboard: View team performance
ManagerDashboard --> NodeBackend: Team metrics
NodeBackend --> PerformanceController: Filter by team
PerformanceController --> MongoDB: Team data
MongoDB --> PerformanceController: Team metrics
PerformanceController --> NodeBackend: Team performance
NodeBackend --> ManagerDashboard: Display

// ==========================================
// DATA FLOWS - HIERARCHY & DELEGATION
// ==========================================

CEO --> TeamLead: reportsTo relationship
CoFounder --> Manager: reportsTo relationship
Manager --> Developer: reportsTo relationship
TeamLead --> Intern: mentorFor relationship

Manager --> MongoDB: Delegate bunch
MongoDB --> Developer: assignedTo update
Developer --> MongoDB: Mark subtask complete
MongoDB --> Manager: Progress update notification

TeamLead --> ManagerDashboard: Request task delegation
ManagerDashboard --> NodeBackend: Check canDelegate flag
NodeBackend --> TaskController: Validate seniority
TaskController --> MongoDB: Check seniorityLevel
MongoDB --> TaskController: senior/lead allowed
TaskController --> NodeBackend: Delegation approved
NodeBackend --> ManagerDashboard: Task delegated to intern
```

---

## SYSTEM COMPONENTS SUMMARY

### 1. **Organizational Hierarchy** (7 Levels)
| Role | Access Level | Key Functions |
|------|--------------|---------------|
| **CEO** | Full System | Strategic oversight, all analytics, final approvals |
| **Co-Founder** | RAG + Analytics | Voice queries, business insights, task delegation to managers |
| **HR** | HR Module | Leave approval, attendance tracking, payroll, performance |
| **Manager** | Project Scope | Bunch assignment, task creation, team monitoring |
| **Team Lead** | Team Scope | Task delegation to juniors, mentoring |
| **Developer** | Self Scope | Task execution, punch-in/out, leave requests |
| **Intern** | Self Scope | Task completion, learning |

### 2. **Core Modules**

#### Attendance System
- Punch In/Out with location & device tracking
- Leave-attendance synchronization (blocks punch if on leave)
- Overtime calculation
- IP logging and fraud detection

#### Leave Management
- Leave types: Sick, Casual, Vacation, Maternity, Paternity, Compensatory
- Balance tracking per year
- Multi-level approval (Manager → HR)
- Handover workflow

#### Task & Bunch Management
- AI-generated parallel bunches from project SRS
- Bunch phases: Frontend, Backend, AI, Testing, DevOps, Integration
- Skill-based assignment
- Progress tracking at bunch and task level
- Dependency management between bunches

#### Performance Analytics
- Completion rate calculation
- Productivity scoring
- Points-based ranking
- Period filtering (monthly, quarterly, yearly)

### 3. **AI/ML Components**

#### RAG (Retrieval Augmented Generation)
- **DirectMongoRetriever**: Real-time data from MongoDB collections
- **VectorStore**: ChromaDB embeddings for semantic search
- **OpenRouter LLM**: GPT/Claude for answer generation
- **Intent Detection**: Action vs Query classification

#### Voice Agent
- **STT**: Whisper (local) + Distil-Whisper (streaming)
- **TTS**: Microsoft Edge TTS with chunked streaming
- **Pipeline**: Parallel processing for <1s latency goal
- **Features**: Filler responses, instant greetings, interruption handling

#### Task Breakdown AI
- **Model**: Google Gemini 2.5 Flash
- **Input**: Project name + SRS/description
- **Output**: Parallel execution phases with micro-tasks
- **Phases**: 12 standard bunch categories

### 4. **Data Stores**

| Store | Purpose |
|-------|---------|
| **MongoDB Atlas** | Primary database (Users, Tasks, Projects, Attendance, Leave, Performance) |
| **ChromaDB** | Vector embeddings for RAG semantic search |
| **TTS Cache** | Pre-generated voice responses for common queries |

---

## KEY DATAFLOW PATTERNS

### Pattern 1: Hierarchical Approval
```
Employee → Submit Request → Manager Review → HR Approval → Status Update → Notification
```

### Pattern 2: AI-Assisted Project Breakdown
```
Manager → Create Project → Gemini AI → Generate Bunches → Store Tasks → Assign to Team
```

### Pattern 3: Voice-to-Action
```
CoFounder → Voice → STT → Intent → RAG/Action → Backend API → DB → TTS → Audio Response
```

### Pattern 4: Real-time Analytics
```
Query → MongoDB Aggregation → Metrics Calculation → Cache → Dashboard Visualization
```

---

## NOTES FOR ERASER.IO

1. **Use hierarchical layout** for the organizational structure (top-down)
2. **Use left-to-right flow** for the technical architecture
3. **Color coding**: 
   - Gold/Yellow: Leadership (CEO, CoFounder)
   - Blue: HR functions
   - Green: Manager/Backend
   - Orange: Developers
   - Purple: AI/ML components
   - Red: Voice processing
4. **Group related components** using containers
5. **Show bidirectional flows** for real-time features (Voice, WebSocket)

---

## QUICK REFERENCE - ERASER DIAGRAM TYPES

For different views, you can create:

1. **Entity Relationship Diagram** - User roles and permissions
2. **Sequence Diagram** - Leave approval workflow
3. **Flowchart** - Voice agent processing pipeline
4. **Architecture Diagram** - Full system components
5. **Cloud Diagram** - Deployment infrastructure

---

*Generated for Hustle OS v2 - The Hustle House Enterprise Management Platform*
