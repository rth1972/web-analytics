import { Router } from 'express';
import { requireAuth, requireAdmin, AuthUser } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../services/email.js';

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

// ── List all users ────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const prisma = (req as any).prisma;
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, email: true, role: true,
      emailVerified: true, twoFactorEnabled: true,
      approved: true, createdAt: true,
      _count: { select: { websites: true } },
    },
  });
  res.json(users);
});

// ── Approve user ──────────────────────────────────────────────────────────────

router.post('/:id/approve', async (req, res) => {
  const prisma = (req as any).prisma;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { approved: true },
    select: { email: true },
  });
  try {
    await sendWelcomeEmail(user.email);
  } catch (e) {
    console.error('Failed to send welcome email:', e);
  }
  res.json({ ok: true });
});

// ── Revoke user ───────────────────────────────────────────────────────────────

router.post('/:id/revoke', async (req, res) => {
  const prisma = (req as any).prisma;
  await prisma.user.update({
    where: { id: req.params.id },
    data: { approved: false },
  });
  res.json({ ok: true });
});

// ── Change role ───────────────────────────────────────────────────────────────

router.post('/:id/role', async (req, res) => {
  const prisma = (req as any).prisma;
  const { role } = req.body;
  if (!['ADMIN', 'USER'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }
  await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
  });
  res.json({ ok: true });
});

// ── Delete user ───────────────────────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  const prisma = (req as any).prisma;
  const authUser = (req as any).user as AuthUser;

  if (req.params.id === authUser.userId) {
    return res.status(400).json({ error: 'Cannot delete your own account.' });
  }

  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ── All websites (admin overview) ─────────────────────────────────────────────

router.get('/websites', async (req, res) => {
  const prisma = (req as any).prisma;
  const websites = await prisma.website.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true } },
      _count: { select: { pageViews: true, sessions: true } },
    },
  });
  res.json(websites);
});

export default router;
