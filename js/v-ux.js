// ═══════════════════════════════════════════════════════
// VERIDIA HEALTHTECH — v-ux.js
// UX: Command palette, ARIA helpers, CSS utilities,
// progress bars, confirm modals, debounce, autosave
// ═══════════════════════════════════════════════════════

// C1.4: Debounce & Throttle
function debounce(fn, ms) { var timer; return function() { var args = arguments, ctx = this; clearTimeout(timer); timer = setTimeout(function() { fn.apply(ctx, args) }, ms || 300) } }
function throttle(fn, ms) { var last = 0; return function() { var now = Date.now(); if (now - last >= (ms || 200)) { last = now; fn.apply(this, arguments) } } }

// A2: ARIA helpers
function ariaLabel(text) { return ' aria-label="' + safeHTML(text) + '"' }
function ariaRole(role) { return ' role="' + role + '"' }
function ariaLive(mode) { return ' aria-live="' + (mode || 'polite') + '"' }
function ariaExpanded(bool) { return ' aria-expanded="' + (bool ? 'true' : 'false') + '"' }
function ariaSelected(bool) { return ' aria-selected="' + (bool ? 'true' : 'false') + '"' }
function ariaHidden() { return ' aria-hidden="true"' }

// A3.6: Form helpers
function formLabel(forId, text, required) { return '<label for="' + forId + '" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">' + safeHTML(text) + (required ? ' <span style="color:#dc2626" aria-hidden="true">*</span>' : '') + '</label>' }
function formInput(id, opts) { opts = opts || {}; var type = opts.type || 'text'; var val = opts.value !== undefined ? ' value="' + safeHTML(String(opts.value)) + '"' : ''; var ph = opts.placeholder ? ' placeholder="' + safeHTML(opts.placeholder) + '"' : ''; var req = opts.required ? ' required aria-required="true"' : ''; var ac = opts.autocomplete ? ' autocomplete="' + opts.autocomplete + '"' : ''; return '<input type="' + type + '" id="' + id + '"' + val + ph + req + ac + ' ' + (opts.extra || '') + '>' }

// E2.1: Progress bar
function progressBar(current, total, opts) { opts = opts || {}; var pct = total > 0 ? Math.round(current / total * 100) : 0; var showLabel = opts.showLabel !== false; return '<div style="width:100%">' + (showLabel ? '<div style="display:flex;justify-content:space-between;font-size:.7rem;color:var(--text-secondary);margin-bottom:3px"><span>Paso ' + current + ' de ' + total + '</span><span>' + pct + '%</span></div>' : '') + '<div style="width:100%;background:var(--surface2,#eee);border-radius:99px;overflow:hidden;height:' + (opts.height || '6px') + '"><div style="width:' + pct + '%;height:100%;background:' + (opts.color || 'var(--primary)') + ';border-radius:99px;transition:width .4s ease"></div></div></div>' }

// E2.3: Empty state
function emptyState(icon, title, subtitle, actionLabel, actionFn) { var h = '<div class="empty-state" style="text-align:center;padding:48px 24px"><div style="font-size:3rem;margin-bottom:12px;opacity:.4">' + (icon || '📭') + '</div><h3 style="font-size:1.1rem;font-weight:700;margin-bottom:6px;color:var(--text)">' + safeHTML(title || 'Sin datos') + '</h3>'; if (subtitle) h += '<p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:16px;max-width:380px;margin-left:auto;margin-right:auto">' + safeHTML(subtitle) + '</p>'; if (actionLabel && actionFn) h += '<button class="btn btn-primary" onclick="' + actionFn + '">' + safeHTML(actionLabel) + '</button>'; return h + '</div>' }

// E1.8: Confirm modal
function confirmAction(title, detail, onConfirm, opts) { opts = opts || {}; window._confirmCallback = onConfirm; openModal('<div style="padding:24px;text-align:center"><div style="font-size:2.5rem;margin-bottom:12px">' + (opts.icon || '⚠️') + '</div><h3 style="font-size:1.1rem;font-weight:700;margin-bottom:8px">' + safeHTML(title) + '</h3>' + (detail ? '<p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:20px;max-width:400px;margin-left:auto;margin-right:auto">' + safeHTML(detail) + '</p>' : '') + '<div style="display:flex;gap:10px;justify-content:center"><button class="btn" onclick="closeModal()" style="min-width:100px">' + (opts.cancelText || 'Cancelar') + '</button><button class="btn" onclick="closeModal();if(window._confirmCallback)window._confirmCallback()" style="background:' + (opts.danger ? '#dc2626' : 'var(--primary)') + ';color:#fff;min-width:100px;border:none">' + (opts.confirmText || 'Confirmar') + '</button></div></div>') }

