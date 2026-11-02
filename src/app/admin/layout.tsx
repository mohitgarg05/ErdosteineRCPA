'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  FileText,
  Users,
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Clean Nominal Top Navigation */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight">
                Erdosteine RCPA
              </div>
              <div className="text-[10px] text-slate-500">
                Admin Console
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1">
            <Link
              href="/admin/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                pathname === '/admin/dashboard'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>RCPA Entries</span>
            </Link>

            <Link
              href="/admin/doctors"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                pathname === '/admin/doctors'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Doctor Master</span>
            </Link>

            <Link
              href="/"
              target="_blank"
              title="Open Employee Field Portal in new tab"
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md transition"
            >
              <span>Field Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 ml-2 border-l border-slate-200">
              <span className="hidden sm:inline text-xs text-slate-600">
                {user?.email || 'admin@erdosteine.com'}
              </span>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
