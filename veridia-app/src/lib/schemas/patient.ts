import { z } from 'zod';
import { UUIDSchema, ISODateSchema, PaginationSchema, ApiEnvelopeSchema } from './common';

export const PatientSexSchema = z.enum(['MASCULINO', 'FEMENINO', 'OTRO']);

export const PatientRoleSchema = z.enum(['admin', 'nutricionista', 'secretaria', 'trial']);

export const PatientSchema = z.object({
  id: UUIDSchema,
  nombre: z.string().min(1),
  apellidos: z.string().min(1),
  dni: z.string().optional(),
  fecha_nacimiento: ISODateSchema.optional(),
  sexo: PatientSexSchema.optional(),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  profesion: z.string().optional(),
  nacionalidad: z.string().optional(),
  estado_civil: z.string().optional(),
  educacion: z.string().optional(),
  procedencia: z.string().optional(),
  motivo_consulta: z.string().optional(),
  grupo_sanguineo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  consents: z.record(z.unknown()).optional(),
  activo: z.boolean(),
  clinica_id: z.number().int().optional(),
  created_by: UUIDSchema.optional(),
  created_at: ISODateSchema,
  updated_at: ISODateSchema,
});

export type Patient = z.infer<typeof PatientSchema>;

export const PatientCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  apellidos: z.string().min(1, 'Apellidos requeridos'),
  dni: z.string().optional(),
  fecha_nacimiento: ISODateSchema.optional(),
  sexo: PatientSexSchema.optional(),
  email: z.string().email('Email inválido').optional(),
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
