// Telehealth routes — Drizzle ORM (appointments table has telehealth columns)
import { Router } from 'express';
import { eq } from 'drizzle-orm';

import { db } from '../config/db.js';
import { appointments } from '../db/schema/index.js';
import { authenticate } from '../middleware/auth.js';
import { validateZod } from '../middleware/zodValidate.js';
import { TelehealthStartSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

router.post('/start', authenticate, validateZod(TelehealthStartSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { appointmentId, provider } = req.body;
    const meetingId = `veridia-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const telehealthLink = provider === 'zoom' ? `https://zoom.us/j/${meetingId}` : `https://veridia.app/telehealth/${meetingId}`;
    await db.update(appointments).set({ telehealthLink, telehealthStatus: 'ready' }).where(eq(appointments.id, appointmentId));
    await logAudit(user.id, 'CREATE', 'Telehealth', appointmentId, req);
    res.created({ appointmentId, telehealthLink, provider, meetingId });
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.get('/:appointmentId', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.select({ telehealthLink: appointments.telehealthLink, telehealthStatus: appointments.telehealthStatus }).from(appointments).where(eq(appointments.id, req.params.appointmentId));
    if (!r.length) return res.error(404, 'Turno no encontrado');
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/:appointmentId/end', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    await db.update(appointments).set({ telehealthStatus: 'ended' }).where(eq(appointments.id, req.params.appointmentId));
    await logAudit(user.id, 'UPDATE', 'Telehealth', req.params.appointmentId, req);
    res.success({ message: 'Telehealth finalizado' });
  } catch (err) { res.error(500, 'Error interno'); }
});

export default router;