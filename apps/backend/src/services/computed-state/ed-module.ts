/**
 * Eating Disorder Screening Module
 * SCOFF, EAT-26, ESP screening with risk stratification
 */

import type {
  ModuleInterface,
  ModuleOutput,
  PatientContextHub,
  ModuleState,
  ChangeSet,
  EDScreeningResult,

} from '../../types/patient-context.js';

interface EDConfig {
  toolsEnabled?: ('SCOFF' | 'EAT26' | 'ESP')[];
  autoScreenThreshold?: number; // BMI threshold
}

export class EDModule implements ModuleInterface {
  id = 'ed-screening';
  name = 'Eating Disorder Screening';
  version = '1.0.0';
  dependencies: string[] = [];
  provides = ['edScreening'];
  
  private config: Required<EDConfig>;
  private hub: PatientContextHub | null = null;

  constructor(config: EDConfig = {}) {
    this.config = {
      toolsEnabled: ['SCOFF', 'EAT26', 'ESP'],
      autoScreenThreshold: 18.5,
      ...config,
    };
  }

  async compute(patientId: string, hub: PatientContextHub): Promise<ModuleOutput> {
    const start = Date.now();
    this.hub = hub;
    
    const state = await hub.getContext(patientId);
    const screening = this.performScreening(state);
    
    return {
      moduleId: 'ed-screening',
      success: true,
      data: { edScreening: screening },
      durationMs: Date.now() - start,
      errors: [],
      warnings: [],
    };
  }

  async onContextChange(patientId: string, changes: ChangeSet): Promise<void> {
    const relevantFields = [
      'anthropometry.bmi',
      'anthropometry.weightChangePercent',
      'eatingBehavior',
      'screeningResults',
    ];
    
    const hasRelevantChange = changes.changedFields.some((f: string) => relevantFields.includes(f));
    
    if (hasRelevantChange && this.hub) {
      const eventBus = this.hub.getEventBus();
      eventBus.emit({
        type: 'ED_SCREENING_COMPLETED',
        patientId,
        timestamp: new Date().toISOString(),
        source: 'ed-screening',
        trigger: 'screening',
      });
    }
  }

  routes = null;
  hooks = {};
  tabs = [
    {
      id: 'ed-screening',
      label: 'ED Screening',
      icon: 'user-check',
      order: 1,
      badge: (ctx: ModuleState) => ctx.edScreening?.overallRisk === 'high' ? '⚠' : null,
    },
  ];
  actions = [];

  private performScreening(state: ModuleState): EDScreeningResult {
    const scoff = this.config.toolsEnabled.includes('SCOFF') ? this.administerSCOFF(state) : undefined;
    const eat26 = this.config.toolsEnabled.includes('EAT26') ? this.administerEAT26(state) : undefined;
    const esp = this.config.toolsEnabled.includes('ESP') ? this.administerESP(state) : undefined;
    
    const overallRisk = this.calculateOverallRisk(scoff, eat26, esp, state);
    const recommendedActions = this.getRecommendedActions(overallRisk);
    
    return {
      scoff,
      eat26,
      esp,
      overallRisk,
      recommendedActions,
    };
  }

  private administerSCOFF(state: ModuleState): EDScreeningResult['scoff'] {
    const eatingBehavior = state.eatingBehavior;
    const bmi = state.anthropometry?.bmi;
    const weightLoss = state.anthropometry?.weightChangePercent || 0;
    
    let score = 0;
    
    if (eatingBehavior) {
      if (eatingBehavior.tfeq?.cognitiveRestraint > 60) score++;
      if (eatingBehavior.tfeq?.uncontrolledEating > 70) score++;
      if (eatingBehavior.tfeq?.emotionalEating > 70) score++;
    }
    
    if (weightLoss > 10) score++;
    
    if (bmi && bmi < 18.5) score++;
    
    return {
      score,
      positive: score >= 2,
    };
  }

