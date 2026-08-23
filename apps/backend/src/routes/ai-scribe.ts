// AI Scribe routes — Drizzle ORM
import { Router } from 'express';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../config/db.js';
import { aiScribeNotes } from '../db/schema/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateZod, validateZodParams } from '../middleware/zodValidate.js';
import { AIScribeTranscribeSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import { sanitize } from '../middleware/validate.js';

const router = Router();

router.post('/transcribe', authenticate, authorize('admin', 'nutricionista'), validateZod(AIScribeTranscribeSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { patientId, audio, text } = req.body;
    const transcription = text || (audio ? '[Audio transcription placeholder - integrate with Gemini/Whisper]' : '');
    const soapNote = { subjective: 'Paciente refiere...', objective: 'Signos vitales estables...', assessment: 'Evaluación nutricional...', plan: 'Plan de alimentación...' };

    const result = await db.insert(aiScribeNotes).values({
      pacienteId: patientId, professionalId: user.id,
      audioUrl: audio ? 'audio_placeholder' : null,
      transcription: sanitize(transcription), soapNote, status: 'draft',
    }).returning();
    await logAudit(user.id, 'CREATE', 'AIScribeNote', `Nota para paciente ${patientId}`, req);
    res.created(result[0]);
  } catch (err) { console.error('POST ai-scribe error:', err); res.error(500, 'Error interno'); }
});

router.get('/notes/:patientId', authenticate, validateZodParams(z.object({ patientId: z.string().uuid() })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(aiScribeNotes).where(eq(aiScribeNotes.pacienteId, req.params.patientId)).orderBy(desc(aiScribeNotes.createdAt));
    res.success(result);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/note/:id', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.select().from(aiScribeNotes).where(eq(aiScribeNotes.id, req.params.id));
    if (!r.length) return res.error(404, 'Nota no encontrada');
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.put('/note/:id', authenticate, authorize('admin', 'nutricionista'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const updates: Record<string, unknown> = {};
    if (req.body.transcription !== undefined) updates.transcription = sanitize(req.body.transcription);
    if (req.body.soapNote !== undefined) updates.soapNote = req.body.soapNote;
    if (req.body.status !== undefined) updates.status = req.body.status;
    const r = await db.update(aiScribeNotes).set(updates).where(eq(aiScribeNotes.id, req.params.id)).returning();
    if (!r.length) return res.error(404, 'Nota no encontrada');
    await logAudit(user.id, 'UPDATE', 'AIScribeNote', `Nota ${req.params.id}`, req);
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.delete('/note/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.delete(aiScribeNotes).where(eq(aiScribeNotes.id, req.params.id)).returning({ id: aiScribeNotes.id });
    if (!r.length) return res.error(404, 'Nota no encontrada');
    await logAudit(user.id, 'DELETE', 'AIScribeNote', `Nota ${req.params.id}`, req);
    res.success({ id: req.params.id });
  } catch (err) { res.error(500, 'Error interno'); }
});

export default router;