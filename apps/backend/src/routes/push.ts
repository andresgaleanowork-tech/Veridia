// Push Notifications routes — Drizzle ORM
import { Router } from 'express';
import { eq, and } from 'drizzle-orm';

import { db } from '../config/db.js';
import { pushSubscriptions } from '../db/schema/index.js';
import { patientAuthenticate } from '../middleware/auth.js';

const router = Router();

router.post('/subscribe', patientAuthenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { fcm_token, platform } = req.body;
    if (!fcm_token) return res.error(400, 'FCM token required');
    await db.insert(pushSubscriptions).values({
      pacienteId: user.id, fcmToken: fcm_token, platform: platform || 'web',
    }).onConflictDoUpdate({ target: [pushSubscriptions.pacienteId, pushSubscriptions.fcmToken], set: { active: true } });
    res.success({ message: 'Push subscription registered' });
  } catch (error) { res.error(500, 'Error registering push subscription'); }
});

router.delete('/unsubscribe', patientAuthenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { fcm_token } = req.body;
    await db.update(pushSubscriptions).set({ active: false })
      .where(and(eq(pushSubscriptions.pacienteId, user.id), eq(pushSubscriptions.fcmToken, fcm_token)));
    res.success({ message: 'Push subscription removed' });
  } catch (error) { res.error(500, 'Error removing push subscription'); }
});

export default router;