const express = require('express');
const { z } = require('zod');
const { query } = require('../config/db');
const { patientAuthenticate, hashPassword, comparePassword } = require('../middleware/patient-auth');
const { validateZod } = require('../middleware/zodValidate');
const { PatientLoginSchema, PatientPortalSchema, PatientJournalCreateSchema } = require('../schemas');
const { logAudit } = require('../utils/audit');
const { sanitize } = require('../middleware/validate');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/login', validateZod(PatientLoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT * FROM patients WHERE email = $1 AND portal_enabled = true', [email]);
    if (!result.rows.length) return res.error(401, 'Credenciales inválidas');
    const patient = result.rows[0];
    if (!patient.password_hash) return res.error(401, 'Credenciales inválidas');
    if (!comparePassword(password, patient.password_hash)) return res.error(401, 'Credenciales inválidas');

    const token = jwt.sign(
      { id: patient.id, type: 'patient', email: patient.email, nombre: patient.nombre, apellidos: patient.apellidos },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await query('INSERT INTO patient_sessions (patient_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')', [patient.id, token]);
    await logAudit(patient.id, 'LOGIN', 'PatientPortal', 'Login portal', req);
    res.success({ token, patient: { id: patient.id, nombre: patient.nombre, apellidos: patient.apellidos, email: patient.email } });
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/logout', patientAuthenticate, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    await query('DELETE FROM patient_sessions WHERE token = $1', [token]);
    await logAudit(req.patient.id, 'LOGOUT', 'PatientPortal', 'Logout portal', req);
    res.success({ message: 'Logout exitoso' });
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.get('/profile', patientAuthenticate, async (req, res) => {
  try {
    const result = await query('SELECT id, nombre, apellidos, email, telefono, fecha_nacimiento FROM patients WHERE id = $1', [req.patient.id]);
    if (!result.rows.length) return res.error(404, 'Paciente no encontrado');
    res.success(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.get('/plans', patientAuthenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT mp.*, u.nombre as profesional_nombre FROM meal_plans mp LEFT JOIN users u ON mp.created_by = u.id WHERE mp.patient_id = $1 ORDER BY mp.created_at DESC`,
      [req.patient.id]
    );
    res.success(result.rows);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.get('/journal', patientAuthenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM patient_food_journals WHERE patient_id = $1 ORDER BY date DESC LIMIT 30', [req.patient.id]);
    res.success(result.rows);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/journal', patientAuthenticate, validateZod(PatientJournalCreateSchema), async (req, res) => {
  try {
    const { meals, symptoms, exercise, waterIntake, mood, notes, photoUrls, date } = req.body;
    const journalDate = date ? new Date(date) : new Date();
    const result = await query(
      `INSERT INTO patient_food_journals (patient_id, date, meals, symptoms, exercise, water_intake, mood, notes, photo_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (patient_id, date) DO UPDATE SET meals = $3, symptoms = $4, exercise = $5, water_intake = $6, mood = $7, notes = $8, photo_urls = $9, updated_at = NOW() RETURNING *`,
      [req.patient.id, journalDate, meals || [], symptoms || [], exercise || [], waterIntake || 0, mood || null, notes || '', photoUrls || []]
    );
    await logAudit(req.patient.id, 'CREATE', 'PatientFoodJournal', result.rows[0].id, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.get('/messages', patientAuthenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM messages WHERE paciente_id = $1 ORDER BY created_at DESC LIMIT 50', [req.patient.id]);
    res.success(result.rows);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/messages', patientAuthenticate, validateZod(z.object({ content: z.string().min(1), professionalId: z.string().uuid().optional() })), async (req, res) => {
  try {
    const { content, professionalId } = req.body;
    const result = await query(
      `INSERT INTO messages (paciente_id, profesional_id, contenido) VALUES ($1, $2, $3) RETURNING *`,
      [req.patient.id, professionalId || null, sanitize(content)]
    );
    await logAudit(req.patient.id, 'CREATE', 'Message', result.rows[0].id, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.get('/onboarding', patientAuthenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM patient_onboarding WHERE patient_id = $1', [req.patient.id]);
    res.success(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/onboarding', patientAuthenticate, validateZod(z.object({ responses: z.any(), waiversSigned: z.any().optional(), completed: z.boolean().optional() })), async (req, res) => {
  try {
    const { responses, waiversSigned, completed } = req.body;
    const result = await query(
      `INSERT INTO patient_onboarding (patient_id, responses, waivers_signed, completed_at) VALUES ($1, $2, $3, $4) ON CONFLICT (patient_id) DO UPDATE SET responses = $2, waivers_signed = $3, completed_at = $4 RETURNING *`,
      [req.patient.id, responses, waiversSigned || {}, completed ? new Date() : null]
    );
    await logAudit(req.patient.id, 'UPDATE', 'PatientOnboarding', req.patient.id, req);
    res.success(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

module.exports = router;
