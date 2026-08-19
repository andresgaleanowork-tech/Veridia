---
© 2026 GalcoCapital LLC. Todos los derechos reservados.

Creador, Propietario y Director de Arquitectura: Eduardo Andres Galeano Aido (NIE: Z0002918W).

Este documento contiene información confidencial y propiedad intelectual exclusiva de GalcoCapital LLC. Queda prohibida su reproducción o distribución sin autorización expresa.

---

# 🌿 Veridia HealthTech — Clinical Nutrition ERP

**Plataforma Enterprise de Nutrición Clínica y Restauración Colectiva**

| Metadato | Valor |
|----------|-------|
| **Documento** | `README.md` — Documentación Técnica Principal |
| **Versión** | `5.2.0` |
| **Prioridad** | 1º Grado — Crítico |
| **Clasificación** | Confidencial — Uso Interno |
| **Última actualización** | 25 de junio de 2026 |
| **Propietario** | GalcoCapital LLC / Eduardo Andres Galeano Aido |
| **Contacto técnico** | `admin@veridia.tech` |

---

## 1. Introducción

Veridia HealthTech es un sistema ERP (Enterprise Resource Planning) especializado en nutrición clínica y restauración colectiva institucional. La plataforma integra inteligencia artificial (Google Gemini 2.0), motor de guías clínicas ESPEN, framework IDDSI para disfagia, control APPCC de seguridad alimentaria, y gestión integral de consultorios nutricionales — desde la primera consulta hasta la facturación.

### 1.1 Alcance funcional

| Dominio | Módulos | Descripción |
|---------|---------|-------------|
| **Clínico** | Historia Clínica (10 tabs), Antropometría, Analíticas, Fórmula Clínica (5 ecuaciones), Alertas Ciclo Vital, ESPEN Guidelines Engine, Soporte Nutricional UCI | Gestión integral del paciente con screening NRS-2002, GLIM, NUTRIC, MNA-SF. Nutrición enteral (15 fórmulas), parenteral, protocolo insulina Yale, destete 6 fases. |
| **Nutricional** | Desarrollada (5 pasos), BEDCA (969 alimentos), OpenFoodFacts, USDA FDC, Recetas, Planes Alimentarios | Copiloto clínico con multi-patología (438 ICD-10), cuadraje de macronutrientes, minuta exportable. |
| **Institucional** | Restauración Colectiva (9 tabs) | Menús para colegios/hospitales/geriátricos, 14 alérgenos UE, IDDSI 0-7, derivaciones automáticas, escalado con factores de merma, APPCC, trazabilidad, recall sanitario. |
| **Gestión** | Facturación, Caja, Contabilidad, Agenda, Mensajería, IA Copilot | Facturas multilínea, citas recurrentes, chat bidireccional, asistente IA clínico. |
| **Administración** | Portal del Paciente, SuperAdmin SaaS, Auditoría | Portal web del paciente con registro DNI, panel SaaS para gestión multi-clínica, audit log. |

### 1.2 Métricas del sistema

| Métrica | Valor |
|---------|-------|
| Módulos JS | 31 archivos |
| Líneas de código frontend | 13,491 |
| Funciones | 578 |
| Tests automatizados | 343 (281 unitarios + 62 E2E) |
| Datos estáticos offline | BEDCA 969 alimentos + 438 patologías ICD-10 |
| Idiomas | 3 (ES, EN, PT) |
| Monedas | 9 (EUR, USD, ARS, MXN, CLP, COP, PEN, GBP, BRL) |
| Build (single-file deploy) | 1,153 KB |
| Tablas PostgreSQL | 18 |
| Endpoints API REST | 5 route groups + health + proxy |

---

## 2. Requisitos Previos

### 2.1 Entorno de desarrollo

| Requisito | Versión mínima | Verificación |
|-----------|---------------|--------------|
| **Node.js** | `>=18.0.0` | `node --version` |
| **npm** | `>=9.0.0` | `npm --version` |
| **Git** | `>=2.30` | `git --version` |
| **Docker** (opcional, para backend) | `>=20.10` | `docker --version` |
| **Docker Compose** (opcional) | `>=2.0` | `docker compose version` |

### 2.2 Cuentas y servicios externos

