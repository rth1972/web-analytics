import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import analyticsRoutes from './routes/analytics.js';
import websiteRoutes from './routes/websites.js';
import dashboardRoutes from './routes/dashboard.js';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3456;

// Always allowed origins (dashboard itself)
const ALWAYS_ALLOWED = [
  'https://dashboard.robintehofstee.com',
];

// Dynamic CORS: allow dashboard + any registered website domain
app.use(cors({
  origin: async (origin, callback) => {
    // Allow requests with no origin (e.g. curl, server-to-server)
    if (!origin) return callback(null, true);

    // Always allow the dashboard
    if (ALWAYS_ALLOWED.includes(origin)) return callback(null, origin);

    try {
      const hostname = new URL(origin).hostname;
      const website = await prisma.website.findFirst({
        where: { domain: hostname, isActive: true },
      });
      if (website) {
        callback(null, origin);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    } catch {
      callback(new Error(`CORS: invalid origin ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Serve static files (tracker.js)
app.use(express.static('.'));

app.use((req, res, next) => {
  (req as any).prisma = prisma;
  next();
});

app.use('/api/analytics', analyticsRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
