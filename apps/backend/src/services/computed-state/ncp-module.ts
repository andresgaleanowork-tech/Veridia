/**
 * NCP (Nutrition Care Process) Module
 * Implements 5-step Nutrition Care Process with PES statements and gap analysis
 */

import type {
  ModuleInterface,
  ModuleOutput,
  PatientContextHub,
  NCPStatus,
  NCPStep,
  PESStatement,
  NCPGap,
  NCPTargets,
  ActionDefinition,
} from '../../types/patient-context.js';

interface NCPConfig {
  enablePESTags?: boolean;
  generateRationale?: boolean;
  targetSources?: string[];
}

export class NCPModule implements ModuleInterface {
  id = 'ncp';
  name = 'Nutrition Care Process';
  version = '1.0.0';
  dependencies: string[] = [];
  provides = ['ncp'];
  
  private config: Required<NCPConfig>;
  private hub: PatientContextHub | null = null;

  constructor(config: NCPConfig = {}) {
    this.config = {
      enablePESTags: true,
      generateRationale: true,
      targetSources: ['ESPEN', 'ASPEN', 'NKF'],
      ...config,
    };
  }

  async compute(patientId: string, hub: PatientContextHub): Promise<ModuleOutput> {
    const start = Date.now();
    this.hub = hub;
    
    const state = await hub.getContext(patientId);
    
    const ncpStatus = this.buildNCPStatus(state);
    
    return {
      moduleId: 'ncp',
      success: true,
      data: { ncp: ncpStatus },
      durationMs: Date.now() - start,
      errors: [],
      warnings: [],
    };
  }

  async onContextChange(): Promise<void> {}

  routes = null;
  hooks = {
    onPatientCreate: async () => {
      await this.initializeNCP();
    },
  };
  tabs = [
    {
      id: 'ncp-assessment',
      label: 'Assessment',
      icon: 'stethoscope',
      order: 1,
    },
    {
      id: 'ncp-PES',
      label: 'PES Statements',
      icon: 'file-alt',
      order: 2,
    },
    {
      id: 'ncp-intervention',
      label: 'Intervention',
      icon: 'dumbbell',
      order: 3,
    },
    {
      id: 'ncp-monitoring',
      label: 'Monitoring',
      icon: 'chart-line',
      order: 4,
    },
  ];
  actions: ActionDefinition[] = [
    {
      id: 'ncp-next-step',
      label: 'Next Step',
      icon: 'arrow-right',
      shortcut: '⌘->',
      handler: 'nextStep',
      priority: 'primary',
    },
    {
      id: 'ncp-generate-PES',
      label: 'Generate PES',
      icon: 'codepen',
      handler: 'generatePES',
      priority: 'secondary',
    },
  ];

  private buildNCPStatus(state: any): NCPStatus {
    const currentStep = this.determineCurrentStep(state);
    const completeness = this.calculateCompleteness(state);
    const targetSources = this.selectTargetSources();
    
    return {
      currentStep,
      stepProgress: this.buildStepProgress(state),
      pesStatements: this.generatePES(state),
      gaps: this.identifyGaps(state),
      targets: this.calculateTargets(state, targetSources),
      completeness,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'ncp-module',
    };
  }

  private determineCurrentStep(state: any): NCPStep {
    const hasDemographics = !!state.demographics;
    const hasAnthropometry = !!state.anthropometry?.weight;
    const hasScreening = state.screeningResults?.length > 0;
    const hasDiagnoses = state.diagnoses?.length > 0;
    const hasPlan = !!state.ncp?.targets?.energy;
    const hasMonitoring = state.anthropometry?.weightChangePercent !== undefined;
    
    if (!hasDemographics) return 'screening';
    if (!hasAnthropometry) return 'assessment';
    if (!hasScreening) return 'diagnosis';
    if (!hasDiagnoses) return 'diagnosis';
    if (!hasPlan) return 'intervention';
    if (!hasMonitoring) return 'monitoring';
    
    return 'monitoring';
  }

  private calculateCompleteness(state: any): number {
    const scores: number[] = [];
    
    scores.push(state.demographics ? 10 : 0);
    if (state.anthropometry?.weight) scores.push(20);
    else scores.push(10);
    if (state.labs?.albumin || state.labs?.prealbumin) scores.push(20);
    else scores.push(10);
    scores.push(state.screeningResults?.length ? 15 : 0);
    scores.push(state.diagnoses?.length ? 15 : 0);
    scores.push(state.ncp?.targets?.energy ? 10 : 0);
    scores.push(state.anthropometry?.weightChangePercent !== undefined ? 10 : 5);
    
    return Math.min(100, scores.reduce((a, b) => a + b, 0));
  }

