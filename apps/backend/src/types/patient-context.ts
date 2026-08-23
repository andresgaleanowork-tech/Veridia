/**
 * Patient Context Hub - Shared Types
 * Single Source of Truth for all computed clinical state
 */

// Re-export events types
export * from './events.js';

// ============================================
// CORE DATA TYPES (Input Data)
// ============================================

export interface Demographics {
  id: string;
  name: string;
  email: string;
  birthDate: string;
  sex: 'M' | 'F' | 'OTHER';
  role: 'admin' | 'nutricionista' | 'secretaria' | 'trial';
  initials?: string;
  avatar?: string;
  active: boolean;
}

export interface AnthropometrySnapshot {
  id: string;
  patientId: string;
  date: string;
  weight?: number;
  height?: number;
  bmi?: number;
  waist?: number;
  hip?: number;
  calf?: number;
  bodyFat?: number;
  muscleMass?: number;
  visceralFat?: number;
  method?: string;
  // Computed
  bmiCategory?: 'underweight' | 'normal' | 'overweight' | 'obese1' | 'obese2' | 'obese3';
  weightChangePercent?: number;
  weightChangePeriod?: string;
}

export interface LabSnapshot {
  id: string;
  patientId: string;
  date: string;
  // Protein status
  albumin?: number;
  prealbumin?: number;
  transferrin?: number;
  // Inflammation
  crp?: number;
  esr?: number;
  il6?: number;
  // Metabolic
  glucose?: number;
  hba1c?: number;
  insulin?: number;
  // Renal
  urea?: number;
  creatinine?: number;
  egfr?: number;
  // Hepatic
  bilirubin?: number;
  alt?: number;
  ast?: number;
  ggp?: number;
  // Electrolytes
  sodium?: number;
  potassium?: number;
  phosphate?: number;
  magnesium?: number;
  calcium?: number;
  // Hematology
  hemoglobin?: number;
  hematocrit?: number;
  lymphocytes?: number;
  // Vitamins/Trace
  vitaminD?: number;
  vitaminB12?: number;
  folate?: number;
  iron?: number;
  ferritin?: number;
  zinc?: number;
}

export interface Diagnosis {
  code: string;
  name: string;
  system: 'ICD-10' | 'ICD-11' | 'SNOMED-CT';
  status: 'active' | 'resolved' | 'history';
  onsetDate?: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'critical';
  isPrimary: boolean;
}

export interface ScreeningResult {
  id: string;
  tool: 'NRS-2002' | 'MUST' | 'MNA-SF' | 'PG-SGA' | 'GLIM' | 'SARC-F' | 'SARC-CalF' | 'SCOFF' | 'EAT-26' | 'ESP' | 'TFEQ-R18' | 'DEBQ' | 'MEQ';
  score: number;
  maxScore: number;
  riskLevel: 'none' | 'low' | 'moderate' | 'high' | 'severe';
  interpretation: string;
  completedAt: string;
  completedBy: string;
}

// ============================================
// NCP (Nutrition Care Process)
// ============================================

export type NCPStep = 'screening' | 'assessment' | 'diagnosis' | 'intervention' | 'monitoring';

export interface PESStatement {
  problem: string;
  etiology: string;
  signsSymptoms: string[];
  problemCode: string; // NCPT terminology
  etiologyCode: string;
  signsCodes: string[];
}

export interface NCPGap {
  step: NCPStep;
  description: string;
  required: boolean;
  completed: boolean;
}

export interface NCPTargets {
  energy: { value: number; unit: 'kcal/day'; source: string };
  protein: { value: number; unit: 'g/day'; gPerKg: number; source: string };
  carbohydrates: { value: number; unit: 'g/day'; percent: number; source: string };
  fat: { value: number; unit: 'g/day'; percent: number; source: string };
  fiber: { value: number; unit: 'g/day'; source: string };
  water: { value: number; unit: 'ml/day'; source: string };
  sodium?: { value: number; unit: 'mg/day'; source: string };
  potassium?: { value: number; unit: 'mg/day'; source: string };
}

export interface NCPStatus {
  currentStep: NCPStep;
  stepProgress: Record<NCPStep, { completed: boolean; completedAt?: string }>;
  pesStatements: PESStatement[];
  gaps: NCPGap[];
  targets: NCPTargets;
  completeness: number; // 0-100
  lastUpdated: string;
  updatedBy: string;
}

// ============================================
// GLIM (Global Leadership Initiative on Malnutrition)
// ============================================

