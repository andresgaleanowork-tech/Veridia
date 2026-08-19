// ===== LIFECYCLE CLINICAL ALERT ENGINE =====
// Evaluación nutricional clínica a lo largo del ciclo vital
// Pediátrico (<19a) · Adulto (19-64a) · Geriátrico (≥65a)
// + Alertas transversales (ángulo de fase, ingesta, realimentación)

function generateLifecycleAlerts(p,antros,anals,ch){
  var alerts=[];
  var edadAnios=age(p.fechaNacimiento);
  var sexo=p.sexo==='MASCULINO'?'M':'F';
  var as=antros.sort(function(a,b){return a.fecha.localeCompare(b.fecha)});
  var ultimo=as.length?as[as.length-1]:null;
  var penult=as.length>1?as[as.length-2]:null;
  var etapa=edadAnios<19?'Pediátrico':edadAnios>=65?'Geriátrico':'Adulto';
  var aid=0;

  if(!ultimo) return alerts;

  // --- ICT (Índice Cintura/Talla) — Transversal ---
  if(ultimo.cintura&&ultimo.altura){
    var ict=ultimo.cintura/ultimo.altura;
    if(ict>=0.6) alerts.push({id:'ict_'+(aid++),etapa:'Transversal',tipo:'Antropométrica',sev:'grave',
      mensaje:'ICT ≥0.60 — Riesgo cardiometabólico MUY ELEVADO',
      recomendacion:'Prioridad absoluta: reducción de adiposidad visceral. Plan hipocalórico + ejercicio aeróbico.',
      valor:ict.toFixed(3),umbral:'<0.50 normal, ≥0.60 muy alto'});
    else if(ict>=0.5) alerts.push({id:'ict_'+(aid++),etapa:'Transversal',tipo:'Antropométrica',sev:'moderada',
      mensaje:'ICT ≥0.50 — Riesgo cardiometabólico incrementado',
      recomendacion:'Plan de reducción de perímetro abdominal. Control de factores de riesgo.',
      valor:ict.toFixed(3),umbral:'<0.50 normal'});
  }

  if(etapa==='Pediátrico'){
    // --- ETAPA PEDIÁTRICA ---
    if(ultimo.imc<16) alerts.push({id:'ped_'+(aid++),etapa:etapa,tipo:'IMC/Edad',sev:'critica',
      mensaje:'IMC muy bajo para la edad — Posible desnutrición severa / emaciación',
      recomendacion:'Evaluación urgente. Descartar TCA, malabsorción o patología subyacente. Derivar a pediatría.',
      valor:ultimo.imc,umbral:'<-2 DE para edad'});
    if(ultimo.imc>30) alerts.push({id:'ped_'+(aid++),etapa:etapa,tipo:'IMC/Edad',sev:'grave',
      mensaje:'IMC >30 — Obesidad y riesgo cardiometabólico temprano',
      recomendacion:'Plan alimentario adaptado al crecimiento. Fomentar actividad física. Perfil lipídico y glucémico.',
      valor:ultimo.imc,umbral:'>+2 DE para edad'});
    // Velocidad de crecimiento (pérdida de peso en pediatría)
    if(penult){
      var deltaPeso=ultimo.peso-penult.peso;
      var diasEntre=Math.max(1,Math.round((new Date(ultimo.fecha)-new Date(penult.fecha))/(86400000)));
      if(deltaPeso<0&&Math.abs(deltaPeso)/penult.peso*100>5&&diasEntre<60)
        alerts.push({id:'ped_'+(aid++),etapa:etapa,tipo:'Velocidad crecimiento',sev:'grave',
          mensaje:'Pérdida de peso >5% en menos de 2 meses — Posible fallo de medro',
          recomendacion:'Investigar causa de pérdida ponderal. Evaluación de ingesta y patología.',
          valor:((deltaPeso/penult.peso)*100).toFixed(1)+'%',umbral:'Caída ≥2 percentiles principales'});
    }
    // MUAC (pantorrilla como proxy en nuestro sistema)
    if(edadAnios<5&&ultimo.pantorrilla&&ultimo.pantorrilla<12.5)
      alerts.push({id:'ped_'+(aid++),etapa:etapa,tipo:'MUAC',sev:'critica',
        mensaje:'Circunferencia braquial estimada <12.5cm — RIESGO INMINENTE de mortalidad por inanición',
        recomendacion:'EMERGENCIA NUTRICIONAL. Derivación inmediata. Protocolo de realimentación supervisada.',
        valor:ultimo.pantorrilla+'cm',umbral:'<12.5cm (niños <5 años)'});

  } else if(etapa==='Adulto'){
    // --- ETAPA ADULTA (19-64 años) ---
    if(ultimo.imc<18.5) alerts.push({id:'adu_'+(aid++),etapa:etapa,tipo:'IMC',sev:'grave',
      mensaje:'IMC <18.5 — Bajo peso. Depleción calórico-proteica',
      recomendacion:'Plan hipercalórico supervisado. Descartar patología subyacente (TCA, malabsorción, neoplasia).',
      valor:ultimo.imc,umbral:'≥18.5'});
    if(ultimo.imc>=40) alerts.push({id:'adu_'+(aid++),etapa:etapa,tipo:'IMC',sev:'critica',
      mensaje:'IMC ≥40 — Obesidad mórbida (grado III)',
      recomendacion:'Abordaje multidisciplinario. Valorar cirugía bariátrica. Comorbilidades urgentes.',
      valor:ultimo.imc,umbral:'<30'});
    else if(ultimo.imc>=35) alerts.push({id:'adu_'+(aid++),etapa:etapa,tipo:'IMC',sev:'grave',
      mensaje:'IMC ≥35 — Obesidad grado II',
      recomendacion:'Plan hipocalórico -500/700 kcal. Ejercicio progresivo. Control comorbilidades.',
      valor:ultimo.imc,umbral:'<30'});
    else if(ultimo.imc>=30) alerts.push({id:'adu_'+(aid++),etapa:etapa,tipo:'IMC',sev:'moderada',
      mensaje:'IMC ≥30 — Obesidad grado I',
      recomendacion:'Plan hipocalórico moderado. Incremento actividad física. Perfil metabólico.',
      valor:ultimo.imc,umbral:'<30'});

    // Velocidad de pérdida de peso involuntaria
    if(penult&&as.length>=2){
      var deltaPeso=ultimo.peso-penult.peso;
      var diasEntre=Math.max(1,Math.round((new Date(ultimo.fecha)-new Date(penult.fecha))/(86400000)));
      var pctPerdida=Math.abs(deltaPeso)/penult.peso*100;
      if(deltaPeso<0&&pctPerdida>5&&diasEntre<=35)
        alerts.push({id:'adu_'+(aid++),etapa:etapa,tipo:'Pérdida involuntaria',sev:'critica',
          mensaje:'Pérdida de peso >5% en 1 mes — Catabolismo severo',
          recomendacion:'ALARMA: Descartar neoplasia, infección, TCA, hipertiroidismo. Soporte nutricional urgente.',
          valor:pctPerdida.toFixed(1)+'% en '+diasEntre+' días',umbral:'<5% en 1 mes, <10% en 6 meses'});
      else if(deltaPeso<0&&pctPerdida>10&&diasEntre<=185)
        alerts.push({id:'adu_'+(aid++),etapa:etapa,tipo:'Pérdida involuntaria',sev:'critica',
          mensaje:'Pérdida de peso >10% en 6 meses — Catabolismo severo',
          recomendacion:'Estudio etiológico completo. Soporte nutricional. Interconsulta especializada.',
          valor:pctPerdida.toFixed(1)+'% en '+diasEntre+' días',umbral:'<10% en 6 meses'});
    }

    // Circunferencia de cintura
    if(sexo==='M'&&ultimo.cintura>102) alerts.push({id:'adu_'+(aid++),etapa:etapa,tipo:'Cintura',sev:'grave',
      mensaje:'Cintura >102cm (♂) — Adiposidad visceral y resistencia a insulina',
      recomendacion:'Reducción de grasa visceral prioritaria. Dieta antiinflamatoria. Ejercicio aeróbico.',
      valor:ultimo.cintura+'cm',umbral:'≤102cm (♂)'});
    else if(sexo==='M'&&ultimo.cintura>94) alerts.push({id:'adu_'+(aid++),etapa:etapa,tipo:'Cintura',sev:'moderada',
      mensaje:'Cintura >94cm (♂) — Riesgo cardiometabólico incrementado',
      recomendacion:'Plan de reducción de perímetro abdominal. Monitoreo metabólico.',
      valor:ultimo.cintura+'cm',umbral:'≤94cm (♂)'});
    if(sexo==='F'&&ultimo.cintura>88) alerts.push({id:'adu_'+(aid++),etapa:etapa,tipo:'Cintura',sev:'grave',
      mensaje:'Cintura >88cm (♀) — Adiposidad visceral y resistencia a insulina',
      recomendacion:'Reducción de grasa visceral prioritaria. Dieta antiinflamatoria.',
      valor:ultimo.cintura+'cm',umbral:'≤88cm (♀)'});
    else if(sexo==='F'&&ultimo.cintura>80) alerts.push({id:'adu_'+(aid++),etapa:etapa,tipo:'Cintura',sev:'moderada',
      mensaje:'Cintura >80cm (♀) — Riesgo cardiometabólico incrementado',
      recomendacion:'Plan de reducción. Control de factores de riesgo.',
      valor:ultimo.cintura+'cm',umbral:'≤80cm (♀)'});

    // Fuerza prensión manual (si tuviéramos el dato — check anamnesisData)
    // Placeholder for future dynamometry field

  } else if(etapa==='Geriátrico'){
    // --- ETAPA GERIÁTRICA (≥65 años) ---
    // Paradoja de la obesidad: umbral de bajo peso más alto
    if(ultimo.imc<22) alerts.push({id:'ger_'+(aid++),etapa:etapa,tipo:'IMC geriátrico',sev:'critica',
      mensaje:'IMC <22 en adulto mayor — Riesgo de mortalidad aumentado',
      recomendacion:'Intervención nutricional obligatoria. Valorar suplementación oral. MNA completo. Prevenir sarcopenia.',
      valor:ultimo.imc,umbral:'≥22 (geriátrico)'});
    else if(ultimo.imc<24) alerts.push({id:'ger_'+(aid++),etapa:etapa,tipo:'IMC geriátrico',sev:'moderada',
      mensaje:'IMC 22-24 en adulto mayor — Zona de vigilancia',
      recomendacion:'Monitoreo mensual de peso. Asegurar ingesta proteica ≥1.2g/kg. Actividad física adaptada.',
      valor:ultimo.imc,umbral:'≥24 (óptimo geriátrico)'});

    // Circunferencia de pantorrilla — sarcopenia
    if(ultimo.pantorrilla&&ultimo.pantorrilla<31)
      alerts.push({id:'ger_'+(aid++),etapa:etapa,tipo:'Pantorrilla',sev:'grave',
        mensaje:'Pantorrilla <31cm — Sarcopenia. Pérdida de masa muscular esquelética',
        recomendacion:'Suplementación proteica (≥1.5g/kg). Ejercicio de resistencia adaptado. Valorar HMB/creatina.',
        valor:ultimo.pantorrilla+'cm',umbral:'≥31cm'});

    // MNA (si disponible en anamnesis)
    var anamData=DB.anamnesisData[p.id];
    var latestAnam=Array.isArray(anamData)&&anamData.length?anamData[anamData.length-1]:null;
    if(latestAnam&&latestAnam.respuestas&&latestAnam.respuestas.mna){
      var mna=parseFloat(latestAnam.respuestas.mna);
      if(mna<11) alerts.push({id:'ger_'+(aid++),etapa:etapa,tipo:'MNA',sev:'critica',
        mensaje:'MNA <11 — Desnutrición. Intervención nutricional obligatoria',
        recomendacion:'Plan nutricional intensivo. Suplementos orales. Reevaluar en 1 mes.',
        valor:mna+' pts',umbral:'≥24 normal, 17-23.5 riesgo, <17 desnutrición'});
      else if(mna<17) alerts.push({id:'ger_'+(aid++),etapa:etapa,tipo:'MNA',sev:'grave',
        mensaje:'MNA <17 — Riesgo de desnutrición alto',
        recomendacion:'Valoración nutricional completa. Enriquecer dieta. Control mensual.',
        valor:mna+' pts',umbral:'≥24 normal'});
    }

    // Pérdida de peso en geriatría (más sensible)
    if(penult){
      var deltaPeso=ultimo.peso-penult.peso;
      var pctPerdida=Math.abs(deltaPeso)/penult.peso*100;
      if(deltaPeso<0&&pctPerdida>3)
        alerts.push({id:'ger_'+(aid++),etapa:etapa,tipo:'Pérdida ponderal',sev:'grave',
          mensaje:'Pérdida de peso >3% en adulto mayor — Riesgo de fragilidad',
          recomendacion:'Investigar causa. Aumentar densidad calórica y proteica. Suplementos si necesario.',
          valor:pctPerdida.toFixed(1)+'%',umbral:'Cualquier pérdida involuntaria es relevante en ≥65a'});
    }
  }

  // --- ALERTAS TRANSVERSALES (cualquier edad) ---

  // Ángulo de fase por BIA (si disponible)
  var anamData2=DB.anamnesisData[p.id];
  var latestAnam2=Array.isArray(anamData2)&&anamData2.length?anamData2[anamData2.length-1]:null;
  if(latestAnam2&&latestAnam2.respuestas&&latestAnam2.respuestas.anguloFase){
    var af=parseFloat(latestAnam2.respuestas.anguloFase);
    if(af>0&&af<4.5) alerts.push({id:'tr_'+(aid++),etapa:'Transversal',tipo:'Ángulo de fase',sev:'critica',
      mensaje:'Ángulo de fase <4.5° — Pérdida de integridad de membranas celulares',
      recomendacion:'Predictor independiente de mala evolución. Soporte nutricional intensivo. Reevaluar BIA en 2 semanas.',
      valor:af+'°',umbral:'≥5° (normal varía por edad/sexo)'});
    else if(af>=4.5&&af<5) alerts.push({id:'tr_'+(aid++),etapa:'Transversal',tipo:'Ángulo de fase',sev:'grave',
      mensaje:'Ángulo de fase 4.5-5° — Zona de riesgo. Integridad celular comprometida',
      recomendacion:'Optimizar nutrición. Proteínas de alto valor biológico. Control BIA mensual.',
      valor:af+'°',umbral:'≥5°'});
  }

  // Analíticas — Síndrome de realimentación (P, K, Mg bajos)
  if(anals.length){
    var lastAnal=anals[0];
    var fosforo=lastAnal.marcadores.find(function(m){return m.nombre.toLowerCase().includes('fósforo')||m.nombre.toLowerCase().includes('fosforo')});
    var potasio=lastAnal.marcadores.find(function(m){return m.nombre.toLowerCase().includes('potasio')});
    var magnesio=lastAnal.marcadores.find(function(m){return m.nombre.toLowerCase().includes('magnesio')});
    var realiCount=0;
    if(fosforo&&fosforo.valor<2.5){realiCount++;alerts.push({id:'tr_'+(aid++),etapa:'Transversal',tipo:'⚡ Realimentación',sev:'critica',
      mensaje:'Fósforo bajo (<2.5 mg/dL) — Riesgo de Síndrome de Realimentación',
      recomendacion:'BOTÓN ROJO: Detener avance calórico. Reponer fósforo IV. Monitoreo cada 6h.',
      valor:fosforo.valor+' '+fosforo.unidad,umbral:'≥2.5 mg/dL'})}
    if(potasio&&potasio.valor<3.5){realiCount++;alerts.push({id:'tr_'+(aid++),etapa:'Transversal',tipo:'⚡ Realimentación',sev:'critica',
      mensaje:'Potasio bajo (<3.5 mEq/L) — Riesgo de Síndrome de Realimentación',
      recomendacion:'BOTÓN ROJO: Riesgo arritmia. Reponer potasio. ECG de control.',
      valor:potasio.valor+' '+potasio.unidad,umbral:'≥3.5 mEq/L'})}
    if(magnesio&&magnesio.valor<1.5){realiCount++;alerts.push({id:'tr_'+(aid++),etapa:'Transversal',tipo:'⚡ Realimentación',sev:'critica',
      mensaje:'Magnesio bajo (<1.5 mg/dL) — Riesgo de Síndrome de Realimentación',
      recomendacion:'BOTÓN ROJO: Reponer magnesio. Monitoreo estrecho. Ajustar aporte calórico.',
      valor:magnesio.valor+' '+magnesio.unidad,umbral:'≥1.5 mg/dL'})}
    if(realiCount>=2) alerts.unshift({id:'tr_REALI',etapa:'🔴 EMERGENCIA',tipo:'Síndrome de Realimentación',sev:'critica',
      mensaje:'⚠️ MÚLTIPLES ELECTROLITOS BAJOS — Alto riesgo de Síndrome de Realimentación',
      recomendacion:'DETENER inmediatamente el avance calórico. Reponer electrolitos IV. Monitoreo en UCI/sala. Reiniciar a 10 kcal/kg/día.',
      valor:realiCount+' electrolitos alterados',umbral:'P, K, Mg normales'});

    // Alertas analíticas transversales estándar
    lastAnal.marcadores.forEach(function(m){
      if(m.alerta==='grave') alerts.push({id:'anal_'+(aid++),etapa:'Transversal',tipo:'Analítica',sev:'grave',
        mensaje:m.nombre+' '+m.valor+' '+m.unidad+' — Fuera de rango ('+m.rango+')',
        recomendacion:'Valoración clínica. Control analítico.',valor:m.valor+' '+m.unidad,umbral:m.rango});
    });
  }

  // Sort by severity
  var sevOrder={critica:0,grave:1,moderada:2,leve:3};
  alerts.sort(function(a,b){return(sevOrder[a.sev]||9)-(sevOrder[b.sev]||9)});

  return alerts;
}

