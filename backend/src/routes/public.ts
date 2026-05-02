import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

// Public dashboard - no auth required, just token
router.get('/:token', async (req, res) => {
  try {
    const prisma = (req as any).prisma as PrismaClient;
    const { token } = req.params;
    const period = (req.query.period as string) || '7d';

    const website = await prisma.website.findFirst({
      where: { publicToken: token, publicEnabled: true },
    });

    if (!website) return res.status(404).json({ error: 'Not found' });

    const getStartDate = (p: string) => {
      const d = new Date();
      if (p === '7d') d.setDate(d.getDate() - 7);
      else if (p === '30d') d.setDate(d.getDate() - 30);
      else d.setHours(d.getHours() - 24);
      return d;
    };

    const startDate = getStartDate(period);

    const [pageViews, sessions, events] = await Promise.all([
      prisma.pageView.count({ where: { websiteId: website.id, timestamp: { gte: startDate } } }),
      prisma.session.findMany({ where: { websiteId: website.id, startTime: { gte: startDate } } }),
      prisma.event.count({ where: { websiteId: website.id, timestamp: { gte: startDate } } }),
    ]);

    const pageViewsByDay: Record<string, number> = {};
    const pvResult = await prisma.pageView.findMany({
      where: { websiteId: website.id, timestamp: { gte: startDate } },
      select: { timestamp: true },
    });
    for (const pv of pvResult) {
      const date = new Date(pv.timestamp).toISOString().split('T')[0];
      pageViewsByDay[date] = (pageViewsByDay[date] || 0) + 1;
    }

    const byDay = Object.entries(pageViewsByDay)
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const uniqueVisitors = sessions.length;
    const bounceRate = uniqueVisitors > 0
      ? Math.round((sessions.filter(s => s.pageViews === 1).length / uniqueVisitors) * 100)
      : 0;

    res.json({
      website: { name: website.name, domain: website.domain },
      stats: { pageViews, uniqueVisitors, events, bounceRate, pageViewsByDay: byDay },
    });
  } catch (err) {
    console.error('Public dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
