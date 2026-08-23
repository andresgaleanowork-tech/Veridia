import { z } from 'zod';
import { UUIDSchema, ISODateSchema, PaginationSchema, ApiEnvelopeSchema } from './common';

export const AnamnesisSchema = z.object({
  id: UUIDSchema,
  paciente_id: UUIDSchema,
  fecha: ISODateSchema,
  template: z.string().optional().nullable(),
  profesional: z.string().optional().nullable(),
  sistemas: z.array(z.string()).optional().nullable(),
  respuestas: z.record(z.unknown()).optional().nullable(),
  red_flags: z.array(z.unknown()).optional().nullable(),
  created_at: ISODateSchema,
});

export type Anamnesis = z.infer<typeof AnamnesisSchema>;

export const AnamnesisCreateSchema = z.object({
  paciente_id: UUIDSchema,
  fecha: ISODateSchema,
  template: z.string().optional().nullable(),
  profesional: z.string().optional().nullable(),
  sistemas: z.array(z.string()).optional().nullable(),
  respuestas: z.record(z.unknown()).optional().nullable(),
  red_flags: z.array(z.unknown()).optional().nullable(),
});

export type AnamnesisCreate = z.infer<typeof AnamnesisCreateSchema>;

export const AnthropometrySchema = z.object({
  id: UUIDSchema,
  paciente_id: UUIDSchema,
  fecha: ISODateSchema,
  peso: z.number().positive().optional().nullable(),
  altura: z.number().positive().optional().nullable(),
  imc: z.number().positive().optional().nullable(),
  cintura: z.number().positive().optional().nullable(),
  cadera: z.number().positive().optional().nullable(),
  pantorrilla: z.number().positive().optional().nullable(),
  grasa_corporal: z.number().nonnegative().optional().nullable(),
  masa_muscular: z.number().nonnegative().optional().nullable(),
  grasa_visceral: z.number().nonnegative().optional().nullable(),
  metodo: z.string().optional().nullable(),
  created_by: UUIDSchema.optional().nullable(),
  created_at: ISODateSchema,
});

export type Anthropometry = z.infer<typeof AnthropometrySchema>;

export const AnthropometryCreateSchema = z.object({
  paciente_id: UUIDSchema,
  fecha: ISODateSchema,
  peso: z.coerce.number().positive().optional().nullable(),
  altura: z.coerce.number().positive().optional().nullable(),
  cintura: z.coerce.number().positive().optional().nullable(),
  cadera: z.coerce.number().positive().optional().nullable(),
  pantorrilla: z.coerce.number().positive().optional().nullable(),
  grasa_corporal: z.coerce.number().nonnegative().optional().nullable(),
  masa_muscular: z.coerce.number().nonnegative().optional().nullable(),
  grasa_visceral: z.coerce.number().nonnegative().optional().nullable(),
  metodo: z.string().optional().nullable(),
});

export type AnthropometryCreate = z.infer<typeof AnthropometryCreateSchema>;

export const BiomarkerSchema = z.object({
  nombre: z.string().min(1),
  valor: z.number(),
  unidad: z.string().optional().nullable(),
  referencia: z.string().optional().nullable(),
  alerta: z.enum(['normal', 'advertencia', 'peligro']).optional(),
});

export type Biomarker = z.infer<typeof BiomarkerSchema>;

export const AnalyticsSchema = z.object({
  id: UUIDSchema,
  paciente_id: UUIDSchema,
  fecha: ISODateSchema,
  ayuno: z.boolean().optional(),
  marcadores: z.array(BiomarkerSchema),
  created_by: UUIDSchema.optional().nullable(),
  created_at: ISODateSchema,
});

export type Analytics = z.infer<typeof AnalyticsSchema>;

export const AnalyticsCreateSchema = z.object({
  paciente_id: UUIDSchema,
  fecha: ISODateSchema,
  ayuno: z.boolean().optional(),
  marcadores: z.array(BiomarkerSchema).min(1, 'Al menos un marcador requerido'),
});

export type AnalyticsCreate = z.infer<typeof AnalyticsCreateSchema>;

