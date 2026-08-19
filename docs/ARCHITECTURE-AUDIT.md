# 🏗️ Auditoría de Arquitectura — Veridia HealthTech v5.2.0
## Análisis de Performance, Seguridad y Escalabilidad
### Fecha: 25/06/2026 · Auditor: Arquitecto de Software Senior

---

## 📊 Contexto Técnico

| Parámetro | Valor |
|-----------|-------|
| **Frontend** | Vanilla JS (zero frameworks), CSS custom properties, SVG inline charts |
| **Backend** | Express.js + PostgreSQL (Docker) — **INACTIVO** (todo client-side) |
| **Database primaria** | localStorage (offline-first) |
| **Database sync** | Firebase Firestore (cloud backup) |
| **APIs externas** | USDA FDC, OpenFoodFacts, Google Gemini 2.0, TheMealDB |
| **Build** | Single-file HTML (1,146 KB) con todo inlined |
| **PWA** | Service Worker + manifest.json |
| **JS total** | 992 KB / 13,326 líneas / 575 funciones / 31 módulos |
| **CSS** | 50 KB / 765 líneas |
| **Datos estáticos** | BEDCA 168 KB (969 alimentos) + pathology-db 60 KB (438 patologías) |
| **Tests** | 343 (281 unit + 62 E2E) |
| **Imágenes** | 4 PNGs = 245 KB total (sin comprimir) |

---

# 🎨 FRONTEND

## 🔴 PRIORIDAD 1º GRADO (Crítico)

### F1.1 — API Keys expuestas en código cliente
| | |
|---|---|
| **Problema** | Firebase apiKey, Gemini API key y USDA key están hardcodeadas en `js/firebase.js` y `js/alimentos.js`. Cualquier usuario puede verlas en DevTools. La Gemini key tiene prefijo `AQ.` que indica key con facturación. |
| **Acción** | 1) Mover llamadas a Gemini/USDA a un proxy backend (`/api/gemini`, `/api/usda`). 2) Firebase apiKey es public by design (protegida por Firestore Rules), pero documentarlo. 3) Rotar la Gemini key y usar el backend como proxy con rate limiting. |
| **Impacto** | 🔒 Seguridad crítica — previene abuso de API, costos inesperados en Gemini, y scraping de datos. |

### F1.2 — Autenticación 100% client-side (sin backend)
| | |
|---|---|
| **Problema** | AUTH_USERS con hashes están en `js/auth.js` visible en el cliente. El hash `syncHash()` es un algoritmo custom débil (DJB2+FNV1a), NO bcrypt/argon2. Un atacante puede: 1) Ver todos los emails, 2) Crackear los hashes por fuerza bruta en segundos, 3) Modificar RBAC en consola. |
| **Acción** | 1) **Corto plazo:** Firestore Security Rules para proteger datos en la nube. 2) **Medio plazo:** Activar el backend Express existente con JWT auth. 3) **Largo plazo:** Firebase Auth con email/password + custom claims para RBAC server-side. |
| **Impacto** | 🔒 Sin esto, cualquier usuario técnico tiene acceso admin a todos los datos. Bloqueante para clientes enterprise. |

### F1.3 — Build monolítico de 1.1MB bloquea el render
| | |
|---|---|
| **Problema** | Los 31 scripts + BEDCA (168KB) + CSS se cargan síncronamente ANTES del primer paint. En 3G lento = ~8-12 segundos de pantalla blanca. Los Core Web Vitals (LCP, FID) serán rojos. |
| **Acción** | 1) `defer` en scripts no críticos. 2) Mover BEDCA a un archivo separado cargado async después del login. 3) pathology-db.js (60KB) solo cuando se abre Desarrollada. 4) Code-split soporte-nutricional.js (113KB) y restauracion.js (110KB) — cargar bajo demanda. 5) Critical CSS inline (<15KB), resto async. |
| **Impacto** | ⚡ FCP de ~8s a ~2s. LCP de ~10s a ~3s. Score Lighthouse de ~40 a ~80+. |

