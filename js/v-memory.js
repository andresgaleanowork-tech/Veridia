// ═══════════════════════════════════════════════════════════════════
// VERIDIA HEALTHTECH — v-memory.js
// Persistent AI Memory System (inspired by claude-mem)
// Captures IA interactions, compresses observations, injects
// relevant context into future sessions automatically.
// ═══════════════════════════════════════════════════════════════════
// Architecture: Observe → Compress → Store → Retrieve → Inject
// Storage: localStorage('veridia_mem') — SQLite-like via JSON
// ═══════════════════════════════════════════════════════════════════

var MEM_VERSION = '1.0.0';
var MEM_STORAGE_KEY = 'veridia_mem';
var MEM_MAX_OBSERVATIONS = 200;
var MEM_MAX_SUMMARIES = 50;
var MEM_CONTEXT_INJECT_COUNT = 10;  // Recent observations to inject at session start
var MEM_SUMMARY_THRESHOLD = 20;     // Compress after N observations
var MEM_MAX_AGE_DAYS = 90;          // Expire old memories

// ═══ MEMORY DATABASE ═══
var _memDB = { observations: [], summaries: [], sessions: [], meta: { version: MEM_VERSION, created: null, lastAccess: null, totalObservations: 0 } };

// Load from localStorage
function memLoad() {
  try {
    var saved = localStorage.getItem(MEM_STORAGE_KEY);
    if (saved) {
      var parsed = JSON.parse(saved);
      if (parsed && parsed.observations) {
        _memDB = parsed;
        _memDB.meta = _memDB.meta || { version: MEM_VERSION, created: null, lastAccess: null, totalObservations: 0 };
      }
    }
  } catch (e) { /* fresh start */ }
  _memDB.meta.lastAccess = new Date().toISOString();
}

// Save to localStorage
function memSave() {
  try {
    // Trim before save
    if (_memDB.observations.length > MEM_MAX_OBSERVATIONS) {
      _memDB.observations = _memDB.observations.slice(-MEM_MAX_OBSERVATIONS);
    }
    if (_memDB.summaries.length > MEM_MAX_SUMMARIES) {
      _memDB.summaries = _memDB.summaries.slice(-MEM_MAX_SUMMARIES);
    }
    localStorage.setItem(MEM_STORAGE_KEY, JSON.stringify(_memDB));
  } catch (e) {
    // Storage full — trim aggressively
    _memDB.observations = _memDB.observations.slice(-50);
    _memDB.summaries = _memDB.summaries.slice(-10);
    try { localStorage.setItem(MEM_STORAGE_KEY, JSON.stringify(_memDB)) } catch (e2) { /* give up */ }
  }
}

// ═══ 1. OBSERVE — Capture IA interactions ═══
function memObserve(type, data) {
  var observation = {
    id: 'obs_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    type: type,        // 'query', 'response', 'action', 'decision', 'error'
    timestamp: new Date().toISOString(),
    sessionId: _memCurrentSession,
    patientId: typeof selPat !== 'undefined' ? selPat : null,
    module: typeof curMod !== 'undefined' ? curMod : null,
    data: data
  };
  _memDB.observations.push(observation);
  _memDB.meta.totalObservations++;

  // Auto-compress when threshold reached
  if (_memDB.observations.length >= MEM_SUMMARY_THRESHOLD &&
      _memDB.observations.length % MEM_SUMMARY_THRESHOLD === 0) {
    memCompress();
  }

  memSave();
  return observation.id;
}

// Observe an IA query
function memObserveQuery(question, patientId, module) {
  return memObserve('query', {
    question: (question || '').substring(0, 500),
    patientId: patientId,
    module: module || (typeof curMod !== 'undefined' ? curMod : null),
    patientName: patientId && typeof gP === 'function' ? (function() { var p = gP(patientId); return p ? p.nombre + ' ' + p.apellidos : null })() : null
  });
}

// Observe an IA response
function memObserveResponse(queryId, response, wasUseful) {
  return memObserve('response', {
    queryId: queryId,
    response: (response || '').substring(0, 1000),
    useful: wasUseful,
    tokens: Math.round((response || '').length / 4) // Rough estimate
  });
}

// Observe a clinical decision
function memObserveDecision(decision, context) {
  return memObserve('decision', {
    decision: (decision || '').substring(0, 300),
    context: (context || '').substring(0, 300)
  });
}