// Promote lifecycle alert to formal DB.alerts
function promoteLifecycleAlert(patId,alertId){
  var p=gP(patId);if(!p)return;
  var as=DB.antropometrias.filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return a.fecha.localeCompare(b.fecha)});
  var anals=DB.analiticas.filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)});
  var ch=DB.clinicalHistories.find(function(h){return h.pacienteId===patId});
  var lcAlerts=generateLifecycleAlerts(p,as,anals,ch);
  var alert=lcAlerts.find(function(a){return a.id===alertId});
  if(!alert){toast('Alerta no encontrada','error');return}
  // Check if already exists
  var existing=DB.alerts.find(function(a){return a.pacienteId===patId&&a.mensaje===alert.mensaje&&a.estado==='pendiente'});
  if(existing){toast('Esta alerta ya está registrada','warning');return}
  DB.alerts.push({
    id:(DB.alerts.length?Math.max.apply(null,DB.alerts.map(function(a){return a.id||0}))+1:1),
    pacienteId:patId,
    tipo:alert.tipo,
    severidad:alert.sev==='critica'?'grave':alert.sev,
    mensaje:alert.mensaje,
    recomendacion:alert.recomendacion,
    estado:'pendiente',
    fecha:new Date().toISOString().slice(0,10)
  });
  updAlertDot();
  auditAction('CREATE','Alerta clínica ciclo vital',p.nombre+' '+p.apellidos+': '+alert.mensaje.slice(0,60));
  toast('Alerta registrada formalmente ✅');
  hTab('resumen');
}