### F1.4 — 187 innerHTML assignments = riesgo XSS
| | |
|---|---|
| **Problema** | Aunque existe `sanitize()`, hay 187 asignaciones de innerHTML. Muchas concatenan datos de DB que podrían contener HTML malicioso si un atacante modifica localStorage. |
| **Acción** | 1) Auditar los 187 innerHTML y verificar que TODOS los datos de usuario pasan por `sanitize()`. 2) Usar `textContent` donde no se necesita HTML. 3) Implementar Content Security Policy (CSP) headers cuando se active el backend. |
| **Impacto** | 🔒 Previene XSS persistente. Requisito para certificación en salud (datos de pacientes). |

### F1.5 — Imágenes sin optimizar (245 KB en PNGs)
| | |
|---|---|
| **Problema** | `logo-full.png` (108KB), `icon-512.png` (86KB) son PNGs sin compresión. No hay WebP fallback. No hay lazy loading de imágenes. |
| **Acción** | 1) Convertir a WebP (ahorro ~60-70%). 2) Añadir `loading="lazy"` en imágenes del landing. 3) Comprimir PNGs con pngquant. 4) Usar `<picture>` con fallback. |
| **Impacto** | ⚡ -150KB en primera carga. Mejor LCP en landing page. |

---

## 🟡 PRIORIDAD 2º GRADO (Necesario)

### F2.1 — 62 push() sin límite = memory leak potencial
| | |
|---|---|
| **Problema** | DB.auditLog, DB.alerts, DB.feedback, chatDB.messages crecen sin límite. Con uso prolongado, localStorage (5MB límite) se llena y la app crashea silenciosamente. |
| **Acción** | 1) Limitar auditLog a últimos 500 registros. 2) Rotar chatDB.messages (max 200/paciente). 3) Archivar datos antiguos (>6 meses) a Firebase y liberar localStorage. 4) Añadir monitor de uso de localStorage con warning al 80%. |
| **Impacto** | 🧠 Previene crashes por localStorage full. Mejora performance en sesiones largas. |

### F2.2 — 6 setInterval sin cleanup
| | |
|---|---|
| **Problema** | `setInterval` para auto-save (60s), integrity check (60s), appointment reminders, etc. — no se limpian al hacer logout o cambiar de módulo. Cada login acumula más intervals. |
| **Acción** | 1) Registrar todos los intervals en un array global. 2) clearAll en logout. 3) Usar `requestIdleCallback` para tareas no urgentes. |
| **Impacto** | 🧠 -30% CPU en background. Previene comportamiento errático tras múltiples login/logout. |

### F2.3 — 155 var globales contaminan el scope
| | |
|---|---|
| **Problema** | 155 `var` declarations a nivel global + 158 `window.` assignments. Alto riesgo de colisión de nombres. Cualquier script externo podría sobrescribir funciones críticas. |
| **Acción** | 1) Encapsular cada módulo en IIFE: `(function(){ ... })()`. 2) Exponer solo la API pública via `window.ModuleName = {...}`. 3) **Largo plazo:** migrar a ES Modules con import/export. |
| **Impacto** | 🏗️ Mantenibilidad. Previene bugs difíciles de diagnosticar por colisión de variables. |

### F2.4 — CSS: 23 inline styles repetidos
| | |
|---|---|
| **Problema** | `style="font-size:.72rem;color:var(--text3)"` aparece 23 veces. `style="display:flex;justify-content:space-between;align-items:center"` aparece 14 veces. Esto infla el HTML y dificulta responsive overrides. |
| **Acción** | 1) Reemplazar los top-10 inline styles más repetidos por utility classes (ya creadas: `.text-sm`, `.text-muted`, `.flex`, `.justify-between`). 2) Refactorizar gradualmente los 435 onclick handlers a usar clases CSS. |
| **Impacto** | ⚡ -10-15KB en build. Mejor mantenibilidad. Las media queries pueden overridear clases pero NO inline styles (excepto con !important). |

