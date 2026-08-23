// Request logger with ID tracking and performance metrics
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger.js';

const accessLogger = createLogger('ACCESS');

export function requestId(req: Request, res: Response, next: NextFunction) {
  req.id = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
}

export function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    const duration = Date.now() - start;
    const log = {
      timestamp,
      requestId: req.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.socket?.remoteAddress,
      userId: req.user?.id || '-',
    };

    if (process.env.NODE_ENV === 'production') {
      if (res.statusCode >= 400 || duration > 1000) {
        accessLogger.info('HTTP request', log);
      }
    } else {
      accessLogger.debug(`${req.method} ${req.path} -> ${res.statusCode} (${duration}ms) [${(req.id || '').slice(0, 8)}]`);
    }

    return originalJson(body);
  };

  next();
}