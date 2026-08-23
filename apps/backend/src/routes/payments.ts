// Payments routes - raw SQL (no Drizzle schema for payments/subscriptions tables)
import { Router } from 'express';
import { sql } from 'drizzle-orm';

import { db, executeOne, executeMany } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { validateZod } from '../middleware/zodValidate.js';
import { PaymentCreateSchema, SubscriptionCreateSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';

interface PaymentRow {
  id: string;
  patient_id: string;
  amount: number;
  currency: string;
  stripe_payment_intent_id: string;
  status: string;
  method: string;
  created_at: string;
  updated_at: string;
}

interface SubscriptionRow {
  id: string;
  patient_id: string;
  plan: string;
  stripe_subscription_id: string;
  status: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

const router = Router();

router.post('/create-payment-intent', authenticate, validateZod(PaymentCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { patientId, amount, currency, method } = req.body;
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result = await executeOne<PaymentRow>(sql`INSERT INTO payments (patient_id, amount, currency, stripe_payment_intent_id, status, method) VALUES (${patientId}, ${amount}, ${currency}, ${paymentIntentId}, 'pending', ${method}) RETURNING *`);
    await logAudit(user.id, 'CREATE', 'Payment', result?.id ?? null, req);
    res.created({ clientSecret: `secret_${paymentIntentId}`, payment: result });
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.post('/webhook', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const event = req.body;
    if (event.type === 'payment_intent.succeeded') {
      await db.execute(sql`UPDATE payments SET status = 'succeeded' WHERE stripe_payment_intent_id = ${event.data.object.id}`);
    }
    res.json({ received: true });
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.post('/subscriptions', authenticate, validateZod(SubscriptionCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { patientId, plan, stripeSubscriptionId } = req.body;
    const result = await executeOne<SubscriptionRow>(sql`INSERT INTO subscriptions (patient_id, plan, stripe_subscription_id, status, current_period_end) VALUES (${patientId}, ${plan}, ${stripeSubscriptionId || `sub_${Date.now()}`}, 'active', NOW() + INTERVAL '30 days') RETURNING *`);
    await logAudit(user.id, 'CREATE', 'Subscription', result?.id ?? null, req);
    res.created(result);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.get('/subscriptions/:patientId', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await executeMany<SubscriptionRow>(sql`SELECT * FROM subscriptions WHERE patient_id = ${req.params.patientId} ORDER BY created_at DESC`);
    res.success(result);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.get('/history/:patientId', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await executeMany<PaymentRow>(sql`SELECT * FROM payments WHERE patient_id = ${req.params.patientId} ORDER BY created_at DESC`);
    res.success(result);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

export default router;