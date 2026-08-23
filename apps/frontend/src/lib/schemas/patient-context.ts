import { z } from 'zod';
import { ApiEnvelopeSchema } from './common';

// Patient Context Hub — lightweight passthrough schemas for response validation
// Full type safety is handled by TypeScript types, not runtime Zod validation

const DrugNutrientAlertSchema = z.object({
  id: z.string(),
  drug: z.string(),
  nutrient: z.string(),
  severity: z.enum(['contraindicated', 'major', 'moderate', 'minor']),
  status: z.enum(['active', 'resolved', 'acknowledged']),
  mechanism: z.string(),
  clinicalEffect: z.string(),
  recommendation: z.string(),
  evidence: z.enum(['strong', 'moderate', 'weak']),
}).passthrough();

export const PatientComputedStateSchema = z.object({
  patientId: z.string(),
  version: z.number(),
  lastComputed: z.string(),
  checksum: z.string(),
  demographics: z.object({}).passthrough(),
  anthropometry: z.object({}).passthrough(),
  labs: z.object({}).passthrough(),
  diagnoses: z.array(z.string()),
  screeningResults: z.array(z.string()),
  ncp: z.object({}).passthrough().nullable().optional(),
  glim: z.object({}).passthrough().nullable().optional(),
  espenTargets: z.object({}).passthrough().nullable().optional(),
  pnEnPrescription: z.object({}).passthrough().nullable().optional(),
  precisionTargets: z.object({}).passthrough().nullable().optional(),
  nutrigenomicProfile: z.object({}).passthrough().nullable().optional(),
  microbiomeProfile: z.object({}).passthrough().nullable().optional(),
  eatingBehavior: z.object({}).passthrough().nullable().optional(),
  adherenceRisk: z.object({}).passthrough().nullable().optional(),
  edScreening: z.object({}).passthrough().nullable().optional(),
  sportsProfile: z.object({}).passthrough().nullable().optional(),
  drugNutrientAlerts: z.array(DrugNutrientAlertSchema).optional(),
  bioactivesProfile: z.object({}).passthrough().nullable().optional(),
  planetaryScore: z.object({}).passthrough().nullable().optional(),
  computationDurationMs: z.number(),
}).passthrough();

export const PatientContextApiEnvelopeSchema = ApiEnvelopeSchema(PatientComputedStateSchema);
