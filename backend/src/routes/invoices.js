// Invoices CRUD routes with Zod validation
const express = require('express');
const { z } = require('zod');
const { query } = require('../config/db');

const { authenticate, authorize } = require('../middleware/auth');
const { validateZod, validateZodQuery, validateZodParams } = require('../middleware/zodValidate');
const {
  InvoiceCreateSchema,
  InvoiceUpdateSchema,
  InvoiceLineSchema,
  InvoicePaymentSchema,
  InvoiceStatusSchema,
  InvoiceListQuerySchema,
  UUIDSchema,
} = require('../schemas');
const { logAudit } = require('../utils/audit');
const { sanitize } = require('../middleware/validate');

const router = express.Router();

// GET /api/invoices
router.get('/', authenticate, validateZodQuery(InvoiceListQuerySchema), async (req, res) => {
  try {
    const { paciente_id, estado, fecha_desde, fecha_hasta, page = 1, limit = 50 } = req.query;
    let sql = `SELECT i.*, p.nombre || ' ' || p.apellidos AS paciente_nombre
               FROM invoices i
               LEFT JOIN patients p ON p.id = i.paciente_id
               WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (paciente_id) { sql += ` AND i.paciente_id = $${idx++}`; params.push(paciente_id); }
    if (estado) { sql += ` AND i.estado = $${idx++}`; params.push(estado); }
    if (fecha_desde) { sql += ` AND i.fecha >= $${idx++}`; params.push(fecha_desde); }
    if (fecha_hasta) { sql += ` AND i.fecha <= $${idx++}`; params.push(fecha_hasta); }

    sql += ' ORDER BY i.fecha DESC';
    sql += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(sql, params);
    const count = await query('SELECT COUNT(*) FROM invoices', []);
    res.paginated(result.rows, parseInt(count.rows[0].count), parseInt(page), parseInt(limit));
  } catch (err) {
    console.error('GET invoices error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/invoices/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;
    let sql = `SELECT
                 COUNT(*) AS total,
                 COALESCE(SUM(total), 0) AS total_importe,
                 COALESCE(SUM(CASE WHEN estado = 'Pagada' THEN total ELSE 0 END), 0) AS cobrado,
                 COALESCE(SUM(CASE WHEN estado = 'Pendiente' THEN total ELSE 0 END), 0) AS pendiente,
                 COALESCE(SUM(CASE WHEN estado = 'Vencida' THEN total ELSE 0 END), 0) AS vencido
               FROM invoices WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (fecha_desde) { sql += ` AND fecha >= $${idx++}`; params.push(fecha_desde); }
    if (fecha_hasta) { sql += ` AND fecha <= $${idx++}`; params.push(fecha_hasta); }
    const result = await query(sql, params);
    res.success(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// GET /api/invoices/:id
router.get('/:id', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const result = await query(
      `SELECT i.*, p.nombre || ' ' || p.apellidos AS paciente_nombre
       FROM invoices i LEFT JOIN patients p ON p.id = i.paciente_id
       WHERE i.id = $1`, [req.params.id]
    );
    if (!result.rows.length) return res.error(404, 'Factura no encontrada');
    res.success(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// POST /api/invoices
router.post('/', authenticate, authorize('admin', 'nutricionista'), validateZod(InvoiceCreateSchema), async (req, res) => {
  try {
    const { paciente_id, lineas, notas, concepto, total, estado, fecha } = req.body;
    // Generate invoice number
    const countResult = await query('SELECT COUNT(*) FROM invoices', []);
    const num = `VH-${String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0')}`;
    const calculatedTotal = lineas?.reduce((sum, l) => sum + (l.cantidad || 1) * (l.precio || 0), 0) || total;

    const result = await query(
      `INSERT INTO invoices (numero, paciente_id, total, lineas, notas, estado, fecha, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [num, paciente_id, calculatedTotal, JSON.stringify(lineas || []), notas, estado || 'Pendiente', fecha || new Date().toISOString().split('T')[0], req.user.id]
    );

    await logAudit(req.user.id, 'CREATE', 'Invoice', `Factura ${num}`, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error('POST invoice error:', err);
    res.error(500, 'Error interno');
  }
});

// PUT /api/invoices/:id
router.put('/:id', authenticate, authorize('admin', 'nutricionista'), validateZodParams(z.object({ id: UUIDSchema })), validateZod(InvoiceUpdateSchema), async (req, res) => {
  try {
    const fields = ['estado', 'lineas', 'total', 'notas', 'fecha'];
    const updates = [], values = [];
    let idx = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = $${idx++}`);
        values.push((f === 'lineas') ? JSON.stringify(req.body[f]) : req.body[f]);
      }
    }
    if (!updates.length) return res.error(400, 'Sin campos para actualizar');
    values.push(req.params.id);
    const result = await query(`UPDATE invoices SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (!result.rows.length) return res.error(404, 'No encontrada');
    res.success(result.rows[0]);
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
    const existing = await query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.error(404, 'No encontrada');

    const inv = existing.rows[0];
    const pagos = inv.pagos || [];
    pagos.push({ importe: parseFloat(req.body.importe), metodo: req.body.metodo || 'Efectivo', fecha: req.body.fecha || new Date().toISOString() });

    const totalPagado = pagos.reduce((s, p) => s + p.importe, 0);
    const nuevoEstado = totalPagado >= parseFloat(inv.total) ? 'Pagada' : 'Pendiente';

    const result = await query(
      `UPDATE invoices SET pagos = $1, estado = $2 WHERE id = $3 RETURNING *`,
      [JSON.stringify(pagos), nuevoEstado, req.params.id]
    );
    res.success(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// PUT /api/invoices/:id/void
router.put('/:id/void', authenticate, authorize('admin'), validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const result = await query(`UPDATE invoices SET estado = 'Anulada' WHERE id = $1 RETURNING *`, [req.params.id]);
    if (!result.rows.length) return res.error(404, 'No encontrada');
    await logAudit(req.user.id, 'UPDATE', 'Invoice', `Factura anulada ${result.rows[0].numero}`, req);
    res.success(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', authenticate, authorize('admin'), validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const result = await query('DELETE FROM invoices WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.error(404, 'No encontrada');
    res.success({ ok: true });
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

module.exports = router;
