# Veridia Frontend Redesign — Design Spec

> **Estado:** Aprobado para implementación  
> **Fecha:** 2026-08-18  
> **Alcance:** Remodelación completa del sistema de diseño y UI del frontend  
> **Específico:** Design System First approach sobre pila existente

---

## 1. Objetivo

Unificar la interfaz de Veridia bajo un sistema de diseño coherente, manteniendo la identidad visual "Clinical Command Center" (dark mode, glassmorphism, cyan/emerald accents) pero eliminando inconsistencias, hardcoded values y patrones desactualizados.

**Resultado esperado:** Interfaz visualmente consistente, componentes reutilizables, mantenibilidad mejorada, experiencia de usuario pulida.

---

## 2. Filosofía de diseño

### 2.1 Principios

1. **Design System First** — Todo cambio visual se hace primero en el sistema de diseño, luego se propaga a páginas
2. **Tokens sobre valores** — Ningún color, spacing o radius hardcodeado en componentes
3. **Componentes como primitivas** — Cada patrón visual se abstrae en un componente reutilizable
4. **Consistencia sobre creatividad** — Mismos patrones visuales en toda la aplicación
5. **Accesibilidad por defecto** — ARIA labels, keyboard nav, focus states, reduced motion
6. **Performance consciente** — Lazy loading, skeletons, transiciones optimizadas

### 2.2 Estética

- **Dark mode base:** `#0B1120` background
- **Glassmorphism:** backdrop-blur, bordes semitransparentes, sombras sutiles
- **Acento primario:** cyan `#0891B2`
- **Acento secundario:** emerald `#059669`
- **Semántica:** danger, warning, success, info
- **Tipografía:** Inter (UI), JetBrains Mono (datos numéricos)
- **Radio:** escala 8px → 20px
- **Sombras:** incluye glow para acento primario

---

## 3. Sistema de diseño

### 3.1 Theme tokens (CSS variables)

Todos los tokens se definen en `@theme` dentro de `src/index.css`:

**Colores base:**
- `primary` → `#0891B2` (cyan)
- `primary-foreground` → `#FFFFFF`
- `accent` → `#059669` (emerald)
- `accent-foreground` → `#FFFFFF`
- `background` → `#0B1120`
- `foreground` → `#F8FAFC`

**Surface layers:**
- `surface` → `rgba(255, 255, 255, 0.03)`
- `surface-2` → `rgba(255, 255, 255, 0.06)`
- `surface-3` → `rgba(255, 255, 255, 0.09)`
- `surface-4` → `rgba(255, 255, 255, 0.12)`

**Text hierarchy:**
- `text` → `#F8FAFC` (primary text)
- `text-2` → `#CBD5E1` (secondary text)
- `text-3` → `#94A3B8` (tertiary/muted text)

**Bordes:**
- `border` → `rgba(255, 255, 255, 0.08)`
- `border-strong` → `rgba(255, 255, 255, 0.15)`

**Semánticos:**
- `danger` → `#EF4444`
- `danger-foreground` → `#FFFFFF`
- `warning` → `#F59E0B`
- `warning-foreground` → `#FFFFFF`
- `success` → `#10B981`
- `success-foreground` → `#FFFFFF`
- `info` → `#3B82F6`
- `info-foreground` → `#FFFFFF`

**Glass tokens:**
- `glass-bg` → `rgba(255, 255, 255, 0.03)`
- `glass-border` → `rgba(255, 255, 255, 0.08)`
- `glass-bg-hover` → `rgba(255, 255, 255, 0.06)`

**Focus & elevación:**
- `focus-ring` → `0 0 0 2px var(--primary)`
- `shadow-elevated` → `0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)`
- `shadow-glow` → `0 0 20px rgba(8, 145, 178, 0.3)`

**Layout tokens:**
- `sidebar-width` → `260px`
- `sidebar-collapsed-width` → `68px`
- `header-height` → `64px`

**Radius scale:**
- `radius-sm` → `6px`
- `radius` → `8px`
- `radius-md` → `10px`
- `radius-lg` → `12px`
- `radius-xl` → `16px`
- `radius-2xl` → `20px`

### 3.2 Utilidades CSS