export const ClinicalHistorySchema = z.object({
  id: UUIDSchema,
  paciente_id: UUIDSchema,
  version: z.number().int().positive(),
  antecedentes: z.string().optional().nullable(),
  antecedentes_familiares: z.string().optional().nullable(),
  alergias: z.string().optional().nullable(),
  medicacion: z.string().optional().nullable(),
  suplementacion: z.string().optional().nullable(),
  historial_ponderal: z.record(z.unknown()).optional().nullable(),
  actividad_fisica: z.record(z.unknown()).optional().nullable(),
  habitos_toxicos: z.string().optional().nullable(),
  sueno: z.string().optional().nullable(),
  estres: z.string().optional().nullable(),
  ingesta_hidrica: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  created_by: UUIDSchema.optional().nullable(),
  created_at: ISODateSchema,
});

export type ClinicalHistory = z.infer<typeof ClinicalHistorySchema>;

export const ClinicalHistoryCreateSchema = z.object({
  paciente_id: UUIDSchema,
  version: z.number().int().positive().optional().nullable(),
  antecedentes: z.string().optional().nullable(),
  antecedentes_familiares: z.string().optional().nullable(),
  alergias: z.string().optional().nullable(),
  medicacion: z.string().optional().nullable(),
  suplementacion: z.string().optional().nullable(),
  historial_ponderal: z.record(z.unknown()).optional().nullable(),
  actividad_fisica: z.record(z.unknown()).optional().nullable(),
  habitos_toxicos: z.string().optional().nullable(),
  sueno: z.string().optional().nullable(),
  estres: z.string().optional().nullable(),
  ingesta_hidrica: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

export type ClinicalHistoryCreate = z.infer<typeof ClinicalHistoryCreateSchema>;

export const FormulaResultSchema = z.object({
  tmb: z.number(),
  get: z.number(),
  proteinas: z.object({ min: z.number(), max: z.number() }),
  grasas: z.object({ min: z.number(), max: z.number() }),
  hc: z.object({ min: z.number(), max: z.number() }),
  agua: z.number(),
  fibra: z.number(),
});

export type FormulaResult = z.infer<typeof FormulaResultSchema>;

export const FormulaRequestSchema = z.object({
  peso: z.number().positive(),
  altura: z.number().positive(),
  edad: z.number().int().positive(),
  sexo: z.enum(['M', 'F']),
  factor_actividad: z.number().min(1).max(2.5),
  objetivo: z.enum(['mantener', 'perder', 'ganar']).optional(),
  patologia: z.string().optional().nullable(),
});

export type FormulaRequest = z.infer<typeof FormulaRequestSchema>;

export const AlertSeveritySchema = z.enum(['leve', 'moderada', 'grave', 'critica']);
export const AlertStatusSchema = z.enum(['pendiente', 'revisada']);

export const AlertSchema = z.object({
  id: UUIDSchema,
  paciente_id: UUIDSchema,
  tipo: z.string().optional().nullable(),
  severidad: AlertSeveritySchema,
  mensaje: z.string().min(1),
  recomendacion: z.string().optional().nullable(),
  estado: AlertStatusSchema,
  fecha: ISODateSchema.optional().nullable(),
  created_by: UUIDSchema.optional().nullable(),
  created_at: ISODateSchema,
});

export type Alert = z.infer<typeof AlertSchema>;

export const AlertCreateSchema = z.object({
  paciente_id: UUIDSchema,
  tipo: z.string().optional().nullable(),
  severidad: AlertSeveritySchema,
  mensaje: z.string().min(1),
  recomendacion: z.string().optional().nullable(),
  estado: AlertStatusSchema.optional(),
});

export type AlertCreate = z.infer<typeof AlertCreateSchema>;

export const ClinicalListQuerySchema = PaginationSchema.extend({
  paciente_id: UUIDSchema.optional().nullable(),
});

export type ClinicalListQuery = z.infer<typeof ClinicalListQuerySchema>;

export const AnamnesisApiEnvelopeSchema = ApiEnvelopeSchema(AnamnesisSchema);
export const AnthropometryApiEnvelopeSchema = ApiEnvelopeSchema(AnthropometrySchema);
export const AnalyticsApiEnvelopeSchema = ApiEnvelopeSchema(AnalyticsSchema);
export const ClinicalHistoryApiEnvelopeSchema = ApiEnvelopeSchema(ClinicalHistorySchema);
export const FormulaResultApiEnvelopeSchema = ApiEnvelopeSchema(FormulaResultSchema);
export const AlertApiEnvelopeSchema = ApiEnvelopeSchema(AlertSchema);
export const AlertListApiEnvelopeSchema = ApiEnvelopeSchema(z.array(AlertSchema));
