/**
 * Sports Nutrition Module
 * Energy availability, carb periodization, supplement planning, hydration
 */

import type {
  ModuleInterface,
  ModuleOutput,
  PatientContextHub,
  SportsNutritionProfile,
} from '../../types/patient-context.js';

interface SportsConfig {
  enableREDsScreening?: boolean;
  defaultSweatRate?: number;
  defaultSodiumLoss?: number;
}

export class SportsModule implements ModuleInterface {
  id = 'sports';
  name = 'Sports Nutrition Engine';
  version = '1.0.0';
  dependencies: string[] = ['espen', 'adherence'];
  provides = ['sportsProfile'];
  
  private config: Required<SportsConfig>;
  private hub: PatientContextHub | null = null;

  constructor(config: SportsConfig = {}) {
    this.config = {
      enableREDsScreening: true,
      defaultSweatRate: 1.2,
      defaultSodiumLoss: 800,
      ...config,
    };
  }

  async compute(patientId: string, hub: PatientContextHub): Promise<ModuleOutput> {
    const start = Date.now();
    this.hub = hub;
    
    const state = await hub.getContext(patientId);
    const profile = this.calculateSportsProfile(state);
    
    return {
      moduleId: 'sports',
      success: true,
      data: { sportsProfile: profile },
      durationMs: Date.now() - start,
      errors: [],
      warnings: [],
    };
  }

  async onContextChange(patientId: string, changes: any): Promise<void> {
    const relevantFields = [
      'anthropometry',
      'sportsProfile',
      'trainingLoad',
      'energyAvailability',
    ];
    
    const hasRelevantChange = changes.changedFields.some((f: string) => relevantFields.includes(f));
    
    if (hasRelevantChange && this.hub) {
      const eventBus = this.hub.getEventBus();
      eventBus.emit({
        type: 'SPORTS_PROFILE_UPDATED',
        patientId,
        timestamp: new Date().toISOString(),
        source: 'sports',
        trigger: 'screening',
      });
    }
  }

  routes = null;
  hooks = {};
  tabs = [
    {
      id: 'energy-availability',
      label: 'Energy Availability',
      icon: 'bolt',
      order: 1,
    },
    {
      id: 'carb-periodization',
      label: 'Carb Periodization',
      icon: 'bread-slice',
      order: 2,
    },
    {
      id: 'supplements',
      label: 'Supplements',
      icon: 'pills',
      order: 3,
    },
    {
      id: 'hydration',
      label: 'Hydration',
      icon: 'tint',
      order: 4,
    },
  ];
  actions = [];

  private calculateSportsProfile(state: any): SportsNutritionProfile {
    const anthropometry = state.anthropometry;
    const weight = anthropometry?.weight || 70;
    const bodyFat = anthropometry?.bodyFat || 15;
    const ffm = weight * (1 - bodyFat / 100);
    
    const isAthlete = state.demographics?.isAthlete || false;
    const sport = state.demographics?.sport || 'general';
    const level = state.demographics?.sportLevel || 'recreational';
    
    const trainingLoad = this.calculateTrainingLoad(state, level);
    const energyAvailability = this.calculateEnergyAvailability(state, ffm, trainingLoad);
    const carbPeriodization = this.calculateCarbPeriodization(state, trainingLoad, energyAvailability);
    const supplementPlan = this.generateSupplementPlan(state, energyAvailability);
    const hydrationPlan = this.generateHydrationPlan(state, trainingLoad);
    
    return {
      isAthlete,
      sport,
      level,
      trainingLoad,
      energyAvailability,
      carbPeriodization,
      supplementPlan,
      hydrationPlan,
    };
  }

  private calculateTrainingLoad(state: any, level: string): SportsNutritionProfile['trainingLoad'] {
    const hoursPerWeek = state.trainingHoursPerWeek || this.getDefaultHours(level);
    const sessionsPerWeek = state.sessionsPerWeek || Math.round(hoursPerWeek / 1.5);
    const intensity = this.determineIntensity(state, level);
    
    return {
      hoursPerWeek,
      intensity,
      sessionsPerWeek,
    };
  }

