import { Router } from 'express';
import { requireAuth, AuthUser } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user = (req as any).user as AuthUser;

    const where = user.role === 'ADMIN' ? {} : { userId: user.userId };
    const websites = await prisma.website.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { pageViews: true, sessions: true } },
        user: { select: { email: true } },
      },
    });
    res.json(websites);
  } catch (error: any) {
    console.error('Websites fetch error:', error?.message, error?.code, error?.meta);
    res.status(500).json({ error: 'Failed to fetch websites', detail: error?.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user = (req as any).user as AuthUser;
    const { name, domain } = req.body;

    console.log('Creating website:', { name, domain, userId: user.userId });

    if (!name || !domain) {
      return res.status(400).json({ error: 'Name and domain are required' });
    }

    const website = await prisma.website.create({
      data: { name, domain, userId: user.userId },
    });

    console.log('Website created:', website.id);
    res.json(website);
  } catch (error: any) {
    console.error('Website creation error:', error?.message, error?.code, error?.meta);
    res.status(500).json({ error: 'Failed to create website', detail: error?.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user = (req as any).user as AuthUser;

    const website = await prisma.website.findUnique({
      where: { id: req.params.id },
    });

    if (!website) return res.status(404).json({ error: 'Website not found' });
    if (user.role !== 'ADMIN' && website.userId !== user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(website);
  } catch (error: any) {
    console.error('Website fetch error:', error?.message, error?.code, error?.meta);
    res.status(500).json({ error: 'Failed to fetch website', detail: error?.message });
  }
});

// Toggle public dashboard sharing
router.post('/:id/public/toggle', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user   = (req as any).user as AuthUser;
    const { randomBytes } = await import('crypto');

    const website = await prisma.website.findUnique({ where: { id: req.params.id } });
    if (!website) return res.status(404).json({ error: 'Website not found' });
    if (user.role !== 'ADMIN' && website.userId !== user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const publicEnabled = !website.publicEnabled;
    const publicToken   = publicEnabled && !website.publicToken
      ? randomBytes(16).toString('hex')
      : website.publicToken;

    const updated = await prisma.website.update({
      where: { id: req.params.id },
      data: { publicEnabled, publicToken },
    });

    res.json({ publicEnabled: updated.publicEnabled, publicToken: updated.publicToken });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to toggle public dashboard' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user = (req as any).user as AuthUser;

    const website = await prisma.website.findUnique({
      where: { id: req.params.id },
    });

    if (!website) return res.status(404).json({ error: 'Website not found' });
    if (user.role !== 'ADMIN' && website.userId !== user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.website.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    console.error('Website deletion error:', error?.message, error?.code, error?.meta);
    res.status(500).json({ error: 'Failed to delete website', detail: error?.message });
  }
});

export default router;
