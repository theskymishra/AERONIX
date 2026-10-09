'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Filter,
  Inbox,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter === 'unread') params.read = false;

      const res = await api.notifications.list(params).catch(() => ({ items: [], pagination: {} }));
      setNotifications(res.items || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      fetchNotifications();
    } catch {
      // fallback
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      fetchNotifications();
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Notification Center</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Real-Time
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            System alerts, leave request decisions, payroll notices, and company broadcasts.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
        >
          <CheckCheck className="size-4 text-emerald-400" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-accent text-accent-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            filter === 'unread'
              ? 'bg-accent text-accent-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Unread Alerts
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-20 text-center">
            <Inbox className="mx-auto size-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold">Inbox is clear</h3>
            <p className="text-xs text-muted-foreground mt-1">
              You are up to date on all workforce actions and alerts.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id || n.id}
              className={`flex items-start justify-between gap-4 rounded-2xl border p-4 transition ${
                !n.read
                  ? 'border-primary/40 bg-primary/[0.03]'
                  : 'border-border bg-card hover:bg-muted/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${
                    !n.read ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Bell className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-foreground">{n.title}</h4>
                    {!n.read && (
                      <span className="size-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                  <div className="mt-2 text-[10px] font-mono text-muted-foreground">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now'}
                  </div>
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={() => handleMarkRead(n._id || n.id)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  title="Mark as read"
                >
                  <Check className="size-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
