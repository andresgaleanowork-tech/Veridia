import { z } from 'zod';

export const DNI_SCHEMA = z.string().regex(/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i);

export const EMAIL_SCHEMA = z.string().email();

export const PHONE_SCHEMA = z.string().regex(/^(\+34|0034)?[679][0-9]{8}$/);

export const DATE_SCHEMA = z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid date');

export const numericRange = (min: number, max: number) => z.number().min(min).max(max);

export const PATIENT_CREATE_SCHEMA = z.object({
  nombre: z.string().min(1),
  apellidos: z.string().min(1),
  dni: DNI_SCHEMA,
  fecha_nacimiento: DATE_SCHEMA,
  sexo: z.enum(['M', 'F', 'O']),
  email: EMAIL_SCHEMA.optional(),
  telefono: PHONE_SCHEMA.optional(),
});

export const APPOINTMENT_CREATE_SCHEMA = z.object({
  paciente_id: z.string().uuid(),
  fecha: DATE_SCHEMA,
  hora: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  tipo: z.string(),
  asunto: z.string().optional(),
  duracion: z.number().int().positive(),
});

export const INVOICE_CREATE_SCHEMA = z.object({
  paciente_id: z.string().uuid(),
  fecha: DATE_SCHEMA,
  lineas: z.array(z.object({
    concepto: z.string(),
    cantidad: z.number().positive(),
    precio: z.number().nonnegative(),
  })).min(1),
  estado: z.enum(['pendiente', 'pagada', 'anulada', 'borrador']),
});

export const RECIPE_CREATE_SCHEMA = z.object({
  nombre: z.string().min(1),
  categoria: z.string(),
  raciones: z.number().int().positive(),
  kcal: z.number().nonnegative(),
  ingredientes: z.array(z.object({
    alimento_id: z.string(),
    cantidad: z.number().positive(),
    unidad: z.string(),
  })).min(1),
  pasos: z.array(z.string()).min(1),
});

export const MEAL_PLAN_CREATE_SCHEMA = z.object({
  paciente_id: z.string().uuid(),
  nombre: z.string().min(1),
  kcal_objetivo: z.number().positive(),
  dias: z.array(z.object({
    dia: z.number().int().min(1).max(7),
    comidas: z.array(z.object({
      tipo: z.enum(['desayuno', 'media_manana', 'almuerzo', 'merienda', 'cena']),
      receta_id: z.string().uuid().optional(),
      alimentos: z.array(z.object({
        alimento_id: z.string(),
        cantidad: z.number().positive(),
      })).optional(),
    })).min(1),
  })).min(1).max(7),
});
