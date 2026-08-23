// Service Packages + Subscriptions routes — Drizzle ORM
import { Router } from 'express';
import { eq, desc } from 'drizzle-orm';

import { db } from '../config/db.js';
import { servicePackages, patientSubscriptions, sessionCredits, patients } from '../db/schema/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (_req, res) => {
  try {
    const result = await db.select().from(servicePackages).where(eq(servicePackages.active, true));
    res.success(result);
  } catch (error) { res.error(500, 'Error fetching packages'); }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { name, description, sessions, price, duration_days, includes_meal_plan, includes_food_journal, includes_telehealth } = req.body;
    if (!name || !price) return res.error(400, 'Name and price required');
    const result = await db.insert(servicePackages).values({
      name, description, sessions: sessions || 1, price: String(price),
      durationDays: duration_days || 30, includesMealPlan: includes_meal_plan,
      includesFoodJournal: includes_food_journal, includesTelehealth: includes_telehealth, createdBy: user.id,
    }).returning();
    res.created(result[0]);
  } catch (error) { res.error(500, 'Error creating package'); }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const updates: Record<string, unknown> = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.sessions !== undefined) updates.sessions = req.body.sessions;
    if (req.body.price !== undefined) updates.price = String(req.body.price);
    if (req.body.duration_days !== undefined) updates.durationDays = req.body.duration_days;
    if (req.body.includes_meal_plan !== undefined) updates.includesMealPlan = req.body.includes_meal_plan;
    if (req.body.includes_food_journal !== undefined) updates.includesFoodJournal = req.body.includes_food_journal;
    if (req.body.includes_telehealth !== undefined) updates.includesTelehealth = req.body.includes_telehealth;
    if (req.body.active !== undefined) updates.active = req.body.active;
    const r = await db.update(servicePackages).set(updates).where(eq(servicePackages.id, req.params.id)).returning();
    if (!r.length) return res.error(404, 'Package not found');
    res.success(r[0]);
  } catch (error) { res.error(500, 'Error updating package'); }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    await db.update(servicePackages).set({ active: false }).where(eq(servicePackages.id, req.params.id));
    res.success({ message: 'Package deactivated' });
  } catch (error) { res.error(500, 'Error deleting package'); }
});

router.get('/subscriptions', authenticate, async (_req, res) => {
  try {
    const result = await db.select({
      id: patientSubscriptions.id, pacienteId: patientSubscriptions.pacienteId, pacienteNombre: patients.nombre, pacienteApellidos: patients.apellidos,
      packageName: servicePackages.name, totalSessions: servicePackages.sessions,
      status: patientSubscriptions.status, startDate: patientSubscriptions.startDate, endDate: patientSubscriptions.endDate,
      sessionsUsed: patientSubscriptions.sessionsUsed, createdAt: patientSubscriptions.createdAt,
    }).from(patientSubscriptions)
      .leftJoin(patients, eq(patientSubscriptions.pacienteId, patients.id))
      .leftJoin(servicePackages, eq(patientSubscriptions.packageId, servicePackages.id))
      .orderBy(desc(patientSubscriptions.createdAt));
    res.success(result);
  } catch (error) { res.error(500, 'Error fetching subscriptions'); }
});

router.post('/subscriptions', authenticate, authorize('admin', 'nutricionista'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { patient_id, package_id, start_date } = req.body;
    if (!patient_id || !package_id) return res.error(400, 'Patient and package required');
    const pkg = await db.select().from(servicePackages).where(eq(servicePackages.id, package_id));
    if (!pkg.length) return res.error(404, 'Package not found');
    const p = pkg[0];
    const endDate = new Date(start_date || Date.now());
    endDate.setDate(endDate.getDate() + p.durationDays);

    const result = await db.insert(patientSubscriptions).values({
      pacienteId: patient_id, packageId: package_id, startDate: start_date || new Date().toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0], sessionsTotal: p.sessions, status: 'active',
    }).returning();

    await db.insert(sessionCredits).values({
      pacienteId: patient_id, subscriptionId: result[0].id, remaining: p.sessions,
      expiresAt: endDate.toISOString().split('T')[0],
    });
    res.created(result[0]);
  } catch (error) { res.error(500, 'Error creating subscription'); }
});

export default router;