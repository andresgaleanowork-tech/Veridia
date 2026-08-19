# 🚀 VERIDIA HEALTHTECH — Plan Maestro de Mejoras
## Análisis basado en escaneo real del código (2026-07-30)
## v5.2.0 Beta → Roadmap hacia v6.0 Producción

> **Datos duros del escaneo:**
> - 606 funciones globales, 16,085 líneas JS, 32 módulos
> - 302 TODOs/FIXMEs pendientes en el código
> - 77 console.log residuales
> - 0 atributos aria (accesibilidad CERO)
> - 484 onclick inline handlers
> - 2,573 inline styles
> - 222 innerHTML sin sanitizar
> - 176 parseInt/parseFloat con solo 1 NaN check
> - 360 colores hex hardcoded en JS
> - 223 strings sin i18n
> - 96 operaciones localStorage directas

---

## 📋 ÍNDICE (20 categorías, 500 mejoras reales)

| # | Categoría | Items | Impacto |
|---|---|---|---|
| A | Accesibilidad (WCAG 2.1) | 45 | 🔴 Crítico legal |
| B | Seguridad | 35 | 🔴 Crítico |
| C | Performance & Optimización | 40 | 🟡 Alto |
| D | Calidad de Código | 50 | 🟡 Alto |
| E | UX/UI Mejoras | 40 | 🟡 Alto |
| F | Clínica: Anamnesis & Historia | 30 | 🟢 Valor |
| G | Clínica: Nutrición & Fórmulas | 30 | 🟢 Valor |
| H | Clínica: Patologías & ESPEN | 25 | 🟢 Valor |
| I | Clínica: Soporte Nutricional | 20 | 🟢 Valor |
| J | Alimentos & Recetas | 25 | 🟢 Valor |
| K | Restauración Colectiva | 20 | 🟢 Valor |
| L | Facturación & Contabilidad | 20 | 🟢 Valor |
| M | Agenda & Comunicación | 20 | 🟢 Valor |
| N | IA & Copilot | 15 | 🟢 Valor |
| O | Reportes & Exportación | 25 | 🟢 Valor |
| P | Portal del Paciente | 20 | 🟢 Valor |
| Q | Internacionalización (i18n) | 15 | 🟡 Medio |
| R | Testing | 20 | 🟡 Medio |
| S | Infraestructura & DevOps | 15 | 🟡 Medio |
| T | Documentación | 10 | 🟢 Bajo |
| **TOTAL** | | **500** | |

---

## A. ACCESIBILIDAD (WCAG 2.1) — 45 mejoras
*Estado actual: 0 atributos aria, 4 roles, 0 focus management*

### A1. Navegación por teclado (10)
- A1.1 — Añadir `tabindex` a todos los elementos interactivos del sidebar
- A1.2 — Implementar navegación con flechas ↑↓ en sidebar NAV
- A1.3 — Focus trap en modales (Tab no escapa del modal)
- A1.4 — `Escape` cierra modal activo (parcialmente implementado)
- A1.5 — Skip navigation link al inicio del contenido
- A1.6 — `Enter/Space` activan botones en pill-tabs
- A1.7 — Focus visible outline en todos los elementos interactivos
- A1.8 — `aria-current="page"` en nav item activo
- A1.9 — Keyboard shortcuts para módulos frecuentes (Ctrl+1→Dashboard, etc.)
- A1.10 — Focus auto al primer input cuando se abre un formulario

### A2. ARIA semántico (15)
- A2.1 — `role="navigation"` en sidebar
- A2.2 — `role="main"` en mainContent
- A2.3 — `role="dialog"` + `aria-modal="true"` en modales
- A2.4 — `role="alert"` en toasts/notificaciones
- A2.5 — `role="tablist"` + `role="tab"` + `role="tabpanel"` en pill-tabs
- A2.6 — `aria-label` en botones con solo icono/emoji
- A2.7 — `aria-expanded` en acordeones y dropdowns
- A2.8 — `aria-live="polite"` en regiones que actualizan dinámicamente
- A2.9 — `aria-describedby` en inputs de formulario con mensajes de error
- A2.10 — `aria-selected` en tabs activos
- A2.11 — `aria-sort` en columnas de tabla ordenables
- A2.12 — `aria-busy="true"` durante cargas async (BEDCA, USDA, Gemini)
- A2.13 — `role="search"` en campos de búsqueda
- A2.14 — `role="status"` en KPI cards que se actualizan
- A2.15 — `aria-hidden="true"` en emojis decorativos

### A3. Formularios accesibles (10)
- A3.1 — `<label for="">` explícitos en TODOS los inputs (actualmente usan inline styles)
- A3.2 — `aria-required="true"` en campos obligatorios
- A3.3 — `aria-invalid="true"` + `aria-errormessage` en validación
- A3.4 — Asociar mensajes de error con `id` referenciado
- A3.5 — Fieldsets + legends en grupos de radio/checkbox
- A3.6 — Autocomplete attributes (`name`, `email`, `tel`, etc.)
- A3.7 — Input type correcto (`type="email"`, `type="tel"`, `type="number"`)
- A3.8 — Placeholder no como sustituto de label
- A3.9 — Error summary al top del formulario con enlaces a campos
- A3.10 — Success feedback accesible después de guardar

