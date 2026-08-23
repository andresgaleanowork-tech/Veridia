import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar, text, timestamp, date, time, integer, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { timestamps, uuidPk, textArray, senderEnum, tipoDiarioEnum } from './_common.js';
import { patients } from './patients.js';

export const messages = pgTable('messages', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  sender: senderEnum('sender').notNull(),
  text: text('text').notNull(),
  read: boolean('read').default(false),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('messages_paciente_idx').on(table.pacienteId),
  pacienteFechaIdx: index('messages_paciente_fecha_idx').on(table.pacienteId, table.createdAt),
}));

export const patientDiary = pgTable('patient_diary', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  fecha: date('fecha').default(sql`CURRENT_DATE`).notNull(),
  toma: varchar('toma', { length: 30 }),
  texto: text('texto'),
  hora: time('hora'),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('patient_diary_paciente_idx').on(table.pacienteId),
  pacienteFechaIdx: index('patient_diary_paciente_fecha_idx').on(table.pacienteId, table.fecha),
}));

export const patientSymptoms = pgTable('patient_symptoms', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  fecha: date('fecha').default(sql`CURRENT_DATE`).notNull(),
  tipo: tipoDiarioEnum('tipo'),
  valor: text('valor'),
  hora: time('hora'),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('patient_symptoms_paciente_idx').on(table.pacienteId),
  pacienteFechaIdx: index('patient_symptoms_paciente_fecha_idx').on(table.pacienteId, table.fecha),
}));

export const patientFoodJournals = pgTable('patient_food_journals', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  meals: jsonb('meals'),
  symptoms: textArray('symptoms'),
  exercise: jsonb('exercise'),
  waterIntake: integer('water_intake').default(0),
  mood: varchar('mood', { length: 50 }),
  notes: text('notes'),
  photoUrls: textArray('photo_urls'),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('patient_food_journals_paciente_idx').on(table.pacienteId),
  dateIdx: index('patient_food_journals_date_idx').on(table.date),
  pacienteDateIdx: uniqueIndex('patient_food_journals_paciente_date_idx').on(table.pacienteId, table.date),
}));

export const patientSessions = pgTable('patient_sessions', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('patient_sessions_paciente_idx').on(table.pacienteId),
  tokenIdx: uniqueIndex('patient_sessions_token_idx').on(table.token),
}));

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type PatientDiaryEntry = typeof patientDiary.$inferSelect;
export type NewPatientDiaryEntry = typeof patientDiary.$inferInsert;
export type PatientSymptom = typeof patientSymptoms.$inferSelect;
export type NewPatientSymptom = typeof patientSymptoms.$inferInsert;
export type PatientFoodJournal = typeof patientFoodJournals.$inferSelect;
export type NewPatientFoodJournal = typeof patientFoodJournals.$inferInsert;
export type PatientSession = typeof patientSessions.$inferSelect;
export type NewPatientSession = typeof patientSessions.$inferInsert;