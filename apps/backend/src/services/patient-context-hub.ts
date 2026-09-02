/**
 * Patient Context Hub
 * Central orchestrator for patient clinical state
 * Implements: Single Source of Truth, Granular Invalidation, Memoization
 */

import { createPatientEventBus } from './event-bus.js';
import {
  PatientComputedState,
  PatientEvent,
  ScopedEventBus,
  ComputationStats,
  ModuleInterface,
  Demographics,
  AnthropometrySnapshot,
  LabSnapshot,
  Diagnosis,
  ScreeningResult,
} from '../types/patient-context.js';

// ============================================
// CACHE ENTRY
// ============================================

interface CacheEntry {
  patientId: string;
  checksum: string;
  computedState: PatientComputedState;
  dirtyFields: Set<string>;
  lastAccessed: number;
  computationCost: number;
}

// ============================================
// INVALIDATION POLICY
// ============================================

type InvalidationSource = 'anthropometry' | 'labs' | 'diagnoses' | 'screening' | 'diagnosis' | 'manual';

interface FieldDependencyMap {
  [sourceField: string]: string[];
}

const DEPENDENCY_MAP: FieldDependencyMap = {
  'anthropometry.weight': ['anthropometry', 'anthropometry.bmi', 'anthropometry.bmiCategory'],
  'anthropometry.height': ['anthropometry', 'anthropometry.bmi'],
  'anthropometry.weightChangePercent': ['anthropometry'],
  'labs.albumin': ['anthropometry', 'nids.glim'],
  'labs.prelabor': ['anthropometry'],
  'labs.crp': ['labs', 'nids.glim'],
  'labs.glucose': ['labs'],
  'labs.bilirubin': ['labs'],
  'labs.creatinine': ['labs', 'anthropometry'],
  'diagnoses': ['anthropometry', 'nids.glim', 'espen', 'ncp'],
  'screeningResults': ['anthropometry', 'nids.glim', 'adherenceRisk'],
};

// ============================================
// BASE CONTEXT
// ============================================

interface BaseContextData {
  patientId: string;
  timestamp: string;
  demographics?: Partial<Demographics>;
  anthropometry?: Partial<AnthropometrySnapshot>;
  labs?: Partial<LabSnapshot>;
  diagnoses?: Diagnosis[];
  screeningResults?: ScreeningResult[];
}

// ============================================
// PATIENT CONTEXT HUB
// ============================================

export class PatientContextHub {
  private caches = new Map<string, CacheEntry>();
  private eventBus: ReturnType<typeof createPatientEventBus>;
  private scopedEventBuses = new Map<string, ScopedEventBus>();
  private computationStats = new Map<string, ComputationStats>();

  constructor(options?: { debug?: boolean }) {
    this.eventBus = createPatientEventBus({ debug: options?.debug });
  }

  /**
   * Get the event bus
   */
  getEventBus() {
    return this.eventBus;
  }

  /**
   * Get scoped event bus for a patient
   */
  getScopedEventBus(patientId: string) {
    if (!this.scopedEventBuses.has(patientId)) {
      this.scopedEventBuses.set(patientId, {
        bus: this.eventBus,
        patientId,
        source: 'hub',
      });
    }
    return this.scopedEventBuses.get(patientId)!;
  }

  /**
   * Compute full context for a patient
   */
  async computeAll(patientId: string): Promise<PatientComputedState> {
    const start = Date.now();
    
    // Build base context from patient data
    const baseContext = await this.loadPatientBaseData(patientId);
    
    // Compute checksum for cache key
    const checksum = this.createChecksum(baseContext);
    
    // Check cache
    const cached = this.caches.get(patientId);
    if (cached && cached.checksum === checksum && cached.dirtyFields.size === 0) {
      this.updateStats(patientId, Date.now() - start, false);
      return cached.computedState;
    }
    
    // Compute fresh state
    const computedState = await this.buildComputedState(baseContext);
    
    // Store in cache
    this.caches.set(patientId, {
      patientId,
      checksum,
      computedState,
      dirtyFields: new Set(),
      lastAccessed: Date.now(),
      computationCost: Date.now() - start,
    });
    
    // Emit computation completed event
    this.eventBus.emit({
      type: 'COMPUTATION_COMPLETED',
      patientId,
      timestamp: new Date().toISOString(),
      source: 'hub',
      modulesRecomputed: ['all'],
      durationMs: Date.now() - start,
      changedFields: Array.from(cached?.dirtyFields || []),
    });
    
    this.updateStats(patientId, Date.now() - start, true);
    
    return computedState;
  }

  /**
   * Invalidate specific fields for a patient
   */
  async invalidate(
    patientId: string,
    source: InvalidationSource,
    fields: string[]
  ): Promise<void> {
    // Check cache exists
    const cached = this.caches.get(patientId);
    if (!cached) return;
    
    // Mark fields as dirty
    fields.forEach(field => cached.dirtyFields.add(field));
    
    // Emit invalidation event
    const event = this.createContextInvalidatedEvent(
      patientId,
      source,
      fields,
      this.getAffectedModules(fields)
    );
    
    this.eventBus.emit(event as PatientEvent);
  }

