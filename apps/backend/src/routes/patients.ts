// Patient CRUD routes — Drizzle ORM
import { Router } from 'express';
import { eq, and, or, ilike, desc, asc, count } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../config/db.js';
import { patients, clinicalHistories, antropometrias, analiticas, appointments, mealPlans, alerts, patientDiary, patientSymptoms } from '../db/schema/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateZod, validateZodQuery, validateZodParams } from '../middleware/zodValidate.js';
import { PatientCreateSchema, PatientUpdateSchema, PatientListQuerySchema, UUIDSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import { sanitize } from '../middleware/validate.js';

const router = Router();

// GET /api/patients — List all
router.get('/', authenticate, validateZodQuery(PatientListQuerySchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { activo, search, page = 1, limit = 50 } = req.query;
    const conditions = [];

    if (activo !== undefined) {
      conditions.push(eq(patients.activo, activo === 'true'));
    }
    if (search) {
      conditions.push(
        or(
          ilike(patients.nombre, `%${search}%`),
          ilike(patients.apellidos, `%${search}%`),
          ilike(patients.dni, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select()
        .from(patients)
        .where(whereClause)
        .orderBy(asc(patients.apellidos), asc(patients.nombre))
        .limit(parseInt(String(limit)))
        .offset((parseInt(String(page)) - 1) * parseInt(String(limit))),
      db.select({ count: count() })
        .from(patients)
        .where(whereClause),
    ]);

    res.paginated(data, parseInt(String(countResult[0].count)), parseInt(String(page)), parseInt(String(limit)));
  } catch (err) {
    console.error('GET patients error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/patients/:id
router.get('/:id', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(patients).where(eq(patients.id, req.params.id));
    if (!result.length) return res.error(404, 'Paciente no encontrado');

    await logAudit(user?.id, 'READ', 'Patient', result[0].nombre + ' ' + result[0].apellidos, req);
    res.success(result[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// POST /api/patients
router.post('/', authenticate, authorize('admin', 'nutricionista', 'secretaria'), validateZod(PatientCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { nombre, apellidos, dni, fecha_nacimiento, sexo, email, telefono, direccion, profesion, nacionalidad, estado_civil, educacion, procedencia, motivo_consulta, grupo_sanguineo } = req.body;

    if (dni) {
      const exists = await db.select({ id: patients.id }).from(patients).where(eq(patients.dni, dni));
      if (exists.length) return res.error(409, 'DNI ya registrado');
    }

    const result = await db.insert(patients).values({
      nombre: sanitize(nombre),
      apellidos: sanitize(apellidos),
      dni,
      fechaNacimiento: fecha_nacimiento,
      sexo,
      email,
      telefono,
      direccion,
      profesion,
      nacionalidad,
      estadoCivil: estado_civil,
      educacion,
      procedencia,
      motivoConsulta: motivo_consulta,
      grupoSanguineo: grupo_sanguineo,
      createdBy: user?.id,
    }).returning();

    await logAudit(user?.id, 'CREATE', 'Patient', nombre + ' ' + apellidos, req);
    res.created(result[0]);
  } catch (err) {
    console.error('POST patient error:', err);
    res.error(500, 'Error interno');
  }
});

// PUT /api/patients/:id
router.put('/:id', authenticate, authorize('admin', 'nutricionista', 'secretaria'), validateZodParams(z.object({ id: UUIDSchema })), validateZod(PatientUpdateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const fieldMap = {
      nombre: 'nombre', apellidos: 'apellidos', dni: 'dni',
      fecha_nacimiento: 'fechaNacimiento', sexo: 'sexo', email: 'email',
      telefono: 'telefono', direccion: 'direccion', profesion: 'profesion',
      nacionalidad: 'nacionalidad', estado_civil: 'estadoCivil',
      educacion: 'educacion', procedencia: 'procedencia',
      motivo_consulta: 'motivoConsulta', grupo_sanguineo: 'grupoSanguineo',
      activo: 'activo',
    };

    const updates: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(fieldMap)) {
      if (req.body[key] !== undefined) {
        updates[field] = req.body[key];
      }
    }
    if (!Object.keys(updates).length) return res.error(400, 'Sin campos para actualizar');

    const result = await db.update(patients)
      .set(updates)
      .where(eq(patients.id, req.params.id))
      .returning();
    if (!result.length) return res.error(404, 'No encontrado');

    await logAudit(user?.id, 'UPDATE', 'Patient', result[0].nombre + ' ' + result[0].apellidos, req);
    res.success(result[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// GET /api/patients/:id/full — Complete patient file
router.get('/:id/full', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const pid = req.params.id;
    const [patientResult, historyResult, antroResult, analResult, apptResult, planResult, alertResult, diaryResult, sympResult] = await Promise.all([
      db.select().from(patients).where(eq(patients.id, pid)),
      db.select().from(clinicalHistories).where(eq(clinicalHistories.pacienteId, pid)).orderBy(desc(clinicalHistories.version)).limit(1),
      db.select().from(antropometrias).where(eq(antropometrias.pacienteId, pid)).orderBy(desc(antropometrias.fecha)),
      db.select().from(analiticas).where(eq(analiticas.pacienteId, pid)).orderBy(desc(analiticas.fecha)),
      db.select().from(appointments).where(eq(appointments.pacienteId, pid)).orderBy(desc(appointments.fecha), desc(appointments.hora)),
      db.select().from(mealPlans).where(eq(mealPlans.pacienteId, pid)).orderBy(desc(mealPlans.fechaCreacion)),
      db.select().from(alerts).where(eq(alerts.pacienteId, pid)).orderBy(desc(alerts.createdAt)),
      db.select().from(patientDiary).where(eq(patientDiary.pacienteId, pid)).orderBy(desc(patientDiary.fecha), desc(patientDiary.hora)).limit(50),
      db.select().from(patientSymptoms).where(eq(patientSymptoms.pacienteId, pid)).orderBy(desc(patientSymptoms.fecha)).limit(50),
    ]);

    if (!patientResult.length) return res.error(404, 'No encontrado');

    res.success({
      patient: patientResult[0],
      clinicalHistory: historyResult[0] || null,
      antropometrias: antroResult,
      analiticas: analResult,
      appointments: apptResult,
      mealPlans: planResult,
      alerts: alertResult,
      diary: diaryResult,
      symptoms: sympResult,
    });
  } catch (err) {
    console.error('Full patient error:', err);
    res.error(500, 'Error interno');
  }
});

// ---- PATIENT-SCOPED CLINICAL ENDPOINTS ----

// GET /api/patients/:id/anthropometry
router.get('/:id/anthropometry', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(antropometrias)
      .where(eq(antropometrias.pacienteId, req.params.id))
      .orderBy(desc(antropometrias.fecha));
    res.success({ measurements: result });
  } catch (err) {
    console.error('GET patient anthropometry error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/patients/:id/analytics
router.get('/:id/analytics', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(analiticas)
      .where(eq(analiticas.pacienteId, req.params.id))
      .orderBy(desc(analiticas.fecha));
    res.success({ analyses: result });
  } catch (err) {
    console.error('GET patient analytics error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/patients/:id/clinical-history
router.get('/:id/clinical-history', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(clinicalHistories)
      .where(eq(clinicalHistories.pacienteId, req.params.id))
      .orderBy(desc(clinicalHistories.version))
      .limit(1);
    res.success({ history: result[0] || null });
  } catch (err) {
    console.error('GET patient clinical-history error:', err);
    res.error(500, 'Error interno');
  }
});

export default router;