'use client';

import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

const LAST_UPDATED = 'May 5, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <div className="space-y-3 text-gray-600 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="pp-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#4f46e5"/>
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#pp-grad)"/>
              <path d="M 3 16 Q 16 4 29 16 Q 16 28 3 16 Z"
                fill="none" stroke="white" strokeWidth="2.2"
                strokeLinejoin="round" strokeLinecap="round" opacity="0.9"/>
              <circle cx="16" cy="16" r="5.5" fill="white" opacity="0.95"/>
              <circle cx="16" cy="16" r="2.5" fill="#6366f1"/>
            </svg>
            <span className="text-lg font-bold tracking-tight text-gray-900">Viewly</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-indigo-50 to-white border-b border-gray-100 py-14 px-6 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
              <Shield className="h-7 w-7 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Privacy Policy</h1>
          <p className="text-gray-500">
            Last updated: <span className="font-medium text-gray-700">{LAST_UPDATED}</span>
          </p>
          <p className="mt-4 text-gray-500 max-w-lg mx-auto">
            Viewly is a self-hosted analytics tool. This page explains what data is collected,
            how it is stored, and what your rights are.
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-16 space-y-12">

        <Section title="1. Overview">
          <p>
            Viewly is a self-hosted, open-source web analytics platform. Because Viewly is
            self-hosted, the operator of each Viewly installation — not Viewly itself — controls
            all collected data. This privacy policy applies to the Viewly software and the default
            data practices it implements.
          </p>
          <p>
            If you are visiting a website that uses Viewly for analytics, you should also read
            that website's own privacy policy, as the website operator is the data controller for
            the data collected about your visit.
          </p>
        </Section>

        <Section title="2. What data Viewly collects">
          <p>
            When you visit a website using Viewly's tracker script, the following data points may
            be collected about each page view:
          </p>
          <ul className="list-none space-y-2 pl-0">
            {[
              ['Page URL',         'The address of the page you visited.'],
              ['Referrer',         'The address of the page you came from, if any.'],
              ['Browser',          "Derived from your browser's user agent string (e.g. Chrome, Firefox)."],
              ['Operating system', 'Derived from your user agent (e.g. macOS, Windows, Android).'],
              ['Device type',      'Desktop, tablet, or mobile — derived from your user agent.'],
              ['Screen size',      'The viewport dimensions of your browser window.'],
              ['Country & city',   'Approximate geolocation derived from your IP address using a local offline database. The IP address itself is not stored.'],
              ['UTM parameters',   'Campaign tracking parameters present in the URL (utm_source, utm_medium, utm_campaign, etc.).'],
              ['Session ID',       'A random identifier generated per visit to group page views into a session. It is not tied to your identity and is not persisted between sessions.'],
            ].map(([term, def]) => (
              <li key={term} className="flex gap-3 rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
                <span className="font-semibold text-gray-800 shrink-0 w-44 text-sm">{term}</span>
                <span className="text-gray-500 text-sm">{def}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="3. What Viewly does NOT collect">
          <p>Viewly is specifically designed to avoid collecting personal data:</p>
          <ul className="space-y-2">
            {[
              'No cookies are set — not even first-party analytics cookies',
              'No persistent identifiers or browser fingerprinting of any kind',
              'IP addresses are used only to determine approximate location and are never stored',
              'No cross-site tracking — each Viewly installation is completely isolated',
              'No advertising identifiers',
              'No data enrichment from third-party sources',
              'No data is ever sent to or shared with any third party by default',
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-[10px]">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3 text-sm text-indigo-700">
            Because Viewly uses no cookies and stores no personal data, websites using Viewly for
            analytics alone generally do not need a cookie consent banner for that purpose.
            However, compliance depends on how your specific installation is configured — always
            consult your own legal advisor before drawing conclusions about regulatory compliance.
          </div>
        </Section>

        <Section title="4. Data storage and retention">
          <p>
            All data collected by Viewly is stored in a PostgreSQL database on the server operated
            by whoever installed Viewly. No data is transmitted to Viewly, the software developers,
            or any other party.
          </p>
          <p>
            Data retention is configurable by the Viewly operator. By default, data is retained
            indefinitely. Operators can configure automatic deletion of data older than a set
            number of days via the Settings page.
          </p>
        </Section>

        <Section title="5. Cookies and tracking technologies">
          <p>
            Viewly's tracker script does not set any cookies. It does not use localStorage,
            IndexedDB, or any other persistent browser storage to identify or track visitors
            across sessions or across websites.
          </p>
          <p>
            A temporary session identifier exists in memory only for the duration of a browser
            session. It is discarded when you close the tab, cannot be used to identify you,
            and cannot track you across different websites.
          </p>
        </Section>

        <Section title="6. Third-party services">
          <p>
            Viewly itself does not use any third-party analytics, advertising, or tracking services.
            The tracker script and dashboard do not load any external resources from third parties
            at runtime, unless the operator has specifically configured additional integrations.
          </p>
          <p>
            Webhook alerts configured by the operator may send limited event data to third-party
            URLs (for example, a Slack or Discord webhook). This is entirely at the discretion of
            the operator and outside the scope of the default Viewly installation.
          </p>
        </Section>

        <Section title="7. Your rights as a visitor">
          <p>
            Because Viewly stores no personal data in the traditional sense — no names, email
            addresses, or persistent identifiers — most data subject rights such as access,
            erasure, and portability are not practically applicable to analytics data collected
            about page views.
          </p>
          <p>
            If you are concerned about analytics data collected about your visits to a specific
            website, please contact the operator of that website directly, as they are the data
            controller.
          </p>
        </Section>

        <Section title="8. Your rights as a registered user">
          <p>
            If you have a login account on a Viewly dashboard installation, the following applies
            to your account data:
          </p>
          <ul className="space-y-1.5 text-sm">
            {[
              'You can view and update your username, email, and preferences from the Settings page',
              'You can enable or disable two-factor authentication at any time',
              'Your password is stored as a bcrypt hash and is never readable by the operator or anyone else',
              'You can request deletion of your account by contacting the operator of the installation',
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-0.5 text-indigo-500 shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="9. Security">
          <p>
            Viewly is designed with security in mind. User passwords are hashed using bcrypt.
            Sessions are managed via signed JWT tokens with a configurable expiry. Two-factor
            authentication using TOTP is available for all accounts. API keys are stored only
            as SHA-256 hashes — the raw key is shown once at creation and never stored again.
          </p>
          <p>
            The security of a specific Viewly installation depends on how it is deployed and
            maintained by the operator. Viewly strongly recommends running behind HTTPS, keeping
            Node.js and all dependencies up to date, and using a strong random secret.
          </p>
        </Section>

        <Section title="10. Children's privacy">
          <p>
            Viewly does not knowingly collect any personal information from children under the
            age of 13. Because the analytics tracker collects no personal data from website
            visitors, this is generally not a concern for the tracking functionality.
          </p>
        </Section>

        <Section title="11. Changes to this policy">
          <p>
            This privacy policy may be updated from time to time as the software evolves.
            Changes are reflected by an updated date at the top of this page. The current
            version is always available at this URL.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Viewly is open-source software. If you have questions about this privacy policy or
            about how a specific installation handles your data, please contact the operator of
            that installation directly.
          </p>
          <p>
            For questions or issues with the Viewly software itself, open an issue on GitHub at{' '}
            <a href="https://github.com/rth1972/web-analytics" target="_blank"
              className="text-indigo-600 hover:underline font-medium">
              github.com/rth1972/web-analytics
            </a>.
          </p>
        </Section>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-8 flex items-center justify-between text-sm text-gray-400">
          <span>© {new Date().getFullYear()} Viewly — Open source analytics</span>
          <Link href="/" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
