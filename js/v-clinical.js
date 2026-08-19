// ═══════════════════════════════════════════════════════
// VERIDIA HEALTHTECH — v-clinical.js
// Clinical formulas, screening tools, MET, IG, PRAL,
// MUST, SNAQ, NRS-2002, PREDIMED, balance nitrogenado
// ═══════════════════════════════════════════════════════

// G1.1: Schofield (WHO/FAO)
function formulaSchofield(peso, sexo, edad) {
  var m = (sexo || '').toUpperCase() === 'MASCULINO' || (sexo || '').toUpperCase() === 'M';
  if (edad < 3) return m ? 59.512 * peso - 30.4 : 58.317 * peso - 31.1;
  if (edad < 10) return m ? 22.706 * peso + 504.3 : 20.315 * peso + 485.9;
  if (edad < 18) return m ? 17.686 * peso + 658.2 : 13.384 * peso + 692.6;
  if (edad < 30) return m ? 15.057 * peso + 692.2 : 14.818 * peso + 486.6;
  if (edad < 60) return m ? 11.472 * peso + 873.1 : 8.126 * peso + 845.6;
  return m ? 11.711 * peso + 587.7 : 9.082 * peso + 658.5;
}

// G1.2: Henry/Oxford (2005)
function formulaHenry(peso, sexo, edad) {
  var m = (sexo || '').toUpperCase() === 'MASCULINO' || (sexo || '').toUpperCase() === 'M';
  if (edad < 3) return m ? 61.0 * peso - 33.7 : 58.9 * peso - 23.1;
  if (edad < 10) return m ? 23.3 * peso + 514 : 20.1 * peso + 507;
  if (edad < 18) return m ? 18.4 * peso + 581 : 11.1 * peso + 761;
  if (edad < 30) return m ? 16.0 * peso + 545 : 13.1 * peso + 558;
  if (edad < 60) return m ? 14.2 * peso + 593 : 9.74 * peso + 694;
  return m ? 13.5 * peso + 514 : 10.1 * peso + 569;
}

// G1.3-G1.5: ICU formulas
function formulaCunninghamFFM(ffm_kg) { return 500 + 22 * (ffm_kg || 50) }
function formulaPennState(mifflinGEB, tmax, ve) { return 0.85 * (mifflinGEB || 1500) + 33 * (tmax || 37) + 175 * (ve || 8) - 6433 }
function formulaIretonJones(peso, edad, sexo, trauma, quemado) { var m = (sexo || '').toUpperCase() === 'MASCULINO' || (sexo || '').toUpperCase() === 'M' ? 1 : 0; return 1784 - 11 * edad + 5 * peso + 244 * m + 239 * (trauma ? 1 : 0) + 804 * (quemado ? 1 : 0) }

// G1.6: Calorimetría Weir
function calcCalorimetriaWeir(vo2, vco2) {
  var ee = (3.941 * (vo2 || 250) + 1.106 * (vco2 || 200)) * 1.44;
  var rq = (vco2 || 200) / (vo2 || 250);
  var substrate = rq < 0.7 ? 'Cetogénesis/ayuno' : rq < 0.85 ? 'Oxidación lipídica predominante' : rq < 0.95 ? 'Dieta mixta equilibrada' : rq <= 1.0 ? 'Oxidación glucídica predominante' : 'Lipogénesis (sobrealimentación)';
  return { ee: Math.round(ee), rq: Math.round(rq * 100) / 100, substrate: substrate };
}

// G1.7: MET
var MET_ACTIVITIES = [
  {name:'Dormir',met:0.9},{name:'Sentado tranquilo',met:1.0},{name:'Trabajo de oficina',met:1.5},
  {name:'Caminar lento (3 km/h)',met:2.5},{name:'Caminar moderado (5 km/h)',met:3.5},{name:'Caminar rápido (6.5 km/h)',met:5.0},
  {name:'Ciclismo suave',met:4.0},{name:'Ciclismo moderado',met:6.5},{name:'Natación moderada',met:6.0},{name:'Natación vigorosa',met:9.8},
  {name:'Yoga / Pilates',met:3.0},{name:'Musculación moderada',met:5.0},{name:'Musculación intensa',met:6.0},
  {name:'Running (8 km/h)',met:8.0},{name:'Running (10 km/h)',met:10.0},{name:'Running (12 km/h)',met:12.5},
  {name:'CrossFit / HIIT',met:8.0},{name:'Fútbol',met:7.0},{name:'Tenis',met:7.3},{name:'Baloncesto',met:6.5},
  {name:'Tareas domésticas',met:3.5},{name:'Jardinería',met:4.0},{name:'Subir escaleras',met:8.0},{name:'Bailar',met:5.5},{name:'Sexo',met:5.8}
];
function calcMETGasto(peso_kg, met, duracion_min) { return Math.round(met * peso_kg * (duracion_min / 60)) }

