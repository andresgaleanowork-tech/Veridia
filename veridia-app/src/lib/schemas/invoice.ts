import { z } from 'zod';
import { UUIDSchema, ISODateSchema, PaginationSchema, ApiEnvelopeSchema } from './common';

export const InvoiceStatusSchema = z.enum(['Pendiente', 'Pagada', 'Vencida', 'Anulada']);

export const InvoiceLineSchema = z.object({
  descripcion: z.string().min(1),
  cantidad: z.number().int().positive(),
  precio: z.number().nonnegative(),
});

export type InvoiceLine = z.infer<typeof InvoiceLineSchema>;

export const InvoicePaymentSchema = z.object({
  importe: z.number().positive(),
  metodo: z.string().min(1),
  fecha: ISODateSchema,
});

export type InvoicePayment = z.infer<typeof InvoicePaymentSchema>;

export const InvoiceSchema = z.object({
  id: UUIDSchema,
  numero: z.string().min(1),
  paciente_id: UUIDSchema,
  paciente_nombre: z.string().optional(),
  fecha: ISODateSchema,
  estado: InvoiceStatusSchema,
  total: z.number().nonnegative(),
  lineas: z.array(InvoiceLineSchema),
  pagos: z.array(InvoicePaymentSchema),
  created_by: UUIDSchema.optional(),
  created_at: ISODateSchema,
  updated_at: ISODateSchema,
});

export type Invoice = z.infer<typeof InvoiceSchema>;

export const InvoiceCreateSchema = z.object({
  paciente_id: UUIDSchema,
  concepto: z.string().min(1, 'Concepto requerido'),
  total: z.coerce.number().positive('Total requerido'),
  estado: InvoiceStatusSchema.optional(),
  fecha: ISODateSchema.optional(),
  notas: z.string().optional(),
  lineas: z.array(InvoiceLineSchema).optional(),
});

export type InvoiceCreate = z.infer<typeof InvoiceCreateSchema>;

export const InvoiceUpdateSchema = InvoiceCreateSchema.partial();

export type InvoiceUpdate = z.infer<typeof InvoiceUpdateSchema>;

export const InvoicePaymentCreateSchema = z.object({
  importe: z.coerce.number().positive(),
  metodo: z.string().min(1),
  fecha: ISODateSchema.optional(),
});

export type InvoicePaymentCreate = z.infer<typeof InvoicePaymentCreateSchema>;

export const InvoiceListQuerySchema = PaginationSchema.extend({
  paciente_id: UUIDSchema.optional(),
  estado: InvoiceStatusSchema.optional(),
  fecha_desde: ISODateSchema.optional(),
  fecha_hasta: ISODateSchema.optional(),
});

export type InvoiceListQuery = z.infer<typeof InvoiceListQuerySchema>;

export const InvoiceApiEnvelopeSchema = ApiEnvelopeSchema(InvoiceSchema);
export const InvoiceListApiEnvelopeSchema = ApiEnvelopeSchema(z.array(InvoiceSchema));
