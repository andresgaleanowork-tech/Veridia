# 🌿 Veridia HealthTech — Clinical Nutrition ERP

**Plataforma enterprise de nutrición clínica y restauración colectiva.**

ERP que integra el ciclo completo de la práctica del nutricionista — desde la primera consulta hasta la facturación — con decisiones basadas en evidencia clínica (guías ESPEN, IDDSI, APPCC) y asistencia de IA (Google Gemini).

| Metadato | Valor |
|----------|-------|
| **Versión** | `5.3.0` |
| **Clasificación** | Confidencial — Uso Interno |
| **Propietario** | GalcoCapital LLC — Eduardo Andres Galeano Aido |
| **Contacto técnico** | `admin@veridia.tech` |

---

## 1. Alcance funcional

| Dominio | Módulos |
|---------|---------|
| **Clínico** | Historia clínica, anamnesis (13 sistemas), antropometría (percentiles OMS), analíticas biomarcadores, fórmula clínica (5 ecuaciones + calorimetría Weir), motor de guías ESPEN (NRS-2002, GLIM, NUTRIC, MNA-SF), alertas de ciclo vital, soporte nutricional UCI (enteral/parenteral) |
| **Nutricional** | Copiloto clínico 5 pasos multi-patología, base BEDCA + USDA FDC + OpenFoodFacts, recetas, planes alimentarios, diario del paciente |
| **Institucional** | Restauración colectiva: menús, 14 alérgenos UE, IDDSI 0-7, APPCC, trazabilidad, recall sanitario |
| **Gestión** | Agenda con citas recurrentes, facturación multilínea, caja, contabilidad, mensajería bidireccional, telemedicina, reportes |
| **Administración** | Portal del paciente, panel multi-tenante (SaaS), auditoría, plantillas, automatizaciones, integraciones (Stripe, Twilio, IA) |

**Herramientas externas:** Google Gemini 2.0 (IA clínica con anonimización de PII), USDA FoodData Central, OpenFoodFacts, TheMealDB.

**Multi-idioma:** ES, EN, PT · **Multi-moneda:** 9 (EUR, USD, ARS, MXN, CLP, COP, PEN, GBP, BRL)

---

## 2. Stack tecnológico

```
┌────────────────────────────────────────────────────────────┐
│  FRONTEND  (apps/frontend)                                  │
│  React 19 · TypeScript · Vite 8 · Tailwind CSS v4           │
│  shadcn/ui · Zustand · TanStack Query · Recharts · PWA      │
│  Storybook 10 · Vitest · oxlint                             │
├────────────────────────────────────────────────────────────┤
│  BACKEND   (apps/backend)                                   │
│  Node.js · Express · TypeScript · Drizzle ORM · PostgreSQL  │
│  JWT + bcrypt · Zod · Helmet · CSRF · Rate limiting         │
│  Stripe · Twilio · Firebase Admin · Puppeteer (PDF) · cron  │
├────────────────────────────────────────────────────────────┤
│  SHARED    (packages/shared-types)                          │
│  Tipos TypeScript generados desde el esquema Drizzle        │
└────────────────────────────────────────────────────────────┘
```

**Monorepo pnpm** — Node.js `>=20`, pnpm `9.x`.

---

## 3. Estructura del proyecto

```
veridia/
├── apps/
│   ├── frontend/                # SPA React 19 (PWA)
│   │   ├── src/
│   │   │   ├── components/      # ui (shadcn), layout, shared, error
│   │   │   ├── features/        # auth, dashboard, patients, clinical,
│   │   │   │                     nutrition, business, telehealth, portal,
│   │   │   │                     reports, care-process, settings… (lazy)
│   │   │   ├── hooks/           # usePermission, useDebounce…
│   │   │   ├── i18n/            # ES / EN / PT
│   │   │   ├── lib/             # api client (axios + JWT refresh), pwa
│   │   │   ├── stores/          # Zustand (auth, ui)
│   │   │   └── types/           # Interfaces de dominio
│   │   ├── public/              # manifest.json, service-worker.js, icons
│   │   └── .storybook/
│   └── backend/                 # API REST (~200 endpoints)
│       ├── src/
│       │   ├── db/schema/       # Esquema Drizzle (~44 tablas)
│       │   ├── middleware/      # auth (JWT+RBAC), tenant, zod, security…
│       │   ├── routes/          # ~37 módulos de rutas
│       │   ├── services/        # Lógica de dominio, PDF (puppeteer)
│       │   ├── jobs/            # Tareas programadas (node-cron)
│       │   ├── utils/           # logger (winston), audit, seed
│       │   └── index.ts         # Bootstrap: seguridad, routes, shutdown
│       ├── drizzle/             # Migraciones SQL
│       └── tests/               # Vitest (middleware, routes, services, utils)
├── packages/
│   └── shared-types/            # Tipos compartidos (generados de Drizzle)
├── docker-compose.yml           # DB + API + frontend (desarrollo)
├── docker-compose.staging.yml   # Entorno staging
├── docker-compose.prod.yml      # Entorno producción
├── .github/workflows/           # CI/CD (ci.yml, staging.yml, deploy.yml)
└── legal/                       # Aviso legal, privacidad, cookies, T&C
```

