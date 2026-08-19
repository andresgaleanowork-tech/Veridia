// Messages / Chat routes with Zod validation
const express = require('express');
const { z } = require('zod');

const { query } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateZod, validateZodParams } = require('../middleware/zodValidate');
const {
  MessageCreateSchema,
  UUIDSchema,
} = require('../schemas');
const { sanitize } = require('../middleware/validate');

const router = express.Router();

// GET /api/messages/unread/count
router.get('/unread/count', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) FROM messages WHERE read = false AND sender = $1', ['patient']);
    res.success({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// GET /api/messages/:pacienteId
router.get('/:pacienteId', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM messages WHERE paciente_id = $1 ORDER BY created_at ASC',
      [req.params.pacienteId]
    );
    res.success(result.rows);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// POST /api/messages/:pacienteId
router.post('/:pacienteId', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), validateZod(MessageCreateSchema), async (req, res) => {
  try {
    const result = await query(
      `INSERT INTO messages (paciente_id, sender, text) VALUES ($1, $2, $3) RETURNING *`,
      [req.params.pacienteId, req.body.sender, sanitize(req.body.text)]
    );
    res.created(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// PUT /api/messages/:pacienteId/read
router.put('/:pacienteId/read', authenticate, validateZodParams(z.object({ pacienteId: UUIDSchema })), validateZod(z.object({
  sender: z.enum(['patient', 'nutri']).optional(),
})), async (req, res) => {
  try {
    await query(
      'UPDATE messages SET read = true WHERE paciente_id = $1 AND sender = $2 AND read = false',
      [req.params.pacienteId, req.body.sender || 'patient']
    );
    res.success({ ok: true });
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

module.exports = router;