### A4. Visual y contraste (10)
- A4.1 — Verificar ratio contraste 4.5:1 en todos los textos (WCAG AA)
- A4.2 — No usar solo color para comunicar info (alertas: icono + texto + color)
- A4.3 — Tamaño mínimo de click target: 44×44px (móvil)
- A4.4 — Reducir motion con `prefers-reduced-motion`
- A4.5 — Alt text en todas las imágenes (`assets/*.png`)
- A4.6 — `lang="es"` en HTML root y cambiar con i18n
- A4.7 — Font-size mínimo 12px en todo (algunos `.5rem` son 7px)
- A4.8 — Soporte zoom hasta 200% sin romper layout
- A4.9 — Dark mode: verificar contraste de TODOS los elementos
- A4.10 — Indicador visual de página/sección actual para screen readers

---

## B. SEGURIDAD — 35 mejoras
*Estado actual: syncHash no criptográfico, 222 innerHTML, 0 sanitización DOM*

### B1. Autenticación (10)
- B1.1 — Reemplazar `syncHash()` con Web Crypto API `SubtleCrypto.digest('SHA-256')`
- B1.2 — Implementar PBKDF2 o Argon2 (vía WebAssembly) para hashing de contraseñas
- B1.3 — Password strength meter en registro (zxcvbn library)
- B1.4 — Brute force protection: lockout después de 5 intentos fallidos
- B1.5 — Session token con crypto.randomUUID() en vez de email en localStorage
- B1.6 — Refresh token rotation (si se implementa backend)
- B1.7 — Invalidar sesiones anteriores al cambiar contraseña
- B1.8 — 2FA con TOTP (Google Authenticator) — requiere backend
- B1.9 — Rate limiting en intentos de login (client-side timer)
- B1.10 — Logout en todas las pestañas vía `storage` event listener

### B2. XSS Prevention (10)
- B2.1 — Crear función `safeHTML(str)` que escape `<>&"'` 
- B2.2 — Reemplazar 222 `innerHTML` con `textContent` donde sea solo texto
- B2.3 — Usar template tags + `cloneNode` para templates complejos
- B2.4 — DOMPurify para contenido usuario que necesite HTML (notas, etc.)
- B2.5 — CSP `script-src 'self'` estricto (eliminar `unsafe-inline`)
- B2.6 — Sanitizar todos los inputs de pacientes antes de renderizar
- B2.7 — Escapar datos en atributos `onclick` generados dinámicamente
- B2.8 — Validar URLs externas antes de crear enlaces
- B2.9 — Sanitizar nombres de archivo en upload de documentos
- B2.10 — Nonce-based CSP para inline scripts necesarios

### B3. Datos y privacidad (10)
- B3.1 — Encriptar localStorage con AES-256-GCM (estructura ya preparada en auth.js)
- B3.2 — Limpiar datos sensibles de memoria al logout (`DB = null`)
- B3.3 — No almacenar contraseñas en `DB.patients[].portalPass` en texto claro
- B3.4 — Expirar datos de sesión automáticamente (ya parcial)
- B3.5 — Implementar derecho al olvido (RGPD Art. 17) — borrar todo de un paciente
- B3.6 — Registro de accesos a datos clínicos (audit log detallado)
- B3.7 — Anonimización reversible para desarrollo/testing
- B3.8 — Backup encriptado (export con contraseña)
- B3.9 — Verificar que fotos de pacientes no se envían a Gemini
- B3.10 — Política de retención de datos configurable

### B4. Infraestructura (5)
- B4.1 — HTTPS redirect forzado (verificar en todas las plataformas)
- B4.2 — Subresource Integrity (SRI) en CDN scripts (Firebase, fonts)
- B4.3 — Firestore rules: verificar que cada rule requiere auth
- B4.4 — Rate limiting en Firestore operations desde cliente
- B4.5 — Deshabilitar Firebase anonymous auth si no se usa

---

## C. PERFORMANCE & OPTIMIZACIÓN — 40 mejoras

### C1. DOM & Rendering (10)
- C1.1 — Reducir 585 queries `$()` — cachear referencias DOM
- C1.2 — `requestAnimationFrame` para animaciones CSS actuales
- C1.3 — Virtual scrolling para listas grandes (pacientes, alimentos 969+)
- C1.4 — Debounce en búsquedas en tiempo real (BEDCA, pacientes)
- C1.5 — Lazy rendering: solo renderizar módulo activo, no pre-renderizar todos
- C1.6 — `will-change: transform` en elementos animados
- C1.7 — `content-visibility: auto` en secciones fuera de viewport
- C1.8 — Reducir reflows: batch DOM writes
- C1.9 — `DocumentFragment` para construir listas grandes
- C1.10 — Intersection Observer para lazy loading de gráficos

### C2. JavaScript (10)
- C2.1 — Code splitting: cargar módulos bajo demanda (`import()`)
- C2.2 — Web Workers para cálculos pesados (clinical indices, ESPEN matrix)
- C2.3 — Memoización de cálculos de fórmula (mismos inputs → mismo resultado)
- C2.4 — IndexedDB para datos grandes (en vez de localStorage 5MB)
- C2.5 — Eliminar 77 `console.log` residuales en producción
- C2.6 — Tree-shaking: eliminar código muerto (funciones nunca llamadas)
- C2.7 — Comprimir BEDCA data con diccionario (168KB → ~80KB)
- C2.8 — Precalcular datos estáticos (ESPEN matrix, pathology questions)
- C2.9 — Object pooling para objetos temporales en cálculos
- C2.10 — Evitar closures innecesarias en loops `.forEach()` con datos grandes

