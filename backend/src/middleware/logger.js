// Request logger with ID tracking and performance metrics
const { v4: uuidv4 } = require('uuid');

// Request ID middleware
function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
}

// Request logger middleware
function logger(req, res, next) {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  // Capture original json method to log response
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    const duration = Date.now() - start;
    const log = {
      timestamp,
      requestId: req.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection?.remoteAddress,
      userId: req.user?.id || '-',
    };

    // Only log errors and slow requests in production
    if (process.env.NODE_ENV === 'production') {
      if (res.statusCode >= 400 || duration > 1000) {
        console.log(JSON.stringify(log));
      }
    } else {
      // Dev: log everything
      const color = res.statusCode >= 400 ? '\x1b[31m' : res.statusCode >= 300 ? '\x1b[33m' : '\x1b[32m';
      console.log(`${color}${req.method}\x1b[0m ${req.path} → ${res.statusCode} (${duration}ms) [${req.id.slice(0, 8)}]`);
    }

    return originalJson(body);
  };

  next();
}

module.exports = { requestId, logger };
