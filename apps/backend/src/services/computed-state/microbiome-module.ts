/**
 * Microbiome Profile Module
 * Analyzes microbiome composition and provides targeted recommendations
 */

import type {
  ModuleInterface,
  ModuleOutput,
  PatientContextHub,
  MicrobiomeProfile,
} from '../../types/patient-context.js';

interface MicrobiomeConfig {
  enableAnalysis?: boolean;
  referenceDatabase?: Record<string, any>;
}

const BENEFICIAL_TAXA = [
  'Faecalibacterium prausnitzii',
  'Akkermansia muciniphila',
  'Bifidobacterium longum',
  'Bifidobacterium adolescentis',
  'Lactobacillus rhamnosus',
  'Lactobacillus plantarum',
  'Roseburia intestinalis',
  'Eubacterium rectale',
  'Anaerostipes hadrus',
  'Blautia wexlerae',
];

const DETRIMENTAL_TAXA = [
  'Clostridium difficile',
  'Enterococcus faecalis',
  'Escherichia coli (pathogenic)',
  'Klebsiella pneumoniae',
  'Proteus mirabilis',
  'Streptococcus agalactiae',
  'Fusobacterium nucleatum',
  'Bilophila wadsworthia',
  'Desulfovibrio piger',
  'Ruminococcus gnavus',
];

const PSYCHOBIOTICS = [
  { strain: 'Lactobacillus rhamnosus GG', dose: '10^10 CFU/day', indication: 'Anxiety, depression', evidence: 'Strong - multiple RCTs' },
  { strain: 'Bifidobacterium longum 1714', dose: '10^9 CFU/day', indication: 'Stress, cognitive function', evidence: 'Strong - RCT' },
  { strain: 'Lactobacillus plantarum PS128', dose: '10^10 CFU/day', indication: 'Depression, Parkinson', evidence: 'Moderate - RCT' },
  { strain: 'Bifidobacterium breve MCC1274', dose: '10^10 CFU/day', indication: 'Cognitive decline, anxiety', evidence: 'Moderate - RCT' },
  { strain: 'Lactobacillus helveticus R0052 + B. longum R0175', dose: '3x10^9 CFU/day', indication: 'Psychological distress', evidence: 'Strong - meta-analysis' },
];

export class MicrobiomeModule implements ModuleInterface {
  id = 'microbiome';
  name = 'Microbiome Analysis Engine';
  version = '1.0.0';
  dependencies: string[] = [];
  provides = ['microbiomeProfile'];
  
  private config: Required<MicrobiomeConfig>;
  private hub: PatientContextHub | null = null;

  constructor(config: MicrobiomeConfig = {}) {
    this.config = {
      enableAnalysis: true,
      referenceDatabase: {},
      ...config,
    };
  }

  async compute(patientId: string, hub: PatientContextHub): Promise<ModuleOutput> {
    const start = Date.now();
    this.hub = hub;
    
    const state = await hub.getContext(patientId);
    const profile = this.analyzeMicrobiome(state);
    
    return {
      moduleId: 'microbiome',
      success: true,
      data: { microbiomeProfile: profile },
      durationMs: Date.now() - start,
      errors: [],
      warnings: [],
    };
  }

  async onContextChange(patientId: string, changes: any): Promise<void> {
    const relevantFields = ['microbiomeData', 'dietaryIntake', 'drugs'];
    
    const hasRelevantChange = changes.changedFields.some((f: string) => relevantFields.includes(f));
    
    if (hasRelevantChange && this.hub) {
      const eventBus = this.hub.getEventBus();
      eventBus.emit({
        type: 'MICROBIOME_UPDATED',
        patientId,
        timestamp: new Date().toISOString(),
        source: 'microbiome',
        trigger: 'screening',
      });
    }
  }

  routes = null;
  hooks = {};
  tabs = [
    {
      id: 'microbiome-composition',
      label: 'Composition',
      icon: 'bacteria',
      order: 1,
    },
    {
      id: 'scfa-production',
      label: 'SCFA Production',
      icon: 'flask',
      order: 2,
    },
    {
      id: 'psychobiotics',
      label: 'Psychobiotics',
      icon: 'brain',
      order: 3,
    },
  ];
  actions = [];

