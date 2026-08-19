// Patient Diary + Symptoms routes with Zod validation
const express = require('express');
const { z } = require('zod');

const { query } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateZod, validateZodQuery, validateZodParams } = require('../middleware/zodValidate');
const {
  DiaryCreateSchema,
  SymptomCreateSchema,
  UUIDSchema,
  ISODateSchema,
} = require('../schemas');
const { sanitize } = require('../middleware/validate');

const router = express.Router();

// ─── DIARY ───

// GET /api/patients/:id/diary
router.get('/:id/diary', authenticate, validateZodParams(z.object({ id: UUIDSchema })), validateZodQuery(z.object({
  fecha_desde: ISODateSchema.optional(),
  fecha_hasta: ISODateSchema.optional(),
  toma: z.string().optional(),
})), async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, toma } = req.query;
    let sql = 'SELECT * FROM patient_diary WHERE paciente_id = $1';
    const params = [req.params.id];
    let idx = 2;

    if (fecha_desde) { sql += ` AND fecha >= $${idx++}`; params.push(fecha_desde); }
    if (fecha_hasta) { sql += ` AND fecha <= $${idx++}`; params.push(fecha_hasta); }
    if (toma) { sql += ` AND toma = $${idx++}`; params.push(toma); }

    sql += ' ORDER BY fecha DESC, hora DESC';
    const result = await query(sql, params);
    res.success(result.rows);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// POST /api/patients/:id/diary
router.post('/:id/diary', authenticate, validateZodParams(z.object({ id: UUIDSchema })), validateZod(DiaryCreateSchema), async (req, res) => {
  try {
    const { toma, texto, hora, fecha } = req.body;
    const result = await query(
      `INSERT INTO patient_diary (paciente_id, fecha, toma, texto, hora)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, fecha || new Date().toISOString().split('T')[0], toma, sanitize(texto), hora || new Date().toTimeString().slice(0,5)]
    );
    res.created(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// DELETE /api/patients/:id/diary/:entryId
router.delete('/:id/diary/:entryId', authenticate, validateZodParams(z.object({
  id: UUIDSchema,
  entryId: UUIDSchema,
})), async (req, res) => {
  try {
    const result = await query('DELETE FROM patient_diary WHERE id = $1 AND paciente_id = $2 RETURNING id', [req.params.entryId, req.params.id]);
    if (!result.rows.length) return res.error(404, 'Entrada no encontrada');
    res.success({ ok: true });
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// ─── SYMPTOMS ───

// GET /api/patients/:id/symptoms
router.get('/:id/symptoms', authenticate, validateZodParams(z.object({ id: UUIDSchema })), validateZodQuery(z.object({
  fecha_desde: ISODateSchema.optional(),
  fecha_hasta: ISODateSchema.optional(),
  tipo: z.enum(['animo', 'hambre', 'sueno', 'sintoma']).optional(),
})), async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, tipo } = req.query;
    let sql = 'SELECT * FROM patient_symptoms WHERE paciente_id = $1';
    const params = [req.params.id];
    let idx = 2;

    if (fecha_desde) { sql += ` AND fecha >= $${idx++}`; params.push(fecha_desde); }
    if (fecha_hasta) { sql += ` AND fecha <= $${idx++}`; params.push(fecha_hasta); }
    if (tipo) { sql += ` AND tipo = $${idx++}`; params.push(tipo); }

    sql += ' ORDER BY fecha DESC, hora DESC';
    const result = await query(sql, params);
    res.success(result.rows);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// POST /api/patients/:id/symptoms
router.post('/:id/symptoms', authenticate, validateZodParams(z.object({ id: UUIDSchema })), validateZod(SymptomCreateSchema), async (req, res) => {
  try {
    const { tipo, valor, fecha, hora } = req.body;
    const result = await query(
      `INSERT INTO patient_symptoms (paciente_id, fecha, tipo, valor, hora)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, fecha || new Date().toISOString().split('T')[0], tipo, sanitize(valor), hora || new Date().toTimeString().slice(0,5)]
    );
    res.created(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// DELETE /api/patients/:id/symptoms/:entryId
router.delete('/:id/symptoms/:entryId', authenticate, validateZodParams(z.object({
  id: UUIDSchema,
  entryId: UUIDSchema,
})), async (req, res) => {
  try {
    const result = await query('DELETE FROM patient_symptoms WHERE id = $1 AND paciente_id = $2 RETURNING id', [req.params.entryId, req.params.id]);
    if (!result.rows.length) return res.error(404, 'Entrada no encontrada');
    res.success({ ok: true });
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

module.exports = router;
