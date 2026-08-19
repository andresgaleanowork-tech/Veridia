const express = require('express');
const { z } = require('zod');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { validateZod } = require('../middleware/zodValidate');
const { logAudit } = require('../utils/audit');
const { TelehealthStartSchema } = require('../schemas');

const router = express.Router();

router.post('/start', authenticate, validateZod(TelehealthStartSchema), async (req, res) => {
  try {
    const { appointmentId, provider } = req.body;
    const meetingId = `veridia-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const telehealthLink = provider === 'zoom'
      ? `https://zoom.us/j/${meetingId}`
      : `https://veridia.app/telehealth/${meetingId}`;

    await query(
      `UPDATE appointments SET telehealth_link = $1, telehealth_status = 'ready' WHERE id = $2`,
      [telehealthLink, appointmentId]
    );
    await logAudit(req.user.id, 'CREATE', 'Telehealth', appointmentId, req);
    res.created({ appointmentId, telehealthLink, provider, meetingId });
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.get('/:appointmentId', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT telehealth_link, telehealth_status FROM appointments WHERE id = $1', [req.params.appointmentId]);
    if (!result.rows.length) return res.error(404, 'Turno no encontrado');
    res.success(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/:appointmentId/end', authenticate, async (req, res) => {
  try {
    await query(`UPDATE appointments SET telehealth_status = 'ended' WHERE id = $1`, [req.params.appointmentId]);
    await logAudit(req.user.id, 'UPDATE', 'Telehealth', req.params.appointmentId, req);
    res.success({ message: 'Telehealth finalizado' });
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

module.exports = router;
