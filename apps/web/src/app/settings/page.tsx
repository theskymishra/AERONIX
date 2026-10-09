'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  Building2,
  CheckCircle,
  Key,
  Mail,
  Save,
  Shield,
  Smartphone,
  User,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [preferences, setPreferences] = useState<any>({
    emailNotifications: true,
    leaveAlerts: true,
    payrollAlerts: true,
    announcements: true,
    recruitmentUpdates: true,
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const data = await api.notifications.getPreferences().catch(() => null);
        if (data) setPreferences(data);
      } catch {
        // fallback
      }
    };
    fetchPrefs();
  }, []);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.notifications.updatePreferences(preferences);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your user profile, organization telemetry, and automated notification delivery.
        </p>
      </div>

      {/* User Account Info */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <User className="size-5 text-primary" />
          <h2 className="text-base font-bold">User Account Profile</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Full Name
            </label>
            <div className="mt-1 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm font-medium">
              {user?.firstName} {user?.lastName}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Email Address
            </label>
            <div className="mt-1 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm font-medium font-mono text-xs">
              {user?.email}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Assigned Role
            </label>
            <div className="mt-1 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm font-medium">
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {user?.role || 'ORGANIZATION_ADMIN'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              User ID
            </label>
            <div className="mt-1 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-xs font-mono text-muted-foreground">
              {user?.id || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Organization Info */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Building2 className="size-5 text-primary" />
          <h2 className="text-base font-bold">Organization Tenant Configuration</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Organization Name
            </label>
            <div className="mt-1 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm font-medium">
              AERONIX Enterprise Technologies
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tenant ID
            </label>
            <div className="mt-1 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-xs font-mono text-muted-foreground">
              {user?.organizationId || '6aa522bc5145273578dcdc72'}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Security Compliance
            </label>
            <div className="mt-1 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-xs flex items-center gap-2 text-emerald-400">
              <Shield className="size-4" />
              <span>Multi-Tenant Isolated Database (TLS 1.3)</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Platform Edition
            </label>
            <div className="mt-1 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm font-medium">
              AERONIX HR v1.0.0 Production Ready
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Bell className="size-5 text-primary" />
          <h2 className="text-base font-bold">Notification Preferences</h2>
        </div>

        <form onSubmit={handleSavePreferences} className="mt-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Email Digest Notifications</div>
              <p className="text-xs text-muted-foreground">
                Receive important company and compliance updates in your inbox.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.emailNotifications ?? true}
              onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
              className="size-4 rounded accent-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Time-Off & Leave Decision Alerts</div>
              <p className="text-xs text-muted-foreground">
                Instant alerts when leave requests are approved or rejected.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.leaveAlerts ?? true}
              onChange={(e) => setPreferences({ ...preferences, leaveAlerts: e.target.checked })}
              className="size-4 rounded accent-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Payroll & Compensation Payouts</div>
              <p className="text-xs text-muted-foreground">
                Notification when monthly salary payslips are generated.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.payrollAlerts ?? true}
              onChange={(e) => setPreferences({ ...preferences, payrollAlerts: e.target.checked })}
              className="size-4 rounded accent-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Organization Broadcasts</div>
              <p className="text-xs text-muted-foreground">
                Immediate alerts for urgent company announcements.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.announcements ?? true}
              onChange={(e) => setPreferences({ ...preferences, announcements: e.target.checked })}
              className="size-4 rounded accent-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Recruitment & Interview Scheduling</div>
              <p className="text-xs text-muted-foreground">
                Alerts when candidates apply or interview rounds are scheduled.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.recruitmentUpdates ?? true}
              onChange={(e) => setPreferences({ ...preferences, recruitmentUpdates: e.target.checked })}
              className="size-4 rounded accent-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            {savedSuccess ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <CheckCircle className="size-4" />
                <span>Preferences saved successfully</span>
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
            >
              <Save className="size-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
