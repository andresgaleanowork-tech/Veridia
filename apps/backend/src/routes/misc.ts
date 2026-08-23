// Cash, Favorites, Settings, Audit routes — Drizzle ORM
import { Router } from 'express';
import { eq, desc, ilike, and, gte, lte, asc } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../config/db.js';
import { cashSessions, foodFavorites, customDishes, users, auditLog } from '../db/schema/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateZod, validateZodQuery, validateZodParams } from '../middleware/zodValidate.js';
import { CashSessionCreateSchema, CashMovementCreateSchema, FoodFavoriteCreateSchema, CustomDishCreateSchema, SettingsUpdateSchema, AuditListQuerySchema, UserUpdateSchema, UUIDSchema } from '../schemas/index.js';
import { sanitize } from '../middleware/validate.js';

const router = Router();

// ─── CASH SESSIONS ───

router.get('/cash/current', authenticate, async (_req, res) => {
  try {
    const r = await db.select().from(cashSessions).where(eq(cashSessions.estado, 'Abierta')).orderBy(desc(cashSessions.createdAt)).limit(1);
    res.success(r[0] || null);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/cash/open', authenticate, authorize('admin', 'nutricionista'), validateZod(CashSessionCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    await db.update(cashSessions).set({ estado: 'Cerrada' }).where(eq(cashSessions.estado, 'Abierta'));
    const r = await db.insert(cashSessions).values({ saldoInicial: String(req.body.saldo_inicial), createdBy: user?.id }).returning();
    res.created(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/cash/movement', authenticate, validateZod(CashMovementCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const session = await db.select().from(cashSessions).where(eq(cashSessions.estado, 'Abierta')).limit(1);
    if (!session.length) return res.error(400, 'No hay sesión abierta');
    const s = session[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- movimientos is a JSONB array with dynamic objects
    const movimientos = (s.movimientos as any[]) || [];
    movimientos.push({ tipo: req.body.tipo, importe: parseFloat(req.body.importe), descripcion: req.body.descripcion || '', metodo: req.body.metodo || 'Efectivo', fecha: req.body.fecha || new Date().toISOString() });
    const r = await db.update(cashSessions).set({ movimientos }).where(eq(cashSessions.id, s.id)).returning();
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/cash/close', authenticate, authorize('admin'), async (_req, res) => {
  try {
    const r = await db.update(cashSessions).set({ estado: 'Cerrada' }).where(eq(cashSessions.estado, 'Abierta')).returning();
    res.success(r[0] || null);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/cash/history', authenticate, async (_req, res) => {
  try {
    const r = await db.select().from(cashSessions).orderBy(desc(cashSessions.createdAt)).limit(50);
    res.success(r);
  } catch (err) { res.error(500, 'Error interno'); }
});

// ─── FOOD FAVORITES ───

router.get('/foods/favorites', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.select().from(foodFavorites).where(eq(foodFavorites.userId, user?.id)).orderBy(desc(foodFavorites.createdAt));
    res.success(r);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/foods/favorites', authenticate, validateZod(FoodFavoriteCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { food_data, source } = req.body;
    const r = await db.insert(foodFavorites).values({ userId: user?.id, foodData: food_data, source: source || 'BEDCA' }).onConflictDoNothing().returning();
    res.created(r[0] || { ok: true });
  } catch (err) { res.error(500, 'Error interno'); }
});

router.delete('/foods/favorites/:id', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    await db.delete(foodFavorites).where(and(eq(foodFavorites.id, req.params.id), eq(foodFavorites.userId, user?.id)));
    res.success({ ok: true });
  } catch (err) { res.error(500, 'Error interno'); }
});

// ─── CUSTOM DISHES ───

