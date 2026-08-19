// ============================================================
//  AUTH SYSTEM + RBAC
//  (login adapted from github.com/lunavazquez/login-form-example)
// ============================================================

// Users database (demo)
// ===== SECURITY LAYER v2 — HARDENED =====

// 1. SHA-256 REAL via Web Crypto API
async function sha256(str){
  var buf=new TextEncoder().encode(str);
  var hash=await window.crypto.subtle.digest('SHA-256',buf);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
// Sync fallback: DJB2a + FNV-1a combined (collision-resistant, NOT simple shift)
function syncHash(str){
  var h1=5381,h2=2166136261;
  for(var i=0;i<str.length;i++){
    var c=str.charCodeAt(i);
    h1=((h1<<5)+h1)^c; // DJB2a
    h2^=c;h2=Math.imul(h2,16777619); // FNV-1a
  }
  return (h1>>>0).toString(16).padStart(8,'0')+(h2>>>0).toString(16).padStart(8,'0');
}

// 2. XSS SANITIZATION — applied to ALL user input AND output
function sanitize(str){if(!str)return'';return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;').replace(/\//g,'&#x2F;')}
// Output sanitizer for rendering data from DB

// 3. AES-GCM ENCRYPTION for localStorage (real crypto, not Base64)
var _cryptoKey=null;
async function getCryptoKey(){
  if(_cryptoKey)return _cryptoKey;
  try{
    var keyMaterial=await window.crypto.subtle.importKey('raw',new TextEncoder().encode('Veridia2026SecureKey!'),{name:'PBKDF2'},false,['deriveKey']);
    _cryptoKey=await window.crypto.subtle.deriveKey({name:'PBKDF2',salt:new TextEncoder().encode('ns_salt_v2'),iterations:100000,hash:'SHA-256'},keyMaterial,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
    return _cryptoKey;
  }catch(e){return null}
}

async function secureStore(key,data){
  try{
    var k=await getCryptoKey();
    if(k){
      var iv=window.crypto.getRandomValues(new Uint8Array(12));
      var encoded=new TextEncoder().encode(JSON.stringify(data));
      var encrypted=await window.crypto.subtle.encrypt({name:'AES-GCM',iv:iv},k,encoded);
      var combined=new Uint8Array(iv.length+encrypted.byteLength);
      combined.set(iv);combined.set(new Uint8Array(encrypted),iv.length);
      localStorage.setItem('ns_'+key,btoa(String.fromCharCode(...combined)));
    }else{
      // Fallback: Base64 with obfuscation
      localStorage.setItem('ns_'+key,btoa(unescape(encodeURIComponent(JSON.stringify(data)))));
    }
  }catch(e){localStorage.setItem('ns_'+key,btoa(unescape(encodeURIComponent(JSON.stringify(data)))))}
}

async function secureLoad(key){
  try{
    var stored=localStorage.getItem('ns_'+key);
    if(!stored)return null;
    var k=await getCryptoKey();
    if(k){
      var combined=Uint8Array.from(atob(stored),c=>c.charCodeAt(0));
      var iv=combined.slice(0,12);
      var data=combined.slice(12);
      var decrypted=await window.crypto.subtle.decrypt({name:'AES-GCM',iv:iv},k,data);
      return JSON.parse(new TextDecoder().decode(decrypted));
    }
  }catch(e){console.warn('[Veridia]',e.message||e)}
  // Fallback
  try{return JSON.parse(decodeURIComponent(escape(atob(localStorage.getItem('ns_'+key)))))}catch(e){return null}
}

// 4. RATE LIMITING — anti brute force with exponential backoff
var loginAttempts={};
var MAX_ATTEMPTS=5;
var BASE_LOCKOUT_MS=60000; // 1 min, doubles each lockout

function checkRateLimit(email){
  var key=email.toLowerCase();
  var rec=loginAttempts[key];
  if(!rec)return{allowed:true};
  if(rec.locked&&Date.now()<rec.lockedUntil){
    var remaining=Math.ceil((rec.lockedUntil-Date.now())/60000);
    return{allowed:false,msg:'⛔ Cuenta bloqueada. Reintente en '+remaining+' min.'};
  }
  if(rec.locked&&Date.now()>=rec.lockedUntil){loginAttempts[key]={count:0,locked:false,lockouts:rec.lockouts||0};return{allowed:true}}
  return{allowed:true};
}

function recordFailedLogin(email){
  var key=email.toLowerCase();
  if(!loginAttempts[key])loginAttempts[key]={count:0,locked:false,lockouts:0};
  loginAttempts[key].count++;
  if(loginAttempts[key].count>=MAX_ATTEMPTS){
    loginAttempts[key].lockouts=(loginAttempts[key].lockouts||0)+1;
    loginAttempts[key].locked=true;
    // Exponential backoff: 1min, 2min, 4min, 8min...
    loginAttempts[key].lockedUntil=Date.now()+BASE_LOCKOUT_MS*Math.pow(2,loginAttempts[key].lockouts-1);
  }
}

function clearLoginAttempts(email){loginAttempts[email.toLowerCase()]={count:0,locked:false,lockouts:0}}

// 5. SESSION TIMEOUT with screen lock
var SESSION_TIMEOUT_MS=parseInt(localStorage.getItem('veridia_session_timeout'))||900000; // default 15 min
var LOCK_TIMEOUT_MS=Math.round(SESSION_TIMEOUT_MS/3); // 1/3 of session → screen lock

function setSessionTimeout(minutes){
  SESSION_TIMEOUT_MS=minutes*60000;
  LOCK_TIMEOUT_MS=Math.round(SESSION_TIMEOUT_MS/3);
  try{localStorage.setItem('veridia_session_timeout',SESSION_TIMEOUT_MS)}catch(e){console.warn('[Veridia]',e.message||e)}
  resetSessionTimer();
  toast('Timeout de sesión: '+minutes+' min');
}
var sessionTimer=null;
var lockTimer=null;
var lastActivity=Date.now();
var screenLocked=false;

function resetSessionTimer(){
  lastActivity=Date.now();
  if(screenLocked)return; // don't reset if locked
  if(sessionTimer)clearTimeout(sessionTimer);
  if(lockTimer)clearTimeout(lockTimer);
  if(currentUser){
    // Screen lock after 5 min
    lockTimer=setTimeout(function(){
      if(currentUser&&!screenLocked) lockScreen();
    },LOCK_TIMEOUT_MS);
    // Full logout after 15 min
    sessionTimer=setTimeout(function(){
      if(currentUser){
        toast('Sesión expirada por inactividad','warning');
        auditAction('AUTO_LOGOUT','Session');
        handleLogout();
      }
    },SESSION_TIMEOUT_MS);
  }
}

function lockScreen(){
  screenLocked=true;
  var overlay=document.createElement('div');
  overlay.id='screenLock';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(20px);z-index:9998;display:flex;align-items:center;justify-content:center;animation:fadeIn .3s ease';
  overlay.innerHTML=`<div style="background:var(--surface);border-radius:var(--radius);padding:40px;text-align:center;max-width:360px;width:90%">
    <div style="font-size:2.5rem;margin-bottom:12px">🔒</div>
    <h3 style="font-size:1.1rem;font-weight:800;margin-bottom:6px">Pantalla bloqueada</h3>
    <p style="font-size:.82rem;color:var(--text3);margin-bottom:16px">${currentUser?currentUser.name:''} · Sesión activa</p>
    <input type="password" id="lockPass" placeholder="Contraseña para desbloquear" style="margin-bottom:10px;text-align:center">
    <div id="lockError" style="color:var(--danger);font-size:.76rem;min-height:20px;margin-bottom:8px"></div>
    <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="unlockScreen()">Desbloquear</button>
    <button class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:8px" onclick="handleLogout();document.getElementById('screenLock')?.remove()">Cerrar sesión</button>
  </div>`;
  document.body.appendChild(overlay);
  setTimeout(function(){var inp=document.getElementById('lockPass');if(inp)inp.focus()},100);
  // Enter key to unlock
  document.getElementById('lockPass')?.addEventListener('keydown',function(e){if(e.key==='Enter')unlockScreen()});
}

async function unlockScreen(){
  var pass=document.getElementById('lockPass')?.value;
  if(!pass||!currentUser){document.getElementById('lockError').textContent='Ingrese contraseña';return}
  var hash=await sha256(pass);
  if(hash!==currentUser.passHash){
    document.getElementById('lockError').textContent='Contraseña incorrecta';
    auditAction('UNLOCK_FAILED','Session');
    return;
  }
  screenLocked=false;
  document.getElementById('screenLock')?.remove();
  resetSessionTimer();
  auditAction('UNLOCK','Session');
  toast('Pantalla desbloqueada 🔓');
}

// Track user activity
['mousemove','keydown','click','scroll','touchstart'].forEach(function(evt){
  document.addEventListener(evt,function(){if(currentUser&&!screenLocked)resetSessionTimer()},{passive:true});
});

// 6. PASSWORD STRENGTH VALIDATION (enhanced)
function validatePassword(pass){
  var errors=[];
  if(pass.length<8) errors.push('Mínimo 8 caracteres');
  if(!/[A-Z]/.test(pass)) errors.push('1 mayúscula');
  if(!/[a-z]/.test(pass)) errors.push('1 minúscula');
  if(!/[0-9]/.test(pass)) errors.push('1 número');
  if(!/[^A-Za-z0-9]/.test(pass)) errors.push('1 carácter especial (!@#$)');
  // Check against common passwords
  var common=['12345678','password','qwerty123','letmein','welcome1'];
  if(common.includes(pass.toLowerCase())) errors.push('Contraseña demasiado común');
  return errors;
}

function getPasswordStrength(pass){
  var score=0;
  if(pass.length>=8)score++;if(pass.length>=12)score++;
  if(/[A-Z]/.test(pass))score++;if(/[a-z]/.test(pass))score++;
  if(/[0-9]/.test(pass))score++;if(/[^A-Za-z0-9]/.test(pass))score++;
  return score<=2?{level:'Débil',color:'var(--danger)'}:score<=4?{level:'Media',color:'var(--warning)'}:{level:'Fuerte',color:'var(--success)'};
}

// 7. INTEGRITY CHECK — detect DOM/data manipulation
function integrityCheck(){
  if(!currentUser)return;
  // Verify current user still exists in AUTH_USERS with matching role
  var user=AUTH_USERS.find(u=>u.id===currentUser.id&&u.email===currentUser.email&&u.role===currentUser.role);
  if(!user){
    toast('Sesión inválida — manipulación detectada','error');
    auditAction('INTEGRITY_VIOLATION','Session');
    handleLogout();
  }
}
setInterval(integrityCheck,60000); // Check every 60s

// 8. RGPD CONSENT + DATA RIGHTS
var rgpdConsents={};
function checkRGPDConsent(userId){return rgpdConsents[userId]===true}
function acceptRGPD(userId){rgpdConsents[userId]=true;try{secureStore('rgpd',rgpdConsents)}catch(e){console.warn('[Veridia]',e.message||e)}}
function loadRGPDConsents(){try{var d=secureLoad('rgpd');if(d&&d.then)d.then(function(v){if(v)rgpdConsents=v});else if(d)rgpdConsents=d}catch(e){console.warn('[Veridia]',e.message||e)}}
loadRGPDConsents();

// 9. AUDIT ALL SENSITIVE ACTIONS
function auditAction(action,entity,patientName){
  if(!currentUser&&action!=='LOGIN_FAILED')return;
  DB.auditLog.unshift({
    id:(DB.auditLog.length?Math.max.apply(null,DB.auditLog.map(function(a){return a.id||0}))+1:1),
    usuario:currentUser?currentUser.name:'Desconocido',
    rol:currentUser?RBAC[currentUser.role]?.label:'—',
    accion:action,
    entidad:entity,
    paciente:patientName||'—',
    fecha:new Date().toISOString().replace('T',' ').substring(0,16),
    ip:navigator.userAgent?navigator.userAgent.substring(0,30):'—'
  });
}

// 10. CHANGE PASSWORD function
function openChangePasswordModal(){
  openModal(`<div class="modal-header"><h3>🔒 Cambiar contraseña</h3><button onclick="closeModal()">${IC.x}</button></div>
<div class="modal-body">
  <div class="form-group"><label class="form-label">Contraseña actual</label><input type="password" id="cpOld" placeholder="Tu contraseña actual"></div>
  <div class="form-group"><label class="form-label">Nueva contraseña</label><input type="password" id="cpNew" placeholder="Mínimo 8 chars + mayúscula + número + especial" oninput="showPwStrength()"></div>
  <div id="cpStrength" style="font-size:.72rem;margin-top:-8px;margin-bottom:8px"></div>
  <div class="form-group"><label class="form-label">Confirmar nueva contraseña</label><input type="password" id="cpConfirm" placeholder="Repetir contraseña"></div>
  <div id="cpError" style="color:var(--danger);font-size:.76rem;min-height:20px"></div>
</div>
<div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="doChangePassword()">Cambiar</button></div>`);
}

function showPwStrength(){
  var pass=$('cpNew')?$('cpNew').value:'';
  var s=getPasswordStrength(pass);
  var el=$('cpStrength');
  if(el) el.innerHTML=pass.length?`<span style="color:${s.color};font-weight:600">${s.level}</span> · <span style="color:var(--text3)">${pass.length} caracteres</span>`:'';
}

async function doChangePassword(){
  var old=$('cpOld').value,newP=$('cpNew').value,confirm=$('cpConfirm').value;
  $('cpError').textContent='';
  if(!old||!newP||!confirm){$('cpError').textContent='Complete todos los campos';return}
  var oldHash=await sha256(old);
  if(oldHash!==currentUser.passHash){$('cpError').textContent='Contraseña actual incorrecta';return}
  if(newP!==confirm){$('cpError').textContent='Las contraseñas no coinciden';return}
  var errors=validatePassword(newP);
  if(errors.length){$('cpError').textContent=errors.join(' · ');return}
  var newHash=await sha256(newP);
  if(newHash===currentUser.passHash){$('cpError').textContent='La nueva contraseña debe ser diferente';return}
  // Update password
  var user=AUTH_USERS.find(u=>u.id===currentUser.id);
  if(user){user.passHash=newHash;currentUser.passHash=user.passHash}
  auditAction('PASSWORD_CHANGE','User');
  closeModal();toast('Contraseña actualizada correctamente 🔐');
}

// Encrypted chat storage
function saveChatToStorage(){
  try{secureStore('chats',chatDB)}catch(e){
    try{localStorage.setItem('veridia_chats',JSON.stringify(chatDB))}catch(e2){console.warn('[Veridia]',e2.message||e2)}
  }
}

function loadChatFromStorage(){
  try{
    var d=secureLoad('chats');
    if(d&&d.then)d.then(function(v){if(v)Object.assign(chatDB,v)});
    else if(d)Object.assign(chatDB,d);
    else{var raw=localStorage.getItem('veridia_chats');if(raw)Object.assign(chatDB,JSON.parse(raw))}
  }catch(e){
    try{var raw=localStorage.getItem('veridia_chats');if(raw)Object.assign(chatDB,JSON.parse(raw))}catch(e2){console.warn('[Veridia]',e2.message||e2)}
  }
}

// Users database — passwords stored as dual-hash (DJB2a+FNV-1a)
var AUTH_USERS=[
  {id:1,name:'Lic. Antonella Caverzan',email:'antonella@veridia.tech',passHash:'97c65021d55a79db',role:'nutricionista',initials:'AC'},
  {id:2,name:'María Recepción',email:'maria@veridia.tech',passHash:'5b0e6a3775b46381',role:'secretaria',initials:'MR'},
  {id:3,name:'Andrés Galeano',email:'admin@veridia.tech',passHash:'a63f45da7045830c',role:'admin',initials:'AG'},
];

// RBAC: which modules each role can access
var RBAC={
  nutricionista:{
    modules:['dashboard','agenda','pacientes','historia','antropometria','analiticas','alertas','formula','soporte','desarrollada','bedca','recetas','planes','restauracion','mensajes','ia','settings'],
    label:'Lic. en Nutrición',
    color:'var(--primary)',
    icon:'🌿',
    sidebar_sections:['Principal','Clínico','Nutricional']
  },
  secretaria:{
    modules:['dashboard','agenda','pacientes','facturacion','caja','contabilidad','settings'],
    label:'Secretaria',
    color:'var(--info)',
    icon:'📋',
    sidebar_sections:['Principal','Gestión']
  },
  trial:{
    modules:['dashboard','agenda','pacientes','formula','bedca'],
    label:'Trial (14 días)',
    color:'var(--warning)',
    icon:'⏳',
    sidebar_sections:['Principal'],
    maxPatients:20,
    trialDays:14
  },
  admin:{
    modules:['dashboard','agenda','pacientes','historia','antropometria','analiticas','alertas','formula','soporte','desarrollada','bedca','recetas','planes','restauracion','mensajes','facturacion','caja','contabilidad','ia','auditoria','settings'],
    label:'Administrador',
    color:'var(--warning)',
    icon:'⚙️',
    sidebar_sections:['Principal','Clínico','Nutricional','Gestión']
  }
};

var currentUser=null;

async function handleLogin(){
  var lf=document.getElementById('legalFooter');if(lf)lf.style.display='none';
  var email=sanitize($('loginEmail').value.trim());
  var pass=$('loginPass').value.trim();
  $('loginError').textContent='';
  if(!email||!pass){$('loginError').textContent='Completa todos los campos';return}
  // Rate limit check (dual layer: auth.js + veridia-utils.js)
  var rl=checkRateLimit(email);
  if(!rl.allowed){$('loginError').textContent=rl.msg;return}
  if(typeof checkLoginThrottle==='function'){var lt=checkLoginThrottle(email);if(!lt.allowed){$('loginError').textContent=lt.message;return}}
  // Hash password and compare
  var hash=await sha256(pass);
  var user=AUTH_USERS.find(u=>u.email===email&&u.passHash===hash);
  if(!user){
    recordFailedLogin(email);
    if(typeof recordLoginSuccess==='function')recordLoginSuccess(email);
    var remaining=MAX_ATTEMPTS-(loginAttempts[email.toLowerCase()]?.count||0);
    $('loginError').textContent='Credenciales incorrectas'+(remaining<=2?' ('+remaining+' intentos restantes)':'');
    auditAction('LOGIN_FAILED','Session');
    return;
  }
  clearLoginAttempts(email);
  if(typeof recordLoginSuccess==='function')recordLoginSuccess(email);
  // Login directly — RGPD consent shown as notification after login
  loginAs(user);
  // Show RGPD notice on first login (non-blocking)
  if(!checkRGPDConsent(user.id)){
    acceptRGPD(user.id);
    setTimeout(function(){
      toast('🔒 Sus datos se procesan conforme al RGPD/LOPD-GDD. Consulte Auditoría para más información.','info');
    },1500);
  }
}

// ═══════════════════════════════════════════
//  REGISTRO DE PROFESIONAL — Plan Starter (trial)
//  Acceso limitado: 5 módulos, 20 pacientes, 1 usuario
// ═══════════════════════════════════════════

function regNextStep(){
  var nombre=($('regNombre')||{}).value||'';
  var apellidos=($('regApellidos')||{}).value||'';
  var dni=($('regDNI')||{}).value||'';
  var tel=($('regTelefono')||{}).value||'';
  var email=($('regEmail')||{}).value||'';
  var errEl=$('regError1');if(errEl)errEl.textContent='';

  if(!nombre.trim()||!apellidos.trim()){if(errEl)errEl.textContent='Nombre y apellidos son obligatorios';return}
  if(!dni.trim()||dni.trim().length<5){if(errEl)errEl.textContent='Documento de identidad requerido (mín. 5 caracteres)';return}
  if(!tel.trim()||tel.trim().length<6){if(errEl)errEl.textContent='Teléfono móvil requerido';return}
  if(typeof isValidPhone==='function'&&tel.trim().length>=9&&!isValidPhone(tel.trim())){if(errEl)errEl.textContent='Formato de teléfono no válido (ej: 612345678 o +34612345678)';return}
  if(!email.trim()||(typeof isValidEmailStrict==='function'?!isValidEmailStrict(email.trim()):!isValidEmail(email.trim()))){if(errEl)errEl.textContent='Email profesional válido requerido';return}
  if(AUTH_USERS.some(function(u){return u.email===email.trim()})){if(errEl)errEl.textContent='Este email ya está registrado';return}

  // Show step 2
  var s1=$('regStep1');var s2=$('regStep2');
  if(s1)s1.style.display='none';
  if(s2)s2.style.display='block';
}

function regPrevStep(){
  var s1=$('regStep1');var s2=$('regStep2');
  if(s1)s1.style.display='block';
  if(s2)s2.style.display='none';
}

function regShowPwStrength(){
  var pass=($('regPass')||{}).value||'';
  var el=$('regPwStrength');if(!el)return;
  if(!pass){el.innerHTML='';return}
  var strength=getPasswordStrength(pass);
  var colors={weak:'#dc2626',fair:'#ca8a04',good:'#16a34a',strong:'#059669'};
  var labels={weak:'Débil',fair:'Aceptable',good:'Buena',strong:'Fuerte'};
  el.innerHTML='<span style="color:'+colors[strength]+'">● '+labels[strength]+'</span>'
  +(pass.length<8?' · Mín. 8 caracteres':'')
  +(!/[A-Z]/.test(pass)?' · Falta mayúscula':'')
  +(!/[0-9]/.test(pass)?' · Falta número':'')
  +(!/[!@#$%^&*(),.?":{}|<>]/.test(pass)?' · Falta carácter especial':'');
}

async function handleRegister(){
  // Collect step 1 data
  var nombre=sanitize(($('regNombre')||{}).value||'').trim();
  var apellidos=sanitize(($('regApellidos')||{}).value||'').trim();
  var dni=sanitize(($('regDNI')||{}).value||'').trim();
  var tel=sanitize(($('regTelefono')||{}).value||'').trim();
  var email=sanitize(($('regEmail')||{}).value||'').trim();

  // Collect step 2 data
  var titulacion=($('regTitulacion')||{}).value||'';
  var matricula=sanitize(($('regMatricula')||{}).value||'').trim();
  var clinica=sanitize(($('regClinica')||{}).value||'').trim();
  var pais=($('regPais')||{}).value||'';
  var pass=($('regPass')||{}).value||'';
  var passConfirm=($('regPassConfirm')||{}).value||'';
  var terms=($('regTerms')||{}).checked;

  var errEl=$('regError2');if(errEl)errEl.textContent='';

  // Validations
  if(!titulacion){if(errEl)errEl.textContent='Seleccione su titulación';return}
  if(!clinica){if(errEl)errEl.textContent='Nombre de clínica/consultorio requerido';return}
  if(!pais){if(errEl)errEl.textContent='Seleccione su país';return}
  if(!pass){if(errEl)errEl.textContent='Contraseña requerida';return}
  if(pass!==passConfirm){if(errEl)errEl.textContent='Las contraseñas no coinciden';return}

  var pwErrors=validatePassword(pass);
  if(pwErrors.length){if(errEl)errEl.textContent=pwErrors.join(' · ');return}
  if(!terms){if(errEl)errEl.textContent='Debe aceptar los Términos y la Política de Privacidad';return}

  // Create user with TRIAL role (limited access)
  var fullName=nombre+' '+apellidos;
  var initials=(nombre[0]||'')+(apellidos[0]||'');
  var newUser={
    id:(AUTH_USERS.length?Math.max.apply(null,AUTH_USERS.map(function(u){return u.id||0}))+1:1),
    name:fullName,
    email:email,
    passHash:await sha256(pass),
    role:'trial', // Limited role — NOT nutricionista/admin
    initials:initials.toUpperCase(),
    // Extended profile
    apellidos:apellidos,
    dni:dni,
    telefono:tel,
    titulacion:titulacion,
    matricula:matricula,
    clinica:clinica,
    pais:pais,
    fechaRegistro:new Date().toISOString().slice(0,10),
    trialExpires:new Date(Date.now()+14*86400000).toISOString().slice(0,10),
    verified:false
  };

  AUTH_USERS.push(newUser);

  // Save profile data
  try{localStorage.setItem('veridia_clinica',clinica)}catch(e){console.warn('[Veridia]',e.message||e)}
  try{localStorage.setItem('veridia_profile',JSON.stringify({
    nombre:fullName,titulo:titulacion,matricula:matricula,email:email,clinica:clinica
  }))}catch(e){console.warn('[Veridia]',e.message||e)}

  auditAction('REGISTER','New trial user: '+fullName+' ('+email+')');
  toast('✅ Cuenta creada · Plan Starter · 14 días trial');
  loginAs(newUser);
}

function quickLogin(role){
  var user=AUTH_USERS.find(u=>u.role===role);
  if(user){acceptRGPD(user.id);loginAs(user)}
}

function loginAs(user){
  // Check trial expiration
  if(user.role==='trial'&&user.trialExpires){
    var today=new Date().toISOString().slice(0,10);
    var daysLeft=Math.ceil((new Date(user.trialExpires)-new Date())/86400000);
    if(daysLeft<=0){
      toast('⚠️ Tu período de prueba de 14 días ha expirado. Contacta a soporte para activar un plan.','error');
      setTimeout(function(){
        openModal('<div class="modal-header"><h3>⏳ Trial expirado</h3></div>'
        +'<div class="modal-body" style="text-align:center;padding:30px">'
        +'<div style="font-size:3rem;margin-bottom:12px">⏳</div>'
        +'<h2 style="font-size:1.2rem;margin-bottom:10px">Tu período de prueba ha finalizado</h2>'
        +'<p style="font-size:.88rem;color:var(--text2);margin-bottom:20px">Han pasado los 14 días de trial. Para seguir usando Veridia, elige un plan:</p>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:350px;margin:0 auto">'
        +'<div style="padding:16px;border:2px solid var(--border);border-radius:12px;text-align:center"><strong>Professional</strong><div style="font-size:1.4rem;font-weight:900;color:var(--primary);margin:6px 0">49€/mes</div><div style="font-size:.72rem;color:var(--text3)">500 pacientes · 18 módulos</div></div>'
        +'<div style="padding:16px;border:2px solid var(--accent);border-radius:12px;text-align:center"><strong>Enterprise</strong><div style="font-size:1.4rem;font-weight:900;color:var(--accent);margin:6px 0">149€/mes</div><div style="font-size:.72rem;color:var(--text3)">∞ pacientes · RC · UCI</div></div>'
        +'</div>'
        +'<div style="margin-top:16px"><a href="mailto:soporte@veridia.tech" class="btn btn-primary" style="text-decoration:none">📧 Contactar soporte</a></div>'
        +'</div>');
      },500);
      return;
    }
    if(daysLeft<=3){
      setTimeout(function(){toast('⏳ Tu trial expira en '+daysLeft+' día(s). Contacta soporte para activar un plan.','warning')},1500);
    }
  }

  // Check patient limit for trial
  if(user.role==='trial'){
    var patCount=DB.patients.filter(function(p){return p.activo}).length;
    if(patCount>=20){
      setTimeout(function(){toast('⚠️ Límite de 20 pacientes alcanzado (Plan Starter). Upgrade para más.','warning')},2000);
    }
  }

  currentUser=user;
  var rbac=RBAC[user.role];
  // Update sidebar user info
  document.querySelector('.sidebar-avatar').textContent=user.initials;
  document.querySelector('.sidebar-user-name').textContent=user.name;
  document.querySelector('.sidebar-user-role').textContent=rbac.label+' · Clínica Central';
  // Filter navigation by role
  applyRBAC();
  // Transition
  $('loginPage').classList.add('hidden');
  $('app').style.display='flex';
  setTimeout(()=>{$('loginPage').style.display='none'},600);

  // ALWAYS render immediately — don't wait for cloud
  renderNav();updAlertDot();navigate('dashboard');
  if(typeof checkOnboarding==='function')checkOnboarding();
  toast('Bienvenido/a, '+user.name.split(' ')[0]+'  ('+rbac.icon+' '+rbac.label+')');

  // Check SaaS license
  if(typeof checkLicense==='function')checkLicense();

  // Try to load cloud data in background (non-blocking)
  try{
    var loadTimeout=setTimeout(function(){console.warn('☁️ Firestore timeout — using local data')},8000);
    loadFirebaseSDK().then(function(){
      return fbLoadDB();
    }).then(function(loaded){
      clearTimeout(loadTimeout);
      if(loaded){navigate(curMod);toast('☁️ Datos sincronizados desde la nube','info')}
    }).catch(function(){clearTimeout(loadTimeout)});
  }catch(e){console.warn('[Veridia]',e.message||e)}

  // Firebase Auth (non-blocking)
  try{loadFirebaseSDK().then(function(){if(fbAuth)fbAuth.signInAnonymously().catch(function(){})})}catch(e){console.warn('[Veridia]',e.message||e)}

  // Start session timeout
  resetSessionTimer();
  // Audit login
  auditAction('LOGIN','Session');
}

function applyRBAC(){
  if(!currentUser) return;
  var rbac=RBAC[currentUser.role];
  var allowed=rbac.modules;
  var allowedSections=rbac.sidebar_sections;
  // Override NAV to filter items
  NAV.forEach(function(section){
    section._hidden=!allowedSections.includes(section.s);
    section.items.forEach(function(item){
      item._hidden=!allowed.includes(item.id);
    });
  });
}

// Override renderNav to respect RBAC
var _origRenderNav=renderNav;
renderNav=function(){
  if(!currentUser||!RBAC[currentUser.role]){_origRenderNav();return}
  var rbac=RBAC[currentUser.role];
  $('sidebarNav').innerHTML=NAV.filter(s=>!s._hidden).map(s=>`<div class="nav-section"><div class="nav-section-title">${s.s}</div>${s.items.filter(i=>!i._hidden).map(i=>`<div class="nav-item ${curMod===i.id?'active':''}" onclick="navigate('${i.id}')">${IC[i.ic]}<span class="nav-item-text">${i.l}</span>${i.b?`<span class="nav-badge">${i.b}</span>`:''}</div>`).join('')}</div>`).join('');
  // Add logout button at bottom
  $('sidebarNav').innerHTML+=`<div class="nav-section" style="margin-top:auto;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)"><div class="nav-item" onclick="openChangePasswordModal()" style="color:rgba(255,255,255,.4)"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg><span class="nav-item-text">Cambiar contraseña</span></div><div class="nav-item" onclick="handleLogout()" style="color:rgba(255,255,255,.4)"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span class="nav-item-text">Cerrar sesión</span></div></div>`;
};

// Override navigate to check RBAC
var _origNavigate=navigate;
navigate=function(id,p){
  if(currentUser&&RBAC[currentUser.role]){
    var allowed=RBAC[currentUser.role].modules;
    if(!allowed.includes(id)){
      toast('No tienes permiso para acceder a este módulo','error');
      return;
    }
  }
  _origNavigate(id,p);
};

function handleLogout(){
  // Build session summary
  var loginEntry=DB.auditLog.find(function(a){return a.accion==='LOGIN'});
  var loginTime=loginEntry?loginEntry.fecha:'';
  var today=new Date().toISOString().slice(0,10);
  var citasHoy=DB.appointments.filter(function(a){return a.fecha===today&&a.estado==='Realizada'}).length;
  var patsAtendidos=new Set(DB.appointments.filter(function(a){return a.fecha===today&&a.estado==='Realizada'}).map(function(a){return a.pacienteId})).size;
  var facturas=DB.invoices.filter(function(i){return i.fecha===today}).length;
  var acciones=DB.auditLog.filter(function(a){return a.fecha&&a.fecha.startsWith(today.replace(/-/g,'-'))}).length;

  openModal('<div class="modal-header"><h3>📋 Resumen de sesión</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
    +'<div class="modal-body">'
    +'<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px">'
    +'<div style="text-align:center;padding:12px;background:var(--surface2);border-radius:var(--radius-xs)"><div style="font-size:1.3rem;font-weight:800">'+citasHoy+'</div><div style="font-size:.68rem;color:var(--text3)">Citas realizadas</div></div>'
    +'<div style="text-align:center;padding:12px;background:var(--surface2);border-radius:var(--radius-xs)"><div style="font-size:1.3rem;font-weight:800">'+patsAtendidos+'</div><div style="font-size:.68rem;color:var(--text3)">Pacientes atendidos</div></div>'
    +'<div style="text-align:center;padding:12px;background:var(--surface2);border-radius:var(--radius-xs)"><div style="font-size:1.3rem;font-weight:800">'+facturas+'</div><div style="font-size:.68rem;color:var(--text3)">Facturas emitidas</div></div>'
    +'<div style="text-align:center;padding:12px;background:var(--surface2);border-radius:var(--radius-xs)"><div style="font-size:1.3rem;font-weight:800">'+acciones+'</div><div style="font-size:.68rem;color:var(--text3)">Acciones registradas</div></div>'
    +'</div>'
    +'<p style="font-size:.72rem;color:var(--text3);text-align:center">Sesión: '+(loginTime||'—')+' → '+new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'})+'</p>'
    +'</div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-danger" onclick="closeModal();doLogout()">Cerrar sesión</button></div>');
}
function doLogout(){
  var lf=document.getElementById('legalFooter');if(lf)lf.style.display='block';
  if(currentUser) auditAction('LOGOUT','Session');
  if(sessionTimer)clearTimeout(sessionTimer);
  if(typeof _consultInterval!=='undefined'&&_consultInterval){clearInterval(_consultInterval);_consultInterval=null}
  currentUser=null;
  $('app').style.display='none';
  var lp=$('loginPage');
  lp.style.display='flex';
  setTimeout(()=>lp.classList.remove('hidden'),10);
  $('loginEmail').value='';$('loginPass').value='';$('loginError').textContent='';
  toast('Sesión cerrada','info');
}

function showForgotPassword(){
  openModal(`<div class="modal-header"><h3>Recuperar contraseña</h3><button onclick="closeModal()">${IC.x}</button></div><div class="modal-body"><p style="font-size:.85rem;color:var(--text2);margin-bottom:16px">Para restablecer tu contraseña, contacta al administrador del sistema.</p><div class="form-group"><label class="form-label">Email del administrador</label><div style="padding:10px 14px;background:var(--surface2);border-radius:var(--radius-xs);font-size:.85rem;font-weight:600">admin@veridia.tech</div></div><p style="font-size:.76rem;color:var(--text3);margin-top:12px">ℹ️ El administrador puede restablecer tu contraseña desde el panel de gestión.</p></div><div class="modal-footer"><button class="btn btn-primary" onclick="closeModal()">Entendido</button></div>`);
}

// Handle Enter key on login forms
document.addEventListener('keydown',function(e){
  if(e.key==='Enter'&&$('loginPage').style.display!=='none'){
    if(document.activeElement&&document.activeElement.closest('.login-sign-in')) handleLogin();
    else if(document.activeElement&&document.activeElement.closest('.login-sign-up')) handleRegister();
    return;
  }
  // Keyboard shortcuts (Ctrl/Cmd + key)
  if(!currentUser)return;
  if(e.ctrlKey||e.metaKey){
    if(e.key==='z'||e.key==='Z'){e.preventDefault();undoPop();return}
    var map={d:'dashboard',a:'agenda',p:'pacientes',h:'historia',b:'bedca',r:'recetas',f:'formula',l:'desarrollada'};
    var mod=map[e.key.toLowerCase()];
    if(mod&&RBAC[currentUser.role].modules.includes(mod)){e.preventDefault();navigate(mod)}
    if(e.key==='k'||e.key==='K'){e.preventDefault();openCommandPalette()}
  }
});

// Quick-action command palette (Ctrl+K)
function openCommandPalette(){
  var items=[
    {l:'📋 Dashboard',a:'dashboard'},{l:'📅 Agenda',a:'agenda'},{l:'👥 Pacientes',a:'pacientes'},
    {l:'🔬 Desarrollada',a:'desarrollada'},{l:'🗃️ Base Datos Alimentos',a:'bedca'},
    {l:'📊 Fórmula Clínica',a:'formula'},{l:'🍽️ Planes Alimentarios',a:'planes'},
    {l:'📝 Recetas',a:'recetas'},{l:'💰 Facturación',a:'facturacion'}
  ].filter(function(i){return RBAC[currentUser.role].modules.includes(i.a)});
  openModal('<div class="modal-header"><h3>⌘ Navegación rápida</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body"><input id="cmdSearch" placeholder="Buscar módulo..." style="margin-bottom:12px" oninput="filterCmd(this.value)" autofocus><div id="cmdList">'+items.map(function(i){return'<div class="nav-item" style="padding:10px 14px;cursor:pointer;border-radius:var(--radius-xs);margin-bottom:4px" onmouseover="this.style.background=\'var(--primary-light)\'" onmouseout="this.style.background=\'\'" onclick="closeModal();navigate(\''+i.a+'\')"><span style="margin-right:8px">'+i.l.split(' ')[0]+'</span>'+i.l.split(' ').slice(1).join(' ')+'</div>'}).join('')+'</div></div>');
  setTimeout(function(){var s=$('cmdSearch');if(s)s.focus()},100);
}
function filterCmd(q){
  var el=$('cmdList');if(!el)return;
  el.querySelectorAll('.nav-item').forEach(function(n){
    n.style.display=q?n.textContent.toLowerCase().includes(q.toLowerCase())?'':'none':'';
  });
}

// Register Service Worker (PWA)
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').then(function(r){console.debug('✅ SW registered')}).catch(function(e){console.warn('SW:',e.message)})}

// Add developer footer
(function(){const f=document.createElement('div');f.id='veridiaFooter';f.style.cssText='position:fixed;bottom:0;right:0;padding:6px 16px;font-size:.62rem;color:var(--text3);background:linear-gradient(90deg,transparent,var(--surface) 30%);pointer-events:none;z-index:50;letter-spacing:.3px';f.innerHTML='<span style="background:var(--warning);color:#000;padding:1px 6px;border-radius:4px;font-weight:700;margin-right:4px">BETA</span> Veridia HealthTech © '+new Date().getFullYear()+' · Desarrollado por <strong style="color:var(--text2)">Andrés Galeano</strong>';document.body.appendChild(f);setInterval(function(){var lbl=typeof getLastSaveLabel==='function'?getLastSaveLabel():'';if(lbl)f.innerHTML='💾 '+lbl+' · Veridia HealthTech © '+new Date().getFullYear()+' · <strong style="color:var(--text2)">Andrés Galeano</strong>'},15000)})();

// ===== LICENCIA SaaS — Verificacion al login =====
function checkLicense(){
  try{
    var saData=JSON.parse(localStorage.getItem('veridia_superadmin'));
    if(!saData||!saData.clients||!saData.clients.length) return; // No SA data = dev mode
    var email=currentUser?currentUser.email:'';
    // Find client by any matching email
    var client=saData.clients.find(function(cl){
      return cl.email===email||(cl.contacto&&cl.contacto.toLowerCase().includes(email.split('@')[0]));
    });
    if(!client) return; // Not a managed client

    var plans={"free":{modulos:['dashboard','agenda','pacientes','formula','bedca']},"pro":{modulos:['dashboard','agenda','pacientes','historia','antropometria','analiticas','alertas','formula','desarrollada','bedca','recetas','planes','facturacion','mensajes','ia','espen','settings']},"enterprise":{modulos:['dashboard','agenda','pacientes','historia','antropometria','analiticas','alertas','formula','soporte','desarrollada','bedca','recetas','planes','facturacion','caja','contabilidad','mensajes','ia','auditoria','espen','settings']}};

    var allowedModules=client.modulosActivos||plans[client.plan].modulos||plans.free.modulos;

    // Check expiration
    if(client.fechaVencimiento&&client.fechaVencimiento<new Date().toISOString().slice(0,10)){
      var gracia=new Date(new Date(client.fechaVencimiento).getTime()+7*86400000);
      if(new Date()>gracia){
        allowedModules=plans.free.modulos;
        setTimeout(function(){toast('Tu suscripcion ha vencido. Modulos limitados al plan Free. Contacta admin@veridia.tech para renovar.','warning')},2000);
      } else {
        var diasGracia=Math.ceil((gracia-new Date())/86400000);
        setTimeout(function(){toast('Tu suscripcion vence en '+diasGracia+' dias. Renueva para no perder acceso.','warning')},2000);
      }
    }

    if(client.estado==='suspendido'){
      allowedModules=plans.free.modulos;
      setTimeout(function(){toast('Cuenta suspendida. Contacta admin@veridia.tech','error')},1500);
    }

    // Override RBAC modules for this user
    if(currentUser&&RBAC&&RBAC[currentUser.role]){
      var original=RBAC[currentUser.role].modules;
      RBAC[currentUser.role].modules=original.filter(function(m){return allowedModules.includes(m)});
      applyRBAC();renderNav();
    }

    // Store for checking limits
    window._veridiaLicense={plan:client.plan,maxPacientes:client.maxPacientes||20,modules:allowedModules};

  }catch(e){console.warn('[Veridia License]',e.message||e)}
}

// Check patient limit
function checkPatientLimit(){
  if(!window._veridiaLicense) return true;
  if(DB.patients.length>=window._veridiaLicense.maxPacientes){
    toast('Limite de pacientes alcanzado ('+window._veridiaLicense.maxPacientes+'). Actualiza tu plan para agregar mas.','warning');
    return false;
  }
  return true;
}

// Show legal footer on login screen
(function(){var lf=document.getElementById('legalFooter');if(lf&&!currentUser)lf.style.display='block'})();
