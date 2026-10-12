'use client';

import React, { useEffect, useState } from 'react';
import {
  Clock,
  Database,
  Filter,
  KeyRound,
  Lock,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  User,
  X,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function AuditLogsPage() {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity = entityFilter;

      const res = await api.auditLogs.list(params).catch(() => ({ items: [], total: 0, totalPages: 0 }));
      setLogs(Array.isArray(res) ? res : res?.items || []);
      setTotal(res.total || 0);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const actionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-emerald-400">CREATE</span>;
      case 'UPDATE':
        return <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-blue-400">UPDATE</span>;
      case 'DELETE':
      case 'ARCHIVE':
        return <span className="rounded bg-rose-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-rose-400">{action}</span>;
      case 'APPROVE':
        return <span className="rounded bg-purple-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-purple-400">APPROVE</span>;
      case 'LOGIN':
        return <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-amber-400">LOGIN</span>;
      default:
        return <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">{action}</span>;
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Enterprise Audit Trail</h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              Immutable Logs
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Complete compliance trail tracking security events, role elevations, and state modifications.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground border border-border bg-card px-3 py-1.5 rounded-xl">
          <Lock className="size-3.5 text-emerald-400" />
          <span>SOC 2 & GDPR Verified</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm pl-2">
          <Filter className="size-4" />
          <span>Filter Logs:</span>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="APPROVE">APPROVE</option>
          <option value="REJECT">REJECT</option>
          <option value="LOGIN">LOGIN</option>
          <option value="ARCHIVE">ARCHIVE</option>
        </select>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Entities</option>
          <option value="EMPLOYEE">EMPLOYEE</option>
          <option value="ATTENDANCE">ATTENDANCE</option>
          <option value="LEAVE_REQUEST">LEAVE_REQUEST</option>
          <option value="PAYROLL">PAYROLL</option>
          <option value="PERFORMANCE">PERFORMANCE</option>
          <option value="RECRUITMENT">RECRUITMENT</option>
          <option value="ORGANIZATION_DOCUMENT">ORGANIZATION_DOCUMENT</option>
          <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
        </select>

        {(actionFilter || entityFilter) && (
          <button
            onClick={() => {
              setActionFilter('');
              setEntityFilter('');
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition underline ml-auto pr-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            Streaming audit trail events...
          </div>
        ) : (Array.isArray(logs) ? logs : []).length === 0 ? (
          <div className="py-20 text-center">
            <ShieldCheck className="mx-auto size-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold">No audit events found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Events will record as operations are performed within the organization.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Target Entity</th>
                  <th className="px-6 py-3.5">Entity ID</th>
                  <th className="px-6 py-3.5">Actor User</th>
                  <th className="px-6 py-3.5">IP / Client</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {(Array.isArray(logs) ? logs : []).map((log) => (
                  <tr key={log._id || log.id} className="hover:bg-muted/20 font-mono text-xs">
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">{actionBadge(log.action)}</td>
                    <td className="px-6 py-4 text-foreground font-semibold">{log.entity}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {log.entityId ? `#${String(log.entityId).slice(-8)}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {log.userId ? `#${String(log.userId).slice(-6)}` : 'System'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="rounded-lg bg-muted px-2.5 py-1 text-xs font-sans text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer / Modal: Log Metadata */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Terminal className="size-5 text-emerald-400" />
                <h2 className="text-lg font-bold">Audit Event Payload</h2>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-3 font-mono">
                <div>
                  <span className="text-muted-foreground">Event ID: </span>
                  <span>{selectedLog._id || selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Action: </span>
                  <span className="font-bold">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Entity: </span>
                  <span>{selectedLog.entity}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Entity ID: </span>
                  <span>{selectedLog.entityId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Actor: </span>
                  <span>{selectedLog.userId || 'SYSTEM'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">IP Address: </span>
                  <span>{selectedLog.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Raw State Metadata / Diff
                </label>
                <pre className="mt-1 max-h-60 overflow-y-auto rounded-xl bg-black/60 p-3 font-mono text-[11px] text-emerald-400 border border-border">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