| Servicio | Propósito | Obligatorio | URL de registro |
|----------|-----------|-------------|-----------------|
| **Firebase** | Firestore sync + Analytics | Sí (sync cloud) | https://console.firebase.google.com |
| **Google AI Studio** | Gemini API key | Sí (IA clínica) | https://aistudio.google.com/apikey |
| **USDA FDC** | API key para alimentos | Opcional (DEMO_KEY funciona) | https://fdc.nal.usda.gov/api-key-signup |

> ⚠️ **SEGURIDAD**: Las API keys NUNCA deben estar hardcodeadas en el código fuente. Se gestionan exclusivamente desde SuperAdmin → 🔑 APIs & Keys, y se almacenan en `localStorage('veridia_api_config')`. En producción, utilizar el backend proxy (`/api/proxy/*`) para que las keys no lleguen al browser.

---

## 3. Arquitectura del Sistema

### 3.1 Stack tecnológico

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (Client-Side)                 │
│  Vanilla JavaScript · Zero Frameworks · CSS Custom Props  │
│  PWA (Service Worker + Manifest) · SVG Charts Inline     │
│  VERIDIA_CONFIG (centralized API management)             │
├──────────────────────────────────────────────────────────┤
│                    BACKEND (API Proxy)                    │
│  Express.js 4.18 · Helmet · CORS · Rate Limiting        │
│  JWT (jsonwebtoken) · bcrypt · express-validator         │
│  Proxy: /api/proxy/gemini · /api/proxy/usda             │
├──────────────────────────────────────────────────────────┤
│                    DATA LAYER                            │
│  Primary: localStorage (offline-first, 5MB)             │
│  Sync: Firebase Firestore (cloud backup)                │
│  Relational: PostgreSQL 15 (18 tables, 20 indexes)      │
│  Static: BEDCA 969 foods + Pathology DB 438 ICD-10      │
├──────────────────────────────────────────────────────────┤
│                    EXTERNAL APIs                         │
│  Google Gemini 2.0 Flash Lite (IA clínica)              │
│  USDA FoodData Central (114 nutrientes/alimento)        │
│  OpenFoodFacts (productos comerciales + barcode)        │
│  TheMealDB (recetas internacionales)                    │
├──────────────────────────────────────────────────────────┤
│                    SECURITY LAYER                        │
│  CSP (Content Security Policy) · Helmet headers         │
│  RBAC (3 roles) · Session timeout + lock screen         │
│  Data anonymization (RGPD) · Firestore Security Rules   │
│  JWT 128-char random secrets · HTTPS enforcement        │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Estructura del proyecto

