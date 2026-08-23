import { pgTable, varchar, boolean, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { roleEnum, timestamps, uuidPk } from './_common.js';

export const users = pgTable('users', {
  id: uuidPk(),
  name: varchar('name', { length: 200 }).notNull(),
  email: varchar('email', { length: 200 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 200 }).notNull(),
  role: roleEnum('role').notNull(),
  initials: varchar('initials', { length: 4 }),
  avatar: varchar('avatar', { length: 500 }),
  active: boolean('active').default(true).notNull(),
  trialExpires: timestamp('trial_expires', { withTimezone: true }),
  dni: varchar('dni', { length: 20 }),
  telefono: varchar('telefono', { length: 30 }),
  titulacion: varchar('titulacion', { length: 100 }),
  matricula: varchar('matricula', { length: 50 }),
  pais: varchar('pais', { length: 50 }),
  ...timestamps,
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
  activeIdx: index('users_active_idx').on(table.active),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;