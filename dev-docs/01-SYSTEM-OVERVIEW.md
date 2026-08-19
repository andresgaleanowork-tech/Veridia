# VERIDIA HEALTHTECH — System Overview
## Clinical Nutrition ERP v5.2.0 Beta

### Identity
- **Brand**: Veridia HealthTech
- **Owner**: GalcoCapital LLC / Eduardo Andres Galeano Aido (NIE: Z0002918W)
- **Clinical Director**: Lic. Antonella Caverzan
- **Domain**: @veridia.tech
- **Firebase Project**: nutrisuite-6e44a

### Tech Stack
- **Frontend**: Vanilla JavaScript (ES6), no frameworks, no bundlers
- **CSS**: Custom design system (837 lines, CSS custom properties, 4-tier responsive)
- **Backend**: Express.js + PostgreSQL (complete, ready to activate)
- **Database**: localStorage (client-side) + Firebase Firestore (cloud sync)
- **AI**: Google Gemini API (via proxy or direct)
- **APIs**: BEDCA (embedded), OpenFoodFacts, USDA FDC, TheMealDB
- **Build**: `node scripts/build-deploy.js` → single HTML file (~1.4 MB)
- **Tests**: Custom test runner (jsdom), 281 unit + 62 E2E = 343 total
- **PWA**: manifest.json + sw.js (cache-first strategy)

### Metrics (as of 2026-08-05)
| Category | Count |
|---|---|
| JS modules in `/js/` | **38** (32 feature + 6 v-* core) — ~15,630 lines |
| HTML pages | 5 app pages + 1 deploy build |
| CSS design system | 837 lines |
| Total project code | ~41,000 lines |
| Automated tests | 343 (281 unit + 62 E2E) |
| BEDCA foods embedded | 969 |
| ICD-10 pathologies | 438 |
| Anatomical systems (anamnesis) | 14 with 70+ pathologies |
| Pathology-specific questionnaires | 13 |
| ESPEN auto-recommendations | 9 pathologies |
| DEV_PATOLOGIAS with ESPEN macros | 13 |
| Clinical indices (auto-calc) | 5 (HOMA-IR, FLI, FIB-4, TG/HDL, PCR) |
| Supplements with dosing | 12 |
| Food equivalencies | 54 (6 groups) |
| Nutritional support pathology guides | 5 |
| Currencies supported | 9 |
| Languages (i18n) | 3 (es/en/pt) |
| RBAC roles | 4 (trial/nutricionista/secretaria/admin) |

