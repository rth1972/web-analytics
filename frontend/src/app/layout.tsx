'use client';

import './globals.css';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sun, Moon, LayoutDashboard, Globe, Zap,
  Settings, ShieldCheck, LogOut, Menu, X, HelpCircle,
} from 'lucide-react';
import { api } from '@/lib/api';

const NO_SIDEBAR_PATHS = ['/login', '/register', '/verify-email'];

function ViewlyLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vl" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1"/>
          <stop offset="100%" stopColor="#4f46e5"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill="url(#vl)"/>
      <path d="M 3 16 Q 16 4 29 16 Q 16 28 3 16 Z"
            fill="none" stroke="#ffffff" strokeWidth="2"
            strokeLinejoin="round" strokeLinecap="round" opacity="0.9"/>
      <circle cx="16" cy="16" r="5.5" fill="#ffffff" opacity="0.95"/>
      <circle cx="16" cy="16" r="2.5" fill="#5457e8"/>
      <rect x="5"  y="22" width="3" height="5" rx="1" fill="#fff" fillOpacity="0.5"/>
      <rect x="10" y="20" width="3" height="7" rx="1" fill="#fff" fillOpacity="0.65"/>
      <rect x="15" y="18" width="3" height="9" rx="1" fill="#fff" fillOpacity="0.85"/>
      <rect x="20" y="19" width="3" height="8" rx="1" fill="#fff" fillOpacity="0.65"/>
      <rect x="25" y="21" width="3" height="6" rx="1" fill="#fff" fillOpacity="0.5"/>
    </svg>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };
  return (
    <button onClick={toggle}
      className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors"
      title="Toggle theme">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function NavLink({ href, icon, label, onClick }: {
  href: string; icon: React.ReactNode; label: string; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <Link href={href} onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-indigo-600 text-white'
          : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]'
      }`}>
      {icon}
      {label}
    </Link>
  );
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const [role,     setRole]     = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data?.role)     setRole(data.role);
        if (data?.username) setUsername(data.username);
      })
      .catch(() => {});
  }, []);

  function logout() {
    document.cookie = 'auth-token=; path=/; max-age=0';
    try { localStorage.removeItem('auth-token'); } catch {}
    window.location.href = '/login';
  }

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" onClick={onNavClick} className="flex items-center gap-2.5">
          <ViewlyLogo size={28} />
          <div>
            <span className="text-lg font-bold text-indigo-600 leading-none">viewly</span>
            <p className="text-xs text-[var(--muted-foreground)] truncate max-w-[110px] leading-none mt-0.5">
              {username ?? '…'}
            </p>
          </div>
        </Link>
        <ThemeToggle />
      </div>

      <nav className="space-y-1 flex-1">
        <NavLink onClick={onNavClick} href="/"         icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
        <NavLink onClick={onNavClick} href="/websites" icon={<Globe className="h-4 w-4" />}           label="Websites" />
        <NavLink onClick={onNavClick} href="/realtime" icon={<Zap className="h-4 w-4" />}             label="Real-time" />
        <NavLink onClick={onNavClick} href="/settings" icon={<Settings className="h-4 w-4" />}        label="Settings" />
        <NavLink onClick={onNavClick} href="/help"     icon={<HelpCircle className="h-4 w-4" />}      label="Help" />
        {role === 'ADMIN' && (
          <NavLink onClick={onNavClick} href="/admin"  icon={<ShieldCheck className="h-4 w-4" />}     label="Admin" />
        )}
      </nav>

      <div className="pt-6 border-t border-[var(--border)]">
        {role && (
          <div className="mb-3 px-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' : 'bg-indigo-500/10 text-indigo-400'
            }`}>
              {role}
            </span>
          </div>
        )}
        <button onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-[var(--border)] bg-[var(--card)] h-screen sticky top-0 flex-col">
        <SidebarContent />
      </aside>

      {open && (
        <div ref={overlayRef} onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" aria-hidden="true" />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[var(--card)] border-r border-[var(--border)]
        transform transition-transform duration-200 ease-in-out lg:hidden
        ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setOpen(false)}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] transition-colors"
          aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
        <SidebarContent onNavClick={() => setOpen(false)} />
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur px-4 py-3">
          <button onClick={() => setOpen(true)}
            className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] transition-colors"
            aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <ViewlyLogo size={24} />
            <span className="font-bold text-indigo-600">viewly</span>
          </Link>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noSidebar = NO_SIDEBAR_PATHS.some(p => pathname.startsWith(p));

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <title>Viewly</title>
      </head>
      <body className="min-h-screen bg-[var(--background)] antialiased">
        {noSidebar ? children : <AppShell>{children}</AppShell>}
      </body>
    </html>
  );
}
