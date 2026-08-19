# Veridia Frontend Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remodelación completa del sistema de diseño y UI del frontend Veridia bajo un Design System First approach

**Architecture:** Design tokens consolidados en index.css + componentes UI base ampliados + refactor de layout + rediseño página por página manteniendo la pila tecnológica existente

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui + React Hook Form + Zod + TanStack Query + Zustand + recharts + lucide-react

**Spec:** docs/superpowers/specs/2026-08-18-frontend-redesign-design.md

## Global Constraints

- React 18 + TypeScript + Vite + Tailwind CSS v4
- NO agregar dependencias nuevas
- Usar EXCLUSIVAMENTE tokens de diseño de index.css
- Mantener glassmorphism dark theme existente
- Accesibilidad WCAG 2.1 AA por defecto
- Componentes como primitivas reutilizables
- Respaldar `prefers-reduced-motion`
- No modificar lógica de negocio ni backend

---

## Fase 1: Sistema de Diseño (Wave 1)

### Task 1: Theme Tokens Consolidation

**Files:**
- Create: N/A
- Modify: `veridia-app/src/index.css`
- Test: `veridia-app/src/index.css` (visual verification)

**Interfaces:**
- Consumes: N/A
- Produces: Design tokens consolidados en `@theme` block

- [ ] **Step 1: Audit current index.css**

Read `src/index.css` completely. Document:
1. Current `@theme` block contents
2. Existing CSS utility classes
3. Any hardcoded values in the file itself
4. Missing tokens identified in spec (glass-border, glass-bg, focus-ring, shadow-elevated, layout tokens)

Expected: Complete inventory of current state

- [ ] **Step 2: Update @theme block**

Add all missing tokens to `@theme` block in `index.css`:

```css
@theme {
  /* ... existing tokens ... */
  
  /* Glass tokens */
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-bg-hover: rgba(255, 255, 255, 0.06);
  
  /* Focus & elevation */
  --focus-ring: 0 0 0 2px var(--primary);
  --shadow-elevated: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
  
  /* Layout tokens */
  --sidebar-width: 260px;
  --sidebar-collapsed-width: 68px;
  --header-height: 64px;
  
  /* Extended radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
}
```

Run: `npx tailwindcss -i src/index.css -o /dev/null` (or equivalent validation)
Expected: No errors, all tokens recognized

- [ ] **Step 3: Add CSS utility classes**

Add to `index.css` after theme block:

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

Verify: All classes are present and syntactically correct

- [ ] **Step 4: Verify existing patterns**

Check that:
1. Existing `.glass`, `.glass-card`, `.text-gradient`, `.glow-border` classes still work
2. `prefers-reduced-motion` media query is present and disables animations
3. `:focus-visible` styling uses primary color
4. No conflicting class names

Run: Visual check in browser
Expected: Existing glassmorphism effects unchanged

- [ ] **Step 5: Commit**

```bash
git add veridia-app/src/index.css
git commit -m "design: consolidate theme tokens and add CSS utilities

- Add glass-bg, glass-border, glass-bg-hover tokens
- Add focus-ring, shadow-elevated tokens
- Add layout tokens (sidebar-width, header-height)
- Add .glass-hover, .focus-ring, .scrollbar-thin utilities
- Add animation utilities (slide-in, fade-in, scale-in)
- Verify existing glassmorphism patterns preserved"
```

---

### Task 2: Core UI Components (Base)

**Files:**
- Create: `veridia-app/src/components/ui/Textarea.tsx`
- Create: `veridia-app/src/components/ui/Select.tsx`
- Create: `veridia-app/src/components/ui/Switch.tsx`
- Create: `veridia-app/src/components/ui/Badge.tsx`
- Create: `veridia-app/src/components/ui/Avatar.tsx`
- Test: Component-level tests (if test framework exists)

**Interfaces:**
- Consumes: Design tokens from index.css, patterns from existing Input/Button
- Produces: Reusable base components for use across all pages

- [ ] **Step 1: Create Textarea.tsx**

```tsx
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  charCount?: number;
  maxLength?: number;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  resize = 'vertical',
  charCount,
  maxLength,
  className,
  id,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`
          w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text
          placeholder:text-text-3
          focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
          ${className || ''}
        `}
        style={{ resize }}
        maxLength={maxLength}
        {...props}
      />
      <div className="flex justify-between text-xs text-text-3">
        {helperText && <span>{helperText}</span>}
        {charCount !== undefined && maxLength && (
          <span>{charCount}/{maxLength}</span>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
};
```

