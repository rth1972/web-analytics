'use client';

import type { Metadata } from 'next';
import './globals.css';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sun, Moon, LayoutDashboard, Globe, Zap } from 'lucide-react';

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefersDark;
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
    <button
      onClick={toggle}
      className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors"
      title="Toggle theme"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <a
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-[var(--primary)] text-white'
          : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]'
      }`}
    >
      {icon}
      {label}
    </a>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--background)] antialiased">
        <div className="flex min-h-screen">
          <aside className="w-64 border-r border-[var(--border)] bg-[var(--card)] p-6 flex flex-col">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-[var(--primary)]">Analytics</h1>
                <p className="text-sm text-[var(--muted-foreground)]">Web Analytics</p>
              </div>
              <ThemeToggle />
            </div>
            <nav className="space-y-2">
              <NavLink href="/" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
              <NavLink href="/websites" icon={<Globe className="h-4 w-4" />} label="Websites" />
              <NavLink href="/realtime" icon={<Zap className="h-4 w-4" />} label="Real-time" />
            </nav>
          </aside>
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