```
veridia-healthtech/
├── veridia.html                 # App shell principal (ERP) — 168 líneas
├── index.html                   # Landing page — 424 líneas
├── portal-paciente.html         # Portal del paciente — 842 líneas
├── superadmin.html              # Panel administración SaaS — 1,107 líneas
├── app-styles.css               # Design system + responsive — 765 líneas
├── bedca-data.js                # 969 alimentos BEDCA (offline) — 168 KB
├── manifest.json                # PWA manifest
├── sw.js                        # Service Worker (cache-first strategy)
├── firestore.rules              # Firestore Security Rules
├── build-deploy.js              # Build: genera single-file deploy
├── docker-compose.yml           # PostgreSQL + API containerized
├── package.json                 # v5.2.0, 10 scripts npm
│
├── js/                          # 31 módulos JavaScript
│   ├── firebase.js              # VERIDIA_CONFIG + Firebase + Gemini proxy
│   ├── i18n.js                  # 3 idiomas, 9 monedas, tema
│   ├── charts.js                # SVG charts (line, bar, donut)
│   ├── core.js                  # Router, helpers, onboarding, memory mgmt
│   ├── auth.js                  # Login, RBAC, seguridad, sesión
│   ├── dashboard.js             # KPIs, widgets, alertas
│   ├── agenda.js                # Citas, drag&drop, recurrentes, iCal
│   ├── pacientes.js             # CRUD pacientes, tags, foto
│   ├── historia.js              # HC 10 tabs, documentos, farmacología
│   ├── antropometria.js         # Mediciones, DW, OMS percentiles, donut
│   ├── analiticas.js            # Biomarcadores, trend, import CSV
│   ├── formula.js               # 5 fórmulas, calorimetría Weir
│   ├── espen.js                 # Guidelines engine, 6 flowcharts
│   ├── pathology-db.js          # 438 patologías ICD-10 (60 KB)
│   ├── desarrollada.js          # Copiloto 5 pasos, plantillas
│   ├── soporte-nutricional.js   # UCI: 4 tabs, 66 funciones, 1,681 líneas
│   ├── alimentos.js             # BEDCA + OFF + USDA, barcode
│   ├── recetas.js               # CRUD + TheMealDB, foto
│   ├── planes.js                # Wizard, adherencia, templates
│   ├── restauracion.js          # 9 tabs institucional, 68 funciones
│   ├── facturacion.js           # Facturas, caja, recurrentes, fiscal
│   ├── contabilidad.js          # Gastos, P&L, inventario, stock
│   ├── favoritos.js             # Alimentos y platos favoritos
│   ├── anamnesis.js             # 13 sistemas, multi-versión
│   ├── lifecycle-alerts.js      # Alertas ciclo vital (ped/adult/ger)
│   ├── clinical-tools.js        # Acta, comparador, RGPD, CSV import
│   ├── mensajeria.js            # Chat bidireccional, templates
│   ├── ia-copilot.js            # Gemini IA, prompts contextuales
│   ├── feedback.js              # NPS, emojis, demo guiado
│   ├── settings.js              # Config, export/import
│   └── utilities.js             # Backup, export, PDF universal
│
├── tests/
│   ├── test-veridia.js          # 281 tests unitarios — 901 líneas
│   └── test-e2e.js              # 62 tests E2E (10 flujos) — 658 líneas
│
├── scripts/
│   └── build-deploy.js          # Script de build (copia organizada)
│
├── docs/
│   ├── CHANGELOG.md             # Historial de cambios v5.0→v5.2
│   ├── ARCHITECTURE-AUDIT.md    # Auditoría de arquitectura (27 recs)
│   ├── SECURITY-AUDIT.md        # Auditoría de ciberseguridad (22 vulns)
│   ├── FLUTTER-MIGRATION-PLAN.md # Plan migración mobile (12 fases)
│   └── MEJORAS-PLAN.md          # Plan de mejoras (84 completadas)
│
├── backend/
│   ├── .env                     # Variables de entorno (CONFIDENCIAL)
│   ├── Dockerfile               # Container para API
│   ├── package.json             # Dependencias backend
│   └── src/
│       ├── index.js             # Express app (141 líneas)
│       ├── config/db.js         # PostgreSQL pool (42 líneas)
│       ├── middleware/
│       │   ├── auth.js          # JWT verify + RBAC authorize
│       │   └── validate.js      # express-validator sanitization
│       ├── routes/
│       │   ├── auth.js          # POST /login, /register, /refresh
│       │   ├── patients.js      # CRUD /api/patients
│       │   ├── clinical.js      # /api/clinical/*
│       │   ├── foods.js         # /api/foods/off/search, /bedca
│       │   └── proxy.js         # /api/proxy/gemini, /usda/search
│       └── utils/
│           ├── migrate.js       # 18 CREATE TABLE + 20 indexes
│           ├── seed.js          # Datos iniciales
│           ├── audit.js         # Logging de acciones
│           └── test-api.js      # Tests de API
│
├── LICENSE                      # Propietario: GalcoCapital LLC
├── .gitignore
└── .editorconfig
```

---

## 4. Guía de Instalación y Ejecución

### 4.1 Instalación del frontend

```bash
# Clonar el repositorio
git clone https://github.com/veridia-healthtech/erp.git
cd erp

# Instalar dependencias de desarrollo (solo jsdom para tests)
npm install

# Verificar sintaxis de los 31 módulos JS
npm run check
# Output esperado: ✅ All JS files valid

# Ejecutar tests unitarios (281 tests)
npm test
# Output esperado: 📊 RESULTS: 281/281 passed

# Ejecutar tests E2E (62 tests, 10 flujos completos)
npm run test:e2e
# Output esperado: 📊 E2E RESULTS: 62/62 passed

# Ejecutar ambos suites
npm run test:all
# Output esperado: 343/343 passed

# Abrir en navegador (desarrollo local)
open veridia.html
# O servir con cualquier servidor estático:
npx serve .
```

