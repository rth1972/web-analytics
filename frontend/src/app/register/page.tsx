'use client';

import { useState } from 'react';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3456';

function ViewlyMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vm2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1"/>
          <stop offset="100%" stopColor="#4f46e5"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill="url(#vm2)"/>
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

  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative min-h-screen flex-col justify-between p-12 overflow-hidden bg-indigo-600">
        
        {/* BACKGROUND IMAGE - Corrected implementation */}
        <Image 
          src="/2481602.jpeg" 
          alt="Dashboard Background"
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-40 z-0" 
        />

        {/* Overlays - z-10 puts them above the image but below the text */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 to-indigo-900 opacity-30 z-10" />
        <div className="absolute inset-0 opacity-10 z-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white" style={{
              width: `${200 + i * 120}px`, height: `${200 + i * 120}px`,
              top: `${-60 + i * 20}px`, left: `${-80 + i * 10}px`,
            }} />
          ))}
        </div>

        {/* Content - z-20 puts this on top of everything */}
        <div className="relative z-20 flex items-center gap-3">
          <ViewlyMark size={40} />
          <span className="text-white font-bold text-2xl tracking-tight">Viewly</span>
        </div>

        <div className="relative z-20 space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Start tracking<br />in minutes.
            </h1>
            <p className="text-indigo-100 text-lg leading-relaxed">
              Create your free account and get instant insights into who visits your website.
            </p>
          </div>
          <div className="space-y-3">
            {['No credit card required', 'Set up in under 5 minutes', 'GDPR-friendly analytics'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-indigo-50 text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-20">
          <p className="text-indigo-200 text-sm">&copy; {new Date().getFullYear()} Viewly. All rights reserved.</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[var(--background)]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <ViewlyMark size={32} />
            <span className="font-bold text-xl text-indigo-600">viewly</span>
          </div>

          {success ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Check your email</h2>
              <p className="text-[var(--muted-foreground)] text-sm mb-6">{success}</p>
              <a href="/login" className="text-indigo-600 hover:underline text-sm font-medium">← Back to login</a>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[var(--foreground)]">Create an account</h2>
                <p className="text-[var(--muted-foreground)] mt-1 text-sm">Fill in the details below to get started with Viewly.</p>
              </div>

              {error && (
                <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Username</label>
                  <input type="text" required autoFocus autoComplete="username"
                    value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="your_username"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">Letters, numbers, underscores, dots and dashes only.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Email</label>
                  <input type="email" required autoComplete="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Password</label>
                  <input type="password" required autoComplete="new-password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Confirm password</label>
                  <input type="password" required autoComplete="new-password"
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-2">
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
                Already have an account?{' '}
                <a href="/login" className="text-indigo-600 hover:underline font-medium">Sign in</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}