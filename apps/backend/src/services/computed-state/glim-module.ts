/**
 * GLIM (Global Leadership Initiative on Malnutrition) Module
 * Auto-diagnosis from screening + labs + anthropometry
 */

import type { 
  ModuleInterface,
  ModuleOutput,
  PatientContextHub,
  ModuleState,
  ChangeSet,

  GLIMDiagnosis,
  GLIMCriteria,
  Diagnosis,
} from '../../types/patient-context.js';

interface GLIMConfig {
  enableAutoDiagnosis?: boolean;
  includeInflammation?: boolean;
  phenotypeThresholds?: {
    weightLoss: number;
    bmiLow: number;
    muscleMassLow: number;
  };
}

export class GLIMModule implements ModuleInterface {
  id = 'glim';
  name = 'GLIM Diagnosis Engine';
  version = '1.0.0';
  dependencies: string[] = [];
  provides = ['nids.glim'];
  
  private config: Required<GLIMConfig>;
  private hub: PatientContextHub | null = null;

  constructor(config: GLIMConfig = {}) {
    this.config = {
      enableAutoDiagnosis: true,
      includeInflammation: true,
      phenotypeThresholds: {
        weightLoss: 10,
        bmiLow: 18.5,
        muscleMassLow: -2,
      },
      ...config,
    };
  }

  async compute(patientId: string, hub: PatientContextHub): Promise<ModuleOutput> {
    const start = Date.now();
    this.hub = hub;
    
    const state = await hub.getContext(patientId);
    const diagnosis = this.computeGLIM(state);
    
    return {
      moduleId: 'glim',
      success: true,
      data: { nids: { glim: diagnosis } },
      durationMs: Date.now() - start,
      errors: [],
      warnings: [],
    };
  }

  async onContextChange(patientId: string, changes: ChangeSet): Promise<void> {
    const relevantFields = [
      'anthropometry.weight',
      'anthropometry.bmi',
      'labs.albumin',
      'labs.prelabor',
      'labs.crp',
      'labs.inflammation',
      'screeningResults',
    ];
    
    const hasRelevantChange = changes.changedFields.some((f: string) => relevantFields.includes(f));
    
    if (hasRelevantChange && this.hub) {
      await this.invalidate(patientId);
    }
  }

  async invalidate(patientId: string): Promise<void> {
    const eventBus = this.hub?.getEventBus();
    if (eventBus) {
      eventBus.emit({
        type: 'GLIM_RECALCULATED',
        patientId,
        timestamp: new Date().toISOString(),
        source: 'glim',
        trigger: 'screening',
      });
    }
  }

  routes = null;
  hooks = {};
  tabs = [];
  actions = [];

  private computeGLIM(state: ModuleState): GLIMDiagnosis {
    const criteria = this.assessCriteria(state);
    
    const phenotypicScore = this.calculatePhenotypicScore(criteria.phenotypic);
    const etiologicScore = this.calculateEtiologicScore(criteria.etiologic, state);
    
    const hasDiagnosis = phenotypicScore > 0 && etiologicScore > 0;
    const severity = this.determineSeverity(phenotypicScore, etiologicScore);
    
    return {
      hasDiagnosis,
      severity,
      phenotype: this.getPhenotype(phenotypicScore),
      criteria,
      phenotypicScore,
      etiologicScore,
      confidence: this.calculateConfidence(state),
      diagnosisDate: new Date().toISOString(),
      recommendedActions: this.getRecommendations(severity, criteria),
    };
  }

  private assessCriteria(state: ModuleState): GLIMCriteria {
    const phenotypic = {
      weightLoss: this.assessWeightLoss(state),
      lowBMI: this.assessBMI(state),
      reducedMuscleMass: this.assessMuscleMass(state),
    };
    
    const etiologic = {
      reducedIntake: this.assessReducedIntake(state),
      inflammation: this.assessInflammation(state),
    };
    
    return { phenotypic, etiologic };
  }

  private assessWeightLoss(state: ModuleState): GLIMCriteria['phenotypic']['weightLoss'] {
    const weightLoss = state.anthropometry?.weightChangePercent;
    const period = state.anthropometry?.weightChangePeriod || 'unknown';
    
    if (weightLoss === undefined) {
      return { present: false, percent: 0, period: 'N/A', severity: 'none' };
    }
    
    let severity: 'none' | 'moderate' | 'severe' = 'none';
    if (weightLoss >= this.config.phenotypeThresholds.weightLoss) {
      severity = weightLoss >= 20 ? 'severe' : 'moderate';
    }
    
    return {
      present: weightLoss >= this.config.phenotypeThresholds.weightLoss,
      percent: weightLoss,
      period,
      severity,
    };
  }

