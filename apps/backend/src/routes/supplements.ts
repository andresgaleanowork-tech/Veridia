import { Router } from 'express';
import { eq, and, gte, lte, count, desc } from 'drizzle-orm';

import { db } from '../config/db.js';
import { supplements, supplementAdherence } from '../db/schema/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateZod } from '../middleware/zodValidate.js';
import { logAudit } from '../utils/audit.js';
import {
  SupplementCreateSchema,
  SupplementUpdateSchema,
  SupplementAdherenceCreateSchema,
} from '../schemas/index.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, activo } = req.query;
    if (!paciente_id) return res.error(400, 'paciente_id requerido');
    const conditions = [
      eq(supplements.pacienteId, String(paciente_id)),
    ];
    if (activo !== undefined) {
      conditions.push(eq(supplements.activo, activo === 'true'));
    }
    const where = and(...conditions);
    const data = await db.select().from(supplements).where(where).orderBy(desc(supplements.createdAt));
    const c = await db.select({ count: count() }).from(supplements).where(where);
    res.paginated(data, Number(c[0].count), 1, 100);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(supplements).where(eq(supplements.id, req.params.id)).limit(1);
    if (!result.length) return res.error(404, 'Suplemento no encontrado');
    res.success(result[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/', authenticate, authorize('admin', 'nutricionista'), validateZod(SupplementCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const f = req.body;
    const result = await db.insert(supplements).values({
      pacienteId: f.pacienteId,
      nombre: f.nombre,
      tipo: f.tipo,
      dosis: f.dosis,
      frecuencia: f.frecuencia,
      horarios: f.horarios,
      via: f.via,
      fechaInicio: f.fechaInicio,
      fechaFin: f.fechaFin,
      motivo: f.motivo,
      observaciones: f.observaciones,
      activo: f.activo ?? true,
      createdBy: user.id,
    }).returning();
    await logAudit(user.id, 'CREATE', 'Supplement', result[0].id, req);
    res.created(result[0]);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.put('/:id', authenticate, authorize('admin', 'nutricionista'), validateZod(SupplementUpdateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const f = req.body;
    const result = await db.update(supplements).set({
      ...f,
      updatedAt: new Date(),
    }).where(eq(supplements.id, req.params.id)).returning();
    if (!result.length) return res.error(404, 'Suplemento no encontrado');
    await logAudit(user.id, 'UPDATE', 'Supplement', result[0].id, req);
    res.success(result[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.delete('/:id', authenticate, authorize('admin', 'nutricionista'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.delete(supplements).where(eq(supplements.id, req.params.id)).returning();
    if (!result.length) return res.error(404, 'Suplemento no encontrado');
    await logAudit(user.id, 'DELETE', 'Supplement', result[0].id, req);
    res.success(result[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/:id/adherence', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { from, to } = req.query;
    const conditions = [eq(supplementAdherence.supplementId, req.params.id)];
    if (from) conditions.push(gte(supplementAdherence.fecha, String(from)));
    if (to) conditions.push(lte(supplementAdherence.fecha, String(to)));
    const where = and(...conditions);
    const data = await db.select().from(supplementAdherence).where(where).orderBy(desc(supplementAdherence.fecha));
    res.success(data);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/:id/adherence', authenticate, validateZod(SupplementAdherenceCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const f = req.body;
    const supplementId = req.params.id;
    const [supplement] = await db.select().from(supplements).where(eq(supplements.id, supplementId)).limit(1);
    if (!supplement) return res.error(404, 'Suplemento no encontrado');
    const result = await db.insert(supplementAdherence).values({
      supplementId,
      pacienteId: supplement.pacienteId,
      fecha: f.fecha,
      tomado: f.tomado,
      horaTomado: f.horaTomado,
      notas: f.notas,
    }).returning();
    await logAudit(user.id, 'CREATE', 'SupplementAdherence', result[0].id, req);
    res.created(result[0]);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

export default router;
