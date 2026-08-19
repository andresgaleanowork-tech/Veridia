import { z } from 'zod';

export const AutomationCreateSchema = z.object({
  name: z.string().min(1),
  trigger: z.string(),
  conditions: z.array(z.object({ field: z.string(), operator: z.string(), value: z.any() })).optional().default([]),
  actions: z.array(z.object({ type: z.string(), params: z.any() })).optional().default([]),
  active: z.boolean().default(true),
});

export const AutomationUpdateSchema = AutomationCreateSchema.partial();