// E1.14: Command Palette
function openCommandPalette() {
  var modules = [
    {cat:'Módulo',icon:'📊',label:'Dashboard',action:"navigate('dashboard')"},{cat:'Módulo',icon:'📅',label:'Agenda',action:"navigate('agenda')"},{cat:'Módulo',icon:'👥',label:'Pacientes',action:"navigate('pacientes')"},
    {cat:'Módulo',icon:'📋',label:'Historia Clínica',action:"navigate('historia')"},{cat:'Módulo',icon:'📐',label:'Antropometría',action:"navigate('antropometria')"},{cat:'Módulo',icon:'🧪',label:'Analíticas',action:"navigate('analiticas')"},
    {cat:'Módulo',icon:'🧮',label:'Fórmula Clínica',action:"navigate('formula')"},{cat:'Módulo',icon:'🔬',label:'Desarrollada',action:"navigate('desarrollada')"},{cat:'Módulo',icon:'🥦',label:'Base de Datos Alimentos',action:"navigate('bedca')"},
    {cat:'Módulo',icon:'📖',label:'Recetas',action:"navigate('recetas')"},{cat:'Módulo',icon:'🍽️',label:'Planes Alimentarios',action:"navigate('planes')"},{cat:'Módulo',icon:'🏛️',label:'Restauración Colectiva',action:"navigate('restauracion')"},
    {cat:'Módulo',icon:'🏥',label:'Soporte Nutricional UCI',action:"navigate('soporte')"},{cat:'Módulo',icon:'💳',label:'Facturación',action:"navigate('facturacion')"},{cat:'Módulo',icon:'💰',label:'Caja',action:"navigate('caja')"},
    {cat:'Módulo',icon:'📈',label:'Contabilidad',action:"navigate('contabilidad')"},{cat:'Módulo',icon:'💬',label:'Mensajes',action:"navigate('mensajes')"},{cat:'Módulo',icon:'🤖',label:'IA Copilot',action:"navigate('ia')"},
    {cat:'Módulo',icon:'⚙️',label:'Ajustes',action:"navigate('settings')"}
  ];
  var actions = [
    {cat:'Acción',icon:'➕',label:'Nuevo paciente',action:"if(typeof openNewPat==='function')openNewPat()"},
    {cat:'Acción',icon:'📥',label:'Backup de datos',action:"if(typeof backupData==='function')backupData()"},
    {cat:'Acción',icon:'↩️',label:'Deshacer última acción',action:"undoPop()"},
    {cat:'Acción',icon:'🔔',label:'Notificaciones',action:"openNotifications()"},
    {cat:'Acción',icon:'⌨️',label:'Atajos de teclado',action:"showKeyboardShortcuts()"},
    {cat:'Acción',icon:'🌙',label:'Tema oscuro/claro',action:"if(typeof toggleDarkMode==='function')toggleDarkMode()"},
    {cat:'Acción',icon:'🗺️',label:'Tour guiado',action:"if(typeof startDemoGuiado==='function')startDemoGuiado()"}
  ];

  function fuzzyMatch(text, query) {
    text = text.toLowerCase(); query = query.toLowerCase();
    var ti = 0, qi = 0, score = 0, consecutive = 0;
    while (ti < text.length && qi < query.length) {
      if (text[ti] === query[qi]) { score += 1 + consecutive * 2; consecutive++; qi++ } else { consecutive = 0 }
      ti++;
    }
    return qi === query.length ? score : 0;
  }

  function searchPatients(q) {
    if (!q || q.length < 2) return [];
    var results = [];
    (DB.patients || []).forEach(function(p) {
      var fullName = (p.nombre || '') + ' ' + (p.apellidos || '');
      var s1 = fuzzyMatch(fullName, q);
      var s2 = fuzzyMatch(p.dni || '', q);
      var s3 = fuzzyMatch(p.email || '', q);
      var best = Math.max(s1, s2, s3);
      if (best > 0) results.push({cat:'Paciente',icon:'👤',label:fullName.trim(),sub:(p.dni||'')+(p.email?' · '+p.email:''),action:"selPat="+p.id+";navigate('historia')",score:best});
    });
    return results.sort(function(a,b){return b.score-a.score}).slice(0,5);
  }

  function renderResults(q) {
    var query = (q||'').trim();
    var html = '';
    if (query.length >= 2) {
      var patients = searchPatients(query);
      var modMatches = modules.filter(function(m){return fuzzyMatch(m.label,query)>0});
      var actMatches = actions.filter(function(a){return fuzzyMatch(a.label,query)>0});
      var total = patients.length + modMatches.length + actMatches.length;
      if (total === 0) { html = '<div style="text-align:center;padding:24px;color:var(--text3);font-size:.82rem">Sin resultados para "'+query+'"</div>'; }
      else {
        if (patients.length) {
          html += '<div style="padding:6px 14px;font-size:.65rem;text-transform:uppercase;letter-spacing:.8px;color:var(--text3);font-weight:600">Pacientes</div>';
          patients.forEach(function(c,i){html+=renderItem(c,i)});
        }
        if (modMatches.length) {
          html += '<div style="padding:6px 14px;font-size:.65rem;text-transform:uppercase;letter-spacing:.8px;color:var(--text3);font-weight:600">Módulos</div>';
          modMatches.forEach(function(c,i){html+=renderItem(c,i)});
        }
        if (actMatches.length) {
          html += '<div style="padding:6px 14px;font-size:.65rem;text-transform:uppercase;letter-spacing:.8px;color:var(--text3);font-weight:600">Acciones</div>';
          actMatches.forEach(function(c,i){html+=renderItem(c,i)});
        }
      }
    } else {
      html += '<div style="padding:6px 14px;font-size:.65rem;text-transform:uppercase;letter-spacing:.8px;color:var(--text3);font-weight:600">Módulos</div>';
      modules.forEach(function(c,i){html+=renderItem(c,i)});
      html += '<div style="padding:6px 14px;font-size:.65rem;text-transform:uppercase;letter-spacing:.8px;color:var(--text3);font-weight:600">Acciones</div>';
      actions.forEach(function(c,i){html+=renderItem(c,i)});
    }
    var el = document.getElementById('cmdPaletteList');
    if (el) el.innerHTML = html;
  }

  function renderItem(c, i) {
    var sub = c.sub ? '<div style="font-size:.68rem;color:var(--text3);margin-top:1px">'+c.sub+'</div>' : '';
    return '<div class="cmd-item" data-idx="'+i+'" style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;cursor:pointer;transition:background .15s" onmouseenter="this.style.background=\'var(--primary-light)\'" onmouseleave="this.style.background=\'transparent\'" onclick="closeModal();'+c.action+'">'
      +'<span style="font-size:1.2rem;min-width:28px;text-align:center">'+c.icon+'</span>'
      +'<div><span style="font-size:.9rem;font-weight:500">'+c.label+'</span>'+sub+'</div>'
      +'<span style="margin-left:auto;font-size:.58rem;color:var(--text3);background:var(--surface2);padding:2px 6px;border-radius:4px">'+c.cat+'</span></div>';
  }

  var h='<div style="padding:8px"><input type="text" id="cmdPaletteInput" placeholder="Buscar módulo, paciente o acción..." style="width:100%;padding:14px 18px;font-size:1rem;border:2px solid var(--primary);border-radius:14px;outline:none;background:var(--surface);color:var(--text)" oninput="renderResults(this.value)" autofocus>'
    +'<div id="cmdPaletteList" style="max-height:50vh;overflow-y:auto;margin-top:8px"></div></div>';
  openModal(h);
  setTimeout(function(){var inp=$('cmdPaletteInput');if(inp)inp.focus()},100);
  renderResults('');
}
function filterCommandPalette(q) { renderResults(q) }

