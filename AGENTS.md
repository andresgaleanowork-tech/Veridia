# AGENTS.md - Veridia HealthTech V5.2

## Project Overview
ERP de nutrición clínica con interfaz "Clinical Command Center" (dark mode, glassmorphism).
- **Frontend:** React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + shadcn/ui + Zustand + TanStack Query
- **Backend:** Node.js + Express + PostgreSQL + JWT + bcrypt + Drizzle ORM (TypeScript)
- **Ports:** API `3456`, DB `5444`, Frontend `5173`, Docker API `3457`

## Architecture

### Frontend (`apps/frontend/`)
```
src/
├-- components/
|   ├-- layout/           # Sidebar, Header, Layout (auth guard)
|   ├-- ui/               # shadcn/ui components (Button, Card, Badge, Switch, Tabs, Table, etc.)
|   ├-- shared/           # RouteWrapper (error boundary per route)
|   └-- error/            # ErrorBoundary component
├-- features/
|   ├-- auth/             # LoginPage
|   ├-- dashboard/        # DashboardPage (KPIs, appointments, patients)
|   ├-- patients/         # PatientsPage, PatientDetailPage, ClinicalHistoryPage, AnthropometryPage, AnalyticsPage, AppointmentsListPage
|   ├-- clinical/         # AnamnesisPage, FormulaPage, EspenPage, AlertsPage
|   ├-- nutrition/        # FoodsPage, RecipesPage, MealPlansPage, CopilotPage, JournalPage
|   ├-- business/         # AppointmentsPage, InvoicesPage, AccountingPage
|   ├-- messages/         # MessagesPage
|   └-- settings/         # SettingsPage
├-- hooks/                # usePermission, useDebounce, useLocalStorage, useNavigate
├-- lib/api.ts            # Axios client with JWT + refresh interceptor
├-- stores/               # Zustand (authStore, uiStore)
├-- types/index.ts        # All TypeScript interfaces
├-- i18n/index.ts         # ES/PT translations
└-- index.css             # Tailwind v4 theme tokens
```

### Backend (`apps/backend/`)
```
src/
├-- index.ts              # Express app, middleware, routes, graceful shutdown
├-- config/
|   └-- db.ts             # PostgreSQL pool + Drizzle ORM instance
├-- db/
|   └-- schema/           # Drizzle ORM schemas (~44 tables)
|       ├-- index.ts      # Schema barrel export
|       ├-- users.ts
|       ├-- patients.ts
|       └-- ... (~44 total)
├-- middleware/
|   ├-- auth.ts           # JWT authenticate + authorize
|   ├-- validate.ts       # express-validator helpers
|   ├-- zodValidate.ts    # Zod validation middleware
|   ├-- logger.ts         # Request ID + logging
|   ├-- response.ts       # res.success/error/created/paginated
|   ├-- security.ts       # SQL injection, XSS protection
|   └-- tenant.ts         # Multi-tenant isolation
├-- routes/               # ~35 route files (~200 endpoints)
|   ├-- auth.ts           # Login, register, refresh
|   ├-- patients.ts       # Patient CRUD
|   ├-- clinical.ts       # Formula, anthropometry, analytics
|   ├-- clinical-history.ts
|   ├-- foods.ts          # USDA/OpenFoodFacts proxy + LRU cache
|   ├-- proxy.ts          # Gemini AI proxy
|   ├-- appointments.ts   # Appointment CRUD
|   ├-- invoices.ts       # Invoice CRUD + payments
|   ├-- recipes.ts        # Recipe CRUD
|   ├-- meal-plans.ts     # Meal plan CRUD
|   ├-- messages.ts       # Patient messaging
|   ├-- patient-data.ts   # Diary + symptoms
|   ├-- gastos.ts         # Expense tracking
|   ├-- misc.ts           # Cash, favorites, settings, audit, users
|   ├-- reports.ts        # Reports + analytics
|   ├-- fitness.ts        # Fitness integration
|   ├-- payments.ts       # Payment webhooks
|   ├-- telehealth.ts     # Telehealth
|   ├-- onboarding.ts     # Onboarding flow
|   ├-- automations.ts    # Automations
|   ├-- care-process.ts   # Care process
|   ├-- templates.ts      # Templates
|   ├-- api-v1.ts         # API v1 with key auth
|   └-- webhooks.ts       # Webhooks
└-- utils/
    ├-- migrate.ts        # Initial migration (all tables)
    ├-- migrate-api-keys.ts
    ├-- seed.ts           # Demo data seeder
    ├-- audit.ts          # Audit log helper
```

## Development Commands

### Start Services
```bash
# Start database + API (Docker)
docker compose up -d db api

# Start frontend dev server
cd apps/frontend && npm run dev
```

