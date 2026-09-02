// API response wrapper for consistent responses
import { Request, Response, NextFunction } from 'express';

export function apiResponse(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  res.success = function (data: unknown, meta: Record<string, unknown> = {}) {
    return originalJson({
      ok: true,
      data,
      meta: { requestId: req.id, ...meta },
    });
  };

  res.paginated = function (data: unknown[], total: number, page = 1, limit = 20) {
    return originalJson({
      ok: true,
      data,
      meta: {
        requestId: req.id,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  };

  res.created = function (data: unknown, meta: Record<string, unknown> = {}) {
    return res.status(201).json({
      ok: true,
      data,
      meta: { requestId: req.id, ...meta },
    });
  };

  res.error = function (status: number, message: string, details: unknown = null) {
    const body: Record<string, unknown> = {
      ok: false,
      error: message,
      meta: { requestId: req.id, timestamp: new Date().toISOString() },
    };
    if (details) body.details = details;
    return res.status(status).json(body);
  };

  next();
}
