'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart2, Eye, Globe, Zap, Lock, User, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (res.ok) {
      window.location.href = '/';
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)]">

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[var(--primary)] p-12 text-white">
        <div className="flex items-center gap-3">
          <BarChart2 className="h-7 w-7" />
          <span className="text-xl font-bold tracking-tight">Web Analytics</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Know your audience.<br />Own your data.
            </h1>
            <p className="mt-4 text-indigo-200 text-lg leading-relaxed">
              Self-hosted, privacy-focused analytics. No third parties,
              no cookies, just clean insights about your visitors.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: <Eye className="h-5 w-5" />,   label: 'Real-time visitor tracking' },
              { icon: <Globe className="h-5 w-5" />,  label: 'Country & device breakdown' },
              { icon: <Zap className="h-5 w-5" />,    label: 'Custom event analytics' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  {icon}
                </div>
                <span className="text-indigo-100">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-indigo-300">
          © {new Date().getFullYear()} Robin te Hofstee
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <BarChart2 className="h-6 w-6 text-[var(--primary)]" />
            <span className="text-lg font-bold text-[var(--primary)]">Web Analytics</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Sign in</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Enter your credentials to access the dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="robin30"
                  required
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2.5 text-sm text-red-500">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--primary)] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
