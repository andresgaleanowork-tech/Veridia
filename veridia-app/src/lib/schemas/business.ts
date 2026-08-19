import { z } from 'zod';
import { UUIDSchema, ISODateSchema, PaginationSchema, ApiEnvelopeSchema } from './common';

export const ExpenseSchema = z.object({
  id: UUIDSchema,
  categoria: z.string().min(1),
  descripcion: z.string().optional(),
  importe: z.number().positive(),
  fecha: ISODateSchema,
  metodo_pago: z.string().optional(),
  recurrente: z.boolean().optional(),
  frecuencia: z.string().optional(),
  proveedor: z.string().optional(),
  notas: z.string().optional(),
  created_by: UUIDSchema.optional(),
  created_at: ISODateSchema,
});

export type Expense = z.infer<typeof ExpenseSchema>;

export const ExpenseCreateSchema = z.object({
  categoria: z.string().min(1, 'Categoría requerida'),
  descripcion: z.string().min(1, 'Descripción requerida'),
  importe: z.coerce.number().positive('Importe requerido'),
  fecha: ISODateSchema,
  metodo_pago: z.string().optional(),
  recurrente: z.boolean().optional(),
  frecuencia: z.string().optional(),
  proveedor: z.string().optional(),
  notas: z.string().optional(),
});

export type ExpenseCreate = z.infer<typeof ExpenseCreateSchema>;

export const ExpenseUpdateSchema = ExpenseCreateSchema.partial();

export type ExpenseUpdate = z.infer<typeof ExpenseUpdateSchema>;

export const ExpenseListQuerySchema = PaginationSchema.extend({
  categoria: z.string().optional(),
  fecha_desde: ISODateSchema.optional(),
  fecha_hasta: ISODateSchema.optional(),
});

export type ExpenseListQuery = z.infer<typeof ExpenseListQuerySchema>;

export const ExpenseApiEnvelopeSchema = ApiEnvelopeSchema(ExpenseSchema);
export const ExpenseListApiEnvelopeSchema = ApiEnvelopeSchema(z.array(ExpenseSchema));

// Cash Session schemas
export const CashMovementSchema = z.object({
  tipo: z.enum(['Ingreso', 'Egreso']),
  importe: z.number().positive(),
  descripcion: z.string().min(1),
  metodo: z.string().min(1),
  fecha: ISODateSchema,
});

export type CashMovement = z.infer<typeof CashMovementSchema>;

export const CashSessionSchema = z.object({
  id: UUIDSchema,
  fecha: ISODateSchema,
  estado: z.enum(['Abierta', 'Cerrada']),
  saldo_inicial: z.number().nonnegative(),
  movimientos: z.array(CashMovementSchema),
  created_by: UUIDSchema.optional(),
  created_at: ISODateSchema,
});

export type CashSession = z.infer<typeof CashSessionSchema>;

export const CashSessionCreateSchema = z.object({
  fecha: ISODateSchema,
  saldo_inicial: z.coerce.number().nonnegative(),
});

export type CashSessionCreate = z.infer<typeof CashSessionCreateSchema>;

export const CashMovementCreateSchema = z.object({
  tipo: z.enum(['Ingreso', 'Egreso']),
  importe: z.coerce.number().positive(),
  descripcion: z.string().min(1),
  metodo: z.string().min(1),
  fecha: ISODateSchema.optional(),
});

export type CashMovementCreate = z.infer<typeof CashMovementCreateSchema>;

export const CashSessionApiEnvelopeSchema = ApiEnvelopeSchema(CashSessionSchema);
export const CashSessionListApiEnvelopeSchema = ApiEnvelopeSchema(z.array(CashSessionSchema));
