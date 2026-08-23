// Anamnesis + Clinical History routes — Drizzle ORM
import { Router } from 'express';
import { eq, desc, max } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../config/db.js';
import { anamnesis, clinicalHistories } from '../db/schema/index.js';
import { authenticate } from '../middleware/auth.js';
import { validateZod, validateZodParams } from '../middleware/zodValidate.js';
import { AnamnesisCreateSchema, ClinicalHistoryCreateSchema, UUIDSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import { getGlobalHub } from '../services/patient-context-hub.js';

const router = Router();

// ─── ANAMNESIS ───

router.get('/anamnesis/:pacienteId', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.select().from(anamnesis).where(eq(anamnesis.pacienteId, req.params.pacienteId)).orderBy(desc(anamnesis.fecha));
    res.success(r);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/anamnesis', authenticate, validateZod(AnamnesisCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, template, sistemas, respuestas, red_flags } = req.body;
    const r = await db.insert(anamnesis).values({
      pacienteId: paciente_id, template, profesional: user.name, sistemas: sistemas || [],
      respuestas: respuestas || {}, redFlags: red_flags || [],
    }).returning();
    await logAudit(user.id, 'CREATE', 'Anamnesis', `Paciente ${paciente_id}`, req);
    res.created(r[0]);
  } catch (err) { console.error('POST anamnesis error:', err); res.error(500, 'Error interno'); }
});

router.put('/anamnesis/:id', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const updates: Record<string, unknown> = {};
    if (req.body.sistemas !== undefined) updates.sistemas = req.body.sistemas;
    if (req.body.respuestas !== undefined) updates.respuestas = req.body.respuestas;
    if (req.body.red_flags !== undefined) updates.redFlags = req.body.red_flags;
    if (!Object.keys(updates).length) return res.error(400, 'Sin campos para actualizar');
    const r = await db.update(anamnesis).set(updates).where(eq(anamnesis.id, req.params.id)).returning();
    if (!r.length) return res.error(404, 'No encontrada');
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

// ─── CLINICAL HISTORIES ───

router.get('/histories/:pacienteId', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.select().from(clinicalHistories).where(eq(clinicalHistories.pacienteId, req.params.pacienteId)).orderBy(desc(clinicalHistories.version));
    res.success(r);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/histories/:pacienteId/latest', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.select().from(clinicalHistories).where(eq(clinicalHistories.pacienteId, req.params.pacienteId)).orderBy(desc(clinicalHistories.version)).limit(1);
    res.success(r[0] || null);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/histories', authenticate, validateZod(ClinicalHistoryCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, antecedentes, antecedentes_familiares, alergias, medicacion, suplementacion, historial_ponderal, actividad_fisica, habitos_toxicos, sueno, estres, ingesta_hidrica, observaciones } = req.body;
    const last = await db.select({ v: max(clinicalHistories.version) }).from(clinicalHistories).where(eq(clinicalHistories.pacienteId, paciente_id));
    const nextVersion = (last[0]?.v || 0) + 1;
    const r = await db.insert(clinicalHistories).values({
      pacienteId: paciente_id, version: nextVersion, antecedentes, antecedentesFamiliares: antecedentes_familiares,
      alergias, medicacion, suplementacion, historialPonderal: historial_ponderal || {}, actividadFisica: actividad_fisica || {},
      habitosToxicos: habitos_toxicos, sueno, estres, ingestaHidrica: ingesta_hidrica, observaciones, createdBy: user.id,
    }).returning();
    await logAudit(user.id, 'CREATE', 'ClinicalHistory', `v${nextVersion} paciente ${paciente_id}`, req);
    try { getGlobalHub().invalidate(paciente_id, 'diagnoses', ['diagnoses']); } catch { /* ignore */ }
    res.created(r[0]);
  } catch (err) { console.error('POST history error:', err); res.error(500, 'Error interno'); }
});

router.put('/histories/:id', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const fieldMap: Record<string, string> = { antecedentes: 'antecedentes', antecedentes_familiares: 'antecedentesFamiliares', alergias: 'alergias', medicacion: 'medicacion', suplementacion: 'suplementacion', historial_ponderal: 'historialPonderal', actividad_fisica: 'actividadFisica', habitos_toxicos: 'habitosToxicos', sueno: 'sueno', estres: 'estres', ingesta_hidrica: 'ingestaHidrica', observaciones: 'observaciones' };
    const updates: Record<string, unknown> = {};
    for (const [k, f] of Object.entries(fieldMap)) { if (req.body[k] !== undefined) updates[f] = req.body[k]; }
    if (!Object.keys(updates).length) return res.error(400, 'Sin campos para actualizar');
    const r = await db.update(clinicalHistories).set(updates).where(eq(clinicalHistories.id, req.params.id)).returning();
    if (!r.length) return res.error(404, 'No encontrada');
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

export default router;