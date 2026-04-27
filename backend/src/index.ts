import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import analyticsRoutes from './routes/analytics.js';
import websiteRoutes from './routes/websites.js';
import dashboardRoutes from './routes/dashboard.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3456;

const ALWAYS_ALLOWED = [
  'https://analytics.robintehofstee.com',
  'https://dashboard.robintehofstee.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

app.use(cors({
  origin: async (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALWAYS_ALLOWED.includes(origin)) return callback(null, origin);

    // Allow any local network origin
    try {
      const h = new URL(origin).hostname;
      if (
        h === 'localhost' ||
        h.startsWith('127.') ||
        h.startsWith('192.168.') ||
        h.startsWith('10.') ||
        h.startsWith('172.')
      ) {
        return callback(null, origin);
      }
    } catch {}

    // Allow origins whose hostname matches a registered website domain
    try {
      const hostname = new URL(origin).hostname;
      const website = await prisma.website.findFirst({
        where: { domain: hostname, isActive: true },
      });
      if (website) callback(null, origin);
      else callback(new Error(`CORS: origin ${origin} not allowed`));
    } catch {
      callback(new Error(`CORS: invalid origin ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(express.static('.'));

app.use((req, _res, next) => {
  (req as any).prisma = prisma;
  next();
});

app.use('/api/auth',      authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/websites',  websiteRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin',     adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Analytics backend running on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
