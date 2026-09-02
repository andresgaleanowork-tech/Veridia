import { z } from 'zod';
import { UUIDSchema, ISODateSchema, PaginationSchema, ApiEnvelopeSchema } from './common';

export const PatientSexSchema = z.enum(['MASCULINO', 'FEMENINO', 'OTRO']);

export const PatientRoleSchema = z.enum(['admin', 'nutricionista', 'secretaria', 'trial']);

export const PatientSchema = z.object({
  id: UUIDSchema,
  nombre: z.string().min(1),
  apellidos: z.string().min(1),
  dni: z.string().optional().nullable(),
  fecha_nacimiento: ISODateSchema.optional(),
  sexo: PatientSexSchema.optional(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  profesion: z.string().optional().nullable(),
  nacionalidad: z.string().optional().nullable(),
  estado_civil: z.string().optional().nullable(),
  educacion: z.string().optional().nullable(),
  procedencia: z.string().optional().nullable(),
  motivo_consulta: z.string().optional().nullable(),
  grupo_sanguineo: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  consents: z.record(z.unknown()).optional().nullable(),
  activo: z.boolean(),
  clinica_id: z.number().int().optional().nullable(),
  created_by: UUIDSchema.optional(),
  created_at: ISODateSchema,
  updated_at: ISODateSchema,
});

export type Patient = z.infer<typeof PatientSchema>;

// Los inputs vacíos llegan como '' (defaultValues del form). Los
// normalizamos a undefined para que no fallen la validación.
const optionalText = (schema: z.ZodTypeAny, message?: string) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), schema);

export const PatientCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  apellidos: z.string().min(1, 'Apellidos requeridos'),
  dni: z.string().optional(),
  fecha_nacimiento: optionalText(ISODateSchema.optional()),
  sexo: PatientSexSchema.optional(),
  email: optionalText(z.string().email('Email inválido').optional()),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  profesion: z.string().optional(),
  nacionalidad: z.string().optional(),
  estado_civil: z.string().optional(),
  educacion: z.string().optional(),
  procedencia: z.string().optional(),
  motivo_consulta: z.string().optional(),
  grupo_sanguineo: z.string().optional(),
});

export type PatientCreate = z.infer<typeof PatientCreateSchema>;

export const PatientUpdateSchema = PatientCreateSchema.partial();

export type PatientUpdate = z.infer<typeof PatientUpdateSchema>;

export const PatientListQuerySchema = PaginationSchema.extend({
  activo: z.coerce.boolean().optional(),
});

export type PatientListQuery = z.infer<typeof PatientListQuerySchema>;

export const PatientApiEnvelopeSchema = ApiEnvelopeSchema(PatientSchema);
export const PatientListApiEnvelopeSchema = ApiEnvelopeSchema(z.array(PatientSchema));
