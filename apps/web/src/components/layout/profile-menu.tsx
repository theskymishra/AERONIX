'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
  User as UserIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth-context';

const themes = [
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'System',
    icon: Monitor,
  },
] as const;

export function ProfileMenu() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
      >
        <LogIn className="size-3.5" />
        <span>Sign in</span>
      </Link>
    );
  }

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ''}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'A';

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.email || 'User';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label="Open profile menu"
        className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs outline-none transition-colors hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring"
      >
        {initials}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {displayName}
                </p>

                <p className="truncate text-xs text-muted-foreground">
                  {user?.role || user?.email}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push('/employees')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <UserIcon className="size-4" />
            <span>Directory</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => router.push('/settings')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Settings className="size-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Monitor className="size-4 mr-2" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent className="w-40">
            {themes.map((item) => {
              const Icon = item.icon;
              const isActive = theme === item.value;

              return (
                <DropdownMenuItem
                  key={item.value}
                  onClick={() => setTheme(item.value)}
                >
                  <Icon className="size-4 mr-2" />
                  <span>{item.label}</span>
                  {isActive && <Check className="ml-auto size-4" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => logout()}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="size-4 mr-2" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}