// Patient Diary + Symptoms routes — Drizzle ORM
import { Router } from 'express';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../config/db.js';
import { patientDiary, patientSymptoms } from '../db/schema/index.js';
import { authenticate } from '../middleware/auth.js';
import { validateZod, validateZodQuery, validateZodParams } from '../middleware/zodValidate.js';
import { DiaryCreateSchema, SymptomCreateSchema, UUIDSchema, ISODateSchema } from '../schemas/index.js';
import { sanitize } from '../middleware/validate.js';

const router = Router();

// ─── DIARY ───

router.get('/:id/diary', authenticate, validateZodParams(z.object({ id: UUIDSchema })), validateZodQuery(z.object({
  fecha_desde: ISODateSchema.optional(), fecha_hasta: ISODateSchema.optional(), toma: z.string().optional(),
})), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { fecha_desde, fecha_hasta, toma } = req.query;
    const conditions = [eq(patientDiary.pacienteId, req.params.id)];
    if (fecha_desde) conditions.push(sql`${patientDiary.fecha} >= ${fecha_desde}`);
    if (fecha_hasta) conditions.push(sql`${patientDiary.fecha} <= ${fecha_hasta}`);
    if (toma) conditions.push(eq(patientDiary.toma, toma as 'animo' | 'hambre' | 'sueno' | 'sintoma'));
    const result = await db.select().from(patientDiary).where(and(...conditions)).orderBy(desc(patientDiary.fecha), desc(patientDiary.hora));
    res.success(result);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/:id/diary', authenticate, validateZodParams(z.object({ id: UUIDSchema })), validateZod(DiaryCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { toma, texto, hora, fecha } = req.body;
    const result = await db.insert(patientDiary).values({
      pacienteId: req.params.id, fecha: fecha || new Date().toISOString().split('T')[0],
      toma, texto: sanitize(texto), hora: hora || new Date().toTimeString().slice(0, 5),
    }).returning();
    res.created(result[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.delete('/:id/diary/:entryId', authenticate, validateZodParams(z.object({ id: UUIDSchema, entryId: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.delete(patientDiary).where(and(eq(patientDiary.id, req.params.entryId), eq(patientDiary.pacienteId, req.params.id))).returning({ id: patientDiary.id });
    if (!result.length) return res.error(404, 'Entrada no encontrada');
    res.success({ ok: true });
  } catch (err) { res.error(500, 'Error interno'); }
});

// ─── SYMPTOMS ───

router.get('/:id/symptoms', authenticate, validateZodParams(z.object({ id: UUIDSchema })), validateZodQuery(z.object({
  fecha_desde: ISODateSchema.optional(), fecha_hasta: ISODateSchema.optional(),
  tipo: z.enum(['animo', 'hambre', 'sueno', 'sintoma']).optional(),
})), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { fecha_desde, fecha_hasta, tipo } = req.query;
    const conditions = [eq(patientSymptoms.pacienteId, req.params.id)];
    if (fecha_desde) conditions.push(sql`${patientSymptoms.fecha} >= ${fecha_desde}`);
    if (fecha_hasta) conditions.push(sql`${patientSymptoms.fecha} <= ${fecha_hasta}`);
    if (tipo) conditions.push(eq(patientSymptoms.tipo, tipo as 'animo' | 'hambre' | 'sueno' | 'sintoma'));
    const result = await db.select().from(patientSymptoms).where(and(...conditions)).orderBy(desc(patientSymptoms.fecha), desc(patientSymptoms.hora));
    res.success(result);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/:id/symptoms', authenticate, validateZodParams(z.object({ id: UUIDSchema })), validateZod(SymptomCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { tipo, valor, fecha, hora } = req.body;
    const result = await db.insert(patientSymptoms).values({
      pacienteId: req.params.id, fecha: fecha || new Date().toISOString().split('T')[0],
      tipo, valor: sanitize(valor), hora: hora || new Date().toTimeString().slice(0, 5),
    }).returning();
    res.created(result[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.delete('/:id/symptoms/:entryId', authenticate, validateZodParams(z.object({ id: UUIDSchema, entryId: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.delete(patientSymptoms).where(and(eq(patientSymptoms.id, req.params.entryId), eq(patientSymptoms.pacienteId, req.params.id))).returning({ id: patientSymptoms.id });
    if (!result.length) return res.error(404, 'Entrada no encontrada');
    res.success({ ok: true });
  } catch (err) { res.error(500, 'Error interno'); }
});

export default router;