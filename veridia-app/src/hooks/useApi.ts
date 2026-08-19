import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import api from '@/lib/api';
import * as schemas from '@/lib/schemas';
import type { PaginatedResponse } from '@/types';

const queryKeys = {
  patients: (params?: schemas.PatientListQuery) => ['patients', params] as const,
  patient: (id: string) => ['patients', id] as const,
  appointments: (params?: schemas.AppointmentListQuery) => ['appointments', params] as const,
  appointment: (id: string) => ['appointments', id] as const,
  invoices: (params?: schemas.InvoiceListQuery) => ['invoices', params] as const,
  invoice: (id: string) => ['invoices', id] as const,
  recipes: (params?: schemas.RecipeListQuery) => ['recipes', params] as const,
  recipe: (id: string) => ['recipes', id] as const,
  mealPlans: (params?: schemas.MealPlanListQuery) => ['meal-plans', params] as const,
  mealPlan: (id: string) => ['meal-plans', id] as const,
  foods: (params?: schemas.FoodListQuery) => ['foods', params] as const,
  food: (id: string) => ['foods', id] as const,
  anamnesis: (patientId: string) => ['clinical', 'anamnesis', patientId] as const,
  anthropometry: (patientId: string) => ['clinical', 'anthropometry', patientId] as const,
  analytics: (patientId: string) => ['clinical', 'analytics', patientId] as const,
  clinicalHistory: (patientId: string) => ['clinical', 'history', patientId] as const,
  alerts: (patientId?: string) => ['clinical', 'alerts', patientId] as const,
  gastos: (params?: schemas.Pagination) => ['gastos', params] as const,
  user: () => ['user'] as const,
};


// Pacientes
export function usePatients(
  params?: schemas.PatientListQuery,
  options?: Partial<UseQueryOptions<PaginatedResponse<schemas.Patient>>>
) {
  return useQuery({
    queryKey: queryKeys.patients(params),
    queryFn: () => api.getPaginated<schemas.Patient>('/patients', params),
    ...options,
  });
}

export function usePatient(
  id: string,
  options?: Partial<UseQueryOptions<schemas.Patient>>
) {
  return useQuery({
    queryKey: queryKeys.patient(id),
    queryFn: () => api.get<schemas.Patient>(`/patients/${id}`).then((r) => r.data),
    enabled: !!id,
    ...options,
  });
}

export function usePatientFull(
  id: string,
  options?: Partial<UseQueryOptions<any>>
) {
  return useQuery({
    queryKey: ['patients', id, 'full'],
    queryFn: () => api.get(`/patients/${id}/full`).then((r) => r.data),
    enabled: !!id,
    ...options,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: schemas.PatientCreate) => api.post('/patients', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: schemas.PatientUpdate }) =>
      api.put(`/patients/${id}`, data).then((r) => r.data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      qc.invalidateQueries({ queryKey: ['patients', id] });
    },
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/patients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

// Citas
export function useAppointments(
  params?: schemas.AppointmentListQuery,
  options?: Partial<UseQueryOptions<PaginatedResponse<schemas.Appointment>>>
) {
  return useQuery({
    queryKey: queryKeys.appointments(params),
    queryFn: () => api.getPaginated<schemas.Appointment>('/appointments', params),
    ...options,
  });
}

export function useAppointment(
  id: string,
  options?: Partial<UseQueryOptions<schemas.Appointment>>
) {
  return useQuery({
    queryKey: queryKeys.appointment(id),
    queryFn: () => api.get<schemas.Appointment>(`/appointments/${id}`).then((r) => r.data),
    enabled: !!id,
    ...options,
  });
}

export function useAppointmentsToday(
  options?: Partial<UseQueryOptions<schemas.Appointment[]>>
) {
  return useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: () => api.get<schemas.Appointment[]>('/appointments/today').then((r) => r.data),
    ...options,
  });
}

