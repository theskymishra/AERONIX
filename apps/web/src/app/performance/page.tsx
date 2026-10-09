'use client';

import React, { useEffect, useState } from 'react';
import {
  Award,
  BarChart3,
  CheckCircle,
  Clock,
  Filter,
  Plus,
  Send,
  Star,
  UserCheck,
  X,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function PerformancePage() {
  const { hasPermission } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [form, setForm] = useState({
    employeeId: '',
    reviewPeriod: 'Q4 2026',
    rating: 4,
    strengths: '',
    areasForImprovement: '',
    comments: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;

      const [revRes, empRes] = await Promise.all([
        api.performance.getReviews(params).catch(() => ({ items: [], total: 0 })),
        api.employees.list({ limit: 100 }).catch(() => ({ items: [], total: 0 })),
      ]);

      setReviews(revRes.items || []);
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
    if (!form.employeeId) {
      alert('Please select an employee');
      return;
    }
    try {
      await api.performance.createReview(form.employeeId, {
        reviewPeriod: form.reviewPeriod,
        rating: Number(form.rating) || 3,
        strengths: form.strengths,
        areasForImprovement: form.areasForImprovement,
        comments: form.comments,
      });
      setIsCreateModalOpen(false);
      setForm({
        employeeId: '',
        reviewPeriod: 'Q4 2026',
        rating: 4,
        strengths: '',
        areasForImprovement: '',
        comments: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create review');
    }
  };

  const handleAction = async (id: string, action: 'submit' | 'acknowledge' | 'complete') => {
    try {
      if (action === 'submit') await api.performance.submitReview(id);
      if (action === 'acknowledge') await api.performance.acknowledgeReview(id);
      if (action === 'complete') await api.performance.completeReview(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || `Failed to perform ${action}`);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">Completed</span>;
      case 'ACKNOWLEDGED':
        return <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">Acknowledged</span>;
      case 'SUBMITTED':
        return <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-400">Submitted</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">Draft</span>;
    }
  };

  const completedReviews = reviews.filter((r) => r.status === 'COMPLETED');
  const avgRating =
    completedReviews.length > 0
      ? (
          completedReviews.reduce((acc, r) => acc + (r.rating || 0), 0) /
          completedReviews.length
        ).toFixed(1)
      : '—';

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Performance Reviews</h1>
            <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-400">
              Evaluations
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Conduct 360-degree appraisals, track competency ratings, and manage review cycles.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition"
        >
          <Plus className="size-4" />
          <span>New Appraisal</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Total Appraisals</span>
            <BarChart3 className="size-4" />
          </div>
          <div className="mt-3 text-2xl font-bold">{reviews.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Across all departments</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Completed</span>
            <CheckCircle className="size-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400">{completedReviews.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Acknowledged and finalized</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">In Progress</span>
            <Clock className="size-4 text-amber-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-400">
            {reviews.filter((r) => r.status !== 'COMPLETED').length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Pending review or feedback</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Score</span>
            <Star className="size-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-amber-400">{avgRating} / 5.0</div>
          <p className="mt-1 text-xs text-muted-foreground">Workforce benchmark</p>
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
          <option value="">All Review Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="COMPLETED">Completed</option>
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

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            Loading performance reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-20 text-center">
            <Award className="mx-auto size-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold">No performance reviews recorded</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Start a new appraisal to evaluate workforce performance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Review Cycle</th>
                  <th className="px-6 py-3.5">Rating</th>
                  <th className="px-6 py-3.5">Strengths</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Appraisal Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {reviews.map((rev) => {
                  const emp = employees.find((e) => (e._id || e.id) === (rev.employeeId?._id || rev.employeeId));
                  const empName = emp
                    ? `${emp.firstName} ${emp.lastName}`
                    : rev.employeeId?.firstName
                    ? `${rev.employeeId.firstName} ${rev.employeeId.lastName}`
                    : 'Employee';

                  return (
                    <tr key={rev._id || rev.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{empName}</div>
                        {emp?.designation && (
                          <div className="text-xs text-muted-foreground">{emp.designation}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-medium text-muted-foreground">
                        {rev.reviewPeriod}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Star className="size-4 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-sm">{rev.rating || 3}</span>
                          <span className="text-xs text-muted-foreground">/5</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate">
                        {rev.strengths || rev.comments || '—'}
                      </td>
                      <td className="px-6 py-4">{statusBadge(rev.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {rev.status === 'DRAFT' && (
                            <button
                              onClick={() => handleAction(rev._id || rev.id, 'submit')}
                              className="rounded-lg bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-400 hover:bg-purple-500/20"
                            >
                              Submit
                            </button>
                          )}
                          {rev.status === 'SUBMITTED' && (
                            <button
                              onClick={() => handleAction(rev._id || rev.id, 'acknowledge')}
                              className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400 hover:bg-blue-500/20"
                            >
                              Acknowledge
                            </button>
                          )}
                          {rev.status === 'ACKNOWLEDGED' && (
                            <button
                              onClick={() => handleAction(rev._id || rev.id, 'complete')}
                              className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
                            >
                              Complete
                            </button>
                          )}
                          {rev.status === 'COMPLETED' && (
                            <span className="text-xs text-emerald-400 font-medium">Finalized</span>
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
              <h2 className="text-lg font-bold">New Performance Review</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Select Employee *</label>
                <select
                  required
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Choose employee...</option>
                  {employees.map((emp) => (
                    <option key={emp._id || emp.id} value={emp._id || emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.workEmail})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Review Period *</label>
                  <input
                    type="text"
                    required
                    value={form.reviewPeriod}
                    onChange={(e) => setForm({ ...form, reviewPeriod: e.target.value })}
                    placeholder="e.g. Q4 2026, Annual 2026"
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Score Rating (1-5) *</label>
                  <select
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value={5}>5 - Exceptional</option>
                    <option value={4}>4 - Exceeds Expectations</option>
                    <option value={3}>3 - Meets Expectations</option>
                    <option value={2}>2 - Needs Improvement</option>
                    <option value={1}>1 - Unsatisfactory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Key Strengths</label>
                <textarea
                  rows={2}
                  value={form.strengths}
                  onChange={(e) => setForm({ ...form, strengths: e.target.value })}
                  placeholder="Employee achievements, competencies, leadership..."
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Areas for Growth</label>
                <textarea
                  rows={2}
                  value={form.areasForImprovement}
                  onChange={(e) => setForm({ ...form, areasForImprovement: e.target.value })}
                  placeholder="Actionable developmental goals..."
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
                  Create Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
