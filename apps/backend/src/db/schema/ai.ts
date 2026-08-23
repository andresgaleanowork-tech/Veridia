import { pgTable, uuid, varchar, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timestamps, uuidPk, textArray } from './_common.js';
import { patients } from './patients.js';
import { users } from './users.js';

export const aiScribeNotes = pgTable('ai_scribe_notes', {
  id: uuidPk(),
  pacienteId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }),
  professionalId: uuid('professional_id').references(() => users.id, { onDelete: 'cascade' }),
  audioUrl: text('audio_url'),
  transcription: text('transcription'),
  soapNote: jsonb('soap_note'),
  status: varchar('status', { length: 50 }).default('draft'),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('ai_scribe_notes_paciente_idx').on(table.pacienteId),
  professionalIdx: index('ai_scribe_notes_professional_idx').on(table.professionalId),
}));

export const careProcesses = pgTable('care_processes', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  motivoConsulta: varchar('motivo_consulta', { length: 200 }).notNull(),
  screeningTool: varchar('screening_tool', { length: 20 }).notNull(),
  screeningScore: varchar('screening_score', { length: 20 }).notNull(),
  screeningRisk: varchar('screening_risk', { length: 20 }).notNull(),
  currentStep: varchar('current_step', { length: 50 }).default('screening'),
  data: jsonb('data').default(sql`'{}'::jsonb`).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('care_processes_paciente_idx').on(table.pacienteId),
}));

export const clinicalTemplates = pgTable('clinical_templates', {
  id: uuidPk(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  tipo: varchar('tipo', { length: 20 }).notNull(),
  contenido: jsonb('contenido').notNull(),
  tags: textArray('tags'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => ({
  nombreIdx: index('clinical_templates_nombre_idx').on(table.nombre),
  tipoIdx: index('clinical_templates_tipo_idx').on(table.tipo),
}));

export type AiScribeNote = typeof aiScribeNotes.$inferSelect;
export type NewAiScribeNote = typeof aiScribeNotes.$inferInsert;
export type CareProcess = typeof careProcesses.$inferSelect;
export type NewCareProcess = typeof careProcesses.$inferInsert;
export type ClinicalTemplate = typeof clinicalTemplates.$inferSelect;
export type NewClinicalTemplate = typeof clinicalTemplates.$inferInsert;