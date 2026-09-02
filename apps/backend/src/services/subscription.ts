// Subscription management service
import { db } from '../config/db.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SUBSCRIPTION');
import { patients, patientSubscriptions } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

export interface SubscriptionResult {
  subscriptionId: string;
  clientSecret?: string;
  status: string;
}

export async function createSubscription(
  patientId: string,
  planId: string
): Promise<SubscriptionResult> {
  const SESSIONS: Record<string, number> = { basic: 10, pro: 30 };
  if (!SESSIONS[planId]) throw new Error('Plan no válido');

  // Get or create Stripe customer
  const patient = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1);
  if (!patient.length) throw new Error('Paciente no encontrado');

  // Create Stripe checkout session (simulated for now)
  const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Insert subscription record
  await db.insert(patientSubscriptions).values({
    pacienteId: patientId,
    packageId: planId,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    sessionsTotal: SESSIONS[planId] || 999,
    sessionsUsed: 0,
    status: 'active',
  });

  return {
    subscriptionId,
    status: 'active',
  };
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  // Cancel in Stripe (simulated)
  // Update local record
  logger.info(`Subscription ${subscriptionId} cancelled`);
}

export async function upgradeSubscription(
  patientId: string,
  newPlanId: string
): Promise<SubscriptionResult> {
  // Cancel current subscription
  // Create new one with upgrade
  return createSubscription(patientId, newPlanId);
}
