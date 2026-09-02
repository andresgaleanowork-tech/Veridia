/**
 * Eating Behavior Profile Module
 * TFEQ, DEBQ, MEQ assessments and behavioral phenotyping
 */

import type {
  ModuleInterface,
  ModuleOutput,
  PatientContextHub,
  ModuleState,
  ChangeSet,
  AnthropometrySnapshot,
  EDScreeningResult,

  EatingBehaviorProfile,
} from '../../types/patient-context.js';

interface EatingBehaviorConfig {
  enableAssessment?: boolean;
  toolsEnabled?: ('TFEQ' | 'DEBQ' | 'MEQ')[];
}

export class EatingBehaviorModule implements ModuleInterface {
  id = 'eating-behavior';
  name = 'Eating Behavior Assessment';
  version = '1.0.0';
  dependencies: string[] = [];
  provides = ['eatingBehavior'];
  
  private config: Required<EatingBehaviorConfig>;
  private hub: PatientContextHub | null = null;

  constructor(config: EatingBehaviorConfig = {}) {
    this.config = {
      enableAssessment: true,
      toolsEnabled: ['TFEQ', 'DEBQ', 'MEQ'],
      ...config,
    };
  }

  async compute(patientId: string, hub: PatientContextHub): Promise<ModuleOutput> {
    const start = Date.now();
    this.hub = hub;
    
    const state = await hub.getContext(patientId);
    const profile = this.assessEatingBehavior(state);
    
    return {
      moduleId: 'eating-behavior',
      success: true,
      data: { eatingBehavior: profile },
      durationMs: Date.now() - start,
      errors: [],
      warnings: [],
    };
  }

  async onContextChange(patientId: string, changes: ChangeSet): Promise<void> {
    const relevantFields = ['eatingBehavior', 'screeningResults', 'anthropometry'];
    
    const hasRelevantChange = changes.changedFields.some((f: string) => relevantFields.includes(f));
    
    if (hasRelevantChange && this.hub) {
      const eventBus = this.hub.getEventBus();
      eventBus.emit({
        type: 'EATING_BEHAVIOR_ASSESSED',
        patientId,
        timestamp: new Date().toISOString(),
        source: 'eating-behavior',
        trigger: 'screening',
      });
    }
  }

  routes = null;
  hooks = {};
  tabs = [
    {
      id: 'tfeq',
      label: 'TFEQ-R18',
      icon: 'clipboard-question',
      order: 1,
    },
    {
      id: 'debq',
      label: 'DEBQ',
      icon: 'clipboard-list',
      order: 2,
    },
    {
      id: 'meq',
      label: 'Mindful Eating',
      icon: 'brain',
      order: 3,
    },
    {
      id: 'phenotype',
      label: 'Behavioral Phenotype',
      icon: 'user-cog',
      order: 4,
    },
  ];
  actions = [];

  private assessEatingBehavior(state: ModuleState): EatingBehaviorProfile {
    const existing = state.eatingBehavior;
    const anthropometry = state.anthropometry;
    const edScreening = state.edScreening;
    
    const tfeq = existing?.tfeq || this.estimateTFEQ(state);
    const debq = existing?.debq || this.estimateDEBQ(state);
    const meq = existing?.meq || this.estimateMEQ(state);
    
    const interpretation = this.interpretProfile(tfeq, debq, meq, anthropometry, edScreening);
    const riskFactors = this.identifyRiskFactors(tfeq, debq, meq, anthropometry, edScreening);
    
    return {
      tfeq,
      debq,
      meq,
      interpretation,
      riskFactors,
    };
  }

  private estimateTFEQ(state: ModuleState) {
    const anthropometry = state.anthropometry;
    const weightChange = anthropometry?.weightChangePercent || 0;
    const bmi = anthropometry?.bmi || 25;
    const edScreening = state.edScreening;
    
    let cognitiveRestraint = 50;
    let uncontrolledEating = 50;
    let emotionalEating = 50;
    
    if (bmi > 30) {
      cognitiveRestraint += 15;
      uncontrolledEating += 10;
      emotionalEating += 10;
    } else if (bmi > 25) {
      cognitiveRestraint += 10;
      uncontrolledEating += 5;
      emotionalEating += 5;
    }
    
    if (weightChange > 10) {
      cognitiveRestraint += 10;
    } else if (weightChange < -10) {
      uncontrolledEating += 15;
      emotionalEating += 10;
    }
    
    if (edScreening?.overallRisk === 'high') {
      cognitiveRestraint += 20;
      uncontrolledEating += 20;
      emotionalEating += 20;
    } else if (edScreening?.overallRisk === 'moderate') {
      cognitiveRestraint += 10;
      uncontrolledEating += 10;
      emotionalEating += 10;
    }
    
    if (state.dietaryIntake?.dietingHistory) {
      cognitiveRestraint += 15;
    }
    
    if ((state.dietaryIntake?.bingeEpisodes ?? 0) > 1) {
      uncontrolledEating += 20;
      emotionalEating += 15;
    }
    
    return {
      cognitiveRestraint: Math.min(100, cognitiveRestraint),
      uncontrolledEating: Math.min(100, uncontrolledEating),
      emotionalEating: Math.min(100, emotionalEating),
    };
  }

