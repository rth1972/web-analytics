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

    const annotations = await prisma.annotation.findMany({
      where: { websiteId },
      orderBy: { date: 'asc' },
    });

    res.json(annotations);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch annotations' });
  }
});

router.post('/:websiteId', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user   = (req as any).user;
    const { websiteId } = req.params;
    const { date, label, color } = req.body;

    if (!await ownsWebsite(prisma, websiteId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!date || !label) return res.status(400).json({ error: 'date and label are required' });

    const annotation = await prisma.annotation.create({
      data: { websiteId, date: new Date(date), label, color: color || '#6366f1' },
    });

    res.json(annotation);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create annotation' });
  }
});

router.delete('/:websiteId/:annotationId', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user   = (req as any).user;
    const { websiteId, annotationId } = req.params;

    if (!await ownsWebsite(prisma, websiteId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.annotation.delete({ where: { id: annotationId } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete annotation' });
  }
});

export default router;