```css
/* Glass effects */
.glass {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(12px);
}
.glass-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-elevated);
}
.glass-hover {
  transition: all 0.2s ease;
}
.glass-hover:hover {
  background: var(--glass-bg-hover);
  border-color: var(--border-strong);
}

/* Focus */
.focus-ring {
  outline: none;
  box-shadow: var(--focus-ring);
}
.focus-ring:focus-visible {
  box-shadow: var(--focus-ring);
}

/* Scrollbar */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: var(--text-3);
}

/* Animations */
@keyframes slide-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-slide-in {
  animation: slide-in 0.2s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in {
  animation: fade-in 0.15s ease-out;
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-scale-in {
  animation: scale-in 0.15s ease-out;
}
```

### 3.3 Reglas de uso

**Prohibido en componentes:**
- Hex values directos (`#0891B2`, `#0B1120`, etc.)
- `white/3`, `white/5`, `white/10` (usar tokens de surface)
- `text-emerald-400` (usar `accent`)
- `ml-[68px]`, `ml-[260px]` (usar CSS variables)
- Clases Tailwind inválidas (`border-l-3`)

**Obligatorio:**
- Usar tokens de `index.css` para todos los valores visuales
- Componentes UI para patrones repetitivos (no HTML crudo)
- Variantes semánticas en Badges, botones, alerts
- Skeleton/loading states en datos async
- `prefers-reduced-motion` respetado

---

## 4. Librería de componentes UI

### 4.1 Componentes existentes (mantener)

| Componente | Archivo | Estado |
|-----------|---------|--------|
| Card | `src/components/ui/Card.tsx` | ✅ Usar como base |
| Button | `src/components/ui/Button.tsx` | ✅ Ampliar variantes |
| Input | `src/components/ui/Input.tsx` | ✅ Usar como base para otros |
| Dialog | `src/components/ui/Dialog.tsx` | ✅ Mejorar max-width y animaciones |
| Toast | `src/components/ui/Toast.tsx` | ✅ Ampliar funcionalidad |
| Skeleton | `src/components/ui/Skeleton.tsx` | ✅ Agregar variantes |

### 4.2 Componentes nuevos (crear)

| Componente | Archivo | Responsabilidad |
|-----------|---------|-----------------|
| Textarea | `src/components/ui/Textarea.tsx` | Input multiline con resize control, char count |
| Select | `src/components/ui/Select.tsx` | Dropdown con search/filter, keyboard nav |
| Switch | `src/components/ui/Switch.tsx` | Toggle switch accesible |
| Badge | `src/components/ui/Badge.tsx` | Status indicators con variantes semánticas |
| Avatar | `src/components/ui/Avatar.tsx` | Avatar con fallback initials, status indicator |
| Tabs | `src/components/ui/Tabs.tsx` | Tab navigation con animaciones |
| Table | `src/components/ui/Table.tsx` | Data table con sorting, selection, row actions |
| Accordion | `src/components/ui/Accordion.tsx` | Collapsible sections para formularios |

### 4.3 Especificaciones de componentes nuevos

#### Textarea
- Props: `label`, `error`, `helperText`, `resize` (none|vertical|horizontal|both), `charCount`, `maxLength`
- Estados: default, focus, error, disabled
- Accesibilidad: `aria-describedby` para error/helper

#### Select
- Props: `label`, `error`, `placeholder`, `searchable`, `options` (array de `{value, label}`), `multiple`
- Estados: default, open, focus, error, disabled
- Accesibilidad: `role="listbox"`, keyboard nav (arrow keys, enter, escape)

#### Switch
- Props: `label`, `description`, `checked`, `onChange`, `disabled`
- Estados: unchecked, checked, disabled
- Accesibilidad: `role="switch"`, `aria-checked`

#### Badge
- Variantes: `primary`, `secondary`, `success`, `warning`, `danger`, `info`
- Tamaños: `sm` (text-xs), `md` (text-sm), `lg` (text-base)
- Props: `variant`, `size`, `dot` (bool), `children`
- Uso: status indicators, categorías, filtros activos

#### Avatar
- Props: `src`, `alt`, `fallback` (initials), `size` (sm|md|lg), `status` (online|offline|busy|null)
- Estados: image loaded, fallback, status indicator
- Fallback: gradient bg con iniciales

#### Tabs
- Variantes: `default` (línea inferior), `pills` (fondo redondeado), `underline` (línea superior)
- Props: `items` (array de `{id, label, content}`), `variant`, `defaultValue`
- Accesibilidad: `role="tablist"`, `role="tab"`, `role="tabpanel"`, keyboard nav

#### Table
- Props: `columns` (array de `{key, header, sortable, render}`), `data`, `loading`, `emptyMessage`, `rowActions`
- Características: sorting, row selection (checkboxes), row actions dropdown, empty state, skeleton rows
- Accesibilidad: `role="table"`, `role="row"`, `role="cell"`, `aria-sort`

