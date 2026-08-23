// Audit logging utility
import { query } from '../config/db.js';
import { Request } from 'express';
import { createLogger } from '../utils/logger.js';

const auditLogger = createLogger('AUDIT');

export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  TOKEN_ROTATION: 'TOKEN_ROTATION',
  TOKEN_BLACKLISTED: 'TOKEN_BLACKLISTED',
  AUTHZ_FAILURE: 'AUTHZ_FAILURE',
  CSRF_FAILURE: 'CSRF_FAILURE',
  SQL_INJECTION_ATTEMPT: 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT: 'XSS_ATTEMPT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const;

export async function logAudit(
  userId: string | null,
  action: string,
  entity: string,
  patient: string | null,
  req?: Request,
  details?: Record<string, any>
): Promise<void> {
  try {
    const user = (req as any)?.user;
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '0.0.0.0') : '0.0.0.0';
    await query(
      `INSERT INTO audit_log (user_id, usuario, rol, accion, entidad, paciente, ip, detalles)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, user?.name || 'Sistema', user?.role || 'system', action, entity, patient || '-', ip, details ? JSON.stringify(details) : null]
    );
  } catch (err: any) {
    auditLogger.error('Audit log error', { message: err.message, stack: err.stack });
  }
}

export async function logSecurityEvent(
  action: string,
  req: Request,
  details: Record<string, any> = {}
): Promise<void> {
  const userId = (req as any)?.user?.id || null;
  return logAudit(userId, action, 'Security', null, req, details);
}