// ===== SOPORTE NUTRICIONAL — Clinical Nutrition Support Module =====
// ESPEN ICU 2019 · ESPEN Liver 2019 · ESPEN Surgery 2025 · ASPEN 2024
// Motor de decisiones clínicas para pacientes hospitalizados y críticos
// Toggle UCI: activable para funciones intensivistas

// --- Estado del módulo ---
var SN = {
  uciMode: false,        // Toggle UCI activado/desactivado
  currentTab: 'tamizaje', // tamizaje | metabolismo | prescripcion | monitorizacion
  patientId: null,
  data: {}                // Datos de soporte nutricional por paciente
};

function toggleUCIMode(checked){
  SN.uciMode=checked;
  try{localStorage.setItem('veridia_sn_uci',checked?'1':'0')}catch(e){console.warn('[Veridia]',e.message||e)}
  rSoporteNutricional();
}
// Cargar datos persistidos
try {
  var _snData = JSON.parse(localStorage.getItem('veridia_db'));
  if (_snData && _snData.soporteNutricional) SN.data = _snData.soporteNutricional;
  if (_snData && _snData.snUciMode) SN.uciMode = true;
} catch(e) { console.warn('[Veridia]', e.message || e) }

// --- Persistir en sync ---
// (se agrega al fbSyncDB snapshot automáticamente)

// ============================================================
// SCORES CLÍNICOS
// ============================================================

// --- NUTRIC Score (Heyland 2011) — Solo UCI ---
function calcNUTRIC(data) {
  var d = data || {};
  var score = 0; var items = [];

  // Age (0-1)
  var edad = d.edad || 0;
  if (edad >= 70) { score += 1; items.push('Edad ≥70: +1') }
  else { items.push('Edad <70: 0') }

  // APACHE II (0-2)
  var apache = d.apacheII || 0;
  if (apache >= 28) { score += 2; items.push('APACHE II ≥28: +2') }
  else if (apache >= 20) { score += 1; items.push('APACHE II 20-27: +1') }
  else { items.push('APACHE II <20: 0') }

  // SOFA (0-2)
  var sofa = d.sofa || 0;
  if (sofa >= 10) { score += 2; items.push('SOFA ≥10: +2') }
  else if (sofa >= 6) { score += 1; items.push('SOFA 6-9: +1') }
  else { items.push('SOFA <6: 0') }

  // Comorbidities (0-1)
  var comorb = d.comorbilidades || 0;
  if (comorb >= 2) { score += 1; items.push('Comorbilidades ≥2: +1') }
  else { items.push('Comorbilidades <2: 0') }

  // Days hospital to ICU (0-1)
  var diasPre = d.diasPreUCI || 0;
  if (diasPre >= 1) { score += 1; items.push('Días pre-UCI ≥1: +1') }
  else { items.push('Días pre-UCI 0: 0') }

  // IL-6 optional (0-1)
  if (d.il6 && d.il6 >= 400) { score += 1; items.push('IL-6 ≥400: +1') }

  return {
    score: score,
    maxScore: d.il6 !== undefined ? 10 : 9,
    risk: score >= 5 ? 'ALTO' : 'BAJO',
    action: score >= 5
      ? 'Riesgo nutricional ALTO — Beneficio significativo de nutrición agresiva precoz [ESPEN ICU Rec. 1]'
      : 'Riesgo nutricional BAJO — Nutrición estándar, monitorizar',
    items: items,
    ref: 'NUTRIC Score (Heyland 2011, ESPEN ICU 2019)'
  };
}

// --- Child-Pugh Score (Hepatología) ---
function calcChildPugh(data) {
  var d = data || {};
  var score = 0; var items = [];

  // Bilirubin
  var bili = d.bilirrubina || 0;
  if (bili > 3) { score += 3; items.push('Bilirrubina >3: 3pts') }
  else if (bili >= 2) { score += 2; items.push('Bilirrubina 2-3: 2pts') }
  else { score += 1; items.push('Bilirrubina <2: 1pt') }

  // Albumin
  var alb = d.albumina || 4;
  if (alb < 2.8) { score += 3; items.push('Albúmina <2.8: 3pts') }
  else if (alb <= 3.5) { score += 2; items.push('Albúmina 2.8-3.5: 2pts') }
  else { score += 1; items.push('Albúmina >3.5: 1pt') }

  // INR
  var inr = d.inr || 1;
  if (inr > 2.3) { score += 3; items.push('INR >2.3: 3pts') }
  else if (inr >= 1.7) { score += 2; items.push('INR 1.7-2.3: 2pts') }
  else { score += 1; items.push('INR <1.7: 1pt') }

  // Ascitis
  var asc = d.ascitis || 'no';
  if (asc === 'severa') { score += 3; items.push('Ascitis severa: 3pts') }
  else if (asc === 'moderada') { score += 2; items.push('Ascitis moderada: 2pts') }
  else { score += 1; items.push('Ascitis ausente: 1pt') }

  // Encefalopatía
  var enc = d.encefalopatia || 0;
  if (enc >= 3) { score += 3; items.push('Encefalopatía III-IV: 3pts') }
  else if (enc >= 1) { score += 2; items.push('Encefalopatía I-II: 2pts') }
  else { score += 1; items.push('Encefalopatía 0: 1pt') }

  var clase = score <= 6 ? 'A' : score <= 9 ? 'B' : 'C';

  return {
    score: score,
    clase: clase,
    label: 'Child-Pugh ' + clase + ' (' + score + ' pts)',
    survivalRate: clase === 'A' ? '100% 1a' : clase === 'B' ? '80% 1a' : '45% 1a',
    items: items,
    nutritionImplication: clase === 'C'
      ? 'Alto riesgo malnutrición. Energía 35 kcal/kg peso seco/día. Proteína 1.2-1.5 g/kg/día. NO restringir proteínas. [ESPEN Liver Rec. 14-15]'
      : clase === 'B'
        ? 'Riesgo moderado. Energía 30-35 kcal/kg/día. Proteína 1.2 g/kg/día. Monitorizar amonio. [ESPEN Liver Rec. 12]'
        : 'Riesgo bajo. Dieta equilibrada. Evaluar sarcopenia. [ESPEN Liver Rec. 7-8]',
    ref: 'Child-Pugh (Pugh 1973, ESPEN Liver 2019)'
  };
}

// --- RFH-NPT (Royal Free Hospital Nutritional Prioritizing Tool) ---
function calcRFHNPT(data) {
  var d = data || {};

  // Descompensación directa → alto riesgo
  if (d.ascitis === 'severa' || d.encefalopatia >= 3) {
    return {
      score: 99, risk: 'ALTO',
      reason: 'Cirrosis descompensada (ascitis severa/encefalopatía III-IV) → Riesgo alto automático',
      action: 'Interconsulta mandatoria con Nutrición Clínica. Iniciar soporte antes de 24h. [ESPEN Liver Rec. 3-5]',
      ref: 'RFH-NPT (Arora 2012, ESPEN Liver 2019)'
    };
  }

  var score = 0; var items = [];

  // IMC
  var imc = d.imc || 22;
  var tieneAscitis = d.ascitis && d.ascitis !== 'no';
  if ((!tieneAscitis && imc < 18.5) || (tieneAscitis && imc < 20)) { score += 1; items.push('IMC bajo' + (tieneAscitis ? ' (ajustado por ascitis)' : '') + ': +1') }

  // Pérdida de peso
  var wl = d.perdidaPeso || 0;
  if (wl > 10) { score += 2; items.push('Pérdida >10%: +2') }
  else if (wl >= 5) { score += 1; items.push('Pérdida 5-10%: +1') }

  // Ingesta reducida
  if (d.ingestaReducida) { score += 1; items.push('Ingesta reducida 2 semanas: +1') }

  // Child-Pugh
  var cp = d.childPugh || 'A';
  if (cp === 'C') { score += 2; items.push('Child-Pugh C: +2') }
  else if (cp === 'B') { score += 1; items.push('Child-Pugh B: +1') }

  var risk = score >= 5 ? 'ALTO' : score >= 2 ? 'MODERADO' : 'BAJO';

  return {
    score: score,
    risk: risk,
    items: items,
    action: risk === 'ALTO'
      ? 'Activar interconsulta Nutrición Clínica. Soporte nutricional especializado <24h. [ESPEN Liver Rec. 3]'
      : risk === 'MODERADO'
        ? 'Plan de intervención nutricional estándar. Monitorizar ingesta calórica diaria. [ESPEN Liver Rec. 9]'
        : 'Reevaluar en 7 días (hospitalizados) o 3 meses (ambulatorios). [ESPEN Liver Rec. 7]',
    ref: 'RFH-NPT (Arora 2012, ESPEN Liver 2019)'
  };
}

// --- SOFA Score (Sequential Organ Failure Assessment) ---
function calcSOFA(data) {
  var d = data || {};
  var score = 0;
  // Simplified: PaO2/FiO2, Platelets, Bilirubin, MAP/Vasopressors, GCS, Creatinine
  score += (d.pao2fio2 || 0); // 0-4
  score += (d.plaquetas || 0); // 0-4
  score += (d.bilirrubina_sofa || 0); // 0-4
  score += (d.cardiovascular || 0); // 0-4
  score += (d.gcs || 0); // 0-4
  score += (d.creatinina || 0); // 0-4

  return {
    score: score,
    maxScore: 24,
    mortality: score <= 6 ? '<10%' : score <= 9 ? '15-20%' : score <= 12 ? '40-50%' : '>80%',
    ref: 'SOFA (Vincent 1996)'
  };
}

// ============================================================
// FÓRMULAS METABÓLICAS ESPECIALIZADAS
// ============================================================

// --- Penn State (ventilación mecánica) ---
function calcPennState(data) {
  var d = data || {};
  var hb = 66.5 + 13.75 * (d.peso || 70) + 5.003 * (d.altura || 170) - 6.775 * (d.edad || 50);
  if (d.sexo === 'F') hb = 655.1 + 9.563 * (d.peso || 60) + 1.85 * (d.altura || 160) - 4.676 * (d.edad || 50);

  var tmax = d.tempMax || 37; // Temperatura máxima en 24h
  var ve = d.volMinuto || 8;   // Volumen minuto (L/min)

  // Penn State 2003b (más validada)
  var geb = 0.85 * hb + 175 * tmax + 33 * ve - 6433;
  // Penn State modificada 2010 (para IMC ≥ 30)
  var gebMod = d.imc >= 30 ? 0.71 * hb + 85 * tmax + 64 * ve - 3085 : geb;

  return {
    geb: Math.round(geb > 0 ? geb : hb),
    gebModObesidad: Math.round(gebMod > 0 ? gebMod : hb),
    hb: Math.round(hb),
    formula: d.imc >= 30 ? 'Penn State 2010 (Obesidad)' : 'Penn State 2003b',
    note: 'Requiere: Temp máx 24h + Vol minuto del ventilador',
    ref: 'Penn State (Frankenfield 2004, ESPEN ICU 2019 Rec. 5)'
  };
}

// --- Peso seco (ajuste por ascitis/edema) ---
function calcPesoSeco(pesoReal, ascitis, edema) {
  var descuento = 0;
  // Ascitis
  if (ascitis === 'leve') descuento += 5;
  else if (ascitis === 'moderada') descuento += 10;
  else if (ascitis === 'severa') descuento += 14;
  // Edema periférico
  if (edema === 'leve') descuento += 1;
  else if (edema === 'moderado') descuento += 5;
  else if (edema === 'severo') descuento += 10;

  return {
    pesoReal: pesoReal,
    descuento: descuento,
    pesoSeco: Math.round((pesoReal - descuento) * 10) / 10,
    nota: 'Peso seco = Peso real - ' + descuento + 'kg (ascitis: ' + (ascitis || 'no') + ', edema: ' + (edema || 'no') + ')',
    ref: 'ESPEN Liver 2019 Rec. 10'
  };
}

// --- Peso ideal y ajustado ---
function calcPesoIdealAjustado(altura, sexo, pesoReal) {
  var pi = sexo === 'M' ? 50 + 0.91 * (altura - 152.4) : 45.5 + 0.91 * (altura - 152.4);
  pi = Math.round(pi * 10) / 10;
  var paj = Math.round((pi + 0.25 * (pesoReal - pi)) * 10) / 10;
  return { ideal: pi, ajustado: paj, real: pesoReal };
}

// --- Progresión calórica UCI (días) ---
function calcProgresionUCI(getObjetivo, diaActual) {
  // ESPEN ICU 2019: inicio trófico → progresión a 3-7 días
  var progresion = [
    { dia: 1, pct: 25, nota: 'Trofismo enteral / inicio cauto' },
    { dia: 2, pct: 50, nota: 'Progresión si tolera' },
    { dia: 3, pct: 75, nota: 'Objetivo cercano' },
    { dia: 4, pct: 100, nota: 'Meta calórica completa' },
    { dia: 5, pct: 100, nota: 'Mantener + evaluar proteínas' },
    { dia: 6, pct: 100, nota: 'Evaluar transición oral' },
    { dia: 7, pct: 100, nota: 'Reevaluación semanal' }
  ];

  return progresion.map(function(p) {
    var target = Math.round(getObjetivo * p.pct / 100);
    return {
      dia: p.dia,
      pct: p.pct,
      kcal: target,
      actual: diaActual === p.dia,
      nota: p.nota
    };
  });
}

// --- Calorías No Proteicas / Gramo de Nitrógeno ---
function calcCalNoProt_gN(kcalTotal, protG) {
  var nG = protG / 6.25; // 1g N = 6.25g proteína
  var kcalProt = protG * 4;
  var kcalNoProt = kcalTotal - kcalProt;
  var ratio = nG > 0 ? Math.round(kcalNoProt / nG) : 0;

  return {
    kcalTotal: kcalTotal,
    kcalProteicas: Math.round(kcalProt),
    kcalNoProteicas: Math.round(kcalNoProt),
    gramosN: Math.round(nG * 10) / 10,
    ratio: ratio,
    interpretation: ratio > 150 ? 'Hipocalórica relativa (>150:1)' :
      ratio >= 100 ? 'Óptima para estrés metabólico (100-150:1) ✅' :
        ratio >= 80 ? 'Adecuada para paciente crítico (80-100:1) ✅' :
          'Posible sobrecarga nitrogenada (<80:1) ⚠️',
    ref: 'ESPEN ICU 2019'
  };
}

// --- Alerta Síndrome de Realimentación ---
function checkRealimentacion(electrolitosHoy, electrolitosAyer) {
  if (!electrolitosHoy || !electrolitosAyer) return null;

  var alertas = [];
  var blocker = false;

  ['fosforo', 'potasio', 'magnesio'].forEach(function(e) {
    var hoy = electrolitosHoy[e];
    var ayer = electrolitosAyer[e];
    if (hoy && ayer && ayer > 0) {
      var drop = ((ayer - hoy) / ayer) * 100;
      if (drop >= 30) {
        alertas.push({
          electrolito: e.charAt(0).toUpperCase() + e.slice(1),
          ayer: ayer, hoy: hoy,
          caida: Math.round(drop) + '%',
          critico: true
        });
        blocker = true;
      } else if (drop >= 15) {
        alertas.push({
          electrolito: e.charAt(0).toUpperCase() + e.slice(1),
          ayer: ayer, hoy: hoy,
          caida: Math.round(drop) + '%',
          critico: false
        });
      }
    }
  });

  return {
    alerta: alertas.length > 0,
    bloquear: blocker,
    alertas: alertas,
    action: blocker
      ? '🚨 SÍNDROME DE REALIMENTACIÓN — Bloquear progresión calórica. Suplementar P/K/Mg IV. Tiamina 200-300mg IV. Reducir kcal a <50% e incrementar lentamente. [ESPEN ICU Rec. 14]'
      : alertas.length > 0
        ? '⚠️ Descenso electrolítico significativo — Monitorizar c/6-12h. Considerar suplementación. No pausar nutrición pero vigilar.'
        : 'Sin signos de realimentación',
    ref: 'ESPEN ICU 2019 Rec. 14, NICE Refeeding Guidelines'
  };
}

// --- Interacción Propofol ---
function calcPropofolKcal(mlPorHora, horas) {
  // Propofol: emulsión lipídica al 10% = 1.1 kcal/mL
  var mlTotal = mlPorHora * horas;
  var kcal = Math.round(mlTotal * 1.1);
  var grasaG = Math.round(mlTotal * 0.1); // 10% = 0.1g/mL de lípidos

  return {
    mlTotal: mlTotal,
    kcal: kcal,
    grasaG: grasaG,
    nota: 'Descontar ' + kcal + ' kcal y ' + grasaG + 'g de grasa del aporte nutricional',
    ref: 'ESPEN ICU 2019 Rec. 8'
  };
}

// --- Sarcopenia L3-L4 (Índice Músculo Esquelético) ---
function evalSarcopeniaL3(ime, sexo, imc) {
  var cutoff;
  if (sexo === 'F') {
    cutoff = 39;
  } else {
    cutoff = imc >= 25 ? 50 : 43;
  }

  var sarcopenia = ime < cutoff;

  return {
    ime: ime,
    cutoff: cutoff,
    sarcopenia: sarcopenia,
    label: sarcopenia ? 'SARCOPENIA CONFIRMADA' : 'Sin sarcopenia',
    action: sarcopenia
      ? 'Proteína ≥1.5g/kg/día + Colación nocturna HC complejos (prevenir gluconeogénesis muscular) + Ejercicio resistencia + BCAA 0.25g/kg/día si lista TxH [ESPEN Liver Rec. 57-60]'
      : 'Monitorizar masa muscular periódicamente',
    ref: 'Martin 2013, ESPEN Liver 2019'
  };
}

// ============================================================
// RENDER PRINCIPAL
// ============================================================

