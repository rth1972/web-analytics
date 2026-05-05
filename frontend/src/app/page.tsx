'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Scatter, Cell, BarChart, Bar,
} from 'recharts';
import { api } from '@/lib/api';
import {
  BarChart2, Eye, Globe, Zap, Shield, Clock, Target,
  Activity, Bell, Key, ArrowRight, Check, ChevronDown,
  TrendingUp, Users, Lock, Server,
} from 'lucide-react';

// ── Landing page ──────────────────────────────────────────────────────────────

function ViewlyWordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lp-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1"/>
            <stop offset="100%" stopColor="#4f46e5"/>
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#lp-grad)"/>
        <path d="M 3 16 Q 16 4 29 16 Q 16 28 3 16 Z"
          fill="none" stroke="white" strokeWidth="2.2"
          strokeLinejoin="round" strokeLinecap="round" opacity="0.9"/>
        <circle cx="16" cy="16" r="5.5" fill="white" opacity="0.95"/>
        <circle cx="16" cy="16" r="2.5" fill="#6366f1"/>
      </svg>
      <span className="text-xl font-bold tracking-tight text-gray-900">Viewly</span>
    </div>
  );
}

const FEATURES = [
  {
    icon: Eye,
    title: 'Real-time Analytics',
    desc: 'Watch visitors browse your site live. See active pages, countries, and events as they happen — updated every 5 seconds.',
  },
  {
    icon: Target,
    title: 'Goals & Conversions',
    desc: 'Define conversion goals based on page visits or custom events. Track conversion rates and understand your funnel.',
  },
  {
    icon: Activity,
    title: 'Uptime Monitoring',
    desc: 'Monitor your URLs with configurable intervals. Get instant webhook alerts when a site goes down or recovers.',
  },
  {
    icon: Globe,
    title: 'UTM Campaign Tracking',
    desc: 'Automatically captures UTM parameters so you can attribute traffic to the right marketing campaigns.',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    desc: 'Get notified via webhook when traffic spikes, drops, or your site goes offline. Configure thresholds per site.',
  },
  {
    icon: Key,
    title: 'API Access',
    desc: 'Generate API keys for programmatic access to all your data. Export as CSV or JSON for your own pipelines.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    desc: 'No cookies, no fingerprinting, no third parties. GDPR-friendly by design. Your data stays on your server.',
  },
  {
    icon: Users,
    title: 'Multi-user & 2FA',
    desc: 'Invite your team with role-based access. Protect accounts with TOTP two-factor authentication.',
  },
  {
    icon: Lock,
    title: 'Self-hosted',
    desc: 'Run on your own infrastructure. Full control over your data, retention, and access. Open source and free.',
  },
];

const STATS = [
  { value: '< 1KB', label: 'Tracker script size' },
  { value: '0',     label: 'Cookies used' },
  { value: '100%',  label: 'Data ownership' },
  { value: '∞',     label: 'Websites tracked' },
];