### C3. Red & Assets (10)
- C3.1 — Gzip/Brotli compression en hosting (Firebase/Netlify lo hacen auto)
- C3.2 — Preload de fuente Inter (ya usa Google Fonts CDN)
- C3.3 — Font display swap para evitar FOIT
- C3.4 — Lazy load de data/bedca-data.js (cargar después de paint)
- C3.5 — Service Worker: precache inteligente (solo archivos críticos)
- C3.6 — Cache API para respuestas de APIs externas (OFF, USDA)
- C3.7 — Optimizar PNGs (assets/logo-*.png → WebP + fallback)
- C3.8 — Preconnect a dominios de APIs externas
- C3.9 — HTTP/2 push para CSS y JS críticos
- C3.10 — Bundle splitting: core.js + auth.js primero, resto lazy

### C4. CSS (10)
- C4.1 — Extraer 2,573 inline styles a clases CSS reutilizables
- C4.2 — Crear 20+ clases utilitarias (`.mt-4`, `.text-center`, `.flex-between`, etc.)
- C4.3 — CSS custom properties para 360 colores hardcoded en JS
- C4.4 — Reducir especificidad CSS (evitar `!important`)
- C4.5 — Container queries para componentes responsivos
- C4.6 — CSS nesting (ya soportado en navegadores modernos)
- C4.7 — `@layer` para organizar cascade
- C4.8 — Animaciones con `@keyframes` en vez de JS transitions
- C4.9 — Purge CSS no utilizado
- C4.10 — Variables CSS para spacing scale consistente (4px base)

---

## D. CALIDAD DE CÓDIGO — 50 mejoras

### D1. Limpieza (15)
- D1.1 — Resolver 302 TODO/FIXME/HACK/TEMP en el código
- D1.2 — Eliminar 77 console.log en producción (flag `if(DEV)`)
- D1.3 — Eliminar `icons.js` o activarlo completamente (no dejarlo a medias)
- D1.4 — Estandarizar convención de nombres: camelCase consistente
- D1.5 — Estandarizar `var` → `const`/`let` (ES6)
- D1.6 — Reemplazar `function(){}` → arrow functions donde corresponda
- D1.7 — Eliminar variables no usadas
- D1.8 — Ordenar imports/scripts consistentemente
- D1.9 — Comentarios JSDoc en TODAS las funciones públicas (606 funciones)
- D1.10 — Separar configuración de lógica (constants file)
- D1.11 — Eliminar código comentado
- D1.12 — Consistencia en quotes (single vs double)
- D1.13 — Trailing commas consistentes
- D1.14 — Semicolons consistentes
- D1.15 — Line length máximo (120 chars)

### D2. Arquitectura (15)
- D2.1 — Módulo patrón: encapsular 606 funciones globales en namespaces
- D2.2 — Event bus para comunicación entre módulos (pub/sub)
- D2.3 — State management centralizado (no mutar DB directamente)
- D2.4 — Separar Vista de Lógica (actualmente HTML en JS strings)
- D2.5 — Template engine ligero (lit-html, uhtml, o similar)
- D2.6 — Router con History API (`pushState`) en vez de hash
- D2.7 — Middleware pattern para pre/post hooks en navegación
- D2.8 — Plugin system para extensibilidad
- D2.9 — Dependency injection para testabilidad
- D2.10 — Observer pattern para reactividad de datos
- D2.11 — Command pattern para undo/redo
- D2.12 — Strategy pattern para fórmulas clínicas (en vez de switch)
- D2.13 — Refactorizar `restauracion.js` (2,336 líneas → 3-4 archivos)
- D2.14 — Refactorizar `soporte-nutricional.js` (1,796 líneas → 2-3 archivos)
- D2.15 — Separar data models de UI rendering

### D3. Error Handling (10)
- D3.1 — Try/catch en TODAS las funciones que tocan DOM (176 `parseInt` sin NaN check)
- D3.2 — Global error handler: `window.onerror` + `unhandledrejection`
- D3.3 — Error boundary pattern por módulo
- D3.4 — Validación de inputs numéricos (peso, altura, etc.) con rangos realistas
- D3.5 — Graceful degradation cuando APIs externas fallan
- D3.6 — Retry logic con exponential backoff para Firestore/APIs
- D3.7 — Offline detection + queue de operaciones pendientes
- D3.8 — Mostrar error UI amigable (no raw JS errors)
- D3.9 — Logging centralizado con niveles (error/warn/info/debug)
- D3.10 — Sentry o similar para error tracking en producción

### D4. Validación (10)
- D4.1 — Schema validation para DB entities (Zod o ajv lightweight)
- D4.2 — Validar DNI/NIE formato español
- D4.3 — Validar email con regex robusto
- D4.4 — Validar teléfono español (+34)
- D4.5 — Validar rangos de peso (0.5-500 kg), altura (20-250 cm), IMC (10-80)
- D4.6 — Validar fechas futuras en citas, pasadas en nacimiento
- D4.7 — Validar coherencia de datos (peso+altura → IMC debe coincidir)
- D4.8 — Validar formato de analíticas (valores numéricos, unidades válidas)
- D4.9 — Prevenir duplicados (pacientes con mismo DNI)
- D4.10 — Sanitizar inputs antes de almacenar en DB

---

## E. UX/UI — 40 mejoras

