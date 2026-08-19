import axios, { type AxiosError, type AxiosInstance, type AxiosResponse } from 'axios';
import { z } from 'zod';
import type { PaginatedResponse, FitnessActivity, FitnessSummary, Report, ReportTemplate, ReportType } from '@/types';
import * as schemas from '@/lib/schemas';
import { captureError } from '@/lib/errorReporting';

// ---------------------------------------------------------------------------
// Ampliación de tipos de Axios
// ---------------------------------------------------------------------------
declare module 'axios' {
  interface AxiosInstance {
    getPaginated<T>(
      url: string,
      params?: Record<string, unknown>,
      signal?: AbortSignal
    ): Promise<PaginatedResponse<T>>;
    postForm<T = unknown>(
      url: string,
      formData: FormData,
      signal?: AbortSignal
    ): Promise<T>;
    putJson<T = unknown>(
      url: string,
      payload: unknown,
      signal?: AbortSignal
    ): Promise<T>;
    connectFitnessPlatform(platform: string, pacienteId: string, externalUserId?: string, scopes?: string[]): Promise<unknown>;
    disconnectFitness(pacienteId: string, platform: string): Promise<unknown>;
    getFitnessActivities(patientId: string, from?: string, to?: string, limit?: number): Promise<unknown[]>;
    getFitnessSummary(patientId: string, from?: string, to?: string): Promise<FitnessSummary>;
    importFitnessActivities(pacienteId: string, platform: string, activities: unknown[]): Promise<{ imported: number; skipped: number }>;
    setActivityFactor(pacienteId: string, factor: number, label: string, reason?: string): Promise<unknown>;
    generateReport(payload: { paciente_id: string; tipo: ReportType; plantilla?: string; fecha_inicio?: string; fecha_fin?: string; titulo?: string }): Promise<Report>;
    generatePracticeKPIReport(payload: { name: string; type: string; params?: any }): Promise<Report>;
    downloadReport(id: string): Promise<Blob>;
    getReportTemplates(): Promise<ReportTemplate[]>;

    // Patient Food Journal
    createJournal(payload: schemas.FoodJournalCreate): Promise<schemas.FoodJournalEntry>;
    updateJournal(id: string, payload: schemas.FoodJournalUpdate): Promise<schemas.FoodJournalEntry>;
    deleteJournal(id: string): Promise<unknown>;
    getJournalStats(patientId: string): Promise<schemas.JournalStats>;
  }

