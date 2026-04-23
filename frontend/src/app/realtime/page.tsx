'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity, Users, Eye, Zap } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3456';

interface RealtimeData {
  activeVisitors: number;
  recentPageViews: {
    page: string;
    country: string | null;
    device: string | null;
    browser: string | null;
    timestamp: string;
    sessionId: string;
  }[];
  recentEvents: {
    name: string;
    category: string | null;
    timestamp: string;
  }[];
  topPages: {
    page: string;
    count: number;
  }[];
}

interface Website {
  id: string;
  name: string;
  domain: string;
}

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 5)  return 'just now';
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

export default function RealtimePage() {
  const [websites, setWebsites]           = useState<Website[]>([]);
  const [selectedWebsite, setSelected]    = useState('');
  const [data, setData]                   = useState<RealtimeData | null>(null);
  const [loading, setLoading]             = useState(true);
  const [lastUpdated, setLastUpdated]     = useState<Date | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/websites`)
      .then(r => r.json())
      .then((ws: Website[]) => {
        setWebsites(ws);
        if (ws.length > 0) setSelected(ws[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchRealtime = useCallback(async () => {
    if (!selectedWebsite) return;
    try {
      const res = await fetch(`${API_URL}/api/dashboard/${selectedWebsite}/realtime`);
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch {}
  }, [selectedWebsite]);

  useEffect(() => {
    fetchRealtime();
    const interval = setInterval(fetchRealtime, 5000);
    return () => clearInterval(interval);
  }, [fetchRealtime]);

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="text-[var(--muted-foreground)]">Loading…</div>
    </div>
  );

  if (websites.length === 0) return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <p className="text-[var(--muted-foreground)]">No websites added yet.</p>
      <a href="/websites" className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
        Add your first website →
      </a>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Real-time</h1>
          <p className="text-[var(--muted-foreground)]">
            Live activity in the last 5 minutes
            {lastUpdated && (
              <span className="ml-2 text-xs">· updated {timeAgo(lastUpdated.toISOString())}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-green-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            Live
          </span>
          <select
            value={selectedWebsite}
            onChange={e => setSelected(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
          >
            {websites.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Users className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <div className="text-sm text-[var(--muted-foreground)]">Active Visitors</div>
              <div className="text-3xl font-bold">{data?.activeVisitors ?? 0}</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/10">
              <Eye className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <div className="text-sm text-[var(--muted-foreground)]">Page Views (5m)</div>
              <div className="text-3xl font-bold">{data?.recentPageViews.length ?? 0}</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Zap className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-[var(--muted-foreground)]">Events (5m)</div>
              <div className="text-3xl font-bold">{data?.recentEvents.length ?? 0}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Live feed */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--primary)]" />
            <h2 className="text-lg font-semibold">Live Feed</h2>
          </div>
          {!data || data.recentPageViews.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">No activity in the last 5 minutes.</p>
          ) : (
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {data.recentPageViews.map((pv, i) => (
                <div key={i} className="flex items-start justify-between gap-3 rounded-lg bg-[var(--background)] p-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{pv.page}</div>
                    <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
                      {pv.device && <span>{pv.device}</span>}
                      {pv.browser && <span>· {pv.browser}</span>}
                      {pv.country && <span>· {pv.country}</span>}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                    {timeAgo(pv.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Top pages */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="mb-4 text-lg font-semibold">Top Pages (5m)</h2>
            {!data || data.topPages.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {data.topPages.map((p, i) => {
                  const max = data.topPages[0].count;
                  const pct = Math.round((p.count / max) * 100);
                  return (
                    <div key={i}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="max-w-[200px] truncate font-medium">{p.page}</span>
                        <span className="text-[var(--muted-foreground)]">{p.count}</span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-[var(--muted)]">
                        <div className="h-1 rounded-full bg-[var(--primary)]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent events */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="mb-4 text-lg font-semibold">Recent Events</h2>
            {!data || data.recentEvents.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No events in the last 5 minutes.</p>
            ) : (
              <div className="space-y-2">
                {data.recentEvents.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-[var(--background)] px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-purple-400" />
                      <span className="font-medium">{ev.name}</span>
                      {ev.category && <span className="text-xs text-[var(--muted-foreground)]">· {ev.category}</span>}
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">{timeAgo(ev.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
