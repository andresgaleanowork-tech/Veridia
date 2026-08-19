// Fitness Platform Integration routes
const express = require('express');
const { query } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');
const { validateZod, validateZodParams } = require('../middleware/zodValidate');
const { UUIDSchema } = require('../schemas');
const { logAudit } = require('../utils/audit');

const router = express.Router();

const FITNESS_PLATFORMS = ['google_fit', 'apple_health', 'fitbit', 'samsung_health', 'garmin'];
const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

function parseFactor(value) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(n) || n < 1.0 || n > 2.5) return null;
  return +n.toFixed(3);
}

function factorLabel(factor) {
  for (const [k, v] of Object.entries(ACTIVITY_FACTORS)) {
    if (Math.abs(v - factor) < 0.001) return k;
  }
  return 'custom';
}

// POST /api/fitness/connect/:platform
router.post('/connect/:platform', authenticate, authorize('nutricionista'), validateZodParams(z.object({ platform: z.enum(FITNESS_PLATFORMS) })), async (req, res) => {
  try {
    const { platform } = req.params;
    const { paciente_id, external_user_id, scopes } = req.body;

    if (!paciente_id) return res.error(400, 'paciente_id es requerido');

    const patient = await query('SELECT id, nombre, apellidos FROM patients WHERE id = $1', [paciente_id]);
    if (!patient.rows.length) return res.error(404, 'Paciente no encontrado');

    const existing = await query('SELECT id FROM fitness_connections WHERE paciente_id = $1 AND platform = $2', [paciente_id, platform]);
    if (existing.rows.length) {
      return res.error(409, 'Conexión ya existe para este paciente y plataforma');
    }

    const result = await query(
      `INSERT INTO fitness_connections (paciente_id, platform, external_user_id, scopes, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [paciente_id, platform, external_user_id || null, scopes ? JSON.stringify(scopes) : '{}', req.user.id]
    );

    await logAudit(req.user.id, 'CREATE', 'FitnessConnection', `${platform} para ${patient.rows[0].nombre} ${patient.rows[0].apellidos}`, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error('POST fitness connect error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/fitness/disconnect
router.get('/disconnect', authenticate, authorize('nutricionista'), async (req, res) => {
  try {
    const { paciente_id, platform } = req.query;

    if (!paciente_id || !platform) return res.error(400, 'paciente_id y platform son requeridos');

    const patient = await query('SELECT id, nombre, apellidos FROM patients WHERE id = $1', [paciente_id]);
    if (!patient.rows.length) return res.error(404, 'Paciente no encontrado');

    const result = await query(
      'UPDATE fitness_connections SET active = false WHERE paciente_id = $1 AND platform = $2 RETURNING *',
      [paciente_id, platform]
    );
    if (!result.rows.length) return res.error(404, 'Conexión no encontrada');

    await logAudit(req.user.id, 'UPDATE', 'FitnessConnection', `Desconectar ${platform} para ${patient.rows[0].nombre} ${patient.rows[0].apellidos}`, req);
    res.success(result.rows[0]);
  } catch (err) {
    console.error('GET fitness disconnect error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/fitness/activities/:patientId
router.get('/activities/:patientId', authenticate, authorize('nutricionista'), validateZodParams(z.object({ patientId: UUIDSchema })), async (req, res) => {
  try {
    const { patientId } = req.params;
    const { from, to, limit = 100 } = req.query;

    let sql = 'SELECT * FROM fitness_activities WHERE paciente_id = $1';
    const params = [patientId];
    let idx = 2;

    if (from) { sql += ` AND start_time >= $${idx++}`; params.push(from); }
    if (to) { sql += ` AND start_time <= $${idx++}`; params.push(to); }

    sql += ' ORDER BY start_time DESC';
    sql += ` LIMIT $${idx++}`;
    params.push(Math.min(parseInt(limit, 10) || 100, 500));

    const result = await query(sql, params);
    res.success(result.rows);
  } catch (err) {
    console.error('GET fitness activities error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/fitness/summary/:patientId
router.get('/summary/:patientId', authenticate, authorize('nutricionista'), validateZodParams(z.object({ patientId: UUIDSchema })), async (req, res) => {
  try {
    const { patientId } = req.params;
    const { from, to } = req.query;

    let where = 'WHERE paciente_id = $1';
    const params = [patientId];
    let idx = 2;

    if (from) { where += ` AND start_time >= $${idx++}`; params.push(from); }
    if (to) { where += ` AND start_time <= $${idx++}`; params.push(to); }

    const [summaryRow, factorRow] = await Promise.all([
      query(`SELECT
        COUNT(*) as total_activities,
        COALESCE(SUM(steps), 0) as total_steps,
        COALESCE(SUM(active_minutes), 0) as total_active_minutes,
        COALESCE(SUM(calories_burned), 0) as total_calories_burned,
        COALESCE(SUM(duration_minutes), 0) as total_duration_minutes,
        COALESCE(SUM(distance_meters), 0) as total_distance_meters
      FROM fitness_activities ${where}`, params),
      query('SELECT factor, label, reason FROM patient_activity_factors WHERE paciente_id = $1 AND active = true', [patientId]),
    ]);

    const summary = summaryRow.rows[0] || {};
    const activeFactor = factorRow.rows.length > 0 ? factorRow.rows[0] : null;

    res.success({
      patientId,
      totalActivities: parseInt(summary.total_activities || 0, 10),
      totalSteps: parseInt(summary.total_steps || 0, 10),
      totalActiveMinutes: parseInt(summary.total_active_minutes || 0, 10),
      totalCaloriesBurned: parseFloat(summary.total_calories_burned || 0),
      totalDurationMinutes: parseInt(summary.total_duration_minutes || 0, 10),
      totalDistanceMeters: parseFloat(summary.total_distance_meters || 0),
      activityFactor: activeFactor ? {
        factor: parseFloat(activeFactor.factor),
        label: activeFactor.label,
        reason: activeFactor.reason,
      } : { factor: ACTIVITY_FACTORS.moderate, label: 'moderate', reason: null },
    });
  } catch (err) {
    console.error('GET fitness summary error:', err);
    res.error(500, 'Error interno');
  }
});

// POST /api/fitness/activities/import
router.post('/activities/import', authenticate, authorize('nutricionista'), async (req, res) => {
  try {
    const { paciente_id, platform, activities } = req.body;

    if (!paciente_id || !platform || !Array.isArray(activities)) {
      return res.error(400, 'paciente_id, platform y activities son requeridos');
    }

    if (!FITNESS_PLATFORMS.includes(platform)) {
      return res.error(400, 'Plataforma no soportada');
    }

    const patient = await query('SELECT id, nombre, apellidos FROM patients WHERE id = $1', [paciente_id]);
    if (!patient.rows.length) return res.error(404, 'Paciente no encontrado');

    const connResult = await query('SELECT id FROM fitness_connections WHERE paciente_id = $1 AND platform = $2 AND active = true', [paciente_id, platform]);
    if (!connResult.rows.length) return res.error(404, 'Conexión no encontrada para este paciente y plataforma');

    const connectionId = connResult.rows[0].id;
    let imported = 0;
    let skipped = 0;

    for (const act of activities) {
      try {
        const externalId = act.external_id || `${platform}_${act.start_time}`;
        const duration = act.duration_minutes || Math.round((new Date(act.end_time) - new Date(act.start_time)) / 60000);
        const intensity = ['light', 'moderate', 'vigorous'].includes(act.intensity) ? act.intensity : 'unknown';

        await query(
          `INSERT INTO fitness_activities (paciente_id, connection_id, platform, external_id, type, start_time, end_time, duration_minutes, steps, calories_burned, distance_meters, active_minutes, intensity, source_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (paciente_id, platform, external_id) DO UPDATE SET
             type = EXCLUDED.type,
             start_time = EXCLUDED.start_time,
             end_time = EXCLUDED.end_time,
             duration_minutes = EXCLUDED.duration_minutes,
             steps = EXCLUDED.steps,
             calories_burned = EXCLUDED.calories_burned,
             distance_meters = EXCLUDED.distance_meters,
             active_minutes = EXCLUDED.active_minutes,
             intensity = EXCLUDED.intensity,
             source_data = EXCLUDED.source_data,
             imported_at = NOW()`,
          [
            paciente_id,
            connectionId,
            platform,
            externalId,
            act.type || 'unknown',
            act.start_time,
            act.end_time,
            duration,
            act.steps || 0,
            act.calories_burned || 0,
            act.distance_meters || 0,
            act.active_minutes || Math.max(0, Math.round(duration * 0.4)),
            intensity,
            JSON.stringify(act.source_data || {}),
          ]
        );
        imported++;
      } catch {
        skipped++;
      }
    }

    await logAudit(req.user.id, 'IMPORT', 'FitnessActivity', `Importadas ${imported} actividades para ${patient.rows[0].nombre} ${patient.rows[0].apellidos}`, req, { platform, imported, skipped });

    res.success({ imported, skipped });
  } catch (err) {
    console.error('POST fitness import error:', err);
    res.error(500, 'Error interno');
  }
});

// POST /api/fitness/factor — manual activity factor override
router.post('/factor', authenticate, authorize('nutricionista'), async (req, res) => {
  try {
    const { paciente_id, factor, label, reason } = req.body;

    if (!paciente_id || factor === undefined) {
      return res.error(400, 'paciente_id y factor son requeridos');
    }

    const parsed = parseFactor(factor);
    if (parsed === null) return res.error(400, 'factor inválido (1.0 - 2.5)');

    const patient = await query('SELECT id, nombre, apellidos FROM patients WHERE id = $1', [paciente_id]);
    if (!patient.rows.length) return res.error(404, 'Paciente no encontrado');

    const finalLabel = label || factorLabel(parsed);

    await query(
      `INSERT INTO patient_activity_factors (paciente_id, factor, label, reason, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (paciente_id) DO UPDATE SET
         factor = EXCLUDED.factor,
         label = EXCLUDED.label,
         reason = EXCLUDED.reason,
         active = true,
         updated_at = NOW()`,
      [paciente_id, parsed, finalLabel, reason || null, req.user.id]
    );

    await logAudit(req.user.id, 'UPDATE', 'PatientActivityFactor', `FA ${parsed} para ${patient.rows[0].nombre} ${patient.rows[0].apellidos}`, req);
    res.success({ paciente_id, factor: parsed, label: finalLabel, reason: reason || null });
  } catch (err) {
    console.error('POST fitness factor error:', err);
    res.error(500, 'Error interno');
  }
});

module.exports = router;
