/**
 * ESPEN Guidelines Target Calculator Module
 * Pathology-specific energy and protein targets
 */

import type { 
  ModuleInterface,
  ModuleOutput,
  PatientContextHub,
  ModuleState,
  ChangeSet,

  ESPENTargets,
  Diagnosis,
} from '../../types/patient-context.js';

interface ESPENConfig {
  referenceGuidelines?: string[];
  enableAdjustmentFactors?: boolean;
  defaultConditions?: string[];
}

export class ESPENModule implements ModuleInterface {
  id = 'espen';
  name = 'ESPEN Guidelines';
  version = '1.0.0';
  dependencies: string[] = [];
  provides = ['espenTargets'];
  
  private config: Required<ESPENConfig>;
  private hub: PatientContextHub | null = null;

  constructor(config: ESPENConfig = {}) {
    this.config = {
      referenceGuidelines: config.referenceGuidelines ?? ['ESPEN 2024', 'ASPEN 2023'],
      enableAdjustmentFactors: config.enableAdjustmentFactors ?? true,
      defaultConditions: config.defaultConditions ?? [],
    } as Required<ESPENConfig>;
  }

  async compute(patientId: string, hub: PatientContextHub): Promise<ModuleOutput> {
    const start = Date.now();
    this.hub = hub;
    
    const state = await hub.getContext(patientId);
    const targets = this.calculateTargets(state);
    
    return {
      moduleId: 'espen',
      success: true,
      data: { espenTargets: targets },
      durationMs: Date.now() - start,
      errors: [],
      warnings: [],
    };
  }

  async onContextChange(patientId: string, changes: ChangeSet): Promise<void> {
    const relevantFields = [
      'diagnoses',
      'anthropometry.weight',
      'anthropometry.bmi',
      'labs',
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
      const cachedTargets = await this.getCachedTargets(patientId);
      eventBus.emit({
        type: 'ESPEN_TARGETS_UPDATED',
        patientId,
        timestamp: new Date().toISOString(),
        source: 'espen',
        triggerCondition: 'diagnosis',
        previous: null,
        current: cachedTargets,
      });
    }
  }

  routes = null;
  hooks = {};
  tabs = [];
  actions = [];

  private async getCachedTargets(patientId: string): Promise<ESPENTargets | null> {
    const state = await this.hub?.getContext(patientId);
    return state?.espenTargets || null;
  }

  private calculateTargets(state: ModuleState): ESPENTargets {
    const weight = state.anthropometry?.weight || 70;
    
    const conditions = this.extractConditions(state);
    
    let energy: number, protein: number, carbohydratePercent: number, fatPercent: number;
    
    if (conditions.some((c: string) => ['C00', 'C01', 'C02', 'C03', 'C50', 'C61'].includes(c))) {
      energy = 25 * weight;
      protein = 1.5 * weight;
      carbohydratePercent = 55;
      fatPercent = 30;
    } else if (conditions.some((c: string) => c.startsWith('N'))) {
      energy = 25 * weight;
      protein = 1.0 * weight;
      carbohydratePercent = 50;
      fatPercent = 30;
    } else if (conditions.some((c: string) => c.startsWith('E'))) {
      energy = 25 * weight;
      protein = 1.0 * weight;
      carbohydratePercent = 50;
      fatPercent = 30;
    } else if (conditions.some((c: string) => c.startsWith('I'))) {
      energy = 20 * weight;
      protein = 1.0 * weight;
      carbohydratePercent = 50;
      fatPercent = 30;
    } else if (conditions.some((c: string) => c.startsWith('Z'))) {
      energy = 25 * weight;
      protein = 0.8 * weight;
      carbohydratePercent = 50;
      fatPercent = 30;
    } else {
      energy = 25 * weight;
      protein = 0.8 * weight;
      carbohydratePercent = 50;
      fatPercent = 30;
    }
    
    const adjustments = this.getConditionAdjustments(conditions, weight);
    
    let totalEnergyAdjustment = 0;
    let totalProteinAdjustment = 0;
    
    if (this.config.enableAdjustmentFactors) {
      for (const adj of adjustments) {
        if (adj.energyAdjustment) totalEnergyAdjustment += adj.energyAdjustment;
        if (adj.proteinAdjustment) totalProteinAdjustment += adj.proteinAdjustment;
      }
    }
    
    energy = Math.max(energy + totalEnergyAdjustment, 0);
    protein = Math.max(protein + totalProteinAdjustment, 0);
    
    if (state.labs?.creatinine !== undefined && state.labs.creatinine > 1.5) {
      protein = Math.min(protein, 1.5 * weight);
    }
    
    if (state.anthropometry?.bmi !== undefined && state.anthropometry.bmi < 18.5) {
      energy = energy * 1.2;
      protein = protein * 1.2;
    }
    
    const micronutrients = this.calculateMicronutrients(state, conditions);
    
    return {
      energy: { 
        value: Math.round(energy), 
        unit: 'kcal/day', 
        range: [energy * 0.8, energy * 1.2] as [number, number],
        grade: 'A',
        reference: this.config.referenceGuidelines[0] 
      },
      protein: { 
        value: Math.round(protein), 
        unit: 'g/day', 
        gPerKg: Math.round((protein / weight) * 10) / 10,
        range: [protein * 0.8, protein * 1.2] as [number, number],
        grade: 'A',
        reference: this.config.referenceGuidelines[0] 
      },
      carbohydrates: { 
        value: Math.round(weight * carbohydratePercent / 4), 
        unit: 'g/day', 
        percent: carbohydratePercent,
        grade: 'B' 
      },
      fat: { 
        value: Math.round(weight * fatPercent / 9), 
        unit: 'g/day', 
        percent: fatPercent,
        grade: 'B' 
      },
      fiber: { 
        value: 25, 
        unit: 'g/day', 
        grade: 'B' 
      },
      water: { 
        value: Math.round(35 * weight), 
        unit: 'ml/day', 
        grade: 'A' 
      },
      micronutrients,
      conditionAdjustments: adjustments,
      adherenceStatus: 'not_assessed',
      lastGuidelineUpdate: '2024-01-01',
    };
  }