  interface InternalAxiosRequestConfig {
    _retry?: boolean;
    _skipRefresh?: boolean;
    _responseSchema?: z.ZodSchema<any>;
  }
}

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------
interface ApiEnvelope<T = unknown> {
  ok: boolean;
  data?: T;
  meta?: {
    requestId?: string;
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
    timestamp?: string;
  };
  error?: string;
  code?: string;
  details?: { field: string; message: string }[];
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------
const API_BASE = '/api';
const STORAGE_TOKEN_KEY = 'veridia_token';
const STORAGE_REFRESH_KEY = 'veridia_refresh_token';
const STORAGE_REQUEST_ID_KEY = 'veridia_request_id';

export { STORAGE_TOKEN_KEY, STORAGE_REFRESH_KEY, STORAGE_REQUEST_ID_KEY };

// ---------------------------------------------------------------------------
// Mapeo de esquemas por endpoint
// ---------------------------------------------------------------------------
const RESPONSE_SCHEMAS: Record<string, z.ZodSchema<any>> = {
  '/auth/login': schemas.LoginApiEnvelopeSchema,
  '/auth/refresh': schemas.RefreshApiEnvelopeSchema,
  '/auth/me': schemas.UserApiEnvelopeSchema,
  '/patients': schemas.PatientListApiEnvelopeSchema,
  '/patients/:id': schemas.PatientApiEnvelopeSchema,
  '/patients/:id/full': schemas.PatientApiEnvelopeSchema,
  '/appointments': schemas.AppointmentListApiEnvelopeSchema,
  '/appointments/:id': schemas.AppointmentApiEnvelopeSchema,
  '/appointments/today': schemas.AppointmentListApiEnvelopeSchema,
  '/appointments/week': schemas.AppointmentListApiEnvelopeSchema,
  '/invoices': schemas.InvoiceListApiEnvelopeSchema,
  '/invoices/:id': schemas.InvoiceApiEnvelopeSchema,
  '/recipes': schemas.RecipeListApiEnvelopeSchema,
  '/recipes/:id': schemas.RecipeApiEnvelopeSchema,
  '/meal-plans': schemas.MealPlanListApiEnvelopeSchema,
  '/meal-plans/:id': schemas.MealPlanApiEnvelopeSchema,
  '/foods': schemas.FoodListApiEnvelopeSchema,
  '/foods/:id': schemas.FoodApiEnvelopeSchema,
  '/clinical/anamnesis': schemas.AnamnesisApiEnvelopeSchema,
  '/clinical/anthropometry': schemas.AnthropometryApiEnvelopeSchema,
  '/clinical/analytics': schemas.AnalyticsApiEnvelopeSchema,
  '/clinical/histories': schemas.ClinicalHistoryApiEnvelopeSchema,
  '/clinical/formula': schemas.FormulaResultApiEnvelopeSchema,
  '/clinical/alerts': schemas.AlertListApiEnvelopeSchema,
  '/gastos': schemas.ApiEnvelopeSchema(z.array(z.unknown())),
  '/fitness/activities/:patientId': schemas.ApiEnvelopeSchema(z.array(z.unknown())),
  '/fitness/summary/:patientId': schemas.ApiEnvelopeSchema(z.unknown()),
};

function matchRoute(url: string): z.ZodSchema<any> | undefined {
  const cleanUrl = url.split("?")[0] || '';
  if (RESPONSE_SCHEMAS[cleanUrl as keyof typeof RESPONSE_SCHEMAS]) return RESPONSE_SCHEMAS[cleanUrl as keyof typeof RESPONSE_SCHEMAS];

  const patterns = Object.keys(RESPONSE_SCHEMAS) as string[];
  for (const pattern of patterns) {
    if (!pattern.includes(":")) continue;
    const regex = new RegExp("^" + pattern.replace(/:[^/]+/g, "[^/]+") + "$");
    if (regex.test(cleanUrl)) return RESPONSE_SCHEMAS[pattern as keyof typeof RESPONSE_SCHEMAS]!;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Helpers locales
// ---------------------------------------------------------------------------
function generateRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getRequestId(): string {
  if (typeof window === 'undefined') return generateRequestId();
  const existing = localStorage.getItem(STORAGE_REQUEST_ID_KEY);
  if (existing) return existing;
  const id = generateRequestId();
  localStorage.setItem(STORAGE_REQUEST_ID_KEY, id);
  return id;
}

function extractValidationMessages(error: AxiosError<ApiEnvelope<unknown>>): string[] {
  const details = error.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details.map((d) => `${d.field}: ${d.message}`);
  }
  return [];
}

// ---------------------------------------------------------------------------
// Validación de respuesta con Zod
// ---------------------------------------------------------------------------
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: z.ZodError;
}

export function validateResponse<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  captureError(new Error('API Validation Failed'), {
    component: 'api',
    operation: 'validateResponse',
    additionalData: {
      schema: schema.description || 'unknown',
      errors: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      received: JSON.stringify(data).slice(0, 500),
    },
  });
  return { success: false, error: result.error };
}

// ---------------------------------------------------------------------------
// Instancia de Axios
// ---------------------------------------------------------------------------
const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ---------------------------------------------------------------------------
// Request interceptor: token + requestId + schema attachment
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_TOKEN_KEY) : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!config.headers['X-Request-ID']) {
    config.headers['X-Request-ID'] = getRequestId();
  }

  const schema = matchRoute(config.url || '');
  if (schema) {
    config._responseSchema = schema;
  }

  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor: validación + manejo global de errores
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const schema = response.config._responseSchema;
    if (schema) {
      const validation = validateResponse(schema, response.data);
      if (!validation.success) {
        response.data = {
          ok: false,
          error: 'Error de validación de respuesta del servidor',
          code: 'VALIDATION_ERROR',
          details: validation.error?.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        };
      }
    }
    return response;
  },
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      handleResponseError(error);
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._skipRefresh) {
      const apiErrorCode =
        error.response?.data?.code || error.response?.data?.error;
      if (apiErrorCode === 'TOKEN_EXPIRED' && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshToken =
            typeof window !== 'undefined' ? localStorage.getItem(STORAGE_REFRESH_KEY) : null;
          if (!refreshToken) throw new Error('No refresh token');

          const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          const newToken = res.data?.data?.token || res.data?.token;
          if (!newToken) throw new Error('Token no recibido');

          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_TOKEN_KEY, newToken);
          }
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_TOKEN_KEY);
            localStorage.removeItem(STORAGE_REFRESH_KEY);
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      }
    }

    handleResponseError(error);
    return Promise.reject(error);
  }
);

