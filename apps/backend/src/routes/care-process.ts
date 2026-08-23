// Care Process routes — Drizzle ORM
import { Router } from 'express';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../config/db.js';
import { careProcesses, patients } from '../db/schema/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateZod, validateZodParams } from '../middleware/zodValidate.js';
import { CareProcessStartSchema, CareProcessStepSchema, UUIDSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

router.post('/start', authenticate, authorize('admin', 'nutricionista', 'secretaria'), validateZod(CareProcessStartSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, motivo_consulta, screening_tool, screening_score, screening_risk } = req.body;
    const patientRes = await db.select({ id: patients.id }).from(patients).where(eq(patients.id, paciente_id));
    if (!patientRes.length) return res.error(404, 'Paciente no encontrado');

    const result = await db.insert(careProcesses).values({
      pacienteId: paciente_id, motivoConsulta: motivo_consulta,
      screeningTool: screening_tool, screeningScore: String(screening_score), screeningRisk: screening_risk,
      data: { screening: { tool: screening_tool, score: screening_score, risk: screening_risk, fecha: new Date().toISOString() } },
    }).returning();
    await logAudit(user.id, 'CREATE', 'CareProcess', paciente_id, req, { screening_tool, screening_risk });
    res.created(result[0]);
  } catch (err) { console.error('POST care-process/start error:', err); res.error(500, 'Error interno'); }
});

router.post('/:id/step', authenticate, authorize('admin', 'nutricionista', 'secretaria'), validateZodParams(z.object({ id: UUIDSchema })), validateZod(CareProcessStepSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { id } = req.params;
    const { step, data } = req.body;
    const r = await db.select().from(careProcesses).where(eq(careProcesses.id, id));
    if (!r.length) return res.error(404, 'Proceso de atención no encontrado');
    const process = r[0];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- data is a JSONB column with dynamic step payloads
    const currentData = (process.data as any) || {};
    currentData[step] = data;

    const r2 = await db.update(careProcesses).set({ data: currentData }).where(eq(careProcesses.id, id)).returning();
    await logAudit(user.id, 'UPDATE', 'CareProcess', id, req, { step });
    res.success(r2[0]);
  } catch (err) { console.error('POST care-process/:id/step error:', err); res.error(500, 'Error interno'); }
});

router.get('/:pacienteId/history', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(careProcesses).where(eq(careProcesses.pacienteId, req.params.pacienteId)).orderBy(desc(careProcesses.createdAt));
    res.success(result);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/:id/complete', authenticate, authorize('admin', 'nutricionista', 'secretaria'), validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.update(careProcesses).set({ completedAt: new Date() }).where(eq(careProcesses.id, req.params.id)).returning();
    if (!r.length) return res.error(404, 'Proceso de atención no encontrado');
    await logAudit(user.id, 'UPDATE', 'CareProcess', req.params.id, req, { estado: 'completado' });
    res.success(r[0]);
  } catch (err) { console.error('POST care-process/:id/complete error:', err); res.error(500, 'Error interno'); }
});

export default router;