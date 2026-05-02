import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import geoip from 'geoip-lite';

const router = Router();

interface PageViewRequest {
  websiteId: string;
  page: string;
  referrer?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  os?: string;
  screenSize?: string;
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

interface EventRequest {
  websiteId: string;
  name: string;
  category?: string;
  data?: Record<string, any>;
  sessionId?: string;
}

function getClientIp(req: any): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.headers['x-real-ip'] as string ||
    req.socket.remoteAddress ||
    ''
  );
}

function getGeo(ip: string): { country: string | null; city: string | null } {
  try {
    if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return { country: null, city: null };
    }
    const geo = geoip.lookup(ip);
    return { country: geo?.country ?? null, city: geo?.city ?? null };
  } catch {
    return { country: null, city: null };
  }
}

router.post('/track/pageview', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const body: PageViewRequest = req.body;

    if (!body.websiteId || !body.page) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sessionId = body.sessionId || uuidv4();
    const ip = getClientIp(req);
    const { country, city } = getGeo(ip);

    await prisma.$transaction([
      prisma.pageView.create({
        data: {
          websiteId:   body.websiteId,
          page:        body.page,
          referrer:    body.referrer,
          userAgent:   body.userAgent,
          country,
          city,
          device:      body.device,
          browser:     body.browser,
          os:          body.os,
          screenSize:  body.screenSize,
          ipAddress:   ip,
          sessionId,
          utmSource:   body.utmSource   || null,
          utmMedium:   body.utmMedium   || null,
          utmCampaign: body.utmCampaign || null,
          utmTerm:     body.utmTerm     || null,
          utmContent:  body.utmContent  || null,
          timestamp:   new Date(),
        },
      }),
      prisma.session.upsert({
        where: { id: sessionId },
        update: { pageViews: { increment: 1 }, endTime: new Date() },
        create: {
          id:          sessionId,
          websiteId:   body.websiteId,
          country,
          city,
          device:      body.device,
          browser:     body.browser,
          os:          body.os,
          utmSource:   body.utmSource   || null,
          utmMedium:   body.utmMedium   || null,
          utmCampaign: body.utmCampaign || null,
          pageViews:   1,
          startTime:   new Date(),
          endTime:     new Date(),
        },
      }),
    ]);

    // Check page-visit goals
    checkPageGoals(prisma, body.websiteId, body.page, sessionId);

    res.json({ success: true, sessionId });
  } catch (error) {
    console.error('PageView error:', error);
    res.status(500).json({ error: 'Failed to track pageview' });
  }
});

router.post('/track/event', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const body: EventRequest = req.body;

    if (!body.websiteId || !body.name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sessionId = body.sessionId || uuidv4();

    await prisma.event.create({
      data: {
        websiteId: body.websiteId,
        name:      body.name,
        category:  body.category,
        data:      body.data ? JSON.stringify(body.data) : null,
        sessionId,
        timestamp: new Date(),
      },
    });

    // Check event goals
    checkEventGoals(prisma, body.websiteId, body.name, sessionId);

    res.json({ success: true, sessionId });
  } catch (error) {
    console.error('Event error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Silently match and record goal conversions
async function checkPageGoals(prisma: any, websiteId: string, page: string, sessionId: string) {
  try {
    const goals = await prisma.goal.findMany({ where: { websiteId, type: 'PAGE_VISIT' } });
    for (const goal of goals) {
      if (page === goal.value || page.startsWith(goal.value)) {
        await prisma.goalConversion.create({ data: { goalId: goal.id, sessionId } });
      }
    }
  } catch {}
}

async function checkEventGoals(prisma: any, websiteId: string, eventName: string, sessionId: string) {
  try {
    const goals = await prisma.goal.findMany({ where: { websiteId, type: 'EVENT', value: eventName } });
    for (const goal of goals) {
      await prisma.goalConversion.create({ data: { goalId: goal.id, sessionId } });
    }
  } catch {}
}

router.get('/data/:websiteId', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const { websiteId } = req.params;
    const { start, end, type } = req.query;

    const where: any = { websiteId };
    if (start || end) {
      where.timestamp = {};
      if (start) where.timestamp.gte = new Date(start as string);
      if (end)   where.timestamp.lte = new Date(end as string);
    }

    let data;
    if (type === 'events') {
      data = await prisma.event.findMany({ where, orderBy: { timestamp: 'desc' }, take: 1000 });
    } else {
      data = await prisma.pageView.findMany({ where, orderBy: { timestamp: 'desc' }, take: 1000 });
    }

    res.json(data);
  } catch (error) {
    console.error('Data fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

router.get('/data/:websiteId/ips', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const { websiteId } = req.params;
    const { country } = req.query;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const where: any = { websiteId, timestamp: { gte: since } };
    if (country && country !== 'all') where.country = country as string;

    const visitors = await prisma.pageView.findMany({
      where,
      select: { ipAddress: true, country: true, city: true, sessionId: true, timestamp: true },
      orderBy: { timestamp: 'desc' },
    });

    const ipMap = new Map<string, { country: string | null; city: string | null; count: number }>();
    for (const v of visitors) {
      const ip = v.ipAddress || 'Unknown';
      const existing = ipMap.get(ip);
      if (existing) existing.count++;
      else ipMap.set(ip, { country: v.country, city: v.city, count: 1 });
    }

    res.json(Array.from(ipMap.entries()).map(([ipAddress, d]) => ({ ipAddress, ...d })));
  } catch (error) {
    console.error('IPs fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch visitor IPs' });
  }
});

export default router;
