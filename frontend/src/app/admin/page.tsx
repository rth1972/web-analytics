'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  approved: boolean;
  createdAt: string;
  _count: { websites: number };
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminPage() {
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState('');
  const [err,     setErr]     = useState('');

  const fetchUsers = useCallback(async () => {
    const res = await api.get('/api/admin');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function flash(message: string, isError = false) {
    if (isError) setErr(message); else setMsg(message);
    setTimeout(() => { setMsg(''); setErr(''); }, 3000);
  }

  async function approve(id: string) {
    const res = await api.post(`/api/admin/${id}/approve`, {});
    if (res.ok) { flash('User approved and notified by email.'); fetchUsers(); }
    else flash((await res.json()).error, true);
  }

  async function revoke(id: string) {
    const res = await api.post(`/api/admin/${id}/revoke`, {});
    if (res.ok) { flash('Access revoked.'); fetchUsers(); }
    else flash((await res.json()).error, true);
  }

  async function changeRole(id: string, role: 'ADMIN' | 'USER') {
    const res = await api.post(`/api/admin/${id}/role`, { role });
    if (res.ok) { flash(`Role updated to ${role}.`); fetchUsers(); }
    else flash((await res.json()).error, true);
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`Delete user ${email}? This will also delete all their websites and data.`)) return;
    const res = await api.delete(`/api/admin/${id}`);
    if (res.ok) { flash('User deleted.'); fetchUsers(); }
    else flash((await res.json()).error, true);
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="text-[var(--muted-foreground)]">Loading…</div>
    </div>
  );

  const pending  = users.filter(u => !u.approved);
  const approved = users.filter(u => u.approved);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin — Users</h1>
        <p className="text-[var(--muted-foreground)]">{users.length} total users</p>
      </div>

      {msg && <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">{msg}</div>}
      {err && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{err}</div>}

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-4">
          <h2 className="font-semibold text-amber-400">Pending Approval ({pending.length})</h2>
          {pending.map(u => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-[var(--card)] border border-[var(--border)] p-4">
              <div>
                <div className="font-medium text-sm">{u.email}</div>
                <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Registered {fmt(u.createdAt)} ·{' '}
                  {u.emailVerified ? <span className="text-green-400">Email verified</span> : <span className="text-red-400">Email not verified</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approve(u.id)}
                  className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 text-xs font-medium hover:bg-green-500/20">
                  Approve
                </button>
                <button onClick={() => deleteUser(u.id, u.email)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-medium hover:bg-red-500/20">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All users table */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
              <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">User</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Status</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Sites</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Joined</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--muted-foreground)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
            {approved.map(u => (
              <tr key={u.id} className="hover:bg-[var(--muted)]/20">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.email}</div>
                  <div className="flex gap-1.5 mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${u.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {u.role}
                    </span>
                    {u.twoFactorEnabled && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400">2FA</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs ${u.emailVerified ? 'text-green-400' : 'text-red-400'}`}>
                      {u.emailVerified ? '✓ Email verified' : '✗ Email not verified'}
                    </span>
                    <span className="text-xs text-green-400">✓ Approved</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{u._count.websites}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{fmt(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <select
                      value={u.role}
                      onChange={e => changeRole(u.id, e.target.value as 'ADMIN' | 'USER')}
                      className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button onClick={() => revoke(u.id)}
                      className="px-2 py-1 rounded-lg border border-amber-500/30 text-amber-400 text-xs hover:bg-amber-500/10">
                      Revoke
                    </button>
                    <button onClick={() => deleteUser(u.id, u.email)}
                      className="px-2 py-1 rounded-lg border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
