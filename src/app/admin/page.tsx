'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          if (data.user.role === 'admin') {
            router.push('/admin/dashboard');
          } else if (data.user.role === 'mr') {
            router.push('/mr/new-visit');
          }
        }
      })
      .catch(() => {})
      .finally(() => setCheckingAuth(false));
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'admin' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login as Administrator');
      }

      router.push('/admin/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const autofillDemoAdmin = () => {
    setEmail('admin@erdosteine.com');
    setPassword('admin123');
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="flex justify-center items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Erdosteine RCPA
            </h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Admin & Management Console
            </p>
          </div>
        </div>
        <p className="text-center text-sm text-slate-400 mt-2">
          Doctor Master Setup, RCPA Analytics & Reports Export
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900/90 py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              Admin Authentication
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure credentials required to access system masters and reports
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-800/60 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                Admin Email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@erdosteine.com"
                  className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-800/80 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-800/80 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Admin Access...
                </>
              ) : (
                <>
                  Enter Admin Console
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Pill */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <button
              type="button"
              onClick={autofillDemoAdmin}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 rounded-md text-xs font-medium border border-indigo-800/50 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Autofill sample admin credentials (admin@erdosteine.com)
            </button>
          </div>
        </div>

        {/* Link to MR */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 transition"
          >
            ← Switch to MR Field Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
