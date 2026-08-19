# API Integrations & External Services

## VERIDIA_CONFIG System
Centralized API key management stored in `localStorage('veridia_api_config')`.
Editable from SuperAdmin → 🔑 APIs & Keys panel.

```javascript
var VERIDIA_CONFIG = {
  gemini_key: '',           // Google Gemini API key
  gemini_model: 'gemini-1.5-flash',
  firebase_apiKey: 'AIzaSyC70dqaMS6EuUfBGb9B4YJGvz7xJe3qJpk',
  firebase_projectId: 'nutrisuite-6e44a',
  usda_key: '',             // USDA FDC API key
  // Loaded from localStorage, editable in SuperAdmin
};
```

## 1. Google Gemini AI
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- **Backend proxy**: `/api/proxy/gemini` (port 3456)
- **Auto-detection**: If port 3456 or non-localhost → uses proxy. Else direct API.
- **Context building**: `buildPatientContext(patId)` constructs clinical summary
- **Anonymization**: `anonymizeForAI()` redacts name→Paciente_ID, DNI→[REDACTED], email→[REDACTED]
- **RGPD**: Consent modal before first IA usage, stored in `veridia_ia_consent`
- **Functions**: `geminiAsk(prompt, options)` → Promise<string>

## 2. Firebase Firestore
- **Project**: nutrisuite-6e44a
- **SDK**: firebase-compat v10.12.2
- **Sync**: `fbSyncDB()` called on every `toast('success')`
- **Document**: `clinics/clinic_default` contains full DB snapshot
- **Security**: `config/firestore.rules` (default DENY, clinic auth, append-only audit)

## 3. USDA FoodData Central
- **Endpoint**: `https://api.nal.usda.gov/fdc/v1/foods/search`
- **Backend proxy**: `/api/proxy/usda/search`
- **Data types**: SR Legacy (reference), Foundation, Branded
- **Translation**: `usdaTranslate(name)` EN→ES for 400+ food names
- **Nutrients**: Up to 114 per food item

## 4. OpenFoodFacts
- **Endpoint**: `https://world.openfoodfacts.net/cgi/search.pl`
- **Product detail**: `/api/v2/product/{barcode}.json`
- **CORS**: ✓ (Access-Control-Allow-Origin: *)
- **Features**: Nutri-Score, 30+ nutrients, barcode lookup
- **Enrichment**: `offEnrichProduct(code, callback)` loads full nutrient data
- **Translation**: `offTranslate(name)` for 200+ common food names

## 5. TheMealDB
- **Search**: `https://www.themealdb.com/api/json/v1/1/search.php?s={query}`
- **Category filter**: `/filter.php?c={category}`
- **Area filter**: `/filter.php?a={area}`
- **Detail**: `/lookup.php?i={id}`
- **Import**: `importMealDB(id)` creates local recipe from MealDB data
- **Translation**: `trCookStep(text)` and `trMealIng(name)` EN→ES

## Backend Proxy (Express.js — prepared, not active)
```
backend/
  src/index.js           → Express + Helmet CSP + CORS + rate limiting
  src/routes/proxy.js    → /api/proxy/gemini + /api/proxy/usda/search
  src/routes/auth.js     → JWT auth endpoints
  src/routes/patients.js → CRUD patients
  src/routes/clinical.js → Clinical data endpoints
  src/routes/foods.js    → Food search endpoints
  src/utils/migrate.js   → 18 PostgreSQL tables + 20 performance indexes
  src/utils/db.js        → PostgreSQL connection pool
  src/utils/validate.js  → Input validation
```

## Security Headers
- CSP meta tag in all HTML files
- Helmet CSP in backend
- CORS restricted to: localhost:3456, localhost:5173, veridia.tech
- JWT secrets: 128-char random hex
- HTTPS redirect in production
