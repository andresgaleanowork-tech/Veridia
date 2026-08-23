// Automations routes — Drizzle ORM
import { Router } from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../config/db.js';
import { automations, automationLogs } from '../db/schema/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateZod } from '../middleware/zodValidate.js';
import { logAudit } from '../utils/audit.js';
import { sanitize } from '../middleware/validate.js';

const router = Router();

const AutomationCreateSchema = z.object({
  name: z.string().min(1), trigger: z.string(),
  conditions: z.array(z.object({ field: z.string(), operator: z.string(), value: z.any() })).optional().default([]),
  actions: z.array(z.object({ type: z.string(), params: z.any() })).optional().default([]),
  active: z.boolean().default(true),
});
const AutomationUpdateSchema = AutomationCreateSchema.partial();

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.select().from(automations).orderBy(desc(automations.createdAt));
    res.success(result);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.post('/', authenticate, authorize('admin', 'nutricionista'), validateZod(AutomationCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { name, trigger, conditions, actions, active } = req.body;
    const result = await db.insert(automations).values({
      name: sanitize(name), trigger, conditions, actions, active, createdBy: user.id,
    }).returning();
    await logAudit(user.id, 'CREATE', 'Automation', result[0].id, req);
    res.created(result[0]);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.select().from(automations).where(eq(automations.id, req.params.id));
    if (!r.length) return res.error(404, 'Automatización no encontrada');
    res.success(r[0]);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.put('/:id', authenticate, authorize('admin', 'nutricionista'), validateZod(AutomationUpdateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { name, trigger, conditions, actions, active } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = sanitize(name);
    if (trigger !== undefined) updates.trigger = trigger;
    if (conditions !== undefined) updates.conditions = conditions;
    if (actions !== undefined) updates.actions = actions;
    if (active !== undefined) updates.active = active;
    const r = await db.update(automations).set(updates).where(eq(automations.id, req.params.id)).returning();
    if (!r.length) return res.error(404, 'Automatización no encontrada');
    await logAudit(user.id, 'UPDATE', 'Automation', req.params.id, req);
    res.success(r[0]);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.delete(automations).where(eq(automations.id, req.params.id)).returning({ id: automations.id });
    if (!r.length) return res.error(404, 'Automatización no encontrada');
    await logAudit(user.id, 'DELETE', 'Automation', req.params.id, req);
    res.success({ id: req.params.id });
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.post('/:id/toggle', authenticate, authorize('admin', 'nutricionista'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.update(automations).set({ active: sql`NOT ${automations.active}` }).where(eq(automations.id, req.params.id)).returning();
    if (!r.length) return res.error(404, 'Automatización no encontrada');
    await logAudit(user.id, 'UPDATE', 'Automation', req.params.id, req);
    res.success(r[0]);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.get('/logs/list', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(automationLogs).orderBy(desc(automationLogs.executedAt)).limit(100);
    res.success(result);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.post('/execute/:id', authenticate, authorize('admin', 'nutricionista'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.select().from(automations).where(eq(automations.id, req.params.id));
    if (!r.length) return res.error(404, 'Automatización no encontrada');
    const automation = r[0];
    await db.insert(automationLogs).values({ automationId: automation.id, triggerData: { manual: true }, result: { status: 'executed' } });
    await logAudit(user.id, 'EXECUTE', 'Automation', req.params.id, req);
    res.success({ message: 'Automatización ejecutada', automation });
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

export default router;