function renderAnamRedFlags(p){
  var flags=[];
  var ch=DB.clinicalHistories.find(h=>h.pacienteId===p.id);
  var la=DB.antropometrias.filter(a=>a.pacienteId===p.id).sort((a,b)=>b.fecha.localeCompare(a.fecha))[0];
  var anal=DB.analiticas.filter(a=>a.pacienteId===p.id);
  if(la){
    if(la.imc>=40) flags.push({flag:'IMC ≥40 — Obesidad mórbida',sev:'grave'});
    else if(la.imc>=35) flags.push({flag:'IMC ≥35 — Obesidad grado II',sev:'moderada'});
    else if(la.imc<16) flags.push({flag:'IMC <16 — Desnutrición severa',sev:'grave'});
    if(la.cintura>102&&p.sexo==='MASCULINO') flags.push({flag:'Perímetro cintura >102cm (♂) — Riesgo cardiometabólico',sev:'moderada'});
    if(la.cintura>88&&p.sexo==='FEMENINO') flags.push({flag:'Perímetro cintura >88cm (♀) — Riesgo cardiometabólico',sev:'moderada'});
  }
  if(anal.length){
    var lastAnal=anal[0];
    lastAnal.marcadores.forEach(m=>{
      if(m.alerta==='grave') flags.push({flag:m.nombre+' '+m.valor+' '+m.unidad+' — Fuera de rango',sev:'grave'});
    });
  }
  if(ch){
    if(ch.alergias&&ch.alergias!=='Ninguna conocida') flags.push({flag:'Alergias reportadas: '+ch.alergias,sev:'leve'});
  }
  if(!flags.length) return '';
  return `<div class="card" style="margin-top:14px"><div class="card-header"><span class="card-title">🚩 Banderas rojas detectadas</span><span class="badge badge-danger">${flags.filter(f=>f.sev==='grave').length} graves</span></div>
  <div class="card-body" style="padding:12px">${flags.map(f=>`<div class="clinical-alert ${f.sev==='grave'?'severe':f.sev==='moderada'?'moderate':'mild'}" style="padding:10px;margin-bottom:6px"><span style="font-size:.82rem">${f.flag}</span></div>`).join('')}</div></div>`;
}

