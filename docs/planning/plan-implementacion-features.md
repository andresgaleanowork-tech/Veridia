# Plan de Implementación — Features Faltantes Veridia

> **Objetivo:** Implementar las 126 features faltantes identificadas en el análisis de competencia, en 4 fases de 3-6 meses cada una.
> **Arquitectura:** Backend Express + PostgreSQL + frontend React + servicios externos (IA, pagos, telehealth).
> **Tech Stack:** Node.js, Express, PostgreSQL, React 18, TypeScript, Vite, Tailwind v4, shadcn/ui, Gemini AI, Stripe, Twilio, Zoom SDK.
> **Spec:** docs/planning/features-faltantes-competencia.md

## Restricciones globales
- Mantener compatibilidad con código existente
- Seguir patrones del proyecto (servicios modulares, repositorios, validación express-validator)
- No romper tests existentes
- Cada feature debe tener tests unitarios + integración
- Migraciones de DB versionadas

---

## FASE 1 (Meses 0-3): Foundation + Paciente Engagement

Objetivo: Cerrar brechas críticas de competitividad (portal paciente, documentación IA, meal planning automático).

### F1.1: AI Scribe Lite
**Archivos:**
- Crear: backend/src/services/ai-scribe.service.js
- Crear: backend/src/routes/ai-scribe.js
- Crear: veridia-app/src/features/clinical/AIScribePage.tsx
- Modificar: backend/src/index.js (rutas)
- Modificar: veridia-app/src/App.tsx (ruta)

**Tareas:**
1. Backend: servicio que recibe audio (base64 o multipart), usa Gemini/Whisper para transcribir, genera SOAP summary
2. API POST /api/ai-scribe/transcribe (auth required)
3. Frontend: página con grabadora de audio, preview de transcripción, editor de nota generada
4. Almacenar nota en clinical_history del paciente
5. Tests: unitarios del servicio, integración del endpoint

**Criterios de aceptación:**
- Audio de 10min → nota SOAP en <30s
- Nota guardada en historia clínica del paciente
- Usuario puede editar antes de guardar

### F1.2: Meal Plan Generator
**Archivos:**
- Crear: backend/src/services/meal-generator.service.js
- Crear: backend/src/routes/meal-generator.js
- Modificar: veridia-app/src/features/nutrition/MealPlansPage.tsx (agregar botón "Generar")
- Modificar: backend/src/config/db.js (tabla meal_plan_templates si no existe)

**Tareas:**
1. Motor de generación: objetivos (calorías, macros, alérgenos) → plan semanal
2. Usar base de datos foods existente + reglas de sustitución
3. API POST /api/meal-plans/generate
4. Frontend: formulario de objetivos + preview del plan generado
5. Tests: generación respeta restricciones, alérgenos, calorías objetivo

**Criterios de aceptación:**
- Genera plan de 7 días en <2s
- Respeta alérgenos y preferencias dietéticas
- Total de macros ≈ objetivo ±10%

### F1.3: Patient Portal (MVP)
**Archivos:**
- Crear: backend/src/routes/patient-portal.js
- Crear: backend/src/middleware/patient-auth.js (JWT separado para pacientes)
- Crear: veridia-app/src/features/portal/PatientPortal.tsx
- Crear: veridia-app/src/features/portal/PatientLogin.tsx
- Modificar: backend/src/index.js (rutas)
- Modificar: veridia-app/src/App.tsx (ruta /portal)

**Tareas:**
1. Auth separado para pacientes (tabla patients + password hash)
2. Rutas: /portal/login, /portal/plans, /portal/journal, /portal/messages
3. Portal muestra: planes asignados, mensajes con profesional, formulario de journaling básico
4. Tests: auth paciente, acceso a datos propios únicamente

**Criterios de aceptación:**
- Paciente puede loguearse con email + password
- Ve solo sus propios datos (RLS)
- Puede ver planes y enviar mensajes

### F1.4: Food Journaling (Paciente)
**Archivos:**
- Crear: backend/src/routes/patient-journal.js
- Crear: backend/src/services/journal.service.js
- Crear: veridia-app/src/features/portal/JournalPage.tsx
- Modificar: backend/src/config/db.js (tabla patient_journals)

**Tareas:**
1. Tabla patient_journals (paciente_id, fecha, comidas, síntomas, ejercicio, foto_url)
2. API CRUD para journaling
3. Frontend: formulario diario con selección de alimentos, síntomas, ejercicio
4. Tests: CRUD journaling, validación de campos

**Criterios de aceptación:**
- Paciente registra comidas del día
- Adjunta notas de síntomas y ejercicio
- Historial por fecha

### F1.5: Workflow Automations (MVP)
**Archivos:**
- Crear: backend/src/services/automation.service.js
- Crear: backend/src/routes/automations.js
- Crear: veridia-app/src/features/settings/AutomationsPage.tsx
- Modificar: backend/src/config/db.js (tabla automations)

