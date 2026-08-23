import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar, text, boolean, date, integer, decimal, jsonb, index } from 'drizzle-orm/pg-core';
import { timestamps, uuidPk, jsonbDefault, severidadEnum, estadoAlertaEnum, textArray } from './_common.js';
import { patients } from './patients.js';
import { users } from './users.js';

export const clinicalHistories = pgTable('clinical_histories', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  version: integer('version').default(1).notNull(),
  antecedentes: text('antecedentes'),
  antecedentesFamiliares: text('antecedentes_familiares'),
  alergias: text('alergias'),
  medicacion: text('medicacion'),
  suplementacion: text('suplementacion'),
  historialPonderal: jsonbDefault('historial_ponderal'),
  actividadFisica: jsonbDefault('actividad_fisica'),
  habitosToxicos: text('habitos_toxicos'),
  sueno: text('sueno'),
  estres: text('estres'),
  ingestaHidrica: text('ingesta_hidrica'),
  observaciones: text('observaciones'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('clinical_histories_paciente_idx').on(table.pacienteId),
  pacienteVersionIdx: index('clinical_histories_paciente_version_idx').on(table.pacienteId, table.version),
}));

export const anamnesis = pgTable('anamnesis', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  fecha: date('fecha').default(sql`CURRENT_DATE`),
  template: varchar('template', { length: 30 }),
  profesional: varchar('profesional', { length: 200 }),
  sistemas: textArray('sistemas'),
  respuestas: jsonbDefault('respuestas'),
  redFlags: jsonb('red_flags').default(sql`'[]'::jsonb`).notNull(),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('anamnesis_paciente_idx').on(table.pacienteId),
  pacienteFechaIdx: index('anamnesis_paciente_fecha_idx').on(table.pacienteId, table.fecha),
}));

export const antropometrias = pgTable('antropometrias', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  fecha: date('fecha').default(sql`CURRENT_DATE`).notNull(),
  peso: decimal('peso', { precision: 5, scale: 1 }),
  altura: decimal('altura', { precision: 5, scale: 1 }),
  imc: decimal('imc', { precision: 4, scale: 1 }),
  cintura: decimal('cintura', { precision: 5, scale: 1 }),
  cadera: decimal('cadera', { precision: 5, scale: 1 }),
  pantorrilla: decimal('pantorrilla', { precision: 5, scale: 1 }),
  grasaCorporal: decimal('grasa_corporal', { precision: 4, scale: 1 }),
  masaMuscular: decimal('masa_muscular', { precision: 5, scale: 1 }),
  grasaVisceral: decimal('grasa_visceral', { precision: 4, scale: 1 }),
  metodo: varchar('metodo', { length: 30 }).default('BIA'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('antropometrias_paciente_idx').on(table.pacienteId),
  pacienteFechaIdx: index('antropometrias_paciente_fecha_idx').on(table.pacienteId, table.fecha),
}));

export const analiticas = pgTable('analiticas', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  fecha: date('fecha').default(sql`CURRENT_DATE`).notNull(),
  ayuno: boolean('ayuno').default(true).notNull(),
  marcadores: jsonb('marcadores').default(sql`'[]'::jsonb`).notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('analiticas_paciente_idx').on(table.pacienteId),
  pacienteFechaIdx: index('analiticas_paciente_fecha_idx').on(table.pacienteId, table.fecha),
}));

export const alerts = pgTable('alerts', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  tipo: varchar('tipo', { length: 30 }),
  severidad: severidadEnum('severidad'),
  mensaje: text('mensaje').notNull(),
  recomendacion: text('recomendacion'),
  estado: estadoAlertaEnum('estado').default('pendiente').notNull(),
  fecha: date('fecha').default(sql`CURRENT_DATE`),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('alerts_paciente_idx').on(table.pacienteId),
  estadoIdx: index('alerts_estado_idx').on(table.estado),
  pacienteEstadoIdx: index('alerts_paciente_estado_idx').on(table.pacienteId, table.estado),
}));

export type ClinicalHistory = typeof clinicalHistories.$inferSelect;
export type NewClinicalHistory = typeof clinicalHistories.$inferInsert;
export type Anamnesis = typeof anamnesis.$inferSelect;
export type NewAnamnesis = typeof anamnesis.$inferInsert;
export type Antropometria = typeof antropometrias.$inferSelect;
export type NewAntropometria = typeof antropometrias.$inferInsert;
export type Analitica = typeof analiticas.$inferSelect;
export type NewAnalitica = typeof analiticas.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;