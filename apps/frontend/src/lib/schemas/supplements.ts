import { z } from 'zod';

export const SupplementSchema = z.object({
  id: z.string(),
  paciente_id: z.string(),
  nombre: z.string(),
  tipo: z.enum(['supplement', 'medication', 'vitamin', 'mineral']),
  dosis: z.string(),
  frecuencia: z.string(),
  horarios: z.array(z.string()),
  via: z.string(),
  fecha_inicio: z.string(),
  fecha_fin: z.string().optional().nullable(),
  motivo: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  activo: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const SupplementCreateSchema = z.object({
  paciente_id: z.string(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  tipo: z.enum(['supplement', 'medication', 'vitamin', 'mineral']),
  dosis: z.string().min(1, 'La dosis es requerida'),
  frecuencia: z.string().min(1, 'La frecuencia es requerida'),
  horarios: z.array(z.string()).min(1, 'Agrega al menos un horario'),
  via: z.string().min(1, 'La vía es requerida'),
  fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fecha_fin: z.string().optional().nullable(),
  motivo: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  activo: z.boolean(),
});

export const SupplementAdherenceSchema = z.object({
  id: z.string(),
  supplement_id: z.string(),
  fecha: z.string(),
  tomado: z.boolean(),
  created_at: z.string(),
});

export type Supplement = z.infer<typeof SupplementSchema>;
export type SupplementCreate = z.infer<typeof SupplementCreateSchema>;
export type SupplementAdherence = z.infer<typeof SupplementAdherenceSchema>;
