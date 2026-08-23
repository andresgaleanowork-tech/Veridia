import { describe, it, expect } from 'vitest';
import { PatientCreateSchema, PatientUpdateSchema, AppointmentCreateSchema, InvoiceCreateSchema, MealPlanCreateSchema, RecipeCreateSchema } from '../../src/schemas/index.js';

describe('Zod Schemas Validation', () => {
  describe('PatientCreateSchema', () => {
    it('should accept valid patient data', () => {
      const result = PatientCreateSchema.safeParse({
        nombre: 'María',
        apellidos: 'González',
        dni: '12345678A',
        fecha_nacimiento: '1985-03-12',
        sexo: 'FEMENINO',
        email: 'maria@email.com',
        telefono: '600111222',
      });
      expect(result.success).toBe(true);
    });

    it('should reject patient without name', () => {
      const result = PatientCreateSchema.safeParse({ apellidos: 'González' });
      expect(result.success).toBe(false);
    });
  });

  describe('AppointmentCreateSchema', () => {
    it('should accept valid appointment', () => {
      const result = AppointmentCreateSchema.safeParse({
        paciente_id: '123e4567-e89b-12d3-a456-426614174000',
        fecha: '2026-01-15',
        hora: '10:00',
        tipo: 'Consulta',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('InvoiceCreateSchema', () => {
    it('should accept valid invoice', () => {
      const result = InvoiceCreateSchema.safeParse({
        paciente_id: '123e4567-e89b-12d3-a456-426614174000',
        concepto: 'Consulta nutricional',
        total: 100,
        lineas: [{ descripcion: 'Consulta', cantidad: 1, precio: 100 }],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('MealPlanCreateSchema', () => {
    it('should accept valid meal plan', () => {
      const result = MealPlanCreateSchema.safeParse({
        paciente_id: '123e4567-e89b-12d3-a456-426614174000',
        kcal_objetivo: 2000,
        prot_g: 100,
        grasas_g: 70,
        hc_g: 250,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('RecipeCreateSchema', () => {
    it('should accept valid recipe', () => {
      const result = RecipeCreateSchema.safeParse({
        nombre: 'Ensalada César',
        raciones: 2,
        categoria: 'ensalada',
        kcal: 350,
        prot: 25,
        grasas: 20,
        hc: 15,
      });
      expect(result.success).toBe(true);
    });
  });
});
