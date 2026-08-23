import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TemplatesPage } from '../TemplatesPage';
import api from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api');
vi.mock('@/hooks/useLocale', () => ({
  useLocale: () => ['es'],
}));
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

const mockApi = vi.mocked(api);

describe('TemplatesPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const renderTemplatesPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TemplatesPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders templates list', () => {
    mockApi.get.mockResolvedValue({ data: [] });
    renderTemplatesPage();
    expect(screen.getByRole('button', { name: /nueva plantilla/i })).toBeInTheDocument();
  });

  it('displays templates when loaded', async () => {
    mockApi.get.mockResolvedValue({ data: [{ id: '1', nombre: 'Plantilla 1', tipo: 'informe' }] });
    renderTemplatesPage();

    await waitFor(() => {
      expect(screen.getByText('Plantilla 1')).toBeInTheDocument();
    });
  });
});