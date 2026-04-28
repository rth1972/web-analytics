'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Code, Globe, Zap, Shield, BarChart2, HelpCircle } from 'lucide-react';

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

function CodeBlock({ code, language = 'html' }: { code: string; language?: string }) {
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

function AccordionItem({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 bg-[var(--card)] hover:bg-[var(--muted)]/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="text-[var(--primary)]">{section.icon}</div>
          <span className="font-semibold text-[var(--foreground)]">{section.title}</span>
        </div>
        {open
          ? <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
          : <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
        }
      </button>
      {open && (
        <div className="px-5 pb-5 pt-2 bg-[var(--card)] border-t border-[var(--border)] text-sm text-[var(--foreground)] space-y-2">
          {section.content}
        </div>
      )}
    </div>
  );
}

const sections: Section[] = [
  {
    id: 'install',
    icon: <Code className="h-5 w-5" />,
    title: 'Installing the tracker snippet',
    content: (
      <>
        <p className="text-[var(--muted-foreground)]">Add this snippet to every page you want to track. Get your pre-filled snippet from <strong>Websites → Get Snippet</strong>.</p>

        <h3 className="font-semibold mt-4">Plain HTML</h3>
        <p className="text-[var(--muted-foreground)]">Paste before the closing <code className="bg-[var(--muted)] px-1 rounded text-xs">&lt;/body&gt;</code> tag:</p>
        <CodeBlock language="html" code={`<script
  src="https://analytics.yourdomain.com/tracker.js"
  data-website-id="YOUR_WEBSITE_ID"
  data-api-url="https://analytics.yourdomain.com"
  defer
></script>`} />

        <h3 className="font-semibold mt-4">Next.js (App Router)</h3>
        <p className="text-[var(--muted-foreground)]">Add to <code className="bg-[var(--muted)] px-1 rounded text-xs">app/layout.tsx</code>:</p>
        <CodeBlock language="tsx" code={`import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="https://analytics.yourdomain.com/tracker.js"
          data-website-id="YOUR_WEBSITE_ID"
          data-api-url="https://analytics.yourdomain.com"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}`} />

        <h3 className="font-semibold mt-4">WordPress</h3>
        <p className="text-[var(--muted-foreground)]">Use the <strong>Insert Headers and Footers</strong> plugin and paste the snippet in the Footer section. Or add it to your theme's <code className="bg-[var(--muted)] px-1 rounded text-xs">footer.php</code> before <code className="bg-[var(--muted)] px-1 rounded text-xs">&lt;/body&gt;</code>.</p>

        <Callout type="tip">The tracker automatically handles SPA routing (React Router, Vue Router, etc.) — page views fire on every navigation without extra setup.</Callout>
      </>
    ),
  },
  {
    id: 'events',
    icon: <Zap className="h-5 w-5" />,
    title: 'Tracking custom events',
    content: (
      <>
        <p className="text-[var(--muted-foreground)]">Once the tracker snippet is installed, a global <code className="bg-[var(--muted)] px-1 rounded text-xs">analytics</code> object is available anywhere on your page.</p>

        <h3 className="font-semibold mt-4">Basic syntax</h3>
        <CodeBlock language="javascript" code={`analytics.track('event_name');
analytics.track('event_name', { key: 'value', another: 123 });`} />

        <h3 className="font-semibold mt-4">Button click</h3>
        <CodeBlock language="javascript" code={`document.querySelector('#cta').addEventListener('click', () => {
  analytics.track('cta_click', { label: 'Get Started', position: 'hero' });
});`} />

        <h3 className="font-semibold mt-4">Form submission</h3>
        <CodeBlock language="javascript" code={`document.querySelector('form#contact').addEventListener('submit', () => {
  analytics.track('form_submit', { form: 'contact' });
});`} />

        <h3 className="font-semibold mt-4">Purchase / conversion</h3>
        <CodeBlock language="javascript" code={`analytics.track('purchase', {
  product: 'Pro Plan',
  price: 29.99,
  currency: 'USD',
});`} />

        <h3 className="font-semibold mt-4">Outbound link clicks</h3>
        <CodeBlock language="javascript" code={`document.querySelectorAll('a[href^="http"]').forEach(link => {
  link.addEventListener('click', () => {
    analytics.track('outbound_click', { url: link.href });
  });
});`} />

        <h3 className="font-semibold mt-4">File downloads</h3>
        <CodeBlock language="javascript" code={`document.querySelectorAll('a[href$=".pdf"], a[href$=".zip"]').forEach(link => {
  link.addEventListener('click', () => {
    analytics.track('file_download', { file: link.getAttribute('href') });
  });
});`} />

        <h3 className="font-semibold mt-4">React / Next.js</h3>
        <CodeBlock language="tsx" code={`// Inline
<button onClick={() => analytics.track('signup_click', { plan: 'pro' })}>
  Sign up
</button>

// useEffect
useEffect(() => {
  analytics.track('feature_viewed', { feature: 'pricing' });
}, []);`} />

        <h3 className="font-semibold mt-4">TypeScript type hint</h3>
        <p className="text-[var(--muted-foreground)]">Add to a <code className="bg-[var(--muted)] px-1 rounded text-xs">global.d.ts</code> file:</p>
        <CodeBlock language="typescript" code={`interface Analytics {
  track: (event: string, data?: Record<string, unknown>) => void;
}
declare const analytics: Analytics;`} />

        <Callout type="info">Event names are case-sensitive. Keep them lowercase with underscores for consistency: <code className="bg-[var(--muted)] px-1 rounded text-xs">button_click</code> not <code className="bg-[var(--muted)] px-1 rounded text-xs">ButtonClick</code>.</Callout>
      </>
    ),
  },
  {
    id: 'websites',
    icon: <Globe className="h-5 w-5" />,
    title: 'Adding and managing websites',
    content: (
      <>
        <p className="text-[var(--muted-foreground)]">Each website you track needs to be registered in the dashboard so the backend can accept tracking data from it.</p>

        <h3 className="font-semibold mt-4">Adding a website</h3>
        <ol className="list-decimal list-inside space-y-1 text-[var(--muted-foreground)]">
          <li>Go to <strong className="text-[var(--foreground)]">Websites</strong> in the sidebar</li>
          <li>Click <strong className="text-[var(--foreground)]">Add Website</strong></li>
          <li>Enter a name (e.g. <code className="bg-[var(--muted)] px-1 rounded text-xs">My Blog</code>) and the domain (e.g. <code className="bg-[var(--muted)] px-1 rounded text-xs">blog.yourdomain.com</code>)</li>
          <li>Click <strong className="text-[var(--foreground)]">Get Snippet</strong> to copy your tracking code</li>
        </ol>

        <Callout type="warning">The domain must be the hostname only — no <code>https://</code>, no trailing slash, no path. Use <code>blog.yourdomain.com</code> not <code>https://blog.yourdomain.com/</code>.</Callout>

        <h3 className="font-semibold mt-4">Getting the website ID</h3>
        <p className="text-[var(--muted-foreground)]">Click <strong className="text-[var(--foreground)]">Get Snippet</strong> on any website — the Website ID is shown at the bottom of the modal. You need this for the <code className="bg-[var(--muted)] px-1 rounded text-xs">data-website-id</code> attribute in your snippet.</p>

        <h3 className="font-semibold mt-4">Deleting a website</h3>
        <p className="text-[var(--muted-foreground)]">Click the trash icon on the website card. This permanently deletes the website and all its page views, sessions and events.</p>
      </>
    ),
  },
  {
    id: 'dashboard',
    icon: <BarChart2 className="h-5 w-5" />,
    title: 'Understanding the dashboard',
    content: (
      <>
        <p className="text-[var(--muted-foreground)]">The dashboard shows analytics for the selected website and time period.</p>

        <h3 className="font-semibold mt-4">Time periods</h3>
        <p className="text-[var(--muted-foreground)]">Use the <strong className="text-[var(--foreground)]">24h / 7d / 30d</strong> buttons in the top right to switch between last 24 hours, 7 days, and 30 days.</p>

        <h3 className="font-semibold mt-4">Metrics explained</h3>
        <div className="space-y-2">
          {[
            ['Page Views', 'Total number of pages loaded by all visitors.'],
            ['Unique Visitors', 'Number of distinct sessions in the period.'],
            ['Events', 'Total custom events tracked via analytics.track().'],
            ['Bounce Rate', 'Percentage of sessions where only one page was viewed. Lower is generally better.'],
            ['Avg. Session', 'Average time between the first and last page view in a session.'],
          ].map(([label, desc]) => (
            <div key={label} className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3">
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{desc}</div>
            </div>
          ))}
        </div>

        <h3 className="font-semibold mt-4">Countries — clicking through to IPs</h3>
        <p className="text-[var(--muted-foreground)]">Click any country name in the Countries section to see the individual IP addresses of visitors from that country, including their visit count and city.</p>

        <h3 className="font-semibold mt-4">Real-time page</h3>
        <p className="text-[var(--muted-foreground)]">Go to <strong className="text-[var(--foreground)]">Real-time</strong> in the sidebar to see live activity from the last 5 minutes. The page auto-refreshes every 5 seconds.</p>
      </>
    ),
  },
  {
    id: 'security',
    icon: <Shield className="h-5 w-5" />,
    title: 'Security — 2FA, users and roles',
    content: (
      <>
        <h3 className="font-semibold">Setting up two-factor authentication</h3>
        <ol className="list-decimal list-inside space-y-1 text-[var(--muted-foreground)] mt-2">
          <li>Go to <strong className="text-[var(--foreground)]">Settings</strong> in the sidebar</li>
          <li>Click <strong className="text-[var(--foreground)]">Set up 2FA</strong></li>
          <li>Scan the QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)</li>
          <li>Enter the 6-digit code shown in the app to confirm</li>
        </ol>
        <p className="text-[var(--muted-foreground)] mt-2">On future logins you'll be prompted for your code after entering your password. To disable 2FA, enter your password in the disable field under Settings.</p>

        <h3 className="font-semibold mt-4">User roles</h3>
        <div className="space-y-2 mt-2">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400">ADMIN</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">Can see and manage all users' websites, approve/reject new accounts, change roles, and delete users. Has access to the Admin panel in the sidebar.</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">USER</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">Can only see and manage their own websites. Cannot access the Admin panel.</p>
          </div>
        </div>

        <h3 className="font-semibold mt-4">Approving new users (admin)</h3>
        <ol className="list-decimal list-inside space-y-1 text-[var(--muted-foreground)]">
          <li>Go to <strong className="text-[var(--foreground)]">Admin</strong> in the sidebar</li>
          <li>Pending users appear at the top under "Pending Approval"</li>
          <li>Click <strong className="text-[var(--foreground)]">Approve</strong> — the user gets a welcome email and can log in immediately</li>
          <li>Click <strong className="text-[var(--foreground)]">Reject</strong> to delete the account</li>
        </ol>

        <Callout type="tip">You can change any user's role from USER to ADMIN (and back) at any time from the Admin panel using the role dropdown.</Callout>

        <h3 className="font-semibold mt-4">Rate limiting on login</h3>
        <p className="text-[var(--muted-foreground)]">Login attempts are rate-limited to 5 per 15 minutes per IP address. After 5 failed attempts the IP is blocked for 15 minutes. Successful logins reset the counter.</p>
      </>
    ),
  },
  {
    id: 'csp',
    icon: <Code className="h-5 w-5" />,
    title: 'Content Security Policy (CSP)',
    content: (
      <>
        <p className="text-[var(--muted-foreground)]">If your website has a Content Security Policy, you need to allow the analytics domain in two directives: <code className="bg-[var(--muted)] px-1 rounded text-xs">script-src</code> and <code className="bg-[var(--muted)] px-1 rounded text-xs">connect-src</code>.</p>

        <h3 className="font-semibold mt-4">Next.js</h3>
        <CodeBlock language="js" code={`// next.config.js
async headers() {
  return [{
    source: '/(.*)',
    headers: [{
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://analytics.yourdomain.com",
        "connect-src 'self' https://analytics.yourdomain.com",
      ].join('; '),
    }],
  }]
}`} />

        <h3 className="font-semibold mt-4">Apache</h3>
        <CodeBlock language="apache" code={`Header always set Content-Security-Policy \
  "default-src 'self'; \
   script-src 'self' 'unsafe-inline' https://analytics.yourdomain.com; \
   connect-src 'self' https://analytics.yourdomain.com"`} />

        <h3 className="font-semibold mt-4">Nginx</h3>
        <CodeBlock language="nginx" code={`add_header Content-Security-Policy \
  "default-src 'self'; script-src 'self' 'unsafe-inline' https://analytics.yourdomain.com; connect-src 'self' https://analytics.yourdomain.com";`} />

        <Callout type="warning">Replace <code>https://analytics.yourdomain.com</code> with the actual URL of your analytics backend.</Callout>
      </>
    ),
  },
  {
    id: 'troubleshoot',
    icon: <HelpCircle className="h-5 w-5" />,
    title: 'Troubleshooting',
    content: (
      <>
        {[
          {
            q: 'No data appearing in the dashboard',
            a: 'Open DevTools → Console on your tracked website. You should see [Analytics] Tracker initialized. If missing, the script isn\'t loading — check the src URL and your CSP. If present but no data, check the Network tab for failed POST requests to /api/analytics/track/pageview.',
          },
          {
            q: 'Country always shows as Unknown',
            a: 'Visitors on private networks (192.168.x.x, 10.x.x.x, localhost) always show Unknown — geoip-lite can\'t resolve private IPs. Test from a device on mobile data or outside your local network.',
          },
          {
            q: 'CORS error on tracking requests',
            a: 'Make sure the domain is registered under Websites. Use the hostname only — blog.yourdomain.com, not https://blog.yourdomain.com/. No server restart is needed after adding.',
          },
          {
            q: 'Login redirects back to /login after entering credentials',
            a: 'The NEXTAUTH_SECRET in backend .env and frontend .env.local must be exactly identical. Check both files and make sure neither has extra spaces or quotes around the value.',
          },
          {
            q: 'Mixed content error on the tracked site',
            a: 'If your website is served over HTTPS, the analytics backend must also be HTTPS. Set up a reverse proxy with SSL — see the README for Apache and Nginx examples.',
          },
          {
            q: 'analytics is not defined error',
            a: 'The tracker script hasn\'t loaded yet when your code runs. Wrap your analytics.track() calls in a DOMContentLoaded listener, or move the script tag higher in the page.',
          },
          {
            q: '503 errors on API requests from the browser',
            a: 'The backend is either not running or Apache/Nginx can\'t connect to it. Check: pm2 status, ss -tlnp | grep 3456, and your reverse proxy config.',
          },
        ].map(({ q, a }) => (
          <div key={q} className="border-b border-[var(--border)] pb-4 last:border-0 last:pb-0 pt-4 first:pt-0">
            <p className="font-medium text-[var(--foreground)]">{q}</p>
            <p className="text-[var(--muted-foreground)] mt-1 text-sm">{a}</p>
          </div>
        ))}
      </>
    ),
  },
];

export default function HelpPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Help & Documentation</h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Everything you need to set up tracking, custom events, security and more.
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-medium hover:bg-[var(--muted)]/30 transition-colors text-left"
          >
            <span className="text-[var(--primary)]">{s.icon}</span>
            <span className="text-[var(--foreground)]">{s.title.split(' ').slice(0, 3).join(' ')}</span>
          </button>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map(s => (
          <div key={s.id} id={s.id}>
            <AccordionItem section={s} />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          Need more help? Check the full{' '}
          <a
            href="https://github.com/robintehofstee/web-analytics"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline font-medium"
          >
            README on GitHub
          </a>
          .
        </p>
      </div>
    </div>
  );
}