function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── Nav ── */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
        scrolled ? 'bg-white/95 shadow-sm backdrop-blur-md' : 'bg-transparent'
      }`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <ViewlyWordmark />
          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-500 md:flex">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#stats" className="hover:text-gray-900 transition-colors">Why Viewly</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <a href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </a>
            <a href="/login"
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm">
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-gray-200">
            <ChevronDown className={`h-4 w-4 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-gray-100 bg-white px-6 py-4 space-y-3 md:hidden">
            <a href="#features" className="block text-sm font-medium text-gray-700 py-1">Features</a>
            <a href="#how-it-works" className="block text-sm font-medium text-gray-700 py-1">How it works</a>
            <a href="#stats" className="block text-sm font-medium text-gray-700 py-1">Why Viewly</a>
            <div className="flex gap-3 pt-2">
              <a href="/login" className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-sm font-medium">Sign in</a>
              <a href="/login" className="flex-1 rounded-lg bg-indigo-600 py-2 text-center text-sm font-semibold text-white">Get started</a>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-[600px]"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
          <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[800px] h-[800px] rounded-full border border-indigo-100 opacity-40" />
          <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[500px] h-[500px] rounded-full border border-indigo-100 opacity-60" />
        </div>

        <div className="mx-auto max-w-3xl">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Self-hosted · Privacy-first · Open source
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-gray-900">
            Analytics that respect
            <span className="block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              your users' privacy
            </span>
          </h1>

          <p className="mx-auto max-w-xl text-lg text-gray-500 mb-10 leading-relaxed">
            Viewly is a self-hosted web analytics platform. Track page views, sessions, goals, uptime, and custom events — with no cookies, no third parties, and full data ownership.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/login"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              Start tracking free <ArrowRight className="h-4 w-4" />
            </a>
            <a href="https://github.com/rth1972/web-analytics" target="_blank"
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              View on GitHub
            </a>
          </div>

          {/* Trust line */}
          <div className="mt-10 flex items-center justify-center gap-6 text-sm text-gray-400">
            {['No credit card required', 'No cookies', 'GDPR compliant'].map((t, i) => (
              <span key={t} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-gray-200">·</span>}
                <Check className="h-3.5 w-3.5 text-green-500" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Dashboard preview mockup */}
        <div className="mx-auto mt-20 max-w-5xl px-4">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/80 overflow-hidden">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="flex items-center gap-2 rounded-md bg-white border border-gray-200 px-3 py-1 text-xs text-gray-400 max-w-xs mx-auto">
                  <Lock className="h-3 w-3 text-gray-400" />
                  dashboard.yourdomain.com
                </div>
              </div>
            </div>
            {/* Fake dashboard content */}
            <div className="flex bg-white">
              {/* Fake sidebar */}
              <div className="hidden sm:flex w-14 flex-col items-center gap-4 border-r border-gray-100 bg-indigo-600 py-6">
                {[BarChart2, Globe, Zap, Target, Activity].map((Icon, i) => (
                  <div key={i} className={`flex h-9 w-9 items-center justify-center rounded-lg ${i === 0 ? 'bg-white/20' : ''}`}>
                    <Icon className="h-4 w-4 text-white/80" />
                  </div>
                ))}
              </div>
              {/* Fake content */}
              <div className="flex-1 p-5 space-y-4">
                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Page Views', value: '24,891' },
                    { label: 'Visitors',   value: '8,342'  },
                    { label: 'Bounce Rate',value: '38%'    },
                    { label: 'Avg Session',value: '2m 41s' },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg border border-gray-100 p-3">
                      <div className="text-[11px] text-gray-400">{s.label}</div>
                      <div className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</div>
                    </div>
                  ))}
                </div>
                {/* Fake chart */}
                <div className="rounded-lg border border-gray-100 p-3 h-32 flex items-end gap-1">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88, 50, 78].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm bg-indigo-100" style={{ height: `${h}%` }}>
                      <div className="w-full rounded-sm bg-indigo-500" style={{ height: `${Math.max(20, h - 20)}%` }} />
                    </div>
                  ))}
                </div>
                {/* Fake table rows */}
                <div className="space-y-2">
                  {[
                    { page: '/blog/getting-started', pct: 92 },
                    { page: '/',                     pct: 71 },
                    { page: '/pricing',              pct: 45 },
                  ].map(r => (
                    <div key={r.page} className="flex items-center gap-3">
                      <div className="text-xs text-gray-500 w-40 truncate">{r.page}</div>
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                        <div className="h-1.5 rounded-full bg-indigo-400" style={{ width: `${r.pct}%` }} />
                      </div>
                      <div className="text-xs text-gray-400 w-8 text-right">{r.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section id="stats" className="border-y border-gray-100 bg-gray-50 py-14 px-6">
        <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-extrabold text-indigo-600 mb-1">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
              Everything you need
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful analytics, zero complexity
            </h2>
            <p className="mx-auto max-w-xl text-gray-500">
              Every feature you need to understand your audience — without the bloat of enterprise tools or the privacy concerns of big tech analytics.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(f => (
              <div key={f.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 transition-all duration-200">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
            Quick setup
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Up and running in minutes
          </h2>
          <p className="text-gray-500 mb-16 max-w-xl mx-auto">
            Three steps from zero to tracking. No complex configuration, no external dependencies.
          </p>

          <div className="grid gap-8 md:grid-cols-3 text-left">
            {[
              {
                step: '01',
                icon: Server,
                title: 'Deploy the backend',
                desc: 'Clone the repo, set your database URL and secret, run the migration and start with PM2.',
                code: 'npm install && npx prisma db push && npm start',
              },
              {
                step: '02',
                icon: Globe,
                title: 'Add your website',
                desc: 'Log in to the dashboard and register any website you want to track. One click to get your snippet.',
                code: 'domain: yourdomain.com',
              },
              {
                step: '03',
                icon: Zap,
                title: 'Paste the snippet',
                desc: 'Add one script tag to your site — that\'s it. Works with Next.js, plain HTML, WordPress, or any framework.',
                code: '<script src="analytics.yourdomain.com/tracker.js" ... />',
              },
            ].map(s => (
              <div key={s.step} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="text-4xl font-black text-gray-100">{s.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
                <code className="block rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-xs text-gray-600 break-all">
                  {s.code}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Privacy section ── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-10 md:p-16 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-white space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white/90">
                <Shield className="h-3.5 w-3.5" /> Privacy by design
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Your data never leaves your server
              </h2>
              <p className="text-indigo-200 leading-relaxed">
                Viewly uses no cookies, no fingerprinting, and no third-party services. All data is stored in your own PostgreSQL database. GDPR, CCPA, and PECR compliant out of the box.
              </p>
              <ul className="space-y-2">
                {[
                  'No cookies or persistent identifiers',
                  'No data sold to third parties',
                  'Configurable data retention',
                  'Full GDPR compliance',
                ].map(t => (
                  <li key={t} className="flex items-center gap-2.5 text-sm text-indigo-100">
                    <Check className="h-4 w-4 text-green-300 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-shrink-0 grid grid-cols-2 gap-4 text-center">
              {[
                { icon: Shield, label: 'GDPR Ready'    },
                { icon: Lock,   label: 'No Cookies'    },
                { icon: Server, label: 'Self-hosted'   },
                { icon: TrendingUp, label: 'Open Source' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 rounded-2xl bg-white/10 p-5 text-white min-w-[100px]">
                  <Icon className="h-6 w-6 text-indigo-200" />
                  <span className="text-xs font-medium text-indigo-100">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to own your analytics?
          </h2>
          <p className="text-gray-500 mb-10">
            Deploy Viewly on your own server and start tracking in minutes. Free forever, open source, no usage limits.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/login"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              Get started now <ArrowRight className="h-4 w-4" />
            </a>
            <a href="https://github.com/rth1972/web-analytics" target="_blank"
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Star on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white py-12 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <ViewlyWordmark />
              <span className="text-sm text-gray-400">
                Self-hosted analytics for modern teams
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="/login"    className="hover:text-gray-600 transition-colors">Sign in</a>
              <a href="https://github.com/rth1972/web-analytics" target="_blank"
                className="hover:text-gray-600 transition-colors">GitHub</a>
              <span>© {new Date().getFullYear()} Viewly</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Dashboard (authenticated) ─────────────────────────────────────────────────

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
interface OsRow      { os: string; count: number }
interface CountryRow { country: string; visitors: number }
interface Website    { id: string; name: string; domain: string }

const toArray = <T,>(val: unknown): T[] => Array.isArray(val) ? (val as T[]) : [];

const countryFlag = (code: string) => {
  if (!code || code === 'Unknown') return '🌐';
  return code.toUpperCase().split('').map(c => String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))).join('');
};

const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
};

const fmtDuration = (s: number) => {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
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

function BreakdownTable<T>({ title, rows, keyCol, valCol }: {
  title: string; rows: T[]; keyCol: keyof T; valCol: keyof T;
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
                <div className="h-1 rounded-full bg-[var(--primary)]" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const getToken = () => {
      if (typeof window === 'undefined') return null;
      try {
        for (const cookie of document.cookie.split(';')) {
          const t = cookie.trim();
          if (t.startsWith('auth-token=')) return t.substring('auth-token='.length);
        }
      } catch {}
      return localStorage.getItem('auth-token');
    };

    const token = getToken();
    if (!token) { setIsAuthenticated(false); return; }
    api.get('/api/auth/me')
      .then(r => setIsAuthenticated(r.ok))
      .catch(() => setIsAuthenticated(false));
  }, []);

  if (isAuthenticated === false) return <LandingPage />;
  if (isAuthenticated === null) return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
    </div>
  );

  return <DashboardContent />;
}

function DashboardContent() {
  const [stats,          setStats]       = useState<Stats | null>(null);
  const [websites,       setWebsites]    = useState<Website[]>([]);
  const [selectedWebsite,setSelected]    = useState('');
  const [period,         setPeriod]      = useState('7d');
  const [loading,        setLoading]     = useState(true);
  const [statsLoading,   setStatsLoading]= useState(false);
  const [topPages,       setTopPages]    = useState<TopPage[]>([]);
  const [referrers,      setReferrers]   = useState<Referrer[]>([]);
  const [devices,        setDevices]     = useState<DeviceRow[]>([]);
  const [browsers,       setBrowsers]    = useState<BrowserRow[]>([]);
  const [os,             setOs]          = useState<OsRow[]>([]);
  const [countries,      setCountries]   = useState<CountryRow[]>([]);
  const [annotations,    setAnnotations] = useState<{ id: string; date: string; label: string; color: string }[]>([]);

  useEffect(() => {
    api.get('/api/websites')
      .then(r => r.json())
      .then((data: unknown) => {
        const list = toArray<Website>(data);
        setWebsites(list);
        if (list.length > 0) setSelected(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchAll = useCallback(async () => {
    if (!selectedWebsite) return;
    setStatsLoading(true);
    const q = `?period=${period}`;
    const base = `/api/dashboard/${selectedWebsite}`;

    const [s, p, r, d, b, o, c, a] = await Promise.allSettled([
      api.get(`${base}/stats${q}`).then(x => x.json()),
      api.get(`${base}/pages${q}`).then(x => x.json()),
      api.get(`${base}/referrers${q}`).then(x => x.json()),
      api.get(`${base}/devices${q}`).then(x => x.json()),
      api.get(`${base}/browsers${q}`).then(x => x.json()),
      api.get(`${base}/os${q}`).then(x => x.json()),
      api.get(`${base}/countries${q}`).then(x => x.json()),
      api.get(`/api/annotations/${selectedWebsite}`).then(x => x.json()),
    ]);

    if (s.status === 'fulfilled') setStats(s.value);
    if (p.status === 'fulfilled') setTopPages(toArray<TopPage>(p.value));
    if (r.status === 'fulfilled') setReferrers(toArray<Referrer>(r.value));
    if (d.status === 'fulfilled') setDevices(toArray<DeviceRow>(d.value));
    if (b.status === 'fulfilled') setBrowsers(toArray<BrowserRow>(b.value));
    if (o.status === 'fulfilled') setOs(toArray<OsRow>(o.value));
    if (c.status === 'fulfilled') setCountries(toArray<CountryRow>(c.value));
    if (a.status === 'fulfilled') setAnnotations(a.value);

    setStatsLoading(false);
  }, [selectedWebsite, period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function exportData(type: 'pageviews' | 'sessions' | 'events') {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3456'}/api/export/${selectedWebsite}/${type}?period=${period}&format=csv`;
    const link = document.createElement('a');
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
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
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-[var(--muted-foreground)]">Overview of your website analytics</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {statsLoading && <span className="text-xs text-[var(--muted-foreground)]">Refreshing…</span>}
          <div className="flex gap-2">
            {(['pageviews', 'sessions', 'events'] as const).map(t => (
              <button key={t} onClick={() => exportData(t)}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)] transition-colors capitalize">
                Export {t}
              </button>
            ))}
          </div>
          <select value={selectedWebsite} onChange={e => setSelected(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]">
            {websites.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <div className="flex rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
            {(['24h', '7d', '30d'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Page Views"      value={fmt(stats?.pageViews ?? 0)} />
        <StatCard label="Unique Visitors" value={fmt(stats?.uniqueVisitors ?? 0)} />
        <StatCard label="Events"          value={fmt(stats?.events ?? 0)} />
        <StatCard label="Bounce Rate"     value={`${stats?.bounceRate ?? 0}%`}
          sub={stats ? (stats.bounceRate < 50 ? 'Good' : stats.bounceRate < 70 ? 'Average' : 'High') : undefined}
          subColor={stats ? (stats.bounceRate < 50 ? 'text-green-500' : stats.bounceRate < 70 ? 'text-yellow-500' : 'text-red-500') : ''} />
        <StatCard label="Avg. Session"    value={fmtDuration(stats?.avgDuration ?? 0)}
          sub="duration" subColor="text-[var(--muted-foreground)]" />
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
                <Line type="monotone" dataKey="views" stroke="var(--primary)" strokeWidth={2}
                  dot={{ fill: 'var(--primary)', r: 3 }} activeDot={{ r: 5 }} />
                {annotations.length > 0 && (
                  <Scatter data={annotations.map(a => ({ date: a.date.split('T')[0], views: 0, label: a.label }))} fill="#6366f1">
                    {annotations.map((a, i) => <Cell key={i} fill={a.color} />)}
                  </Scatter>
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
              No data for this period.
            </div>
          )}
        </div>
        {annotations.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {annotations.map(a => (
              <div key={a.id} className="flex items-center gap-1.5 text-xs" style={{ color: a.color }}>
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                {a.label} ({new Date(a.date).toLocaleDateString()})
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top pages + referrers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownTable title="Top Pages"       rows={topPages}  keyCol="page"     valCol="views"  />
        <BreakdownTable title="Traffic Sources" rows={referrers} keyCol="referrer" valCol="visits" />
      </div>

      {/* Devices + Browsers + OS */}
      <div className="grid gap-6 lg:grid-cols-3">
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
        <BreakdownTable title="Browsers"          rows={browsers} keyCol="browser" valCol="count" />
        <BreakdownTable title="Operating Systems" rows={os}       keyCol="os"      valCol="count" />
      </div>

      {/* Countries */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold">Countries</h2>
        {countries.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No data for this period.</p>
        ) : (() => {
          const total = countries.reduce((s, r) => s + r.visitors, 0);
          return (
            <div className="space-y-3">
              {countries.map((row, i) => {
                const pct = total > 0 ? Math.round((row.visitors / total) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-[var(--muted-foreground)]">{i + 1}</span>
                        <span className="text-base leading-none">{countryFlag(row.country)}</span>
                        <a href={`/visitor-ips?websiteId=${selectedWebsite}&country=${encodeURIComponent(row.country)}&period=${period}`}
                          className="font-medium hover:text-[var(--primary)] hover:underline cursor-pointer">
                          {row.country || 'Unknown'}
                        </a>
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
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
