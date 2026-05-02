import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function ownsWebsite(prisma: any, websiteId: string, userId: string, role: string) {
  if (role === 'ADMIN') return prisma.website.findUnique({ where: { id: websiteId } });
  return prisma.website.findFirst({ where: { id: websiteId, userId } });
}

// ── Goals ─────────────────────────────────────────────────────────────────────

router.get('/:websiteId', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user   = (req as any).user;
    const { websiteId } = req.params;

    if (!await ownsWebsite(prisma, websiteId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const goals = await prisma.goal.findMany({
      where: { websiteId },
      include: {
        _count: { select: { conversions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(goals);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

router.post('/:websiteId', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user   = (req as any).user;
    const { websiteId } = req.params;
    const { name, type, value } = req.body;

    if (!await ownsWebsite(prisma, websiteId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!name || !type || !value) {
      return res.status(400).json({ error: 'name, type and value are required' });
    }

    const goal = await prisma.goal.create({
      data: { websiteId, name, type, value },
    });

    res.json(goal);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

router.delete('/:websiteId/:goalId', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user   = (req as any).user;
    const { websiteId, goalId } = req.params;

    if (!await ownsWebsite(prisma, websiteId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.goal.delete({ where: { id: goalId } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// Goal conversion stats
router.get('/:websiteId/:goalId/stats', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user   = (req as any).user;
    const { websiteId, goalId } = req.params;
    const period = (req.query.period as string) || '30d';

    if (!await ownsWebsite(prisma, websiteId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const d = new Date();
    if (period === '7d')  d.setDate(d.getDate() - 7);
    else if (period === '30d') d.setDate(d.getDate() - 30);
    else d.setHours(d.getHours() - 24);

    const [totalSessions, conversions] = await Promise.all([
      prisma.session.count({ where: { websiteId, startTime: { gte: d } } }),
      prisma.goalConversion.findMany({
        where: { goalId, timestamp: { gte: d } },
        select: { timestamp: true },
      }),
    ]);

    const conversionRate = totalSessions > 0
      ? Math.round((conversions.length / totalSessions) * 100 * 10) / 10
      : 0;

    // Group by day
    const dayMap = new Map<string, number>();
    for (const c of conversions) {
      const date = new Date(c.timestamp).toISOString().split('T')[0];
      dayMap.set(date, (dayMap.get(date) || 0) + 1);
    }
    const byDay = Array.from(dayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({ total: conversions.length, conversionRate, byDay });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch goal stats' });
  }
});

export default router;
