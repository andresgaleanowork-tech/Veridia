import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TelehealthPage } from '../TelehealthPage';
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

describe('TelehealthPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const renderTelehealthPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TelehealthPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders telehealth dashboard', () => {
    mockApi.get.mockResolvedValue({ data: [] });
    renderTelehealthPage();
    expect(screen.getByRole('button', { name: /iniciar/i })).toBeInTheDocument();
  });
});