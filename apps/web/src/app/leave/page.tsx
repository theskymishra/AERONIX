'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Umbrella,
  X,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function LeavePage() {
  const { hasPermission } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [applyForm, setApplyForm] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;

      const [reqRes, typesRes, empRes, balRes] = await Promise.all([
        api.leave.getRequests(params).catch(() => ({ items: [], total: 0 })),
        api.leave.getTypes().catch(() => []),
        api.employees.list({ limit: 100 }).catch(() => ({ items: [], total: 0 })),
        api.leave.getBalances().catch(() => []),
      ]);

      setRequests(Array.isArray(reqRes) ? reqRes : reqRes?.items || []);
      setTypes(Array.isArray(typesRes) ? typesRes : typesRes?.items || []);
      setEmployees(Array.isArray(empRes) ? empRes : empRes?.items || []);
      setBalances(Array.isArray(balRes) ? balRes : (balRes as any)?.employees || (balRes as any)?.items || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyForm.employeeId || !applyForm.leaveTypeId) {
      alert('Please fill all required fields');
      return;
    }
    try {
      await api.leave.createRequest(applyForm.employeeId, applyForm.leaveTypeId, {
        startDate: new Date(applyForm.startDate).toISOString(),
        endDate: new Date(applyForm.endDate).toISOString(),
        reason: applyForm.reason,
      });
      setIsApplyModalOpen(false);
      setApplyForm({
        employeeId: '',
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        reason: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit leave request');
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this leave request?')) return;
    try {
      await api.leave.approveRequest(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestId) return;
    try {
      await api.leave.rejectRequest(selectedRequestId, rejectReason || 'Administrative decision');
      setIsRejectModalOpen(false);
      setSelectedRequestId(null);
      setRejectReason('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">Approved</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400">Rejected</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 rounded-md bg-zinc-500/10 px-2 py-0.5 text-xs font-medium text-zinc-400">Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">Pending</span>;
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
              Time Off
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Review time off requests, check leave quotas, and streamline approvals.
          </p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition"
        >
          <Plus className="size-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Total Requests</span>
            <Calendar className="size-4" />
          </div>
          <div className="mt-3 text-2xl font-bold">{requests.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Recorded this period</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Action</span>
            <Clock className="size-4 text-amber-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-400">
            {requests.filter((r) => r.status === 'PENDING').length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Awaiting manager review</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="size-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400">
            {requests.filter((r) => r.status === 'APPROVED').length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Granted time off</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Configured Types</span>
            <Umbrella className="size-4 text-purple-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-purple-400">
            {(Array.isArray(types) ? types : []).length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Policies in organization</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm pl-2">
          <Filter className="size-4" />
          <span>Filter:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
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

      {/* Requests Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            Loading leave requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center">
            <Calendar className="mx-auto size-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold">No leave requests found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Employees have not submitted any leave requests for this period.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Leave Policy</th>
                  <th className="px-6 py-3.5">Date Range</th>
                  <th className="px-6 py-3.5">Days</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(Array.isArray(requests) ? requests : []).map((req) => {
                  const emp = (Array.isArray(employees) ? employees : []).find(
                    (e) => (e._id || e.id) === (req.employeeId?._id || req.employeeId),
                  );
                  const empName = emp
                    ? `${emp.firstName} ${emp.lastName}`
                    : req.employeeId?.firstName
                    ? `${req.employeeId.firstName} ${req.employeeId.lastName}`
                    : 'Employee';

                  const typeObj = (Array.isArray(types) ? types : []).find(
                    (t) => (t._id || t.id) === (req.leaveTypeId?._id || req.leaveTypeId),
                  );
                  const typeName = typeObj?.name || req.leaveTypeId?.name || 'Leave';

                  return (
                    <tr key={req._id || req.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{empName}</div>
                        {emp?.employeeCode && (
                          <div className="text-xs text-muted-foreground">{emp.employeeCode}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                          {typeName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                        {new Date(req.startDate).toLocaleDateString()} &rarr; {new Date(req.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold">
                        {req.days ?? Math.max(1, Math.round((new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)}d
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate">
                        {req.reason || '—'}
                      </td>
                      <td className="px-6 py-4">{statusBadge(req.status)}</td>
                      <td className="px-6 py-4 text-right">
                        {req.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(req._id || req.id)}
                              className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequestId(req._id || req.id);
                                setIsRejectModalOpen(true);
                              }}
                              className="rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold">Apply for Leave</h2>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleApply} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Select Employee *</label>
                <select
                  required
                  value={applyForm.employeeId}
                  onChange={(e) => setApplyForm({ ...applyForm, employeeId: e.target.value })}
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

              <div>
                <label className="text-xs font-medium text-muted-foreground">Leave Policy / Type *</label>
                <select
                  required
                  value={applyForm.leaveTypeId}
                  onChange={(e) => setApplyForm({ ...applyForm, leaveTypeId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select policy...</option>
                  {(Array.isArray(types) ? types : []).map((t) => (
                    <option key={t._id || t.id} value={t._id || t.id}>
                      {t.name} ({t.code || t.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={applyForm.startDate}
                    onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">End Date *</label>
                  <input
                    type="date"
                    required
                    value={applyForm.endDate}
                    onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Reason / Comments</label>
                <textarea
                  rows={3}
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  placeholder="State the reason for leave..."
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-rose-400">Reject Leave Request</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Please provide a reason for rejecting this leave request.
            </p>

            <form onSubmit={handleReject} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Rejection Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
