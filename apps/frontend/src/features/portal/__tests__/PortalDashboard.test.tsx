import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PortalDashboard } from '../PortalDashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGetUnwrapped } = vi.hoisted(() => ({
  mockGetUnwrapped: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getUnwrapped: mockGetUnwrapped,
  },
}));

type PortalPlan = { id: string; estado: string; nombre: string; kcal_objetivo: number; prot_g: number; grasas_g: number; hc_g: number };
type PortalJournal = { id: string; fecha: string; total_kcal: number; water_ml: number };

describe('PortalDashboard', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    mockGetUnwrapped.mockReset();
  });

  const renderPortalDashboard = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PortalDashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders greeting with patient name', async () => {
    mockGetUnwrapped.mockImplementation((url: string) => {
      if (url.includes('profile')) return Promise.resolve({ nombre: 'María' });
      return Promise.resolve([]);
    });

    renderPortalDashboard();

    await waitFor(() => {
      expect(screen.getByText(/María/)).toBeInTheDocument();
    });
  });

  it('shows active plan section', async () => {
    const mockPlans: PortalPlan[] = [{ id: '1', estado: 'activo', nombre: 'Plan 1', kcal_objetivo: 2000, prot_g: 120, grasas_g: 65, hc_g: 200 }];
    mockGetUnwrapped.mockImplementation((url: string) => {
      if (url.includes('profile')) return Promise.resolve({ nombre: 'María' });
      if (url.includes('plans')) return Promise.resolve(mockPlans);
      return Promise.resolve([]);
    });

    renderPortalDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Plan 1/)).toBeInTheDocument();
      expect(screen.getByText(/2000/)).toBeInTheDocument();
    });
  });

  it('shows journal section', async () => {
    const mockJournals: PortalJournal[] = [{ id: '1', fecha: '2026-01-15', total_kcal: 1800, water_ml: 2000 }];
    mockGetUnwrapped.mockImplementation((url: string) => {
      if (url.includes('profile')) return Promise.resolve({ nombre: 'María' });
      if (url.includes('journal')) return Promise.resolve(mockJournals);
      return Promise.resolve([]);
    });

    renderPortalDashboard();

    await waitFor(() => {
      const entries = screen.getAllByText(/1800/);
      expect(entries.length).toBeGreaterThanOrEqual(1);
    });
  });
});