function rSoporteNutricional() {
  var p = requirePatient(); if (!p) return;
  SN.patientId = selPat;

  var tabs = [
    { id: 'tamizaje', ic: '📋', l: 'Tamizaje' },
    { id: 'metabolismo', ic: '🔬', l: 'Blanco Nutricional' },
    { id: 'prescripcion', ic: '💊', l: 'Prescripción' },
    { id: 'monitorizacion', ic: '📊', l: 'Monitorización' }
  ];

  var antro = DB.antropometrias.filter(function(a) { return a.pacienteId === selPat }).sort(function(a, b) { return b.fecha.localeCompare(a.fecha) })[0];
  var ed = age(p.fechaNacimiento);
  var sexo = p.sexo === 'MASCULINO' ? 'M' : 'F';
  var peso = antro ? antro.peso : 70;
  var altura = antro ? antro.altura : 165;
  var imc = antro ? antro.imc : 24;

  $('mainContent').innerHTML = '<div class="fade-in">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">'
    + '<div style="display:flex;align-items:center;gap:10px">'
    + patSel(selPat)
    + '<label style="display:flex;align-items:center;gap:6px;font-size:.78rem;cursor:pointer;padding:4px 12px;border-radius:var(--radius-xs);border:2px solid ' + (SN.uciMode ? 'var(--danger)' : 'var(--border)') + ';background:' + (SN.uciMode ? '#fee2e2' : 'var(--surface)') + '"><input type="checkbox" ' + (SN.uciMode ? 'checked' : '') + ' onchange=\"toggleUCIMode(this.checked)\"> <span style="font-weight:700;color:' + (SN.uciMode ? 'var(--danger)' : 'var(--text3)') + '">🏥 Modo UCI</span></label>'
    + '</div>'
    + '<div class="alert alert-info" style="margin:0;padding:6px 14px;font-size:.7rem">Paciente: <strong>' + p.nombre + ' ' + p.apellidos + '</strong> · ' + peso + 'kg · ' + altura + 'cm · ' + ed + 'a · ' + (sexo === 'M' ? '♂' : '♀') + ' · IMC ' + imc + '</div>'
    + '</div>'
    + '<div class="pill-tabs" style="margin-bottom:16px">' + tabs.map(function(t) {
      return '<button class="pill-tab ' + (SN.currentTab === t.id ? 'active' : '') + '" onclick="SN.currentTab=\'' + t.id + '\';rSoporteNutricional()">' + t.ic + ' ' + t.l + '</button>';
    }).join('') + '</div>'
    + '<div id="snContent"></div>'
    + '<div style="margin-top:14px;font-size:.55rem;color:var(--text3);text-align:center">⚠️ Herramienta de apoyo a la decisión clínica. No sustituye el juicio médico. Basado en guías ESPEN 2019-2025.</div>'
    + '</div>';

  var c = $('snContent');
  if (SN.currentTab === 'tamizaje') renderSNTamizaje(c, p, antro, ed, sexo, peso, altura, imc);
  else if (SN.currentTab === 'metabolismo') renderSNMetabolismo(c, p, ed, sexo, peso, altura, imc);
  else if (SN.currentTab === 'prescripcion') renderSNPrescripcion(c, p, peso, altura);
  else if (SN.currentTab === 'monitorizacion') renderSNMonitorizacion(c, p, peso);
}

// ============================================================
// TAB 1: TAMIZAJE
// ============================================================
function renderSNTamizaje(c, p, antro, ed, sexo, peso, altura, imc) {
  // NRS-2002 (already exists in espen.js)
  var nrs = typeof calcNRS2002 === 'function' ? calcNRS2002(p, antro || { imc: imc }, {}) : null;
  var glim = typeof calcGLIM === 'function' ? calcGLIM(p, DB.antropometrias.filter(function(a) { return a.pacienteId === selPat }), DB.analiticas.filter(function(a) { return a.pacienteId === selPat })) : null;

  c.innerHTML = '<div class="grid-23"><div>'
    // NRS-2002
    + '<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">📏 NRS-2002</span><span class="badge badge-neutral" style="font-size:.58rem">ESPEN Estándar</span></div><div class="card-body">'
    + (nrs ? renderNRS2002(nrs) : '<p style="color:var(--text3)">Datos insuficientes</p>')
    + '</div></div>'
    // GLIM
    + '<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">📐 GLIM</span></div><div class="card-body">'
    + (glim ? renderGLIM(glim) : '<p style="color:var(--text3)">Datos insuficientes</p>')
    + '</div></div>'
    + '</div><div>'
    // NUTRIC (solo UCI)
    + (SN.uciMode ? '<div class="card" style="margin-bottom:14px;border:2px solid var(--danger)"><div class="card-header"><span class="card-title">🏥 NUTRIC Score</span><span class="badge badge-danger" style="font-size:.58rem">UCI</span></div><div class="card-body">'
      + '<div class="form-row"><div class="form-group"><label class="form-label">APACHE II</label><input type="number" id="snApache" value="15" min="0" max="71" onchange="updateNUTRIC()"></div>'
      + '<div class="form-group"><label class="form-label">SOFA</label><input type="number" id="snSofa" value="6" min="0" max="24" onchange="updateNUTRIC()"></div></div>'
      + '<div class="form-row"><div class="form-group"><label class="form-label">Comorbilidades</label><input type="number" id="snComorb" value="1" min="0" max="10" onchange="updateNUTRIC()"></div>'
      + '<div class="form-group"><label class="form-label">Días pre-UCI</label><input type="number" id="snDiasPreUCI" value="0" min="0" onchange="updateNUTRIC()"></div></div>'
      + '<div id="snNutricResult"></div>'
      + '</div></div>' : '')
    // Child-Pugh (siempre visible para hepatología)
    + '<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">🫁 Child-Pugh</span><span class="badge badge-neutral" style="font-size:.58rem">Hepatología</span></div><div class="card-body">'
    + '<div class="form-row"><div class="form-group"><label class="form-label">Bilirrubina (mg/dL)</label><input type="number" id="snBili" value="1.5" step="0.1" onchange="updateChildPugh()"></div>'
    + '<div class="form-group"><label class="form-label">Albúmina (g/dL)</label><input type="number" id="snAlb" value="3.5" step="0.1" onchange="updateChildPugh()"></div></div>'
    + '<div class="form-row"><div class="form-group"><label class="form-label">INR</label><input type="number" id="snINR" value="1.2" step="0.1" onchange="updateChildPugh()"></div>'
    + '<div class="form-group"><label class="form-label">Ascitis</label><select id="snAscitis" onchange="updateChildPugh()"><option value="no">Ausente</option><option value="moderada">Moderada</option><option value="severa">Severa</option></select></div></div>'
    + '<div class="form-group"><label class="form-label">Encefalopatía</label><select id="snEnc" onchange="updateChildPugh()"><option value="0">Grado 0</option><option value="1">Grado I-II</option><option value="3">Grado III-IV</option></select></div>'
    + '<div id="snChildResult"></div>'
    + '</div></div>'
    // Sarcopenia L3
    + '<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">💪 Sarcopenia L3-L4</span></div><div class="card-body">'
    + '<div class="form-row"><div class="form-group"><label class="form-label">IME (cm²/m²)</label><input type="number" id="snIME" step="0.1" placeholder="Índice músculo esquelético TC/RM"></div>'
    + '<button class="btn btn-outline btn-sm" onclick="evalSarcopeniaUI()">Evaluar</button></div>'
    + '<div id="snSarcoResult"></div>'
    + '</div></div>'
    + '</div></div>';

  // Auto-calculate
  setTimeout(function() {
    if (SN.uciMode) updateNUTRIC();
    updateChildPugh();
  }, 50);
}

function updateNUTRIC() {
  var ed = $('mainContent') ? age(gP(selPat).fechaNacimiento) : 50;
  var result = calcNUTRIC({
    edad: ed,
    apacheII: parseInt($('snApache') ? $('snApache').value : 15),
    sofa: parseInt($('snSofa') ? $('snSofa').value : 6),
    comorbilidades: parseInt($('snComorb') ? $('snComorb').value : 1),
    diasPreUCI: parseInt($('snDiasPreUCI') ? $('snDiasPreUCI').value : 0)
  });
  var el = $('snNutricResult');
  if (!el) return;
  var color = result.risk === 'ALTO' ? 'var(--danger)' : 'var(--success)';
  el.innerHTML = '<div style="padding:10px;border-radius:var(--radius-xs);border:2px solid ' + color + ';background:' + color + '10;margin-top:10px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center"><strong>NUTRIC: ' + result.score + '/' + result.maxScore + '</strong><span class="badge" style="background:' + color + ';color:#fff">Riesgo ' + result.risk + '</span></div>'
    + '<div style="font-size:.72rem;color:var(--text2);margin-top:6px">' + result.action + '</div>'
    + '<div style="font-size:.58rem;color:var(--text3);margin-top:4px">' + result.ref + '</div></div>';
}

function updateChildPugh() {
  var result = calcChildPugh({
    bilirrubina: parseFloat($('snBili') ? $('snBili').value : 1.5),
    albumina: parseFloat($('snAlb') ? $('snAlb').value : 3.5),
    inr: parseFloat($('snINR') ? $('snINR').value : 1.2),
    ascitis: $('snAscitis') ? $('snAscitis').value : 'no',
    encefalopatia: parseInt($('snEnc') ? $('snEnc').value : 0)
  });
  var el = $('snChildResult');
  if (!el) return;
  var color = result.clase === 'C' ? 'var(--danger)' : result.clase === 'B' ? 'var(--warning)' : 'var(--success)';
  el.innerHTML = '<div style="padding:10px;border-radius:var(--radius-xs);border:2px solid ' + color + ';background:' + color + '10;margin-top:10px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center"><strong>' + result.label + '</strong><span style="font-size:.72rem;color:var(--text3)">Supervivencia 1a: ' + result.survivalRate + '</span></div>'
    + '<div style="font-size:.72rem;color:var(--text2);margin-top:6px">' + result.nutritionImplication + '</div>'
    + '<div style="font-size:.58rem;color:var(--text3);margin-top:4px">' + result.ref + '</div></div>';
}

function evalSarcopeniaUI() {
  var ime = parseFloat($('snIME') ? $('snIME').value : 0);
  if (!ime) { toast('Ingrese el IME del TC/RM', 'error'); return }
  var p = gP(selPat); var antro = DB.antropometrias.filter(function(a) { return a.pacienteId === selPat }).sort(function(a, b) { return b.fecha.localeCompare(a.fecha) })[0];
  var result = evalSarcopeniaL3(ime, p.sexo === 'MASCULINO' ? 'M' : 'F', antro ? antro.imc : 24);
  var el = $('snSarcoResult');
  if (!el) return;
  var color = result.sarcopenia ? 'var(--danger)' : 'var(--success)';
  el.innerHTML = '<div style="padding:10px;border-radius:var(--radius-xs);border:2px solid ' + color + ';background:' + color + '10;margin-top:10px">'
    + '<strong style="color:' + color + '">' + result.label + '</strong> (IME: ' + ime + ' vs cutoff: ' + result.cutoff + ' cm²/m²)'
    + '<div style="font-size:.72rem;margin-top:6px">' + result.action + '</div>'
    + '<div style="font-size:.58rem;color:var(--text3);margin-top:4px">' + result.ref + '</div></div>';
}

// ============================================================
// TAB 2: BLANCO NUTRICIONAL
// ============================================================
function renderSNMetabolismo(c, p, ed, sexo, peso, altura, imc) {
  var antro = DB.antropometrias.filter(function(a) { return a.pacienteId === selPat }).sort(function(a, b) { return b.fecha.localeCompare(a.fecha) })[0];

  // Pre-calculate all formulas
  var mifflin = 10 * peso + 6.25 * altura - 5 * ed + (sexo === 'M' ? 5 : -161);
  var hb = sexo === 'M' ? 66.5 + 13.75 * peso + 5.003 * altura - 6.775 * ed : 655.1 + 9.563 * peso + 1.85 * altura - 4.676 * ed;
  var owen = sexo === 'M' ? 879 + 10.2 * peso : 795 + 7.18 * peso;
  var pesos = calcPesoIdealAjustado(altura, sexo, peso);

  c.innerHTML = '<div class="grid-23"><div>'
    // Peso seco / ajustado
    + '<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">⚖️ Pesos de referencia</span></div><div class="card-body">'
    + '<div class="form-row"><div class="form-group"><label class="form-label">Peso real (kg)</label><input type="number" id="snPesoReal" value="' + peso + '" step="0.1" onchange="recalcSNMetab()"></div>'
    + '<div class="form-group"><label class="form-label">Ascitis</label><select id="snMetAscitis" onchange="recalcSNMetab()"><option value="no">No</option><option value="leve">Leve (-5kg)</option><option value="moderada">Moderada (-10kg)</option><option value="severa">Severa (-14kg)</option></select></div></div>'
    + '<div class="form-row"><div class="form-group"><label class="form-label">Edema</label><select id="snMetEdema" onchange="recalcSNMetab()"><option value="no">No</option><option value="leve">Leve (-1kg)</option><option value="moderado">Moderado (-5kg)</option><option value="severo">Severo (-10kg)</option></select></div>'
    + '<div class="form-group"><label class="form-label">Usar peso</label><select id="snUsarPeso" onchange="recalcSNMetab()"><option value="real">Real</option><option value="seco">Seco (ascitis/edema)</option><option value="ideal">Ideal</option><option value="ajustado">Ajustado (obesidad)</option></select></div></div>'
    + '<div id="snPesosRef" style="margin-top:8px"></div>'
    + '</div></div>'
    // Fórmulas
    + '<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">🔬 Gasto Energético</span></div><div class="card-body">'
    + '<div class="form-row"><div class="form-group"><label class="form-label">Fórmula</label><select id="snFormula" onchange="recalcSNMetab()">'
    + '<option value="mifflin">Mifflin-St Jeor (' + Math.round(mifflin) + ' kcal)</option>'
    + '<option value="hb">Harris-Benedict (' + Math.round(hb) + ' kcal)</option>'
    + '<option value="owen">Owen (' + Math.round(owen) + ' kcal)</option>'
    + (SN.uciMode ? '<option value="pennstate">Penn State (ventilación mecánica)</option>' : '')
    + '<option value="espen_directo">ESPEN directo (25 kcal/kg/día)</option>'
    + '<option value="manual">Manual</option></select></div>'
    + '<div class="form-group"><label class="form-label">Factor estrés</label><select id="snFE" onchange="recalcSNMetab()">'
    + '<option value="1.0">Estable (1.0)</option><option value="1.1">Estrés leve (1.1)</option>'
    + '<option value="1.2" selected>Estrés moderado (1.2)</option><option value="1.3">Estrés grave (1.3)</option>'
    + '<option value="1.5">Estrés severo (1.5)</option></select></div></div>'
    + (SN.uciMode ? '<div class="form-row"><div class="form-group"><label class="form-label">T° máx 24h (°C)</label><input type="number" id="snTempMax" value="37.5" step="0.1" onchange="recalcSNMetab()"></div>'
      + '<div class="form-group"><label class="form-label">Vol. minuto (L/min)</label><input type="number" id="snVolMin" value="8" step="0.1" onchange="recalcSNMetab()"></div></div>' : '')
    + '<div id="snGEBResult" style="margin-top:10px"></div>'
    + '</div></div>'
    + '</div><div>'
    // Macros y progresión
    + '<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">🎯 Blanco Nutricional</span></div><div class="card-body">'
    + '<div class="form-row"><div class="form-group"><label class="form-label">Proteínas (g/kg/día)</label><input type="number" id="snProtKg" value="1.3" step="0.1" min="0.5" max="2.5" onchange="recalcSNMetab()"></div>'
    + '<div class="form-group"><label class="form-label">Ajuste kcal</label><input type="number" id="snAjuste" value="0" step="50" onchange="recalcSNMetab()"></div></div>'
    + (SN.uciMode ? '<div class="form-group"><label class="form-label">Propofol (mL/h)</label><div class="form-row"><input type="number" id="snPropofol" value="0" step="1" onchange="recalcSNMetab()"><input type="number" id="snPropofolH" value="24" style="width:60px" onchange="recalcSNMetab()"><span style="font-size:.72rem;color:var(--text3)">horas</span></div></div>' : '')
    + '<div id="snBlancoResult" style="margin-top:10px"></div>'
    + '</div></div>'
    // Progresión UCI
    + (SN.uciMode ? '<div class="card" style="margin-bottom:14px;border:2px solid var(--danger)"><div class="card-header"><span class="card-title">📈 Progresión calórica UCI</span><span class="badge badge-danger" style="font-size:.58rem">UCI</span></div><div class="card-body">'
      + '<div class="form-group"><label class="form-label">Día actual de soporte</label><input type="number" id="snDiaActual" value="1" min="1" max="7" onchange="recalcSNMetab()"></div>'
      + '<div id="snProgresion"></div></div></div>' : '')
    + '</div></div>';

  setTimeout(recalcSNMetab, 50);
}