export interface GLIMCriteria {
  phenotypic: {
    weightLoss: { present: boolean; percent: number; period: string; severity: 'none' | 'moderate' | 'severe' };
    lowBMI: { present: boolean; bmi: number; threshold: number; severity: 'none' | 'moderate' | 'severe' };
    reducedMuscleMass: { present: boolean; method: string; value: number; threshold: number; severity: 'none' | 'moderate' | 'severe' };
  };
  etiologic: {
    reducedIntake: { present: boolean; percentOfNeeds: number; duration: string };
    inflammation: { present: boolean; crp: number; diagnosis: string };
  };
}

export interface GLIMDiagnosis {
  hasDiagnosis: boolean;
  severity: 'none' | 'moderate' | 'severe';
  phenotype: 'moderate' | 'severe';
  criteria: GLIMCriteria;
  phenotypicScore: number; // 0-3
  etiologicScore: number; // 0-2
  confidence: 'high' | 'moderate' | 'low';
  diagnosisDate: string;
  recommendedActions: string[];
}

// ============================================
// ESPEN Guidelines Targets
// ============================================

export interface ESPENTargets {
  energy: { value: number; unit: 'kcal/day'; range: [number, number]; grade: 'A' | 'B' | 'GPP'; reference: string };
  protein: { value: number; unit: 'g/day'; gPerKg: number; range: [number, number]; grade: 'A' | 'B' | 'GPP'; reference: string };
  carbohydrates: { value: number; unit: 'g/day'; percent: number; grade: 'A' | 'B' | 'GPP' };
  fat: { value: number; unit: 'g/day'; percent: number; grade: 'A' | 'B' | 'GPP' };
  fiber: { value: number; unit: 'g/day'; grade: 'A' | 'B' | 'GPP' };
  water: { value: number; unit: 'ml/day'; grade: 'A' | 'B' | 'GPP' };
  micronutrients: Record<string, { value: number; unit: string; grade: 'A' | 'B' | 'GPP' }>;
  // Condition-specific adjustments
  conditionAdjustments: {
    condition: string;
    energyAdjustment?: number;
    proteinAdjustment?: number;
    notes: string[];
  }[];
  adherenceStatus: 'not_assessed' | 'below' | 'within' | 'above';
  lastGuidelineUpdate: string;
}

// ============================================
// Nutrition Support (PN/EN)
// ============================================

export interface PNPrescription {
  id: string;
  accessType: 'central' | 'peripheral';
  aminoAcids: { g: number; gPerKg: number; product: string };
  dextrose: { g: number; gPerKg: number; concentration: number };
  lipids: { g: number; gPerKg: number; product: string; omega3: boolean };
  electrolytes: {
    sodium: number; potassium: number; magnesium: number;
    phosphate: number; calcium: number; acetate: number;
  };
  vitamins: { product: string; volume: number };
  traceElements: { product: string; volume: number };
  totalVolume: number;
  totalEnergy: number;
  nonProteinEnergy: number;
  nitrogenBalance: number;
  osmolarity: number;
  infusionRate: number;
  duration: number; // hours
  compatibility: 'verified' | 'warning' | 'error';
  compatibilityNotes: string[];
}

export interface ENPrescription {
  id: string;
  formula: string;
  route: 'gastric' | 'post-pyloric';
  concentration: number; // kcal/ml
  rate: number; // ml/h
  volume: number; // ml/day
  totalEnergy: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  osmolarity: number;
  schedule: 'continuous' | 'bolus' | 'intermittent';
  transitionPlan?: {
    from: string;
    to: string;
    steps: { day: number; rate: number; volume: number }[];
  };
}

export interface PNENPrescription {
  pn?: PNPrescription;
  en?: ENPrescription;
  route: 'PN' | 'EN' | 'PN+EN';
  indication: string;
  goals: string[];
  monitoring: {
    parameter: string;
    frequency: string;
    target: string;
  }[];
  contraindications: string[];
  precautions: string[];
}

// ============================================
// Precision Nutrition
// ============================================

export interface NutrigenomicVariant {
  gene: string;
  rsid: string;
  genotype: string;
  allele: string;
  impact: 'high' | 'moderate' | 'low';
  nutrient: string;
  recommendation: string;
  evidence: 'strong' | 'moderate' | 'emerging';
}

export interface MicrobiomeProfile {
  diversity: 'low' | 'moderate' | 'high';
  enterotype?: string;
  beneficialTaxa: string[];
  detrimentalTaxa: string[];
  scfaProduction: 'low' | 'moderate' | 'high';
  recommendations: string[];
  psychobiotics: { strain: string; dose: string; indication: string; evidence: string }[];
}

