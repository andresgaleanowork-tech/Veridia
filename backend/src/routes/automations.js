const express = require('express');
const { z } = require('zod');
const { query } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateZod } = require('../middleware/zodValidate');
const { logAudit } = require('../utils/audit');
const { sanitize } = require('../middleware/validate');

const router = express.Router();

const AutomationCreateSchema = z.object({
  name: z.string().min(1),
  trigger: z.string(),
  conditions: z.array(z.object({ field: z.string(), operator: z.string(), value: z.any() })).optional().default([]),
  actions: z.array(z.object({ type: z.string(), params: z.any() })).optional().default([]),
  active: z.boolean().default(true),
});

const AutomationUpdateSchema = AutomationCreateSchema.partial();

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM automations ORDER BY created_at DESC');
    res.success(result.rows);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/', authenticate, authorize('admin', 'nutricionista'), validateZod(AutomationCreateSchema), async (req, res) => {
  try {
    const { name, trigger, conditions, actions, active } = req.body;
    const result = await query(
      `INSERT INTO automations (name, trigger, conditions, actions, active, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [sanitize(name), trigger, conditions, actions, active, req.user.id]
    );
    await logAudit(req.user.id, 'CREATE', 'Automation', result.rows[0].id, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM automations WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.error(404, 'Automatización no encontrada');
    res.success(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.put('/:id', authenticate, authorize('admin', 'nutricionista'), validateZod(AutomationUpdateSchema), async (req, res) => {
  try {
    const { name, trigger, conditions, actions, active } = req.body;
    const result = await query(
      `UPDATE automations SET name = $1, trigger = $2, conditions = $3, actions = $4, active = $5, updated_at = NOW() WHERE id = $6 RETURNING *`,
      [sanitize(name), trigger, conditions, actions, active, req.params.id]
    );
    if (!result.rows.length) return res.error(404, 'Automatización no encontrada');
    await logAudit(req.user.id, 'UPDATE', 'Automation', req.params.id, req);
    res.success(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await query('DELETE FROM automations WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.error(404, 'Automatización no encontrada');
    await logAudit(req.user.id, 'DELETE', 'Automation', req.params.id, req);
    res.success({ id: req.params.id });
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/:id/toggle', authenticate, authorize('admin', 'nutricionista'), async (req, res) => {
  try {
    const result = await query('UPDATE automations SET active = NOT active, updated_at = NOW() WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows.length) return res.error(404, 'Automatización no encontrada');
    await logAudit(req.user.id, 'UPDATE', 'Automation', req.params.id, req);
    res.success(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.get('/logs/list', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM automation_logs ORDER BY executed_at DESC LIMIT 100');
    res.success(result.rows);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/execute/:id', authenticate, authorize('admin', 'nutricionista'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM automations WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.error(404, 'Automatización no encontrada');
    const automation = result.rows[0];
    await query('INSERT INTO automation_logs (automation_id, trigger_data, result) VALUES ($1, $2, $3)', [automation.id, { manual: true }, { status: 'executed' }]);
    await logAudit(req.user.id, 'EXECUTE', 'Automation', req.params.id, req);
    res.success({ message: 'Automatización ejecutada', automation });
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

module.exports = router;