  private analyzeMicrobiome(state: any): MicrobiomeProfile {
    const microbiomeData = state.microbiomeData || {};
    const dietaryIntake = state.dietaryIntake || {};
    const drugs = state.drugs || [];
    
    const diversity = this.assessDiversity(microbiomeData, dietaryIntake, drugs);
    const enterotype = this.determineEnterotype(microbiomeData, dietaryIntake);
    const beneficialTaxa = this.assessBeneficialTaxa(microbiomeData);
    const detrimentalTaxa = this.assessDetrimentalTaxa(microbiomeData);
    const scfaProduction = this.assessSCFAProduction(microbiomeData, dietaryIntake);
    const recommendations = this.generateRecommendations(diversity, beneficialTaxa, detrimentalTaxa, scfaProduction, drugs);
    const psychobiotics = this.recommendPsychobiotics(state);
    
    return {
      diversity,
      enterotype,
      beneficialTaxa,
      detrimentalTaxa,
      scfaProduction,
      recommendations,
      psychobiotics,
    };
  }

  private assessDiversity(
    microbiomeData: any,
    dietaryIntake: any,
    drugs: any[]
  ): 'low' | 'moderate' | 'high' {
    let diversityScore = 50;
    
    const fiberIntake = dietaryIntake.fiber || 15;
    if (fiberIntake >= 30) diversityScore += 20;
    else if (fiberIntake >= 20) diversityScore += 10;
    else if (fiberIntake < 15) diversityScore -= 15;
    
    const plantVariety = dietaryIntake.plantVariety || 10;
    if (plantVariety >= 30) diversityScore += 15;
    else if (plantVariety >= 20) diversityScore += 8;
    
    const antibioticUse = drugs.some((d: any) => d.class === 'antibiotic');
    if (antibioticUse) diversityScore -= 25;
    
    const ppiUse = drugs.some((d: any) => d.class === 'proton-pump-inhibitor');
    if (ppiUse) diversityScore -= 10;
    
    const fermentedFoods = dietaryIntake.fermentedFoods || false;
    if (fermentedFoods) diversityScore += 10;
    
    if (microbiomeData.shannonIndex !== undefined) {
      if (microbiomeData.shannonIndex > 4) diversityScore = Math.max(diversityScore, 80);
      else if (microbiomeData.shannonIndex > 3) diversityScore = Math.max(diversityScore, 60);
      else if (microbiomeData.shannonIndex < 2.5) diversityScore = Math.min(diversityScore, 30);
    }
    
    if (diversityScore >= 70) return 'high';
    if (diversityScore >= 40) return 'moderate';
    return 'low';
  }

  private determineEnterotype(microbiomeData: any, dietaryIntake: any): string | undefined {
    if (microbiomeData.enterotype) return microbiomeData.enterotype;
    
    const proteinIntake = dietaryIntake.protein || 70;
    const carbIntake = dietaryIntake.carbohydrates || 250;
    const fatIntake = dietaryIntake.fat || 70;
    const fiberIntake = dietaryIntake.fiber || 15;
    
    if (proteinIntake > 100 && fatIntake > 80) return 'Bacteroides';
    if (carbIntake > 300 && fiberIntake > 25) return 'Prevotella';
    if (dietaryIntake.fiber > 35) return 'Ruminococcus';
    
    return undefined;
  }

  private assessBeneficialTaxa(microbiomeData: any): string[] {
    if (microbiomeData.beneficialTaxa) return microbiomeData.beneficialTaxa;
    
    const present: string[] = [];
    const abundance = microbiomeData.abundance || {};
    
    for (const taxon of BENEFICIAL_TAXA) {
      if (abundance[taxon] > 0.01) present.push(taxon);
    }
    
    return present.length > 0 ? present : ['Not assessed - sample needed'];
  }

  private assessDetrimentalTaxa(microbiomeData: any): string[] {
    if (microbiomeData.detrimentalTaxa) return microbiomeData.detrimentalTaxa;
    
    const present: string[] = [];
    const abundance = microbiomeData.abundance || {};
    
    for (const taxon of DETRIMENTAL_TAXA) {
      if (abundance[taxon] > 0.001) present.push(taxon);
    }
    
    return present.length > 0 ? present : ['Not detected'];
  }

