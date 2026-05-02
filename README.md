# Viewly — Self-Hosted Web Analytics

A self-hosted, privacy-focused web analytics platform. Tracks page views, sessions, devices, countries, referrers, UTM campaigns, and custom events — with real-time dashboards, goal tracking, uptime monitoring, alerts, API keys, and multi-user support with 2FA.

## Table of Contents

- [Architecture](#architecture)
- [Requirements](#requirements)
- [Backend Setup](#backend-setup)
- [Database Setup (PostgreSQL)](#database-setup-postgresql)
- [Dashboard Setup](#dashboard-setup)
- [Environment Variables](#environment-variables)
- [Reverse Proxy & HTTPS](#reverse-proxy--https)
  - [Apache](#apache)
  - [Nginx](#nginx)
- [User Management](#user-management)
- [Adding a Website to Track](#adding-a-website-to-track)
- [Installing the Tracker](#installing-the-tracker)
  - [Next.js](#nextjs)
  - [Plain HTML](#plain-html)
  - [Any JS Framework](#any-js-framework)
  - [WordPress](#wordpress)
- [Content Security Policy](#content-security-policy)
- [Custom Event Tracking](#custom-event-tracking)
- [Features](#features)
- [API Reference](#api-reference)
- [Syncing Mac → Server](#syncing-mac--server)
- [Updating](#updating)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```
web-analytics/
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
        └── middleware.ts     # route protection
```

The backend is the single source of truth. It serves `tracker.js`, handles all API calls, and manages auth. The dashboard is a separate Next.js app. The login flow proxies through the dashboard's own API route (`/api/auth/login`) to the backend, keeping everything same-origin.

---

## Requirements

- Node.js 18 or higher
- npm
- PostgreSQL 14 or higher
- A server with a public IP (for internet-accessible tracking)
- A domain name with HTTPS (required by modern browsers for cross-origin tracking)

---

## Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env` (see [Environment Variables](#environment-variables) for all options):

```env
DATABASE_URL="postgresql://analytics:yourpassword@localhost:5432/analytics"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
PORT="3456"
ALLOW_SIGNUP="false"
```

Generate a secret:

```bash
openssl rand -base64 32
```

Run migrations and start:

```bash
npx prisma generate
npx prisma db push
npm run dev              # development
npm run build && npm start   # production
```

### Production with PM2

```bash
npm install -g pm2
cd backend
npm run build
pm2 start "npm start" --name analytics-backend
pm2 save
pm2 startup   # follow the printed command
```

---

## Database Setup (PostgreSQL)

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl enable --now postgresql
sudo -u postgres psql
```

Inside the postgres shell:

```sql
CREATE USER analytics WITH PASSWORD 'yourpassword';
CREATE DATABASE analytics OWNER analytics;
GRANT ALL PRIVILEGES ON DATABASE analytics TO analytics;
\q
```

Run the migration:

```bash
cd backend
npx prisma db push
```

---

## Dashboard Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local` (see [Environment Variables](#environment-variables)):

```env
NEXT_PUBLIC_API_URL=https://analytics.yourdomain.com
INTERNAL_API_URL=http://localhost:3456
NEXTAUTH_SECRET=same-secret-as-backend
NEXTAUTH_URL=https://dashboard.yourdomain.com
```

Build and start:

```bash
npm run build
npm start   # starts on http://localhost:3000
```

### Production with PM2

```bash
pm2 start "npm start" --name analytics-frontend
pm2 save
```

---

## Environment Variables

### `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✓ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✓ | Secret for signing JWT tokens — must match frontend |
| `PORT` | | Backend port (default: `3456`) |
| `ALLOW_SIGNUP` | | Set to `true` to allow public registration (default: `false`) |
| `SMTP_HOST` | | SMTP server hostname for email (optional) |
| `SMTP_PORT` | | SMTP port (default: `587`) |
| `SMTP_USER` | | SMTP username |
| `SMTP_PASS` | | SMTP password |
| `SMTP_FROM` | | From address for sent emails |
| `APP_URL` | | Dashboard URL — used in email links (e.g. `https://dashboard.yourdomain.com`) |

### `frontend/.env.local`

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✓ | Public URL of your backend (used by browsers) |
| `INTERNAL_API_URL` | ✓ | Internal URL of backend for server-side proxy (e.g. `http://localhost:3456`) |
| `NEXTAUTH_SECRET` | ✓ | Must be **identical** to `backend/.env` `NEXTAUTH_SECRET` |
| `NEXTAUTH_URL` | ✓ | Public URL of your dashboard |

> **Critical:** `NEXTAUTH_SECRET` must be exactly the same in both files. The backend signs JWT tokens with it; the frontend middleware verifies them with it. A mismatch causes login to silently redirect back to `/login`.

### Local development vs production

**On your server** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=https://analytics.yourdomain.com
INTERNAL_API_URL=http://localhost:3456
NEXTAUTH_SECRET=your-shared-secret
NEXTAUTH_URL=https://dashboard.yourdomain.com
```

**On your Mac** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=https://analytics.yourdomain.com
INTERNAL_API_URL=http://localhost:3456
NEXTAUTH_SECRET=your-shared-secret
NEXTAUTH_URL=http://localhost:3000
```

The only difference is `NEXTAUTH_URL` — your Mac uses `localhost:3000`, the server uses the public domain.

### What to commit to Git

```
✅ backend/src/
✅ frontend/src/
✅ README.md
✅ .gitignore
❌ backend/.env          — never commit (contains secrets)
❌ frontend/.env.local   — never commit (contains secrets)
❌ node_modules/
❌ .next/
❌ prisma/dev.db
```

Both `.env` and `.env.local` are already excluded in `.gitignore`.

---

## Reverse Proxy & HTTPS

Set up two subdomains pointing to your server:

| Service | Subdomain | Port |
|---------|-----------|------|
| Backend | `analytics.yourdomain.com` | 3456 |
| Dashboard | `dashboard.yourdomain.com` | 3000 |

### Apache

```bash
sudo apt install apache2 certbot python3-certbot-apache -y
sudo a2enmod proxy proxy_http headers rewrite ssl
```

**Backend** — `/etc/apache2/sites-available/analytics.conf`:

```apache
<VirtualHost *:80>
    ServerName analytics.yourdomain.com
    ProxyPreserveHost On
    ProxyPass / http://localhost:3456/
    ProxyPassReverse / http://localhost:3456/
    RequestHeader set X-Forwarded-For "%{REMOTE_ADDR}s"
    SetEnv proxy-nokeepalive 1
    ProxyTimeout 60
</VirtualHost>
```

**Dashboard** — `/etc/apache2/sites-available/analytics-dashboard.conf`:

```apache
<VirtualHost *:80>
    ServerName dashboard.yourdomain.com
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

Enable and get SSL:

```bash
sudo a2ensite analytics.conf analytics-dashboard.conf
sudo systemctl reload apache2
sudo certbot --apache -d analytics.yourdomain.com -d dashboard.yourdomain.com
```

> Do **not** add manual `Access-Control-Allow-Origin` headers in Apache — the backend handles CORS dynamically based on registered website domains.

### Nginx

**Backend** — `/etc/nginx/sites-available/analytics`:

```nginx
server {
    server_name analytics.yourdomain.com;
    location / {
        proxy_pass http://localhost:3456;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Dashboard** — `/etc/nginx/sites-available/analytics-dashboard`:

```nginx
server {
    server_name dashboard.yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and get SSL:

```bash
sudo ln -s /etc/nginx/sites-available/analytics /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/analytics-dashboard /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d analytics.yourdomain.com -d dashboard.yourdomain.com
```

---

## User Management

### Creating the first admin

Public signup is disabled by default. Create your first admin directly:

```bash
cd ~/web-analytics-backend

node --input-type=module << 'EOF'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const hash = await bcrypt.hash('yourpassword', 12);

await prisma.user.upsert({
  where: { username: 'yourusername' },
  update: { passwordHash: hash, emailVerified: true, approved: true, role: 'ADMIN' },
  create: {
    username: 'yourusername',
    email: 'you@yourdomain.com',
    passwordHash: hash,
    role: 'ADMIN',
    emailVerified: true,
    approved: true,
  },
});

console.log('Admin created successfully');
await prisma.$disconnect();
EOF
```

### Resetting a password

```bash
cd ~/web-analytics-backend

node --input-type=module << 'EOF'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const hash = await bcrypt.hash('newpassword', 12);

await prisma.user.update({
  where: { username: 'yourusername' },
  data: { passwordHash: hash },
});

console.log('Password updated');
await prisma.$disconnect();
EOF
```

### Enabling public signup

Set in `backend/.env`:

```env
ALLOW_SIGNUP=true
```

Restart the backend. New registrations require email verification and admin approval before login.

### Approving users

Go to **Admin** in the sidebar. Pending users appear at the top — click Approve or Reject.

### Two-factor authentication

Users enable 2FA from **Settings → Two-Factor Authentication**. A QR code is shown — scan with Google Authenticator, Authy, or 1Password. On login, users are prompted for their 6-digit code after the password step.

---

## Adding a Website to Track

1. Go to **Websites** in the sidebar
2. Click **Add Website**
3. Enter name (e.g. `My Blog`) and domain (e.g. `myblog.com` — no `https://`, no trailing slash)
4. Click **Get Snippet** to get your pre-filled tracking code

The domain is used for automatic CORS allowlisting. Once registered, that origin can send tracking data — no restart needed.

### Public dashboard sharing

On the Websites page, click the share icon on any website card to enable a public read-only dashboard. A shareable link is shown that anyone can access without logging in.

---

## Installing the Tracker

### Next.js

**App Router** — `app/layout.tsx`:

```tsx
import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
}
```

**Pages Router** — `pages/_app.tsx`:

```tsx
import Script from 'next/script'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Script
        src="https://analytics.yourdomain.com/tracker.js"
        data-website-id="YOUR_WEBSITE_ID"
        data-api-url="https://analytics.yourdomain.com"
        strategy="afterInteractive"
      />
    </>
  )
}
```

Using environment variables (recommended):

```env
# .env.local on the tracked site
NEXT_PUBLIC_ANALYTICS_URL=https://analytics.yourdomain.com
NEXT_PUBLIC_ANALYTICS_ID=YOUR_WEBSITE_ID
```

```tsx
<Script
  src={`${process.env.NEXT_PUBLIC_ANALYTICS_URL}/tracker.js`}
  data-website-id={process.env.NEXT_PUBLIC_ANALYTICS_ID}
  data-api-url={process.env.NEXT_PUBLIC_ANALYTICS_URL}
  strategy="afterInteractive"
/>
```

### Plain HTML

Add before `</body>`:

```html
<script
  src="https://analytics.yourdomain.com/tracker.js"
  data-website-id="YOUR_WEBSITE_ID"
  data-api-url="https://analytics.yourdomain.com"
  defer
></script>
```

### Any JS Framework

The snippet works with any framework. Add it once to your root layout or `index.html`. The tracker automatically patches `history.pushState` and `history.replaceState` so SPAs (Vue, React, Svelte, Astro) track page navigations without extra setup.

**Astro** — `src/layouts/Base.astro`:

```astro
<script
  src="https://analytics.yourdomain.com/tracker.js"
  data-website-id="YOUR_WEBSITE_ID"
  data-api-url="https://analytics.yourdomain.com"
  defer
  is:inline
></script>
```

### WordPress

Use the **Insert Headers and Footers** plugin and paste in the Footer section, or add directly to `footer.php` before `</body>`:

```html
<script
  src="https://analytics.yourdomain.com/tracker.js"
  data-website-id="YOUR_WEBSITE_ID"
  data-api-url="https://analytics.yourdomain.com"
  defer
></script>
```

---

## Content Security Policy

If your site has a CSP, add `https://analytics.yourdomain.com` to both `script-src` and `connect-src`.

**Next.js** — `next.config.js`:

```js
async headers() {
  return [{
    source: '/(.*)',
    headers: [{
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://analytics.yourdomain.com",
        "connect-src 'self' https://analytics.yourdomain.com",
        // add other sources your site needs
      ].join('; '),
    }],
  }]
}
```

**Apache:**

```apache
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://analytics.yourdomain.com; connect-src 'self' https://analytics.yourdomain.com"
```

**Nginx:**

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://analytics.yourdomain.com; connect-src 'self' https://analytics.yourdomain.com";
```

---

## Custom Event Tracking

Once `tracker.js` is loaded, a global `analytics` object is available anywhere in your JavaScript.

```javascript
// Basic
analytics.track('event_name');
analytics.track('event_name', { key: 'value' });

// Button click
document.querySelector('#cta').addEventListener('click', () => {
  analytics.track('cta_click', { label: 'Get Started' });
});

// Form submission
document.querySelector('form').addEventListener('submit', () => {
  analytics.track('form_submit', { form: 'contact' });
});

// Purchase
analytics.track('purchase', { product: 'Pro Plan', price: 29.99, currency: 'USD' });

// File download
document.querySelectorAll('a[href$=".pdf"]').forEach(link => {
  link.addEventListener('click', () => {
    analytics.track('file_download', { file: link.href });
  });
});
```

**TypeScript** — add to `global.d.ts`:

```typescript
interface Analytics {
  track: (event: string, data?: Record<string, unknown>) => void;
}
declare const analytics: Analytics;
```

---

## Features

| Feature | Description |
|---------|-------------|
| Page views & sessions | Automatic tracking with device, browser, OS, country |
| UTM campaign tracking | Automatically captures `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` from URLs |
| Real-time dashboard | Live feed of active visitors, top pages, recent events — refreshes every 5 seconds |
| Goals & conversions | Track page visits or custom events as conversion goals with conversion rate |
| Uptime monitoring | HTTP checks on a configurable interval with response time history |
| Alerts | Webhook notifications for traffic spikes/drops and uptime events |
| API keys | Generate tokens for programmatic access to your data |
| Data export | Export page views, sessions, and events as CSV or JSON |
| Public dashboards | Shareable read-only dashboard link per website |
| Annotations | Mark dates on the traffic chart with notes |
| Multi-user | Role-based access (Admin/User), email verification, admin approval |
| Two-factor auth | TOTP-based 2FA compatible with any authenticator app |
| Data retention | Auto-delete old data after a configurable number of days |
| Country flags | Visitor countries shown with emoji flags |
| Light & dark mode | System preference respected, toggleable, persisted |
| Collapsible sidebar | Icon-only mode with tooltips, state persisted across sessions |

---

## API Reference

All protected endpoints require `Authorization: Bearer <token>`. Obtain a token from `POST /api/auth/login`.

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | — | Login, returns JWT token |
| `POST` | `/api/auth/register` | — | Register (requires `ALLOW_SIGNUP=true`) |
| `POST` | `/api/auth/verify-email` | — | Verify email token |
| `GET`  | `/api/auth/me` | ✓ | Current user info |
| `POST` | `/api/auth/me/preferences` | ✓ | Update preferences |
| `POST` | `/api/auth/2fa/setup` | ✓ | Begin 2FA setup |
| `POST` | `/api/auth/2fa/confirm` | ✓ | Confirm 2FA code |
| `POST` | `/api/auth/2fa/disable` | ✓ | Disable 2FA |

### Tracking (public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analytics/track/pageview` | Track a page view (includes UTM) |
| `POST` | `/api/analytics/track/event` | Track a custom event |

### Websites

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/websites` | ✓ | List websites |
| `POST` | `/api/websites` | ✓ | Create website |
| `POST` | `/api/websites/:id/public/toggle` | ✓ | Toggle public dashboard |
| `DELETE` | `/api/websites/:id` | ✓ | Delete website |

### Dashboard

All accept `?period=24h` (default), `?period=7d`, or `?period=30d`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/:id/stats` | Overview stats |
| `GET` | `/api/dashboard/:id/pages` | Top pages |
| `GET` | `/api/dashboard/:id/referrers` | Traffic sources |
| `GET` | `/api/dashboard/:id/devices` | Device breakdown |
| `GET` | `/api/dashboard/:id/browsers` | Browser breakdown |
| `GET` | `/api/dashboard/:id/os` | OS breakdown |
| `GET` | `/api/dashboard/:id/countries` | Country breakdown |
| `GET` | `/api/dashboard/:id/realtime` | Live activity |

### Goals

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/goals/:websiteId` | List goals |
| `POST` | `/api/goals/:websiteId` | Create goal |
| `GET` | `/api/goals/:websiteId/:goalId/stats` | Goal conversion stats |
| `DELETE` | `/api/goals/:websiteId/:goalId` | Delete goal |

### Uptime

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/uptime/:websiteId` | List monitors |
| `POST` | `/api/uptime/:websiteId` | Add monitor |
| `PATCH` | `/api/uptime/:websiteId/:checkId/toggle` | Pause/resume |
| `DELETE` | `/api/uptime/:websiteId/:checkId` | Delete monitor |

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/alerts/:websiteId` | List alerts |
| `POST` | `/api/alerts/:websiteId` | Create alert |
| `PATCH` | `/api/alerts/:websiteId/:alertId/toggle` | Enable/disable |
| `DELETE` | `/api/alerts/:websiteId/:alertId` | Delete alert |

### Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/export/:websiteId/pageviews?period=30d&format=csv` | Export page views |
| `GET` | `/api/export/:websiteId/sessions?period=30d&format=csv` | Export sessions |
| `GET` | `/api/export/:websiteId/events?period=30d&format=csv` | Export events |

Use `?format=json` for JSON output instead of CSV.

### API Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/keys` | List API keys |
| `POST` | `/api/keys` | Generate new key |
| `DELETE` | `/api/keys/:id` | Revoke key |

### Public (no auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/public/:token` | Public dashboard data |
| `GET` | `/api/health` | Backend health check |

---

## Syncing Mac → Server

Use rsync to keep your Mac (source of truth) in sync with your server:

```bash
# Sync backend
rsync -av --exclude='node_modules' --exclude='.git' --exclude='*.db' \
  ~/Documents/web-analytics/backend/ \
  robin@192.168.1.100:~/nextjs/web-analytics-backend/

# Sync frontend
rsync -av --exclude='node_modules' --exclude='.next' --exclude='.git' --exclude='.env.local' \
  ~/Documents/web-analytics/frontend/ \
  robin@192.168.1.100:~/nextjs/web-analytics-frontend/
```

> Note `--exclude='.env.local'` on the frontend sync — your Mac `.env.local` has `NEXTAUTH_URL=http://localhost:3000` while the server needs `NEXTAUTH_URL=https://dashboard.yourdomain.com`. Keep them separate.

After syncing, rebuild on the server:

```bash
ssh robin@192.168.1.100

cd ~/nextjs/web-analytics-backend
npm install && npm run build && pm2 restart analytics-backend

cd ~/nextjs/web-analytics-frontend
npm install && npm run build && pm2 restart analytics-frontend
```

---

## Updating

```bash
# Pull latest code on Mac
git pull

# Sync to server (see above)
rsync ...

# Rebuild on server
ssh robin@192.168.1.100
cd ~/nextjs/web-analytics-backend && npm install && npx prisma db push && npm run build && pm2 restart analytics-backend
cd ~/nextjs/web-analytics-frontend && npm install && npm run build && pm2 restart analytics-frontend
```

---

## Troubleshooting

### Login redirects back to `/login` with no error

The `NEXTAUTH_SECRET` in `backend/.env` and `frontend/.env.local` are different. They must be identical — the backend signs the JWT, the frontend verifies it.

```bash
grep NEXTAUTH_SECRET ~/nextjs/web-analytics-backend/.env
grep NEXTAUTH_SECRET ~/nextjs/web-analytics-frontend/.env.local
```

If different, update the backend to match the frontend (or vice versa) and restart both.

### "Could not connect to server" on login

The login proxy route (`/api/auth/login` on the dashboard) can't reach the backend. Check `INTERNAL_API_URL` in `frontend/.env.local` — it should be `http://localhost:3456` when both apps are on the same server.

```bash
curl http://localhost:3456/api/health
```

If this fails, the backend isn't running:

```bash
pm2 status
pm2 logs analytics-backend --lines 30
```

### CORS error on tracking requests

The tracked website's domain isn't registered. Go to **Websites**, add the site with the exact hostname (e.g. `myblog.com` not `https://myblog.com`). No restart needed.

### CORS error showing multiple `Access-Control-Allow-Origin` values

Apache is adding its own CORS headers on top of the backend's. Remove all `Header always set Access-Control-Allow-Origin` lines from your Apache vhost — the backend handles CORS automatically.

### Backend crashes on startup (`ERR_MODULE_NOT_FOUND`)

A source file is missing on the server. Check which file:

```bash
pm2 logs analytics-backend --lines 20
```

Then sync the missing file from your Mac and rebuild:

```bash
rsync -av ~/Documents/web-analytics/backend/src/ robin@192.168.1.100:~/nextjs/web-analytics-backend/src/
ssh robin@192.168.1.100 "cd ~/nextjs/web-analytics-backend && npm run build && pm2 restart analytics-backend"
```

### TypeScript build error: `moduleResolution`

The `tsconfig.json` must use `Node16` for both `module` and `moduleResolution`:

```json
{
  "compilerOptions": {
    "module": "Node16",
    "moduleResolution": "node16"
  }
}
```

### Duplicate stale files causing build errors

If you see errors about files that should have been replaced, check for duplicates:

```bash
find ~/nextjs/web-analytics-backend/src -name "*.ts" | sort
```

Delete any files in the wrong location (e.g. `src/reportCron.ts` should only exist at `src/services/reportCron.ts`).

### Country shows as Unknown

Visitors on private networks (192.168.x.x, 10.x.x.x, 172.16.x.x, localhost) always show Unknown — geoip-lite can't resolve private IPs. Test from outside your network (e.g. mobile data) to verify countries are working.

### Tracker script returns 404

Check `https://analytics.yourdomain.com/tracker.js` is reachable in your browser. The script is served as a static file from the backend's working directory. Make sure PM2 is started from the correct directory:

```bash
pm2 show analytics-backend | grep "exec cwd"
ls <cwd>/tracker.js
```

### Mixed content error

Your website is HTTPS but the analytics backend is HTTP. The backend must also be HTTPS. Follow the [Reverse Proxy & HTTPS](#reverse-proxy--https) section.

### No data in dashboard

Open DevTools console on the tracked site. You should see:
```
[Analytics] Tracker initialized for website YOUR_WEBSITE_ID
```
If missing, the script isn't loading — check `src` URL and CSP. If present but no data appears, check the Network tab for failed POST requests to `/api/analytics/track/pageview` and look at the response for an error message.

### PM2 not starting on reboot

```bash
pm2 startup   # run the command it prints
pm2 save
```

### Push rejected by GitHub (large file)

If a large file (e.g. `node_modules`, `.next`, `core` dump) was accidentally committed:

```bash
# Find the large object
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sort -k3 -n -r | head -20

# Remove it from history
git filter-repo --path <path-to-file> --invert-paths --force

# Clean up and force push
git gc --aggressive --prune=now
git remote add origin https://github.com/youruser/your-repo.git
git push origin main --force
```
