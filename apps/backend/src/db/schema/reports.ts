import { pgTable, uuid, varchar, text, jsonb, boolean, index } from 'drizzle-orm/pg-core';
import { timestamps, uuidPk, reportTypeEnum, templateTipoEnum } from './_common.js';
import { patients } from './patients.js';
import { users } from './users.js';

export const reports = pgTable('reports', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  tipo: reportTypeEnum('tipo'),
  plantilla: varchar('plantilla', { length: 50 }),
  titulo: varchar('titulo', { length: 200 }),
  fileContent: text('file_content'),
  name: varchar('name', { length: 200 }),
  type: varchar('type', { length: 50 }),
  params: jsonb('params'),
  result: jsonb('result'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('reports_paciente_idx').on(table.pacienteId),
}));

export const reportTemplates = pgTable('report_templates', {
  id: uuidPk(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  tipo: templateTipoEnum('tipo'),
  contenido: jsonb('contenido'),
  activo: boolean('activo').default(true),
  ...timestamps,
});

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type NewReportTemplate = typeof reportTemplates.$inferInsert;
