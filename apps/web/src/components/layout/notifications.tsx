'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Clock, FileText, UserPlus, Info, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export function Notifications() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const [listRes, countRes] = await Promise.all([
        api.notifications.list({ limit: 10 }),
        api.notifications.getUnreadCount(),
      ]);
      setItems(listRes.items || []);
      setUnreadCount(countRes.unreadCount || 0);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated]);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setUnreadCount(0);
      setItems((prev) =>
        prev.map((item) => ({ ...item, isRead: true })),
      );
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setItems((prev) =>
        prev.map((item) =>
          (item._id === id || item.id === id)
            ? { ...item, isRead: true }
            : item,
        ),
      );
    } catch {
      // ignore
    }
  };

  const getIcon = (type?: string, category?: string) => {
    if (category === 'LEAVE' || category === 'ATTENDANCE') return Clock;
    if (category === 'PAYROLL') return FileText;
    if (category === 'RECRUITMENT') return UserPlus;
    if (type === 'WARNING' || type === 'ACTION_REQUIRED') return AlertTriangle;
    return Info;
  };

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        aria-label={`Notifications${
          unreadCount > 0 ? `, ${unreadCount} unread` : ''
        }`}
        className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Bell className="size-4" />

        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-background animate-pulse"
          />
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[calc(100vw-2rem)] p-0 sm:w-96"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Notifications</h2>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread notification${
                    unreadCount === 1 ? '' : 's'
                  }`
                : "You're all caught up"}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {items.length > 0 ? (
            items.map((notification) => {
              const Icon = getIcon(notification.type, notification.category);
              const notifId = notification._id || notification.id;
              const isUnread = !notification.isRead;

              return (
                <div
                  key={notifId}
                  onClick={() => isUnread && handleMarkRead(notifId)}
                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors cursor-pointer ${
                    isUnread ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50 mt-0.5">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold">
                        {notification.title}
                      </p>

                      {isUnread && (
                        <span
                          aria-label="Unread"
                          className="mt-1 size-1.5 shrink-0 rounded-full bg-primary"
                        />
                      )}
                    </div>

                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {notification.message || notification.description}
                    </p>

                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {notification.createdAt
                        ? new Date(notification.createdAt).toLocaleDateString()
                        : 'Just now'}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto size-5 text-muted-foreground" />
              <p className="mt-2 text-xs font-medium">No notifications</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Activity alerts and notices will appear here.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border p-2 text-center">
          <Link
            href="/notifications"
            className="text-xs font-medium text-primary hover:underline block py-1"
          >
            View all notifications & preferences →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}