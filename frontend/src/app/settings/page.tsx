'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Me {
  id: string;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
}

export default function SettingsPage() {
  const [me, setMe]               = useState<Me | null>(null);
  const [qrCode, setQrCode]       = useState('');
  const [secret, setSecret]       = useState('');
  const [totpCode, setTotpCode]   = useState('');
  const [disablePw, setDisablePw] = useState('');
  const [msg, setMsg]             = useState('');
  const [err, setErr]             = useState('');
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    api.get('/api/auth/me').then(r => r.json()).then(setMe);
  }, []);

  function flash(message: string, isError = false) {
    if (isError) setErr(message); else setMsg(message);
    setTimeout(() => { setMsg(''); setErr(''); }, 4000);
  }

  async function setup2FA() {
    setLoading(true);
    const res = await api.post('/api/auth/2fa/setup', {});
    const data = await res.json();
    if (res.ok) { setQrCode(data.qrCode); setSecret(data.secret); }
    else flash(data.error, true);
    setLoading(false);
  }

  async function confirm2FA() {
    setLoading(true);
    const res = await api.post('/api/auth/2fa/confirm', { code: totpCode });
    const data = await res.json();
    if (res.ok) {
      flash('2FA enabled successfully!');
      setQrCode(''); setSecret(''); setTotpCode('');
      setMe(m => m ? { ...m, twoFactorEnabled: true } : m);
    } else {
      flash(data.error, true);
    }
    setLoading(false);
  }

  async function disable2FA() {
    setLoading(true);
    const res = await api.post('/api/auth/2fa/disable', { password: disablePw });
    const data = await res.json();
    if (res.ok) {
      flash('2FA disabled.');
      setDisablePw('');
      setMe(m => m ? { ...m, twoFactorEnabled: false } : m);
    } else {
      flash(data.error, true);
    }
    setLoading(false);
  }

  function logout() {
    document.cookie = 'auth-token=; path=/; max-age=0';
    window.location.href = '/login';
  }

  if (!me) return (
    <div className="flex h-full items-center justify-center">
      <div className="text-[var(--muted-foreground)]">Loading…</div>
    </div>
  );

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-[var(--muted-foreground)]">Manage your account and security</p>
      </div>

      {msg && <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">{msg}</div>}
      {err && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{err}</div>}

      {/* Account info */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3">
        <h2 className="font-semibold text-lg">Account</h2>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted-foreground)]">Email</span>
          <span className="font-medium">{me.email}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted-foreground)]">Role</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${me.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
            {me.role}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted-foreground)]">Email verified</span>
          <span className={me.emailVerified ? 'text-green-400' : 'text-red-400'}>
            {me.emailVerified ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {/* 2FA */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Two-Factor Authentication</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {me.twoFactorEnabled ? 'Enabled — your account is protected.' : 'Add an extra layer of security to your account.'}
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${me.twoFactorEnabled ? 'bg-green-500/10 text-green-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
            {me.twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {!me.twoFactorEnabled && !qrCode && (
          <button onClick={setup2FA} disabled={loading}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-50">
            Set up 2FA
          </button>
        )}

        {qrCode && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="2FA QR Code" className="rounded-xl border border-[var(--border)]" />
            <div className="rounded-lg bg-[var(--muted)] p-3">
              <p className="text-xs text-[var(--muted-foreground)] mb-1">Or enter this key manually:</p>
              <code className="text-xs font-mono break-all">{secret}</code>
            </div>
            <div className="flex gap-3">
              <input
                type="text" maxLength={6} inputMode="numeric"
                value={totpCode} onChange={e => setTotpCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="flex-1 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <button onClick={confirm2FA} disabled={loading || totpCode.length !== 6}
                className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
                Verify & Enable
              </button>
            </div>
          </div>
        )}

        {me.twoFactorEnabled && (
          <div className="space-y-3 border-t border-[var(--border)] pt-4">
            <p className="text-sm text-[var(--muted-foreground)]">Enter your password to disable 2FA:</p>
            <div className="flex gap-3">
              <input
                type="password"
                value={disablePw} onChange={e => setDisablePw(e.target.value)}
                placeholder="Your password"
                className="flex-1 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <button onClick={disable2FA} disabled={loading || !disablePw}
                className="px-4 py-2 rounded-xl border border-red-500/50 text-red-400 text-sm font-medium hover:bg-red-500/10 disabled:opacity-50">
                Disable
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-semibold text-lg mb-1">Sign out</h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">Sign out of your account on this device.</p>
        <button onClick={logout}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--muted)] transition-colors">
          Sign out
        </button>
      </div>
    </div>
  );
}
