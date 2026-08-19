import { z } from 'zod';
import { UUIDSchema, ISODateSchema, PaginationSchema, ApiEnvelopeSchema } from './common';

export const AnamnesisSchema = z.object({
  id: UUIDSchema,
  paciente_id: UUIDSchema,
  fecha: ISODateSchema,
  template: z.string().optional(),
  profesional: z.string().optional(),
  sistemas: z.array(z.string()).optional(),
  respuestas: z.record(z.unknown()).optional(),
  red_flags: z.array(z.unknown()).optional(),
  created_at: ISODateSchema,
});

export type Anamnesis = z.infer<typeof AnamnesisSchema>;

export const AnamnesisCreateSchema = z.object({
  paciente_id: UUIDSchema,
  fecha: ISODateSchema,
  template: z.string().optional(),
  profesional: z.string().optional(),
  sistemas: z.array(z.string()).optional(),
  respuestas: z.record(z.unknown()).optional(),
  red_flags: z.array(z.unknown()).optional(),
});

export type AnamnesisCreate = z.infer<typeof AnamnesisCreateSchema>;

export const AnthropometrySchema = z.object({
  id: UUIDSchema,
  paciente_id: UUIDSchema,
  fecha: ISODateSchema,
  peso: z.number().positive().optional(),
  altura: z.number().positive().optional(),
  imc: z.number().positive().optional(),
  cintura: z.number().positive().optional(),
  cadera: z.number().positive().optional(),
  pantorrilla: z.number().positive().optional(),
  grasa_corporal: z.number().nonnegative().optional(),
  masa_muscular: z.number().nonnegative().optional(),
  grasa_visceral: z.number().nonnegative().optional(),
  metodo: z.string().optional(),
  created_by: UUIDSchema.optional(),
  created_at: ISODateSchema,
});

export type Anthropometry = z.infer<typeof AnthropometrySchema>;

export const AnthropometryCreateSchema = z.object({
  paciente_id: UUIDSchema,
  fecha: ISODateSchema,
  peso: z.coerce.number().positive().optional(),
  altura: z.coerce.number().positive().optional(),
  cintura: z.coerce.number().positive().optional(),
  cadera: z.coerce.number().positive().optional(),
  pantorrilla: z.coerce.number().positive().optional(),
  grasa_corporal: z.coerce.number().nonnegative().optional(),
  masa_muscular: z.coerce.number().nonnegative().optional(),
  grasa_visceral: z.coerce.number().nonnegative().optional(),
  metodo: z.string().optional(),
});

export type AnthropometryCreate = z.infer<typeof AnthropometryCreateSchema>;

export const BiomarkerSchema = z.object({
  nombre: z.string().min(1),
  valor: z.number(),
  unidad: z.string().optional(),
  referencia: z.string().optional(),
  alerta: z.enum(['normal', 'advertencia', 'peligro']).optional(),
});

export type Biomarker = z.infer<typeof BiomarkerSchema>;

export const AnalyticsSchema = z.object({
  id: UUIDSchema,
  paciente_id: UUIDSchema,
  fecha: ISODateSchema,
  ayuno: z.boolean().optional(),
  marcadores: z.array(BiomarkerSchema),
  created_by: UUIDSchema.optional(),
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
  antecedentes: z.string().optional(),
  antecedentes_familiares: z.string().optional(),
  alergias: z.string().optional(),
  medicacion: z.string().optional(),
  suplementacion: z.string().optional(),
  historial_ponderal: z.record(z.unknown()).optional(),
  actividad_fisica: z.record(z.unknown()).optional(),
  habitos_toxicos: z.string().optional(),
  sueno: z.string().optional(),
  estres: z.string().optional(),
  ingesta_hidrica: z.string().optional(),
  observaciones: z.string().optional(),
  created_by: UUIDSchema.optional(),
  created_at: ISODateSchema,
});

export type ClinicalHistory = z.infer<typeof ClinicalHistorySchema>;

export const ClinicalHistoryCreateSchema = z.object({
  paciente_id: UUIDSchema,
  version: z.number().int().positive().optional(),
  antecedentes: z.string().optional(),
  antecedentes_familiares: z.string().optional(),
  alergias: z.string().optional(),
  medicacion: z.string().optional(),
  suplementacion: z.string().optional(),
  historial_ponderal: z.record(z.unknown()).optional(),
  actividad_fisica: z.record(z.unknown()).optional(),
  habitos_toxicos: z.string().optional(),
  sueno: z.string().optional(),
  estres: z.string().optional(),
  ingesta_hidrica: z.string().optional(),
  observaciones: z.string().optional(),
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
  patologia: z.string().optional(),
});

export type FormulaRequest = z.infer<typeof FormulaRequestSchema>;

export const AlertSeveritySchema = z.enum(['leve', 'moderada', 'grave', 'critica']);
export const AlertStatusSchema = z.enum(['pendiente', 'revisada']);

export const AlertSchema = z.object({
  id: UUIDSchema,
  paciente_id: UUIDSchema,
  tipo: z.string().optional(),
  severidad: AlertSeveritySchema,
  mensaje: z.string().min(1),
  recomendacion: z.string().optional(),
  estado: AlertStatusSchema,
  fecha: ISODateSchema.optional(),
  created_by: UUIDSchema.optional(),
  created_at: ISODateSchema,
});

export type Alert = z.infer<typeof AlertSchema>;

export const AlertCreateSchema = z.object({
  paciente_id: UUIDSchema,
  tipo: z.string().optional(),
  severidad: AlertSeveritySchema,
  mensaje: z.string().min(1),
  recomendacion: z.string().optional(),
  estado: AlertStatusSchema.optional(),
});

export type AlertCreate = z.infer<typeof AlertCreateSchema>;

export const ClinicalListQuerySchema = PaginationSchema.extend({
  paciente_id: UUIDSchema.optional(),
});

export type ClinicalListQuery = z.infer<typeof ClinicalListQuerySchema>;

export const AnamnesisApiEnvelopeSchema = ApiEnvelopeSchema(AnamnesisSchema);
export const AnthropometryApiEnvelopeSchema = ApiEnvelopeSchema(AnthropometrySchema);
export const AnalyticsApiEnvelopeSchema = ApiEnvelopeSchema(AnalyticsSchema);
export const ClinicalHistoryApiEnvelopeSchema = ApiEnvelopeSchema(ClinicalHistorySchema);
export const FormulaResultApiEnvelopeSchema = ApiEnvelopeSchema(FormulaResultSchema);
export const AlertApiEnvelopeSchema = ApiEnvelopeSchema(AlertSchema);
export const AlertListApiEnvelopeSchema = ApiEnvelopeSchema(z.array(AlertSchema));