**Tareas:**
1. Tabla automations (trigger, conditions, actions, active)
2. Triggers: appointment_created, payment_received, form_submitted
3. Acciones: send_email, send_sms, create_task, update_patient_status
4. UI: lista de automatizaciones, crear/editar/activar
5. Tests: triggers se ejecutan, condiciones se evalúan

**Criterios de aceptación:**
- Al crear turno → enviar email/SMS automático
- Al recibir pago → actualizar estado paciente
- Admin puede crear automatizaciones custom

---

## FASE 2 (Meses 3-6): Practice Management

Objetivo: Cerrar brechas de agenda, pagos, telehealth y reporting.

### F2.1: Agenda Multi-Provider
**Archivos:**
- Crear: backend/src/services/calendar.service.js
- Crear: backend/src/routes/calendar.js
- Modificar: veridia-app/src/features/business/AppointmentsPage.tsx
- Modificar: backend/src/config/db.js (tabla providers, calendar_sync)

**Tareas:**
1. Tabla providers (user_id, nombre, especialidad, color_calendar)
2. Sincronización Google Calendar / Outlook / iCal (CalDAV)
3. Vista agenda: múltiples proveedores, color-coded, filtros
4. Recordatorios automáticos email/SMS (Twilio)
5. Tests: creación turnos multi-provider, sincronización calendario

### F2.2: Telehealth nativo
**Archivos:**
- Crear: backend/src/services/telehealth.service.js
- Crear: backend/src/routes/telehealth.js
- Crear: veridia-app/src/features/clinical/TelehealthPage.tsx
- Modificar: backend/src/index.js

**Tareas:**
1. Integración Zoom SDK / WebRTC propio
2. Generar sala de video por turno
3. Frontend: embed de video + chat durante sesión
4. Tests: creación sala, acceso seguro

### F2.3: Procesamiento pagos + billing recurrente
**Archivos:**
- Crear: backend/src/services/stripe.service.js
- Crear: backend/src/routes/payments.js
- Modificar: veridia-app/src/features/business/InvoicesPage.tsx
- Modificar: backend/src/config/db.js (tabla subscriptions, payment_methods)

**Tareas:**
1. Integración Stripe (checkout, webhooks, subscriptions)
2. Planes de pago: one-time, recurring (semanal/mensual/anual)
3. Frontend: formulario de pago, historial transacciones
4. Tests: webhooks Stripe, creación suscripciones

### F2.4: Insurance Verification + Claims
**Archivos:**
- Crear: backend/src/services/insurance.service.js
- Crear: backend/src/routes/insurance.js
- Modificar: backend/src/config/db.js (tabla insurance_claims, eligibility_checks)

**Tareas:**
1. Integración Stedi API (270/271 elegibilidad, 837P claims)
2. UI: verificación elegibilidad, envío claims, tracking estado
3. Generación CMS-1500 PDF
4. Tests: mock Stedi responses, flujo completo claim

### F2.5: Advanced Reporting + Practice KPIs
**Archivos:**
- Crear: backend/src/services/reporting.service.js
- Crear: backend/src/routes/reports.js
- Crear: veridia-app/src/features/analytics/ReportsPage.tsx

**Tareas:**
1. Dashboards: revenue, appointments, patient trends, conversion rates
2. Exportación PDF/CSV
3. Filtros por fecha, profesional, paciente
4. Tests: queries agregadas, generación reportes

### F2.6: Onboarding Paciente Digital
**Archivos:**
- Crear: backend/src/services/onboarding.service.js
- Crear: backend/src/routes/onboarding.js
- Crear: veridia-app/src/features/portal/OnboardingPage.tsx

**Tareas:**
1. Formularios de intake customizables (builder)
2. Waivers + consentimientos digitales
3. Flujo paso a paso para nuevos pacientes
4. Tests: submission forms, storage de consentimientos

---

## FASE 3 (Meses 6-12): Integraciones + Platform

Objetivo: Escalar a plataforma con API, integraciones, multi-tenant, mobile.

### F3.1: API Abierta + Webhooks
**Archivos:**
- Crear: backend/src/routes/api-v1.js
- Crear: backend/src/services/webhook.service.js
- Crear: docs/api/openapi.yaml

**Tareas:**
1. REST API versionada (/api/v1/patients, /api/v1/appointments, etc.)
2. API keys por usuario/app
3. Webhooks para eventos clave
4. Documentación OpenAPI
5. Tests: autenticación API, rate limiting

### F3.2: Integraciones externas (core)
**Archivos:**
- Crear: backend/src/integrations/google-calendar.js
- Crear: backend/src/integrations/stripe.js
- Crear: backend/src/integrations/twilio.js
- Crear: backend/src/integrations/zoom.js

**Tareas:**
1. Google Calendar sync (bidireccional)
2. Stripe (pagos + webhooks)
3. Twilio (SMS + email)
4. Zoom (telehealth)
5. Tests: mock external APIs, error handling

