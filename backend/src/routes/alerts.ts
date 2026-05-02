import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function ownsWebsite(prisma: any, websiteId: string, userId: string, role: string) {
  if (role === 'ADMIN') return prisma.website.findUnique({ where: { id: websiteId } });
  return prisma.website.findFirst({ where: { id: websiteId, userId } });
}

router.get('/:websiteId', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user   = (req as any).user;
    const { websiteId } = req.params;

    if (!await ownsWebsite(prisma, websiteId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const alerts = await prisma.alert.findMany({
      where: { websiteId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.post('/:websiteId', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user   = (req as any).user;
    const { websiteId } = req.params;
    const { name, type, condition, threshold, windowHours, webhookUrl } = req.body;

    if (!await ownsWebsite(prisma, websiteId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!name || !type || !condition || threshold === undefined) {
      return res.status(400).json({ error: 'name, type, condition and threshold are required' });
    }

    const alert = await prisma.alert.create({
      data: {
        websiteId,
        name,
        type,
        condition,
        threshold: Number(threshold),
        windowHours: Number(windowHours) || 1,
        webhookUrl: webhookUrl || null,
      },
    });

    res.json(alert);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

router.patch('/:websiteId/:alertId/toggle', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user   = (req as any).user;
    const { websiteId, alertId } = req.params;

    if (!await ownsWebsite(prisma, websiteId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const alert = await prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: { enabled: !alert.enabled },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle alert' });
  }
});

router.delete('/:websiteId/:alertId', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user   = (req as any).user;
    const { websiteId, alertId } = req.params;

    if (!await ownsWebsite(prisma, websiteId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.alert.delete({ where: { id: alertId } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

export default router;
