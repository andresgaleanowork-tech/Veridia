import { sql } from 'drizzle-orm';
import { pgTable, uuid, varchar, text, date, boolean, index } from 'drizzle-orm/pg-core';
import { timestamps, uuidPk, textArray } from './_common.js';
import { patients } from './patients.js';
import { users } from './users.js';

export const tipoSupplementoEnum = sql`enum tipo_suplemento ('suplemento', 'medicamento', 'vitamina', 'mineral')`;
export const viaAdministracionEnum = sql`enum via_administracion ('oral', 'inyectable', 'topica')`;

export const supplements = pgTable('supplements', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  tipo: varchar('tipo', { length: 50 }).notNull(),
  dosis: varchar('dosis', { length: 100 }),
  frecuencia: varchar('frecuencia', { length: 100 }),
  horarios: textArray('horarios'),
  via: varchar('via', { length: 50 }),
  fechaInicio: date('fecha_inicio'),
  fechaFin: date('fecha_fin'),
  motivo: text('motivo'),
  observaciones: text('observaciones'),
  activo: boolean('activo').default(true).notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('supplements_paciente_idx').on(table.pacienteId),
  tipoIdx: index('supplements_tipo_idx').on(table.tipo),
}));

export const supplementAdherence = pgTable('supplement_adherence', {
  id: uuidPk(),
  supplementId: uuid('supplement_id').references(() => supplements.id, { onDelete: 'cascade' }).notNull(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  fecha: date('fecha').notNull(),
  tomado: boolean('tomado').default(false).notNull(),
  horaTomado: varchar('hora_tomado', { length: 10 }),
  notas: text('notas'),
  ...timestamps,
}, (table) => ({
  supplementIdx: index('supplement_adherence_supplement_idx').on(table.supplementId),
  pacienteIdx: index('supplement_adherence_paciente_idx').on(table.pacienteId),
  uniqueDay: index('supplement_adherence_unique_day').on(table.supplementId, table.pacienteId, table.fecha),
}));

export type Supplement = typeof supplements.$inferSelect;
export type NewSupplement = typeof supplements.$inferInsert;
export type SupplementAdherence = typeof supplementAdherence.$inferSelect;
export type NewSupplementAdherence = typeof supplementAdherence.$inferInsert;