function renderAnamRecommendations(p,ch){
  var recs={recomendar:[],prevenir:[],vigilar:[]};
  var la=DB.antropometrias.filter(a=>a.pacienteId===p.id).sort((a,b)=>b.fecha.localeCompare(a.fecha))[0];
  var anal=DB.analiticas.filter(a=>a.pacienteId===p.id);
  if(la){
    if(la.imc>=25&&la.imc<30){recs.recomendar.push('Plan hipocalórico moderado (-300-500 kcal)');recs.vigilar.push('Peso cada 2 semanas')}
    if(la.imc>=30){recs.recomendar.push('Plan hipocalórico con déficit -500 kcal');recs.recomendar.push('Ejercicio progresivo 150 min/semana');recs.prevenir.push('Recuperación de peso (efecto rebote)');recs.vigilar.push('Peso semanal + perímetro cintura mensual')}
    if(la.imc<18.5){recs.recomendar.push('Plan hipercalórico supervisado');recs.prevenir.push('Síndrome de realimentación');recs.vigilar.push('Peso semanal + masa muscular')}
  }
  if(anal.length){
    var lastA=anal[0];
    var homa=lastA.marcadores.find(m=>m.nombre==='HOMA-IR');
    if(homa&&homa.valor>2.5){recs.recomendar.push('Dieta bajo índice glucémico');recs.recomendar.push('Aumentar fibra soluble (>30g/día)');recs.vigilar.push('HOMA-IR cada 3 meses')}
    var vitD=lastA.marcadores.find(m=>m.nombre==='Vitamina D');
    if(vitD&&vitD.valor<30){recs.recomendar.push('Suplementar Vitamina D 2000-4000 UI/día');recs.vigilar.push('25-OH Vitamina D cada 3 meses')}
    var ferr=lastA.marcadores.find(m=>m.nombre==='Ferritina');
    if(ferr&&ferr.valor<20){recs.recomendar.push('Aumentar hierro hemo (carnes rojas 2x/sem)');recs.recomendar.push('Vitamina C con las comidas (mejora absorción)');recs.prevenir.push('Café/té con las comidas (inhibe absorción)');recs.vigilar.push('Ferritina + hemograma cada 3 meses')}
    var tsh=lastA.marcadores.find(m=>m.nombre==='TSH');
    if(tsh&&tsh.valor>4.5){recs.prevenir.push('Alimentos bociógenos crudos en exceso');recs.vigilar.push('TSH + T4L cada 6 meses')}
    var tg=lastA.marcadores.find(m=>m.nombre==='Triglicéridos');
    if(tg&&tg.valor>150){recs.recomendar.push('Omega-3 (pescado azul 3x/semana)');recs.prevenir.push('Azúcares simples + alcohol');recs.vigilar.push('Perfil lipídico cada 3-6 meses')}
  }
  if(ch&&ch.actividadFisica&&ch.actividadFisica.intensidad==='Baja'){
    recs.recomendar.push('Iniciar actividad física gradual (caminar 30 min/día)');
  }
  return `<div class="card"><div class="card-header"><span class="card-title">✅ Recomendaciones clínicas automáticas</span></div>
  <div class="card-body">
  <p style="font-size:.72rem;color:var(--text3);margin-bottom:14px">Generadas automáticamente según datos del paciente: antropometría, analíticas, antecedentes y estilo de vida.</p>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">
    <div style="padding:16px;background:var(--success-light);border-radius:var(--radius-sm)"><h4 style="font-size:.76rem;font-weight:700;color:var(--success);margin-bottom:10px">🟢 RECOMENDAR</h4>${recs.recomendar.length?recs.recomendar.map(r=>`<div style="font-size:.78rem;padding:6px 0;border-bottom:1px solid rgba(70,167,88,.15)">${r}</div>`).join(''):'<p style="font-size:.78rem;color:var(--text3)">Sin recomendaciones específicas</p>'}</div>
    <div style="padding:16px;background:var(--warning-light);border-radius:var(--radius-sm)"><h4 style="font-size:.76rem;font-weight:700;color:#8B6914;margin-bottom:10px">🟡 PREVENIR</h4>${recs.prevenir.length?recs.prevenir.map(r=>`<div style="font-size:.78rem;padding:6px 0;border-bottom:1px solid rgba(229,169,62,.15)">${r}</div>`).join(''):'<p style="font-size:.78rem;color:var(--text3)">Sin riesgos identificados</p>'}</div>
    <div style="padding:16px;background:var(--info-light);border-radius:var(--radius-sm)"><h4 style="font-size:.76rem;font-weight:700;color:#1A6DAD;margin-bottom:10px">🔵 VIGILAR</h4>${recs.vigilar.length?recs.vigilar.map(r=>`<div style="font-size:.78rem;padding:6px 0;border-bottom:1px solid rgba(59,158,219,.15)">${r}</div>`).join(''):'<p style="font-size:.78rem;color:var(--text3)">Sin seguimiento especial</p>'}</div>
  </div>
  ${renderAnamRedFlags(p)}
  </div></div>`;
}

