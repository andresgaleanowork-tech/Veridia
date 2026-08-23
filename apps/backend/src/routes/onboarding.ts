// Onboarding routes - raw SQL (no Drizzle schema for onboarding tables)
import { Router } from 'express';
import { sql } from 'drizzle-orm';

import { executeOne, executeMany } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { sanitize } from '../middleware/validate.js';

interface OnboardingTemplateRow {
  id: string;
  name: string;
  fields: unknown;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface PatientOnboardingRow {
  id: string;
  patient_id: string;
  template_id: string | null;
  responses: unknown;
  waivers_signed: unknown;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const router = Router();

router.get('/templates', authenticate, async (_req, res) => {
  try {
    const result = await executeMany<OnboardingTemplateRow>(sql`SELECT * FROM onboarding_templates WHERE active = true ORDER BY created_at DESC`);
    res.success(result);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/templates', authenticate, authorize('admin', 'nutricionista'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { name, fields, active } = req.body;
    const result = await executeOne<OnboardingTemplateRow>(sql`INSERT INTO onboarding_templates (name, fields, active) VALUES (${sanitize(name)}, ${JSON.stringify(fields)}::jsonb, ${active}) RETURNING *`);
    await logAudit(user.id, 'CREATE', 'OnboardingTemplate', result?.id ?? null, req);
    res.created(result);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/submit', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { templateId, responses, waiversSigned, completed } = req.body;
    const result = await executeOne<PatientOnboardingRow>(sql`INSERT INTO patient_onboarding (patient_id, template_id, responses, waivers_signed, completed_at) VALUES (${user.id}, ${templateId}, ${JSON.stringify(responses)}::jsonb, ${JSON.stringify(waiversSigned || {})}::jsonb, ${completed ? new Date() : null}) ON CONFLICT (patient_id) DO UPDATE SET responses = ${JSON.stringify(responses)}::jsonb, waivers_signed = ${JSON.stringify(waiversSigned || {})}::jsonb, completed_at = ${completed ? new Date() : null}, updated_at = NOW() RETURNING *`);
    await logAudit(user.id, 'CREATE', 'PatientOnboarding', result?.id ?? null, req);
    res.created(result);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/status/:patientId', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await executeOne<PatientOnboardingRow>(sql`SELECT * FROM patient_onboarding WHERE patient_id = ${req.params.patientId ?? null}`);
    res.success(result || null);
  } catch (err) { res.error(500, 'Error interno'); }
});

export default router;