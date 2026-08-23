import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FoodsPage } from '../FoodsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGet = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api', () => ({
  default: {
    get: mockGet,
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
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

describe('FoodsPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const renderFoodsPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <FoodsPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders foods table with search input', async () => {
    mockGet.mockResolvedValue({ data: { foods: [], total: 0 } });
    renderFoodsPage();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /crear alimento/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /importar/i })).toBeInTheDocument();
  });

  it('displays foods list when data loads', async () => {
    const mockFoods = [
      { id: '1', name: 'Pollo', calories_per_100g: 165, protein_per_100g: 31 },
      { id: '2', name: 'Arroz', calories_per_100g: 130, protein_per_100g: 2.7 },
    ];
    mockGet.mockResolvedValue({ data: { foods: mockFoods, total: 2 } });

    renderFoodsPage();

    await waitFor(() => {
      expect(screen.getByText('Pollo')).toBeInTheDocument();
      expect(screen.getByText('Arroz')).toBeInTheDocument();
    });
  });

  it('shows empty state when no foods', async () => {
    mockGet.mockResolvedValue({ data: { foods: [], total: 0 } });
    renderFoodsPage();

    await waitFor(() => {
      expect(screen.getByText(/sin resultados/i)).toBeInTheDocument();
    });
  });

  it('opens form dialog when clicking add', async () => {
    mockGet.mockResolvedValue({ data: { foods: [], total: 0 } });
    renderFoodsPage();

    fireEvent.click(screen.getByRole('button', { name: /crear alimento/i }));
    await waitFor(() => {
      expect(screen.getByText(/nuevo alimento/i)).toBeInTheDocument();
    });
  });
});
