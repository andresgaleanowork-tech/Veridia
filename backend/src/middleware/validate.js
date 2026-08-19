// Input validation and sanitization
const { validationResult, body, param, query } = require('express-validator');
const { logAudit } = require('../utils/audit');

// Run validations and return errors
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Datos inválidos', details: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  }
  next();
}

// Sanitize string to prevent XSS
function sanitize(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, '&apos;');
}

// SQL injection detection - exact patterns requested
const SQL_PATTERNS = [
  /\b(UNION|SELECT|INSERT|DROP)\b\s/i,
  /(--)|;(\s|$)/,
  /'/,
];

function detectSqlInjection(val) {
  if (typeof val === 'string' && SQL_PATTERNS.some(p => p.test(val))) return true;
  if (typeof val === 'object' && val !== null) {
    return Object.values(val).some(detectSqlInjection);
  }
  return false;
}

function sqlInjectionMiddleware(req, res, next) {
  if (detectSqlInjection(req.query) || detectSqlInjection(req.body) || detectSqlInjection(req.params)) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '0.0.0.0';
    logAudit(req.user?.id, 'SQL_INJECTION_ATTEMPT', 'Request', null, req, { path: req.path, ip });
    return res.status(400).json({ error: 'Sospecha de inyección SQL detectada' });
  }
  next();
}

// Alias for compatibility
const sqlInjectionCheck = sqlInjectionMiddleware;

// UUID validation middleware
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateUUID(paramName) {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!value || !UUID_REGEX.test(value)) {
      return res.status(400).json({ error: 'ID inválido: debe ser UUID v4 válido' });
    }
    next();
  };
}

// Payload size limits per endpoint type
function bodySizeLimit(maxSize = '10mb') {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxBytes = parseSize(maxSize);
    if (contentLength > maxBytes) {
      return res.status(413).json({ error: `Payload demasiado grande. Máximo: ${maxSize}` });
    }
    next();
  };
}

function parseSize(size) {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.match(/^(\d+)(b|kb|mb|gb)$/i);
  if (!match) return 10 * 1024 * 1024;
  return parseInt(match[1]) * (units[match[2].toLowerCase()] || 1);
}

// Predefined size limits per endpoint type
const payloadLimits = {
  json: bodySizeLimit('1mb'),
  upload: bodySizeLimit('10mb'),
  bulk: bodySizeLimit('5mb'),
  default: bodySizeLimit('10mb'),
};

// Spanish DNI/NIE validation
function validateDNI(dni) {
  if (!dni) return false;
  const cleanDni = dni.toUpperCase().trim();
  const dniRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/;
  const nieRegex = /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/;
  if (!dniRegex.test(cleanDni) && !nieRegex.test(cleanDni)) return false;
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const num = cleanDni.startsWith('X') ? cleanDni.slice(1, -1) : (cleanDni.startsWith('Y') ? cleanDni.slice(1, -1) : (cleanDni.startsWith('Z') ? cleanDni.slice(1, -1) : cleanDni.slice(0, -1)));
  const letter = cleanDni.slice(-1);
  const expected = letters[parseInt(num) % 23];
  return letter === expected;
}

// Strict email validation (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function validateEmail(email) {
  if (!email) return false;
  return EMAIL_REGEX.test(email);
}

// Common validation chains
const v = {
  uuid: (field) => param(field).custom(value => {
    if (!UUID_REGEX.test(value)) throw new Error('ID inválido');
    return true;
  }),
  email: () => body('email').custom(value => {
    if (!EMAIL_REGEX.test(value)) throw new Error('Email inválido');
    return true;
  }).normalizeEmail(),
  password: () => body('password').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres').matches(/[A-Z]/).withMessage('Debe contener mayúscula').matches(/[a-z]/).withMessage('Debe contener minúscula').matches(/[0-9]/).withMessage('Debe contener número'),
  dni: (field) => body(field).optional().custom(value => {
    if (value && !validateDNI(value)) throw new Error('DNI/NIE inválido');
    return true;
  }),
  name: (field) => body(field).trim().notEmpty().withMessage(`${field} requerido`).isLength({ max: 200 }).withMessage('Máximo 200 caracteres').escape(),
  date: (field) => body(field).optional().isISO8601().withMessage('Fecha inválida (YYYY-MM-DD)'),
  number: (field) => body(field).optional().isNumeric().withMessage('Número inválido'),
  pagination: () => [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
};

module.exports = { 
  handleValidation, 
  sanitize, 
  v, 
  body, 
  param, 
  query, 
  sqlInjectionMiddleware, 
  sqlInjectionCheck,
  bodySizeLimit, 
  validateDNI, 
  validateEmail,
  EMAIL_REGEX, 
  UUID_REGEX,
  validateUUID,
  payloadLimits,
};
