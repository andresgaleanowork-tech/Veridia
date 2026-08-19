# 🚀 Guía de Deploy — Veridia HealthTech
## Hosting 100% Gratuito

> **Tu proyecto es 100% estático** (HTML + JS + CSS + imágenes).
> No necesita servidor backend para funcionar.
> La base de datos usa localStorage + Firebase Firestore.
> Tamaño total: ~2 MB.

---

## Comparativa de Plataformas Gratuitas

| | **Firebase Hosting** | **Netlify** | **GitHub Pages** |
|---|---|---|---|
| **Transferencia/mes** | 10 GB | 100 GB | 100 GB |
| **Almacenamiento** | 10 GB | ∞ | 1 GB |
| **Dominio custom** | ✅ Gratis + SSL | ✅ Gratis + SSL | ✅ Gratis + SSL |
| **Dominio gratis** | `proyecto.web.app` | `proyecto.netlify.app` | `user.github.io` |
| **HTTPS** | ✅ Auto | ✅ Auto | ✅ Auto |
| **Rewrites/Redirects** | ✅ firebase.json | ✅ _redirects | ❌ Limitado |
| **Deploy desde CLI** | ✅ `firebase deploy` | ✅ `netlify deploy` | ✅ `git push` |
| **Deploy sin CLI** | ❌ | ✅ Drag & Drop | ✅ Push a repo |
| **Headers custom** | ✅ firebase.json | ✅ _headers | ❌ |
| **Preview deploys** | ✅ | ✅ | ❌ |
| **Firestore integrado** | ✅ Mismo proyecto | ⚠️ Externo | ⚠️ Externo |
| **Dificultad** | Media | Fácil | Fácil |

### 🏆 Recomendación
- **Firebase Hosting** → Ya tienes proyecto `nutrisuite-6e44a`, Firestore integrado, rewrites configurados
- **Netlify** → Si quieres el deploy MÁS fácil (drag & drop, 0 configuración)
- **GitHub Pages** → Si el repo ya está en GitHub y quieres auto-deploy con push

---

## OPCIÓN 1: Firebase Hosting (Recomendado)
*Ya tienes: proyecto `nutrisuite-6e44a`, `firebase.json` configurado, `public/` sincronizada*

### Paso 1: Instalar Firebase CLI
```bash
# Con npm (necesitas Node.js)
npm install -g firebase-tools

# O con curl (standalone)
curl -sL https://firebase.tools | bash
```

### Paso 2: Login
```bash
firebase login
# Se abre el navegador → login con la cuenta Google del proyecto
```

### Paso 3: Verificar proyecto
```bash
cd /ruta/a/veridia-healthtech
firebase use nutrisuite-6e44a

# Si es la primera vez:
firebase init hosting
# → Seleccionar proyecto existente: nutrisuite-6e44a
# → Public directory: public
# → Single-page app: No
# → Overwrite index.html: No
```

### Paso 4: Sincronizar y Deploy
```bash
# Sincronizar archivos al directorio público
npm run sync

# Deploy
firebase deploy --only hosting

# O todo junto (tests + sync + deploy):
npm run predeploy && firebase deploy --only hosting
```

### Paso 5: Publicar Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Resultado
```
✅ https://nutrisuite-6e44a.web.app        (dominio auto)
✅ https://nutrisuite-6e44a.firebaseapp.com (alias)

URLs activas:
  /          → Landing page (index.html)
  /app       → Portal Profesional (portal-profesional.html)
  /portal    → Portal del Paciente (portal-paciente.html)
  /admin     → SuperAdmin (super-administrador.html)
  /nosotros  → Sobre Nosotros (sobre-nosotros.html)
```

### Conectar dominio custom (gratis)
```bash
firebase hosting:channel:deploy preview  # Preview primero
# Luego en Firebase Console → Hosting → Añadir dominio personalizado
# → Seguir instrucciones DNS (CNAME o A records)
```

---

## OPCIÓN 2: Netlify (Más fácil)