// E2.4-E2.9: UX helpers
function getNotificationCounts() { var c = { alertas: DB.alerts.filter(function(a) { return a.estado === 'pendiente' }).length, citasHoy: 0, facturasVencidas: DB.invoices.filter(function(i) { return i.estado === 'Vencida' }).length, mensajesSinLeer: 0 }; var today = new Date().toISOString().slice(0, 10); c.citasHoy = DB.appointments.filter(function(a) { return a.fecha === today && a.estado !== 'Cancelada' && a.estado !== 'Realizada' }).length; c.total = c.alertas + c.facturasVencidas + c.mensajesSinLeer; return c }
function renderUnsavedDot() { return typeof _formDirty !== 'undefined' && _formDirty ? '<span style="display:inline-block;width:8px;height:8px;background:#f59e0b;border-radius:50%;margin-left:6px" title="Cambios sin guardar"></span>' : '' }
function showUndoHint() { if (typeof _undoStack !== 'undefined' && _undoStack.length > 0) { var last = _undoStack[_undoStack.length - 1]; return '<div style="font-size:.65rem;color:var(--text3);display:flex;align-items:center;gap:4px"><kbd style="background:var(--surface2);padding:1px 5px;border-radius:3px;font-size:.6rem">Ctrl+Z</kbd> Deshacer: ' + (last.label || '').substring(0, 30) + '</div>' } return '' }
function charCounter(inputId, max) { return ' oninput="var c=this.value.length;var el=document.getElementById(\'' + inputId + '_cc\');if(el){el.textContent=c+\'/'+max+'\';el.style.color=c>'+max+'?\'#dc2626\':\'var(--text3)\'}"' }
function charCounterDisplay(inputId, max) { return '<div id="' + inputId + '_cc" style="font-size:.6rem;color:var(--text3);text-align:right;margin-top:2px">0/' + max + '</div>' }

