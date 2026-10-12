'use client';

import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Search,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function AttendancePage() {
  const { hasPermission } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'PRESENT',
    checkInAt: '',
    checkOutAt: '',
    workMode: 'OFFICE',
    workedMinutes: 480,
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.startDate = dateFilter;

      const [attRes, empRes] = await Promise.all([
        api.attendance.list(params).catch(() => ({ items: [], total: 0 })),
        api.employees.list({ limit: 100 }).catch(() => ({ items: [], total: 0 })),
      ]);

      setRecords(Array.isArray(attRes) ? attRes : attRes?.items || []);
      setEmployees(Array.isArray(empRes) ? empRes : empRes?.items || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, dateFilter]);

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) {
      alert('Please select an employee');
      return;
    }
    try {
      const payload: any = {
        date: formData.date,
        status: formData.status,
        workMode: formData.workMode,
        notes: formData.notes,
        workedMinutes: Number(formData.workedMinutes) || undefined,
      };
      if (formData.checkInAt) payload.checkInAt = new Date(formData.checkInAt).toISOString();
      if (formData.checkOutAt) payload.checkOutAt = new Date(formData.checkOutAt).toISOString();

      await api.attendance.record(formData.employeeId, payload);
      setIsRecordModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to record attendance');
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">Present</span>;
      case 'LATE':
        return <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">Late</span>;
      case 'HALF_DAY':
        return <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">Half Day</span>;
      case 'ON_LEAVE':
        return <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400">On Leave</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400">Absent</span>;
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              Live Monitoring
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time workforce presence, time tracking, and punctuality analytics.
          </p>
        </div>

        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition"
        >
          <Plus className="size-4" />
          <span>Record Attendance</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Total Records</span>
            <Users className="size-4" />
          </div>
          <div className="mt-3 text-2xl font-bold">{records.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Entries tracked in period</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Present</span>
            <UserCheck className="size-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400">
            {records.filter((r) => r.status === 'PRESENT').length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">On-time workforce</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Late Arrivals</span>
            <Clock className="size-4 text-amber-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-400">
            {records.filter((r) => r.status === 'LATE').length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Check-in past threshold</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Absent / Leave</span>
            <UserX className="size-4 text-rose-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-rose-400">
            {records.filter((r) => r.status === 'ABSENT' || r.status === 'ON_LEAVE').length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Away from work</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm pl-2">
          <Filter className="size-4" />
          <span>Filters:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          <option value="PRESENT">Present</option>
          <option value="LATE">Late</option>
          <option value="HALF_DAY">Half Day</option>
          <option value="ON_LEAVE">On Leave</option>
          <option value="ABSENT">Absent</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
        />

        {(statusFilter || dateFilter) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setDateFilter('');
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition underline ml-auto pr-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            Loading attendance records...
          </div>
        ) : records.length === 0 ? (
          <div className="py-20 text-center">
            <CalendarDays className="mx-auto size-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold">No attendance records found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Record check-ins or clear active filters to view records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Check In</th>
                  <th className="px-6 py-3.5">Check Out</th>
                  <th className="px-6 py-3.5">Work Mode</th>
                  <th className="px-6 py-3.5">Worked (Min)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(Array.isArray(records) ? records : []).map((rec) => {
                  const emp = (Array.isArray(employees) ? employees : []).find(
                    (e) => (e._id || e.id) === (rec.employeeId?._id || rec.employeeId),
                  );
                  const empName = emp
                    ? `${emp.firstName} ${emp.lastName}`
                    : rec.employeeId?.firstName
                    ? `${rec.employeeId.firstName} ${rec.employeeId.lastName}`
                    : `ID: ${String(rec.employeeId).slice(-6)}`;

                  return (
                    <tr key={rec._id || rec.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{empName}</div>
                        {emp?.employeeCode && (
                          <div className="text-xs text-muted-foreground">{emp.employeeCode}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                        {rec.date ? new Date(rec.date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">{statusBadge(rec.status)}</td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                        {rec.checkInAt ? new Date(rec.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                        {rec.checkOutAt ? new Date(rec.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        <span className="rounded bg-muted px-2 py-0.5 font-medium">
                          {rec.workMode || 'OFFICE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-foreground">
                        {rec.workedMinutes ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Attendance Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold">Record Workforce Attendance</h2>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Select Employee *</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Choose an employee...</option>
                  {employees.map((emp) => (
                    <option key={emp._id || emp.id} value={emp._id || emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.workEmail})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="LATE">LATE</option>
                    <option value="HALF_DAY">HALF_DAY</option>
                    <option value="ON_LEAVE">ON_LEAVE</option>
                    <option value="ABSENT">ABSENT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Check-in Time</label>
                  <input
                    type="datetime-local"
                    value={formData.checkInAt}
                    onChange={(e) => setFormData({ ...formData, checkInAt: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Check-out Time</label>
                  <input
                    type="datetime-local"
                    value={formData.checkOutAt}
                    onChange={(e) => setFormData({ ...formData, checkOutAt: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Work Mode</label>
                  <select
                    value={formData.workMode}
                    onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="OFFICE">OFFICE</option>
                    <option value="REMOTE">REMOTE</option>
                    <option value="HYBRID">HYBRID</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Worked Minutes</label>
                  <input
                    type="number"
                    value={formData.workedMinutes}
                    onChange={(e) => setFormData({ ...formData, workedMinutes: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="Optional notes or reason..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
