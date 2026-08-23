/**
 * Planetary Health Module
 * EAT-Lancet dietary targets and environmental impact assessment
 */

import type {
  ModuleInterface,
  ModuleOutput,
  PatientContextHub,
  PlanetaryHealthScore,
} from '../../types/patient-context.js';

interface PlanetaryConfig {
  enableAssessment?: boolean;
  useEATLancetTargets?: boolean;
}

const EAT_LANCET_TARGETS = {
  wholeGrains: { target: 232, unit: 'g/day' },
  tubers: { target: 50, unit: 'g/day' },
  vegetables: { target: 300, unit: 'g/day' },
  fruits: { target: 200, unit: 'g/day' },
  dairy: { target: 250, unit: 'g/day' },
  proteinSources: {
    beefLamb: { target: 7, unit: 'g/day' },
    pork: { target: 7, unit: 'g/day' },
    poultry: { target: 29, unit: 'g/day' },
    eggs: { target: 13, unit: 'g/day' },
    fish: { target: 28, unit: 'g/day' },
    legumes: { target: 75, unit: 'g/day' },
    nuts: { target: 50, unit: 'g/day' },
  },
  addedFats: {
    unsaturated: { target: 40, unit: 'g/day' },
    saturated: { target: 11.8, unit: 'g/day' },
  },
  addedSugars: { target: 31, unit: 'g/day' },
};

const ENVIRONMENTAL_FACTORS: Record<string, { ghge: number; land: number; water: number; eutro: number; biodiv: number }> = {
  beefLamb: { ghge: 50, land: 164, water: 15000, eutro: 120, biodiv: 80 },
  pork: { ghge: 7, land: 11, water: 6000, eutro: 25, biodiv: 20 },
  poultry: { ghge: 6, land: 8, water: 4300, eutro: 20, biodiv: 15 },
  eggs: { ghge: 4.5, land: 6, water: 3300, eutro: 15, biodiv: 10 },
  fish: { ghge: 5, land: 1, water: 2000, eutro: 10, biodiv: 30 },
  dairy: { ghge: 3, land: 9, water: 1000, eutro: 15, biodiv: 15 },
  legumes: { ghge: 0.9, land: 1, water: 5000, eutro: 5, biodiv: 5 },
  nuts: { ghge: 0.3, land: 3, water: 9000, eutro: 3, biodiv: 8 },
  wholeGrains: { ghge: 1.4, land: 3, water: 1600, eutro: 4, biodiv: 5 },
  vegetables: { ghge: 0.5, land: 0.5, water: 300, eutro: 2, biodiv: 2 },
  fruits: { ghge: 0.4, land: 0.6, water: 900, eutro: 2, biodiv: 3 },
  unsaturatedFats: { ghge: 1, land: 2, water: 1000, eutro: 3, biodiv: 5 },
  saturatedFats: { ghge: 2, land: 5, water: 500, eutro: 5, biodiv: 5 },
  addedSugars: { ghge: 0.5, land: 0.5, water: 1500, eutro: 2, biodiv: 3 },
};

export class PlanetaryModule implements ModuleInterface {
  id = 'planetary';
  name = 'Planetary Health Engine';
  version = '1.0.0';
  dependencies: string[] = ['espen'];
  provides = ['planetaryScore'];
  
  private config: Required<PlanetaryConfig>;
  private hub: PatientContextHub | null = null;

  constructor(config: PlanetaryConfig = {}) {
    this.config = {
      enableAssessment: true,
      useEATLancetTargets: true,
      ...config,
    };
  }

  async compute(patientId: string, hub: PatientContextHub): Promise<ModuleOutput> {
    const start = Date.now();
    this.hub = hub;
    
    const state = await hub.getContext(patientId);
    const score = this.assessPlanetaryHealth(state);
    
    return {
      moduleId: 'planetary',
      success: true,
      data: { planetaryScore: score },
      durationMs: Date.now() - start,
      errors: [],
      warnings: [],
    };
  }

