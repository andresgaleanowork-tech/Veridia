// Invoices CRUD routes — Drizzle ORM
import { Router } from 'express';
import { eq, and, gte, lte, desc, count, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../config/db.js';
import { invoices, patients } from '../db/schema/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateZod, validateZodQuery, validateZodParams } from '../middleware/zodValidate.js';
import {
  InvoiceCreateSchema,
  InvoiceUpdateSchema,
  InvoiceListQuerySchema,
  UUIDSchema,
} from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

// GET /api/invoices
router.get('/', authenticate, validateZodQuery(InvoiceListQuerySchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, estado, fecha_desde, fecha_hasta, page = 1, limit = 50 } = req.query;
    const conditions = [];

    if (paciente_id) conditions.push(eq(invoices.pacienteId, String(paciente_id)));
    if (estado) conditions.push(eq(invoices.estado, String(estado) as 'Pendiente' | 'Pagada' | 'Vencida' | 'Anulada'));
    if (fecha_desde) conditions.push(gte(invoices.fecha, String(fecha_desde)));
    if (fecha_hasta) conditions.push(lte(invoices.fecha, String(fecha_hasta)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select({
        id: invoices.id,
        numero: invoices.numero,
        pacienteId: invoices.pacienteId,
        pacienteNombre: sql<string>`(${patients.nombre} || ' ' || ${patients.apellidos})`,
        fecha: invoices.fecha,
        estado: invoices.estado,
        total: invoices.total,
        lineas: invoices.lineas,
        pagos: invoices.pagos,
        createdBy: invoices.createdBy,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
      })
      .from(invoices)
      .leftJoin(patients, eq(invoices.pacienteId, patients.id))
      .where(whereClause)
      .orderBy(desc(invoices.fecha))
      .limit(parseInt(String(limit)))
      .offset((parseInt(String(page)) - 1) * parseInt(String(limit)));

    const countResult = await db.select({ count: count() }).from(invoices).where(whereClause);
    res.paginated(data, parseInt(String(countResult[0].count)), parseInt(String(page)), parseInt(String(limit)));
  } catch (err) {
    console.error('GET invoices error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/invoices/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { fecha_desde, fecha_hasta } = req.query;
    const conditions = [];
    if (fecha_desde) conditions.push(gte(invoices.fecha, String(fecha_desde)));
    if (fecha_hasta) conditions.push(lte(invoices.fecha, String(fecha_hasta)));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({
        total: count(),
        total_importe: sql<string>`COALESCE(SUM(${invoices.total}), 0)`,
        cobrado: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.estado} = 'Pagada' THEN ${invoices.total} ELSE 0 END), 0)`,
        pendiente: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.estado} = 'Pendiente' THEN ${invoices.total} ELSE 0 END), 0)`,
        vencido: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.estado} = 'Vencida' THEN ${invoices.total} ELSE 0 END), 0)`,
      })
      .from(invoices)
      .where(whereClause);
    res.success(result[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// GET /api/invoices/:id
router.get('/:id', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db
      .select({
        id: invoices.id,
        numero: invoices.numero,
        pacienteId: invoices.pacienteId,
        pacienteNombre: sql<string>`(${patients.nombre} || ' ' || ${patients.apellidos})`,
        fecha: invoices.fecha,
        estado: invoices.estado,
        total: invoices.total,
        lineas: invoices.lineas,
        pagos: invoices.pagos,
        createdBy: invoices.createdBy,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
      })
      .from(invoices)
      .leftJoin(patients, eq(invoices.pacienteId, patients.id))
      .where(eq(invoices.id, req.params.id));
    if (!result.length) return res.error(404, 'Factura no encontrada');
    res.success(result[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// POST /api/invoices
router.post('/', authenticate, authorize('admin', 'nutricionista'), validateZod(InvoiceCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, lineas, total, estado, fecha } = req.body;
    const countResult = await db.select({ count: count() }).from(invoices);
    const num = `VH-${String(parseInt(String(countResult[0].count)) + 1).padStart(4, '0')}`;
    const calculatedTotal = lineas?.reduce((sum: number, l: { cantidad?: number; precio?: number }) => sum + (l.cantidad || 1) * (l.precio || 0), 0) || total;

    const result = await db.insert(invoices).values({
      numero: num,
      pacienteId: paciente_id,
      total: String(calculatedTotal),
      lineas: lineas || [],
      estado: estado || 'Pendiente',
      fecha: fecha || new Date().toISOString().split('T')[0],
      createdBy: user?.id,
    }).returning();

    await logAudit(user?.id, 'CREATE', 'Invoice', `Factura ${num}`, req);
    res.created(result[0]);
  } catch (err) {
    console.error('POST invoice error:', err);
    res.error(500, 'Error interno');
  }
});

// PUT /api/invoices/:id
router.put('/:id', authenticate, authorize('admin', 'nutricionista'), validateZodParams(z.object({ id: UUIDSchema })), validateZod(InvoiceUpdateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const fieldMap: Record<string, string> = {
      estado: 'estado', lineas: 'lineas', total: 'total', notas: 'notas', fecha: 'fecha',
    };

    const updates: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(fieldMap)) {
      if (req.body[key] !== undefined) {
        updates[field] = key === 'lineas' ? req.body[key] : (key === 'total' ? String(req.body[key]) : req.body[key]);
      }
    }
    if (!Object.keys(updates).length) return res.error(400, 'Sin campos para actualizar');

    const result = await db.update(invoices).set(updates).where(eq(invoices.id, req.params.id)).returning();
    if (!result.length) return res.error(404, 'No encontrada');
    res.success(result[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// PUT /api/invoices/:id/pay
router.put('/:id/pay', authenticate, validateZodParams(z.object({ id: UUIDSchema })), validateZod(z.object({
  importe: z.coerce.number().positive(),
  metodo: z.string().optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const existing = await db.select().from(invoices).where(eq(invoices.id, req.params.id));
    if (!existing.length) return res.error(404, 'No encontrada');

    const inv = existing[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pagos is a JSONB array with dynamic payment objects
    const pagos = (inv.pagos as any[]) || [];
    pagos.push({ importe: parseFloat(req.body.importe), metodo: req.body.metodo || 'Efectivo', fecha: req.body.fecha || new Date().toISOString() });

    const totalPagado = pagos.reduce((s: number, p: { importe: number }) => s + p.importe, 0);
    const nuevoEstado = totalPagado >= parseFloat(String(inv.total)) ? 'Pagada' : 'Pendiente';

    const result = await db.update(invoices).set({ pagos, estado: nuevoEstado }).where(eq(invoices.id, req.params.id)).returning();
    res.success(result[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// PUT /api/invoices/:id/void
router.put('/:id/void', authenticate, authorize('admin'), validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.update(invoices).set({ estado: 'Anulada' }).where(eq(invoices.id, req.params.id)).returning();
    if (!result.length) return res.error(404, 'No encontrada');
    await logAudit(user?.id, 'UPDATE', 'Invoice', `Factura anulada ${result[0].numero}`, req);
    res.success(result[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', authenticate, authorize('admin'), validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.delete(invoices).where(eq(invoices.id, req.params.id)).returning({ id: invoices.id });
    if (!result.length) return res.error(404, 'No encontrada');
    res.success({ ok: true });
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

export default router;