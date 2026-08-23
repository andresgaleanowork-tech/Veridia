/**
 * Adherence Risk Assessment Module
 * Predicts and monitors patient adherence to nutritional interventions
 */

import type {
  ModuleInterface,
  ModuleOutput,
  PatientContextHub,
  AdherenceRiskScore,
} from '../../types/patient-context.js';

interface AdherenceConfig {
  enablePrediction?: boolean;
  riskThresholds?: {
    low: number;
    moderate: number;
    high: number;
  };
}

export class AdherenceModule implements ModuleInterface {
  id = 'adherence';
  name = 'Adherence Risk Engine';
  version = '1.0.0';
  dependencies: string[] = [];
  provides = ['adherenceRisk'];
  
  private config: Required<AdherenceConfig>;
  private hub: PatientContextHub | null = null;

  constructor(config: AdherenceConfig = {}) {
    this.config = {
      enablePrediction: true,
      riskThresholds: {
        low: 30,
        moderate: 60,
        high: 80,
      },
      ...config,
    };
  }

  async compute(patientId: string, hub: PatientContextHub): Promise<ModuleOutput> {
    const start = Date.now();
    this.hub = hub;
    
    const state = await hub.getContext(patientId);
    const adherenceRisk = this.assessAdherenceRisk(state);
    
    return {
      moduleId: 'adherence',
      success: true,
      data: { adherenceRisk },
      durationMs: Date.now() - start,
      errors: [],
      warnings: [],
    };
  }

  async onContextChange(patientId: string, changes: any): Promise<void> {
    const relevantFields = [
      'adherenceRisk',
      'eatingBehavior',
      'appointments',
      'screeningResults',
      'demographics',
    ];
    
    const hasRelevantChange = changes.changedFields.some((f: string) => relevantFields.includes(f));
    
    if (hasRelevantChange && this.hub) {
      const eventBus = this.hub.getEventBus();
      eventBus.emit({
        type: 'ADHERENCE_RISK_UPDATED',
        patientId,
        timestamp: new Date().toISOString(),
        source: 'adherence',
        trigger: 'screening',
      });
    }
  }

  routes = null;
  hooks = {};
  tabs = [
    {
      id: 'adherence-dashboard',
      label: 'Adherence Dashboard',
      icon: 'chart-line',
      order: 1,
      badge: (ctx: any) => ctx.adherenceRisk?.level === 'high' || ctx.adherenceRisk?.level === 'critical' ? '!' : null,
    },
  ];
  actions = [];

  private assessAdherenceRisk(state: any): AdherenceRiskScore {
    const factors: AdherenceRiskScore['factors'] = [];
    let totalScore = 0;
    const maxScore = 100;
    
    this.assessDemographicFactors(state, factors);
    this.assessClinicalFactors(state, factors);
    this.assessBehavioralFactors(state, factors);
    this.assessSocialFactors(state, factors);
    this.assessTreatmentFactors(state, factors);
    
    factors.forEach(f => {
      if (f.present) totalScore += f.weight;
    });
    
    const normalizedScore = Math.min(100, (totalScore / maxScore) * 100);
    const level = this.getRiskLevel(normalizedScore);
    const interventions = this.generateInterventions(factors, level);
    const predictedAdherence = Math.max(0.1, 1 - normalizedScore / 100);
    
    return {
      score: Math.round(normalizedScore),
      level,
      factors,
      interventions,
      predictedAdherence: Math.round(predictedAdherence * 100) / 100,
    };
  }

  private assessDemographicFactors(state: any, factors: AdherenceRiskScore['factors']): void {
    const age = state.demographics?.age || 0;
    
    if (age > 75) {
      factors.push({
        factor: 'Advanced age (>75)',
        weight: 10,
        present: true,
        impact: 'Cognitive/physical limitations may impair self-management',
      });
    } else if (age > 65) {
      factors.push({
        factor: 'Older adult (>65)',
        weight: 5,
        present: true,
        impact: 'May need simplified regimen',
      });
    }
    
    if (state.demographics?.role === 'patient') {
      factors.push({
        factor: 'Patient role (non-professional)',
        weight: 5,
        present: true,
        impact: 'Lower health literacy baseline',
      });
    }
  }