export function useAppointmentsWeek(
  fecha?: string,
  options?: Partial<UseQueryOptions<schemas.Appointment[]>>
) {
  return useQuery({
    queryKey: ['appointments', 'week', fecha],
    queryFn: () => api.get<schemas.Appointment[]>('/appointments/week', { params: { fecha } }).then((r) => r.data),
    ...options,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: schemas.AppointmentCreate) => api.post('/appointments', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: schemas.AppointmentUpdate }) =>
      api.put(`/appointments/${id}`, data).then((r) => r.data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments', id] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: schemas.AppointmentStatus }) =>
      api.put(`/appointments/${id}/status`, { estado }).then((r) => r.data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments', id] });
    },
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/appointments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

// Facturas
export function useInvoices(
  params?: schemas.InvoiceListQuery,
  options?: Partial<UseQueryOptions<PaginatedResponse<schemas.Invoice>>>
) {
  return useQuery({
    queryKey: queryKeys.invoices(params),
    queryFn: () => api.getPaginated<schemas.Invoice>('/invoices', params),
    ...options,
  });
}

export function useInvoice(
  id: string,
  options?: Partial<UseQueryOptions<schemas.Invoice>>
) {
  return useQuery({
    queryKey: queryKeys.invoice(id),
    queryFn: () => api.get<schemas.Invoice>(`/invoices/${id}`).then((r) => r.data),
    enabled: !!id,
    ...options,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: schemas.InvoiceCreate) => api.post('/invoices', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function usePayInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payment }: { id: string; payment: schemas.InvoicePaymentCreate }) =>
      api.post(`/invoices/${id}/pay`, payment).then((r) => r.data),
    onSuccess: (_data, { id }) => qc.invalidateQueries({ queryKey: ['invoices', id] }),
  });
}

// Recetas
export function useRecipes(
  params?: schemas.RecipeListQuery,
  options?: Partial<UseQueryOptions<PaginatedResponse<schemas.Recipe>>>
) {
  return useQuery({
    queryKey: queryKeys.recipes(params),
    queryFn: () => api.getPaginated<schemas.Recipe>('/recipes', params),
    ...options,
  });
}

export function useRecipe(
  id: string,
  options?: Partial<UseQueryOptions<schemas.Recipe>>
) {
  return useQuery({
    queryKey: queryKeys.recipe(id),
    queryFn: () => api.get<schemas.Recipe>(`/recipes/${id}`).then((r) => r.data),
    enabled: !!id,
    ...options,
  });
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: schemas.RecipeCreate) => api.post('/recipes', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}

// Planes de alimentación
export function useMealPlans(
  params?: schemas.MealPlanListQuery,
  options?: Partial<UseQueryOptions<PaginatedResponse<schemas.MealPlan>>>
) {
  return useQuery({
    queryKey: queryKeys.mealPlans(params),
    queryFn: () => api.getPaginated<schemas.MealPlan>('/meal-plans', params),
    ...options,
  });
}

export function useMealPlan(
  id: string,
  options?: Partial<UseQueryOptions<schemas.MealPlan>>
) {
  return useQuery({
    queryKey: queryKeys.mealPlan(id),
    queryFn: () => api.get<schemas.MealPlan>(`/meal-plans/${id}`).then((r) => r.data),
    enabled: !!id,
    ...options,
  });
}

export function useCreateMealPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: schemas.MealPlanCreate) => api.post('/meal-plans', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-plans'] }),
  });
}

// Alimentos
export function useFoods(
  params?: schemas.FoodListQuery,
  options?: Partial<UseQueryOptions<PaginatedResponse<schemas.Food>>>
) {
  return useQuery({
    queryKey: queryKeys.foods(params),
    queryFn: () => api.getPaginated<schemas.Food>('/foods', params),
    ...options,
  });
}

export function useFood(
  id: string,
  options?: Partial<UseQueryOptions<schemas.Food>>
) {
  return useQuery({
    queryKey: queryKeys.food(id),
    queryFn: () => api.get<schemas.Food>(`/foods/${id}`).then((r) => r.data),
    enabled: !!id,
    ...options,
  });
}

export function useCreateFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: schemas.FoodCreate) => api.post('/foods', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foods'] }),
  });
}