function handleResponseError(error: AxiosError<ApiEnvelope<unknown>>): void {
  const status = error.response?.status;
  const envelope = error.response?.data;
  const message: string | undefined = envelope?.error;
  const validationMessages = extractValidationMessages(error);

  switch (status) {
    case 401:
      captureError(new Error('Sesión expirada o inválida.'), {
        component: 'api',
        operation: 'handleResponseError',
        additionalData: { status: 401 },
      });
      break;
    case 403:
      captureError(new Error('Sin permisos para acceder a este recurso.'), {
        component: 'api',
        operation: 'handleResponseError',
        additionalData: { status: 403 },
      });
      break;
    case 404:
      captureError(new Error('Recurso no encontrado.'), {
        component: 'api',
        operation: 'handleResponseError',
        additionalData: { status: 404 },
      });
      break;
    case 422: {
      const msg = validationMessages.length > 0
        ? `Validación fallida: ${validationMessages.join('; ')}`
        : message || 'Datos inválidos.';
      captureError(new Error(msg), {
        component: 'api',
        operation: 'handleResponseError',
        additionalData: { status: 422, validationMessages },
      });
      break;
    }
    case 500:
    case 502:
    case 503:
    case 504:
      captureError(new Error('Error del servidor. Intente nuevamente más tarde.'), {
        component: 'api',
        operation: 'handleResponseError',
        additionalData: { status },
      });
      break;
    default:
      if (status && status >= 400) {
        captureError(new Error(message || 'Error inesperado.'), {
          component: 'api',
          operation: 'handleResponseError',
          additionalData: { status },
        });
      }
      break;
  }
}

// ---------------------------------------------------------------------------
// Helpers de alto nivel
// ---------------------------------------------------------------------------
api.getPaginated = async <T>(
  url: string,
  params?: Record<string, unknown>,
  signal?: AbortSignal
): Promise<PaginatedResponse<T>> => {
  const response = await api.get<ApiEnvelope<T[]>>(url, { params, signal });
  const data = response.data.data as T[] | undefined;
  const meta = response.data.meta;
  if (!data || !meta) throw new Error('Respuesta paginada inválida');

  return {
    data,
    total: meta.total ?? 0,
    page: meta.page ?? 1,
    limit: meta.limit ?? 10,
  };
};

api.postForm = async <T = unknown>(
  url: string,
  formData: FormData,
  signal?: AbortSignal
): Promise<T> => {
  const response = await api.post<ApiEnvelope<T>>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal,
  });
  if (response.data?.ok === false) {
    throw new Error(response.data.error || 'Error en la solicitud');
  }
  return response.data.data as T;
};

api.putJson = async <T = unknown>(
  url: string,
  payload: unknown,
  signal?: AbortSignal
): Promise<T> => {
  const response = await api.put<ApiEnvelope<T>>(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    signal,
  });
  if (response.data?.ok === false) {
    throw new Error(response.data.error || 'Error en la solicitud');
  }
  return response.data.data as T;
}

// ---------------------------------------------------------------------------
// Fitness Platform Integration
// ---------------------------------------------------------------------------
api.connectFitnessPlatform = async (platform: string, pacienteId: string, externalUserId?: string, scopes?: string[]) => {
  const res = await api.post<ApiEnvelope<unknown>>(`/fitness/connect/${platform}`, {
    paciente_id: pacienteId,
    external_user_id: externalUserId,
    scopes,
  });
  return res.data;
};

api.disconnectFitness = async (pacienteId: string, platform: string) => {
  const res = await api.get<ApiEnvelope<unknown>>(`/fitness/disconnect?paciente_id=${pacienteId}&platform=${platform}`);
  return res.data;
};

