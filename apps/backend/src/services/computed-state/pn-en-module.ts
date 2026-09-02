/**
 * PN/EN (Parenteral/Enteral Nutrition) Prescription Module
 * Calculates PN and EN prescriptions based on patient clinical state
 */

import type {
  ModuleInterface,
  ModuleOutput,
  PatientContextHub,
  ModuleState,
  ChangeSet,

  PNENPrescription,
  PNPrescription,
  ENPrescription,
  Diagnosis,
} from '../../types/patient-context.js';

interface PNENConfig {
  enablePN?: boolean;
  enableEN?: boolean;
  defaultAAProduct?: string;
  defaultLipidProduct?: string;
  defaultENFormula?: string;
  maxOsmolarityPeripheral?: number;
  maxOsmolarityCentral?: number;
}

export class PNENModule implements ModuleInterface {
  id = 'pn-en';
  name = 'PN/EN Prescription Engine';
  version = '1.0.0';
  dependencies: string[] = ['espen'];
  provides = ['pnEnPrescription'];
  
  private config: Required<PNENConfig>;
  private hub: PatientContextHub | null = null;

  constructor(config: PNENConfig = {}) {
    this.config = {
      enablePN: true,
      enableEN: true,
      defaultAAProduct: 'Aminoven 10%',
      defaultLipidProduct: 'SMOFlipid 20%',
      defaultENFormula: 'Nutrison Energy',
      maxOsmolarityPeripheral: 900,
      maxOsmolarityCentral: 2500,
      ...config,
    };
  }

  async compute(patientId: string, hub: PatientContextHub): Promise<ModuleOutput> {
    const start = Date.now();
    this.hub = hub;
    
    const state = await hub.getContext(patientId);
    const prescription = this.calculatePrescription(state);
    
    return {
      moduleId: 'pn-en',
      success: true,
      data: { pnEnPrescription: prescription },
      durationMs: Date.now() - start,
      errors: [],
      warnings: [],
    };
  }

  async onContextChange(patientId: string, changes: ChangeSet): Promise<void> {
    const relevantFields = [
      'diagnoses',
      'anthropometry.weight',
      'labs.albumin',
      'labs.electrolytes',
      'espenTargets',
    ];
    
    const hasRelevantChange = changes.changedFields.some((f: string) => relevantFields.includes(f));
    
    if (hasRelevantChange && this.hub) {
      const eventBus = this.hub.getEventBus();
      eventBus.emit({
        type: 'PN_PRESCRIPTION_UPDATED',
        patientId,
        timestamp: new Date().toISOString(),
        source: 'pn-en',
        trigger: 'labs',
      });
    }
  }

  routes = null;
  hooks = {};
  tabs = [
    {
      id: 'pn-prescription',
      label: 'PN Prescription',
      icon: 'iv-bag',
      order: 1,
    },
    {
      id: 'en-prescription',
      label: 'EN Prescription',
      icon: 'syringe',
      order: 2,
    },
  ];
  actions = [];

  private calculatePrescription(state: ModuleState): PNENPrescription {
    const weight = state.anthropometry?.weight || 70;
    const espenTargets = state.espenTargets;
    
    const energyTarget = espenTargets?.energy?.value || 25 * weight;
    const proteinTarget = espenTargets?.protein?.value || 1.5 * weight;
    
    const needsPN = this.assessPNIndication(state);
    const needsEN = this.assessENIndication(state);
    
    const pn = needsPN ? this.calculatePN(weight, energyTarget, proteinTarget) : undefined;
    const en = needsEN ? this.calculateEN(weight, energyTarget, proteinTarget) : undefined;
    
    const route = pn && en ? 'PN+EN' : pn ? 'PN' : en ? 'EN' : 'PN';
    
    return {
      pn,
      en,
      route,
      indication: this.getIndication(state),
      goals: this.getGoals(),
      monitoring: this.getMonitoringPlan(),
      contraindications: this.getContraindications(state),
      precautions: this.getPrecautions(),
    };
  }

  private assessPNIndication(state: ModuleState): boolean {
    const diagnoses = state.diagnoses || [];
    const giFailure = diagnoses.some((d: Diagnosis) => 
      d.code.startsWith('K5') || d.code.startsWith('K6') || d.code === 'K91.2'
    );
    const severeMalabsorption = diagnoses.some((d: Diagnosis) => 
      d.code === 'K90.0' || d.code === 'K90.1' || d.code === 'K90.2'
    );
    const bowelObstruction = diagnoses.some((d: Diagnosis) => 
      d.code.startsWith('K56')
    );
    const highOutputFistula = diagnoses.some((d: Diagnosis) => 
      d.code.startsWith('K63.2')
    );
    
    return giFailure || severeMalabsorption || bowelObstruction || highOutputFistula;
  }

  private assessENIndication(state: ModuleState): boolean {
    const diagnoses = state.diagnoses || [];
    const functionalGI = diagnoses.some((d: Diagnosis) => 
      d.code.startsWith('K2') || d.code.startsWith('K3') || d.code.startsWith('K59')
    );
    const dysphagia = diagnoses.some((d: Diagnosis) => 
      d.code === 'R13'
    );
    const criticalIllness = diagnoses.some((d: Diagnosis) => 
      d.code.startsWith('R') || d.code.startsWith('J96')
    );
    
    const espenTargets = state.espenTargets;
    const cannotMeetOrally = espenTargets && espenTargets.adherenceStatus === 'below';
    
    return functionalGI || dysphagia || criticalIllness || cannotMeetOrally;
  }

