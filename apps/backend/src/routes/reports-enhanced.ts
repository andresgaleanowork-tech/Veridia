// Reports Enhanced routes - raw SQL (no Drizzle schema for enhanced_reports)
import { Router } from 'express';
import { z } from 'zod';

import { executeOne, executeMany } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateZod, validateZodParams } from '../middleware/zodValidate.js';
import { ReportEnhancedCreateSchema, UUIDSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import { sql } from 'drizzle-orm';

interface EnhancedReportRow {
  id: string;
  paciente_id: string;
  tipo: string;
  url_pdf: string;
  url_excel: string;
  parametros: unknown;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const router = Router();

router.post('/evolution', authenticate, authorize('admin', 'nutricionista', 'secretaria'), validateZod(ReportEnhancedCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, fecha_inicio, fecha_fin, tipo } = req.body;
    const patient = await executeOne<{ id: string }>(sql`SELECT id FROM patients WHERE id = ${paciente_id}`);
    if (!patient) return res.error(404, 'Paciente no encontrado');
    const parametros = { fecha_inicio, fecha_fin, tipo };
    const url_pdf = `/reports/enhanced/${Date.now()}.pdf`;
    const url_excel = `/reports/enhanced/${Date.now()}.xlsx`;
    const result = await executeOne<EnhancedReportRow>(sql`INSERT INTO enhanced_reports (paciente_id, tipo, url_pdf, url_excel, parametros, created_by) VALUES (${paciente_id}, ${tipo}, ${url_pdf}, ${url_excel}, ${JSON.stringify(parametros)}::jsonb, ${user.id}) RETURNING *`);
    await logAudit(user.id, 'CREATE', 'EnhancedReport', paciente_id, req, { tipo });
    res.created(result);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.get('/:pacienteId/history', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await executeMany<EnhancedReportRow>(sql`SELECT * FROM enhanced_reports WHERE paciente_id = ${req.params.pacienteId} ORDER BY created_at DESC`);
    res.success(result);
  } catch (err) { res.error(500, 'Error interno'); }
});

export default router;