**Puertos:** Frontend `5173` · API `3456` (Docker `3457`) · PostgreSQL `5444`

---

## 4. Puesta en marcha

### 4.1 Requisitos

| Requisito | Versión |
|-----------|---------|
| Node.js | `>=20` |
| pnpm | `9.x` (`corepack enable`) |
| Docker + Compose | opcional (para DB y API containerizadas) |

### 4.2 Opción A — Desarrollo local (recomendado)

```bash
git clone <repo> && cd veridia
corepack enable
pnpm install

# Base de datos (PostgreSQL 16 en puerto 5444)
docker compose up -d db

# Esquema + datos iniciales
cp .env.example .env        # genera secretos reales (ver §6)
pnpm db:push                # aplica el esquema Drizzle
pnpm db:seed                # usuarios y pacientes demo

# Arrancar API (puerto 3456) y frontend (puerto 5173)
pnpm dev
```

Frontend: <http://localhost:5173> · API health: <http://localhost:3456/api/health> · Docs API: <http://localhost:3456/api/docs>

> El Vite dev server proxya `/api` hacia el backend (por defecto `host.docker.internal:3457`; en host nativo usa `localhost:3456`).

### 4.3 Opción B — Todo con Docker

```bash
cp .env.example .env        # genera secretos reales (ver §6)
docker compose up -d --build
```

### 4.4 Credenciales de desarrollo (seed)

> ⚠️ **Solo para desarrollo/demo.** En producción, la autenticación usa bcrypt y las credenciales se gestionan por el panel multi-tenante.

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | `admin@veridia.tech` | `Admin2026!` |
| Nutricionista | `antonella@veridia.tech` | `Nutri2026!` |
| Secretaria | `maria@veridia.tech` | `Secre2026!` |

---

## 5. Scripts

### Raíz (monorepo)

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | API + frontend en paralelo |
| `pnpm build` | Build de producción (frontend + backend) |
| `pnpm lint` | Lint de ambos apps |
| `pnpm test` | Suite completa (frontend + backend) |
| `pnpm db:push` / `db:migrate` | Sincronizar / migrar esquema |
| `pnpm db:seed` | Datos iniciales (usuarios + demo) |
| `pnpm types:sync` | Regenerar `packages/shared-types` desde Drizzle |

### Frontend (`apps/frontend`)

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Vite dev server (`:5173`) |
| `pnpm build` | `tsc -b` + build de producción |
| `pnpm test:run` | Tests unitario/componente (Vitest + jsdom) |
| `pnpm storybook` | Storybook (`:6006`) |
| `pnpm lint` | oxlint |

### Backend (`apps/backend`)

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | `tsx watch` (hot reload) |
| `pnpm build` | Compila a `dist/` |
| `pnpm test` | Vitest (unitarios con mocks) |
| `pnpm db:generate` / `db:migrate` / `db:studio` | Herramientas Drizzle |
| `pnpm lint` | ESLint |

---

## 6. Variables de entorno

Referencia: [`.env.example`](.env.example). Genera los secretos con:

