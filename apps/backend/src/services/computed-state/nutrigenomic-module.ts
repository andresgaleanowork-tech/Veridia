/**
 * Nutrigenomics Module
 * Genetic variant analysis for personalized nutrition
 */

import type {
  ModuleInterface,
  ModuleOutput,
  PatientContextHub,
  ModuleState,
  ChangeSet,

  NutrigenomicProfile,
  NutrigenomicVariant,
} from '../../types/patient-context.js';

interface NutrigenomicConfig {
  enableAnalysis?: boolean;
  variantDatabase?: Record<string, unknown>;
}

const VARIANT_DATABASE: Record<string, NutrigenomicVariant> = {
  'MTHFR_C677T': {
    gene: 'MTHFR',
    rsid: 'rs1801133',
    genotype: 'TT',
    allele: 'T',
    impact: 'high',
    nutrient: 'folate',
    recommendation: 'Use methylfolate (5-MTHF) instead of folic acid; target 600-800 mcg DFE',
    evidence: 'strong',
  },
  'MTHFR_A1298C': {
    gene: 'MTHFR',
    rsid: 'rs1801131',
    genotype: 'CC',
    allele: 'C',
    impact: 'moderate',
    nutrient: 'folate',
    recommendation: 'Consider methylfolate; monitor homocysteine',
    evidence: 'moderate',
  },
  'VDR_FokI': {
    gene: 'VDR',
    rsid: 'rs2228570',
    genotype: 'ff',
    allele: 'f',
    impact: 'moderate',
    nutrient: 'vitamin D',
    recommendation: 'Target 2000-4000 IU/day; monitor 25-OH-D quarterly',
    evidence: 'moderate',
  },
  'VDR_BsmI': {
    gene: 'VDR',
    rsid: 'rs1544410',
    genotype: 'BB',
    allele: 'B',
    impact: 'low',
    nutrient: 'vitamin D',
    recommendation: 'Standard vitamin D dosing; monitor bone density',
    evidence: 'emerging',
  },
  'FTO_rs9939609': {
    gene: 'FTO',
    rsid: 'rs9939609',
    genotype: 'AA',
    allele: 'A',
    impact: 'moderate',
    nutrient: 'protein',
    recommendation: 'Higher protein (1.6-2.0 g/kg) for satiety and weight management',
    evidence: 'strong',
  },
  'APOA2_rs5082': {
    gene: 'APOA2',
    rsid: 'rs5082',
    genotype: 'CC',
    allele: 'C',
    impact: 'moderate',
    nutrient: 'saturated fat',
    recommendation: 'Limit saturated fat <7% energy; emphasize MUFA/PUFA',
    evidence: 'moderate',
  },
  'TCF7L2_rs7903146': {
    gene: 'TCF7L2',
    rsid: 'rs7903146',
    genotype: 'TT',
    allele: 'T',
    impact: 'high',
    nutrient: 'carbohydrate',
    recommendation: 'Lower glycemic index carbs; target <45% energy from carbs',
    evidence: 'strong',
  },
  'CYP1A2_rs762551': {
    gene: 'CYP1A2',
    rsid: 'rs762551',
    genotype: 'CC',
    allele: 'C',
    impact: 'moderate',
    nutrient: 'caffeine',
    recommendation: 'Slow metabolizer - limit caffeine to <200 mg/day',
    evidence: 'strong',
  },
  'LCT_rs4988235': {
    gene: 'LCT',
    rsid: 'rs4988235',
    genotype: 'CC',
    allele: 'C',
    impact: 'high',
    nutrient: 'lactose',
    recommendation: 'Lactose-free diet; calcium from fortified alternatives',
    evidence: 'strong',
  },
  'HFE_C282Y': {
    gene: 'HFE',
    rsid: 'rs1800562',
    genotype: 'GG',
    allele: 'G',
    impact: 'high',
    nutrient: 'iron',
    recommendation: 'Avoid iron supplements; limit heme iron; monitor ferritin',
    evidence: 'strong',
  },
  'FADS1_rs174547': {
    gene: 'FADS1',
    rsid: 'rs174547',
    genotype: 'TT',
    allele: 'T',
    impact: 'moderate',
    nutrient: 'omega-3',
    recommendation: 'Direct EPA/DHA supplementation 1-2 g/day; limited conversion from ALA',
    evidence: 'moderate',
  },
  'COMT_rs4680': {
    gene: 'COMT',
    rsid: 'rs4680',
    genotype: 'AA',
    allele: 'A',
    impact: 'low',
    nutrient: 'magnesium',
    recommendation: 'Ensure adequate magnesium 400 mg/day for catecholamine clearance',
    evidence: 'emerging',
  },
};

export class NutrigenomicModule implements ModuleInterface {
  id = 'nutrigenomic';
  name = 'Nutrigenomics Analysis Engine';
  version = '1.0.0';
  dependencies: string[] = [];
  provides = ['nutrigenomicProfile'];
  
  private config: Required<NutrigenomicConfig>;
  private hub: PatientContextHub | null = null;

  constructor(config: NutrigenomicConfig = {}) {
    this.config = {
      enableAnalysis: true,
      variantDatabase: {},
      ...config,
    };
  }

  async compute(patientId: string, hub: PatientContextHub): Promise<ModuleOutput> {
    const start = Date.now();
    this.hub = hub;
    
    const state = await hub.getContext(patientId);
    const profile = this.analyzeGenomics(state);
    
    return {
      moduleId: 'nutrigenomic',
      success: true,
      data: { nutrigenomicProfile: profile },
      durationMs: Date.now() - start,
      errors: [],
      warnings: [],
    };
  }

