import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { randomBytes } from 'crypto';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { rateLimitLogin, resetRateLimit } from '../middleware/rateLimit.js';
import { requireAuth, AuthUser } from '../middleware/auth.js';
import { sendVerificationEmail } from '../services/email.js';

const router = Router();
const ALLOW_SIGNUP = process.env.ALLOW_SIGNUP === 'true';

function getSecret() {
  return new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'
  );
}

function getClientIp(req: any): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

async function signToken(payload: object, expiresIn = '7d') {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(getSecret());
}

// ── Register ──────────────────────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  if (!ALLOW_SIGNUP) {
    return res.status(403).json({ error: 'Signup is currently disabled.' });
  }

  const prisma = (req as any).prisma;
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required.' });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores, dots and dashes.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    return res.status(409).json({ error: 'Username is already taken.' });
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const emailVerifyToken = randomBytes(32).toString('hex');

  await prisma.user.create({
    data: { username, email, passwordHash, emailVerifyToken, approved: false, emailVerified: false },
  });

  try {
    await sendVerificationEmail(email, emailVerifyToken);
  } catch (e) {
    console.error('Failed to send verification email:', e);
  }

  res.json({ ok: true, message: 'Account created. Check your email to verify your address.' });
});

// ── Verify email ──────────────────────────────────────────────────────────────

router.post('/verify-email', async (req, res) => {
  const prisma = (req as any).prisma;
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required.' });

  const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
  if (!user) return res.status(400).json({ error: 'Invalid or expired verification token.' });

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyToken: null },
  });

  res.json({ ok: true, message: 'Email verified. An admin will approve your account shortly.' });
});

// ── Login ─────────────────────────────────────────────────────────────────────

router.post('/login', rateLimitLogin, async (req, res) => {
  const prisma = (req as any).prisma;
  const { username, password, totpCode } = req.body;
  const ip = getClientIp(req);

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = await prisma.user.findUnique({ where: { username } });

  const logAttempt = (success: boolean) =>
    prisma.loginAttempt.create({
      data: { ip, username, success, userId: user?.id ?? null },
    }).catch(() => {});

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    await logAttempt(false);
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  if (!user.emailVerified) {
    await logAttempt(false);
    return res.status(403).json({ error: 'Please verify your email before logging in.' });
  }

  if (!user.approved) {
    await logAttempt(false);
    return res.status(403).json({ error: 'Your account is pending approval.' });
  }

  // 2FA check
  if (user.twoFactorEnabled) {
    if (!totpCode) {
      return res.status(200).json({ requires2FA: true });
    }
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret!),
      digits: 6,
      period: 30,
    });
    const delta = totp.validate({ token: totpCode, window: 1 });
    if (delta === null) {
      await logAttempt(false);
      return res.status(401).json({ error: 'Invalid 2FA code.' });
    }
  }

  await logAttempt(true);
  resetRateLimit(ip);

  const token = await signToken({
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  });

  res.json({ ok: true, token, role: user.role });
});

// ── Setup 2FA ─────────────────────────────────────────────────────────────────

router.post('/2fa/setup', requireAuth, async (req, res) => {
  const prisma = (req as any).prisma;
  const authUser = (req as any).user as AuthUser;

  const secret = new OTPAuth.Secret();
  const totp = new OTPAuth.TOTP({
    issuer: 'WebAnalytics',
    label: authUser.username,
    secret,
    digits: 6,
    period: 30,
  });

  const otpAuthUrl = totp.toString();
  const qrCode = await QRCode.toDataURL(otpAuthUrl);

  await prisma.user.update({
    where: { id: authUser.userId },
    data: { twoFactorSecret: secret.base32, twoFactorEnabled: false },
  });

  res.json({ qrCode, secret: secret.base32 });
});

// ── Confirm 2FA ───────────────────────────────────────────────────────────────

router.post('/2fa/confirm', requireAuth, async (req, res) => {
  const prisma = (req as any).prisma;
  const authUser = (req as any).user as AuthUser;
  const { code } = req.body;

  const user = await prisma.user.findUnique({ where: { id: authUser.userId } });
  if (!user?.twoFactorSecret) {
    return res.status(400).json({ error: 'No 2FA setup in progress.' });
  }

  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
    digits: 6,
    period: 30,
  });

  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) {
    return res.status(401).json({ error: 'Invalid code. Try again.' });
  }

  await prisma.user.update({ where: { id: authUser.userId }, data: { twoFactorEnabled: true } });
  res.json({ ok: true, message: '2FA enabled successfully.' });
});

// ── Disable 2FA ───────────────────────────────────────────────────────────────

router.post('/2fa/disable', requireAuth, async (req, res) => {
  const prisma = (req as any).prisma;
  const authUser = (req as any).user as AuthUser;
  const { password } = req.body;

  const user = await prisma.user.findUnique({ where: { id: authUser.userId } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  await prisma.user.update({
    where: { id: authUser.userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  res.json({ ok: true });
});

// ── Me ────────────────────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req, res) => {
  const prisma = (req as any).prisma;
  const authUser = (req as any).user as AuthUser;

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: {
      id: true, username: true, email: true, role: true,
      emailVerified: true, twoFactorEnabled: true,
      approved: true, createdAt: true,
    },
  });

  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json(user);
});

export default router;