```bash
openssl rand -hex 24      # DB_PASSWORD (URL-safe)
openssl rand -base64 32   # JWT_SECRET, JWT_REFRESH_SECRET
```

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DB_PASSWORD` | Sí (dev) | Password de PostgreSQL (embebido en `DATABASE_URL`) |
| `JWT_SECRET` | Sí | Firma de tokens de acceso |
| `JWT_REFRESH_SECRET` | Sí | Firma de tokens de refresco |
| `USDA_API_KEY` | No | Default `DEMO_KEY` |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | No (IA) | Clave de Google AI Studio |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | No (cobros) | Pasarela de pagos |
| `FIREBASE_*` | No (push/backup) | Firebase Admin |
| `TWILIO_*` | No (SMS) | Twilio |
| `CORS_ORIGIN` | **Sí en producción** | Orígenes permitidos (coma) |

> 🔐 Las API keys **nunca** llegan al navegador: el frontend llama a `/api/proxy/*` y el backend inyecta la key.

---

## 7. Seguridad

| Capa | Medida |
|------|--------|
| **CSP** | Content-Security-Policy con **nonce por request** (frontend y backend) |
| **CORS** | Restringido a `CORS_ORIGIN`; bloqueado por defecto en producción |
| **Rate limiting** | Limiter global + limiter específico de login (memoria) |
| **CSRF** | Doble token (`/api/csrf-token`) para peticiones mutativas |
| **Auth** | JWT (acceso + refresh), bcrypt `$12`, RBAC 3 roles (admin / nutricionista / secretaria) |
| **Multi-tenancy** | Middleware de aislamiento por tenant en todas las rutas |
| **Headers** | Helmet (HSTS en producción, noSniff, referrerPolicy), validación Zod en entradas |
| **PII + IA** | `anonymizeForAI()` redacta datos personales antes de llamar a Gemini |
| **Auditoría** | Log de acciones en PG + winston con request-id |

### ⚠️ Datos de salud (RGPD Art. 9)

La plataforma procesa datos de categoría especial (salud). **Antes de producción con pacientes reales** es obligatorio:

- [ ] DPIA (Data Protection Impact Assessment)
- [ ] Registro de actividades de tratamiento + DPO designado
- [ ] Consentimiento explícito del paciente para el uso de IA
- [ ] Contratos de encargado de tratamiento con los proveedores externos

Documentación legal en [`legal/`](legal/).

---

## 8. Tests

| Suite | Ubicación | Ejecución |
|-------|-----------|-----------|
| Frontend (unit + componente) | `apps/frontend/src/**/*.test.tsx` | `pnpm test:frontend` |
| Backend (middleware, routes, services, utils) | `apps/backend/tests/` | `pnpm test:backend` |
| Storybook (visual/a11y, browser) | `apps/frontend/.storybook` | vía Vitest browser mode |
| E2E (Playwright) | `apps/frontend/e2e/` | `pnpm e2e` (requiere API + DB corriendo) |

La CI (`.github/workflows/ci.yml`) ejecuta lint → typecheck → build → tests en cada PR.

---

## 9. Build y despliegue

### Frontend

```bash
pnpm build:frontend   # genera apps/frontend/dist/
```

Deploy estático en Vercel/Netlify (SPA, rewrites a `index.html`).

### Backend (Docker)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Imagen multi-stage (build → runner no-privilegiado) con healthcheck en `/api/health`.

---

## 10. Planes SaaS

| Plan | Precio | Usuarios | Pacientes | Módulos |
|------|--------|----------|-----------|---------|
| **Starter** | 0 €/mes | 1 | 20 | 5 |
| **Professional** | 49 €/mes | 3 | 500 | 18 |
| **Enterprise** | 149 €/mes | 10 | ∞ | 22 + RC |

---

## 11. Documentación

| Documento | Contenido |
|-----------|-----------|
| [`AGENTS.md`](AGENTS.md) | Guía de arquitectura para agentes/developers |
| [`PRODUCT.md`](PRODUCT.md) | Truth de producto: usuarios, propósito, principios |
| [`DESIGN.md`](DESIGN.md) | Design system (tokens, tipografía, componentes) |
| `legal/` | Aviso legal, privacidad, cookies, términos |

---

## 12. Equipo

| Nombre | Rol | Contacto |
|--------|-----|----------|
| **Eduardo Andres Galeano Aido** | Director de Arquitectura / CTO | `admin@veridia.tech` |
| **Lic. Antonella Caverzan** | Directora Clínica | `antonella@veridia.tech` |

---

## Licencia

Copyright © 2026 GalcoCapital LLC. Todos los derechos reservados.
Software propietario — prohibida su reproducción o distribución sin autorización expresa.
