/**
 * Patient Computed State Types
 * Mirror of apps/backend/src/types/patient-context.ts for frontend
 */

export interface Demographics {
  age?: number;
  sex?: string;
  weight?: number;
  height?: number;
  bmi?: number;
  waistCircumference?: number;
  calfCircumference?: number;
  bodyFatPercent?: number;
  muscleMass?: number;
  visceralFat?: number;
}

export interface Anthropometry {
  weight?: number;
  height?: number;
  bmi?: number;
  waistCircumference?: number;
  calfCircumference?: number;
  bodyFatPercent?: number;
  muscleMass?: number;
  visceralFat?: number;
}

export interface LabValues {
  albumin?: number;
  crp?: number;
  prealbumin?: number;
  glucose?: number;
  creatinine?: number;
  cholesterol?: number;
  triglycerides?: number;
  hemoglobin?: number;
  lymphocytes?: number;
  [key: string]: number | undefined;
}

// NCP
export interface NCPStep { id: string; name: string; completed: boolean; data?: Record<string, unknown> }
export interface PESStatement { problem: string; etiology: string; signs: string; priority: 'high' | 'medium' | 'low' }
export interface NCPStatus {
  currentStep: string; steps: NCPStep[]; pesStatements: PESStatement[]; completenessScore: number;
  lastUpdated: string; clinicalDiagnoses: string[]; nutritionDiagnoses: string[]; interventions: string[];
  monitoringPlan: string[]; goals: string[]; riskFactors: string[];
}

// GLIM
export type GLIMSeverity = 'none' | 'moderate' | 'severe';
export type GLIMEtiology = 'acute_disease' | 'chronic_disease' | 'complex';
export interface GLIMDiagnosis {
  diagnosed: boolean; severity: GLIMSeverity;
  criteria: { phenotypic: { weightLoss: { value: number; assessed: boolean }; lowBMI: { value: number; assessed: boolean }; reducedMuscle: { assessed: boolean } }; etiologic: { reducedIntake: { assessed: boolean }; inflammation: { crp?: number; assessed: boolean } } };
  etiology: GLIMEtiology[]; score: number; recommendations: string[];
}

// ESPEN
export interface ESPENTarget { value: number; unit: string; source: string; condition?: string }
export interface ESPENTargets {
  energy: ESPENTarget; protein: ESPENTarget; fluids: ESPENTarget; micronutrients: Record<string, ESPENTarget>;
  pathology: string; adjustedFor: string[]; notes: string[];
}

// PN/EN
export interface PNENPrescription {
  type: 'parenteral' | 'enteral' | 'supplemental' | 'none';
  route: 'oral' | 'tube' | 'iv' | 'mixed';
  energy: { target: number; delivered: number }; protein: { target: number; delivered: number };
  volume: number; osmolarity?: number; additives: string[]; monitoring: string[]; complications: string[]; duration: string;
}

// Drug-Nutrient
export type AlertSeverity = 'contraindicated' | 'major' | 'moderate' | 'minor';
export type AlertStatus = 'active' | 'resolved' | 'acknowledged';
export interface DrugNutrientAlert {
  id: string; drug: string; nutrient: string; severity: AlertSeverity; status: AlertStatus;
  mechanism: string; clinicalEffect: string; recommendation: string; alternativeDrugs?: string[];
  evidence: 'strong' | 'moderate' | 'weak';
}

// Precision
export interface PrecisionTarget {
  nutrient: string; value: number; unit: string;
  source: 'genomic' | 'microbiome' | 'clinical' | 'combined'; confidence: 'high' | 'moderate' | 'low'; notes?: string;
}
export interface PrecisionTargets {
  targets: PrecisionTarget[];
  dietResponsePrediction: { expected: string; confidence: 'high' | 'moderate' | 'low'; modifiers: string[] };
  personalizationScore: number;
}