  private calculatePN(
    weight: number,
    energyTarget: number,
    proteinTarget: number
  ): PNPrescription {
    const nonProteinEnergy = energyTarget - (proteinTarget * 4);
    const nitrogenBalance = (proteinTarget / 6.25) - (weight * 0.05);
    
    const aaGrams = proteinTarget;
    const aaPerKg = proteinTarget / weight;
    const dextroseGrams = Math.min(nonProteinEnergy * 0.7 / 3.4, weight * 5);
    const lipidGrams = Math.max(0, (nonProteinEnergy - dextroseGrams * 3.4) / 9);
    
    const totalVolume = this.calculatePNVolume(aaGrams, dextroseGrams, lipidGrams);
    const osmolarity = this.calculateOsmolarity(aaGrams, dextroseGrams, totalVolume);
    
    const accessType = osmolarity > this.config.maxOsmolarityPeripheral ? 'central' : 'peripheral';
    
    const electrolytes = this.calculateElectrolytes(weight);
    const vitamins = { product: 'Soluvit N', volume: 10 };
    const traceElements = { product: 'Addamel N', volume: 10 };
    
    return {
      id: `pn-${Date.now()}`,
      accessType,
      aminoAcids: { g: aaGrams, gPerKg: aaPerKg, product: this.config.defaultAAProduct },
      dextrose: { g: dextroseGrams, gPerKg: dextroseGrams / weight, concentration: 25 },
      lipids: { g: lipidGrams, gPerKg: lipidGrams / weight, product: this.config.defaultLipidProduct, omega3: true },
      electrolytes,
      vitamins,
      traceElements,
      totalVolume,
      totalEnergy: energyTarget,
      nonProteinEnergy,
      nitrogenBalance,
      osmolarity,
      infusionRate: totalVolume / 24,
      duration: 24,
      compatibility: osmolarity <= this.config.maxOsmolarityCentral ? 'verified' : 'warning',
      compatibilityNotes: osmolarity > this.config.maxOsmolarityCentral 
        ? ['High osmolarity - requires central line'] 
        : [],
    };
  }

  private calculateEN(
    weight: number,
    energyTarget: number,
    proteinTarget: number
  ): ENPrescription {
    const concentration = 1.5; // kcal/ml standard
    const volume = energyTarget / concentration;
    const rate = volume / 24;
    
    const protein = proteinTarget;
    const carbs = energyTarget * 0.5 / 4;
    const fat = energyTarget * 0.3 / 9;
    const fiber = 15;
    
    return {
      id: `en-${Date.now()}`,
      formula: this.config.defaultENFormula,
      route: volume > 1500 ? 'post-pyloric' : 'gastric',
      concentration,
      rate,
      volume,
      totalEnergy: energyTarget,
      protein,
      carbs,
      fat,
      fiber,
      osmolarity: 350,
      schedule: volume > 1500 ? 'continuous' : 'bolus',
    };
  }

  private calculatePNVolume(aaGrams: number, dextroseGrams: number, lipidGrams: number): number {
    const aaVolume = aaGrams / 0.1;
    const dextroseVolume = dextroseGrams / 0.25;
    const lipidVolume = lipidGrams / 0.2;
    const electrolyteVolume = 100;
    const vitaminVolume = 20;
    
    return aaVolume + dextroseVolume + lipidVolume + electrolyteVolume + vitaminVolume;
  }

  private calculateOsmolarity(aaGrams: number, dextroseGrams: number, volume: number): number {
    const aaOsm = aaGrams * 10;
    const dextroseOsm = dextroseGrams * 5;
    return (aaOsm + dextroseOsm) / (volume / 1000);
  }

  private calculateElectrolytes(weight: number) {
    return {
      sodium: 35 * weight,
      potassium: 20 * weight,
      magnesium: 10 * weight,
      phosphate: 15 * weight,
      calcium: 5 * weight,
      acetate: 30 * weight,
    };
  }

  private getIndication(state: ModuleState): string {
    const indications: string[] = [];
    
    if (this.assessPNIndication(state)) indications.push('GI failure/malabsorption');
    if (this.assessENIndication(state)) indications.push('Functional GI with increased needs');
    
    return indications.join('; ') || 'Nutritional support';
  }

  private getGoals(): string[] {
    return [
      'Meet energy and protein targets',
      'Maintain electrolyte balance',
      'Monitor for refeeding syndrome',
      'Prevent catheter-related complications',
    ];
  }

  private getMonitoringPlan(): { parameter: string; frequency: string; target: string }[] {
    return [
      { parameter: 'Glucose', frequency: 'Q6H', target: '80-180 mg/dL' },
      { parameter: 'Electrolytes', frequency: 'Daily', target: 'Normal range' },
      { parameter: 'Liver function', frequency: 'Weekly', target: 'Stable' },
      { parameter: 'Triglycerides', frequency: 'Weekly', target: '< 400 mg/dL' },
      { parameter: 'Weight', frequency: 'Daily', target: 'Stable' },
    ];
  }

  private getContraindications(state: ModuleState): string[] {
    const contraindications: string[] = [];
    
    if ((state.labs?.triglycerides ?? 0) > 400) {
      contraindications.push('Severe hypertriglyceridemia (lipids contraindicated)');
    }
    
    return contraindications;
  }

  private getPrecautions(): string[] {
    return [
      'Monitor for refeeding syndrome in malnourished patients',
      'Adjust electrolytes based on daily labs',
      'Check line patency and infection signs',
      'Wean EN as oral intake improves',
    ];
  }
}

export default PNENModule;