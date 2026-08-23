import { z } from 'zod';
import { UUIDSchema, ISODateSchema, PaginationSchema, ApiEnvelopeSchema } from './common';

export const AppointmentStatusSchema = z.enum(['Pendiente', 'Confirmada', 'Realizada', 'No asistió', 'Cancelada']);

export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const AppointmentSchema = z.object({
  id: UUIDSchema,
  paciente_id: UUIDSchema,
  paciente_nombre: z.string().optional().nullable(),
  profesional: z.string().optional().nullable(),
  fecha: ISODateSchema,
  hora: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  tipo: z.string().optional().nullable(),
  asunto: z.string().optional().nullable(),
  estado: AppointmentStatusSchema,
  pago: z.string().optional().nullable(),
  precio: z.coerce.number().nonnegative().optional().nullable(),
  duracion: z.coerce.number().int().positive().optional().nullable(),
  nota: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  provider_id: z.string().uuid().optional().nullable(),
  acta: z.record(z.unknown()).optional().nullable(),
  created_by: UUIDSchema.optional(),
  created_at: ISODateSchema,
  updated_at: ISODateSchema,
});

export type Appointment = z.infer<typeof AppointmentSchema>;

export const AppointmentCreateSchema = z.object({
  paciente_id: UUIDSchema,
  fecha: ISODateSchema,
  hora: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato HH:MM requerido'),
  tipo: z.string().optional(),
  asunto: z.string().optional(),
  estado: AppointmentStatusSchema.optional(),
  pago: z.string().optional(),
  precio: z.coerce.number().nonnegative().optional(),
  duracion: z.coerce.number().int().positive().optional(),
  nota: z.string().optional(),
  color: z.string().optional(),
  provider_id: z.string().uuid().optional(),
});

export type AppointmentCreate = z.infer<typeof AppointmentCreateSchema>;

export const AppointmentUpdateSchema = AppointmentCreateSchema.partial();

export type AppointmentUpdate = z.infer<typeof AppointmentUpdateSchema>;

export const AppointmentListQuerySchema = PaginationSchema.extend({
  paciente_id: UUIDSchema.optional(),
  estado: AppointmentStatusSchema.optional(),
  fecha: ISODateSchema.optional(),
  fecha_desde: ISODateSchema.optional(),
  fecha_hasta: ISODateSchema.optional(),
});

export type AppointmentListQuery = z.infer<typeof AppointmentListQuerySchema>;

export const AppointmentApiEnvelopeSchema = ApiEnvelopeSchema(AppointmentSchema);
export const AppointmentListApiEnvelopeSchema = ApiEnvelopeSchema(z.array(AppointmentSchema));
