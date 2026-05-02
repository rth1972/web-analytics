'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Target, Plus, Trash2, TrendingUp } from 'lucide-react';

interface Website { id: string; name: string; domain: string }
interface Goal {
  id: string; name: string; type: 'PAGE_VISIT' | 'EVENT'; value: string;
  _count: { conversions: number };
}
interface GoalStats { total: number; conversionRate: number; byDay: { date: string; count: number }[] }

export default function GoalsPage() {
  const [websites,  setWebsites]  = useState<Website[]>([]);
  const [selected,  setSelected]  = useState('');
  const [goals,     setGoals]     = useState<Goal[]>([]);
  const [stats,     setStats]     = useState<Record<string, GoalStats>>({});
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [name,      setName]      = useState('');
  const [type,      setType]      = useState<'PAGE_VISIT' | 'EVENT'>('PAGE_VISIT');
  const [value,     setValue]     = useState('');
  const [msg,       setMsg]       = useState('');
  const [err,       setErr]       = useState('');

  useEffect(() => {
    api.get('/api/websites').then(r => r.json()).then((ws: Website[]) => {
      setWebsites(ws);
      if (ws.length > 0) setSelected(ws[0].id);
      setLoading(false);
    });
  }, []);

  const fetchGoals = useCallback(async () => {
    if (!selected) return;
    const res  = await api.get(`/api/goals/${selected}`);
    const data = await res.json();
    setGoals(data);

    // Fetch stats for each goal
    const statsMap: Record<string, GoalStats> = {};
    await Promise.all(data.map(async (g: Goal) => {
      const r = await api.get(`/api/goals/${selected}/${g.id}/stats?period=30d`);
      statsMap[g.id] = await r.json();
    }));
    setStats(statsMap);
  }, [selected]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  function flash(m: string, isErr = false) {
    if (isErr) setErr(m); else setMsg(m);
    setTimeout(() => { setMsg(''); setErr(''); }, 3000);
  }

  async function createGoal() {
    if (!name || !value) return flash('Name and value are required', true);
    const res = await api.post(`/api/goals/${selected}`, { name, type, value });
    if (res.ok) {
      flash('Goal created!');
      setShowForm(false); setName(''); setValue('');
      fetchGoals();
    } else {
      flash((await res.json()).error, true);
    }
  }

  async function deleteGoal(id: string) {
    if (!confirm('Delete this goal?')) return;
    await api.delete(`/api/goals/${selected}/${id}`);
    fetchGoals();
  }

  if (loading) return <div className="flex h-full items-center justify-center text-[var(--muted-foreground)]">Loading…</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Goals & Conversions</h1>
          <p className="text-[var(--muted-foreground)]">Track specific actions as conversion goals</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm">
            {websites.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            <Plus className="h-4 w-4" /> New Goal
          </button>
        </div>
      </div>

      {msg && <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">{msg}</div>}
      {err && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{err}</div>}

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
          <h2 className="font-semibold">New Goal</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sign Up"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <select value={type} onChange={e => setType(e.target.value as any)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                <option value="PAGE_VISIT">Page Visit</option>
                <option value="EVENT">Event</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                {type === 'PAGE_VISIT' ? 'Page URL (e.g. /thank-you)' : 'Event Name'}
              </label>
              <input value={value} onChange={e => setValue(e.target.value)}
                placeholder={type === 'PAGE_VISIT' ? '/thank-you' : 'signup_complete'}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={createGoal}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Create Goal
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--muted)]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] py-16 gap-3">
          <Target className="h-10 w-10 text-[var(--muted-foreground)]" />
          <p className="text-[var(--muted-foreground)]">No goals yet. Create your first goal to track conversions.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map(goal => {
            const s = stats[goal.id];
            return (
              <div key={goal.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{goal.name}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${goal.type === 'PAGE_VISIT' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                        {goal.type === 'PAGE_VISIT' ? 'Page' : 'Event'}
                      </span>
                      <code className="text-xs text-[var(--muted-foreground)]">{goal.value}</code>
                    </div>
                  </div>
                  <button onClick={() => deleteGoal(goal.id)}
                    className="text-[var(--muted-foreground)] hover:text-red-400 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-[var(--background)] p-3">
                    <div className="text-xs text-[var(--muted-foreground)]">Conversions (30d)</div>
                    <div className="mt-1 text-2xl font-bold">{s?.total ?? '—'}</div>
                  </div>
                  <div className="rounded-lg bg-[var(--background)] p-3">
                    <div className="text-xs text-[var(--muted-foreground)]">Conv. Rate</div>
                    <div className="mt-1 text-2xl font-bold flex items-center gap-1">
                      {s ? `${s.conversionRate}%` : '—'}
                      {s && s.conversionRate > 0 && <TrendingUp className="h-4 w-4 text-green-400" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
