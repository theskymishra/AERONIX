'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Command,
  Search,
  Users,
  Building2,
  CalendarDays,
  BarChart3,
  Settings,
  ClipboardCheck,
  FileText,
  Target,
  UserCheck,
  FileCheck2,
  Megaphone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

const commands = [
  {
    label: 'Search employees',
    description: 'Find employees across AERONIX',
    href: '/employees',
    icon: Users,
  },
  {
    label: 'Open organization',
    description: 'Explore your organization structure',
    href: '/organization',
    icon: Building2,
  },
  {
    label: 'View attendance',
    description: 'Check attendance records and clock logs',
    href: '/attendance',
    icon: CalendarDays,
  },
  {
    label: 'Manage leave',
    description: 'Leave requests, balances, and approvals',
    href: '/leave',
    icon: ClipboardCheck,
  },
  {
    label: 'Review payroll',
    description: 'Cycles, salary payments, and slips',
    href: '/payroll',
    icon: FileText,
  },
  {
    label: 'View performance',
    description: 'Performance reviews and 360 insights',
    href: '/performance',
    icon: BarChart3,
  },
  {
    label: 'Track goals',
    description: 'Company objectives and personal goals',
    href: '/goals',
    icon: Target,
  },
  {
    label: 'Recruitment pipeline',
    description: 'Job openings, candidates, and interviews',
    href: '/recruitment',
    icon: UserCheck,
  },
  {
    label: 'Organization documents',
    description: 'Policies, manuals, and forms',
    href: '/documents',
    icon: FileCheck2,
  },
  {
    label: 'Announcements',
    href: '/announcements',
    description: 'Company broadcasts and bulletins',
    icon: Megaphone,
  },
  {
    label: 'Audit logs',
    href: '/audit-logs',
    description: 'Security and tenant activity timeline',
    icon: ShieldCheck,
  },
  {
    label: 'Workforce intelligence',
    href: '/reports',
    description: 'Executive analytics, trends, and exports',
    icon: Sparkles,
  },
  {
    label: 'Open settings',
    href: '/settings',
    description: 'Manage AERONIX configuration',
    icon: Settings,
  },
];

export function CommandCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const filteredCommands = commands.filter((command) => {
    const searchText = `${command.label} ${command.description}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open Command Center"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
      >
        <Search className="size-4" />

        <span className="hidden sm:inline">Search</span>

        <span className="hidden items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium sm:flex">
          <Command className="size-3" />
          K
        </span>
      </button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);

          if (!nextOpen) {
            setQuery('');
          }
        }}
      >
        <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">AERONIX Command Center</DialogTitle>

          <DialogDescription className="sr-only">
            Search and quickly access AERONIX features.
          </DialogDescription>

          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />

            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search AERONIX or jump to a module..."
              className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />

            <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
              ESC
            </kbd>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {filteredCommands.length > 0 ? (
              filteredCommands.map((command) => {
                const Icon = command.icon;

                return (
                  <button
                    key={command.label}
                    type="button"
                    onClick={() => handleSelect(command.href)}
                    className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent cursor-pointer"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{command.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {command.description}
                      </p>
                    </div>

                    <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No commands matching &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}