Verify: Component renders, accepts all props, shows error state

- [ ] **Step 2: Create Select.tsx**

Create a fully accessible Select component with:
- Label, error state, placeholder
- Searchable option for long lists
- Keyboard navigation (arrow keys, enter, escape)
- `role="listbox"` and `aria` attributes

Key implementation details:
- Use `useState` for open/close state
- Use `useRef` for dropdown ref and search input
- Filter options based on search query when `searchable`
- Close on escape or click outside
- Highlight selected option

Verify: Component opens, filters, selects, keyboard nav works

- [ ] **Step 3: Create Switch.tsx**

```tsx
import React from 'react';

interface SwitchProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full
        transition-colors duration-200 ease-in-out
        ${checked ? 'bg-primary' : 'bg-surface-3'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white
          transition-transform duration-200 ease-in-out
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
      {(label || description) && (
        <div className="ml-3">
          {label && <span className="text-sm font-medium text-text">{label}</span>}
          {description && <p className="text-xs text-text-3">{description}</p>}
        </div>
      )}
    </button>
  );
};
```

Verify: Switch toggles, shows checked state, disabled works

- [ ] **Step 4: Create Badge.tsx**

```tsx
import React from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-surface-3 text-text-2 border-border',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  info: 'bg-info/10 text-info border-info/20',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-2.5 py-1.5',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  dot = false,
  children,
  className = ''
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
};
```

Verify: All variants render correctly, sizes work, dot shows

- [ ] **Step 5: Create Avatar.tsx**

```tsx
import React from 'react';

type AvatarSize = 'sm' | 'md' | 'lg';
type AvatarStatus = 'online' | 'offline' | 'busy' | null;

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

const statusColors: Record<NonNullable<AvatarStatus>, string> = {
  online: 'bg-success',
  offline: 'bg-text-3',
  busy: 'bg-danger',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  fallback,
  size = 'md',
  status,
  className = ''
}) => {
  const [imageError, setImageError] = React.useState(false);
  
  const showFallback = !src || imageError;
  
  return (
    <div className={`relative inline-flex ${className}`}>
      {showFallback ? (
        <div
          className={`
            ${sizeClasses[size]}
            inline-flex items-center justify-center rounded-full
            bg-gradient-to-br from-primary to-accent text-white font-semibold
          `}
        >
          {fallback || alt.charAt(0).toUpperCase()}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${sizeClasses[size]} rounded-full object-cover`}
          onError={() => setImageError(true)}
        />
      )}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background
            ${statusColors[status]}
          `}
        />
      )}
    </div>
  );
};
```

Verify: Image loads, fallback shows initials, status indicator appears

- [ ] **Step 6: Test components together**

Create a temporary test page or story file to verify:
1. All components render without errors
2. Props work as expected
3. Styles apply correctly
4. No TypeScript errors

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add veridia-app/src/components/ui/Textarea.tsx \
      veridia-app/src/components/ui/Select.tsx \
      veridia-app/src/components/ui/Switch.tsx \
      veridia-app/src/components/ui/Badge.tsx \
      veridia-app/src/components/ui/Avatar.tsx
git commit -m "feat(ui): add Textarea, Select, Switch, Badge, Avatar components

