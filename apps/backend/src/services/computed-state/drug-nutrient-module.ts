/**
 * Drug-Nutrient Interaction Alert Module
 * Detects and manages drug-nutrient interactions
 */

import type {
  ModuleInterface,
  ModuleOutput,
  PatientContextHub,
  ModuleState,
  ChangeSet,

  DrugNutrientAlert,
  Diagnosis,
} from '../../types/patient-context.js';

interface DrugNutrientConfig {
  enableAlerts?: boolean;
  severityThreshold?: 'minor' | 'moderate' | 'major' | 'contraindicated';
  drugDatabase?: Record<string, unknown>;
}

const DRUG_NUTRIENT_INTERACTIONS: Record<string, DrugNutrientAlert[]> = {
  'warfarin': [
    {
      drug: 'warfarin',
      drugClass: 'anticoagulant',
      nutrient: 'vitamin K',
      interactionType: 'effect',
      severity: 'major',
      mechanism: 'Vitamin K antagonizes warfarin anticoagulant effect',
      clinicalSignificance: 'Reduced INR, increased thrombosis risk',
      management: 'Maintain consistent vitamin K intake; avoid sudden dietary changes',
      monitoring: 'INR 2-3x/week after dietary changes',
      evidenceGrade: 'A',
      source: 'FDA',
    },
    {
      drug: 'warfarin',
      drugClass: 'anticoagulant',
      nutrient: 'cranberry',
      interactionType: 'metabolism',
      severity: 'moderate',
      mechanism: 'Cranberry inhibits CYP2C9, increasing warfarin levels',
      clinicalSignificance: 'Increased INR, bleeding risk',
      management: 'Avoid large amounts of cranberry juice/products',
      monitoring: 'INR within 1 week of starting/stopping cranberry',
      evidenceGrade: 'B',
      source: 'Clinical reports',
    },
  ],
  'metformin': [
    {
      drug: 'metformin',
      drugClass: 'antidiabetic',
      nutrient: 'vitamin B12',
      interactionType: 'absorption',
      severity: 'moderate',
      mechanism: 'Metformin reduces intrinsic factor-mediated B12 absorption',
      clinicalSignificance: 'B12 deficiency, peripheral neuropathy',
      management: 'Monitor B12 annually; supplement if deficient',
      monitoring: 'Serum B12, methylmalonic acid annually',
      evidenceGrade: 'A',
      source: 'ADA Guidelines',
    },
  ],
  'furosemide': [
    {
      drug: 'furosemide',
      drugClass: 'loop diuretic',
      nutrient: 'potassium',
      interactionType: 'excretion',
      severity: 'major',
      mechanism: 'Increased renal potassium excretion',
      clinicalSignificance: 'Hypokalemia, arrhythmia risk',
      management: 'Potassium supplementation; monitor K+',
      monitoring: 'Serum K+ 1-2x/week initially',
      evidenceGrade: 'A',
      source: 'FDA',
    },
    {
      drug: 'furosemide',
      drugClass: 'loop diuretic',
      nutrient: 'magnesium',
      interactionType: 'excretion',
      severity: 'moderate',
      mechanism: 'Increased renal magnesium excretion',
      clinicalSignificance: 'Hypomagnesemia, worsened hypokalemia',
      management: 'Magnesium supplementation if K+ refractory',
      monitoring: 'Serum Mg2+ monthly',
      evidenceGrade: 'B',
      source: 'Clinical guidelines',
    },
  ],
  'spironolactone': [
    {
      drug: 'spironolactone',
      drugClass: 'potassium-sparing diuretic',
      nutrient: 'potassium',
      interactionType: 'effect',
      severity: 'major',
      mechanism: 'Aldosterone antagonism reduces K+ excretion',
      clinicalSignificance: 'Hyperkalemia, especially with CKD/ACEI',
      management: 'Avoid K+ supplements; limit high-K+ foods',
      monitoring: 'Serum K+ weekly x 1 month, then monthly',
      evidenceGrade: 'A',
      source: 'FDA',
    },
  ],
  'digoxin': [
    {
      drug: 'digoxin',
      drugClass: 'cardiac glycoside',
      nutrient: 'potassium',
      interactionType: 'toxicity',
      severity: 'major',
      mechanism: 'Hypokalemia increases digoxin binding to Na/K-ATPase',
      clinicalSignificance: 'Digoxin toxicity, arrhythmias',
      management: 'Maintain K+ > 4.0 mEq/L; avoid K+ depletion',
      monitoring: 'Serum K+, digoxin level, ECG',
      evidenceGrade: 'A',
      source: 'FDA',
    },
  ],
  'isoniazid': [
    {
      drug: 'isoniazid',
      drugClass: 'antitubercular',
      nutrient: 'vitamin B6',
      interactionType: 'metabolism',
      severity: 'major',
      mechanism: 'INH forms hydrazone with pyridoxal phosphate',
      clinicalSignificance: 'Peripheral neuropathy, seizures',
      management: 'Pyridoxine 25-50 mg/day prophylactically',
      monitoring: 'Neurologic assessment',
      evidenceGrade: 'A',
      source: 'WHO TB Guidelines',
    },
  ],
  'phenytoin': [
    {
      drug: 'phenytoin',
      drugClass: 'anticonvulsant',
      nutrient: 'vitamin D',
      interactionType: 'metabolism',
      severity: 'moderate',
      mechanism: 'Phenytoin induces hepatic CYP450, increasing vitamin D catabolism',
      clinicalSignificance: 'Osteomalacia, fracture risk',
      management: 'Vitamin D 800-2000 IU/day; calcium supplementation',
      monitoring: '25-OH vitamin D, calcium, ALP annually',
      evidenceGrade: 'B',
      source: 'Neurology guidelines',
    },
    {
      drug: 'phenytoin',
      drugClass: 'anticonvulsant',
      nutrient: 'folate',
      interactionType: 'absorption',
      severity: 'moderate',
      mechanism: 'Phenytoin reduces intestinal folate absorption',
      clinicalSignificance: 'Megaloblastic anemia, neural tube defects',
      management: 'Folic acid 1 mg/day; higher in pregnancy',
      monitoring: 'CBC, serum folate',
      evidenceGrade: 'A',
      source: 'FDA',
    },
  ],
  'trimethoprim-sulfamethoxazole': [
    {
      drug: 'trimethoprim-sulfamethoxazole',
      drugClass: 'antibiotic',
      nutrient: 'potassium',
      interactionType: 'excretion',
      severity: 'moderate',
      mechanism: 'Trimethoprim inhibits renal K+ secretion (amiloride-like)',
      clinicalSignificance: 'Hyperkalemia, especially with ACEI/ARB/K-sparing',
      management: 'Monitor K+; consider alternative if high risk',
      monitoring: 'Serum K+ at 3-5 days',
      evidenceGrade: 'B',
      source: 'Clinical reports',
    },
  ],
  'ace-inhibitors': [
    {
      drug: 'ACE inhibitors',
      drugClass: 'antihypertensive',
      nutrient: 'potassium',
      interactionType: 'effect',
      severity: 'moderate',
      mechanism: 'Reduced aldosterone decreases K+ excretion',
      clinicalSignificance: 'Hyperkalemia with CKD/K-sparing/K+ supplements',
      management: 'Monitor K+; avoid K+ supplements unless indicated',
      monitoring: 'Serum K+ 1-2 weeks after initiation/dose change',
      evidenceGrade: 'A',
      source: 'ACC/AHA Guidelines',
    },
  ],
  'proton-pump-inhibitors': [
    {
      drug: 'proton pump inhibitors',
      drugClass: 'antiulcer',
      nutrient: 'vitamin B12',
      interactionType: 'absorption',
      severity: 'moderate',
      mechanism: 'Reduced gastric acid impairs protein-bound B12 absorption',
      clinicalSignificance: 'B12 deficiency with long-term use (>2 years)',
      management: 'Monitor B12 if >2 years; consider sublingual B12',
      monitoring: 'Serum B12 annually if long-term PPI',
      evidenceGrade: 'B',
      source: 'FDA',
    },
    {
      drug: 'proton pump inhibitors',
      drugClass: 'antiulcer',
      nutrient: 'magnesium',
      interactionType: 'absorption',
      severity: 'moderate',
      mechanism: 'Impaired intestinal magnesium absorption',
      clinicalSignificance: 'Hypomagnesemia with long-term use',
      management: 'Monitor Mg2+; supplement if deficient',
      monitoring: 'Serum Mg2+ annually if long-term PPI',
      evidenceGrade: 'B',
      source: 'FDA',
    },
    {
      drug: 'proton pump inhibitors',
      drugClass: 'antiulcer',
      nutrient: 'calcium',
      interactionType: 'absorption',
      severity: 'minor',
      mechanism: 'Reduced acid impairs calcium carbonate absorption',
      clinicalSignificance: 'Possible fracture risk with long-term high-dose',
      management: 'Use calcium citrate instead of carbonate',
      monitoring: 'DEXA if high risk',
      evidenceGrade: 'C',
      source: 'FDA',
    },
  ],
  'levothyroxine': [
    {
      drug: 'levothyroxine',
      drugClass: 'thyroid hormone',
      nutrient: 'calcium',
      interactionType: 'absorption',
      severity: 'moderate',
      mechanism: 'Calcium binds levothyroxine in GI tract',
      clinicalSignificance: 'Reduced T4 absorption, hypothyroidism',
      management: 'Separate administration by 4 hours',
      monitoring: 'TSH 6-8 weeks after changes',
      evidenceGrade: 'A',
      source: 'ATA Guidelines',
    },
    {
      drug: 'levothyroxine',
      drugClass: 'thyroid hormone',
      nutrient: 'iron',
      interactionType: 'absorption',
      severity: 'moderate',
      mechanism: 'Iron binds levothyroxine in GI tract',
      clinicalSignificance: 'Reduced T4 absorption',
      management: 'Separate administration by 4 hours',
      monitoring: 'TSH 6-8 weeks after changes',
      evidenceGrade: 'A',
      source: 'ATA Guidelines',
    },
    {
      drug: 'levothyroxine',
      drugClass: 'thyroid hormone',
      nutrient: 'soy',
      interactionType: 'absorption',
      severity: 'moderate',
      mechanism: 'Soy protein reduces levothyroxine absorption',
      clinicalSignificance: 'Variable T4 absorption',
      management: 'Separate soy products by 4 hours',
      monitoring: 'TSH if dietary changes',
      evidenceGrade: 'B',
      source: 'Clinical studies',
    },
  ],
};

