/**
 * Patient Context Hub - Module Registry
 * Manages module registration, dependency resolution, and topological ordering
 */

import type { ModuleInterface, PatientComputedState, ModuleOutput } from '../types/patient-context.js';
import type { PatientContextHub } from './patient-context-hub.js';

interface ModuleRegistryOptions {
  detectCycles?: boolean;
  allowPartialDependencies?: boolean;
  autoRecomputeOrder?: string[];
}

export class ModuleRegistry {
  private modules = new Map<string, ModuleInterface>();
  private hub: PatientContextHub;
  private options: Required<ModuleRegistryOptions>;
  private dependencyGraph = new Map<string, string[]>();

  constructor(hub: PatientContextHub, options: ModuleRegistryOptions = {}) {
    this.hub = hub;
    this.options = {
      detectCycles: true,
      allowPartialDependencies: options.allowPartialDependencies ?? false,
      autoRecomputeOrder: options.autoRecomputeOrder ?? [],
    };
  }

  register(module: ModuleInterface): void {
    if (this.modules.has(module.id)) {
      throw new Error(`Module with id "${module.id}" is already registered`);
    }

    if (this.options.detectCycles) {
      this.validateNoCycles(module);
    }

    if (!this.options.allowPartialDependencies) {
      this.validateDependencies(module);
    }

    this.modules.set(module.id, module);
    this.dependencyGraph.set(module.id, [...module.dependencies]);
  }

  unregister(moduleId: string): boolean {
    const removed = this.modules.delete(moduleId);
    if (removed) {
      this.dependencyGraph.delete(moduleId);
    }
    return removed;
  }

  getModule(id: string): ModuleInterface | undefined {
    return this.modules.get(id);
  }

  getAllModules(): ModuleInterface[] {
    return Array.from(this.modules.values());
  }

  getModulesByPattern(pattern: RegExp): ModuleInterface[] {
    return this.getAllModules().filter(m => pattern.test(m.id));
  }

  getComputationOrder(modules?: string[]): string[] {
    const targetModules = new Set(modules || Array.from(this.modules.keys()));
    const visited = new Set<string>();
    const result: string[] = [];
    const temp = new Set<string>();

    const visit = (moduleId: string) => {
      if (visited.has(moduleId)) return;
      if (temp.has(moduleId)) {
        throw new Error(`Circular dependency detected involving module "${moduleId}"`);
      }
      
      temp.add(moduleId);
      
      const module = this.modules.get(moduleId);
      if (module) {
        for (const dep of module.dependencies) {
          if (targetModules.has(dep)) {
            visit(dep);
          }
        }
      }
      
      temp.delete(moduleId);
      visited.add(moduleId);
      result.push(moduleId);
    };

    for (const moduleId of targetModules) {
      if (this.modules.has(moduleId)) {
        visit(moduleId);
      }
    }

    return result;
  }

  getAffectedModules(changedFields: string[]): string[] {
    const affected = new Set<string>();
    const reverseDeps = this.buildReverseDependencyGraph();
    
    changedFields.forEach(field => {
      const modules = reverseDeps.get(field) || [];
      modules.forEach(m => affected.add(m));
    });
    
    return Array.from(affected);
  }

  async computePatientContext(patientId: string): Promise<PatientComputedState> {
    const order = this.getComputationOrder();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic module hub interface
    let state = await (this.hub as any).buildComputedState({ patientId });
    
    for (const moduleId of order) {
      const module = this.modules.get(moduleId);
      if (module) {
        try {
          const output = await module.compute(patientId, this.hub);
          state = this.mergeModuleOutput(state, output);
        } catch (error) {
          console.error(`Module ${moduleId} failed to compute:`, error);
        }
      }
    }
    
    return state;
  }

  private mergeModuleOutput(state: PatientComputedState, output: ModuleOutput): PatientComputedState {
    Object.assign(state, output.data);
    return state;
  }

  private buildReverseDependencyGraph(): Map<string, string[]> {
    const reverse = new Map<string, Set<string>>();
    
    for (const [moduleId, deps] of this.dependencyGraph) {
      deps.forEach(dep => {
        if (!reverse.has(dep)) reverse.set(dep, new Set());
        reverse.get(dep)!.add(moduleId);
      });
    }
    
    const result = new Map<string, string[]>();
    for (const [key, set] of reverse) {
      result.set(key, Array.from(set));
    }
    
    return result;
  }

  private validateNoCycles(module: ModuleInterface): void {
    const visited = new Set<string>();
    const path = new Set<string>();

    const checkCycle = (current: string): boolean => {
      if (path.has(current)) return true;
      if (visited.has(current)) return false;
      
      visited.add(current);
      path.add(current);
      
      const mod = this.modules.get(current);
      if (mod) {
        for (const dep of mod.dependencies) {
          if (checkCycle(dep)) return true;
        }
      }
      
      path.delete(current);
      return false;
    };

    for (const dep of module.dependencies) {
      if (this.modules.has(dep)) {
        if (checkCycle(dep)) {
          throw new Error(`Circular dependency detected in module "${module.id}"`);
        }
      }
    }
  }

  private validateDependencies(module: ModuleInterface): void {
    for (const dep of module.dependencies) {
      if (!this.modules.has(dep)) {
        if (!this.options.allowPartialDependencies) {
          throw new Error(
            `Module "${module.id}" has missing dependency: "${dep}". ` +
            `Either register it first or enable allowPartialDependencies.`
          );
        }
      }
    }
  }

  getModuleImports(moduleId: string): unknown {
    const module = this.modules.get(moduleId);
    if (!module) return null;
    
    return {
      routes: module.routes,
      hooks: module.hooks,
      tabs: module.tabs,
      actions: module.actions,
    };
  }
}

export function createModuleRegistry(hub: PatientContextHub, options?: ModuleRegistryOptions): ModuleRegistry {
  return new ModuleRegistry(hub, options);
}