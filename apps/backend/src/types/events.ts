/**
 * Patient Context Hub - Event Types
 * Typed Event System for Cross-Module Communication
 */

import type {
  AnthropometrySnapshot,
  LabSnapshot,
  Diagnosis,
  ScreeningResult,
  PESStatement,
  GLIMDiagnosis,
  ESPENTargets,
  PNPrescription,
  NutrigenomicVariant,
  MicrobiomeProfile,
  AdherenceRiskScore,
  DrugNutrientAlert,
  PlanetaryHealthScore,
  ScreeningToolDefinition,
  EatingBehaviorProfile,
} from './patient-context.js';

// ============================================
// BASE EVENT TYPES
// ============================================

export type EventType = 
  | 'ANTHROPOMETRY_UPDATED'
  | 'LABS_UPDATED'
  | 'DIAGNOSIS_ADDED'
  | 'DIAGNOSIS_REMOVED'
  | 'DIAGNOSIS_UPDATED'
  | 'SCREENING_COMPLETED'
  | 'SCREENING_REMOVED'
  | 'NCP_STEP_CHANGED'
  | 'PES_STATEMENT_ADDED'
  | 'PES_STATEMENT_REMOVED'
  | 'NCP_TARGETS_UPDATED'
  | 'GLIM_RECALCULATED'
  | 'ESPEN_TARGETS_UPDATED'
  | 'PN_PRESCRIPTION_CREATED'
  | 'PN_PRESCRIPTION_UPDATED'
  | 'EN_PRESCRIPTION_CREATED'
  | 'EN_PRESCRIPTION_UPDATED'
  | 'PRECISION_REPORT_UPLOADED'
  | 'NUTRIGENOMICS_UPDATED'
  | 'MICROBIOME_UPDATED'
  | 'PHARMACOGENOMICS_UPDATED'
  | 'EATING_BEHAVIOR_ASSESSED'
  | 'ADHERENCE_RISK_UPDATED'
  | 'ED_SCREENING_COMPLETED'
  | 'SPORTS_PROFILE_UPDATED'
  | 'ENERGY_AVAILABILITY_CALCULATED'
  | 'CARB_PERIODIZATION_UPDATED'
  | 'SUPPLEMENT_PLAN_UPDATED'
  | 'HYDRATION_PLAN_UPDATED'
  | 'DRUG_ADDED'
  | 'DRUG_REMOVED'
  | 'DRUG_UPDATED'
  | 'DRUG_NUTRIENT_ALERTS_UPDATED'
  | 'PLANETARY_SCORE_UPDATED'
  | 'BIOACTIVES_PROFILE_UPDATED'
  | 'RECIPE_NUTRITION_CALCULATED'
  | 'FOOD_CLASSIFICATION_UPDATED'
  | 'ENVIRONMENTAL_IMPACT_CALCULATED'
  | 'SCREENING_TOOL_REGISTERED'
  | 'SCREENING_TOOL_REMOVED'
  | 'FHIR_EXPORT_REQUESTED'
  | 'FHIR_IMPORT_COMPLETED'
  | 'TERMINOLOGY_QUERIED'
  | 'GUIDELINE_VERSION_UPDATED'
  | 'MODULE_REGISTERED'
  | 'MODULE_UNREGISTERED'
  | 'CONTEXT_INVALIDATED'
  | 'CONTEXT_RECOMPUTED'
  | 'COMPUTATION_STARTED'
  | 'COMPUTATION_COMPLETED'
  | 'COMPUTATION_FAILED';

// ============================================
// EVENT PAYLOADS
// ============================================

export interface BaseEvent {
  type: EventType;
  patientId: string;
  timestamp: string;
  source: string; // moduleId or 'system'
  trigger?: string;
  correlationId?: string;
}

/** Evento genérico para tipos de módulo sin payload dedicado. */
export interface GenericModuleEvent extends BaseEvent {}

export interface AnthropometryUpdatedEvent extends BaseEvent {
  type: 'ANTHROPOMETRY_UPDATED';
  fields: string[];
  previous: Partial<AnthropometrySnapshot>;
  current: Partial<AnthropometrySnapshot>;
}

export interface LabsUpdatedEvent extends BaseEvent {
  type: 'LABS_UPDATED';
  fields: string[];
  previous: Partial<LabSnapshot>;
  current: Partial<LabSnapshot>;
}

export interface DiagnosisAddedEvent extends BaseEvent {
  type: 'DIAGNOSIS_ADDED';
  diagnosis: Diagnosis;
}

export interface DiagnosisRemovedEvent extends BaseEvent {
  type: 'DIAGNOSIS_REMOVED';
  diagnosisId: string;
}

export interface ScreeningCompletedEvent extends BaseEvent {
  type: 'SCREENING_COMPLETED';
  tool: ScreeningResult['tool'];
  result: ScreeningResult;
}

export interface NCPStepChangedEvent extends BaseEvent {
  type: 'NCP_STEP_CHANGED';
  previousStep: string;
  currentStep: string;
  completed: boolean;
}

