const express = require('express');
const { z } = require('zod');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { validateZod } = require('../middleware/zodValidate');
const { PaymentCreateSchema, SubscriptionCreateSchema } = require('../schemas');
const { logAudit } = require('../utils/audit');

const router = express.Router();

router.post('/create-payment-intent', authenticate, validateZod(PaymentCreateSchema), async (req, res) => {
  try {
    const { patientId, amount, currency, method } = req.body;
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result = await query(
      `INSERT INTO payments (patient_id, amount, currency, stripe_payment_intent_id, status, method) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [patientId, amount, currency, paymentIntentId, 'pending', method]
    );
    await logAudit(req.user.id, 'CREATE', 'Payment', result.rows[0].id, req);
    res.created({ clientSecret: `secret_${paymentIntentId}`, payment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = req.body;
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      await query("UPDATE payments SET status = 'succeeded' WHERE stripe_payment_intent_id = $1", [paymentIntent.id]);
    }
    res.json({ received: true });
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/subscriptions', authenticate, validateZod(SubscriptionCreateSchema), async (req, res) => {
  try {
    const { patientId, plan, stripeSubscriptionId } = req.body;
    const result = await query(
      `INSERT INTO subscriptions (patient_id, plan, stripe_subscription_id, status, current_period_end) VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days') RETURNING *`,
      [patientId, plan, stripeSubscriptionId || `sub_${Date.now()}`, 'active']
    );
    await logAudit(req.user.id, 'CREATE', 'Subscription', result.rows[0].id, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.get('/subscriptions/:patientId', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM subscriptions WHERE patient_id = $1 ORDER BY created_at DESC', [req.params.patientId]);
    res.success(result.rows);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.get('/history/:patientId', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM payments WHERE patient_id = $1 ORDER BY created_at DESC', [req.params.patientId]);
    res.success(result.rows);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

module.exports = router;
