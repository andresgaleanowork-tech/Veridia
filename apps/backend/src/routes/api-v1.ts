// API v1 routes — Drizzle ORM (hybrid: raw SQL for unmodeled tables)
import { Router, Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('API-V1');
import { eq, desc, count } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';

import { db } from '../config/db.js';
import { apiKeys, patients, appointments } from '../db/schema/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { toPublicPatient } from '../utils/patientSerializer.js';
import { validateZod, validateZodQuery } from '../middleware/zodValidate.js';
import { logAudit } from '../utils/audit.js';
import { AppointmentCreateSchema } from '../schemas/index.js';

const router = Router();

async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-api-key'];
  if (typeof key !== 'string' || !key) return res.error(401, 'API key requerida');
  try {
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    const r = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash));
    if (!r.length) return res.error(401, 'API key inválida');
    if (!r[0].active) return res.error(403, 'API key desactivada');
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, r[0].id));
    req.apiKey = r[0];
    next();
  } catch (err) {
    logger.error('API key auth error', { message: err instanceof Error ? err.message : String(err) });
    res.error(500, 'Error interno');
  }
}

router.post('/api-keys', authenticate, authorize('admin'), validateZod(z.object({
  name: z.string().min(1).max(100), scopes: z.array(z.string()).optional().default([]), expiresInDays: z.number().int().positive().optional(),
})), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { name, scopes, expiresInDays } = req.body;
    const rawKey = 'vk_' + crypto.randomBytes(24).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 12) + '...';
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;
    const r = await db.insert(apiKeys).values({ name, keyHash, keyPrefix, scopes, expiresAt, createdBy: user.id })
      .returning({ id: apiKeys.id, name: apiKeys.name, keyPrefix: apiKeys.keyPrefix, scopes: apiKeys.scopes, expiresAt: apiKeys.expiresAt, createdAt: apiKeys.createdAt });
    await logAudit(user.id, 'CREATE', 'ApiKey', r[0].id, req);
    res.created({ ...r[0], key: rawKey });
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.get('/api-keys', authenticate, authorize('admin'), async (_req, res) => {
  try {
    const r = await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
    res.success(r);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.delete('/api-keys/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.delete(apiKeys).where(eq(apiKeys.id, req.params.id)).returning({ id: apiKeys.id });
    if (!r.length) return res.error(404, 'API key no encontrada');
    await logAudit(user.id, 'DELETE', 'ApiKey', req.params.id, req);
    res.success({ message: 'API key revocada' });
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/patients', apiKeyAuth, validateZodQuery(z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(50) })), async (req, res) => {
  try {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const data = await db.select().from(patients).where(eq(patients.activo, true)).limit(limit).offset((page - 1) * limit);
    const c = await db.select({ count: count() }).from(patients).where(eq(patients.activo, true));
    res.paginated(data.map(toPublicPatient), parseInt(String(c[0].count)), page, limit);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/patients/:id', apiKeyAuth, async (req, res) => {
  try {
    const r = await db.select().from(patients).where(eq(patients.id, req.params.id));
    if (!r.length) return res.error(404, 'Paciente no encontrado');
    res.success(toPublicPatient(r[0]));
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/appointments', apiKeyAuth, validateZod(AppointmentCreateSchema), async (req, res) => {
  try {
    if (!req.apiKey) return res.error(403, 'API key inválida');
    const { paciente_id, fecha, hora, tipo, asunto, estado, pago, precio, duracion, nota, color } = req.body;
    const r = await db.insert(appointments).values({
      pacienteId: paciente_id, fecha, hora, tipo, asunto, estado: estado || 'Pendiente', pago, precio: String(precio), duracion, nota, color,
    }).returning();
    await logAudit(req.apiKey.id, 'CREATE', 'Appointment', r[0].id, req);
    res.created(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

export default router;