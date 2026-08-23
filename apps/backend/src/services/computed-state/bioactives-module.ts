/**
 * Bioactives Profile Module
 * Polyphenol, flavonoid, and bioactive compound assessment
 */

import type {
  ModuleInterface,
  ModuleOutput,
  PatientContextHub,
  BioactivesProfile,
} from '../../types/patient-context.js';

interface BioactivesConfig {
  enableAssessment?: boolean;
  targetPolyphenols?: number;
}

const POLYPHENOL_SOURCES: Record<string, { total: number; flavonoids: number; compounds: Record<string, number> }> = {
  'green_tea': { total: 200, flavonoids: 180, compounds: { 'EGCG': 120, 'catechins': 60 } },
  'black_tea': { total: 150, flavonoids: 130, compounds: { 'theaflavins': 50, 'thearubigins': 80 } },
  'coffee': { total: 200, flavonoids: 0, compounds: { 'chlorogenic_acid': 150, 'caffeic_acid': 50 } },
  'cocoa_dark': { total: 500, flavonoids: 450, compounds: { 'epicatechin': 200, 'procyanidins': 250 } },
  'berries': { total: 300, flavonoids: 250, compounds: { 'anthocyanins': 150, 'ellagitannins': 100 } },
  'citrus': { total: 100, flavonoids: 90, compounds: { 'hesperidin': 50, 'naringenin': 40 } },
  'red_wine': { total: 200, flavonoids: 180, compounds: { 'resveratrol': 20, 'quercetin': 30, 'proanthocyanidins': 130 } },
  'olive_oil_evoo': { total: 100, flavonoids: 0, compounds: { 'oleuropein': 50, 'hydroxytyrosol': 30, 'oleocanthal': 20 } },
  'turmeric': { total: 200, flavonoids: 0, compounds: { 'curcumin': 150 } },
  'soy': { total: 150, flavonoids: 150, compounds: { 'genistein': 80, 'daidzein': 70 } },
  'nuts': { total: 100, flavonoids: 50, compounds: { 'ellagic_acid': 50, 'proanthocyanidins': 50 } },
  'whole_grains': { total: 50, flavonoids: 30, compounds: { 'ferulic_acid': 30, 'lignans': 20 } },
  'vegetables': { total: 80, flavonoids: 60, compounds: { 'quercetin': 30, 'kaempferol': 30 } },
};

const HEALTH_EFFECTS: Record<string, { targets: string[]; mechanism: string; evidence: string }> = {
  'EGCG': { targets: ['metabolism', 'cancer_prevention', 'neuroprotection'], mechanism: 'AMPK activation, mTOR inhibition', evidence: 'Strong' },
  'resveratrol': { targets: ['longevity', 'cardiovascular', 'glucose_control'], mechanism: 'SIRT1 activation, AMPK', evidence: 'Moderate' },
  'curcumin': { targets: ['inflammation', 'arthritis', 'depression'], mechanism: 'NF-κB inhibition, COX-2', evidence: 'Strong' },
  'quercetin': { targets: ['allergy', 'inflammation', 'exercise_performance'], mechanism: 'Mast cell stabilization, Nrf2', evidence: 'Moderate' },
  'anthocyanins': { targets: ['cognitive', 'cardiovascular', 'gut_health'], mechanism: 'BDNF upregulation, NO production', evidence: 'Strong' },
  'oleuropein': { targets: ['cardiovascular', 'metabolic', 'antimicrobial'], mechanism: 'ACE inhibition, AMPK', evidence: 'Moderate' },
  'hydroxytyrosol': { targets: ['cardiovascular', 'neuroprotection', 'antioxidant'], mechanism: 'Nrf2, mitochondrial biogenesis', evidence: 'Strong' },
  'genistein': { targets: ['menopause', 'bone', 'cancer_prevention'], mechanism: 'ER-beta agonist, tyrosine kinase inhibition', evidence: 'Moderate' },
  'chlorogenic_acid': { targets: ['glucose_control', 'weight', 'cardiovascular'], mechanism: 'Glucose-6-phosphatase inhibition', evidence: 'Strong' },
  'ellagic_acid': { targets: ['cancer_prevention', 'skin', 'gut_health'], mechanism: 'DNMT inhibition, urolithin conversion', evidence: 'Moderate' },
};

