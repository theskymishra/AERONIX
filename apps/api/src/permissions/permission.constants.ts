export const PERMISSIONS = {
  ORGANIZATION_READ: 'organization:read',
  ORGANIZATION_MANAGE: 'organization:manage',

  USER_READ: 'user:read',
  USER_MANAGE: 'user:manage',

  EMPLOYEE_READ: 'employee:read',
  EMPLOYEE_CREATE: 'employee:create',
  EMPLOYEE_UPDATE: 'employee:update',
  EMPLOYEE_DELETE: 'employee:delete',

  DEPARTMENT_READ: 'department:read',
  DEPARTMENT_MANAGE: 'department:manage',

  TEAM_READ: 'team:read',
  TEAM_MANAGE: 'team:manage',

  ATTENDANCE_READ: 'attendance:read',
  ATTENDANCE_MANAGE: 'attendance:manage',

  LEAVE_READ: 'leave:read',
  LEAVE_VIEW_ALL: 'leave:view-all',
  LEAVE_CREATE: 'leave:create',
  LEAVE_APPROVE: 'leave:approve',
  LEAVE_MANAGE: 'leave:manage',

  PAYROLL_READ: 'payroll:read',
  PAYROLL_MANAGE: 'payroll:manage',

  PERFORMANCE_READ: 'performance:read',
  PERFORMANCE_MANAGE: 'performance:manage',

  GOAL_READ: 'goal:read',
  GOAL_MANAGE: 'goal:manage',

  RECRUITMENT_READ: 'recruitment:read',
  RECRUITMENT_MANAGE: 'recruitment:manage',

  DOCUMENT_READ: 'document:read',
  DOCUMENT_MANAGE: 'document:manage',

  ANNOUNCEMENT_READ: 'announcement:read',
  ANNOUNCEMENT_MANAGE: 'announcement:manage',

  REPORT_READ: 'report:read',
  REPORT_EXPORT: 'report:export',

  AUDIT_READ: 'audit:read',
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);