import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SettingsPage } from '../SettingsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGet = vi.hoisted(() => vi.fn());
const mockPut = vi.hoisted(() => vi.fn());
const mockGetUnwrapped = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api', () => ({
  default: {
    get: mockGet,
    getUnwrapped: mockGetUnwrapped,
    post: vi.fn(),
    put: mockPut,
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: { name: 'Test User', email: 'test@test.com', telefono: '600111222' },
    logout: vi.fn(),
  }),
}));
vi.mock('@/hooks/useLocale', () => ({
  useLocale: () => ['es'],
}));

describe('SettingsPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    mockGetUnwrapped.mockResolvedValue({ branding: {}, url: 'http://test.ics' });
  });

  const renderSettingsPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders settings form with user data', async () => {
    mockPut.mockResolvedValue({ data: {} });
    renderSettingsPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('test@test.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('600111222')).toBeInTheDocument();
  });

  it('saves settings on form submit', async () => {
    mockPut.mockResolvedValue({ data: {} });
    renderSettingsPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue('Test User');
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    const saveButton = screen.getByRole('button', { name: /guardar cambios/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/settings', expect.objectContaining({ name: 'Updated Name' }));
    });
  });

  it('opens password change dialog', async () => {
    mockPut.mockResolvedValue({ data: {} });
    renderSettingsPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
    await waitFor(() => {
      expect(screen.getByText(/contraseña actual/i)).toBeInTheDocument();
    });
  });

  it('shows branding settings section', async () => {
    mockPut.mockResolvedValue({ data: {} });
    renderSettingsPage();
    await waitFor(() => {
      expect(screen.getByText(/branding para pdfs/i)).toBeInTheDocument();
    });
  });

  it('shows calendar sync section', async () => {
    mockPut.mockResolvedValue({ data: {} });
    mockGet.mockResolvedValue({ data: { url: 'http://test.ics' } });
    renderSettingsPage();
    await waitFor(() => {
      expect(screen.getByText(/sync de calendario/i)).toBeInTheDocument();
    });
  });
});
