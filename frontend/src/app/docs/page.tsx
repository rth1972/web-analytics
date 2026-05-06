'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Server, Database, Globe, Key, Shield, Code, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-3 rounded-xl border border-[var(--border)] bg-[var(--background)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
        <span className="text-xs text-[var(--muted-foreground)] font-mono">{language}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-[var(--foreground)]"><code>{code}</code></pre>
    </div>
  );
}

function Callout({ type = 'info', children }: { type?: 'info' | 'tip' | 'warning'; children: React.ReactNode }) {
  const styles = {
    info:    'border-blue-500/30 bg-blue-500/5 text-blue-400',
    tip:     'border-green-500/30 bg-green-500/5 text-green-400',
    warning: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
  };
  const labels = { info: 'Note', tip: 'Tip', warning: 'Warning' };
  return (
    <div className={`my-3 rounded-xl border px-4 py-3 text-sm ${styles[type]}`}>
      <span className="font-semibold">{labels[type]}: </span>
      <span className="text-[var(--foreground)] opacity-80">{children}</span>
    </div>
  );
}

function AccordionItem({ title, icon, children, defaultOpen = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 bg-[var(--card)] hover:bg-[var(--muted)]/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="text-[var(--primary)]">{icon}</div>
          <span className="font-semibold text-[var(--foreground)]">{title}</span>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" /> : <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-2 bg-[var(--card)] border-t border-[var(--border)] text-sm text-[var(--foreground)] space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 md:px-8">
      <div className="w-full max-w-4xl space-y-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-2xl font-bold">Documentation</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Complete setup and reference guide for Viewly.</p>
        </div>

        <AccordionItem title="Architecture" icon={<Server className="h-5 w-5" />} defaultOpen>
          <p className="text-[var(--muted-foreground)] mb-3">Two separate apps — a Node.js backend and a Next.js dashboard — sharing the same PostgreSQL database via Prisma.</p>
          <CodeBlock language="text" code={`web-analytics/
├── backend/                  # Node.js + Express + Prisma (port 3456)
│   ├── src/
│   │   ├── routes/           # auth, websites, dashboard, analytics,
│   │   │                     # goals, alerts, uptime, export, apikeys,
│   │   │                     # annotations, admin, public
│   │   ├── middleware/       # JWT auth, rate limiting
│   │   └── services/         # email, uptime monitor, traffic monitor,
│   │                         # report cron, retention cron
│   └── prisma/
│       └── schema.prisma     # PostgreSQL schema
└── frontend/                 # Next.js dashboard (port 3000)
    └── src/
        ├── app/              # pages: dashboard, websites, realtime,
        │                     # goals, uptime, alerts, keys, settings,
        │                     # admin, help, login, register
        ├── lib/              # JWT-aware API client
        └── middleware.ts     # route protection`} />
          <p className="text-[var(--muted-foreground)] mt-3">The backend serves tracker.js, handles all API calls, and manages auth. The dashboard is a separate Next.js app.</p>
        </AccordionItem>

        <AccordionItem title="Requirements" icon={<Shield className="h-5 w-5" />}>
          <ul className="list-disc list-inside space-y-1 text-[var(--muted-foreground)]">
            <li>Node.js 18 or higher</li>
            <li>npm</li>
            <li>PostgreSQL 14 or higher</li>
            <li>A server with a public IP</li>
            <li>A domain name with HTTPS</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Backend Setup" icon={<Server className="h-5 w-5" />}>
          <CodeBlock code={`cd backend
npm install`} />
          <p className="text-[var(--muted-foreground)] mb-2">Create backend/.env:</p>
          <CodeBlock language="env" code={`DATABASE_URL="postgresql://analytics:yourpassword@localhost:5432/analytics"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
PORT="3456"
ALLOW_SIGNUP="false"`} />
          <p className="text-[var(--muted-foreground)] mb-2">Generate a secret:</p>
          <CodeBlock code={`openssl rand -base64 32`} />
          <p className="text-[var(--muted-foreground)] mb-2">Run migrations and start:</p>
          <CodeBlock code={`npx prisma generate
npx prisma db push
npm run dev`} />
        </AccordionItem>

        <AccordionItem title="Environment Variables" icon={<Key className="h-5 w-5" />}>
          <h3 className="font-semibold">backend/.env</h3>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs border border-[var(--border)] rounded-lg overflow-hidden">
              <thead><tr className="bg-[var(--background)]"><th className="text-left p-2 border-b border-[var(--border)]">Variable</th><th className="text-left p-2 border-b border-[var(--border)]">Required</th><th className="text-left p-2 border-b border-[var(--border)]">Description</th></tr></thead>
              <tbody className="text-[var(--muted-foreground)]">
                <tr><td className="p-2 border-b border-[var(--border)] font-mono">DATABASE_URL</td><td className="p-2 border-b border-[var(--border)]">✓</td><td className="p-2 border-b border-[var(--border)]">PostgreSQL connection string</td></tr>
                <tr><td className="p-2 border-b border-[var(--border)] font-mono">NEXTAUTH_SECRET</td><td className="p-2 border-b border-[var(--border)]">✓</td><td className="p-2 border-b border-[var(--border)]">JWT signing secret</td></tr>
                <tr><td className="p-2 border-b border-[var(--border)] font-mono">PORT</td><td className="p-2 border-b border-[var(--border)]">Optional</td><td className="p-2 border-b border-[var(--border)]">Backend port (default: 3456)</td></tr>
                <tr><td className="p-2 border-b border-[var(--border)] font-mono">ALLOW_SIGNUP</td><td className="p-2 border-b border-[var(--border)]">Optional</td><td className="p-2 border-b border-[var(--border)]">Set to true for public registration</td></tr>
              </tbody>
            </table>
          </div>
          <Callout type="warning">NEXTAUTH_SECRET must be identical in both backend and frontend .env files.</Callout>
        </AccordionItem>

        <AccordionItem title="Dashboard Setup" icon={<Globe className="h-5 w-5" />}>
          <CodeBlock code={`cd frontend
npm install`} />
          <p className="text-[var(--muted-foreground)] mb-2">Create frontend/.env.local:</p>
          <CodeBlock language="env" code={`NEXT_PUBLIC_API_URL=https://analytics.yourdomain.com
INTERNAL_API_URL=http://localhost:3456
NEXTAUTH_SECRET=same-secret-as-backend
NEXTAUTH_URL=https://dashboard.yourdomain.com`} />
          <CodeBlock code={`npm run build
npm start`} />
        </AccordionItem>

        <AccordionItem title="Reverse Proxy & HTTPS" icon={<Globe className="h-5 w-5" />}>
          <p className="text-[var(--muted-foreground)] mb-3">Set up two subdomains pointing to your server.</p>
          <h3 className="font-semibold mt-4">Nginx — Backend</h3>
          <CodeBlock language="nginx" code={`server {
    server_name analytics.yourdomain.com;
    location / {
        proxy_pass http://localhost:3456;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`} />
          <h3 className="font-semibold mt-4">Nginx — Dashboard</h3>
          <CodeBlock language="nginx" code={`server {
    server_name dashboard.yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`} />
        </AccordionItem>

        <AccordionItem title="API Reference" icon={<Code className="h-5 w-5" />}>
          <p className="text-[var(--muted-foreground)] mb-3">All protected endpoints require Authorization: Bearer &lt;token&gt;.</p>
          <h3 className="font-semibold mt-4">Auth</h3>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs border border-[var(--border)] rounded-lg overflow-hidden">
              <thead><tr className="bg-[var(--background)]"><th className="text-left p-2">Method</th><th className="text-left p-2">Endpoint</th><th className="text-left p-2">Description</th></tr></thead>
              <tbody className="text-[var(--muted-foreground)]">
                <tr><td className="p-2 font-mono">POST</td><td className="p-2 font-mono">/api/auth/login</td><td className="p-2">Login, returns JWT</td></tr>
                <tr><td className="p-2 font-mono">GET</td><td className="p-2 font-mono">/api/auth/me</td><td className="p-2">Current user info</td></tr>
              </tbody>
            </table>
          </div>
          <h3 className="font-semibold mt-4">Tracking (Public)</h3>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs border border-[var(--border)] rounded-lg overflow-hidden">
              <thead><tr className="bg-[var(--background)]"><th className="text-left p-2">Method</th><th className="text-left p-2">Endpoint</th><th className="text-left p-2">Description</th></tr></thead>
              <tbody className="text-[var(--muted-foreground)]">
                <tr><td className="p-2 font-mono">POST</td><td className="p-2 font-mono">/api/analytics/track/pageview</td><td className="p-2">Track page view</td></tr>
                <tr><td className="p-2 font-mono">POST</td><td className="p-2 font-mono">/api/analytics/track/event</td><td className="p-2">Track custom event</td></tr>
              </tbody>
            </table>
          </div>
        </AccordionItem>

        <AccordionItem title="Updating" icon={<RefreshCw className="h-5 w-5" />}>
          <CodeBlock code={`# Pull latest code
git pull

# Sync to server
rsync -av --exclude='node_modules' --exclude='.git' \\
  ~/Documents/web-analytics/backend/ \\
  user@server:~/web-analytics-backend/

# Rebuild on server
ssh user@server
cd ~/web-analytics-backend && npm install && npx prisma db push && npm run build && pm2 restart analytics-backend`} />
        </AccordionItem>

        <AccordionItem title="Troubleshooting" icon={<Code className="h-5 w-5" />}>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Login redirects back to /login</p>
              <p className="text-[var(--muted-foreground)] mt-1">NEXTAUTH_SECRET mismatch. Check both .env files have the exact same value.</p>
            </div>
            <div>
              <p className="font-medium">No data in dashboard</p>
              <p className="text-[var(--muted-foreground)] mt-1">Check browser console for "[Analytics] Tracker initialized". If missing, check script URL and CSP.</p>
            </div>
            <div>
              <p className="font-medium">Country shows as Unknown</p>
              <p className="text-[var(--muted-foreground)] mt-1">Private networks always show Unknown. Test from outside your local network.</p>
            </div>
          </div>
        </AccordionItem>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Full README on{' '}
            <a href="https://github.com/robintehofstee/web-analytics" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline font-medium">GitHub</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
