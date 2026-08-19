// ===== NUEVA ANALÍTICA — Formulario completo =====
var BIOMARKERS=[
  {g:'Metabolismo glucídico',items:[{n:'Glucosa',u:'mg/dL',r:'70-100'},{n:'HbA1c',u:'%',r:'4-5.7'},{n:'Insulina',u:'μUI/mL',r:'2.6-24.9'}]},
  {g:'Perfil lipídico',items:[{n:'Colesterol Total',u:'mg/dL',r:'<200'},{n:'HDL',u:'mg/dL',r:'>40'},{n:'LDL',u:'mg/dL',r:'<130'},{n:'Triglicéridos',u:'mg/dL',r:'<150'}]},
  {g:'Función hepática',items:[{n:'GOT',u:'U/L',r:'5-40'},{n:'GPT',u:'U/L',r:'7-56'},{n:'GGT',u:'U/L',r:'9-48'}]},
  {g:'Hierro',items:[{n:'Ferritina',u:'ng/mL',r:'20-200'},{n:'Hierro sérico',u:'µg/dL',r:'60-170'}]},
  {g:'Vitaminas',items:[{n:'Vitamina D',u:'ng/mL',r:'30-100'},{n:'B12',u:'pg/mL',r:'200-900'},{n:'Ácido fólico',u:'ng/mL',r:'3-17'}]},
  {g:'Hormonas',items:[{n:'TSH',u:'mUI/L',r:'0.4-4.5'},{n:'T4 libre',u:'ng/dL',r:'0.8-1.8'}]},
  {g:'Hemograma',items:[{n:'Hemoglobina',u:'g/dL',r:'12-16'},{n:'VCM',u:'fL',r:'80-100'}]},
  {g:'Renal',items:[{n:'Creatinina',u:'mg/dL',r:'0.7-1.3'},{n:'Ácido Úrico',u:'mg/dL',r:'3.5-7.2'}]},
];

function openNewAnalModal(editId){
  if(!selPat){toast('Seleccione paciente','error');return}
  var existing=editId?DB.analiticas.find(function(a){return a.id===editId}):null;
  var title=existing?'Editar analítica':'Nueva analítica';
  var today=new Date().toISOString().slice(0,10);
  openModal(`<div class="modal-header"><h3>🔬 ${title} — ${gP(selPat).nombre}</h3><button onclick="closeModal()">${IC.x}</button></div>
<div class="modal-body">
  <div class="form-row" style="margin-bottom:14px">
    <div class="form-group"><label class="form-label">Fecha</label><input type="date" id="anDate" value="${existing?existing.fecha:today}"></div>
    <div class="form-group"><label class="form-label">Ayuno</label><select id="anAyuno"><option value="true" ${existing&&existing.ayuno?'selected':''}>Sí</option><option value="false" ${existing&&!existing.ayuno?'selected':''}>No</option></select></div>
  </div>
  <p style="font-size:.72rem;color:var(--text3);margin-bottom:12px">Complete solo los valores disponibles. Los campos vacíos se omitirán.</p>
  ${BIOMARKERS.map(g=>`<div style="margin-bottom:14px"><div style="font-size:.72rem;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${g.g}</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:6px">
  ${g.items.map(b=>{var prev=existing?existing.marcadores.find(function(m){return m.nombre===b.n}):null;return`<div style="display:flex;align-items:center;gap:4px"><input type="number" step="0.01" placeholder="${b.n}" class="anVal" data-name="${b.n}" data-unit="${b.u}" data-range="${b.r}" value="${prev?prev.valor:''}" style="font-size:.78rem;padding:6px 8px"><span style="font-size:.62rem;color:var(--text3)">${b.u}</span></div>`}).join('')}
  </div></div>`).join('')}
</div>
<div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="saveNewAnal(${editId||'null'})">${existing?'Actualizar':'Guardar'} analítica</button></div>`,true);
}

function editAnal(id){openNewAnalModal(id)}

function deleteAnal(id){
  var a=DB.analiticas.find(function(x){return x.id===id});
  if(!a)return;
  openModal('<div class="modal-header"><h3>⚠️ Eliminar analítica</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body"><p>¿Eliminar la analítica del <strong>'+fD(a.fecha)+'</strong> con '+a.marcadores.length+' biomarcadores?</p><p style="font-size:.78rem;color:var(--text3);margin-top:8px">Esta acción no se puede deshacer.</p></div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-danger" onclick="confirmDeleteAnal('+id+')">Eliminar</button></div>');
}
function confirmDeleteAnal(id){
  DB.analiticas=DB.analiticas.filter(function(x){return x.id!==id});
  closeModal();toast('Analítica eliminada','warning');showSaved();if(typeof autoAlertOutOfRange==='function'){var _ac=autoAlertOutOfRange(selPat);if(_ac)toast(_ac+' alerta(s) generada(s)','warning')}histTab='analiticas';navigate('historia');
}

function saveNewAnal(editId){
  var marcadores=[];
  document.querySelectorAll('.anVal').forEach(function(inp){
    if(inp.value){
      var val=parseFloat(inp.value);
      var rng=inp.dataset.range;
      var alerta=null;
      // Auto-detect alerts based on range
      if(rng.startsWith('<')){if(val>=parseFloat(rng.substring(1))*1.3)alerta='grave';else if(val>=parseFloat(rng.substring(1)))alerta='leve'}
      else if(rng.startsWith('>')){if(val<parseFloat(rng.substring(1))*0.7)alerta='grave';else if(val<parseFloat(rng.substring(1)))alerta='leve'}
      else if(rng.includes('-')){var parts=rng.split('-');var lo=parseFloat(parts[0]),hi=parseFloat(parts[1]);if(val<lo*0.7||val>hi*1.3)alerta='grave';else if(val<lo||val>hi)alerta='moderada'}
      marcadores.push({nombre:inp.dataset.name,valor:val,unidad:inp.dataset.unit,rango:rng,alerta:alerta});
    }
  });
  if(!marcadores.length){toast('Ingrese al menos un valor','error');return}
  // Calculate HOMA-IR if glucose and insulin present
  var glu=marcadores.find(m=>m.nombre==='Glucosa'),ins=marcadores.find(m=>m.nombre==='Insulina');
  if(glu&&ins){var homa=+(glu.valor*ins.valor/405).toFixed(1);marcadores.push({nombre:'HOMA-IR',valor:homa,unidad:'',rango:'<2.5',alerta:homa>3.5?'grave':homa>2.5?'moderada':null})}

  if(editId){
    var existing=DB.analiticas.find(function(a){return a.id===editId});
    if(existing){existing.fecha=$('anDate').value;existing.ayuno=$('anAyuno').value==='true';existing.marcadores=marcadores}
    closeModal();toast(marcadores.length+' biomarcadores actualizados');
  } else {
    DB.analiticas.push({id:(DB.analiticas.length?Math.max(...DB.analiticas.map(function(a){return a.id}))+1:1),pacienteId:selPat,fecha:$('anDate').value,ayuno:$('anAyuno').value==='true',marcadores:marcadores});
    closeModal();toast(marcadores.length+' biomarcadores registrados');
  }
  showSaved();histTab='analiticas';navigate('historia');
}

