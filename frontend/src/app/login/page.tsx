'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3456';

function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [username,    setUsername]    = useState('');
  const [password,    setPassword]    = useState('');
  const [totp,        setTotp]        = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, totpCode: requires2FA ? totp : undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed.'); setLoading(false); return; }
      if (data.requires2FA) { setRequires2FA(true); setLoading(false); return; }
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `auth-token=${data.token}; path=/; expires=${expires}; SameSite=Strict`;
      try { localStorage.setItem('auth-token', data.token); } catch {}
      const destination = !from || from === '/login' ? '/' : from;
      window.location.href = destination;
    } catch {
      setError('Could not connect to server. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-blue-600 flex-col justify-between p-12 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800" />
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}
              className="absolute rounded-full border border-white"
              style={{
                width:  `${200 + i * 120}px`,
                height: `${200 + i * 120}px`,
                top:    `${-60 + i * 20}px`,
                left:   `${-80 + i * 10}px`,
              }}
            />
          ))}
        </div>

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-xl">Web Analytics</span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Understand your<br />visitors better.
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed">
              Privacy-friendly analytics that help you make smarter decisions about your website.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-3">
            {[
              'Real-time visitor tracking',
              'Country & device breakdown',
              'Custom event tracking',
            ].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-blue-100 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative">
          <p className="text-blue-200 text-sm">
            &copy; {new Date().getFullYear()} Web Analytics. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[var(--background)]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="font-semibold text-lg">Web Analytics</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">
              {requires2FA ? 'Two-factor authentication' : 'Welcome back'}
            </h2>
            <p className="text-[var(--muted-foreground)] mt-1 text-sm">
              {requires2FA
                ? 'Enter the 6-digit code from your authenticator app.'
                : 'Sign in to your analytics dashboard.'}
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!requires2FA ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Username
                  </label>
                  <input
                    type="text" required autoFocus autoComplete="username"
                    value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="your_username"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-[var(--foreground)]">Password</label>
                  </div>
                  <input
                    type="password" required autoComplete="current-password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Authenticator code
                </label>
                <input
                  type="text" required autoFocus inputMode="numeric"
                  maxLength={6} value={totp} onChange={e => setTotp(e.target.value)}
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button type="button"
                  onClick={() => { setRequires2FA(false); setTotp(''); setError(''); }}
                  className="mt-2 text-xs text-[var(--muted-foreground)] hover:underline">
                  ← Back to login
                </button>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50">
              {loading ? 'Signing in…' : requires2FA ? 'Verify' : 'Sign in'}
            </button>
          </form>

          {!requires2FA && (
            <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
              Don&apos;t have an account?{' '}
              <a href="/register" className="text-blue-600 hover:underline font-medium">
                Create an account
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
