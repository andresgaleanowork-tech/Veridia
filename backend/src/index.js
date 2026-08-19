#!/usr/bin/env node
// ============================================================
//  Veridia HealthTech — Backend API
//  Node.js + Express + PostgreSQL + JWT + bcrypt
//
//  Usage:  cd backend && npm start
//  Dev:    cd backend && npm run dev
// ============================================================

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Custom middleware
const { requestId, logger } = require('./middleware/logger');
const { apiResponse } = require('./middleware/response');
const { sqlInjectionProtection, securityHeaders } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3456;

// === SECURITY ===
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:"],
    fontSrc: ["'self'"],
    connectSrc: ["'self'", "https://api.usda.gov", "https://generativelanguage.googleapis.com"]
  }
}));

if (process.env.NODE_ENV === 'production') {
  app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));
}

app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use(helmet.permittedCrossDomainPolicies({ permittedPolicies: 'none' }));
app.use(helmet.dnsPrefetchControl({ allow: false }));
app.use(helmet.crossOriginEmbedderPolicy({ policy: 'require-corp' }));
app.use(helmet.crossOriginOpenerPolicy({ policy: 'same-origin' }));
app.use(helmet.crossOriginResourcePolicy({ policy: 'same-origin' }));

const corsOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.CORS_ORIGIN || 'https://veridia.health').split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3457', 'http://localhost:3000'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Custom middleware stack
app.use(requestId);
app.use(logger);
app.use(apiResponse);
app.use(sqlInjectionProtection);
app.use(securityHeaders);

// Specific rate limiters for auth endpoints (applied BEFORE general limiter)
const loginLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 5, message: 'Demasiados intentos' });
app.use('/api/auth/login', loginLimiter);

const refreshLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
app.use('/api/auth/refresh', refreshLimiter);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { error: 'Demasiadas peticiones. Intente de nuevo en 15 minutos.' },
  skip: (req) => {
    const p = req.originalUrl || req.url || '';
    return p.includes('/health') || p.includes('/docs');
  },
});
app.use('/api/', limiter);

// HTTPS redirect in production
if (process.env.NODE_ENV === 'production') {
  app.use(function (req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, 'https://' + req.hostname + req.url);
    }
    next();
  });
}

// === HEALTH & DOCS (before auth-protected routes) ===
app.get('/api/health', async (req, res) => {
  const health = {
    ok: true,
    service: 'Veridia HealthTech API',
    version: '5.2.0',
    env: process.env.NODE_ENV || 'development',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    requestId: req.id,
  };

  try {
    const { query } = require('./config/db');
    const dbStart = Date.now();
    await query('SELECT 1');
    health.database = { status: 'connected', latency: `${Date.now() - dbStart}ms` };
  } catch (err) {
    health.database = { status: 'disconnected', error: err.message };
    health.ok = false;
  }

  const mem = process.memoryUsage();
  health.memory = {
    rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
    heap: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
  };

  res.status(health.ok ? 200 : 503).json(health);
});

app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Veridia HealthTech API',
    version: '5.2.0',
    baseUrl: '/api',
    endpoints: {
      auth: { 'POST /auth/login': 'Login', 'POST /auth/refresh': 'Refresh token' },
      patients: { 'GET /patients': 'List', 'POST /patients': 'Create', 'GET /patients/:id': 'Get', 'PUT /patients/:id': 'Update', 'DELETE /patients/:id': 'Delete' },
      clinical: { 'POST /clinical/formula': 'Formula calc', 'GET /clinical/anamnesis/:id': 'Anamnesis', 'POST /clinical/anamnesis': 'Create anamnesis' },
      'patient-journal': { 'GET /patient-journal': 'List journals', 'POST /patient-journal': 'Create journal', 'GET /patient-journal/:id': 'Get journal', 'GET /patient-journal/stats/:patientId': 'Stats' },
      nutrition: { 'GET /foods': 'Search foods', 'GET /recipes': 'List recipes', 'GET /meal-plans': 'List plans' },
      business: { 'GET /appointments': 'List', 'POST /invoices': 'Create', 'POST /invoices/:id/pay': 'Pay' },
      reports: { 'POST /reports/generate': 'Generate', 'GET /reports/:id/download': 'Download', 'GET /report-templates': 'Templates' },
    },
    auth: 'Bearer Token (JWT)',
    rateLimit: { general: '100/15min', auth: '20/15min' },
  });
});