// ===== GENERAR PDF REAL — Plan alimentario imprimible =====
function generatePlanPDF(planId){
  var plan=mealPlans.find(mp=>mp.id===planId);if(!plan)return;
  var p=gP(plan.pacienteId);if(!p)return;
  var w=window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Plan Alimentario — ${p.nombre} ${p.apellidos}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;padding:40px;color:#1A1A1A;font-size:13px;line-height:1.6}
h1{font-size:22px;font-weight:800;letter-spacing:-.5px;margin-bottom:4px}h2{font-size:16px;font-weight:700;margin:20px 0 8px;color:#6B9080;border-bottom:2px solid #EDF2EF;padding-bottom:4px}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #E8E8EC}
.meta{color:#555;font-size:12px}.macro{display:flex;gap:24px;margin:12px 0;font-size:14px;font-weight:600}
.meal{margin-bottom:12px;padding:10px 14px;background:#F9F9FB;border-radius:8px;border-left:3px solid #6B9080}
.meal h3{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6B9080;margin-bottom:4px}
.meal p{font-size:13px;color:#333}.meal .kcal{font-size:11px;color:#999;margin-top:2px}
.footer{margin-top:32px;padding-top:12px;border-top:1px solid #E8E8EC;font-size:10px;color:#999;text-align:center}
@media print{body{padding:20px}}</style></head><body>
<div class="header"><div><h1>🌿 Plan Alimentario</h1><div class="meta">${plan.nombre} · Creado: ${fD(plan.fechaCreacion)}</div></div>
<div style="text-align:right"><strong>${p.nombre} ${p.apellidos}</strong><div class="meta">DNI: ${p.dni} · ${age(p.fechaNacimiento)} años · ${p.sexo}</div></div></div>
<div class="macro"><span>🔥 ${plan.kcalObjetivo} kcal/día</span><span style="color:#5B7CF7">P: ${plan.protG}g</span><span style="color:#D97706">G: ${plan.grasasG}g</span><span style="color:#46A758">HC: ${plan.hcG}g</span><span>Fibra: ${plan.fibraG}g</span><span>Agua: ${plan.aguaL}L</span></div>
${plan.dias.map(d=>`<h2>📅 ${d.dia}</h2>${d.comidas.length?d.comidas.map(c=>`<div class="meal"><h3>${c.tipo}</h3><p>${c.items.map(i=>i.nombre+' '+i.gramos+'g').join(' · ')}</p><div class="kcal">${c.kcal} kcal · P:${c.p}g · G:${c.g}g · HC:${c.h}g</div></div>`).join(''):'<p style="color:#999;font-size:12px;padding:8px">Sin comidas asignadas</p>'}`).join('')}
<div class="footer">Veridia HealthTech · Lic. Antonella Caverzan · Generado el ${new Date().toLocaleDateString('es')} · Desarrollado por Andrés Galeano</div>
<scr'+'ipt>setTimeout(()=>window.print(),500)</scr'+'ipt></body></html>`);
}

// ===== MODO OSCURO =====
var darkMode=false;
function toggleDarkMode(){
  darkMode=!darkMode;
  document.documentElement.classList.toggle('dark',darkMode);
  try{localStorage.setItem('veridia_dark',darkMode?'1':'0')}catch(e){console.warn('[Veridia]',e.message||e)}
  toast(darkMode?'Modo oscuro activado 🌙':'Modo claro activado ☀️');
}
// Auto-load dark mode preference
try{if(localStorage.getItem('veridia_dark')==='1'){darkMode=true;document.documentElement.classList.add('dark')}}catch(e){console.warn('[Veridia]',e.message||e)}

// ===== FEATURE A: ACTA DE CONSULTA =====
function openConsultActa(apptId){
  var a=DB.appointments.find(function(x){return x.id===apptId});if(!a)return;
  var p=gP(a.pacienteId);if(!p)return;
  openModal('<div class="modal-header"><h3>📋 Acta de consulta — '+p.nombre+' '+p.apellidos+'</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body" style="max-height:70vh;overflow-y:auto">'
  +'<div class="alert alert-info" style="margin-bottom:14px;font-size:.78rem">'+fD(a.fecha)+' · '+a.hora+' · '+a.tipo+'</div>'
  +'<div class="form-group"><label class="form-label">Motivo de la consulta</label><textarea id="actaMotivo" rows="2" placeholder="Motivo principal de esta visita...">'+((a.asunto||a.tipo)||'')+'</textarea></div>'
  +'<div class="form-group"><label class="form-label">Hallazgos clínicos</label><textarea id="actaHallazgos" rows="3" placeholder="Peso, medidas, estado general, observaciones..."></textarea></div>'
  +'<div class="form-group"><label class="form-label">Indicaciones y acuerdos</label><textarea id="actaAcuerdos" rows="3" placeholder="Cambios en el plan, nuevas pautas, objetivos acordados..."></textarea></div>'
  +'<div class="form-group"><label class="form-label">Próximos pasos</label><textarea id="actaProximos" rows="2" placeholder="Análisis a pedir, próxima consulta, derivaciones..."></textarea></div>'
  +'<div class="form-row"><div class="form-group"><label class="form-label">Duración real (min)</label><input type="number" id="actaDuracion" value="'+(consultTimerMinutes()||a.duracion||45)+'"></div>'
  +'<div class="form-group"><label class="form-label">Próxima cita sugerida</label><select id="actaProxCita"><option value="">No agendar</option><option value="7">En 1 semana</option><option value="15" selected>En 15 días</option><option value="30">En 1 mes</option><option value="60">En 2 meses</option><option value="90">En 3 meses</option></select></div></div>'
  +'</div>'
  +'<div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="saveConsultActa('+apptId+')">💾 Guardar acta y cerrar consulta</button></div>',true);
}

function saveConsultActa(apptId){
  var a=DB.appointments.find(function(x){return x.id===apptId});if(!a)return;
  var p=gP(a.pacienteId);if(!p)return;
  // Save acta data into the appointment
  a.acta={
    motivo:$('actaMotivo')?$('actaMotivo').value:'',
    hallazgos:sanitize($('actaHallazgos')?$('actaHallazgos').value:''),
    acuerdos:sanitize($('actaAcuerdos')?$('actaAcuerdos').value:''),
    proximos:sanitize($('actaProximos')?$('actaProximos').value:''),
    duracionReal:parseInt(($('actaDuracion')||{}).value)||45,
    fecha:new Date().toISOString(),
    profesional:currentUser?currentUser.name:'—'
  };
  a.estado='Realizada';
  a.duracion=a.acta.duracionReal;
  // Auto-generate invoice
  var inv=generateInvoiceFromConsult(apptId);
  // Schedule next appointment
  var diasNext=parseInt(($('actaProxCita')||{}).value)||0;
  if(diasNext>0){
    var nextDate=new Date(a.fecha);nextDate.setDate(nextDate.getDate()+diasNext);
    var nextFecha=nextDate.toISOString().slice(0,10);
    DB.appointments.push({id:DB.nextAId++,pacienteId:a.pacienteId,profesional:a.profesional,fecha:nextFecha,hora:a.hora,tipo:'Revisión',asunto:'Seguimiento',estado:'Pendiente',pago:'Pendiente',precio:35,duracion:45,color:'review'});
  }
  stopConsultTimer();
  closeModal();
  auditAction('CREATE','Acta de consulta',p.nombre+' '+p.apellidos);
  toast('Consulta cerrada'+(inv?' · Factura '+inv.numero:'')+(diasNext?' · Próxima cita agendada':''));
  showSaved();updAlertDot();navigate('agenda');
}

// ===== FEATURE B: COMPARADOR DE ANALÍTICAS =====
function openAnalyticsCompare(patId){
  var anals=DB.analiticas.filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)});
  if(anals.length<2){toast('Se necesitan al menos 2 analíticas para comparar','warning');return}
  openModal('<div class="modal-header"><h3>📊 Comparar analíticas</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body">'
  +'<div style="display:flex;gap:10px;margin-bottom:14px;align-items:center">'
  +'<select id="cmpAnalA" style="flex:1" onchange="renderAnalCompare('+patId+')">'+anals.map(function(a,i){return'<option value="'+i+'"'+(i===1?' selected':'')+'>'+fD(a.fecha)+(a.ayuno?' (Ayuno)':'')+'</option>'}).join('')+'</select>'
  +'<span style="font-weight:700;color:var(--text3)">vs</span>'
  +'<select id="cmpAnalB" style="flex:1" onchange="renderAnalCompare('+patId+')">'+anals.map(function(a,i){return'<option value="'+i+'"'+(i===0?' selected':'')+'>'+fD(a.fecha)+(a.ayuno?' (Ayuno)':'')+'</option>'}).join('')+'</select>'
  +'</div>'
  +'<div id="analCmpBody"></div></div>',true);
  setTimeout(function(){renderAnalCompare(patId)},50);
}

function renderAnalCompare(patId){
  var el=$('analCmpBody');if(!el)return;
  var anals=DB.analiticas.filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)});
  var iA=parseInt(($('cmpAnalA')||{}).value)||0;
  var iB=parseInt(($('cmpAnalB')||{}).value)||0;
  if(iA===iB){el.innerHTML='<div class="alert alert-info">Seleccione dos fechas diferentes</div>';return}
  var aA=anals[iA],aB=anals[iB];if(!aA||!aB)return;
  // Build marker map
  var markersA={},markersB={};
  aA.marcadores.forEach(function(m){markersA[m.nombre]=m});
  aB.marcadores.forEach(function(m){markersB[m.nombre]=m});
  var allNames=[...new Set([...Object.keys(markersA),...Object.keys(markersB)])];

  el.innerHTML='<table><thead><tr><th>Biomarcador</th><th style="text-align:right">'+fD(aA.fecha)+'</th><th style="text-align:right">'+fD(aB.fecha)+'</th><th>Cambio</th><th>Rango</th></tr></thead><tbody>'
  +allNames.map(function(name){
    var mA=markersA[name],mB=markersB[name];
    var vA=mA?mA.valor:'—',vB=mB?mB.valor:'—';
    var diff='',color='';
    if(mA&&mB&&typeof mA.valor==='number'&&typeof mB.valor==='number'){
      var delta=mB.valor-mA.valor;
      var pct=mA.valor?Math.round(delta/mA.valor*100):0;
      // Determine if change is good or bad based on alert status
      var improved=(mA.alerta&&!mB.alerta)||(mA.alerta==='grave'&&mB.alerta==='moderada');
      var worsened=(!mA.alerta&&mB.alerta)||(mA.alerta==='moderada'&&mB.alerta==='grave');
      color=improved?'var(--success)':worsened?'var(--danger)':'var(--text3)';
      diff='<span style="color:'+color+';font-weight:700">'+(delta>0?'↑ +':'↓ ')+delta.toFixed(1)+' ('+pct+'%)</span>';
    }
    var alertA=mA&&mA.alerta?'badge-'+(mA.alerta==='grave'?'danger':'warning'):'badge-success';
    var alertB=mB&&mB.alerta?'badge-'+(mB.alerta==='grave'?'danger':'warning'):'badge-success';
    return '<tr style="'+(mA?.alerta||mB?.alerta?'background:var(--warning-light)':'')+'">'
    +'<td style="font-weight:600">'+name+'</td>'
    +'<td style="text-align:right"><span class="badge '+alertA+'" style="font-size:.65rem">'+vA+(mA?' '+mA.unidad:'')+'</span></td>'
    +'<td style="text-align:right"><span class="badge '+alertB+'" style="font-size:.65rem">'+vB+(mB?' '+mB.unidad:'')+'</span></td>'
    +'<td>'+diff+'</td>'
    +'<td style="font-size:.68rem;color:var(--text3)">'+(mA?mA.rango:mB?mB.rango:'')+'</td></tr>';
  }).join('')+'</tbody></table>';
}

// ===== FEATURE C: TEMPORIZADOR DE CONSULTA =====
var _consultStart=null,_consultInterval=null,_consultPaused=false;

function startConsultTimer(){
  _consultStart=Date.now();_consultPaused=false;
  var el=$('consultTimer');if(el)el.style.display='block';
  _consultInterval=setInterval(updateConsultTimer,1000);
}

function updateConsultTimer(){
  if(_consultPaused)return;
  var el=$('consultTimer');if(!el)return;
  var elapsed=Math.floor((Date.now()-_consultStart)/1000);
  var m=Math.floor(elapsed/60),s=elapsed%60;
  el.textContent='⏱️ '+(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
  if(m>=50)el.style.color='var(--danger)'; // Alert if over 50 min
  else if(m>=30)el.style.color='var(--warning)';
}

function toggleConsultTimer(){
  _consultPaused=!_consultPaused;
  var el=$('consultTimer');
  if(el)el.style.opacity=_consultPaused?'0.5':'1';
}

function stopConsultTimer(){
  clearInterval(_consultInterval);_consultInterval=null;
  var el=$('consultTimer');if(el)el.style.display='none';
  _consultStart=null;
}

function consultTimerMinutes(){
  if(!_consultStart)return 0;
  return Math.round((Date.now()-_consultStart)/60000);
}

// ===== FEATURE D: SIGUIENTE CITA AL CERRAR (integrated into markDone) =====

// Override markDone to open Acta instead of just marking done
var _origMarkDone=null;

// ===== CONSENTIMIENTO INFORMADO RGPD =====
function openConsentForm(patId){
  var p=gP(patId);if(!p)return;
  openModal('<div class="modal-header"><h3>📋 Consentimiento informado — RGPD</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body" style="max-height:70vh;overflow-y:auto">'
  +'<div style="font-size:.78rem;line-height:1.7;color:var(--text2)">'
  +'<p><strong>Paciente:</strong> '+p.nombre+' '+p.apellidos+(p.dni?' · DNI: '+p.dni:'')+'</p>'
  +'<hr style="margin:12px 0;border:0;border-top:1px solid var(--border)">'
  +'<p>De conformidad con el <strong>Reglamento General de Protección de Datos (RGPD) UE 2016/679</strong> y la <strong>LOPD-GDD 3/2018</strong>, le informamos que:</p>'
  +'<ul style="padding-left:18px;margin:10px 0"><li>Sus datos de salud serán tratados con fines de <strong>gestión clínica nutricional</strong>.</li>'
  +'<li>El responsable del tratamiento es el profesional sanitario titular de este consultorio.</li>'
  +'<li>Los datos se almacenan de forma segura y no se cederán a terceros sin su consentimiento.</li>'
  +'<li>Puede ejercer sus derechos de <strong>acceso, rectificación, supresión, portabilidad y oposición</strong> en cualquier momento.</li>'
  +'<li>Todas las acciones quedan registradas en el log de auditoría del sistema.</li></ul>'
  +'<p>El tratamiento incluye: datos personales, historia clínica, mediciones antropométricas, analíticas, planes alimentarios y comunicaciones.</p>'
  +'</div>'
  +'<div style="margin-top:16px;padding:14px;background:var(--surface2);border-radius:var(--radius-xs)">'
  +'<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:.82rem"><input type="checkbox" id="consentCheck" style="margin-top:3px;width:18px;height:18px"> Declaro haber leído y comprendido la información sobre protección de datos. Consiento el tratamiento de mis datos de salud para los fines descritos.</label>'
  +'</div>'
  +'<div style="margin-top:12px"><label class="form-label">Firma digital (escriba su nombre completo)</label><input id="consentSign" placeholder="'+p.nombre+' '+p.apellidos+'" style="font-size:1rem;font-weight:700;letter-spacing:.5px"></div>'
  +'</div>'
  +'<div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="saveConsent('+patId+')">✅ Firmar consentimiento</button></div>',true);
}

function saveConsent(patId){
  var check=$('consentCheck'),sign=$('consentSign');
  if(!check||!check.checked){toast('Debe marcar la casilla de consentimiento','error');return}
  if(!sign||sign.value.trim().length<3){toast('Debe firmar con su nombre completo','error');return}
  var p=gP(patId);
  if(!p.consents)p.consents=[];
  p.consents.push({fecha:new Date().toISOString(),firma:sign.value.trim(),ip:'local',profesional:currentUser?currentUser.name:'—'});
  auditAction('CREATE','Consentimiento RGPD',p.nombre+' '+p.apellidos);
  closeModal();toast('Consentimiento firmado ✅');showSaved();
  if(curMod==='historia')navigate('historia');
}

// #24 Tendencia de biomarcadores
function renderBiomarkerTrend(patId,markerName){
  var anals=DB.analiticas.filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return a.fecha.localeCompare(b.fecha)});
  var data=[];
  anals.forEach(function(a){
    var m=a.marcadores.find(function(x){return x.nombre===markerName});
    if(m) data.push({label:fD(a.fecha).slice(0,5),value:m.valor});
  });
  if(data.length<2) return '<p style="font-size:.72rem;color:var(--text3)">Minimo 2 analiticas para ver tendencia</p>';
  return svgLineChart({data:data,width:380,height:140,unit:' '+((anals[0].marcadores.find(function(x){return x.nombre===markerName})||{}).unidad||''),color:'var(--accent)',title:markerName});
}

// #27 Comparar formulas lado a lado
function renderFormulaComparison(peso,altura,edad,sexo){
  var mifflin=10*peso+6.25*altura-5*edad+(sexo==='M'?5:-161);
  var hb=sexo==='M'?66.5+13.75*peso+5.003*altura-6.775*edad:655.1+9.563*peso+1.85*altura-4.676*edad;
  var owen=sexo==='M'?879+10.2*peso:795+7.18*peso;
  var cunningham=500+22*(peso*(1-0.25)); // Asume 25% grasa si no hay dato
  var espen25=25*peso;

  var formulas=[
    {name:'Mifflin-St Jeor',geb:Math.round(mifflin),ref:'ESPEN recomendada'},
    {name:'Harris-Benedict',geb:Math.round(hb),ref:'Clasica (1919)'},
    {name:'Owen',geb:Math.round(owen),ref:'Simplificada'},
    {name:'Cunningham',geb:Math.round(cunningham),ref:'Masa magra'},
    {name:'ESPEN directo',geb:Math.round(espen25),ref:'25 kcal/kg'}
  ];

  return '<div class="card" style="margin-top:14px"><div class="card-header"><span class="card-title">Comparacion de formulas</span></div><div class="card-body" style="padding:0"><table><thead><tr><th>Formula</th><th>GEB (kcal)</th><th>GET x1.55</th><th>Ref</th></tr></thead><tbody>'
  +formulas.map(function(f){return '<tr><td><strong>'+f.name+'</strong></td><td style="font-weight:700;color:var(--primary)">'+f.geb+'</td><td>'+Math.round(f.geb*1.55)+'</td><td style="font-size:.68rem;color:var(--text3)">'+f.ref+'</td></tr>'}).join('')
  +'</tbody></table></div></div>';
}

// #18 Comparar mediciones antropométricas lado a lado
function compareAntroMeasurements(patId){
  var antros=DB.antropometrias.filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)});
  if(antros.length<2){toast('Minimo 2 mediciones para comparar','info');return}
  var a=antros[0],b=antros[1];
  var fields=[{l:'Peso',k:'peso',u:'kg'},{l:'IMC',k:'imc',u:''},{l:'Cintura',k:'cintura',u:'cm'},{l:'Cadera',k:'cadera',u:'cm'},{l:'% Grasa',k:'grasaCorporal',u:'%'},{l:'M. muscular',k:'masaMuscular',u:'kg'},{l:'Gr. visceral',k:'grasaVisceral',u:''},{l:'Pantorrilla',k:'pantorrilla',u:'cm'}];

  openModal('<div class="modal-header"><h3>Comparar mediciones</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body">'
  +'<table><thead><tr><th>Medida</th><th>'+fD(b.fecha)+'</th><th>'+fD(a.fecha)+'</th><th>Delta</th></tr></thead><tbody>'
  +fields.map(function(f){
    var va=a[f.k]||0,vb=b[f.k]||0,delta=Math.round((va-vb)*10)/10;
    var color=f.k==='peso'||f.k==='grasaCorporal'||f.k==='grasaVisceral'||f.k==='cintura'?(delta<0?'var(--success)':'var(--danger)'):(delta>0?'var(--success)':'var(--danger)');
    return'<tr><td><strong>'+f.l+'</strong></td><td>'+vb+f.u+'</td><td>'+va+f.u+'</td><td style="font-weight:700;color:'+color+'">'+(delta>0?'+':'')+delta+f.u+'</td></tr>';
  }).join('')
  +'</tbody></table></div><div class="modal-footer"><button class="btn btn-primary" onclick="closeModal()">Cerrar</button></div>');
}

// #25 Importar analíticas (template CSV)
function downloadAnalTemplate(){
  var csv='Biomarcador,Valor,Unidad,Rango\nGlucosa,,mg/dL,70-100\nHbA1c,,%,4-5.7\nColesterol Total,,mg/dL,<200\nHDL,,mg/dL,>40\nLDL,,mg/dL,<130\nTrigliceridos,,mg/dL,<150\nFerritina,,ng/mL,20-200\nVitamina D,,ng/mL,30-100\nTSH,,mUI/L,0.4-4.5\nHemoglobina,,g/dL,12-16';
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download='analitica_template.csv';a.click();
  toast('Template CSV descargado. Complete los valores y re-importe.');
}

// #26 Valores referencia por edad/sexo (dinámicos)
function getRefRange(marker,edad,sexo){
  var ranges={
    'Hemoglobina':{M:{min:13.5,max:17.5},F:{min:12,max:16},child:{min:11,max:14}},
    'Ferritina':{M:{min:20,max:300},F:{min:15,max:200},child:{min:10,max:120}},
    'Creatinina':{M:{min:0.7,max:1.3},F:{min:0.6,max:1.1}},
    'TSH':{all:{min:0.4,max:4.5},elderly:{min:0.4,max:7.0}}
  };
  var r=ranges[marker];if(!r)return null;
  if(edad<18&&r.child)return r.child;
  if(edad>=65&&r.elderly)return r.elderly;
  if(r[sexo])return r[sexo];
  return r.all||r.M||null;
}

// #28 Calorimetría indirecta
function calcCalorimetriaIndirecta(vo2,vco2){
  // Weir equation: REE = (3.941 × VO2 + 1.106 × VCO2) × 1440
  if(!vo2||!vco2)return null;
  var ree=Math.round((3.941*vo2+1.106*vco2)*1440);
  var rq=Math.round(vco2/vo2*100)/100;
  return{
    ree:ree,rq:rq,
    substrate:rq<0.7?'Cetosis/ayuno':rq<=0.85?'Oxidacion lipidica predominante':rq<=1.0?'Mixta (equilibrada)':'Lipogenesis (exceso HC)',
    note:'Gold standard ESPEN [ICU Rec. 5]',
    ref:'Weir 1949'
  };
}

// AL2: Import analytics from CSV
function importAnalCSV(){
  var input=document.createElement('input');input.type='file';input.accept='.csv';
  input.onchange=function(){
    var reader=new FileReader();
    reader.onload=function(e){
      var lines=e.target.result.split('\n').filter(function(l){return l.trim()});
      if(lines.length<2){toast('CSV vacío o sin datos','error');return}
      var headers=lines[0].split(';').map(function(h){return h.trim()});
      var marcadores=[];
      for(var i=1;i<lines.length;i++){
        var cols=lines[i].split(';').map(function(c){return c.trim()});
        if(cols.length>=3){
          marcadores.push({nombre:cols[0]||'',valor:parseFloat(cols[1])||0,unidad:cols[2]||'',rango:cols[3]||'',alerta:null});
        }
      }
      if(!marcadores.length){toast('No se encontraron marcadores válidos','error');return}
      DB.analiticas.push({id:(DB.analiticas.length?Math.max.apply(null,DB.analiticas.map(function(a){return a.id}))+1:1),
        pacienteId:selPat,fecha:new Date().toISOString().slice(0,10),ayuno:false,marcadores:marcadores});
      saveData();toast(marcadores.length+' marcadores importados','success');navigate('analiticas');
    };
    reader.readAsText(input.files[0]);
  };
  input.click();
}

// AL3: Auto-generate alerts for critical out-of-range biomarkers
function autoAlertOutOfRange(patId){
  var anals=DB.analiticas.filter(function(a){return a.pacienteId===patId});
  if(!anals.length)return 0;
  var latest=anals.sort(function(a,b){return b.fecha.localeCompare(a.fecha)})[0];
  var count=0;
  latest.marcadores.forEach(function(m){
    if(m.alerta==='grave'){
      var exists=DB.alerts.find(function(a){return a.pacienteId===patId&&a.mensaje.includes(m.nombre)&&a.estado==='pendiente'});
      if(!exists){
        DB.alerts.push({id:Date.now()+count,pacienteId:patId,tipo:'Biomarcador',
          severidad:'grave',mensaje:m.nombre+': '+m.valor+' '+m.unidad+' (rango: '+m.rango+')',
          recomendacion:'Verificar valor y considerar intervención nutricional.',
          fecha:latest.fecha,estado:'pendiente'});
        count++;
      }
    }
  });
  if(count)saveData();
  return count;
}

// ═══ ÍNDICES CLÍNICOS AUTO-CALCULADOS ═══
// Calculados a partir de biomarcadores registrados en analíticas + datos antropométricos

function calcClinicalIndices(patId){
  var p=gP(patId);if(!p)return[];
  var anals=DB.analiticas.filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)});
  var antros=DB.antropometrias.filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)});
  var lastAnal=anals[0];var lastAntro=antros[0];
  if(!lastAnal)return[];

  var markers={};
  lastAnal.marcadores.forEach(function(m){markers[m.nombre.toLowerCase()]=m.valor});

  var indices=[];

  // 1. HOMA-IR (Resistencia insulínica)
  var glucosa=markers['glucosa']||markers['glucosa en ayunas']||markers['glucemia'];
  var insulina=markers['insulina']||markers['insulina basal']||markers['insulina en ayunas'];
  if(glucosa&&insulina){
    var homa=+(glucosa*insulina/405).toFixed(2);
    var homaStatus=homa<1.96?'Normal':homa<2.5?'Límite':homa<3.8?'Resistencia moderada':'Resistencia severa';
    var homaColor=homa<1.96?'#16a34a':homa<2.5?'#ca8a04':'#dc2626';
    indices.push({name:'HOMA-IR',value:homa,unit:'',status:homaStatus,color:homaColor,ref:'<1.96 normal · 2.5-3.8 RI moderada · >3.8 RI severa',formula:'Glucosa (mg/dL) × Insulina (µUI/mL) / 405'});
  }

  // 2. Cociente TG/c-HDL (riesgo aterogénico)
  var tg=markers['triglicéridos']||markers['trigliceridos']||markers['tg'];
  var hdl=markers['hdl']||markers['hdl-c']||markers['c-hdl'];
  if(tg&&hdl&&hdl>0){
    var ratio=+(tg/hdl).toFixed(2);
    var ratioStatus=ratio<2?'Bajo riesgo':ratio<3.5?'Riesgo moderado':'Alto riesgo';
    var ratioColor=ratio<2?'#16a34a':ratio<3.5?'#ca8a04':'#dc2626';
    indices.push({name:'TG/c-HDL',value:ratio,unit:'',status:ratioStatus,color:ratioColor,ref:'<2 bajo riesgo · 2-3.5 moderado · >3.5 alto riesgo aterogénico',formula:'Triglicéridos / HDL-colesterol'});
  }

  // 3. FLI — Fatty Liver Index (esteatosis hepática)
  var ggt=markers['ggt']||markers['gamma gt']||markers['gamma-gt'];
  if(tg&&ggt&&lastAntro&&lastAntro.cintura){
    var imc=lastAntro.imc;var cintura=lastAntro.cintura;
    var e1=0.953*Math.log(tg)+0.139*imc+0.718*Math.log(ggt)+0.053*cintura-15.745;
    var fli=+(100*Math.exp(e1)/(1+Math.exp(e1))).toFixed(1);
    var fliStatus=fli<30?'Descarta esteatosis':fli<60?'Indeterminado':'Sugiere esteatosis';
    var fliColor=fli<30?'#16a34a':fli<60?'#ca8a04':'#dc2626';
    indices.push({name:'FLI (Fatty Liver Index)',value:fli,unit:'',status:fliStatus,color:fliColor,ref:'<30 descarta · 30-60 indeterminado · ≥60 sugiere esteatosis',formula:'Basado en TG, IMC, GGT, cintura'});
  }

  // 4. FIB-4 (fibrosis hepática)
  var ast=markers['ast']||markers['got']||markers['aspartato aminotransferasa'];
  var alt=markers['alt']||markers['gpt']||markers['alanina aminotransferasa'];
  var plaquetas=markers['plaquetas']||markers['recuento de plaquetas'];
  var edad=age(p.fechaNacimiento);
  if(ast&&alt&&plaquetas&&plaquetas>0&&alt>0){
    var fib4=+(edad*ast/(plaquetas*Math.sqrt(alt))).toFixed(2);
    var fib4Status=fib4<1.3?'Baja probabilidad fibrosis':fib4<2.67?'Indeterminado':'Alta probabilidad fibrosis';
    var fib4Color=fib4<1.3?'#16a34a':fib4<2.67?'#ca8a04':'#dc2626';
    indices.push({name:'FIB-4 (Fibrosis)',value:fib4,unit:'',status:fib4Status,color:fib4Color,ref:'<1.3 baja prob. · 1.3-2.67 indeterminado · >2.67 alta prob.',formula:'Edad × AST / (Plaquetas × √ALT)'});
  }

  // 5. PCR como indicador inflamatorio
  var pcr=markers['pcr']||markers['proteína c reactiva']||markers['proteina c reactiva']||markers['pcr-us'];
  if(pcr!==undefined){
    var pcrStatus=pcr<1?'Bajo riesgo':pcr<3?'Riesgo moderado':'Alto riesgo / inflamación';
    var pcrColor=pcr<1?'#16a34a':pcr<3?'#ca8a04':'#dc2626';
    indices.push({name:'PCR (Proteína C Reactiva)',value:pcr,unit:'mg/L',status:pcrStatus,color:pcrColor,ref:'<1 bajo · 1-3 moderado · >3 alto riesgo cardiovascular / inflamación',formula:'Medición directa'});
  }

  return indices;
}

// Render clinical indices card
function renderClinicalIndices(patId){
  var indices=calcClinicalIndices(patId);
  if(!indices.length)return '';
  return '<div class="card" style="margin-bottom:16px;border-top:3px solid #6366f1"><div class="card-header"><span class="card-title" style="font-size:.85rem">🔬 Índices Clínicos Calculados</span>'
  +'<span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.68rem">Auto-calculados</span></div>'
  +'<div class="card-body"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">'
  +indices.map(function(idx){
    return '<div style="padding:14px;border-radius:10px;border:1px solid var(--border);border-left:4px solid '+idx.color+'">'
    +'<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-bottom:4px">'+idx.name+'</div>'
    +'<div style="font-size:1.4rem;font-weight:800;color:'+idx.color+'">'+idx.value+' <span style="font-size:.72rem;font-weight:400;color:var(--text3)">'+idx.unit+'</span></div>'
    +'<div style="font-size:.68rem;font-weight:700;color:'+idx.color+';margin-top:2px">'+idx.status+'</div>'
    +'<div style="font-size:.6rem;color:var(--text3);margin-top:4px" title="'+idx.formula+'">Ref: '+idx.ref+'</div>'
    +'</div>';
  }).join('')
  +'</div></div></div>';
}

// ===== SCREENING TOOLS — Integrated from veridia-utils =====

// Render MUST screening for a patient
function renderMUSTScreening(patId){
  var antros=DB.antropometrias.filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)});
  if(!antros.length)return '<div style="text-align:center;padding:20px;color:var(--text-secondary);font-size:.82rem">📊 Sin datos antropométricos para screening MUST</div>';
  var latest=antros[0];
  var imc=latest.imc||0;
  var perdida=0;
  if(antros.length>=2){
    var prev=antros.find(function(a){
      var d1=new Date(latest.fecha),d2=new Date(a.fecha);
      var diffMonths=(d1-d2)/(1000*60*60*24*30);
      return diffMonths>=1&&diffMonths<=6&&a.peso>0;
    });
    if(prev&&prev.peso>0)perdida=Math.round((prev.peso-latest.peso)/prev.peso*100*10)/10;
  }
  if(typeof calcMUST!=='function')return '';
  var must=calcMUST(imc,Math.max(0,perdida),false);
  return '<div class="card" style="margin-bottom:16px;border-top:3px solid '+must.color+'"><div class="card-header"><span class="card-title" style="font-size:.85rem">🩺 Screening MUST</span>'
  +'<span class="badge" style="background:'+must.color+';color:#fff;font-size:.68rem">Riesgo '+must.risk+'</span></div>'
  +'<div class="card-body">'
  +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px">'
  +'<div style="text-align:center;padding:12px;background:var(--surface2);border-radius:10px"><div style="font-size:1.3rem;font-weight:800">'+imc.toFixed(1)+'</div><div style="font-size:.6rem;text-transform:uppercase;color:var(--text-secondary);font-weight:600">IMC</div></div>'
  +'<div style="text-align:center;padding:12px;background:var(--surface2);border-radius:10px"><div style="font-size:1.3rem;font-weight:800">'+perdida.toFixed(1)+'%</div><div style="font-size:.6rem;text-transform:uppercase;color:var(--text-secondary);font-weight:600">Pérdida peso</div></div>'
  +'<div style="text-align:center;padding:12px;background:'+must.color+';border-radius:10px;color:#fff"><div style="font-size:1.3rem;font-weight:800">'+must.score+'</div><div style="font-size:.6rem;text-transform:uppercase;font-weight:600">Score MUST</div></div>'
  +'</div>'
  +'<div style="padding:12px;background:var(--surface2);border-radius:10px;font-size:.82rem;line-height:1.6"><strong>Plan:</strong> '+must.plan+'</div>'
  +'</div></div>';
}

// Render SNAQ quick screening
function renderSNAQScreening(){
  if(typeof calcSNAQ!=='function')return '';
  return '<div class="card" style="margin-bottom:16px;border-top:3px solid var(--accent)"><div class="card-header"><span class="card-title" style="font-size:.85rem">📋 Screening SNAQ</span></div>'
  +'<div class="card-body">'
  +'<div style="display:grid;gap:10px;margin-bottom:14px">'
  +'<label style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface2);border-radius:8px;cursor:pointer"><input type="checkbox" id="snaqQ1"> <span style="font-size:.82rem">¿Perdió peso involuntariamente? (>3 kg/mes o >6 kg/6 meses)</span></label>'
  +'<label style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface2);border-radius:8px;cursor:pointer"><input type="checkbox" id="snaqQ2"> <span style="font-size:.82rem">¿Disminuyó el apetito en el último mes?</span></label>'
  +'<label style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface2);border-radius:8px;cursor:pointer"><input type="checkbox" id="snaqQ3"> <span style="font-size:.82rem">¿Usa suplementos nutricionales orales o alimentación por sonda?</span></label>'
  +'</div>'
  +'<button class="btn btn-primary btn-sm" onclick="evalSNAQ()" style="border-radius:8px">Evaluar SNAQ</button>'
  +'<div id="snaqResult"></div>'
  +'</div></div>';
}

function evalSNAQ(){
  var q1=$('snaqQ1')?$('snaqQ1').checked:false;
  var q2=$('snaqQ2')?$('snaqQ2').checked:false;
  var q3=$('snaqQ3')?$('snaqQ3').checked:false;
  var r=calcSNAQ(q1,q2,q3);
  var el=$('snaqResult');
  if(el)el.innerHTML='<div style="margin-top:12px;padding:14px;border-radius:10px;border-left:4px solid '+r.color+';background:var(--surface2)">'
  +'<div style="display:flex;align-items:center;gap:10px"><div style="font-size:1.4rem;font-weight:800;color:'+r.color+'">'+r.score+'/3</div>'
  +'<div><div style="font-size:.82rem;font-weight:700;color:'+r.color+'">Riesgo '+r.risk+'</div>'
  +'<div style="font-size:.72rem;color:var(--text-secondary)">SNAQ — Short Nutritional Assessment Questionnaire</div></div></div></div>';
}

// Render balance nitrogenado calculator
function renderBalanceN(){
  if(typeof calcBalanceNitrogenado!=='function')return '';
  return '<div class="card" style="margin-bottom:16px;border-top:3px solid #7c3aed"><div class="card-header"><span class="card-title" style="font-size:.85rem">⚖️ Balance Nitrogenado</span></div>'
  +'<div class="card-body">'
  +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px">'
  +'<div class="form-group"><label style="font-size:.7rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600">Proteína ingesta (g/día)</label><input type="number" id="bnProt" value="80" style="text-align:center"></div>'
  +'<div class="form-group"><label style="font-size:.7rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600">N urinario 24h (g)</label><input type="number" id="bnNUri" value="10" step="0.1" style="text-align:center"></div>'
  +'<div class="form-group"><label style="font-size:.7rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600">Pérdidas insensibles (g)</label><input type="number" id="bnPerds" value="3" step="0.5" style="text-align:center"></div>'
  +'</div>'
  +'<button class="btn btn-primary btn-sm" onclick="evalBalanceN()" style="border-radius:8px">Calcular balance</button>'
  +'<div id="bnResult"></div>'
  +'</div></div>';
}

function evalBalanceN(){
  var prot=+($('bnProt')||{}).value||0;
  var nuri=+($('bnNUri')||{}).value||0;
  var perds=+($('bnPerds')||{}).value||3;
  var r=calcBalanceNitrogenado(prot,nuri,perds);
  var el=$('bnResult');
  if(el)el.innerHTML='<div style="margin-top:12px;padding:14px;border-radius:10px;border-left:4px solid '+r.color+';background:var(--surface2)">'
  +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;text-align:center">'
  +'<div><div style="font-size:1.1rem;font-weight:800">'+r.nIn+'g</div><div style="font-size:.6rem;text-transform:uppercase;color:var(--text-secondary);font-weight:600">N ingreso</div></div>'
  +'<div><div style="font-size:1.1rem;font-weight:800">'+r.nOut+'g</div><div style="font-size:.6rem;text-transform:uppercase;color:var(--text-secondary);font-weight:600">N egreso</div></div>'
  +'<div><div style="font-size:1.1rem;font-weight:800;color:'+r.color+'">'+r.balance+'g</div><div style="font-size:.6rem;text-transform:uppercase;color:var(--text-secondary);font-weight:600">Balance</div></div>'
  +'<div><div style="font-size:.82rem;font-weight:700;color:'+r.color+'">'+r.status+'</div></div>'
  +'</div></div>';
}

// Render PREDIMED-14 questionnaire
function renderPREDIMED(){
  if(typeof PREDIMED_QUESTIONS==='undefined'||typeof scorePREDIMED!=='function')return '';
  return '<div class="card" style="margin-bottom:16px;border-top:3px solid #22c55e"><div class="card-header"><span class="card-title" style="font-size:.85rem">🫒 PREDIMED-14 — Adherencia Dieta Mediterránea</span></div>'
  +'<div class="card-body">'
  +'<div style="display:grid;gap:6px;margin-bottom:14px">'
  +PREDIMED_QUESTIONS.map(function(q,i){
    return '<label style="display:flex;align-items:flex-start;gap:10px;padding:8px 10px;background:var(--surface2);border-radius:8px;cursor:pointer;font-size:.78rem;line-height:1.5">'
    +'<input type="checkbox" id="pred'+i+'" style="margin-top:3px;min-width:16px">'
    +'<span>'+q.q+'</span></label>';
  }).join('')
  +'</div>'
  +'<button class="btn btn-primary btn-sm" onclick="evalPREDIMED()" style="border-radius:8px">Calcular adherencia</button>'
  +'<div id="predResult"></div>'
  +'</div></div>';
}

function evalPREDIMED(){
  var answers=[];
  for(var i=0;i<14;i++){var el=$('pred'+i);answers.push(el?el.checked:false);}
  var r=scorePREDIMED(answers);
  var el2=$('predResult');
  if(el2)el2.innerHTML='<div style="margin-top:12px;padding:14px;border-radius:10px;border-left:4px solid '+r.color+';background:var(--surface2)">'
  +'<div style="display:flex;align-items:center;gap:14px"><div style="font-size:2rem;font-weight:800;color:'+r.color+'">'+r.score+'<span style="font-size:.7rem;font-weight:400">/'+r.max+'</span></div>'
  +'<div><div style="font-size:.92rem;font-weight:700;color:'+r.color+'">Adherencia '+r.adherence+'</div>'
  +'<div style="font-size:.72rem;color:var(--text-secondary)">PREDIMED-14 — Score de dieta mediterránea</div></div></div></div>';
}
