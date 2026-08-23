---
name: Veridia HealthTech
description: Clinical nutrition ERP with a restorative, nature-inspired design language
colors:
  primary: "#4A7C59"
  primary-light: "#E8F5E9"
  primary-dark: "#2E5339"
  accent: "#059669"
  accent-light: "#ECFDF5"
  danger: "#DC2626"
  danger-light: "#FEF2F2"
  warning: "#D97706"
  warning-light: "#FFFBEB"
  success: "#059669"
  success-light: "#ECFDF5"
  info: "#2563EB"
  info-light: "#EFF6FF"
  bg: "#0B1120"
  surface: "#111827"
  surface-2: "#1E293B"
  surface-3: "#334155"
  text: "#F1F5F9"
  text-2: "#CBD5E1"
  text-3: "#94A3B8"
  border: "#334155"
  border-2: "#475569"
  glass-bg: "rgba(255, 255, 255, 0.06)"
  glass-border: "rgba(255, 255, 255, 0.1)"
  focus-ring: "rgba(74, 124, 89, 0.5)"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "normal"
  caption:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.02em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3rem"
  3xl: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  card:
    backgroundColor: "{colors.glass-bg}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
  badge-primary:
    backgroundColor: "rgba(74, 124, 89, 0.1)"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "0.25rem 0.75rem"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "0.625rem 0.75rem"
---

# Design System: Veridia HealthTech

## Overview

**Creative North Star: "The Restorative Sanctuary"**

Veridia HealthTech is a clinical nutrition ERP that lives at the intersection of healing and science. The design language embodies this duality: deep, calming surfaces that feel like a sanctuary — not a sterile clinic — while maintaining the precision and authority that clinical work demands. Every visual decision serves the patient outcome first.

The personality is warm authority: muted sage greens signal restoration and nature, soft glass surfaces create depth without distraction, and a restrained color palette lets critical clinical information rise to the surface. The system rejects cold medical aesthetics in favor of something more human — a space where nutritionists feel supported, not surveilled by their tools.

**Key Characteristics:**
- Restorative color palette rooted in sage greens and deep earth tones
- Soft glassmorphism with ambient depth, never flashy
- Typography that is confident but not aggressive — Inter with measured weight
- Components that feel soft, rounded, and assured — like a trusted colleague
- Dark mode default with luminous surfaces that breathe

## Colors

The palette is nature-derived and clinical-grade: sage greens for restoration, warm neutrals for grounding, and semantic signals (danger, warning, info) that cut through without shouting.

