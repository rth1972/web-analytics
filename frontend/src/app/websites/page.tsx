'use client';

import { useState, useEffect } from 'react';
import { Globe, Trash2, Copy, Check, Plus, X } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3456';

interface Website {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  isActive: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function SnippetModal({ website, onClose }: { website: Website; onClose: () => void }) {
  const snippet = `<script
  src="${API_URL}/tracker.js"
  data-website-id="${website.id}"
  data-api-url="${API_URL}"
  defer
></script>`;

  const jsSnippet = `// Track a custom event
analytics.track('button_click', { label: 'Sign Up' });`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tracking Snippet — {website.name}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-[var(--muted)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-3 text-sm text-[var(--muted-foreground)]">
          Add this snippet to the <code className="rounded bg-[var(--muted)] px-1 py-0.5 text-xs">&lt;head&gt;</code> of every page you want to track.
        </p>

        <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--background)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">HTML</span>
            <CopyButton text={snippet} />
          </div>
          <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-[var(--foreground)]">
            <code>{snippet}</code>
          </pre>
        </div>

        <p className="mb-3 text-sm text-[var(--muted-foreground)]">Track custom events with:</p>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">JavaScript</span>
            <CopyButton text={jsSnippet} />
          </div>
          <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-[var(--foreground)]">
            <code>{jsSnippet}</code>
          </pre>
        </div>

        <div className="mt-4 rounded-lg bg-[var(--muted)] p-3">
          <p className="text-xs text-[var(--muted-foreground)]">
            <strong className="text-[var(--foreground)]">Website ID:</strong>{' '}
            <code className="font-mono">{website.id}</code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WebsitesPage() {
  const [websites, setWebsites]     = useState<Website[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [name, setName]             = useState('');
  const [domain, setDomain]         = useState('');
  const [adding, setAdding]         = useState(false);
  const [error, setError]           = useState('');
  const [snippetFor, setSnippetFor] = useState<Website | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`${API_URL}/api/websites`)
      .then(r => r.json())
      .then(setWebsites)
      .catch(() => setWebsites([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim() || !domain.trim()) {
      setError('Name and domain are required.');
      return;
    }
    setAdding(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/websites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), domain: domain.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to create');
      }
      setName('');
      setDomain('');
      setShowAdd(false);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this website and all its data?')) return;
    await fetch(`${API_URL}/api/websites/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Websites</h1>
          <p className="text-[var(--muted-foreground)]">Manage the sites you track</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setError(''); }}
          className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Add Website
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-base font-semibold">New Website</h2>
          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Name (e.g. My Blog)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 min-w-[160px] rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            />
            <input
              type="text"
              placeholder="Domain (e.g. myblog.com)"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              className="flex-1 min-w-[160px] rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              onKeyDown={e => e.key === 'Enter' && add()}
            />
            <button
              onClick={add}
              disabled={adding}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {adding ? 'Adding…' : 'Add'}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Website list */}
      {loading ? (
        <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
      ) : websites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
          <Globe className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
          <p className="font-medium">No websites yet</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Add your first website to start tracking.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {websites.map(w => (
            <div
              key={w.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/10">
                  <Globe className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <div>
                  <div className="font-semibold">{w.name}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">{w.domain}</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  w.isActive ? 'bg-green-500/15 text-green-400' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                }`}>
                  {w.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/?site=${w.id}`}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--muted)] transition-colors"
                >
                  View Stats
                </a>
                <button
                  onClick={() => setSnippetFor(w)}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--muted)] transition-colors"
                >
                  Get Snippet
                </button>
                <button
                  onClick={() => remove(w.id)}
                  className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {snippetFor && (
        <SnippetModal website={snippetFor} onClose={() => setSnippetFor(null)} />
      )}
    </div>
  );
}
