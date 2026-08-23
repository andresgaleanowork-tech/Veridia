import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppointmentsPage } from '../AppointmentsPage';
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
vi.mock('@/hooks/useLocale', () => ({
  useLocale: () => ['es'],
}));

describe('AppointmentsPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const renderAppointmentsPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppointmentsPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders calendar with view controls', async () => {
    mockGetUnwrapped.mockResolvedValue([]);
    renderAppointmentsPage();
    await waitFor(() => {
      const viewButtons = screen.getAllByRole('button', { name: /día|semana|mes/i });
      expect(viewButtons.length).toBeGreaterThanOrEqual(3);
    });
    expect(screen.getByRole('button', { name: /nueva cita/i })).toBeInTheDocument();
  });

  it('displays appointments when data loads', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const mockAppointments = [
      { id: '1', hora: '10:00', paciente_nombre: 'María González', estado: 'Confirmada', fecha: todayStr, provider_id: '1' },
      { id: '2', hora: '11:00', paciente_nombre: 'Carlos Rodríguez', estado: 'Pendiente', fecha: todayStr, provider_id: '1' },
    ];
    mockGetUnwrapped.mockResolvedValue(mockAppointments);

    renderAppointmentsPage();

    await waitFor(() => {
      expect(screen.getByText('María González')).toBeInTheDocument();
      expect(screen.getByText('Carlos Rodríguez')).toBeInTheDocument();
    });
  });

  it('shows provider filter', async () => {
    const mockProviders = [{ id: '1', nombre: 'Dr.', apellidos: 'Smith', colorCalendar: '#4A7C59' }];
    mockGetUnwrapped.mockResolvedValueOnce(mockProviders).mockResolvedValueOnce([]);

    renderAppointmentsPage();

    await waitFor(() => {
      expect(screen.getByText(/Filtrar por profesional/i)).toBeInTheDocument();
    });
  });

  it('opens form dialog when clicking add', async () => {
    mockGetUnwrapped.mockResolvedValue([]);
    renderAppointmentsPage();

    fireEvent.click(screen.getByRole('button', { name: /nueva cita/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /nueva cita/i })).toBeInTheDocument();
    });
  });
});
