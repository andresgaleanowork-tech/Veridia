# AGENTS.md — Veridia HealthTech V5.2

## Project Overview
ERP de nutrición clínica con interfaz "Clinical Command Center" (dark mode, glassmorphism).
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui
- **Backend:** Node.js + Express + PostgreSQL + JWT + bcrypt
- **Ports:** API `3456`, DB `5444`, Frontend `5173`, Docker API `3457`

## Architecture

### Frontend (`veridia-app/`)
```
src/
├── components/layout/    # Sidebar, Header, Layout (auth guard)
├── features/
│   ├── auth/            # LoginPage
│   ├── dashboard/       # DashboardPage (KPIs, appointments, patients)
│   ├── patients/        # PatientsPage, PatientDetailPage, ClinicalHistoryPage, AnthropometryPage, AnalyticsPage, AppointmentsListPage
│   ├── clinical/        # AnamnesisPage, FormulaPage, EspenPage, AlertsPage
│   ├── nutrition/       # FoodsPage, RecipesPage, MealPlansPage, CopilotPage
│   ├── business/        # AppointmentsPage, InvoicesPage, AccountingPage
│   ├── messages/        # MessagesPage
│   └── settings/        # SettingsPage
├── lib/api.ts           # Axios client with JWT + refresh interceptor
├── stores/              # Zustand (authStore, uiStore)
├── types/index.ts       # All TypeScript interfaces (18 DB tables)
└── index.css            # Tailwind v4 theme tokens
```

### Backend (`backend/`)
```
src/
├── index.js             # Express app, middleware, routes
├── config/db.js         # PostgreSQL pool
├── middleware/
│   ├── auth.js          # JWT authenticate + authorize
│   ├── validate.js      # express-validator helpers
│   ├── logger.js        # Request ID + logging
│   ├── response.js      # Standardized API responses
│   └── security.js      # SQL injection, XSS protection
├── routes/
│   ├── auth.js          # Login, register, refresh
│   ├── patients.js      # Patient CRUD
│   ├── clinical.js      # Formula, anthropometry, analytics
│   ├── clinical-history.js  # Anamnesis + clinical history
│   ├── foods.js         # USDA/OpenFoodFacts proxy
│   ├── proxy.js         # Gemini AI proxy
│   ├── appointments.js  # Appointment CRUD
│   ├── invoices.js      # Invoice CRUD + payments
│   ├── recipes.js       # Recipe CRUD
│   ├── meal-plans.js    # Meal plan CRUD
│   ├── messages.js      # Patient messaging
│   ├── patient-data.js  # Diary + symptoms
│   ├── gastos.js        # Expense tracking
│   └── misc.js          # Cash, favorites, settings, audit, users
└── utils/
    ├── migrate.js       # Initial migration
    ├── migrate-v2.js    # Phase 0 migration (new tables/columns)
    ├── seed.js          # Demo data seeder
    ├── audit.js         # Audit log helper
    └── test-api.js      # API test suite
```

## Development Commands

### Start Services
```bash
# Start database + API (Docker)
docker-compose up -d db api

# Start frontend dev server
cd veridia-app && npm run dev
```

### Database
```bash
# Run initial migration
cd backend && npm run migrate

# Run v2 migration (new columns/tables)
cd backend && npm run migrate:v2

# Seed demo data
cd backend && npm run seed
```

### Testing
```bash
# Run API tests (no DB required)
cd backend && npm test

# TypeScript check (frontend)
cd veridia-app && npx tsc -p tsconfig.app.json --noEmit

# Build frontend
cd veridia-app && npm run build
```

### Linting
```bash
cd veridia-app && npm run lint
```

## Key Design Decisions
- **Tailwind CSS v4** uses `@theme` in CSS (not `tailwind.config.js`)
- **Path aliases:** `@/` maps to `./src/` (configured in vite.config.ts + tsconfig.app.json)
- **API responses:** Use `res.success()`, `res.paginated()`, `res.error()` from `middleware/response.js`
- **Request IDs:** Every request gets a UUID for tracing (see `middleware/logger.js`)
- **Dark mode default:** `#0B1120` background, glassmorphism cards, cyan primary `#0891B2`

## Route Map (22 pages)
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

### Backend (.env)
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

### Frontend (.env)
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