### E1. Interacciones (15)
- E1.1 — Undo/Redo en ediciones (Ctrl+Z)
- E1.2 — Confirmación antes de borrar (modal "¿Estás seguro?" con detalle)
- E1.3 — Autosave cada 30s en formularios largos (anamnesis, desarrollada)
- E1.4 — Loading skeletons (en vez de spinners) al cargar módulos
- E1.5 — Infinite scroll en listas largas (pacientes, alimentos)
- E1.6 — Pull-to-refresh en mobile
- E1.7 — Swipe gestures en mobile para navegación
- E1.8 — Context menu (click derecho) en tablas con acciones rápidas
- E1.9 — Bulk actions en tablas (seleccionar múltiples → borrar/exportar)
- E1.10 — Drag & drop para reordenar items en listas
- E1.11 — Inline editing en tablas (click en celda → editar)
- E1.12 — Tooltips informativos en KPIs y métricas clínicas
- E1.13 — Breadcrumbs en navegación profunda (Paciente → Historia → Anamnesis)
- E1.14 — Búsqueda global (Ctrl+K) tipo Spotlight/Cmd+K
- E1.15 — Favoritos/bookmarks para pacientes frecuentes

### E2. Feedback visual (10)
- E2.1 — Progress bar en procesos multi-step (anamnesis 8 pasos, desarrollada 5 pasos)
- E2.2 — Success animations (checkmark verde animado al guardar)
- E2.3 — Empty states con ilustraciones + CTAs claros
- E2.4 — Badges de notificación en nav items (citas pendientes, alertas)
- E2.5 — Transiciones de página suaves (fade in/out entre módulos)
- E2.6 — Indicador de cambios no guardados (dot/asterisco en tab)
- E2.7 — Contador de caracteres en textareas con límite
- E2.8 — Preview en vivo de datos mientras se escriben
- E2.9 — Comparación visual antes/después en antropometría
- E2.10 — Micro-interactions en botones (ripple effect, scale)

### E3. Responsive & Mobile (10)
- E3.1 — Bottom navigation bar en mobile (en vez de hamburger)
- E3.2 — Tablas responsive: card layout en <600px
- E3.3 — Formularios full-width en mobile
- E3.4 — Touch-optimized selectors (tamaño mínimo 44px)
- E3.5 — Landscape mode optimizado en tablets
- E3.6 — Print stylesheet para informes clínicos
- E3.7 — PWA: instalar prompt personalizado
- E3.8 — PWA: badge API para notificaciones
- E3.9 — Viewport meta tag optimizado para cada página
- E3.10 — Orientación de pantalla lock en ciertas vistas

### E4. Temas & Personalización (5)
- E4.1 — Tema por usuario (guardar en perfil, no solo localStorage)
- E4.2 — Colores primarios personalizables por clínica
- E4.3 — Logo personalizable por clínica
- E4.4 — Layout compacto vs espacioso (densidad de información)
- E4.5 — Font size ajustable (accesibilidad)

---

## F. CLÍNICA: ANAMNESIS & HISTORIA — 30 mejoras

### F1. Anamnesis avanzada (15)
- F1.1 — Preguntas condicionales dinámicas (si responde X → mostrar Y)
- F1.2 — Escala visual de dolor (0-10 con caras)
- F1.3 — Body map interactivo para señalar zonas afectadas
- F1.4 — Timeline visual del historial de anamnesis del paciente
- F1.5 — Comparar anamnesis anterior vs actual (diff visual)
- F1.6 — Red flags automáticos con scoring de severidad
- F1.7 — Preguntas frecuencia alimentaria (FFQ) estandarizado
- F1.8 — Cuestionario PREDIMED validado
- F1.9 — Cuestionario IPAQ (actividad física)
- F1.10 — Escala de Bristol (heces) con imágenes
- F1.11 — Cuestionario Pittsburgh (calidad de sueño)
- F1.12 — Cuestionario EAT-26 (screening TCA)
- F1.13 — Edmonton Symptom Assessment (oncología)
- F1.14 — Mini Nutritional Assessment (MNA) completo (geriátrico)
- F1.15 — Historial farmacológico con interacciones droga-nutriente

### F2. Historia clínica (15)
- F2.1 — Genograma familiar interactivo (antecedentes familiares visual)
- F2.2 — Evolución del paciente con gráficos temporales
- F2.3 — Comparativa antropométrica con referencias OMS
- F2.4 — Curvas de crecimiento pediátricas (OMS/CDC) interactivas
- F2.5 — Ficha de evolución con fotos del paciente (progreso visual)
- F2.6 — Notas de consulta con templates por tipo de visita
- F2.7 — Firma digital del profesional en informes
- F2.8 — Adjuntar analíticas como foto/scan + OCR para extraer valores
- F2.9 — Integración con HL7/FHIR para interoperabilidad
- F2.10 — CIE-11 además de CIE-10 (ICD-11)
- F2.11 — SNOMED CT para codificación clínica
- F2.12 — Diagrama de composición corporal (pie chart grasa/músculo/agua)
- F2.13 — Resumen ejecutivo auto-generado del paciente (para derivaciones)
- F2.14 — Alertas de cumpleaños de pacientes
- F2.15 — Recordatorio de controles periódicos según patología

---

## G. CLÍNICA: NUTRICIÓN & FÓRMULAS — 30 mejoras

