'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pill, UserCheck, IdCard, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function MRLoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('');
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

  const handleLogin = async (e: React.FormEvent, overrideEmpId?: string) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const empToUse = (overrideEmpId || employeeId).trim();
    if (!empToUse) {
      setError('Please enter your Employee ID');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empToUse, role: 'mr' }),
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
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-2xl border border-slate-100 sm:px-10">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-600" />
              MR / TM Sign In
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your Employee ID to access your assigned doctor call list
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Employee ID (EMP-ID)
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <IdCard className="h-5 w-5 text-teal-600" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. 149893"
                  className="block w-full pl-11 pr-3 py-3 text-base sm:text-sm font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400 bg-slate-50/50"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                No password needed. Just your employee ID number.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying ID...
                </>
              ) : (
                <>
                  Open MR Workspace
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