// G1.8-G1.10: Hidrico, Pesos, Ajustado
function reqHidrico(peso) { if (peso <= 0) return 0; if (peso <= 10) return peso * 100; if (peso <= 20) return 1000 + (peso - 10) * 50; return 1500 + (peso - 20) * 20 }
function pesosIdeales(altura_cm, sexo) {
  var m = (sexo || '').toUpperCase() === 'MASCULINO' || (sexo || '').toUpperCase() === 'M';
  var over60 = Math.max(0, altura_cm / 2.54 - 60);
  return { hamwi: m ? 48 + 2.7 * over60 : 45.5 + 2.2 * over60, devine: m ? 50 + 2.3 * over60 : 45.5 + 2.3 * over60, robinson: m ? 52 + 1.9 * over60 : 49 + 1.7 * over60, miller: m ? 56.2 + 1.41 * over60 : 53.1 + 1.36 * over60, imc22: 22 * Math.pow(altura_cm / 100, 2) };
}
function pesoAjustado(pesoReal, pesoIdeal, factor) { return pesoIdeal + (factor || 0.25) * (pesoReal - pesoIdeal) }

// G2.1: Plan micros
function calcPlanMicros(planComidas) {
  var t = { ca: 0, fe: 0, na: 0, K: 0, vc: 0, vd: 0, fi: 0 }; if (!planComidas) return t;
  Object.values(planComidas).forEach(function(c) { if (!c || !c.alimentos) return; c.alimentos.forEach(function(a) { var f = (a.gramos || a.cantidad || 100) / 100; t.ca += (a.ca || 0) * f; t.fe += (a.fe || 0) * f; t.na += (a.na || 0) * f; t.K += (a.K || 0) * f; t.vc += (a.vc || 0) * f; t.vd += (a.vd || 0) * f; t.fi += (a.fi || 0) * f }) });
  Object.keys(t).forEach(function(k) { t[k] = Math.round(t[k] * 10) / 10 }); return t;
}

// G2.2-G2.3: IG
var IG_REFERENCE = { 'arroz blanco':73,'arroz integral':68,'pan blanco':75,'pan integral':74,'pasta':49,'avena':55,'patata cocida':78,'boniato':63,'plátano':51,'manzana':36,'naranja':43,'uva':59,'sandía':76,'piña':59,'mango':51,'fresa':40,'leche entera':39,'yogur natural':36,'miel':61,'azúcar':65,'chocolate negro':40,'chocolate con leche':49,'lentejas':32,'garbanzos':28,'judías blancas':31,'zanahoria':39,'maíz':52,'quinoa':53,'cuscús':65 };
function getIG(foodName) { if (!foodName) return null; var lower = foodName.toLowerCase(); for (var key in IG_REFERENCE) { if (lower.includes(key)) return IG_REFERENCE[key] } return null }
function calcCargaGlucemica(ig, hcGrams, porcion_g) { if (!ig || !hcGrams) return null; return Math.round(ig * hcGrams * (porcion_g || 100) / 100 / 100) }

// G2.5: PRAL
function calcPRAL(protGrams, pGrams, kGrams, mgGrams, caGrams) { return 0.49 * (protGrams || 0) + 0.037 * (pGrams || 0) - 0.021 * (kGrams || 0) - 0.026 * (mgGrams || 0) - 0.013 * (caGrams || 0) }

// H2.2: MUST
function calcMUST(imc, perdidaPeso3m_pct, enfermoAgudo) {
  var score = 0; if (imc <= 20) score += imc >= 18.5 ? 1 : 2; if (perdidaPeso3m_pct >= 10) score += 2; else if (perdidaPeso3m_pct >= 5) score += 1; if (enfermoAgudo) score += 2;
  var risk = score === 0 ? 'Bajo' : score === 1 ? 'Medio' : 'Alto'; var color = score === 0 ? '#22c55e' : score === 1 ? '#f59e0b' : '#dc2626';
  var plan = score === 0 ? 'Repetir screening semanal (hospital) o mensual (comunidad)' : score === 1 ? 'Observar: documentar ingesta dietética 3 días, repetir screening semanalmente' : 'Tratar: derivar a dietista, mejorar ingesta, monitorizar plan nutricional';
  return { score: score, risk: risk, color: color, plan: plan };
}

// H2.3: NRS-2002 Simple
function calcNRS2002Simple(imc, perdidaPeso_pct, ingesta_pct, severidadEnf) {
  var nutScore = 0; if (perdidaPeso_pct >= 5 || ingesta_pct < 75) nutScore = 1; if (perdidaPeso_pct >= 5 || imc < 20.5 || ingesta_pct < 60) nutScore = 2; if (imc < 18.5 || perdidaPeso_pct >= 10 || ingesta_pct < 25) nutScore = 3;
  var total = nutScore + (severidadEnf || 0); var risk = total < 3 ? 'Bajo' : 'Alto (iniciar soporte nutricional)'; var color = total < 3 ? '#22c55e' : '#dc2626';
  return { nutScore: nutScore, diseaseScore: severidadEnf || 0, total: total, risk: risk, color: color };
}

