# Web Analytics

A self-hosted, privacy-focused web analytics platform built with Next.js, Express, Prisma and PostgreSQL. Tracks page views, sessions, devices, countries, referrers and custom events — with a real-time dashboard, multi-user support, 2FA, and role-based access control.

## Table of Contents

- [Architecture](#architecture)
- [Requirements](#requirements)
- [Backend Setup](#backend-setup)
- [Database Setup (PostgreSQL)](#database-setup-postgresql)
- [Dashboard Setup](#dashboard-setup)
- [Reverse Proxy & HTTPS](#reverse-proxy--https)
  - [Apache](#apache)
  - [Nginx](#nginx)
- [User Management](#user-management)
  - [Creating the first admin account](#creating-the-first-admin-account)
  - [Enabling public signup](#enabling-public-signup)
  - [Approving users](#approving-users)
  - [Two-factor authentication](#two-factor-authentication)
- [Adding a Website to Track](#adding-a-website-to-track)
- [Installing the Tracker](#installing-the-tracker)
  - [Next.js App](#nextjs-app)
  - [Plain HTML](#plain-html)
  - [Any JavaScript Framework](#any-javascript-framework)
  - [WordPress](#wordpress)
- [Content Security Policy](#content-security-policy)
- [Custom Event Tracking](#custom-event-tracking)
- [API Reference](#api-reference)
- [Updating](#updating)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```
web-analytics/
├── backend/      # Node.js + Express + Prisma API (port 3456)
│   ├── src/
│   │   ├── routes/       # auth, websites, dashboard, analytics, admin
│   │   ├── middleware/   # JWT auth, rate limiting
│   │   └── services/     # email (nodemailer)
│   └── prisma/
│       └── schema.prisma # PostgreSQL schema
└── frontend/     # Next.js dashboard (port 3000)
    └── src/
        ├── app/          # pages: dashboard, websites, realtime, settings, admin, help
        ├── lib/          # api client (JWT-aware fetch wrapper)
        └── middleware.ts # route protection
```

The backend exposes a REST API and serves `tracker.js`. The dashboard is a separate Next.js app that reads from the backend. Websites you want to track load `tracker.js` and POST data to the backend API. All dashboard routes are protected by JWT authentication.

---

## Requirements

- Node.js 18 or higher
- npm
- PostgreSQL 14 or higher
- A server with a public IP
- A domain name (required for HTTPS, which is required by modern browsers for tracking)

---

## Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
DATABASE_URL="postgresql://analytics:yourpassword@localhost:5432/analytics"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
SMTP_HOST="mail.yourdomain.com"
SMTP_PORT="587"
SMTP_USER="noreply@yourdomain.com"
SMTP_PASS="your-email-password"
SMTP_FROM="noreply@yourdomain.com"
APP_URL="https://dashboard.yourdomain.com"
ALLOW_SIGNUP="false"
PORT="3456"
```

Generate a secret:

```bash
openssl rand -base64 32
```

Then run migrations and start:

```bash
npx prisma generate
npx prisma db push
npm run dev       # development
npm run build && npm start   # production
```

### Running in Production with PM2

```bash
npm install -g pm2
cd backend
npm run build
pm2 start dist/index.js --name web-analytics-backend
pm2 save
pm2 startup
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

Then run the migration:

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

Create `.env.local` in `frontend/`:

```env
NEXT_PUBLIC_API_URL=https://analytics.yourdomain.com
NEXTAUTH_SECRET=same-secret-as-backend
ALLOW_SIGNUP=false
```

> `NEXTAUTH_SECRET` must be identical in both backend `.env` and frontend `.env.local` — it is used to sign and verify JWT tokens.

```bash
npm run build
npm start   # starts on http://localhost:3000
```

### Running in Production with PM2

```bash
pm2 start "npm start" --name web-analytics-frontend
pm2 save
```

---

## Reverse Proxy & HTTPS

Both the backend and the dashboard need HTTPS. Set up two subdomains:

| Service   | Example subdomain                        |
|-----------|------------------------------------------|
| Backend   | `analytics.yourdomain.com` → port 3456   |
| Dashboard | `dashboard.yourdomain.com` → port 3000   |

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
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Real-IP "%{REMOTE_ADDR}s"
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

### Creating the first admin account

Public signup is disabled by default (`ALLOW_SIGNUP=false`). Create your first admin directly in the database:

```bash
# Generate a bcrypt password hash
cd ~/web-analytics-backend
node -e "import('./node_modules/bcryptjs/index.js').then(b => b.default.hash('yourpassword', 12).then(h => console.log(h)))"
```

Copy the hash, then insert the user:

```bash
sudo -u postgres psql analytics -c "
INSERT INTO users (id, username, email, \"passwordHash\", role, \"emailVerified\", approved)
VALUES (gen_random_uuid(), 'yourusername', 'you@yourdomain.com', 'PASTE_HASH_HERE', 'ADMIN', true, true);
"
```

### Enabling public signup

When you're ready to let others sign up, set in `backend/.env`:

```env
ALLOW_SIGNUP=true
```

Restart the backend. New users who register will need to verify their email and then be approved by an admin before they can log in.

### Approving users

Go to **Admin** in the sidebar. Pending users appear at the top with an Approve/Reject button. Approving sends the user a welcome email automatically.

### Two-factor authentication

Users can enable 2FA from **Settings → Two-Factor Authentication**. After clicking "Set up 2FA", a QR code is shown — scan it with any TOTP app (Google Authenticator, Authy, 1Password, etc.), then enter the 6-digit code to confirm. On future logins, the user will be prompted for their code after entering their password.

---

## Adding a Website to Track

1. Go to **Websites** in the sidebar
2. Click **Add Website**
3. Enter a name (e.g. `My Blog`) and domain (e.g. `blog.yourdomain.com` — no `https://`, no trailing slash)
4. Click **Get Snippet** on the website card to get your pre-filled tracking snippet

The domain is used for CORS allowlisting — once added, that origin is automatically allowed to send tracking data to the backend.

---

## Installing the Tracker

### Next.js App

**App Router** — add to `app/layout.tsx`:

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

Using environment variables (recommended):

```env
# .env.local
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

The tracker automatically handles client-side navigation — page views fire on every route change without extra configuration.

### Plain HTML

Add before `</body>` on every page:

```html
<script
  src="https://analytics.yourdomain.com/tracker.js"
  data-website-id="YOUR_WEBSITE_ID"
  data-api-url="https://analytics.yourdomain.com"
  defer
></script>
```

### Any JavaScript Framework

The snippet is framework-agnostic. Add it once to your root layout or `index.html`. The tracker patches `history.pushState` and `history.replaceState` automatically so SPAs (Vue, React, Svelte, Astro) are tracked without extra setup.

**Astro** — `src/layouts/BaseLayout.astro`:

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

Add to your theme's `footer.php` before `</body>`, or use the **Insert Headers and Footers** plugin and paste the snippet in the Footer section:

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

### Basic usage

```javascript
analytics.track('event_name');
analytics.track('event_name', { key: 'value' });
```

### Common examples

```javascript
// Button click
document.querySelector('#cta').addEventListener('click', () => {
  analytics.track('cta_click', { label: 'Get Started' });
});

// Form submission
document.querySelector('form').addEventListener('submit', () => {
  analytics.track('form_submit', { form: 'contact' });
});

// Purchase / conversion
analytics.track('purchase', {
  product: 'Pro Plan',
  price: 29.99,
  currency: 'USD',
});

// File download
document.querySelectorAll('a[href$=".pdf"]').forEach(link => {
  link.addEventListener('click', () => {
    analytics.track('file_download', { file: link.href });
  });
});

// Video play
videoElement.addEventListener('play', () => {
  analytics.track('video_play', { title: 'Product Demo', duration: 120 });
});

// Search
analytics.track('search', { query: searchInput.value });

// Outbound link
document.querySelectorAll('a[href^="http"]').forEach(link => {
  link.addEventListener('click', () => {
    analytics.track('outbound_click', { url: link.href });
  });
});
```

### React / Next.js

```tsx
// Inline handler
<button onClick={() => analytics.track('signup_click', { plan: 'pro' })}>
  Sign up
</button>

// useEffect for page-specific events
useEffect(() => {
  analytics.track('page_view_custom', { section: 'pricing' });
}, []);
```

### Vue 3

```js
// In a component method
methods: {
  handleSignup() {
    analytics.track('signup_click', { source: 'hero' });
  }
}
```

### TypeScript declaration

Add this to a `global.d.ts` file in your project to get type hints:

```typescript
interface Analytics {
  track: (event: string, data?: Record<string, unknown>) => void;
}

declare const analytics: Analytics;
```

---

## API Reference

All protected endpoints require an `Authorization: Bearer <token>` header. Obtain a token by calling `POST /api/auth/login`.

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Register (requires `ALLOW_SIGNUP=true`) |
| `POST` | `/api/auth/login` | — | Login with username + password |
| `POST` | `/api/auth/verify-email` | — | Verify email with token from email |
| `GET`  | `/api/auth/me` | ✓ | Get current user info |
| `POST` | `/api/auth/2fa/setup` | ✓ | Begin 2FA setup, returns QR code |
| `POST` | `/api/auth/2fa/confirm` | ✓ | Confirm 2FA with TOTP code |
| `POST` | `/api/auth/2fa/disable` | ✓ | Disable 2FA (requires password) |

### Websites

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/websites` | ✓ | List websites (own, or all if admin) |
| `POST` | `/api/websites` | ✓ | Create a website |
| `DELETE` | `/api/websites/:id` | ✓ | Delete a website and all its data |

### Tracking (public — called from visitor browsers)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analytics/track/pageview` | Track a page view |
| `POST` | `/api/analytics/track/event` | Track a custom event |

### Dashboard

All accept `?period=24h` (default), `?period=7d`, or `?period=30d`.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/dashboard/:id/stats` | ✓ | Overview stats |
| `GET` | `/api/dashboard/:id/pages` | ✓ | Top pages |
| `GET` | `/api/dashboard/:id/referrers` | ✓ | Traffic sources |
| `GET` | `/api/dashboard/:id/devices` | ✓ | Device breakdown |
| `GET` | `/api/dashboard/:id/browsers` | ✓ | Browser breakdown |
| `GET` | `/api/dashboard/:id/countries` | ✓ | Country breakdown |
| `GET` | `/api/dashboard/:id/realtime` | ✓ | Live activity (last 5 minutes) |
| `GET` | `/api/analytics/data/:id/ips` | ✓ | Raw visitor IPs |

### Admin (admin role required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin` | List all users |
| `POST` | `/api/admin/:id/approve` | Approve a user |
| `POST` | `/api/admin/:id/revoke` | Revoke user access |
| `POST` | `/api/admin/:id/role` | Change user role |
| `DELETE` | `/api/admin/:id` | Delete a user |
| `GET` | `/api/admin/websites` | List all websites (all users) |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Check backend status |

---

## Updating

```bash
# On your local machine
git pull

# Copy backend source to server
scp -r backend/src robin@yourserver:~/web-analytics-backend/
scp backend/package.json robin@yourserver:~/web-analytics-backend/
scp backend/prisma/schema.prisma robin@yourserver:~/web-analytics-backend/prisma/

# Copy frontend source to server
scp -r frontend/src robin@yourserver:~/web-analytics-frontend/
scp frontend/package.json robin@yourserver:~/web-analytics-frontend/

# On the server
ssh robin@yourserver

cd ~/web-analytics-backend
npm install
npx prisma generate
npx prisma db push
npm run build && pm2 restart web-analytics-backend

cd ~/web-analytics-frontend
npm install
npm run build && pm2 restart web-analytics-frontend
```

---

## Troubleshooting

**Tracker script returns 404**

The script is served from the backend at `/tracker.js`. Check that `https://analytics.yourdomain.com/tracker.js` is reachable.

**CORS error on tracking requests**

Make sure the domain is registered under **Websites** in the dashboard — hostname only, no `https://` prefix or trailing slash. No restart needed after adding.

**POST requests hang through Apache**

Enable the headers module and add proxy directives:

```bash
sudo a2enmod headers
sudo systemctl restart apache2
```

Add to your vhost:
```apache
SetEnv proxy-nokeepalive 1
ProxyTimeout 60
```

**Country shows as Unknown**

Visitors on private networks (192.168.x.x, 10.x.x.x, localhost) always show as Unknown — this is correct since geoip-lite can't resolve private IPs. Test from a device on mobile data or outside your network.

**Login redirects back to /login**

The `NEXTAUTH_SECRET` in `backend/.env` and `frontend/.env.local` must be exactly identical. Check:

```bash
grep NEXTAUTH_SECRET ~/web-analytics-backend/.env
grep NEXTAUTH_SECRET ~/web-analytics-frontend/.env.local
```

**No data appearing in the dashboard**

Open DevTools console on the tracked site. You should see:
```
[Analytics] Tracker initialized for website YOUR_WEBSITE_ID
```
If missing, the script isn't loading — check the `src` URL and your CSP. If present but no data appears, check the Network tab for failed POST requests to `/api/analytics/track/pageview`.

**Mixed content error**

The analytics backend must be HTTPS if your website is HTTPS. HTTP endpoints are blocked by modern browsers on HTTPS pages.

**PM2 not starting on reboot**

```bash
pm2 startup   # follow the printed command
pm2 save
```