- Textarea: multiline input with resize control and char count
- Select: accessible dropdown with search/filter
- Switch: toggle switch with label and description
- Badge: semantic status badges with dot indicator
- Avatar: user avatar with fallback initials and status
- All use design tokens from index.css"
```

---

### Task 3: Layout Components Refactor

**Files:**
- Modify: `veridia-app/src/components/layout/Sidebar.tsx`
- Modify: `veridia-app/src/components/layout/Header.tsx`
- Modify: `veridia-app/src/components/layout/Layout.tsx`
- Test: Visual verification in browser

**Interfaces:**
- Consumes: Design tokens (sidebar-width, sidebar-collapsed-width, header-height)
- Produces: Refactored layout with CSS variables and mobile support

- [ ] **Step 1: Refactor Sidebar.tsx**

Changes to make:
1. Replace hardcoded `260px` / `68px` with CSS variables
2. Add transition for collapse/expand
3. Add `aria-expanded` and `aria-controls` attributes
4. Ensure mobile drawer mode works

Key changes:
- Width: `var(--sidebar-width)` when expanded, `var(--sidebar-collapsed-width)` when collapsed
- Transition: `transition-all duration-300 ease-in-out`
- Mobile: `fixed inset-y-0 left-0 z-50` with overlay

Verify: Sidebar collapses/expands smoothly, mobile drawer works

- [ ] **Step 2: Refactor Header.tsx**

Changes to make:
1. Replace `ml-[68px]` / `ml-[260px]` with `ml-[var(--sidebar-width)]`
2. Add search action button
3. Add notifications dropdown popover
4. Add user avatar dropdown
5. Add mobile hamburger button

Key implementation:
- Notifications: click bell → show dropdown with recent alerts list
- User menu: click avatar → show dropdown with profile/settings/logout
- Mobile: hamburger button toggles sidebar drawer

Verify: Header adjusts to sidebar, dropdowns work, mobile menu opens

- [ ] **Step 3: Refactor Layout.tsx**

Changes to make:
1. Add mobile sidebar state management
2. Add overlay for mobile sidebar
3. Ensure content area adjusts properly
4. Add transition animations

Key implementation:
- Use `useState` for mobile sidebar open/close
- Overlay: fixed inset-0 bg-black/50 backdrop-blur-sm
- Content: `ml-0 md:ml-[var(--sidebar-width)]` with transition
- Close sidebar on route change in mobile

Verify: Mobile sidebar opens/closes, overlay works, content adjusts

- [ ] **Step 4: Verify responsive behavior**

Test at breakpoints:
- Mobile (< 768px): sidebar hidden, hamburger menu
- Tablet (768px - 1024px): sidebar collapsed by default
- Desktop (> 1024px): sidebar expanded by default

Run: Manual browser test at different viewport sizes
Expected: Layout adapts correctly at all breakpoints

- [ ] **Step 5: Commit**

```bash
git add veridia-app/src/components/layout/Sidebar.tsx \
      veridia-app/src/components/layout/Header.tsx \
      veridia-app/src/components/layout/Layout.tsx
git commit -m "refactor(layout): use CSS variables and add mobile support

- Sidebar: CSS variables for width, transitions, mobile drawer
- Header: CSS variable margin, notifications dropdown, user menu, mobile toggle
- Layout: mobile sidebar state, overlay, responsive transitions"
```

---

## Fase 2: Componentes Complejos (Wave 2)

### Task 4: Advanced UI Components

**Files:**
- Create: `veridia-app/src/components/ui/Tabs.tsx`
- Create: `veridia-app/src/components/ui/Table.tsx`
- Create: `veridia-app/src/components/ui/Accordion.tsx`
- Modify: `veridia-app/src/components/ui/Dialog.tsx` (improve max-width, add animations)
- Modify: `veridia-app/src/components/ui/Toast.tsx` (add pauseOnHover, dismissAll)
- Modify: `veridia-app/src/components/ui/Skeleton.tsx` (add card, table-row variants)
- Test: Component-level tests

**Interfaces:**
- Consumes: Design tokens, base components (Badge, Avatar)
- Produces: Advanced components for complex pages

- [ ] **Step 1: Create Tabs.tsx**

Implement with:
- Variants: default (underline), pills, underlined
- Animated active indicator
- Keyboard navigation (arrow keys)
- `role="tablist"`, `role="tab"`, `role="tabpanel"`

- [ ] **Step 2: Create Table.tsx**

Implement with:
- Columns definition with sortable flag
- Row selection with checkboxes
- Row actions dropdown
- Empty state component
- Loading skeleton rows
- `role="table"`, `aria-sort`

- [ ] **Step 3: Create Accordion.tsx**

Implement with:
- Single or multiple open mode
- Animated expand/collapse (max-height transition)
- Icon rotation
- `aria-expanded`, `aria-controls`

- [ ] **Step 4: Improve Dialog.tsx**

Add:
- Animation (fade-in + scale-in)
- Flexible max-width (use `max-w-*` classes)
- Better focus trap
- Scroll lock improvement

- [ ] **Step 5: Improve Toast.tsx**

Add:
- `pauseOnHover` functionality
- `dismissAll` method
- Better stacking/z-index
- Progress bar for auto-dismiss

- [ ] **Step 6: Improve Skeleton.tsx**

Add presets:
- `SkeletonCard` - card-shaped skeleton
- `SkeletonTableRow` - table row skeleton
- `SkeletonList` - list item skeleton

- [ ] **Step 7: Commit**

```bash
git add veridia-app/src/components/ui/Tabs.tsx \
      veridia-app/src/components/ui/Table.tsx \
      veridia-app/src/components/ui/Accordion.tsx
