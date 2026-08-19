// Security middleware collection

// SQL injection pattern detection
function sqlInjectionProtection(req, res, next) {
  const suspicious = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|FETCH|DECLARE|TRUNCATE)\b\s)|(--)|;(\s|$)|\/\*|\*\//i;
  const check = (val) => {
    if (typeof val === 'string' && suspicious.test(val)) return true;
    if (typeof val === 'object' && val !== null) {
      return Object.values(val).some(check);
    }
    return false;
  };

  if (check(req.query) || check(req.body) || check(req.params)) {
    return res.status(400).json({ error: 'Sospecha de inyección SQL detectada' });
  }
  next();
}

// XSS protection headers
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

// Request size limiter (per route)
function bodySizeLimit(limit = '1mb') {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSize = parseSize(limit);
    if (contentLength > maxSize) {
      return res.status(413).json({ error: `Payload demasiado grande. Máximo: ${limit}` });
    }
    next();
  };
}

function parseSize(size) {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.match(/^(\d+)(b|kb|mb|gb)$/i);
  if (!match) return 1024 * 1024; // default 1MB
  return parseInt(match[1]) * (units[match[2].toLowerCase()] || 1);
}

module.exports = { sqlInjectionProtection, securityHeaders, bodySizeLimit };
