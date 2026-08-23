# Shape Brief: Full ERP Rebrand — Restorative Sanctuary

## 1. Job and Audience

**Who arrives:** Nutricionistas clínicos (primary), secretarias, admins, and SuperAdmin using Veridia HealthTech daily.

**Context and state of mind:** They are mid-workflow — managing patients, reviewing clinical data, coordinating appointments, or processing invoices. They need to move fast, scan quickly, and trust that the system supports (not distracts from) their clinical decisions.

**Visitor mode:** Operate. Every screen is a task surface. The interface must get out of the way and let the work speak.

## 2. Outcome and Proof

**Primary task:** Complete the full visual rebrand from the incumbent cyan/teal palette to the new Restorative Sanctuary world (sage green, soft glass, nature-derived) across all 31 modules and 20+ routes.

**Success looks like:** A nutritionist opens the app and feels the warmth and calm of the new palette without losing any clinical precision. Every component, every page, every state reflects the new DESIGN.md tokens. The rebrand is invisible to the user — it just feels right.

**Product-specific truth:** This is clinical software. The rebrand must never compromise scanability, hierarchy, or the speed at which a professional can find critical information. Sage green is a brand signal, not a decoration.

## 3. Selected Direction

**Visual authority:** DESIGN.md — "The Restorative Sanctuary" world. Sage green (#4A7C59) primary, deep night (#0B1120) background, soft glass layering, Inter typography. All tokens and named rules are established.

**Structural thesis:** Bottom-up implementation — tokens first, then components, then pages. This ensures consistency propagates correctly and avoids rework.

**Implementation sequence:**
1. **Tokens** — Update `index.css` theme with new sage palette, shadow vocabulary, motion tokens
2. **Core components** — Button, Card, Input, Badge, Table, Dialog, Avatar, Switch, Select, Textarea, Skeleton
3. **Layout shell** — Sidebar navigation, Header, Layout wrapper
4. **Auth** — Login page, auth flow screens
5. **Dashboard** — KPIs, charts, widgets, alerts
6. **Patient management** — Patient list, patient detail, clinical history
7. **Clinical modules** — Anamnesis, anthropometry, analytics, formula, ESPEN, alerts, care process
8. **Nutrition modules** — Foods, recipes, meal plans, AI copilot, journal
9. **Business modules** — Appointments, invoices, accounting, reports
10. **Settings & admin** — Settings, integrations, onboarding, tenants, notifications

## 4. Scope and Boundaries

**Fidelity:** Production-ready. Every component must work, not just look correct.

**Breadth:** All 20+ routes, all module pages, all UI components. No screen is out of scope.

**Interactivity:** Full. All states — default, hover, focus, active, loading, empty, error, disabled — must reflect the new tokens.

**What remains untouched:**
- Clinical content & data structures (patient records, medical terminology, functional behavior)
- Route structure and URL patterns
- Form interaction patterns and wizard flows
- i18n strings and translation keys

**Anti-goals:**
- Do NOT change any clinical data display logic
- Do NOT alter route structure or navigation flow
- Do NOT modify form submission behavior or validation logic
- Do NOT touch API calls, data fetching, or state management

## 5. States and Ranges

**Content ranges:**
- Patient lists: 0 patients (empty), 1-20 (typical), 100+ (scroll)
- Clinical history tabs: 10 tabs, each with varying data density
- Dashboard: 0 alerts (clean), 1-5 (typical), 10+ (overflow)
- Tables: 0 rows (empty state), 5-50 (typical), 100+ (pagination/scroll)

**Material states to rebrand:**
- Empty states (no data, no results, no patients)
- Loading states (skeletons, spinners)
- Error states (form validation, API errors, network offline)
- Success states (saved, created, updated)
- Disabled states (insufficient permissions, locked records)
- Active/selected states (nav items, table rows, tabs)

## 6. Interaction and Layout

**Layout topology:** Sidebar (260px / 68px collapsed) + Header (64px sticky) + Content (scrollable). Mobile: sidebar becomes drawer.

**Navigation hierarchy:** 6 sections (Principal, Clínico, Nutrición, Configuración, Negocio, Calidad) with 20+ items. Section labels in caption style, items in label style.

**Responsive breakpoints:** sm(640px), md(768px), lg(1024px), xl(1280px). Sidebar collapses at md, drawer at <md.

**Key transitions:**
- Sidebar collapse/expand: 300ms ease
- Page transitions: slide-in 200ms ease-out
- Dialog open/close: scale-in 150ms, fade overlay 150ms
- Hover states: 200ms ease
- Focus rings: instant, sage glow

**Feedback patterns:**
- Primary actions: sage green button with glow on hover
- Destructive actions: red button, confirmation dialog
- Success: emerald badge + toast notification
- Warning: amber badge + inline warning
- Error: red border on field + error text below

## 7. Constraints and Open Decisions

**Platform:** Web (React 19 + TypeScript + Vite + Tailwind CSS v4)

**Delivery:** Must work with existing build system (Vite). No new dependencies for the rebrand itself.

**Accessibility:** Focus rings mandatory on all interactive elements. Minimum 44px touch targets on coarse pointers. Semantic HTML. ARIA labels on interactive elements.

**Localization:** ES/EN/PT. All new component text must use i18n keys, not hardcoded strings.

**Reusable components:** All 12 existing shadcn/ui-style components in `veridia-app/src/components/ui/` must be rebranded. New components only if a clear gap emerges.

**Open decisions:**
- Logo treatment: current gradient logo (cyan→green) needs rebrand to match sage palette
- Chart colors: recharts visualizations need new color assignments
- Icon palette: Lucide icons — no color change needed, but ensure stroke weights feel consistent with new softness
