// Reports routes — Drizzle ORM (hybrid: raw SQL for unmodeled tables)
import { Router } from 'express';
import { eq, desc, and, count, sql } from 'drizzle-orm';

import { db } from '../config/db.js';
import { patients, clinicalHistories, antropometrias, mealPlans, reports, reportTemplates, alerts, analiticas, invoices, userSettings } from '../db/schema/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateZod, validateZodQuery } from '../middleware/zodValidate.js';
import { ReportGenerateSchema, ReportQuerySchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import { generateMealPlanPDF, generateClinicalReportPDF, generateInvoicePDF } from '../services/pdf.js';

const router = Router();

function generateVeridiaHTML(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #0B1120; color: #E2E8F0; margin: 0; padding: 40px; }
    .container { max-width: 900px; margin: 0 auto; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .logo { width: 48px; height: 48px; background: linear-gradient(135deg, #0891B2, #06B6D4); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff; font-size: 20px; }
    .brand h1 { margin: 0; font-size: 20px; color: #fff; }
    .brand p { margin: 4px 0 0; font-size: 12px; color: #94A3B8; }
    .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; margin-bottom: 24px; }
    .card h2 { margin: 0 0 16px; font-size: 16px; color: #0891B2; text-transform: uppercase; letter-spacing: 0.05em; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .row:last-child { border-bottom: none; }
    .label { color: #94A3B8; font-size: 13px; }
    .value { color: #F1F5F9; font-size: 14px; font-weight: 500; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #64748B; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align: left; padding: 10px 12px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    th { color: #0891B2; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">V</div>
      <div class="brand">
        <h1>Veridia HealthTech</h1>
        <p>Informe Clínico-Nutricional • ${new Date().toLocaleDateString('es-ES')}</p>
      </div>
    </div>
    ${bodyContent}
    <div class="footer">
      Generado automáticamente por Veridia HealthTech v5.2.0 • ${new Date().toISOString()}
    </div>
  </div>
</body>
</html>`;
}

interface ReportPatient {
  nombre?: string | null;
  apellidos?: string | null;
  dni?: string | null;
  fechaNacimiento?: string | null;
  sexo?: string | null;
  telefono?: string | null;
  email?: string | null;
  alerts?: unknown[];
}

interface ReportData {
  history?: {
    antecedentes?: string | null;
    alergias?: string | null;
    medicacion?: string | null;
    observaciones?: string | null;
  } | null;
  antropometrias?: { fecha: string; peso?: string | number | null; altura?: string | number | null; imc?: string | number | null; metodo?: string | null }[];
  mealPlans?: { fechaCreacion?: string | null; nombre?: string | null; kcalObjetivo?: number | null; estado?: string | null }[];
}

interface KpiSummary {
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number;
  avgAppointmentsPerPatient: number;
  generatedAt: string;
}

function buildPatientReport(patient: ReportPatient, data: ReportData): string {
  const sections: string[] = [];
  sections.push(`<div class="card"><h2>Datos del Paciente</h2>
    <div class="row"><span class="label">Nombre</span><span class="value">${patient.nombre || ''} ${patient.apellidos || ''}</span></div>
    <div class="row"><span class="label">DNI</span><span class="value">${patient.dni || '—'}</span></div>
    <div class="row"><span class="label">Fecha de nacimiento</span><span class="value">${patient.fechaNacimiento || '—'}</span></div>
    <div class="row"><span class="label">Sexo</span><span class="value">${patient.sexo || '—'}</span></div>
    <div class="row"><span class="label">Teléfono</span><span class="value">${patient.telefono || '—'}</span></div>
    <div class="row"><span class="label">Email</span><span class="value">${patient.email || '—'}</span></div>
  </div>`);

  if (data.history) {
    sections.push(`<div class="card"><h2>Historia Clínica</h2>
      <div class="row"><span class="label">Antecedentes</span><span class="value">${data.history.antecedentes || '—'}</span></div>
      <div class="row"><span class="label">Alergias</span><span class="value">${data.history.alergias || '—'}</span></div>
      <div class="row"><span class="label">Medicación</span><span class="value">${data.history.medicacion || '—'}</span></div>
      <div class="row"><span class="label">Observaciones</span><span class="value">${data.history.observaciones || '—'}</span></div>
    </div>`);
  }

  if (data.antropometrias?.length) {
    const rows = data.antropometrias.map((a) => `<tr><td>${new Date(a.fecha).toLocaleDateString('es-ES')}</td><td>${a.peso || '—'}</td><td>${a.altura || '—'}</td><td>${a.imc || '—'}</td><td>${a.metodo || '—'}</td></tr>`).join('');
    sections.push(`<div class="card"><h2>Antropometría</h2><table><thead><tr><th>Fecha</th><th>Peso (kg)</th><th>Altura (cm)</th><th>IMC</th><th>Método</th></tr></thead><tbody>${rows}</tbody></table></div>`);
  }

  if (data.mealPlans?.length) {
    const rows = data.mealPlans.map((p) => `<tr><td>${p.fechaCreacion ? new Date(p.fechaCreacion).toLocaleDateString('es-ES') : '—'}</td><td>${p.nombre || '—'}</td><td>${p.kcalObjetivo ?? '—'}</td><td>${p.estado}</td></tr>`).join('');
    sections.push(`<div class="card"><h2>Planes Alimenticios</h2><table><thead><tr><th>Fecha</th><th>Nombre</th><th>Kcal objetivo</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table></div>`);
  }

  return sections.join('');
}

router.post('/generate', authenticate, authorize('nutricionista'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, tipo, plantilla = 'default', titulo } = req.body;
    if (!paciente_id || !tipo) return res.error(400, 'paciente_id y tipo son requeridos');

    const patientRes = await db.select().from(patients).where(eq(patients.id, paciente_id));
    if (!patientRes.length) return res.error(404, 'Paciente no encontrado');
    const patient = patientRes[0];

    let extraData: ReportData = {};
    if (['paciente_completo', 'clinico', 'nutricional'].includes(tipo)) {
      const [history, antro, plans] = await Promise.all([
        db.select().from(clinicalHistories).where(eq(clinicalHistories.pacienteId, paciente_id)).orderBy(desc(clinicalHistories.version)).limit(1),
        db.select().from(antropometrias).where(eq(antropometrias.pacienteId, paciente_id)).orderBy(desc(antropometrias.fecha)),
        db.select().from(mealPlans).where(eq(mealPlans.pacienteId, paciente_id)).orderBy(desc(mealPlans.fechaCreacion)),
      ]);
      extraData = { history: history[0] || null, antropometrias: antro, mealPlans: plans };
    }

    const bodyContent = buildPatientReport(patient, extraData);
    const fileContent = generateVeridiaHTML(titulo || `Informe ${tipo}`, bodyContent);

    const result = await db.insert(reports).values({
      pacienteId: paciente_id, tipo, plantilla, titulo: titulo || `Informe ${tipo}`, fileContent, createdBy: user?.id,
    }).returning();
    await logAudit(user?.id, 'CREATE', 'Report', `${tipo} - ${patient.nombre} ${patient.apellidos}`, req);
    res.created(result[0]);
  } catch (err) { console.error('POST /reports/generate error:', err); res.error(500, 'Error interno'); }
});

router.post('/analytics', authenticate, validateZod(ReportGenerateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { name, type, params } = req.body;
    const result: KpiSummary = { totalPatients: 0, totalAppointments: 0, totalRevenue: 0, avgAppointmentsPerPatient: 0, generatedAt: new Date().toISOString() };

    const patientsResult = await db.select({ count: count() }).from(patients).where(eq(patients.activo, true));
    result.totalPatients = parseInt(String(patientsResult[0].count));

    const appointmentsResult = await db.execute(sql`SELECT COUNT(*) as count FROM appointments WHERE fecha >= DATE_TRUNC('month', NOW())`);
    result.totalAppointments = parseInt(String(((appointmentsResult as unknown) as { rows?: { count: string | number }[] }).rows?.[0]?.count || 0));

    const revenueResult = await db.execute(sql`SELECT COALESCE(SUM(importe), 0) as total FROM cash_movements WHERE tipo = 'ingreso' AND fecha >= DATE_TRUNC('month', NOW())`);
    result.totalRevenue = parseFloat(String(((revenueResult as unknown) as { rows?: { total: string | number }[] }).rows?.[0]?.total || 0));

    if (result.totalPatients > 0) {
      result.avgAppointmentsPerPatient = Math.round(result.totalAppointments / result.totalPatients * 10) / 10;
    }

    const saved = await db.insert(reports).values({ name, type, params: params || {}, result, createdBy: user?.id }).returning();
    await logAudit(user?.id, 'CREATE', 'Report', saved[0].id, req);
    res.created(saved[0]);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.get('/', authenticate, authorize('nutricionista'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, page = 1, limit = 20 } = req.query;
    const conditions = [];
    if (paciente_id) conditions.push(eq(reports.pacienteId, String(paciente_id)));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.select().from(reports).where(where).orderBy(desc(reports.createdAt))
      .limit(parseInt(String(limit))).offset((parseInt(String(page)) - 1) * parseInt(String(limit)));
    const c = await db.select({ count: count() }).from(reports).where(where);
    res.paginated(data, parseInt(String(c[0].count)), parseInt(String(page)), parseInt(String(limit)));
  } catch (err) { console.error('GET /reports error:', err); res.error(500, 'Error interno'); }
});

router.get('/list', authenticate, validateZodQuery(ReportQuerySchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { type, page = 1, limit = 20 } = req.query;
    const conditions = [];
    if (type) conditions.push(eq(reports.type, String(type)));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.select().from(reports).where(where).orderBy(desc(reports.createdAt))
      .limit(parseInt(String(limit))).offset((parseInt(String(page)) - 1) * parseInt(String(limit)));
    const c = await db.select({ count: count() }).from(reports).where(where);
    res.paginated(data, parseInt(String(c[0].count)), parseInt(String(page)), parseInt(String(limit)));
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.get('/templates', authenticate, authorize('nutricionista'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(reportTemplates).where(eq(reportTemplates.activo, true));
    res.success(result);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/:id/download', authenticate, authorize('nutricionista'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select().from(reports).where(eq(reports.id, req.params.id));
    if (!result.length) return res.error(404, 'Informe no encontrado');
    const report = result[0];
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="informe_${report.tipo}_${report.pacienteId}.html"`);
    res.send(report.fileContent);
  } catch (err) { res.error(500, 'Error interno'); }
});

// PDF endpoints — keep raw SQL for unmodeled service
try {
  router.get('/meal-plan/:id/pdf', authenticate, async (req, res) => {
    try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
      const planRes = await db.select().from(mealPlans).where(eq(mealPlans.id, req.params.id));
      if (!planRes.length) return res.error(404, 'Plan no encontrado');
      const plan = planRes[0];
      const patientRes = await db.select().from(patients).where(eq(patients.id, plan.pacienteId || ''));
      const patient = patientRes[0];
      const settingsRes = await db.select().from(userSettings).where(eq(userSettings.userId, user?.id));
      const branding = (settingsRes[0] as unknown as { branding?: Record<string, unknown> }).branding || {};
      const pdfBuffer = await generateMealPlanPDF(plan, patient, branding);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="plan-${(plan.nombre || plan.id).replace(/\s+/g, '_')}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) { console.error('PDF meal-plan error:', err); res.error(500, 'Error generando PDF'); }
  });

  router.get('/clinical/:patientId/pdf', authenticate, async (req, res) => {
    try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
      const patientRes = await db.select().from(patients).where(eq(patients.id, req.params.patientId));
      if (!patientRes.length) return res.error(404, 'Paciente no encontrado');
      const historyRes = await db.select().from(clinicalHistories).where(eq(clinicalHistories.pacienteId, req.params.patientId)).orderBy(desc(clinicalHistories.version)).limit(1);
      const history = historyRes[0];
      const analyticsRes = await db.select().from(analiticas).where(eq(analiticas.pacienteId, req.params.patientId)).orderBy(desc(analiticas.fecha)).limit(1);
      const analytics = (analyticsRes[0] as unknown as { marcadores?: unknown[] }).marcadores || [];
      const alertsRes = await db.select().from(alerts).where(and(eq(alerts.pacienteId, req.params.patientId), eq(alerts.estado, 'pendiente')));
      const patient: ReportPatient = { ...patientRes[0], alerts: alertsRes };
      const settingsRes = await db.select().from(userSettings).where(eq(userSettings.userId, user?.id));
      const branding = (settingsRes[0] as unknown as { branding?: Record<string, unknown> }).branding || {};
      const pdfBuffer = await generateClinicalReportPDF(patient, history, analytics, branding);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-${patient.nombre}_${patient.apellidos}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) { console.error('PDF clinical error:', err); res.error(500, 'Error generando PDF'); }
  });

  router.get('/invoice/:id/pdf', authenticate, async (req, res) => {
    try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
      const invoiceRes = await db.select().from(invoices).where(eq(invoices.id, req.params.id));
      if (!invoiceRes.length) return res.error(404, 'Factura no encontrada');
      const invoice = invoiceRes[0];
      const patientRes = await db.select().from(patients).where(eq(patients.id, invoice.pacienteId || ''));
      const patient = patientRes[0];
      const settingsRes = await db.select().from(userSettings).where(eq(userSettings.userId, user?.id));
      const branding = (settingsRes[0] as unknown as { branding?: Record<string, unknown> }).branding || {};
      const pdfBuffer = await generateInvoicePDF(invoice, patient, branding);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="factura-${invoice.numero}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) { console.error('PDF invoice error:', err); res.error(500, 'Error generando PDF'); }
  });
} catch { /* PDF service not available */ }

export default router;