export class DrugNutrientModule implements ModuleInterface {
  id = 'drug-nutrient';
  name = 'Drug-Nutrient Interaction Engine';
  version = '1.0.0';
  dependencies: string[] = [];
  provides = ['drugNutrientAlerts'];
  
  private config: Required<DrugNutrientConfig>;
  private hub: PatientContextHub | null = null;

  constructor(config: DrugNutrientConfig = {}) {
    this.config = {
      enableAlerts: true,
      severityThreshold: 'minor',
      drugDatabase: {},
      ...config,
    };
  }

  async compute(patientId: string, hub: PatientContextHub): Promise<ModuleOutput> {
    const start = Date.now();
    this.hub = hub;
    
    const state = await hub.getContext(patientId);
    const alerts = this.detectInteractions(state);
    
    return {
      moduleId: 'drug-nutrient',
      success: true,
      data: { drugNutrientAlerts: alerts },
      durationMs: Date.now() - start,
      errors: [],
      warnings: [],
    };
  }

  async onContextChange(patientId: string, changes: ChangeSet): Promise<void> {
    const relevantFields = [
      'diagnoses',
      'drugs',
      'labs',
      'nutrientIntake',
    ];
    
    const hasRelevantChange = changes.changedFields.some((f: string) => relevantFields.includes(f));
    
    if (hasRelevantChange && this.hub) {
      const eventBus = this.hub.getEventBus();
      eventBus.emit({
        type: 'DRUG_NUTRIENT_ALERTS_UPDATED',
        patientId,
        timestamp: new Date().toISOString(),
        source: 'drug-nutrient',
        trigger: 'diagnosis',
      });
    }
  }

