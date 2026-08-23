import { pgTable, uuid, varchar, text, date, time, integer, decimal, index } from 'drizzle-orm/pg-core';
import { estadoCitaEnum, timestamps, uuidPk, jsonbDefault } from './_common.js';
import { patients } from './patients.js';
import { users } from './users.js';

export const appointments = pgTable('appointments', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  profesional: varchar('profesional', { length: 200 }),
  fecha: date('fecha').notNull(),
  hora: time('hora').notNull(),
  tipo: varchar('tipo', { length: 30 }),
  asunto: text('asunto'),
  estado: estadoCitaEnum('estado').default('Pendiente').notNull(),
  pago: varchar('pago', { length: 20 }).default('Pendiente'),
  precio: decimal('precio', { precision: 8, scale: 2 }).default('0'),
  duracion: integer('duracion').default(45),
  nota: text('nota'),
  enfermedad: text('enfermedad'),
  sintomas: text('sintomas'),
  medicamentos: text('medicamentos'),
  color: varchar('color', { length: 20 }).default('review'),
  acta: jsonbDefault('acta'),
  lugar: text('lugar'),
  telehealthLink: text('telehealth_link'),
  telehealthStatus: varchar('telehealth_status', { length: 30 }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => ({
  fechaIdx: index('appointments_fecha_idx').on(table.fecha),
  pacienteIdx: index('appointments_paciente_idx').on(table.pacienteId),
  estadoIdx: index('appointments_estado_idx').on(table.estado),
  fechaEstadoIdx: index('appointments_fecha_estado_idx').on(table.fecha, table.estado),
  profesionalFechaIdx: index('appointments_profesional_fecha_idx').on(table.profesional, table.fecha),
}));

export const horariosBlock = pgTable('horarios_block', {
  id: uuidPk(),
  fecha: date('fecha').notNull(),
  horaInicio: time('hora_inicio').notNull(),
  horaFin: time('hora_fin').notNull(),
  motivo: text('motivo'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => ({
  fechaIdx: index('horarios_block_fecha_idx').on(table.fecha),
}));

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type HorarioBlock = typeof horariosBlock.$inferSelect;
export type NewHorarioBlock = typeof horariosBlock.$inferInsert;