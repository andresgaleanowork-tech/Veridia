/**
 * Patient Context Hub - Event Bus
 * Typed EventEmitter for Cross-Module Communication
 */

import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('EVENT-BUS');
import type {
  PatientEvent,
  EventType,
  ModuleSubscription,
  ModuleSubscriptionOptions,
} from '../types/events.js';

/**
 * Typed Event Bus for Patient Context Hub
 * Provides type-safe event emission and subscription
 */
export class PatientEventBus {
  private emitter = new EventEmitter();
  private subscriptions = new Map<string, ModuleSubscription[]>();
  private eventHistory: PatientEvent[] = [];
  private maxHistorySize = 1000;
  private debug = false;

  constructor(options?: { maxHistorySize?: number; debug?: boolean }) {
    this.maxHistorySize = options?.maxHistorySize || 1000;
    this.debug = options?.debug || false;
    
    this.emitter.setMaxListeners(1000);
  }

  on(
    type: EventType,
    listener: (event: PatientEvent) => void
  ): () => void {
    const wrappedListener = (event: PatientEvent) => {
      listener(event);
    };
    
    this.emitter.on(type, wrappedListener);
    
    return () => {
      this.off(type, wrappedListener);
    };
  }

  once(
    type: EventType,
    listener: (event: PatientEvent) => void
  ): () => void {
    const wrappedListener = (event: PatientEvent) => {
      listener(event);
    };
    
    this.emitter.once(type, wrappedListener);
    
    return () => {
      this.off(type, wrappedListener);
    };
  }

  emit<T extends PatientEvent>(event: T): boolean {
    this.addToHistory(event);
    
    if (this.debug) {
      logger.debug(`[EventBus] ${event.type}`, {
        patientId: event.patientId,
        source: event.source,
        timestamp: event.timestamp,
      });
    }
    
    const result = this.emitter.emit(event.type, event);
    this.emitter.emit('*', event);
    
    return result;
  }

  off(type: string, listener: (event: PatientEvent) => void): this {
    this.emitter.off(type, listener);
    return this;
  }

  subscribe(
    moduleId: string,
    patientId: string,
    options: ModuleSubscriptionOptions
  ): () => void {
    const { eventTypes, filter } = options;
    const callbacks: Array<() => void> = [];
    
    for (const eventType of eventTypes) {
      const listener = (event: PatientEvent) => {
        if (event.patientId !== patientId) return;
        if (filter && !filter(event)) return;
      };
      
      this.on(eventType, listener);
      callbacks.push(() => this.off(eventType, listener));
    }
    
    const subscription: ModuleSubscription = {
      moduleId,
      patientId,
      eventTypes,
      callback: () => {},
      filter,
    };
    
    const existing = this.subscriptions.get(moduleId) || [];
    existing.push(subscription);
    this.subscriptions.set(moduleId, existing);
    
    return () => {
      callbacks.forEach(unsub => unsub());
      const subs = this.subscriptions.get(moduleId) || [];
      this.subscriptions.set(moduleId, subs.filter(s => s.moduleId !== moduleId));
    };
  }

  unsubscribeModule(moduleId: string): void {
    const subscriptions = this.subscriptions.get(moduleId) || [];
    for (const sub of subscriptions) {
      for (const eventType of sub.eventTypes) {
        this.emitter.off(eventType, sub.callback);
      }
    }
    this.subscriptions.delete(moduleId);
  }

  getModuleSubscriptions(moduleId: string): ModuleSubscription[] {
    return this.subscriptions.get(moduleId) || [];
  }

  getHistory(patientId?: string, type?: EventType, limit = 100): PatientEvent[] {
    let filtered = this.eventHistory;
    
    if (patientId) {
      filtered = filtered.filter(e => e.patientId === patientId);
    }
    
    if (type) {
      filtered = filtered.filter(e => e.type === type);
    }
    
    return filtered.slice(-limit);
  }

  clearHistory(): void {
    this.eventHistory = [];
  }

  setDebug(enabled: boolean): void {
    this.debug = enabled;
  }

  getListenerCount(type: EventType): number {
    return this.emitter.listenerCount(type);
  }

  private addToHistory(event: PatientEvent): void {
    this.eventHistory.push(event);
    
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }
}

/**
 * Factory function to create typed event bus
 */
export function createPatientEventBus(options?: { maxHistorySize?: number; debug?: boolean }): PatientEventBus {
  return new PatientEventBus(options);
}

/**
 * Type-safe event emitter for a specific patient
 */
export class PatientScopedEventBus {
  private bus: PatientEventBus;
  private patientId: string;
  private source: string;

  constructor(bus: PatientEventBus, patientId: string, source: string) {
    this.bus = bus;
    this.patientId = patientId;
    this.source = source;
  }

  emit<T extends PatientEvent>(
    type: T['type'],
    payload: Omit<T, 'type' | 'patientId' | 'timestamp' | 'source'>
  ): boolean {
    const event = {
      type,
      patientId: this.patientId,
      timestamp: new Date().toISOString(),
      source: this.source,
      ...payload
    } as T;
    
    return this.bus.emit(event);
  }

  on(
    type: EventType,
    listener: (event: PatientEvent) => void
  ): () => void {
    return this.bus.on(type, listener);
  }

  once(
    type: EventType,
    listener: (event: PatientEvent) => void
  ): () => void {
    return this.bus.once(type, listener);
  }

  getHistory(type?: EventType, limit = 100): PatientEvent[] {
    return this.bus.getHistory(this.patientId, type, limit);
  }
}

let globalEventBus: PatientEventBus | null = null;

export function getGlobalEventBus(): PatientEventBus {
  if (!globalEventBus) {
    globalEventBus = new PatientEventBus({ debug: process.env.NODE_ENV !== 'production' });
  }
  return globalEventBus;
}

export function setGlobalEventBus(bus: PatientEventBus): void {
  globalEventBus = bus;
}

export const createEventBus = createPatientEventBus;