// H2.4: SNAQ
function calcSNAQ(perdioPeso, perdidaApetito, usaSuplementos) {
  var score = (perdioPeso ? 1 : 0) + (perdidaApetito ? 1 : 0) + (usaSuplementos ? 1 : 0);
  return { score: score, risk: score <= 1 ? 'Bajo' : score === 2 ? 'Moderado' : 'Severo', color: score <= 1 ? '#22c55e' : score === 2 ? '#f59e0b' : '#dc2626' };
}

// G2.7: PREDIMED-14
var PREDIMED_QUESTIONS = [
  {q:'¿Usa aceite de oliva como principal grasa para cocinar?',si:1},{q:'¿Cuánto aceite de oliva consume al día? (≥4 cucharadas)',si:1},{q:'¿Cuántas raciones de verduras/hortalizas consume al día? (≥2, al menos 1 en ensalada)',si:1},{q:'¿Cuántas piezas de fruta consume al día? (≥3)',si:1},{q:'¿Cuántas raciones de carne roja o embutidos consume al día? (<1)',si:1},{q:'¿Cuántas raciones de mantequilla/margarina/nata consume al día? (<1)',si:1},{q:'¿Cuántas bebidas azucaradas consume al día? (<1)',si:1},{q:'¿Cuántas copas de vino consume a la semana? (≥7)',si:1},{q:'¿Cuántas raciones de legumbres consume a la semana? (≥3)',si:1},{q:'¿Cuántas raciones de pescado/marisco consume a la semana? (≥3)',si:1},{q:'¿Cuántas veces consume repostería comercial a la semana? (<3)',si:1},{q:'¿Cuántas raciones de frutos secos consume a la semana? (≥3)',si:1},{q:'¿Consume preferentemente pollo, pavo o conejo en vez de ternera, cerdo, hamburguesa o salchicha?',si:1},{q:'¿Consume verduras, pasta, arroz u otros platos con sofrito (tomate, ajo, cebolla, puerro con aceite de oliva) ≥2/semana?',si:1}
];
function scorePREDIMED(answers) { var score = 0; for (var i = 0; i < Math.min(answers.length, 14); i++) if (answers[i]) score++; var adherence = score <= 5 ? 'Baja' : score <= 9 ? 'Media' : 'Alta'; return { score: score, max: 14, adherence: adherence, color: score <= 5 ? '#dc2626' : score <= 9 ? '#f59e0b' : '#22c55e' } }

// I1.10: Balance nitrogenado
function calcBalanceNitrogenado(protIngesta_g, nUrinario24h_g, perdInsensibles) {
  var nIn = (protIngesta_g || 0) / 6.25; var nOut = (nUrinario24h_g || 0) + (perdInsensibles || 3); var balance = nIn - nOut;
  return { nIn: Math.round(nIn * 10) / 10, nOut: Math.round(nOut * 10) / 10, balance: Math.round(balance * 10) / 10, status: balance >= 0 ? 'Positivo (anabolismo)' : balance > -4 ? 'Levemente negativo' : 'Negativo (catabolismo)', color: balance >= 0 ? '#22c55e' : balance > -4 ? '#f59e0b' : '#dc2626' };
}

// H1.2: Síndrome metabólico ATP-III
function evalSindromeMetabolico(cintura, tg, hdl, presion_s, presion_d, glucosa, sexo) {
  var criteria = []; var m = (sexo || '').toUpperCase() === 'MASCULINO' || (sexo || '').toUpperCase() === 'M';
  if (m && cintura > 102 || !m && cintura > 88) criteria.push('Cintura abdominal elevada');
  if (tg >= 150) criteria.push('Triglicéridos ≥150 mg/dL'); if (m && hdl < 40 || !m && hdl < 50) criteria.push('HDL bajo');
  if (presion_s >= 130 || presion_d >= 85) criteria.push('Presión arterial elevada'); if (glucosa >= 100) criteria.push('Glucosa en ayunas ≥100 mg/dL');
  return { criteria: criteria, count: criteria.length, diagnosed: criteria.length >= 3, color: criteria.length >= 3 ? '#dc2626' : criteria.length >= 2 ? '#f59e0b' : '#22c55e', label: criteria.length >= 3 ? 'Síndrome Metabólico (ATP-III)' : criteria.length >= 2 ? 'Riesgo alto (2/5 criterios)' : 'Sin síndrome metabólico' };
}