  async onContextChange(patientId: string, changes: any): Promise<void> {
    const relevantFields = ['dietaryIntake', 'espenTargets'];
    
    const hasRelevantChange = changes.changedFields.some((f: string) => relevantFields.includes(f));
    
    if (hasRelevantChange && this.hub) {
      const eventBus = this.hub.getEventBus();
      eventBus.emit({
        type: 'PLANETARY_SCORE_UPDATED',
        patientId,
        timestamp: new Date().toISOString(),
        source: 'planetary',
        trigger: 'screening',
      });
    }
  }

  routes = null;
  hooks = {};
  tabs = [
    {
      id: 'planetary-score',
      label: 'Planetary Score',
      icon: 'globe',
      order: 1,
      badge: (ctx: any) => ctx.planetaryScore?.adherenceLevel === 'very_high' ? '★' : null,
    },
    {
      id: 'environmental-impact',
      label: 'Environmental Impact',
      icon: 'leaf',
      order: 2,
    },
  ];
  actions = [];

  private assessPlanetaryHealth(state: any): PlanetaryHealthScore {
    const dietaryIntake = state.dietaryIntake || this.estimateIntakeFromTargets(state);
    
    const foodGroupScores = this.calculateFoodGroupScores(dietaryIntake);
    const environmentalImpact = this.calculateEnvironmentalImpact(dietaryIntake);
    const comparedToEATLancet = this.compareToEATLancet(foodGroupScores);
    const totalScore = this.calculateTotalScore(foodGroupScores);
    const adherenceLevel = this.getAdherenceLevel(totalScore);
    const recommendations = this.generateRecommendations(foodGroupScores, comparedToEATLancet);
    
    return {
      totalScore: Math.round(totalScore),
      adherenceLevel,
      foodGroupScores,
      environmentalImpact,
      comparedToEATLancet,
      recommendations,
    };
  }

  private estimateIntakeFromTargets(state: any): Record<string, number> {
    const espen = state.espenTargets || {};
    const energy = espen.energy?.value || 2000;
    const protein = espen.protein?.value || 70;
    const carbs = espen.carbohydrates?.value || 250;
    const fat = espen.fat?.value || 70;
    
    return {
      wholeGrains: carbs * 0.4,
      tubers: carbs * 0.1,
      vegetables: 200,
      fruits: 150,
      dairy: 200,
      beefLamb: protein * 0.1,
      pork: protein * 0.05,
      poultry: protein * 0.2,
      eggs: protein * 0.1,
      fish: protein * 0.15,
      legumes: protein * 0.2,
      nuts: fat * 0.1,
      unsaturatedFats: fat * 0.6,
      saturatedFats: fat * 0.2,
      addedSugars: energy * 0.05,
    };
  }

  private calculateFoodGroupScores(dietaryIntake: Record<string, number>): PlanetaryHealthScore['foodGroupScores'] {
    const scores: PlanetaryHealthScore['foodGroupScores'] = {};
    
    for (const [group, targetInfo] of Object.entries(EAT_LANCET_TARGETS)) {
      const target = 'target' in targetInfo ? targetInfo.target : 0;
      const actual = this.getActualIntake(group, dietaryIntake);
      const score = target > 0 ? Math.min(100, (actual / target) * 100) : 100;
      
      scores[group] = {
        score: Math.round(score),
        target,
        actual: Math.round(actual),
        unit: 'target' in targetInfo ? targetInfo.unit : 'g/day',
      };
    }
    
    for (const [source, targetInfo] of Object.entries(EAT_LANCET_TARGETS.proteinSources)) {
      const target = targetInfo.target;
      const actual = dietaryIntake[source] || 0;
      const score = Math.min(100, (actual / target) * 100);
      
      scores[`protein_${source}`] = {
        score: Math.round(score),
        target,
        actual: Math.round(actual),
        unit: targetInfo.unit,
      };
    }
    
    for (const [fat, targetInfo] of Object.entries(EAT_LANCET_TARGETS.addedFats)) {
      const target = targetInfo.target;
      const actual = dietaryIntake[fat] || 0;
      const score = Math.min(100, (actual / target) * 100);
      
      scores[`fat_${fat}`] = {
        score: Math.round(score),
        target,
        actual: Math.round(actual),
        unit: targetInfo.unit,
      };
    }
    
    return scores;
  }

