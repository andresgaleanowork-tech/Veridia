// Patient CRUD routes with Zod validation
const express = require('express');
const { z } = require('zod');

const { query } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateZod, validateZodQuery, validateZodParams } = require('../middleware/zodValidate');
const {
  PatientCreateSchema,
  PatientUpdateSchema,
  PatientListQuerySchema,
  UUIDSchema,
} = require('../schemas');
const { logAudit } = require('../utils/audit');
const { sanitize } = require('../middleware/validate');

const router = express.Router();

// GET /api/patients — List all
router.get('/', authenticate, validateZodQuery(PatientListQuerySchema), async (req, res) => {
  try {
    const { activo, search, page = 1, limit = 50 } = req.query;
    let sql = 'SELECT * FROM patients WHERE 1=1';
    const params = [];
    let idx = 1;

    if (activo !== undefined) { sql += ` AND activo = $${idx++}`; params.push(activo === 'true'); }
    if (search) { sql += ` AND (nombre || ' ' || apellidos || ' ' || COALESCE(dni,'')) ILIKE $${idx++}`; params.push(`%${search}%`); }

    sql += ' ORDER BY apellidos, nombre';
    sql += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(sql, params);
    const count = await query('SELECT COUNT(*) FROM patients' + (activo !== undefined ? ' WHERE activo = $1' : ''), activo !== undefined ? [activo === 'true'] : []);

    res.paginated(result.rows, parseInt(count.rows[0].count), parseInt(page), parseInt(limit));
  } catch (err) {
    console.error('GET patients error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/patients/:id
router.get('/:id', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const result = await query('SELECT * FROM patients WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.error(404, 'Paciente no encontrado');

    await logAudit(req.user.id, 'READ', 'Patient', result.rows[0].nombre + ' ' + result.rows[0].apellidos, req);
    res.success(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// POST /api/patients
router.post('/', authenticate, authorize('admin', 'nutricionista', 'secretaria'), validateZod(PatientCreateSchema), async (req, res) => {
  try {
    const { nombre, apellidos, dni, fecha_nacimiento, sexo, email, telefono, direccion, profesion, nacionalidad, estado_civil, educacion, procedencia, motivo_consulta, grupo_sanguineo } = req.body;

    if (dni) {
      const exists = await query('SELECT id FROM patients WHERE dni = $1', [dni]);
      if (exists.rows.length) return res.error(409, 'DNI ya registrado');
    }

    const result = await query(
      `INSERT INTO patients (nombre, apellidos, dni, fecha_nacimiento, sexo, email, telefono, direccion, profesion, nacionalidad, estado_civil, educacion, procedencia, motivo_consulta, grupo_sanguineo, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [sanitize(nombre), sanitize(apellidos), dni, fecha_nacimiento, sexo, email, telefono, direccion, profesion, nacionalidad, estado_civil, educacion, procedencia, motivo_consulta, grupo_sanguineo, req.user.id]
    );

    await logAudit(req.user.id, 'CREATE', 'Patient', nombre + ' ' + apellidos, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error('POST patient error:', err);
    res.error(500, 'Error interno');
  }
});

// PUT /api/patients/:id
router.put('/:id', authenticate, authorize('admin', 'nutricionista', 'secretaria'), validateZodParams(z.object({ id: UUIDSchema })), validateZod(PatientUpdateSchema), async (req, res) => {
  try {
    const fields = ['nombre', 'apellidos', 'dni', 'fecha_nacimiento', 'sexo', 'email', 'telefono', 'direccion', 'profesion', 'nacionalidad', 'estado_civil', 'educacion', 'procedencia', 'motivo_consulta', 'grupo_sanguineo', 'activo'];
    const updates = [], values = [];
    let idx = 1;

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = $${idx++}`);
        values.push(req.body[f]);
      }
    }
    if (!updates.length) return res.error(400, 'Sin campos para actualizar');

    values.push(req.params.id);
    const result = await query(`UPDATE patients SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (!result.rows.length) return res.error(404, 'No encontrado');

    await logAudit(req.user.id, 'UPDATE', 'Patient', result.rows[0].nombre + ' ' + result.rows[0].apellidos, req);
    res.success(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// GET /api/patients/:id/full — Complete patient file
router.get('/:id/full', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const pid = req.params.id;
    const [patient, history, antro, analiticas, appointments, plans, alerts, diary, symptoms] = await Promise.all([
      query('SELECT * FROM patients WHERE id = $1', [pid]),
      query('SELECT * FROM clinical_histories WHERE paciente_id = $1 ORDER BY version DESC LIMIT 1', [pid]),
      query('SELECT * FROM antropometrias WHERE paciente_id = $1 ORDER BY fecha DESC', [pid]),
      query('SELECT * FROM analiticas WHERE paciente_id = $1 ORDER BY fecha DESC', [pid]),
      query('SELECT * FROM appointments WHERE paciente_id = $1 ORDER BY fecha DESC, hora DESC', [pid]),
      query('SELECT * FROM meal_plans WHERE paciente_id = $1 ORDER BY fecha_creacion DESC', [pid]),
      query('SELECT * FROM alerts WHERE paciente_id = $1 ORDER BY created_at DESC', [pid]),
      query('SELECT * FROM patient_diary WHERE paciente_id = $1 ORDER BY fecha DESC, hora DESC LIMIT 50', [pid]),
      query('SELECT * FROM patient_symptoms WHERE paciente_id = $1 ORDER BY fecha DESC LIMIT 50', [pid]),
    ]);

    if (!patient.rows.length) return res.error(404, 'No encontrado');

    res.success({
      patient: patient.rows[0],
      clinicalHistory: history.rows[0] || null,
      antropometrias: antro.rows,
      analiticas: analiticas.rows,
      appointments: appointments.rows,
      mealPlans: plans.rows,
      alerts: alerts.rows,
      diary: diary.rows,
      symptoms: symptoms.rows,
    });
  } catch (err) {
    console.error('Full patient error:', err);
    res.error(500, 'Error interno');
  }
});

module.exports = router;
