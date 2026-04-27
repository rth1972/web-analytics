import { Router } from 'express';

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStartDate(period: string): Date {
  const d = new Date();
  if (period === '7d') d.setDate(d.getDate() - 7);
  else if (period === '30d') d.setDate(d.getDate() - 30);
  else d.setHours(d.getHours() - 24);
  return d;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

router.get('/:websiteId/stats', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const { websiteId } = req.params;
    const period = (req.query.period as string) || '24h';
    const startDate = getStartDate(period);

    const [pageViews, sessions, events, allPageViews, bounceSessions] = await Promise.all([
      prisma.pageView.count({ where: { websiteId, timestamp: { gte: startDate } } }),
      prisma.session.findMany({ where: { websiteId, startTime: { gte: startDate } }, select: { id: true, pageViews: true, startTime: true, endTime: true } }),
      prisma.event.count({ where: { websiteId, timestamp: { gte: startDate } } }),
      prisma.pageView.findMany({ where: { websiteId, timestamp: { gte: startDate } }, select: { timestamp: true } }),
      prisma.session.count({ where: { websiteId, startTime: { gte: startDate }, pageViews: 1 } }),
    ]);

    // Group by date manually
    const dayMap = new Map<string, number>();
    for (const pv of allPageViews) {
      const date = new Date(pv.timestamp).toISOString().split('T')[0];
      dayMap.set(date, (dayMap.get(date) || 0) + 1);
    }
    const pageViewsByDay = Array.from(dayMap.entries()).map(([date, views]) => ({ date, views }));

    const uniqueVisitors = sessions.length;
    const bounceRate = uniqueVisitors > 0 ? Math.round((bounceSessions / uniqueVisitors) * 100) : 0;

    let avgDuration = 0;
    const sessionsWithDuration = sessions.filter((s: any) => s.endTime && s.startTime);
    if (sessionsWithDuration.length > 0) {
      const totalMs = sessionsWithDuration.reduce((sum: number, s: any) => sum + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()), 0);
      avgDuration = Math.round(totalMs / sessionsWithDuration.length / 1000);
    }

    res.json({ pageViews, uniqueVisitors, events, bounceRate, avgDuration, pageViewsByDay, period });
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

    const pageViews = await prisma.pageView.findMany({
      where: { websiteId, timestamp: { gte: startDate } },
      select: { page: true },
    });

    const pageMap = new Map<string, number>();
    for (const pv of pageViews) {
      pageMap.set(pv.page, (pageMap.get(pv.page) || 0) + 1);
    }

    const result = Array.from(pageMap.entries())
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    res.json(result);
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

    const pageViews = await prisma.pageView.findMany({
      where: { websiteId, timestamp: { gte: startDate } },
      select: { referrer: true },
    });

    const refMap = new Map<string, number>();
    for (const pv of pageViews) {
      const ref = pv.referrer || 'Direct';
      refMap.set(ref, (refMap.get(ref) || 0) + 1);
    }

    const result = Array.from(refMap.entries())
      .map(([referrer, visits]) => ({ referrer, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

    res.json(result);
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

    const pageViews = await prisma.pageView.findMany({
      where: { websiteId, timestamp: { gte: startDate } },
      select: { device: true },
    });

    const deviceMap = new Map<string, number>();
    for (const pv of pageViews) {
      const device = pv.device || 'Unknown';
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    }

    const result = Array.from(deviceMap.entries())
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);

    res.json(result);
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

    const pageViews = await prisma.pageView.findMany({
      where: { websiteId, timestamp: { gte: startDate } },
      select: { browser: true },
    });

    const browserMap = new Map<string, number>();
    for (const pv of pageViews) {
      const browser = pv.browser || 'Unknown';
      browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
    }

    const result = Array.from(browserMap.entries())
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    res.json(result);
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

    const pageViews = await prisma.pageView.findMany({
      where: { websiteId, timestamp: { gte: startDate } },
      select: { country: true, sessionId: true },
    });

    const countryMap = new Map<string, Set<string>>();
    for (const pv of pageViews) {
      const country = pv.country || 'Unknown';
      if (!countryMap.has(country)) countryMap.set(country, new Set());
      if (pv.sessionId) countryMap.get(country)!.add(pv.sessionId);
    }

    const result = Array.from(countryMap.entries())
      .map(([country, sessions]) => ({ country, visitors: sessions.size }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10);

    res.json(result);
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
    const since = new Date(Date.now() - 5 * 60 * 1000);

    const [activeVisitors, recentPageViews, recentEvents] = await Promise.all([
      prisma.session.count({ where: { websiteId, endTime: { gte: since } } }),
      prisma.pageView.findMany({ where: { websiteId, timestamp: { gte: since } }, orderBy: { timestamp: 'desc' }, take: 20, select: { page: true, country: true, device: true, browser: true, timestamp: true, sessionId: true } }),
      prisma.event.findMany({ where: { websiteId, timestamp: { gte: since } }, orderBy: { timestamp: 'desc' }, take: 10, select: { name: true, category: true, timestamp: true } }),
    ]);

    const realtimePageViews = await prisma.pageView.findMany({ where: { websiteId, timestamp: { gte: since } }, select: { page: true } });

    const pageMap = new Map<string, number>();
    for (const pv of realtimePageViews) {
      pageMap.set(pv.page, (pageMap.get(pv.page) || 0) + 1);
    }

    const topPages = Array.from(pageMap.entries())
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({ activeVisitors, recentPageViews, recentEvents, topPages });
  } catch (error) {
    console.error('Realtime error:', error);
    res.status(500).json({ error: 'Failed to fetch realtime data' });
  }
});

export default router;