import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();
router.use(requireAuth);

// Generate a new API key
router.post('/', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user   = (req as any).user;
    const { name, expiresAt } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const rawKey   = `wa_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash  = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 10) + '…';

    await prisma.apiKey.create({
      data: {
        userId: user.userId,
        name,
        keyHash,
        keyPrefix,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Return the raw key ONCE — never stored again
    res.json({ key: rawKey, keyPrefix, name });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// List API keys (never return the raw key)
router.get('/', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user   = (req as any).user;

    const keys = await prisma.apiKey.findMany({
      where: { userId: user.userId },
      select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(keys);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Revoke an API key
router.delete('/:id', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const user   = (req as any).user;

    const key = await prisma.apiKey.findUnique({ where: { id: req.params.id } });
    if (!key) return res.status(404).json({ error: 'Key not found' });
    if (key.userId !== user.userId && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.apiKey.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

export default router;
