import { NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTranslation } from '@/i18n/useTranslation';
import {
  LayoutDashboard, Users, ClipboardList, FlaskConical,
  Apple, Calendar, Receipt, MessageSquare,
  ChevronLeft, ChevronRight, Heart, Brain, Calculator, BookOpen, Video,
  TrendingUp, FileText, Shield, Mic, Settings, Building2, Key, X,
  Users as UsersIcon, Bell, Package
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { t } = useTranslation();

  const navItems = [
    { section: t('sidebar.principal'), items: [
      { to: '/', icon: LayoutDashboard, label: t('sidebar.dashboard') },
      { to: '/patients', icon: Users, label: t('sidebar.patients') },
      { to: '/appointments', icon: Calendar, label: t('sidebar.appointments') },
    ]},
    { section: t('sidebar.clinico'), items: [
      { to: '/patients', icon: ClipboardList, label: t('sidebar.clinicalHistory') },
      { to: '/patients', icon: FileText, label: t('sidebar.anamnesis') },
      { to: '/patients', icon: TrendingUp, label: t('sidebar.anthropometry') },
      { to: '/patients', icon: FlaskConical, label: t('sidebar.analytics') },
      { to: '/clinical/formula', icon: Calculator, label: t('sidebar.formula') },
      { to: '/clinical/desarrollada', icon: Calculator, label: t('sidebar.desarrollada') },
      { to: '/clinical/espen', icon: Heart, label: t('sidebar.espen') },
      { to: '/clinical/care-process', icon: ClipboardList, label: t('sidebar.careProcess') },
      { to: '/clinical/alerts', icon: Shield, label: t('sidebar.alerts') },
      { to: '/clinical/ai-scribe', icon: Mic, label: t('sidebar.aiScribe') },
      { to: '/telehealth', icon: Video, label: t('sidebar.telehealth') },
    ]},
    { section: t('sidebar.nutricion'), items: [
      { to: '/nutrition/foods', icon: Apple, label: t('sidebar.foods') },
      { to: '/nutrition/recipes', icon: ClipboardList, label: t('sidebar.recipes') },
      { to: '/nutrition/meal-plans', icon: FileText, label: t('sidebar.mealPlans') },
      { to: '/nutrition/copilot', icon: Brain, label: t('sidebar.copilot') },
      { to: '/nutrition/journal', icon: BookOpen, label: t('sidebar.journal') },
    ]},
    { section: t('sidebar.configuracion'), items: [
      { to: '/settings/integrations', icon: Key, label: t('sidebar.integrations') },
      { to: '/settings/onboarding', icon: Settings, label: t('sidebar.onboarding') },
      { to: '/settings/tenants', icon: Building2, label: t('sidebar.tenants') },
    ]},
    { section: t('sidebar.negocio'), items: [
      { to: '/business/providers', icon: UsersIcon, label: t('sidebar.providers') },
      { to: '/business/packages', icon: Package, label: t('sidebar.packages') },
      { to: '/business/invoices', icon: Receipt, label: t('sidebar.invoicing') },
      { to: '/business/accounting', icon: TrendingUp, label: t('sidebar.accounting') },
      { to: '/reports', icon: FileText, label: t('sidebar.reports') },
      { to: '/messages', icon: MessageSquare, label: t('sidebar.messages') },
      { to: '/notifications', icon: Bell, label: t('sidebar.notifications') },
    ]},
    { section: t('sidebar.calidad'), items: [
      { to: '/templates', icon: FileText, label: t('sidebar.templates') },
      { to: '/reports-enhanced', icon: TrendingUp, label: t('sidebar.advancedReports') },
    ]},
  ];

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
                  // Varios items comparten to='/patients' (Historia clínica,
                  // Anamnesis, ...): la key debe ser única o React avisa
                  // 'two children with the same key' y degrada el reconcile.
                  key={`${item.to}-${item.label}`}
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
              aria-label={t('common.closeMenu')}
            >
              <X size={16} aria-hidden="true" />
              <span>{t('common.close')}</span>
            </button>
          ) : (
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-text-3 hover:text-text hover:bg-white/5 transition-colors text-sm min-h-[44px] touch-manipulation"
              aria-label={sidebarCollapsed ? t('common.expandMenu') : t('common.collapseMenu')}
            >
              {sidebarCollapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}
              {!sidebarCollapsed && <span>{t('common.collapse')}</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}