  private extractConditions(state: ModuleState): string[] {
    const conditions: string[] = [];
    
    if (!state.diagnoses) return conditions;
    
    state.diagnoses.forEach((d: Diagnosis | string) => {
      if (typeof d === 'string') {
        conditions.push(d);
      } else if (d.code) {
        conditions.push(d.code);
      }
    });
    
    return conditions;
  }

  private getConditionAdjustments(conditions: string[], weight: number): { condition: string; energyAdjustment?: number; proteinAdjustment?: number; notes: string[] }[] {
    const adjustments: { condition: string; energyAdjustment?: number; proteinAdjustment?: number; notes: string[] }[] = [];
    
    let energy = 25 * weight;
    let protein = 1.0 * weight;
    
    if (conditions.some((c: string) => c.startsWith('R'))) {
      energy *= 1.2;
      protein = 1.5 * weight;
      adjustments.push({ 
        condition: 'Critical illness', 
        energyAdjustment: energy - 25 * weight, 
        proteinAdjustment: protein - 1.0 * weight,
        notes: ['Increase protein to 1.5-2.0 g/kg/day'] 
      });
    }
    
    if (conditions.some((c: string) => c === 'A41')) {
      energy *= 1.5;
      protein = 2.0 * weight;
      adjustments.push({ 
        condition: 'Sepsis', 
        energyAdjustment: energy - 25 * weight, 
        proteinAdjustment: protein - 1.0 * weight,
        notes: ['Increased energy and protein requirements'] 
      });
    }
    
    if (conditions.some((c: string) => c.startsWith('N18'))) {
      protein = Math.min(protein, 1.5 * weight);
      adjustments.push({ 
        condition: 'CKD', 
        proteinAdjustment: protein - 1.0 * weight,
        notes: ['Monitor protein intake and potassium'] 
      });
    }
    
    if (conditions.some((c: string) => ['C00', 'C01', 'C02', 'C03', 'C50', 'C61'].includes(c))) {
      adjustments.push({ 
        condition: 'Cancer', 
        notes: ['May require additional calories and high biological value protein'] 
      });
    }
    
    if (conditions.some((c: string) => c.startsWith('E10') || c.startsWith('E11'))) {
      adjustments.push({ 
        condition: 'Diabetes', 
        notes: ['Monitor carbohydrate intake timing'] 
      });
    }
    
    if (conditions.some((c: string) => c.startsWith('K70') || c.startsWith('K71') || c.startsWith('K74'))) {
      protein = 1.2 * weight;
      adjustments.push({ 
        condition: 'Liver disease', 
        proteinAdjustment: protein - 1.0 * weight,
        notes: ['Bran supplementation may be beneficial'] 
      });
    }
    
    return adjustments;
  }

  private calculateMicronutrients(state: ModuleState, conditions: string[]): Record<string, { value: number; unit: string; grade: 'A' | 'B' | 'GPP' }> {
    const micronutrients: Record<string, { value: number; unit: string; grade: 'A' | 'B' | 'GPP' }> = {};
    
    micronutrients.vitaminD = { value: 800, unit: 'IU', grade: 'A' };
    micronutrients.vitaminB12 = { value: 2.4, unit: 'mcg', grade: 'A' };
    micronutrients.folate = { value: 400, unit: 'mcg', grade: 'A' };
    micronutrients.calcium = { value: 1000, unit: 'mg', grade: 'A' };
    micronutrients.magnesium = { value: 400, unit: 'mg', grade: 'A' };
    micronutrients.zinc = { value: 15, unit: 'mg', grade: 'A' };
    micronutrients.iron = { value: 18, unit: 'mg', grade: 'A' };
    micronutrients.potassium = { value: 3500, unit: 'mg', grade: 'A' };
    micronutrients.sodium = { value: 2300, unit: 'mg', grade: 'B' };
    
    if (conditions.some((c: string) => c.startsWith('N18'))) {
      micronutrients.phosphate = { value: 800, unit: 'mg', grade: 'A' };
    }
    
    if (state.labs?.vitaminD !== undefined) {
      micronutrients.vitaminD = { value: 4000, unit: 'IU', grade: 'A' };
    }
    
    return micronutrients;
  }
}

export default ESPENModule;