router.get('/foods/custom-dishes', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.select().from(customDishes).where(eq(customDishes.userId, user?.id)).orderBy(desc(customDishes.createdAt));
    res.success(r);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/foods/custom-dishes', authenticate, validateZod(CustomDishCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { nombre, raciones, ingredientes, kcal, prot, grasas, hc, fibra } = req.body;
    const r = await db.insert(customDishes).values({
      userId: user?.id, nombre: sanitize(nombre), raciones: raciones || 1,
      ingredientes: ingredientes || [], kcal: String(kcal), prot: String(prot),
      grasas: String(grasas), hc: String(hc), fibra: String(fibra),
    }).returning();
    res.created(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.delete('/foods/custom-dishes/:id', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    await db.delete(customDishes).where(and(eq(customDishes.id, req.params.id), eq(customDishes.userId, user?.id)));
    res.success({ ok: true });
  } catch (err) { res.error(500, 'Error interno'); }
});

// ─── SETTINGS ───

router.get('/settings', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.select().from(users).where(eq(users.id, user?.id));
    if (!r.length) return res.error(404, 'Usuario no encontrado');
    const u = r[0];
    res.success({ name: u.name, email: u.email, role: u.role, initials: u.initials, dni: u.dni, telefono: u.telefono, titulacion: u.titulacion, matricula: u.matricula, pais: u.pais });
  } catch (err) { res.error(500, 'Error interno'); }
});

router.put('/settings', authenticate, validateZod(SettingsUpdateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(req.body)) { if (value !== undefined) updates[key] = value; }
    if (!Object.keys(updates).length) return res.error(400, 'Sin campos para actualizar');
    const r = await db.update(users).set(updates).where(eq(users.id, user?.id)).returning({ name: users.name, email: users.email, role: users.role, dni: users.dni, telefono: users.telefono, titulacion: users.titulacion, matricula: users.matricula, pais: users.pais });
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

// ─── AUDIT LOG ───

router.get('/audit', authenticate, authorize('admin'), validateZodQuery(AuditListQuerySchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { user_id, entidad, fecha_desde, fecha_hasta, page = 1, limit = 50 } = req.query;
    const conditions = [];
    if (user_id) conditions.push(eq(auditLog.userId, String(user_id)));
    if (entidad) conditions.push(ilike(auditLog.entidad, `%${entidad}%`));
    if (fecha_desde) conditions.push(gte(auditLog.createdAt, new Date(String(fecha_desde))));
    if (fecha_hasta) conditions.push(lte(auditLog.createdAt, new Date(String(fecha_hasta))));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const r = await db.select().from(auditLog).where(where).orderBy(desc(auditLog.createdAt))
      .limit(parseInt(String(limit))).offset((parseInt(String(page)) - 1) * parseInt(String(limit)));
    res.paginated(r, r.length, parseInt(String(page)), parseInt(String(limit)));
  } catch (err) { res.error(500, 'Error interno'); }
});

// ─── USER MANAGEMENT ───

router.get('/auth/users', authenticate, authorize('admin'), async (_req, res) => {
  try {
    const r = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, initials: users.initials, active: users.active, createdAt: users.createdAt, trialExpires: users.trialExpires }).from(users).orderBy(asc(users.name));
    res.success(r);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.put('/auth/users/:id', authenticate, authorize('admin'), validateZodParams(z.object({ id: UUIDSchema })), validateZod(UserUpdateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(req.body)) { if (value !== undefined) updates[key] = value; }
    if (!Object.keys(updates).length) return res.error(400, 'Sin campos para actualizar');
    const r = await db.update(users).set(updates).where(eq(users.id, req.params.id)).returning({ id: users.id, name: users.name, email: users.email, role: users.role, active: users.active });
    if (!r.length) return res.error(404, 'No encontrado');
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.put('/auth/users/:id/deactivate', authenticate, authorize('admin'), validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.update(users).set({ active: false }).where(eq(users.id, req.params.id)).returning({ id: users.id, name: users.name, active: users.active });
    if (!r.length) return res.error(404, 'No encontrado');
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

export default router;
