'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Key, Plus, Trash2, Copy, Check, AlertTriangle } from 'lucide-react';

interface ApiKey {
  id: string; name: string; keyPrefix: string;
  lastUsedAt: string | null; expiresAt: string | null; createdAt: string;
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ApiKeysPage() {
  const [keys,      setKeys]      = useState<ApiKey[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [name,      setName]      = useState('');
  const [newKey,    setNewKey]    = useState('');
  const [copied,    setCopied]    = useState(false);
  const [msg,       setMsg]       = useState('');
  const [err,       setErr]       = useState('');

  const fetchKeys = async () => {
    const res = await api.get('/api/keys');
    setKeys(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchKeys(); }, []);

  function flash(m: string, isErr = false) {
    if (isErr) setErr(m); else setMsg(m);
    setTimeout(() => { setMsg(''); setErr(''); }, 4000);
  }

  async function createKey() {
    if (!name) return flash('Name is required', true);
    const res  = await api.post('/api/keys', { name });
    const data = await res.json();
    if (res.ok) {
      setNewKey(data.key);
      setShowForm(false);
      setName('');
      fetchKeys();
    } else {
      flash(data.error, true);
    }
  }

  async function revokeKey(id: string) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    await api.delete(`/api/keys/${id}`);
    fetchKeys();
    flash('API key revoked.');
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <div className="flex h-full items-center justify-center text-[var(--muted-foreground)]">Loading…</div>;

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-[var(--muted-foreground)]">Programmatic access to your analytics data</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          <Plus className="h-4 w-4" /> New Key
        </button>
      </div>

      {msg && <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">{msg}</div>}
      {err && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{err}</div>}

      {/* Newly created key — show once */}
      {newKey && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-semibold text-sm">Copy your API key now — it won't be shown again</span>
          </div>
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded-lg bg-[var(--background)] px-4 py-2.5 text-sm font-mono break-all">
              {newKey}
            </code>
            <button onClick={() => copy(newKey)}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--muted)]">
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button onClick={() => setNewKey('')} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            I've saved it — dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
          <h2 className="font-semibold">New API Key</h2>
          <div>
            <label className="mb-1 block text-sm font-medium">Key Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Production, Staging, Analytics Script"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
          </div>
          <div className="flex gap-3">
            <button onClick={createKey}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Generate Key
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--muted)]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Keys list */}
      {keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] py-16 gap-3">
          <Key className="h-10 w-10 text-[var(--muted-foreground)]" />
          <p className="text-[var(--muted-foreground)]">No API keys yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Name</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Key</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Last used</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Created</th>
                <th className="px-4 py-3 text-right font-medium text-[var(--muted-foreground)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
              {keys.map(k => (
                <tr key={k.id} className="hover:bg-[var(--muted)]/20">
                  <td className="px-4 py-3 font-medium">{k.name}</td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-[var(--muted)] px-2 py-0.5 text-xs">{k.keyPrefix}</code>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    {k.lastUsedAt ? fmt(k.lastUsedAt) : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{fmt(k.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => revokeKey(k.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 ml-auto">
                      <Trash2 className="h-3 w-3" /> Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Usage docs */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3">
        <h2 className="font-semibold">Using the API</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Pass your API key in the Authorization header:</p>
        <pre className="overflow-x-auto rounded-lg bg-[var(--background)] p-4 text-xs font-mono">
{`curl https://analytics.robintehofstee.com/api/dashboard/{websiteId}/stats \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
        </pre>
      </div>
    </div>
  );
}
