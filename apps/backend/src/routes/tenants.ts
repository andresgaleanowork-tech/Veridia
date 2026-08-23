// Tenants routes - raw SQL (no Drizzle schema for tenants/roles)
import { Router } from 'express';
import { sql } from 'drizzle-orm';

import { executeOne, executeMany } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateZod } from '../middleware/zodValidate.js';
import { TenantCreateSchema, RoleCreateSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import { sanitize } from '../middleware/validate.js';

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface RoleRow {
  id: string;
  tenant_id: string;
  name: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

const router = Router();

router.get('/', authenticate, async (_req, res) => {
  try {
    const result = await executeMany<TenantRow>(sql`SELECT * FROM tenants WHERE active = true ORDER BY name`);
    res.success(result);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.post('/', authenticate, authorize('admin'), validateZod(TenantCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { name, slug, settings } = req.body;
    const result = await executeOne<TenantRow>(sql`INSERT INTO tenants (name, slug, settings) VALUES (${sanitize(name)}, ${sanitize(slug)}, ${JSON.stringify(settings || {})}) RETURNING *`);
    await logAudit(user.id, 'CREATE', 'Tenant', result?.id ?? null, req);
    res.created(result);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.get('/:id/roles', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await executeMany<RoleRow>(sql`SELECT * FROM roles WHERE tenant_id = ${req.params.id}`);
    res.success(result);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.post('/:id/roles', authenticate, authorize('admin'), validateZod(RoleCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { name, permissions } = req.body;
    const result = await executeOne<RoleRow>(sql`INSERT INTO roles (tenant_id, name, permissions) VALUES (${req.params.id}, ${sanitize(name)}, ${JSON.stringify(permissions)}) RETURNING *`);
    await logAudit(user.id, 'CREATE', 'Role', result?.id ?? null, req);
    res.created(result);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

export default router;