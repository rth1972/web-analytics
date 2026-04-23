import { Router } from 'express';

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStartDate(period: string): Date {
  const d = new Date();
  if (period === '7d')  d.setDate(d.getDate() - 7);
  else if (period === '30d') d.setDate(d.getDate() - 30);
  else d.setHours(d.getHours() - 24);   // default: 24h
  return d;
}

// SQLite $queryRaw returns BigInt for COUNT — convert the whole result to plain JS
function toPlain(rows: any[]): any[] {
  return JSON.parse(
    JSON.stringify(rows, (_key, val) =>
      typeof val === 'bigint' ? Number(val) : val
    )
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────

router.get('/:websiteId/stats', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const { websiteId } = req.params;
    const period = (req.query.period as string) || '24h';
    const startDate = getStartDate(period);

    const [pageViews, sessions, events, pageViewsByDay, bounceSessions] = await Promise.all([
      prisma.pageView.count({
        where: { websiteId, timestamp: { gte: startDate } },
      }),
      prisma.session.findMany({
        where: { websiteId, startTime: { gte: startDate } },
        select: { id: true, pageViews: true, startTime: true, endTime: true },
      }),
      prisma.event.count({
        where: { websiteId, timestamp: { gte: startDate } },
      }),
      prisma.$queryRaw<{ date: string; views: bigint }[]>`
        SELECT date(timestamp) as date, COUNT(*) as views
        FROM PageView
        WHERE websiteId = ${websiteId} AND timestamp >= ${startDate}
        GROUP BY date(timestamp)
        ORDER BY date
      `,
      prisma.session.count({
        where: { websiteId, startTime: { gte: startDate }, pageViews: 1 },
      }),
    ]);

    const uniqueVisitors = sessions.length;
    const bounceRate = uniqueVisitors > 0
      ? Math.round((bounceSessions / uniqueVisitors) * 100)
      : 0;

    // avg session duration in seconds
    let avgDuration = 0;
    const sessionsWithDuration = sessions.filter(
      (s: any) => s.endTime && s.startTime
    );
    if (sessionsWithDuration.length > 0) {
      const totalMs = sessionsWithDuration.reduce((sum: number, s: any) => {
        return sum + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime());
      }, 0);
      avgDuration = Math.round(totalMs / sessionsWithDuration.length / 1000);
    }

    res.json({
      pageViews,
      uniqueVisitors,
      events,
      bounceRate,
      avgDuration,
      pageViewsByDay: toPlain(pageViewsByDay as any[]).map((r: any) => ({
        date: r.date,
        views: Number(r.views),
      })),
      period,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── Top Pages ─────────────────────────────────────────────────────────────────

router.get('/:websiteId/pages', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const { websiteId } = req.params;
    const startDate = getStartDate((req.query.period as string) || '24h');

    const rows = await prisma.$queryRaw<{ page: string; views: bigint }[]>`
      SELECT page, COUNT(*) as views
      FROM PageView
      WHERE websiteId = ${websiteId} AND timestamp >= ${startDate}
      GROUP BY page
      ORDER BY views DESC
      LIMIT 10
    `;

    res.json(toPlain(rows as any[]).map((r: any) => ({ page: r.page, views: Number(r.views) })));
  } catch (error) {
    console.error('Pages error:', error);
    res.status(500).json({ error: 'Failed to fetch top pages' });
  }
});

// ── Referrers ─────────────────────────────────────────────────────────────────

router.get('/:websiteId/referrers', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const { websiteId } = req.params;
    const startDate = getStartDate((req.query.period as string) || '24h');

    const rows = await prisma.$queryRaw<{ referrer: string; visits: bigint }[]>`
      SELECT COALESCE(referrer, 'Direct') as referrer, COUNT(*) as visits
      FROM PageView
      WHERE websiteId = ${websiteId} AND timestamp >= ${startDate}
      GROUP BY referrer
      ORDER BY visits DESC
      LIMIT 10
    `;

    res.json(toPlain(rows as any[]).map((r: any) => ({ referrer: r.referrer, visits: Number(r.visits) })));
  } catch (error) {
    console.error('Referrers error:', error);
    res.status(500).json({ error: 'Failed to fetch referrers' });
  }
});

