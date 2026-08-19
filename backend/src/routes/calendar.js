const express = require('express');
const { z } = require('zod');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { validateZodQuery } = require('../middleware/zodValidate');
const { logAudit } = require('../utils/audit');

const router = express.Router();

const CalendarQuerySchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  provider_id: z.string().uuid().optional(),
});

router.get('/events', authenticate, validateZodQuery(CalendarQuerySchema), async (req, res) => {
  try {
    const { fecha, provider_id } = req.query;
    let sql = `SELECT a.*, p.color_calendar, p.user_id as provider_user_id FROM appointments a LEFT JOIN providers p ON a.provider_id = p.id WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (fecha) { sql += ` AND a.fecha = $${idx++}`; params.push(fecha); }
    if (provider_id) { sql += ` AND a.provider_id = $${idx++}`; params.push(provider_id); }

    sql += ' ORDER BY a.fecha, a.hora';
    const result = await query(sql, params);
    res.success(result.rows);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/sync', authenticate, async (req, res) => {
  try {
    const { appointmentId, externalEventId, providerId, syncStatus } = req.body;
    const result = await query(
      `INSERT INTO calendar_events (appointment_id, external_event_id, provider_id, sync_status) VALUES ($1, $2, $3, $4) RETURNING *`,
      [appointmentId, externalEventId, providerId, syncStatus || 'synced']
    );
    await logAudit(req.user.id, 'CREATE', 'CalendarEvent', result.rows[0].id, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

module.exports = router;