  private assessSCFAProduction(microbiomeData: any, dietaryIntake: any): 'low' | 'moderate' | 'high' {
    let scfaScore = 50;
    
    const fiberIntake = dietaryIntake.fiber || 15;
    if (fiberIntake >= 35) scfaScore += 20;
    else if (fiberIntake >= 25) scfaScore += 10;
    else if (fiberIntake < 20) scfaScore -= 15;
    
    const resistantStarch = dietaryIntake.resistantStarch || 0;
    if (resistantStarch >= 20) scfaScore += 15;
    else if (resistantStarch >= 10) scfaScore += 8;
    
    if (microbiomeData.scfaProfile) {
      const totalSCFA = (microbiomeData.scfaProfile.acetate || 0) + 
                       (microbiomeData.scfaProfile.propionate || 0) + 
                       (microbiomeData.scfaProfile.butyrate || 0);
      if (totalSCFA > 100) scfaScore = Math.max(scfaScore, 80);
      else if (totalSCFA > 60) scfaScore = Math.max(scfaScore, 60);
      else if (totalSCFA < 30) scfaScore = Math.min(scfaScore, 30);
    }
    
    if (scfaScore >= 70) return 'high';
    if (scfaScore >= 40) return 'moderate';
    return 'low';
  }

  private generateRecommendations(
    diversity: string,
    beneficialTaxa: string[],
    detrimentalTaxa: string[],
    scfaProduction: string,
    drugs: any[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (diversity === 'low') {
      recommendations.push('Increase plant diversity to 30+ different plants/week');
      recommendations.push('Add fermented foods daily (yogurt, kefir, sauerkraut, kimchi)');
      recommendations.push('Consider prebiotic supplement (GOS, FOS, inulin) 5-10g/day');
    }
    
    if (beneficialTaxa.length === 0 || beneficialTaxa[0].includes('Not assessed')) {
      recommendations.push('Microbiome sequencing recommended for targeted intervention');
    } else if (beneficialTaxa.length < 3) {
      recommendations.push('Low beneficial taxa - consider multi-strain probiotic with Bifido/Lacto');
    }
    
    if (detrimentalTaxa.length > 0 && !detrimentalTaxa[0].includes('Not detected')) {
      recommendations.push('Pathobionts detected - consider targeted antimicrobial + probiotic');
      recommendations.push('Increase polyphenols (berries, green tea, cocoa) for selective inhibition');
    }
    
    if (scfaProduction === 'low') {
      recommendations.push('Increase resistant starch (cooled potatoes, green bananas, legumes)');
      recommendations.push('Add prebiotic fibers: inulin, GOS, resistant starch');
      recommendations.push('Consider butyrate-producing probiotic (Clostridium butyricum, Faecalibacterium)');
    }
    
    const antibioticUse = drugs.some((d: any) => d.class === 'antibiotic');
    if (antibioticUse) {
      recommendations.push('Antibiotic course - use S. boulardii 250mg BID during and 2 weeks after');
      recommendations.push('Post-antibiotic: high-dose multi-strain probiotic x 4 weeks');
    }
    
    return recommendations;
  }

  private recommendPsychobiotics(state: any): MicrobiomeProfile['psychobiotics'] {
    const hasDepression = state.diagnoses?.some((d: any) => d.code.startsWith('F32') || d.code.startsWith('F33'));
    const hasAnxiety = state.diagnoses?.some((d: any) => d.code.startsWith('F41'));
    const hasStress = state.diagnoses?.some((d: any) => d.code === 'Z73' || d.code.startsWith('R45'));
    const hasCognitive = state.diagnoses?.some((d: any) => d.code.startsWith('F0') || d.code.startsWith('G3'));
    
    const recommended = PSYCHOBIOTICS.filter(p => {
      if (hasDepression && p.indication.includes('depression')) return true;
      if (hasAnxiety && p.indication.includes('anxiety')) return true;
      if (hasStress && p.indication.includes('Stress')) return true;
      if (hasCognitive && p.indication.includes('cognitive')) return true;
      return false;
    });
    
    return recommended.length > 0 ? recommended : PSYCHOBIOTICS.slice(0, 2);
  }
}

export default MicrobiomeModule;