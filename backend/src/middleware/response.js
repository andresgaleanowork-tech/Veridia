// API response wrapper for consistent responses
function apiResponse(req, res, next) {
  // Wrap res.json to add standard envelope
  const originalJson = res.json.bind(res);

  res.success = function(data, meta = {}) {
    return originalJson({
      ok: true,
      data,
      meta: {
        requestId: req.id,
        ...meta,
      },
    });
  };

  res.paginated = function(data, total, page = 1, limit = 20) {
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

  res.created = function(data, meta = {}) {
    return res.status(201).json({
      ok: true,
      data,
      meta: {
        requestId: req.id,
        ...meta,
      },
    });
  };

  res.error = function(status, message, details = null) {
    const body = {
      ok: false,
      error: message,
      meta: {
        requestId: req.id,
        timestamp: new Date().toISOString(),
      },
    };
    if (details) body.details = details;
    return res.status(status).json(body);
  };

  next();
}

module.exports = { apiResponse };