export interface PESStatementAddedEvent extends BaseEvent {
  type: 'PES_STATEMENT_ADDED';
  pes: PESStatement;
}

export interface PESStatementRemovedEvent extends BaseEvent {
  type: 'PES_STATEMENT_REMOVED';
  pesId: string;
}

export interface GLIMRecalculatedEvent extends BaseEvent {
  type: 'GLIM_RECALCULATED';
  previous: GLIMDiagnosis | null;
  current: GLIMDiagnosis;
  trigger: 'screening' | 'labs' | 'anthropometry' | 'diagnosis';
}

export interface ESPENTargetsUpdatedEvent extends BaseEvent {
  type: 'ESPEN_TARGETS_UPDATED';
  previous: ESPENTargets | null;
  current: ESPENTargets | null;
  triggerCondition: string;
}

export interface PNPrescriptionCreatedEvent extends BaseEvent {
  type: 'PN_PRESCRIPTION_CREATED';
  prescription: PNPrescription;
}

export interface PNPrescriptionUpdatedEvent extends BaseEvent {
  type: 'PN_PRESCRIPTION_UPDATED';
  fields: string[];
  previous: Partial<PNPrescription>;
  current: Partial<PNPrescription>;
}

export interface PrecisionReportUploadedEvent extends BaseEvent {
  type: 'PRECISION_REPORT_UPLOADED';
  reportType: 'nutrigenomics' | 'microbiome' | 'pharmacogenomics';
  fileId: string;
}

export interface NutrigenomicsUpdatedEvent extends BaseEvent {
  type: 'NUTRIGENOMICS_UPDATED';
  variants: NutrigenomicVariant[];
}

export interface MicrobiomeUpdatedEvent extends BaseEvent {
  type: 'MICROBIOME_UPDATED';
  profile: MicrobiomeProfile;
}

export interface EatingBehaviorAssessedEvent extends BaseEvent {
  type: 'EATING_BEHAVIOR_ASSESSED';
  profile: EatingBehaviorProfile;
}

export interface AdherenceRiskUpdatedEvent extends BaseEvent {
  type: 'ADHERENCE_RISK_UPDATED';
  previous: AdherenceRiskScore | null;
  current: AdherenceRiskScore;
}

export interface DrugAddedEvent extends BaseEvent {
  type: 'DRUG_ADDED';
  drug: DrugNutrientAlert;
}

export interface DrugRemovedEvent extends BaseEvent {
  type: 'DRUG_REMOVED';
  drugId: string;
}

export interface DrugNutrientAlertsUpdatedEvent extends BaseEvent {
  type: 'DRUG_NUTRIENT_ALERTS_UPDATED';
  alerts: DrugNutrientAlert[];
}

export interface PlanetaryScoreUpdatedEvent extends BaseEvent {
  type: 'PLANETARY_SCORE_UPDATED';
  previous: PlanetaryHealthScore | null;
  current: PlanetaryHealthScore;
}

export interface ScreeningToolRegisteredEvent extends BaseEvent {
  type: 'SCREENING_TOOL_REGISTERED';
  tool: ScreeningToolDefinition;
}

export interface ContextInvalidatedEvent extends BaseEvent {
  type: 'CONTEXT_INVALIDATED';
  source: string;
  changedFields: string[];
  affectedModules: string[];
}

export interface ContextRecomputedEvent extends BaseEvent {
  type: 'CONTEXT_RECOMPUTED';
  modulesRecomputed: string[];
  durationMs: number;
  changedFields: string[];
}

export interface ComputationStartedEvent extends BaseEvent {
  type: 'COMPUTATION_STARTED';
  modules: string[];
  trigger: string;
}

export interface ComputationCompletedEvent extends BaseEvent {
  type: 'COMPUTATION_COMPLETED';
  modulesRecomputed: string[];
  durationMs: number;
  changedFields: string[];
}

export interface ComputationFailedEvent extends BaseEvent {
  type: 'COMPUTATION_FAILED';
  module: string;
  error: string;
  stack?: string;
}

// ============================================
// EVENT UNION TYPE
// ============================================

export type PatientEvent =
  | GenericModuleEvent
  | AnthropometryUpdatedEvent
  | LabsUpdatedEvent
  | DiagnosisAddedEvent
  | DiagnosisRemovedEvent
  | ScreeningCompletedEvent
  | NCPStepChangedEvent
  | PESStatementAddedEvent
  | PESStatementRemovedEvent
  | GLIMRecalculatedEvent
  | ESPENTargetsUpdatedEvent
  | PNPrescriptionCreatedEvent
  | PNPrescriptionUpdatedEvent
  | PrecisionReportUploadedEvent
  | NutrigenomicsUpdatedEvent
  | MicrobiomeUpdatedEvent
  | EatingBehaviorAssessedEvent
  | AdherenceRiskUpdatedEvent
  | DrugAddedEvent
  | DrugRemovedEvent
  | DrugNutrientAlertsUpdatedEvent
  | PlanetaryScoreUpdatedEvent
  | ScreeningToolRegisteredEvent
  | ContextInvalidatedEvent
  | ContextRecomputedEvent
  | ComputationStartedEvent
  | ComputationCompletedEvent
  | ComputationFailedEvent;

