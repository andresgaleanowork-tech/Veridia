// Notifications routes — Drizzle ORM
import { Router } from 'express';
import { eq, desc, and, count } from 'drizzle-orm';

import { db } from '../config/db.js';
import { professionalNotifications } from '../db/schema/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const result = await db.select().from(professionalNotifications)
      .where(eq(professionalNotifications.professionalId, user.id))
      .orderBy(desc(professionalNotifications.createdAt))
      .limit(limit).offset(offset);

    const totalRes = await db.select({ total: count() }).from(professionalNotifications)
      .where(eq(professionalNotifications.professionalId, user.id));
    const unreadRes = await db.select({ count: count() }).from(professionalNotifications)
      .where(and(eq(professionalNotifications.professionalId, user.id), eq(professionalNotifications.read, false)));

    res.success({
      notifications: result, total: parseInt(String(totalRes[0].total)),
      unread: parseInt(String(unreadRes[0].count)), page,
      totalPages: Math.ceil(parseInt(String(totalRes[0].total)) / limit),
    });
  } catch (error) { res.error(500, 'Error fetching notifications'); }
});

router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    await db.update(professionalNotifications).set({ read: true })
      .where(and(eq(professionalNotifications.id, req.params.id), eq(professionalNotifications.professionalId, user.id)));
    res.success({ message: 'Marked as read' });
  } catch (error) { res.error(500, 'Error marking notification'); }
});

router.put('/read-all', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    await db.update(professionalNotifications).set({ read: true })
      .where(and(eq(professionalNotifications.professionalId, user.id), eq(professionalNotifications.read, false)));
    res.success({ message: 'All marked as read' });
  } catch (error) { res.error(500, 'Error marking all notifications'); }
});

router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select({ count: count() }).from(professionalNotifications)
      .where(and(eq(professionalNotifications.professionalId, user.id), eq(professionalNotifications.read, false)));
    res.success({ count: parseInt(String(result[0].count)) });
  } catch (error) { res.error(500, 'Error fetching count'); }
});

export default router;