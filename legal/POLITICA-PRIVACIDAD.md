# POLÍTICA DE PRIVACIDAD

**Versión 1.0.0 — Fecha de vigencia: 25 de junio de 2026**

---

## 1. RESPONSABLE DEL TRATAMIENTO

| Dato | Valor |
|------|-------|
| **Responsable** | Eduardo Andres Galeano Aido |
| **NIE** | Z0002918W |
| **Entidad** | GalcoCapital LLC |
| **Dirección de contacto DPO** | dpo@veridia.tech |
| **Contacto legal** | legal@veridia.tech |

De conformidad con el **Reglamento (UE) 2016/679** del Parlamento Europeo y del Consejo, de 27 de abril de 2016, relativo a la protección de las personas físicas en lo que respecta al tratamiento de datos personales (en adelante, «RGPD»), la **Ley Orgánica 3/2018**, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPD-GDD), y demás normativa aplicable, se informa al Usuario de lo siguiente:

---

## 2. DATOS PERSONALES QUE RECOGEMOS

### 2.1 Datos del profesional sanitario (Usuario del ERP)

| Categoría | Datos concretos | Base legal |
|-----------|----------------|------------|
| **Identificativos** | Nombre completo, email profesional, teléfono | Art. 6.1.b) RGPD — Ejecución de contrato |
| **Credenciales** | Email de acceso, hash de contraseña | Art. 6.1.b) RGPD — Ejecución de contrato |
| **Profesionales** | Matrícula, especialidad, título, firma digital | Art. 6.1.b) RGPD — Ejecución de contrato |
| **Facturación** | Datos fiscales de la clínica, historial de pagos | Art. 6.1.b) RGPD — Ejecución de contrato |
| **Técnicos** | Dirección IP, navegador, resolución de pantalla, sistema operativo | Art. 6.1.f) RGPD — Interés legítimo |

### 2.2 Datos de pacientes (introducidos por el profesional)

> ⚠️ **DATOS DE CATEGORÍA ESPECIAL (Art. 9 RGPD)**
>
> La Plataforma procesa datos de salud de pacientes, que constituyen datos de categoría especial conforme al artículo 9 del RGPD. El profesional sanitario que introduce estos datos actúa como **corresponsable del tratamiento** y debe garantizar que dispone de base legal conforme al Art. 9.2.h) RGPD (finalidades de medicina preventiva, diagnóstico médico, prestación de asistencia sanitaria).

| Categoría | Datos concretos | Base legal |
|-----------|----------------|------------|
| **Identificativos del paciente** | Nombre, apellidos, DNI/NIE, fecha de nacimiento, sexo, email, teléfono, dirección, nacionalidad, profesión | Art. 9.2.h) RGPD — Asistencia sanitaria |
| **Datos clínicos** | Patologías (ICD-10), antecedentes personales y familiares, alergias, medicación, cirugías, grupo sanguíneo | Art. 9.2.h) RGPD — Asistencia sanitaria |
| **Datos antropométricos** | Peso, talla, IMC, % grasa corporal, masa muscular, perímetros, pliegues | Art. 9.2.h) RGPD — Asistencia sanitaria |
| **Datos analíticos** | Biomarcadores (glucosa, colesterol, hemoglobina, vitaminas, etc.) | Art. 9.2.h) RGPD — Asistencia sanitaria |
| **Datos nutricionales** | Planes alimentarios, fórmula desarrollada, diario de ingesta, adherencia | Art. 9.2.h) RGPD — Asistencia sanitaria |
| **Datos de consulta** | Actas de consulta, hallazgos, acuerdos, próximos pasos, duración | Art. 9.2.h) RGPD — Asistencia sanitaria |
| **Documentos adjuntos** | Informes médicos, derivaciones, recetas, consentimientos (base64) | Art. 9.2.h) RGPD — Asistencia sanitaria |
| **Comunicaciones** | Mensajes de chat entre profesional y paciente | Art. 9.2.h) RGPD — Asistencia sanitaria |

### 2.3 Datos de feedback (Beta)

| Dato | Base legal |
|------|------------|
| Valoraciones (NPS, emojis), módulo más útil, sugerencias de mejora, user agent, resolución de pantalla | Art. 6.1.a) RGPD — Consentimiento |

---

## 3. FINALIDADES DEL TRATAMIENTO

| Finalidad | Base legal | Plazo de conservación |
|-----------|-----------|----------------------|
| Prestación del servicio SaaS contratado | Art. 6.1.b) Ejecución de contrato | Duración del contrato + 5 años (obligación mercantil) |
| Gestión de la relación comercial y facturación | Art. 6.1.b) Ejecución de contrato | 5 años (Ley General Tributaria) |
| Asistencia sanitaria nutricional | Art. 9.2.h) Asistencia sanitaria | Mínimo 5 años desde la última anotación (Ley 41/2002, Art. 17) |
| Mejora del producto mediante análisis de uso | Art. 6.1.f) Interés legítimo | 24 meses |
| Envío de comunicaciones comerciales (si consentido) | Art. 6.1.a) Consentimiento | Hasta revocación |
| Inteligencia artificial (Gemini) — apoyo a decisiones clínicas | Art. 6.1.a) Consentimiento explícito | Duración de la sesión (sin almacenamiento server-side) |
| Cumplimiento de obligaciones legales | Art. 6.1.c) Obligación legal | Según normativa aplicable |

---

## 4. TRANSFERENCIAS INTERNACIONALES DE DATOS