### Opción A: Drag & Drop (0 instalación)
1. Ve a **[app.netlify.com](https://app.netlify.com)**
2. Regístrate gratis (con GitHub, GitLab, email)
3. En el dashboard, busca **"Deploy manually"**
4. **Arrastra la carpeta `public/`** al área de drop
5. ¡Listo! Te da un URL tipo `random-name-12345.netlify.app`

### Opción B: CLI
```bash
# Instalar
npm install -g netlify-cli

# Login
netlify login

# Crear sitio nuevo
netlify init
# → Create & configure a new site
# → Team: tu equipo
# → Site name: veridia-healthtech (o el que quieras)

# Deploy
netlify deploy --dir=public --prod
```

### Configurar rewrites (equivalente a firebase.json)
Crear archivo `public/_redirects`:
```
/app        /portal-profesional.html    200
/app/*      /portal-profesional.html    200
/portal     /portal-paciente.html       200
/admin      /super-administrador.html   200
/nosotros   /sobre-nosotros.html        200
```

### Configurar headers de seguridad
Crear archivo `public/_headers`:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/js/*
  Cache-Control: public, max-age=3600

/css/*
  Cache-Control: public, max-age=3600

/assets/*
  Cache-Control: public, max-age=86400
```

### Resultado
```
✅ https://veridia-healthtech.netlify.app (o nombre elegido)
```

### Conectar dominio custom
En Netlify Dashboard → Domain Settings → Add custom domain → Configurar DNS

---

## OPCIÓN 3: GitHub Pages

### Paso 1: Crear repo en GitHub
```bash
cd /ruta/a/veridia-healthtech

git init
git add .
git commit -m "Veridia HealthTech v5.2.0 Beta"

# Crear repo en github.com → New repository (puede ser privado con GitHub Pro)
git remote add origin https://github.com/TU_USUARIO/veridia-healthtech.git
git push -u origin main
```

### Paso 2: Configurar GitHub Pages
1. Ir a **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** → Folder: **/public** (o `/docs` si renombras)
4. Save

> ⚠️ GitHub Pages NO soporta rewrites. Las URLs serían:
> - `https://usuario.github.io/veridia-healthtech/` → Landing
> - `https://usuario.github.io/veridia-healthtech/portal-profesional.html` → ERP
> - Las URLs bonitas como `/app` no funcionan.

### Alternativa: GitHub Pages con carpeta docs/
```bash
# Renombrar public/ a docs/ (GitHub Pages lo permite)
cp -r public docs-deploy
# Configurar GitHub Pages con /docs-deploy como source
```

### Resultado
```
✅ https://TU_USUARIO.github.io/veridia-healthtech/
```

---

## Preparar el Deploy (cualquier opción)

### Antes de deploy, SIEMPRE:
```bash
# 1. Correr tests
npm run test:all
# Esperar: 281/281 unit ✅ + 62/62 E2E ✅

# 2. Sincronizar public/
npm run sync

# 3. (Opcional) Build single-file
npm run build
# → Genera portal-profesional-deploy.html (backup)
```

### Checklist pre-deploy:
- [ ] Tests pasando (343/343)
- [ ] `public/` sincronizada (`npm run sync`)
- [ ] API key de Gemini configurada (SuperAdmin → 🔑 APIs)
- [ ] Firestore rules publicadas (si usas Firebase)
- [ ] Verificar `manifest.json` tiene URLs correctas
- [ ] Probar en móvil / tablet

---

## Conectar Dominio `veridia.tech` (Opcional)

Si compras el dominio `veridia.tech` (desde ~$3/año en Namecheap, Cloudflare, Google Domains):

### En Firebase:
1. Console → Hosting → Añadir dominio
2. Agregar registros DNS:
   - **A** record → IPs de Firebase (te las da la consola)
   - **CNAME** `www` → `nutrisuite-6e44a.web.app`
3. SSL se genera automáticamente (Let's Encrypt)

### En Netlify:
1. Dashboard → Domain Settings → Add custom domain
2. Agregar **CNAME** `@` → `tu-sitio.netlify.app`
3. O usar Netlify DNS (delegar nameservers)

### En GitHub Pages:
1. Settings → Pages → Custom domain → `veridia.tech`
2. Agregar **CNAME** record en tu proveedor DNS
3. Crear archivo `public/CNAME` con contenido: `veridia.tech`

---

## Post-Deploy: Verificación

Después de deploy, verificar:
```
✅ Landing page carga                    → /
✅ Portal profesional funciona            → /app (o /portal-profesional.html)
✅ Login con nutri@veridia.tech/nutri123  → Dashboard
✅ Portal paciente carga                  → /portal
✅ Login demo@veridia.tech/demo           → Vista paciente
✅ SuperAdmin accesible                   → /admin
✅ PWA instalable (manifest + sw)         → Probar en Chrome mobile
✅ Dark mode toggle funciona
✅ BEDCA foods cargan (969)
✅ Firestore sync (si configurado)
```

---

## FAQ

**¿Puedo usar varias a la vez?**
Sí. Puedes tener Firebase + Netlify como backup. Son gratis ambas.

**¿Se pierde la data si uso hosting estático?**
No. Los datos se guardan en localStorage del navegador del usuario + Firestore en la nube.

**¿Necesito backend para que funcione?**
No. El backend Express/PostgreSQL es para el futuro (multi-tenant, etc). Todo funciona client-side.

**¿Cuántos usuarios soporta el plan gratuito?**
Con 2 MB de sitio y 10-100 GB de transferencia/mes: miles de visitas sin problema.

**¿Puedo hacer CI/CD automático?**
Sí. Con GitHub Actions puedes auto-deploy a Firebase o Netlify en cada push.