### G1. Fórmulas y cálculos (15)
- G1.1 — Fórmula de Schofield (OMS, pediátrica)
- G1.2 — Fórmula de Henry (Oxford, 2005)
- G1.3 — Fórmula de Cunningham (basada en masa libre de grasa)
- G1.4 — Fórmula Penn State (UCI, ventilación mecánica)
- G1.5 — Fórmula Ireton-Jones (paciente crítico)
- G1.6 — Calorimetría indirecta: input de VO2/VCO2 → REE
- G1.7 — Gasto por actividad física detallado (MET por actividad)
- G1.8 — Requerimiento hídrico automático (ml/kg o Holliday-Segar)
- G1.9 — Cálculo de peso ideal por múltiples métodos (Hamwi, Devine, Robinson, Miller)
- G1.10 — Peso ajustado para obesidad (peso ideal + 25% exceso)
- G1.11 — Cálculo de proteínas por peso ajustado en obesos
- G1.12 — Requerimientos por ciclo de vida: embarazo trimestre, lactancia, adolescente
- G1.13 — Factor de estrés configurable por usuario (no solo predefinidos)
- G1.14 — Comparativa visual de fórmulas (gráfico radar: Harris vs Mifflin vs FAO)
- G1.15 — Historial de fórmulas con trending (cómo cambia el GET en el tiempo)

### G2. Desarrollada & Planes (15)
- G2.1 — Micronutrientes en desarrollada (vitaminas A, C, D, E, B12, hierro, calcio, zinc)
- G2.2 — Índice glucémico por comida y por día
- G2.3 — Carga glucémica acumulada
- G2.4 — Ratio omega-6/omega-3 diario
- G2.5 — PRAL (Potential Renal Acid Load) del plan
- G2.6 — Score DASH automático del plan
- G2.7 — Score Mediterranean Diet adherence
- G2.8 — Distribución de comidas visual (pie charts por turno)
- G2.9 — Swap inteligente de alimentos (sugerir alternativa con perfil nutricional similar)
- G2.10 — Copiar plan de un paciente a otro (con ajuste de kcal)
- G2.11 — Versionalización de planes (v1, v2, v3 con changelog)
- G2.12 — Plan semanal automático con rotación de alimentos
- G2.13 — Ajuste automático de porciones para alcanzar objetivos macro
- G2.14 — Alertas de deficiencia de micronutrientes en el plan
- G2.15 — Integración recetas↔plan (insertar receta como comida)

---

## H. CLÍNICA: PATOLOGÍAS & ESPEN — 25 mejoras

### H1. Patologías nuevas (15)
- H1.1 — Hiperuricemia/Gota: restricción purinas, alimentos permitidos/prohibidos
- H1.2 — Síndrome metabólico: criterios ATP-III + plan integrado
- H1.3 — SOP: plan PCOS con ratio HC/proteína
- H1.4 — Hipotiroidismo: alimentos bociógenos, selenio, zinc
- H1.5 — EII (Crohn/CU): fases brote vs remisión, dieta FODMAP
- H1.6 — Dieta FODMAP: fase eliminación, reintroducción, personalización
- H1.7 — Alergia alimentaria: matrices de reactividad cruzada
- H1.8 — Fenilcetonuria (PKU): control de fenilalanina
- H1.9 — Fibrosis quística: alto calórico, enzimas pancreáticas
- H1.10 — Epilepsia: dieta cetogénica terapéutica (ratio 4:1, 3:1)
- H1.11 — Sarcopenia: protocolo EWGSOP2 + plan hipercalórico hiperproteico
- H1.12 — Osteoporosis: calcio, vitamina D, proteína, ejercicio
- H1.13 — TCA (Trastornos de Conducta Alimentaria): protocolo gradual
- H1.14 — Prediabetes: programa de prevención (DPP)
- H1.15 — Post-cirugía bariátrica: fases (líquida, puré, blanda, normal)

### H2. ESPEN ampliado (10)
- H2.1 — ESPEN Guidelines 2023-2025: actualizar recomendaciones
- H2.2 — Screening nutricional MUST (Malnutrition Universal Screening Tool)
- H2.3 — Screening NRS-2002 completo (hospitalización)
- H2.4 — Screening SNAQ (Short Nutritional Assessment Questionnaire)
- H2.5 — GLIM completo: diagnóstico + severidad + plan de acción
- H2.6 — SGA (Subjective Global Assessment) completo
- H2.7 — ASPEN guidelines además de ESPEN
- H2.8 — Interacciones fármaco-nutriente expandidas (base de datos completa)
- H2.9 — Evidencia GRADE para cada recomendación (nivel A/B/C/D)
- H2.10 — Enlace a papers PubMed para cada guía ESPEN

---

## I. CLÍNICA: SOPORTE NUTRICIONAL — 20 mejoras

### I1. Cálculos UCI (10)
- I1.1 — Protocolo de inicio NE: velocidad de infusión escalonada
- I1.2 — Cálculo de NP: aminoácidos + dextrosa + lípidos + electrolitos
- I1.3 — Osmolaridad de NP calculada automáticamente
- I1.4 — Monitorización de síndrome de realimentación (refeeding syndrome)
- I1.5 — Protocolo de transición NP → NE → oral
- I1.6 — Cálculo de residuo gástrico + alarmas
- I1.7 — Tabla de fórmulas enterales comerciales (Ensure, Fresubin, etc.)
- I1.8 — Comparativa de fórmulas enterales por precio/perfil nutricional
- I1.9 — Score APACHE II/III para ajuste de requerimientos
- I1.10 — Balance nitrogenado: cálculo + interpretación

