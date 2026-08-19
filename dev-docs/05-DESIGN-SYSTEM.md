# Design System — CSS & Visual Language

## Brand Colors
```css
--primary: #2E8B57;        /* Veridia Green */
--primary-light: #E8F5EE;
--primary-dark: #1D6B3F;
--primary-glow: rgba(46,139,87,.12);
--accent: #1A8A8A;         /* Teal */
--accent-light: #E6F5F5;
```

## Typography
- **Font**: Inter (Google Fonts), system-ui fallback
- **Weights**: 300-900 (mostly 600-800 for UI)
- **Base size**: 14px (`html { font-size: 14px }`)

## Layout System
- **App**: `display: flex; height: 100vh`
- **Sidebar**: 200px width, collapsible
- **Content**: `padding: 28px 32px`, scrollable
- **Header**: 56px height, sticky

## Component Classes
| Class | Purpose |
|---|---|
| `.card` | Surface container, `border-radius: 20px`, hover lift |
| `.card-header` | Flex header with title + actions |
| `.card-title` | Bold title text |
| `.card-body` | Content padding 22px |
| `.stat-card` | KPI card with icon + number |
| `.btn` | Base button |
| `.btn-primary` | Green primary |
| `.btn-outline` | Border only |
| `.btn-ghost` | Transparent |
| `.btn-sm/.btn-xs` | Smaller variants |
| `.badge` | Inline tag/pill |
| `.pill-tabs` | Tab navigation group |
| `.pill-tab` | Individual tab (rounded) |
| `.data-list` | Key-value list |
| `.clinical-alert` | Alert card with border-left |
| `.grid-23` | 2fr/1fr grid |
| `.grid-auto` | Auto-fit grid |
| `.fade-in` | Entry animation |

## Responsive Breakpoints (4-tier)
| Tier | Width | Target |
|---|---|---|
| T1 Desktop | >1200px | Full layout |
| T2 Laptop | 901-1200px | Compact sidebar |
| T3 iPad | 601-900px | Collapsed sidebar, single column |
| T4 Phone | ≤600px | Mobile-first, bottom nav |

## Hero Header Pattern (used across all modules)
```javascript
+'<div class="card" style="border:none;background:linear-gradient(135deg,#color1,#color2,#color3);color:#fff;margin-bottom:22px;border-radius:var(--radius);overflow:hidden;position:relative">'
+'<div style="position:absolute;top:-30px;right:-20px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.05)"></div>'
+'<div class="card-body" style="padding:22px 28px;position:relative;z-index:1">'
// Content: icon + title + subtitle + action buttons
```

Each module uses a unique gradient:
- Dashboard: `#1a3a2a → #2E8B57 → #1A8A8A` (green)
- Agenda: `#1a2a3a → #2563eb → #1A8A8A` (blue)
- Pacientes: `#1a2a3a → #1A8A8A → #2E8B57` (teal)
- Facturación: `#1a2a3a → #0891b2 → #1A8A8A` (cyan)
- Contabilidad: `#1a2a3a → #7c3aed → #6366f1` (purple)
- Recetas: `#7f1d1d → #b45309 → #d97706` (amber)
- Mermas: `#7f1d1d → #dc2626 → #ea580c` (red)
- APPCC: `#1a3a2a → #2E8B57 → #1A8A8A` (green hero)
- Settings: `#1a2a3a → #374151 → #4b5563` (gray)

## KPI Card Pattern
```javascript
+'<div class="card" style="padding:16px;text-align:center;border-top:3px solid COLOR">'
+'<div style="font-size:1.5rem;font-weight:800;color:COLOR">VALUE</div>'
+'<div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">LABEL</div>'
+'</div>'
```

## Form Label Pattern
```javascript
+'<label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">LABEL</label>'
```

## Table Header Pattern
```javascript
+'<th style="padding:10px 14px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">HEADER</th>'
```

## Dark Mode
- Toggle via `toggleDarkMode()`
- Uses `body.dark-mode` class
- CSS variables swap for dark values