  private administerEAT26(state: ModuleState): EDScreeningResult['eat26'] {
    const eatingBehavior = state.eatingBehavior;
    const bmi = state.anthropometry?.bmi;
    const weightLoss = state.anthropometry?.weightChangePercent || 0;
    
    let score = 0;
    
    if (eatingBehavior) {
      score += Math.round(eatingBehavior.tfeq?.cognitiveRestraint / 3.33) || 0;
      score += Math.round(eatingBehavior.tfeq?.uncontrolledEating / 3.33) || 0;
      score += Math.round(eatingBehavior.tfeq?.emotionalEating / 3.33) || 0;
      score += Math.round(eatingBehavior.debq?.restraint / 3.33) || 0;
      score += Math.round(eatingBehavior.debq?.emotional / 3.33) || 0;
      score += Math.round(eatingBehavior.debq?.external / 3.33) || 0;
      
      if (eatingBehavior.meq < 2.5) score += 5;
    }
    
    if (weightLoss > 10) score += 10;
    if (weightLoss > 20) score += 10;
    
    if (bmi && bmi < 17.5) score += 15;
    else if (bmi && bmi < 18.5) score += 10;
    
    const riskLevel = score >= 20 ? 'high' : score >= 11 ? 'moderate' : 'low';
    
    return { score, riskLevel };
  }

  private administerESP(state: ModuleState): EDScreeningResult['esp'] {
    const eatingBehavior = state.eatingBehavior;
    const bmi = state.anthropometry?.bmi;
    
    let score = 0;
    
    if (eatingBehavior) {
      if (eatingBehavior.tfeq?.cognitiveRestraint > 70) score += 2;
      if (eatingBehavior.tfeq?.uncontrolledEating > 75) score += 2;
      if (eatingBehavior.debq?.emotional > 70) score += 1;
    }
    
    if (bmi && bmi < 18.5) score += 2;
    if (bmi && bmi < 17.5) score += 1;
    
    return {
      score,
      positive: score >= 3,
    };
  }

  private calculateOverallRisk(
    scoff: EDScreeningResult['scoff'] | undefined,
    eat26: EDScreeningResult['eat26'] | undefined,
    esp: EDScreeningResult['esp'] | undefined,
    state: ModuleState
  ): EDScreeningResult['overallRisk'] {
    let riskPoints = 0;
    
    if (scoff?.positive) riskPoints += 2;
    if (eat26?.riskLevel === 'high') riskPoints += 3;
    else if (eat26?.riskLevel === 'moderate') riskPoints += 2;
    if (esp?.positive) riskPoints += 2;
    
    const bmi = state.anthropometry?.bmi;
    if (bmi && bmi < 16) riskPoints += 3;
    else if (bmi && bmi < 17.5) riskPoints += 2;
    else if (bmi && bmi < 18.5) riskPoints += 1;
    
    const weightLoss = state.anthropometry?.weightChangePercent || 0;
    if (weightLoss > 20) riskPoints += 2;
    else if (weightLoss > 10) riskPoints += 1;
    
    if (riskPoints >= 7) return 'high';
    if (riskPoints >= 4) return 'moderate';
    if (riskPoints >= 2) return 'low';
    return 'none';
  }

  private getRecommendedActions(risk: EDScreeningResult['overallRisk']): string[] {
    const actions: string[] = [];
    
    switch (risk) {
      case 'high':
        actions.push('Urgent referral to eating disorder specialist');
        actions.push('Multidisciplinary team assessment (psychiatrist, dietitian, therapist)');
        actions.push('Medical stabilization if BMI < 16 or rapid weight loss');
        actions.push('Consider higher level of care (day program, residential)');
        break;
      case 'moderate':
        actions.push('Referral to eating disorder specialist within 2 weeks');
        actions.push('Nutritional rehabilitation with registered dietitian');
        actions.push('CBT-E or FBT referral');
        actions.push('Weekly monitoring of weight, vitals, labs');
        break;
      case 'low':
        actions.push('Psychoeducation on healthy eating and body image');
        actions.push('Monitor at follow-up visits');
        actions.push('Consider brief intervention (MI, CBT-based)');
        break;
      default:
        actions.push('Routine screening at annual visit');
        actions.push('Promote positive body image and intuitive eating');
    }
    
    return actions;
  }
}

export default EDModule;