export class BioactivesModule implements ModuleInterface {
  id = 'bioactives';
  name = 'Bioactives Assessment Engine';
  version = '1.0.0';
  dependencies: string[] = ['espen', 'precision'];
  provides = ['bioactivesProfile'];
  
  private config: Required<BioactivesConfig>;
  private hub: PatientContextHub | null = null;

  constructor(config: BioactivesConfig = {}) {
    this.config = {
      enableAssessment: true,
      targetPolyphenols: 1000,
      ...config,
    };
  }

  async compute(patientId: string, hub: PatientContextHub): Promise<ModuleOutput> {
    const start = Date.now();
    this.hub = hub;
    
    const state = await hub.getContext(patientId);
    const profile = this.assessBioactives(state);
    
    return {
      moduleId: 'bioactives',
      success: true,
      data: { bioactivesProfile: profile },
      durationMs: Date.now() - start,
      errors: [],
      warnings: [],
    };
  }

  async onContextChange(patientId: string, changes: any): Promise<void> {
    const relevantFields = ['dietaryIntake', 'bioactivesProfile', 'diagnoses'];
    
    const hasRelevantChange = changes.changedFields.some((f: string) => relevantFields.includes(f));
    
    if (hasRelevantChange && this.hub) {
      const eventBus = this.hub.getEventBus();
      eventBus.emit({
        type: 'BIOACTIVES_PROFILE_UPDATED',
        patientId,
        timestamp: new Date().toISOString(),
        source: 'bioactives',
        trigger: 'screening',
      });
    }
  }

  routes = null;
  hooks = {};
  tabs = [
    {
      id: 'polyphenol-intake',
      label: 'Polyphenol Intake',
      icon: 'leaf',
      order: 1,
    },
    {
      id: 'bioactive-targets',
      label: 'Target Compounds',
      icon: 'flask',
      order: 2,
    },
    {
      id: 'health-effects',
      label: 'Health Effects',
      icon: 'heart-pulse',
      order: 3,
    },
  ];
  actions = [];

  private assessBioactives(state: any): BioactivesProfile {
    const dietaryIntake = state.dietaryIntake || this.estimateIntakeFromPatterns(state);
    const diagnoses = state.diagnoses || [];
    
    const { totalPolyphenols, specificCompounds } = this.calculateIntake(dietaryIntake);
    const targets = this.calculateTargets(diagnoses, totalPolyphenols);
    const gaps = this.identifyGaps(specificCompounds, diagnoses);
    const foodSources = this.identifyFoodSources(dietaryIntake);
    
    return {
      totalPolyphenols: Math.round(totalPolyphenols),
      flavonoidClasses: this.groupFlavonoids(specificCompounds),
      topSources: foodSources.map(f => ({ food: f, polyphenols: dietaryIntake[f] || 0, serving: '1 serving' })),
      retentionAdjusted: false,
      targets: {
        totalPolyphenols: targets.polyphenols?.value || this.config.targetPolyphenols,
        flavonoids: targets.flavonoids?.value || 500,
        specificCompounds: this.getCompoundTargets(diagnoses),
      },
      gaps,
    };
  }

