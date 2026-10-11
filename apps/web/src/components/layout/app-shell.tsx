'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { isPublicRoute, getAuthRedirect } from '@/lib/auth-gate';
import { Sidebar } from './sidebar';
import { TopNavigation } from './top-navigation';
import { ThemeToggle } from '@/components/theme-toggle';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const isPublic = isPublicRoute(pathname);
  const redirectTarget = getAuthRedirect(pathname, isAuthenticated, isLoading);

  useEffect(() => {
    if (redirectTarget) {
      router.replace(redirectTarget);
    }
  }, [redirectTarget, router]);

  // While auth session is restoring on a protected route:
  // Render full-page branded loading gate to prevent ANY flash of internal portal or widgets.
  if (isLoading && !isPublic) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground transition-colors">
        <div className="relative flex flex-col items-center">
          {/* Ambient glow */}
          <div className="absolute -top-12 size-40 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl ring-1 ring-border">
            <Sparkles className="size-7 animate-pulse" />
          </div>

          <div className="mt-5 text-center">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              AERONIX HR
            </h1>
            <p className="mt-1 text-xs tracking-wider uppercase text-muted-foreground">
              Workforce Intelligence Platform
            </p>
          </div>

          {/* Minimalist loader bar */}
          <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 animate-pulse bg-primary" />
          </div>
          <span className="mt-3 text-[11px] text-muted-foreground">
            Verifying workspace credentials...
          </span>
        </div>
      </div>
    );
  }

  // Public route (e.g. /login, /register)
  if (isPublic) {
    // If authenticated on a public route, show redirect screen while routing to dashboard
    if (isAuthenticated) {
      return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background text-foreground">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs text-muted-foreground">
              Entering workspace...
            </p>
          </div>
        </div>
      );
    }

    // Public authentication experience with floating theme switch in corner
    return (
      <div className="relative min-h-screen bg-background text-foreground transition-colors">
        <div className="absolute right-5 top-5 z-50">
          <ThemeToggle />
        </div>
        {children}
      </div>
    );
  }

  // If unauthenticated on a protected route (redirect in progress):
  // Never leak or render internal portal shell or widgets!
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  // Authenticated Portal Experience
  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavigation />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