#### Accordion
- Props: `items` (array de `{id, header, content, icon}`), `allowMultiple`, `defaultOpen`
- Características: animated expand/collapse, icon rotation, single/multiple open
- Accesibilidad: `aria-expanded`, `aria-controls`

---

## 5. Layout system

### 5.1 Sidebar (`src/components/layout/Sidebar.tsx`)

**Cambios:**
- Usar CSS variables `--sidebar-width` y `--sidebar-collapsed-width`
- Transiciones suaves para collapse/expand
- Mejorar accesibilidad: `aria-expanded`, `aria-controls`
- Mobile: drawer con overlay

**Estructura:**
```
Logo area (gradient badge)
├── Navigation sections
│   ├── Principal (Dashboard, Patients)
│   ├── Clínico (Anamnesis, History, Anthropometry, Analytics, Formula, ESPEN, Alerts, AI Scribe)
│   ├── Nutrición (Foods, Recipes, Meal Plans, Copilot, Journal)
│   ├── Negocio (Appointments, Invoices, Accounting, Calendar, Providers)
│   ├── Comunicación (Messages, Telehealth)
│   └── Configuración (Settings, Users, Onboarding, Automations, Integrations, Tenants, Reports)
└── User info area (bottom)
```

### 5.2 Header (`src/components/layout/Header.tsx`)

**Cambios:**
- `margin-left: var(--sidebar-width)` (eliminar hardcoded)
- Search input con botón de acción
- Notifications dropdown (click bell → popover con alertas recientes)
- User avatar dropdown (profile, settings, logout)
- Mobile hamburger button → abre sidebar drawer
- Height: `var(--header-height) = 64px`

### 5.3 Layout (`src/components/layout/Layout.tsx`)

**Cambios:**
- Mobile sidebar drawer con overlay
- Transiciones para sidebar collapse
- Content area con padding y scroll
- Responsive: sidebar hidden en mobile, toggle con hamburger

---

## 6. Patrones de página

### 6.1 Dashboard
- Grid 4-column KPIs con iconos gradient
- Cards de sección (appointments, patients, invoices)
- Charts con recharts (peso, IMC, adherencia)
- Tabla de pacientes recientes

### 6.2 Listas (Patients, Foods, Recipes, etc.)
- Tabla con columnas definidas
- Filtros arriba (search + dropdowns)
- Acciones por fila (edit, delete, view)
- Paginación
- Empty state y loading skeleton

### 6.3 Formularios (Anamnesis, Clinical History)
- Wizard/stepper para formularios largos
- Accordion para secciones
- Validación inline
- Auto-save indicator
- Progress bar

### 6.4 Detalle (Patient Detail)
- Breadcrumbs
- Tabs horizontales o verticales
- Cards de información
- Timeline de eventos

### 6.5 Calendario (Appointments)
- Week grid view
- Appointment chips con color por proveedor
- Filtros de proveedor
- Navegación semanal

---

## 7. Orden de implementación

### Fase 1: Diseño (sin tocar páginas)
1. Theme tokens consolidados en `index.css`
2. Utilidades CSS nuevas
3. Componentes UI base (Textarea, Select, Switch, Badge, Avatar)
4. Layout components refactorizados

### Fase 2: Componentes complejos
5. Tabs, Table, Accordion
6. Mejoras a Dialog, Toast, Skeleton

### Fase 3: Páginas core
7. Dashboard
8. Patients (lista + detalle)
9. Clinical (Anamnesis, History, Anthropometry)

### Fase 4: Páginas secundarias
10. Nutrition (Foods, Recipes, Meal Plans)
11. Business (Appointments, Invoices)
12. Settings, Messages, Auth

### Fase 5: Polish
13. Mobile responsive completo
14. PWA mejoras
15. Accessibility audit
16. Performance optimization

---

## 8. Criterios de éxito

- ✅ Todos los componentes usan tokens de diseño (cero hardcoded colors)
- ✅ Cero rutas huérfanas en sidebar
- ✅ Componentes UI reutilizables en todas las páginas
- ✅ Responsive mobile-first
- ✅ WCAG 2.1 AA compliance
- ✅ Lighthouse performance > 90
- ✅ TypeScript 0 errores
- ✅ Backend tests 38/38 passing
- ✅ Docker deployment funcional

---

## 9. Fuera de alcance

- Cambios en la lógica de negocio
- Modificaciones al backend
- Nuevas features o endpoints
- Cambios en el stack tecnológico

---

**Fin del spec.**
