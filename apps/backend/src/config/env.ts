/**
 * Validación de variables de entorno (fail-fast).
 *
 * - Producción: falla el arranque si faltan variables obligatorias.
 * - Desarrollo: si faltan los secretos JWT se generan efímeros (con warning
 *   grande; los tokens no sobreviven a un reinicio) para no bloquear el DX.
 */
import { randomBytes } from 'node:crypto';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ENV');

function isPresent(name: string): boolean {
  const v = process.env[name];
  return Boolean(v && v.trim());
}

/** Genera un secreto efímero (solo desarrollo). */
function ephemeralSecret(name: string): void {
  const secret = randomBytes(32).toString('base64');
  logger.warn(`⚠️  ${name} no definida: usando secreto efímero (solo desarrollo). ` +
    `Genera uno real con: openssl rand -base64 32`);
  process.env[name] = secret;
}

export function validateEnv(): void {
  const isProd = process.env.NODE_ENV === 'production';
  const missing: string[] = [];

  if (!isPresent('DATABASE_URL')) missing.push('DATABASE_URL');

  for (const name of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    if (!isPresent(name)) {
      if (isProd) missing.push(name);
      else ephemeralSecret(name);
    }
  }

  if (isProd && !isPresent('CORS_ORIGIN')) {
    missing.push('CORS_ORIGIN');
  }

  if (missing.length > 0) {
    logger.error('Variables de entorno obligatorias ausentes', {
      missing,
      nodeEnv: process.env.NODE_ENV || 'development',
    });
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(', ')}.\n` +
      'Referencia: .env.example — genera los secretos con `openssl rand -base64 32`.'
    );
  }

  logger.info('Entorno validado', { nodeEnv: process.env.NODE_ENV || 'development' });
}