// ---- QUICK SUMMARY for the vigent anamnesis in list view ----
function renderAnamQuickSummary(a,ch){
  var r=a.respuestas||{};
  var items=[];
  if(r.motivoConsulta) items.push({l:'🎯 Motivo',v:r.motivoConsulta});
  if(r.antPersonales||ch?.antecedentes) items.push({l:'🩺 Antecedentes',v:r.antPersonales||ch.antecedentes});
  if(r.alergias||ch?.alergias) items.push({l:'⚠️ Alergias',v:r.alergias||ch.alergias});
  if(r.medicacion||ch?.medicacion) items.push({l:'💊 Medicación',v:r.medicacion||ch.medicacion});
  if(r.tipoDieta) items.push({l:'🍽️ Dieta',v:r.tipoDieta});
  if(r.actTipo) items.push({l:'🏃 Actividad',v:r.actTipo+(r.actFreq?' ('+r.actFreq+')':'')});
  if(r.consumoAgua) items.push({l:'💧 Agua',v:r.consumoAgua});
  if(!items.length) return '<p style="font-size:.78rem;color:var(--text3)">Anamnesis vacía — haga clic en editar para completar.</p>';
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 18px">${items.map(x=>`<div style="display:flex;gap:6px;font-size:.78rem"><span style="color:var(--text3);white-space:nowrap">${x.l}:</span><span style="color:var(--text);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x.v}</span></div>`).join('')}</div>`;
}

