'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { cn } from 'cn';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={cn(
          'flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors',
          className,
        )}
      >
        <span className="size-4" />
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'group relative flex size-9 items-center justify-center rounded-lg border border-border bg-card/60 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer',
        showLabel && 'w-auto px-3 gap-2',
        className,
      )}
    >
      {isDark ? (
        <Sun className="size-4 text-amber-400 transition-transform duration-200 group-hover:rotate-45" />
      ) : (
        <Moon className="size-4 text-indigo-500 transition-transform duration-200 group-hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="text-xs font-medium text-foreground">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
      <span className="sr-only">
        {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      </span>
    </button>
  );
}
