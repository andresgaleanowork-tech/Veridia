const express = require('express');
const { z } = require('zod');
const { query } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateZod } = require('../middleware/zodValidate');
const { OnboardingTemplateSchema, OnboardingSubmitSchema } = require('../schemas');
const { logAudit } = require('../utils/audit');
const { sanitize } = require('../middleware/validate');

const router = express.Router();

router.get('/templates', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM onboarding_templates WHERE active = true ORDER BY created_at DESC');
    res.success(result.rows);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/templates', authenticate, authorize('admin', 'nutricionista'), validateZod(OnboardingTemplateSchema), async (req, res) => {
  try {
    const { name, fields, active } = req.body;
    const result = await query(
      `INSERT INTO onboarding_templates (name, fields, active) VALUES ($1, $2, $3) RETURNING *`,
      [sanitize(name), fields, active]
    );
    await logAudit(req.user.id, 'CREATE', 'OnboardingTemplate', result.rows[0].id, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/submit', authenticate, validateZod(OnboardingSubmitSchema), async (req, res) => {
  try {
    const { templateId, responses, waiversSigned, completed } = req.body;
    const result = await query(
      `INSERT INTO patient_onboarding (patient_id, template_id, responses, waivers_signed, completed_at)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (patient_id) DO UPDATE SET responses = $3, waivers_signed = $4, completed_at = $5, updated_at = NOW() RETURNING *`,
      [req.user.id, templateId, responses, waiversSigned || {}, completed ? new Date() : null]
    );
    await logAudit(req.user.id, 'CREATE', 'PatientOnboarding', result.rows[0].id, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.get('/status/:patientId', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM patient_onboarding WHERE patient_id = $1', [req.params.patientId]);
    res.success(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

module.exports = router;
