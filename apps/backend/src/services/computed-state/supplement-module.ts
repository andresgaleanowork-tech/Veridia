import type { ModuleInterface, ModuleOutput } from '../../types/patient-context.js';

export class SupplementModule implements ModuleInterface {
  id = 'supplements';
  name = 'Supplements & Medications';
  version = '1.0.0';
  dependencies = ['clinical-history'];
  provides = ['supplementProfile', 'adherenceRisk'];

  routes = null;
  hooks = {};
  tabs = [];
  actions = [];

  async compute(): Promise<ModuleOutput> {
    const start = Date.now();
    try {
      const data = {
        supplements: [],
        adherenceStats: {},
        interactions: [],
      };
      return {
        moduleId: 'supplements',
        success: true,
        data,
        durationMs: Date.now() - start,
        errors: [],
        warnings: [],
      };
    } catch (err: any) {
      return {
        moduleId: 'supplements',
        success: false,
        data: { supplements: [], adherenceStats: {}, interactions: [] },
        durationMs: Date.now() - start,
        errors: [err.message],
        warnings: [],
      };
    }
  }

  async onContextChange(): Promise<void> {}
}

export default SupplementModule;
