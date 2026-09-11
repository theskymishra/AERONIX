'use client';

import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Settings,
  Target,
  Users,
} from 'lucide-react';

export const navigation = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Employees',
    icon: Users,
  },
  {
    label: 'Organization',
    icon: Building2,
  },
  {
    label: 'Attendance',
    icon: CalendarDays,
  },
  {
    label: 'Leave',
    icon: ClipboardCheck,
  },
  {
    label: 'Payroll',
    icon: FileText,
  },
  {
    label: 'Performance',
    icon: BarChart3,
  },
  {
    label: 'Goals',
    icon: Target,
  },
];

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-background md:flex">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <div>
          <div className="text-lg font-semibold tracking-tight">AERONIX</div>
          <div className="text-xs text-muted-foreground">HR</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="border-t border-border p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="size-4" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}