### 4.2 Build para producción

```bash
# Genera veridia-deploy.html (single-file, ~1.1MB, todo inlined + minificado)
npm run build

# Output:
# ✅ veridia-deploy.html generated
#    32 scripts inlined
#    Size: 1153 KB
```

> ⚠️ **IMPORTANTE**: El archivo `veridia-deploy.html` contiene TODOS los scripts y CSS inlined. Para Vercel/Netlify, renombrarlo a `index.html` o configurar rewrite rules.

### 4.3 Instalación del backend (opcional para Beta)

```bash
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales reales:
#   DATABASE_URL=postgresql://user:pass@host:5432/db
#   JWT_SECRET=<128-char-random-hex>
#   GEMINI_API_KEY=<your-key>

# Con Docker (recomendado):
cd ..
docker compose up -d
# Inicia PostgreSQL + API en http://localhost:3456

# Sin Docker:
cd backend
npm start
# API en http://localhost:3456/api/health
```

### 4.4 Configuración de Docker

```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: nutrisuite_db
      POSTGRES_USER: nutrisuite
      POSTGRES_PASSWORD: nutrisuite_secret
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  api:
    build: ./backend
    ports:
      - "3456:3456"
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://nutrisuite:nutrisuite_secret@db:5432/nutrisuite_db
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}

volumes:
  pgdata:
```

---

## 5. Autenticación y Control de Acceso (RBAC)

### 5.1 Roles y permisos

| Rol | Módulos permitidos | Restricciones |
|-----|-------------------|---------------|
| **Nutricionista** | Dashboard, Agenda, Pacientes, Historia Clínica, Antropometría, Analíticas, Alertas, Fórmula, Soporte, Desarrollada, BEDCA, Recetas, Planes, Restauración, Mensajes, IA, Settings | Sin acceso a: Auditoría, Contabilidad, Caja |
| **Secretaria** | Dashboard, Agenda, Pacientes, Facturación, Caja, Contabilidad, Settings | Sin acceso a: módulos clínicos ni nutricionales |
| **Admin** | TODOS los módulos + Auditoría + Settings completos | Acceso total |

### 5.2 Credenciales de desarrollo

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Lic. Antonella Caverzan | `antonella@veridia.tech` | `nutri123` | Nutricionista |
| María Recepción | `maria@veridia.tech` | `secre123` | Secretaria |
| Andrés Galeano | `admin@veridia.tech` | `admin123` | Admin |

**SuperAdmin** (portal de gestión SaaS):

| Email | Contraseña |
|-------|------------|
| `superadmin@veridia.tech` | `superadmin123` |

> ⚠️ **SEGURIDAD CRÍTICA**: Estas credenciales son EXCLUSIVAMENTE para desarrollo y demo. En producción, la autenticación DEBE migrarse al backend con bcrypt ($2b$12) o Firebase Authentication. El hash actual (`syncHash`) es un DJB2a+FNV-1a NO criptográfico — vulnerable a fuerza bruta. Ver `docs/SECURITY-AUDIT.md` § SEC-F1.

---

## 6. Gestión de API Keys (VERIDIA_CONFIG)

### 6.1 Flujo de configuración

```
SuperAdmin → 🔑 APIs & Keys → Configura keys
         ↓
localStorage('veridia_api_config') = {gemini_key: "...", usda_key: "...", ...}
         ↓
ERP carga → VERIDIA_CONFIG.get('gemini_key') → usa la key
         ↓
Si hay backend activo → /api/proxy/gemini (key NUNCA llega al browser)
```

### 6.2 APIs gestionables

| API | Key requerida | Toggle | Test en vivo | Proxy backend |
|-----|--------------|--------|-------------|---------------|
| 🤖 Google Gemini AI | Sí (aistudio.google.com) | ✅ | ✅ | `POST /api/proxy/gemini` |
| 🔥 Firebase | Sí (pública por diseño) | — | Auto | — |
| 🇺🇸 USDA FDC | Opcional (DEMO_KEY funciona) | ✅ | ✅ | `GET /api/proxy/usda/search` |
| 🌍 OpenFoodFacts | No (gratuita) | ✅ | — | — |
| 👨‍🍳 TheMealDB | No (gratuita) | ✅ | — | — |

