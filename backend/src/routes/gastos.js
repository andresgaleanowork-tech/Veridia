// Accounting / Gastos routes with Zod validation
const express = require('express');
const { z } = require('zod');

const { query } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateZod, validateZodQuery, validateZodParams } = require('../middleware/zodValidate');
const {
  ExpenseCreateSchema,
  ExpenseUpdateSchema,
  ExpenseListQuerySchema,
  UUIDSchema,
  ISODateSchema,
} = require('../schemas');
const { logAudit } = require('../utils/audit');
const { sanitize } = require('../middleware/validate');

const router = express.Router();

// GET /api/gastos
router.get('/', authenticate, validateZodQuery(ExpenseListQuerySchema), async (req, res) => {
  try {
    const { categoria, fecha_desde, fecha_hasta, page = 1, limit = 50 } = req.query;
    let sql = 'SELECT * FROM gastos WHERE 1=1';
    const params = [];
    let idx = 1;

    if (categoria) { sql += ` AND categoria = $${idx++}`; params.push(categoria); }
    if (fecha_desde) { sql += ` AND fecha >= $${idx++}`; params.push(fecha_desde); }
    if (fecha_hasta) { sql += ` AND fecha <= $${idx++}`; params.push(fecha_hasta); }

    sql += ' ORDER BY fecha DESC';
    sql += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(sql, params);
    const count = await query('SELECT COUNT(*), COALESCE(SUM(importe),0) AS total FROM gastos', []);
    res.success({ data: result.rows, total: parseInt(count.rows[0].count), totalImporte: parseFloat(count.rows[0].total) });
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// GET /api/gastos/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT categoria, SUM(importe) AS total, COUNT(*) AS count
       FROM gastos GROUP BY categoria ORDER BY total DESC`, []
    );
    res.success(result.rows);
  } catch (err) { res.error(500, 'Error interno'); }
});

// POST /api/gastos
router.post('/', authenticate, authorize('admin', 'nutricionista'), validateZod(ExpenseCreateSchema), async (req, res) => {
  try {
    const { categoria, descripcion, importe, fecha, metodo_pago, recurrente, frecuencia, proveedor, notas } = req.body;
    const result = await query(
      `INSERT INTO gastos (categoria, descripcion, importe, fecha, metodo_pago, recurrente, frecuencia, proveedor, notas, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [sanitize(categoria), sanitize(descripcion), importe, fecha || new Date().toISOString().split('T')[0], metodo_pago || 'Efectivo', recurrente || false, frecuencia, sanitize(proveedor), sanitize(notas), req.user.id]
    );
    await logAudit(req.user.id, 'CREATE', 'Gasto', `${categoria}: ${importe}€`, req);
    res.created(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// PUT /api/gastos/:id
router.put('/:id', authenticate, authorize('admin'), validateZodParams(z.object({ id: UUIDSchema })), validateZod(ExpenseUpdateSchema), async (req, res) => {
  try {
    const fields = ['categoria', 'descripcion', 'importe', 'fecha', 'metodo_pago', 'proveedor', 'notas', 'recurrente', 'frecuencia'];
    const updates = [], values = [];
    let idx = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) { updates.push(`${f} = $${idx++}`); values.push(req.body[f]); }
    }
    if (!updates.length) return res.error(400, 'Sin campos para actualizar');
    values.push(req.params.id);
    const result = await query(`UPDATE gastos SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (!result.rows.length) return res.error(404, 'No encontrado');
    res.success(result.rows[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

// DELETE /api/gastos/:id
router.delete('/:id', authenticate, authorize('admin'), validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const result = await query('DELETE FROM gastos WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.error(404, 'No encontrado');
    await logAudit(req.user.id, 'DELETE', 'Gasto', 'Gasto eliminado', req);
    res.success({ ok: true });
  } catch (err) { res.error(500, 'Error interno'); }
});

module.exports = router;