// Observe a clinical action (formula calc, plan created, etc.)
function memObserveAction(action, details) {
  return memObserve('action', {
    action: action,
    details: typeof details === 'object' ? JSON.stringify(details).substring(0, 500) : (details || '').substring(0, 500)
  });
}

// ═══ 2. COMPRESS — Progressive summarization ═══
function memCompress() {
  var uncompressed = _memDB.observations.filter(function(o) { return !o._compressed });
  if (uncompressed.length < MEM_SUMMARY_THRESHOLD) return null;

  // Group by patient
  var byPatient = {};
  uncompressed.forEach(function(o) {
    var key = o.patientId || '_general';
    if (!byPatient[key]) byPatient[key] = [];
    byPatient[key].push(o);
  });

  // Create summary per patient group
  var summaries = [];
  Object.keys(byPatient).forEach(function(patKey) {
    var obs = byPatient[patKey];
    var queries = obs.filter(function(o) { return o.type === 'query' });
    var decisions = obs.filter(function(o) { return o.type === 'decision' });
    var actions = obs.filter(function(o) { return o.type === 'action' });

    var summary = {
      id: 'sum_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      patientId: patKey === '_general' ? null : +patKey,
      period: {
        from: obs[0].timestamp,
        to: obs[obs.length - 1].timestamp,
        count: obs.length
      },
      content: {
        topQueries: queries.slice(-5).map(function(q) { return q.data.question }).filter(Boolean),
        decisions: decisions.map(function(d) { return d.data.decision }).filter(Boolean),
        actions: actions.map(function(a) { return a.data.action }).filter(Boolean),
        modules: Array.from(new Set(obs.map(function(o) { return o.module }).filter(Boolean))),
        patientName: queries.length > 0 && queries[0].data.patientName ? queries[0].data.patientName : null
      },
      text: '' // Will be filled below
    };

    // Generate human-readable summary
    var parts = [];
    if (summary.content.patientName) parts.push('Paciente: ' + summary.content.patientName);
    if (summary.content.topQueries.length) parts.push('Consultas: ' + summary.content.topQueries.join('; '));
    if (summary.content.decisions.length) parts.push('Decisiones: ' + summary.content.decisions.join('; '));
    if (summary.content.actions.length) parts.push('Acciones: ' + summary.content.actions.join(', '));
    if (summary.content.modules.length) parts.push('Módulos: ' + summary.content.modules.join(', '));
    summary.text = parts.join('. ') + ' (' + obs.length + ' interacciones, ' + summary.period.from.substring(0, 10) + ' al ' + summary.period.to.substring(0, 10) + ')';

    summaries.push(summary);
  });

  // Mark observations as compressed
  uncompressed.forEach(function(o) { o._compressed = true });

  // Store summaries
  _memDB.summaries = _memDB.summaries.concat(summaries);
  memSave();
  return summaries;
}

// ═══ 3. RETRIEVE — Search memory by relevance ═══
function memSearch(query, options) {
  options = options || {};
  var maxResults = options.maxResults || 10;
  var patientId = options.patientId || null;
  var queryLower = (query || '').toLowerCase();
  var results = [];

  // Search summaries first (compressed knowledge)
  _memDB.summaries.forEach(function(s) {
    if (patientId && s.patientId !== patientId) return;
    var score = 0;
    var text = (s.text || '').toLowerCase();
    if (text.includes(queryLower)) score += 10;
    queryLower.split(' ').forEach(function(word) {
      if (word.length > 2 && text.includes(word)) score += 3;
    });
    if (score > 0) results.push({ type: 'summary', score: score, data: s });
  });

  // Then recent observations
  _memDB.observations.slice(-50).forEach(function(o) {
    if (patientId && o.patientId !== patientId) return;
    var text = JSON.stringify(o.data || {}).toLowerCase();
    var score = 0;
    if (text.includes(queryLower)) score += 5;
    queryLower.split(' ').forEach(function(word) {
      if (word.length > 2 && text.includes(word)) score += 2;
    });
    // Recency bonus
    var age = (Date.now() - new Date(o.timestamp).getTime()) / 86400000;
    if (age < 1) score += 3;
    else if (age < 7) score += 1;
    if (score > 0) results.push({ type: 'observation', score: score, data: o });
  });

  // Sort by relevance
  results.sort(function(a, b) { return b.score - a.score });
  return results.slice(0, maxResults);
}

