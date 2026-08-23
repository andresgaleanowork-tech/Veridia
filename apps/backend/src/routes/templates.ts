// Clinical Templates routes — Drizzle ORM
import { Router } from 'express';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../config/db.js';
import { clinicalTemplates } from '../db/schema/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateZod, validateZodParams } from '../middleware/zodValidate.js';
import { TemplateCreateSchema, TemplateUpdateSchema, UUIDSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import { sanitize } from '../middleware/validate.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { type } = req.query;
    const conditions = [];
    if (type) conditions.push(eq(clinicalTemplates.tipo, String(type)));
    const where = conditions.length > 0 ? conditions[0] : undefined;
    const result = await db.select().from(clinicalTemplates).where(where).orderBy(asc(clinicalTemplates.nombre));
    res.success(result);
  } catch (err) { console.error('GET templates error:', err); res.error(500, 'Error interno'); }
});

router.post('/', authenticate, authorize('admin', 'nutricionista', 'secretaria'), validateZod(TemplateCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { nombre, tipo, contenido, tags } = req.body;
    const result = await db.insert(clinicalTemplates).values({
      nombre: sanitize(nombre), tipo, contenido, tags: tags || [], createdBy: user.id,
    }).returning();
    await logAudit(user.id, 'CREATE', 'ClinicalTemplate', nombre, req);
    res.created(result[0]);
  } catch (err) { console.error('POST templates error:', err); res.error(500, 'Error interno'); }
});

router.put('/:id', authenticate, authorize('admin', 'nutricionista', 'secretaria'), validateZodParams(z.object({ id: UUIDSchema })), validateZod(TemplateUpdateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const updates: Record<string, unknown> = {};
    if (req.body.nombre !== undefined) updates.nombre = sanitize(req.body.nombre);
    if (req.body.tipo !== undefined) updates.tipo = req.body.tipo;
    if (req.body.contenido !== undefined) updates.contenido = req.body.contenido;
    if (req.body.tags !== undefined) updates.tags = req.body.tags;
    if (!Object.keys(updates).length) return res.error(400, 'Sin campos para actualizar');
    const r = await db.update(clinicalTemplates).set(updates).where(eq(clinicalTemplates.id, req.params.id)).returning();
    await logAudit(user.id, 'UPDATE', 'ClinicalTemplate', req.params.id, req);
    res.success(r[0]);
  } catch (err) { console.error('PUT templates/:id error:', err); res.error(500, 'Error interno'); }
});

router.delete('/:id', authenticate, authorize('admin', 'nutricionista', 'secretaria'), validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.delete(clinicalTemplates).where(eq(clinicalTemplates.id, req.params.id)).returning({ id: clinicalTemplates.id });
    if (!r.length) return res.error(404, 'Plantilla no encontrada');
    await logAudit(user.id, 'DELETE', 'ClinicalTemplate', req.params.id, req);
    res.success({ ok: true });
  } catch (err) { console.error('DELETE templates/:id error:', err); res.error(500, 'Error interno'); }
});

export default router;