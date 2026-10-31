'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  BarChart3,
  Users2,
  LogOut,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface CurrentUser {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Don't render admin shell on /admin login page
  const isLoginPage = pathname === '/admin';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated || data.user.role !== 'admin') {
          router.push('/admin');
        } else {
          setUser(data.user);
        }
      })
      .catch(() => router.push('/admin'))
      .finally(() => setLoading(false));
  }, [router, isLoginPage]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm sm:text-base leading-tight">
                Erdosteine RCPA
              </div>
              <div className="text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">
                Admin Control Center
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/admin/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                pathname === '/admin/dashboard'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Visits & Export</span>
            </Link>

            <Link
              href="/admin/doctors"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                pathname === '/admin/doctors'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users2 className="w-4 h-4" />
              <span>Doctor Master</span>
            </Link>

            {/* Quick Link to Field MR view */}
            <Link
              href="/"
              target="_blank"
              title="Open MR portal in new tab"
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              <span>MR Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 ml-2 border-l border-slate-700">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-white leading-tight">
                  {user?.name || 'Administrator'}
                </span>
                <span className="text-[10px] text-indigo-300">
                  {user?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Admin Logout"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
