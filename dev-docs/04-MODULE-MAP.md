# Module Map — All 38 JS Files

## Architecture: SPA with client-side routing

```
portal-profesional.html
  ↓ loads
  js/icons.js          → VI object (89 SVG icons, infrastructure ready)
  js/firebase.js       → Firebase init + VERIDIA_CONFIG + Gemini proxy
  js/i18n.js           → t() function, 3 languages (es/en/pt)
  js/charts.js         → svgBarChart, svgLineChart, svgDonutChart
  js/core.js           → DB, Router, NAV, helpers, onboarding, notifications
  js/auth.js           → RBAC, login, registration, session, password
  [then all feature modules via defer]
```

## Reorganized Modular Architecture (v-*.js)
Since v5.2, core functionality is grouped into logical modules:
| File | Lines | Purpose | Key Exports |
|---|---|---|---|
| `v-security.js` | 77 | Auth, RBAC, session, encryption helpers | `checkAccess()`, `syncHash()`, `startSessionTimer()` |
| `v-clinical.js` | 103 | Clinical indices, alerts, formulas | `calcClinicalIndices()`, `generateLifecycleAlerts()` |
| `v-pathology.js` | 117 | Pathology DB, ESPEN, anamnesis systems | `PATHOLOGY_DB`, `ANAM_SYSTEMS`, `DEV_PATOLOGIAS` |
| `v-platform.js` | 79 | Firebase, sync, config, i18n | `VERIDIA_CONFIG`, `fbSyncDB()`, `t()` |
| `v-memory.js` | 404 | DB management, storage, cleanup | `DB`, `trimDBArrays()`, `getStorageUsage()` |
| `v-ux.js` | 78 | UI helpers, toast, modals, charts | `toast()`, `openModal()`, `svgBarChart()` |

## Module Details

### CORE (loaded first, no defer)
| File | Lines | Purpose | Key Functions |
|---|---|---|---|
| `firebase.js` | 281 | Firebase + API config + Gemini AI proxy | `geminiAsk()`, `fbSyncDB()`, `buildPatientContext()`, `anonymizeForAI()` |
| `i18n.js` | 317 | Internationalization | `t(key)`, `setLang()`, `CURRENCIES{}` |
| `charts.js` | 105 | SVG chart generators | `svgBarChart()`, `svgLineChart()`, `svgDonutChart()` |
| `core.js` | 602 | App backbone | `navigate()`, `renderNav()`, `toast()`, `openModal()`, `loadDemoData()`, `patSel()` |
| `auth.js` | 665 | Authentication | `handleLogin()`, `handleRegister()`, `checkAccess()`, `startSessionTimer()` |

### CLINICAL MODULES
| File | Lines | Purpose | Key Functions |
|---|---|---|---|
| `dashboard.js` | 312 | Main dashboard | `rDash()` |
| `agenda.js` | 548 | Appointments | `rAgenda()`, `renderWeekView()`, `renderMonthView()`, drag&drop |
| `pacientes.js` | 198 | Patient management | `rPat()`, `openNewPat()`, `savePat()` |
| `historia.js` | 651 | Clinical history (10 tabs) | `rHist()`, `hTab()`, tabs: anamnesis/consultas/mediciones/analíticas/plan/citas/notas/diario/documentos/farma/evolución |
| `anamnesis.js` | 370 | Anamnesis v3 | `ANAM_SYSTEMS[14]`, `ANAM_PATHOLOGY_QUESTIONS[13]`, `ANAM_ESPEN_RECS[9]`, `toggleAnamPathology()` |
| `antropometria.js` | 278 | Anthropometry | `rAntro()`, `antroModalHTML()`, ICT, 4 pliegues, dinamometría |
| `analiticas.js` | 162 | Lab analytics + Alerts | `rAnal()`, `rAlerts()`, `revAlert()` |
| `formula.js` | 254 | Clinical formula | `rFormula()`, `calcFormula()`, 5 formulas, deficit caloric |
| `espen.js` | 487 | ESPEN guidelines | 23 disease×micronutrient profiles, 6 flowcharts |
| `pathology-db.js` | 4 | 438 ICD-10 conditions | `PATHOLOGY_DB{}` (loaded from external, 15 categories) |
| `lifecycle-alerts.js` | 531 | Clinical alerts engine | `generateLifecycleAlerts()`, pediatric/adult/geriatric |
| `clinical-tools.js` | 572 | Clinical utilities | `calcClinicalIndices()`, HOMA-IR, FLI, FIB-4, `autoAlertOutOfRange()` |

### NUTRITION MODULES
| File | Lines | Purpose | Key Functions |
|---|---|---|---|
| `desarrollada.js` | 755 | 5-step clinical copilot | `devInit()`, `devRenderStep1-5()`, `DEV_PATOLOGIAS[13]`, equivalencias, drag&drop |
| `alimentos.js` | 897 | Food database (BEDCA+OFF+USDA) | `rBEDCA()`, `bedcaShowDetail()`, `filterByNutrient()`, `renderSuplementos()`, 969 BEDCA + custom |
| `recetas.js` | 481 | Recipes | `rRecetas()`, TheMealDB integration, EN→ES translation |
| `planes.js` | 630 | Meal plans | `rPlanes()`, wizard, templates, adherencia, `renderPlanESPENRecs()` |
| `favoritos.js` | 142 | Favorites + shopping list | `toggleFavFood()`, `generateShoppingList()`, compound dishes |
| `soporte-nutricional.js` | 1600 | ICU nutrition support | `rSoporteNutricional()`, 4 tabs, NUTRIC, Child-Pugh, SOFA, NE/NP, 5 pathology guides |
| `restauracion.js` | 2098 | Institutional nutrition | 9 tabs, 74 fns, APPCC, IDDSI, trazabilidad, escalado, mermas |

### MANAGEMENT MODULES
| File | Lines | Purpose | Key Functions |
|---|---|---|---|
| `facturacion.js` | 333 | Invoicing + cash | `rFact()`, `rCaja()`, 11 services catalog, auto-expiry |
| `contabilidad.js` | 230 | Accounting | `rContabilidad()`, expenses, products, inventory, P&L |
| `mensajeria.js` | 225 | Bidirectional chat | `rMensajes()`, `openChat()`, templates, auto-reminders |
| `ia-copilot.js` | 134 | AI assistant | `rIA()`, `sendIA()`, RGPD consent, context prompts |
| `settings.js` | 175 | System settings | `rSettings()`, language, currency, theme, profile |
| `utilities.js` | 209 | Backup + export | `backupData()`, `restoreData()`, `universalPDF()`, CSV exports |
| `feedback.js` | 409 | Feedback + guided tour | `openFeedback()`, `startDemoGuiado()`, 10-step tour with spotlight |

### DATA/REFERENCE
| File | Lines | Purpose |
|---|---|---|
| `icons.js` | 117 | 89 SVG icons (Lucide-style). Infrastructure ready, not actively used. |