function recalcSNMetab() {
  var p = gP(selPat); if (!p) return;
  var pesoReal = parseFloat($('snPesoReal') ? $('snPesoReal').value : 70);
  var ed = age(p.fechaNacimiento);
  var sexo = p.sexo === 'MASCULINO' ? 'M' : 'F';
  var altura = DB.antropometrias.filter(function(a) { return a.pacienteId === selPat }).sort(function(a, b) { return b.fecha.localeCompare(a.fecha) })[0];
  var alt = altura ? altura.altura : 165;
  var imc = pesoReal / ((alt / 100) * (alt / 100));

  // Pesos
  var ps = calcPesoSeco(pesoReal, $('snMetAscitis') ? $('snMetAscitis').value : 'no', $('snMetEdema') ? $('snMetEdema').value : 'no');
  var pi = calcPesoIdealAjustado(alt, sexo, pesoReal);
  var usarPeso = $('snUsarPeso') ? $('snUsarPeso').value : 'real';
  var pesoCalc = usarPeso === 'seco' ? ps.pesoSeco : usarPeso === 'ideal' ? pi.ideal : usarPeso === 'ajustado' ? pi.ajustado : pesoReal;

  var elP = $('snPesosRef');
  if (elP) elP.innerHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap;font-size:.72rem">'
    + '<span class="badge badge-neutral">Real: ' + pesoReal + 'kg</span>'
    + '<span class="badge badge-neutral">Seco: ' + ps.pesoSeco + 'kg</span>'
    + '<span class="badge badge-neutral">Ideal: ' + pi.ideal + 'kg</span>'
    + '<span class="badge badge-neutral">Ajustado: ' + pi.ajustado + 'kg</span>'
    + '<span class="badge badge-primary">Usando: ' + pesoCalc + 'kg (' + usarPeso + ')</span></div>';

  // GEB
  var formula = $('snFormula') ? $('snFormula').value : 'mifflin';
  var fe = parseFloat($('snFE') ? $('snFE').value : 1.2);
  var geb;
  if (formula === 'mifflin') geb = 10 * pesoCalc + 6.25 * alt - 5 * ed + (sexo === 'M' ? 5 : -161);
  else if (formula === 'hb') geb = sexo === 'M' ? 66.5 + 13.75 * pesoCalc + 5.003 * alt - 6.775 * ed : 655.1 + 9.563 * pesoCalc + 1.85 * alt - 4.676 * ed;
  else if (formula === 'owen') geb = sexo === 'M' ? 879 + 10.2 * pesoCalc : 795 + 7.18 * pesoCalc;
  else if (formula === 'pennstate') {
    var ps2 = calcPennState({ peso: pesoCalc, altura: alt, edad: ed, sexo: sexo, imc: imc, tempMax: parseFloat($('snTempMax') ? $('snTempMax').value : 37.5), volMinuto: parseFloat($('snVolMin') ? $('snVolMin').value : 8) });
    geb = ps2.geb;
  }
  else if (formula === 'espen_directo') geb = 25 * pesoCalc;
  else geb = 25 * pesoCalc;

  var get = Math.round(geb * fe);
  var ajuste = parseInt($('snAjuste') ? $('snAjuste').value : 0);
  var getF = get + ajuste;

  // Propofol
  var propofolKcal = 0;
  if (SN.uciMode && $('snPropofol')) {
    var propMl = parseFloat($('snPropofol').value) || 0;
    var propH = parseFloat($('snPropofolH') ? $('snPropofolH').value : 24);
    if (propMl > 0) {
      var propData = calcPropofolKcal(propMl, propH);
      propofolKcal = propData.kcal;
    }
  }
  var getFinal = getF - propofolKcal;

  var elGEB = $('snGEBResult');
  if (elGEB) elGEB.innerHTML = '<div style="text-align:center;padding:14px;background:var(--primary-light);border-radius:var(--radius-sm)">'
    + '<div style="font-size:.68rem;color:var(--text3);text-transform:uppercase">' + formula + ' × FE ' + fe + '</div>'
    + '<div style="font-size:2rem;font-weight:900;color:var(--primary)">' + getFinal + ' <span style="font-size:.9rem;font-weight:400">kcal/día</span></div>'
    + '<div style="font-size:.68rem;color:var(--text3)">GEB: ' + Math.round(geb) + ' · GET: ' + get + (ajuste ? ' · Ajuste: ' + ajuste : '') + (propofolKcal ? ' · <span style="color:var(--danger)">Propofol: -' + propofolKcal + '</span>' : '') + '</div></div>';

  // Macros
  var protKg = parseFloat($('snProtKg') ? $('snProtKg').value : 1.3);
  var protG = Math.round(protKg * pesoCalc);
  var cnpn = calcCalNoProt_gN(getFinal, protG);

  var elB = $('snBlancoResult');
  if (elB) elB.innerHTML = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">'
    + '<div style="padding:10px;text-align:center;border-radius:var(--radius-xs);border-top:3px solid var(--accent);background:var(--surface2)"><div style="font-size:1.2rem;font-weight:800;color:var(--accent)">' + protG + 'g</div><div style="font-size:.6rem;color:var(--text3)">Proteínas (' + protKg + 'g/kg)</div></div>'
    + '<div style="padding:10px;text-align:center;border-radius:var(--radius-xs);border-top:3px solid var(--warning);background:var(--surface2)"><div style="font-size:1.2rem;font-weight:800;color:var(--warning)">' + Math.round(getFinal * 0.30 / 9) + 'g</div><div style="font-size:.6rem;color:var(--text3)">Grasas (30%)</div></div>'
    + '<div style="padding:10px;text-align:center;border-radius:var(--radius-xs);border-top:3px solid var(--success);background:var(--surface2)"><div style="font-size:1.2rem;font-weight:800;color:var(--success)">' + Math.round((getFinal - protG * 4 - getFinal * 0.30) / 4) + 'g</div><div style="font-size:.6rem;color:var(--text3)">HC (restante)</div></div></div>'
    + '<div style="padding:8px;background:var(--surface2);border-radius:var(--radius-xs);font-size:.72rem">'
    + '<strong>Cal No Prot / gN:</strong> ' + cnpn.ratio + ':1 — ' + cnpn.interpretation
    + '</div>';

  // Progresión UCI
  if (SN.uciMode) {
    var diaActual = parseInt($('snDiaActual') ? $('snDiaActual').value : 1);
    var prog = calcProgresionUCI(getFinal, diaActual);
    var elProg = $('snProgresion');
    if (elProg) elProg.innerHTML = '<div style="display:flex;gap:4px;flex-wrap:wrap">'
      + prog.map(function(d) {
        var isToday = d.actual;
        return '<div style="flex:1;min-width:70px;padding:8px;text-align:center;border-radius:var(--radius-xs);border:2px solid ' + (isToday ? 'var(--primary)' : 'var(--border)') + ';background:' + (isToday ? 'var(--primary-light)' : 'var(--surface)') + '">'
          + '<div style="font-size:.6rem;color:var(--text3)">Día ' + d.dia + '</div>'
          + '<div style="font-size:1rem;font-weight:800;color:' + (isToday ? 'var(--primary)' : 'var(--text)') + '">' + d.pct + '%</div>'
          + '<div style="font-size:.68rem;font-weight:600">' + d.kcal + ' kcal</div>'
          + '<div style="font-size:.5rem;color:var(--text3)">' + d.nota + '</div></div>';
      }).join('') + '</div>';
  }
}

// ============================================================
// TAB 3: PRESCRIPCIÓN (placeholder — Fase 2)
// ============================================================
// ============================================================
// TAB 3: PRESCRIPCION NUTRICIONAL (Fase 2)
// ============================================================

// --- Catalogo de formulas enterales comerciales ---
var FORMULAS_ENTERALES=[
{id:1,nombre:'Estandar isocalorica',tipo:'Polimerica',densidad:1.0,prot:40,hc:125,gr:35,fibra:0,osm:300,indicacion:'Paciente estable sin requerimientos especiales',ejemplo:'Isosource Standard / Osmolite'},
{id:2,nombre:'Estandar con fibra',tipo:'Polimerica',densidad:1.0,prot:40,hc:120,gr:35,fibra:15,osm:310,indicacion:'Prevencion diarrea/estrenimiento por NE prolongada',ejemplo:'Jevity / Isosource Fibra'},
{id:3,nombre:'Hipercalorica 1.5',tipo:'Polimerica',densidad:1.5,prot:60,hc:170,gr:58,fibra:0,osm:400,indicacion:'Restriccion hidrica o altos requerimientos caloricos',ejemplo:'Ensure Plus / Isosource 1.5'},
{id:4,nombre:'Hipercalorica 2.0',tipo:'Polimerica',densidad:2.0,prot:80,hc:200,gr:85,fibra:0,osm:500,indicacion:'Restriccion hidrica severa (ICC, renal)',ejemplo:'Nutrison Concentrated / TwoCal'},
{id:5,nombre:'Hiperproteica',tipo:'Polimerica',densidad:1.25,prot:63,hc:140,gr:42,fibra:0,osm:380,indicacion:'Pacientes criticos, postquirurgicos, sarcopenia',ejemplo:'Fresubin Protein Energy / Promote'},
{id:6,nombre:'Diabetica',tipo:'Especifica',densidad:1.0,prot:43,hc:95,gr:45,fibra:15,osm:300,indicacion:'DM tipo 1 y 2, hiperglucemia de estres',ejemplo:'Glucerna / Diben / Novasource Diabet'},
{id:7,nombre:'Renal sin dialisis',tipo:'Especifica',densidad:2.0,prot:35,hc:220,gr:95,fibra:0,osm:580,indicacion:'ERC pre-dialisis: baja proteina + alta densidad',ejemplo:'Nepro LP / Suplena'},
{id:8,nombre:'Renal con dialisis',tipo:'Especifica',densidad:1.8,prot:81,hc:160,gr:90,fibra:0,osm:520,indicacion:'ERC en HD/DP: alta proteina + restriccion K/P',ejemplo:'Nepro HP / Novasource Renal'},
{id:9,nombre:'Hepatica (AACR)',tipo:'Especifica',densidad:1.3,prot:40,hc:175,gr:45,fibra:0,osm:350,indicacion:'Cirrosis con encefalopatia o intolerancia proteica',ejemplo:'Hepatical / NutriHep'},
{id:10,nombre:'Pulmonar',tipo:'Especifica',densidad:1.5,prot:63,hc:106,gr:93,fibra:0,osm:390,indicacion:'EPOC, destete ventilador: alta grasa/baja HC',ejemplo:'Pulmocare / Oxepa'},
{id:11,nombre:'Inmunomoduladora',tipo:'Especifica',densidad:1.0,prot:56,hc:130,gr:28,fibra:3,osm:340,indicacion:'Pre-Qx oncologica, UCI (Arg+w3+nucleotidos)',ejemplo:'Impact / Supportan'},
{id:12,nombre:'Peptidica/Semi-elemental',tipo:'Semi-elemental',densidad:1.0,prot:40,hc:135,gr:17,fibra:0,osm:380,indicacion:'Malabsorcion, pancreatitis, fistulas, SIC',ejemplo:'Peptamen / Vital 1.0'},
{id:13,nombre:'Elemental',tipo:'Elemental',densidad:1.0,prot:38,hc:165,gr:12,fibra:0,osm:550,indicacion:'EII activa, alergia proteinas, QT severa',ejemplo:'Vivonex / EleCare'},
{id:14,nombre:'Oncologica hipercalorica',tipo:'Especifica',densidad:1.5,prot:68,hc:150,gr:67,fibra:3,osm:410,indicacion:'Cancer con caquexia + EPA/DHA',ejemplo:'Prosure / Forticare'},
{id:15,nombre:'Pediatrica estandar',tipo:'Pediatrica',densidad:1.0,prot:30,hc:135,gr:40,fibra:5,osm:290,indicacion:'Ninos 1-10 anos',ejemplo:'Pediasure / Nutrini'}
];

function calcOsmolaridadNP(aa_g,dex_g,lip_g,na_mEq,k_mEq,vol_ml){
var osm_total=aa_g*10+dex_g*5+na_mEq*2+k_mEq*2;
var osm_L=vol_ml>0?Math.round(osm_total/vol_ml*1000):0;
return{osmPorLitro:osm_L,alerta:osm_L>900,
alertaMsg:osm_L>900?'REQUIERE VIA VENOSA CENTRAL. No administrar por via periferica. [ESPEN PN]':osm_L>600?'Preferible via central. Vigilar sitio periferico c/4h.':'Compatible con via periferica.',
viaRequerida:osm_L>900?'CENTRAL':'PERIFERICA o CENTRAL',ref:'ESPEN PN Guidelines'};
}

function calcNPTotal(aa_g,dex_g,lip_g){
var kP=aa_g*4,kD=dex_g*3.4,kL=lip_g*10,kNP=kD+kL,kT=kNP+kP,nG=aa_g/6.25,r=nG>0?Math.round(kNP/nG):0;
return{kcalProteicas:Math.round(kP),kcalDextrosa:Math.round(kD),kcalLipidos:Math.round(kL),kcalNoProteicas:Math.round(kNP),kcalTotales:Math.round(kT),gramosN:Math.round(nG*10)/10,ratioCNP_gN:r,
interpretacion:r>150?'Hipocalorica relativa':r>=100?'Adecuada (estres metabolico)':r>=80?'Adecuada (critico)':'Sobrecarga nitrogenada'};
}

function renderSNPrescripcion(c,p,peso,altura){
var snRx=window._snRxTab||'enteral';
c.innerHTML='<div style="margin-bottom:14px"><div class="pill-tabs">'
+'<button class="pill-tab '+(snRx==='enteral'?'active':'')+'" onclick="window._snRxTab=\'enteral\';rSoporteNutricional()">Nutricion Enteral</button>'
+'<button class="pill-tab '+(snRx==='parenteral'?'active':'')+'" onclick="window._snRxTab=\'parenteral\';rSoporteNutricional()">Nutricion Parenteral</button>'
+'<button class="pill-tab '+(snRx==='mixta'?'active':'')+'" onclick="window._snRxTab=\'mixta\';rSoporteNutricional()">Mixta</button></div></div>'
+'<div id="snRxContent"></div>';
var rx=$('snRxContent');
if(snRx==='enteral')renderNEPrescripcion(rx,peso);
else if(snRx==='parenteral')renderNPPrescripcion(rx,peso);
else renderMixtaPrescripcion(rx,peso);
}

function renderNEPrescripcion(c,peso){
c.innerHTML='<div class="grid-23"><div>'
+'<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">Formula enteral</span><span class="badge badge-neutral">'+FORMULAS_ENTERALES.length+' formulas</span></div><div class="card-body">'
+'<div class="form-group"><label class="form-label">Seleccionar formula</label><select id="neFormula" onchange="updateNECalc()" style="font-size:.82rem">'
+FORMULAS_ENTERALES.map(function(f){return'<option value="'+f.id+'">'+f.nombre+' ('+f.densidad+' kcal/mL) - '+f.tipo+'</option>'}).join('')
+'</select></div><div id="neFormulaInfo"></div></div></div>'
+'<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">Programacion de infusion</span></div><div class="card-body">'
+'<div class="form-row"><div class="form-group"><label class="form-label">Modo</label><select id="neMode" onchange="updateNECalc()"><option value="velocidad">Por velocidad (mL/h)</option><option value="volumen">Por volumen total (mL)</option></select></div>'
+'<div class="form-group"><label class="form-label">Velocidad / Volumen</label><input type="number" id="neVelocidad" value="60" step="5" min="10" max="200" onchange="updateNECalc()"></div></div>'
+'<div class="form-row"><div class="form-group"><label class="form-label">Horas de infusion</label><input type="number" id="neHoras" value="20" min="1" max="24" onchange="updateNECalc()"></div>'
+'<div class="form-group"><label class="form-label">Pausa (h libres)</label><input type="number" id="nePausa" value="4" min="0" max="12" onchange="updateNECalc()"></div></div>'
+(SN.uciMode?'<div class="form-row"><div class="form-group"><label class="form-label">Via de acceso</label><select id="neVia"><option>Sonda nasogastrica (SNG)</option><option>Sonda nasoyeyunal (SNY)</option><option>Gastrostomia (PEG)</option><option>Yeyunostomia (PEJ)</option></select></div>'
+'<div class="form-group"><label class="form-label">Posicion cabecera</label><select id="neCabecera"><option>30-45 grados (estandar)</option><option>Semi-sentado (45+)</option><option>Prono (pausa NE)</option></select></div></div>':'')
+'</div></div></div><div>'
+'<div class="card" style="border:2px solid var(--primary)"><div class="card-header"><span class="card-title">Aporte calculado</span></div><div class="card-body" id="neResultado"></div></div></div></div>';
setTimeout(updateNECalc,50);
}

function updateNECalc(){
var fId=parseInt($('neFormula')?$('neFormula').value:1);
var f=FORMULAS_ENTERALES.find(function(x){return x.id===fId});if(!f)return;
var info=$('neFormulaInfo');
if(info)info.innerHTML='<div style="padding:10px;background:var(--surface2);border-radius:var(--radius-xs);margin-top:8px;font-size:.75rem">'
+'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px"><span class="badge badge-primary">'+f.densidad+' kcal/mL</span><span class="badge badge-neutral">'+f.tipo+'</span><span class="badge badge-neutral">Osm:'+f.osm+'</span></div>'
+'<div style="font-size:.7rem">P:<b>'+f.prot+'g</b>/L HC:<b>'+f.hc+'g</b>/L G:<b>'+f.gr+'g</b>/L'+(f.fibra?' Fi:<b>'+f.fibra+'g</b>/L':'')+'</div>'
+'<div style="font-size:.65rem;color:var(--text3);margin-top:4px">'+f.indicacion+'</div>'
+'<div style="font-size:.6rem;color:var(--text3)">Ej: '+f.ejemplo+'</div></div>';
var mode=$('neMode')?$('neMode').value:'velocidad';
var vel=parseFloat($('neVelocidad')?$('neVelocidad').value:60);
var horas=parseInt($('neHoras')?$('neHoras').value:20);
var volTotal=mode==='velocidad'?vel*horas:vel;
var velReal=mode==='velocidad'?vel:Math.round(vel/horas);
var kcal=Math.round(volTotal*f.densidad/1000*1000);
var prot=Math.round(volTotal*f.prot/1000*10)/10;
var hc=Math.round(volTotal*f.hc/1000*10)/10;
var gr=Math.round(volTotal*f.gr/1000*10)/10;
var agua=Math.round(volTotal*0.85);
var el=$('neResultado');
if(el)el.innerHTML='<div style="text-align:center;padding:14px;background:var(--primary-light);border-radius:var(--radius-sm);margin-bottom:12px">'
+'<div style="font-size:2rem;font-weight:900;color:var(--primary)">'+kcal+' <span style="font-size:.9rem;font-weight:400">kcal/dia</span></div>'
+'<div style="font-size:.72rem;color:var(--text3)">'+volTotal+' mL a '+velReal+' mL/h x '+horas+'h</div></div>'
+'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">'
+'<div style="text-align:center;padding:8px;background:var(--surface2);border-radius:var(--radius-xs);border-top:3px solid var(--accent)"><strong style="color:var(--accent)">'+prot+'g</strong><div style="font-size:.58rem;color:var(--text3)">Proteina</div></div>'
+'<div style="text-align:center;padding:8px;background:var(--surface2);border-radius:var(--radius-xs);border-top:3px solid var(--success)"><strong style="color:var(--success)">'+hc+'g</strong><div style="font-size:.58rem;color:var(--text3)">HC</div></div>'
+'<div style="text-align:center;padding:8px;background:var(--surface2);border-radius:var(--radius-xs);border-top:3px solid var(--warning)"><strong style="color:var(--warning)">'+gr+'g</strong><div style="font-size:.58rem;color:var(--text3)">Grasas</div></div>'
+'<div style="text-align:center;padding:8px;background:var(--surface2);border-radius:var(--radius-xs);border-top:3px solid var(--info)"><strong style="color:var(--info)">'+agua+'mL</strong><div style="font-size:.58rem;color:var(--text3)">Agua libre</div></div></div>'
+'<button class="btn btn-primary btn-sm" style="width:100%" onclick="toast(\'Prescripcion NE guardada\');showSaved()">Guardar prescripcion enteral</button>';
}

