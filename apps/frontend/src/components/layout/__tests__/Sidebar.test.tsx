import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';

const { mockToggle } = vi.hoisted(() => ({ mockToggle: vi.fn() }));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: () => ({
    sidebarCollapsed: false,
    toggleSidebar: mockToggle,
  }),
}));
vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => true,
}));
vi.mock('@/i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'sidebar.principal': 'Principal',
        'sidebar.clinico': 'Clínico',
        'sidebar.dashboard': 'Dashboard',
        'sidebar.patients': 'Pacientes',
        'sidebar.appointments': 'Citas',
        'common.collapse': 'Colapsar',
        'common.expand': 'Expandir',
        'common.close': 'Cerrar',
        'common.closeMenu': 'Cerrar menú',
        'common.collapseMenu': 'Colapsar menú',
        'common.expandMenu': 'Expandir menú',
      };
      return map[key] || key;
    },
  }),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSidebar = () => {
    return render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
  };

  it('renders navigation sections', () => {
    renderSidebar();
    expect(screen.getByText('Principal')).toBeInTheDocument();
    expect(screen.getByText('Clínico')).toBeInTheDocument();
  });

  it('renders dashboard link', () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders patients link', () => {
    renderSidebar();
    expect(screen.getByText('Pacientes')).toBeInTheDocument();
  });

  it('renders appointments link', () => {
    renderSidebar();
    expect(screen.getByText('Citas')).toBeInTheDocument();
  });

  it('toggles collapse when button clicked', () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: /colapsar|expandir/i }));
    expect(mockToggle).toHaveBeenCalled();
  });

  it('shows mobile close button when mobileOpen', () => {
    render(
      <BrowserRouter>
        <Sidebar mobileOpen={true} onCloseMobile={vi.fn()} />
      </BrowserRouter>
    );
    expect(screen.getByRole('button', { name: /cerrar/i })).toBeInTheDocument();
  });
});