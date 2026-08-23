import { pgTable, uuid, varchar, text, timestamp, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { timestamps, uuidPk, jsonbDefault, canalNotificacionEnum, estadoNotificacionEnum, platformEnum } from './_common.js';
import { patients } from './patients.js';
import { users } from './users.js';

export const notificationLog = pgTable('notification_log', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  professionalId: uuid('professional_id').references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  channel: canalNotificacionEnum('channel').notNull(),
  status: estadoNotificacionEnum('status').default('sent').notNull(),
  details: jsonbDefault('details'),
  error: text('error'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pacienteIdx: index('notification_log_paciente_idx').on(table.pacienteId),
  typeIdx: index('notification_log_type_idx').on(table.type, table.sentAt),
}));

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  fcmToken: text('fcm_token').notNull(),
  platform: platformEnum('platform').default('web'),
  active: boolean('active').default(true),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('push_subscriptions_paciente_idx').on(table.pacienteId),
  pacienteFcmIdx: uniqueIndex('push_subscriptions_paciente_fcm_idx').on(table.pacienteId, table.fcmToken),
}));

export const professionalNotifications = pgTable('professional_notifications', {
  id: uuidPk(),
  professionalId: uuid('professional_id').references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  body: text('body'),
  data: jsonbDefault('data'),
  read: boolean('read').default(false),
  ...timestamps,
}, (table) => ({
  professionalIdx: index('professional_notifications_professional_idx').on(table.professionalId),
  professionalReadIdx: index('professional_notifications_professional_read_idx').on(table.professionalId, table.read, table.createdAt),
}));

export const userSettings = pgTable('user_settings', {
  id: uuidPk(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  notifications: jsonbDefault('notifications', "'{\"clinical_alerts\":true,\"appointment_reminders\":true,\"patient_messages\":true,\"system_updates\":true}'::jsonb"),
  branding: jsonbDefault('branding', "'{\"logo\":\"\",\"primaryColor\":\"#0891B2\",\"clinicName\":\"\",\"clinicAddress\":\"\",\"clinicPhone\":\"\",\"professionalName\":\"\",\"professionalTitle\":\"\",\"license\":\"\",\"cuit\":\"\"}'::jsonb"),
  ...timestamps,
}, (table) => ({
  userIdx: uniqueIndex('user_settings_user_idx').on(table.userId),
}));

export const calendarExports = pgTable('calendar_exports', {
  id: uuidPk(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  exportToken: varchar('export_token', { length: 64 }).unique().notNull(),
  lastExportedAt: timestamp('last_exported_at', { withTimezone: true }),
  ...timestamps,
}, (table) => ({
  userIdx: uniqueIndex('calendar_exports_user_idx').on(table.userId),
  tokenIdx: uniqueIndex('calendar_exports_token_idx').on(table.exportToken),
}));

export type NotificationLog = typeof notificationLog.$inferSelect;
export type NewNotificationLog = typeof notificationLog.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type ProfessionalNotification = typeof professionalNotifications.$inferSelect;
export type NewProfessionalNotification = typeof professionalNotifications.$inferInsert;
export type UserSetting = typeof userSettings.$inferSelect;
export type NewUserSetting = typeof userSettings.$inferInsert;
export type CalendarExport = typeof calendarExports.$inferSelect;
export type NewCalendarExport = typeof calendarExports.$inferInsert;