### File Structure
```
home/user/
├── index.html                    (586 lines — Landing page + SEO + demo + testimonials)
├── portal-profesional.html       (251 lines — ERP app shell, loads 38 scripts)
├── portal-paciente.html          (909 lines — Patient portal, standalone with own CSS)
├── super-administrador.html      (1,316 lines — SaaS admin panel)
├── sobre-nosotros.html           (225 lines — About + contact page)
├── portal-profesional-deploy.html (Built file, ~1.4 MB, 38 scripts inlined)
├── manifest.json                 (PWA manifest — MUST stay in root)
├── sw.js                         (Service worker — MUST stay in root)
├── firebase.json                 (Hosting config with URL rewrites)
├── package.json                  (v5.2.0)
├── docker-compose.yml            (PostgreSQL + API services)
├── README.md                     (576 lines — Enterprise readme)
├── LICENSE                       (55 lines — Proprietary license)
│
├── assets/                       (PNG logos and icons)
│   ├── logo-icon.png
│   ├── logo-full.png
│   ├── icon-192.png
│   └── icon-512.png
│
├── css/
│   └── app-styles.css            (837 lines — 4-tier responsive design system)
│
├── data/
│   └── bedca-data.js             (168 KB, 969 BEDCA foods)
│
├── js/                           (38 modules, ~15,630 lines total)
│   ├── v-security.js             (77 — Auth, RBAC, session, encryption helpers)
│   ├── v-clinical.js             (103 — Clinical indices, alerts, formulas)
│   ├── v-pathology.js            (117 — Pathology DB, ESPEN, anamnesis systems)
│   ├── v-platform.js             (79 — Firebase, sync, config, i18n)
│   ├── v-memory.js               (404 — DB management, storage, cleanup)
│   ├── v-ux.js                   (78 — UI helpers, toast, modals, charts)
│   ├── icons.js                  (117 — 89 SVG icons, infrastructure, not actively used)
│   ├── firebase.js               (281 — Firebase + Gemini + VERIDIA_CONFIG + anonymizeForAI)
│   ├── i18n.js                   (317 — t() translation, 3 languages, 9 currencies)
│   ├── charts.js                 (105 — SVG chart generators: bar, line, donut)
│   ├── core.js                   (602 — Router, DB, NAV[5 sections], helpers, onboarding)
│   ├── auth.js                   (665 — RBAC 4 roles, login, registration, session)
│   ├── dashboard.js              (312 — Main dashboard with KPI cards)
│   ├── agenda.js                 (548 — Appointments: week/month/day views, drag&drop, iCal)
│   ├── pacientes.js              (198 — Patient management CRUD)
│   ├── historia.js               (651 — Clinical history, 10 tabs per patient)
│   ├── anamnesis.js              (370 — v3: 14 systems, 8 sections, pathology Qs, ESPEN recs)
│   ├── antropometria.js          (278 — ICT, 4 pliegues cutáneos, dinamometría, 9 KPIs)
│   ├── analiticas.js             (162 — Lab analytics + clinical alerts)
│   ├── formula.js                (254 — 7 formulas incl. Schofield/Henry, déficit, peso ideal)
│   ├── espen.js                  (487 — 23 disease×micronutrient matrix, 6 flowcharts)
│   ├── pathology-db.js           (4 — 438 ICD-10 conditions, 15 categories)
│   ├── lifecycle-alerts.js       (531 — Auto alerts: pediatric/adult/geriatric)
│   ├── clinical-tools.js         (572 — 5 clinical indices, MUST/SNAQ/PREDIMED/Balance N)
│   ├── desarrollada.js           (755 — 5-step clinical copilot, 13 patologías, equivalencias)
│   ├── alimentos.js              (897 — BEDCA+OFF+USDA, 11 nutrient filters, supplements)
│   ├── recetas.js                (481 — Recipes: local + TheMealDB, EN→ES translation)
│   ├── planes.js                 (630 — Meal plan wizard, templates, ESPEN recs)
│   ├── favoritos.js              (142 — Favorites, compound dishes, shopping list)
│   ├── soporte-nutricional.js    (1,600 — UCI: 4 tabs, 68 fns, 5 pathology guides)
│   ├── restauracion.js           (2,098 — Institutional: 9 tabs, 74 fns, APPCC, IDDSI)
│   ├── facturacion.js            (333 — Invoicing + cash register)
│   ├── contabilidad.js           (230 — Expenses, products, inventory, P&L)
│   ├── mensajeria.js             (225 — Bidirectional chat, templates, auto-reminders)
│   ├── ia-copilot.js             (134 — Gemini AI assistant, RGPD consent)
│   ├── feedback.js               (409 — NPS + guided tour 10 steps with spotlight)
│   ├── settings.js               (175 — Language, currency, theme, profile)
│   └── utilities.js              (209 — Backup, PDF, CSV exports)
│
├── tests/
│   ├── test-veridia.js           (901 lines — 281 unit tests)
│   ├── test-e2e.js               (658 lines — 62 E2E tests)
│   └── test-nutrisuite.js        (legacy tests)
│
├── scripts/
│   ├── build-deploy.js           (60 lines — Build with inline + minify)
│   └── sync-public.sh            (Sync root → public/)
│
├── config/
│   └── firestore.rules           (45 lines — Default DENY security rules)
│
├── backend/                      (Complete — ready to activate)
│   ├── src/index.js              (141 — Express + Helmet CSP + CORS + rate limiting)
│   ├── src/routes/
│   │   ├── auth.js               (127 — JWT auth endpoints)
│   │   ├── patients.js           (142 — CRUD patients)
│   │   ├── clinical.js           (139 — Clinical data endpoints)
│   │   ├── foods.js              (108 — Food search endpoints)
│   │   └── proxy.js              (71 — Gemini + USDA proxy)
│   └── src/utils/
│       ├── migrate.js            (404 — 18 PostgreSQL tables + 20 indexes)
│       ├── audit.js              (17 — Audit logging utility)
│       ├── seed.js               (34 — Database seeding)
│       └── test-api.js           (157 — API integration tests)
│
├── docs/                         (Project documentation — 1,605 lines)
│   ├── CHANGELOG.md              (172 lines)
│   ├── ARCHITECTURE-AUDIT.md     (266 lines)
│   ├── SECURITY-AUDIT.md         (240 lines)
│   ├── MEJORAS-NUTRICION-v2.md   (347 lines)
│   ├── MEJORAS-PLAN.md           (230 lines)
│   ├── ROADMAP-NUTRICION-v2.md   (75 lines)
│   ├── PRE-LAUNCH-AUDIT.md       (84 lines)
│   └── FLUTTER-MIGRATION-PLAN.md (431 lines)
│
├── dev-docs/                     (THIS folder — developer docs + source code)
│   ├── README.md                 (Index + system summary)
│   ├── 01–10 *.md                (10 documentation files)
│   └── source/                   (Full source code copy)
│
├── legal/                        (4 docs — 612 lines, GDPR/RGPD compliant)
│   ├── AVISO-LEGAL.md            (131 lines)
│   ├── POLITICA-PRIVACIDAD.md    (150 lines)
│   ├── POLITICA-COOKIES.md       (107 lines)
│   └── TERMINOS-Y-CONDICIONES.md (224 lines)
│
└── public/                       (Firebase Hosting deploy target)
```

### Line Count Summary
| Area | Lines |
|---|---|
| JavaScript (38 modules) | 15,630 |
| HTML (5 pages) | 3,287 |
| HTML (deploy build) | ~15,198 (inlined) |
| CSS | 837 |
| Tests | 1,559 |
| Backend | 1,340 |
| Documentation (dev-docs + docs) | ~2,876 |
| Legal | 612 |
| Config/Scripts/Root | ~949 |
| **Total** | **~41,000** |
