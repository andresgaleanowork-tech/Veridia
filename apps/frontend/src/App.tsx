import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PortalProtectedRoute } from '@/components/auth/PortalProtectedRoute';
import { createPageWrapper } from '@/components/shared/createPageWrapper';
import { PatientLogin } from '@/features/portal/PatientLogin';
import { PortalLayout } from '@/features/portal/PortalLayout';
import { PortalDashboard } from '@/features/portal/PortalDashboard';
import { PortalPlansPage } from '@/features/portal/PortalPlansPage';
import { PortalJournalPage } from '@/features/portal/PortalJournalPage';
import { PortalMessagesPage } from '@/features/portal/PortalMessagesPage';
import { PortalProfilePage } from '@/features/portal/PortalProfilePage';
import { Utensils, BookOpen, BookMarked, Bot, ClipboardList, Scale, Calculator, AlertTriangle, FileText, DollarSign, Calendar, MessageSquare, Settings } from 'lucide-react';

const LoginPage = React.lazy(() => import('@/features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = React.lazy(() => import('@/features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const PatientsPage = React.lazy(() => import('@/features/patients/PatientsPage').then(m => ({ default: m.PatientsPage })));
const PatientDetailPage = React.lazy(() => import('@/features/patients/PatientDetailPage').then(m => ({ default: m.PatientDetailPage })));
const ContextHubPage = React.lazy(() => import('@/features/patients/ContextHubPage').then(m => ({ default: m.ContextHubPage })));
const ClinicalHistoryPage = React.lazy(() => import('@/features/patients/ClinicalHistoryPage').then(m => ({ default: m.ClinicalHistoryPage })));
const AnthropometryPage = React.lazy(() => import('@/features/patients/AnthropometryPage').then(m => ({ default: m.AnthropometryPage })));
const AnalyticsPage = React.lazy(() => import('@/features/patients/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const AppointmentsListPage = React.lazy(() => import('@/features/patients/AppointmentsListPage').then(m => ({ default: m.AppointmentsListPage })));
const ProvidersPage = React.lazy(() => import('@/features/business/ProvidersPage').then(m => ({ default: m.ProvidersPage })));
const AnamnesisPage = React.lazy(() => import('@/features/clinical/AnamnesisPage').then(m => ({ default: m.AnamnesisPage })));
const TelehealthPage = React.lazy(() => import('@/features/telehealth/TelehealthPage').then(m => ({ default: m.TelehealthPage })));
const AIScribePage = React.lazy(() => import('@/features/clinical/AIScribePage').then(m => ({ default: m.AIScribePage })));
const DesarrolladaPage = React.lazy(() => import('@/features/desarrollada/DesarrolladaPage').then(m => ({ default: m.DesarrolladaPage })));
const ReportsPage = React.lazy(() => import('@/features/reports/ReportsPage').then(m => ({ default: m.ReportsPage })));
const OnboardingPage = React.lazy(() => import('@/features/settings/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const IntegrationsPage = React.lazy(() => import('@/features/settings/IntegrationsPage').then(m => ({ default: m.IntegrationsPage })));
const NotFoundPage = React.lazy(() => import('@/features/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const TenantsPage = React.lazy(() => import('@/features/settings/TenantsPage').then(m => ({ default: m.TenantsPage })));
const CareProcessPage = React.lazy(() => import('@/features/care-process/CareProcessPage').then(m => ({ default: m.CareProcessPage })));
const TemplatesPage = React.lazy(() => import('@/features/templates/TemplatesPage').then(m => ({ default: m.TemplatesPage })));
const EnhancedReportsPage = React.lazy(() => import('@/features/reports-enhanced/EnhancedReportsPage').then(m => ({ default: m.EnhancedReportsPage })));
const NotificationsPage = React.lazy(() => import('@/features/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const ServicePackagesPage = React.lazy(() => import('@/features/business/ServicePackagesPage').then(m => ({ default: m.ServicePackagesPage })));

const FoodsPageWrapper = React.lazy(() => import('@/features/nutrition/FoodsPage').then(m => ({ default: createPageWrapper(m.FoodsPage, Utensils, 'Alimentos', 'No se pudo cargar la base de alimentos.', '/nutrition/foods') })));
const RecipesPageWrapper = React.lazy(() => import('@/features/nutrition/RecipesPage').then(m => ({ default: createPageWrapper(m.RecipesPage, BookOpen, 'Recetas', 'No se pudieron cargar las recetas.', '/nutrition/recipes') })));
const JournalPageWrapper = React.lazy(() => import('@/features/nutrition/JournalPage').then(m => ({ default: createPageWrapper(m.JournalPage, BookMarked, 'Diario', 'No se pudo cargar el diario.', '/nutrition/journal') })));
const CopilotPageWrapper = React.lazy(() => import('@/features/nutrition/CopilotPage').then(m => ({ default: createPageWrapper(m.CopilotPage, Bot, 'Copiloto IA', 'No se pudo cargar el copiloto.', '/nutrition/copilot') })));
const MealPlansPageWrapper = React.lazy(() => import('@/features/nutrition/MealPlansPage').then(m => ({ default: createPageWrapper(m.MealPlansPage, ClipboardList, 'Planes Alimentarios', 'No se pudieron cargar los planes.', '/nutrition/meal-plans') })));
const EspenPageWrapper = React.lazy(() => import('@/features/clinical/EspenPage').then(m => ({ default: createPageWrapper(m.EspenPage, Scale, 'Guías ESPEN', 'No se pudieron cargar las guías.', '/clinical/espen') })));
const FormulaPageWrapper = React.lazy(() => import('@/features/clinical/FormulaPage').then(m => ({ default: createPageWrapper(m.FormulaPage, Calculator, 'Fórmulas', 'No se pudieron cargar las fórmulas.', '/clinical/formula') })));
const AlertsPageWrapper = React.lazy(() => import('@/features/clinical/AlertsPage').then(m => ({ default: createPageWrapper(m.AlertsPage, AlertTriangle, 'Alertas', 'No se pudieron cargar las alertas.', '/clinical/alerts') })));
const InvoicesPageWrapper = React.lazy(() => import('@/features/business/InvoicesPage').then(m => ({ default: createPageWrapper(m.InvoicesPage, FileText, 'Facturas', 'No se pudieron cargar las facturas.', '/business/invoices') })));
const AccountingPageWrapper = React.lazy(() => import('@/features/business/AccountingPage').then(m => ({ default: createPageWrapper(m.AccountingPage, DollarSign, 'Contabilidad', 'No se pudo cargar la contabilidad.', '/business/accounting') })));
const AppointmentsPageWrapper = React.lazy(() => import('@/features/business/AppointmentsPage').then(m => ({ default: createPageWrapper(m.AppointmentsPage, Calendar, 'Agenda', 'No se pudieron cargar las citas.', '/appointments') })));
const MessagesPageWrapper = React.lazy(() => import('@/features/messages/MessagesPage').then(m => ({ default: createPageWrapper(m.MessagesPage, MessageSquare, 'Mensajes', 'No se pudieron cargar los mensajes.', '/messages') })));
const SettingsPageWrapper = React.lazy(() => import('@/features/settings/SettingsPage').then(m => ({ default: createPageWrapper(m.SettingsPage, Settings, 'Configuración', 'No se pudieron cargar los ajustes.', '/settings') })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );

  useEffect(() => {
    setIsOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  }, []);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center" aria-busy="true" aria-label="Cargando...">Cargando...</div>}>
          <ErrorBoundary>
            <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — ERP */}
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />

            {/* Clinical */}
            <Route path="/clinical/history/:id?" element={<ClinicalHistoryPage />} />
            <Route path="/clinical/anamnesis/:id?" element={<AnamnesisPage />} />
            <Route path="/clinical/anthropometry/:id?" element={<AnthropometryPage />} />
            <Route path="/clinical/analytics/:id?" element={<AnalyticsPage />} />
            <Route path="/clinical/formula" element={<FormulaPageWrapper />} />
            <Route path="/clinical/espen" element={<EspenPageWrapper />} />
            <Route path="/clinical/alerts" element={<AlertsPageWrapper />} />
            <Route path="/clinical/desarrollada" element={<DesarrolladaPage />} />
            <Route path="/clinical/ai-scribe" element={<AIScribePage />} />
            <Route path="/clinical/care-process/:patientId?" element={<CareProcessPage />} />
            <Route path="/telehealth" element={<TelehealthPage />} />
            {/* Patients */}
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
            <Route path="/patients/:id/context" element={<ContextHubPage />} />
            <Route path="/patients/:id/appointments" element={<AppointmentsListPage />} />

            {/* Nutrition */}
            <Route path="/nutrition/foods" element={<FoodsPageWrapper />} />
            <Route path="/nutrition/recipes" element={<RecipesPageWrapper />} />
            <Route path="/nutrition/meal-plans" element={<MealPlansPageWrapper />} />
            <Route path="/nutrition/copilot" element={<CopilotPageWrapper />} />
            <Route path="/nutrition/journal/:patientId?" element={<JournalPageWrapper />} />

             {/* Business — RBAC protegido */}
             <Route
                element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <Outlet />
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              >
                <Route path="/appointments" element={<AppointmentsPageWrapper />} />
                <Route path="/business/providers" element={<ProvidersPage />} />
                <Route path="/business/invoices" element={<InvoicesPageWrapper />} />
                <Route path="/business/accounting" element={<AccountingPageWrapper />} />
              <Route path="/reports" element={<ReportsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/reports-enhanced/:patientId?" element={<EnhancedReportsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/business/packages" element={<ServicePackagesPage />} />
          </Route>

            {/* Messages */}
            <Route path="/messages" element={<MessagesPageWrapper />} />

             {/* Settings — RBAC protegido */}
             <Route
                path="/settings"
                element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <SettingsPageWrapper />
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />
              <Route path="/settings/integrations" element={<IntegrationsPage />} />
              <Route path="/settings/onboarding" element={<OnboardingPage />} />
               <Route path="/settings/tenants" element={<TenantsPage />} />
            {/* Catch all inside ERP */}
            <Route path="*" element={<ErrorBoundary><NotFoundPage /></ErrorBoundary>} />
          </Route>

          {/* Portal Paciente */}
          <Route path="/portal/login" element={<PatientLogin />} />
          <Route element={<PortalProtectedRoute />}>
            <Route path="/portal" element={<PortalLayout />}>
              <Route path="dashboard" element={<PortalDashboard />} />
              <Route path="plans" element={<PortalPlansPage />} />
              <Route path="journal" element={<PortalJournalPage />} />
              <Route path="messages" element={<PortalMessagesPage />} />
              <Route path="profile" element={<PortalProfilePage />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </BrowserRouter>
      {isOffline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[999] px-4 py-2 rounded-full bg-warning text-white text-xs font-medium shadow-lg flex items-center gap-2"
        >
          <span aria-hidden="true">⚠️</span>
          Modo sin conexión — los cambios se sincronizarán al reconectar.
        </div>
      )}
    </ToastProvider>
    </QueryClientProvider>
  );
}
