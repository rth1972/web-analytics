'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Globe, ArrowLeft, MapPin, Clock } from 'lucide-react';
import { api } from '@/lib/api';

interface VisitorIp {
  ipAddress: string;
  country: string | null;
  city: string | null;
  count: number;
}

const countryFlag = (code: string) => {
  if (!code || code === 'Unknown') return '🌐';
  return code.toUpperCase().split('').map(c => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0))).join('');
};

function timeAgo(ts: string) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function VisitorIPsContent() {
  const searchParams  = useSearchParams();
  const websiteId     = searchParams.get('websiteId');
  const country       = searchParams.get('country');
  const period        = searchParams.get('period') ?? '7d';

  const [visitors, setVisitors] = useState<VisitorIp[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (!websiteId) { setError('No website selected.'); setLoading(false); return; }
    setLoading(true);
    setError('');

    const params = new URLSearchParams({ period });
    if (country && country !== 'all') params.set('country', country);

    api.get(`/api/analytics/data/${websiteId}/ips?${params}`)
      .then(r => { if (!r.ok) throw new Error(`Server error: ${r.status}`); return r.json(); })
      .then((data: VisitorIp[]) => setVisitors(data))
      .catch(e => setError(e.message ?? 'Failed to load visitor IPs.'))
      .finally(() => setLoading(false));
  }, [websiteId, country, period]);

  const backHref    = websiteId ? `/?websiteId=${websiteId}&period=${period}` : '/';
  const countryLabel = !country || country === 'all' ? 'All Countries' : country;

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="text-[var(--muted-foreground)]">Loading visitor IPs…</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href={backHref} className="rounded-lg p-2 hover:bg-[var(--muted)] transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div>
          <h1 className="text-2xl font-bold">Visitor IPs</h1>
          <p className="text-[var(--muted-foreground)]">
            {countryFlag(country ?? '')} {countryLabel}
            <span className="ml-2 text-xs">· {period}</span>
          </p>
        </div>
        {visitors.length > 0 && (
          <span className="ml-auto rounded-full bg-[var(--muted)] px-3 py-1 text-sm text-[var(--muted-foreground)]">
            {visitors.length} unique IP{visitors.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      )}

      {!error && visitors.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] py-16 text-center text-[var(--muted-foreground)]">
          <Globe className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p className="font-medium">No visitors found</p>
          <p className="mt-1 text-sm">Try a different country or time period.</p>
        </div>
      )}

      {visitors.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">#</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">IP Address</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Location</th>
                <th className="px-4 py-3 text-right font-medium text-[var(--muted-foreground)]">Visits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
              {visitors.map((visitor, i) => (
                <tr key={visitor.ipAddress} className="hover:bg-[var(--muted)]/30 transition-colors">
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--muted)]">
                        <Globe className="h-4 w-4 text-[var(--muted-foreground)]" />
                      </div>
                      <span className="font-mono font-medium">{visitor.ipAddress}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {visitor.country && <span>{countryFlag(visitor.country)} {visitor.country}</span>}
                      {visitor.city    && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{visitor.city}</span>}
                      {!visitor.country && !visitor.city && <span>Unknown</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="flex items-center justify-end gap-1.5 text-[var(--muted-foreground)]">
                      <Clock className="h-3.5 w-3.5" />
                      {visitor.count}
                    </span>
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

export default function VisitorIPsPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-[var(--muted-foreground)]">Loading…</div>}>
      <VisitorIPsContent />
    </Suspense>
  );
}