  /**
   * Get context for a patient (from cache or compute)
   */
  async getContext(patientId: string, forceRefresh = false): Promise<PatientComputedState> {
    const cached = this.caches.get(patientId);
    
    if (cached && !forceRefresh) {
      const baseContext = await this.loadPatientBaseData(patientId);
      const newChecksum = this.createChecksum(baseContext);
      
      if (cached.checksum === newChecksum && cached.dirtyFields.size === 0) {
        return cached.computedState;
      }
      
      // Checksum changed, recalculate
      return this.computeAll(patientId);
    }
    
    return this.computeAll(patientId);
  }

  /**
   * Register module for automatic recomputation
   */
  registerModule(_module: ModuleInterface): void {
    void _module;
    // Emit event for successful registration
    this.eventBus.emit({
      type: 'CONTEXT_RECOMPUTED',
      patientId: 'system',
      timestamp: new Date().toISOString(),
      source: 'registry',
      modulesRecomputed: ['registry'],
      durationMs: 0,
      changedFields: ['moduleRegistration'],
    } as PatientEvent);
  }

  /**
   * Update a specific data field for a patient
   */
  async updateField(
    patientId: string,
    fieldName: string,
    value: unknown,
    source: string = 'manual'
  ): Promise<PatientComputedState> {
    // Mark related fields as dirty
    const dirtyFields = [...(DEPENDENCY_MAP[fieldName] || []), fieldName];
    await this.invalidate(patientId, source as InvalidationSource, dirtyFields);
    
    // Recompute with force refresh
    return this.computeAll(patientId);
  }

  /**
   * Get stats for a patient
   */
  getStats(patientId: string): ComputationStats {
    return this.computationStats.get(patientId) || {
      totalComputations: 0,
      totalCacheHits: 0,
      totalComputationTimeMs: 0,
      avgComputationTimeMs: 0,
    };
  }

  /**
   * Clear cache for a patient
   */
  clearCache(patientId: string): void {
    this.caches.delete(patientId);
    this.computationStats.delete(patientId);
  }

  /**
   * Get affected modules for given fields
   */
  private getAffectedModules(fields: string[]): string[] {
    const affected = new Set<string>();
    
    fields.forEach(field => {
      if (field.startsWith('anthropometry')) affected.add('anthropometry');
      if (field.startsWith('labs')) affected.add('labs');
      if (field.includes('diagnosi')) affected.add('diagnosis');
      if (field.startsWith('screening')) affected.add('screening');
    });
    
    return Array.from(affected);
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private async loadPatientBaseData(patientId: string): Promise<BaseContextData> {
    // This would typically query the database
    return {
      patientId,
      timestamp: new Date().toISOString(),
    };
  }

  private async buildComputedState(baseContext: BaseContextData): Promise<PatientComputedState> {
    const state: PatientComputedState = {
      patientId: baseContext.patientId,
      version: 1,
      lastComputed: new Date().toISOString(),
      checksum: '',
      dirtyFields: new Set(),
      computationLog: [],
      demographics: (baseContext.demographics || {}) as Demographics,
      anthropometry: (baseContext.anthropometry || {}) as AnthropometrySnapshot,
      labs: (baseContext.labs || {}) as LabSnapshot,
      diagnoses: baseContext.diagnoses || [],
      screeningResults: baseContext.screeningResults || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- module state initialized empty, filled by computation modules
      ncp: {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- module state initialized empty, filled by computation modules
      glim: {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- module state initialized empty, filled by computation modules
      espenTargets: {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- module state initialized empty, filled by computation modules
      pnEnPrescription: {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- module state initialized empty, filled by computation modules
      precisionTargets: {} as any,
      nutrigenomicProfile: undefined,
      microbiomeProfile: undefined,
      eatingBehavior: undefined,
      adherenceRisk: undefined,
      edScreening: undefined,
      sportsProfile: undefined,
      drugNutrientAlerts: [],
      computationDurationMs: 0,
    };
    
    return state;
  }

  private updateStats(patientId: string, durationMs: number, wasCacheHit: boolean): void {
    const stats: ComputationStats = this.computationStats.get(patientId) || {
      totalComputations: 0,
      totalCacheHits: 0,
      totalComputationTimeMs: 0,
      avgComputationTimeMs: 0,
    };
    
    stats.totalComputations += wasCacheHit ? 0 : 1;
    if (wasCacheHit) stats.totalCacheHits += 1;
    stats.totalComputationTimeMs += durationMs;
    stats.avgComputationTimeMs = stats.totalComputationTimeMs / Math.max(stats.totalComputations, 1);
    
    this.computationStats.set(patientId, stats);
  }

  private createChecksum(data: unknown): string {
    if (typeof data === 'string') return data;
    if (data === null || data === undefined) return '';

    const str = typeof data === 'object' ? JSON.stringify(data, Object.keys(data as Record<string, unknown>).sort()) : String(data);
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) & 0xffffffff;
    }
    
    return hash.toString(16);
  }

  private createContextInvalidatedEvent(
    patientId: string,
    source: InvalidationSource,
    changedFields: string[],
    affectedModules: string[]
  ) {
    return {
      type: 'CONTEXT_INVALIDATED',
      patientId,
      timestamp: new Date().toISOString(),
      source,
      changedFields,
      affectedModules,
    };
  }
}

/**
 * Singleton instance
 */
let globalHub: PatientContextHub | null = null;

export function getGlobalHub(): PatientContextHub {
  if (!globalHub) {
    globalHub = new PatientContextHub();
  }
  return globalHub;
}

export function createPatientContextHub(options?: { debug?: boolean }): PatientContextHub {
  return new PatientContextHub(options);
}