### I2. Guías clínicas (10)
- I2.1 — Guía: Traumatismo craneoencefálico (TCE)
- I2.2 — Guía: Sepsis y shock séptico
- I2.3 — Guía: Insuficiencia hepática aguda
- I2.4 — Guía: Síndrome de intestino corto
- I2.5 — Guía: Trasplante de médula ósea / hematológico
- I2.6 — Guía: Paciente geriátrico hospitalizado
- I2.7 — Guía: Embarazo de alto riesgo hospitalizado
- I2.8 — Guía: Paciente pediátrico crítico
- I2.9 — Guía: COVID-19 (post-UCI, rehabilitación nutricional)
- I2.10 — Guía: Paciente neurológico (disfagia, ACV)

---

## J. ALIMENTOS & RECETAS — 25 mejoras

### J1. Base de datos de alimentos (15)
- J1.1 — Alimentos argentinos/latinoamericanos (complementar BEDCA español)
- J1.2 — Micronutrientes completos: vit A, E, B1, B2, B3, B6, B12, folato, zinc, selenio, yodo, magnesio
- J1.3 — Índice glucémico por alimento
- J1.4 — Carga glucémica por alimento
- J1.5 — FODMAP classification por alimento (alto/medio/bajo)
- J1.6 — Contenido de purinas por alimento (para gota)
- J1.7 — Contenido de oxalatos (para litiasis renal)
- J1.8 — Contenido de fenilalanina (para PKU)
- J1.9 — Alérgenos detallados (14 alérgenos EU regulados)
- J1.10 — Etiquetado: Nutri-Score calculado para alimentos custom
- J1.11 — Código de barras scanner (cámara → OpenFoodFacts)
- J1.12 — Alimentos de marca/procesados comunes (via OFF)
- J1.13 — Porciones estándar fotográficas (ayuda visual de porciones)
- J1.14 — Estacionalidad de frutas y verduras (calendario)
- J1.15 — Precio estimado por porción (para planificación económica)

### J2. Recetas (10)
- J2.1 — Recetas filtradas por patología (diabético, celíaco, renal, etc.)
- J2.2 — Recetas por tiempo de preparación
- J2.3 — Scaling automático de recetas (de 4 a 1 ración, etc.)
- J2.4 — Video recipes (YouTube embed)
- J2.5 — Recetas generadas por IA (Gemini: "receta con X ingredientes para paciente con Y")
- J2.6 — Costo estimado por receta
- J2.7 — Clasificación por método de cocción (horno, vapor, plancha, etc.)
- J2.8 — Recetas compartidas entre profesionales (biblioteca comunitaria)
- J2.9 — Print layout optimizado para entregar al paciente
- J2.10 — QR code en receta impresa → ver en portal del paciente

---

## K. RESTAURACIÓN COLECTIVA — 20 mejoras

### K1. Operativo (10)
- K1.1 — Planificación mensual de menús con vista calendario
- K1.2 — Menú cíclico automático (rotación 4 semanas)
- K1.3 — Cálculo automático de pedidos a proveedores desde menú
- K1.4 — Costos por ración calculado automáticamente
- K1.5 — Dashboard de costos: costo real vs presupuesto
- K1.6 — Control de stock automático con alerta de mínimos
- K1.7 — Registro de temperaturas con gráficos de tendencia
- K1.8 — Checklist APPCC digital con firma del responsable
- K1.9 — Alertas de caducidad de lotes (push notification)
- K1.10 — Etiquetas de alérgenos generables para buffet/línea

### K2. Reporting (10)
- K2.1 — KPIs mensuales: costo medio/ración, merma %, satisfacción
- K2.2 — Análisis de menú: variedad, repetición, estacionalidad
- K2.3 — Informe APPCC mensual exportable PDF
- K2.4 — Comparativa nutricional vs requerimientos del colectivo
- K2.5 — Informe de trazabilidad por lote (rastreo completo)
- K2.6 — Encuesta de satisfacción digital para comensales
- K2.7 — Dashboard comparativo entre centros
- K2.8 — Análisis de mermas por plato/día/centro (identificar patrones)
- K2.9 — Report de cumplimiento normativo (RD 3484/2000 España)
- K2.10 — Export datos a Excel para contabilidad externa

---

## L. FACTURACIÓN & CONTABILIDAD — 20 mejoras

### L1. Facturación (10)
- L1.1 — Factura electrónica: formato Facturae / TicketBAI (España)
- L1.2 — Envío de factura por email al paciente
- L1.3 — Cobro parcial / plan de pagos (cuotas)
- L1.4 — Bonos/packs de sesiones (10 sesiones = descuento)
- L1.5 — Facturación recurrente automática (mensual/trimestral)
- L1.6 — Retenciones IRPF para profesionales
- L1.7 — Multi-IVA (tipos reducido, superreducido, exento)
- L1.8 — Nota de crédito (rectificativa)
- L1.9 — Remesa bancaria (SEPA XML export)
- L1.10 — Libro de facturas emitidas/recibidas (Modelo 303/390)

### L2. Contabilidad (10)
- L2.1 — Plan contable simplificado (PGC PYME)
- L2.2 — Balance de situación automático
- L2.3 — Cuenta de pérdidas y ganancias trimestral
- L2.4 — Flujo de caja proyectado (cash flow forecast)
- L2.5 — Categorías de gasto configurables
- L2.6 — Gráfico de ingresos vs gastos mensual (ya parcial)
- L2.7 — Importación de extracto bancario (CSV/OFX)
- L2.8 — Conciliación bancaria
- L2.9 — Presupuesto anual con seguimiento mensual
- L2.10 — Export para gestoría: CSV/Excel con formato contable estándar

---