  private getDefaultHours(level: string): number {
    switch (level) {
      case 'elite': return 20;
      case 'competitive': return 12;
      default: return 5;
    }
  }

  private determineIntensity(state: any, level: string): SportsNutritionProfile['trainingLoad']['intensity'] {
    const hasHighIntensity = state.highIntensitySessions > 3;
    const hasMixed = state.highIntensitySessions > 0 && state.lowIntensitySessions > 0;
    
    if (hasHighIntensity && !hasMixed) return 'high';
    if (hasMixed) return 'mixed';
    if (level === 'elite') return 'high';
    if (level === 'competitive') return 'moderate';
    return 'low';
  }

  private calculateEnergyAvailability(state: any, ffm: number, trainingLoad: SportsNutritionProfile['trainingLoad']): SportsNutritionProfile['energyAvailability'] {
    const exerciseEnergyExpenditure = this.estimateEEE(trainingLoad);
    const dietaryIntake = state.dietaryIntake?.energy || 2000;
    
    const value = (dietaryIntake - exerciseEnergyExpenditure) / ffm;
    
    let status: SportsNutritionProfile['energyAvailability']['status'] = 'optimal';
    if (value < 20) status = 'RED-S';
    else if (value < 30) status = 'risk';
    else if (value < 40) status = 'low';
    else if (value < 45) status = 'optimal';
    
    return {
      value: Math.round(value * 10) / 10,
      status,
      fmm: Math.round(ffm * 10) / 10,
    };
  }

  private estimateEEE(trainingLoad: SportsNutritionProfile['trainingLoad']): number {
    const metValues = { low: 4, moderate: 6, high: 8, mixed: 6 };
    const met = metValues[trainingLoad.intensity];
    return met * trainingLoad.hoursPerWeek * 60 / 7;
  }

  private calculateCarbPeriodization(
    state: any,
    trainingLoad: SportsNutritionProfile['trainingLoad'],
    energyAvailability: SportsNutritionProfile['energyAvailability']
  ): SportsNutritionProfile['carbPeriodization'] {
    const enabled = energyAvailability.status !== 'RED-S' && trainingLoad.hoursPerWeek > 6;
    const strategy = this.selectStrategy(state, trainingLoad, energyAvailability);
    const weeklyPlan = this.generateWeeklyCarbPlan(strategy, trainingLoad);
    
    return {
      enabled,
      strategy,
      weeklyPlan,
    };
  }

  private selectStrategy(
    state: any,
    trainingLoad: SportsNutritionProfile['trainingLoad'],
    energyAvailability: SportsNutritionProfile['energyAvailability']
  ): SportsNutritionProfile['carbPeriodization']['strategy'] {
    if (energyAvailability.status === 'RED-S' || energyAvailability.status === 'risk') {
      return 'fuel-for-work';
    }
    
    if (trainingLoad.intensity === 'high') {
      return 'train-low';
    }
    
    if (trainingLoad.intensity === 'mixed') {
      return 'periodized';
    }
    
    return 'fuel-for-work';
  }

  private generateWeeklyCarbPlan(
    strategy: SportsNutritionProfile['carbPeriodization']['strategy'],
    trainingLoad: SportsNutritionProfile['trainingLoad']
  ): SportsNutritionProfile['carbPeriodization']['weeklyPlan'] {
    const baseCarbs = trainingLoad.intensity === 'high' ? 7 : trainingLoad.intensity === 'moderate' ? 5 : 3;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return days.map((day, i) => {
      let carbsGPerKg = baseCarbs;
      let sessionType = 'rest';
      
      if (i % 2 === 0) {
        sessionType = 'high';
        carbsGPerKg = strategy === 'train-low' ? baseCarbs - 2 : baseCarbs + 2;
      } else if (i % 3 === 0) {
        sessionType = 'moderate';
        carbsGPerKg = baseCarbs;
      } else {
        sessionType = 'recovery';
        carbsGPerKg = strategy === 'fuel-for-work' ? baseCarbs - 1 : baseCarbs;
      }
      
      return { day, carbsGPerKg: Math.max(2, carbsGPerKg), sessionType };
    });
  }

