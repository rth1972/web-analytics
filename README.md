# Web Analytics

A self-hosted, privacy-focused web analytics platform. Tracks page views, sessions, devices, countries, referrers, and custom events — with a real-time dashboard.

## Table of Contents

- [Architecture](#architecture)
- [Requirements](#requirements)
- [Backend Setup](#backend-setup)
- [Dashboard Setup](#dashboard-setup)
- [Reverse Proxy & HTTPS](#reverse-proxy--https)
  - [Apache](#apache)
  - [Nginx](#nginx)
- [Adding a Website to Track](#adding-a-website-to-track)
- [Installing the Tracker](#installing-the-tracker)
  - [Next.js App](#nextjs-app)
  - [Plain HTML](#plain-html)
  - [Any JavaScript Framework](#any-javascript-framework)
  - [WordPress](#wordpress)
- [Content Security Policy](#content-security-policy)
  - [Next.js CSP](#nextjs-csp)
  - [Apache CSP Header](#apache-csp-header)
  - [Nginx CSP Header](#nginx-csp-header)
- [Custom Event Tracking](#custom-event-tracking)
- [API Reference](#api-reference)
- [Updating](#updating)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```
web-analytics/
├── backend/      # Node.js + Express + Prisma API (port 3456)
└── frontend/     # Next.js dashboard (port 3000)
```

The backend exposes a REST API and serves `tracker.js`. The dashboard is a separate Next.js app that reads from the backend. Websites you want to track load `tracker.js` and POST data to the backend API.

---

## Requirements

- Node.js 18 or higher
- npm
- A server with a public IP (for tracking websites accessible on the internet)
- A domain name (for HTTPS, required by modern browsers)

---

## Backend Setup

```bash
cd backend
npm install
npx prisma generate
npx prisma db push       # creates the SQLite database
npm run dev              # starts on http://localhost:3456
```

Verify it's running:

```bash
curl http://localhost:3456/api/health
# {"status":"ok","timestamp":"..."}
```

### Running in Production with PM2

```bash
npm install -g pm2
pm2 start "npm run dev" --name analytics-backend
pm2 save
pm2 startup              # follow the printed command to enable auto-start on reboot
```

### Environment Variables

Create a `.env` file in the `backend/` directory if you want to customise the port:

```env
PORT=3456
```

---

## Dashboard Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=https://analytics.yourdomain.com
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://dashboard.yourdomain.com
AUTH_USERNAME=your-username
AUTH_PASSWORD=your-password
```

Replace the values with your own:

- `NEXT_PUBLIC_API_URL` — public URL of your backend
- `NEXTAUTH_SECRET` — a random secret used to sign session tokens, generate one with `openssl rand -base64 32`
- `NEXTAUTH_URL` — public URL of your dashboard
- `AUTH_USERNAME` — the username you want to log in with
- `AUTH_PASSWORD` — the password you want to log in with

To change your username or password later, update `.env.local` and restart the dashboard:

```bash
pm2 restart analytics-frontend
```

```bash
npm run build
npm start                # starts on http://localhost:3000
```

### Running in Production with PM2

```bash
pm2 start "npm start" --name analytics-frontend
pm2 save
```

---

## Reverse Proxy & HTTPS

Modern browsers block tracking requests from HTTPS pages to HTTP endpoints. You need HTTPS on both the backend and dashboard. The examples below use subdomains — replace with your own domain.

| Service   | Subdomain example                        |
|-----------|------------------------------------------|
| Backend   | `analytics.yourdomain.com`               |
| Dashboard | `dashboard.yourdomain.com`               |

### Apache

Install Certbot:

```bash
sudo apt install apache2 certbot python3-certbot-apache -y
sudo a2enmod proxy proxy_http headers rewrite ssl
```

**Backend vhost** — `/etc/apache2/sites-available/analytics.conf`:

```apache
<VirtualHost *:80>
    ServerName analytics.yourdomain.com

    ProxyPreserveHost On
    ProxyPass / http://localhost:3456/
    ProxyPassReverse / http://localhost:3456/

    RequestHeader set X-Forwarded-For "%{REMOTE_ADDR}s"
</VirtualHost>
```

**Dashboard vhost** — `/etc/apache2/sites-available/analytics-dashboard.conf`:

```apache
<VirtualHost *:80>
    ServerName dashboard.yourdomain.com

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

Enable and get SSL certificates:

```bash
sudo a2ensite analytics.conf analytics-dashboard.conf
sudo systemctl reload apache2
sudo certbot --apache -d analytics.yourdomain.com -d dashboard.yourdomain.com
```

> Make sure DNS A records for both subdomains point to your server's public IP before running Certbot.

### Nginx

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

**Backend vhost** — `/etc/nginx/sites-available/analytics`:

```nginx
server {
    server_name analytics.yourdomain.com;

    location / {
        proxy_pass http://localhost:3456;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Dashboard vhost** — `/etc/nginx/sites-available/analytics-dashboard`:

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

Enable and get SSL certificates:

```bash
sudo ln -s /etc/nginx/sites-available/analytics /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/analytics-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d analytics.yourdomain.com -d dashboard.yourdomain.com
```

---

## Adding a Website to Track

Open the dashboard at `https://dashboard.yourdomain.com` and go to **Websites → Add Website**.

- **Name** — a human-readable label, e.g. `My Blog`
- **Domain** — the hostname only, without protocol or trailing slash, e.g. `myblog.com`

The domain must match the hostname of the site exactly. This is used for automatic CORS allowlisting — once a domain is registered, its origin is automatically allowed to send tracking data.

You can also register a website via the API directly:

```bash
curl -X POST https://analytics.yourdomain.com/api/websites \
  -H "Content-Type: application/json" \
  -d '{"name": "My Blog", "domain": "myblog.com"}'
```

The response contains the `id` you will use as `data-website-id` in the tracker snippet.

---

## Installing the Tracker

Once a website is registered, go to **Websites → Get Snippet** in the dashboard to get a pre-filled snippet for that site. Or follow the instructions below.

### Next.js App

Use the `next/script` component so Next.js handles loading strategy and hydration correctly.

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

**Pages Router** — add to `pages/_app.tsx`:

```tsx
import Script from 'next/script'
import type { AppProps } from 'next/app'

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
# .env.local
NEXT_PUBLIC_ANALYTICS_URL=https://analytics.yourdomain.com
NEXT_PUBLIC_ANALYTICS_WEBSITE_ID=YOUR_WEBSITE_ID
```

```tsx
<Script
  src={`${process.env.NEXT_PUBLIC_ANALYTICS_URL}/tracker.js`}
  data-website-id={process.env.NEXT_PUBLIC_ANALYTICS_WEBSITE_ID}
  data-api-url={process.env.NEXT_PUBLIC_ANALYTICS_URL}
  strategy="afterInteractive"
/>
```

The tracker automatically handles client-side navigation — page views are fired on every route change without any extra configuration.

### Plain HTML

Add the script tag before the closing `</body>` tag on every page you want to track:

```html
<script
  src="https://analytics.yourdomain.com/tracker.js"
  data-website-id="YOUR_WEBSITE_ID"
  data-api-url="https://analytics.yourdomain.com"
  defer
></script>
```

For multi-page sites, add this to a shared layout file or template so it is included on every page automatically.

### Any JavaScript Framework

The snippet is the same regardless of framework — React, Vue, Svelte, Astro, etc. Add it once to your root layout or `index.html`.

**Vue 3** — `index.html`:

```html
<script
  src="https://analytics.yourdomain.com/tracker.js"
  data-website-id="YOUR_WEBSITE_ID"
  data-api-url="https://analytics.yourdomain.com"
  defer
></script>
```

For SPAs with client-side routing (Vue Router, React Router, etc.) the tracker patches `history.pushState` and `history.replaceState` automatically, so page views are tracked on every navigation without any extra setup.

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

Add the snippet to your theme's `footer.php` file, just before `</body>`:

```php
<script
  src="https://analytics.yourdomain.com/tracker.js"
  data-website-id="YOUR_WEBSITE_ID"
  data-api-url="https://analytics.yourdomain.com"
  defer
></script>
```

Or use a plugin like **Insert Headers and Footers** to add the snippet without editing theme files. Paste the snippet into the **Footer** section.

---

## Content Security Policy

If your website sets a Content Security Policy you need to explicitly allow the analytics domain. Below are examples for common setups.

### Next.js CSP

In `next.config.js` / `next.config.mjs`, add `https://analytics.yourdomain.com` to both `script-src` and `connect-src`:

```js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://analytics.yourdomain.com",
            "style-src 'self' 'unsafe-inline'",
            "connect-src 'self' https://analytics.yourdomain.com",
            // add any other directives your app needs
          ].join('; '),
        },
      ],
    },
  ]
},
```

### Apache CSP Header

In your site's Apache vhost:

```apache
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://analytics.yourdomain.com; connect-src 'self' https://analytics.yourdomain.com"
```

### Nginx CSP Header

In your site's Nginx server block:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://analytics.yourdomain.com; connect-src 'self' https://analytics.yourdomain.com";
```

---

## Custom Event Tracking

Once `tracker.js` is loaded, a global `analytics` object is available. You can call it anywhere in your JavaScript.

### Track a custom event

```javascript
analytics.track('event_name', { key: 'value' });
```

Examples:

```javascript
// Track a button click
document.querySelector('#signup').addEventListener('click', () => {
  analytics.track('signup_click', { plan: 'pro' });
});

// Track a form submission
analytics.track('form_submit', { form: 'contact' });

// Track a purchase
analytics.track('purchase', { product: 'Widget', price: 29.99, currency: 'USD' });

// Track a video play
analytics.track('video_play', { title: 'Introduction', duration: 120 });
```

### Identify a user

```javascript
analytics.identify('user-123', {
  email: 'user@example.com',
  plan: 'pro',
});
```

The user ID and data are stored in `sessionStorage` and can be used to correlate events with a specific user within a session.

---

## API Reference

### Websites

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/websites` | List all websites |
| `POST` | `/api/websites` | Create a website |
| `DELETE` | `/api/websites/:id` | Delete a website and all its data |

### Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analytics/track/pageview` | Track a page view |
| `POST` | `/api/analytics/track/event` | Track a custom event |
| `GET` | `/api/analytics/data/:websiteId` | Get raw analytics data |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/:websiteId/stats` | Stats overview (page views, visitors, bounce rate, etc.) |
| `GET` | `/api/dashboard/:websiteId/pages` | Top pages |
| `GET` | `/api/dashboard/:websiteId/referrers` | Traffic sources |
| `GET` | `/api/dashboard/:websiteId/devices` | Device breakdown |
| `GET` | `/api/dashboard/:websiteId/browsers` | Browser breakdown |
| `GET` | `/api/dashboard/:websiteId/countries` | Country breakdown |
| `GET` | `/api/dashboard/:websiteId/realtime` | Live activity (last 5 minutes) |

All dashboard endpoints accept an optional `?period=` query parameter: `24h` (default), `7d`, or `30d`.

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Check backend is running |

---

## Updating

Pull the latest changes and redeploy:

```bash
# On your local machine
git pull

# Sync backend
rsync -av --exclude='node_modules' --exclude='prisma/dev.db' backend/ user@yourserver:~/web-analytics-backend/

# Sync frontend
rsync -av --exclude='node_modules' --exclude='.next' frontend/ user@yourserver:~/web-analytics-frontend/

# On the server
ssh user@yourserver

cd ~/web-analytics-backend
npm install
npx prisma generate
npx prisma db push
pm2 restart analytics-backend

cd ~/web-analytics-frontend
npm install
npm run build
pm2 restart analytics-frontend
```

---

## Troubleshooting

**Tracker script returns 404**

The script is served from the backend at `/tracker.js`. Make sure the backend is running and `https://analytics.yourdomain.com/tracker.js` is reachable in your browser.

**CORS error on tracking requests**

Make sure the domain of the website you are tracking is registered in the dashboard under **Websites**. The domain must be the hostname only — `myblog.com`, not `https://myblog.com`. After adding the website, no server restart is needed.

**Country shows as Unknown**

The `geoip-lite` package is required on the backend for country detection:

```bash
cd ~/web-analytics-backend
npm install geoip-lite
npm install --save-dev @types/geoip-lite
pm2 restart analytics-backend
```

Country lookup is based on the visitor's IP address. Visitors on private/local networks (192.168.x.x, 10.x.x.x, localhost) will always show as Unknown.

**No data appearing in the dashboard**

Open your browser's DevTools console on the tracked website. You should see:

```
[Analytics] Tracker v1.0.0 initialized for website YOUR_WEBSITE_ID
```

If this line is missing, the script is not loading — check the `src` URL and your CSP. If the line is present but data is missing, check the Network tab for failed POST requests to `/api/analytics/track/pageview`.

**Mixed content error**

If your website is served over HTTPS, the analytics backend must also be HTTPS. HTTP endpoints are blocked by modern browsers on HTTPS pages. Follow the [Reverse Proxy & HTTPS](#reverse-proxy--https) section to set up SSL.

**PM2 process not starting on reboot**

Run `pm2 startup` and execute the command it prints, then run `pm2 save` to persist the current process list.
