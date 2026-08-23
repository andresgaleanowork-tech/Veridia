import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar, text, boolean, date, integer, decimal, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sexoEnum, timestamps, uuidPk, textArray, jsonbDefault } from './_common.js';
import { users } from './users.js';

export const patients = pgTable('patients', {
  id: uuidPk(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  apellidos: varchar('apellidos', { length: 100 }).notNull(),
  dni: varchar('dni', { length: 20 }).unique(),
  fechaNacimiento: date('fecha_nacimiento'),
  sexo: sexoEnum('sexo'),
  email: varchar('email', { length: 200 }),
  telefono: varchar('telefono', { length: 30 }),
  direccion: text('direccion'),
  profesion: varchar('profesion', { length: 100 }),
  nacionalidad: varchar('nacionalidad', { length: 50 }),
  estadoCivil: varchar('estado_civil', { length: 30 }),
  educacion: varchar('educacion', { length: 50 }),
  procedencia: varchar('procedencia', { length: 100 }),
  motivoConsulta: text('motivo_consulta'),
  grupoSanguineo: varchar('grupo_sanguineo', { length: 10 }),
  tags: textArray('tags'),
  consents: jsonbDefault('consents'),
  activo: boolean('activo').default(true).notNull(),
  clinicaId: integer('clinica_id').default(1),
  passwordHash: text('password_hash'),
  portalEnabled: boolean('portal_enabled').default(false),
  portalToken: uuid('portal_token').unique(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  ...timestamps,
}, (table) => ({
  dniIdx: uniqueIndex('patients_dni_idx').on(table.dni),
  activoIdx: index('patients_activo_idx').on(table.activo),
  clinicaIdx: index('patients_clinica_idx').on(table.clinicaId),
  nombreIdx: index('patients_nombre_idx').on(table.apellidos, table.nombre),
  portalTokenIdx: uniqueIndex('patients_portal_token_idx').on(table.portalToken),
}));

export const patientWeightGoals = pgTable('patient_weight_goals', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  pesoInicio: decimal('peso_inicio', { precision: 5, scale: 1 }),
  pesoObjetivo: decimal('peso_objetivo', { precision: 5, scale: 1 }),
  fechaInicio: date('fecha_inicio').default(sql`CURRENT_DATE`),
  fechaObjetivo: date('fecha_objetivo'),
  notas: text('notas'),
  activo: boolean('activo').default(true).notNull(),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('patient_weight_goals_paciente_idx').on(table.pacienteId),
  activoIdx: index('patient_weight_goals_activo_idx').on(table.activo),
}));

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
export type PatientWeightGoal = typeof patientWeightGoals.$inferSelect;
export type NewPatientWeightGoal = typeof patientWeightGoals.$inferInsert;