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

      if (!res.ok) {
        setError(data.error || 'Login failed.');
        setLoading(false);
        return;
      }

      if (data.requires2FA) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      // Store in cookie (for Next.js middleware) AND localStorage (for api client)
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `auth-token=${data.token}; path=/; expires=${expires}; SameSite=Strict`;
      try { localStorage.setItem('auth-token', data.token); } catch {}

      // Full page reload so middleware picks up the new cookie
      const destination = !from || from === '/login' ? '/' : from;
      window.location.href = destination;
    } catch {
      setError('Could not connect to server. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Web Analytics</h1>
          <p className="text-[var(--muted-foreground)] mt-1 text-sm">
            {requires2FA ? 'Enter your 2FA code' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 space-y-5 shadow-sm">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {!requires2FA ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1.5">Username</label>
                <input
                  type="text" required autoFocus autoComplete="username"
                  value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder="your_username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <input
                  type="password" required autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder="••••••••"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1.5">Authenticator Code</label>
              <input
                type="text" required autoFocus inputMode="numeric"
                maxLength={6} value={totp} onChange={e => setTotp(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="000000"
              />
              <button type="button"
                onClick={() => { setRequires2FA(false); setTotp(''); setError(''); }}
                className="mt-2 text-xs text-[var(--muted-foreground)] hover:underline">
                ← Back to login
              </button>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? 'Signing in…' : requires2FA ? 'Verify' : 'Sign in'}
          </button>

          {!requires2FA && (
            <p className="text-center text-sm text-[var(--muted-foreground)]">
              Don&apos;t have an account?{' '}
              <a href="/register" className="text-[var(--primary)] hover:underline font-medium">Sign up</a>
            </p>
          )}
        </form>
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
