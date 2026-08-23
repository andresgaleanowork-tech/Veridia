import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PatientComputedState } from '@/types/patient-context';

/**
 * Hook to fetch the full patient computed context from the Patient Context Hub.
 * Uses TanStack Query with automatic caching and refetching.
 */
export function usePatientContext(patientId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['patient-context', patientId],
    queryFn: async (): Promise<PatientComputedState> => {
      return api.getPatientContext(patientId!);
    },
    enabled: !!patientId && enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch a single module from the patient context.
 */
export function usePatientModule(patientId: string | undefined, moduleId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['patient-context', patientId, moduleId],
    queryFn: async () => {
      return api.getPatientModule(patientId!, moduleId!);
    },
    enabled: !!patientId && !!moduleId && enabled,
    staleTime: 60_000,
  });
}

/**
 * Hook to invalidate and recompute the patient context.
 */
export function useInvalidatePatientContext(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return api.invalidatePatientContext(patientId);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['patient-context', patientId], data);
    },
  });
}