function renderNPPrescripcion(c,peso){
c.innerHTML='<div class="grid-23"><div>'
+'<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">Mezcla parenteral</span></div><div class="card-body">'
+'<div class="form-row"><div class="form-group"><label class="form-label">Aminoacidos (g)</label><input type="number" id="npAA" value="'+Math.round(1.3*peso)+'" step="1" onchange="updateNPCalc()"></div>'
+'<div class="form-group"><label class="form-label">Dextrosa (g)</label><input type="number" id="npDex" value="'+Math.round(3*peso)+'" step="5" onchange="updateNPCalc()"></div>'
+'<div class="form-group"><label class="form-label">Lipidos (g)</label><input type="number" id="npLip" value="'+Math.round(1*peso)+'" step="5" onchange="updateNPCalc()"></div></div>'
+'<div class="form-group"><label class="form-label">Tipo emulsion lipidica</label><select id="npLipTipo"><option>Soya (Intralipid)</option><option>MCT/LCT (Lipofundin)</option><option>Oliva (ClinOleic)</option><option>Oliva+Pescado (SMOFlipid) - recomendada UCI</option><option>Pescado puro (Omegaven) - hepatopatia</option></select></div>'
+'<div class="form-group"><label class="form-label">Volumen total (mL)</label><input type="number" id="npVol" value="2000" step="100" onchange="updateNPCalc()"></div>'
+'</div></div>'
+'<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">Electrolitos y micronutrientes</span></div><div class="card-body">'
+'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">'
+'<div class="form-group"><label class="form-label">Na (mEq)</label><input type="number" id="npNa" value="80" step="5" onchange="updateNPCalc()"></div>'
+'<div class="form-group"><label class="form-label">K (mEq)</label><input type="number" id="npK" value="60" step="5" onchange="updateNPCalc()"></div>'
+'<div class="form-group"><label class="form-label">Mg (mEq)</label><input type="number" id="npMg" value="12" step="1"></div>'
+'<div class="form-group"><label class="form-label">P (mmol)</label><input type="number" id="npP" value="15" step="1"></div>'
+'<div class="form-group"><label class="form-label">Ca (mEq)</label><input type="number" id="npCa" value="10" step="1"></div>'
+'<div class="form-group"><label class="form-label">Zn (mg)</label><input type="number" id="npZn" value="5" step="1"></div></div>'
+'<div class="form-row" style="margin-top:10px"><div class="form-group"><label class="form-label">Multivitaminas</label><select id="npMV"><option>1 amp/dia (Cernevit/MVI-12)</option><option>No incluir</option></select></div>'
+'<div class="form-group"><label class="form-label">Oligoelementos</label><select id="npOE"><option>1 amp/dia (Addamel/MTE-5)</option><option>No incluir</option></select></div></div>'
+'</div></div></div><div>'
+'<div class="card" style="border:2px solid var(--danger);margin-bottom:14px"><div class="card-header"><span class="card-title">Calculo NP</span></div><div class="card-body" id="npResultado"></div></div>'
+'<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">Osmolaridad</span></div><div class="card-body" id="npOsmResult"></div></div>'
+(SN.uciMode?'<div class="card"><div class="card-header"><span class="card-title">GIR</span><span class="badge badge-danger" style="font-size:.58rem">UCI</span></div><div class="card-body" id="npGIR"></div></div>':'')
+'</div></div>';
setTimeout(updateNPCalc,50);
  c.innerHTML+=renderBolsasNP();
}

function updateNPCalc(){
var aa=parseFloat($('npAA')?$('npAA').value:80);
var dex=parseFloat($('npDex')?$('npDex').value:200);
var lip=parseFloat($('npLip')?$('npLip').value:70);
var vol=parseInt($('npVol')?$('npVol').value:2000);
var na=parseInt($('npNa')?$('npNa').value:80);
var k=parseInt($('npK')?$('npK').value:60);
var calc=calcNPTotal(aa,dex,lip);
var osm=calcOsmolaridadNP(aa,dex,lip,na,k,vol);
var el=$('npResultado');
if(el)el.innerHTML='<div style="text-align:center;padding:14px;background:#fee2e2;border-radius:var(--radius-sm);margin-bottom:12px">'
+'<div style="font-size:2rem;font-weight:900;color:var(--danger)">'+calc.kcalTotales+' <span style="font-size:.9rem;font-weight:400">kcal totales</span></div>'
+'<div style="font-size:.72rem;color:var(--text2)">No proteicas: '+calc.kcalNoProteicas+' kcal | CNP/gN: <strong>'+calc.ratioCNP_gN+':1</strong> ('+calc.interpretacion+')</div></div>'
+'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px">'
+'<div style="text-align:center;padding:10px;background:var(--surface2);border-radius:var(--radius-xs)"><div style="font-size:.6rem;color:var(--text3)">Aminoacidos</div><strong>'+aa+'g</strong><div style="font-size:.6rem;color:var(--text3)">'+calc.kcalProteicas+' kcal</div></div>'
+'<div style="text-align:center;padding:10px;background:var(--surface2);border-radius:var(--radius-xs)"><div style="font-size:.6rem;color:var(--text3)">Dextrosa</div><strong>'+dex+'g</strong><div style="font-size:.6rem;color:var(--text3)">'+calc.kcalDextrosa+' kcal (3.4/g)</div></div>'
+'<div style="text-align:center;padding:10px;background:var(--surface2);border-radius:var(--radius-xs)"><div style="font-size:.6rem;color:var(--text3)">Lipidos</div><strong>'+lip+'g</strong><div style="font-size:.6rem;color:var(--text3)">'+calc.kcalLipidos+' kcal</div></div></div>'
+'<button class="btn btn-danger btn-sm" style="width:100%" onclick="toast(\'Prescripcion NP guardada\');showSaved()">Guardar prescripcion parenteral</button>';
var oe=$('npOsmResult');
if(oe){var color=osm.alerta?'var(--danger)':osm.osmPorLitro>600?'var(--warning)':'var(--success)';
oe.innerHTML='<div style="padding:12px;border-radius:var(--radius-xs);border:2px solid '+color+';background:'+color+'10">'
+'<div style="display:flex;justify-content:space-between;align-items:center"><strong style="font-size:1.1rem">'+osm.osmPorLitro+' mOsm/L</strong><span class="badge" style="background:'+color+';color:#fff">Via '+osm.viaRequerida+'</span></div>'
+'<div style="font-size:.72rem;margin-top:6px">'+osm.alertaMsg+'</div></div>'}
if(SN.uciMode){var antro=DB.antropometrias.filter(function(a){return a.pacienteId===selPat}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)})[0];
var pw=antro?antro.peso:70;var gir=Math.round((dex*1000)/(pw*1440)*100)/100;
var ge=$('npGIR');if(ge){var gc=gir>5?'var(--danger)':gir>4?'var(--warning)':'var(--success)';
ge.innerHTML='<div style="text-align:center;padding:12px"><div style="font-size:1.8rem;font-weight:900;color:'+gc+'">'+gir+'</div><div style="font-size:.72rem;color:var(--text3)">mg/kg/min</div>'
+'<div style="font-size:.68rem;margin-top:6px;color:'+gc+'">'+(gir>5?'GIR >5: riesgo hiperglucemia/esteatosis':gir>4?'GIR 4-5: monitorizar glucemia c/4-6h':'GIR <4: aceptable')+'</div></div>'}}
}

function renderMixtaPrescripcion(c,peso){
c.innerHTML='<div class="card"><div class="card-header"><span class="card-title">Nutricion mixta (NE + NP)</span></div><div class="card-body">'
+'<div class="alert alert-info" style="margin-bottom:14px"><strong>Indicacion:</strong> Cuando la via enteral no cubre >60% de los requerimientos en 3-5 dias, suplementar con NP. [ESPEN ICU Rec. 10]</div>'
+'<div class="form-row"><div class="form-group"><label class="form-label">% cubierto por NE</label><input type="number" id="mixNE" value="60" min="0" max="100" step="5" onchange="updateMixCalc()"></div>'
+'<div class="form-group"><label class="form-label">GET objetivo (kcal)</label><input type="number" id="mixGET" value="1800" step="50" onchange="updateMixCalc()"></div></div>'
+'<div id="mixResult"></div></div></div>';
setTimeout(updateMixCalc,50);
}

function updateMixCalc(){
var pctNE=parseInt($('mixNE')?$('mixNE').value:60);
var get=parseInt($('mixGET')?$('mixGET').value:1800);
var kcalNE=Math.round(get*pctNE/100);var kcalNP=get-kcalNE;
var el=$('mixResult');
if(el)el.innerHTML='<div style="display:flex;gap:10px;margin-top:12px">'
+'<div style="flex:1;padding:16px;text-align:center;background:var(--primary-light);border-radius:var(--radius-sm);border:2px solid var(--primary)">'
+'<div style="font-size:.68rem;color:var(--text3)">Nutricion Enteral</div>'
+'<div style="font-size:1.5rem;font-weight:900;color:var(--primary)">'+kcalNE+' kcal</div>'
+'<div style="font-size:.78rem;font-weight:700">'+pctNE+'%</div></div>'
+'<div style="flex:1;padding:16px;text-align:center;background:#fee2e2;border-radius:var(--radius-sm);border:2px solid var(--danger)">'
+'<div style="font-size:.68rem;color:var(--text3)">Nutricion Parenteral</div>'
+'<div style="font-size:1.5rem;font-weight:900;color:var(--danger)">'+kcalNP+' kcal</div>'
+'<div style="font-size:.78rem;font-weight:700">'+(100-pctNE)+'%</div></div></div>'
+'<div style="margin-top:12px;font-size:.72rem;color:var(--text3)"><strong>Meta:</strong> Progresar NE hasta 100% y retirar NP. Evaluar diariamente. [ESPEN ICU Rec. 10-12]</div>';
}

// ============================================================
// TAB 4: MONITORIZACIÓN (placeholder — Fase 3)
// ============================================================
// ============================================================
// TAB 4: MONITORIZACION DIARIA (Fase 3)
// ============================================================

// --- Datos de monitorización por paciente/día ---
if(!DB.snMonitor) DB.snMonitor={};
try{var _snm=JSON.parse(localStorage.getItem('veridia_db'));if(_snm&&_snm.snMonitor)DB.snMonitor=_snm.snMonitor}catch(e){console.warn('[Veridia]',e.message||e)}

function getSNDayKey(patId,fecha){return patId+'_'+(fecha||new Date().toISOString().slice(0,10))}

function getSNDayData(patId,fecha){
  var key=getSNDayKey(patId,fecha);
  if(!DB.snMonitor[key])DB.snMonitor[key]={fecha:fecha||new Date().toISOString().slice(0,10),
    glucemias:[],residuos:[],balance:{entradas:{ne:0,np:0,medicacion:0,otros:0},salidas:{orina:0,drenajes:0,sng:0,otros:0}},
    tolerancia:{vomito:false,distension:false,diarrea:false,bristol:4},
    electrolitos:{fosforo:null,potasio:null,magnesio:null},
    electrolitosAyer:{fosforo:null,potasio:null,magnesio:null},
    notas:''};
  return DB.snMonitor[key];
}

function renderSNMonitorizacion(c,p,peso){
  var today=_snFechaVer||new Date().toISOString().slice(0,10);
  var dayData=getSNDayData(selPat,today);

  c.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><span class="badge badge-primary">'+fD(today)+'</span>'
  +(SN.uciMode?'<span class="badge badge-danger">UCI - Turno actual</span>':'')
  +'<div style="display:flex;gap:6px"><button class="btn btn-outline btn-sm" onclick="snExportDayPDF()">PDF Prescripcion</button><button class="btn btn-primary btn-sm" onclick="snTransferirAlta()">Alta</button><button class="btn btn-primary btn-sm" onclick="snSaveDay()">Guardar registro</button></div></div>'

  +'<div class="grid-23"><div>'

  // --- CONTROL GLUCEMICO ---
  +'<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">🩸 Control glucemico</span>'
  +(SN.uciMode?'<span class="badge badge-danger" style="font-size:.55rem">c/4-6h</span>':'')
  +'</div><div class="card-body">'
  +'<div class="form-row"><div class="form-group"><label class="form-label">Glucemia (mg/dL)</label><input type="number" id="snGluc" placeholder="120" min="20" max="600"></div>'
  +'<div class="form-group"><label class="form-label">Hora</label><input type="time" id="snGlucH" value="'+new Date().toTimeString().slice(0,5)+'"></div>'
  +'<button class="btn btn-primary btn-sm" style="align-self:flex-end;margin-bottom:2px" onclick="snAddGlucemia()">+</button></div>'
  +'<div id="snGlucChart" style="margin-top:10px"></div>'
  +'<div id="snGlucList" style="margin-top:6px;font-size:.72rem"></div>'
  +'</div></div>'

  // --- TOLERANCIA GASTRICA ---
  +'<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">🫃 Tolerancia gastrica</span></div><div class="card-body">'
  +(SN.uciMode?'<div class="form-row"><div class="form-group"><label class="form-label">Residuo gastrico (mL)</label><input type="number" id="snResiduo" placeholder="0" min="0"></div>'
  +'<div class="form-group"><label class="form-label">Hora</label><input type="time" id="snResH" value="'+new Date().toTimeString().slice(0,5)+'"></div>'
  +'<button class="btn btn-outline btn-sm" style="align-self:flex-end;margin-bottom:2px" onclick="snAddResiduo()">+</button></div>'
  +'<div id="snResiduoList" style="margin-top:6px;font-size:.72rem"></div>':'')
  +'<div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">'
  +'<label style="display:flex;align-items:center;gap:4px;font-size:.78rem;cursor:pointer"><input type="checkbox" id="snVomito" '+(dayData.tolerancia.vomito?'checked':'')+'> Vomito</label>'
  +'<label style="display:flex;align-items:center;gap:4px;font-size:.78rem;cursor:pointer"><input type="checkbox" id="snDist" '+(dayData.tolerancia.distension?'checked':'')+'> Distension abdominal</label>'
  +'<label style="display:flex;align-items:center;gap:4px;font-size:.78rem;cursor:pointer"><input type="checkbox" id="snDiarrea" '+(dayData.tolerancia.diarrea?'checked':'')+'> Diarrea</label></div>'
  +'<div class="form-group" style="margin-top:8px"><label class="form-label">Escala Bristol (1-7)</label><select id="snBristol">'
  +'<option value="1" '+(dayData.tolerancia.bristol===1?'selected':'')+'>1 - Trozos duros separados</option>'
  +'<option value="2" '+(dayData.tolerancia.bristol===2?'selected':'')+'>2 - Forma salchicha con grumos</option>'
  +'<option value="3" '+(dayData.tolerancia.bristol===3?'selected':'')+'>3 - Salchicha con grietas</option>'
  +'<option value="4" '+(dayData.tolerancia.bristol===4?'selected':'')+'>4 - Suave y liso (normal)</option>'
  +'<option value="5" '+(dayData.tolerancia.bristol===5?'selected':'')+'>5 - Trozos blandos</option>'
  +'<option value="6" '+(dayData.tolerancia.bristol===6?'selected':'')+'>6 - Pastoso, bordes irregulares</option>'
  +'<option value="7" '+(dayData.tolerancia.bristol===7?'selected':'')+'>7 - Liquido, sin trozos</option></select></div>'
  +'</div></div>'

  +'</div><div>'

  // --- BALANCE HIDRICO ---
  +'<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">💧 Balance hidrico</span></div><div class="card-body">'
  +'<div style="font-size:.72rem;font-weight:700;color:var(--text3);margin-bottom:6px">ENTRADAS (mL)</div>'
  +'<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">'
  +'<div class="form-group"><label class="form-label">NE</label><input type="number" id="snBalNE" value="'+(dayData.balance.entradas.ne||0)+'" min="0" onchange="updateBalance()"></div>'
  +'<div class="form-group"><label class="form-label">NP</label><input type="number" id="snBalNP" value="'+(dayData.balance.entradas.np||0)+'" min="0" onchange="updateBalance()"></div>'
  +'<div class="form-group"><label class="form-label">Medicacion IV</label><input type="number" id="snBalMed" value="'+(dayData.balance.entradas.medicacion||0)+'" min="0" onchange="updateBalance()"></div>'
  +'<div class="form-group"><label class="form-label">Otros</label><input type="number" id="snBalOtrosE" value="'+(dayData.balance.entradas.otros||0)+'" min="0" onchange="updateBalance()"></div></div>'
  +'<div style="font-size:.72rem;font-weight:700;color:var(--text3);margin:10px 0 6px">SALIDAS (mL)</div>'
  +'<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">'
  +'<div class="form-group"><label class="form-label">Orina</label><input type="number" id="snBalOrina" value="'+(dayData.balance.salidas.orina||0)+'" min="0" onchange="updateBalance()"></div>'
  +'<div class="form-group"><label class="form-label">Drenajes</label><input type="number" id="snBalDren" value="'+(dayData.balance.salidas.drenajes||0)+'" min="0" onchange="updateBalance()"></div>'
  +'<div class="form-group"><label class="form-label">SNG/residuo</label><input type="number" id="snBalSNG" value="'+(dayData.balance.salidas.sng||0)+'" min="0" onchange="updateBalance()"></div>'
  +'<div class="form-group"><label class="form-label">Otros</label><input type="number" id="snBalOtrosS" value="'+(dayData.balance.salidas.otros||0)+'" min="0" onchange="updateBalance()"></div></div>'
  +'<div id="snBalResult" style="margin-top:10px"></div>'
  +'</div></div>'

  // --- ALERTA SINDROME REALIMENTACION ---
  +'<div class="card" style="margin-bottom:14px;border:2px solid var(--warning)"><div class="card-header"><span class="card-title">Sindrome de realimentacion</span></div><div class="card-body">'
  +'<p style="font-size:.72rem;color:var(--text3);margin-bottom:10px">Ingrese electrolitos de HOY y AYER. Si P, K o Mg caen >30%, se activa la alerta de bloqueo. [ESPEN ICU Rec. 14]</p>'
  +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">'
  +'<div></div><div style="text-align:center;font-size:.65rem;font-weight:700;color:var(--text3)">AYER</div><div style="text-align:center;font-size:.65rem;font-weight:700;color:var(--text3)">HOY</div>'
  +'<div style="font-size:.78rem;font-weight:600">Fosforo (mg/dL)</div><input type="number" id="snPAyer" value="" step="0.1" placeholder="3.5" onchange="checkReali()"><input type="number" id="snPHoy" value="" step="0.1" placeholder="2.8" onchange="checkReali()">'
  +'<div style="font-size:.78rem;font-weight:600">Potasio (mEq/L)</div><input type="number" id="snKAyer" value="" step="0.1" placeholder="4.2" onchange="checkReali()"><input type="number" id="snKHoy" value="" step="0.1" placeholder="3.5" onchange="checkReali()">'
  +'<div style="font-size:.78rem;font-weight:600">Magnesio (mg/dL)</div><input type="number" id="snMgAyer" value="" step="0.1" placeholder="2.0" onchange="checkReali()"><input type="number" id="snMgHoy" value="" step="0.1" placeholder="1.6" onchange="checkReali()"></div>'
  +'<div id="snRealiResult" style="margin-top:10px"></div>'
  +'</div></div>'

  // --- NOTAS ---
  +'<div class="card"><div class="card-header"><span class="card-title">Notas del turno</span></div><div class="card-body">'
  +'<textarea id="snNotas" rows="3" placeholder="Observaciones, cambios, incidencias..." style="width:100%;resize:vertical">'+sanitize(dayData.notas||'')+'</textarea>'
  +'</div></div>'

  +'</div></div>';

  // Render glucemias y residuos existentes
  setTimeout(function(){renderGlucemias(dayData);renderResiduos(dayData);updateBalance();checkReali()},50);
}