### F3.3: Multi-tenant + RBAC avanzado
**Archivos:**
- Modificar: backend/src/middleware/auth.js
- Crear: backend/src/services/tenant.service.js
- Modificar: backend/src/config/db.js (tabla tenants, roles, permissions)

**Tareas:**
1. Tabla tenants (clínicas/empresas)
2. RLS en PostgreSQL por tenant_id
3. Roles custom: admin, profesional, asistente, paciente, facturación
4. Tests: aislamiento datos por tenant, permisos

### F3.4: App móvil (PWA)
**Archivos:**
- Crear: veridia-app/public/manifest.json
- Modificar: veridia-app/src/index.css (PWA styles)
- Modificar: veridia-app/src/App.tsx (service worker registration)
- Crear: veridia-app/src/hooks/usePWA.ts

**Tareas:**
1. PWA manifest + service worker
2. Offline-first para journaling y mensajes
3. Push notifications (web push)
4. Install prompt
5. Tests: offline functionality, sync al reconectar

### F3.5: Base de datos alimentos extendida
**Archivos:**
- Crear: backend/src/services/food-data.service.js
- Modificar: backend/src/routes/foods.js
- Modificar: backend/src/config/db.js (tabla foods_local, food_imports)

**Tareas:**
1. Importación USDA + OpenFoodFacts + alimentos LATAM custom
2. Barcode scanning (API o local lookup)
3. UI: búsqueda avanzada, filtros por región
4. Tests: importación masiva, búsquedas

---

## FASE 4 (Meses 12-18): Compliance + Scale

Objetivo: Certificaciones, enterprise features, advanced clinical.

### F4.1: Certificaciones y compliance
**Tareas:**
1. HIPAA BAA (documentos legales, procesos)
2. SOC 2 Type 2 (auditoría, controles)
3. GDPR + PIPEDA (DPA, data residency)
4. Audit trails + access logs completos
5. Penetration testing + DR testing

### F4.2: Integraciones avanzadas
**Archivos:**
- Crear: backend/src/integrations/labs.js (LabCorp, Quest)
- Crear: backend/src/integrations/wearables.js (Apple Health, Fitbit)
- Crear: backend/src/integrations/fullscript.js

**Tareas:**
1. Labs: importación resultados, sincronización con historial
2. Wearables: sync de métricas (peso, actividad, sueño)
3. Fullscript: catálogo suplementos, prescripción
4. Tests: mock APIs, reconciliation de datos

### F4.3: Programas online + group sessions
**Archivos:**
- Crear: backend/src/services/programs.service.js
- Crear: backend/src/routes/programs.js
- Crear: veridia-app/src/features/clinical/ProgramsPage.tsx

**Tareas:**
1. CRUD programas (fixed-date, self-paced, evergreen)
2. Inscripción de pacientes, progreso, contenido
3. Group sessions (agenda grupal, Zoom embed)
4. Tests: enrollment, progress tracking

### F4.4: AI avanzado
**Archivos:**
- Crear: backend/src/services/ai-recipes.service.js
- Crear: backend/src/services/ai-insights.service.js

**Tareas:**
1. AI Recipe Generator (text → receta + imagen)
2. AI Insights: tendencias paciente, alertas predictivas
3. AI translations batch
4. Tests: calidad recetas, precisión insights

---

## Checklist de Verificación por Fase

### Fase 1
- [ ] AI Scribe genera notas clínicas
- [ ] Meal Plan Generator crea planes automáticos
- [ ] Portal paciente funcional (login, planes, journaling, mensajes)
- [ ] Workflow automations básicos funcionando

### Fase 2
- [ ] Agenda multi-provider con sync calendario
- [ ] Telehealth nativo operativo
- [ ] Stripe integrado (pagos + suscripciones)
- [ ] Insurance claims (Stedi) funcionando
- [ ] Reporting avanzado con KPIs
- [ ] Onboarding paciente digital completo

### Fase 3
- [ ] API v1 documentada y funcional
- [ ] Integraciones core (Google, Stripe, Twilio, Zoom)
- [ ] Multi-tenant con RLS
- [ ] PWA instalable con offline
- [ ] Base de datos alimentos extendida

### Fase 4
- [ ] Certificaciones iniciadas (BAA, SOC2)
- [ ] Integraciones avanzadas (labs, wearables)
- [ ] Programas online funcionando
- [ ] IA avanzada (recipes + insights)

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Complejidad IA Scribe supera estimación | Media | Alto | Empezar con MVP (transcripción only, sin resumen estructurado) |
| Integraciones externas (Stedi, Stripe) requieren aprobaciones | Media | Alto | Tener fallback manual (ingreso manual de claims) |
| Multi-tenant rompe código existente | Alta | Alto | Migración gradual, feature flags |
| Performance PWA offline | Media | Medio | Service worker simple primero, sync background después |
| Certificaciones toman más tiempo | Alta | Medio | Contratar consultor externo, no bloquear dev |

---

*Plan vivo — actualizar al final de cada fase*
