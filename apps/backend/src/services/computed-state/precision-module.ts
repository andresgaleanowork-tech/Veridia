/**
 * Precision Nutrition Targets Module
 * Integrates genomics, microbiome, and clinical data for personalized targets
 */

import type {
  ModuleInterface,
  ModuleOutput,
  PatientContextHub,
  PrecisionTargets,
  MicrobiomeProfile,
  NutrigenomicProfile,
} from '../../types/patient-context.js';

interface PrecisionConfig {
  enableGenomics?: boolean;
  enableMicrobiome?: boolean;
  defaultDietProbabilities?: Record<string, number>;
}

export class PrecisionModule implements ModuleInterface {
  id = 'precision';
  name = 'Precision Nutrition Engine';
  version = '1.0.0';
  dependencies: string[] = ['espen', 'nutrigenomic', 'microbiome'];
  provides = ['precisionTargets'];
  
  private config: Required<PrecisionConfig>;
  private hub: PatientContextHub | null = null;

  constructor(config: PrecisionConfig = {}) {
    this.config = {
      enableGenomics: true,
      enableMicrobiome: true,
      defaultDietProbabilities: {
        mediterranean: 0.65,
        lowCarb: 0.45,
        lowFat: 0.40,
        plantBased: 0.55,
      },
      ...config,
    };
  }

  async compute(patientId: string, hub: PatientContextHub): Promise<ModuleOutput> {
    const start = Date.now();
    this.hub = hub;
    
    const state = await hub.getContext(patientId);
    const targets = this.calculatePrecisionTargets(state);
    
    return {
      moduleId: 'precision',
      success: true,
      data: { precisionTargets: targets },
      durationMs: Date.now() - start,
      errors: [],
      warnings: [],
    };
  }

  async onContextChange(patientId: string, changes: any): Promise<void> {
    const relevantFields = [
      'nutrigenomicProfile',
      'microbiomeProfile',
      'espenTargets',
      'diagnoses',
    ];
    
    const hasRelevantChange = changes.changedFields.some((f: string) => relevantFields.includes(f));
    
    if (hasRelevantChange && this.hub) {
      const eventBus = this.hub.getEventBus();
      eventBus.emit({
        type: 'PRECISION_REPORT_UPLOADED',
        patientId,
        timestamp: new Date().toISOString(),
        source: 'precision',
        trigger: 'screening',
      });
    }
  }

  routes = null;
  hooks = {};
  tabs = [
    {
      id: 'precision-targets',
      label: 'Precision Targets',
      icon: 'dna',
      order: 1,
    },
    {
      id: 'diet-response',
      label: 'Diet Response',
      icon: 'chart-bar',
      order: 2,
    },
  ];
  actions = [];

  private calculatePrecisionTargets(state: any): PrecisionTargets {
    const espenTargets = state.espenTargets || {};
    const nutrigenomic = state.nutrigenomicProfile;
    const microbiome = state.microbiomeProfile;
    const diagnoses = state.diagnoses || [];
    
    const baseEnergy = espenTargets.energy?.value || 2000;
    const baseProtein = espenTargets.protein?.value || 70;
    const baseCarbs = espenTargets.carbohydrates?.value || 250;
    const baseFat = espenTargets.fat?.value || 70;
    const baseFiber = espenTargets.fiber?.value || 25;
    
    const adjustedTargets = {
      energy: { value: baseEnergy, reason: 'ESPEN guideline baseline' },
      protein: { value: baseProtein, reason: 'ESPEN guideline baseline' },
      carbohydrates: { value: baseCarbs, reason: 'ESPEN guideline baseline' },
      fat: { value: baseFat, reason: 'ESPEN guideline baseline' },
      fiber: { value: baseFiber, reason: 'ESPEN guideline baseline' },
      micronutrients: {} as Record<string, { value: number; reason: string }>,
    };
    
    const reasons: string[] = [];
    
    if (nutrigenomic && this.config.enableGenomics) {
      this.applyGenomicAdjustments(adjustedTargets, nutrigenomic, reasons);
    }
    
    if (microbiome && this.config.enableMicrobiome) {
      this.applyMicrobiomeAdjustments(adjustedTargets, microbiome, reasons);
    }
    
    this.applyClinicalAdjustments(adjustedTargets, diagnoses, reasons);
    
    const dietResponsePrediction = this.predictDietResponse(nutrigenomic, microbiome, diagnoses);
    
    return {
      hasGenomics: !!nutrigenomic,
      nutrigenomic,
      microbiome,
      adjustedTargets,
      dietResponsePrediction,
    };
  }

  private applyGenomicAdjustments(
    targets: PrecisionTargets['adjustedTargets'],
    nutrigenomic: NutrigenomicProfile,
    reasons: string[]
  ): void {
    if (nutrigenomic.methylationRisk === 'high') {
      targets.micronutrients.folate = {
        value: nutrigenomic.folateRequirement,
        reason: 'High methylation risk - increased folate requirement',
      };
      reasons.push('Folate increased for methylation support');
    }
    
    if (nutrigenomic.vitaminDRequirement > 800) {
      targets.micronutrients.vitaminD = {
        value: nutrigenomic.vitaminDRequirement,
        reason: 'Genetic variant affecting vitamin D metabolism',
      };
      reasons.push('Vitamin D increased per genetic requirement');
    }
    
    if (nutrigenomic.omega3Requirement > 500) {
      targets.micronutrients.omega3 = {
        value: nutrigenomic.omega3Requirement,
        reason: 'Genetic variant affecting omega-3 metabolism',
      };
      reasons.push('Omega-3 increased per genetic requirement');
    }
    
    if (nutrigenomic.saltSensitivity) {
      targets.micronutrients.sodium = {
        value: 1500,
        reason: 'Genetic salt sensitivity - sodium restriction recommended',
      };
      reasons.push('Sodium restricted for salt sensitivity genotype');
    }
    
    if (nutrigenomic.lactoseIntolerance) {
      targets.micronutrients.calcium = {
        value: 1200,
        reason: 'Lactose intolerance - ensure calcium from non-dairy sources',
      };
      reasons.push('Calcium target maintained despite lactose restriction');
    }
  }