  private getActualIntake(group: string, intake: Record<string, number>): number {
    const mapping: Record<string, string[]> = {
      wholeGrains: ['wholeGrains'],
      tubers: ['tubers'],
      vegetables: ['vegetables'],
      fruits: ['fruits'],
      dairy: ['dairy'],
      addedSugars: ['addedSugars'],
    };
    
    const keys = mapping[group] || [group];
    return keys.reduce((sum, key) => sum + (intake[key] || 0), 0);
  }

  private calculateEnvironmentalImpact(dietaryIntake: Record<string, number>): PlanetaryHealthScore['environmentalImpact'] {
    let ghge = 0, land = 0, water = 0, eutro = 0, biodiv = 0;
    
    for (const [food, factors] of Object.entries(ENVIRONMENTAL_FACTORS)) {
      const amount = dietaryIntake[food] || 0;
      const factor = amount / 100;
      
      ghge += factors.ghge * factor;
      land += factors.land * factor;
      water += factors.water * factor;
      eutro += factors.eutro * factor;
      biodiv += factors.biodiv * factor;
    }
    
    return {
      ghgeKgCO2e: Math.round(ghge * 10) / 10,
      landUseM2: Math.round(land * 10) / 10,
      waterUseL: Math.round(water),
      eutrophicationPotential: Math.round(eutro * 10) / 10,
      biodiversityImpact: Math.round(biodiv * 10) / 10,
    };
  }

  private compareToEATLancet(foodGroupScores: PlanetaryHealthScore['foodGroupScores']): PlanetaryHealthScore['comparedToEATLancet'] {
    const gapFoodGroups: string[] = [];
    const excessFoodGroups: string[] = [];
    let totalAdherence = 0;
    let count = 0;
    
    for (const [group, scoreInfo] of Object.entries(foodGroupScores)) {
      totalAdherence += scoreInfo.score;
      count++;
      
      if (scoreInfo.score < 50) {
        gapFoodGroups.push(group);
      } else if (scoreInfo.score > 150) {
        excessFoodGroups.push(group);
      }
    }
    
    return {
      adherencePercent: Math.round(totalAdherence / count),
      gapFoodGroups,
      excessFoodGroups,
    };
  }

  private calculateTotalScore(foodGroupScores: PlanetaryHealthScore['foodGroupScores']): number {
    let total = 0;
    let count = 0;
    
    for (const scoreInfo of Object.values(foodGroupScores)) {
      const cappedScore = Math.min(scoreInfo.score, 150);
      total += cappedScore;
      count++;
    }
    
    return total / count;
  }

  private getAdherenceLevel(score: number): PlanetaryHealthScore['adherenceLevel'] {
    if (score >= 90) return 'very_high';
    if (score >= 70) return 'high';
    if (score >= 50) return 'moderate';
    if (score >= 30) return 'low';
    return 'very_low';
  }

  private generateRecommendations(
    foodGroupScores: PlanetaryHealthScore['foodGroupScores'],
    comparedToEATLancet: PlanetaryHealthScore['comparedToEATLancet']
  ): string[] {
    const recommendations: string[] = [];
    
    for (const gap of comparedToEATLancet.gapFoodGroups) {
      const groupName = gap.replace(/_/g, ' ');
      recommendations.push(`Increase ${groupName} to meet EAT-Lancet targets`);
    }
    
    for (const excess of comparedToEATLancet.excessFoodGroups) {
      const groupName = excess.replace(/_/g, ' ');
      recommendations.push(`Reduce ${groupName} - exceeds planetary boundaries`);
    }
    
    if (comparedToEATLancet.adherencePercent < 50) {
      recommendations.push('Consider plant-forward dietary pattern shift');
      recommendations.push('Replace red meat with legumes, nuts, or fish');
      recommendations.push('Increase whole grains, vegetables, and fruits');
    }
    
    return recommendations;
  }
}

export default PlanetaryModule;