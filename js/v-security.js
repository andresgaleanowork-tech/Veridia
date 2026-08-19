// ═══════════════════════════════════════════════════════
// VERIDIA HEALTHTECH — v-security.js
// Security: XSS prevention, validators, login protection,
// centralized logging, safe parsing
// ═══════════════════════════════════════════════════════

// B2.1: XSS Prevention
function safeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// D3.1: Safe numeric parsing
function safeInt(v, fallback) { var n = parseInt(v, 10); return isNaN(n) ? (fallback !== undefined ? fallback : 0) : n }
function safeFloat(v, fallback) { var n = parseFloat(v); return isNaN(n) || !isFinite(n) ? (fallback !== undefined ? fallback : 0) : n }

// D4.1: Clinical range validators
var CLINICAL_RANGES = {
  peso:{min:0.3,max:500,unit:'kg',label:'Peso'}, altura:{min:20,max:250,unit:'cm',label:'Altura'},
  imc:{min:8,max:90,unit:'kg/m²',label:'IMC'}, cintura:{min:20,max:200,unit:'cm',label:'Cintura'},
  cadera:{min:40,max:200,unit:'cm',label:'Cadera'}, pantorrilla:{min:10,max:80,unit:'cm',label:'Pantorrilla'},
  grasa:{min:1,max:70,unit:'%',label:'% Grasa'}, musculo:{min:5,max:80,unit:'kg',label:'Masa muscular'},
  edad:{min:0,max:120,unit:'años',label:'Edad'}, kcal:{min:200,max:8000,unit:'kcal',label:'Kilocalorías'},
  proteina:{min:0,max:500,unit:'g',label:'Proteína'}, glucosa:{min:10,max:800,unit:'mg/dL',label:'Glucosa'},
  presion_s:{min:50,max:300,unit:'mmHg',label:'Presión sistólica'}, presion_d:{min:20,max:200,unit:'mmHg',label:'Presión diastólica'},
  fc:{min:20,max:300,unit:'lpm',label:'Frecuencia cardíaca'}, temp:{min:30,max:45,unit:'°C',label:'Temperatura'},
  pliegue:{min:1,max:80,unit:'mm',label:'Pliegue cutáneo'}, dinamometria:{min:0,max:100,unit:'kg',label:'Dinamometría'}
};
function validateRange(field, value) {
  var r = CLINICAL_RANGES[field]; if (!r) return { valid: true };
  var v = safeFloat(value);
  if (v < r.min || v > r.max) return { valid: false, message: r.label + ' fuera de rango: ' + v + ' ' + r.unit + ' (esperado ' + r.min + '–' + r.max + ')' };
  return { valid: true, value: v };
}

// D4.2: Spanish DNI/NIE
function isValidDNI(dni) {
  if (!dni) return false; var d = dni.toUpperCase().trim();
  if (/^\d{8}[A-Z]$/.test(d)) { var letters = 'TRWAGMYFPDXBNJZSQVHLCKE'; return d[8] === letters[parseInt(d.substring(0, 8)) % 23] }
  if (/^[XYZ]\d{7}[A-Z]$/.test(d)) { var prefix = { X: '0', Y: '1', Z: '2' }; var num = prefix[d[0]] + d.substring(1, 8); var letters2 = 'TRWAGMYFPDXBNJZSQVHLCKE'; return d[8] === letters2[parseInt(num) % 23] }
  return false;
}

// D4.3: Email
function isValidEmailStrict(email) {
  if (!email) return false;
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(email);
}

// D4.4: Phone
function isValidPhone(tel) {
  if (!tel) return false; var clean = tel.replace(/[\s\-\(\)\.]/g, '');
  return /^(\+34)?[679]\d{8}$/.test(clean);
}

