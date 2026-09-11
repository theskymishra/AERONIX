# AERONIX HR — Database Architecture & Schema

## 1. Database

AERONIX HR uses:

- MongoDB Atlas
- Mongoose
- MongoDB as the primary application database

Database name:

```text
aeronix

2. Database Design Principles
The database should be designed around:
Clear domain boundaries
Referential consistency
Scalability
Secure access
Efficient querying
Auditability
Historical reconstruction
Support for analytics
Support for 3D organizational visualization
MongoDB documents should not become excessively large.
Frequently queried relationships should have appropriate indexes.
3. Core Entities
Organization
Represents an organization/company using AERONIX.
Important fields:
_id
name
legalName
logo
industry
contactEmail
timezone
currency
settings
createdAt
updatedAt
User
Represents an account that can authenticate into AERONIX.
Important fields:
_id
organizationId
employeeId
email
passwordHash
roleIds
status
emailVerified
lastLoginAt
createdAt
updatedAt
A user account is separate from an employee record.
Role
Represents a system role.
Examples:
Super Admin
HR Manager
Department Manager
Employee
Important fields:
_id
organizationId
name
description
permissionIds
createdAt
updatedAt
Permission
Represents an individual system capability.
Examples:
employee.read
employee.create
employee.update
employee.delete

payroll.read
payroll.manage

leave.request
leave.approve

performance.read
performance.manage
Important fields:
_id
name
description
resource
action
4. Workforce
Employee
The central workforce entity.
Important fields:
_id
organizationId
userId
employeeCode

firstName
middleName
lastName
displayName

email
phone
profileImage

dateOfBirth
gender

dateOfJoining
employmentStatus
employmentType

departmentId
teamId
managerId

jobTitle
jobLevel
location

skills
documents

createdAt
updatedAt
Employee records should contain only appropriate profile information.
Sensitive information should have additional authorization controls.
Department
Represents an organizational department.
Important fields:
_id
organizationId
name
code
description
headEmployeeId
parentDepartmentId
createdAt
updatedAt
Team
Represents a smaller organizational unit.
Important fields:
_id
organizationId
departmentId
name
description
managerId
createdAt
updatedAt
5. Attendance
Attendance
Represents an employee's attendance record.
Important fields:
_id
organizationId
employeeId
date

status

checkIn
checkOut

workMinutes
overtimeMinutes

source

createdAt
updatedAt
Possible statuses:
present
absent
half_day
remote
holiday
leave
6. Leave Management
LeaveType
Defines available leave categories.
Examples:
Annual Leave
Sick Leave
Casual Leave
Unpaid Leave
Important fields:
_id
organizationId
name
code
description

annualAllocation
carryForwardAllowed

createdAt
updatedAt
LeaveRequest
Represents an employee leave request.
Important fields:
_id
organizationId
employeeId
leaveTypeId

startDate
endDate

totalDays
reason

status

approverId
approvedAt
rejectedAt
rejectionReason

createdAt
updatedAt
Possible statuses:
pending
approved
rejected
cancelled
7. Payroll
PayrollRecord
Represents payroll information for an employee and pay period.
Important fields:
_id
organizationId
employeeId

payPeriodStart
payPeriodEnd

baseSalary
allowances
deductions
bonuses

grossSalary
netSalary

currency

status

processedAt
createdAt
updatedAt
Payroll data requires strict authorization.
8. Performance
PerformanceReview
Represents an employee performance review.
Important fields:
_id
organizationId
employeeId
reviewerId

periodStart
periodEnd

overallRating

strengths
areasForImprovement
managerComments
employeeComments

status

createdAt
updatedAt
Goal
Represents an employee or team goal.
Important fields:
_id
organizationId
employeeId
createdBy

title
description

category

startDate
dueDate

progress

status

createdAt
updatedAt
Possible statuses:
not_started
in_progress
completed
cancelled
9. Skills
Skill
Represents a workforce skill.
Important fields:
_id
organizationId
name
category
description
EmployeeSkill
Represents an employee's relationship with a skill.
Important fields:
_id
organizationId
employeeId
skillId

proficiencyLevel
yearsOfExperience

verified
verifiedBy

createdAt
updatedAt
This relationship powers the Skills Galaxy and Internal Opportunity Engine.
10. Documents
Document
Represents an employee or organization document.
Important fields:
_id
organizationId
employeeId

name
documentType

storageKey
mimeType
fileSize

uploadedBy

visibility

createdAt
updatedAt
Actual files should be stored in object storage rather than directly inside
MongoDB.
Sensitive documents require authorization checks.
11. Recruitment
JobOpening
Represents an open position.
Important fields:
_id
organizationId

title
departmentId
teamId

description
requirements

employmentType
location

status

createdBy

openedAt
closedAt

createdAt
updatedAt
Application
Represents an application to a job opening.
Important fields:
_id
organizationId
jobOpeningId

candidateType

employeeId
candidateName
candidateEmail

resumeDocumentId

source

status

createdAt
updatedAt
Interview
Represents an interview associated with an application.
Important fields:
_id
organizationId
applicationId

interviewerIds

scheduledAt
durationMinutes

type

status

feedback

createdAt
updatedAt
12. Notifications
Notification
Represents an in-app notification.
Important fields:
_id
organizationId
recipientUserId

type
title
message

entityType
entityId

readAt

createdAt
13. Announcements
Announcement
Represents an organization announcement.
Important fields:
_id
organizationId

title
content

audience

publishedBy

publishedAt

expiresAt

createdAt
updatedAt
14. Career History
CareerEvent
Represents an important event in an employee's career.
Examples:
joined
onboarding_completed
probation_completed
promotion
transfer
role_change
salary_change
achievement
review_completed
Important fields:
_id
organizationId
employeeId

eventType
title
description

effectiveDate

metadata

createdBy

createdAt
This powers Employee Journey.
15. Audit Logs
AuditLog
Records important system actions.
Important fields:
_id
organizationId

actorUserId
actorEmployeeId

action
resource
resourceId

before
after

ipAddress
userAgent

createdAt
Examples:
employee.created
employee.updated
employee.deleted

payroll.viewed
payroll.updated

leave.approved

role.updated
Audit logs should be append-oriented and protected from normal user modification.
16. Historical Organization State
OrganizationSnapshot
Used by the Time Machine feature.
Important fields:
_id
organizationId

snapshotDate

departments
teams
employeeRelationships
roles
positions

createdAt
Snapshots should allow authorized users to reconstruct the organization's
structure at a historical point in time.
17. Workforce Intelligence
WorkforceMetric
Stores calculated organizational metrics.
Important fields:
_id
organizationId

metricType
periodStart
periodEnd

value

dimensions

calculatedAt
Examples:
attendance_rate
leave_rate
goal_completion_rate
performance_average
employee_turnover
18. Workforce Pulse
Workforce Pulse is an organizational analytics feature.
It may use aggregated signals such as:
attendance
leave trends
workload indicators
performance trends
goal progress
engagement survey results
It should provide an organizational indicator rather than claiming to determine
an individual's mental or emotional state.
19. Organization DNA Data
Organization DNA primarily derives its visualization from:
Organization
Department
Team
Employee
Manager relationships
The 3D visualization should not require a separate duplicate organizational
database.
20. Important Relationships
Organization
│
├── Users
│   ├── Roles
│   └── Permissions
│
├── Employees
│   ├── Department
│   ├── Team
│   ├── Manager
│   ├── Attendance
│   ├── Leave
│   ├── Payroll
│   ├── Performance Reviews
│   ├── Goals
│   ├── Skills
│   ├── Documents
│   └── Career Events
│
├── Departments
│   └── Teams
│
├── Recruitment
│   ├── Job Openings
│   ├── Applications
│   └── Interviews
│
├── Notifications
├── Announcements
├── Audit Logs
├── Organization Snapshots
└── Workforce Metrics
21. Important Indexes
Indexes will be added based on actual query patterns.
Initial candidates include:
Employee
  organizationId
  employeeCode
  email
  departmentId
  teamId
  managerId

Attendance
  organizationId + employeeId + date

LeaveRequest
  organizationId + employeeId + status
  organizationId + startDate

PayrollRecord
  organizationId + employeeId + payPeriodStart

PerformanceReview
  organizationId + employeeId

Goal
  organizationId + employeeId + status

EmployeeSkill
  organizationId + employeeId + skillId

Notification
  organizationId + recipientUserId + readAt

AuditLog
  organizationId + createdAt

CareerEvent
  organizationId + employeeId + effectiveDate
Indexes will be validated against real API queries before production deployment.
22. Data Security
Sensitive fields require additional authorization.
Examples:
Payroll
Performance information
Private documents
Personal employee information
Application-level authorization must be enforced through the API.
Database access should never be exposed directly to the frontend.
The architecture is:
Next.js
   ↓
NestJS API
   ↓
Authorization
   ↓
Mongoose
   ↓
MongoDB Atlas
23. Schema Evolution
Database schemas will evolve through controlled application changes.
Changes must consider:
Existing data
Backward compatibility
Index changes
Data migration
API compatibility
Major schema changes should be documented.
24. Design Rule
The database should support the product's unique experiences from the beginning:
Employee 360°
Organization DNA
Workforce Pulse
Employee Journey
Time Machine
Skills Galaxy
Internal Opportunity Engine
These features should derive their information from authoritative workforce
data rather than maintaining unnecessary duplicate sources of truth.