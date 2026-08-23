import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';

const mockLogin = vi.fn();
const mockClearError = vi.fn();
let mockState: {
  login: ReturnType<typeof vi.fn>;
  isLoading: boolean;
  error: string | null;
  clearError: ReturnType<typeof vi.fn>;
};

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => mockState,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      login: mockLogin,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    };
  });

  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
  };

  it('renders login form with email and password fields', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('shows error message when login fails', async () => {
    mockState.login = vi.fn().mockRejectedValue(new Error('Credenciales inválidas'));
    mockState.error = 'Credenciales inválidas';

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    const passwordInput = screen.getByLabelText('Contraseña');
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', () => {
    mockState.isLoading = true;

    renderLoginPage();
    expect(screen.getByRole('button', { name: /ingresando|iniciar sesión/i })).toBeDisabled();
  });

  it('toggles password visibility', () => {
    renderLoginPage();
    const passwordInput = screen.getByLabelText('Contraseña');
    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: /mostrar|ver/i }));
    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});
