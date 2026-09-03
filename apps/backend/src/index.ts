#!/usr/bin/env node
// ============================================================
//  Veridia HealthTech — Backend API (TypeScript)
//  Node.js + Express + PostgreSQL + JWT + bcrypt + Drizzle ORM
//
//  Usage:  cd backend && npm start
//  Dev:    cd backend && npm run dev
// ============================================================

import 'dotenv/config';
import { validateEnv } from './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom middleware
import { requestId, logger } from './middleware/logger.js';
import { apiResponse } from './middleware/response.js';
import { securityHeaders } from './middleware/security.js';
import { globalLimiter, loginLimiter } from './middleware/rateLimit.js';
import { csrfProtection, csrfTokenEndpoint } from './middleware/csrf.js';
import { createLogger } from './utils/logger.js';

const appLogger = createLogger('APP');

// Fail-fast: valida variables de entorno antes de arrancar (ver §6 README)
validateEnv();

const app = express();
const PORT = process.env.PORT || 3456;

// === SECURITY ===
const isProduction = process.env.NODE_ENV === 'production';

// CSP de la API.
//
// Esta política protege las respuestas del backend (errores HTML, cualquier
// documento que sirva Express). La CSP del frontend la envía nginx, ver
// apps/frontend/security-headers.conf.
//
// La API responde JSON, así que puede permitirse la política más restrictiva
// posible: nada de scripts, estilos ni marcos. Antes se firmaba un nonce por
// petición para style-src que ningún documento llegaba a usar, así que solo
// añadía trabajo de crypto en cada request.
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'none'"],
    scriptSrc: ["'none'"],
    styleSrc: ["'none'"],
    imgSrc: ["'none'"],
    fontSrc: ["'none'"],
    // connect-src no aplica a respuestas JSON, pero se declara para que la
    // política sea explícita si alguna vez se sirve un documento desde aquí.
    connectSrc: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'none'"],
    formAction: ["'none'"],
    frameAncestors: ["'none'"],
  }
}));

if (isProduction) {
  app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));
}

app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.permittedCrossDomainPolicies());
// No filtrar la URL de la API al navegar a recursos externos.
app.use(helmet.crossOriginResourcePolicy({ policy: 'same-site' }));

// WARNING: In production, CORS_ORIGIN must be set to allowed origins
app.use(cors({
  origin: process.env.CORS_ORIGIN || (isProduction ? false : ['http://localhost:5173', 'http://localhost:3457']),
  credentials: true,
}));

// === ADVANCED RATE LIMITING ===
app.use(globalLimiter);

// === BODY PARSERS ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// === CUSTOM MIDDLEWARE ===
app.use(requestId);
app.use(logger);
app.use(apiResponse);
app.use(securityHeaders);

// === CSRF PROTECTION ===
app.get('/api/csrf-token', csrfTokenEndpoint);
app.use(csrfProtection);

// === REQUEST TIMEOUT ===
app.use((_req, res, next) => {
  res.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(408).json({ error: true, message: 'Request timeout' });
    }
  });
  next();
});

// === HEALTH CHECK ===
import { checkDbHealth } from './utils/monitoring.js';

app.get('/api/health', async (_req, res) => {
  const { healthy, metrics } = await checkDbHealth();
  
  const health = {
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: {
      status: healthy ? 'healthy' : 'degraded',
      activeConnections: metrics.activeConnections,
      totalConnections: metrics.totalConnections,
      slowQueries: metrics.slowQueries,
      cacheHitRatio: metrics.cacheHitRatio,
      databaseSize: metrics.databaseSize,
      uptime: metrics.uptime,
    },
  };
  
  res.status(healthy ? 200 : 503).json(health);
});

// === API DOCS ===
app.get('/api/docs', (_req, res) => {
  res.json({
    name: 'Veridia HealthTech API',
    version: '5.3.0',
    description: 'ERP de Nutrición Clínica — API RESTful',
    docs: {
      auth: { 'POST /api/auth/login': 'Iniciar sesión', 'POST /api/auth/refresh': 'Refrescar token', 'POST /api/auth/register': 'Registrar usuario' },
      patients: { 'GET /api/patients': 'Listar pacientes', 'POST /api/patients': 'Crear paciente', 'GET /api/patients/:id': 'Detalle paciente' },
      clinical: { 'GET /api/clinical/anamnesis/:id': 'Anamnesis', 'POST /api/clinical/formula': 'Calcular fórmula' },
      nutrition: { 'GET /api/foods': 'Buscar alimentos', 'GET /api/recipes': 'Recetas', 'GET /api/meal-plans': 'Planes alimenticios' },
      business: { 'GET /api/appointments': 'Citas', 'GET /api/invoices': 'Facturas' },
      messages: { 'GET /api/messages/:id': 'Mensajes del paciente' },
      context: { 'GET /api/patient-context/:id': 'Contexto computado del paciente', 'GET /api/patient-context/:id/:module': 'Módulo específico', 'POST /api/patient-context/:id/invalidate': 'Forzar recomputación' },
    },
  });
});