function renderAntroComparison(patId) {
  var antros = DB.antropometrias.filter(function(a) { return a.pacienteId === patId }).sort(function(a, b) { return a.fecha.localeCompare(b.fecha) });
  if (antros.length < 2) return '';
  var first = antros[0], last = antros[antros.length - 1];
  var fields = [{key:'peso',label:'Peso',unit:'kg',decimals:1,lowerBetter:null},{key:'imc',label:'IMC',unit:'kg/m²',decimals:1,lowerBetter:true},{key:'cintura',label:'Cintura',unit:'cm',decimals:0,lowerBetter:true},{key:'grasaCorporal',label:'% Grasa',unit:'%',decimals:1,lowerBetter:true},{key:'masaMuscular',label:'Masa muscular',unit:'kg',decimals:1,lowerBetter:false}];
  var h = '<div class="card" style="margin-bottom:16px;border-top:3px solid var(--accent)"><div class="card-header"><span class="card-title" style="font-size:.85rem">📊 Evolución: Primera → Última</span><span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.68rem">' + fD(first.fecha) + ' → ' + fD(last.fecha) + '</span></div><div class="card-body"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px">';
  fields.forEach(function(f) { var v1 = first[f.key], v2 = last[f.key]; if (v1 == null || v2 == null) return; var diff = v2 - v1; var pct = v1 > 0 ? Math.round(diff / v1 * 100) : 0; var isGood = f.lowerBetter === null ? null : f.lowerBetter ? diff < 0 : diff > 0; var color = isGood === null ? 'var(--text)' : isGood ? '#22c55e' : '#dc2626'; var arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→'; h += '<div style="padding:12px;background:var(--surface2);border-radius:10px;text-align:center"><div style="font-size:.62rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-bottom:4px">' + f.label + '</div><div style="font-size:.78rem;color:var(--text3)">' + v1.toFixed(f.decimals) + ' → <strong style="color:var(--text)">' + v2.toFixed(f.decimals) + '</strong> ' + f.unit + '</div><div style="font-size:.82rem;font-weight:700;color:' + color + ';margin-top:2px">' + arrow + ' ' + (diff > 0 ? '+' : '') + diff.toFixed(f.decimals) + ' (' + (pct > 0 ? '+' : '') + pct + '%)</div></div>' });
  return h + '</div></div></div>';
}

// E4: Personalización
var _layoutDensity = 'normal';
function setLayoutDensity(d) { _layoutDensity = d; var root = document.documentElement; if (d === 'compact') { root.style.setProperty('--card-padding', '14px'); root.style.setProperty('--content-padding', '16px 20px') } else if (d === 'spacious') { root.style.setProperty('--card-padding', '28px'); root.style.setProperty('--content-padding', '36px 40px') } else { root.style.removeProperty('--card-padding'); root.style.removeProperty('--content-padding') } try { localStorage.setItem('veridia_density', d) } catch (e) { /* */ } }
function setFontScale(scale) { document.documentElement.style.fontSize = (scale || 14) + 'px'; try { localStorage.setItem('veridia_fontscale', String(scale)) } catch (e) { /* */ } }

// E1.3: Autosave
var _autoSaveTimers = {};
function autoSaveField(key, getValue) { clearTimeout(_autoSaveTimers[key]); _autoSaveTimers[key] = setTimeout(function() { try { localStorage.setItem('veridia_draft_' + key, JSON.stringify(typeof getValue === 'function' ? getValue() : getValue)) } catch (e) { /* */ } }, 3000) }
function loadDraft(key) { try { var val = localStorage.getItem('veridia_draft_' + key); return val ? JSON.parse(val) : null } catch (e) { return null } }
function clearDraft(key) { try { localStorage.removeItem('veridia_draft_' + key) } catch (e) { /* */ } }

// T6: Contextual tooltips
var _shownTips = {};
function showContextTip(key, message, delay) { if (_shownTips[key]) return; _shownTips[key] = true; try { localStorage.setItem('veridia_tips_' + key, '1') } catch (e) { /* */ }; setTimeout(function() { var tip = document.createElement('div'); tip.style.cssText = 'position:fixed;bottom:80px;right:24px;background:var(--primary);color:#fff;padding:14px 20px;border-radius:14px;font-size:.82rem;max-width:320px;z-index:99990;box-shadow:0 8px 32px rgba(0,0,0,.25);line-height:1.5'; tip.innerHTML = '💡 ' + message + '<button onclick="this.parentElement.remove()" style="position:absolute;top:6px;right:10px;background:none;border:none;color:#fff;font-size:1rem;cursor:pointer">×</button>'; document.body.appendChild(tip); setTimeout(function() { tip.style.opacity = '0'; tip.style.transition = 'opacity .5s'; setTimeout(function() { tip.remove() }, 600) }, 8000) }, delay || 2000) }
if (typeof localStorage !== 'undefined') { try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.startsWith('veridia_tips_')) _shownTips[k.replace('veridia_tips_', '')] = true } } catch (e) { /* */ } }