// ============================================
// EVENT EMITTER INTERFACE
// ============================================

export interface EventEmitter {
  on<T extends PatientEvent>(type: T['type'], listener: (event: T) => void): () => void;
  once<T extends PatientEvent>(type: T['type'], listener: (event: T) => void): () => void;
  emit<T extends PatientEvent>(event: T): boolean;
  off(type: EventType, listener: (event: PatientEvent) => void): void;
  removeAllListeners(type?: EventType): void;
  listenerCount(type: EventType): number;
}

// ============================================
// EVENT FACTORY HELPERS
// ============================================

export function createEvent<T extends PatientEvent>(
  type: T['type'],
  patientId: string,
  source: string,
  payload: Omit<T, 'type' | 'patientId' | 'timestamp' | 'source'>
): T {
  return {
    type,
    patientId,
    timestamp: new Date().toISOString(),
    source,
    ...payload
  } as T;
}

export function createAnthropometryUpdatedEvent(
  patientId: string,
  source: string,
  fields: string[],
  previous: Partial<AnthropometrySnapshot>,
  current: Partial<AnthropometrySnapshot>
): AnthropometryUpdatedEvent {
  return createEvent('ANTHROPOMETRY_UPDATED', patientId, source, { fields, previous, current });
}

export function createLabsUpdatedEvent(
  patientId: string,
  source: string,
  fields: string[],
  previous: Partial<LabSnapshot>,
  current: Partial<LabSnapshot>
): LabsUpdatedEvent {
  return createEvent('LABS_UPDATED', patientId, source, { fields, previous, current });
}

export function createGLIMRecalculatedEvent(
  patientId: string,
  source: string,
  previous: GLIMDiagnosis | null,
  current: GLIMDiagnosis,
  trigger: 'screening' | 'labs' | 'anthropometry' | 'diagnosis'
): GLIMRecalculatedEvent {
  return createEvent('GLIM_RECALCULATED', patientId, source, { previous, current, trigger });
}

export function createESPENTargetsUpdatedEvent(
  patientId: string,
  source: string,
  previous: ESPENTargets | null,
  current: ESPENTargets,
  triggerCondition: string
): ESPENTargetsUpdatedEvent {
  return createEvent('ESPEN_TARGETS_UPDATED', patientId, source, { previous, current, triggerCondition });
}

export function createContextInvalidatedEvent(
  patientId: string,
  source: string,
  changedFields: string[],
  affectedModules: string[]
): ContextInvalidatedEvent {
  return createEvent('CONTEXT_INVALIDATED', patientId, source, { changedFields, affectedModules });
}

export function createContextRecomputedEvent(
  patientId: string,
  source: string,
  modulesRecomputed: string[],
  durationMs: number,
  changedFields: string[]
): ContextRecomputedEvent {
  return createEvent('CONTEXT_RECOMPUTED', patientId, source, { modulesRecomputed, durationMs, changedFields });
}

// ============================================
// TYPE GUARDS
// ============================================

export function isAnthropometryUpdatedEvent(event: PatientEvent): event is AnthropometryUpdatedEvent {
  return event.type === 'ANTHROPOMETRY_UPDATED';
}

export function isLabsUpdatedEvent(event: PatientEvent): event is LabsUpdatedEvent {
  return event.type === 'LABS_UPDATED';
}

export function isGLIMRecalculatedEvent(event: PatientEvent): event is GLIMRecalculatedEvent {
  return event.type === 'GLIM_RECALCULATED';
}

export function isESPENTargetsUpdatedEvent(event: PatientEvent): event is ESPENTargetsUpdatedEvent {
  return event.type === 'ESPEN_TARGETS_UPDATED';
}

export function isContextInvalidatedEvent(event: PatientEvent): event is ContextInvalidatedEvent {
  return event.type === 'CONTEXT_INVALIDATED';
}

export function isContextRecomputedEvent(event: PatientEvent): event is ContextRecomputedEvent {
  return event.type === 'CONTEXT_RECOMPUTED';
}

export function isComputationCompletedEvent(event: PatientEvent): event is ComputationCompletedEvent {
  return event.type === 'COMPUTATION_COMPLETED';
}

export function isComputationFailedEvent(event: PatientEvent): event is ComputationFailedEvent {
  return event.type === 'COMPUTATION_FAILED';
}

// ============================================
// MODULE SUBSCRIPTION TYPES
// ============================================

export interface ModuleSubscription {
  moduleId: string;
  patientId: string;
  eventTypes: EventType[];
  callback: (event: PatientEvent) => void;
  filter?: (event: PatientEvent) => boolean;
}

export interface ModuleSubscriptionOptions {
  eventTypes: EventType[];
  filter?: (event: PatientEvent) => boolean;
  once?: boolean;
}