// ---- READ-ONLY RENDER of a full anamnesis ----
function renderAnamReadonly(a,p,ch){
  var r=a.respuestas||{};
  var allSections=['personal','motivo','antecedentes','dietetica','estilovida'];
  var html='';
  allSections.forEach(function(sec){
    var fields=getAnamFields(sec,p,ch,r);
    var filled=fields.filter(f=>r[f.id]);
    if(!filled.length) return;
    html+=`<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">${ANAM_SECTION_TITLES[sec]}</span></div>
    <div class="card-body"><ul class="data-list">${filled.map(f=>`<li><span class="label">${f.label}</span><span class="value">${r[f.id]}</span></li>`).join('')}</ul></div></div>`;
  });
  // Systems
  if((a.sistemas||[]).length){
    html+=`<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">⚡ Sistemas clínicos</span></div>
    <div class="card-body"><div style="display:flex;gap:8px;flex-wrap:wrap">${a.sistemas.map(s=>{var sys=ANAM_SYSTEMS.find(x=>x.id===s);return sys?`<span class="badge" style="background:${sys.color}20;color:${sys.color};border:1px solid ${sys.color}40">${sys.ic} ${sys.name}</span>`:''}).join('')}</div></div></div>`;
  }
  html+=renderAnamRedFlags(p);
  return html||'<div class="alert alert-info">Anamnesis sin datos registrados.</div>';
}

// ---- NAVIGATION HELPERS ----
function startNewAnam(templateId){
  if(!selPat) return;
  window._anamView='form';
  window._anamSection='personal';
  window._anamEditIdx=undefined;
  // Init draft with patient/clinical history data
  var p=gP(selPat);
  var ch=DB.clinicalHistories.find(h=>h.pacienteId===selPat);
  window._anamDraft={_sistemas:[]};
  // Apply template presets
  if(templateId==='dm2'){window._anamDraft._sistemas=['endocrino','cardiovascular'];window._anamSection='personal'}
  else if(templateId==='sobrepeso'){window._anamDraft._sistemas=['endocrino','cardiovascular','digestivo'];window._anamSection='personal'}
  else if(templateId==='embarazo'){window._anamDraft._sistemas=['ginecologico','endocrino'];window._anamSection='personal'}
  window._anamDraft._template=templateId||'completa';
  toast(templateId?'Plantilla aplicada — complete el formulario':'Nueva anamnesis — complete cada sección');
  hTab('anamnesis');
}

function editAnam(idx){
  if(!selPat) return;
  var list=DB.anamnesisData[selPat]||[];
  if(!list[idx]) return;
  window._anamView='form';
  window._anamSection='personal';
  window._anamEditIdx=idx;
  // Load existing data into draft
  var a=list[idx];
  window._anamDraft=Object.assign({},a.respuestas||{});
  window._anamDraft._sistemas=[].concat(a.sistemas||[]);
  window._anamDraft._template=a.template||'completa';
  toast('Editando anamnesis V'+(list.length-idx));
  hTab('anamnesis');
}

