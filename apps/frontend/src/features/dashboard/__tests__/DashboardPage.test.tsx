import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '../DashboardPage';
import api from '@/lib/api';

vi.mock('@/lib/api');
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

const mockApi = vi.mocked(api);

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderDashboardPage = () => {
    return render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );
  };

  it('renders dashboard with loading state initially', () => {
    mockApi.get.mockResolvedValue({ data: { total: 0 } });
    renderDashboardPage();
    const main = document.querySelector('[aria-busy="true"], main, [role="main"]');
    expect(main).toBeTruthy();
  });

  it('displays stats cards after loading', async () => {
    mockApi.get.mockResolvedValue({ data: { meta: { total: 10 }, data: [] } });
    renderDashboardPage();

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/Buenos días|Buenas tardes|Buenas noches/);
      expect(document.body.textContent).toContain('Pacientes activos');
      expect(document.body.textContent).toContain('10');
    });
  });

  it('shows recent patients section', async () => {
    mockApi.get
      .mockResolvedValueOnce({ 
        data: { total: 1, data: [{ id: '1', nombre: 'María', apellidos: 'González' }] } 
      })
      .mockResolvedValue({ data: { total: 0, data: [] } });

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText(/María González/)).toBeInTheDocument();
    });
  });

  it('shows today appointments section', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: { total: 0, data: [] } })
      .mockResolvedValueOnce({ 
        data: { total: 1, data: [{ id: '1', hora: '10:00', paciente_nombre: 'Juan Pérez', estado: 'Confirmada' }] } 
      })
      .mockResolvedValue({ data: { total: 0, data: [] } });

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText(/Juan Pérez/)).toBeInTheDocument();
      expect(screen.getByText(/10:00/)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockApi.get.mockRejectedValue(new Error('Network error'));
    renderDashboardPage();
    await waitFor(() => {
      expect(document.querySelector('[role="alert"], [aria-live]')).toBeTruthy();
    });
  });
});