// Search by patient
function memSearchByPatient(patientId, limit) {
  var results = [];
  _memDB.summaries.filter(function(s) { return s.patientId === patientId })
    .forEach(function(s) { results.push({ type: 'summary', data: s }) });
  _memDB.observations.filter(function(o) { return o.patientId === patientId })
    .slice(-(limit || 20))
    .forEach(function(o) { results.push({ type: 'observation', data: o }) });
  return results;
}

// ═══ 4. INJECT — Build context for new IA sessions ═══
function memBuildContext(patientId) {
  var ctx = '';

  // Recent summaries (progressive disclosure — most compressed first)
  var relevantSummaries = _memDB.summaries
    .filter(function(s) { return !patientId || s.patientId === patientId || s.patientId === null })
    .slice(-5);

  if (relevantSummaries.length > 0) {
    ctx += '=== MEMORIA DE SESIONES ANTERIORES ===\n';
    relevantSummaries.forEach(function(s) {
      ctx += '• ' + s.text + '\n';
    });
    ctx += '\n';
  }

  // Recent observations for this patient (detailed, last few)
  var recentObs = _memDB.observations
    .filter(function(o) { return !patientId || o.patientId === patientId })
    .filter(function(o) { return o.type === 'query' || o.type === 'decision' })
    .slice(-MEM_CONTEXT_INJECT_COUNT);

  if (recentObs.length > 0) {
    ctx += '=== INTERACCIONES RECIENTES ===\n';
    recentObs.forEach(function(o) {
      var ts = o.timestamp.substring(0, 16).replace('T', ' ');
      if (o.type === 'query') ctx += '[' + ts + '] Pregunta: ' + (o.data.question || '') + '\n';
      if (o.type === 'decision') ctx += '[' + ts + '] Decisión: ' + (o.data.decision || '') + '\n';
    });
    ctx += '\n';
  }

  return ctx;
}

// Inject context into IA prompt automatically
function memEnhancePrompt(originalPrompt, patientId) {
  var memoryContext = memBuildContext(patientId);
  if (!memoryContext) return originalPrompt;
  return memoryContext + '=== CONSULTA ACTUAL ===\n' + originalPrompt;
}

// ═══ 5. SESSION MANAGEMENT ═══
var _memCurrentSession = 'sess_' + Date.now();

function memStartSession() {
  _memCurrentSession = 'sess_' + Date.now();
  _memDB.sessions.push({
    id: _memCurrentSession,
    start: new Date().toISOString(),
    user: typeof currentUser !== 'undefined' && currentUser ? currentUser.name : null
  });
  // Keep only last 50 sessions
  if (_memDB.sessions.length > 50) _memDB.sessions = _memDB.sessions.slice(-50);
  memSave();
  return _memCurrentSession;
}

function memEndSession() {
  var sess = _memDB.sessions.find(function(s) { return s.id === _memCurrentSession });
  if (sess) {
    sess.end = new Date().toISOString();
    var sessionObs = _memDB.observations.filter(function(o) { return o.sessionId === _memCurrentSession });
    sess.stats = {
      observations: sessionObs.length,
      queries: sessionObs.filter(function(o) { return o.type === 'query' }).length,
      decisions: sessionObs.filter(function(o) { return o.type === 'decision' }).length
    };
  }
  // Auto-compress at session end
  memCompress();
  memSave();
}

// ═══ 6. MEMORY STATS & MANAGEMENT ═══
function memGetStats() {
  var now = Date.now();
  var last24h = _memDB.observations.filter(function(o) { return now - new Date(o.timestamp).getTime() < 86400000 }).length;
  var last7d = _memDB.observations.filter(function(o) { return now - new Date(o.timestamp).getTime() < 604800000 }).length;
  var patients = {};
  _memDB.observations.forEach(function(o) { if (o.patientId) patients[o.patientId] = (patients[o.patientId] || 0) + 1 });
  var topPatients = Object.entries(patients).sort(function(a, b) { return b[1] - a[1] }).slice(0, 5);
  var storageBytes = 0;
  try { storageBytes = (localStorage.getItem(MEM_STORAGE_KEY) || '').length * 2 } catch (e) { /* */ }

  return {
    total: _memDB.meta.totalObservations,
    stored: _memDB.observations.length,
    summaries: _memDB.summaries.length,
    sessions: _memDB.sessions.length,
    last24h: last24h,
    last7d: last7d,
    topPatients: topPatients.map(function(e) {
      var p = typeof gP === 'function' ? gP(+e[0]) : null;
      return { id: +e[0], name: p ? p.nombre + ' ' + p.apellidos : 'Paciente #' + e[0], count: e[1] };
    }),
    storageKB: Math.round(storageBytes / 1024),
    version: MEM_VERSION
  };
}