  private identifyGaps(state: any): NCPGap[] {
    const gaps: NCPGap[] = [];
    
    if (!state.anthropometry?.weight) {
      gaps.push({
        step: 'assessment',
        description: 'Anthropometric data missing',
        required: true,
        completed: false,
      });
    }
    
    if (!state.labs?.albumin && !state.labs?.prealbumin) {
      gaps.push({
        step: 'assessment',
        description: 'Protein status markers missing (albumin/prealbumin)',
        required: true,
        completed: false,
      });
    }
    
    if (!state.screeningResults || state.screeningResults.length === 0) {
      gaps.push({
        step: 'diagnosis',
        description: 'Nutritional screening not completed',
        required: true,
        completed: false,
      });
    }
    
    if (!state.diagnoses || state.diagnoses.length === 0) {
      gaps.push({
        step: 'diagnosis',
        description: 'Medical diagnosis information missing',
        required: true,
        completed: false,
      });
    }
    
    if (!state.ncp?.targets?.energy) {
      gaps.push({
        step: 'intervention',
        description: 'Energy targets not calculated',
        required: true,
        completed: false,
      });
    }
    
    return gaps;
  }

  private generatePES(state: any): PESStatement[] {
    const statements: PESStatement[] = [];
    
    if (state.anthropometry?.bmi) {
      const bmiCategory = this.categorizeBMI(state.anthropometry.bmi);
      if (bmiCategory !== 'normal') {
        statements.push({
          problem: `Patient presents with ${bmiCategory} BMI`,
          etiology: 'Inadequate dietary intake and/or malabsorption',
          signsSymptoms: [],
          problemCode: bmiCategory === 'underweight' ? 'Z78.81' : 'Z78.82',
          etiologyCode: 'R63.0',
          signsCodes: [],
        });
      }
    }
    
    if (state.labs?.albumin !== undefined) {
      if (state.labs.albumin < 3.5) {
        statements.push({
          problem: 'Hypoalbuminemia',
          etiology: 'Protein-calorie malnutrition or chronic disease',
          signsSymptoms: ['Edema', 'Impaired wound healing'],
          problemCode: 'E86.0',
          etiologyCode: 'R63.0',
          signsCodes: ['R63.4'],
        });
      }
    }
    
    return statements;
  }

  private calculateTargets(state: any, sources: string[]): NCPTargets {
    const weight = state.anthropometry?.weight || 70;
    
    let energy = 25 * weight;
    let protein = 1.0 * weight;
    
    if (state.diagnoses) {
      state.diagnoses.forEach((d: any) => {
        if (d.code.startsWith('E')) {
          energy *= 1.2;
          protein *= 1.2;
        }
      });
    }
    
    return {
      energy: { value: energy, unit: 'kcal/day', source: sources[0] || 'estimated' },
      protein: { value: protein, unit: 'g/day', gPerKg: protein / weight, source: sources[0] || 'estimated' },
      carbohydrates: { value: 50 * weight / 25, unit: 'g/day', percent: 50, source: 'balanced' },
      fat: { value: 30 * weight / 25, unit: 'g/day', percent: 30, source: 'balanced' },
      fiber: { value: 25, unit: 'g/day', source: 'recommendation' },
      water: { value: 35 * weight, unit: 'ml/day', source: 'recommendation' },
    };
  }

  private selectTargetSources(): string[] {
    return ['ESPEN', 'ASPEN', 'NKF'];
  }

  private buildStepProgress(state: any): Record<NCPStep, { completed: boolean; completedAt?: string }> {
    return {
      screening: { completed: !!state.screeningResults?.length },
      assessment: { completed: !!state.anthropometry?.weight },
      diagnosis: { completed: !!state.diagnoses?.length },
      intervention: { completed: !!state.ncp?.targets?.energy },
      monitoring: { completed: state.anthropometry?.weightChangePercent !== undefined },
    };
  }

  private categorizeBMI(bmi: number): string {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
  }

  private async initializeNCP(): Promise<void> {}
}

export default NCPModule;
