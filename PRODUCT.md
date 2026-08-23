# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Nutricionistas clínicos que trabajan en consultorios privados y/o institucionales (hospitales, geriátricos, centros de salud). También participan secretarias/administradoras en gestión de citas, facturación y caja, y un SuperAdmin para gestión SaaS multi-clínica. Pacientes acceden a un portal web dedicado.

El usuario principal (nutricionista) gestiona el ciclo completo del paciente: desde la primera consulta y anamnesis, pasando por evaluación antropométrica, análisis clínico, diseño de planes alimentarios, hasta la facturación del servicio. En contexto hospitalario, coordina restauración colectiva, soporte nutricional enteral/parenteral y trazabilidad alimentaria.

## Product Purpose

Veridia HealthTech es un ERP de nutrición clínica que integra gestión clínica, nutrición, restauración colectiva, facturación e inteligencia artificial en una sola plataforma. El producto existe para que los nutricionistas puedan gestionar toda su práctica clínica — desde la primera consulta hasta la facturación — sin cambiar de herramienta, con decisiones basadas en evidencia clínica (guías ESPEN, IDDSI, APPCC) y asistencia de IA.

El éxito significa: reducir el tiempo de gestión administrativa, mejorar la calidad de las decisiones clínicas con guías basadas en evidencia, y ofrecer un servicio integral que cubra consultorio privado e institucional en una única plataforma.

## Positioning

Motor clínico integrado ESPEN + IA que ningún otro ERP de nutrición ofrece: guías clínicas automáticas (NRS-2002, GLIM, NUTRIC, MNA-SF), framework IDDSI para disfagia, control APPCC de seguridad alimentaria, y asistencia IA (Gemini) para decisiones clínicas — todo en un solo sistema que también factura, gestiona agenda y administra restauración colectiva institucional.

## Operating Context

- **Consultorio privado:** nutricionista atiende pacientes individualmente, realiza anamnesis, antropometría, analíticas, diseña planes alimentarios, emite facturas
- **Institución (hospital/geriátrico):** coordina menús colectivos para 20-500+ comensales, gestiona alérgenos UE, deriva a suplementos orales, escala recetas con factores de merma, genera trazabilidad y recall sanitario
- **Soporte nutricional UCI:** screening NRS-2002, evaluación GLIM, nutrición enteral (15 fórmulas) y parenteral, protocolo insulina Yale, destete en 6 fármacos
- **Herramientas externas:** Google Gemini 2.0 (IA clínica), USDA FoodData Central (114 nutrientes/alimento), OpenFoodFacts (productos comerciales + barcode), TheMealDB (recetas internacionales), BEDCA (969 alimentos offline)
- **Multi-idioma:** ES, EN, PT | **Multi-moneda:** EUR, USD, ARS, MXN, CLP, COP, PEN, GBP, BRL

## Capabilities and Constraints

**Funcionalidades confirmadas:**
- Historia clínica completa (10 tabs), antropometría (OMS percentiles), analíticas biomarcadores
- Fórmula clínica (5 ecuaciones + calorimetría Weir), guías ESPEN (6 flowcharts)
- Copiloto clínico 5 pasos con multi-patología (438 ICD-10)
- Restauración colectiva (9 tabs): menús, 14 alérgenos UE, IDDSI 0-7, APPCC, trazabilidad
- Facturación multilínea, caja, agenda con citas recurrentes, mensajería bidireccional
- Portal del paciente, SuperAdmin SaaS multi-clínica, auditoría

**Restricciones técnicas:**
- Frontend React 19 + TypeScript + Vite + Tailwind CSS v4
- Backend Node.js + Express + PostgreSQL + Drizzle ORM
- Datos offline-first con localStorage + Firebase Firestore sync
- API keys gestionadas desde SuperAdmin, backend proxy para producción
- RBAC 3 roles (Admin, Nutricionista, Secretaria)
- ~13,491 líneas frontend, 31 módulos JS, 343 tests

**Restricciones de negocio:**
- Procesa datos de salud (RGPD Art. 9) — requiere DPIA antes de producción con pacientes reales
- Licencia propietaria GalcoCapital LLC

## Brand Commitments

**Rebrand completo:** El usuario ha solicitado una nueva identidad visual. No hay restricciones de marca existentes que preservar. La identidad actual (paleta cyan/teal, modo oscuro, glassmorphism) es solo referencia técnica, no compromiso de marca.

Nombre del producto: **Veridia HealthTech** (preservar nombre)

## Evidence on Hand

- Código fuente completo: React app en `veridia-app/`, backend en `backend/`
- Diseño actual con sistema de diseño Tailwind v4 + shadcn/ui en `veridia-app/src/index.css`
- Documentación extensiva: README.md (576 líneas), docs/CHANGELOG.md, docs/ARCHITECTURE-AUDIT.md, docs/SECURITY-AUDIT.md
- Test suite: 343 tests (281 unitarios + 62 E2E)
- Build de producción: single-file deploy ~1,153 KB
- Assets: logo-icon.png, logo-full.png, icon-192.png, icon-512.png (en veridia-app/public/)

## Product Principles

1. **Clínica primero:** Las decisiones de diseño siempre priorizan la calidad clínica y la seguridad del paciente sobre la estética
2. **Un solo sistema:** Evitar la fragmentación — el nutricionista no debería necesitar herramientas externas para ninguna parte de su práctica
3. **Basado en evidencia:** Todo contenido clínico (guías, alertas, fórmulas) debe estar respaldado por evidencia científica verificable
4. **Offline-first confiable:** La plataforma debe funcionar sin dependencia de conectividad, sincronizando cuando sea posible
5. **Escalable institucional:** Desde consultorio individual hasta restauración colectiva de 500+ comensales

## Accessibility & Inclusion

No se han establecido requisitos específicos de accesibilidad más allá de los estándares básicos de una aplicación web profesional. El product truth no incluye compromisos de accesibilidad confirmados.
