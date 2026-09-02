// Patient Food Journal routes - Drizzle ORM
import { Router, Request, Response, NextFunction } from 'express';
import { eq, and, desc, gte, lte, count, type SQL } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../config/db.js';
import { patientFoodJournals, patients } from '../db/schema/index.js';
import { authOrPatient } from '../middleware/auth.js';
import { validateZod, validateZodQuery, validateZodParams } from '../middleware/zodValidate.js';
import { PatientFoodJournalCreateSchema, PatientFoodJournalUpdateSchema, PatientFoodJournalQuerySchema, UUIDSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';

interface JournalMeal {
  foods?: { calories?: number }[];
}

interface JournalExercise {
  duration?: number;
  calories?: number;
}

const router = Router();
const PROFESSIONAL_ROLES = ['admin', 'nutricionista', 'secretaria'];
const JournalIdParamsSchema = z.object({ id: UUIDSchema });

function resolvePatientId(req: Request, _res: Response, next: NextFunction) {
  if (req.isPatient) { req.target_patient_id = req.paciente_id; }
  else { req.target_patient_id = req.body?.patient_id || req.query?.patient_id || req.params.patientId; }
  next();
}

router.get('/', authOrPatient(PROFESSIONAL_ROLES), validateZodQuery(PatientFoodJournalQuerySchema), resolvePatientId, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { patient_id, fecha_desde, fecha_hasta } = req.query as { patient_id?: string; fecha_desde?: string; fecha_hasta?: string };
    const page = parseInt((req.query as { page?: string }).page ?? '1', 10);
    const limit = parseInt((req.query as { limit?: string }).limit ?? '50', 10);
    if (patient_id && !req.isPatient) {
      const check = await db.select({ id: patients.id }).from(patients).where(eq(patients.id, patient_id));
      if (!check.length) return res.error(404, 'Paciente no encontrado');
    }
    const conditions: SQL[] = [];
    if (req.isPatient && req.paciente_id) conditions.push(eq(patientFoodJournals.pacienteId, req.paciente_id));
    else if (patient_id) conditions.push(eq(patientFoodJournals.pacienteId, patient_id));
    if (fecha_desde) conditions.push(gte(patientFoodJournals.date, fecha_desde));
    if (fecha_hasta) conditions.push(lte(patientFoodJournals.date, fecha_hasta));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.select().from(patientFoodJournals).where(where).orderBy(desc(patientFoodJournals.date))
      .limit(limit).offset((page - 1) * limit);
    const c = await db.select({ count: count() }).from(patientFoodJournals).where(where);
    res.paginated(data, parseInt(String(c[0].count)), page, limit);
  } catch (err) { console.error('GET patient-journal error:', err); res.error(500, 'Error interno'); }
});

router.post('/', authOrPatient(PROFESSIONAL_ROLES), validateZod(PatientFoodJournalCreateSchema), resolvePatientId, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const patientId = req.target_patient_id;
    if (!patientId) return res.error(400, 'patient_id requerido');
    const check = await db.select({ id: patients.id }).from(patients).where(eq(patients.id, patientId));
    if (!check.length) return res.error(404, 'Paciente no encontrado');
    const { date, meals, symptoms, exercise, water_intake, mood, notes, photo_urls } = req.body;

    const result = await db.insert(patientFoodJournals).values({
      pacienteId: patientId, date: date || new Date().toISOString().split('T')[0],
      meals: meals || [], symptoms: symptoms || [], exercise: exercise || [],
      waterIntake: water_intake || 0, mood, notes, photoUrls: photo_urls || [],
    }).onConflictDoUpdate({
      target: [patientFoodJournals.pacienteId, patientFoodJournals.date],
      set: { meals, symptoms, exercise, waterIntake: water_intake || 0, mood, notes, photoUrls: photo_urls || [] },
    }).returning();

    await logAudit(user?.id || null, 'UPSERT', 'PatientFoodJournal', `Diario ${date || 'hoy'} paciente ${patientId}`, req, { mood, water_intake });
    res.created(result[0]);
  } catch (err) { console.error('POST patient-journal error:', err); res.error(500, 'Error interno'); }
});

