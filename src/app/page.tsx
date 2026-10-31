'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pill, UserCheck, Lock, Mail, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function MRLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if already authenticated
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          if (data.user.role === 'mr') {
            router.push('/mr/new-visit');
          } else if (data.user.role === 'admin') {
            router.push('/admin/dashboard');
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
        body: JSON.stringify({ email, password, role: 'mr' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      router.push('/mr/new-visit');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const autofillDemoMR = () => {
    setEmail('mr@erdosteine.com');
    setPassword('mr123');
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Logo / Brand Header */}
        <div className="flex justify-center items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/20">
            <Pill className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Erdosteine RCPA
            </h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">
              Field Force Portal
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-slate-600 mt-2">
          Doctor Prescription Audit & Field Reporting
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-2xl border border-slate-100 sm:px-10">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-600" />
              MR Sign In
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your credentials to record doctor visits and RCPA units
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                Email / User ID
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mr@erdosteine.com"
                  className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400 bg-slate-50/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Open MR Workspace
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Pill */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={autofillDemoMR}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-md text-xs font-medium border border-teal-200/60 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Click here to autofill sample MR credentials (mr@erdosteine.com)
            </button>
          </div>
        </div>

        {/* Link to Admin */}
        <div className="mt-6 text-center">
          <Link
            href="/admin"
            className="text-xs text-slate-500 hover:text-teal-700 font-medium inline-flex items-center gap-1 transition"
          >
            Looking for Manager / Admin Access? Go to Admin Portal →
          </Link>
        </div>
      </div>
    </div>
  );
}
