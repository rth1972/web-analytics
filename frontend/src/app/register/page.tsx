'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3456';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Registration failed.');
      else         setSuccess(data.message);
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
        <div className="w-full max-w-sm text-center bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-semibold text-lg mb-2">Check your email</h2>
          <p className="text-[var(--muted-foreground)] text-sm">{success}</p>
          <a href="/login" className="mt-6 inline-block text-sm text-[var(--primary)] hover:underline">← Back to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-[var(--muted-foreground)] mt-1 text-sm">Sign up for Web Analytics</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 space-y-5 shadow-sm">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5">Username</label>
            <input type="text" required autoFocus autoComplete="username"
              value={username} onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="your_username" />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Letters, numbers, underscores, dots and dashes only.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input type="password" required autoComplete="new-password"
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="At least 8 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Confirm password</label>
            <input type="password" required autoComplete="new-password"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
          <p className="text-center text-sm text-[var(--muted-foreground)]">
            Already have an account?{' '}
            <a href="/login" className="text-[var(--primary)] hover:underline font-medium">Sign in</a>
          </p>
        </form>
      </div>
    </div>
  );
}
