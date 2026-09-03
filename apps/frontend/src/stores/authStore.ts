import { create } from 'zustand';
import api, { STORAGE_TOKEN_KEY, STORAGE_REQUEST_ID_KEY } from '@/lib/api';
import type { User, LoginRequest } from '@/types';

function parseJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]!));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  refreshIntervalId: ReturnType<typeof setInterval> | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  clearError: () => void;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
}

const initialToken =
  typeof window !== 'undefined' ? localStorage.getItem(STORAGE_TOKEN_KEY) : null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: initialToken,
  isAuthenticated: !!initialToken,
  isLoading: false,
  error: null,
  refreshIntervalId: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', credentials);
      const { token, user } = res.data.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_TOKEN_KEY, token);
      }
      set({ user, accessToken: token, isAuthenticated: true, isLoading: false });
      get().startAutoRefresh();
    } catch (err: unknown) {
      // Preferimos el mensaje del servidor (p. ej. "Credenciales incorrectas")
      // al genérico de axios ("Request failed with status code 401").
      const serverError = (
        err as { response?: { data?: { error?: string } } }
      )?.response?.data?.error;
      const message =
        serverError || (err instanceof Error ? err.message : 'Error de autenticación');
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    get().stopAutoRefresh();
    try {
      await api.post('/auth/logout');
    } catch {
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_REQUEST_ID_KEY);
    }
    set({ user: null, accessToken: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  loadUser: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.data, isAuthenticated: true });
      get().startAutoRefresh();
    } catch {
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },

  refreshAccessToken: async () => {
    try {
      const res = await api.post('/auth/refresh');
      const { token } = res.data.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_TOKEN_KEY, token);
      }
      set({ accessToken: token, isAuthenticated: true });
    } catch {
      get().stopAutoRefresh();
      set({ user: null, accessToken: null, isAuthenticated: false });
      window.location.href = '/login';
    }
  },

  clearError: () => set({ error: null }),

  startAutoRefresh: () => {
    const { refreshIntervalId } = get();
    if (refreshIntervalId) return;

    const checkAndRefresh = async () => {
      const { accessToken } = get();
      if (!accessToken) return;

      const exp = parseJwtExp(accessToken);
      if (!exp) return;

      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (exp - now < fiveMinutes) {
        await get().refreshAccessToken();
      }
    };

    const intervalId = setInterval(checkAndRefresh, 60 * 1000);
    set({ refreshIntervalId: intervalId });
  },

  stopAutoRefresh: () => {
    const { refreshIntervalId } = get();
    if (refreshIntervalId) {
      clearInterval(refreshIntervalId);
      set({ refreshIntervalId: null });
    }
  },
}));
