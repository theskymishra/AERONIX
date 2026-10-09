'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  FileText,
  FolderGit2,
  HelpCircle,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  Users,
} from 'lucide-react';

export const navigation = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Employees',
    href: '/employees',
    icon: Users,
  },
  {
    label: 'Organization',
    href: '/organization',
    icon: Building2,
  },
  {
    label: 'Attendance',
    href: '/attendance',
    icon: CalendarDays,
  },
  {
    label: 'Leave',
    href: '/leave',
    icon: ClipboardCheck,
  },
  {
    label: 'Payroll',
    href: '/payroll',
    icon: FileText,
  },
  {
    label: 'Performance',
    href: '/performance',
    icon: BarChart3,
  },
  {
    label: 'Goals',
    href: '/goals',
    icon: Target,
  },
  {
    label: 'Recruitment',
    href: '/recruitment',
    icon: UserCheck,
  },
  {
    label: 'Documents',
    href: '/documents',
    icon: FileCheck2,
  },
  {
    label: 'Announcements',
    href: '/announcements',
    icon: Megaphone,
  },
  {
    label: 'Audit Logs',
    href: '/audit-logs',
    icon: ShieldCheck,
  },
  {
    label: 'Reports & Intelligence',
    href: '/reports',
    icon: Sparkles,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-background md:flex">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            A
          </div>
          <div>
            <div className="text-base font-bold tracking-tight">AERONIX</div>
            <div className="text-[10px] tracking-wider uppercase text-muted-foreground">Workforce Intelligence</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-accent-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Settings */}
      <div className="border-t border-border p-3 space-y-1">
        <Link
          href="/notifications"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Bell className="size-4 shrink-0" />
          <span>Notifications</span>
        </Link>
        <Link
          href="/settings"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="size-4 shrink-0" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}