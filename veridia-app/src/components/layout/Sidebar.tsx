import { NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  LayoutDashboard, Users, ClipboardList, FlaskConical,
  Apple, Calendar, Receipt, MessageSquare,
  ChevronLeft, ChevronRight, Heart, Brain, Calculator, BookOpen, Video,
  TrendingUp, FileText, Shield, Mic, Settings, Building2, Key, X,
  Users as UsersIcon
} from 'lucide-react';

const navItems = [
  { section: 'Principal', items: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patients', icon: Users, label: 'Pacientes' },
    { to: '/appointments', icon: Calendar, label: 'Agenda' },
  ]},
  { section: 'Clínico', items: [
    { to: '/clinical/history', icon: ClipboardList, label: 'Historia Clínica' },
    { to: '/clinical/anamnesis', icon: FileText, label: 'Anamnesis' },
    { to: '/clinical/anthropometry', icon: TrendingUp, label: 'Antropometría' },
    { to: '/clinical/analytics', icon: FlaskConical, label: 'Analíticas' },
    { to: '/clinical/formula', icon: Calculator, label: 'Fórmula' },
    { to: '/clinical/desarrollada', icon: Calculator, label: 'Desarrollada' },
    { to: '/clinical/espen', icon: Heart, label: 'ESPEN' },
    { to: '/clinical/alerts', icon: Shield, label: 'Alertas' },
    { to: '/clinical/ai-scribe', icon: Mic, label: 'AI Scribe' },
    { to: '/telehealth', icon: Video, label: 'Telehealth' },
  ]},
  { section: 'Nutrición', items: [
    { to: '/nutrition/foods', icon: Apple, label: 'Alimentos' },
    { to: '/nutrition/recipes', icon: ClipboardList, label: 'Recetas' },
    { to: '/nutrition/meal-plans', icon: FileText, label: 'Planes' },
    { to: '/nutrition/copilot', icon: Brain, label: 'Copiloto IA' },
    { to: '/nutrition/journal', icon: BookOpen, label: 'Diario Alimentación' },
  ]},
  { section: 'Configuración', items: [
    { to: '/settings/integrations', icon: Key, label: 'Integraciones' },
    { to: '/settings/onboarding', icon: Settings, label: 'Onboarding' },
    { to: '/settings/tenants', icon: Building2, label: 'Tenants' },
  ]},
  { section: 'Negocio', items: [
    { to: '/business/providers', icon: UsersIcon, label: 'Profesionales' },
    { to: '/business/invoices', icon: Receipt, label: 'Facturación' },
    { to: '/business/accounting', icon: TrendingUp, label: 'Contabilidad' },
    { to: '/reports', icon: FileText, label: 'Reportes' },
    { to: '/messages', icon: MessageSquare, label: 'Mensajes' },
  ]},
];

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Auto-collapse the text labels on small screens to save space.
  useEffect(() => {
    if (!isDesktop && !sidebarCollapsed) {
      toggleSidebar();
    }
  }, [isDesktop, sidebarCollapsed, toggleSidebar]);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Sidebar"
        className={`
          fixed left-0 top-0 h-screen bg-surface border-r border-border z-40 
          transition-all duration-300 flex flex-col
          ${sidebarCollapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            V
          </div>
          {!sidebarCollapsed && (
            <span className="font-bold text-text text-sm tracking-tight">
              Veridia<span className="font-normal text-text-3 ml-1">HealthTech</span>
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav role="navigation" aria-label="Main navigation" className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map((group) => (
            <div key={group.section} className="mb-4">
              {!sidebarCollapsed && (
                <div className="px-3 mb-1 text-[10px] font-semibold text-text-3 uppercase tracking-widest">
                  {group.section}
                </div>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  aria-current={undefined}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 mb-0.5 min-h-[44px] touch-manipulation ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-text-2 hover:text-text hover:bg-white/5'
                    }`
                  }
                >
                  <item.icon size={18} strokeWidth={2} aria-hidden="true" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop) / Close button (mobile) */}
        <div className="p-2 border-t border-border">
          {mobileOpen ? (
            <button
              onClick={onCloseMobile}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-text-3 hover:text-text hover:bg-white/5 transition-colors text-sm min-h-[44px] touch-manipulation"
              aria-label=" Forums"
            >
              <X size={16} aria-hidden="true" />
              <span> Forums</span>
            </button>
          ) : (
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-text-3 hover:text-text hover:bg-white/5 transition-colors text-sm min-h-[44px] touch-manipulation"
              aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              {sidebarCollapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}
              {!sidebarCollapsed && <span>Colapsar</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}