// ── Devices ───────────────────────────────────────────────────────────────────

router.get('/:websiteId/devices', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const { websiteId } = req.params;
    const startDate = getStartDate((req.query.period as string) || '24h');

    const rows = await prisma.$queryRaw<{ device: string; count: bigint }[]>`
      SELECT COALESCE(device, 'Unknown') as device, COUNT(*) as count
      FROM PageView
      WHERE websiteId = ${websiteId} AND timestamp >= ${startDate}
      GROUP BY device
      ORDER BY count DESC
    `;

    res.json(toPlain(rows as any[]).map((r: any) => ({ device: r.device, count: Number(r.count) })));
  } catch (error) {
    console.error('Devices error:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// ── Browsers ──────────────────────────────────────────────────────────────────

router.get('/:websiteId/browsers', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const { websiteId } = req.params;
    const startDate = getStartDate((req.query.period as string) || '24h');

    const rows = await prisma.$queryRaw<{ browser: string; count: bigint }[]>`
      SELECT COALESCE(browser, 'Unknown') as browser, COUNT(*) as count
      FROM PageView
      WHERE websiteId = ${websiteId} AND timestamp >= ${startDate}
      GROUP BY browser
      ORDER BY count DESC
      LIMIT 8
    `;

    res.json(toPlain(rows as any[]).map((r: any) => ({ browser: r.browser, count: Number(r.count) })));
  } catch (error) {
    console.error('Browsers error:', error);
    res.status(500).json({ error: 'Failed to fetch browsers' });
  }
});

// ── Countries ─────────────────────────────────────────────────────────────────

router.get('/:websiteId/countries', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const { websiteId } = req.params;
    const startDate = getStartDate((req.query.period as string) || '24h');

    const rows = await prisma.$queryRaw<{ country: string; visitors: bigint }[]>`
      SELECT COALESCE(country, 'Unknown') as country, COUNT(DISTINCT sessionId) as visitors
      FROM PageView
      WHERE websiteId = ${websiteId} AND timestamp >= ${startDate}
      GROUP BY country
      ORDER BY visitors DESC
      LIMIT 10
    `;

    res.json(toPlain(rows as any[]).map((r: any) => ({ country: r.country, visitors: Number(r.visitors) })));
  } catch (error) {
    console.error('Countries error:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// ── Real-time ─────────────────────────────────────────────────────────────────

router.get('/:websiteId/realtime', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const { websiteId } = req.params;
    const since = new Date(Date.now() - 5 * 60 * 1000); // last 5 minutes

    const [activeVisitors, recentPageViews, recentEvents] = await Promise.all([
      prisma.session.count({
        where: { websiteId, endTime: { gte: since } },
      }),
      prisma.pageView.findMany({
        where: { websiteId, timestamp: { gte: since } },
        orderBy: { timestamp: 'desc' },
        take: 20,
        select: { page: true, country: true, device: true, browser: true, timestamp: true, sessionId: true },
      }),
      prisma.event.findMany({
        where: { websiteId, timestamp: { gte: since } },
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: { name: true, category: true, timestamp: true },
      }),
    ]);

    // page view counts per page in the window
    const pageRows = await prisma.$queryRaw<{ page: string; count: bigint }[]>`
      SELECT page, COUNT(*) as count
      FROM PageView
      WHERE websiteId = ${websiteId} AND timestamp >= ${since}
      GROUP BY page
      ORDER BY count DESC
      LIMIT 5
    `;

    res.json({
      activeVisitors,
      recentPageViews,
      recentEvents,
      topPages: toPlain(pageRows as any[]).map((r: any) => ({ page: r.page, count: Number(r.count) })),
    });
  } catch (error) {
    console.error('Realtime error:', error);
    res.status(500).json({ error: 'Failed to fetch realtime data' });
  }
});

export default router;
