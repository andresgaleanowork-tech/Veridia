import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ReportsPage } from '../ReportsPage';
import api from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api');
vi.mock('@/hooks/useLocale', () => ({
  useLocale: () => ['es'],
}));

const mockApi = vi.mocked(api);

describe('ReportsPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const renderReportsPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ReportsPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders report types and patient selector', () => {
    mockApi.getPaginated.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });
    renderReportsPage();
    expect(screen.getByRole('button', { name: /generar/i })).toBeInTheDocument();
  });

  it('shows report templates', async () => {
    mockApi.getPaginated.mockResolvedValue({ data: [{ id: '1', name: 'Informe Clínico', type: 'kpis' }], total: 1, page: 1, limit: 10 });
    renderReportsPage();

    await waitFor(() => {
      expect(screen.getByText(/Informe Clínico/)).toBeInTheDocument();
    });
  });

  it('opens report dialog when clicking generate button', async () => {
    mockApi.getPaginated.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });
    renderReportsPage();

    fireEvent.click(screen.getByRole('button', { name: /generar/i }));
    await waitFor(() => {
      expect(screen.getByText(/generar reporte|tipo de reporte/i)).toBeInTheDocument();
    });
  });
});