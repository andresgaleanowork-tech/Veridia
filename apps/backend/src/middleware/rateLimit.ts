// Advanced rate limiting middleware
import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

const rateLimitStores = new Map<string, RateLimitEntry>();

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStores.entries()) {
    if (now > entry.resetTime) {
      rateLimitStores.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, max, message = 'Demasiadas peticiones', keyGenerator, skipSuccessfulRequests } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator ? keyGenerator(req) : `${req.ip}:${req.path}`;
    const now = Date.now();
    let entry = rateLimitStores.get(key);

    if (!entry || now > entry.resetTime) {
      entry = { count: 1, resetTime: now + windowMs };
      rateLimitStores.set(key, entry);
    } else {
      entry.count++;
    }

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ error: message, retryAfter });
    }

    // Las peticiones que terminan con éxito no consumen presupuesto
    // (p. ej. logins válidos no cuentan contra la protección anti-bruteforce).
    if (skipSuccessfulRequests) {
      res.once('finish', () => {
        if (res.statusCode < 400) {
          const current = rateLimitStores.get(key);
          if (current && current === entry) {
            current.count = Math.max(1, current.count - 1);
          }
        }
      });
    }

    next();
  };
}

// Pre-configured rate limiters
export const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Demasiadas peticiones. Intenta de nuevo más tarde.',
});

export const loginLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  // Solo los intentos fallidos cuentan: una sesión con logins válidos no
  // se bloquea a sí misma (evita 429 en uso legítimo / suites E2E).
  skipSuccessfulRequests: true,
  message: 'Demasiados intentos de login. Espera 5 minutos.',
});

export const apiLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: 'Rate limit excedido para la API.',
  keyGenerator: (req) => `api:${req.ip}`,
});

export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Demasiadas subidas de archivos.',
  keyGenerator: (req) => `upload:${req.ip}`,
});
