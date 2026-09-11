"use client";

import { Bell, CheckCheck, Clock, FileText, UserPlus } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const notifications = [
  {
    id: 1,
    title: "New employee added",
    description: "A new employee profile needs your review.",
    time: "10 min ago",
    icon: UserPlus,
    unread: true,
  },
  {
    id: 2,
    title: "Leave request pending",
    description: "A leave request is waiting for approval.",
    time: "1 hour ago",
    icon: Clock,
    unread: true,
  },
  {
    id: 3,
    title: "Payroll document ready",
    description: "The latest payroll document is available.",
    time: "Yesterday",
    icon: FileText,
    unread: false,
  },
];

export function Notifications() {
  const unreadCount = notifications.filter(
    (notification) => notification.unread,
  ).length;

  return (
    <Popover>
        <PopoverTrigger
            type="button"
            aria-label={`Notifications${
                unreadCount > 0 ? `, ${unreadCount} unread` : ""
            }`}
            className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
            <Bell className="size-4" />

            {unreadCount > 0 && (
                <span
                aria-hidden="true"
                className="absolute right-1.5 top-1.5 size-2 rounded-full bg-foreground ring-2 ring-background"
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
                    unreadCount === 1 ? "" : "s"
                  }`
                : "You're all caught up"}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const Icon = notification.icon;

              return (
                <button
                  key={notification.id}
                  type="button"
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p className="text-sm font-medium">
                        {notification.title}
                      </p>

                      {notification.unread && (
                        <span
                          aria-label="Unread"
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground"
                        />
                      )}
                    </div>

                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                      {notification.description}
                    </p>

                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {notification.time}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto size-5 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No notifications</p>
              <p className="mt-1 text-xs text-muted-foreground">
                New activity will appear here.
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}