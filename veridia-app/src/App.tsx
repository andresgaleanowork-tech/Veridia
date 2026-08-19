import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PatientLogin } from '@/features/portal/PatientLogin';
import { PortalLayout } from '@/features/portal/PortalLayout';
import { PortalDashboard } from '@/features/portal/PortalDashboard';
import { PortalPlansPage } from '@/features/portal/PortalPlansPage';
import { PortalJournalPage } from '@/features/portal/PortalJournalPage';
import { PortalMessagesPage } from '@/features/portal/PortalMessagesPage';
import { useOfflineListener } from '@/lib/pwa';

const LoginPage = React.lazy(() => import('@/features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = React.lazy(() => import('@/features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const PatientsPage = React.lazy(() => import('@/features/patients/PatientsPage').then(m => ({ default: m.PatientsPage })));
const PatientDetailPage = React.lazy(() => import('@/features/patients/PatientDetailPage').then(m => ({ default: m.PatientDetailPage })));
const ClinicalHistoryPage = React.lazy(() => import('@/features/patients/ClinicalHistoryPage').then(m => ({ default: m.ClinicalHistoryPage })));
const AnthropometryPage = React.lazy(() => import('@/features/patients/AnthropometryPage').then(m => ({ default: m.AnthropometryPage })));
const AnalyticsPage = React.lazy(() => import('@/features/patients/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const AppointmentsListPage = React.lazy(() => import('@/features/patients/AppointmentsListPage').then(m => ({ default: m.AppointmentsListPage })));
const RecipesPageWrapper = React.lazy(() => import('@/features/nutrition/RecipesPageWrapper').then(m => ({ default: m.RecipesPageWrapper })));
const MealPlansPageWrapper = React.lazy(() => import('@/features/nutrition/MealPlansPageWrapper').then(m => ({ default: m.MealPlansPageWrapper })));
const FoodsPageWrapper = React.lazy(() => import('@/features/nutrition/FoodsPageWrapper').then(m => ({ default: m.FoodsPageWrapper })));
const CopilotPageWrapper = React.lazy(() => import('@/features/nutrition/CopilotPageWrapper').then(m => ({ default: m.CopilotPageWrapper })));
const JournalPageWrapper = React.lazy(() => import('@/features/nutrition/JournalPageWrapper').then(m => ({ default: m.JournalPageWrapper })));
const AppointmentsPageWrapper = React.lazy(() => import('@/features/business/AppointmentsPageWrapper').then(m => ({ default: m.AppointmentsPageWrapper })));
const ProvidersPage = React.lazy(() => import('@/features/business/ProvidersPage').then(m => ({ default: m.ProvidersPage })));
const InvoicesPageWrapper = React.lazy(() => import('@/features/business/InvoicesPageWrapper').then(m => ({ default: m.InvoicesPageWrapper })));
const AccountingPageWrapper = React.lazy(() => import('@/features/business/AccountingPageWrapper').then(m => ({ default: m.AccountingPageWrapper })));
const MessagesPageWrapper = React.lazy(() => import('@/features/messages/MessagesPageWrapper').then(m => ({ default: m.MessagesPageWrapper })));
const AnamnesisPage = React.lazy(() => import('@/features/clinical/AnamnesisPage').then(m => ({ default: m.AnamnesisPage })));
const FormulaPageWrapper = React.lazy(() => import('@/features/clinical/FormulaPageWrapper').then(m => ({ default: m.FormulaPageWrapper })));
const EspenPageWrapper = React.lazy(() => import('@/features/clinical/EspenPageWrapper').then(m => ({ default: m.EspenPageWrapper })));
const AlertsPageWrapper = React.lazy(() => import('@/features/clinical/AlertsPageWrapper').then(m => ({ default: m.AlertsPageWrapper })));
const TelehealthPage = React.lazy(() => import('@/features/telehealth/TelehealthPage').then(m => ({ default: m.TelehealthPage })));
const AIScribePage = React.lazy(() => import('@/features/clinical/AIScribePage').then(m => ({ default: m.AIScribePage })));
const DesarrolladaPage = React.lazy(() => import('@/features/desarrollada/DesarrolladaPage').then(m => ({ default: m.DesarrolladaPage })));
const ReportsPage = React.lazy(() => import('@/features/reports/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsPageWrapper = React.lazy(() => import('@/features/settings/SettingsPageWrapper').then(m => ({ default: m.SettingsPageWrapper })));
const OnboardingPage = React.lazy(() => import('@/features/settings/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const IntegrationsPage = React.lazy(() => import('@/features/settings/IntegrationsPage').then(m => ({ default: m.IntegrationsPage })));
const NotFoundPage = React.lazy(() => import('@/features/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const TenantsPage = React.lazy(() => import('@/features/settings/TenantsPage').then(m => ({ default: m.TenantsPage })));

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

  useOfflineListener(() => setIsOffline(true), () => setIsOffline(false));

  return (
    <QueryClientProvider client={queryClient}>
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center" aria-busy="true" aria-label="Cargando...">Cargando...</div>}>
          <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — ERP */}
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />

            {/* Clinical */}
            <Route path="/clinical/history/:id" element={<ClinicalHistoryPage />} />
            <Route path="/clinical/anamnesis/:id" element={<AnamnesisPage />} />
            <Route path="/clinical/anthropometry/:id" element={<AnthropometryPage />} />
            <Route path="/clinical/analytics/:id" element={<AnalyticsPage />} />
            <Route path="/clinical/formula" element={<FormulaPageWrapper />} />
            <Route path="/clinical/espen" element={<EspenPageWrapper />} />
            <Route path="/clinical/alerts" element={<AlertsPageWrapper />} />
            <Route path="/clinical/desarrollada" element={<DesarrolladaPage />} />
            <Route path="/clinical/ai-scribe" element={<AIScribePage />} />
            <Route path="/telehealth" element={<TelehealthPage />} />
            {/* Patients */}
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
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
              <Route path="/reports" element={<ReportsPage />} />             </Route>

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
          <Route path="/portal" element={<PortalLayout />}>
            <Route path="dashboard" element={<PortalDashboard />} />
            <Route path="plans" element={<PortalPlansPage />} />
            <Route path="journal" element={<PortalJournalPage />} />
            <Route path="messages" element={<PortalMessagesPage />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
