'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Activity, Plus, Trash2, CheckCircle, XCircle, Clock, Pause, Play } from 'lucide-react';

interface Website { id: string; name: string; domain: string }
interface UptimeResult { status: 'UP' | 'DOWN'; responseTime: number | null; checkedAt: string }
interface UptimeCheck {
  id: string; url: string; intervalMins: number; enabled: boolean;
  lastStatus: 'UP' | 'DOWN' | 'UNKNOWN'; lastCheckedAt: string | null;
  uptimePct: number | null; avgResponseTime: number | null;
  results: UptimeResult[];
}

function StatusBadge({ status }: { status: 'UP' | 'DOWN' | 'UNKNOWN' }) {
  if (status === 'UP') return <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium"><CheckCircle className="h-4 w-4" /> Up</span>;
  if (status === 'DOWN') return <span className="flex items-center gap-1.5 text-red-400 text-sm font-medium"><XCircle className="h-4 w-4" /> Down</span>;
  return <span className="flex items-center gap-1.5 text-[var(--muted-foreground)] text-sm font-medium"><Clock className="h-4 w-4" /> Unknown</span>;
}

export default function UptimePage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selected, setSelected] = useState('');
  const [checks, setChecks] = useState<UptimeCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState('');
  const [intervalValue, setIntervalValue] = useState('5');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/api/websites').then(r => r.json()).then((ws: Website[]) => {
      setWebsites(ws);
      if (ws.length > 0) setSelected(ws[0].id);
      setLoading(false);
    });
  }, []);

  const fetchChecks = useCallback(async () => {
    if (!selected) return;
    const res = await api.get(`/api/uptime/${selected}`);
    setChecks(await res.json());
  }, [selected]);

  useEffect(() => { fetchChecks(); }, [fetchChecks]);

  useEffect(() => {
    const intervalId = setInterval(function() { fetchChecks(); }, 30000);
    return () => clearInterval(intervalId);
  }, [fetchChecks]);

  function flash(message: string, isError = false) {
    if (isError) setErr(message); else setMsg(message);
    setTimeout(() => { setMsg(''); setErr(''); }, 3000);
  }

  async function createCheck() {
    if (!url) return flash('URL is required', true);
    const res = await api.post(`/api/uptime/${selected}`, { url, intervalMins: Number(intervalValue) });
    if (res.ok) { flash('Monitor added!'); setShowForm(false); setUrl(''); fetchChecks(); }
    else flash((await res.json()).error, true);
  }

  async function toggleCheck(checkId: string) {
    await api.patch(`/api/uptime/${selected}/${checkId}/toggle`, {});
    fetchChecks();
  }

  async function deleteCheck(checkId: string) {
    if (!confirm('Delete this uptime monitor?')) return;
    await api.delete(`/api/uptime/${selected}/${checkId}`);
    fetchChecks();
  }

  if (loading) return <div className="flex h-full items-center justify-center text-[var(--muted-foreground)]">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Uptime Monitoring</h1>
          <p className="text-[var(--muted-foreground)]">Track availability and response times of your URLs</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm">
            {websites.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            <Plus className="h-4 w-4" /> Add Monitor
          </button>
        </div>
      </div>

      {msg && <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">{msg}</div>}
      {err && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{err}</div>}

      {showForm && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
          <h2 className="font-semibold">New Monitor</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">URL to monitor</label>
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://yourdomain.com"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Check interval</label>
              <select value={intervalValue} onChange={e => setIntervalValue(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                <option value="1">Every 1 minute</option>
                <option value="5">Every 5 minutes</option>
                <option value="10">Every 10 minutes</option>
                <option value="30">Every 30 minutes</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={createCheck}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Add Monitor
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--muted)]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {checks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] py-16 gap-3">
          <Activity className="h-10 w-10 text-[var(--muted-foreground)]" />
          <p className="text-[var(--muted-foreground)]">No monitors yet. Add your first URL to start monitoring.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {checks.map(check => (
            <div key={check.id} className={`rounded-xl border bg-[var(--card)] p-6 ${
              check.lastStatus === 'DOWN' ? 'border-red-500/40' :
              check.lastStatus === 'UP'   ? 'border-green-500/20' :
              'border-[var(--border)]'
            }`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={check.lastStatus} />
                    <code className="text-sm font-medium">{check.url}</code>
                    {!check.enabled && (
                      <span className="rounded px-1.5 py-0.5 text-xs bg-[var(--muted)] text-[var(--muted-foreground)]">Paused</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-[var(--muted-foreground)]">
                    <span>Every {check.intervalMins}min</span>
                    {check.uptimePct !== null && <span>Uptime: <strong className="text-[var(--foreground)]">{check.uptimePct}%</strong></span>}
                    {check.avgResponseTime !== null && <span>Avg response: <strong className="text-[var(--foreground)]">{check.avgResponseTime}ms</strong></span>}
                    {check.lastCheckedAt && <span>Last checked: {new Date(check.lastCheckedAt).toLocaleTimeString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleCheck(check.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--muted)]">
                    {check.enabled ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Resume</>}
                  </button>
                  <button onClick={() => deleteCheck(check.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>

              {check.results.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-[var(--muted-foreground)] mb-2">Last {check.results.length} checks</div>
                  <div className="flex items-end gap-0.5 h-8">
                    {[...check.results].reverse().map((r, i) => (
                      <div key={i}
                        title={`${r.status} - ${r.responseTime ? r.responseTime + 'ms' : 'no response'} at ${new Date(r.checkedAt).toLocaleTimeString()}`}
                        className={`flex-1 rounded-sm min-h-[4px] ${r.status === 'UP' ? 'bg-green-400' : 'bg-red-400'}`}
                        style={{ height: r.responseTime ? `${Math.min(100, (r.responseTime / 2000) * 100)}%` : '100%' }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
