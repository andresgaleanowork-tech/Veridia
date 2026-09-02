// Clinical routes — Drizzle ORM
import { Router } from 'express';
import { eq, desc, sql, gte, lte, asc, and } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../config/db.js';
import { antropometrias, analiticas, alerts, patients } from '../db/schema/index.js';
import { authenticate } from '../middleware/auth.js';
import { validateZod, validateZodParams, validateZodQuery } from '../middleware/zodValidate.js';
import {
  AnthropometryCreateSchema,
  AnthropometryTrendsQuerySchema,
  AnalyticsCreateSchema,
  FormulaRequestSchema,
  AlertCreateSchema,
  AlertStatusSchema,
  UUIDSchema,
} from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

// ---- ANTHROPOMETRY ----

// POST /api/clinical/antropometria
router.post('/antropometria', authenticate, validateZod(AnthropometryCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, fecha, peso, altura, cintura, cadera, pantorrilla, grasa_corporal, masa_muscular, grasa_visceral, metodo } = req.body;
    const imc = +(peso / ((altura / 100) ** 2)).toFixed(1);

    const result = await db.insert(antropometrias).values({
      pacienteId: paciente_id,
      fecha: fecha || sql`CURRENT_DATE`,
      peso: String(peso),
      altura: String(altura),
      imc: String(imc),
      cintura: String(cintura || 0),
      cadera: String(cadera || 0),
      pantorrilla: String(pantorrilla || 0),
      grasaCorporal: String(grasa_corporal || 0),
      masaMuscular: String(masa_muscular || 0),
      grasaVisceral: String(grasa_visceral || 0),
      metodo: metodo || 'BIA',
      createdBy: user.id,
    }).returning();

    const pat = await db.select({ nombre: patients.nombre, apellidos: patients.apellidos }).from(patients).where(eq(patients.id, paciente_id));
    await logAudit(user.id, 'CREATE', 'Antropometria', pat[0]?.nombre + ' ' + pat[0]?.apellidos, req);
    res.created(result[0]);
  } catch (err) {
    console.error('POST antro error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/clinical/antropometria/:pacienteId
router.get('/antropometria/:pacienteId', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(antropometrias)
      .where(eq(antropometrias.pacienteId, req.params.pacienteId))
      .orderBy(desc(antropometrias.fecha));
    res.success(result);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// ---- ANALYTICS ----

// POST /api/clinical/analitica
router.post('/analitica', authenticate, validateZod(AnalyticsCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, fecha, ayuno, marcadores } = req.body;
    const result = await db.insert(analiticas).values({
      pacienteId: paciente_id,
      fecha: fecha || sql`CURRENT_DATE`,
      ayuno: ayuno ?? true,
      marcadores,
      createdBy: user.id,
    }).returning();

    // Auto-generate alerts for critical values
    for (const m of marcadores) {
      if (m.alerta === 'grave') {
        await db.insert(alerts).values({
          pacienteId: paciente_id,
          tipo: 'Analítica',
          severidad: 'grave',
          mensaje: `${m.nombre} ${m.valor} ${m.unidad} — Fuera de rango (${m.rango})`,
          recomendacion: m.recomendacion || 'Valoración clínica',
          createdBy: user.id,
        });
      }
    }

    res.created(result[0]);
  } catch (err) {
    console.error('POST analitica error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/clinical/analitica/:pacienteId
router.get('/analitica/:pacienteId', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(analiticas)
      .where(eq(analiticas.pacienteId, req.params.pacienteId))
      .orderBy(desc(analiticas.fecha));
    res.success(result);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// ---- FORMULA CALCULATION (server-side, tamper-proof) ----

// POST /api/clinical/formula
router.post('/formula', authenticate, validateZod(FormulaRequestSchema), async (req, res) => {
  const { peso, altura, edad, sexo, formula, fa, fe = 1, ajuste = 0, protGkg = 1.2, grasasPct = 30 } = req.body;

  let geb;
  if (formula === 'Mifflin-St Jeor') geb = 10 * peso + 6.25 * altura - 5 * edad + (sexo === 'M' ? 5 : -161);
  else if (formula === 'Harris-Benedict') geb = sexo === 'M' ? 66.5 + 13.75 * peso + 5.003 * altura - 6.775 * edad : 655.1 + 9.563 * peso + 1.85 * altura - 4.676 * edad;
  else geb = sexo === 'M' ? 879 + 10.2 * peso : 795 + 7.18 * peso;

  const get = Math.round(geb * fa * fe) + ajuste;
  const protG = Math.round(protGkg * peso);
  const grasasG = Math.round(get * grasasPct / 100 / 9);
  const hcG = Math.round((get - protG * 4 - grasasG * 9) / 4);

  res.success({
    formula, geb: Math.round(geb), fa, fe, ajuste, get,
    macros: {
      proteinas: { g: protG, pct: Math.round(protG * 4 / get * 100), kcal: protG * 4, gKg: protGkg },
      grasas: { g: grasasG, pct: grasasPct, kcal: grasasG * 9 },
      hc: { g: Math.max(0, hcG), pct: 100 - Math.round(protG * 4 / get * 100) - grasasPct, kcal: Math.max(0, hcG) * 4 },
      fibra: { g: Math.max(25, Math.round(14 * get / 1000)) },
      agua: { l: Math.round(35 * peso / 1000 * 10) / 10 },
    }
  });
});

// ---- ALERTS ----

// GET /api/clinical/alerts/:pacienteId
router.get('/alerts/:pacienteId', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(alerts)
      .where(eq(alerts.pacienteId, req.params.pacienteId))
      .orderBy(desc(alerts.createdAt));
    res.success(result);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// POST /api/clinical/alerts
router.post('/alerts', authenticate, validateZod(AlertCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, tipo, severidad, mensaje, recomendacion, estado } = req.body;
    const result = await db.insert(alerts).values({
      pacienteId: paciente_id,
      tipo,
      severidad,
      mensaje,
      recomendacion,
      estado: estado || 'pendiente',
      createdBy: user.id,
    }).returning();
    await logAudit(user.id, 'CREATE', 'Alert', `Alerta para ${paciente_id}`, req);
    res.created(result[0]);
  } catch (err) {
    console.error('POST alert error:', err);
    res.error(500, 'Error interno');
  }
});

// PUT /api/clinical/alerts/:id/review
router.put('/alerts/:id/review', authenticate, validateZodParams(z.object({ id: UUIDSchema })), validateZod(z.object({ estado: AlertStatusSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.update(alerts).set({ estado: req.body.estado }).where(eq(alerts.id, req.params.id)).returning();
    if (!result.length) return res.error(404, 'No encontrada');
    res.success(result[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

router.get('/patients/:id/anthropometry/trends', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), validateZodQuery(AnthropometryTrendsQuerySchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const metric = String(req.query.metric || 'peso') as keyof typeof antropometrias;
    const columnMap: Record<string, import('drizzle-orm').Column> = {
      peso: antropometrias.peso,
      altura: antropometrias.altura,
      imc: antropometrias.imc,
      cintura: antropometrias.cintura,
      cadera: antropometrias.cadera,
      pantorrilla: antropometrias.pantorrilla,
      grasa_corporal: antropometrias.grasaCorporal,
      masa_muscular: antropometrias.masaMuscular,
      grasa_visceral: antropometrias.grasaVisceral,
    };
    const conditions = [eq(antropometrias.pacienteId, req.params.pacienteId)];
    if (req.query.from) conditions.push(gte(antropometrias.fecha, String(req.query.from)));
    if (req.query.to) conditions.push(lte(antropometrias.fecha, String(req.query.to)));
    const result = await db.select({
      fecha: antropometrias.fecha,
      value: columnMap[metric] as unknown as import('drizzle-orm').SQL,
    }).from(antropometrias)
      .where(and(...conditions))
      .orderBy(asc(antropometrias.fecha));
    res.success(result.map(r => ({ fecha: r.fecha, value: parseFloat(String(r.value)) || 0 })));
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

export default router;