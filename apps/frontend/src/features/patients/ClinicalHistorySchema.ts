import { z } from 'zod';

export const ClinicalHistorySchema = z.object({
  antecedentes: z.string().optional(),
  antecedentes_familiares: z.string().optional(),
  alergias: z.string().optional(),
  medicacion: z.string().optional(),
  suplementacion: z.string().optional(),
  habitos_toxicos: z.string().optional(),
  sueno: z.string().optional(),
  estres: z.string().optional(),
  ingesta_hidrica: z.string().optional(),
  observaciones: z.string().optional(),
  historial_ponderal: z.string().optional(),
  actividad_fisica: z.string().optional(),
});

export type ClinicalHistoryForm = z.infer<typeof ClinicalHistorySchema>;