// Datos clínicos
export function useAnamnesis(
  patientId: string,
  options?: Partial<UseQueryOptions<schemas.Anamnesis>>
) {
  return useQuery({
    queryKey: queryKeys.anamnesis(patientId),
    queryFn: () => api.get<schemas.Anamnesis>(`/clinical/anamnesis/${patientId}`).then((r) => r.data),
    enabled: !!patientId,
    ...options,
  });
}

export function useCreateAnamnesis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: schemas.AnamnesisCreate) => api.post('/clinical/anamnesis', data).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['clinical', 'anamnesis', vars.paciente_id] }),
  });
}

export function useAnthropometry(
  patientId: string,
  options?: Partial<UseQueryOptions<schemas.Anthropometry[]>>
) {
  return useQuery({
    queryKey: queryKeys.anthropometry(patientId),
    queryFn: () => api.get<schemas.Anthropometry[]>(`/clinical/anthropometry/${patientId}`).then((r) => r.data),
    enabled: !!patientId,
    ...options,
  });
}

export function useCreateAnthropometry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: schemas.AnthropometryCreate) => api.post('/clinical/anthropometry', data).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['clinical', 'anthropometry', vars.paciente_id] }),
  });
}

export function useAnalytics(
  patientId: string,
  options?: Partial<UseQueryOptions<schemas.Analytics[]>>
) {
  return useQuery({
    queryKey: queryKeys.analytics(patientId),
    queryFn: () => api.get<schemas.Analytics[]>(`/clinical/analytics/${patientId}`).then((r) => r.data),
    enabled: !!patientId,
    ...options,
  });
}

export function useCreateAnalytics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: schemas.AnalyticsCreate) => api.post('/clinical/analytics', data).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['clinical', 'analytics', vars.paciente_id] }),
  });
}

export function useClinicalHistory(
  patientId: string,
  options?: Partial<UseQueryOptions<schemas.ClinicalHistory>>
) {
  return useQuery({
    queryKey: queryKeys.clinicalHistory(patientId),
    queryFn: () => api.get<schemas.ClinicalHistory>(`/clinical/histories/${patientId}`).then((r) => r.data),
    enabled: !!patientId,
    ...options,
  });
}

export function useCreateClinicalHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: schemas.ClinicalHistoryCreate) => api.post('/clinical/histories', data).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['clinical', 'history', vars.paciente_id] }),
  });
}

export function useFormula(
  options?: Partial<UseQueryOptions<schemas.FormulaResult>>
) {
  return useQuery({
    queryKey: ['clinical', 'formula'],
    queryFn: () => api.get<schemas.FormulaResult>('/clinical/formula').then((r) => r.data),
    ...options,
  });
}

export function useCalculateFormula(
  _data: schemas.FormulaRequest
) {
  return useMutation({
    mutationFn: (_data: schemas.FormulaRequest) => api.post('/clinical/formula', _data).then((r) => r.data),
  });
}

export function useAlerts(
  patientId?: string,
  options?: Partial<UseQueryOptions<schemas.Alert[]>>
) {
  return useQuery({
    queryKey: queryKeys.alerts(patientId),
    queryFn: () => api.get<schemas.Alert[]>('/clinical/alerts', { params: { paciente_id: patientId } }).then((r) => r.data),
    ...options,
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: schemas.AlertCreate) => api.post('/clinical/alerts', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clinical', 'alerts'] }),
  });
}

// Gastos
export function useGastos(
  params?: schemas.Pagination,
  options?: Partial<UseQueryOptions<PaginatedResponse<any>>>
) {
  return useQuery({
    queryKey: queryKeys.gastos(params),
    queryFn: () => api.getPaginated('/gastos', params),
    ...options,
  });
}

export function useCreateGasto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/gastos', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gastos'] }),
  });
}

// Usuario actual
export function useCurrentUser(
  options?: Partial<UseQueryOptions<schemas.User>>
) {
  return useQuery({
    queryKey: queryKeys.user(),
    queryFn: () => api.get<schemas.User>('/auth/me').then((r) => r.data),
    ...options,
  });
}

export { queryKeys };
