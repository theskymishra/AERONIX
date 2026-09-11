# AERONIX HR — System Architecture

## 1. Product

**AERONIX HR** is a Workforce Intelligence Platform designed to provide
employee management, organizational intelligence, HR operations, analytics,
and workforce visualization in a single system.

### Positioning

> People. Intelligence. Connected.

---

## 2. Architecture Style

AERONIX uses a modular full-stack architecture.

```text
┌──────────────────────────────┐
│        AERONIX Web           │
│ Next.js + React + TypeScript │
└──────────────┬───────────────┘
               │ REST API
               ▼
┌──────────────────────────────┐
│        AERONIX API           │
│ NestJS + TypeScript          │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│      Application Services    │
│ Auth / Employees / HR / etc. │
└──────────────┬───────────────┘
               │ Mongoose
               ▼
┌──────────────────────────────┐
│       MongoDB Atlas          │
│          Database            │
└──────────────────────────────┘


3. Repository Structure
aeronix/
├── apps/
│   ├── web/                    # Next.js frontend
│   └── api/                    # NestJS backend
│
├── packages/
│   ├── database/               # Shared database layer
│   ├── types/                  # Shared TypeScript types
│   └── config/                 # Shared configuration
│
├── infrastructure/
│   └── docker/                 # Docker infrastructure
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── database/
│   └── design/
│
├── tests/
│
├── docker-compose.yml
├── package.json
└── README.md
4. Frontend
The frontend is built with:
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
Framer Motion
Three.js
React Three Fiber
Drei
Recharts
Frontend responsibilities
User interface
Navigation
Dashboard
Employee management
HR workflows
Analytics
3D organizational visualization
Authentication UI
Role-aware interfaces
Responsive experience
5. Backend
The backend is built with:
NestJS
TypeScript
REST API
JWT authentication
Mongoose
API base
/api/v1
Example:
GET /api/v1/health
GET /api/v1/employees
GET /api/v1/departments
GET /api/v1/attendance
6. Database
AERONIX uses MongoDB Atlas as its primary database.
MongoDB is accessed through Mongoose.
High-level entities include:
Organization
User
Role
Permission
Employee
Department
Team
Attendance
Leave
Payroll
Performance Review
Goal
Skill
Document
Notification
Announcement
Job Opening
Application
Interview
Career History
Audit Log
Historical Snapshot
The detailed database design is maintained separately in:
docs/database/
7. Core Product Modules
Administration
Organizations
Users
Roles
Permissions
Settings
Audit logs
Workforce
Employees
Departments
Teams
Employee 360°
Employee Journey
HR Operations
Attendance
Leave
Payroll
Documents
Announcements
Performance
Performance reviews
Goals
Skills
Workforce Pulse
Recruitment
Job openings
Applications
Interviews
Internal Opportunity Engine
Intelligence & Visualization
Organization DNA
Skills Galaxy
Leave Heatmap
Workforce Pulse
Time Machine
Analytics
8. Signature Experiences
Organization DNA
Interactive 3D visualization of the organization's structure.
Users can:
Explore departments
Explore employees
View reporting relationships
Search
Filter
Rotate
Zoom
Inspect organizational relationships
Workforce Pulse
An organizational analytics indicator based on aggregated workforce signals.
It must not be presented as a definitive measurement of an individual's
mental or emotional state.
Employee 360°
A unified employee command center containing relevant employee information
and activity.
Smart Command Center
A global command/search interface activated through:
Cmd/Ctrl + K
Time Machine
Allows authorized users to inspect historical organizational state.
Employee Journey
A chronological career timeline covering events such as:
Joining
Onboarding
Probation
Promotion
Transfer
Role changes
Salary changes
Reviews
Achievements
Skills Galaxy
3D visualization of workforce skills and expertise.
Internal Opportunity Engine
Provides transparent internal-role recommendations based on factors such as
skills, experience, goals, and projects, with explanations and identified
skill gaps.
9. Design Principle
3D for exploration. 2D for productivity.
3D experiences should be used for:
Organization DNA
Skills Galaxy
Selected analytics
Hero experiences
Interactive onboarding
Traditional 2D interfaces should be used for:
Forms
Tables
Payroll
Settings
Editing
Reports
Administrative workflows
The application must remain usable when advanced 3D effects are disabled.
10. Security
AERONIX will implement:
Password hashing
JWT authentication
Refresh-token rotation
Role-based access control
API authorization
Input validation
Rate limiting
Secure headers
MongoDB input/query sanitization
File validation
Session management
Password reset
Email verification
Audit logging
Strict authorization for sensitive HR information
Sensitive information includes, but is not limited to:
Salary
Payroll
Private documents
Performance information
Personal employee information
11. Testing Strategy
Testing will cover:
Frontend
Components
Forms
Validation
User interactions
Backend
Unit tests
API integration tests
Authorization tests
End-to-End
Playwright will be used for critical workflows.
Example:
Login
  ↓
Dashboard
  ↓
Add Employee
  ↓
Employee appears
  ↓
Open Employee Profile
  ↓
Apply Leave
  ↓
Manager Approves
  ↓
Employee sees Approval
12. Development Philosophy
Every milestone follows:
Plan
 ↓
Build
 ↓
Run
 ↓
Test
 ↓
Fix
 ↓
Polish
 ↓
Next Milestone
No major module should be built without considering:
Security
Database structure
API design
Testing
UX
Accessibility
Performance
Scalability