  private assessClinicalFactors(state: any, factors: AdherenceRiskScore['factors']): void {
    const diagnoses = state.diagnoses || [];
    
    if (diagnoses.some((d: any) => d.code.startsWith('F') || d.code.startsWith('R45'))) {
      factors.push({
        factor: 'Psychiatric diagnosis',
        weight: 15,
        present: true,
        impact: 'Mental health conditions strongly predict non-adherence',
      });
    }
    
    if (diagnoses.some((d: any) => d.code.startsWith('E10') || d.code.startsWith('E11'))) {
      factors.push({
        factor: 'Diabetes mellitus',
        weight: 10,
        present: true,
        impact: 'Complex regimen, lifelong management required',
      });
    }
    
    if (diagnoses.some((d: any) => d.code.startsWith('I10') || d.code.startsWith('I50'))) {
      factors.push({
        factor: 'Cardiovascular disease',
        weight: 8,
        present: true,
        impact: 'Multiple medications, dietary restrictions',
      });
    }
    
    const medCount = state.drugs?.length || 0;
    if (medCount > 5) {
      factors.push({
        factor: 'Polypharmacy (>5 medications)',
        weight: 12,
        present: true,
        impact: 'Pill burden, side effects, scheduling complexity',
      });
    } else if (medCount > 3) {
      factors.push({
        factor: 'Multiple medications (3-5)',
        weight: 6,
        present: true,
        impact: 'Moderate pill burden',
      });
    }
    
    if (state.anthropometry?.bmi && state.anthropometry.bmi < 18.5) {
      factors.push({
        factor: 'Underweight (BMI <18.5)',
        weight: 8,
        present: true,
        impact: 'May indicate existing adherence issues or malabsorption',
      });
    }
  }

  private assessBehavioralFactors(state: any, factors: AdherenceRiskScore['factors']): void {
    const eatingBehavior = state.eatingBehavior;
    
    if (eatingBehavior) {
      if (eatingBehavior.tfeq?.uncontrolledEating > 75) {
        factors.push({
          factor: 'High uncontrolled eating',
          weight: 12,
          present: true,
          impact: 'Impulsive eating undermines structured meal plans',
        });
      }
      
      if (eatingBehavior.tfeq?.emotionalEating > 75) {
        factors.push({
          factor: 'High emotional eating',
          weight: 10,
          present: true,
          impact: 'Eating driven by emotions not hunger',
        });
      }
      
      if (eatingBehavior.debq?.external > 75) {
        factors.push({
          factor: 'High external eating',
          weight: 8,
          present: true,
          impact: 'Responsive to food cues, difficult portion control',
        });
      }
      
      if (eatingBehavior.meq < 2.5) {
        factors.push({
          factor: 'Low mindful eating',
          weight: 6,
          present: true,
          impact: 'Reduced awareness of hunger/satiety cues',
        });
      }
    }
    
    const edScreening = state.edScreening;
    if (edScreening?.overallRisk === 'high' || edScreening?.overallRisk === 'moderate') {
      factors.push({
        factor: 'Eating disorder risk',
        weight: 20,
        present: true,
        impact: 'Highest predictor of nutritional non-adherence',
      });
    }
  }

