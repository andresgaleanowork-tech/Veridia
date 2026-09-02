// Webhooks routes - raw SQL (no Drizzle schema for webhooks table)
import { Router } from 'express';
import crypto from 'crypto';
import axios from 'axios';

import { sql } from 'drizzle-orm';
import { executeOne, executeMany } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { validateZod } from '../middleware/zodValidate.js';
import { WebhookCreateSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';

interface WebhookRow {
  id: string;
  url: string;
  events: string[];
  secret: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const router = Router();

router.get('/', authenticate, async (_req, res) => {
  try {
    const result = await executeMany<WebhookRow>(sql`SELECT * FROM webhooks WHERE active = true`);
    res.success(result);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.post('/', authenticate, validateZod(WebhookCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { url, events, secret } = req.body;
    const result = await executeOne<WebhookRow>(sql`INSERT INTO webhooks (url, events, secret, active) VALUES (${url}, ${JSON.stringify(events)}, ${secret}, true) RETURNING *`);
    await logAudit(user.id, 'CREATE', 'Webhook', result?.id ?? null, req);
    res.created(result);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.post('/deliver', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { webhookId, event, payload } = req.body;
    const rows = await executeMany<WebhookRow>(sql`SELECT * FROM webhooks WHERE id = ${webhookId} AND active = true`);
    if (!rows?.length) return res.error(404, 'Webhook no encontrado');
    const webhook = rows[0];
    if (!webhook.events.includes(event)) return res.success({ message: 'Evento no suscrito' });

    const urlObj = new URL(webhook.url);
    const blockedHosts = ['127.0.0.1', '::1', 'localhost'];
    const privateRanges = [/^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^169\.254\./];
    if (blockedHosts.includes(urlObj.hostname) || privateRanges.some(r => r.test(urlObj.hostname))) return res.error(400, 'URL no permitida');

    await axios.post(webhook.url, { event, payload, timestamp: new Date().toISOString() }, {
      headers: { 'X-Veridia-Signature': webhook.secret ? `sha256=${crypto.createHmac('sha256', webhook.secret).update(JSON.stringify(payload)).digest('hex')}` : '' },
    }).catch((err) => console.error('Webhook delivery failed:', err instanceof Error ? err.message : String(err)));
    res.success({ message: 'Webhook enviado' });
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

export default router;