  private applyMicrobiomeAdjustments(
    targets: PrecisionTargets['adjustedTargets'],
    microbiome: MicrobiomeProfile,
    reasons: string[]
  ): void {
    if (microbiome.diversity === 'low') {
      targets.fiber.value = Math.max(targets.fiber.value, 35);
      targets.fiber.reason = 'Low microbiome diversity - increased fiber for SCFA production';
      reasons.push('Fiber increased for microbiome diversity');
    }
    
    if (microbiome.scfaProduction === 'low') {
      targets.micronutrients.resistantStarch = {
        value: 20,
        reason: 'Low SCFA production - resistant starch supplementation',
      };
      reasons.push('Resistant starch added for SCFA production');
    }
    
    if (microbiome.detrimentalTaxa.length > 0) {
      targets.micronutrients.polyphenols = {
        value: 500,
        reason: 'Detrimental taxa present - polyphenols for microbiome modulation',
      };
      reasons.push('Polyphenols added for microbiome modulation');
    }
  }

  private applyClinicalAdjustments(
    targets: PrecisionTargets['adjustedTargets'],
    diagnoses: any[],
    reasons: string[]
  ): void {
    const hasDiabetes = diagnoses.some((d: any) => d.code.startsWith('E10') || d.code.startsWith('E11'));
    const hasCKD = diagnoses.some((d: any) => d.code.startsWith('N18'));
    const hasHeartFailure = diagnoses.some((d: any) => d.code.startsWith('I50'));
    const hasLiverDisease = diagnoses.some((d: any) => d.code.startsWith('K7'));
    
    if (hasDiabetes) {
      targets.carbohydrates.value = Math.min(targets.carbohydrates.value, 200);
      targets.carbohydrates.reason = 'Diabetes - carbohydrate moderation for glycemic control';
      reasons.push('Carbs moderated for diabetes');
    }
    
    if (hasCKD) {
      targets.protein.value = Math.min(targets.protein.value, 0.8 * 70);
      targets.protein.reason = 'CKD - protein restriction to slow progression';
      targets.micronutrients.potassium = { value: 2000, reason: 'CKD - potassium restriction' };
      targets.micronutrients.phosphate = { value: 800, reason: 'CKD - phosphate restriction' };
      reasons.push('Protein, K+, phosphate restricted for CKD');
    }
    
    if (hasHeartFailure) {
      targets.micronutrients.sodium = { value: 2000, reason: 'Heart failure - sodium restriction' };
      reasons.push('Sodium restricted for heart failure');
    }
    
    if (hasLiverDisease) {
      targets.protein.value = Math.max(targets.protein.value, 1.2 * 70);
      targets.protein.reason = 'Liver disease - increased protein for synthesis';
      targets.micronutrients.zinc = { value: 25, reason: 'Liver disease - zinc deficiency common' };
      reasons.push('Protein and zinc increased for liver disease');
    }
  }

  private predictDietResponse(
    nutrigenomic?: NutrigenomicProfile,
    microbiome?: MicrobiomeProfile,
    diagnoses?: any[]
  ): PrecisionTargets['dietResponsePrediction'] {
    const base = { ...this.config.defaultDietProbabilities };
    
    if (nutrigenomic) {
      if (nutrigenomic.saltSensitivity) {
        base.mediterranean += 0.1;
        base.plantBased += 0.1;
      }
      if (nutrigenomic.caffeineMetabolism === 'slow') {
        base.lowCarb -= 0.05;
      }
      if (nutrigenomic.lactoseIntolerance) {
        base.plantBased += 0.15;
      }
    }
    
    if (microbiome) {
      if (microbiome.diversity === 'high') {
        base.plantBased += 0.1;
        base.mediterranean += 0.05;
      }
      if (microbiome.enterotype === 'Bacteroides') {
        base.lowCarb += 0.1;
      }
    }
    
    if (diagnoses) {
      const hasDiabetes = diagnoses.some((d: any) => d.code.startsWith('E10') || d.code.startsWith('E11'));
      const hasObesity = diagnoses.some((d: any) => d.code === 'E66');
      const hasHTN = diagnoses.some((d: any) => d.code.startsWith('I10'));
      
      if (hasDiabetes) {
        base.lowCarb += 0.2;
        base.mediterranean += 0.1;
      }
      if (hasObesity) {
        base.mediterranean += 0.15;
        base.plantBased += 0.1;
      }
      if (hasHTN) {
        base.mediterranean += 0.2;
        base.plantBased += 0.1;
      }
    }
    
    return {
      mediterranean: Math.min(base.mediterranean, 0.95),
      lowCarb: Math.min(base.lowCarb, 0.95),
      lowFat: Math.min(base.lowFat, 0.95),
      plantBased: Math.min(base.plantBased, 0.95),
    };
  }
}

export default PrecisionModule;