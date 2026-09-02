// Stripe webhook handler
import { Request, Response } from 'express';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('STRIPE');

// Tipos estructurales mínimos del payload Stripe (los tipos del SDK v22
// no exponen `subscription` en Invoice de forma usable).
interface StripeInvoiceLike {
  id: string;
  subscription?: string | { id: string } | null;
}

interface StripeSubscriptionLike {
  id: string;
}
import { db } from '../config/db.js';
import { patientSubscriptions } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

export async function handleStripeWebhook(req: Request, res: Response) {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
  }

  let event;

  try {
    event = req.body;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Webhook signature verification failed: ${msg}`);
    return res.status(400).send(`Webhook Error: ${msg}`);
  }

  switch (event.type) {
    case 'invoice.payment_succeeded':
      await handlePaymentSuccess(event.data.object as StripeInvoiceLike);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailure(event.data.object as StripeInvoiceLike);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as StripeSubscriptionLike);
      break;
    default:
      logger.debug(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}

async function handlePaymentSuccess(invoice: StripeInvoiceLike) {
  const sub = invoice.subscription;
  const subscriptionId = typeof sub === 'string' ? sub : sub?.id ?? null;
  if (!subscriptionId) return;
  await db.update(patientSubscriptions)
    .set({ status: 'active' })
    .where(eq(patientSubscriptions.id, subscriptionId));
  logger.info(`Payment succeeded for subscription ${subscriptionId}`);
}

async function handlePaymentFailure(invoice: StripeInvoiceLike) {
  const sub = invoice.subscription;
  const subscriptionId = typeof sub === 'string' ? sub : sub?.id ?? null;
  if (!subscriptionId) return;
  await db.update(patientSubscriptions)
    .set({ status: 'past_due' })
    .where(eq(patientSubscriptions.id, subscriptionId));
  logger.warn(`Payment failed for subscription ${subscriptionId}`);
}

async function handleSubscriptionDeleted(subscription: StripeSubscriptionLike) {
  await db.update(patientSubscriptions)
    .set({ status: 'cancelled' })
    .where(eq(patientSubscriptions.id, subscription.id));
  logger.info(`Subscription ${subscription.id} deleted`);
}
