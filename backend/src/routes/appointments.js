// Appointments CRUD routes with Zod validation
const express = require('express');
const { z } = require('zod');

const { query } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateZod, validateZodQuery, validateZodParams } = require('../middleware/zodValidate');
const {
  AppointmentCreateSchema,
  AppointmentUpdateSchema,
  AppointmentStatusSchema,
  AppointmentListQuerySchema,
  UUIDSchema,
} = require('../schemas');
const { logAudit } = require('../utils/audit');
const { sanitize } = require('../middleware/validate');

const router = express.Router();

// GET /api/appointments — List with filters
router.get('/', authenticate, validateZodQuery(AppointmentListQuerySchema), async (req, res) => {
  try {
    const { paciente_id, estado, fecha, fecha_desde, fecha_hasta, page = 1, limit = 100 } = req.query;
    let sql = `SELECT a.*, p.nombre || ' ' || p.apellidos AS paciente_nombre
               FROM appointments a
               LEFT JOIN patients p ON p.id = a.paciente_id
               WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (paciente_id) { sql += ` AND a.paciente_id = $${idx++}`; params.push(paciente_id); }
    if (estado) { sql += ` AND a.estado = $${idx++}`; params.push(estado); }
    if (fecha) { sql += ` AND a.fecha = $${idx++}`; params.push(fecha); }
    if (fecha_desde) { sql += ` AND a.fecha >= $${idx++}`; params.push(fecha_desde); }
    if (fecha_hasta) { sql += ` AND a.fecha <= $${idx++}`; params.push(fecha_hasta); }

    sql += ' ORDER BY a.fecha DESC, a.hora DESC';
    sql += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(sql, params);
    const countSql = `SELECT COUNT(*) FROM appointments a WHERE 1=1` +
      (paciente_id ? ` AND a.paciente_id = $1` : '') +
      (estado ? ` AND a.estado = $${paciente_id ? 2 : 1}` : '');
    const countParams = [];
    if (paciente_id) countParams.push(paciente_id);
    if (estado) countParams.push(estado);
    const count = await query(countSql, countParams);

    res.paginated(result.rows, parseInt(count.rows[0].count), parseInt(page), parseInt(limit));
  } catch (err) {
    console.error('GET appointments error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/appointments/today
router.get('/today', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, p.nombre || ' ' || p.apellidos AS paciente_nombre
       FROM appointments a
       LEFT JOIN patients p ON p.id = a.paciente_id
       WHERE a.fecha = CURRENT_DATE
       ORDER BY a.hora`,
      []
    );
    res.success(result.rows);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// GET /api/appointments/week
router.get('/week', authenticate, validateZodQuery(z.object({ fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() })), async (req, res) => {
  try {
    const { fecha } = req.query;
    const baseDate = fecha || new Date().toISOString().split('T')[0];
    const result = await query(
      `SELECT a.*, p.nombre || ' ' || p.apellidos AS paciente_nombre
       FROM appointments a
       LEFT JOIN patients p ON p.id = a.paciente_id
       WHERE a.fecha >= ($1::date - INTERVAL '3 days')
         AND a.fecha <= ($1::date + INTERVAL '3 days')
       ORDER BY a.fecha, a.hora`,
      [baseDate]
    );
    res.success(result.rows);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// GET /api/appointments/:id
router.get('/:id', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, p.nombre || ' ' || p.apellidos AS paciente_nombre
       FROM appointments a
       LEFT JOIN patients p ON p.id = a.paciente_id
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.error(404, 'Cita no encontrada');
    res.success(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// POST /api/appointments
router.post('/', authenticate, authorize('admin', 'nutricionista', 'secretaria'), validateZod(AppointmentCreateSchema), async (req, res) => {
  try {
    const { paciente_id, fecha, hora, tipo, asunto, estado, pago, precio, duracion, nota, color } = req.body;
    const result = await query(
      `INSERT INTO appointments (paciente_id, profesional, fecha, hora, tipo, asunto, estado, pago, precio, duracion, nota, color, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [paciente_id, req.user.name, fecha, hora, tipo || 'Consulta', sanitize(asunto), estado || 'Pendiente', pago || 'Pendiente', precio || 0, duracion || 45, sanitize(nota), color || 'review', req.user.id]
    );

    await logAudit(req.user.id, 'CREATE', 'Appointment', `Cita ${fecha} ${hora}`, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error('POST appointment error:', err);
    res.error(500, 'Error interno');
  }
});

// PUT /api/appointments/:id
router.put('/:id', authenticate, authorize('admin', 'nutricionista', 'secretaria'), validateZodParams(z.object({ id: UUIDSchema })), validateZod(AppointmentUpdateSchema), async (req, res) => {
  try {
    const fields = ['paciente_id', 'fecha', 'hora', 'tipo', 'asunto', 'estado', 'pago', 'precio', 'duracion', 'nota', 'color', 'acta'];
    const updates = [], values = [];
    let idx = 1;

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = $${idx++}`);
        values.push(f === 'acta' ? JSON.stringify(req.body[f]) : req.body[f]);
      }
    }
    if (!updates.length) return res.error(400, 'Sin campos para actualizar');

    values.push(req.params.id);
    const result = await query(`UPDATE appointments SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (!result.rows.length) return res.error(404, 'No encontrada');

    await logAudit(req.user.id, 'UPDATE', 'Appointment', `Cita ${result.rows[0].fecha}`, req);
    res.success(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// PUT /api/appointments/:id/status — Quick status change
router.put('/:id/status', authenticate, validateZodParams(z.object({ id: UUIDSchema })), validateZod(z.object({ estado: AppointmentStatusSchema })), async (req, res) => {
  try {
    const result = await query(
      `UPDATE appointments SET estado = $1 WHERE id = $2 RETURNING *`,
      [req.body.estado, req.params.id]
    );
    if (!result.rows.length) return res.error(404, 'No encontrada');
    res.success(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', authenticate, authorize('admin', 'nutricionista'), validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const result = await query('DELETE FROM appointments WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.error(404, 'No encontrada');
    await logAudit(req.user.id, 'DELETE', 'Appointment', `Cita eliminada`, req);
    res.success({ ok: true });
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

module.exports = router;
