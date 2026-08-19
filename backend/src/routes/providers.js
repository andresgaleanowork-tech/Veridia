const express = require('express');
const { z } = require('zod');
const { query } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateZod, validateZodParams } = require('../middleware/zodValidate');
const { ProviderCreateSchema, ProviderUpdateSchema } = require('../schemas');
const { logAudit } = require('../utils/audit');
const { sanitize } = require('../middleware/validate');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, u.nombre, u.apellidos, u.email FROM providers p LEFT JOIN users u ON p.user_id = u.id WHERE p.active = true ORDER BY u.nombre`
    );
    res.success(result.rows);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/', authenticate, authorize('admin'), validateZod(ProviderCreateSchema), async (req, res) => {
  try {
    const { userId, colorCalendar, calendarType } = req.body;
    const result = await query(
      `INSERT INTO providers (user_id, color_calendar, calendar_type) VALUES ($1, $2, $3) RETURNING *`,
      [userId, colorCalendar, calendarType]
    );
    await logAudit(req.user.id, 'CREATE', 'Provider', result.rows[0].id, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.put('/:id', authenticate, authorize('admin'), validateZod(ProviderUpdateSchema), async (req, res) => {
  try {
    const { colorCalendar, calendarType, active } = req.body;
    const result = await query(
      `UPDATE providers SET color_calendar = $1, calendar_type = $2, active = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
      [colorCalendar, calendarType, active, req.params.id]
    );
    if (!result.rows.length) return res.error(404, 'Provider no encontrado');
    await logAudit(req.user.id, 'UPDATE', 'Provider', req.params.id, req);
    res.success(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

module.exports = router;
