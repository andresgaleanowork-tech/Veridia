import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import api from '@/lib/api';
import * as schemas from '@/lib/schemas';
import type { PaginatedResponse } from '@/types';

const queryKeys = {
  journals: (params?: schemas.FoodJournalQuery) => ['patient-journal', params] as const,
  journal: (id: string) => ['patient-journal', id] as const,
  stats: (patientId: string) => ['patient-journal', 'stats', patientId] as const,
};

export function useJournals(
  params?: schemas.FoodJournalQuery,
  options?: Partial<UseQueryOptions<PaginatedResponse<schemas.FoodJournalEntry>>>
) {
  return useQuery({
    queryKey: queryKeys.journals(params),
    queryFn: () => api.getPaginated<schemas.FoodJournalEntry>('/patient-journal', params),
    ...options,
  });
}

export function useJournal(
  id: string,
  options?: Partial<UseQueryOptions<schemas.FoodJournalEntry>>
) {
  return useQuery({
    queryKey: queryKeys.journal(id),
    queryFn: () => api.get<schemas.FoodJournalEntry>(`/patient-journal/${id}`).then((r) => r.data),
    enabled: !!id,
    ...options,
  });
}

export function useJournalStats(
  patientId: string,
  options?: Partial<UseQueryOptions<schemas.JournalStats>>
) {
  return useQuery({
    queryKey: queryKeys.stats(patientId),
    queryFn: () => api.get<schemas.JournalStats>(`/patient-journal/stats/${patientId}`).then((r) => r.data),
    enabled: !!patientId,
    ...options,
  });
}

export function useCreateJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: schemas.FoodJournalCreate) => api.post('/patient-journal', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient-journal'] });
    },
  });
}

export function useUpdateJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: schemas.FoodJournalUpdate }) =>
      api.put(`/patient-journal/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient-journal'] });
    },
  });
}

export function useDeleteJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/patient-journal/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient-journal'] });
    },
  });
}
