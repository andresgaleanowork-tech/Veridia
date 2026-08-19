const express = require('express');
const { z } = require('zod');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { validateZod } = require('../middleware/zodValidate');
const { WebhookCreateSchema } = require('../schemas');
const { logAudit } = require('../utils/audit');
const axios = require('axios');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM webhooks WHERE active = true');
    res.success(result.rows);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/', authenticate, validateZod(WebhookCreateSchema), async (req, res) => {
  try {
    const { url, events, secret } = req.body;
    const result = await query(
      `INSERT INTO webhooks (url, events, secret, active) VALUES ($1, $2, $3, true) RETURNING *`,
      [url, events, secret]
    );
    await logAudit(req.user.id, 'CREATE', 'Webhook', result.rows[0].id, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/deliver', async (req, res) => {
  try {
    const { webhookId, event, payload } = req.body;
    const result = await query('SELECT * FROM webhooks WHERE id = $1 AND active = true', [webhookId]);
    if (!result.rows.length) return res.error(404, 'Webhook no encontrado');

    const webhook = result.rows[0];
    if (!webhook.events.includes(event)) return res.success({ message: 'Evento no suscrito' });

    await axios.post(webhook.url, { event, payload, timestamp: new Date().toISOString() }, {
      headers: { 'X-Veridia-Signature': secret ? `sha256=${require('crypto').createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex')}` : '' }
    }).catch(err => console.error('Webhook delivery failed:', err.message));

    res.success({ message: 'Webhook enviado' });
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

module.exports = router;