  async onContextChange(patientId: string, changes: ChangeSet): Promise<void> {
    const relevantFields = ['genomicData', 'nutrigenomicProfile'];
    
    const hasRelevantChange = changes.changedFields.some((f: string) => relevantFields.includes(f));
    
    if (hasRelevantChange && this.hub) {
      const eventBus = this.hub.getEventBus();
      eventBus.emit({
        type: 'NUTRIGENOMICS_UPDATED',
        patientId,
        timestamp: new Date().toISOString(),
        source: 'nutrigenomic',
        trigger: 'screening',
      });
    }
  }

  routes = null;
  hooks = {};
  tabs = [
    {
      id: 'genetic-variants',
      label: 'Genetic Variants',
      icon: 'dna',
      order: 1,
    },
    {
      id: 'nutrient-recommendations',
      label: 'Nutrient Recommendations',
      icon: 'prescription-bottle-alt',
      order: 2,
    },
  ];
  actions = [];

  private analyzeGenomics(state: ModuleState): NutrigenomicProfile {
    const variants = this.getPatientVariants(state);
    const requirements = this.calculateRequirements(variants);
    const sensitivities = this.assessSensitivities(variants);
    
    return {
      variants,
      methylationRisk: this.assessMethylationRisk(variants),
      folateRequirement: requirements.folate,
      vitaminB12Requirement: requirements.b12,
      vitaminDRequirement: requirements.vitaminD,
      omega3Requirement: requirements.omega3,
      saltSensitivity: sensitivities.salt,
      lactoseIntolerance: sensitivities.lactose,
      caffeineMetabolism: sensitivities.caffeine,
    };
  }

  private getPatientVariants(state: ModuleState): NutrigenomicVariant[] {
    const patientVariants = state.genomicData?.variants || [];
    const variants: NutrigenomicVariant[] = [];
    
    for (const pv of patientVariants) {
      const dbVariant = VARIANT_DATABASE[pv.variantId];
      if (dbVariant && this.matchesGenotype(pv.genotype, dbVariant.genotype)) {
        variants.push({ ...dbVariant, genotype: pv.genotype });
      }
    }
    
    if (variants.length === 0) {
      const defaultVariants = [
        'MTHFR_C677T', 'VDR_FokI', 'FTO_rs9939609', 'CYP1A2_rs762551', 'LCT_rs4988235'
      ];
      
      for (const id of defaultVariants) {
        const dbVariant = VARIANT_DATABASE[id];
        if (dbVariant) {
          variants.push({ ...dbVariant, genotype: 'het' });
        }
      }
    }
    
    return variants;
  }

  private matchesGenotype(patientGt: string, riskGt: string): boolean {
    const gtMap: Record<string, string[]> = {
      'TT': ['TT', 'CT'],
      'CC': ['CC', 'CT'],
      'AA': ['AA', 'AG'],
      'GG': ['GG', 'AG'],
      'ff': ['ff', 'Ff'],
      'BB': ['BB', 'Bb'],
      'het': ['CT', 'AG', 'Ff', 'Bb'],
    };
    return gtMap[riskGt]?.includes(patientGt) || false;
  }

  private assessMethylationRisk(variants: NutrigenomicVariant[]): 'low' | 'moderate' | 'high' {
    let riskScore = 0;
    
    const mthfr677 = variants.find(v => v.gene === 'MTHFR' && v.rsid === 'rs1801133');
    if (mthfr677 && mthfr677.genotype === 'TT') riskScore += 3;
    else if (mthfr677 && mthfr677.genotype === 'CT') riskScore += 1;
    
    const mthfr1298 = variants.find(v => v.gene === 'MTHFR' && v.rsid === 'rs1801131');
    if (mthfr1298 && mthfr1298.genotype === 'CC') riskScore += 2;
    else if (mthfr1298 && mthfr1298.genotype === 'AC') riskScore += 1;
    
    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'moderate';
    return 'low';
  }

  private calculateRequirements(variants: NutrigenomicVariant[]): { folate: number; b12: number; vitaminD: number; omega3: number } {
    let folate = 400;
    let b12 = 2.4;
    let vitaminD = 800;
    let omega3 = 250;
    
    const mthfr677 = variants.find(v => v.gene === 'MTHFR' && v.rsid === 'rs1801133');
    if (mthfr677) {
      if (mthfr677.genotype === 'TT') {
        folate = 800;
        b12 = 5;
      } else if (mthfr677.genotype === 'CT') {
        folate = 600;
        b12 = 3;
      }
    }
    
    const vdr = variants.find(v => v.gene === 'VDR');
    if (vdr && (vdr.genotype === 'ff' || vdr.genotype === 'BB')) {
      vitaminD = 2000;
    }
    
    const fads = variants.find(v => v.gene === 'FADS1');
    if (fads && fads.genotype === 'TT') {
      omega3 = 1000;
    } else if (fads && fads.genotype === 'GT') {
      omega3 = 500;
    }
    
    return { folate, b12, vitaminD, omega3 };
  }

  private assessSensitivities(variants: NutrigenomicVariant[]) {
    let salt = false;
    let lactose = false;
    let caffeine: 'slow' | 'normal' | 'fast' = 'normal';
    
    const ace = variants.find(v => v.gene === 'ACE' || v.rsid === 'rs4340');
    if (ace) salt = true;
    
    const lct = variants.find(v => v.gene === 'LCT');
    if (lct && (lct.genotype === 'CC' || lct.genotype === 'CT')) lactose = true;
    
    const cyp = variants.find(v => v.gene === 'CYP1A2');
    if (cyp) {
      if (cyp.genotype === 'CC') caffeine = 'slow';
      else if (cyp.genotype === 'AA') caffeine = 'fast';
    }
    
    return { salt, lactose, caffeine };
  }
}

export default NutrigenomicModule;