  private estimateIntakeFromPatterns(state: any): Record<string, number> {
    const pattern = state.dietaryPattern || 'mixed';
    
    const basePatterns: Record<string, Record<string, number>> = {
      mediterranean: {
        olive_oil_evoo: 30,
        vegetables: 400,
        fruits: 300,
        whole_grains: 150,
        nuts: 30,
        legumes: 50,
        fish: 50,
        red_wine: 100,
        coffee: 200,
        cocoa_dark: 10,
      },
      plant_based: {
        vegetables: 500,
        fruits: 400,
        whole_grains: 200,
        legumes: 150,
        nuts: 50,
        soy: 100,
        green_tea: 200,
        berries: 150,
        coffee: 150,
      },
      western: {
        coffee: 300,
        black_tea: 100,
        vegetables: 100,
        fruits: 100,
        whole_grains: 50,
        cocoa_dark: 5,
      },
      mixed: {
        coffee: 200,
        vegetables: 200,
        fruits: 150,
        whole_grains: 80,
        black_tea: 50,
        cocoa_dark: 10,
      },
    };
    
    return basePatterns[pattern] || basePatterns.mixed;
  }

  private calculateIntake(dietaryIntake: Record<string, number>) {
    let totalPolyphenols = 0;
    const specificCompounds: Record<string, number> = {};
    
    for (const [food, amount] of Object.entries(dietaryIntake)) {
      const source = POLYPHENOL_SOURCES[food];
      if (!source) continue;
      
      const factor = amount / 100;
      
      totalPolyphenols += source.total * factor;
      
      for (const [compound, content] of Object.entries(source.compounds)) {
        specificCompounds[compound] = (specificCompounds[compound] || 0) + content * factor;
      }
    }
    
    return { totalPolyphenols, specificCompounds };
  }

  private calculateTargets(diagnoses: any[], currentPolyphenols: number) {
    let targetPolyphenols = this.config.targetPolyphenols;
    let targetFlavonoids = 500;
    
    const hasCVD = diagnoses.some((d: any) => d.code.startsWith('I'));
    const hasCancer = diagnoses.some((d: any) => d.code.startsWith('C'));
    const hasDiabetes = diagnoses.some((d: any) => d.code.startsWith('E1'));
    const hasNeuro = diagnoses.some((d: any) => d.code.startsWith('G') || d.code.startsWith('F0'));
    const hasInflammation = diagnoses.some((d: any) => d.code.startsWith('M') || d.code.startsWith('L'));
    
    if (hasCVD) { targetPolyphenols = 1500; targetFlavonoids = 800; }
    if (hasCancer) { targetPolyphenols = 2000; targetFlavonoids = 1000; }
    if (hasDiabetes) { targetPolyphenols = 1200; targetFlavonoids = 600; }
    if (hasNeuro) { targetPolyphenols = 1500; targetFlavonoids = 800; }
    if (hasInflammation) { targetPolyphenols = 1500; targetFlavonoids = 700; }
    
    return {
      polyphenols: { value: targetPolyphenols, current: Math.round(currentPolyphenols), gap: Math.max(0, targetPolyphenols - currentPolyphenols) },
      flavonoids: { value: targetFlavonoids, gap: Math.max(0, targetFlavonoids - 0) },
    };
  }

  private identifyGaps(specificCompounds: Record<string, number>, diagnoses: any[]): string[] {
    const gaps: string[] = [];
    const targets = this.getCompoundTargets(diagnoses);
    
    for (const [compound, target] of Object.entries(targets)) {
      const current = specificCompounds[compound] || 0;
      if (current < target * 0.5) {
        gaps.push(`Low ${compound} (${Math.round(current)} mg vs target ${target} mg)`);
      }
    }
    
    if (Object.keys(specificCompounds).length < 5) {
      gaps.push('Low diversity of bioactive compounds - increase plant variety');
    }
    
    return gaps;
  }

