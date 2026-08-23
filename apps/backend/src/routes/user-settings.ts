// User Settings routes — Drizzle ORM
import { Router } from 'express';
import { eq } from 'drizzle-orm';

import { db } from '../config/db.js';
import { userSettings } from '../db/schema/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    let result = await db.select().from(userSettings).where(eq(userSettings.userId, user.id));
    if (!result.length) {
      result = await db.insert(userSettings).values({ userId: user.id }).returning();
    }
    res.success(result[0]);
  } catch (error) { res.error(500, 'Error fetching settings'); }
});

router.put('/', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { notifications, branding } = req.body;
    const updates: Record<string, unknown> = {};
    if (notifications) updates.notifications = notifications;
    if (branding) updates.branding = branding;

    let result = await db.update(userSettings).set(updates).where(eq(userSettings.userId, user.id)).returning();
    if (!result.length) {
      result = await db.insert(userSettings).values({
        userId: user.id,
        notifications: notifications || {},
        branding: branding || {},
      }).returning();
    }
    res.success(result[0]);
  } catch (error) { res.error(500, 'Error updating settings'); }
});

router.get('/branding', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select({ branding: userSettings.branding }).from(userSettings).where(eq(userSettings.userId, user.id));
    res.success(result[0]?.branding || {});
  } catch (error) { res.error(500, 'Error fetching branding'); }
});

export default router;