  private assessSocialFactors(state: any, factors: AdherenceRiskScore['factors']): void {
    const livingAlone = state.demographics?.livingSituation === 'alone';
    if (livingAlone) {
      factors.push({
        factor: 'Lives alone',
        weight: 8,
        present: true,
        impact: 'No meal preparation support, social isolation',
      });
    }
    
    const lowIncome = state.demographics?.incomeLevel === 'low';
    if (lowIncome) {
      factors.push({
        factor: 'Low socioeconomic status',
        weight: 10,
        present: true,
        impact: 'Food insecurity, medication costs, transport barriers',
      });
    }
    
    const lowEducation = state.demographics?.educationLevel === 'primary' || state.demographics?.educationLevel === 'none';
    if (lowEducation) {
      factors.push({
        factor: 'Low health literacy',
        weight: 8,
        present: true,
        impact: 'Difficulty understanding complex instructions',
      });
    }
  }

  private assessTreatmentFactors(state: any, factors: AdherenceRiskScore['factors']): void {
    const hasPNEN = state.pnEnPrescription?.pn || state.pnEnPrescription?.en;
    if (hasPNEN) {
      factors.push({
        factor: 'Artificial nutrition (PN/EN)',
        weight: 15,
        present: true,
        impact: 'Complex regimen, technical skills required, complications',
      });
    }
    
    const complexDiet = state.espenTargets?.conditionAdjustments?.length > 2;
    if (complexDiet) {
      factors.push({
        factor: 'Complex therapeutic diet',
        weight: 10,
        present: true,
        impact: 'Multiple restrictions reduce dietary variety and satisfaction',
      });
    }
    
    const missedAppointments = state.appointments?.filter((a: any) => a.status === 'no-show').length > 2;
    if (missedAppointments) {
      factors.push({
        factor: 'History of missed appointments',
        weight: 12,
        present: true,
        impact: 'Behavioral marker for disengagement',
      });
    }
  }

  private getRiskLevel(score: number): AdherenceRiskScore['level'] {
    if (score >= this.config.riskThresholds.high) return 'critical';
    if (score >= this.config.riskThresholds.moderate) return 'high';
    if (score >= this.config.riskThresholds.low) return 'moderate';
    return 'low';
  }

  private generateInterventions(
    factors: AdherenceRiskScore['factors'],
    level: AdherenceRiskScore['level']
  ): AdherenceRiskScore['interventions'] {
    const interventions: AdherenceRiskScore['interventions'] = [];
    
    const highWeightFactors = factors.filter(f => f.present && f.weight >= 10);
    
    highWeightFactors.forEach(factor => {
      if (factor.factor.includes('Psychiatric') || factor.factor.includes('Eating disorder')) {
        interventions.push({
          type: 'support',
          description: 'Referral to mental health/ED specialist; motivational interviewing',
          priority: 'high',
        });
      }
      if (factor.factor.includes('Polypharmacy')) {
        interventions.push({
          type: 'behavioral',
          description: 'Medication reconciliation; pill organizer; simplify regimen',
          priority: 'high',
        });
      }
      if (factor.factor.includes('Artificial nutrition')) {
        interventions.push({
          type: 'education',
          description: 'Home care nursing training; 24h support line; troubleshooting guide',
          priority: 'high',
        });
      }
      if (factor.factor.includes('Low socioeconomic') || factor.factor.includes('Food insecurity')) {
        interventions.push({
          type: 'environmental',
          description: 'Social work referral; food assistance programs; generic medications',
          priority: 'high',
        });
      }
      if (factor.factor.includes('Cognitive') || factor.factor.includes('Advanced age')) {
        interventions.push({
          type: 'behavioral',
          description: 'Caregiver involvement; simplified written instructions; alarms/reminders',
          priority: 'high',
        });
      }
    });
    
    if (level === 'moderate' || level === 'low') {
      interventions.push({
        type: 'education',
        description: 'Teach-back method; visual aids; recipe handouts; app-based tracking',
        priority: 'medium',
      });
      
      interventions.push({
        type: 'support',
        description: 'Regular follow-up (2-4 weeks); peer support group referral',
        priority: 'medium',
      });
    }
    
    return interventions;
  }
}

export default AdherenceModule;