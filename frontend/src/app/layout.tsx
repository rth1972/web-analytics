'use client';

import './globals.css';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sun, Moon, LayoutDashboard, Globe, Zap,
  Settings, ShieldCheck, LogOut, Menu, X,
  Target, Key, Bell, Activity, HelpCircle, BookOpen,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';

const ALWAYS_NO_SIDEBAR = ['/login', '/register', '/verify-email', '/docs'];
const LANDING_PATH = '/';

/* ── Viewly Logo ──────────────────────────────────────────────────────────── */
function ViewlyLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vl3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.15)" />
      <path d="M 3 16 Q 16 4 29 16 Q 16 28 3 16 Z"
        fill="none" stroke="url(#vl3)" strokeWidth="2.2"
        strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="16" cy="16" r="5.5" fill="white" opacity="0.95" />
      <circle cx="16" cy="16" r="2.5" fill="#6366f1" />
    </svg>
  );
}

/* ── Theme toggle ─────────────────────────────────────────────────────────── */
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
    <button onClick={toggle} title="Toggle theme"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors duration-150">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

/* ── Nav items config ─────────────────────────────────────────────────────── */
const NAV = [
  { href: '/',         icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/websites', icon: Globe,           label: 'Websites'  },
  { href: '/realtime', icon: Zap,             label: 'Real-time' },
  { href: '/goals',    icon: Target,          label: 'Goals'     },
  { href: '/uptime',   icon: Activity,        label: 'Uptime'    },
  { href: '/alerts',   icon: Bell,            label: 'Alerts'    },
  { href: '/keys',     icon: Key,             label: 'API Keys'  },
  { href: '/settings', icon: Settings,        label: 'Settings'  },
  { href: '/help',     icon: HelpCircle,      label: 'Help'      },
  { href: '/docs',     icon: BookOpen,        label: 'Docs'      },
];

/* ── Single nav item ──────────────────────────────────────────────────────── */
function NavItem({ href, icon: Icon, label, collapsed, onClick, role, adminOnly }: {
  href: string; icon: any; label: string; collapsed: boolean;
  onClick?: () => void; role?: string | null; adminOnly?: boolean;
}) {
  const pathname = usePathname();
  if (adminOnly && role !== 'ADMIN') return null;
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link href={href} onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150
        ${active
          ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-fg)] shadow-sm'
          : 'text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-fg)]'
        }`}>
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate leading-none">{label}</span>}

      {/* Collapsed tooltip */}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {label}
        </span>
      )}

      {/* Active indicator dot */}
      {active && !collapsed && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70 shrink-0" />
      )}
    </Link>
  );
}

/* ── Sidebar content ──────────────────────────────────────────────────────── */
function SidebarContent({ collapsed, onToggle, onNavClick }: {
  collapsed: boolean; onToggle: () => void; onNavClick?: () => void;
}) {
  const [role,     setRole]     = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/auth/me').then(r => r.json()).then(d => {
      if (d?.role)     setRole(d.role);
      if (d?.username) setUsername(d.username);
    }).catch(() => {});
  }, []);

  function logout() {
    document.cookie = 'auth-token=; path=/; max-age=0';
    document.cookie = '__Secure-auth-token=; path=/; max-age=0';
    try { localStorage.removeItem('auth-token'); } catch {}
    window.location.href = '/login';
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--sidebar-border)] px-4">
        <Link href="/" onClick={onNavClick} className="flex items-center gap-2.5 min-w-0 flex-1">
          <ViewlyLogo size={26} />
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-base font-bold text-white leading-none tracking-tight">Viewly</div>
              {username && (
                <div className="text-[10px] text-[var(--sidebar-muted)] leading-none mt-1 truncate">{username}</div>
              )}
            </div>
          )}
        </Link>
        {/* Collapse toggle — desktop only */}
        <button onClick={onToggle}
          className="hidden lg:flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--sidebar-muted)] hover:text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-hover)] transition-colors">
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-0.5">
        {/* Analytics group */}
        {!collapsed && (
          <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--sidebar-muted)]">
            Analytics
          </div>
        )}
        {collapsed && <div className="py-1" />}

        <NavItem href="/"         icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} onClick={onNavClick} role={role} />
        <NavItem href="/websites" icon={Globe}           label="Websites"  collapsed={collapsed} onClick={onNavClick} role={role} />
        <NavItem href="/realtime" icon={Zap}             label="Real-time" collapsed={collapsed} onClick={onNavClick} role={role} />
        <NavItem href="/goals"    icon={Target}          label="Goals"     collapsed={collapsed} onClick={onNavClick} role={role} />

        {/* Monitoring group */}
        <div className={collapsed ? 'py-2' : 'pt-4 pb-1.5 px-3'}>
          {!collapsed && (
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--sidebar-muted)]">
              Monitoring
            </div>
          )}
          {collapsed && <div className="h-px bg-[var(--sidebar-border)]" />}
        </div>

        <NavItem href="/uptime"   icon={Activity}  label="Uptime"    collapsed={collapsed} onClick={onNavClick} role={role} />
        <NavItem href="/alerts"   icon={Bell}       label="Alerts"    collapsed={collapsed} onClick={onNavClick} role={role} />

        {/* Settings group */}
        <div className={collapsed ? 'py-2' : 'pt-4 pb-1.5 px-3'}>
          {!collapsed && (
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--sidebar-muted)]">
              Settings
            </div>
          )}
          {collapsed && <div className="h-px bg-[var(--sidebar-border)]" />}
        </div>

        <NavItem href="/keys"     icon={Key}         label="API Keys"  collapsed={collapsed} onClick={onNavClick} role={role} />
        <NavItem href="/settings" icon={Settings}    label="Settings"  collapsed={collapsed} onClick={onNavClick} role={role} />
        <NavItem href="/help"     icon={HelpCircle}  label="Help"      collapsed={collapsed} onClick={onNavClick} role={role} />
        <NavItem href="/docs"     icon={BookOpen}    label="Docs"      collapsed={collapsed} onClick={onNavClick} role={role} />

        {role === 'ADMIN' && (
          <>
            <div className={collapsed ? 'py-2' : 'pt-4 pb-1.5 px-3'}>
              {!collapsed && (
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--sidebar-muted)]">
                  Admin
                </div>
              )}
              {collapsed && <div className="h-px bg-[var(--sidebar-border)]" />}
            </div>
            <NavItem href="/admin" icon={ShieldCheck} label="Admin" collapsed={collapsed} onClick={onNavClick} role={role} adminOnly />
          </>
        )}
      </nav>

      {/* ── Footer ── */}
      <div className="shrink-0 border-t border-[var(--sidebar-border)] p-2">
        {!collapsed && role && (
          <div className="mb-2 flex items-center gap-2 px-3 py-1.5">
            <div className={`h-2 w-2 rounded-full shrink-0 ${role === 'ADMIN' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <span className="text-xs text-[var(--sidebar-muted)] truncate">{role}</span>
          </div>
        )}
        <button onClick={logout} title={collapsed ? 'Sign out' : undefined}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-red-300 transition-colors duration-150">
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}