  private estimateDEBQ(state: ModuleState) {
    const anthropometry = state.anthropometry;
    const eatingBehavior = state.eatingBehavior;
    const bmi = anthropometry?.bmi || 25;
    
    let restraint = 50;
    let emotional = 50;
    let external = 50;
    
    if (bmi > 30) {
      restraint += 10;
      external += 15;
      emotional += 10;
    } else if (bmi < 18.5) {
      restraint += 20;
      emotional += 5;
    }
    
    if ((eatingBehavior?.tfeq?.cognitiveRestraint ?? 0) > 60) {
      restraint += 15;
    }
    
    if ((eatingBehavior?.tfeq?.emotionalEating ?? 0) > 60) {
      emotional += 20;
    }
    
    if ((eatingBehavior?.tfeq?.uncontrolledEating ?? 0) > 60) {
      external += 15;
    }
    
    if ((state.dietaryIntake?.snackFrequency ?? 0) > 3) {
      external += 10;
    }
    
    if ((state.dietaryIntake?.eatOutFrequency ?? 0) > 3) {
      external += 10;
    }
    
    return {
      restraint: Math.min(100, restraint),
      emotional: Math.min(100, emotional),
      external: Math.min(100, external),
    };
  }

  private estimateMEQ(state: ModuleState): number {
    const eatingBehavior = state.eatingBehavior;
    const anthropometry = state.anthropometry;
    
    let meq = 3.0;
    
    if ((eatingBehavior?.tfeq?.emotionalEating ?? 0) > 70) meq -= 0.8;
    if ((eatingBehavior?.tfeq?.uncontrolledEating ?? 0) > 70) meq -= 0.8;
    if ((eatingBehavior?.debq?.external ?? 0) > 70) meq -= 0.5;
    if ((eatingBehavior?.debq?.emotional ?? 0) > 70) meq -= 0.5;
    
    if (anthropometry?.bmi !== undefined && anthropometry.bmi > 30) meq -= 0.3;
    if (anthropometry?.bmi !== undefined && anthropometry.bmi < 18.5) meq -= 0.3;
    
    if (state.dietaryIntake?.mindfulEatingPractice) meq += 0.5;
    if (state.dietaryIntake?.distractedEating) meq -= 0.5;
    
    return Math.max(1.0, Math.min(4.0, meq));
  }

  private interpretProfile(
    tfeq: EatingBehaviorProfile['tfeq'],
    debq: EatingBehaviorProfile['debq'],
    meq: number,
    anthropometry: AnthropometrySnapshot,
    edScreening: EDScreeningResult | undefined
  ): string {
    const interpretations: string[] = [];
    
    if (tfeq.cognitiveRestraint > 75) {
      interpretations.push('High cognitive restraint - rigid dietary rules, risk of disinhibition');
    } else if (tfeq.cognitiveRestraint > 50) {
      interpretations.push('Moderate cognitive restraint - conscious weight control');
    }
    
    if (tfeq.uncontrolledEating > 75) {
      interpretations.push('High uncontrolled eating - loss of control over eating, binge risk');
    } else if (tfeq.uncontrolledEating > 50) {
      interpretations.push('Moderate uncontrolled eating - occasional overeating episodes');
    }
    
    if (tfeq.emotionalEating > 75) {
      interpretations.push('High emotional eating - eating in response to negative emotions');
    } else if (tfeq.emotionalEating > 50) {
      interpretations.push('Moderate emotional eating - some emotion-driven consumption');
    }
    
    if (debq.restraint > 75) {
      interpretations.push('High restrained eating - chronic dieting mentality');
    }
    
    if (debq.emotional > 75) {
      interpretations.push('High emotional eating (DEBQ) - strong emotion-food link');
    }
    
    if (debq.external > 75) {
      interpretations.push('High external eating - strong responsiveness to food cues');
    }
    
    if (meq < 2.5) {
      interpretations.push('Low mindful eating - distracted, automatic eating patterns');
    } else if (meq > 3.5) {
      interpretations.push('High mindful eating - present-focused, intuitive approach');
    }
    
    if (edScreening?.overallRisk === 'high') {
      interpretations.push('⚠ EATING DISORDER RISK: Urgent specialist referral needed');
    } else if (edScreening?.overallRisk === 'moderate') {
      interpretations.push('⚠ Eating disorder risk: Monitor closely, consider referral');
    }
    
    return interpretations.length > 0 ? interpretations.join('; ') : 'No significant behavioral concerns identified';
  }

  private identifyRiskFactors(
    tfeq: EatingBehaviorProfile['tfeq'],
    debq: EatingBehaviorProfile['debq'],
    meq: number,
    anthropometry: AnthropometrySnapshot,
    edScreening: EDScreeningResult | undefined
  ): string[] {
    const factors: string[] = [];
    
    if (tfeq.cognitiveRestraint > 75) factors.push('High cognitive restraint (TFEQ)');
    if (tfeq.uncontrolledEating > 75) factors.push('High uncontrolled eating (TFEQ)');
    if (tfeq.emotionalEating > 75) factors.push('High emotional eating (TFEQ)');
    if (debq.restraint > 75) factors.push('High restrained eating (DEBQ)');
    if (debq.emotional > 75) factors.push('High emotional eating (DEBQ)');
    if (debq.external > 75) factors.push('High external eating (DEBQ)');
    if (meq < 2.5) factors.push('Low mindful eating (MEQ)');
    if (edScreening?.overallRisk === 'high') factors.push('Eating disorder risk: HIGH');
    else if (edScreening?.overallRisk === 'moderate') factors.push('Eating disorder risk: MODERATE');
    if (anthropometry?.bmi && anthropometry.bmi < 18.5) factors.push('Underweight (BMI <18.5)');
    if (anthropometry?.weightChangePercent && anthropometry.weightChangePercent < -10) factors.push('Rapid weight loss >10%');
    
    return factors;
  }
}

export default EatingBehaviorModule;