## M. AGENDA & COMUNICACIÓN — 20 mejoras

### M1. Agenda avanzada (10)
- M1.1 — Sincronización bidireccional Google Calendar (API)
- M1.2 — Reserva online por paciente (link público de agenda)
- M1.3 — Disponibilidad configurable por profesional
- M1.4 — Bloqueo de horarios (vacaciones, reuniones, etc.)
- M1.5 — Recordatorio automático por email/WhatsApp (24h antes)
- M1.6 — Videollamada integrada (Jitsi Meet embed, gratis)
- M1.7 — Sala de espera virtual (paciente se conecta, profesional acepta)
- M1.8 — Check-in del paciente (confirmar llegada desde móvil)
- M1.9 — Duración variable por tipo de cita (primera visita 60min, revisión 30min)
- M1.10 — Vista multi-profesional (agenda de equipo)

### M2. Comunicación (10)
- M2.1 — Notificaciones push (via Service Worker + Push API)
- M2.2 — Templates de mensajes por ocasión (bienvenida, control, felicidades, etc.)
- M2.3 — Mensajes programados (enviar el lunes a las 9am)
- M2.4 — Mensajes masivos a grupo de pacientes (ej: todos los diabéticos)
- M2.5 — Adjuntar archivos en chat (PDF de plan, fotos, etc.)
- M2.6 — WhatsApp Business API integration
- M2.7 — Email automático post-consulta con resumen + próxima cita
- M2.8 — Encuesta de satisfacción post-consulta (NPS automatizado)
- M2.9 — Bot de respuestas frecuentes (horarios, ubicación, precios)
- M2.10 — Canal de educación nutricional (artículos/tips periódicos)

---

## N. IA & COPILOT — 15 mejoras

- N1 — Contexto clínico automático: enviar antecedentes + analíticas + plan actual
- N2 — Generación de plan alimentario por IA (con restricciones del paciente)
- N3 — Análisis de analíticas por IA: interpretación + recomendaciones
- N4 — Resumen de consulta por IA (generar acta desde notas)
- N5 — Predicción de adherencia al plan (basada en historial)
- N6 — Detección de interacciones droga-nutriente por IA
- N7 — Chat con paciente asistido por IA (sugerir respuestas al profesional)
- N8 — Generación de informes clínicos por IA
- N9 — Análisis de tendencias en analíticas (IA detecta patrones)
- N10 — Educación nutricional personalizada generada por IA
- N11 — OCR de analíticas: foto → datos estructurados (via Gemini Vision)
- N12 — Voice-to-text en notas de consulta (Web Speech API)
- N13 — Sugerencia de diagnóstico diferencial nutricional
- N14 — Alertas predictivas: "este paciente tiene riesgo de X"
- N15 — Embeddings de historial clínico para búsqueda semántica

---

## O. REPORTES & EXPORTACIÓN — 25 mejoras

### O1. Informes clínicos (15)
- O1.1 — Informe nutricional completo PDF (portada + anamnesis + antropometría + plan)
- O1.2 — Informe de evolución comparativo (gráficos de progreso)
- O1.3 — Informe de derivación a otro profesional
- O1.4 — Informe para aseguradora/mutua
- O1.5 — Resumen del plan para el paciente (versión simplificada)
- O1.6 — Lista de compras semanal desde plan alimentario
- O1.7 — Etiquetas nutricionales para platos (formato EU Reg. 1169/2011)
- O1.8 — Informe APPCC mensual (restauración colectiva)
- O1.9 — Informe de productividad del profesional (citas/semana, ingresos, etc.)
- O1.10 — Dashboard ejecutivo exportable (para gerencia/dirección)
- O1.11 — Informe estadístico anual (total pacientes, patologías frecuentes, etc.)
- O1.12 — Certificado de aptitud nutricional (para empresas/deportistas)
- O1.13 — Export de historia clínica completa (derecho RGPD del paciente)
- O1.14 — Gráfico de composición corporal exportable
- O1.15 — Report de alertas clínicas pendientes

### O2. Formatos (10)
- O2.1 — PDF con diseño profesional (header con logo clínica, colores brand)
- O2.2 — Excel/XLSX para datos tabulares (analíticas, facturación)
- O2.3 — CSV universal
- O2.4 — Word/DOCX para informes editables
- O2.5 — Print-optimized layouts (CSS @media print)
- O2.6 — QR code en informes (enlace al portal del paciente)
- O2.7 — Gráficos SVG exportables como imagen PNG
- O2.8 — Firma digital del profesional en PDFs
- O2.9 — Marca de agua "CONFIDENCIAL" en informes clínicos
- O2.10 — Zip export de todo el historial de un paciente

---

## P. PORTAL DEL PACIENTE — 20 mejoras

- P1 — Dashboard personalizado (peso actual, próxima cita, plan del día)
- P2 — Foto de plato: subir + IA analiza composición nutricional
- P3 — Diario alimentario con búsqueda de alimentos
- P4 — Registro de peso diario/semanal con gráfico
- P5 — Registro de síntomas con tracking temporal
- P6 — Registro de agua/hidratación diaria
- P7 — Registro de actividad física diaria
- P8 — Registro de sueño (horas, calidad)
- P9 — Objetivos gamificados (streak de días cumpliendo plan)
- P10 — Recetas asignadas por el profesional
- P11 — Lista de compras generada desde plan
- P12 — Chat mejorado con notificaciones
- P13 — Videollamada con el profesional
- P14 — Descarga de informes/planes en PDF
- P15 — Alertas de próxima cita (24h antes)
- P16 — Cuestionario de adherencia (auto-reporte)
- P17 — Educación nutricional: artículos asignados
- P18 — Historial de analíticas con gráficos de tendencia
- P19 — Compartir progreso con familiar/cuidador
- P20 — Multi-idioma en portal (ya tiene i18n parcial)

