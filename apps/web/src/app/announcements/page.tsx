'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Bell,
  Calendar,
  CheckCircle,
  Eye,
  Megaphone,
  Plus,
  Radio,
  Send,
  Users,
  X,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function AnnouncementsPage() {
  const { hasPermission } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'MEDIUM',
    targetAudience: 'ALL',
    targetDepartments: '',
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.announcements.list().catch(() => ({ items: [], pagination: {} }));
      setAnnouncements(Array.isArray(res) ? res : res?.items || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      alert('Please fill title and content');
      return;
    }
    try {
      const payload: any = {
        title: form.title,
        content: form.content,
        priority: form.priority,
        targetAudience: form.targetAudience,
      };
      if (form.targetAudience === 'DEPARTMENT' && form.targetDepartments) {
        payload.targetDepartments = form.targetDepartments.split(',').map((s) => s.trim());
      }

      await api.announcements.create(payload);
      setIsCreateModalOpen(false);
      setForm({
        title: '',
        content: '',
        priority: 'MEDIUM',
        targetAudience: 'ALL',
        targetDepartments: '',
      });
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Failed to create announcement');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.announcements.publish(id);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Failed to publish announcement');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await api.announcements.archive(id);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Failed to archive announcement');
    }
  };

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-400">Urgent</span>;
      case 'HIGH':
        return <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">High</span>;
      default:
        return <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">Normal</span>;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">Published</span>;
      case 'ARCHIVED':
        return <span className="rounded-md bg-zinc-500/10 px-2 py-0.5 text-xs font-semibold text-zinc-400">Archived</span>;
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
            <h1 className="text-2xl font-bold tracking-tight">Company Announcements</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Workforce Broadcasts
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Broadcast strategic updates, organizational notices, and critical town-hall messages.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition"
        >
          <Plus className="size-4" />
          <span>New Broadcast</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {loading ? (
          <div className="col-span-full py-20 text-center text-sm text-muted-foreground">
            Loading announcements...
          </div>
        ) : (Array.isArray(announcements) ? announcements : []).length === 0 ? (
          <div className="col-span-full py-20 text-center rounded-2xl border border-border bg-card">
            <Megaphone className="mx-auto size-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold">No announcements published</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Broadcast organizational news to your employees.
            </p>
          </div>
        ) : (
          (Array.isArray(announcements) ? announcements : []).map((item) => (
            <div
              key={item._id || item.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-primary/40"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {priorityBadge(item.priority)}
                    {statusBadge(item.status)}
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                      Audience: {item.targetAudience}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-foreground tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {item.content}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Radio className="size-3.5 text-emerald-400" />
                  <span>Channel: Portal Broadcast</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === 'DRAFT' && (
                    <button
                      onClick={() => handlePublish(item._id || item.id)}
                      className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
                    >
                      Publish Now
                    </button>
                  )}
                  {item.status === 'PUBLISHED' && (
                    <button
                      onClick={() => handleArchive(item._id || item.id)}
                      className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: New Announcement */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold">Compose Broadcast</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Broadcast Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 All-Hands Meeting & Strategic Milestones"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Target Audience</label>
                  <select
                    value={form.targetAudience}
                    onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="ALL">All Employees</option>
                    <option value="DEPARTMENT">Specific Department</option>
                    <option value="ROLE">Specific Role</option>
                  </select>
                </div>
              </div>

              {form.targetAudience === 'DEPARTMENT' && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Department Names (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering, Product, Design"
                    value={form.targetDepartments}
                    onChange={(e) => setForm({ ...form, targetDepartments: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground">Announcement Content *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail the message, key dates, or action items..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
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
                  Save Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