// D4.6: Dates
function isValidDate(dateStr) { if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false; var d = new Date(dateStr); return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr }
function isFutureDate(dateStr) { return isValidDate(dateStr) && dateStr > new Date().toISOString().slice(0, 10) }
function isPastDate(dateStr) { return isValidDate(dateStr) && dateStr < new Date().toISOString().slice(0, 10) }
function isReasonableBirthDate(dateStr) { if (!isValidDate(dateStr)) return false; var y = parseInt(dateStr.substring(0, 4)); var now = new Date().getFullYear(); return y >= (now - 120) && y <= now }

// D3.9: Centralized Logger
var VLog = {
  _level: 1, _history: [], _maxHistory: 200,
  _log: function(level, tag, args) { var entry = { time: new Date().toISOString(), level: level, tag: tag, message: Array.prototype.slice.call(args).map(function(a) { return typeof a === 'object' ? JSON.stringify(a) : String(a) }).join(' ') }; this._history.push(entry); if (this._history.length > this._maxHistory) this._history.shift() },
  error: function(tag) { this._log('ERROR', tag, Array.prototype.slice.call(arguments, 1)); if (this._level >= 1) console.error('[Veridia:' + tag + ']', Array.prototype.slice.call(arguments, 1).join(' ')) },
  warn: function(tag) { this._log('WARN', tag, Array.prototype.slice.call(arguments, 1)); if (this._level >= 2) console.warn('[Veridia:' + tag + ']', Array.prototype.slice.call(arguments, 1).join(' ')) },
  info: function(tag) { this._log('INFO', tag, Array.prototype.slice.call(arguments, 1)); if (this._level >= 3) console.info('[Veridia:' + tag + ']', Array.prototype.slice.call(arguments, 1).join(' ')) },
  debug: function(tag) { this._log('DEBUG', tag, Array.prototype.slice.call(arguments, 1)); if (this._level >= 4) console.debug('[Veridia:' + tag + ']', Array.prototype.slice.call(arguments, 1).join(' ')) },
  getHistory: function(filter) { if (!filter) return this._history; return this._history.filter(function(e) { return e.level === filter || e.tag === filter }) },
  setLevel: function(n) { this._level = n }
};

// B1.4: Login throttle
var _loginAttempts = {}; var LOGIN_MAX_ATTEMPTS = 5; var LOGIN_LOCKOUT_MS = 300000;
function checkLoginThrottle(email) {
  var key = (email || '').toLowerCase(); var rec = _loginAttempts[key]; if (!rec) return { allowed: true };
  if (rec.locked && (Date.now() - rec.lockedAt) < LOGIN_LOCKOUT_MS) { var remaining = Math.ceil((LOGIN_LOCKOUT_MS - (Date.now() - rec.lockedAt)) / 60000); return { allowed: false, message: 'Cuenta bloqueada por ' + remaining + ' min tras ' + LOGIN_MAX_ATTEMPTS + ' intentos fallidos.' } }
  if (rec.locked && (Date.now() - rec.lockedAt) >= LOGIN_LOCKOUT_MS) { delete _loginAttempts[key]; return { allowed: true } }
  return { allowed: true };
}
function recordLoginFailure(email) { var key = (email || '').toLowerCase(); if (!_loginAttempts[key]) _loginAttempts[key] = { count: 0 }; _loginAttempts[key].count++; if (_loginAttempts[key].count >= LOGIN_MAX_ATTEMPTS) { _loginAttempts[key].locked = true; _loginAttempts[key].lockedAt = Date.now() } }
function recordLoginSuccess(email) { delete _loginAttempts[(email || '').toLowerCase()] }

// B1.10: Cross-tab logout
if (typeof window !== 'undefined') { window.addEventListener('storage', function(e) { if (e.key === 'veridia_session' && e.newValue === null) { if (typeof currentUser !== 'undefined' && currentUser) { toast('Sesión cerrada desde otra pestaña', 'info'); setTimeout(function() { location.reload() }, 1500) } } }) }
if (typeof window !== 'undefined') { window.addEventListener('unhandledrejection', function(e) { VLog.error('Promise', e.reason && e.reason.message ? e.reason.message : String(e.reason)); e.preventDefault() }) }
