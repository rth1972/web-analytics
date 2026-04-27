import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';

export interface AuthUser {
  userId: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

function getSecret() {
  return new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'
  );
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    (req as any).user = {
      userId:   payload.userId   as string,
      username: payload.username as string,
      email:    payload.email    as string,
      role:     payload.role     as 'ADMIN' | 'USER',
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as AuthUser;
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}
