# Known Issues & Future Improvements

## Known Limitations (Beta)
1. **localStorage 5MB limit** — trimDBArrays() helps but large clinics will hit it
2. **No real-time sync** — polling every 60s for chat, no WebSocket
3. **Client-side auth** — syncHash is NOT cryptographic. Migration to Firebase Auth needed
4. **No email system** — password reset, verification, notifications all need SMTP (SendGrid)
5. **No Stripe/PayPal** — payment integration needs merchant account
6. **i18n incomplete** — 381 t() calls but many hardcoded Spanish strings remain
7. **localStorage encryption** — structure prepared in auth.js, not activated (AES-256-GCM ready)
8. **Backend not active** — Express.js + PostgreSQL fully prepared but not connected

## SVG Icon System (icons.js)
- 89 Lucide-style SVG icons defined in `VI` object
- Infrastructure ready but **NOT actively used** — reverted to emojis
- Reason: codebase mixes template literals and string concatenation, making SVG injection unreliable
- Future: if frontend is refactored to a component system (React/Vue/Svelte), SVG icons can be activated
- Emojis work reliably across all rendering contexts

## Recommended Architecture for v2.0
If rebuilding from scratch with a team:

### Frontend Options
1. **React + Next.js** — SSR, component system, ecosystem
2. **Vue 3 + Nuxt** — simpler learning curve, composition API
3. **SvelteKit** — smallest bundle, best performance
4. All would use the same data structures documented in `02-DATABASE-SCHEMA.md`

### Backend
1. **Node.js + Express** (already prepared) or **Fastify**
2. **PostgreSQL** (18 tables already designed in `backend/src/utils/migrate.js`)
3. **Redis** for session management + caching
4. **Bull** for job queues (report generation, AI calls)

### Real-time
- **WebSocket** (Socket.io) for chat + notifications
- **Firebase Realtime Database** as alternative

### Mobile
- **Flutter** migration plan exists in `docs/FLUTTER-MIGRATION-PLAN.md`
- Alternatively: React Native or Capacitor wrapping the web app

## Feature Requests (from Antonella's document, all implemented)
All 33 items from the nutrition program document have been implemented:
- ✅ Anamnesis v3 (systems first, pathology questions, ESPEN recs)
- ✅ 5 clinical indices (HOMA-IR, FLI, FIB-4, TG/HDL, PCR)
- ✅ ICT + 4 pliegues + dinamometría
- ✅ Deficit calórico in formula
- ✅ 13 patologías with ESPEN macros
- ✅ Nutrient filters + supplements database
- ✅ Food equivalencies + drag&drop
- ✅ 5 pathology guides for nutritional support
- ✅ Sidebar reorganization (Clínica + Institucional)
- See `docs/ROADMAP-NUTRICION-v2.md` for full checklist

## Security Recommendations for Production
1. Replace syncHash with bcrypt/argon2
2. Implement Firebase Auth or Passport.js
3. Enable Helmet CSP in production mode
4. Add rate limiting to all API endpoints
5. Implement CSRF protection
6. Add input sanitization middleware (already have `sanitize()` client-side)
7. Enable localStorage encryption (AES-256-GCM structure exists)
8. Add audit logging to backend
9. HTTPS only (redirect in place but need TLS cert)
10. Regular security audits
