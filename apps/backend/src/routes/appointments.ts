// Appointments CRUD routes — Drizzle ORM
import { Router } from 'express';
import { eq, and, desc, sql, asc, gte, lte, count } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../config/db.js';
import { appointments, patients } from '../db/schema/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateZod, validateZodQuery, validateZodParams } from '../middleware/zodValidate.js';
import {
  AppointmentCreateSchema,
  AppointmentUpdateSchema,
  AppointmentStatusSchema,
  AppointmentListQuerySchema,
  UUIDSchema,
} from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import { sanitize } from '../middleware/validate.js';

const router = Router();

// GET /api/appointments — List with filters
router.get('/', authenticate, validateZodQuery(AppointmentListQuerySchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, estado, fecha, fecha_desde, fecha_hasta, page = 1, limit = 100 } = req.query;
    const conditions = [];

    if (paciente_id) conditions.push(eq(appointments.pacienteId, String(paciente_id)));
    if (estado) conditions.push(eq(appointments.estado, String(estado) as 'Pendiente' | 'Confirmada' | 'Realizada' | 'No asistió' | 'Cancelada'));
    if (fecha) conditions.push(eq(appointments.fecha, String(fecha)));
    if (fecha_desde) conditions.push(gte(appointments.fecha, String(fecha_desde)));
    if (fecha_hasta) conditions.push(lte(appointments.fecha, String(fecha_hasta)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select({
        id: appointments.id,
        pacienteId: appointments.pacienteId,
        pacienteNombre: sql<string>`(${patients.nombre} || ' ' || ${patients.apellidos})`,
        profesional: appointments.profesional,
        fecha: appointments.fecha,
        hora: appointments.hora,
        tipo: appointments.tipo,
        asunto: appointments.asunto,
        estado: appointments.estado,
        pago: appointments.pago,
        precio: appointments.precio,
        duracion: appointments.duracion,
        nota: appointments.nota,
        color: appointments.color,
        acta: appointments.acta,
        createdBy: appointments.createdBy,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.pacienteId, patients.id))
      .where(whereClause)
      .orderBy(desc(appointments.fecha), desc(appointments.hora))
      .limit(parseInt(String(limit)))
      .offset((parseInt(String(page)) - 1) * parseInt(String(limit)));

    const countResult = await db.select({ count: count() }).from(appointments).where(whereClause);
    res.paginated(data, parseInt(String(countResult[0].count)), parseInt(String(page)), parseInt(String(limit)));
  } catch (err) {
    console.error('GET appointments error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/appointments/today
router.get('/today', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const today = new Date().toISOString().split('T')[0];
    const result = await db
      .select({
        id: appointments.id,
        pacienteId: appointments.pacienteId,
        pacienteNombre: sql<string>`(${patients.nombre} || ' ' || ${patients.apellidos})`,
        profesional: appointments.profesional,
        fecha: appointments.fecha,
        hora: appointments.hora,
        tipo: appointments.tipo,
        asunto: appointments.asunto,
        estado: appointments.estado,
        pago: appointments.pago,
        precio: appointments.precio,
        duracion: appointments.duracion,
        nota: appointments.nota,
        color: appointments.color,
        acta: appointments.acta,
        createdBy: appointments.createdBy,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.pacienteId, patients.id))
      .where(eq(appointments.fecha, today))
      .orderBy(asc(appointments.hora));
    res.success(result);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// GET /api/appointments/week
router.get('/week', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const baseDate = (req.query.fecha as string) || new Date().toISOString().split('T')[0];
    const result = await db
      .select({
        id: appointments.id,
        pacienteId: appointments.pacienteId,
        pacienteNombre: sql<string>`(${patients.nombre} || ' ' || ${patients.apellidos})`,
        profesional: appointments.profesional,
        fecha: appointments.fecha,
        hora: appointments.hora,
        tipo: appointments.tipo,
        asunto: appointments.asunto,
        estado: appointments.estado,
        pago: appointments.pago,
        precio: appointments.precio,
        duracion: appointments.duracion,
        nota: appointments.nota,
        color: appointments.color,
        acta: appointments.acta,
        createdBy: appointments.createdBy,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.pacienteId, patients.id))
      .where(
        and(
          gte(appointments.fecha, sql`(${baseDate}::date - INTERVAL '3 days')`),
          lte(appointments.fecha, sql`(${baseDate}::date + INTERVAL '3 days')`)
        )
      )
      .orderBy(asc(appointments.fecha), asc(appointments.hora));
    res.success(result);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// GET /api/appointments/:id
router.get('/:id', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db
      .select({
        id: appointments.id,
        pacienteId: appointments.pacienteId,
        pacienteNombre: sql<string>`(${patients.nombre} || ' ' || ${patients.apellidos})`,
        profesional: appointments.profesional,
        fecha: appointments.fecha,
        hora: appointments.hora,
        tipo: appointments.tipo,
        asunto: appointments.asunto,
        estado: appointments.estado,
        pago: appointments.pago,
        precio: appointments.precio,
        duracion: appointments.duracion,
        nota: appointments.nota,
        color: appointments.color,
        acta: appointments.acta,
        createdBy: appointments.createdBy,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.pacienteId, patients.id))
      .where(eq(appointments.id, req.params.id));
    if (!result.length) return res.error(404, 'Cita no encontrada');
    res.success(result[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// POST /api/appointments
router.post('/', authenticate, authorize('admin', 'nutricionista', 'secretaria'), validateZod(AppointmentCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, fecha, hora, tipo, asunto, estado, pago, precio, duracion, nota, color } = req.body;
    const result = await db.insert(appointments).values({
      pacienteId: paciente_id,
      profesional: user?.name,
      fecha,
      hora,
      tipo: tipo || 'Consulta',
      asunto: sanitize(asunto),
      estado: estado || 'Pendiente',
      pago: pago || 'Pendiente',
      precio: String(precio || 0),
      duracion: duracion || 45,
      nota: sanitize(nota),
      color: color || 'review',
      createdBy: user?.id,
    }).returning();

    await logAudit(user?.id, 'CREATE', 'Appointment', `Cita ${fecha} ${hora}`, req);
    res.created(result[0]);
  } catch (err) {
    console.error('POST appointment error:', err);
    res.error(500, 'Error interno');
  }
});

// PUT /api/appointments/:id
router.put('/:id', authenticate, authorize('admin', 'nutricionista', 'secretaria'), validateZodParams(z.object({ id: UUIDSchema })), validateZod(AppointmentUpdateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const fieldMap: Record<string, string> = {
      paciente_id: 'pacienteId', fecha: 'fecha', hora: 'hora', tipo: 'tipo',
      asunto: 'asunto', estado: 'estado', pago: 'pago', precio: 'precio',
      duracion: 'duracion', nota: 'nota', color: 'color', acta: 'acta',
    };

    const updates: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(fieldMap)) {
      if (req.body[key] !== undefined) {
        updates[field] = key === 'acta' ? req.body[key] : req.body[key];
      }
    }
    if (!Object.keys(updates).length) return res.error(400, 'Sin campos para actualizar');

    const result = await db.update(appointments).set(updates).where(eq(appointments.id, req.params.id)).returning();
    if (!result.length) return res.error(404, 'No encontrada');

    await logAudit(user?.id, 'UPDATE', 'Appointment', `Cita ${result[0].fecha}`, req);
    res.success(result[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// PUT /api/appointments/:id/status — Quick status change
router.put('/:id/status', authenticate, validateZodParams(z.object({ id: UUIDSchema })), validateZod(z.object({ estado: AppointmentStatusSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.update(appointments).set({ estado: req.body.estado }).where(eq(appointments.id, req.params.id)).returning();
    if (!result.length) return res.error(404, 'No encontrada');
    res.success(result[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', authenticate, authorize('admin', 'nutricionista'), validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.delete(appointments).where(eq(appointments.id, req.params.id)).returning({ id: appointments.id });
    if (!result.length) return res.error(404, 'No encontrada');
    await logAudit(user?.id, 'DELETE', 'Appointment', 'Cita eliminada', req);
    res.success({ ok: true });
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

export default router;