/* ── App shell ────────────────────────────────────────────────────────────── */
function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') setCollapsed(true);
  }, []);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen">

      {/* Desktop sidebar */}
      <aside style={{ width: collapsed ? 60 : 220 }}
        className="hidden lg:flex shrink-0 flex-col bg-[var(--sidebar)] h-screen sticky top-0 transition-all duration-200 ease-in-out">
        <SidebarContent collapsed={collapsed} onToggle={toggleCollapse} />
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div ref={overlayRef} onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" />
      )}

      {/* Mobile drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[220px] bg-[var(--sidebar)] transform transition-transform duration-200 ease-in-out lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-3 rounded-md p-1 text-[var(--sidebar-muted)] hover:text-[var(--sidebar-fg)]">
          <X className="h-4 w-4" />
        </button>
        <SidebarContent collapsed={false} onToggle={() => setMobileOpen(false)} onNavClick={() => setMobileOpen(false)} />
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-md px-4 md:px-6">
          <button onClick={() => setMobileOpen(true)}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--secondary)]">
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ── Root layout ──────────────────────────────────────────────────────────── */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  const alwaysNoSidebar = ALWAYS_NO_SIDEBAR.some(p => pathname.startsWith(p));
  const isLanding = pathname === LANDING_PATH;

  useEffect(() => {
    if (!isLanding) return;
    const token = document.cookie.includes('auth-token=');
    if (!token) { setIsAuthed(false); return; }
    api.get('/api/auth/me')
      .then(r => setIsAuthed(r.ok))
      .catch(() => setIsAuthed(false));
  }, [isLanding]);

  const noSidebar = alwaysNoSidebar
    ? true
    : isLanding
      ? isAuthed !== true  // show landing if not authed, sidebar if authed
      : false;             // all other routes always get sidebar

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <title>Viewly</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-[var(--background)] antialiased">
        {noSidebar ? children : <AppShell>{children}</AppShell>}
      </body>
    </html>
  );
}