// Adherence
export type AdherenceRiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export interface AdherenceRiskScore {
  overallScore: number; riskLevel: AdherenceRiskLevel;
  factors: { demographic: number; clinical: number; behavioral: number; social: number; treatment: number };
  interventions: string[]; predictedAdherence: number;
}

// ED Screening
export type EDRiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export interface EDScreeningResult {
  tool: string; score: number; maxScore: number; riskLevel: EDRiskLevel;
  flags: string[]; referral: boolean; questions: { question: string; answer: boolean }[];
}

// Sports
export interface SportsNutritionProfile {
  energyAvailability: { value: number; status: 'low' | 'optimal' | 'risk' | 'RED-S'; fmm: number };
  carbPeriodization: { enabled: boolean; strategy: string; weeklyPlan: { day: string; grams: number; timing: string }[] };
  supplements: { name: string; evidence: string; dosage: string; timing: string; risk: string }[];
  hydrationPlan: { daily: number; preExercise: number; duringExercise: number; postExercise: number; electrolytes: string[] };
}

// Nutrigenomics
export interface NutrigenomicVariant { gene: string; variant: string; impact: string; nutrients: string[]; recommendation: string }
export interface NutrigenomicProfile {
  variants: NutrigenomicVariant[];
  methylDonors: { status: string; recommendation: string };
  detoxification: { status: string; recommendation: string };
  lactoseTolerance: { status: string; recommendation: string };
  caffeineMetabolism: { status: string; recommendation: string };
  ironAbsorption: { status: string; recommendation: string };
  antioxidantDefense: { status: string; recommendation: string };
  omegaMetabolism: { status: string; recommendation: string };
  vitaminD: { status: string; recommendation: string };
}

// Microbiome
export interface MicrobiomeProfile {
  diversity: { score: number; classification: string }; enterotype: string;
  beneficialTaxa: string[]; detrimentalTaxa: string[];
  scfa: { acetate: number; propionate: number; butyrate: number };
  psychobiotics: string[]; prebioticTargets: string[]; fiberTarget: number;
}

// Eating Behavior
export interface EatingBehaviorProfile {
  tfeq: { cognitiveRestraint: number; disinhibition: number; hunger: number };
  debq: { external: number; emotional: number; restrained: number };
  meq: { score: number; classification: string }; phenotype: string;
}

// Bioactives
export interface BioactivesProfile {
  totalPolyphenols: number; flavonoidClasses: Record<string, number>;
  topSources: { food: string; polyphenols: number; serving: string }[];
  retentionAdjusted: boolean;
  targets: { totalPolyphenols: number; flavonoids: number; specificCompounds: Record<string, number> };
  gaps: string[];
}

// Planetary Health
export interface PlanetaryHealthScore {
  overallScore: number; eatLancetAdherence: number;
  environmentalImpact: { ghge: number; landUse: number; waterUse: number; eutrophication: number; biodiversity: number };
  recommendations: string[];
}

// Computation log
export interface ComputationLogEntry { module: string; durationMs: number; timestamp: string; success: boolean }

// Master computed state
export interface PatientComputedState {
  patientId: string; version: number; lastComputed: string; checksum: string;
  computationLog: ComputationLogEntry[];
  demographics: Demographics; anthropometry: Anthropometry; labs: LabValues;
  diagnoses: string[]; screeningResults: string[];
  ncp?: NCPStatus; glim?: GLIMDiagnosis; espenTargets?: ESPENTargets;
  pnEnPrescription?: PNENPrescription; precisionTargets?: PrecisionTargets;
  nutrigenomicProfile?: NutrigenomicProfile; microbiomeProfile?: MicrobiomeProfile;
  eatingBehavior?: EatingBehaviorProfile; adherenceRisk?: AdherenceRiskScore;
  edScreening?: EDScreeningResult; sportsProfile?: SportsNutritionProfile;
  drugNutrientAlerts?: DrugNutrientAlert[];
  bioactivesProfile?: BioactivesProfile; planetaryScore?: PlanetaryHealthScore;
  computationDurationMs: number;
}
