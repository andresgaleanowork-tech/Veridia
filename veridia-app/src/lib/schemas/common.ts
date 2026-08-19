import { z } from 'zod';

export const UUIDSchema = z.string().uuid('Invalid UUID format');

export const ISODateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');

export const ISODateTimeSchema = z.string().datetime({ offset: true });

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export function PaginatedResponseSchema(itemSchema: z.ZodTypeAny) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
  });
}

export type PaginatedResponse = z.infer<ReturnType<typeof PaginatedResponseSchema>>;

export const ApiErrorSchema = z.object({
  error: z.string(),
  details: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export function ApiEnvelopeSchema(dataSchema: z.ZodTypeAny) {
  return z.object({
    ok: z.boolean(),
    data: dataSchema.optional(),
    meta: z
      .object({
        requestId: z.string().optional(),
        total: z.number().int().optional(),
        page: z.number().int().optional(),
        limit: z.number().int().optional(),
        pages: z.number().int().optional(),
        timestamp: z.string().optional(),
      })
      .optional(),
    error: z.string().optional(),
    code: z.string().optional(),
    details: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
  });
}

export type ApiEnvelope = z.infer<ReturnType<typeof ApiEnvelopeSchema>>;