  private assessBMI(state: ModuleState): GLIMCriteria['phenotypic']['lowBMI'] {
    const bmi = state.anthropometry?.bmi;
    
    if (!bmi) {
      return { present: false, bmi: 0, threshold: 18.5, severity: 'none' };
    }
    
    const threshold = this.config.phenotypeThresholds.bmiLow;
    const present = bmi < threshold;
    const severity = present ? (bmi < 17.5 ? 'severe' : 'moderate') : 'none';
    
    return {
      present,
      bmi,
      threshold,
      severity,
    };
  }

  private assessMuscleMass(state: ModuleState): GLIMCriteria['phenotypic']['reducedMuscleMass'] {
    const hasBodyComp = state.anthropometry?.bodyFat !== undefined || 
                        state.anthropometry?.muscleMass !== undefined;
    
    if (!hasBodyComp) {
      return {
        present: false,
        method: 'N/A',
        value: 0,
        threshold: 0,
        severity: 'none',
      };
    }
    
    const muscleMass = state.anthropometry?.muscleMass;
    const value = muscleMass || 0;
    const threshold = this.config.phenotypeThresholds.muscleMassLow;
    
    const present = value < threshold;
    
    return {
      present,
      method: hasBodyComp ? 'BIA' : 'N/A',
      value,
      threshold,
      severity: present ? 'moderate' : 'none',
    };
  }

  private assessReducedIntake(state: ModuleState): GLIMCriteria['etiologic']['reducedIntake'] {
    const intakeScore = state.nutritionAssessment?.intakeScore;
    
    if (intakeScore === undefined) {
      return { present: false, percentOfNeeds: 100, duration: 'N/A' };
    }
    
    return {
      present: intakeScore < 60,
      percentOfNeeds: intakeScore,
      duration: 'unknown',
    };
  }

  private assessInflammation(state: ModuleState): GLIMCriteria['etiologic']['inflammation'] {
    if (!this.config.includeInflammation) {
      return { present: false, crp: 0, diagnosis: 'none' };
    }
    
    const crp = state.labs?.crp;
    const hasInflammation = crp !== undefined && crp > 5;
    
    return {
      present: hasInflammation,
      crp: crp || 0,
      diagnosis: hasInflammation ? 'inflammatory' : 'none',
    };
  }

  private calculatePhenotypicScore(phenotypic: GLIMCriteria['phenotypic']): number {
    let score = 0;
    
    if (phenotypic.weightLoss.present) score += 1;
    if (phenotypic.lowBMI.present) score += 1;
    if (phenotypic.reducedMuscleMass.present) score += 1;
    
    return score; // 0-3
  }

  private calculateEtiologicScore(etiologic: GLIMCriteria['etiologic'], state: ModuleState): number {
    let score = 0;
    
    if (etiologic.reducedIntake.present) score += 1;
    if (this.config.includeInflammation && etiologic.inflammation.present) score += 1;
    
    const hasDiagnoses = state.diagnoses?.length > 0;
    const hasChronicDisease = state.diagnoses?.some((d: Diagnosis) => 
      d.code.startsWith('E') || d.code.startsWith('N') || d.code.startsWith('C')
    );
    
    if (hasChronicDisease || hasDiagnoses) score += 1;
    
    return score; // 0-3
  }

  private determineSeverity(phenotypicScore: number, etiologicScore: number): 'none' | 'moderate' | 'severe' {
    const total = phenotypicScore + etiologicScore;
    
    if (total === 0) return 'none';
    if (total <= 2) return 'moderate';
    return 'severe';
  }

  private getPhenotype(score: number): 'moderate' | 'severe' {
    return score >= 2 ? 'severe' : 'moderate';
  }

  private calculateConfidence(state: ModuleState): 'high' | 'moderate' | 'low' {
    const dataPoints = [
      state.anthropometry?.weight !== undefined,
      state.anthropometry?.bmi !== undefined,
      state.labs?.albumin !== undefined,
      (state.labResults?.length ?? 0) > 0,
      state.screeningResults?.length > 0,
    ].filter(Boolean).length;
    
    if (dataPoints >= 4) return 'high';
    if (dataPoints >= 2) return 'moderate';
    return 'low';
  }

  private getRecommendations(severity: string, criteria: GLIMCriteria): string[] {
    const recommendations: string[] = [];
    
    if (criteria.phenotypic.weightLoss.present) {
      recommendations.push('Assess cause of weight loss');
      recommendations.push('Review dietary intake and tolerance');
    }
    
    if (criteria.phenotypic.lowBMI.present) {
      recommendations.push('Calculate energy and protein needs');
      recommendations.push('Consider oral nutritional supplementation');
    }
    
    if (criteria.etiologic.inflammation.present) {
      recommendations.push('Address underlying inflammatory condition');
      recommendations.push('Ensure adequate protein intake');
    }
    
    if (severity === 'severe') {
      recommendations.push('Consider specialist nutrition referral');
    }
    
    return recommendations;
  }
}

export default GLIMModule;