// Accounting / Gastos routes — Drizzle ORM
import { Router } from 'express';
import { eq, and, desc, gte, lte, sum, count } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../config/db.js';
import { gastos } from '../db/schema/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateZod, validateZodQuery, validateZodParams } from '../middleware/zodValidate.js';
import { ExpenseCreateSchema, ExpenseUpdateSchema, ExpenseListQuerySchema, UUIDSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import { sanitize } from '../middleware/validate.js';

const router = Router();

router.get('/', authenticate, validateZodQuery(ExpenseListQuerySchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { categoria, fecha_desde, fecha_hasta, page = 1, limit = 50 } = req.query;
    const conditions = [];
    if (categoria) conditions.push(eq(gastos.categoria, categoria as 'suministros' | 'equipamiento' | 'formacion' | 'marketing' | 'alquiler' | 'servicios' | 'otro'));
    if (fecha_desde) conditions.push(gte(gastos.fecha, String(fecha_desde)));
    if (fecha_hasta) conditions.push(lte(gastos.fecha, String(fecha_hasta)));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.select().from(gastos).where(where).orderBy(desc(gastos.fecha))
      .limit(parseInt(String(limit))).offset((parseInt(String(page)) - 1) * parseInt(String(limit)));
    const stats = await db.select({ total: count(), totalImporte: sum(gastos.importe) }).from(gastos);
    res.success({ data, total: parseInt(String(stats[0].total)), totalImporte: parseFloat(stats[0].totalImporte || '0') });
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/stats', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select({ categoria: gastos.categoria, total: sum(gastos.importe), count: count() })
      .from(gastos).groupBy(gastos.categoria);
    res.success(result);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/', authenticate, authorize('admin', 'nutricionista'), validateZod(ExpenseCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { categoria, descripcion, importe, fecha, metodo_pago, recurrente, frecuencia, proveedor, notas } = req.body;
    const result = await db.insert(gastos).values({
      categoria: sanitize(categoria) as 'suministros' | 'equipamiento' | 'formacion' | 'marketing' | 'alquiler' | 'servicios' | 'otro', descripcion: sanitize(descripcion), importe: String(importe),
      fecha: fecha || new Date().toISOString().split('T')[0], metodoPago: metodo_pago || 'efectivo',
      recurrente: recurrente || false, frecuencia, proveedor: sanitize(proveedor), notas: sanitize(notas),
      createdBy: user?.id,
    }).returning();
    await logAudit(user?.id, 'CREATE', 'Gasto', `${categoria}: ${importe}€`, req);
    res.created(result[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.put('/:id', authenticate, authorize('admin'), validateZodParams(z.object({ id: UUIDSchema })), validateZod(ExpenseUpdateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const fieldMap: Record<string, string> = { categoria: 'categoria', descripcion: 'descripcion', importe: 'importe', fecha: 'fecha', metodo_pago: 'metodoPago', proveedor: 'proveedor', notas: 'notas', recurrente: 'recurrente', frecuencia: 'frecuencia' };
    const updates: Record<string, unknown> = {};
    for (const [k, f] of Object.entries(fieldMap)) { if (req.body[k] !== undefined) updates[f] = (k === 'importe') ? String(req.body[k]) : req.body[k]; }
    if (!Object.keys(updates).length) return res.error(400, 'Sin campos para actualizar');
    const r = await db.update(gastos).set(updates).where(eq(gastos.id, req.params.id)).returning();
    if (!r.length) return res.error(404, 'No encontrado');
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.delete('/:id', authenticate, authorize('admin'), validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.delete(gastos).where(eq(gastos.id, req.params.id)).returning({ id: gastos.id });
    if (!result.length) return res.error(404, 'No encontrado');
    await logAudit(user?.id, 'DELETE', 'Gasto', 'Gasto eliminado', req);
    res.success({ ok: true });
  } catch (err) { res.error(500, 'Error interno'); }
});

export default router;