### Database
```bash
# Run initial migration (raw SQL)
cd apps/backend && npm run migrate

# Seed demo data
cd apps/backend && npm run seed

# Drizzle ORM
cd apps/backend && npm run drizzle:generate  # Generate migration
cd apps/backend && npm run drizzle:push     # Push schema to DB
cd apps/backend && npm run drizzle:studio   # Open Drizzle Studio
```

### Testing
```bash
# Frontend tests (Vitest)
cd apps/frontend && npm test           # Watch mode
cd apps/frontend && npm run test:run   # Single run
cd apps/frontend && npm run test:run -- --coverage  # With coverage

# Backend syntax/typecheck
cd apps/backend && npx tsc --noEmit
cd apps/backend && npm test            # API tests

# Build frontend
cd apps/frontend && npm run build
```

### Linting
```bash
cd apps/frontend && npm run lint
cd apps/backend && npm run lint
```

## Shared Types Package
- `packages/shared-types/` existe como package vacío. Ejecutar `cd apps/backend && npm run types:export` para generar tipos Drizzle compartidos.
- El proyecto usa `npm`, no `pnpm`. El `pnpm-workspace.yaml` existe pero pnpm no está instalado; el CI usa `npm install --legacy-peer-deps`.

## Key Design Decisions
- **Tailwind CSS v4** uses `@theme` in CSS (not `tailwind.config.js`)
- **Path aliases:** `@/` maps to `./src/` (configured in vite.config.ts + tsconfig.app.json)
- **API responses:** Use `res.success()`, `res.paginated()`, `res.error()` from `middleware/response.ts`
- **Request IDs:** Every request gets a UUID for tracing (see `middleware/logger.ts`)
- **Dark mode default:** `#0B1120` background, glassmorphism cards, cyan primary `#0891B2`
- **Drizzle ORM:** Schema in `apps/backend/src/db/schema/`, config in `apps/backend/drizzle.config.ts`
- **Route error handling:** Use `RouteWrapper` component for consistent error boundaries
- **Graceful shutdown:** SIGTERM/SIGINT handlers close DB pool
- **State management:** Frontend usa Zustand (authStore, uiStore) y TanStack Query para datos del servidor

## Route Map (~35 pages)
| Route | Page | Phase |
|-------|------|-------|
| `/` | Dashboard | 1 |
| `/login` | Login | 1 |
| `/patients` | Patient List | 2 |
| `/patients/:id` | Patient Detail | 2 |
| `/patients/:id/appointments` | Patient Appointments | 2 |
| `/clinical/anamnesis/:id` | Anamnesis | 3 |
| `/clinical/history/:id` | Clinical History | 2 |
| `/clinical/anthropometry/:id` | Anthropometry | 2 |
| `/clinical/analytics/:id` | Analytics | 2 |
| `/clinical/formula` | Formula Calculator | 3 |
| `/clinical/espen` | ESPEN Guidelines | 3 |
| `/clinical/alerts` | Clinical Alerts | 2 |
| `/nutrition/foods` | Foods Database | 2 |
| `/nutrition/recipes` | Recipes | 2 |
| `/nutrition/meal-plans` | Meal Plans | 2 |
| `/nutrition/copilot` | AI Copilot | 2 |
| `/appointments` | Calendar | 2 |
| `/business/invoices` | Invoices | 2 |
| `/business/accounting` | Accounting | 2 |
| `/messages` | Messages | 2 |
| `/settings` | Settings | 2 |

## Environment Variables

### Backend (apps/backend/.env)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
PORT=3456
NODE_ENV=development
USDA_API_KEY=DEMO_KEY
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Frontend (apps/frontend/.env)
```
VITE_API_URL=http://localhost:3456
```

## API Endpoints Summary
- **Auth:** POST /login, POST /refresh
- **Patients:** GET/POST /patients, GET/PUT/DELETE /patients/:id
- **Clinical:** POST /clinical/formula, GET/POST /clinical/anamnesis/:id, GET/POST /clinical/histories/:id
- **Nutrition:** GET /foods, GET/POST /recipes, GET/POST /meal-plans
- **Business:** GET/POST /appointments, GET/POST /invoices, POST /invoices/:id/pay
- **Messages:** GET/POST /messages/:pacienteId
- **Settings:** GET/PUT /settings
- **Health:** GET /api/health (DB status, memory, uptime)
- **Docs:** GET /api/docs (API documentation)

## Production Security
- **Helmet:** CSP, HSTS, XSS filter, noSniff, referrer policy
- **CORS:** Configurable origins via CORS_ORIGIN env var
- **Rate limiting:** 100 req/15min general, 5 req/5min for login
- **Request timeout:** 30s max per request
- **Graceful shutdown:** SIGTERM/SIGINT handlers
- **Body size limit:** 10MB max
- **HTTPS redirect:** In production
