import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';
import api from '@/lib/api';

vi.mock('@/lib/api');

const mockApi = vi.mocked(api);

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('initial state is unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('login sets authenticated state', async () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin' };
    const mockToken = 'test-token-123';

    mockApi.post.mockResolvedValue({
      data: { data: { token: mockToken, user: mockUser } },
    });

    await act(async () => {
      await useAuthStore.getState().login({ email: 'test@test.com', password: 'password' });
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe(mockToken);
  });

  it('login sets error on failure', async () => {
    mockApi.post.mockRejectedValue(new Error('Credenciales inválidas'));

    await act(async () => {
      try {
        await useAuthStore.getState().login({ email: 'test@test.com', password: 'wrong' });
      } catch {
        // store re-throws so callers can surface errors; error state is still set
      }
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe('Credenciales inválidas');
  });

  it('logout clears state', async () => {
    mockApi.post.mockResolvedValue({});

    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: '1', name: 'Test', email: 'test@test.com', role: 'admin', active: true, created_at: '2024-01-01T00:00:00.000Z', updated_at: '2024-01-01T00:00:00.000Z' },
      accessToken: 'token',
    });

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('clearError resets error state', () => {
    useAuthStore.setState({ error: 'Some error' });
    act(() => {
      useAuthStore.getState().clearError();
    });
    expect(useAuthStore.getState().error).toBeNull();
  });
});

// Need act from react
import { act } from '@testing-library/react';
