function requireTenant(req, res, next) {
  const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'Tenant ID requerido' });
  req.tenantId = parseInt(tenantId);
  next();
}

function tenantIsolation(queryBuilder, table, tenantColumn = 'tenant_id') {
  return `${queryBuilder} AND ${table}.${tenantColumn} = $${queryBuilder.split('$').length}`;
}

module.exports = { requireTenant, tenantIsolation };