// C4.2: CSS utility injector
function injectUtilityCSS() {
  if (document.getElementById('veridia-utilities-css')) return;
  var style = document.createElement('style'); style.id = 'veridia-utilities-css';
  style.textContent = '.mt-0{margin-top:0}.mt-1{margin-top:4px}.mt-2{margin-top:8px}.mt-3{margin-top:12px}.mt-4{margin-top:16px}.mt-6{margin-top:24px}.mb-0{margin-bottom:0}.mb-2{margin-bottom:8px}.mb-4{margin-bottom:16px}.mb-6{margin-bottom:24px}.mx-auto{margin-left:auto;margin-right:auto}.p-0{padding:0}.p-2{padding:8px}.p-3{padding:12px}.p-4{padding:16px}.p-6{padding:24px}.flex{display:flex}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}.items-center{align-items:center}.justify-between{justify-content:space-between}.justify-center{justify-content:center}.gap-1{gap:4px}.gap-2{gap:8px}.gap-3{gap:12px}.gap-4{gap:16px}.flex-1{flex:1}.grid{display:grid}.grid-2{grid-template-columns:1fr 1fr}.grid-3{grid-template-columns:1fr 1fr 1fr}.grid-4{grid-template-columns:repeat(4,1fr)}.grid-auto{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}.text-xs{font-size:.7rem}.text-sm{font-size:.8rem}.text-lg{font-size:1.1rem}.text-xl{font-size:1.3rem}.font-bold{font-weight:700}.font-semibold{font-weight:600}.text-center{text-align:center}.text-primary{color:var(--primary)}.text-muted{color:var(--text-secondary)}.text-success{color:#22c55e}.text-danger{color:#dc2626}.text-warning{color:#f59e0b}.uppercase{text-transform:uppercase;letter-spacing:.5px}.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rounded{border-radius:8px}.rounded-lg{border-radius:12px}.rounded-xl{border-radius:16px}.rounded-full{border-radius:999px}.border{border:1px solid var(--border)}.border-t{border-top:1px solid var(--border)}.w-full{width:100%}.hidden{display:none!important}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}.bg-surface{background:var(--surface)}.bg-surface2{background:var(--surface2,#f5f5f5)}.transition{transition:all .2s ease}.shadow{box-shadow:0 2px 8px rgba(0,0,0,.08)}.shadow-lg{box-shadow:0 8px 32px rgba(0,0,0,.12)}.cursor-pointer{cursor:pointer}.overflow-auto{overflow:auto}.overflow-y-auto{overflow-y:auto}@media print{.no-print{display:none!important}}.focus-ring:focus{outline:2px solid var(--primary);outline-offset:2px}@media(max-width:600px){.hide-mobile{display:none!important}}@media(min-width:601px){.hide-desktop{display:none!important}}@media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}.kpi-card{padding:16px;text-align:center;border-radius:12px;background:var(--surface)}.kpi-value{font-size:1.5rem;font-weight:800}.kpi-label{font-size:.65rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px}.form-label-sm{font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600}';
  document.head.appendChild(style);
}
if (typeof document !== 'undefined' && document.head) injectUtilityCSS();
