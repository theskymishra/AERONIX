'use client';

import { usePathname } from 'next/navigation';
import { CommandCenter } from './command-center';
import { MobileNavigation } from './mobile-navigation';
import { Notifications } from './notifications';
import { ProfileMenu } from './profile-menu';
import { ThemeToggle } from '@/components/theme-toggle';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Workforce Pulse & Dashboard',
  '/employees': 'Employees & Directory',
  '/organization': 'Organization Structure',
  '/attendance': 'Attendance & Time Logs',
  '/leave': 'Leave Management',
  '/payroll': 'Payroll & Compensation',
  '/performance': 'Performance Management',
  '/goals': 'Goals & OKRs',
  '/recruitment': 'Recruitment & Talent',
  '/documents': 'Documents & Compliance',
  '/announcements': 'Company Announcements',
  '/audit-logs': 'Audit Logs & Governance',
  '/reports': 'Workforce Intelligence',
  '/settings': 'Platform Settings',
  '/notifications': 'Notifications Center',
};

export function TopNavigation() {
  const pathname = usePathname();

  const title = (() => {
    if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
    const match = Object.keys(ROUTE_TITLES).find(
      (key) => key !== '/' && pathname.startsWith(key),
    );
    return match ? ROUTE_TITLES[match] : 'Workforce Intelligence';
  })();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <MobileNavigation />

        <span className="text-sm font-medium text-muted-foreground transition-colors">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <CommandCenter />

        <ThemeToggle />

        <Notifications />

        <ProfileMenu />
      </div>
    </header>
  );
}