'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3456';

interface Stats {
  pageViews: number;
  uniqueVisitors: number;
  events: number;
  bounceRate: number;
  avgDuration: number;
  pageViewsByDay: { date: string; views: number }[];
}

interface TopPage    { page: string; views: number }
interface Referrer   { referrer: string; visits: number }
interface DeviceRow  { device: string; count: number }
interface BrowserRow { browser: string; count: number }
interface CountryRow { country: string; visitors: number }

interface Website {
  id: string;
  name: string;
  domain: string;
}

const countryFlag = (code: string) => {
  if (!code || code === 'Unknown') return '🌐';
  return code
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0)))
    .join('');
};

const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
};

const fmtDuration = (s: number) => {
  if (s < 60)  return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
};

function StatCard({ label, value, sub, subColor = 'text-green-500' }: {
  label: string; value: string; sub?: string; subColor?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="text-sm text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      {sub && <div className={`mt-2 text-sm ${subColor}`}>{sub}</div>}
    </div>
  );
}

function BreakdownTable<T>({ title, rows, keyCol, valCol, valLabel }: {
  title: string;
  rows: T[];
  keyCol: keyof T;
  valCol: keyof T;
  valLabel?: string;
}) {
  if (!rows.length) return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <p className="text-sm text-[var(--muted-foreground)]">No data for this period.</p>
    </div>
  );
  const total = rows.reduce((s, r) => s + Number(r[valCol]), 0);
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="space-y-3">
        {rows.map((row, i) => {
          const pct = total > 0 ? Math.round((Number(row[valCol]) / total) * 100) : 0;
          return (
            <div key={i}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-5 text-[var(--muted-foreground)]">{i + 1}</span>
                  <span className="max-w-[180px] truncate font-medium">{String(row[keyCol])}</span>
                </div>
                <span className="text-[var(--muted-foreground)]">
                  {fmt(Number(row[valCol]))} <span className="text-xs">({pct}%)</span>
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-[var(--muted)]">
                <div
                  className="h-1 rounded-full bg-[var(--primary)]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats]               = useState<Stats | null>(null);
  const [websites, setWebsites]         = useState<Website[]>([]);
  const [selectedWebsite, setSelected]  = useState('');
  const [period, setPeriod]             = useState('7d');
  const [loading, setLoading]           = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  const [topPages,   setTopPages]   = useState<TopPage[]>([]);
  const [referrers,  setReferrers]  = useState<Referrer[]>([]);
  const [devices,    setDevices]    = useState<DeviceRow[]>([]);
  const [browsers,   setBrowsers]   = useState<BrowserRow[]>([]);
  const [countries,  setCountries]  = useState<CountryRow[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/websites`)
      .then(r => r.json())
      .then((data: Website[]) => {
        setWebsites(data);
        if (data.length > 0) setSelected(data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchAll = useCallback(async () => {
    if (!selectedWebsite) return;
    setStatsLoading(true);
    const q = `?period=${period}`;
    const base = `${API_URL}/api/dashboard/${selectedWebsite}`;

    const [s, p, r, d, b, c] = await Promise.allSettled([
      fetch(`${base}/stats${q}`).then(x => x.json()),
      fetch(`${base}/pages${q}`).then(x => x.json()),
      fetch(`${base}/referrers${q}`).then(x => x.json()),
      fetch(`${base}/devices${q}`).then(x => x.json()),
      fetch(`${base}/browsers${q}`).then(x => x.json()),
      fetch(`${base}/countries${q}`).then(x => x.json()),
    ]);

    if (s.status === 'fulfilled') setStats(s.value);
    if (p.status === 'fulfilled') setTopPages(p.value);
    if (r.status === 'fulfilled') setReferrers(r.value);
    if (d.status === 'fulfilled') setDevices(d.value);
    if (b.status === 'fulfilled') setBrowsers(b.value);
    if (c.status === 'fulfilled') setCountries(c.value);
    setStatsLoading(false);
  }, [selectedWebsite, period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="text-[var(--muted-foreground)]">Loading…</div>
    </div>
  );

  if (websites.length === 0) return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <p className="text-[var(--muted-foreground)]">No websites added yet.</p>
      <a
        href="/websites"
        className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Add your first website →
      </a>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-[var(--muted-foreground)]">Overview of your website analytics</p>
        </div>
        <div className="flex items-center gap-3">
          {statsLoading && (
            <span className="text-xs text-[var(--muted-foreground)]">Refreshing…</span>
          )}
          <select
            value={selectedWebsite}
            onChange={e => setSelected(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
          >
            {websites.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
            {(['24h', '7d', '30d'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1 text-sm transition-colors ${
                  period === p
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Page Views"       value={fmt(stats?.pageViews      ?? 0)} />
        <StatCard label="Unique Visitors"  value={fmt(stats?.uniqueVisitors ?? 0)} />
        <StatCard label="Events"           value={fmt(stats?.events         ?? 0)} />
        <StatCard
          label="Bounce Rate"
          value={`${stats?.bounceRate ?? 0}%`}
          sub={stats ? (stats.bounceRate < 50 ? 'Good' : stats.bounceRate < 70 ? 'Average' : 'High') : undefined}
          subColor={stats ? (stats.bounceRate < 50 ? 'text-green-500' : stats.bounceRate < 70 ? 'text-yellow-500' : 'text-red-500') : ''}
        />
        <StatCard
          label="Avg. Session"
          value={fmtDuration(stats?.avgDuration ?? 0)}
          sub="duration"
          subColor="text-[var(--muted-foreground)]"
        />
      </div>

      {/* Traffic chart */}
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
                <Line type="monotone" dataKey="views" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--primary)', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
              No data for this period.
            </div>
          )}
        </div>
      </div>

      {/* Top pages + Referrers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownTable title="Top Pages"       rows={topPages}  keyCol="page"     valCol="views"   />
        <BreakdownTable title="Traffic Sources" rows={referrers} keyCol="referrer" valCol="visits"  />
      </div>

      {/* Devices + Browsers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-6 text-lg font-semibold">Devices</h2>
          {devices.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={devices} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis dataKey="device" type="category" stroke="var(--muted-foreground)" fontSize={12} width={70} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">No data for this period.</p>
          )}
        </div>

        <BreakdownTable title="Browsers" rows={browsers} keyCol="browser" valCol="count" />
      </div>

      {/* Countries */}
      {/* Countries */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold">Countries</h2>
        {countries.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No data for this period.</p>
        ) : (
          <div className="space-y-3">
            {(() => {
              const total = countries.reduce((s, r) => s + r.visitors, 0);
              return countries.map((row, i) => {
                const pct = total > 0 ? Math.round((row.visitors / total) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-[var(--muted-foreground)]">{i + 1}</span>
                        <span className="text-base leading-none">{countryFlag(row.country)}</span>
                        <span className="font-medium">{row.country || 'Unknown'}</span>
                      </div>
                      <span className="text-[var(--muted-foreground)]">
                        {fmt(row.visitors)} <span className="text-xs">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-[var(--muted)]">
                      <div className="h-1 rounded-full bg-[var(--primary)]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
