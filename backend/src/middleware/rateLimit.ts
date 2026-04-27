import { Request, Response, NextFunction } from 'express';

// In-memory store: ip -> { count, resetAt }
// For production with multiple processes, use Redis instead
const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export function rateLimitLogin(req: Request, res: Response, next: NextFunction) {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unknown';

  const now = Date.now();
  const entry = store.get(ip);

  if (entry) {
    if (now < entry.resetAt) {
      if (entry.count >= MAX_ATTEMPTS) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          error: `Too many login attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.`,
        });
      }
      entry.count++;
    } else {
      store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    }
  } else {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }

  next();
}

export function resetRateLimit(ip: string) {
  store.delete(ip);
}