function memClear() {
  _memDB = { observations: [], summaries: [], sessions: [], meta: { version: MEM_VERSION, created: new Date().toISOString(), lastAccess: new Date().toISOString(), totalObservations: 0 } };
  memSave();
}

function memExport() {
  return JSON.parse(JSON.stringify(_memDB));
}

function memPurgeOld(daysOld) {
  daysOld = daysOld || MEM_MAX_AGE_DAYS;
  var cutoff = new Date(Date.now() - daysOld * 86400000).toISOString();
  var before = _memDB.observations.length;
  _memDB.observations = _memDB.observations.filter(function(o) { return o.timestamp > cutoff });
  _memDB.summaries = _memDB.summaries.filter(function(s) { return s.timestamp > cutoff });
  memSave();
  return before - _memDB.observations.length;
}

// ═══ 7. RENDER MEMORY PANEL ═══
function renderMemoryPanel() {
  var stats = memGetStats();
  var h = '<div class="card" style="margin-bottom:16px;border-top:3px solid #7c3aed">'
    + '<div class="card-header"><span class="card-title" style="font-size:.85rem">🧠 Memoria IA</span>'
    + '<span class="badge" style="background:#7c3aed;color:#fff;font-size:.68rem">' + stats.stored + ' memorias</span></div>'
    + '<div class="card-body">'
    + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px">'
    + '<div style="text-align:center;padding:10px;background:var(--surface2);border-radius:8px"><div style="font-size:1.2rem;font-weight:800;color:#7c3aed">' + stats.total + '</div><div style="font-size:.55rem;text-transform:uppercase;color:var(--text-secondary)">Total hist.</div></div>'
    + '<div style="text-align:center;padding:10px;background:var(--surface2);border-radius:8px"><div style="font-size:1.2rem;font-weight:800;color:var(--accent)">' + stats.summaries + '</div><div style="font-size:.55rem;text-transform:uppercase;color:var(--text-secondary)">Resúmenes</div></div>'
    + '<div style="text-align:center;padding:10px;background:var(--surface2);border-radius:8px"><div style="font-size:1.2rem;font-weight:800;color:var(--primary)">' + stats.last24h + '</div><div style="font-size:.55rem;text-transform:uppercase;color:var(--text-secondary)">Hoy</div></div>'
    + '<div style="text-align:center;padding:10px;background:var(--surface2);border-radius:8px"><div style="font-size:1.2rem;font-weight:800">' + stats.storageKB + '</div><div style="font-size:.55rem;text-transform:uppercase;color:var(--text-secondary)">KB usado</div></div>'
    + '</div>';

  // Top patients
  if (stats.topPatients.length > 0) {
    h += '<div style="font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);margin-bottom:6px">Pacientes más consultados</div>';
    stats.topPatients.forEach(function(tp) {
      h += '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:.78rem;border-bottom:1px solid var(--border)">'
        + '<span>' + (typeof safeHTML === 'function' ? safeHTML(tp.name) : tp.name) + '</span>'
        + '<span style="color:var(--text3)">' + tp.count + ' consultas</span></div>';
    });
  }

  // Recent summaries
  if (_memDB.summaries.length > 0) {
    h += '<div style="font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);margin:12px 0 6px">Últimos resúmenes</div>';
    _memDB.summaries.slice(-3).reverse().forEach(function(s) {
      h += '<div style="padding:8px;background:var(--surface2);border-radius:8px;margin-bottom:6px;font-size:.75rem;line-height:1.5;border-left:3px solid #7c3aed">'
        + '<div style="font-size:.6rem;color:var(--text3)">' + s.timestamp.substring(0, 16).replace('T', ' ') + '</div>'
        + (typeof safeHTML === 'function' ? safeHTML(s.text) : s.text)
        + '</div>';
    });
  }

  h += '<div style="display:flex;gap:6px;margin-top:12px">'
    + '<button class="btn btn-outline btn-xs" onclick="memSearchUI()" style="border-radius:6px;font-size:.68rem">🔍 Buscar</button>'
    + '<button class="btn btn-outline btn-xs" onclick="memPurgeOld(30);toast(\'Memorias antiguas eliminadas\');navigate(curMod)" style="border-radius:6px;font-size:.68rem">🧹 Limpiar >30d</button>'
    + '<button class="btn btn-outline btn-xs" onclick="if(confirm(\'¿Borrar toda la memoria IA?\')){memClear();toast(\'Memoria borrada\');navigate(curMod)}" style="border-radius:6px;font-size:.68rem;color:#dc2626">🗑️ Reset</button>'
    + '</div></div></div>';
  return h;
}

