// Clinical routes: anthropometry, analytics, alerts, formulas with Zod validation
const express = require('express');
const { z } = require('zod');

const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { validateZod, validateZodQuery, validateZodParams } = require('../middleware/zodValidate');
const {
  AnthropometryCreateSchema,
  AnalyticsCreateSchema,
  BiomarkerSchema,
  FormulaRequestSchema,
  AlertCreateSchema,
  AlertStatusSchema,
  UUIDSchema,
  ISODateSchema,
} = require('../schemas');
const { logAudit } = require('../utils/audit');
const { sanitize } = require('../middleware/validate');

const router = express.Router();

// ---- ANTHROPOMETRY ----

// POST /api/clinical/antropometria
router.post('/antropometria', authenticate, validateZod(AnthropometryCreateSchema), async (req, res) => {
  try {
    const { paciente_id, fecha, peso, altura, cintura, cadera, pantorrilla, grasa_corporal, masa_muscular, grasa_visceral, metodo } = req.body;
    const imc = +(peso / ((altura / 100) ** 2)).toFixed(1);

    const result = await query(
      `INSERT INTO antropometrias (paciente_id, fecha, peso, altura, imc, cintura, cadera, pantorrilla, grasa_corporal, masa_muscular, grasa_visceral, metodo, created_by)
       VALUES ($1, COALESCE($2, CURRENT_DATE), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [paciente_id, fecha, peso, altura, imc, cintura || 0, cadera || 0, pantorrilla || 0, grasa_corporal || 0, masa_muscular || 0, grasa_visceral || 0, metodo || 'BIA', req.user.id]
    );

    const pat = await query('SELECT nombre, apellidos FROM patients WHERE id = $1', [paciente_id]);
    await logAudit(req.user.id, 'CREATE', 'Antropometria', pat.rows[0]?.nombre + ' ' + pat.rows[0]?.apellidos, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error('POST antro error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/clinical/antropometria/:pacienteId
router.get('/antropometria/:pacienteId', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), async (req, res) => {
  try {
    const result = await query('SELECT * FROM antropometrias WHERE paciente_id = $1 ORDER BY fecha DESC', [req.params.pacienteId]);
    res.success(result.rows);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// ---- ANALYTICS ----

// POST /api/clinical/analitica
router.post('/analitica', authenticate, validateZod(AnalyticsCreateSchema), async (req, res) => {
  try {
    const { paciente_id, fecha, ayuno, marcadores } = req.body;
    const result = await query(
      'INSERT INTO analiticas (paciente_id, fecha, ayuno, marcadores, created_by) VALUES ($1, COALESCE($2, CURRENT_DATE), $3, $4, $5) RETURNING *',
      [paciente_id, fecha, ayuno ?? true, JSON.stringify(marcadores), req.user.id]
    );

    // Auto-generate alerts for critical values
    for (const m of marcadores) {
      if (m.alerta === 'grave') {
        await query(
          'INSERT INTO alerts (paciente_id, tipo, severidad, mensaje, recomendacion, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
          [paciente_id, 'Analítica', 'grave', `${m.nombre} ${m.valor} ${m.unidad} — Fuera de rango (${m.rango})`, m.recomendacion || 'Valoración clínica', req.user.id]
        );
      }
    }

    res.created(result.rows[0]);
  } catch (err) {
    console.error('POST analitica error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/clinical/analitica/:pacienteId
router.get('/analitica/:pacienteId', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), async (req, res) => {
  try {
    const result = await query('SELECT * FROM analiticas WHERE paciente_id = $1 ORDER BY fecha DESC', [req.params.pacienteId]);
    res.success(result.rows);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// ---- FORMULA CALCULATION (server-side, tamper-proof) ----

// POST /api/clinical/formula
router.post('/formula', authenticate, validateZod(FormulaRequestSchema), async (req, res) => {
  const { peso, altura, edad, sexo, formula, fa, fe = 1, ajuste = 0, protGkg = 1.2, grasasPct = 30 } = req.body;

  let geb;
  if (formula === 'Mifflin-St Jeor') geb = 10 * peso + 6.25 * altura - 5 * edad + (sexo === 'M' ? 5 : -161);
  else if (formula === 'Harris-Benedict') geb = sexo === 'M' ? 66.5 + 13.75 * peso + 5.003 * altura - 6.775 * edad : 655.1 + 9.563 * peso + 1.85 * altura - 4.676 * edad;
  else geb = sexo === 'M' ? 879 + 10.2 * peso : 795 + 7.18 * peso;

  const get = Math.round(geb * fa * fe) + ajuste;
  const protG = Math.round(protGkg * peso);
  const grasasG = Math.round(get * grasasPct / 100 / 9);
  const hcG = Math.round((get - protG * 4 - grasasG * 9) / 4);

  res.success({
    formula, geb: Math.round(geb), fa, fe, ajuste, get,
    macros: {
      proteinas: { g: protG, pct: Math.round(protG * 4 / get * 100), kcal: protG * 4, gKg: protGkg },
      grasas: { g: grasasG, pct: grasasPct, kcal: grasasG * 9 },
      hc: { g: Math.max(0, hcG), pct: 100 - Math.round(protG * 4 / get * 100) - grasasPct, kcal: Math.max(0, hcG) * 4 },
      fibra: { g: Math.max(25, Math.round(14 * get / 1000)) },
      agua: { l: Math.round(35 * peso / 1000 * 10) / 10 },
    }
  });
});

// ---- ALERTS ----

// GET /api/clinical/alerts/:pacienteId
router.get('/alerts/:pacienteId', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), async (req, res) => {
  try {
    const result = await query('SELECT * FROM alerts WHERE paciente_id = $1 ORDER BY created_at DESC', [req.params.pacienteId]);
    res.success(result.rows);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// POST /api/clinical/alerts
router.post('/alerts', authenticate, validateZod(AlertCreateSchema), async (req, res) => {
  try {
    const { paciente_id, tipo, severidad, mensaje, recomendacion, estado } = req.body;
    const result = await query(
      `INSERT INTO alerts (paciente_id, tipo, severidad, mensaje, recomendacion, estado, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [paciente_id, tipo, severidad, mensaje, recomendacion, estado || 'pendiente', req.user.id]
    );
    await logAudit(req.user.id, 'CREATE', 'Alert', `Alerta para ${paciente_id}`, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error('POST alert error:', err);
    res.error(500, 'Error interno');
  }
});

// PUT /api/clinical/alerts/:id/review
router.put('/alerts/:id/review', authenticate, validateZodParams(z.object({ id: UUIDSchema })), validateZod(z.object({ estado: AlertStatusSchema })), async (req, res) => {
  try {
    const result = await query("UPDATE alerts SET estado = $1 WHERE id = $2 RETURNING *", [req.body.estado, req.params.id]);
    if (!result.rows.length) return res.error(404, 'No encontrada');
    res.success(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

module.exports = router;
