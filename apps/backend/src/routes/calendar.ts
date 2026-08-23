// Calendar Export routes — Drizzle ORM
import { Router } from 'express';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

import { db } from '../config/db.js';
import { calendarExports } from '../db/schema/index.js';
import { authenticate } from '../middleware/auth.js';
import { generateICalFeed } from '../services/calendar-export.js';

const router = Router();

router.get('/export', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(calendarExports).where(eq(calendarExports.userId, user.id));
    let token: string;
    if (!result.length) {
      const newToken = crypto.randomBytes(32).toString('hex');
      const created = await db.insert(calendarExports).values({ userId: user.id, exportToken: newToken }).returning();
      token = created[0].exportToken;
    } else {
      token = result[0].exportToken;
    }
    const url = `${req.protocol}://${req.get('host')}/api/calendar/feed/${token}`;
    res.success({ url, token });
  } catch (error) { res.error(500, 'Error generating calendar export'); }
});

router.get('/feed/:token', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(calendarExports).where(eq(calendarExports.exportToken, req.params.token));
    if (!result.length) return res.error(404, 'Invalid export token');
    const userId = result[0].userId;
    const icalData = await generateICalFeed();
    await db.update(calendarExports).set({ lastExportedAt: new Date() }).where(eq(calendarExports.userId, userId as string));
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="veridia-calendar.ics"');
    res.send(icalData);
  } catch (error) { res.error(500, 'Error generating calendar'); }
});

export default router;