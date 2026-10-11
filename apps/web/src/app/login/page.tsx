'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl transition-colors">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Sparkles className="size-6" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome to AERONIX
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Workforce Intelligence Platform
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Work Email
            </label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-border bg-muted/40 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-muted/40 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="size-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Need an organization account?{' '}
          <Link href="/register" className="font-semibold text-foreground hover:underline">
            Register Organization
          </Link>
        </div>
      </div>
    </div>
  );
}