router.get('/:id', authOrPatient(PROFESSIONAL_ROLES), validateZodParams(JournalIdParamsSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.select().from(patientFoodJournals).where(eq(patientFoodJournals.id, req.params.id));
    if (!r.length) return res.error(404, 'Journal no encontrado');
    if (req.isPatient && r[0].pacienteId !== req.paciente_id) return res.error(403, 'Sin permisos');
    if (user) await logAudit(user.id, 'READ', 'PatientFoodJournal', `Journal ${req.params.id}`, req);
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.put('/:id', authOrPatient(PROFESSIONAL_ROLES), validateZodParams(JournalIdParamsSchema), validateZod(PatientFoodJournalUpdateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const existing = await db.select().from(patientFoodJournals).where(eq(patientFoodJournals.id, req.params.id));
    if (!existing.length) return res.error(404, 'Journal no encontrado');
    if (req.isPatient && existing[0].pacienteId !== req.paciente_id) return res.error(403, 'Sin permisos');

    const fieldMap: Record<string, string> = { meals: 'meals', symptoms: 'symptoms', exercise: 'exercise', water_intake: 'waterIntake', mood: 'mood', notes: 'notes', photo_urls: 'photoUrls' };
    const updates: Record<string, unknown> = {};
    for (const [k, f] of Object.entries(fieldMap)) { if (req.body[k] !== undefined) updates[f] = req.body[k]; }
    if (!Object.keys(updates).length) return res.error(400, 'Sin campos para actualizar');

    const r = await db.update(patientFoodJournals).set(updates).where(eq(patientFoodJournals.id, req.params.id)).returning();
    await logAudit(user?.id || null, 'UPDATE', 'PatientFoodJournal', `Journal ${req.params.id}`, req);
    res.success(r[0]);
  } catch (err) { console.error('PUT patient-journal error:', err); res.error(500, 'Error interno'); }
});

router.delete('/:id', authOrPatient(PROFESSIONAL_ROLES), validateZodParams(JournalIdParamsSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const existing = await db.select().from(patientFoodJournals).where(eq(patientFoodJournals.id, req.params.id));
    if (!existing.length) return res.error(404, 'Journal no encontrado');
    if (req.isPatient && existing[0].pacienteId !== req.paciente_id) return res.error(403, 'Sin permisos');
    await db.delete(patientFoodJournals).where(eq(patientFoodJournals.id, req.params.id));
    await logAudit(user?.id || null, 'DELETE', 'PatientFoodJournal', `Journal ${req.params.id}`, req);
    res.success({ ok: true });
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/stats/:patientId', authOrPatient(PROFESSIONAL_ROLES), validateZodParams(z.object({ patientId: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { patientId } = req.params;
    if (req.isPatient && patientId !== req.paciente_id) return res.error(403, 'Sin permisos');
    const check = await db.select({ id: patients.id }).from(patients).where(eq(patients.id, patientId));
    if (!check.length) return res.error(404, 'Paciente no encontrado');

    const entries = await db.select().from(patientFoodJournals).where(eq(patientFoodJournals.pacienteId, patientId)).orderBy(desc(patientFoodJournals.date));

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < entries.length; i++) {
      const entryDate = new Date(entries[i].date!);
      const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - entryDate.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
      if (diffDays === streak) streak++;
      else if (diffDays > streak) break;
    }

    const moodDist: Record<string, number> = { great: 0, good: 0, neutral: 0, bad: 0, terrible: 0 };
    let totalWater = 0, totalCalories = 0, totalExerciseMinutes = 0, exerciseCount = 0;
    const symptomFreq: Record<string, number> = {};

    for (const e of entries) {
      if (e.mood && moodDist[e.mood as string] !== undefined) moodDist[e.mood as string]++;
      if (e.waterIntake) totalWater += e.waterIntake;
      const meals = Array.isArray(e.meals) ? (e.meals as JournalMeal[]) : [];
      for (const m of meals) { if (Array.isArray(m.foods)) { for (const f of m.foods) { if (f?.calories) totalCalories += f.calories; } } }
      const exercise = Array.isArray(e.exercise) ? (e.exercise as JournalExercise[]) : [];
      for (const ex of exercise) { if (ex.duration) totalExerciseMinutes += ex.duration; if (ex.calories) totalCalories += ex.calories; exerciseCount++; }
      if (Array.isArray(e.symptoms)) { for (const s of e.symptoms) { symptomFreq[s] = (symptomFreq[s] || 0) + 1; } }
    }

    const dayCount = entries.length || 1;
    res.success({
      patientId, totalEntries: entries.length, streak,
      averages: { waterIntakeMl: Math.round(totalWater / dayCount), calories: Math.round(totalCalories / dayCount), exerciseMinutes: Math.round(totalExerciseMinutes / dayCount), exerciseSessions: Math.round(exerciseCount / dayCount) },
      moodDistribution: moodDist,
      topSymptoms: Object.entries(symptomFreq).map(([s, c]) => ({ symptom: s, count: c })).sort((a, b) => b.count - a.count).slice(0, 5),
      completionRate: entries.length > 0 ? Math.round((entries.filter(e => e.mood).length / dayCount) * 100) : 0,
    });
  } catch (err) { console.error('GET patient-journal stats error:', err); res.error(500, 'Error interno'); }
});

export default router;
