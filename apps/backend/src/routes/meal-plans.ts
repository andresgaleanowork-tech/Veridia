// Meal Plans CRUD routes — Drizzle ORM
import { Router } from 'express';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../config/db.js';
import { mealPlans, patients } from '../db/schema/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateZod, validateZodQuery, validateZodParams } from '../middleware/zodValidate.js';
import { MealPlanCreateSchema, MealPlanUpdateSchema, MealPlanStatusSchema, MealPlanListQuerySchema, UUIDSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

router.get('/', authenticate, validateZodQuery(MealPlanListQuerySchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, estado, page = 1, limit = 50 } = req.query;
    const conditions = [];
    if (paciente_id) conditions.push(eq(mealPlans.pacienteId, String(paciente_id)));
    if (estado) conditions.push(eq(mealPlans.estado, String(estado) as 'activo' | 'inactivo' | 'borrador'));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const data = await db.select({
      id: mealPlans.id, pacienteId: mealPlans.pacienteId,
      pacienteNombre: sql<string>`(${patients.nombre} || ' ' || ${patients.apellidos})`,
      nombre: mealPlans.nombre, estado: mealPlans.estado, fechaCreacion: mealPlans.fechaCreacion,
      kcalObjetivo: mealPlans.kcalObjetivo, protG: mealPlans.protG, grasasG: mealPlans.grasasG,
      hcG: mealPlans.hcG, fibraG: mealPlans.fibraG, aguaL: mealPlans.aguaL,
      formulaUsada: mealPlans.formulaUsada, factorActividad: mealPlans.factorActividad,
      patologia: mealPlans.patologia, dias: mealPlans.dias, comidas: mealPlans.comidas,
      createdBy: mealPlans.createdBy, createdAt: mealPlans.createdAt,
    }).from(mealPlans).leftJoin(patients, eq(mealPlans.pacienteId, patients.id))
      .where(where).orderBy(desc(mealPlans.createdAt)).limit(parseInt(String(limit))).offset((parseInt(String(page)) - 1) * parseInt(String(limit)));
    res.success(data);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/:id', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.select().from(mealPlans).where(eq(mealPlans.id, req.params.id));
    if (!r.length) return res.error(404, 'Plan no encontrado');
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/', authenticate, authorize('admin', 'nutricionista'), validateZod(MealPlanCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, nombre, kcal_objetivo, prot_g, grasas_g, hc_g, fibra_g, agua_l, formula_usada, factor_actividad, patologia, dias, comidas } = req.body;
    const result = await db.insert(mealPlans).values({
      pacienteId: paciente_id, nombre: nombre || 'Plan sin nombre',
      kcalObjetivo: kcal_objetivo, protG: prot_g, grasasG: grasas_g, hcG: hc_g, fibraG: fibra_g,
      aguaL: String(agua_l), formulaUsada: formula_usada, factorActividad: String(factor_actividad),
      patologia, dias: dias || [], comidas: comidas || [], createdBy: user?.id,
    }).returning();
    await logAudit(user?.id, 'CREATE', 'MealPlan', `Plan para ${paciente_id}`, req);
    res.created(result[0]);
  } catch (err) { console.error('POST meal plan error:', err); res.error(500, 'Error interno'); }
});

router.put('/:id', authenticate, authorize('admin', 'nutricionista'), validateZodParams(z.object({ id: UUIDSchema })), validateZod(MealPlanUpdateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const fieldMap: Record<string, string> = { nombre: 'nombre', estado: 'estado', kcal_objetivo: 'kcalObjetivo', prot_g: 'protG', grasas_g: 'grasasG', hc_g: 'hcG', fibra_g: 'fibraG', agua_l: 'aguaL', dias: 'dias', comidas: 'comidas' };
    const updates: Record<string, unknown> = {};
    for (const [k, f] of Object.entries(fieldMap)) { if (req.body[k] !== undefined) updates[f] = (k === 'agua_l') ? String(req.body[k]) : req.body[k]; }
    if (!Object.keys(updates).length) return res.error(400, 'Sin campos para actualizar');
    const r = await db.update(mealPlans).set(updates).where(eq(mealPlans.id, req.params.id)).returning();
    if (!r.length) return res.error(404, 'No encontrado');
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.put('/:id/status', authenticate, validateZodParams(z.object({ id: UUIDSchema })), validateZod(z.object({ estado: MealPlanStatusSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    if (req.body.estado === 'activo') {
      const plan = await db.select({ pacienteId: mealPlans.pacienteId }).from(mealPlans).where(eq(mealPlans.id, req.params.id));
      if (plan.length) {
        await db.update(mealPlans).set({ estado: 'inactivo' }).where(and(eq(mealPlans.pacienteId, plan[0].pacienteId || ''), eq(mealPlans.estado, 'activo'), sql`${mealPlans.id} != ${req.params.id}`));
      }
    }
    const r = await db.update(mealPlans).set({ estado: req.body.estado }).where(eq(mealPlans.id, req.params.id)).returning();
    if (!r.length) return res.error(404, 'No encontrado');
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/:id/copy', authenticate, authorize('admin', 'nutricionista'), validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const orig = await db.select().from(mealPlans).where(eq(mealPlans.id, req.params.id));
    if (!orig.length) return res.error(404, 'No encontrado');
    const o = orig[0];
    const result = await db.insert(mealPlans).values({
      pacienteId: req.body.paciente_id || o.pacienteId, nombre: o.nombre + ' (copia)',
      kcalObjetivo: o.kcalObjetivo, protG: o.protG, grasasG: o.grasasG, hcG: o.hcG, fibraG: o.fibraG,
      dias: o.dias, comidas: o.comidas, createdBy: user?.id,
    }).returning();
    res.created(result[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.delete('/:id', authenticate, authorize('admin', 'nutricionista'), validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.delete(mealPlans).where(eq(mealPlans.id, req.params.id)).returning({ id: mealPlans.id });
    if (!r.length) return res.error(404, 'No encontrado');
    res.success({ ok: true });
  } catch (err) { res.error(500, 'Error interno'); }
});

export default router;