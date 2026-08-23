// Patient Context Hub REST API
import { Router } from 'express';
import { z } from 'zod';

import { db } from '../config/db.js'; // eslint-disable-line @typescript-eslint/no-unused-vars -- used in route handlers
import { patients, clinicalHistories, antropometrias, analiticas } from '../db/schema/index.js';
import { authenticate, authorize } from '../middleware/auth.js'; // eslint-disable-line @typescript-eslint/no-unused-vars -- used as middleware callbacks
import { validateZodParams } from '../middleware/zodValidate.js';
import { UUIDSchema } from '../schemas/index.js';
import { getGlobalHub } from '../services/patient-context-hub.js';
import { eq, desc } from 'drizzle-orm';

const router = Router();
const hub = getGlobalHub();

const ParamsSchema = z.object({ patientId: UUIDSchema });
const ModuleParamsSchema = z.object({ patientId: UUIDSchema, moduleId: z.string().min(1) });

// GET /api/patient-context/:patientId — Full computed context
router.get('/:patientId', authenticate, validateZodParams(ParamsSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');

    const { patientId } = req.params;

    // Verify patient exists
    const patientResult = await db.select().from(patients).where(eq(patients.id, patientId));
    if (!patientResult.length) return res.error(404, 'Paciente no encontrado');

    // Gather raw data from DB to feed the hub
    const [history, latestAnthro, latestLabs] = await Promise.all([
      db.select().from(clinicalHistories)
        .where(eq(clinicalHistories.pacienteId, patientId))
        .orderBy(desc(clinicalHistories.createdAt))
        .limit(1),
      db.select().from(antropometrias)
        .where(eq(antropometrias.pacienteId, patientId))
        .orderBy(desc(antropometrias.fecha))
        .limit(1),
      db.select().from(analiticas)
        .where(eq(analiticas.pacienteId, patientId))
        .orderBy(desc(analiticas.fecha))
        .limit(1),
    ]);

    // Build base context from real data
    const patient = patientResult[0];
    const hist = history[0];
    const anthro = latestAnthro[0];
    const labs = latestLabs[0];

    const baseContext = {
      patientId,
      demographics: {
        age: patient.fechaNacimiento
          ? Math.floor((Date.now() - new Date(patient.fechaNacimiento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : undefined,
        sex: patient.sexo,
        weight: anthro?.peso,
        height: anthro?.altura,
        bmi: anthro?.imc,
        waistCircumference: anthro?.cintura,
        calfCircumference: anthro?.pantorrilla,
        bodyFatPercent: anthro?.grasaCorporal,
        muscleMass: anthro?.masaMuscular,
        visceralFat: anthro?.grasaVisceral,
      },
      labs: {
        albumin: extractLab(labs, 'albumina'),
        crp: extractLab(labs, 'PCR') ?? extractLab(labs, 'proteina_c_reactiva'),
        prealbumin: extractLab(labs, 'prealbúmina') ?? extractLab(labs, 'transtiretina'),
        glucose: extractLab(labs, 'glucosa'),
        creatinine: extractLab(labs, 'creatinina'),
        cholesterol: extractLab(labs, 'colesterol_total'),
        triglycerides: extractLab(labs, 'trigliceridos'),
        hemoglobin: extractLab(labs, 'hemoglobina'),
        lymphocytes: extractLab(labs, 'linfocitos'),
      },
      diagnoses: hist?.antecedentes ? [hist.antecedentes] : [],
      screeningResults: [],
      allergies: hist?.alergias,
      medication: hist?.medicacion,
      supplementation: hist?.suplementacion,
    };

    // Compute full context via hub
    const context = await hub.getContext(patientId);

    // Merge real data into the computed state
    const enrichedContext = {
      ...context,
      patientId,
      demographics: baseContext.demographics,
      labs: baseContext.labs,
      diagnoses: baseContext.diagnoses,
      anthropometry: {
        weight: anthro?.peso,
        height: anthro?.altura,
        bmi: anthro?.imc,
        waistCircumference: anthro?.cintura,
        calfCircumference: anthro?.pantorrilla,
        bodyFatPercent: anthro?.grasaCorporal,
        muscleMass: anthro?.masaMuscular,
        visceralFat: anthro?.grasaVisceral,
      },
      lastComputed: new Date().toISOString(),
    };

    res.success(enrichedContext);
  } catch (err) {
    console.error('GET patient-context error:', err);
    res.error(500, 'Error interno del servidor');
  }
});

// GET /api/patient-context/:patientId/:moduleId — Single module
router.get('/:patientId/:moduleId', authenticate, validateZodParams(ModuleParamsSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');

    const { patientId, moduleId } = req.params;

    // Verify patient exists
    const patientResult = await db.select().from(patients).where(eq(patients.id, patientId));
    if (!patientResult.length) return res.error(404, 'Paciente no encontrado');

    // Get full context and extract module
    const context = await hub.getContext(patientId);
    const moduleData = (context as unknown as Record<string, unknown>)[moduleId];

    if (moduleData === undefined) {
      return res.error(404, `Módulo "${moduleId}" no encontrado en el contexto`);
    }

    res.success({ moduleId, data: moduleData });
  } catch (err) {
    console.error('GET patient-context module error:', err);
    res.error(500, 'Error interno del servidor');
  }
});

// POST /api/patient-context/:patientId/invalidate — Force recomputation
router.post('/:patientId/invalidate', authenticate, authorize('admin', 'nutricionista'), validateZodParams(ParamsSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');

    const { patientId } = req.params;

    // Verify patient exists
    const patientResult = await db.select().from(patients).where(eq(patients.id, patientId));
    if (!patientResult.length) return res.error(404, 'Paciente no encontrado');

    // Clear cache and recompute
    hub.clearCache(patientId);
    const freshContext = await hub.computeAll(patientId);

    res.success(freshContext, { recomputed: true });
  } catch (err) {
    console.error('POST patient-context invalidate error:', err);
    res.error(500, 'Error interno del servidor');
  }
});

// GET /api/patient-context/:patientId/stats — Computation stats
router.get('/:patientId/stats', authenticate, validateZodParams(ParamsSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');

    const { patientId } = req.params;
    const stats = hub.getStats(patientId);

    res.success(stats);
  } catch (err) {
    res.error(500, 'Error interno del servidor');
  }
});

// Helper: extract lab value by name from the labs JSONB
function extractLab(labs: any, name: string): number | undefined {
  if (!labs?.marcadores) return undefined;
  const marker = labs.marcadores.find(
    (m: any) => m.nombre?.toLowerCase().includes(name.toLowerCase())
  );
  return marker?.valor;
}

export default router;
