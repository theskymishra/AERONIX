'use client';

import React, { useEffect, useState } from 'react';
import {
  Banknote,
  CheckCircle,
  CircleDollarSign,
  CreditCard,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Plus,
  Send,
  X,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function PayrollPage() {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'cycles' | 'my-payslips'>('cycles');
  const [records, setRecords] = useState<any[]>([]);
  const [myRecords, setMyRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [createForm, setCreateForm] = useState({
    employeeId: '',
    periodMonth: new Date().getMonth() + 1,
    periodYear: new Date().getFullYear(),
    baseSalary: 60000,
    allowances: 5000,
    deductions: 8000,
    paymentMethod: 'BANK_TRANSFER',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;

      const [payrollRes, empRes, mineRes] = await Promise.all([
        api.payroll.list(params).catch(() => ({ items: [], total: 0 })),
        api.employees.list({ limit: 100 }).catch(() => ({ items: [], total: 0 })),
        api.payroll.getMine().catch(() => ({ items: [], total: 0 })),
      ]);

      setRecords(Array.isArray(payrollRes) ? payrollRes : payrollRes?.items || []);
      setEmployees(Array.isArray(empRes) ? empRes : empRes?.items || []);
      setMyRecords(Array.isArray(mineRes) ? mineRes : mineRes?.items || []);
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
    if (!createForm.employeeId) {
      alert('Please select an employee');
      return;
    }
    try {
      const gross = Number(createForm.baseSalary) + Number(createForm.allowances);
      const net = gross - Number(createForm.deductions);

      await api.payroll.create(createForm.employeeId, {
        periodMonth: Number(createForm.periodMonth),
        periodYear: Number(createForm.periodYear),
        baseSalary: Number(createForm.baseSalary),
        allowances: [{ name: 'Standard Allowance', amount: Number(createForm.allowances) }],
        deductions: [{ name: 'Tax & Compliance', amount: Number(createForm.deductions) }],
        grossPay: gross,
        netPay: net,
        paymentMethod: createForm.paymentMethod,
        notes: createForm.notes,
      });

      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate payroll record');
    }
  };

  const handleAction = async (id: string, action: 'process' | 'approve' | 'pay' | 'cancel') => {
    try {
      if (action === 'process') await api.payroll.process(id);
      if (action === 'approve') await api.payroll.approve(id);
      if (action === 'pay') await api.payroll.pay(id);
      if (action === 'cancel') {
        const notes = prompt('Enter cancellation reason:') || 'Administrative cancel';
        await api.payroll.cancel(id, notes);
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || `Failed to ${action} payroll`);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">Paid</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">Approved</span>;
      case 'PROCESSED':
        return <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-400">Processed</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400">Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">Draft</span>;
    }
  };

  const totalGross = records.reduce((acc, r) => acc + (r.grossPay || 0), 0);
  const totalNet = records.reduce((acc, r) => acc + (r.netPay || 0), 0);
  const totalDeductions = records.reduce((acc, r) => acc + (r.deductions?.reduce?.((dAcc: number, d: any) => dAcc + (d.amount || 0), 0) || 0), 0);

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              Compensation Engine
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Execute salary cycles, handle statutory deductions, and issue employee payslips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition"
          >
            <Plus className="size-4" />
            <span>Generate Payroll</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Total Disbursed</span>
            <Banknote className="size-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-emerald-400">
            ${totalNet.toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Net payout across records</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Gross Compensation</span>
            <CircleDollarSign className="size-4 text-foreground" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono">
            ${totalGross.toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Pre-deduction allocation</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Total Deductions</span>
            <CreditCard className="size-4 text-amber-400" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-amber-400">
            ${totalDeductions.toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Tax & benefits withholdings</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Processed Records</span>
            <FileSpreadsheet className="size-4 text-blue-400" />
          </div>
          <div className="mt-3 text-2xl font-bold">{records.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Current cycle size</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('cycles')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            activeTab === 'cycles'
              ? 'bg-accent text-accent-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Organization Cycles
        </button>
        <button
          onClick={() => setActiveTab('my-payslips')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            activeTab === 'my-payslips'
              ? 'bg-accent text-accent-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          My Self-Service Payslips ({myRecords.length})
        </button>
      </div>

      {activeTab === 'cycles' ? (
        <>
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
              <option value="PROCESSED">Processed</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
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

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {loading ? (
              <div className="py-20 text-center text-sm text-muted-foreground">
                Loading payroll records...
              </div>
            ) : records.length === 0 ? (
              <div className="py-20 text-center">
                <FileText className="mx-auto size-10 text-muted-foreground/40 mb-3" />
                <h3 className="text-base font-semibold">No payroll records generated</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Click Generate Payroll to calculate compensation for employees.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3.5">Employee</th>
                      <th className="px-6 py-3.5">Period</th>
                      <th className="px-6 py-3.5">Gross Pay</th>
                      <th className="px-6 py-3.5">Net Pay</th>
                      <th className="px-6 py-3.5">Payment Method</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Cycle Actions</th>
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
                        : 'Employee';

                      return (
                        <tr key={rec._id || rec.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-foreground">{empName}</div>
                            {emp?.employeeCode && (
                              <div className="text-xs text-muted-foreground">{emp.employeeCode}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                            {rec.periodMonth}/{rec.periodYear}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono font-medium">
                            ${(rec.grossPay || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono font-bold text-emerald-400">
                            ${(rec.netPay || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            <span className="rounded bg-muted px-2 py-0.5 font-medium">
                              {rec.paymentMethod || 'BANK_TRANSFER'}
                            </span>
                          </td>
                          <td className="px-6 py-4">{statusBadge(rec.status)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {rec.status === 'DRAFT' && (
                                <button
                                  onClick={() => handleAction(rec._id || rec.id, 'process')}
                                  className="rounded-lg bg-purple-500/10 px-2 py-1 text-xs font-semibold text-purple-400 hover:bg-purple-500/20"
                                >
                                  Process
                                </button>
                              )}
                              {rec.status === 'PROCESSED' && (
                                <button
                                  onClick={() => handleAction(rec._id || rec.id, 'approve')}
                                  className="rounded-lg bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-400 hover:bg-blue-500/20"
                                >
                                  Approve
                                </button>
                              )}
                              {rec.status === 'APPROVED' && (
                                <button
                                  onClick={() => handleAction(rec._id || rec.id, 'pay')}
                                  className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
                                >
                                  Mark Paid
                                </button>
                              )}
                              {rec.status !== 'PAID' && rec.status !== 'CANCELLED' && (
                                <button
                                  onClick={() => handleAction(rec._id || rec.id, 'cancel')}
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
        </>
      ) : (
        /* My Payslips */
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {(Array.isArray(myRecords) ? myRecords : []).length === 0 ? (
            <div className="py-20 text-center">
              <FileText className="mx-auto size-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-semibold">No personal payslips available</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Your compensation records will appear here once processed by HR.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5">Pay Period</th>
                    <th className="px-6 py-3.5">Base Salary</th>
                    <th className="px-6 py-3.5">Gross Pay</th>
                    <th className="px-6 py-3.5">Net Payout</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(Array.isArray(myRecords) ? myRecords : []).map((rec) => (
                    <tr key={rec._id || rec.id} className="hover:bg-muted/20">
                      <td className="px-6 py-4 font-mono font-medium">
                        {rec.periodMonth}/{rec.periodYear}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        ${(rec.baseSalary || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        ${(rec.grossPay || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm font-bold text-emerald-400">
                        ${(rec.netPay || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">{statusBadge(rec.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Generate Payroll Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold">Generate Employee Payroll</h2>
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
                  value={createForm.employeeId}
                  onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Choose employee...</option>
                  {(Array.isArray(employees) ? employees : []).map((emp) => (
                    <option key={emp._id || emp.id} value={emp._id || emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.workEmail})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Month (1-12) *</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={createForm.periodMonth}
                    onChange={(e) => setCreateForm({ ...createForm, periodMonth: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Year *</label>
                  <input
                    type="number"
                    required
                    value={createForm.periodYear}
                    onChange={(e) => setCreateForm({ ...createForm, periodYear: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Base Salary *</label>
                  <input
                    type="number"
                    required
                    value={createForm.baseSalary}
                    onChange={(e) => setCreateForm({ ...createForm, baseSalary: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Allowances</label>
                  <input
                    type="number"
                    value={createForm.allowances}
                    onChange={(e) => setCreateForm({ ...createForm, allowances: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Deductions</label>
                  <input
                    type="number"
                    value={createForm.deductions}
                    onChange={(e) => setCreateForm({ ...createForm, deductions: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
                <select
                  value={createForm.paymentMethod}
                  onChange={(e) => setCreateForm({ ...createForm, paymentMethod: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                  <option value="CHECK">Paper Check</option>
                  <option value="WIRE">Wire Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes or reference..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
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
                  Create Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
