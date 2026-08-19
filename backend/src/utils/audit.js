// Audit logging utility
const { query } = require('../config/db');

const AUDIT_ACTIONS = {
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
};

async function logAudit(userId, action, entity, patient, req, details) {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '0.0.0.0') : '0.0.0.0';
    await query(
      `INSERT INTO audit_log (user_id, usuario, rol, accion, entidad, paciente, ip, detalles)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, req?.user?.name || 'Sistema', req?.user?.role || 'system', action, entity, patient || '—', ip, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

async function logSecurityEvent(action, req, details = {}) {
  const userId = req?.user?.id || null;
  return logAudit(userId, action, 'Security', null, req, details);
}

module.exports = { logAudit, logSecurityEvent, AUDIT_ACTIONS };
