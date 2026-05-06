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

const GH = 'https://github.com/rth1972/web-analytics';

function Logo({ size = 28, dark = true }: { size?: number; dark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8"/>
          <stop offset="100%" stopColor="#6366f1"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={dark ? 'rgba(99,102,241,0.15)' : 'url(#logo-g)'}/>
      <path d="M 3 16 Q 16 4 29 16 Q 16 28 3 16 Z"
        fill="none" stroke={dark ? '#818cf8' : 'white'} strokeWidth="2.2"
        strokeLinejoin="round" strokeLinecap="round" opacity="0.9"/>
      <circle cx="16" cy="16" r="5.5" fill={dark ? '#818cf8' : 'white'} opacity="0.95"/>
      <circle cx="16" cy="16" r="2.5" fill={dark ? '#1e1b4b' : '#6366f1'}/>
    </svg>
  );
}

function GithubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

const FEATURES = [
  { icon: Eye,      title: 'Real-time Analytics',     desc: 'Watch visitors browse your site live. Active pages, countries and events — updated every 5 seconds.' },
  { icon: Target,   title: 'Goals & Conversions',      desc: 'Define conversion goals based on page visits or custom events. Track rates and understand your funnel.' },
  { icon: Activity, title: 'Uptime Monitoring',        desc: 'HTTP checks on a configurable interval with instant webhook alerts when a site goes down.' },
  { icon: Globe,    title: 'UTM Campaign Tracking',    desc: 'Automatically captures utm_source, utm_medium, utm_campaign and more from every URL.' },
  { icon: Bell,     title: 'Smart Alerts',             desc: 'Get notified via webhook when traffic spikes, drops, or your site goes offline.' },
  { icon: Key,      title: 'API Access',               desc: 'Generate API keys for programmatic access to all your data. Export as CSV or JSON.' },
  { icon: Shield,   title: 'Privacy First',            desc: 'No cookies, no fingerprinting, no third parties. Your data stays on your server.' },
  { icon: Users,    title: 'Multi-user & 2FA',         desc: 'Role-based access for your team. TOTP two-factor authentication for every account.' },
  { icon: Lock,     title: 'Self-hosted',              desc: 'Run on your own infrastructure. Full control over data, retention, and access.' },
];

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#0a0a0f', color: '#e2e2f0' }}>
      <style>{`
        .lp-gradient-text {
          background: linear-gradient(135deg, #a5b4fc 0%, #818cf8 40%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lp-glow {
          box-shadow: 0 0 60px rgba(99,102,241,0.15), 0 0 120px rgba(99,102,241,0.05);
        }
        .lp-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(12px);
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .lp-card:hover {
          background: rgba(99,102,241,0.08);
          border-color: rgba(99,102,241,0.3);
          transform: translateY(-2px);
        }
        .lp-btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          transition: opacity 0.15s, transform 0.15s;
        }
        .lp-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .lp-btn-ghost {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          transition: background 0.15s, border-color 0.15s;
        }
        .lp-btn-ghost:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.2); }
        .lp-stat-card {
          background: rgba(99,102,241,0.08);
          border: 1px solid rgba(99,102,241,0.2);
        }
        .lp-noise {
          position: absolute; inset: 0; opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          pointer-events: none;
        }
      `}</style>

      {/* ── Navbar ── */}
      <header className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
        style={{ background: scrolled ? 'rgba(10,10,15,0.85)' : 'transparent',
                 backdropFilter: scrolled ? 'blur(16px)' : 'none',
                 borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2.5">
            <Logo size={28} dark />
            <span className="text-lg font-bold tracking-tight text-white">Viewly</span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: '#94a3b8' }}>
            {['#features','#how-it-works','#privacy'].map((href, i) =>
              <a key={href} href={href}
                className="hover:text-white transition-colors">
                {['Features','How it works','Privacy'][i]}
              </a>
            )}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <a href="/login"
              className="text-sm font-medium transition-colors hover:text-white" style={{ color: '#94a3b8' }}>
              Sign in
            </a>
            <a href="/login"
              className="lp-btn-primary flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white">
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg lp-btn-ghost">
            <ChevronDown className={`h-4 w-4 text-white transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden px-6 pb-5 pt-2 space-y-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,15,0.95)' }}>
            {['Features','How it works','Privacy'].map((label, i) => (
              <a key={label} href={['#features','#how-it-works','#privacy'][i]}
                onClick={() => setMenuOpen(false)}
                className="block py-1.5 text-sm font-medium text-slate-300 hover:text-white">{label}</a>
            ))}
            <div className="flex gap-3 pt-2">
              <a href="/login" className="flex-1 lp-btn-ghost rounded-lg py-2 text-center text-sm font-medium text-white">Sign in</a>
              <a href="/login" className="flex-1 lp-btn-primary rounded-lg py-2 text-center text-sm font-semibold text-white">Get started</a>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center pt-24 pb-20 px-6">
        {/* Background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="lp-noise" />
          <div className="absolute" style={{
            width: 700, height: 700, borderRadius: '50%',
            top: -200, left: '50%', transform: 'translateX(-60%)',
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}/>
          <div className="absolute" style={{
            width: 500, height: 500, borderRadius: '50%',
            bottom: -100, right: '10%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}/>
          {/* Grid lines */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 100%)',
          }}/>
        </div>

        <div className="relative mx-auto max-w-6xl w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
                <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
                Self-hosted · Privacy-first · Open source
              </div>

              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08]" style={{ color: '#f1f5f9' }}>
                Analytics that<br />
                <span className="lp-gradient-text">respect privacy</span>
              </h1>

              <p className="text-lg leading-relaxed max-w-lg" style={{ color: '#94a3b8' }}>
                Viewly is a self-hosted web analytics platform. Track page views, goals, uptime,
                and custom events — with no cookies, no third parties, and full data ownership.
              </p>

              <div className="flex flex-wrap gap-4">
                <a href="/login"
                  className="lp-btn-primary flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold text-white lp-glow">
                  Start tracking free <ArrowRight className="h-4 w-4" />
                </a>
                <a href={GH} target="_blank"
                  className="lp-btn-ghost flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold text-white">
                  <GithubIcon /> View on GitHub
                </a>
              </div>

              <div className="flex flex-wrap gap-5" style={{ color: '#64748b', fontSize: 13 }}>
                {['No credit card required', 'No cookies set', 'No consent banner needed'].map(t => (
                  <span key={t} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — dashboard mockup */}
            <div className="relative">
              {/* Glow behind mockup */}
              <div className="absolute inset-0 rounded-2xl" style={{
                background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.2) 0%, transparent 70%)',
                filter: 'blur(30px)', transform: 'scale(1.1)',
              }}/>
              <div className="relative rounded-2xl overflow-hidden lp-card" style={{ border: '1px solid rgba(99,102,241,0.25)' }}>
                {/* Browser chrome */}
                <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-2 rounded-md px-3 py-1 text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Lock className="h-2.5 w-2.5" />
                      dashboard.yourdomain.com
                    </div>
                  </div>
                </div>
                {/* Dashboard content */}
                <div className="flex" style={{ background: '#0d0d14' }}>
                  {/* Fake sidebar */}
                  <div className="hidden sm:flex w-12 shrink-0 flex-col items-center gap-3 py-5"
                    style={{ background: 'rgba(99,102,241,0.15)', borderRight: '1px solid rgba(99,102,241,0.15)' }}>
                    {[BarChart2, Globe, Zap, Target, Activity].map((Icon, i) => (
                      <div key={i} className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: i === 0 ? 'rgba(99,102,241,0.4)' : 'transparent' }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: i === 0 ? '#a5b4fc' : '#475569' }} />
                      </div>
                    ))}
                  </div>
                  {/* Fake content */}
                  <div className="flex-1 p-4 space-y-3">
                    {/* Stat cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { label: 'Page Views', value: '24,891', up: true  },
                        { label: 'Visitors',   value: '8,342',  up: true  },
                        { label: 'Bounce Rate',value: '38%',    up: false },
                        { label: 'Avg Session',value: '2m 41s', up: true  },
                      ].map(s => (
                        <div key={s.label} className="rounded-lg p-2.5"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="text-[10px]" style={{ color: '#475569' }}>{s.label}</div>
                          <div className="text-base font-bold mt-0.5" style={{ color: '#e2e8f0' }}>{s.value}</div>
                          <div className="text-[10px] mt-0.5" style={{ color: s.up ? '#34d399' : '#f87171' }}>
                            {s.up ? '↑' : '↓'} {s.up ? '+12%' : '-3%'}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Chart */}
                    <div className="rounded-lg p-3 h-28 flex items-end gap-0.5"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {[35,55,40,72,50,88,65,80,55,92,70,85,48,76].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col-reverse rounded-sm overflow-hidden"
                          style={{ height: `${h}%`, background: 'rgba(99,102,241,0.15)' }}>
                          <div className="w-full rounded-sm" style={{ height: '60%', background: 'linear-gradient(180deg, #818cf8, #6366f1)' }} />
                        </div>
                      ))}
                    </div>
                    {/* Mini table */}
                    <div className="space-y-1.5">
                      {[
                        { page: '/blog/getting-started', pct: 91 },
                        { page: '/',                     pct: 68 },
                        { page: '/pricing',              pct: 42 },
                      ].map(r => (
                        <div key={r.page} className="flex items-center gap-2">
                          <div className="text-[10px] w-32 truncate" style={{ color: '#64748b' }}>{r.page}</div>
                          <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-1 rounded-full" style={{ width: `${r.pct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
                          </div>
                          <div className="text-[10px] w-6 text-right" style={{ color: '#475569' }}>{r.pct}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section id="stats" className="py-16 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(99,102,241,0.04)' }}>
        <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '< 1KB',  label: 'Tracker script size' },
            { value: '0',      label: 'Cookies used' },
            { value: '100%',   label: 'Data ownership' },
            { value: '∞',      label: 'Websites tracked' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-4xl font-extrabold lp-gradient-text mb-1">{s.value}</div>
              <div className="text-sm" style={{ color: '#64748b' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-28 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}>
              Everything you need
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#f1f5f9' }}>
              Powerful analytics, zero complexity
            </h2>
            <p className="mx-auto max-w-lg" style={{ color: '#64748b' }}>
              Every feature you need to understand your audience — without the bloat of enterprise
              tools or the privacy concerns of big tech analytics.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(f => (
              <div key={f.title} className="lp-card rounded-2xl p-6 space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <f.icon className="h-5 w-5" style={{ color: '#818cf8' }} />
                </div>
                <h3 className="font-semibold" style={{ color: '#e2e8f0' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-28 px-6" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}>
              Quick setup
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#f1f5f9' }}>
              Up and running in minutes
            </h2>
            <p style={{ color: '#64748b' }}>Three steps from zero to tracking.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step:'01', icon: Server, title:'Deploy the backend',
                desc:'Clone the repo, set your database URL and secret, run the migration and start with PM2.',
                code:'npm install && npx prisma db push && npm start' },
              { step:'02', icon: Globe, title:'Add your website',
                desc:'Log in to the dashboard and register any website you want to track.',
                code:'domain: yourdomain.com' },
              { step:'03', icon: Zap, title:'Paste the snippet',
                desc:"Add one script tag to your site. Works with Next.js, HTML, WordPress, or any framework.",
                code:'<script src="analytics.domain.com/tracker.js" ... />' },
            ].map(s => (
              <div key={s.step} className="lp-card rounded-2xl p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl lp-btn-primary">
                    <s.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-4xl font-black" style={{ color: 'rgba(255,255,255,0.04)' }}>{s.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: '#e2e8f0' }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{s.desc}</p>
                </div>
                <code className="block rounded-lg px-3 py-2 text-xs break-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8' }}>
                  {s.code}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Privacy ── */}
      <section id="privacy" className="py-28 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="relative rounded-3xl overflow-hidden p-10 md:p-16"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 100%)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <div className="lp-noise" />
            <div className="absolute" style={{
              width: 400, height: 400, borderRadius: '50%',
              top: -100, right: -100,
              background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)',
              filter: 'blur(40px)', pointerEvents: 'none',
            }} />
            <div className="relative flex flex-col md:flex-row items-start gap-12">
              <div className="flex-1 space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#c4b5fd' }}>
                  <Shield className="h-3.5 w-3.5" /> Cookie-free & privacy-friendly
                </div>
                <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#f1f5f9' }}>
                  Your data never leaves your server
                </h2>
                <p className="leading-relaxed" style={{ color: '#a5b4fc' }}>
                  Viewly uses no cookies and no fingerprinting. All analytics data is stored in your
                  own PostgreSQL database on your own server — no third-party services ever see your
                  visitors' data. Because no cookies are used, you don't need a cookie consent banner.
                </p>
                <ul className="space-y-2">
                  {[
                    'No cookies or persistent identifiers',
                    'No data sent to third parties',
                    'Configurable data retention periods',
                    'No cookie consent banner needed for analytics',
                  ].map(t => (
                    <li key={t} className="flex items-center gap-2.5 text-sm" style={{ color: '#c4b5fd' }}>
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="shrink-0 grid grid-cols-2 gap-3">
                {[
                  { icon: Shield,     label: 'No Cookies'  },
                  { icon: Lock,       label: 'No Tracking' },
                  { icon: Server,     label: 'Self-hosted' },
                  { icon: TrendingUp, label: 'Open Source' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-2 rounded-2xl p-5 min-w-[100px]"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Icon className="h-6 w-6" style={{ color: '#a5b4fc' }} />
                    <span className="text-xs font-medium" style={{ color: '#c4b5fd' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6 text-center" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#f1f5f9' }}>
            Ready to own your analytics?
          </h2>
          <p style={{ color: '#64748b' }}>
            Deploy Viewly on your own server and start tracking in minutes.
            Free forever, open source, no usage limits.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a href="/login"
              className="lp-btn-primary flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold text-white lp-glow">
              Get started now <ArrowRight className="h-4 w-4" />
            </a>
            <a href={GH} target="_blank"
              className="lp-btn-ghost flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold text-white">
              <GithubIcon /> Star on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size={24} dark />
            <span className="font-semibold text-white">Viewly</span>
            <span className="text-sm" style={{ color: '#334155' }}>·</span>
            <span className="text-sm" style={{ color: '#475569' }}>Self-hosted analytics</span>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: '#475569' }}>
            <a href="/login" className="hover:text-white transition-colors">Sign in</a>
            <a href={GH} target="_blank" className="hover:text-white transition-colors">GitHub</a>
            <span>© {new Date().getFullYear()} Viewly</span>
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

  if (isAuthenticated === null) return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
    </div>
  );

  if (isAuthenticated === false) return <LandingPage />;

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