| Destinatario | País | Finalidad | Garantía |
|-------------|------|-----------|----------|
| **Google LLC** (Firebase Firestore) | EE.UU. | Sincronización en la nube y backup | Cláusulas Contractuales Tipo (CCT) aprobadas por la Comisión Europea + Marco de Privacidad UE-EE.UU. |
| **Google LLC** (Gemini AI) | EE.UU. | Procesamiento de IA para apoyo clínico | Datos **anonimizados** antes del envío (`anonymizeForAI`): nombre → pseudónimo, DNI/email/tel → [REDACTED]. Sin almacenamiento persistente por Google. |
| **Firebase Analytics** | EE.UU. | Estadísticas de uso agregadas | Datos anonimizados/agregados. No se transmite PII. |

> ⚠️ **MEDIDA DE PROTECCIÓN**: Antes de enviar cualquier dato a Google Gemini AI, la Plataforma ejecuta automáticamente la función `anonymizeForAI()` que reemplaza:
> - Nombres reales → `Paciente_ID` (pseudonimización)
> - DNI/NIE → `[DNI_REDACTED]`
> - Emails → `[EMAIL_REDACTED]`
> - Teléfonos → `[TEL_REDACTED]`
> - Direcciones → `[DIR_REDACTED]`
>
> En ningún caso se transmiten datos de identificación directa del paciente a servidores de inteligencia artificial.

---

## 5. ALMACENAMIENTO Y SEGURIDAD DE LOS DATOS

### 5.1 Ubicación del almacenamiento

| Medio | Ubicación | Tipo de datos | Cifrado |
|-------|-----------|--------------|---------|
| **localStorage** (navegador) | Dispositivo del Usuario | Todos los datos de trabajo (offline-first) | Pendiente AES-256-GCM (planificado) |
| **Firebase Firestore** | Google Cloud (UE/EE.UU.) | Backup/sync de datos clínicos | TLS 1.3 en tránsito + cifrado AES-256 en reposo (Google) |
| **PostgreSQL** (cuando activado) | Servidor del titular (Docker) | Datos relacionales completos | TLS en tránsito + cifrado de disco |

### 5.2 Medidas de seguridad técnicas

- Content Security Policy (CSP) en todos los entornos web.
- Helmet.js con headers de seguridad HTTP (X-Frame-Options, X-Content-Type-Options, HSTS).
- Rate limiting (100 req/15min general, 20 req/15min auth).
- CORS restringido a dominios autorizados (no wildcard).
- Tokens JWT con secretos de 128 caracteres generados por `crypto.randomBytes()`.
- Hashing de contraseñas con bcrypt ($2b$12) en backend.
- Session timeout con lock screen automático por inactividad.
- Firestore Security Rules con default DENY y append-only para audit log.
- Sanitización de inputs (`sanitize()`) contra XSS en 127+ puntos del código.
- Anonymization pipeline para datos enviados a servicios de IA externos.

---

## 6. DERECHOS DEL INTERESADO

De conformidad con los artículos 15 a 22 del RGPD, el interesado tiene derecho a:

| Derecho | Descripción | Cómo ejercerlo |
|---------|-------------|-----------------|
| **Acceso** (Art. 15) | Obtener confirmación de si se tratan sus datos y acceder a los mismos | Email a dpo@veridia.tech |
| **Rectificación** (Art. 16) | Solicitar la corrección de datos inexactos o incompletos | Email a dpo@veridia.tech |
| **Supresión** (Art. 17) | Solicitar la eliminación de sus datos («derecho al olvido») | Email a dpo@veridia.tech |
| **Limitación** (Art. 18) | Solicitar la restricción del tratamiento en determinadas circunstancias | Email a dpo@veridia.tech |
| **Portabilidad** (Art. 20) | Recibir los datos en formato estructurado (JSON) y transmitirlos a otro responsable | Función «Backup» en la Plataforma o email a dpo@veridia.tech |
| **Oposición** (Art. 21) | Oponerse al tratamiento basado en interés legítimo | Email a dpo@veridia.tech |
| **No ser objeto de decisiones automatizadas** (Art. 22) | La IA de la Plataforma es una herramienta de APOYO; las decisiones clínicas las toma siempre el profesional | — |

**Plazo de respuesta**: 30 días naturales desde la recepción de la solicitud, prorrogable a 60 días en casos complejos.

**Autoridad de control**: Si el interesado considera que sus derechos no han sido atendidos, puede presentar reclamación ante la **Agencia Española de Protección de Datos** (AEPD) — [www.aepd.es](https://www.aepd.es).

---

## 7. DATOS DE MENORES

La Plataforma no está dirigida a menores de 16 años. No recogemos intencionadamente datos de menores sin el consentimiento de sus tutores legales. Los datos de pacientes menores de edad son introducidos exclusivamente por el profesional sanitario en ejercicio de sus funciones, bajo la responsabilidad de obtener las autorizaciones pertinentes conforme a la Ley 41/2002 y la Ley Orgánica 1/1996.

---

## 8. MODIFICACIONES

GalcoCapital LLC se reserva el derecho de actualizar esta Política de Privacidad. Cualquier cambio sustancial será comunicado a los Usuarios mediante notificación en la Plataforma o correo electrónico. Se recomienda revisar esta política periódicamente.

---

*Última actualización: 25 de junio de 2026.*
*© 2026 GalcoCapital LLC. Todos los derechos reservados.*
*Delegado de Protección de Datos: dpo@veridia.tech*