git commit -m "feat(ui): add Tabs, Table, Accordion and improve existing components

- Tabs: horizontal tabs with variants and keyboard nav
- Table: data table with sorting, selection, row actions
- Accordion: collapsible sections with animations
- Dialog: animations and flexible sizing
- Toast: pauseOnHover, dismissAll
- Skeleton: card, table-row, list presets"
```

---

## Fase 3: Páginas Core (Wave 3)

### Task 5: Dashboard Redesign

**Files:**
- Modify: `veridia-app/src/features/dashboard/DashboardPage.tsx`
- Test: Visual verification

**Interfaces:**
- Consumes: Card, Badge, Skeleton, Table, Tabs (from previous tasks)
- Produces: Redesigned dashboard page

**Changes:**
1. Use Badge component for status indicators
2. Use Table component for recent patients list
3. Add skeleton loading states for all async data
4. Standardize KPI cards with consistent structure
5. Fix semantic icon usage (TrendingUp → Invoice for pending invoices)
6. Add time-based greeting logic

- [ ] **Step 1: Update imports and component structure**
- [ ] **Step 2: Replace inline badges with Badge component**
- [ ] **Step 3: Replace patient list with Table component**
- [ ] **Step 4: Add skeleton loading states**
- [ ] **Step 5: Fix semantic issues (icons, greetings)**
- [ ] **Step 6: Verify visual consistency**
- [ ] **Step 7: Commit**

```bash
git commit -m "redesign(dashboard): apply design system tokens and components

- Use Badge for status indicators
- Use Table for recent patients
- Add skeleton loading states
- Fix semantic icon usage
- Add time-based greeting"
```

---

### Task 6: Patients Pages Redesign

**Files:**
- Modify: `veridia-app/src/features/patients/PatientsPage.tsx`
- Modify: `veridia-app/src/features/patients/PatientDetailPage.tsx`
- Modify: `veridia-app/src/features/patients/ClinicalHistoryPage.tsx`
- Modify: `veridia-app/src/features/patients/AnthropometryPage.tsx`
- Modify: `veridia-app/src/features/patients/AnalyticsPage.tsx`
- Test: Visual verification

**Changes:**
1. Use Table component with row actions
2. Add proper search debounce
3. Use Badge for status (active/inactive)
4. Use Avatar component for patient avatars
5. Standardize card patterns
6. Add loading skeletons

- [ ] **Step 1: PatientsPage - table and filters**
- [ ] **Step 2: PatientDetailPage - tabs and info cards**
- [ ] **Step 3: ClinicalHistoryPage - accordion for sections**
- [ ] **Step 4: AnthropometryPage - form standardization**
- [ ] **Step 5: AnalyticsPage - chart consistency**
- [ ] **Step 6: Commit**

```bash
git commit -m "redesign(patients): apply design system across patient pages

- PatientsPage: Table component with row actions
- PatientDetailPage: Tabs for navigation
- ClinicalHistoryPage: Accordion for sections
- AnthropometryPage: standardized form fields
- AnalyticsPage: consistent chart styling"
```

---

### Task 7: Clinical Pages Redesign

**Files:**
- Modify: `veridia-app/src/features/clinical/AnamnesisPage.tsx`
- Modify: `veridia-app/src/features/clinical/FormulaPage.tsx`
- Modify: `veridia-app/src/features/clinical/EspenPage.tsx`
- Modify: `veridia-app/src/features/clinical/AlertsPage.tsx`
- Test: Visual verification

**Changes:**
1. Replace raw textarea/select with Textarea/Select components
2. Use Accordion for form sections
3. Add progress indicator
4. Standardize error states (use AlertTriangle → XCircle for errors)
5. Add auto-save indicator

- [ ] **Step 1: AnamnesisPage - form components and accordion**
- [ ] **Step 2: FormulaPage - input standardization**
- [ ] **Step 3: EspenPage - layout consistency**
- [ ] **Step 4: AlertsPage - badge usage and table**
- [ ] **Step 5: Commit**

```bash
git commit -m "redesign(clinical): standardize forms and components

