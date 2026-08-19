# Build, Test & Deployment

## NPM Scripts
```json
{
  "test": "node tests/test-veridia.js",
  "test:e2e": "node tests/test-e2e.js",
  "build": "node scripts/build-deploy.js",
  "start": "node backend/src/index.js",
  "dev": "nodemon backend/src/index.js"
}
```

## Build Process
`npm run build` → `node scripts/build-deploy.js`

1. Reads `portal-profesional.html`
2. Inlines ALL `<script src="js/...">` files
3. Inlines `<link rel="stylesheet" href="css/...">` 
4. Inlines `<script src="data/bedca-data.js">`
5. Minifies: removes comments, collapses whitespace
6. Outputs `portal-profesional-deploy.html` (~1.4 MB)

The build uses `path.join(__dirname, '..', '...')` for all paths.

## Test Suite

### Unit Tests (281)
`tests/test-veridia.js` using jsdom:
- Loads `portal-profesional.html` in jsdom
- Executes all scripts
- Tests: DB structure, functions exist, calculations correct, data integrity
- Categories: Core, Auth, RBAC, Patients, Agenda, Formula, Antropometria, BEDCA, Restauracion, ESPEN, etc.

### E2E Tests (62)
`tests/test-e2e.js`:
- Simulates login flow
- Tests navigation between modules
- Tests data creation/editing/deletion
- Tests RBAC restrictions
- Tests formula calculations
- Tests ESPEN screening

### Key Test Assertions
```javascript
// Architecture
test('32 JS files exist');
test('CSS file exists');
test('BEDCA data loaded');

// Data
test('ANAM_SYSTEMS 14');
test('ANAM_SECTIONS 8');
test('NAV 5 sections');
test('SERVICES 11 items');
test('CURRENCIES 9');

// Functions
test('rDash exists');
test('calcFormula exists');
test('rcCalcScaling exists');
// ... 270+ more
```

## Firebase Hosting
```json
// firebase.json
{
  "hosting": {
    "public": "public",
    "rewrites": [
      {"source": "/", "destination": "/index.html"},
      {"source": "/app", "destination": "/portal-profesional.html"},
      {"source": "/portal", "destination": "/portal-paciente.html"},
      {"source": "/admin", "destination": "/super-administrador.html"},
      {"source": "/nosotros", "destination": "/sobre-nosotros.html"}
    ]
  }
}
```

## Docker (prepared)
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: veridia
      POSTGRES_USER: veridia
      POSTGRES_PASSWORD: ${DB_PASSWORD}
  api:
    build: ./backend
    depends_on: [postgres]
    ports: ["3456:3456"]
```

## PWA
- `manifest.json`: icons, name, colors
- `sw.js`: service worker with cache-first strategy
- Both MUST stay in root directory

## Sync & Deploy Scripts
```bash
npm run sync       # Sync root → public/ (bash scripts/sync-public.sh)
npm run predeploy  # Run all tests + sync public/
```

The `public/` folder is the deploy target for ALL hosting platforms.
It also contains `_redirects` and `_headers` for Netlify compatibility.

## Deployment Options (all free tier)

| Platform | Command | Free Tier |
|---|---|---|
| Firebase Hosting | `firebase deploy --only hosting` | 10 GB/month |
| Netlify | `netlify deploy --dir=public --prod` or drag & drop | 100 GB/month |
| GitHub Pages | `git push` (configure /public as source) | 100 GB/month |

See `docs/DEPLOY-GUIDE.md` for full step-by-step instructions for all 3 platforms.

## Deployment Checklist
1. Run `npm test` (281/281)
2. Run `npm run test:e2e` (62/62)
3. Run `npm run sync` (sync root → public/)
4. Run `npm run build` (optional — generates single-file backup)
5. Set Gemini API key in SuperAdmin → APIs & Keys
6. Deploy:
   - Firebase: `firebase deploy --only hosting`
   - Netlify: `netlify deploy --dir=public --prod`
   - GitHub Pages: push to repo, configure in Settings → Pages
7. Publish Firestore Security Rules: `firebase deploy --only firestore:rules`