// --- Glucemias ---
function snAddGlucemia(){
  var val=parseInt($('snGluc')?$('snGluc').value:0);
  var hora=$('snGlucH')?$('snGlucH').value:new Date().toTimeString().slice(0,5);
  if(!val||val<20||val>600){toast('Glucemia no valida','error');return}
  var dayData=getSNDayData(selPat,new Date().toISOString().slice(0,10));
  dayData.glucemias.push({valor:val,hora:hora,ts:Date.now()});
  dayData.glucemias.sort(function(a,b){return a.hora.localeCompare(b.hora)});
  $('snGluc').value='';
  renderGlucemias(dayData);
  // Alerta hiperglucemia
  var highs=dayData.glucemias.filter(function(g){return g.valor>180});
  if(highs.length>=2) toast('Hiperglucemia persistente ('+highs.length+' valores >180 mg/dL). Evaluar infusion de insulina. [ESPEN ICU Rec. 13]','warning');
  showSaved();
}

function renderGlucemias(dayData){
  var chart=$('snGlucChart');var list=$('snGlucList');
  if(!chart||!list) return;
  if(!dayData.glucemias.length){chart.innerHTML='<div style="color:var(--text3);font-size:.72rem;text-align:center">Sin registros</div>';list.innerHTML='';return}

  // SVG line chart
  chart.innerHTML=svgLineChart({
    data:dayData.glucemias.map(function(g){return{label:g.hora.substring(0,5),value:g.valor}}),
    width:380,height:130,unit:' mg/dL',color:'var(--accent)',
    yMin:60,yMax:Math.max(200,Math.max.apply(null,dayData.glucemias.map(function(g){return g.valor}))+20)
  });

  // Reference lines info
  var avg=Math.round(dayData.glucemias.reduce(function(s,g){return s+g.valor},0)/dayData.glucemias.length);
  var highs=dayData.glucemias.filter(function(g){return g.valor>180}).length;
  var lows=dayData.glucemias.filter(function(g){return g.valor<70}).length;

  list.innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap">'
  +'<span class="badge badge-neutral">Promedio: '+avg+' mg/dL</span>'
  +'<span class="badge '+(highs>0?'badge-danger':'badge-success')+'">'+highs+' hiperglucemias (>180)</span>'
  +'<span class="badge '+(lows>0?'badge-warning':'badge-success')+'">'+lows+' hipoglucemias (<70)</span>'
  +'<span class="badge badge-neutral">'+dayData.glucemias.length+' mediciones</span></div>'
  +'<div style="margin-top:4px">'+dayData.glucemias.map(function(g,i){
    var color=g.valor>180?'var(--danger)':g.valor<70?'var(--warning)':'var(--text)';
    return '<span style="display:inline-block;padding:2px 6px;margin:2px;border-radius:4px;background:var(--surface2);font-size:.65rem"><strong style="color:'+color+'">'+g.valor+'</strong> <span style="color:var(--text3)">'+g.hora+'</span>'
    +'<span style="cursor:pointer;color:var(--danger);margin-left:4px" onclick="snRemoveGluc('+i+')">&times;</span></span>'
  }).join('')+'</div>';
}

function snRemoveGluc(idx){
  var dayData=getSNDayData(selPat,new Date().toISOString().slice(0,10));
  dayData.glucemias.splice(idx,1);
  renderGlucemias(dayData);showSaved();
}

// --- Residuos gastricos (UCI) ---
function snAddResiduo(){
  var val=parseInt($('snResiduo')?$('snResiduo').value:0);
  var hora=$('snResH')?$('snResH').value:new Date().toTimeString().slice(0,5);
  if(val===undefined||val===null){toast('Ingrese volumen','error');return}
  var dayData=getSNDayData(selPat,new Date().toISOString().slice(0,10));
  dayData.residuos.push({ml:val,hora:hora});
  dayData.residuos.sort(function(a,b){return a.hora.localeCompare(b.hora)});
  $('snResiduo').value='';
  renderResiduos(dayData);
  if(val>500) toast('Residuo gastrico >500mL. Evaluar pausar NE y procinéticos. [ESPEN ICU Rec. 9]','warning');
  else if(val>300) toast('Residuo 300-500mL. Monitorizar y considerar procineticos.','info');
  showSaved();
}

function renderResiduos(dayData){
  var el=$('snResiduoList');if(!el)return;
  if(!dayData.residuos.length){el.innerHTML='';return}
  el.innerHTML=dayData.residuos.map(function(r,i){
    var color=r.ml>500?'var(--danger)':r.ml>300?'var(--warning)':'var(--success)';
    return '<span style="display:inline-block;padding:2px 6px;margin:2px;border-radius:4px;background:var(--surface2);font-size:.65rem"><strong style="color:'+color+'">'+r.ml+'mL</strong> '+r.hora
    +'<span style="cursor:pointer;color:var(--danger);margin-left:4px" onclick="snRemoveRes('+i+')">&times;</span></span>'
  }).join('');
}

function snRemoveRes(idx){
  var dayData=getSNDayData(selPat,new Date().toISOString().slice(0,10));
  dayData.residuos.splice(idx,1);
  renderResiduos(dayData);showSaved();
}

// --- Balance hidrico ---
function updateBalance(){
  var ne=parseInt($('snBalNE')?$('snBalNE').value:0)||0;
  var np=parseInt($('snBalNP')?$('snBalNP').value:0)||0;
  var med=parseInt($('snBalMed')?$('snBalMed').value:0)||0;
  var otrosE=parseInt($('snBalOtrosE')?$('snBalOtrosE').value:0)||0;
  var orina=parseInt($('snBalOrina')?$('snBalOrina').value:0)||0;
  var dren=parseInt($('snBalDren')?$('snBalDren').value:0)||0;
  var sng=parseInt($('snBalSNG')?$('snBalSNG').value:0)||0;
  var otrosS=parseInt($('snBalOtrosS')?$('snBalOtrosS').value:0)||0;

  var totalE=ne+np+med+otrosE;
  var totalS=orina+dren+sng+otrosS;
  var balance=totalE-totalS;

  var el=$('snBalResult');if(!el)return;
  var color=Math.abs(balance)>1000?'var(--danger)':Math.abs(balance)>500?'var(--warning)':'var(--success)';

  el.innerHTML='<div style="display:flex;gap:8px;align-items:center;justify-content:center;padding:12px;background:var(--surface2);border-radius:var(--radius-sm)">'
  +'<div style="text-align:center"><div style="font-size:.65rem;color:var(--text3)">Entradas</div><div style="font-size:1.1rem;font-weight:800;color:var(--success)">'+totalE+'</div></div>'
  +'<div style="font-size:1.2rem;color:var(--text3)">-</div>'
  +'<div style="text-align:center"><div style="font-size:.65rem;color:var(--text3)">Salidas</div><div style="font-size:1.1rem;font-weight:800;color:var(--danger)">'+totalS+'</div></div>'
  +'<div style="font-size:1.2rem;color:var(--text3)">=</div>'
  +'<div style="text-align:center"><div style="font-size:.65rem;color:var(--text3)">Balance</div><div style="font-size:1.3rem;font-weight:900;color:'+color+'">'+(balance>=0?'+':'')+balance+' mL</div></div></div>'
  +(Math.abs(balance)>1000?'<div style="font-size:.72rem;color:var(--danger);margin-top:6px;text-align:center">Balance >1000mL. Evaluar ajuste de fluidos.</div>':'');
}

// --- Alerta sindrome realimentacion ---
function checkReali(){
  var pA=parseFloat($('snPAyer')?$('snPAyer').value:0)||0;
  var pH=parseFloat($('snPHoy')?$('snPHoy').value:0)||0;
  var kA=parseFloat($('snKAyer')?$('snKAyer').value:0)||0;
  var kH=parseFloat($('snKHoy')?$('snKHoy').value:0)||0;
  var mgA=parseFloat($('snMgAyer')?$('snMgAyer').value:0)||0;
  var mgH=parseFloat($('snMgHoy')?$('snMgHoy').value:0)||0;

  if(!pA&&!kA&&!mgA){var el=$('snRealiResult');if(el)el.innerHTML='<div style="font-size:.72rem;color:var(--text3)">Ingrese valores de ayer para evaluar</div>';return}

  var result=checkRealimentacion(
    {fosforo:pH,potasio:kH,magnesio:mgH},
    {fosforo:pA,potasio:kA,magnesio:mgA}
  );

  var el=$('snRealiResult');if(!el)return;

  if(result.bloquear){
    el.innerHTML='<div style="padding:14px;background:#dc2626;color:#fff;border-radius:var(--radius-sm);animation:fadeIn .3s">'
    +'<div style="font-size:1rem;font-weight:900;margin-bottom:6px">ALERTA CRITICA - SINDROME DE REALIMENTACION</div>'
    +'<div style="font-size:.82rem">'+result.action+'</div>'
    +'<div style="margin-top:8px;font-size:.72rem">'+result.alertas.map(function(a){return a.electrolito+': '+a.ayer+' → '+a.hoy+' (caida '+a.caida+')'}).join(' | ')+'</div></div>';
  } else if(result.alerta){
    el.innerHTML='<div style="padding:12px;background:#fef3c7;border:2px solid var(--warning);border-radius:var(--radius-sm)">'
    +'<div style="font-size:.85rem;font-weight:700;color:#92400e">Atencion - Descenso electrolitico</div>'
    +'<div style="font-size:.75rem;color:#92400e;margin-top:4px">'+result.action+'</div>'
    +'<div style="margin-top:6px;font-size:.68rem;color:var(--text3)">'+result.alertas.map(function(a){return a.electrolito+': '+a.ayer+' → '+a.hoy+' ('+a.caida+')'}).join(' | ')+'</div></div>';
  } else {
    el.innerHTML='<div style="padding:10px;background:var(--success-light,#dcfce7);border:1px solid var(--success);border-radius:var(--radius-sm);font-size:.78rem;color:#166534">'
    +'Sin signos de realimentacion. Continuar progresion calorica.</div>';
  }
}

// --- Guardar dia ---
function snSaveDay(){
  var dayData=getSNDayData(selPat,new Date().toISOString().slice(0,10));
  dayData.tolerancia={
    vomito:$('snVomito')?$('snVomito').checked:false,
    distension:$('snDist')?$('snDist').checked:false,
    diarrea:$('snDiarrea')?$('snDiarrea').checked:false,
    bristol:parseInt($('snBristol')?$('snBristol').value:4)
  };
  dayData.balance.entradas={ne:parseInt($('snBalNE')?$('snBalNE').value:0)||0,np:parseInt($('snBalNP')?$('snBalNP').value:0)||0,medicacion:parseInt($('snBalMed')?$('snBalMed').value:0)||0,otros:parseInt($('snBalOtrosE')?$('snBalOtrosE').value:0)||0};
  dayData.balance.salidas={orina:parseInt($('snBalOrina')?$('snBalOrina').value:0)||0,drenajes:parseInt($('snBalDren')?$('snBalDren').value:0)||0,sng:parseInt($('snBalSNG')?$('snBalSNG').value:0)||0,otros:parseInt($('snBalOtrosS')?$('snBalOtrosS').value:0)||0};
  dayData.notas=sanitize($('snNotas')?$('snNotas').value:'');
  dayData.electrolitos={fosforo:parseFloat($('snPHoy')?$('snPHoy').value:0)||null,potasio:parseFloat($('snKHoy')?$('snKHoy').value:0)||null,magnesio:parseFloat($('snMgHoy')?$('snMgHoy').value:0)||null};
  toast('Registro de monitorizacion guardado');showSaved();
}

// --- PDF Prescripcion UCI ---
function snExportDayPDF(){
  var p=gP(selPat);if(!p){toast('Seleccione paciente','error');return}
  var dayData=getSNDayData(selPat,new Date().toISOString().slice(0,10));
  var antro=DB.antropometrias.filter(function(a){return a.pacienteId===selPat}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)})[0];

  var w=window.open('','_blank','width=800,height=600');
  w.document.write('<!DOCTYPE html><html><head><title>Prescripcion Nutricional - '+p.nombre+'</title>'
  +'<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;font-size:11px;color:#333;padding:15mm;max-width:210mm;margin:0 auto}'
  +'h1{font-size:14px;color:#2E8B57;margin-bottom:4px}h2{font-size:12px;margin:12px 0 4px;padding-bottom:3px;border-bottom:2px solid #2E8B57;color:#2E8B57}'
  +'.header{display:flex;justify-content:space-between;border-bottom:3px solid #2E8B57;padding-bottom:12px;margin-bottom:14px}'
  +'table{width:100%;border-collapse:collapse;font-size:10px;margin:4px 0}th,td{padding:4px 6px;border:1px solid #ddd;text-align:left}th{background:#f0f7f4;font-weight:700}'
  +'.alert{padding:8px;background:#fef3c7;border-left:4px solid #f59e0b;margin:8px 0;font-size:10px}'
  +'.footer{margin-top:20px;padding-top:8px;border-top:2px solid #2E8B57;font-size:8px;color:#999}'
  +'@media print{body{padding:10mm}}</style></head><body>');

  w.document.write('<div class="header"><div><h1>Veridia HealthTech</h1><div style="font-size:9px;color:#888">Prescripcion de Soporte Nutricional'+(SN.uciMode?' - UCI':'')+'</div></div>'
  +'<div style="text-align:right"><div style="font-weight:700">'+sanitize(p.nombre)+' '+sanitize(p.apellidos)+'</div>'
  +'<div style="font-size:9px;color:#888">DNI: '+(p.dni||'-')+' | '+age(p.fechaNacimiento)+'a | '+(p.sexo||'')+' | '+(antro?antro.peso+'kg':'')+'</div>'
  +'<div style="font-size:9px;color:#888">Fecha: '+new Date().toLocaleDateString('es-ES')+'</div></div></div>');

  // Glucemias
  if(dayData.glucemias.length){
    w.document.write('<h2>Control glucemico</h2><table><tr><th>Hora</th><th>Glucemia (mg/dL)</th><th>Estado</th></tr>');
    dayData.glucemias.forEach(function(g){w.document.write('<tr><td>'+g.hora+'</td><td style="font-weight:700;color:'+(g.valor>180?'#dc2626':g.valor<70?'#d97706':'#333')+'">'+g.valor+'</td><td>'+(g.valor>180?'ALTA':g.valor<70?'BAJA':'Normal')+'</td></tr>')});
    w.document.write('</table>');
  }

  // Balance
  var bE=dayData.balance.entradas,bS=dayData.balance.salidas;
  var tE=(bE.ne||0)+(bE.np||0)+(bE.medicacion||0)+(bE.otros||0);
  var tS=(bS.orina||0)+(bS.drenajes||0)+(bS.sng||0)+(bS.otros||0);
  w.document.write('<h2>Balance hidrico</h2><table><tr><th>Entradas</th><th>mL</th><th>Salidas</th><th>mL</th></tr>'
  +'<tr><td>NE</td><td>'+(bE.ne||0)+'</td><td>Orina</td><td>'+(bS.orina||0)+'</td></tr>'
  +'<tr><td>NP</td><td>'+(bE.np||0)+'</td><td>Drenajes</td><td>'+(bS.drenajes||0)+'</td></tr>'
  +'<tr><td>Medicacion</td><td>'+(bE.medicacion||0)+'</td><td>SNG</td><td>'+(bS.sng||0)+'</td></tr>'
  +'<tr><td>Otros</td><td>'+(bE.otros||0)+'</td><td>Otros</td><td>'+(bS.otros||0)+'</td></tr>'
  +'<tr style="font-weight:700;border-top:2px solid #333"><td>TOTAL</td><td>'+tE+'</td><td>TOTAL</td><td>'+tS+'</td></tr>'
  +'<tr style="font-weight:700"><td colspan="3">BALANCE</td><td style="color:'+(Math.abs(tE-tS)>1000?'#dc2626':'#333')+'">'+(tE-tS>=0?'+':'')+(tE-tS)+' mL</td></tr></table>');

  // Notas
  if(dayData.notas) w.document.write('<h2>Notas</h2><p>'+dayData.notas+'</p>');

  w.document.write('<div class="alert">Este documento es una herramienta de apoyo a la decision clinica. No sustituye el juicio medico. Basado en guias ESPEN 2019-2025.</div>');
  w.document.write('<div class="footer"><span>Veridia HealthTech &copy; '+new Date().getFullYear()+' | Desarrollado por Andres Galeano</span><span>Profesional: '+(currentUser?currentUser.name:'-')+'</span></div>');
  w.document.write('<script>setTimeout(function(){window.print()},400)<\/script></body></html>');
  w.document.close();
}