// === API ROUTES ===
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/clinical', require('./routes/clinical'));
app.use('/api/clinical', require('./routes/clinical-history'));
app.use('/api/patient-journal', require('./routes/patient-journal'));
app.use('/api/foods', require('./routes/foods'));
app.use('/api/proxy', require('./routes/proxy'));
app.use('/api/ai-scribe', require('./routes/ai-scribe'));
app.use('/api', require('./routes/appointments'));
app.use('/api', require('./routes/invoices'));
app.use('/api', require('./routes/recipes'));
app.use('/api', require('./routes/meal-plans'));
app.use('/api', require('./routes/messages'));
app.use('/api', require('./routes/patient-data'));
app.use('/api', require('./routes/gastos'));
app.use('/api', require('./routes/misc'));
app.use('/api', require('./routes/reports'));
app.use('/api/fitness', require('./routes/fitness'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/telehealth', require('./routes/telehealth'));
  app.use('/api/onboarding', require('./routes/onboarding'));
  app.use('/api/meal-plans/generator', require('./routes/meal-plans-generator'));
  app.use('/api/portal', require('./routes/patient-portal'));
  app.use('/api/automations', require('./routes/automations'));

app.use('/api/v1', require('./routes/api-v1'));
app.use('/api/webhooks', require('./routes/webhooks'));

// === SERVE REACT FRONTEND ===
// In production/Docker: serve from veridia-app/dist/
// In development: the Vite dev server runs separately on port 5173
const reactDistPath = path.join(__dirname, '..', '..', 'veridia-app', 'dist');
const dockerFrontendPath = path.join(__dirname, '..', 'frontend');
const hasReactBuild = fs.existsSync(path.join(reactDistPath, 'index.html'));
const hasDockerFrontend = fs.existsSync(path.join(dockerFrontendPath, 'index.html')) && !fs.existsSync(path.join(dockerFrontendPath, 'portal-profesional.html'));
const frontendPath = hasReactBuild ? reactDistPath : (hasDockerFrontend ? dockerFrontendPath : reactDistPath);

if (hasReactBuild || hasDockerFrontend || fs.existsSync(path.join(dockerFrontendPath, 'index.html'))) {
  const servePath = hasReactBuild ? reactDistPath : dockerFrontendPath;
  // Serve static assets from React build
  app.use(express.static(servePath));

  // SPA catch-all: all non-API routes serve React's index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(servePath, 'index.html'));
    }
  });
} else {
  // Fallback: serve old landing page if React build doesn't exist
  const fallbackPath = path.join(__dirname, '..', '..');
  app.use(express.static(fallbackPath));

  app.get('/', (req, res) => {
    const landing = path.join(fallbackPath, 'index.html');
    if (fs.existsSync(landing)) res.sendFile(landing);
    else res.json({ message: 'Veridia HealthTech API', docs: '/api/health' });
  });

  app.get('/app', (req, res) => {
    const htmlPath = path.join(fallbackPath, 'portal-profesional.html');
    if (fs.existsSync(htmlPath)) res.sendFile(htmlPath);
    else res.redirect('/');
  });

  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.redirect('/');
    }
  });
}

// 404 for API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint no encontrado' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload demasiado grande. Máximo: 10MB' });
  }
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  res.status(500).json({ error: 'Error interno del servidor' });
});

// === START ===
app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('');
    console.log('  ╔══════════════════════════════════════════════╗');
    console.log('  ║   🥗 Veridia HealthTech — Backend API        ║');
    console.log('  ║   v5.2.0 — Node.js + Express + PostgreSQL    ║');
    console.log('  ╚══════════════════════════════════════════════╝');
    console.log('');
    console.log(`  🌐 API:          http://localhost:${PORT}/api/health`);
    console.log(`  📚 Docs:         http://localhost:${PORT}/api/docs`);
    console.log(`  🖥️  Frontend:     ${hasReactBuild ? 'React (veridia-app/dist)' : 'Fallback (legacy)'}`);
    console.log('');
    console.log('  Ctrl+C para detener');
    console.log('');
  }
});

module.exports = app;