  routes = null;
  hooks = {};
  tabs = [
    {
      id: 'drug-nutrient-alerts',
      label: 'Drug-Nutrient Alerts',
      icon: 'pills',
      order: 1,
      badge: (ctx: ModuleState) => ctx.drugNutrientAlerts?.filter((a: DrugNutrientAlert) => 
        a.severity === 'major' || a.severity === 'contraindicated'
      ).length > 0 ? String(ctx.drugNutrientAlerts.filter((a: DrugNutrientAlert) => 
        a.severity === 'major' || a.severity === 'contraindicated'
      ).length) : null,
    },
  ];
  actions = [];

  private detectInteractions(state: ModuleState): DrugNutrientAlert[] {
    const alerts: DrugNutrientAlert[] = [];
    const drugs = this.extractDrugs(state);
    
    for (const drug of drugs) {
      const drugKey = this.normalizeDrugName(drug);
      const interactions = DRUG_NUTRIENT_INTERACTIONS[drugKey] || [];
      
      for (const interaction of interactions) {
        if (this.meetsSeverityThreshold(interaction.severity)) {
          alerts.push(interaction);
        }
      }
    }
    
    return this.deduplicateAlerts(alerts);
  }

  private extractDrugs(state: ModuleState): string[] {
    const drugs: string[] = [];
    
    if (state.drugs) {
      state.drugs?.forEach((d) => {
        if (d.name) drugs.push(d.name.toLowerCase());
        if (d.class) drugs.push(d.class.toLowerCase());
      });
    }
    
    if (state.diagnoses) {
      state.diagnoses.forEach((d: Diagnosis) => {
        if (d.code.startsWith('C')) drugs.push('chemotherapy');
      });
    }
    
    return [...new Set(drugs)];
  }