// ============================================================
// MEJORAS SOPORTE NUTRICIONAL — 10 funcionalidades nuevas
// ============================================================

// ============================================================
// #1 HISTORIAL DE DIAS + #4 EVOLUCION MULTI-DIA
// ============================================================
var _snFechaVer=null;

function snCambiarFecha(delta){
  var d=_snFechaVer?new Date(_snFechaVer):new Date();
  d.setDate(d.getDate()+delta);
  _snFechaVer=d.toISOString().slice(0,10);
  rSoporteNutricional();
}

function snIrHoy(){_snFechaVer=null;rSoporteNutricional()}

function renderSNEvolucion7d(patId){
  var days=[];
  for(var i=6;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);days.push(d.toISOString().slice(0,10))}

  var glucData=[];var balData=[];var kcalData=[];
  days.forEach(function(fecha){
    var key=getSNDayKey(patId,fecha);
    var dd=DB.snMonitor[key];
    if(dd){
      var avgGluc=dd.glucemias&&dd.glucemias.length?Math.round(dd.glucemias.reduce(function(s,g){return s+g.valor},0)/dd.glucemias.length):0;
      glucData.push({label:fecha.slice(5),value:avgGluc});
      var bE=(dd.balance.entradas.ne||0)+(dd.balance.entradas.np||0)+(dd.balance.entradas.medicacion||0)+(dd.balance.entradas.otros||0);
      var bS=(dd.balance.salidas.orina||0)+(dd.balance.salidas.drenajes||0)+(dd.balance.salidas.sng||0)+(dd.balance.salidas.otros||0);
      balData.push({label:fecha.slice(5),value:bE-bS});
    } else {
      glucData.push({label:fecha.slice(5),value:0});
      balData.push({label:fecha.slice(5),value:0});
    }
  });

  var html='<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">Evolucion 7 dias</span></div><div class="card-body">';
  if(glucData.some(function(d){return d.value>0})){
    html+='<div style="display:flex;gap:14px;flex-wrap:wrap">'
    +svgLineChart({data:glucData.filter(function(d){return d.value>0}),width:350,height:120,unit:' mg/dL',color:'var(--accent)',title:'Glucemia promedio'})
    +svgBarChart({data:balData,width:350,height:120,unit:' mL',color:'var(--info)',title:'Balance hidrico'})
    +'</div>';
  } else {
    html+='<div style="color:var(--text3);font-size:.78rem;text-align:center;padding:20px">Sin datos suficientes para evolucion. Registre al menos 2 dias.</div>';
  }
  html+='</div></div>';
  return html;
}

// ============================================================
// #2 PROTOCOLO DE DESTETE NP -> NE -> ORAL
// ============================================================
var DESTETE_FASES=[
  {id:'np_total',nombre:'NP Total',desc:'100% via parenteral. Sin via enteral.',criterioAvance:'Tracto GI funcional, ruidos intestinales presentes, sin ileo.'},
  {id:'np_ne_trofica',nombre:'NP + NE trofica',desc:'NP 80-90% + NE trofica 10-20 mL/h.',criterioAvance:'Tolera NE trofica >24h sin residuo >300mL, sin vomito.'},
  {id:'np_ne_50',nombre:'NP 50% + NE 50%',desc:'Reducir NP a medida que NE avanza.',criterioAvance:'NE cubre >50% requerimientos sin intolerancia.'},
  {id:'ne_total',nombre:'NE Total',desc:'100% via enteral. Retirar NP.',criterioAvance:'NE cubre >80% requerimientos x48h. Glucemias estables.'},
  {id:'ne_oral',nombre:'NE + Oral progresivo',desc:'Iniciar via oral. Mantener NE complementaria.',criterioAvance:'Ingesta oral >60% requerimientos. Deglucion segura.'},
  {id:'oral_total',nombre:'Via oral exclusiva',desc:'Retirar NE. Dieta oral completa.',criterioAvance:'Ingesta >75% x72h. Sin disfagia. Plan al alta. [ESPEN ICU Rec. 15-17]'}
];

function renderProtocoloDestete(){
  var patData=SN.data[selPat]||{};
  var faseActual=patData.faseDestete||'np_total';
  var faseIdx=DESTETE_FASES.findIndex(function(f){return f.id===faseActual});

  var html='<div class="card" style="margin-bottom:14px;border-left:3px solid var(--accent)"><div class="card-header"><span class="card-title">Protocolo de destete</span><span class="badge badge-info" style="font-size:.58rem">ESPEN ICU</span></div><div class="card-body">';

  // Progress bar
  html+='<div style="display:flex;gap:2px;margin-bottom:14px">'+DESTETE_FASES.map(function(f,i){
    var estado=i<faseIdx?'done':i===faseIdx?'current':'pending';
    return '<div style="flex:1;height:6px;border-radius:3px;background:'+(estado==='done'?'var(--success)':estado==='current'?'var(--primary)':'var(--border)')+';transition:background .3s"></div>';
  }).join('')+'</div>';

  // Current phase
  var fase=DESTETE_FASES[faseIdx];
  html+='<div style="padding:14px;background:var(--primary-light);border-radius:var(--radius-sm);border:2px solid var(--primary);margin-bottom:12px">'
  +'<div style="display:flex;justify-content:space-between;align-items:center"><strong style="font-size:.88rem">Fase '+(faseIdx+1)+'/'+DESTETE_FASES.length+': '+fase.nombre+'</strong>'
  +'<span class="badge badge-primary">Actual</span></div>'
  +'<div style="font-size:.78rem;color:var(--text2);margin-top:4px">'+fase.desc+'</div>'
  +'<div style="font-size:.72rem;color:var(--success);margin-top:6px;font-weight:600">Criterio para avanzar: '+fase.criterioAvance+'</div></div>';

  // Navigation
  html+='<div style="display:flex;gap:8px;justify-content:center">'
  +(faseIdx>0?'<button class="btn btn-outline btn-sm" onclick="snDesteteRetroceder()">Retroceder fase</button>':'')
  +(faseIdx<DESTETE_FASES.length-1?'<button class="btn btn-primary btn-sm" onclick="snDesteteAvanzar()">Avanzar a siguiente fase</button>':'<span class="badge badge-success">Destete completado</span>')
  +'</div>';

  // All phases summary
  html+='<div style="margin-top:14px;font-size:.72rem">'+DESTETE_FASES.map(function(f,i){
    var ic=i<faseIdx?'✅':i===faseIdx?'🔵':'⚪';
    return '<div style="padding:4px 0;display:flex;gap:6px;align-items:center;opacity:'+(i<=faseIdx?'1':'.5')+'">'+ic+' <strong>'+f.nombre+'</strong> <span style="color:var(--text3)">'+f.desc.substring(0,50)+'</span></div>';
  }).join('')+'</div>';

  html+='</div></div>';
  return html;
}

function snDesteteAvanzar(){
  if(!SN.data[selPat])SN.data[selPat]={};
  var faseIdx=DESTETE_FASES.findIndex(function(f){return f.id===(SN.data[selPat].faseDestete||'np_total')});
  if(faseIdx<DESTETE_FASES.length-1){
    SN.data[selPat].faseDestete=DESTETE_FASES[faseIdx+1].id;
    toast('Destete avanzado a: '+DESTETE_FASES[faseIdx+1].nombre);showSaved();rSoporteNutricional();
  }
}

function snDesteteRetroceder(){
  if(!SN.data[selPat])SN.data[selPat]={};
  var faseIdx=DESTETE_FASES.findIndex(function(f){return f.id===(SN.data[selPat].faseDestete||'np_total')});
  if(faseIdx>0){
    SN.data[selPat].faseDestete=DESTETE_FASES[faseIdx-1].id;
    toast('Destete retrocedido a: '+DESTETE_FASES[faseIdx-1].nombre,'warning');showSaved();rSoporteNutricional();
  }
}

// ============================================================
// #3 BOLSAS TRICAMERALES NP PRE-MEZCLADAS
// ============================================================
var BOLSAS_NP=[
  {nombre:'Kabiven Central',vol:1540,aa:34,dex:97,lip:40,na:24,k:16,mg:4,ca:2,p:10,kcal:900,osm:1060,via:'Central',ejemplo:'Kabiven 1540mL'},
  {nombre:'Kabiven Periferico',vol:1440,aa:34,dex:97,lip:40,na:24,k:16,mg:4,ca:2,p:10,kcal:900,osm:750,via:'Periferica',ejemplo:'Kabiven Peripheral'},
  {nombre:'SmofKabiven Central',vol:1477,aa:50,dex:125,lip:38,na:30,k:24,mg:4,ca:2,p:12,kcal:1100,osm:1100,via:'Central',ejemplo:'SmofKabiven (omega-3)'},
  {nombre:'SmofKabiven Periferico',vol:1206,aa:40,dex:85,lip:30,na:24,k:20,mg:3,ca:2,p:10,kcal:800,osm:750,via:'Periferica',ejemplo:'SmofKabiven Periph'},
  {nombre:'Olimel N7',vol:1500,aa:60,dex:150,lip:40,na:0,k:0,mg:0,ca:0,p:0,kcal:1300,osm:1140,via:'Central',ejemplo:'Olimel N7 (alto proteina)'},
  {nombre:'Olimel N9',vol:1500,aa:80,dex:110,lip:40,na:0,k:0,mg:0,ca:0,p:0,kcal:1200,osm:1170,via:'Central',ejemplo:'Olimel N9 (muy alto prot)'},
  {nombre:'Numeta G13 (pediatrica)',vol:500,aa:11,dex:45,lip:10,na:8,k:6,mg:1,ca:3,p:4,kcal:310,osm:870,via:'Central',ejemplo:'Numeta G13% neonatal'},
  {nombre:'StructoKabiven',vol:1206,aa:45,dex:120,lip:38,na:24,k:16,mg:3,ca:2,p:10,kcal:1050,osm:1060,via:'Central',ejemplo:'StructoKabiven (MCT/LCT)'}
];

function renderBolsasNP(){
  return '<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">Bolsas tricamerales pre-mezcladas</span><span class="badge badge-neutral">'+BOLSAS_NP.length+' bolsas</span></div><div class="card-body" style="padding:0;overflow-x:auto">'
  +'<table><thead><tr><th>Bolsa</th><th>Vol</th><th>AA</th><th>Dex</th><th>Lip</th><th>kcal</th><th>Osm</th><th>Via</th><th></th></tr></thead><tbody>'
  +BOLSAS_NP.map(function(b){
    return '<tr><td><strong style="font-size:.78rem">'+b.nombre+'</strong><div style="font-size:.6rem;color:var(--text3)">'+b.ejemplo+'</div></td>'
    +'<td>'+b.vol+'mL</td><td>'+b.aa+'g</td><td>'+b.dex+'g</td><td>'+b.lip+'g</td>'
    +'<td style="font-weight:700">'+b.kcal+'</td>'
    +'<td><span class="badge '+(b.osm>900?'badge-danger':'badge-success')+'" style="font-size:.58rem">'+b.osm+'</span></td>'
    +'<td><span class="badge '+(b.via==='Central'?'badge-warning':'badge-success')+'" style="font-size:.58rem">'+b.via+'</span></td>'
    +'<td><button class="btn btn-ghost btn-xs" onclick="snUsarBolsa(\''+b.nombre+'\')" title="Usar esta bolsa">Usar</button></td></tr>';
  }).join('')
  +'</tbody></table></div></div>';
}

function snUsarBolsa(nombre){
  var b=BOLSAS_NP.find(function(x){return x.nombre===nombre});if(!b)return;
  // Fill NP fields
  if($('npAA'))$('npAA').value=b.aa;
  if($('npDex'))$('npDex').value=b.dex;
  if($('npLip'))$('npLip').value=b.lip;
  if($('npVol'))$('npVol').value=b.vol;
  if($('npNa'))$('npNa').value=b.na;
  if($('npK'))$('npK').value=b.k;
  if($('npMg'))$('npMg').value=b.mg;
  if($('npCa'))$('npCa').value=b.ca;
  if($('npP'))$('npP').value=b.p;
  toast('Bolsa '+b.nombre+' cargada ('+b.kcal+' kcal)');
  if(typeof updateNPCalc==='function')updateNPCalc();
}

// ============================================================
// #5 INTERACCIONES MEDICAMENTOSAS CON NUTRICION
// ============================================================
var SN_INTERACCIONES=[
  {med:'Propofol',efecto:'Aporte lipidico oculto (1.1 kcal/mL)',accion:'Descontar kcal de lipidos del aporte nutricional',sev:'alta',modulo:'metabolismo'},
  {med:'Corticoides (dexametasona, metilprednisolona)',efecto:'Hiperglucemia iatrogena. Catabolismo proteico.',accion:'Monitorizar glucemia c/4h. Aumentar proteinas a 1.5-2g/kg. Considerar insulina.',sev:'alta',modulo:'monitorizacion'},
  {med:'Vasopresores (noradrenalina >0.3 mcg/kg/min)',efecto:'Isquemia mesenterica. Riesgo de NE en dosis altas.',accion:'NE trofica (10-20mL/h) si vasopresores altos. No iniciar NE si en ascenso. [ESPEN ICU Rec. 7]',sev:'critica',modulo:'prescripcion'},
  {med:'Diureticos (furosemida, espironolactona)',efecto:'Deplecion de K, Mg, Na. Deshidratacion.',accion:'Monitorizar electrolitos diarios. Suplementar K/Mg segun perdidas. Ajustar balance hidrico.',sev:'alta',modulo:'monitorizacion'},
  {med:'Antibioticos de amplio espectro',efecto:'Diarrea por C. difficile. Disbiosis.',accion:'Considerar probioticos (si no inmunosuprimido). Escala Bristol. Evaluar formula con fibra.',sev:'media',modulo:'prescripcion'},
  {med:'Warfarina / Acenocumarol',efecto:'Interaccion con vitamina K de formulas enterales.',accion:'Usar formula con contenido fijo de VitK. No variar la formula sin ajustar INR.',sev:'alta',modulo:'prescripcion'},
  {med:'Fenitoina',efecto:'Absorcion reducida por NE. Unio a proteinas de la formula.',accion:'Pausar NE 2h antes y 2h despues de cada dosis. Monitorizar niveles.',sev:'alta',modulo:'prescripcion'},
  {med:'Ciprofloxacino',efecto:'Quelacion con Ca, Mg, Fe de la formula enteral.',accion:'Administrar 2h antes o 6h despues de la NE.',sev:'media',modulo:'prescripcion'},
  {med:'Metformina',efecto:'Diarrea, nauseas. Acidosis lactica si IR.',accion:'Suspender si TFG <30. Iniciar NE con formula diabetica.',sev:'media',modulo:'prescripcion'},
  {med:'Insulina IV en infusion',efecto:'Hipoglucemia si se pausa NE sin ajustar.',accion:'SIEMPRE reducir/pausar insulina al pausar NE. Dextrosa 10% de rescate.',sev:'critica',modulo:'monitorizacion'},
  {med:'Sedacion (midazolam, fentanilo)',efecto:'Ileo farmacologico. Gastroparesia.',accion:'NE postpilorica (SNY) si gastroparesia. Procineticos (metoclopramida, eritromicina).',sev:'media',modulo:'prescripcion'},
  {med:'Inmunosupresores (tacrolimus, ciclosporina)',efecto:'Nefrotoxicidad. Hiperglucemia. Hiperkaliemia.',accion:'Monitorizar K, Mg, glucemia. No dar probioticos. Ajustar proteinas si IR.',sev:'alta',modulo:'monitorizacion'}
];

