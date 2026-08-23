import { pgTable, uuid, varchar, timestamp, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { timestamps, uuidPk } from './_common.js';
import { users } from './users.js';

export const automations = pgTable('automations', {
  id: uuidPk(),
  tenantId: integer('tenant_id'),
  name: varchar('name', { length: 255 }).notNull(),
  trigger: varchar('trigger', { length: 100 }).notNull(),
  conditions: jsonb('conditions'),
  actions: jsonb('actions'),
  active: boolean('active').default(true),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => ({
  triggerIdx: index('automations_trigger_idx').on(table.trigger),
  activeIdx: index('automations_active_idx').on(table.active),
  tenantIdx: index('automations_tenant_idx').on(table.tenantId),
}));

export const automationLogs = pgTable('automation_logs', {
  id: uuidPk(),
  automationId: uuid('automation_id').references(() => automations.id, { onDelete: 'cascade' }),
  triggerData: jsonb('trigger_data'),
  result: jsonb('result'),
  executedAt: timestamp('executed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  automationIdx: index('automation_logs_automation_idx').on(table.automationId),
  executedAtIdx: index('automation_logs_executed_at_idx').on(table.executedAt),
}));

export type Automation = typeof automations.$inferSelect;
export type NewAutomation = typeof automations.$inferInsert;
export type AutomationLog = typeof automationLogs.$inferSelect;
export type NewAutomationLog = typeof automationLogs.$inferInsert;