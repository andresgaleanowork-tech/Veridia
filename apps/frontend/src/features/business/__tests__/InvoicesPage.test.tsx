import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { InvoicesPage } from '../InvoicesPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGet = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api', () => ({
  default: {
    get: mockGet,
    getUnwrapped: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));
vi.mock('@/hooks/useLocale', () => ({
  useLocale: () => ['es'],
}));

describe('InvoicesPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const renderInvoicesPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <InvoicesPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders invoices table with filters', async () => {
    mockGet.mockResolvedValue({ data: { invoices: [], total: 0 } });
    renderInvoicesPage();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /nueva factura/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pendiente/i })).toBeInTheDocument();
  });

  it('displays invoices list when data loads', async () => {
    const mockInvoices = [
      { id: '1', numero: 'FAC-001', total: 100, estado: 'Pendiente' },
      { id: '2', numero: 'FAC-002', total: 200, estado: 'Pagada' },
    ];
    mockGet.mockResolvedValue({ data: { invoices: mockInvoices, total: 2 } });

    renderInvoicesPage();

    await waitFor(() => {
      expect(screen.getByText('FAC-001')).toBeInTheDocument();
      expect(screen.getByText('FAC-002')).toBeInTheDocument();
    });
  });

  it('filters by status', async () => {
    mockGet.mockResolvedValue({ data: { invoices: [], total: 0 } });
    renderInvoicesPage();

    fireEvent.click(screen.getByRole('button', { name: /pendiente/i }));

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('status=Pendiente')
      );
    });
  });

  it('opens form dialog when clicking create', async () => {
    mockGet.mockResolvedValue({ data: { invoices: [], total: 0 } });
    renderInvoicesPage();

    fireEvent.click(screen.getByRole('button', { name: /nueva factura/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /nueva factura/i })).toBeInTheDocument();
    });
  });
});
