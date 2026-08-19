# Veridia HealthTech — Developer Documentation

## 📚 Documentation Index

| # | Document | Contents |
|---|---|---|
| **01** | [System Overview](01-SYSTEM-OVERVIEW.md) | Tech stack, metrics, file structure, identity |
| **02** | [Database Schema](02-DATABASE-SCHEMA.md) | All data structures, localStorage keys, Firestore, memory management |
| **03** | [Auth & RBAC](03-AUTH-RBAC.md) | Users, roles, permissions, session, registration, portal auth |
| **04** | [Module Map](04-MODULE-MAP.md) | All 38 JS modules (32 feature + 6 v-* core) with lines, functions, dependencies |
| **05** | [Design System](05-DESIGN-SYSTEM.md) | Colors, typography, components, responsive, patterns |
| **06** | [Clinical Data](06-CLINICAL-DATA.md) | Systems, pathologies, indices, ESPEN recs, supplements, equivalencies |
| **07** | [API Integrations](07-API-INTEGRATIONS.md) | Gemini, Firebase, USDA, OpenFoodFacts, TheMealDB, backend proxy |
| **08** | [Build & Deploy](08-BUILD-DEPLOY.md) | NPM scripts, build process, tests, Firebase hosting, Docker, PWA |
| **09** | [Known Issues & Future](09-KNOWN-ISSUES-FUTURE.md) | Limitations, SVG icons, architecture recs, security |
| **10** | [Quick Start](10-QUICK-START.md) | Setup, credentials, dev rules, adding modules |

## 📁 Source Code

The `source/` subfolder contains a **full copy** of the project source code, organized by area:

| Folder | Contents |
|---|---|
| `source/js/` | All 38 JavaScript modules (32 feature + 6 v-* core, ~15,630 lines) |
| `source/css/` | Design system stylesheet (837 lines) |
| `source/html/` | All 5 HTML pages + deploy build reference |
| `source/tests/` | Unit tests (281) + E2E tests (62) |
| `source/backend/` | Express.js + PostgreSQL backend (complete, ready to activate) |
| `source/scripts/` | Build scripts |
| `source/config/` | Firestore security rules |
| `source/data/` | BEDCA food database (969 foods) |
| `source/legal/` | GDPR/RGPD legal documents |
| `source/root/` | PWA manifest, service worker, firebase.json, package.json, etc. |

## 🎯 Purpose
This documentation + source code package is designed so that a **new development team** can:
1. Understand the complete system architecture
2. Reproduce the entire application from scratch
3. Identify all data structures and their relationships
4. Know all API integrations and their configurations
5. Follow the design system consistently
6. Run tests and deploy confidently
7. Have **all source code** available alongside documentation

## 📊 System at a Glance
- **15,630 lines** of JavaScript across **38 modules** (32 feature + 6 v-* core: v-security, v-clinical, v-pathology, v-platform, v-memory, v-ux)
- **343 automated tests** (281 unit + 62 E2E)
- **6 HTML pages** (5 app pages + 1 build output)
- **837 lines** CSS design system
- **969 BEDCA foods** + custom foods
- **438 ICD-10 pathologies**
- **14 anatomical systems** with 70+ pathologies
- **13 DEV_PATOLOGIAS** with ESPEN macro distribution
- **5 clinical indices** auto-calculated
- **12 supplements** with dosing
- **54 food equivalencies**
- **5 nutritional support pathology guides**
- **9 currencies** supported
- **3 languages** (es/en/pt)
- **4 RBAC roles** (trial/nutricionista/secretaria/admin)
- **~41,000 lines** total project code

## 👤 Owner
**GalcoCapital LLC** — Eduardo Andres Galeano Aido (NIE: Z0002918W)

Updated: 2026-08-05 | Version: 5.2.0 Beta