function renderInteracciones(medicamentos){
  if(!medicamentos&&!SN.uciMode) return '';
  var html='<div class="card" style="margin-bottom:14px;border-left:3px solid var(--warning)"><div class="card-header"><span class="card-title">Interacciones farmaco-nutricion</span><span class="badge badge-warning" style="font-size:.58rem">'+SN_INTERACCIONES.length+' alertas</span></div><div class="card-body">';

  SN_INTERACCIONES.forEach(function(int){
    var color=int.sev==='critica'?'var(--danger)':int.sev==='alta'?'var(--warning)':'var(--text3)';
    html+='<div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:.75rem">'
    +'<div style="display:flex;justify-content:space-between;align-items:center"><strong style="color:'+color+'">'+int.med+'</strong>'
    +'<span class="badge '+(int.sev==='critica'?'badge-danger':int.sev==='alta'?'badge-warning':'badge-neutral')+'" style="font-size:.55rem">'+int.sev.toUpperCase()+'</span></div>'
    +'<div style="color:var(--text2);font-size:.7rem;margin-top:2px">Efecto: '+int.efecto+'</div>'
    +'<div style="color:var(--success);font-size:.68rem;margin-top:2px;font-weight:600">Accion: '+int.accion+'</div></div>';
  });

  html+='</div></div>';
  return html;
}

// ============================================================
// #6 PROTOCOLO DE PRONO
// ============================================================
function renderProtocoloProno(){
  if(!SN.uciMode) return '';
  var patData=SN.data[selPat]||{};
  var giros=patData.giros||[];

  return '<div class="card" style="margin-bottom:14px;border:2px solid var(--danger)"><div class="card-header"><span class="card-title">Protocolo Prono</span><span class="badge badge-danger" style="font-size:.58rem">UCI</span></div><div class="card-body">'
  +'<div class="alert alert-warning" style="margin-bottom:10px;font-size:.72rem"><strong>PAUSA NE obligatoria durante el giro.</strong> Aspirar SNG antes de girar. Reiniciar NE 1h post-prono a 50% velocidad.</div>'
  +'<div class="form-row"><div class="form-group"><label class="form-label">Registrar giro</label><div style="display:flex;gap:6px"><select id="snPronoTipo"><option>Supino -> Prono</option><option>Prono -> Supino</option></select><input type="time" id="snPronoH" value="'+new Date().toTimeString().slice(0,5)+'">'
  +'<button class="btn btn-danger btn-sm" onclick="snRegistrarGiro()">Registrar</button></div></div></div>'
  +(giros.length?'<div style="margin-top:8px;font-size:.72rem">'+giros.map(function(g,i){return '<span class="badge '+(g.tipo.includes('Prono')?'badge-danger':'badge-success')+'" style="font-size:.6rem;margin:2px">'+g.hora+' '+g.tipo+'</span>'}).join('')+'</div>':'')
  +'</div></div>';
}

function snRegistrarGiro(){
  if(!SN.data[selPat])SN.data[selPat]={};
  if(!SN.data[selPat].giros)SN.data[selPat].giros=[];
  var tipo=$('snPronoTipo')?$('snPronoTipo').value:'Prono';
  var hora=$('snPronoH')?$('snPronoH').value:new Date().toTimeString().slice(0,5);
  SN.data[selPat].giros.push({tipo:tipo,hora:hora,fecha:new Date().toISOString().slice(0,10)});
  toast((tipo.includes('Prono')?'PAUSA NE. ':'Reiniciar NE a 50%. ')+'Giro registrado: '+tipo+' a las '+hora);
  showSaved();rSoporteNutricional();
}

// ============================================================
// #7 TRANSFERENCIA AL ALTA -> DESARROLLADA
// ============================================================
function snTransferirAlta(){
  if(!selPat){toast('Seleccione paciente','error');return}
  var p=gP(selPat);if(!p)return;
  var antro=DB.antropometrias.filter(function(a){return a.pacienteId===selPat}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)})[0];

  // Pre-fill desarrollada with SN data
  toast('Preparando plan de alta para '+p.nombre+'...');
  selPat=p.id;
  navigate('desarrollada');
  setTimeout(function(){toast('Configure el plan ambulatorio basado en el soporte nutricional UCI. [ESPEN ICU Rec. 15-17]','info')},500);
}

// ============================================================
// #8 PROTOCOLO INSULINA YALE SIMPLIFICADO
// ============================================================
function calcInsulinaYale(glucemia,insulinaActual){
  // Yale Protocol simplified (Goldberg 2004)
  var dosis=insulinaActual||0;
  var cambio=0;

  if(glucemia>300){cambio=4;var msg='Bolo 4U + aumentar infusion 2U/h'}
  else if(glucemia>250){cambio=3;var msg='Bolo 3U + aumentar infusion 1.5U/h'}
  else if(glucemia>200){cambio=2;var msg='Aumentar infusion 1U/h'}
  else if(glucemia>180){cambio=1;var msg='Aumentar infusion 0.5U/h'}
  else if(glucemia>=120){cambio=0;var msg='Mantener infusion actual'}
  else if(glucemia>=80){cambio=-0.5;var msg='Reducir infusion 0.5U/h'}
  else if(glucemia>=60){cambio=-1;var msg='PAUSAR infusion. Dextrosa 10% 50mL. Re-check 30min.'}
  else{cambio=-999;var msg='HIPOGLUCEMIA CRITICA. Pausar insulina. Dextrosa 50% 25mL IV push. Glucemia c/15min.'}

  return{
    glucemia:glucemia,
    dosisActual:dosis,
    cambio:cambio,
    dosisSugerida:Math.max(0,dosis+(cambio===-999?-dosis:cambio)),
    accion:msg,
    target:'120-180 mg/dL (UCI) [ESPEN ICU Rec. 13]',
    ref:'Yale Protocol (Goldberg 2004)'
  };
}

function renderInsulinaYale(){
  if(!SN.uciMode) return '';
  return '<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">Protocolo Insulina</span><span class="badge badge-danger" style="font-size:.58rem">Yale simplificado</span></div><div class="card-body">'
  +'<div class="form-row"><div class="form-group"><label class="form-label">Glucemia actual (mg/dL)</label><input type="number" id="snInsGluc" placeholder="180" min="20" max="600"></div>'
  +'<div class="form-group"><label class="form-label">Insulina actual (U/h)</label><input type="number" id="snInsActual" value="2" step="0.5" min="0"></div>'
  +'<button class="btn btn-primary btn-sm" style="align-self:flex-end;margin-bottom:2px" onclick="calcInsUI()">Calcular</button></div>'
  +'<div id="snInsResult"></div></div></div>';
}

function calcInsUI(){
  var gluc=parseInt($('snInsGluc')?$('snInsGluc').value:0);
  var actual=parseFloat($('snInsActual')?$('snInsActual').value:0);
  if(!gluc){toast('Ingrese glucemia','error');return}
  var r=calcInsulinaYale(gluc,actual);
  var el=$('snInsResult');if(!el)return;
  var color=gluc>200?'var(--danger)':gluc<80?'var(--warning)':'var(--success)';
  el.innerHTML='<div style="padding:12px;border-radius:var(--radius-sm);border:2px solid '+color+';background:'+color+'10;margin-top:10px">'
  +'<div style="font-size:.88rem;font-weight:700;color:'+color+'">'+r.accion+'</div>'
  +'<div style="font-size:.78rem;margin-top:6px">Dosis sugerida: <strong>'+r.dosisSugerida+' U/h</strong> (actual: '+r.dosisActual+'U/h)</div>'
  +'<div style="font-size:.65rem;color:var(--text3);margin-top:4px">Target: '+r.target+' | '+r.ref+'</div></div>';
}

// ============================================================
// #9 VISTA MULTI-CAMA UCI
// ============================================================
function renderMultiCamaUCI(){
  if(!SN.uciMode) return '';
  var pacientesActivos=DB.patients.filter(function(p){return p.activo});
  if(pacientesActivos.length<2) return '';

  var html='<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">Vista Multi-Cama UCI</span><span class="badge badge-danger" style="font-size:.58rem">'+pacientesActivos.length+' pacientes</span></div>'
  +'<div class="card-body" style="padding:0;overflow-x:auto"><table><thead><tr><th>Paciente</th><th>Peso</th><th>NRS</th><th>Ultima Gluc</th><th>Balance</th><th>Fase destete</th><th></th></tr></thead><tbody>';

  pacientesActivos.forEach(function(p){
    var antro=DB.antropometrias.filter(function(a){return a.pacienteId===p.id}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)})[0];
    var key=getSNDayKey(p.id,new Date().toISOString().slice(0,10));
    var dd=DB.snMonitor[key];
    var lastGluc=dd&&dd.glucemias&&dd.glucemias.length?dd.glucemias[dd.glucemias.length-1]:null;
    var glColor=lastGluc?(lastGluc.valor>180?'var(--danger)':lastGluc.valor<70?'var(--warning)':'var(--success)'):'var(--text3)';
    var bal=0;
    if(dd){var bE=(dd.balance.entradas.ne||0)+(dd.balance.entradas.np||0)+(dd.balance.entradas.medicacion||0);var bS=(dd.balance.salidas.orina||0)+(dd.balance.salidas.drenajes||0)+(dd.balance.salidas.sng||0);bal=bE-bS}
    var patSN=SN.data[p.id]||{};
    var fase=patSN.faseDestete?DESTETE_FASES.find(function(f){return f.id===patSN.faseDestete}):null;
    var nrs=typeof calcNRS2002==='function'?calcNRS2002(p,antro||{imc:24},{}):{risk:'?'};

    html+='<tr style="cursor:pointer" onclick="selPat='+p.id+';SN.currentTab=\'tamizaje\';rSoporteNutricional()">'
    +'<td><strong>'+sanitize(p.nombre)+' '+sanitize(p.apellidos).charAt(0)+'.</strong></td>'
    +'<td>'+(antro?antro.peso+'kg':'?')+'</td>'
    +'<td><span class="badge '+(nrs.risk==='ALTO'?'badge-danger':nrs.risk==='MODERADO'?'badge-warning':'badge-success')+'" style="font-size:.58rem">'+nrs.risk+'</span></td>'
    +'<td style="color:'+glColor+';font-weight:700">'+(lastGluc?lastGluc.valor+' ('+lastGluc.hora+')':'---')+'</td>'
    +'<td style="font-weight:600;color:'+(Math.abs(bal)>1000?'var(--danger)':'var(--text)')+'">'+(bal>=0?'+':'')+bal+'mL</td>'
    +'<td>'+(fase?'<span class="badge badge-info" style="font-size:.55rem">'+fase.nombre+'</span>':'---')+'</td>'
    +'<td>'+IC.eye+'</td></tr>';
  });

  html+='</tbody></table></div></div>';
  return html;
}

// ============================================================
// #10 SCORE APACHE II CALCULADORA
// ============================================================
function renderAPACHEII(){
  if(!SN.uciMode) return '';
  return '<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">APACHE II Calculator</span><span class="badge badge-danger" style="font-size:.58rem">UCI</span></div><div class="card-body">'
  +'<p style="font-size:.72rem;color:var(--text3);margin-bottom:10px">Ingrese los PEORES valores de las primeras 24h de UCI.</p>'
  +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px">'
  +'<div class="form-group"><label class="form-label">Temperatura (C)</label><input type="number" id="apTemp" value="37" step="0.1" onchange="calcAPACHEui()"></div>'
  +'<div class="form-group"><label class="form-label">PAM (mmHg)</label><input type="number" id="apPAM" value="80" onchange="calcAPACHEui()"></div>'
  +'<div class="form-group"><label class="form-label">FC (lpm)</label><input type="number" id="apFC" value="85" onchange="calcAPACHEui()"></div>'
  +'<div class="form-group"><label class="form-label">FR (rpm)</label><input type="number" id="apFR" value="18" onchange="calcAPACHEui()"></div>'
  +'<div class="form-group"><label class="form-label">Na (mEq/L)</label><input type="number" id="apNa" value="140" onchange="calcAPACHEui()"></div>'
  +'<div class="form-group"><label class="form-label">K (mEq/L)</label><input type="number" id="apK" value="4" step="0.1" onchange="calcAPACHEui()"></div>'
  +'<div class="form-group"><label class="form-label">Creatinina</label><input type="number" id="apCr" value="1" step="0.1" onchange="calcAPACHEui()"></div>'
  +'<div class="form-group"><label class="form-label">Hto (%)</label><input type="number" id="apHto" value="40" onchange="calcAPACHEui()"></div>'
  +'<div class="form-group"><label class="form-label">Leucocitos (x10^3)</label><input type="number" id="apWBC" value="10" step="0.1" onchange="calcAPACHEui()"></div>'
  +'<div class="form-group"><label class="form-label">Glasgow (3-15)</label><input type="number" id="apGCS" value="15" min="3" max="15" onchange="calcAPACHEui()"></div>'
  +'<div class="form-group"><label class="form-label">pH arterial</label><input type="number" id="apPH" value="7.4" step="0.01" onchange="calcAPACHEui()"></div>'
  +'<div class="form-group"><label class="form-label">Edad (anos)</label><input type="number" id="apEdad" value="'+(gP(selPat)?age(gP(selPat).fechaNacimiento):50)+'" onchange="calcAPACHEui()"></div>'
  +'<div class="form-group"><label class="form-label">Enf. cronica</label><select id="apCronica" onchange="calcAPACHEui()"><option value="0">No</option><option value="2">Si, no quirurgico</option><option value="5">Si, quirurgico urgente</option></select></div></div>'
  +'<div id="apacheResult" style="margin-top:10px"></div></div></div>';
}

function calcAPACHEui(){
  // Simplified APACHE II (Knaus 1985) - APS + Age + Chronic
  var score=0;
  var t=parseFloat($('apTemp')?$('apTemp').value:37);
  if(t>=41||t<30)score+=4;else if(t>=39||t<32)score+=3;else if(t>=38.5||t<34)score+=1;

  var pam=parseInt($('apPAM')?$('apPAM').value:80);
  if(pam>=160||pam<50)score+=4;else if(pam>=130||pam<70)score+=2;

  var fc=parseInt($('apFC')?$('apFC').value:85);
  if(fc>=180||fc<40)score+=4;else if(fc>=140||fc<55)score+=3;else if(fc>=110||fc<70)score+=2;

  var fr=parseInt($('apFR')?$('apFR').value:18);
  if(fr>=50||fr<6)score+=4;else if(fr>=35)score+=3;else if(fr>=25||fr<10)score+=1;

  var na=parseInt($('apNa')?$('apNa').value:140);
  if(na>=180||na<111)score+=4;else if(na>=160||na<120)score+=3;else if(na>=155||na<130)score+=2;

  var k=parseFloat($('apK')?$('apK').value:4);
  if(k>=7||k<2.5)score+=4;else if(k>=6)score+=3;else if(k>=5.5||k<3)score+=1;

  var cr=parseFloat($('apCr')?$('apCr').value:1);
  if(cr>=3.5)score+=4;else if(cr>=2)score+=3;else if(cr>=1.5)score+=2;

  var hto=parseInt($('apHto')?$('apHto').value:40);
  if(hto>=60||hto<20)score+=4;else if(hto>=50||hto<30)score+=2;else if(hto>=46)score+=1;

  var wbc=parseFloat($('apWBC')?$('apWBC').value:10);
  if(wbc>=40||wbc<1)score+=4;else if(wbc>=20||wbc<3)score+=2;else if(wbc>=15)score+=1;

  var gcs=parseInt($('apGCS')?$('apGCS').value:15);
  score+=(15-gcs); // GCS points = 15 - GCS

  var ph=parseFloat($('apPH')?$('apPH').value:7.4);
  if(ph>=7.7||ph<7.15)score+=4;else if(ph>=7.6||ph<7.25)score+=3;else if(ph<7.33)score+=2;else if(ph>=7.5)score+=1;

  // Age
  var edad=parseInt($('apEdad')?$('apEdad').value:50);
  if(edad>=75)score+=6;else if(edad>=65)score+=5;else if(edad>=55)score+=3;else if(edad>=45)score+=2;

  // Chronic
  score+=parseInt($('apCronica')?$('apCronica').value:0);

  var mort=score<=4?'~4%':score<=9?'~8%':score<=14?'~15%':score<=19?'~25%':score<=24?'~40%':score<=29?'~55%':score<=34?'~73%':'>85%';

  var el=$('apacheResult');if(!el)return;
  var color=score>=20?'var(--danger)':score>=15?'var(--warning)':'var(--success)';
  el.innerHTML='<div style="padding:12px;border-radius:var(--radius-sm);border:2px solid '+color+';background:'+color+'10">'
  +'<div style="display:flex;justify-content:space-between;align-items:center"><strong style="font-size:1.2rem">APACHE II: '+score+' pts</strong><span class="badge" style="background:'+color+';color:#fff">Mortalidad estimada: '+mort+'</span></div>'
  +'<div style="font-size:.72rem;color:var(--text3);margin-top:6px">Knaus 1985 | APS(12 vars) + Edad + Enfermedad cronica</div></div>';

  // Auto-fill NUTRIC if available
  if($('snApache'))$('snApache').value=score;
}

// #61 Persistir prescripciones NE/NP
function snSavePrescripcion(tipo){
  if(!SN.data[selPat])SN.data[selPat]={};
  if(tipo==='enteral'){
    SN.data[selPat].prescripcionNE={
      formulaId:$('neFormula')?$('neFormula').value:'1',
      velocidad:$('neVelocidad')?$('neVelocidad').value:'60',
      horas:$('neHoras')?$('neHoras').value:'20',
      modo:$('neMode')?$('neMode').value:'velocidad',
      fecha:new Date().toISOString().slice(0,10)
    };
  } else if(tipo==='parenteral'){
    SN.data[selPat].prescripcionNP={
      aa:$('npAA')?$('npAA').value:'80',
      dex:$('npDex')?$('npDex').value:'200',
      lip:$('npLip')?$('npLip').value:'70',
      vol:$('npVol')?$('npVol').value:'2000',
      na:$('npNa')?$('npNa').value:'80',k:$('npK')?$('npK').value:'60',
      fecha:new Date().toISOString().slice(0,10)
    };
  }
  toast('Prescripcion '+tipo+' guardada');showSaved();
}

