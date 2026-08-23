import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar, text, date, integer, decimal, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { estadoFacturaEnum, metodoPagoEnum, tipoGastoEnum, frecuenciaGastoEnum, estadoSuscripcionEnum, timestamps, uuidPk } from './_common.js';
import { patients } from './patients.js';
import { users } from './users.js';

export const invoices = pgTable('invoices', {
  id: uuidPk(),
  numero: varchar('numero', { length: 30 }).unique().notNull(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  fecha: date('fecha').default(sql`CURRENT_DATE`).notNull(),
  estado: estadoFacturaEnum('estado').default('Pendiente').notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).default('0').notNull(),
  lineas: jsonb('lineas').default(sql`'[]'::jsonb`).notNull(),
  pagos: jsonb('pagos').default(sql`'[]'::jsonb`).notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => ({
  numeroIdx: uniqueIndex('invoices_numero_idx').on(table.numero),
  pacienteIdx: index('invoices_paciente_idx').on(table.pacienteId),
  estadoIdx: index('invoices_estado_idx').on(table.estado),
  fechaIdx: index('invoices_fecha_idx').on(table.fecha),
  pacienteEstadoIdx: index('invoices_paciente_estado_idx').on(table.pacienteId, table.estado),
}));

export const cashSessions = pgTable('cash_sessions', {
  id: uuidPk(),
  fecha: date('fecha').default(sql`CURRENT_DATE`).notNull(),
  estado: varchar('estado', { length: 20 }).default('Abierta').notNull(),
  saldoInicial: decimal('saldo_inicial', { precision: 10, scale: 2 }).default('0'),
  movimientos: jsonb('movimientos').default(sql`'[]'::jsonb`).notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => ({
  fechaIdx: index('cash_sessions_fecha_idx').on(table.fecha),
  estadoIdx: index('cash_sessions_estado_idx').on(table.estado),
}));

export const servicePackages = pgTable('service_packages', {
  id: uuidPk(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  sessions: integer('sessions').default(1).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  durationDays: integer('duration_days').default(30).notNull(),
  includesMealPlan: boolean('includes_meal_plan').default(false),
  includesFoodJournal: boolean('includes_food_journal').default(false),
  includesTelehealth: boolean('includes_telehealth').default(false),
  active: boolean('active').default(true).notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => ({
  activeIdx: index('service_packages_active_idx').on(table.active),
}));

export const patientSubscriptions = pgTable('patient_subscriptions', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  packageId: uuid('package_id').references(() => servicePackages.id, { onDelete: 'cascade' }),
  status: estadoSuscripcionEnum('status').default('active').notNull(),
  startDate: date('start_date').default(sql`CURRENT_DATE`).notNull(),
  endDate: date('end_date'),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 100 }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 100 }),
  sessionsTotal: integer('sessions_total').default(1).notNull(),
  sessionsUsed: integer('sessions_used').default(0).notNull(),
  autoRenew: boolean('auto_renew').default(false),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('patient_subscriptions_paciente_idx').on(table.pacienteId),
  pacienteStatusIdx: index('patient_subscriptions_paciente_status_idx').on(table.pacienteId, table.status),
  stripeSubIdx: uniqueIndex('patient_subscriptions_stripe_sub_idx').on(table.stripeSubscriptionId),
}));

export const sessionCredits = pgTable('session_credits', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  subscriptionId: uuid('subscription_id').references(() => patientSubscriptions.id, { onDelete: 'cascade' }),
  tipo: varchar('tipo', { length: 50 }).default('consulta'),
  remaining: integer('remaining').default(1).notNull(),
  expiresAt: date('expires_at'),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('session_credits_paciente_idx').on(table.pacienteId),
  subscriptionIdx: index('session_credits_subscription_idx').on(table.subscriptionId),
}));

export const gastos = pgTable('gastos', {
  id: uuidPk(),
  categoria: tipoGastoEnum('categoria').notNull(),
  descripcion: text('descripcion'),
  importe: decimal('importe', { precision: 10, scale: 2 }).notNull(),
  fecha: date('fecha').default(sql`CURRENT_DATE`).notNull(),
  metodoPago: metodoPagoEnum('metodo_pago'),
  recurrente: boolean('recurrente').default(false),
  frecuencia: frecuenciaGastoEnum('frecuencia'),
  proveedor: varchar('proveedor', { length: 200 }),
  notas: text('notas'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => ({
  fechaIdx: index('gastos_fecha_idx').on(table.fecha),
  categoriaIdx: index('gastos_categoria_idx').on(table.categoria),
}));

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type CashSession = typeof cashSessions.$inferSelect;
export type NewCashSession = typeof cashSessions.$inferInsert;
export type ServicePackage = typeof servicePackages.$inferSelect;
export type NewServicePackage = typeof servicePackages.$inferInsert;
export type PatientSubscription = typeof patientSubscriptions.$inferSelect;
export type NewPatientSubscription = typeof patientSubscriptions.$inferInsert;
export type SessionCredit = typeof sessionCredits.$inferSelect;
export type NewSessionCredit = typeof sessionCredits.$inferInsert;
export type Gasto = typeof gastos.$inferSelect;
export type NewGasto = typeof gastos.$inferInsert;