### 6.3 API de VERIDIA_CONFIG

```javascript
VERIDIA_CONFIG.get('gemini_key');         // Obtener valor
VERIDIA_CONFIG.set('gemini_key', 'AQ..'); // Establecer valor
VERIDIA_CONFIG.getAll();                  // Obtener toda la config
VERIDIA_CONFIG.isConfigured('gemini_key');// true si no está vacío
VERIDIA_CONFIG.reset();                  // Restaurar defaults
```

---

## 7. Seguridad

### 7.1 Medidas implementadas

| Capa | Medida | Estado |
|------|--------|--------|
| **XSS** | `sanitize()` (127 calls) + CSP meta tag | ✅ Activo |
| **CSP** | Content-Security-Policy en 3 HTML + Helmet backend | ✅ Activo |
| **CORS** | Restringido a `veridia.tech` + localhost | ✅ Activo |
| **Rate Limiting** | 100 req/15min general, 20 req/15min auth | ✅ Activo |
| **HTTPS** | Redirect 301 HTTP→HTTPS (producción) | ✅ Activo |
| **JWT** | 128-char random secrets (crypto.randomBytes) | ✅ Activo |
| **Helmet** | Headers de seguridad + CSP con whitelist | ✅ Activo |
| **Firestore Rules** | Default DENY, append-only audit | ✅ Listo para deploy |
| **Anonimización IA** | `anonymizeForAI()` redacta PII antes de Gemini | ✅ Activo |
| **Session Lock** | Timeout configurable + lock screen por inactividad | ✅ Activo |
| **Memory Limits** | `trimDBArrays()` con límites por array | ✅ Activo |

### 7.2 Datos sensibles (PII)

> ⚠️ **RGPD Art. 9 — Datos de categoría especial (salud)**
>
> Esta aplicación procesa datos clínicos de pacientes: nombre, DNI, email, teléfono, dirección, patologías, analíticas, antropometría, medicación. Estos datos están protegidos por el Reglamento General de Protección de Datos (UE 2016/679) y la Ley Orgánica 3/2018 (LOPD-GDD).
>
> Medidas obligatorias antes de producción con pacientes reales:
> - [ ] DPIA (Data Protection Impact Assessment) completada
> - [ ] Registro de actividades de tratamiento
> - [ ] Política de privacidad visible al paciente
> - [ ] Cifrado de localStorage con AES-256-GCM
> - [ ] Consentimiento explícito del paciente para uso de IA
> - [ ] DPO (Data Protection Officer) designado

---

## 8. Tests

### 8.1 Suite de tests

| Suite | Archivo | Tests | Cobertura |
|-------|---------|-------|-----------|
| **Unitarios** | `tests/test-veridia.js` | 281 | Estructura, renders, CRUD, fórmulas, ESPEN, RBAC, i18n, CSS, RC |
| **E2E** | `tests/test-e2e.js` | 62 | 10 flujos completos de usuario real |
| **Total** | — | **343** | — |

### 8.2 Flujos E2E cubiertos

| Flujo | Tests | Descripción |
|-------|-------|-------------|
| Paciente completo | 11 | Crear → medir → analizar → planificar → facturar |
| Consulta clínica | 6 | Agendar → realizar → acta → facturar → cobrar |
| Fórmula desarrollada | 5 | GEB → GET → macros → calorimetría → comparación |
| Restauración colectiva | 9 | Centro → menú → derivaciones → escalar → APPCC → merma |
| Soporte nutricional | 8 | NRS-2002 → NUTRIC → Child-Pugh → Penn State → realimentación |
| Facturación | 3 | Multilínea → vencer → caja |
| Mensajería | 4 | Chat → buscar → render |
| Backup/Restore | 2 | Serialización + integridad |
| Multi-idioma/moneda | 6 | ES↔EN↔PT + EUR↔USD↔ARS |
| RBAC | 5 | Admin vs Nutri vs Secre + hashes |

### 8.3 Ejecución

```bash
npm test                 # 281 unit tests (~3s)
npm run test:e2e         # 62 E2E tests (~3s)
npm run test:all         # 343 tests combinados (~6s)
npm run qa               # Syntax check + unit tests
npm run stats            # Líneas, funciones, archivos
```