function viewAnam(idx){
  window._anamView='view';
  window._anamEditIdx=idx;
  hTab('anamnesis');
}

function duplicateAnam(idx){
  if(!selPat) return;
  var list=DB.anamnesisData[selPat]||[];
  if(!list[idx]) return;
  window._anamView='form';
  window._anamSection='personal';
  window._anamEditIdx=undefined; // NEW, not edit
  var a=list[idx];
  window._anamDraft=Object.assign({},a.respuestas||{});
  window._anamDraft._sistemas=[].concat(a.sistemas||[]);
  window._anamDraft._template=a.template||'completa';
  toast('Anamnesis duplicada — modifique y guarde como nueva versión');
  hTab('anamnesis');
}

function openAnamCompare(){
  window._anamView='compare';
  hTab('anamnesis');
}

function exitAnamForm(){
  window._anamView='list';
  window._anamSection='personal';
  window._anamEditIdx=undefined;
  window._anamDraft=null;
  hTab('anamnesis');
}

function anamNextSection(){
  var idx=ANAM_SECTIONS_ORDER.indexOf(window._anamSection||'personal');
  saveDraftFromForm();
  if(idx<ANAM_SECTIONS_ORDER.length-1){window._anamSection=ANAM_SECTIONS_ORDER[idx+1];hTab('anamnesis')}
}
function anamPrevSection(){
  var idx=ANAM_SECTIONS_ORDER.indexOf(window._anamSection||'personal');
  saveDraftFromForm();
  if(idx>0){window._anamSection=ANAM_SECTIONS_ORDER[idx-1];hTab('anamnesis')}
}

// Collect current form fields into draft
function saveDraftFromForm(){
  if(!window._anamDraft) window._anamDraft={_sistemas:[]};
  document.querySelectorAll('[id^="af_"]').forEach(function(el){
    window._anamDraft[el.id.replace('af_','')]=el.value;
  });
}
function saveDraftField(key,val){
  if(!window._anamDraft) window._anamDraft={_sistemas:[]};
  window._anamDraft[key]=val;
}

// ---- SAVE FULL ANAMNESIS ----
function saveAnamFull(){
  if(!selPat) return;
  saveDraftFromForm();
  var p=gP(selPat);
  var ch=DB.clinicalHistories.find(h=>h.pacienteId===selPat);
  var draft=window._anamDraft||{};

  // Build snapshot
  var snapshot={
    fecha:new Date().toISOString().slice(0,10),
    template:draft._template||'completa',
    profesional:currentUser?currentUser.name:'',
    sistemas:draft._sistemas||[],
    respuestas:{},
    redFlags:[]
  };
  // Copy all non-internal fields
  for(var k in draft){if(k[0]!=='_') snapshot.respuestas[k]=draft[k]}

  // Also update clinical history for backward compatibility
  if(ch){
    if(draft.antPersonales) ch.antecedentes=draft.antPersonales;
    if(draft.antFamiliares) ch.antecedentesFamiliares=draft.antFamiliares;
    if(draft.alergias) ch.alergias=draft.alergias;
    if(draft.medicacion) ch.medicacion=draft.medicacion;
    if(draft.suplementos) ch.suplementacion=draft.suplementos;
    if(draft.actTipo) ch.actividadFisica.tipo=draft.actTipo;
    if(draft.actFreq) ch.actividadFisica.frecuencia=draft.actFreq;
    if(draft.actIntensidad) ch.actividadFisica.intensidad=draft.actIntensidad;
    if(draft.estres) ch.estres=draft.estres;
    if(draft.consumoAgua) ch.ingestaHidrica=draft.consumoAgua;
  }

  // Init array if needed
  if(!DB.anamnesisData[selPat]) DB.anamnesisData[selPat]=[];

  var isEdit=typeof window._anamEditIdx==='number';
  if(isEdit){
    // Update existing
    DB.anamnesisData[selPat][window._anamEditIdx]=snapshot;
    auditAction('UPDATE','Anamnesis V'+(DB.anamnesisData[selPat].length-window._anamEditIdx),p.nombre+' '+p.apellidos);
    toast('Anamnesis actualizada ✅');
  } else {
    // Add new version
    DB.anamnesisData[selPat].push(snapshot);
    auditAction('CREATE','Anamnesis V'+DB.anamnesisData[selPat].length,p.nombre+' '+p.apellidos);
    toast('Nueva anamnesis V'+DB.anamnesisData[selPat].length+' guardada ✅');
  }

  // Clean up and return to list
  window._anamView='list';
  window._anamSection='personal';
  window._anamEditIdx=undefined;
  window._anamDraft=null;
  hTab('anamnesis');
}

// Legacy compat
// Aliases removed: saveAnamSection→saveDraftFromForm, applyAnamTemplate→startNewAnam, openFullAnamForm→startNewAnam