api.getFitnessActivities = async (patientId: string, from?: string, to?: string, limit = 100) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  params.set('limit', String(limit));
  const res = await api.get<ApiEnvelope<FitnessActivity[]>>(`/fitness/activities/${patientId}?${params.toString()}`);
  return res.data.data || [];
};

api.getFitnessSummary = async (patientId: string, from?: string, to?: string) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const res = await api.get<ApiEnvelope<FitnessSummary>>(`/fitness/summary/${patientId}?${params.toString()}`);
  return res.data.data as FitnessSummary;
};

api.importFitnessActivities = async (pacienteId: string, platform: string, activities: unknown[]) => {
  const res = await api.post<ApiEnvelope<{ imported: number; skipped: number }>>(`/fitness/activities/import`, {
    paciente_id: pacienteId,
    platform,
    activities,
  });
  return res.data.data as { imported: number; skipped: number };
};

api.setActivityFactor = async (pacienteId: string, factor: number, label: string, reason?: string) => {
  const res = await api.post<ApiEnvelope<unknown>>('/fitness/factor', {
    paciente_id: pacienteId,
    factor,
    label,
    reason,
  });
  return res.data.data;
};

// ---------------------------------------------------------------------------
// Hook: useApiError
// ---------------------------------------------------------------------------
export type ApiErrorHandler = {
  showToast: (message: string) => void;
  showValidation: (messages: string[]) => void;
};

export interface UseApiErrorOptions {
  onAuthExpired?: () => void;
  onForbidden?: () => void;
  onNotFound?: () => void;
  onValidation?: (messages: string[]) => void;
  onServerError?: () => void;
}

export const useApiError = (_options: UseApiErrorOptions = {}): ApiErrorHandler => {
  const opts = _options;

  const showToast = (message: string): void => {
    console.info('[Toast]', message);
  };

  const showValidation = (messages: string[]): void => {
    if (opts.onValidation) {
      opts.onValidation(messages);
    } else {
      showToast(messages.join('; '));
    }
  };

  return { showToast, showValidation };
};

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
api.generateReport = async (payload: {
  paciente_id: string;
  tipo: ReportType;
  plantilla?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  titulo?: string;
}): Promise<Report> => {
  const response = await api.post<ApiEnvelope<Report>>('/reports/generate', payload);
  return response.data.data as Report;
};

api.downloadReport = async (id: string): Promise<Blob> => {
  const response = await api.get(`/reports/${id}/download`, { responseType: 'blob' });
  return response.data;
};

api.getReportTemplates = async (): Promise<ReportTemplate[]> => {
  const response = await api.get<ApiEnvelope<ReportTemplate[]>>('/report-templates');
  return response.data.data as ReportTemplate[];
};

api.generatePracticeKPIReport = async (payload: {
  name: string;
  type: string;
  params?: any;
}): Promise<Report> => {
  const response = await api.post<ApiEnvelope<Report>>('/reports/generate', payload);
  return response.data.data as Report;
};

// ---------------------------------------------------------------------------
// Patient Food Journal
// ---------------------------------------------------------------------------
api.createJournal = async (payload: schemas.FoodJournalCreate) => {
  const response = await api.post<ApiEnvelope<schemas.FoodJournalEntry>>('/patient-journal', payload);
  if (response.data?.ok === false) throw new Error(response.data.error || 'Error en la solicitud');
  return response.data.data as schemas.FoodJournalEntry;
};

api.updateJournal = async (id: string, payload: schemas.FoodJournalUpdate) => {
  const response = await api.put<ApiEnvelope<schemas.FoodJournalEntry>>(`/patient-journal/${id}`, payload);
  if (response.data?.ok === false) throw new Error(response.data.error || 'Error en la solicitud');
  return response.data.data as schemas.FoodJournalEntry;
};

api.deleteJournal = async (id: string) => {
  const response = await api.delete<ApiEnvelope<unknown>>(`/patient-journal/${id}`);
  if (response.data?.ok === false) throw new Error(response.data.error || 'Error en la solicitud');
  return response.data.data;
};

api.getJournalStats = async (patientId: string) => {
  const response = await api.get<ApiEnvelope<schemas.JournalStats>>(`/patient-journal/stats/${patientId}`);
  if (response.data?.ok === false) throw new Error(response.data.error || 'Error en la solicitud');
  return response.data.data as schemas.JournalStats;
};


export default api;