// #63 Catálogo de fórmulas editable
function openEditFormula(idx){
  var f=FORMULAS_ENTERALES[idx];if(!f)return;
  openModal('<div class="modal-header"><h3>Editar: '+f.nombre+'</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body">'
  +'<div class="form-row"><div class="form-group"><label class="form-label">Nombre</label><input id="efNom" value="'+f.nombre+'"></div>'
  +'<div class="form-group"><label class="form-label">Densidad (kcal/mL)</label><input type="number" id="efDens" value="'+f.densidad+'" step="0.1"></div></div>'
  +'<div class="form-row"><div class="form-group"><label class="form-label">Proteina g/L</label><input type="number" id="efProt" value="'+f.prot+'"></div>'
  +'<div class="form-group"><label class="form-label">HC g/L</label><input type="number" id="efHC" value="'+f.hc+'"></div>'
  +'<div class="form-group"><label class="form-label">Grasa g/L</label><input type="number" id="efGr" value="'+f.gr+'"></div></div>'
  +'<div class="form-row"><div class="form-group"><label class="form-label">Osm</label><input type="number" id="efOsm" value="'+f.osm+'"></div>'
  +'<div class="form-group"><label class="form-label">Ejemplo</label><input id="efEj" value="'+f.ejemplo+'"></div></div>'
  +'</div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="saveEditFormula('+idx+')">Guardar</button></div>');
}

function saveEditFormula(idx){
  var f=FORMULAS_ENTERALES[idx];if(!f)return;
  f.nombre=$('efNom').value.trim()||f.nombre;
  f.densidad=parseFloat($('efDens').value)||f.densidad;
  f.prot=parseFloat($('efProt').value)||f.prot;
  f.hc=parseFloat($('efHC').value)||f.hc;
  f.gr=parseFloat($('efGr').value)||f.gr;
  f.osm=parseInt($('efOsm').value)||f.osm;
  f.ejemplo=$('efEj').value.trim()||f.ejemplo;
  closeModal();toast('Formula actualizada');rSoporteNutricional();
}

// #64 Protocolo procinéticos
function suggestProkinetico(residuoMl){
  if(residuoMl<300) return null;
  return{
    farmaco:residuoMl>=500?'Eritromicina 250mg IV c/8h (3 dias max)':'Metoclopramida 10mg IV c/6-8h',
    dosis:residuoMl>=500?'250mg':'10mg',
    via:'IV',
    nota:residuoMl>=500?'Residuo >500mL: considerar SNY postpilorica + procinetico. [ESPEN ICU Rec. 9]':'Residuo 300-500mL: procinetico antes de pausar NE.',
    ref:'ESPEN ICU 2019 Rec. 9'
  };
}

// SN1: Print formatted NE/NP prescription
function snPrintPrescripcion(){
  var p=gP(selPat);if(!p){toast('Seleccione paciente','error');return}
  var data=DB.snMonitor||{};
  var dayKey=getSNDayKey();
  var day=getSNDayData(dayKey);
  var clinica='';try{clinica=localStorage.getItem('veridia_clinica')||'Clínica de Nutrición'}catch(e){console.warn('[Veridia]',e.message||e)}
  var prof=currentUser?currentUser.name:'';

  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Prescripción Nutricional</title>'
  +'<style>body{font-family:Arial,sans-serif;margin:30px;font-size:12px}h1{color:#2E8B57;font-size:16px;border-bottom:2px solid #2E8B57;padding-bottom:6px}'
  +'h2{font-size:13px;color:#333;margin-top:16px}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #ddd;padding:6px;text-align:left}'
  +'th{background:#f5f5f5}.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}'
  +'.sig{margin-top:40px;border-top:1px solid #333;width:200px;padding-top:6px;text-align:center}</style></head><body>'
  +'<div class="header"><div><h1>🏥 Prescripción Nutricional</h1><div>'+clinica+'</div></div><div style="text-align:right"><strong>Fecha:</strong> '+new Date().toLocaleDateString('es-ES')+'<br><strong>Paciente:</strong> '+sanitize(p.nombre)+' '+sanitize(p.apellidos)+'</div></div>'
  +'<h2>Datos del Paciente</h2><table><tr><td><strong>Nombre:</strong> '+sanitize(p.nombre)+' '+sanitize(p.apellidos)+'</td><td><strong>DNI:</strong> '+(p.dni||'')+'</td><td><strong>Edad:</strong> '+age(p.fechaNacimiento)+' años</td></tr></table>'
  +'<h2>Prescripción</h2><table><tr><th>Parámetro</th><th>Valor</th></tr>'
  +(day.neFormula?'<tr><td>Fórmula Enteral</td><td>'+day.neFormula+'</td></tr>':'')
  +(day.neVolumen?'<tr><td>Volumen</td><td>'+day.neVolumen+' mL/día</td></tr>':'')
  +(day.neVelocidad?'<tr><td>Velocidad infusión</td><td>'+day.neVelocidad+' mL/h</td></tr>':'')
  +(day.kcalTarget?'<tr><td>Objetivo calórico</td><td>'+day.kcalTarget+' kcal</td></tr>':'')
  +(day.protTarget?'<tr><td>Objetivo proteico</td><td>'+day.protTarget+' g</td></tr>':'')
  +'</table>'
  +'<h2>Observaciones</h2><p>'+(day.observaciones||'Sin observaciones adicionales.')+'</p>'
  +'<div class="sig"><strong>'+prof+'</strong><br>'+clinica+'</div>'
  +'<div style="margin-top:20px;font-size:9px;color:#999">Generado por Veridia HealthTech · '+new Date().toLocaleString('es-ES')+'</div>'
  +'</body></html>';
  var w=window.open('','_blank');if(w){w.document.write(html);w.document.close();w.print()}
  else toast('Permite popups para imprimir','error');
}

// SN2: UCI caloric progression chart (7 days)
function renderUCIProgressionChart(patId){
  var data=[];
  for(var i=6;i>=0;i--){
    var d=new Date(Date.now()-i*86400000).toISOString().slice(0,10);
    var day=getSNDayData(d);
    data.push({label:d.slice(5),value:day.kcalAportadas||0});
  }
  return svgBarChart({data:data,height:160,color:'var(--primary)',ylabel:'kcal',barWidth:35,title:'Progresión calórica 7 días'});
}

// ═══ 9.x GUÍAS POR PATOLOGÍA — SOPORTE NUTRICIONAL ═══
var SN_PATOLOGY_GUIDES={
  pancreatitis:{
    name:'Pancreatitis aguda',
    screening:'NRS-2002 o MUST al ingreso',
    energia:'25-30 kcal/kg/día (fase de recuperación)',
    proteina:'1.0-1.5 g/kg/día',
    via_preferente:'Enteral precoz (24-48h) si tolera. NE yeyunal si no tolera gástrica.',
    contraindicaciones_ne:'Íleo severo, fístula de alto débito no controlada',
    formula_ne:'Polimérica estándar. Oligomérica/semi-elemental si malabsorción.',
    np_indicacion:'Si NE no factible >5-7 días',
    micronutrientes:'Vigilar Zn, Se, vitaminas antioxidantes (C, E). Tiamina si alcoholismo.',
    monitoring:['Balance hídrico diario','Amilasa/lipasa','PCR cada 48-72h','Tolerancia NE (residuo gástrico)'],
    complications:['Íleo paralítico','Intolerancia gástrica (pasar a yeyunal)','Hiperglucemia (insulina IV)'],
    espen_ref:'ESPEN Pancreatitis 2020'
  },
  cancer:{
    name:'Cáncer (soporte nutricional)',
    screening:'NRS-2002 + criterios GLIM al diagnóstico y cada visita',
    energia:'25-30 kcal/kg/día',
    proteina:'1.2-2.0 g/kg/día (ajustar según función renal)',
    via_preferente:'Oral primero (ONS si ingesta <60%). NE si oral insuficiente. NP si tracto GI no funcional.',
    contraindicaciones_ne:'Obstrucción GI completa, carcinomatosis peritoneal extensa',
    formula_ne:'Polimérica con EPA+DHA ≥2g/día. Hiperprotéica.',
    np_indicacion:'Mucositis severa, íleo post-QT, tracto GI no funcional >7 días',
    micronutrientes:'Vitamina D, Zinc, Selenio, EPA+DHA ≥2g/día',
    monitoring:['Peso semanal','Ingesta calórica real (registro 3 días)','PCR/albúmina','Fuerza prensión (dinamometría)','Sarcopenia (BIA/TC L3)'],
    complications:['Caquexia tumoral (>5% pérdida peso en 6m)','Mucositis (adaptar textura)','Náuseas/vómitos (antieméticos + comidas frías pequeñas)','Diarrea por QT (adaptar fibra/FODMAP)'],
    espen_ref:'ESPEN Cancer 2021, ESPEN Surgical Oncology 2017'
  },
  quemado:{
    name:'Paciente quemado',
    screening:'Evaluación nutricional inmediata si SCQ >20%',
    energia:'25-30 kcal/kg/día (Harris-Benedict × factor quemadura 1.2-2.0)',
    proteina:'1.5-2.0 g/kg/día (hasta 3g/kg en quemaduras extensas)',
    via_preferente:'NE precoz (<6h si posible). Vía gástrica preferente.',
    contraindicaciones_ne:'Íleo, inestabilidad hemodinámica severa',
    formula_ne:'Alta proteína + arginina + glutamina + omega-3 (inmunomoduladora)',
    np_indicacion:'Si NE no cubre >60% requerimientos en 48-72h',
    micronutrientes:'Vitamina C 1-2g/día, Zinc 40mg/día, Selenio 400-800µg, Cobre, Vitamina A, Vitamina E',
    monitoring:['Balance nitrogenado semanal','Prealbúmina/PCR','Cicatrización','Glucemia (insulina IV si >180)','Peso (difícil por edema)'],
    complications:['Hipermetabolismo severo (REE 1.5-2× normal)','Hiperglucemia de estrés','Catabolismo proteico masivo','Déficit micronutrientes por exudado'],
    espen_ref:'ESPEN Burns 2013, ISBI Practice Guidelines'
  },
  cirugia:{
    name:'Cirugía mayor (perioperatorio)',
    screening:'NRS-2002 preoperatorio. Si riesgo: inmunonutrición 5-7 días pre-cirugía.',
    energia:'25-30 kcal/kg/día postoperatorio',
    proteina:'1.2-1.5 g/kg/día',
    via_preferente:'Oral precoz (6h post-cirugía GI). NE si oral insuficiente.',
    contraindicaciones_ne:'Fuga anastomótica confirmada, íleo prolongado',
    formula_ne:'Estándar polimérica. Inmunomoduladora (arginina+omega-3+nucleótidos) si cáncer GI.',
    np_indicacion:'Si NE no posible >7 días o ingesta <50% requerimientos',
    micronutrientes:'Hierro si anemia, Vitamina D, Zinc (cicatrización)',
    monitoring:['Tolerancia oral/enteral','Función intestinal (gases, deposición)','PCR/procalcitonina','Peso + albúmina semanal'],
    complications:['Íleo postoperatorio (procinéticos + movilización precoz)','Fuga anastomótica','Síndrome de realimentación (P, K, Mg)','Infección catéter NP'],
    espen_ref:'ESPEN Surgical 2017, ERAS Guidelines'
  },
  erc_dialisis:{
    name:'ERC en diálisis',
    screening:'MNA si >65a. Evaluación cada 6 meses.',
    energia:'25-35 kcal/kg peso ideal/día',
    proteina:'HD: 1.0-1.2 g/kg/día · DP: 1.2-1.5 g/kg/día (50% alto valor biológico)',
    via_preferente:'Oral. ONS intradiálisis si desnutrición.',
    contraindicaciones_ne:'Pocas. NE si oral insuficiente.',
    formula_ne:'Renal específica: baja en K, P, Na. Alta en proteína.',
    np_indicacion:'NP intradiálisis (NPID) si NE insuficiente',
    micronutrientes:'Vitamina D activa (calcitriol), Hierro IV, Ácido fólico, Vitaminas hidrosolubles (pérdida en HD), Zinc',
    monitoring:['Albúmina mensual','nPCR (ingesta proteica)','K, P, Ca séricos pre-diálisis','Peso seco','Kt/V (adecuación diálisis)'],
    complications:['Hiperkalemia (restricción K <2g/día)','Hiperfosfatemia (quelantes de P)','Sobrecarga hídrica (restricción líquidos)','Desnutrición proteico-energética (MIS score)'],
    espen_ref:'ESPEN Renal 2021, KDOQI Nutrition 2020'
  },
};

function renderSNPatologyGuide(patKey){
  var guide=SN_PATOLOGY_GUIDES[patKey];
  if(!guide) return '<div style="padding:20px;text-align:center;color:var(--text3)">Guía no disponible para esta patología</div>';
  
  return '<div style="display:grid;gap:14px">'
  // Screening
  +'<div style="padding:14px;background:var(--primary-light);border-radius:10px;border-left:4px solid var(--primary)"><div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:var(--primary);font-weight:700;margin-bottom:4px">Cribado</div><div style="font-size:.84rem">'+guide.screening+'</div></div>'
  // Energía + Proteína
  +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
  +'<div style="padding:14px;background:#f0fdf4;border-radius:10px;border-top:3px solid #16a34a;text-align:center"><div style="font-size:.68rem;text-transform:uppercase;color:#16a34a;font-weight:700">Energía</div><div style="font-size:1.1rem;font-weight:800;color:#16a34a;margin-top:4px">'+guide.energia+'</div></div>'
  +'<div style="padding:14px;background:var(--accent-light);border-radius:10px;border-top:3px solid var(--accent);text-align:center"><div style="font-size:.68rem;text-transform:uppercase;color:var(--accent);font-weight:700">Proteína</div><div style="font-size:1.1rem;font-weight:800;color:var(--accent);margin-top:4px">'+guide.proteina+'</div></div></div>'
  // Vía preferente
  +'<div style="padding:14px;background:var(--surface2);border-radius:10px"><div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:700;margin-bottom:4px">Vía preferente</div><div style="font-size:.84rem">'+guide.via_preferente+'</div></div>'
  // NE + NP
  +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
  +'<div style="padding:14px;border:1px solid var(--border);border-radius:10px"><div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:#2563eb;font-weight:700;margin-bottom:4px">Fórmula NE</div><div style="font-size:.82rem">'+guide.formula_ne+'</div><div style="font-size:.72rem;color:var(--text3);margin-top:6px"><strong>CI NE:</strong> '+guide.contraindicaciones_ne+'</div></div>'
  +'<div style="padding:14px;border:1px solid var(--border);border-radius:10px"><div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:#7c3aed;font-weight:700;margin-bottom:4px">Indicación NP</div><div style="font-size:.82rem">'+guide.np_indicacion+'</div></div></div>'
  // Micronutrientes
  +'<div style="padding:14px;background:#fffbeb;border-radius:10px;border-left:4px solid #ca8a04"><div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:#92400e;font-weight:700;margin-bottom:4px">Micronutrientes clave</div><div style="font-size:.82rem">'+guide.micronutrientes+'</div></div>'
  // Monitorización
  +'<div style="padding:14px;border:1px solid var(--border);border-radius:10px"><div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:700;margin-bottom:6px">Monitorización</div><ul style="font-size:.82rem;padding-left:18px;margin:0;color:var(--text2)">'+guide.monitoring.map(function(m){return '<li style="margin-bottom:3px">'+m+'</li>'}).join('')+'</ul></div>'
  // Complicaciones
  +'<div style="padding:14px;background:#fef2f2;border-radius:10px;border-left:4px solid #dc2626"><div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:#dc2626;font-weight:700;margin-bottom:6px">Complicaciones a vigilar</div><ul style="font-size:.82rem;padding-left:18px;margin:0;color:#991b1b">'+guide.complications.map(function(c){return '<li style="margin-bottom:3px">'+c+'</li>'}).join('')+'</ul></div>'
  // Referencia
  +'<div style="text-align:right;font-size:.68rem;color:var(--text3)">📖 '+guide.espen_ref+'</div>'
  +'</div>';
}

function showSNPatologySelector(){
  var keys=Object.keys(SN_PATOLOGY_GUIDES);
  var html='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-bottom:16px">';
  keys.forEach(function(k){
    var g=SN_PATOLOGY_GUIDES[k];
    html+='<div style="padding:14px;border:2px solid var(--border);border-radius:10px;cursor:pointer;transition:all .2s;text-align:center" onclick="document.getElementById(\'snGuideContent\').innerHTML=renderSNPatologyGuide(\''+k+'\');this.parentElement.querySelectorAll(\'div\').forEach(function(d){d.style.borderColor=\'var(--border)\'});this.style.borderColor=\'var(--primary)\'" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'none\'">'
    +'<div style="font-size:1.2rem;margin-bottom:4px">'+(k==='cancer'?'🎗️':k==='pancreatitis'?'🫁':k==='quemado'?'🔥':k==='cirugia'?'🏥':k==='erc_dialisis'?'🫘':'📋')+'</div>'
    +'<strong style="font-size:.82rem">'+g.name+'</strong></div>';
  });
  html+='</div><div id="snGuideContent" style="min-height:100px"><div style="text-align:center;padding:30px;color:var(--text3);font-size:.85rem">Seleccione una patología para ver la guía ESPEN</div></div>';
  return html;
}
