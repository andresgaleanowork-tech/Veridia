const express = require('express');
const { z } = require('zod');
const { query } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateZod } = require('../middleware/zodValidate');
const { TenantCreateSchema, RoleCreateSchema } = require('../schemas');
const { logAudit } = require('../utils/audit');
const { sanitize } = require('../middleware/validate');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM tenants WHERE active = true ORDER BY name');
    res.success(result.rows);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/', authenticate, authorize('admin'), validateZod(TenantCreateSchema), async (req, res) => {
  try {
    const { name, slug, settings } = req.body;
    const result = await query(
      `INSERT INTO tenants (name, slug, settings) VALUES ($1, $2, $3) RETURNING *`,
      [sanitize(name), sanitize(slug), settings || {}]
    );
    await logAudit(req.user.id, 'CREATE', 'Tenant', result.rows[0].id, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.get('/:id/roles', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM roles WHERE tenant_id = $1', [req.params.id]);
    res.success(result.rows);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/:id/roles', authenticate, authorize('admin'), validateZod(RoleCreateSchema), async (req, res) => {
  try {
    const { name, permissions } = req.body;
    const result = await query(
      `INSERT INTO roles (tenant_id, name, permissions) VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, sanitize(name), permissions]
    );
    await logAudit(req.user.id, 'CREATE', 'Role', result.rows[0].id, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

module.exports = router;
