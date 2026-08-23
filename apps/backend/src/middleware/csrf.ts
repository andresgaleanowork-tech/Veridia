// CSRF Protection middleware
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Simple CSRF token implementation
const CSRF_TOKEN_EXPIRY = 3600000; // 1 hour

interface CsrfTokenStore {
  token: string;
  expires: number;
}

const tokenStore = new Map<string, CsrfTokenStore>();

export function generateCsrfToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  tokenStore.set(sessionId, { token, expires: Date.now() + CSRF_TOKEN_EXPIRY });
  return token;
}

export function validateCsrfToken(sessionId: string, token: string): boolean {
  const stored = tokenStore.get(sessionId);
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    tokenStore.delete(sessionId);
    return false;
  }
  return stored.token === token;
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip for API key authenticated requests
  if (req.headers['x-api-key']) {
    return next();
  }

  // Skip for public auth endpoints
  // Use originalUrl to match regardless of nginx proxy prefix stripping
  const url = req.originalUrl || (req.baseUrl + req.path);
  const publicPaths = ['/auth/login', '/auth/register', '/auth/refresh', '/csrf-token'];
  if (publicPaths.some(path => url.includes(path))) {
    return next();
  }

  const sessionId = req.headers['x-session-id'] as string || req.ip || 'default';
  const csrfToken = req.headers['x-csrf-token'] as string;

  if (!csrfToken || !validateCsrfToken(sessionId, csrfToken)) {
    return res.status(403).json({ error: 'CSRF token inválido' });
  }

  next();
}

export function csrfTokenEndpoint(req: Request, res: Response) {
  const sessionId = req.headers['x-session-id'] as string || req.ip || 'default';
  const token = generateCsrfToken(sessionId);
  res.json({ csrfToken: token });
}