// Memory search UI
function memSearchUI() {
  openModal('<div class="modal-header"><h3>🔍 Buscar en memoria IA</h3><button onclick="closeModal()">' + (typeof IC !== 'undefined' ? IC.x : '✕') + '</button></div>'
    + '<div class="modal-body">'
    + '<input type="text" id="memSearchInput" placeholder="Buscar consultas, decisiones, acciones..." style="width:100%;margin-bottom:12px" onkeyup="if(event.key===\'Enter\')memDoSearch()">'
    + '<button class="btn btn-primary btn-sm" onclick="memDoSearch()" style="border-radius:8px;margin-bottom:14px">Buscar</button>'
    + '<div id="memSearchResults"></div>'
    + '</div>');
}

function memDoSearch() {
  var q = ($('memSearchInput') || {}).value || '';
  var results = memSearch(q, { patientId: typeof selPat !== 'undefined' ? selPat : null });
  var el = $('memSearchResults');
  if (!el) return;
  if (!results.length) { el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3)">Sin resultados para "' + (typeof safeHTML === 'function' ? safeHTML(q) : q) + '"</div>'; return }
  el.innerHTML = results.map(function(r) {
    var icon = r.type === 'summary' ? '📋' : r.data.type === 'query' ? '❓' : r.data.type === 'decision' ? '✅' : '⚡';
    var text = r.type === 'summary' ? r.data.text : (r.data.data.question || r.data.data.decision || r.data.data.action || '');
    var ts = (r.type === 'summary' ? r.data.timestamp : r.data.timestamp).substring(0, 16).replace('T', ' ');
    return '<div style="padding:8px;border-bottom:1px solid var(--border);font-size:.8rem">'
      + '<div style="display:flex;justify-content:space-between"><span>' + icon + ' <strong>' + r.type + '</strong> (score: ' + r.score + ')</span><span style="font-size:.65rem;color:var(--text3)">' + ts + '</span></div>'
      + '<div style="color:var(--text-secondary);margin-top:2px">' + (typeof safeHTML === 'function' ? safeHTML(text) : text).substring(0, 200) + '</div></div>';
  }).join('');
}

// ═══ 8. AUTO-HOOK INTO IA COPILOT ═══
// Override sendIA to auto-observe queries and inject memory
var _origSendIA = null;

function memHookIntoIA() {
  if (typeof sendIA !== 'function' || _origSendIA) return;
  _origSendIA = sendIA;

  // Can't reassign sendIA directly since it's used by name in onclick handlers
  // Instead, we hook into geminiAsk to observe
  if (typeof geminiAsk === 'function') {
    var _origGeminiAsk = geminiAsk;
    geminiAsk = function(prompt, opts) {
      // Observe the query
      var queryId = memObserveQuery(prompt.substring(0, 200), typeof selPat !== 'undefined' ? selPat : null);

      // Enhance prompt with memory context
      var enhanced = memEnhancePrompt(prompt, typeof selPat !== 'undefined' ? selPat : null);

      // Call original
      return _origGeminiAsk(enhanced, opts).then(function(response) {
        // Observe the response
        memObserveResponse(queryId, response);
        return response;
      });
    };
  }
}

// ═══ INIT ═══
memLoad();
if (!_memDB.meta.created) _memDB.meta.created = new Date().toISOString();
memStartSession();

// Auto-hook when IA module loads (deferred)
if (typeof window !== 'undefined') {
  setTimeout(function() { memHookIntoIA() }, 2000);
}
