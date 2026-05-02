'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Bell, Plus, Trash2, Pause, Play } from 'lucide-react';

interface Website { id: string; name: string; domain: string }
interface Alert {
  id: string; name: string; type: string; condition: string;
  threshold: number; windowHours: number; enabled: boolean;
  webhookUrl: string | null; lastFiredAt: string | null; createdAt: string;
}

const ALERT_TYPES = [
  { value: 'TRAFFIC_SPIKE', label: 'Traffic Spike' },
  { value: 'TRAFFIC_DROP',  label: 'Traffic Drop' },
  { value: 'UPTIME_DOWN',   label: 'Site Down' },
  { value: 'UPTIME_UP',     label: 'Site Recovered' },
  { value: 'GOAL_REACHED',  label: 'Goal Reached' },
];

export default function AlertsPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selected, setSelected] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('TRAFFIC_SPIKE');
  const [condition, setCondition] = useState('ABOVE');
  const [threshold, setThreshold] = useState('100');
  const [window, setWindow] = useState('1');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/api/websites').then(r => r.json()).then((ws: Website[]) => {
      setWebsites(ws);
      if (ws.length > 0) setSelected(ws[0].id);
      setLoading(false);
    });
  }, []);

  const fetchAlerts = useCallback(async () => {
    if (!selected) return;
    const res = await api.get(`/api/alerts/${selected}`);
    setAlerts(await res.json());
  }, [selected]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  function flash(m: string, isError = false) {
    if (isError) setErr(m); else setMsg(m);
    setTimeout(() => { setMsg(''); setErr(''); }, 3000);
  }

  async function createAlert() {
    if (!name) return flash('Name is required', true);
    const res = await api.post(`/api/alerts/${selected}`, {
      name, type, condition, threshold, windowHours: window, webhookUrl: webhookUrl || undefined,
    });
    if (res.ok) { flash('Alert created!'); setShowForm(false); setName(''); fetchAlerts(); }
    else flash((await res.json()).error, true);
  }

  async function toggle(alertId: string) {
    await api.patch(`/api/alerts/${selected}/${alertId}/toggle`, {});
    fetchAlerts();
  }

  async function deleteAlert(alertId: string) {
    if (!confirm('Delete this alert?')) return;
    await api.delete(`/api/alerts/${selected}/${alertId}`);
    fetchAlerts();
    flash('Alert deleted.');
  }

  if (loading) return <div className="flex h-full items-center justify-center text-[var(--muted-foreground)]">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-[var(--muted-foreground)]">Get notified when traffic spikes, drops, or your site goes down</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm">
            {websites.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            <Plus className="h-4 w-4" /> New Alert
          </button>
        </div>
      </div>

      {msg && <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">{msg}</div>}
      {err && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{err}</div>}

      {showForm && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
          <h2 className="font-semibold">New Alert</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Alert Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Traffic Spike Alert"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                {ALERT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Condition</label>
              <select value={condition} onChange={e => setCondition(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                <option value="ABOVE">Above threshold</option>
                <option value="BELOW">Below threshold</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Threshold (visitors)</label>
              <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} min="1"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Time window (hours)</label>
              <input type="number" value={window} onChange={e => setWindow(e.target.value)} min="1" max="24"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Webhook URL (optional)</label>
              <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://hooks.slack.com/..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={createAlert}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Create Alert
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--muted)]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] py-16 gap-3">
          <Bell className="h-10 w-10 text-[var(--muted-foreground)]" />
          <p className="text-[var(--muted-foreground)]">No alerts configured. Add one to get notified automatically.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Alert</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Condition</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Last fired</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Status</th>
                <th className="px-4 py-3 text-right font-medium text-[var(--muted-foreground)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
              {alerts.map(a => (
                <tr key={a.id} className="hover:bg-[var(--muted)]/20">
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      {ALERT_TYPES.find(t => t.value === a.type)?.label}
                      {a.webhookUrl && ' · Webhook'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    {a.condition.toLowerCase()} {a.threshold} visitors / {a.windowHours}h
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    {a.lastFiredAt ? new Date(a.lastFiredAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.enabled ? 'bg-green-500/10 text-green-400' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
                      {a.enabled ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => toggle(a.id)}
                        className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--muted)]">
                        {a.enabled ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Resume</>}
                      </button>
                      <button onClick={() => deleteAlert(a.id)}
                        className="flex items-center gap-1 rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
