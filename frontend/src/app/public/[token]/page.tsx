'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3456';

interface Stats {
  pageViews: number;
  uniqueVisitors: number;
  events: number;
  bounceRate: number;
  pageViewsByDay: { date: string; views: number }[];
}

interface Website { name: string; domain: string }

export default function PublicDashboard() {
  const { token } = useParams();
  const [website, setWebsite] = useState<Website | null>(null);
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [period,  setPeriod]  = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    setLoading(true);
    // Fetch directly from backend — this page is public, no auth needed
    fetch(`${API_URL}/api/public/${token}?period=${period}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else { setWebsite(data.website); setStats(data.stats); }
        setLoading(false);
      })
      .catch(() => { setError('Failed to load dashboard'); setLoading(false); });
  }, [token, period]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-[var(--muted-foreground)]">Loading…</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-red-400">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{website?.name}</h1>
            <p className="text-[var(--muted-foreground)]">{website?.domain} — Public Dashboard</p>
          </div>
          <div className="flex gap-2">
            {(['24h', '7d', '30d'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === p ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Page Views',      value: stats?.pageViews ?? 0 },
            { label: 'Unique Visitors', value: stats?.uniqueVisitors ?? 0 },
            { label: 'Bounce Rate',     value: `${stats?.bounceRate ?? 0}%` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
              <div className="text-sm text-[var(--muted-foreground)]">{label}</div>
              <div className="mt-2 text-3xl font-bold">{value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-6 text-lg font-semibold">Page Views Over Time</h2>
          <div className="h-72">
            {(stats?.pageViewsByDay?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats!.pageViewsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="views" stroke="var(--primary)" strokeWidth={2}
                    dot={{ fill: 'var(--primary)', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
                No data for this period.
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[var(--muted-foreground)]">
          Powered by <span className="text-[var(--primary)] font-medium">Viewly</span>
        </p>
      </div>
    </div>
  );
}
