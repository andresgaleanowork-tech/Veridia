import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MessagesPage } from '../MessagesPage';
import api from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api');
vi.mock('@/hooks/useLocale', () => ({
  useLocale: () => ['es'],
}));

const mockApi = vi.mocked(api);

describe('MessagesPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const renderMessagesPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MessagesPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders messages list', () => {
    mockApi.get.mockResolvedValue({ data: { messages: [], total: 0 } });
    renderMessagesPage();
    expect(screen.getByRole('heading', { name: /mensajes/i })).toBeInTheDocument();
  });

  it('displays messages grouped by patient', async () => {
    const mockMessages = [
      { id: '1', paciente_id: 'p1', text: 'Hola doctor', sender: 'patient', read: false, created_at: new Date().toISOString() },
      { id: '2', paciente_id: 'p1', text: 'Hola paciente', sender: 'nutri', read: true, created_at: new Date().toISOString() },
    ];
    mockApi.get.mockResolvedValue({ data: { messages: mockMessages, total: 2 } });

    renderMessagesPage();

    await waitFor(() => {
      expect(screen.getByText('Paciente p1')).toBeInTheDocument();
    });
  });

  it('shows unread badge for patient messages', async () => {
    const mockMessages = [
      { id: '1', paciente_id: 'p1', text: 'Hola', sender: 'patient', read: false, created_at: new Date().toISOString() },
    ];
    mockApi.get.mockResolvedValue({ data: { messages: mockMessages, total: 1 } });

    renderMessagesPage();

    await waitFor(() => {
      expect(screen.getByText(/1 mensajes sin leer/i)).toBeInTheDocument();
    });
  });

  it('composer allows typing a message', async () => {
    mockApi.get.mockResolvedValue({ data: { messages: [], total: 0 } });
    renderMessagesPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/redactar/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    expect(input).toHaveValue('Test message');

    const sendBtn = screen.getByRole('button', { name: /enviar/i });
    expect(sendBtn).not.toBeDisabled();
  });
});