### F2.5 — Sin tree-shaking ni dead code elimination
| | |
|---|---|
| **Problema** | El build simplemente concatena todos los archivos. Funciones que nunca se llaman siguen en el bundle. pathology-db.js tiene 438 patologías pero el usuario promedio usa 5-10. |
| **Acción** | 1) Añadir paso de build que detecte funciones no invocadas. 2) Separar pathology-db en chunks por categoría (cargados on-demand). 3) **Largo plazo:** Rollup/Vite para tree-shaking real. |
| **Impacto** | ⚡ -50-80KB potencial. Carga inicial más rápida. |

### F2.6 — SVG charts regenerados en cada render
| | |
|---|---|
| **Problema** | `svgLineChart()`, `svgBarChart()`, `svgDonutChart()` se regeneran completamente cada vez que se navega a un módulo. Con muchos datos (>100 puntos), puede causar jank visible. |
| **Acción** | 1) Cache de SVG generados por hash de datos. 2) Solo regenerar si los datos cambiaron. 3) Limitar puntos de datos a últimos 50 para charts de evolución. |
| **Impacto** | ⚡ Navegación más fluida. -200ms en módulos con charts pesados. |

---

## 🟢 PRIORIDAD 3º GRADO (Deseable)

### F3.1 — Preconnect/prefetch para APIs externas
| | |
|---|---|
| **Problema** | Las APIs de USDA, OpenFoodFacts, Gemini no tienen preconnect. Cada primera request tiene overhead DNS+TLS (~300ms). |
| **Acción** | Añadir en `<head>`: `<link rel="preconnect" href="https://api.nal.usda.gov">`, idem para Gemini y OFF. |
| **Impacto** | ⚡ -300ms en primera búsqueda de alimentos. Zero effort. |

### F3.2 — Web Workers para cálculos pesados
| | |
|---|---|
| **Problema** | Cálculos como `generateLifecycleAlerts()`, `rcAuditMenu()`, `getESPENMicroProfile()` corren en main thread. Con muchos pacientes pueden bloquear UI ~100-300ms. |
| **Acción** | Mover cálculos pesados a Web Worker. El worker recibe datos, calcula, y envía resultado. |
| **Impacto** | ⚡ UI nunca se congela durante cálculos. Mejor FID. |

### F3.3 — Virtual scrolling para tablas largas
| | |
|---|---|
| **Problema** | La tabla BEDCA puede renderizar 969 filas. La tabla de pacientes puede crecer indefinidamente. Todo está en el DOM. |
| **Acción** | Implementar virtual scrolling: solo renderizar las filas visibles en viewport (~20-30). Reciclar DOM nodes al scrollear. |
| **Impacto** | ⚡ De 969 DOM nodes a ~25. Scroll a 60fps con cualquier cantidad de datos. |

### F3.4 — Service Worker con precache strategy
| | |
|---|---|
| **Problema** | El SW actual cachea todos los assets al instalar. Si hay update, el usuario tiene la versión vieja hasta que refresca 2 veces (SW lifecycle). |
| **Acción** | 1) Implementar `skipWaiting()` + `clients.claim()` para activar inmediatamente. 2) Mostrar banner "Nueva versión disponible — Actualizar". 3) Versionado de cache por hash de contenido. |
| **Impacto** | ⚡ Updates instantáneos. Mejor experiencia offline. |

### F3.5 — Internationalización incompleta
| | |
|---|---|
| **Problema** | 297 llamadas a `t()` pero miles de strings aún hardcodeados en español. Los módulos nuevos (RC, feedback, soporte) casi no usan `t()`. |
| **Acción** | 1) Auditoría de strings: extraer todos los textos visibles. 2) Crear keys para los top-200 más usados. 3) Usar herramienta de detección de strings no traducidos en CI. |
| **Impacto** | 🌐 Producto listo para mercado internacional (EN/PT). Diferenciador vs competencia local. |

---

# ⚙️ BACKEND

## 🔴 PRIORIDAD 1º GRADO (Crítico)

