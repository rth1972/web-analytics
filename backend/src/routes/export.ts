import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function ownsWebsite(prisma: any, websiteId: string, userId: string, role: string) {
  if (role === 'ADMIN') return prisma.website.findUnique({ where: { id: websiteId } });
  return prisma.website.findFirst({ where: { id: websiteId, userId } });
}

function getStartDate(period: string): Date {
  const d = new Date();
  if (period === '7d')       d.setDate(d.getDate() - 7);
  else if (period === '30d') d.setDate(d.getDate() - 30);
  else                       d.setHours(d.getHours() - 24);
  return d;
}

function toCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(r =>
      headers.map(h => {
        const v = String(r[h] ?? '').replace(/"/g, '""');
        return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v}"` : v;
      }).join(',')
    ),
  ];
  return lines.join('\n');
}

// Export pageviews
router.get('/:websiteId/pageviews', async (req, res) => {
  try {
    const prisma  = (req as any).prisma;
    const user    = (req as any).user;
    const { websiteId } = req.params;
    const period  = (req.query.period as string) || '30d';
    const format  = (req.query.format as string) || 'csv';

    if (!await ownsWebsite(prisma, websiteId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

  const pageViews = await prisma.pageView.findMany({
    where: { websiteId, timestamp: { gte: getStartDate(period) } },
    select: { page: true, referrer: true, country: true, city: true,
      device: true, browser: true, os: true,
      utmSource: true, utmMedium: true, utmCampaign: true,
      sessionId: true, timestamp: true,
    },
    orderBy: { timestamp: 'desc' },
  });

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="pageviews-${period}.json"`);
    return res.send(JSON.stringify(pageViews, null, 2));
  }

  const rows = pageViews.map((pv: any) => ({
    timestamp: new Date(pv.timestamp).toISOString(),
    page: pv.page,
    referrer: pv.referrer || '',
    country: pv.country || '',
    city: pv.city || '',
    device: pv.device || '',
    browser: pv.browser || '',
    os: pv.os || '',
    utm_source: pv.utmSource || '',
    utm_medium: pv.utmMedium || '',
    utm_campaign: pv.utmCampaign || '',
    session_id: pv.sessionId,
  }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="pageviews-${period}.csv"`);
    return res.send(toCSV(rows));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Export sessions
router.get('/:websiteId/sessions', async (req, res) => {
  try {
    const prisma  = (req as any).prisma;
    const user    = (req as any).user;
    const { websiteId } = req.params;
    const period  = (req.query.period as string) || '30d';
    const format  = (req.query.format as string) || 'csv';

    if (!await ownsWebsite(prisma, websiteId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

  const sessions = await prisma.session.findMany({
    where: { websiteId, startTime: { gte: getStartDate(period) } },
    orderBy: { startTime: 'desc' },
  });

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="sessions-${period}.json"`);
    return res.send(JSON.stringify(sessions, null, 2));
  }

  const rows = sessions.map((s: any) => ({
    session_id: s.id,
    start_time: new Date(s.startTime).toISOString(),
    end_time: s.endTime ? new Date(s.endTime).toISOString() : '',
    page_views: s.pageViews,
    country: s.country || '',
    city: s.city || '',
    device: s.device || '',
    browser: s.browser || '',
    os: s.os || '',
    utm_source: s.utmSource || '',
    utm_medium: s.utmMedium || '',
    utm_campaign: s.utmCampaign || '',
  }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sessions-${period}.csv"`);
    return res.send(toCSV(rows));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to export sessions' });
  }
});

// Export events
router.get('/:websiteId/events', async (req, res) => {
  try {
    const prisma  = (req as any).prisma;
    const user    = (req as any).user;
    const { websiteId } = req.params;
    const period  = (req.query.period as string) || '30d';
    const format  = (req.query.format as string) || 'csv';

    if (!await ownsWebsite(prisma, websiteId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

  const events = await prisma.event.findMany({
    where: { websiteId, timestamp: { gte: getStartDate(period) } },
    orderBy: { timestamp: 'desc' },
  });

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="events-${period}.json"`);
    return res.send(JSON.stringify(events, null, 2));
  }

  const rows = events.map((e: any) => ({
    timestamp: new Date(e.timestamp).toISOString(),
    name: e.name,
    category: e.category || '',
    data: e.data || '',
    session_id: e.sessionId,
  }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="events-${period}.csv"`);
    return res.send(toCSV(rows));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to export events' });
  }
});

export default router;
