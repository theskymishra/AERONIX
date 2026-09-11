# AERONIX HR

### Workforce Intelligence Platform

> **People. Intelligence. Connected.**

AERONIX HR is a modern, production-oriented Employee Management and
Workforce Intelligence Platform designed to bring HR operations,
organizational intelligence, analytics, and immersive workforce
visualization into a single system.

---

## ✨ Vision

AERONIX HR goes beyond traditional employee-management CRUD systems.

The platform combines everyday HR workflows with intelligent analytics
and interactive experiences such as:

- 🧬 Organization DNA
- 📊 Workforce Pulse
- 👤 Employee 360°
- ⌘ Smart Command Center
- ⏳ Time Machine
- 🧭 Employee Journey
- 🔥 Leave Heatmap
- 🌌 Skills Galaxy
- 🎯 Internal Opportunity Engine
- 🚀 Onboarding Mission

---

## 🧠 Core Modules

### Workforce

- Employee management
- Departments
- Teams
- Employee profiles
- Employee 360°
- Employee Journey

### HR Operations

- Attendance
- Leave management
- Payroll
- Documents
- Announcements
- Notifications

### Performance

- Performance reviews
- Goals
- Skills
- Workforce Pulse

### Recruitment

- Job openings
- Applications
- Interviews
- Internal Opportunity Engine

### Administration

- Authentication
- Role-based access control
- Permissions
- Settings
- Audit logs

### Intelligence & Visualization

- Organization DNA
- Skills Galaxy
- Leave Heatmap
- Workforce Pulse
- Time Machine
- Advanced analytics

---

## 🎨 Design Philosophy

> **3D for exploration. 2D for productivity.**

AERONIX uses immersive 3D experiences where visualization adds value while
keeping everyday HR workflows fast, accessible, and familiar.

### 3D

Used for:

- Organization DNA
- Skills Galaxy
- Selected analytics
- Interactive onboarding
- Hero experiences

### 2D

Used for:

- Forms
- Tables
- Payroll
- Settings
- Reports
- Administrative workflows

The product should remain usable even when advanced 3D effects are disabled.

---

## 🏗️ Architecture

```text
┌──────────────────────────────┐
│        AERONIX Web           │
│ Next.js + React + TypeScript │
└──────────────┬───────────────┘
               │
               │ REST API
               ▼
┌──────────────────────────────┐
│        AERONIX API           │
│      NestJS + TypeScript     │
└──────────────┬───────────────┘
               │
               │ Mongoose
               ▼
┌──────────────────────────────┐
│       MongoDB Atlas          │
└──────────────────────────────┘
🛠️ Technology Stack
Frontend
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
Backend
NestJS
TypeScript
REST API
JWT authentication
Mongoose
Database
MongoDB Atlas
Infrastructure
Docker
Docker Compose
Git
GitHub
GitHub Actions
Testing
Vitest
Playwright
📁 Repository Structure
aeronix/
├── apps/
│   ├── web/                  # Next.js frontend
│   └── api/                  # NestJS backend
│
├── packages/
│   ├── database/             # Database layer
│   ├── types/                # Shared TypeScript types
│   └── config/               # Shared configuration
│
├── infrastructure/
│   └── docker/               # Docker infrastructure
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
🔐 Security
AERONIX is designed with security as a core requirement.
Planned security controls include:
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
Sensitive HR information receives additional authorization controls.
🗄️ Database
AERONIX uses MongoDB Atlas with Mongoose.
The database architecture is designed around entities such as:
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
Performance
Goals
Skills
Documents
Recruitment
Notifications
Announcements
Career History
Audit Logs
Historical Snapshots
Workforce Metrics
Detailed database planning is available in:
docs/database/schema.md
🔌 API
The API uses URI-based versioning.
Base API:
/api/v1
Health endpoint:
GET /api/v1/health
Example response:
{
  "status": "ok",
  "service": "aeronix-api"
}
🧪 Development
Prerequisites
Node.js 24 LTS
npm
Git
Docker
MongoDB Atlas account
Install dependencies
From the repository root:
npm install
Start the API
npm run start --workspace=api
Start the web application
npm run dev --workspace=web
🌱 Development Methodology
AERONIX is developed milestone-by-milestone.
Each milestone follows:
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
Major modules are not considered complete until their:
UI
API
database integration
authorization
validation
testing
responsive behavior
accessibility
performance
have been considered.
🗺️ Roadmap
Milestone 1 — Foundation & Architecture
 Development environment
 Git repository
 Monorepo structure
 Next.js frontend
 NestJS backend
 MongoDB Atlas
 Mongoose
 Environment configuration
 API health endpoint
 API versioning
 Architecture documentation
 Database architecture documentation
 Frontend verification
 First Git commit
Milestone 2 — Design System
 AERONIX visual language
 Typography
 Colors
 Spacing
 Components
 Motion system
 3D visual language
 Responsive design foundation
Milestone 3 — Authentication
 Login
 Registration
 Email verification
 Password reset
 Sessions
 JWT
 Refresh tokens
Milestone 4 — RBAC
 Roles
 Permissions
 Protected routes
 API authorization
 Role-specific dashboards
Milestone 5 — Employee System
 Employees
 Departments
 Teams
 Employee profiles
 Employee 360°
 Employee Journey
Milestone 6 — Attendance & Leave
 Attendance
 Leave types
 Leave requests
 Approval workflow
 Leave Heatmap
Milestone 7 — Payroll
 Salary structures
 Payroll records
 Allowances
 Deductions
 Payroll reports
Milestone 8 — Performance & Goals
 Performance reviews
 Goals
 Skills
 Workforce Pulse
Milestone 9 — Organization DNA
 3D organization graph
 Departments
 Teams
 Reporting relationships
 Search
 Filters
 Interactive exploration
Milestone 10 — Skills Galaxy
 3D skills visualization
 Skill filtering
 Employee drill-down
 Expertise relationships
Milestone 11 — Recruitment
 Job openings
 Applications
 Interviews
 Internal Opportunity Engine
Milestone 12 — Notifications & Audit
 Notifications
 Activity feed
 Audit logs
Milestone 13 — Reports
 Analytics
 Reports
 Export
 Data visualization
Milestone 14 — Testing
 Unit tests
 Integration tests
 Authorization tests
 E2E tests
 Critical workflow testing
Milestone 15 — Infrastructure
 Docker
 Docker Compose
 GitHub Actions
 CI/CD
 Deployment
Milestone 16 — Final Polish
 Accessibility
 Responsive design
 Performance optimization
 3D optimization
 Security review
 UX polish
 Production readiness
📚 Documentation
Architecture:
docs/architecture/
Database:
docs/database/
API:
docs/api/
Design:
docs/design/
⚠️ Project Status
AERONIX HR is currently under active development.
The current release is a development foundation and is not yet intended
for production use.
📄 License
License information will be added before public release.