---

## 9. Deploy

### 9.1 Vercel (recomendado para frontend)

```bash
npm run build
# Subir los siguientes archivos a Vercel:
#   veridia-deploy.html → renombrar a index.html
#   index.html (landing) → renombrar a landing.html o usar rewrite
#   portal-paciente.html
#   superadmin.html
#   logo-icon.png, logo-full.png, icon-192.png, icon-512.png
#   manifest.json, sw.js
```

### 9.2 Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Public directory: .
# Single-page app: No
firebase deploy
```

### 9.3 Backend (Docker)

```bash
docker compose up -d

# Verificar:
curl http://localhost:3456/api/health
# {"ok":true,"service":"Veridia HealthTech API","version":"5.2.0"}
```

---

## 10. Planes SaaS

| Plan | Precio | Usuarios | Pacientes | Módulos | RC |
|------|--------|----------|-----------|---------|-----|
| **Starter** | 0 €/mes | 1 | 20 | 5 | ❌ |
| **Professional** | 49 €/mes | 3 | 500 | 18 | ❌ |
| **Enterprise** | 149 €/mes | 10 | ∞ | 22 | ✅ |

---

## 11. Mantenimiento y Monitoreo

### 11.1 Comandos de mantenimiento

```bash
npm run check            # Verificar sintaxis 31 archivos
npm run lint             # Solo verificación (sin tests)
npm run stats            # Métricas del código
npm run build            # Regenerar build de producción
```

### 11.2 Monitoreo de localStorage

La función `getStorageUsage()` reporta el uso de localStorage:
- ⚠️ Warning al 80% (4MB/5MB)
- 🔴 Critical al 90% (4.5MB/5MB) con toast visible al usuario

`trimDBArrays()` se ejecuta automáticamente en cada `saveData()` con los siguientes límites:

| Array | Límite máximo |
|-------|--------------|
| `auditLog` | 500 registros |
| `alerts` | 200 registros |
| `feedback` | 100 registros |
| `rcAppcc` | 500 registros |
| `rcMermas` | 300 registros |
| `rcLotes` | 200 registros |
| `chatDB` (por paciente) | 200 mensajes |

### 11.3 Logs del backend

```bash
# Verificar health
curl http://localhost:3456/api/health

# Logs en tiempo real (Docker)
docker compose logs -f api

# Verificar DB
docker compose exec db psql -U nutrisuite -d nutrisuite_db -c "SELECT count(*) FROM patients;"
```

---

## 12. Documentación Complementaria

| Documento | Ubicación | Contenido |
|-----------|-----------|-----------|
| Historial de cambios | `docs/CHANGELOG.md` | v5.0.0 → v5.2.0 con 84 mejoras detalladas |
| Auditoría de arquitectura | `docs/ARCHITECTURE-AUDIT.md` | 27 recomendaciones (Frontend + Backend) |
| Auditoría de seguridad | `docs/SECURITY-AUDIT.md` | 22 vulnerabilidades con remediación |
| Plan de migración Flutter | `docs/FLUTTER-MIGRATION-PLAN.md` | 12 fases, ~32-44 días estimados |
| Plan de mejoras | `docs/MEJORAS-PLAN.md` | 84 mejoras completadas (4 sprints) |
| Firestore Security Rules | `firestore.rules` | Default DENY, reglas por colección |

---

## 13. Equipo

| Nombre | Rol | Contacto |
|--------|-----|----------|
| **Eduardo Andres Galeano Aido** | Director de Arquitectura, CTO, Desarrollador Principal | `admin@veridia.tech` |
| **Lic. Antonella Caverzan** | Directora Clínica, Nutricionista | `antonella@veridia.tech` |

---

## 14. Licencia

Copyright © 2026 GalcoCapital LLC. Todos los derechos reservados.

Este software y su código fuente son propiedad exclusiva de GalcoCapital LLC. Queda prohibida su reproducción, distribución o transmisión sin autorización expresa del propietario.

Para consultas de licenciamiento: `admin@veridia.tech`

---

*Documento generado el 25 de junio de 2026. Versión 1.0.0.*
*Clasificación: CONFIDENCIAL — Uso Interno — GalcoCapital LLC.*
