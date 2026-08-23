import { create } from 'zustand';
import type { PatientComputedState } from '@/types/patient-context';

interface PatientContextState {
  patientId: string | null;
  context: PatientComputedState | null;
  isLoading: boolean;
  error: string | null;
  setContext: (patientId: string, context: PatientComputedState) => void;
  clearContext: () => void;
  setError: (error: string) => void;
  setLoading: (loading: boolean) => void;
  invalidate: () => void;
}

export const usePatientContextStore = create<PatientContextState>((set) => ({
  patientId: null,
  context: null,
  isLoading: false,
  error: null,

  setContext: (patientId, context) =>
    set({ patientId, context, isLoading: false, error: null }),

  clearContext: () =>
    set({ patientId: null, context: null, isLoading: false, error: null }),

  setError: (error) =>
    set({ error, isLoading: false }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  invalidate: () =>
    set({ context: null, isLoading: true }),
}));

// Selectors
export const selectContext = (state: PatientContextState) => state.context;
export const selectIsLoading = (state: PatientContextState) => state.isLoading;
export const selectError = (state: PatientContextState) => state.error;
export const selectPatientId = (state: PatientContextState) => state.patientId;
export const selectGlim = (state: PatientContextState) => state.context?.glim;
export const selectNcp = (state: PatientContextState) => state.context?.ncp;
export const selectEspen = (state: PatientContextState) => state.context?.espenTargets;
export const selectDrugAlerts = (state: PatientContextState) => state.context?.drugNutrientAlerts ?? [];
export const selectAdherence = (state: PatientContextState) => state.context?.adherenceRisk;
export const selectEdScreening = (state: PatientContextState) => state.context?.edScreening;
export const selectSports = (state: PatientContextState) => state.context?.sportsProfile;
export const selectPlanetary = (state: PatientContextState) => state.context?.planetaryScore;
export const selectBioactives = (state: PatientContextState) => state.context?.bioactivesProfile;
export const selectEatingBehavior = (state: PatientContextState) => state.context?.eatingBehavior;
export const selectNutrigenomic = (state: PatientContextState) => state.context?.nutrigenomicProfile;
export const selectMicrobiome = (state: PatientContextState) => state.context?.microbiomeProfile;
export const selectDemographics = (state: PatientContextState) => state.context?.demographics;
export const selectLabs = (state: PatientContextState) => state.context?.labs;