export interface NutrigenomicProfile {
  variants: NutrigenomicVariant[];
  methylationRisk: 'low' | 'moderate' | 'high';
  folateRequirement: number; // mcg DFE
  vitaminB12Requirement: number; // mcg
  vitaminDRequirement: number; // IU
  omega3Requirement: number; // mg EPA+DHA
  saltSensitivity: boolean;
  lactoseIntolerance: boolean;
  caffeineMetabolism: 'slow' | 'normal' | 'fast';
}

export interface PrecisionTargets {
  hasGenomics: boolean;
  nutrigenomic?: NutrigenomicProfile;
  microbiome?: MicrobiomeProfile;
  adjustedTargets: {
    energy: { value: number; reason: string };
    protein: { value: number; reason: string };
    carbohydrates: { value: number; reason: string };
    fat: { value: number; reason: string };
    fiber: { value: number; reason: string };
    micronutrients: Record<string, { value: number; reason: string }>;
  };
  dietResponsePrediction: {
    mediterranean: number; // 0-1 probability
    lowCarb: number;
    lowFat: number;
    plantBased: number;
  };
}

// ============================================
// Behavioral & Adherence
// ============================================

export interface EatingBehaviorProfile {
  tfeq: {
    cognitiveRestraint: number;
    uncontrolledEating: number;
    emotionalEating: number;
  };
  debq: {
    restraint: number;
    emotional: number;
    external: number;
  };
  meq: number; // Mindful Eating Questionnaire score
  interpretation: string;
  riskFactors: string[];
}

export interface AdherenceRiskScore {
  score: number; // 0-100
  level: 'low' | 'moderate' | 'high' | 'critical';
  factors: {
    factor: string;
    weight: number;
    present: boolean;
    impact: string;
  }[];
  interventions: {
    type: 'education' | 'behavioral' | 'environmental' | 'support';
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  predictedAdherence: number; // 0-1
}

export interface EDScreeningResult {
  scoff?: { score: number; positive: boolean };
  eat26?: { score: number; riskLevel: 'low' | 'moderate' | 'high' };
  esp?: { score: number; positive: boolean };
  overallRisk: 'none' | 'low' | 'moderate' | 'high';
  recommendedActions: string[];
}

// ============================================
// Sports Nutrition
// ============================================

export interface SportsNutritionProfile {
  isAthlete: boolean;
  sport?: string;
  level?: 'recreational' | 'competitive' | 'elite';
  trainingLoad: {
    hoursPerWeek: number;
    intensity: 'low' | 'moderate' | 'high' | 'mixed';
    sessionsPerWeek: number;
  };
  energyAvailability: {
    value: number; // kcal/kg FFM/day
    status: 'optimal' | 'low' | 'risk' | 'RED-S';
    fmm: number;
  };
  carbPeriodization: {
    enabled: boolean;
    strategy: 'train-low' | 'sleep-low' | 'fuel-for-work' | 'periodized';
    weeklyPlan: {
      day: string;
      carbsGPerKg: number;
      sessionType: string;
    }[];
  };
  supplementPlan: {
    supplement: string;
    dose: string;
    timing: string;
    evidenceGrade: 'A' | 'B' | 'C' | 'D';
    goal: string;
  }[];
  hydrationPlan: {
    sweatRate: number; // L/h
    sodiumLoss: number; // mg/L
    preExercise: { volume: number; sodium: number };
    duringExercise: { volumePerHour: number; sodiumPerHour: number };
    postExercise: { volume: number; sodium: number };
  };
}

// ============================================
// Drug-Nutrient Interactions
// ============================================

export interface DrugNutrientAlert {
  drug: string;
  drugClass: string;
  nutrient: string;
  interactionType: 'absorption' | 'metabolism' | 'excretion' | 'effect' | 'toxicity';
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  mechanism: string;
  clinicalSignificance: string;
  management: string;
  monitoring: string;
  evidenceGrade: 'A' | 'B' | 'C' | 'D';
  source: string;
}

// ============================================
// Planetary Health
// ============================================

export interface PlanetaryHealthScore {
  totalScore: number; // 0-100
  adherenceLevel: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
  foodGroupScores: Record<string, { score: number; target: number; actual: number; unit: string }>;
  environmentalImpact: {
    ghgeKgCO2e: number;
    landUseM2: number;
    waterUseL: number;
    eutrophicationPotential: number;
    biodiversityImpact: number;
  };
  comparedToEATLancet: {
    adherencePercent: number;
    gapFoodGroups: string[];
    excessFoodGroups: string[];
  };
  recommendations: string[];
}

// ============================================
// Bioactives
// ============================================

export interface BioactivesProfile {
  totalPolyphenols: number; // mg/day
  flavonoidClasses: Record<string, number>;
  topSources: { food: string; polyphenols: number; serving: string }[];
  retentionAdjusted: boolean;
  targets: {
    totalPolyphenols: number;
    flavonoids: number;
    specificCompounds: Record<string, number>;
  };
  gaps: string[];
}

// ============================================
// MASTER COMPUTED STATE
// ============================================

export interface PatientComputedState {
  // Metadata
  patientId: string;
  version: number;
  lastComputed: string;
  checksum: string;
  dirtyFields: Set<string>;
  computationLog: ComputationLogEntry[];
  