---

## Q. INTERNACIONALIZACIÓN (i18n) — 15 mejoras

- Q1 — Completar 223 strings hardcoded pendientes de t()
- Q2 — Traducciones completas: inglés (100%)
- Q3 — Traducciones completas: portugués (100%)
- Q4 — Añadir francés (FR)
- Q5 — Añadir italiano (IT)
- Q6 — RTL support (árabe, hebreo)
- Q7 — Formato de fecha localizado (DD/MM vs MM/DD)
- Q8 — Formato de número localizado (1.234,56 vs 1,234.56)
- Q9 — Moneda por configuración de clínica (no por sesión)
- Q10 — Traducciones de patologías y sistemas anatómicos
- Q11 — Traducciones de alimentos BEDCA (EN, PT)
- Q12 — PDF/informes en idioma del paciente
- Q13 — Email templates multiidioma
- Q14 — Landing page multiidioma con detección de browser language
- Q15 — Flag icons para selector de idioma

---

## R. TESTING — 20 mejoras

- R1 — Coverage report (Istanbul/c8) → objetivo: >80%
- R2 — Tests de regresión visual (screenshots comparison)
- R3 — Tests de accesibilidad automatizados (axe-core)
- R4 — Tests de performance (Lighthouse CI)
- R5 — Tests de formularios (validación, submit, error states)
- R6 — Tests de cálculos clínicos con casos reales validados
- R7 — Tests de edge cases en fórmulas (peso 0, altura negativa, etc.)
- R8 — Tests de RBAC exhaustivos (cada módulo × cada rol)
- R9 — Tests de i18n (verificar que t() no devuelve key)
- R10 — Tests de responsive (viewport sizes via jsdom o Playwright)
- R11 — Tests de offline mode (service worker)
- R12 — Tests de Firestore sync/conflict resolution
- R13 — Tests de memoria (localStorage 5MB limit)
- R14 — Tests de concurrencia (dos tabs abiertos)
- R15 — Integration tests con APIs reales (sandbox)
- R16 — Load testing (simular 100 pacientes, 1000 citas)
- R17 — Smoke tests post-deploy (verificar URLs críticas)
- R18 — Contract tests para APIs externas
- R19 — Mutation testing (evaluar calidad de los tests)
- R20 — CI/CD pipeline: GitHub Actions con test + deploy

---

## S. INFRAESTRUCTURA & DEVOPS — 15 mejoras

- S1 — GitHub Actions: test on PR, deploy on merge to main
- S2 — Staging environment (preview deploys en Netlify/Firebase)
- S3 — Environment variables (dev/staging/prod configs)
- S4 — Error monitoring: Sentry free tier
- S5 — Analytics: Plausible o Umami (privacy-friendly, self-hosted)
- S6 — Uptime monitoring: UptimeRobot free tier
- S7 — CDN para assets estáticos (Cloudflare free tier)
- S8 — Automated backups de Firestore
- S9 — Database migration scripts versionados
- S10 — Feature flags para activar/desactivar funcionalidades
- S11 — A/B testing framework ligero
- S12 — Changelogs automáticos desde commits
- S13 — Semantic versioning automatizado
- S14 — Docker Compose para desarrollo local completo
- S15 — Health check endpoint para monitorización

---

## T. DOCUMENTACIÓN — 10 mejoras

- T1 — API documentation (si se activa backend): Swagger/OpenAPI
- T2 — Component storybook (catálogo visual de componentes UI)
- T3 — Video tutoriales para usuarios finales
- T4 — Manual de usuario PDF descargable
- T5 — FAQ section en la app
- T6 — Tooltips contextuales en la primera visita a cada módulo
- T7 — Release notes visibles para usuarios (modal "Novedades v5.2")
- T8 — Documentación de fórmulas clínicas con referencias bibliográficas
- T9 — Guía de contribución para equipo de desarrollo
- T10 — Diagrama de arquitectura visual (draw.io/mermaid)

---

## 📊 RESUMEN EJECUTIVO

| Prioridad | Categorías | Items | Por qué |
|---|---|---|---|
| 🔴 **P0 — Hacer YA** | Accesibilidad (A), Seguridad (B) | 80 | Riesgo legal (WCAG/RGPD) y vulnerabilidades activas |
| 🟡 **P1 — Antes de prod** | Performance (C), Código (D), UX (E) | 130 | Calidad de producto, experiencia de usuario |
| 🟢 **P2 — Roadmap Q3-Q4** | Clínica (F,G,H,I), Alimentos (J) | 130 | Valor diferencial, completitud clínica |
| 🔵 **P3 — Roadmap 2027** | Gestión (K,L,M), IA (N), Reportes (O) | 80 | Monetización, automatización |
| ⚪ **P4 — Backlog** | Portal (P), i18n (Q), Tests (R), Infra (S), Docs (T) | 80 | Escalabilidad, internacionalización |

**Total: 500 mejoras reales, accionables, priorizadas.**

---

*Generado por análisis estático del código fuente — Veridia HealthTech v5.2.0*
*GalcoCapital LLC — Eduardo Andres Galeano Aido (NIE: Z0002918W)*
*2026-07-30*