### B1.1 — Backend INACTIVO (toda la lógica en el cliente)
| | |
|---|---|
| **Problema** | El backend Express+PostgreSQL existe (16 archivos, JWT auth, DB schema completo) pero NO se usa. Toda la lógica de negocio, autenticación, y almacenamiento corre en el browser. Esto es un **anti-patrón crítico** para una aplicación de salud con datos de pacientes. |
| **Acción** | **Fase 1:** Activar el backend como API proxy para Gemini y USDA (proteger API keys). **Fase 2:** Migrar autenticación a JWT server-side. **Fase 3:** Migrar datos críticos (pacientes, analíticas) a PostgreSQL. **Fase 4:** Firestore solo como cache/sync, PostgreSQL como source of truth. |
| **Impacto** | 🔒🏗️ Requisito legal para datos clínicos en muchos países (HIPAA, GDPR, LGPD). Sin backend server-side, no es posible certificar la app para uso clínico real. |

### B1.2 — Sin rate limiting ni protección DDoS
| | |
|---|---|
| **Problema** | El backend tiene JWT auth pero sin rate limiting. Si se activa, cualquier cliente puede hacer requests ilimitados. El middleware `validate.js` existe pero es básico. |
| **Acción** | 1) `express-rate-limit` con 100 req/min por IP. 2) `helmet` para headers de seguridad. 3) CORS restrictivo (solo dominios de Veridia). 4) Request size limit (1MB). |
| **Impacto** | 🔒 Previene abuso. Requisito para producción. |

### B1.3 — Sin HTTPS enforcement
| | |
|---|---|
| **Problema** | El backend no fuerza HTTPS. Datos de pacientes podrían transmitirse en texto plano. |
| **Acción** | 1) Redirect HTTP→HTTPS en Express. 2) HSTS header. 3) Cookie `Secure` + `HttpOnly` flags. 4) Si deploy en Vercel/Railway, HTTPS viene incluido. |
| **Impacto** | 🔒 Datos clínicos encriptados en tránsito. Obligatorio por RGPD/HIPAA. |

---

## 🟡 PRIORIDAD 2º GRADO (Necesario)

### B2.1 — DB Schema sin índices optimizados
| | |
|---|---|
| **Problema** | Las tablas tienen PKs pero sin índices en columnas de búsqueda frecuente (patient_id en casi todas las tablas, fecha en appointments, estado en invoices). |
| **Acción** | `CREATE INDEX idx_antro_patient ON antropometrias(patient_id);` para cada FK. `CREATE INDEX idx_appt_fecha ON appointments(fecha);`. Índice compuesto en invoices(patient_id, estado). |
| **Impacto** | ⚡ Queries de 200ms → 5ms con 10K+ registros. Crítico para escalabilidad. |

### B2.2 — Sin migración de datos localStorage → PostgreSQL
| | |
|---|---|
| **Problema** | No hay pipeline para migrar datos existentes en localStorage/Firebase a PostgreSQL. Los clientes beta ya tienen datos que se perderían. |
| **Acción** | 1) Endpoint `/api/import` que reciba el JSON de backup y lo inserte en las tablas. 2) Script de migración idempotente (puede correr múltiples veces). 3) Validación de integridad post-migración. |
| **Impacto** | 🏗️ Sin esto, no se puede activar el backend sin perder datos de beta testers. |

### B2.3 — Sin logging estructurado
| | |
|---|---|
| **Problema** | El backend usa `console.log` / `console.error`. Sin correlación de requests, sin niveles, sin rotación de logs. |
| **Acción** | 1) Winston o Pino para logging estructurado (JSON). 2) Request ID en cada request. 3) Log levels (error, warn, info, debug). 4) Rotación diaria, max 30 días. |
| **Impacto** | 🏗️ Debugging en producción. Auditoría de acceso a datos clínicos. |

