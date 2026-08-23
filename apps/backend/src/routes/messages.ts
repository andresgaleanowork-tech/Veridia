// Messages / Chat routes — Drizzle ORM
import { Router } from 'express';
import { eq, and, asc, count } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../config/db.js';
import { messages } from '../db/schema/index.js';
import { authenticate } from '../middleware/auth.js';
import { validateZod, validateZodParams } from '../middleware/zodValidate.js';
import { MessageCreateSchema, UUIDSchema } from '../schemas/index.js';
import { sanitize } from '../middleware/validate.js';

const router = Router();

router.get('/unread/count', authenticate, async (req, res) => {
  try {
    const result = await db.select({ count: count() }).from(messages).where(and(eq(messages.read, false), eq(messages.sender, 'patient')));
    res.success({ count: parseInt(String(result[0].count)) });
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/:pacienteId', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(messages).where(eq(messages.pacienteId, req.params.pacienteId)).orderBy(asc(messages.createdAt));
    res.success(result);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/:pacienteId', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), validateZod(MessageCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.insert(messages).values({
      pacienteId: req.params.pacienteId, sender: req.body.sender, text: sanitize(req.body.text),
    }).returning();
    res.created(result[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.put('/:pacienteId/read', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    await db.update(messages).set({ read: true }).where(and(eq(messages.pacienteId, req.params.pacienteId), eq(messages.sender, req.body.sender || 'patient'), eq(messages.read, false)));
    res.success({ ok: true });
  } catch (err) { res.error(500, 'Error interno'); }
});

export default router;