# POLÍTICA DE COOKIES

**Versión 1.0.0 — Fecha de vigencia: 25 de junio de 2026**

---

## 1. INFORMACIÓN GENERAL

En cumplimiento del artículo 22.2 de la **Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico** (LSSI-CE), en relación con la **Directiva 2002/58/CE** (Directiva ePrivacy) y el **Reglamento (UE) 2016/679** (RGPD), **GalcoCapital LLC** (en adelante, «el Responsable») informa al Usuario sobre las tecnologías de almacenamiento local y cookies utilizadas en la plataforma **Veridia HealthTech**.

| Dato | Valor |
|------|-------|
| **Responsable** | GalcoCapital LLC — Eduardo Andres Galeano Aido (NIE: Z0002918W) |
| **Plataforma** | veridia.tech y todos sus subdominios |
| **Contacto** | legal@veridia.tech |

---

## 2. ¿QUÉ SON LAS COOKIES Y TECNOLOGÍAS DE ALMACENAMIENTO?

Las cookies son pequeños archivos de texto que los sitios web almacenan en el dispositivo del Usuario. La Plataforma utiliza, además de cookies tradicionales, las siguientes tecnologías de almacenamiento web:

- **localStorage**: almacenamiento persistente en el navegador del Usuario (hasta 5 MB).
- **Service Worker Cache**: almacenamiento de assets estáticos para funcionamiento offline (PWA).
- **Firebase SDK**: bibliotecas de Google que pueden establecer cookies propias para analytics y autenticación.

---

## 3. COOKIES Y TECNOLOGÍAS UTILIZADAS

### 3.1 Cookies y almacenamiento estrictamente necesarios (sin consentimiento)

Estas tecnologías son imprescindibles para el funcionamiento de la Plataforma. No requieren consentimiento conforme al Art. 22.2 LSSI-CE.

| Identificador | Tipo | Finalidad | Duración | Datos almacenados |
|---------------|------|-----------|----------|-------------------|
| `veridia_db` | localStorage | Base de datos clínica principal (pacientes, citas, facturas, antropometría, analíticas, planes) | Persistente | Datos clínicos cifrados (en producción) |
| `veridia_api_config` | localStorage | Configuración de API keys y preferencias del sistema | Persistente | Keys de APIs (Gemini, USDA, Firebase) |
| `veridia_clinica` | localStorage | Nombre de la clínica del Usuario | Persistente | Texto plano |
| `veridia_onboarded` | localStorage | Flag de primer uso completado | Persistente | `1` o ausente |
| `veridia_session_timeout` | localStorage | Preferencia de timeout de sesión | Persistente | Milisegundos |
| `veridia_lang` | localStorage | Idioma seleccionado (es/en/pt) | Persistente | Código de idioma |
| `veridia_currency` | localStorage | Moneda seleccionada | Persistente | Código ISO 4217 |
| `veridia_theme_color` | localStorage | Color del tema de la interfaz | Persistente | Código hexadecimal |
| `veridia_dark` | localStorage | Preferencia de modo oscuro | Persistente | `true` o `false` |
| `veridia_chats` | localStorage | Historial de mensajes profesional-paciente | Persistente | Mensajes de chat |
| `veridia_profile` | localStorage | Perfil del profesional (nombre, título, matrícula) | Persistente | Datos profesionales |
| **Service Worker Cache** | Cache API | Assets estáticos (JS, CSS, imágenes) para funcionamiento offline | Hasta actualización de la app | Archivos estáticos (sin datos personales) |

### 3.2 Cookies de análisis y rendimiento (requieren consentimiento)

| Cookie/Tecnología | Proveedor | Finalidad | Duración | Tipo |
|-------------------|-----------|-----------|----------|------|
| `_ga` | Google Analytics (Firebase) | Identificador único de usuario para estadísticas de uso agregadas | 2 años | Tercero |
| `_ga_*` | Google Analytics (Firebase) | Mantenimiento del estado de sesión de analytics | 2 años | Tercero |
| `__firebase_heartbeat__` | Firebase SDK | Monitoreo de estado de conexión del SDK | Sesión | Tercero |

### 3.3 Cookies funcionales opcionales

| Identificador | Tipo | Finalidad | Duración |
|---------------|------|-----------|----------|
| `veridia_feedback` | localStorage | Respuestas de feedback del Usuario (NPS, sugerencias) | Persistente |
| `veridia_goal_*` | localStorage | Objetivos de peso por paciente | Persistente |
| `veridia_superadmin` | localStorage | Datos del panel de administración SaaS | Persistente |
| `veridia_portal_pending` | localStorage | Registros pendientes del portal del paciente | Persistente |

---

## 4. GESTIÓN DE COOKIES Y ALMACENAMIENTO

### 4.1 Cómo desactivar cookies de terceros (Analytics)

El Usuario puede deshabilitar las cookies de Google Analytics de las siguientes formas:

- **Complemento de navegador**: Instalar el [complemento de inhabilitación de Google Analytics](https://tools.google.com/dlpage/gaoptout).
- **Configuración del navegador**: Bloquear cookies de terceros del dominio `*.google-analytics.com` y `*.firebaseio.com`.
- **Dentro de la Plataforma**: Próximamente, banner de consentimiento con opción granular.

### 4.2 Cómo borrar el almacenamiento local

> ⚠️ **ADVERTENCIA**: Borrar el localStorage eliminará TODOS los datos clínicos almacenados localmente. Realice un **Backup** desde Ajustes antes de proceder.

**Chrome**: Configuración → Privacidad y seguridad → Borrar datos de navegación → Avanzado → Cookies y datos del sitio.

**Firefox**: Configuración → Privacidad → Cookies y datos del sitio → Administrar datos → Buscar `veridia.tech` → Eliminar.

**Safari**: Preferencias → Privacidad → Administrar datos del sitio web → Buscar `veridia` → Eliminar.

### 4.3 Consecuencias de la desactivación

Si el Usuario desactiva las cookies estrictamente necesarias o borra el localStorage:

- La Plataforma **no podrá funcionar** correctamente.
- Se perderán todos los datos clínicos almacenados localmente si no se ha realizado backup.
- Se cerrará la sesión activa.
- Se restablecerán todas las preferencias a valores por defecto.

---

## 5. ACTUALIZACIONES

GalcoCapital LLC podrá actualizar esta Política de Cookies para adaptarla a novedades legislativas o técnicas. La fecha de la última actualización se indica al pie de este documento.

---

*Última actualización: 25 de junio de 2026.*
*© 2026 GalcoCapital LLC. Todos los derechos reservados.*