  private normalizeDrugName(drug: string): string {
    const normalized = drug.toLowerCase().trim();
    
    const aliases: Record<string, string> = {
      'coumadin': 'warfarin',
      'lasix': 'furosemide',
      'aldactone': 'spironolactone',
      'lanoxin': 'digoxin',
      'inh': 'isoniazid',
      'dilantin': 'phenytoin',
      'bactrim': 'trimethoprim-sulfamethoxazole',
      'septra': 'trimethoprim-sulfamethoxazole',
      'lisinopril': 'ace-inhibitors',
      'enalapril': 'ace-inhibitors',
      'omeprazole': 'proton-pump-inhibitors',
      'pantoprazole': 'proton-pump-inhibitors',
      'esomeprazole': 'proton-pump-inhibitors',
      'synthroid': 'levothyroxine',
      'levoxyl': 'levothyroxine',
    };
    
    return aliases[normalized] || normalized;
  }

  private meetsSeverityThreshold(severity: string): boolean {
    const levels = { minor: 1, moderate: 2, major: 3, contraindicated: 4 };
    const threshold = levels[this.config.severityThreshold] || 1;
    return (levels[severity as keyof typeof levels] || 0) >= threshold;
  }

  private deduplicateAlerts(alerts: DrugNutrientAlert[]): DrugNutrientAlert[] {
    const seen = new Set<string>();
    return alerts.filter(alert => {
      const key = `${alert.drug}-${alert.nutrient}-${alert.interactionType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export default DrugNutrientModule;