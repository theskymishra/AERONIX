'use client';

import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Calendar,
  Clock,
  Filter,
  History,
  Mail,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function EmployeesPage() {
  const { hasPermission } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [profile360, setProfile360] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    employeeCode: '',
    designation: '',
    employmentStatus: 'ACTIVE',
    employmentType: 'FULL_TIME',
    workMode: 'HYBRID',
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await api.employees.list(params);
      setEmployees(data.items || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [statusFilter]);

  const handleOpenProfile = async (emp: any) => {
    setSelectedEmployee(emp);
    setDrawerOpen(true);
    try {
      const [p360, tl] = await Promise.all([
        api.employees.get360(emp._id || emp.id),
        api.employees.getCareerTimeline(emp._id || emp.id),
      ]);
      setProfile360(p360);
      setTimeline(tl || []);
    } catch {
      // fallback
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.employees.create(newEmployee);
      setAddModalOpen(false);
      setNewEmployee({
        firstName: '',
        lastName: '',
        workEmail: '',
        employeeCode: '',
        designation: '',
        employmentStatus: 'ACTIVE',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
      });
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to create employee');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-6 text-primary" />
            <span>Employees</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Workforce directory, profiles, and Employee 360 intelligence
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="size-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employees by name, email, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchEmployees()}
            className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-4 text-sm outline-none transition focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Designation</th>
                <th className="px-6 py-3.5">Work Mode</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    Loading workforce directory...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No employees found in directory.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const empId = emp._id || emp.id;
                  const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase();
                  const isActive = emp.employmentStatus === 'ACTIVE';

                  return (
                    <tr
                      key={empId}
                      className="transition-colors hover:bg-muted/40 cursor-pointer"
                      onClick={() => handleOpenProfile(emp)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {emp.workEmail || emp.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        {emp.employeeCode || '—'}
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {emp.designation || 'Specialist'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                          {emp.workMode || 'HYBRID'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-zinc-500/10 text-zinc-400'
                          }`}
                        >
                          {emp.employmentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProfile(emp);
                          }}
                        >
                          <MoreVertical className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee 360 Drawer */}
      {drawerOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="h-full w-full max-w-xl bg-card border-l border-border p-6 overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-base">
                  {selectedEmployee.firstName?.[0]}
                  {selectedEmployee.lastName?.[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedEmployee.designation} • {selectedEmployee.employeeCode}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Employee 360 overview */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="size-3.5" />
                  <span>Work Email</span>
                </div>
                <div className="text-xs font-semibold truncate">
                  {selectedEmployee.workEmail || '—'}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  <span>Work Mode</span>
                </div>
                <div className="text-xs font-semibold">
                  {selectedEmployee.workMode || 'HYBRID'}
                </div>
              </div>
            </div>

            {/* Career Timeline */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <History className="size-4 text-primary" />
                <span>Career Timeline & Events</span>
              </h3>

              {timeline.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No previous career events recorded.
                </div>
              ) : (
                <div className="space-y-3 border-l-2 border-border ml-2 pl-4">
                  {timeline.map((evt, idx) => (
                    <div key={idx} className="relative space-y-0.5">
                      <div className="absolute -left-[21px] top-1 size-2 rounded-full bg-primary" />
                      <div className="text-xs font-bold text-foreground">
                        {evt.type || 'ROLE_UPDATE'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {evt.description || 'Designation updated'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {evt.createdAt ? new Date(evt.createdAt).toLocaleDateString() : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Add New Employee</h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">First Name</label>
                  <input
                    required
                    type="text"
                    value={newEmployee.firstName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Last Name</label>
                  <input
                    required
                    type="text"
                    value={newEmployee.lastName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Work Email</label>
                <input
                  required
                  type="email"
                  value={newEmployee.workEmail}
                  onChange={(e) => setNewEmployee({ ...newEmployee, workEmail: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Employee Code</label>
                  <input
                    required
                    type="text"
                    placeholder="EMP001"
                    value={newEmployee.employeeCode}
                    onChange={(e) => setNewEmployee({ ...newEmployee, employeeCode: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Designation</label>
                  <input
                    required
                    type="text"
                    placeholder="Software Engineer"
                    value={newEmployee.designation}
                    onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Employment Type</label>
                  <select
                    value={newEmployee.employmentType}
                    onChange={(e) => setNewEmployee({ ...newEmployee, employmentType: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Work Mode</label>
                  <select
                    value={newEmployee.workMode}
                    onChange={(e) => setNewEmployee({ ...newEmployee, workMode: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
                  >
                    <option value="HYBRID">Hybrid</option>
                    <option value="REMOTE">Remote</option>
                    <option value="ONSITE">Onsite</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
