'use client';

import './globals.css';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sun, Moon, LayoutDashboard, Globe, Zap,
  Settings, ShieldCheck, LogOut, Menu, X,
} from 'lucide-react';
import { api } from '@/lib/api';

const NO_SIDEBAR_PATHS = ['/login', '/register', '/verify-email'];

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
          ? 'bg-[var(--primary)] text-white'
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
        <Link href="/" onClick={onNavClick} className="block">
          <h1 className="text-xl font-bold text-[var(--primary)]">Analytics</h1>
          <p className="text-xs text-[var(--muted-foreground)] truncate max-w-[140px]">
            {username ?? '…'}
          </p>
        </Link>
        <ThemeToggle />
      </div>

      <nav className="space-y-1 flex-1">
        <NavLink onClick={onNavClick} href="/"         icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
        <NavLink onClick={onNavClick} href="/websites" icon={<Globe className="h-4 w-4" />}           label="Websites" />
        <NavLink onClick={onNavClick} href="/realtime" icon={<Zap className="h-4 w-4" />}             label="Real-time" />
        <NavLink onClick={onNavClick} href="/settings" icon={<Settings className="h-4 w-4" />}        label="Settings" />
        {role === 'ADMIN' && (
          <NavLink onClick={onNavClick} href="/admin"  icon={<ShieldCheck className="h-4 w-4" />}     label="Admin" />
        )}
      </nav>

      <div className="pt-6 border-t border-[var(--border)]">
        {role && (
          <div className="mb-3 px-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-[var(--border)] bg-[var(--card)] h-screen sticky top-0 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          ref={overlayRef}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[var(--card)] border-r border-[var(--border)]
        transform transition-transform duration-200 ease-in-out lg:hidden
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] transition-colors"
          aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
        <SidebarContent onNavClick={() => setOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] transition-colors"
            aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="font-semibold text-[var(--primary)]">Analytics</Link>
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
      <body className="min-h-screen bg-[var(--background)] antialiased">
        {noSidebar ? children : <AppShell>{children}</AppShell>}
      </body>
    </html>
  );
}
