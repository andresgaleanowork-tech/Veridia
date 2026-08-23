import { db } from '../config/db.js';
import { professionalNotifications, pushSubscriptions } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

export interface NotificationPayload {
  professionalId?: string;
  pacienteId?: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, any>;
}

export async function createNotification(payload: NotificationPayload): Promise<void> {
  if (payload.professionalId) {
    await db.insert(professionalNotifications).values({
      professionalId: payload.professionalId, type: payload.type, title: payload.title,
      body: payload.body || '', data: payload.data || {},
    });
  }
}

export async function sendPushNotification(pacienteId: string, title: string): Promise<void> {
  const subscriptions = await db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.pacienteId, pacienteId));
  // In production, integrate with Firebase Admin SDK
  // For now, just log
  console.log(`Push notification to ${subscriptions.length} devices: ${title}`);
}

export async function notifyProfessional(professionalId: string, type: string, title: string, body?: string, data?: Record<string, any>): Promise<void> {
  await createNotification({ professionalId, type, title, body, data });
}
