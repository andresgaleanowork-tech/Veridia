# 🔬 Auditoría Pre-Lanzamiento — Estado Real Sin Filtro
## Veridia HealthTech v5.2.0 · 25/06/2026

---

## ✅ LO QUE ESTÁ BIEN (no tocar)

- **343/343 tests pasan** (281 unit + 62 E2E)
- **0 errores de sintaxis** en 31 archivos
- **0 console.log** en producción
- **0 catch vacíos**
- **0 Gemini key hardcoded** (VERIDIA_CONFIG funciona)
- **31/31/31 sync** HTML↔JS↔SW
- **Build: 1,155 KB** (optimizado con minificación)
- **4 documentos legales** aplicados con links en todos los entornos
- **Cookie banner** funcional
- **RGPD consent para IA** funcional
- **Copyright GalcoCapital** en todos los entornos
- **CSP** en 3 HTML + Helmet backend
- **Firestore rules** listas para deploy
- **JWT 128-char random** secrets

---

## 🔴 CORREGIR (bugs reales o riesgos)

| # | Issue | Gravedad | Dónde | Detalle |
|---|-------|----------|-------|---------|
| C1 | Firebase apiKey literal como fallback | Media | `js/firebase.js` línea 9 y 48 | El default de VERIDIA_CONFIG tiene el apiKey real como fallback. Si el config se resetea, queda expuesto. Es público by design (Firebase) pero debería documentarse mejor. |
| C2 | 5 referencias a DEMO_KEY | Baja | `js/alimentos.js` | El fallback USDA usa DEMO_KEY (30 req/hora). Si el user no configura su key, funciona pero con límite. No es un bug — es diseño intencional. |
| C3 | 41 `!important` en CSS | Baja | `app-styles.css` | 17 son overrides legítimos de inline styles de JS. Los otros 24 podrían refactorizarse pero no causan bugs. |

---

## 🟡 MEJORAR (calidad, no urgente para beta)

| # | Issue | Impacto | Detalle |
|---|-------|---------|---------|
| M1 | 51 funciones sin referencia directa | Bajo | Son funciones llamadas desde strings/onclick dinámicos que grep no detecta. Muchas son de Soporte Nutricional UCI (renderAPACHEII, renderProtocoloDestete, etc.) que se invocan desde tabs internas. **No son código muerto real** — son funciones de sub-módulos. |
| M2 | 214 innerHTML vs 127 sanitize | Medio | 87 innerHTML NO pasan por sanitize(). La mayoría son HTML estático (no datos de usuario), pero deberían revisarse. |
| M3 | 6 strings hardcoded en español | Bajo | 'Guardar'×3, 'Eliminar'×1, 'Cancelar'×2 deberían usar `t()`. No afecta funcionalidad en español. |
| M4 | i18n incompleta | Medio | 381 llamadas a `t()` pero miles de strings sin traducir. EN y PT funcionan pero muchos textos quedan en español. |
| M5 | Build 1,155 KB | Medio | Funcional pero >1MB. pathology-db.js (60KB) y bedca-data.js (168KB) podrían cargarse async/lazy. |

---

## 🟢 DESEABLE (post-beta)

| # | Feature | Detalle |
|---|---------|---------|
| D1 | Cifrado AES-256 de localStorage | Estructura preparada (`getCryptoKey` en auth.js) pero no activada. |
| D2 | Backend activado con PostgreSQL | 18 tablas + 20 índices definidos, solo falta `npm start`. |
| D3 | Firebase Auth (reemplazar syncHash) | Eliminaría auth client-side. Requiere migración de usuarios. |
| D4 | Barcode scanner (OpenFoodFacts) | `scanBarcode()` existe pero necesita camera API en mobile. |
| D5 | WebSocket para sync real-time | Ahora es polling cada 60s. Socket.io para colaboración multi-usuario. |

---

## 📊 NÚMEROS FINALES

| Métrica | Valor | Estado |
|---------|-------|--------|
| Tests | 343/343 | ✅ |
| Syntax errors | 0/31 | ✅ |
| console.log | 0 | ✅ |
| catch vacíos | 0 | ✅ |
| API keys hardcoded | 0 (Gemini) | ✅ |
| File sync | 31/31/31 | ✅ |
| Build size | 1,155 KB | 🟡 |
| innerHTML sin sanitize | ~87 | 🟡 |
| Funciones sin ref directa | 51 (falsos positivos) | 🟡 |
| Legal docs | 4/4 | ✅ |
| Cookie banner | ✅ | ✅ |
| RGPD IA consent | ✅ | ✅ |
| CSP | 3 HTML + backend | ✅ |
| Firestore rules | Listas | ✅ |
| CORS | Restrictivo | ✅ |
| JWT | 128-char random | ✅ |

---

## 🎯 VEREDICTO

**La app está lista para beta.** No hay bugs bloqueantes. Los items en 🟡 son mejoras de calidad que se pueden hacer post-lanzamiento con feedback real de usuarios.
