# Quick Start Guide for Developers

## Prerequisites
- Node.js 18+
- npm 8+
- Git

## Setup
```bash
git clone <repo-url>
cd veridia-healthtech
npm install

# Run tests
npm test          # 281 unit tests
npm run test:e2e  # 62 E2E tests

# Build deploy file
npm run build     # → portal-profesional-deploy.html

# Start backend (optional)
npm start         # Express on port 3456
```

## Development
- Edit files directly — no build step needed for development
- Open `portal-profesional.html` in browser
- Login: `nutri@veridia.tech` / `nutri123`
- Demo data loads automatically on first login

## Key Development Rules
1. **Never do global regex** on parentheses/syntax in large files — use surgical edits
2. **Currency is EUR (€)** by default, but 9 currencies supported
3. **Nutricionista is "Lic. Antonella Caverzan"** (not "Dra.")
4. **Test after every change**: `npm test && npm run test:e2e`
5. **Build tests expect specific counts**: update test assertions when adding systems/sections/nav items
6. **BEDCA data** in `data/bedca-data.js` is 168KB — keep it as `defer` script
7. **manifest.json and sw.js** MUST stay in root (PWA requirement)

## Test Credentials
| Portal | Email | Password |
|---|---|---|
| Professional (ERP) | nutri@veridia.tech | nutri123 |
| Professional (Admin) | admin@veridia.tech | admin123 |
| Patient Portal | demo@veridia.tech | demo |
| SuperAdmin | superadmin@veridia.tech | superadmin123 |

## Architecture Quick Reference
```
User clicks nav item
  → navigate(moduleId)        [core.js]
    → checkAccess(moduleId)   [auth.js] → RBAC check
    → R[moduleId]()           [core.js] → calls render function
      → rDash() / rAgenda() / etc.      → builds HTML string
        → $('mainContent').innerHTML = html
```

## Adding a New Module
1. Create `js/newmodule.js` with `function rNewModule() { ... }`
2. Add to `portal-profesional.html`: `<script src="js/newmodule.js" defer></script>`
3. Add route in `core.js`: `const R = { ..., newmodule: rNewModule }`
4. Add to NAV in `core.js`: `{id:'newmodule', ic:'icon', l:'Label'}`
5. Add to RBAC in `auth.js` for appropriate roles
6. Add tests in `test-veridia.js`
7. Run `npm test && npm run test:e2e`
8. Run `npm run build`

## File Naming Conventions
- `portal-profesional.html` (was `veridia.html`)
- `super-administrador.html` (was `superadmin.html`)
- All JS modules in `js/` folder
- All CSS in `css/` folder
- All images in `assets/` folder
- All data files in `data/` folder
- Legal docs in `legal/` folder
- Build scripts in `scripts/` folder
- Backend in `backend/` folder
