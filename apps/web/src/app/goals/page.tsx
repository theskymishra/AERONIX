'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Sliders,
  Target,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function GoalsPage() {
  const { hasPermission } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [form, setForm] = useState({
    employeeId: '',
    title: '',
    description: '',
    category: 'Engineering',
    priority: 'HIGH',
    startDate: '',
    dueDate: '',
    progress: 0,
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;

      const [goalsRes, empRes] = await Promise.all([
        api.goals.list(params).catch(() => ({ items: [], total: 0 })),
        api.employees.list({ limit: 100 }).catch(() => ({ items: [], total: 0 })),
      ]);

      setGoals(goalsRes.items || []);
      setEmployees(empRes.items || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.title) {
      alert('Please fill all required fields');
      return;
    }
    try {
      await api.goals.create(form.employeeId, {
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        startDate: new Date(form.startDate).toISOString(),
        dueDate: new Date(form.dueDate).toISOString(),
        progress: Number(form.progress) || 0,
        notes: form.notes,
      });

      setIsCreateModalOpen(false);
      setForm({
        employeeId: '',
        title: '',
        description: '',
        category: 'Engineering',
        priority: 'HIGH',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        progress: 0,
        notes: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create goal');
    }
  };

  const handleAction = async (id: string, action: 'activate' | 'complete' | 'cancel') => {
    try {
      if (action === 'activate') await api.goals.activate(id);
      if (action === 'complete') await api.goals.complete(id);
      if (action === 'cancel') await api.goals.cancel(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || `Failed to ${action} goal`);
    }
  };

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400">High</span>;
      case 'MEDIUM':
        return <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">Medium</span>;
      default:
        return <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">Low</span>;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">Completed</span>;
      case 'ACTIVE':
        return <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">Active</span>;
      case 'CANCELLED':
        return <span className="rounded-md bg-zinc-500/10 px-2 py-0.5 text-xs font-semibold text-zinc-400">Cancelled</span>;
      default:
        return <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">Draft</span>;
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Goals & OKRs</h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              Workforce Objectives
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Align team objectives, monitor milestone progress, and measure execution velocity.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition"
        >
          <Plus className="size-4" />
          <span>Define New Goal</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Total Objectives</span>
            <Target className="size-4" />
          </div>
          <div className="mt-3 text-2xl font-bold">{goals.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Strategic milestones</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Active</span>
            <TrendingUp className="size-4 text-blue-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-blue-400">
            {goals.filter((g) => g.status === 'ACTIVE').length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">In active progress</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Achieved</span>
            <CheckCircle2 className="size-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400">
            {goals.filter((g) => g.status === 'COMPLETED').length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Target completed</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">High Priority</span>
            <AlertCircle className="size-4 text-rose-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-rose-400">
            {goals.filter((g) => g.priority === 'HIGH' || g.priority === 'URGENT').length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Critical execution targets</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm pl-2">
          <Filter className="size-4" />
          <span>Status Filter:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            className="text-xs text-muted-foreground hover:text-foreground transition underline ml-auto pr-2"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Goals Grid / Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            Loading workforce goals...
          </div>
        ) : goals.length === 0 ? (
          <div className="py-20 text-center">
            <Target className="mx-auto size-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold">No goals configured</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Define key objectives and targets for team members.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Goal & Assignee</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5">Progress</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {goals.map((g) => {
                  const emp = employees.find((e) => (e._id || e.id) === (g.employeeId?._id || g.employeeId));
                  const empName = emp
                    ? `${emp.firstName} ${emp.lastName}`
                    : g.employeeId?.firstName
                    ? `${g.employeeId.firstName} ${g.employeeId.lastName}`
                    : 'Employee';

                  return (
                    <tr key={g._id || g.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{g.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Assigned to: {empName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                          {g.category || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{priorityBadge(g.priority)}</td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                        {g.dueDate ? new Date(g.dueDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 w-48">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-bold">{g.progress ?? 0}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full transition-all"
                              style={{ width: `${Math.min(100, g.progress ?? 0)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{statusBadge(g.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {g.status === 'DRAFT' && (
                            <button
                              onClick={() => handleAction(g._id || g.id, 'activate')}
                              className="rounded-lg bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-400 hover:bg-blue-500/20"
                            >
                              Activate
                            </button>
                          )}
                          {g.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleAction(g._id || g.id, 'complete')}
                              className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
                            >
                              Complete
                            </button>
                          )}
                          {g.status !== 'COMPLETED' && g.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleAction(g._id || g.id, 'cancel')}
                              className="rounded-lg bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold">Define Goal / OKR</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Assignee *</label>
                <select
                  required
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select team member...</option>
                  {employees.map((emp) => (
                    <option key={emp._id || emp.id} value={emp._id || emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.workEmail})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Goal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deliver Q4 Microservices Architecture"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Initial Progress ({form.progress}%)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.progress}
                  onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                  className="mt-1 w-full accent-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Description & Key Results</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Key deliverables and success metrics..."
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
