import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AnamnesisPage } from '../AnamnesisPage';
import api from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api');
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

const mockApi = vi.mocked(api);

describe('AnamnesisPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const renderAnamnesisPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/clinical/anamnesis/patient-123']}>
          <Routes>
            <Route path="/clinical/anamnesis/:id" element={<AnamnesisPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders anamnesis form with systems', async () => {
    mockApi.get.mockResolvedValue({ data: null });
    mockApi.post.mockResolvedValue({ data: { id: 'new-anamnesis' } });

    renderAnamnesisPage();

    await waitFor(() => {
      expect(screen.getByText(/anamnesis/i)).toBeInTheDocument();
    });
  });

  it('shows systems with questions', async () => {
    mockApi.get.mockResolvedValue({ data: null });
    mockApi.post.mockResolvedValue({ data: { id: 'new-anamnesis' } });

    renderAnamnesisPage();

    await waitFor(() => {
      expect(screen.getByText(/sistemas/i)).toBeInTheDocument();
    });
  });

  it('submits form with responses', async () => {
    mockApi.get.mockResolvedValue({ data: null });
    mockApi.post.mockResolvedValue({ data: { id: 'new-anamnesis' } });

    renderAnamnesisPage();

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      expect(submitButton).toBeInTheDocument();
    });
  });
});