// ---- COMPARISON ENGINE ----
function renderAnamComparison(){
  var el=$('anamCmpResult');if(!el||!selPat) return;
  var list=DB.anamnesisData[selPat]||[];
  var iA=parseInt(($('cmpA')||{}).value)||0;
  var iB=parseInt(($('cmpB')||{}).value)||0;
  if(iA===iB){el.innerHTML='<div class="alert alert-info">Seleccione dos versiones diferentes para comparar.</div>';return}
  var a=list[iA],b=list[iB];
  if(!a||!b){el.innerHTML='<div class="alert alert-danger">Versiones no encontradas.</div>';return}
  var rA=a.respuestas||{},rB=b.respuestas||{};

  // Collect all keys
  var allKeys={};
  for(var k in rA) allKeys[k]=1;
  for(var k in rB) allKeys[k]=1;

  // Group by section
  var p=gP(selPat),ch=DB.clinicalHistories.find(h=>h.pacienteId===selPat);
  var sections=['personal','motivo','antecedentes','dietetica','estilovida'];
  var html='';
  var totalChanges=0,added=0,removed=0,modified=0;

  sections.forEach(function(sec){
    var fields=getAnamFields(sec,p,ch,{});
    var fieldMap={};fields.forEach(function(f){fieldMap[f.id]=f.label});
    var rows='';
    fields.forEach(function(f){
      var vA=rA[f.id]||'';
      var vB=rB[f.id]||'';
      if(!vA&&!vB) return;
      var changed=vA!==vB;
      if(changed) totalChanges++;
      if(changed&&!vA) added++;
      else if(changed&&!vB) removed++;
      else if(changed) modified++;
      rows+=`<tr style="${changed?'background:var(--warning-light)':''}">
        <td style="font-weight:600;font-size:.78rem;white-space:nowrap">${f.label}</td>
        <td style="font-size:.78rem;${changed&&vA?'color:var(--danger)':''}">${vA||'<span style="color:var(--text3)">—</span>'}</td>
        <td style="font-size:.78rem;${changed&&vB?'color:var(--success)':''}">${vB||'<span style="color:var(--text3)">—</span>'}</td>
        <td style="text-align:center">${changed?'<span class="badge badge-warning" style="font-size:.65rem">Cambio</span>':'<span style="color:var(--text3);font-size:.7rem">═</span>'}</td>
      </tr>`;
    });
    if(rows){
      html+=`<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">${ANAM_SECTION_TITLES[sec]}</span></div>
      <div class="card-body" style="padding:0;overflow-x:auto"><table><thead><tr><th>Campo</th><th>V${list.length-iA} (${fD(a.fecha)})</th><th>V${list.length-iB} (${fD(b.fecha)})</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
    }
  });

  // Systems comparison
  var sysA=a.sistemas||[],sysB=b.sistemas||[];
  var allSys={};sysA.forEach(function(s){allSys[s]=1});sysB.forEach(function(s){allSys[s]=1});
  var sysRows='';
  for(var sid in allSys){
    var inA=sysA.includes(sid),inB=sysB.includes(sid);
    var sys=ANAM_SYSTEMS.find(function(x){return x.id===sid});
    if(!sys) continue;
    var changed=inA!==inB;
    if(changed) totalChanges++;
    sysRows+=`<tr style="${changed?'background:var(--warning-light)':''}">
      <td style="font-size:.78rem">${sys.ic} ${sys.name}</td>
      <td style="text-align:center">${inA?'<span class="badge badge-primary" style="font-size:.65rem">✓</span>':'—'}</td>
      <td style="text-align:center">${inB?'<span class="badge badge-primary" style="font-size:.65rem">✓</span>':'—'}</td>
      <td style="text-align:center">${changed?(inB&&!inA?'<span class="badge badge-success" style="font-size:.65rem">Añadido</span>':'<span class="badge badge-danger" style="font-size:.65rem">Eliminado</span>'):'<span style="color:var(--text3);font-size:.7rem">═</span>'}</td>
    </tr>`;
  }
  if(sysRows){
    html+=`<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">⚡ Sistemas clínicos</span></div>
    <div class="card-body" style="padding:0;overflow-x:auto"><table><thead><tr><th>Sistema</th><th>V${list.length-iA}</th><th>V${list.length-iB}</th><th>Estado</th></tr></thead><tbody>${sysRows}</tbody></table></div></div>`;
  }

  // Summary banner
  var banner=`<div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
    <div class="stat-card"><div><div style="font-size:.62rem;color:var(--text3)">Total cambios</div><div style="font-size:1.4rem;font-weight:800;color:var(--primary)">${totalChanges}</div></div></div>
    <div class="stat-card"><div><div style="font-size:.62rem;color:var(--text3)">Añadidos</div><div style="font-size:1.4rem;font-weight:800;color:var(--success)">${added}</div></div></div>
    <div class="stat-card"><div><div style="font-size:.62rem;color:var(--text3)">Modificados</div><div style="font-size:1.4rem;font-weight:800;color:#8B6914">${modified}</div></div></div>
    <div class="stat-card"><div><div style="font-size:.62rem;color:var(--text3)">Eliminados</div><div style="font-size:1.4rem;font-weight:800;color:var(--danger)">${removed}</div></div></div>
  </div>`;

  el.innerHTML=banner+(html||'<div class="alert alert-info">No hay datos para comparar entre estas versiones.</div>');
}

