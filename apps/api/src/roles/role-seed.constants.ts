import { ROLE_PERMISSIONS } from '../permissions/role-permissions.constants.js';

export const SYSTEM_ROLES = [
  {
    key: 'SUPER_ADMIN' as const,
    name: 'Super Admin',
    slug: 'super-admin',
    description:
      'Full administrative access to the organization.',
    permissions: ROLE_PERMISSIONS.SUPER_ADMIN,
  },
  {
    key: 'HR_MANAGER' as const,
    name: 'HR Manager',
    slug: 'hr-manager',
    description:
      'Manages employees, HR operations, payroll, performance, recruitment, and reports.',
    permissions: ROLE_PERMISSIONS.HR_MANAGER,
  },
  {
    key: 'DEPARTMENT_MANAGER' as const,
    name: 'Department Manager',
    slug: 'department-manager',
    description:
      'Manages department-level employees, teams, attendance, leave, performance, and goals.',
    permissions: ROLE_PERMISSIONS.DEPARTMENT_MANAGER,
  },
  {
    key: 'EMPLOYEE' as const,
    name: 'Employee',
    slug: 'employee',
    description:
      'Standard employee access to personal and permitted organizational information.',
    permissions: ROLE_PERMISSIONS.EMPLOYEE,
  },
] as const;