import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PatientsPage } from '../PatientsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGetUnwrapped = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    getUnwrapped: mockGetUnwrapped,
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
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

describe('PatientsPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const renderPatientsPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PatientsPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders patients table with search input', async () => {
    mockGetUnwrapped.mockResolvedValue([]);
    renderPatientsPage();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /nuevo paciente/i })).toBeInTheDocument();
  });

  it('displays patients list when data loads', async () => {
    const mockPatients = [
      { id: '1', nombre: 'María', apellidos: 'González', dni: '12345678A', activo: true },
      { id: '2', nombre: 'Carlos', apellidos: 'Rodríguez', dni: '87654321B', activo: true },
    ];
    mockGetUnwrapped.mockResolvedValue(mockPatients);

    renderPatientsPage();

    await waitFor(() => {
      expect(screen.getByText('María')).toBeInTheDocument();
      expect(screen.getByText('Carlos')).toBeInTheDocument();
    });
  });

  it('shows empty state when no patients', async () => {
    mockGetUnwrapped.mockResolvedValue([]);
    renderPatientsPage();

    await waitFor(() => {
      expect(screen.getByText(/no hay pacientes/i)).toBeInTheDocument();
    });
  });

  it('filters patients by active/inactive', async () => {
    mockGetUnwrapped.mockResolvedValue([]);
    renderPatientsPage();

    const activeBtn = screen.getAllByRole('button', { name: /activos/i })[0] as HTMLElement;
    fireEvent.click(activeBtn);

    await waitFor(() => {
      expect(mockGetUnwrapped).toHaveBeenCalledWith(
        expect.stringContaining('activo=true')
      );
    });
  });

  it('opens form dialog when clicking add', async () => {
    mockGetUnwrapped.mockResolvedValue([]);
    renderPatientsPage();

    fireEvent.click(screen.getByRole('button', { name: /nuevo paciente/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /nuevo paciente/i })).toBeInTheDocument();
    });
  });
});