// === STATIC FILES (PDFs, exports) ===
const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
app.use('/reports', express.static(reportsDir));

const exportsDir = path.join(__dirname, '../exports');
if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });
app.use('/exports', express.static(exportsDir));

// === ROUTES ===
import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import clinicalRoutes from './routes/clinical.js';
import clinicalHistoryRoutes from './routes/clinical-history.js';
import appointmentRoutes from './routes/appointments.js';
import invoiceRoutes from './routes/invoices.js';
import recipeRoutes from './routes/recipes.js';
import mealPlanRoutes from './routes/meal-plans.js';
import mealPlanGeneratorRoutes from './routes/meal-plans-generator.js';
import foodRoutes from './routes/foods.js';
import messageRoutes from './routes/messages.js';
import miscRoutes from './routes/misc.js';
import alertRoutes from './routes/clinical.js'; // alerts are in clinical
import reportRoutes from './routes/reports.js';
import reportsEnhancedRoutes from './routes/reports-enhanced.js';
import proxyRoutes from './routes/proxy.js';
import patientDataRoutes from './routes/patient-data.js';
import patientJournalRoutes from './routes/patient-journal.js';
import patientPortalRoutes from './routes/patient-portal.js';
import expenseRoutes from './routes/gastos.js';
import settingsRoutes from './routes/user-settings.js';
import automationRoutes from './routes/automations.js';
import templateRoutes from './routes/templates.js';
import telehealthRoutes from './routes/telehealth.js';
import pushRoutes from './routes/push.js';
import notificationRoutes from './routes/notifications.js';
import servicePackageRoutes from './routes/service-packages.js';
import fitnessRoutes from './routes/fitness.js';
import paymentRoutes from './routes/payments.js';
import calendarRoutes from './routes/calendar.js';
import aiScribeRoutes from './routes/ai-scribe.js';
import careProcessRoutes from './routes/care-process.js';
import onboardingRoutes from './routes/onboarding.js';
import apiV1Routes from './routes/api-v1.js';
import tenantRoutes from './routes/tenants.js';
import webhookRoutes from './routes/webhooks.js';
import patientContextRoutes from './routes/patient-context.js';
import supplementRoutes from './routes/supplements.js';

// Public routes (no auth)
app.use('/api/auth', authRoutes);
app.use('/api/portal', patientPortalRoutes);

// Protected routes
app.use('/api/patients', patientRoutes);
app.use('/api/clinical', clinicalRoutes);
app.use('/api/clinical/history', clinicalHistoryRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/meal-plans/generator', mealPlanGeneratorRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/misc', miscRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reports-enhanced', reportsEnhancedRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api', patientDataRoutes);
app.use('/api/patient-journal', patientJournalRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/telehealth', telehealthRoutes);
app.use('/api/portal/push', pushRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/service-packages', servicePackageRoutes);
app.use('/api/fitness', fitnessRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/ai-scribe', aiScribeRoutes);
app.use('/api/care-process', careProcessRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/v1', apiV1Routes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/patient-context', patientContextRoutes);
app.use('/api/supplements', supplementRoutes);

// Login-specific rate limiter
app.use('/api/auth/login', loginLimiter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: true, message: 'Endpoint no encontrado' });
});

// Error handler
app.use((err: unknown, _req: express.Request, res: express.Response) => {
  appLogger.error('Unhandled error', {
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  res.status(500).json({ error: true, message: 'Error interno del servidor' });
});

// === START SERVER ===
const server = app.listen(PORT, () => {
  appLogger.info('Veridia API running', { port: PORT });
  appLogger.info('Health endpoint', { url: `http://localhost:${PORT}/api/health` });
  appLogger.info('Docs endpoint', { url: `http://localhost:${PORT}/api/docs` });
  appLogger.info('Environment', { env: process.env.NODE_ENV || 'development' });
});

// Graceful shutdown
const shutdown = (signal: string) => {
  appLogger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    appLogger.info('HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => { appLogger.error('Forced shutdown.'); process.exit(1); }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