  private getCompoundTargets(diagnoses: any[]): Record<string, number> {
    const targets: Record<string, number> = {
      'EGCG': 100,
      'curcumin': 100,
      'resveratrol': 50,
      'quercetin': 50,
      'anthocyanins': 100,
      'oleuropein': 30,
      'hydroxytyrosol': 20,
      'genistein': 50,
      'chlorogenic_acid': 150,
    };
    
    const hasCVD = diagnoses.some((d: any) => d.code.startsWith('I'));
    const hasDiabetes = diagnoses.some((d: any) => d.code.startsWith('E1'));
    const hasInflammation = diagnoses.some((d: any) => d.code.startsWith('M') || d.code.startsWith('L'));
    
    if (hasCVD) {
      targets['EGCG'] = 200;
      targets['resveratrol'] = 100;
      targets['oleuropein'] = 50;
      targets['hydroxytyrosol'] = 30;
    }
    
    if (hasDiabetes) {
      targets['chlorogenic_acid'] = 300;
      targets['quercetin'] = 100;
      targets['EGCG'] = 150;
    }
    
    if (hasInflammation) {
      targets['curcumin'] = 500;
      targets['quercetin'] = 150;
      targets['EGCG'] = 200;
    }
    
    return targets;
  }

  private identifyFoodSources(dietaryIntake: Record<string, number>): string[] {
    const sources: string[] = [];
    
    for (const [food, amount] of Object.entries(dietaryIntake)) {
      if (POLYPHENOL_SOURCES[food] && amount > 10) {
        sources.push(food.replace(/_/g, ' '));
      }
    }
    
    return sources;
  }

  private assessHealthEffects(specificCompounds: Record<string, number>, diagnoses: any[]) {
    const effects: Record<string, { achieved: boolean; evidence: string }> = {};
    
    for (const [compound, info] of Object.entries(HEALTH_EFFECTS)) {
      const current = specificCompounds[compound] || 0;
      const target = this.getCompoundTargets(diagnoses)[compound] || 50;
      const achieved = current >= target * 0.5;
      
      effects[compound] = {
        achieved,
        evidence: info.evidence,
      };
    }
    
    return effects;
  }

  private recommendSupplements(gaps: string[]): string[] {
    const supplements: string[] = [];
    
    if (gaps.some(g => g.includes('EGCG'))) {
      supplements.push('Green tea extract (EGCG 200-400 mg/day)');
    }
    if (gaps.some(g => g.includes('curcumin'))) {
      supplements.push('Curcumin phytosome (500-1000 mg/day) with piperine');
    }
    if (gaps.some(g => g.includes('resveratrol'))) {
      supplements.push('Trans-resveratrol (150-500 mg/day)');
    }
    if (gaps.some(g => g.includes('quercetin'))) {
      supplements.push('Quercetin phytosome (250-500 mg/day)');
    }
    if (gaps.some(g => g.includes('anthocyanins'))) {
      supplements.push('Bilberry/elderberry extract (anthocyanins 100-200 mg/day)');
    }
    if (gaps.some(g => g.includes('oleuropein') || g.includes('hydroxytyrosol'))) {
      supplements.push('Olive leaf extract (oleuropein 100-200 mg/day) or high-quality EVOO 30ml/day');
    }
    if (gaps.some(g => g.includes('genistein'))) {
      supplements.push('Soy isoflavones (50-100 mg/day genistein)');
    }
    
    if (supplements.length === 0) {
      supplements.push('Focus on dietary diversity: 30+ plants/week, EVOO, tea, berries, nuts, cocoa');
    }
    
    return supplements;
  }

  private groupFlavonoids(compounds: Record<string, number>): Record<string, number> {
    const flavonoidGroups: Record<string, string[]> = {
      'flavonols': ['quercetin', 'kaempferol', 'myricetin'],
      'flavones': ['apigenin', 'luteolin'],
      'flavanones': ['hesperidin', 'naringenin'],
      'flavanols': ['EGCG', 'catechins', 'epicatechin', 'procyanidins', 'proanthocyanidins'],
      'anthocyanidins': ['anthocyanins', 'cyanidin', 'delphinidin', 'malvidin'],
      'isoflavones': ['genistein', 'daidzein', 'glycitein'],
    };
    
    const grouped: Record<string, number> = {};
    
    for (const [group, members] of Object.entries(flavonoidGroups)) {
      let sum = 0;
      for (const member of members) {
        sum += compounds[member] || 0;
      }
      if (sum > 0) grouped[group] = sum;
    }
    
    return grouped;
  }
}

export default BioactivesModule;