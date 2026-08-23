// Stripe webhook handler
import { Request, Response } from 'express';
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
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'invoice.payment_succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}

async function handlePaymentSuccess(invoice: any) {
  const subscriptionId = invoice.subscription;
  await db.update(patientSubscriptions)
    .set({ status: 'active' })
    .where(eq(patientSubscriptions.id, subscriptionId));
  console.log(`Payment succeeded for subscription ${subscriptionId}`);
}

async function handlePaymentFailure(invoice: any) {
  const subscriptionId = invoice.subscription;
  await db.update(patientSubscriptions)
    .set({ status: 'past_due' })
    .where(eq(patientSubscriptions.id, subscriptionId));
  console.log(`Payment failed for subscription ${subscriptionId}`);
}

async function handleSubscriptionDeleted(subscription: any) {
  await db.update(patientSubscriptions)
    .set({ status: 'cancelled' })
    .where(eq(patientSubscriptions.id, subscription.id));
  console.log(`Subscription ${subscription.id} deleted`);
}