  // Core Input Data
  demographics: Demographics;
  anthropometry: AnthropometrySnapshot;
  labs: LabSnapshot;
  diagnoses: Diagnosis[];
  screeningResults: ScreeningResult[];
  
  // Derived Clinical State
  ncp: NCPStatus;
  glim: GLIMDiagnosis;
  espenTargets: ESPENTargets;
  pnEnPrescription: PNENPrescription;
  
  // Precision
  precisionTargets: PrecisionTargets;
  nutrigenomicProfile?: NutrigenomicProfile;
  microbiomeProfile?: MicrobiomeProfile;
  
  // Behavioral
  eatingBehavior?: EatingBehaviorProfile;
  adherenceRisk?: AdherenceRiskScore;
  edScreening?: EDScreeningResult;
  
  // Sports
  sportsProfile?: SportsNutritionProfile;
  
  // Advanced
  drugNutrientAlerts: DrugNutrientAlert[];
  planetaryScore?: PlanetaryHealthScore;
  bioactivesProfile?: BioactivesProfile;
  
  // Meta
  computationDurationMs: number;
}

export interface ComputationLogEntry {
  timestamp: string;
  trigger: string;
  modulesRecomputed: string[];
  durationMs: number;
  changedFields: string[];
  success: boolean;
  error?: string;
}

export interface ScreeningToolDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  maxScore: number;
  riskCategories: Array<{
    label: string;
    minScore: number;
    maxScore: number;
    interpretation: string;
  }>;
  fields: Array<{ id: string; label: string; type: string }>;
}

export interface ChangeSet {
  patientId: string;
  source: string;
  changedFields: string[];
  timestamp: string;
  previousValues: Record<string, any>;
  newValues: Record<string, any>;
}

export interface PatientContextHub {
  getContext(patientId: string, forceRefresh?: boolean): Promise<PatientComputedState>;
  computeAll(patientId: string): Promise<PatientComputedState>;
  invalidate(patientId: string, source: string, fields: string[]): Promise<void>;
  updateField(patientId: string, fieldName: string, value: any, source?: string): Promise<PatientComputedState>;
  getEventBus(): any;
  getScopedEventBus(patientId: string): any;
  getStats(patientId: string): any;
  clearCache(patientId: string): void;
  registerModule(module: any): void;
}

export interface ModuleInterface {
  id: string;
  name: string;
  version: string;
  dependencies: string[];
  provides: string[];
  compute(patientId: string, hub: any): Promise<ModuleOutput>;
  onContextChange(patientId: string, changes: ChangeSet): Promise<void>;
  routes: any; // Express Router
  hooks: ModuleHooks;
  tabs: TabDefinition[];
  actions: ActionDefinition[];
}

export interface ModuleOutput {
  moduleId: string;
  success: boolean;
  data: Record<string, any>;
  durationMs: number;
  errors: string[];
  warnings: string[];
}

export interface ModuleHooks {
  onPatientCreate?: (patientId: string) => Promise<void>;
  onPatientUpdate?: (patientId: string, changes: ChangeSet) => Promise<void>;
  onPatientDelete?: (patientId: string) => Promise<void>;
  onContextInvalidate?: (patientId: string, source: string, fields: string[]) => Promise<void>;
}

export interface TabDefinition {
  id: string;
  label: string;
  icon: string;
  order: number;
  condition?: (ctx: PatientComputedState) => boolean;
  badge?: (ctx: PatientComputedState) => string | null;
}

export interface ActionDefinition {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  handler: string;
  priority: 'primary' | 'secondary' | 'critical';
  condition?: (ctx: PatientComputedState) => boolean;
}