  private generateSupplementPlan(state: any, energyAvailability: SportsNutritionProfile['energyAvailability']): SportsNutritionProfile['supplementPlan'] {
    const plan: SportsNutritionProfile['supplementPlan'] = [];
    
    if (energyAvailability.status === 'low' || energyAvailability.status === 'risk') {
      plan.push({
        supplement: 'Vitamin D3',
        dose: '2000-4000 IU/day',
        timing: 'With largest meal',
        evidenceGrade: 'A',
        goal: 'Bone health, immune function in low EA',
      });
      plan.push({
        supplement: 'Calcium',
        dose: '1000-1500 mg/day',
        timing: 'Split doses with meals',
        evidenceGrade: 'A',
        goal: 'Bone mineral density protection',
      });
    }
    
    const sport = state.demographics?.sport || 'general';
    
    if (['endurance', 'triathlon', 'marathon', 'cycling'].includes(sport)) {
      plan.push({
        supplement: 'Beta-alanine',
        dose: '3.2-6.4 g/day (divided)',
        timing: 'Chronic loading',
        evidenceGrade: 'A',
        goal: 'Intramuscular carnosine, high-intensity performance',
      });
      plan.push({
        supplement: 'Nitrate (beetroot juice)',
        dose: '6-8 mmol (~70ml concentrate)',
        timing: '2-3h pre-exercise',
        evidenceGrade: 'A',
        goal: 'Reduced O2 cost, improved efficiency',
      });
    }
    
    if (['strength', 'power', 'sprint', 'team'].includes(sport)) {
      plan.push({
        supplement: 'Creatine monohydrate',
        dose: '3-5 g/day',
        timing: 'Anytime, consistent',
        evidenceGrade: 'A',
        goal: 'Increased phosphocreatine, power output',
      });
      plan.push({
        supplement: 'Beta-alanine',
        dose: '3.2-6.4 g/day (divided)',
        timing: 'Chronic loading',
        evidenceGrade: 'A',
        goal: 'Buffering capacity, repeated sprint ability',
      });
    }
    
    plan.push({
      supplement: 'Caffeine',
      dose: '3-6 mg/kg',
      timing: '60 min pre-exercise',
      evidenceGrade: 'A',
      goal: 'Reduced RPE, improved endurance/power',
    });
    
    if (state.dietaryIntake?.iron < 18) {
      plan.push({
        supplement: 'Iron (if ferritin <30)',
        dose: '60-100 mg elemental Fe/day',
        timing: 'With vitamin C, away from tea/coffee',
        evidenceGrade: 'B',
        goal: 'Prevent iron deficiency anemia',
      });
    }
    
    return plan;
  }

  private generateHydrationPlan(state: any, trainingLoad: SportsNutritionProfile['trainingLoad']): SportsNutritionProfile['hydrationPlan'] {
    const sweatRate = state.sweatRate || this.config.defaultSweatRate;
    const sodiumLoss = state.sodiumLoss || this.config.defaultSodiumLoss;
    const weight = state.anthropometry?.weight || 70;
    
    return {
      sweatRate,
      sodiumLoss,
      preExercise: {
        volume: 5 * weight,
        sodium: 300,
      },
      duringExercise: {
        volumePerHour: Math.min(sweatRate * 1000, 800),
        sodiumPerHour: sodiumLoss * Math.min(sweatRate, 0.8),
      },
      postExercise: {
        volume: 1.5 * sweatRate * trainingLoad.hoursPerWeek * 1000 / 7,
        sodium: sodiumLoss,
      },
    };
  }
}

export default SportsModule;