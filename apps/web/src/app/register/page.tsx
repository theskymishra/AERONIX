'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building, Lock, Mail, Sparkles, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    organizationName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(formData);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0d0d0f] p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-white text-black shadow-lg">
            <Sparkles className="size-6" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Register Organization
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Set up your AERONIX workforce workspace
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400">
                First Name
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="Rahul"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 px-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-white/30 focus:bg-white/[0.06]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400">
                Last Name
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Sharma"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 px-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-white/30 focus:bg-white/[0.06]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400">
              Organization Name
            </label>
            <div className="relative mt-1">
              <Building className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                required
                value={formData.organizationName}
                onChange={(e) =>
                  setFormData({ ...formData, organizationName: e.target.value })
                }
                placeholder="Aeronix Global Inc."
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-white/30 focus:bg-white/[0.06]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400">
              Work Email
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="admin@aeronix.com"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-white/30 focus:bg-white/[0.06]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400">
              Password
            </label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-white/30 focus:bg-white/[0.06]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Creating workspace...' : 'Create Account'}</span>
            <ArrowRight className="size-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-500">
          Already registered?{' '}
          <Link href="/login" className="font-medium text-white hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
