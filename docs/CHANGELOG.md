# 📋 Changelog — Veridia HealthTech

Todas las modificaciones relevantes del proyecto se documentan aquí.

---

## [5.2.0] — 2026-06-25

### 🏛️ Módulo Nuevo: Restauración Colectiva
- 9 tabs: Resumen, Centros, Menús, Escalado, Costeo, Auditoría, APPCC, Trazabilidad, Mermas
- 14 alérgenos UE (Reglamento 1169/2011)
- IDDSI Framework completo (niveles 0-7 con pruebas de validación)
- 40+ factores de corrección por merma
- Derivaciones automáticas por tipo de institución
- Score de carga de trabajo (umbral 12 pts/turno)
- Recall de alimentos con informe de exposición
- Algoritmo predictivo de mermas (>25% en 3 ciclos)
- Costeo dinámico con precios por plato
- Ciclo de menú rotación 2-8 semanas

### 🎨 Landing Page Rediseñada
- Sección dedicada a Restauración Colectiva
- 6 sectores target: Hospital, Geriátrico, Colegio, Universidad, Empresa, Privado
- Precios actualizados: Starter 0€, Professional 49€, Enterprise 149€
- BETA v5.1 badge floating

### 🔑 SuperAdmin
- Creación de usuario/contraseña de test al crear cliente
- Hash automático (syncHash compatible con ERP)
- Modal de credenciales copiables
- Precios de planes actualizados

### 🌿 Onboarding Rediseñado
- 3 pasos: Bienvenida → Configuración → Tour guiado
- Mensaje de agradecimiento y visión del equipo
- 10 módulos explicados con click directo
- Tip de Ctrl+K

### 🐛 Bugs Corregidos
- toast('...','ok') → 'success' (17 instancias sin estilo CSS)
- .btn-warning y .btn-success CSS faltantes
- Antropometría: 6 campos .value sin null guard
- Contabilidad: eliminar gasto sin confirmación
- 10 keys i18n faltantes para Restauración Colectiva (ES/EN/PT)
- Navigate title faltante para restauracion
- Guard datos no guardados (beforeunload + navigate)
- Conflicto de horarios en agenda

### ⚡ 84 Mejoras Implementadas (Sprint 1-4)

#### Sprint 1 — Quick Wins (14)
- G1: Botones Cancel unificados
- G7: Breadcrumb paciente en header
- D1: Widget RC en dashboard
- D3: Banner alertas urgentes
- A1: Hora fin de cita visible
- A2: Detección conflicto horarios
- P2/P3: Click-to-call/mail
- F1: Recálculo live fórmula
- F3: Gráfico comparativo fórmulas
- IA1/IA2: Spinner + auto-scroll

#### Sprint 2 — Core UX (11)
- H1: Tendencia peso (regresión lineal)
- H2: Timeline consultas
- PL1: Wizard progress bar
- FA1: Búsqueda por nro factura
- FA3: Totales acumulados facturación
- M3: Búsqueda en chats
- S1: Preview color tema live
- A3: Colores cita CSS
- P4: Columna última cita
- RC2: Warning factor corrección faltante

#### Sprint 3 — Features Avanzados (13)
- G6: Guard datos no guardados
- G10: Centro de notificaciones (🔔)
- D2: Timeline últimas acciones
- A7: WhatsApp reminder deep link
- H4: Tab Documentos (📎)
- H7: Objetivo de peso con progreso
- AN1: Donut composición corporal
- AL1: Tendencia biomarcador
- SN1: Print prescripción NE/NP
- DE1: Guardar desarrollada como plantilla
- RE1: Foto de receta
- RC4: Ciclo menú rotación

#### Sprint 4 — Por Módulo (46)
- G8: Skeleton loading CSS
- G9: Panel atajos teclado (?)
- G11: Banner offline
- G12: Transición módulos
- G13: Selector items/página
- G14: universalPDF()
- D4: Ingresos mensuales chart
- D6: Pacientes sin cita
- A4: Timeline vertical hoy
- A5: Filtro profesional
- A6: Export iCal
- P1: Foto paciente
- H5: Tab Farmacología (💊)
- H6: Resumen clínico PDF
- F2: Historial fórmulas inline
- PL3: Adherencia chart
- RC1: BEDCA en ficha técnica
- RC3: Foto evidencia APPCC
- RC5: Email a proveedor
- RC7: Ranking platos
- RC8: Comparar menús
- IA3: Prompts contextuales
- M1: Notificación visual
- M2: Typing indicator
- S2: Export/import config
- AN2: Percentiles OMS
- AN3: Comparador mediciones
- AL2: Import CSV analíticas
- AL3: Auto-alert fuera de rango
- SN2: Chart progresión UCI
- DE2: Preview minuta
- DE3: Sustitución inteligente
- RE2: Tiempo preparación
- CO2: Comparativa mensual
- CO3: Alerta stock bajo

### 🔌 31 Funciones Conectadas a UI
- Todas las funciones previamente huérfanas ahora tienen botón/trigger real

### 🧹 Workspace Profesional
- Estructura de carpetas: docs/, assets/, scripts/
- .editorconfig
- LICENSE
- CHANGELOG.md
- package.json v5.2.0 con metadata completa
- .gitignore actualizado

---

## [5.0.0] — 2026-06-24

### Arquitectura
- Modularización completa: 424KB monolito → 29 archivos JS
- 248 tests automatizados
- PWA (manifest + service worker)
- Build system (npm test/build/check)

### Módulos Core
- Dashboard con KPIs y period selector
- Agenda con vista día/semana/mes + drag & drop
- Pacientes con tags, paginación, audit
- Historia Clínica con 9 tabs
- Antropometría con DW 4-pliegues
- Analíticas con tendencias y rangos
- Fórmula Clínica (5 fórmulas)
- ESPEN Guidelines Engine (23 disease × micronutrient matrix)
- Soporte Nutricional UCI (4 tabs, 64 funciones)
- Desarrollada (5 pasos)
- BEDCA 969 alimentos
- Recetas + TheMealDB
- Planes alimentarios
- Facturación multilínea
- Contabilidad + inventario
- Mensajería bidireccional
- IA Copilot (Gemini)
- Portal del paciente

### Infraestructura
- Firebase sync (Firestore)
- 3 idiomas (ES/EN/PT)
- 9 monedas
- RBAC (3 roles)
- SuperAdmin portal