### Primary
- **Restorative Sage** (#4A7C59): The anchor color. Used for primary actions, active navigation states, focus rings, and brand moments. Signals healing, growth, and clinical credibility without sterility.
- **Sage Light** (#E8F5E9): Tinted background for primary badges, active table rows, and subtle highlights. Never used as text background on large surfaces.
- **Sage Dark** (#2E5339): Hover/active state for primary buttons. Provides depth feedback on interaction.

### Secondary
- **Clinical Emerald** (#059669): Success states, positive indicators, and nutritional health signals. Shares hue family with primary but higher saturation for emphasis.

### Semantic
- **Alert Red** (#DC2626): Danger, errors, critical alerts. Reserved for clinical warnings and destructive actions.
- **Caution Amber** (#D97706): Warnings, pending states, items needing attention. Warm enough to signal urgency without alarm.
- **Informational Blue** (#2563EB): Info states, links, neutral navigation accents. Cool counterpoint to the warm palette.

### Neutral
- **Deep Night** (#0B1120): The base background. Rich navy-black that makes glass surfaces glow.
- **Obsidian** (#111827): Primary surface color for cards, sidebar, header. Slightly lifted from base.
- **Slate Mid** (#1E293B): Secondary surfaces, hover states, table headers. Creates tonal hierarchy.
- **Slate Edge** (#334155): Borders, dividers, subtle structural lines. Low-contrast against dark surfaces.
- **Slate Bright** (#475569): Secondary borders, stronger dividers, active border states.
- **Cloud** (#F1F5F9): Primary text on dark surfaces. Maximum readability.
- **Mist** (#CBD5E1): Secondary text, descriptions, supporting content.
- **Fog** (#94A3B8): Tertiary text, placeholders, captions, timestamps.

### Glass
- **Glass Fill** (rgba(255, 255, 255, 0.06)): Semi-transparent white for card and panel backgrounds. Creates depth through layering.
- **Glass Edge** (rgba(255, 255, 255, 0.1)): Subtle border for glass surfaces. Defines edges without harsh lines.

### Named Rules
**The Restraint Rule.** The primary sage green is used on ≤15% of any given screen. Its rarity signals importance. When everything is green, nothing is.

**The Glass Layering Rule.** Depth is communicated through overlapping glass surfaces, not drop shadows. Shadows are ambient and diffuse, never hard-edged.

## Typography

**Display Font:** Inter (with system-ui fallback)
**Body Font:** Inter (with system-ui fallback)
**Mono Font:** JetBrains Mono (with Fira Code fallback)

**Character:** Inter is the workhorse — clean, geometric, and highly legible at all sizes. The weight range (400–700) provides clear hierarchy without needing a second typeface. The mono font is reserved for code, data, and clinical measurements.

### Hierarchy
- **Display** (700, clamp(2.25rem, 5vw, 3rem), 1.2): Page titles, hero headlines. Rare — used once per page maximum.
- **Headline** (600, 1.875rem, 1.25): Section headers, card titles. The primary structural heading.
- **Title** (600, 1.5rem, 1.33): Subsection headers, dialog titles, prominent labels.
- **Body** (400, 1rem, 1.5): Default text, descriptions, content. Max line length: 65–75ch for readability.
- **Label** (500, 0.875rem, 1.25): Form labels, button text, navigation items, badges. The workhorse of the component layer.
- **Caption** (500, 0.75rem, 1, 0.02em tracking): Timestamps, metadata, tertiary information. Always uppercase for section labels.

### Named Rules
**The Clinical Hierarchy Rule.** Every screen has exactly one Display element (the page title). Everything else descends through Headline → Title → Body → Label → Caption. No skipping levels.

## Layout

The layout follows a sidebar + header + content model: fixed sidebar (260px expanded, 68px collapsed), sticky header (64px), scrollable content area. On mobile (<768px), the sidebar becomes a slide-out drawer with overlay.

The spatial rhythm is 4px base unit, with spacing tokens at xs(4px), sm(8px), md(16px), lg(24px), xl(32px), 2xl(48px), 3xl(64px). Cards use 24px internal padding. Form fields use 12px vertical rhythm between labels and inputs.

Responsive behavior: sidebar collapses automatically on tablet, becomes drawer on mobile. Content area fills viewport width. Tables horizontal-scroll with snap. Forms stack vertically below 640px.

## Elevation & Depth

The system uses soft layered glass for depth: semi-transparent surfaces with backdrop-blur, stacked with subtle ambient shadows. No hard-edged drop shadows. Depth is primarily communicated through glass layering (overlapping semi-transparent panels) rather than dramatic shadow contrast.

### Shadow Vocabulary
- **Ambient Low** (`0 1px 3px rgba(0, 0, 0, 0.3)`): Subtle lift for small elements — badges, small cards, tooltips.
- **Ambient Mid** (`0 4px 12px rgba(0, 0, 0, 0.4)`): Cards, dropdowns, popovers. The standard depth signal.
- **Ambient High** (`0 12px 40px rgba(0, 0, 0, 0.5)`): Dialogs, modals, elevated panels. Clear separation from content.
- **Elevated** (`0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(74, 124, 89, 0.1)`): Primary dialogs, critical overlays. The sage glow adds brand presence to elevated surfaces.
- **Glow** (`0 0 20px rgba(74, 124, 89, 0.3)`): Focus rings, active primary buttons, success indicators. Luminous feedback.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only on hover, focus, or state elevation. The exception is glass cards, which always have a subtle ambient shadow to maintain their layered appearance.

## Shapes

The form language is soft and organic: generous corner radii (8px–24px), no sharp edges, no hard clips. The radius scale creates a clear hierarchy — small elements (badges, chips) at 8px, standard containers (cards, inputs) at 12px, large containers (dialogs, panels) at 16px, and prominent surfaces at 20–24px.

Buttons use medium radius (12px) for standard sizes, scaling to 16px for large. Inputs match at 12px. Cards are consistently 16px. Dialogs are the most generous at 16px (matching card standard). Full-radius (9999px) is reserved for badges and pills.

Borders are structural, not decorative: 1px solid in the border color family. No double borders, no dashed borders, no patterned borders. The glass border (rgba(255,255,255,0.1)) is the exception — translucent and ambient.

## Components

### Buttons
- **Shape:** Rounded with 12px radius (md), scaling to 16px (lg) for large variant
- **Primary:** Sage green background, white text, subtle glow shadow on hover. Padding: 8px 16px (sm), 8px 16px (md), 12px 24px (lg)
- **Hover / Focus:** Background deepens to sage dark, glow intensifies. Focus ring is 2px sage with 50% opacity.
- **Secondary:** Surface-2 background, text color, border in border color. Hover lifts to surface-3.
- **Ghost:** Transparent background, text color. Hover shows white/10 overlay. No border until focus.
- **Danger:** Red background, white text. Hover deepens to red-700.
- **Loading state:** Spinner replaces icon, button dims to 50% opacity.

### Chips / Badges
- **Style:** Full-radius pill (9999px), semi-transparent background matching variant color at 10% opacity, text in variant color, 1px border at 20% opacity.
- **States:** Always visible. Dot indicator (1.5px circle) optional for status badges. Three sizes: sm (12px text, 6px padding), md (14px text, 8px padding), lg (16px text, 10px padding).

### Cards / Containers
- **Corner Style:** 16px radius (lg)
- **Background:** Glass fill (rgba(255,255,255,0.06)) with backdrop-blur 12px
- **Shadow Strategy:** Ambient mid shadow by default. Elevate to ambient high on hover or focus.
- **Border:** 1px glass border (rgba(255,255,255,0.1))
- **Internal Padding:** 24px (lg) standard, 16px (md) compact

### Inputs / Fields
- **Style:** Surface background, 1px border in border color, 12px radius. Height: 40px standard, 48px on touch devices.
- **Focus:** Border shifts to primary color, 2px ring at 40% opacity appears with 2px offset.
- **Error:** Border shifts to danger color, ring at 40% opacity. Error text in danger color below field.
- **Disabled:** 50% opacity, cursor not-allowed.

### Navigation (Sidebar)
- **Style:** Fixed left panel, surface background, 260px expanded / 68px collapsed. Section labels in caption style (10px, uppercase, wide tracking). Nav items use label style (14px).
- **Default:** Text in mist color, no background.
- **Hover:** Text brightens to cloud, white/5 background overlay.
- **Active:** Primary color text, primary/10 background. Left border accent.
- **Mobile:** Slide-out drawer with black/50 overlay backdrop.

### Dialogs / Modals
- **Shape:** 16px radius, ambient high shadow, glass-like surface background.
- **Overlay:** Black/60 with backdrop-blur-sm.
- **Header:** Title in headline style, description in mist below. Close button in top-right.
- **Body:** Scrollable content area, 24px padding.
- **Animation:** Scale-in on open (0.95 → 1), fade-in on overlay.

### Tables
- **Style:** Surface background, 12px radius, 1px border. Header row in surface-2.
- **Header:** Caption style (12px, uppercase, wide tracking), fog color.
- **Rows:** Body text in cloud color. Hover shows white/3 overlay.
- **Selected rows:** Primary/5 background.
- **Actions column:** Kebab menu (3-dot icon) triggers slide-in action panel.

## Do's and Don'ts

### Do:
- **Do** use the sage green sparingly — it is the brand signal and should feel precious, not abundant.
- **Do** layer glass surfaces for depth — overlapping semi-transparent panels create the sanctuary feel.
- **Do** use the full radius scale — small elements small radius, large elements large radius. Consistency builds trust.
- **Do** respect the clinical hierarchy — Display → Headline → Title → Body → Label → Caption, every time.
- **Do** provide clear focus rings on all interactive elements — the sage glow is the brand's way of saying "I see you."
- **Do** use semantic colors (danger, warning, success) consistently — clinical users rely on these signals for patient safety.

### Don't:
- **Don't** use primary green for large backgrounds — it loses its meaning when overused.
- **Don't** add hard-edged shadows — the glass layering system handles depth.
- **Don't** use decorative borders — structural borders only, and always 1px.
- **Don't** skip the focus ring — accessibility is non-negotiable in clinical software.
- **Don't** use all-caps text outside of section labels — it's reserved for structural hierarchy markers.
- **Don't** mix glass and solid surfaces arbitrarily — glass is for cards/panels, solid is for base surfaces.
