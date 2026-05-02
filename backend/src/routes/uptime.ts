import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function ownsWebsite(prisma: any, websiteId: string, userId: string, role: string) {
  if (role === 'ADMIN') return prisma.website.findUnique({ where: { id: websiteId } });
  return prisma.website.findFirst({ where: { id: websiteId, userId } });
}

// List uptime checks
router.get('/:websiteId', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user   = (req as any).user;
    const { websiteId } = req.params;

    if (!await ownsWebsite(prisma, websiteId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const checks = await prisma.uptimeCheck.findMany({
      where: { websiteId },
      include: {
        results: {
          orderBy: { checkedAt: 'desc' },
          take: 48, // last 48 checks
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate uptime % for each check
    const enriched = checks.map((c: any) => {
      const total = c.results.length;
      const up    = c.results.filter((r: any) => r.status === 'UP').length;
      const uptimePct = total > 0 ? Math.round((up / total) * 1000) / 10 : null;
      const avgResponse = total > 0
        ? Math.round(c.results.filter((r: any) => r.responseTime).reduce((s: number, r: any) => s + r.responseTime, 0) / total)
        : null;

      return { ...c, uptimePct, avgResponseTime: avgResponse };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch uptime checks' });
  }
});

// Create uptime check
router.post('/:websiteId', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user   = (req as any).user;
    const { websiteId } = req.params;
    const { url, intervalMins } = req.body;

    if (!await ownsWebsite(prisma, websiteId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!url) return res.status(400).json({ error: 'url is required' });

    const check = await prisma.uptimeCheck.create({
      data: {
        websiteId,
        url,
        intervalMins: Number(intervalMins) || 5,
      },
    });

    res.json(check);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create uptime check' });
  }
});

// Toggle enabled
router.patch('/:websiteId/:checkId/toggle', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user   = (req as any).user;
    const { websiteId, checkId } = req.params;

    if (!await ownsWebsite(prisma, websiteId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const check = await prisma.uptimeCheck.findUnique({ where: { id: checkId } });
    if (!check) return res.status(404).json({ error: 'Check not found' });

    const updated = await prisma.uptimeCheck.update({
      where: { id: checkId },
      data: { enabled: !check.enabled },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle uptime check' });
  }
});

// Delete uptime check
router.delete('/:websiteId/:checkId', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user   = (req as any).user;
    const { websiteId, checkId } = req.params;

    if (!await ownsWebsite(prisma, websiteId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.uptimeCheck.delete({ where: { id: checkId } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete uptime check' });
  }
});

export default router;
