// Patient Portal routes - Drizzle ORM (hybrid: raw SQL for unmodeled tables)
import { Router } from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

import { db, executeOne } from '../config/db.js';
import { patients, mealPlans, patientFoodJournals, messages, patientSessions } from '../db/schema/index.js';
import { comparePassword, patientAuthenticate } from '../middleware/auth.js';
import { validateZod } from '../middleware/zodValidate.js';
import { PatientLoginSchema, PatientFoodJournalCreateSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import { sanitize } from '../middleware/validate.js';

interface PatientOnboardingRow {
  id: string;
  patient_id: string;
  template_id: string | null;
  responses: unknown;
  waivers_signed: unknown;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const router = Router();

router.post('/login', validateZod(PatientLoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const r = await db.select().from(patients).where(eq(patients.email, email));
    const patient = r[0];
    if (!patient || !patient.portalEnabled) return res.error(401, 'Credenciales inválidas');
    if (!patient.passwordHash || !comparePassword(password, patient.passwordHash)) return res.error(401, 'Credenciales inválidas');

    const token = jwt.sign({ id: patient.id, type: 'patient', email: patient.email, nombre: patient.nombre, apellidos: patient.apellidos }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    await db.execute(sql`INSERT INTO patient_sessions (patient_id, token, expires_at) VALUES (${patient.id}, ${token}, NOW() + INTERVAL '7 days')`);
    await logAudit(patient.id, 'LOGIN', 'PatientPortal', 'Login portal', req);
    res.success({ token, patient: { id: patient.id, nombre: patient.nombre, apellidos: patient.apellidos, email: patient.email } });
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.post('/logout', patientAuthenticate, async (req, res) => {
  try {
    const token = req.headers.authorization!.split(' ')[1];
    await db.delete(patientSessions).where(eq(patientSessions.token, token));
    await logAudit(req.paciente!.id, 'LOGOUT', 'PatientPortal', 'Logout portal', req);
    res.success({ message: 'Logout exitoso' });
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/profile', patientAuthenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.select({ id: patients.id, nombre: patients.nombre, apellidos: patients.apellidos, email: patients.email, telefono: patients.telefono, fechaNacimiento: patients.fechaNacimiento }).from(patients).where(eq(patients.id, req.paciente!.id));
    if (!r.length) return res.error(404, 'Paciente no encontrado');
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.put('/profile', patientAuthenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { nombre, email, telefono } = req.body;
    const updates: Record<string, unknown> = {};
    if (nombre) updates.nombre = nombre;
    if (email) updates.email = email;
    if (telefono) updates.telefono = telefono;
    const r = await db.update(patients).set(updates).where(eq(patients.id, req.paciente!.id)).returning({ id: patients.id, nombre: patients.nombre, apellidos: patients.apellidos, email: patients.email, telefono: patients.telefono });
    if (!r.length) return res.error(404, 'Paciente no encontrado');
    await logAudit(req.paciente!.id, 'UPDATE', 'PatientProfile', req.paciente!.id, req);
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/plans', patientAuthenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(mealPlans).where(eq(mealPlans.pacienteId, req.paciente!.id)).orderBy(desc(mealPlans.createdAt));
    res.success(result);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/journal', patientAuthenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(patientFoodJournals).where(eq(patientFoodJournals.pacienteId, req.paciente!.id)).orderBy(desc(patientFoodJournals.date)).limit(30);
    res.success(result);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/journal', patientAuthenticate, validateZod(PatientFoodJournalCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { meals, symptoms, exercise, waterIntake, mood, notes, photoUrls, date } = req.body;
    const journalDate = date ? new Date(date) : new Date();
    const result = await db.insert(patientFoodJournals).values({
      pacienteId: req.paciente!.id, date: journalDate.toISOString().split('T')[0],
      meals: meals || [], symptoms: symptoms || [], exercise: exercise || [],
      waterIntake: waterIntake || 0, mood, notes, photoUrls: photoUrls || [],
    }).onConflictDoUpdate({
      target: [patientFoodJournals.pacienteId, patientFoodJournals.date],
      set: { meals, symptoms, exercise, waterIntake: waterIntake || 0, mood, notes, photoUrls: photoUrls || [] },
    }).returning();
    await logAudit(req.paciente!.id, 'CREATE', 'PatientFoodJournal', result[0].id, req);
    res.created(result[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/messages', patientAuthenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(messages).where(eq(messages.pacienteId, req.paciente!.id)).orderBy(desc(messages.createdAt)).limit(50);
    res.success(result);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/messages', patientAuthenticate, validateZod(z.object({ content: z.string().min(1) })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.insert(messages).values({ pacienteId: req.paciente!.id, sender: 'patient', text: sanitize(req.body.content) }).returning();
    await logAudit(req.paciente!.id, 'CREATE', 'Message', result[0].id, req);
    res.created(result[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/onboarding', patientAuthenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await executeOne<PatientOnboardingRow>(sql`SELECT * FROM patient_onboarding WHERE patient_id = ${req.paciente!.id}`);
    res.success(result || null);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/onboarding', patientAuthenticate, validateZod(z.object({ responses: z.any(), waiversSigned: z.any().optional(), completed: z.boolean().optional() })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { responses, waiversSigned, completed } = req.body;
    const result = await executeOne<PatientOnboardingRow>(sql`INSERT INTO patient_onboarding (patient_id, responses, waivers_signed, completed_at) VALUES (${req.paciente!.id}, ${responses}, ${waiversSigned || {}}, ${completed ? new Date() : null}) ON CONFLICT (patient_id) DO UPDATE SET responses = ${responses}, waivers_signed = ${waiversSigned || {}}, completed_at = ${completed ? new Date() : null} RETURNING *`);
    await logAudit(req.paciente!.id, 'UPDATE', 'PatientOnboarding', req.paciente!.id, req);
    res.success(result);
  } catch (err) { res.error(500, 'Error interno'); }
});

export default router;