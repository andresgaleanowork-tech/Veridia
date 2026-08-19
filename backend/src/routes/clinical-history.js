// Anamnesis + Clinical History routes with Zod validation
const express = require('express');
const { z } = require('zod');

const { query } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateZod, validateZodParams } = require('../middleware/zodValidate');
const {
  AnamnesisCreateSchema,
  ClinicalHistoryCreateSchema,
  UUIDSchema,
} = require('../schemas');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// ─── ANAMNESIS ───

// GET /api/clinical/anamnesis/:pacienteId
router.get('/anamnesis/:pacienteId', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM anamnesis WHERE paciente_id = $1 ORDER BY fecha DESC',
      [req.params.pacienteId]
    );
    res.success(result.rows);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// POST /api/clinical/anamnesis
router.post('/anamnesis', authenticate, validateZod(AnamnesisCreateSchema), async (req, res) => {
  try {
    const { paciente_id, template, sistemas, respuestas, red_flags } = req.body;
    const result = await query(
      `INSERT INTO anamnesis (paciente_id, template, profesional, sistemas, respuestas, red_flags)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [paciente_id, template, req.user.name, sistemas || [], JSON.stringify(respuestas || {}), JSON.stringify(red_flags || [])]
    );
    await logAudit(req.user.id, 'CREATE', 'Anamnesis', `Paciente ${paciente_id}`, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error('POST anamnesis error:', err);
    res.error(500, 'Error interno');
  }
});

// PUT /api/clinical/anamnesis/:id
router.put('/anamnesis/:id', authenticate, validateZodParams(z.object({ id: UUIDSchema })), validateZod(z.object({
  sistemas: z.array(z.string()).optional(),
  respuestas: z.record(z.unknown()).optional(),
  red_flags: z.array(z.unknown()).optional(),
})), async (req, res) => {
  try {
    const { sistemas, respuestas, red_flags } = req.body;
    const updates = [], values = [];
    let idx = 1;
    if (sistemas !== undefined) { updates.push(`sistemas = $${idx++}`); values.push(sistemas); }
    if (respuestas !== undefined) { updates.push(`respuestas = $${idx++}`); values.push(JSON.stringify(respuestas)); }
    if (red_flags !== undefined) { updates.push(`red_flags = $${idx++}`); values.push(JSON.stringify(red_flags)); }
    if (!updates.length) return res.error(400, 'Sin campos para actualizar');
    values.push(req.params.id);
    const result = await query(`UPDATE anamnesis SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (!result.rows.length) return res.error(404, 'No encontrada');
    res.success(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// ─── CLINICAL HISTORIES ───

// GET /api/clinical/histories/:pacienteId
router.get('/histories/:pacienteId', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM clinical_histories WHERE paciente_id = $1 ORDER BY version DESC',
      [req.params.pacienteId]
    );
    res.success(result.rows);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// GET /api/clinical/histories/:pacienteId/latest
router.get('/histories/:pacienteId/latest', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM clinical_histories WHERE paciente_id = $1 ORDER BY version DESC LIMIT 1',
      [req.params.pacienteId]
    );
    res.success(result.rows[0] || null);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// POST /api/clinical/histories
router.post('/histories', authenticate, validateZod(ClinicalHistoryCreateSchema), async (req, res) => {
  try {
    const { paciente_id, antecedentes, antecedentes_familiares, alergias, medicacion, suplementacion, historial_ponderal, actividad_fisica, habitos_toxicos, sueno, estres, ingesta_hidrica, observaciones } = req.body;

    const last = await query('SELECT MAX(version) AS v FROM clinical_histories WHERE paciente_id = $1', [paciente_id]);
    const nextVersion = (last.rows[0].v || 0) + 1;

    const result = await query(
      `INSERT INTO clinical_histories (paciente_id, version, antecedentes, antecedentes_familiares, alergias, medicacion, suplementacion, historial_ponderal, actividad_fisica, habitos_toxicos, sueno, estres, ingesta_hidrica, observaciones, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [paciente_id, nextVersion, antecedentes, antecedentes_familiares, alergias, medicacion, suplementacion,
       JSON.stringify(historial_ponderal || {}), JSON.stringify(actividad_fisica || {}),
       habitos_toxicos, sueno, estres, ingesta_hidrica, observaciones, req.user.id]
    );
    await logAudit(req.user.id, 'CREATE', 'ClinicalHistory', `v${nextVersion} paciente ${paciente_id}`, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error('POST history error:', err);
    res.error(500, 'Error interno');
  }
});

// PUT /api/clinical/histories/:id
router.put('/histories/:id', authenticate, validateZodParams(z.object({ id: UUIDSchema })), validateZod(z.object({
  antecedentes: z.string().optional(),
  antecedentes_familiares: z.string().optional(),
  alergias: z.string().optional(),
  medicacion: z.string().optional(),
  suplementacion: z.string().optional(),
  historial_ponderal: z.record(z.unknown()).optional(),
  actividad_fisica: z.record(z.unknown()).optional(),
  habitos_toxicos: z.string().optional(),
  sueno: z.string().optional(),
  estres: z.string().optional(),
  ingesta_hidrica: z.string().optional(),
  observaciones: z.string().optional(),
})), async (req, res) => {
  try {
    const updates = [], values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined) {
        updates.push(`${key} = $${idx++}`);
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
      }
    }
    if (!updates.length) return res.error(400, 'Sin campos para actualizar');
    values.push(req.params.id);
    const result = await query(`UPDATE clinical_histories SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (!result.rows.length) return res.error(404, 'No encontrada');
    res.success(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

module.exports = router;