### B2.4 — Sin health checks ni monitoring
| | |
|---|---|
| **Problema** | `/api/health` existe pero no verifica estado de DB, Firebase, ni servicios externos. |
| **Acción** | 1) Health check completo: DB ping, Firebase ping, memory usage, uptime. 2) Endpoint `/api/metrics` para Prometheus/Grafana. 3) Alert si DB pool se satura (>80% connections). |
| **Impacto** | 🏗️ Detección proactiva de caídas. SLA monitoring para clientes enterprise. |

---

## 🟢 PRIORIDAD 3º GRADO (Deseable)

### B3.1 — GraphQL para queries flexibles
| | |
|---|---|
| **Problema** | REST requiere múltiples requests para cargar la historia clínica completa (paciente + antro + analíticas + citas + plan). |
| **Acción** | Añadir endpoint GraphQL que permita obtener toda la data del paciente en un solo request: `{ patient(id:1) { name, antropometrias { peso, fecha }, analiticas { marcadores { nombre, valor } } } }` |
| **Impacto** | ⚡ De 5 requests a 1. Ideal para mobile con latencia alta. |

### B3.2 — WebSocket para sincronización real-time
| | |
|---|---|
| **Problema** | La sincronización es pull-based (el cliente hace sync cada 60s). No hay push notifications cuando otro usuario modifica datos. |
| **Acción** | Socket.io o native WebSocket para push updates. Cuando un usuario modifica un paciente, todos los clientes conectados reciben el cambio. |
| **Impacto** | 🔄 Colaboración multi-usuario en tiempo real. Requisito para clínicas con >1 profesional. |

### B3.3 — Queue system para tareas pesadas
| | |
|---|---|
| **Problema** | Generación de PDFs, reports, y llamadas a Gemini bloquean el main thread del servidor. |
| **Acción** | Bull/BullMQ con Redis para queue de trabajos. PDFs se generan en background. El cliente recibe un job ID y polling hasta completar. |
| **Impacto** | ⚡ Server nunca se bloquea por tareas pesadas. Escalable a 1000+ usuarios concurrentes. |

### B3.4 — Multi-tenancy nativa
| | |
|---|---|
| **Problema** | El schema de DB no tiene `clinic_id` ni `tenant_id`. Si se comparte la misma DB entre clínicas, los datos se mezclarían. |
| **Acción** | 1) Añadir `clinic_id` a todas las tablas. 2) Row-level security en PostgreSQL. 3) Middleware que inyecta `clinic_id` en cada query basado en JWT. |
| **Impacto** | 🏗️ Requisito para modelo SaaS multi-cliente. Un solo deploy sirve a N clínicas. |

---

## 📊 RESUMEN EJECUTIVO

| Área | 1º Grado (Crítico) | 2º Grado (Necesario) | 3º Grado (Deseable) | Total |
|------|-------|-------|-------|-------|
| **Frontend** | 5 | 6 | 5 | **16** |
| **Backend** | 3 | 4 | 4 | **11** |
| **TOTAL** | **8** | **10** | **9** | **27** |

### Top 5 acciones con mayor ROI:

1. **F1.1 + B1.1** — Activar backend como proxy API → protege keys + habilita auth real
2. **F1.3** — Code splitting + defer → de 8s a 2s de carga
3. **F1.5** — WebP + compresión imágenes → -150KB gratis
4. **F2.1** — Límite en arrays globales → previene crash por localStorage full
5. **B2.1** — Índices en PostgreSQL → preparado para escalar

### Roadmap sugerido:

| Fase | Duración | Qué |
|------|----------|-----|
| **Sprint Security** | 1 semana | F1.1, F1.2, F1.4 (proxy API, Firestore rules, CSP) |
| **Sprint Performance** | 1 semana | F1.3, F1.5, F2.1, F2.6 (code split, WebP, memory limits) |
| **Sprint Backend Activation** | 2 semanas | B1.1, B1.2, B1.3, B2.1, B2.2 (activar API, JWT, DB) |
| **Sprint Polish** | 1 semana | F2.3, F2.4, F3.1, F3.4 (encapsular, CSS, preconnect, SW) |
