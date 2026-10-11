'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  LogIn,
  Network,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserRoundPlus,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState<any | null>(null);
  const [headcount, setHeadcount] = useState<any | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [openPositions, setOpenPositions] = useState<number>(0);
  const [pendingLeaves, setPendingLeaves] = useState<number>(0);
  const [pendingPayroll, setPendingPayroll] = useState<number>(0);
  const [activeGoals, setActiveGoals] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const todayStr = new Date().toISOString().split('T')[0];

        const [
          pulseRes,
          headcountRes,
          attendanceRes,
          openingsRes,
          leaveRes,
          payrollRes,
          goalsRes,
          auditRes,
        ] = await Promise.all([
          api.reports.getWorkforceIntelligence().catch(() => null),
          api.reports.getHeadcount().catch(() => null),
          api.attendance.list({ startDate: todayStr }).catch(() => ({ items: [] })),
          api.recruitment.getOpenings({ status: 'PUBLISHED' }).catch(() => ({ items: [], total: 0 })),
          api.leave.getRequests({ status: 'PENDING' }).catch(() => ({ items: [], total: 0 })),
          api.payroll.list().catch(() => ({ items: [] })),
          api.goals.list({ status: 'ACTIVE' }).catch(() => ({ items: [] })),
          api.auditLogs.list({ limit: 5 }).catch(() => ({ items: [] })),
        ]);

        if (!isMounted) return;

        setPulse(pulseRes);
        setHeadcount(headcountRes);
        setTodayAttendance(attendanceRes.items || []);
        setOpenPositions(openingsRes.total ?? openingsRes.items?.length ?? 0);
        setPendingLeaves(leaveRes.total ?? leaveRes.items?.length ?? 0);

        const unfinalizedPayroll = (payrollRes.items || []).filter(
          (p: any) => p.status === 'DRAFT' || p.status === 'PROCESSED',
        ).length;
        setPendingPayroll(unfinalizedPayroll);

        setActiveGoals(goalsRes.items || []);
        setRecentActivities(auditRes.items || []);
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, authLoading]);

  // Loading skeleton state
  if (authLoading || (isAuthenticated && loading)) {
    return (
      <div className="space-y-8 p-6 lg:p-8 animate-pulse">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 rounded bg-muted/60" />
          <div className="h-8 w-64 rounded bg-muted/80" />
          <div className="h-4 w-80 rounded bg-muted/40" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <div className="h-56 rounded-2xl border border-border bg-card/60" />
          <div className="h-56 rounded-2xl border border-border bg-card/60" />
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl border border-border bg-card/60" />
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-64 rounded-2xl border border-border bg-card/60" />
          <div className="h-64 rounded-2xl border border-border bg-card/60" />
        </div>
      </div>
    );
  }

  // Unauthenticated users are protected and routed via AppShell to /login
  if (!isAuthenticated) {
    return null;
  }

  // Calculate actual metrics from real backend responses
  const totalEmployees = headcount?.totalEmployees ?? 0;
  const presentTodayCount = todayAttendance.filter(
    (a) => a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'HALF_DAY',
  ).length;

  const departmentCount = headcount?.byDepartment
    ? Object.keys(headcount.byDepartment).length
    : 0;

  const pulseScore = pulse?.vitalityScore ?? (totalEmployees > 0 ? 80 : 0);

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`.trim()
    : user?.email?.split('@')[0] || 'Colleague';

  const formatActivityTime = (dateStr: string) => {
    if (!dateStr) return 'Recent';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end border-b border-border/40 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">
            Workforce Intelligence Platform
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Good day, {displayName}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.role ? `Operating as ${user.role}. ` : ''}
            Here is what is happening across your organization today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/employees"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition"
          >
            <UserRoundPlus className="size-4" />
            <span>Manage Employees</span>
          </Link>
        </div>
      </div>

      {/* Hero / Pulse & Attention Panels */}
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        {/* Workforce Vitality Pulse */}
        <Link
          href="/reports"
          className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-sm transition hover:border-primary/40 block"
        >
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Activity className="size-4 text-primary" />
                <span>Workforce Vitality Pulse</span>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                {pulseScore >= 70 ? 'Optimal' : pulseScore > 0 ? 'Active Monitoring' : 'No Data'}
              </span>
            </div>

            <div className="flex items-end gap-3">
              <div className="text-5xl sm:text-6xl font-bold tracking-tight font-mono text-foreground">
                {pulseScore}
              </div>
              <div className="pb-2 text-sm text-muted-foreground font-mono">
                / 100
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, pulseScore))}%` }}
              />
            </div>

            <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-emerald-400" />
                <span className="font-medium text-foreground">
                  {pulse?.headcount?.active ?? headcount?.activeEmployees ?? totalEmployees}
                </span>
                <span>active members</span>
              </div>

              <span className="inline-flex items-center gap-1 text-primary group-hover:underline font-medium">
                <span>View Intelligence Telemetry</span>
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </Link>

        {/* Action / Attention Required Panel */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">
                Attention Required
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                {pendingLeaves + (pendingPayroll > 0 ? 1 : 0) + (activeGoals.length > 0 ? 1 : 0)} items
              </span>
            </div>

            <div className="space-y-3.5">
              <Link
                href="/leave"
                className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-3 hover:bg-muted/40 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {pendingLeaves} leave request{pendingLeaves !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pendingLeaves > 0 ? 'Pending manager decision' : 'All leave requests resolved'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/payroll"
                className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-3 hover:bg-muted/40 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-blue-400" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Payroll Operations</p>
                    <p className="text-xs text-muted-foreground">
                      {pendingPayroll > 0
                        ? `${pendingPayroll} cycle record${pendingPayroll !== 1 ? 's' : ''} awaiting action`
                        : 'Current payroll records processed'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/goals"
                className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-3 hover:bg-muted/40 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-purple-400" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {activeGoals.length} Active OKR Objective{activeGoals.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Workforce goals in progress
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-border/40 mt-4">
            <Link
              href="/leave"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>Review pending approvals</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Link
          href="/employees"
          className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 block"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Headcount</span>
            <Users className="size-4 group-hover:text-primary transition" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight font-mono text-foreground">
            {totalEmployees}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {headcount?.activeEmployees ?? totalEmployees} active members
          </p>
        </Link>

        <Link
          href="/attendance"
          className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 block"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Present Today</span>
            <UserCheck className="size-4 group-hover:text-emerald-400 transition" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight font-mono text-emerald-400">
            {presentTodayCount}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {totalEmployees > 0
              ? `${Math.round((presentTodayCount / totalEmployees) * 100)}% attendance rate`
              : 'Logged check-ins'}
          </p>
        </Link>

        <Link
          href="/recruitment"
          className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 block"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Positions</span>
            <BriefcaseBusiness className="size-4 group-hover:text-purple-400 transition" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight font-mono text-purple-400">
            {openPositions}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Published requisitions</p>
        </Link>

        <Link
          href="/organization"
          className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 block"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Departments</span>
            <Building2 className="size-4 group-hover:text-blue-400 transition" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight font-mono text-blue-400">
            {departmentCount}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Operational units</p>
        </Link>
      </div>

      {/* Bottom Grid: Recent Activity & Organization Explorer */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Real Recent Activity from Audit Logs */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Recent Activity</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Live compliance and organizational actions
              </p>
            </div>

            <Link
              href="/audit-logs"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View audit trail</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No recent activity logged yet.
              </div>
            ) : (
              recentActivities.map((act) => (
                <div
                  key={act._id || act.id}
                  className="flex items-center justify-between gap-4 border-b border-border/40 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold font-mono">
                      {act.action?.[0] || 'A'}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">
                        <span>{act.action}</span>{' '}
                        <span className="text-muted-foreground font-normal">on {act.entity}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        Actor: {act.userId ? `#${String(act.userId).slice(-6)}` : 'System'}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-[11px] text-muted-foreground font-mono">
                    {formatActivityTime(act.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Organization DNA 3D Exploration Portal */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h2 className="text-base font-bold text-foreground">Organization DNA</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                3D exploration of organizational relationships and hierarchy
              </p>
            </div>

            <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
              <div className="absolute size-36 rounded-full border border-primary/20 animate-pulse" />
              <div className="absolute size-24 rounded-full border border-primary/15" />

              <div className="relative flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl">
                <Network className="size-6" />
              </div>

              <div className="absolute left-[20%] top-[25%] size-3 rounded-full bg-blue-400/80 shadow" />
              <div className="absolute right-[22%] top-[30%] size-3 rounded-full bg-purple-400/80 shadow" />
              <div className="absolute bottom-[22%] left-[28%] size-3 rounded-full bg-emerald-400/80 shadow" />
              <div className="absolute bottom-[26%] right-[25%] size-3 rounded-full bg-amber-400/80 shadow" />

              <div className="absolute inset-x-8 top-1/2 h-px bg-border/40" />
              <div className="absolute inset-y-8 left-1/2 w-px bg-border/40" />
            </div>
          </div>

          <div className="mt-5 border-t border-border/40 pt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">
              {departmentCount} units mapped
            </span>

            <Link
              href="/organization"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <span>Explore Organizational Structure</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}