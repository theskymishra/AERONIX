import { describe, expect, it } from 'vitest';
import { isPublicRoute, getAuthRedirect } from './auth-gate.js';

describe('Authentication Gate Routing Rules', () => {
  it('correctly identifies public and protected routes', () => {
    expect(isPublicRoute('/login')).toBe(true);
    expect(isPublicRoute('/register')).toBe(true);
    expect(isPublicRoute('/login/oauth')).toBe(true);

    expect(isPublicRoute('/')).toBe(false);
    expect(isPublicRoute('/dashboard')).toBe(false);
    expect(isPublicRoute('/employees')).toBe(false);
    expect(isPublicRoute('/payroll')).toBe(false);
    expect(isPublicRoute('/reports')).toBe(false);
    expect(isPublicRoute('/settings')).toBe(false);
    expect(isPublicRoute('/attendance')).toBe(false);
    expect(isPublicRoute('/leave')).toBe(false);
    expect(isPublicRoute('/organization')).toBe(false);
    expect(isPublicRoute('/audit-logs')).toBe(false);
  });

  it('redirects unauthenticated users to /login on protected routes', () => {
    const protectedRoutes = [
      '/',
      '/dashboard',
      '/employees',
      '/payroll',
      '/reports',
      '/settings',
      '/attendance',
      '/leave',
      '/performance',
      '/goals',
      '/recruitment',
      '/documents',
      '/announcements',
      '/audit-logs',
      '/notifications',
    ];

    for (const route of protectedRoutes) {
      const redirect = getAuthRedirect(route, false, false);
      expect(redirect).toBe('/login');
    }
  });

  it('allows unauthenticated users on public authentication routes without redirect', () => {
    expect(getAuthRedirect('/login', false, false)).toBeNull();
    expect(getAuthRedirect('/register', false, false)).toBeNull();
  });

  it('redirects authenticated users away from public auth pages to dashboard', () => {
    expect(getAuthRedirect('/login', true, false)).toBe('/');
    expect(getAuthRedirect('/register', true, false)).toBe('/');
  });

  it('allows authenticated users to access protected routes without redirect', () => {
    expect(getAuthRedirect('/', true, false)).toBeNull();
    expect(getAuthRedirect('/employees', true, false)).toBeNull();
    expect(getAuthRedirect('/payroll', true, false)).toBeNull();
    expect(getAuthRedirect('/settings', true, false)).toBeNull();
  });

  it('does not trigger redirects while session verification is loading', () => {
    expect(getAuthRedirect('/', false, true)).toBeNull();
    expect(getAuthRedirect('/employees', false, true)).toBeNull();
    expect(getAuthRedirect('/login', false, true)).toBeNull();
  });
});
