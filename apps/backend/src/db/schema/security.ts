import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { uuidPk, textArray } from './_common.js';
import { users } from './users.js';

export const auditLog = pgTable('audit_log', {
  id: uuidPk(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  usuario: varchar('usuario', { length: 200 }),
  rol: varchar('rol', { length: 30 }),
  accion: varchar('accion', { length: 30 }).notNull(),
  entidad: varchar('entidad', { length: 100 }),
  paciente: varchar('paciente', { length: 200 }),
  ip: varchar('ip', { length: 50 }),
  detalles: jsonb('detalles'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('audit_log_user_idx').on(table.userId),
  createdIdx: index('audit_log_created_idx').on(table.createdAt),
  accionIdx: index('audit_log_accion_idx').on(table.accion),
}));

export const tokenBlacklist = pgTable('token_blacklist', {
  id: uuidPk(),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  expiresIdx: index('token_blacklist_expires_idx').on(table.expiresAt),
  tokenIdx: uniqueIndex('token_blacklist_token_idx').on(table.token),
}));

export const apiKeys = pgTable('api_keys', {
  id: uuidPk(),
  name: varchar('name', { length: 100 }).notNull(),
  keyHash: varchar('key_hash', { length: 64 }).unique().notNull(),
  keyPrefix: varchar('key_prefix', { length: 12 }).notNull(),
  scopes: textArray('scopes'),
  active: boolean('active').default(true),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  keyHashIdx: uniqueIndex('api_keys_key_hash_idx').on(table.keyHash),
  activeIdx: index('api_keys_active_idx').on(table.active),
}));

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
export type TokenBlacklist = typeof tokenBlacklist.$inferSelect;
export type NewTokenBlacklist = typeof tokenBlacklist.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;