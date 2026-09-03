// CSRF Protection middleware (stateless, HMAC-signed tokens)
//
// La implementación anterior guardaba los tokens en un `Map` en memoria del
// proceso. Eso tenía tres problemas serios en producción:
//
//   1. No escalaba: con más de una réplica detrás del balanceador, el token
//      emitido por la instancia A no existía en la B, así que la petición se
//      rechazaba con un 403 aparentemente aleatorio.
//   2. Perdía los tokens en cada despliegue o reinicio, obligando al cliente
//      a re-negociar y provocando 403 espurios.
//   3. Crecía sin límite: cada sessionId nuevo añadía una entrada y nada
//      recorría el mapa para borrar las caducadas.
//
// Ahora el token es autovalidante: lleva su propia caducidad y una firma HMAC
// del servidor, así que cualquier instancia puede verificarlo sin estado
// compartido. Es el patrón "signed double-submit token".
//
// Formato: <nonce-hex>.<expiraEnMs>.<hmacSha256(sessionId.nonce.expira)>
//
// El contrato HTTP no cambia: GET /api/csrf-token devuelve { csrfToken } y los
// métodos inseguros exigen las cabeceras x-csrf-token + x-session-id.
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_TOKEN_EXPIRY = 3600000; // 1 hour
const TOKEN_PARTS = 3;

/**
 * Clave de firma. Se deriva de un secreto ya existente para no añadir otra
 * variable de entorno obligatoria al despliegue.
 *
 * En producción `validateEnv()` garantiza que JWT_SECRET existe. En desarrollo
 * y test se cae a un secreto efímero por proceso: los tokens siguen siendo
 * válidos mientras el servidor viva, que es cuanto necesita un entorno local.
 */
function getSigningKey(): string {
  const secret = process.env.CSRF_SECRET || process.env.JWT_SECRET;
  if (secret) return secret;

  if (!ephemeralSecret) {
    ephemeralSecret = crypto.randomBytes(32).toString('hex');
  }
  return ephemeralSecret;
}

let ephemeralSecret: string | null = null;

function sign(sessionId: string, nonce: string, expires: number): string {
  return crypto
    .createHmac('sha256', getSigningKey())
    .update(`${sessionId}.${nonce}.${expires}`)
    .digest('hex');
}

/** Comparación en tiempo constante: evita filtrar la firma byte a byte. */
function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function generateCsrfToken(sessionId: string): string {
  const nonce = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + CSRF_TOKEN_EXPIRY;
  return `${nonce}.${expires}.${sign(sessionId, nonce, expires)}`;
}

export function validateCsrfToken(sessionId: string, token: string): boolean {
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== TOKEN_PARTS) return false;

  const [nonce, expiresRaw, signature] = parts;

  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  // El token solo vale para la sesión que lo pidió: un atacante no puede
  // reutilizar el suyo contra la sesión de otra persona.
  return safeEquals(signature, sign(sessionId, nonce, expires));
}

/** Identidad de sesión usada para ligar el token a quien lo solicitó. */
function resolveSessionId(req: Request): string {
  return (req.headers['x-session-id'] as string) || req.ip || 'default';
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

  const sessionId = resolveSessionId(req);
  const csrfToken = req.headers['x-csrf-token'] as string;

  if (!csrfToken || !validateCsrfToken(sessionId, csrfToken)) {
    return res.status(403).json({ error: 'CSRF token inválido' });
  }

  next();
}

export function csrfTokenEndpoint(req: Request, res: Response) {
  const sessionId = resolveSessionId(req);
  const token = generateCsrfToken(sessionId);
  res.json({ csrfToken: token });
}
