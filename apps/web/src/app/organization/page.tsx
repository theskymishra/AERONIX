'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  ChevronRight,
  Globe,
  MapPin,
  Network,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function OrganizationPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [headcount, setHeadcount] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, hcRes] = await Promise.all([
        api.employees.list({ limit: 200 }).catch(() => ({ items: [], total: 0 })),
        api.reports.getHeadcount().catch(() => null),
      ]);

      setEmployees(Array.isArray(empRes) ? empRes : empRes?.items || []);
      setHeadcount(hcRes);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute departments dynamically from employees
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const departmentsMap: Record<string, any[]> = {};
  safeEmployees.forEach((emp) => {
    const dept = emp.department || 'General';
    if (!departmentsMap[dept]) departmentsMap[dept] = [];
    departmentsMap[dept].push(emp);
  });

  const uniqueDesignations = Array.from(
    new Set(safeEmployees.map((e) => e.designation).filter(Boolean)),
  );

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Organization Structure</h1>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
              Hierarchy & Departments
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Department allocations, organizational chart, and workforce designation matrix.
          </p>
        </div>
      </div>

      {/* Org Profile Header Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-xl shadow-lg">
              {user?.organizationId ? 'A' : 'O'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                AERONIX Technologies Inc.
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Globe className="size-3.5 text-blue-400" />
                  <span>enterprise.aeronix.io</span>
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-rose-400" />
                  <span>Global HQ (San Francisco & Remote)</span>
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Shield className="size-3.5 text-emerald-400" />
                  <span>Enterprise Tier</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6">
            <div>
              <div className="text-2xl font-bold font-mono">{employees.length}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Members</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">{Object.keys(departmentsMap).length}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Units</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">{uniqueDesignations.length}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Roles</div>
            </div>
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold tracking-tight">Active Departments</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(departmentsMap).map(([deptName, members]) => {
            const lead = members[0];
            return (
              <div
                key={deptName}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Network className="size-5" />
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-mono font-medium">
                      {members.length} member{members.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-foreground">{deptName}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lead: {lead ? `${lead.firstName} ${lead.lastName}` : 'Unassigned'}
                  </p>
                </div>

                <div className="mt-5 border-t border-border pt-3">
                  <div className="flex -space-x-2 overflow-hidden">
                    {members.slice(0, 5).map((m) => (
                      <div
                        key={m._id || m.id}
                        title={`${m.firstName} ${m.lastName}`}
                        className="inline-block size-7 rounded-full bg-muted border-2 border-card text-[10px] font-bold flex items-center justify-center text-foreground"
                      >
                        {m.firstName?.[0]}{m.lastName?.[0]}
                      </div>
                    ))}
                    {members.length > 5 && (
                      <div className="inline-block size-7 rounded-full bg-muted border-2 border-card text-[10px] font-bold flex items-center justify-center text-muted-foreground">
                        +{members.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Designation Directory */}
      <div className="space-y-4">
        <h3 className="text-base font-bold tracking-tight">Workforce Roles & Designations</h3>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap gap-2">
            {uniqueDesignations.length > 0 ? (
              uniqueDesignations.map((desig) => (
                <span
                  key={desig}
                  className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/50 transition cursor-default"
                >
                  {desig}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No roles configured.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