- Anamnesis: Textarea, Select, Accordion components
- Formula: standardized inputs
- Espen: consistent card layout
- Alerts: Badge and Table components"
```

---

## Fase 4: Páginas Secundarias (Wave 4)

### Task 8: Nutrition + Business Pages

**Files:**
- Modify: `veridia-app/src/features/nutrition/FoodsPage.tsx`
- Modify: `veridia-app/src/features/nutrition/RecipesPage.tsx`
- Modify: `veridia-app/src/features/nutrition/MealPlansPage.tsx`
- Modify: `veridia-app/src/features/nutrition/CopilotPage.tsx`
- Modify: `veridia-app/src/features/business/AppointmentsPage.tsx`
- Modify: `veridia-app/src/features/business/InvoicesPage.tsx`
- Modify: `veridia-app/src/features/business/AccountingPage.tsx`
- Test: Visual verification

**Changes:**
1. Replace emerald hardcoded with accent token
2. Fix `border-l-3` invalid class
3. Use Select component for filters
4. Use Table for data display
5. Standardize appointment chips with theme colors

- [ ] **Step 1: Nutrition pages - table and token fixes**
- [ ] **Step 2: Business pages - calendar and invoices**
- [ ] **Step 3: Commit**

```bash
git commit -m "redesign(nutrition, business): standardize tables and fix tokens

- Foods: use accent token instead of emerald
- Appointments: fix border-l-3, use Select for filters
- Invoices: Table component with row actions
- Accounting: consistent card patterns"
```

---

### Task 9: Settings + Messages + Auth

**Files:**
- Modify: `veridia-app/src/features/settings/SettingsPage.tsx`
- Modify: `veridia-app/src/features/messages/MessagesPage.tsx`
- Modify: `veridia-app/src/features/auth/LoginPage.tsx`
- Test: Visual verification

**Changes:**
1. Replace raw inputs with Input/Textarea components
2. Use Switch for toggles
3. Use Dialog for password/delete dialogs
4. Standardize button patterns

- [ ] **Step 1: SettingsPage - form components and dialogs**
- [ ] **Step 2: MessagesPage - chat UI consistency**
- [ ] **Step 3: LoginPage - form standardization**
- [ ] **Step 4: Commit**

```bash
git commit -m "redesign(settings, messages, auth): standardize forms

- Settings: Input, Switch, Dialog components
- Messages: consistent chat UI
- Login: standardized form layout"
```

---

## Fase 5: Polish y Deploy (Wave 5)

### Task 10: Mobile Responsive + PWA + Accessibility

**Files:**
- Modify: All feature pages (responsive fixes)
- Modify: `veridia-app/src/components/layout/*` (mobile polish)
- Modify: `veridia-app/public/manifest.json` (PWA)
- Test: Lighthouse audit, accessibility audit

**Changes:**
1. Ensure all pages work at 375px width
2. Add touch targets (min 44px)
3. PWA manifest improvements
4. Accessibility audit (ARIA, keyboard nav, contrast)
5. Performance optimization (lazy loading, image optimization)

- [ ] **Step 1: Mobile responsive fixes across all pages**
- [ ] **Step 2: PWA manifest and service worker polish**
- [ ] **Step 3: Accessibility audit and fixes**
- [ ] **Step 4: Performance optimization**
- [ ] **Step 5: Commit**

```bash
git commit -m "feat: mobile responsive, PWA polish, accessibility audit

- All pages responsive at 375px
- Touch targets >= 44px
- PWA manifest improvements
- WCAG 2.1 AA compliance
- Performance optimizations"
```

---

### Task 11: Docker Deployment

**Files:**
- Modify: `Dockerfile` (frontend)
- Modify: `docker-compose.yml` (if needed)
- Test: Build and run Docker containers

**Steps:**
1. Build frontend Docker image
2. Test docker-compose up
3. Verify frontend serves correctly
4. Verify API connectivity

```bash
# Build
docker build -t veridia-frontend ./veridia-app

# Run
docker-compose up -d

# Verify
curl http://localhost:5173
```

- [ ] **Step 1: Update Dockerfile for production build**
- [ ] **Step 2: Update docker-compose.yml**
- [ ] **Step 3: Build and test**
- [ ] **Step 4: Commit**

```bash
git commit -m "chore: Docker deployment for redesigned frontend

- Production-optimized Dockerfile
- docker-compose configuration
- Verified deployment"
```

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-08-18-frontend-redesign.md`.**

Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
