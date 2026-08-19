// ===== HISTORIA CLÍNICA — WORKSPACE CENTRALIZADO POR PACIENTE =====
var histTab='anamnesis';
var patNotes={}; // {pacienteId: [{fecha,texto}]}
try{var _pn=JSON.parse(localStorage.getItem('veridia_db'));if(_pn&&_pn.patNotes)patNotes=_pn.patNotes}catch(e){console.warn('[Veridia]',e.message||e)}

function rHist(){
  const p=requirePatient();if(!p)return;
  // Auto-start consultation timer
  if(!_consultStart)startConsultTimer();
  const ch=DB.clinicalHistories.find(h=>h.pacienteId===p.id);
  const la=DB.antropometrias.filter(a=>a.pacienteId===p.id).sort((a,b)=>b.fecha.localeCompare(a.fecha))[0];
  const pa=DB.alerts.filter(a=>a.pacienteId===p.id&&a.estado==='pendiente');
  const ic=la?imcCat(la.imc):{l:'—',b:'badge-neutral'};
  const patAppts=DB.appointments.filter(a=>a.pacienteId===p.id&&a.estado!=='Cancelada').sort((a,b)=>b.fecha.localeCompare(a.fecha));
  const nextAppt=patAppts.find(a=>a.fecha>=new Date().toISOString().slice(0,10)&&(a.estado==='Pendiente'||a.estado==='Confirmada'));
  const patPlans=mealPlans.filter(mp=>mp.pacienteId===p.id);
  const activePlan=patPlans.find(mp=>mp.estado==='activo');

  // Audit clinical data access
  auditAction('READ','ClinicalHistory',p.nombre+' '+p.apellidos);

  $('mainContent').innerHTML=`<div class="fade-in">
<!-- Patient selector + actions -->
<div style="margin-bottom:16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
  <label style="margin:0;white-space:nowrap;font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Paciente:</label>${patSel(p.id)}
  <div style="margin-left:auto;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
    <button class="btn ${chatDB[p.id]&&chatDB[p.id].enabled?'btn-primary':'btn-outline'} btn-xs" style="border-radius:8px" onclick="toggleChat(${p.id},${chatDB[p.id]&&chatDB[p.id].enabled?'false':'true'});navigate('historia')" title="${chatDB[p.id]&&chatDB[p.id].enabled?'Desactivar chat':'Activar chat'}">${chatDB[p.id]&&chatDB[p.id].enabled?'💬 Chat ON':'⛔ Chat OFF'}</button>
    <button class="btn btn-outline btn-xs" style="border-radius:8px" onclick="openConsentForm(${p.id})" title="Consentimiento RGPD">${p.consents&&p.consents.length?'✅ RGPD':'📋 RGPD'}</button>
    <button class="btn btn-outline btn-sm" style="border-radius:8px" onclick="exportClinicalSummary(${p.id})">📤 Resumen</button>
    <button class="btn btn-outline btn-xs" style="border-radius:8px" onclick="generateClinicalReport(${p.id})" title="Informe clínico">📄 Informe</button>
    ${chatDB[p.id]&&chatDB[p.id].unread?`<span class="badge badge-primary" style="cursor:pointer" onclick="navigate('mensajes')">${chatDB[p.id].unread} msg</span>`:''}
  </div>
</div>

<!-- Patient header card — redesigned -->
<div class="card" style="border:none;background:linear-gradient(135deg,#0E7490 0%,#0891B2 50%,#22D3EE 100%);color:#fff;margin-bottom:20px;border-radius:var(--radius);overflow:hidden;position:relative">
  <div style="position:absolute;top:-30px;right:-20px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.04)"></div>
  <div class="card-body" style="padding:22px 28px;position:relative;z-index:1;display:flex;align-items:center;gap:20px;flex-wrap:wrap">
    <div class="avatar avatar-lg" style="background:rgba(255,255,255,.2);color:#fff;border:2px solid rgba(255,255,255,.3);font-size:1.3rem;width:64px;height:64px;border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ini(p.nombre,p.apellidos)}</div>
    <div style="flex:1;min-width:200px">
      <h2 style="font-size:1.2rem;font-weight:800;letter-spacing:-.3px;margin:0">${p.nombre} ${p.apellidos}</h2>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;font-size:.74rem;opacity:.85">
        <span style="display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,.15);padding:2px 8px;border-radius:6px">📋 ${p.dni}</span>
        <span style="display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,.15);padding:2px 8px;border-radius:6px">🎂 ${age(p.fechaNacimiento)}a</span>
        <span style="display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,.15);padding:2px 8px;border-radius:6px">${p.sexo==='FEMENINO'?'♀':'♂'} ${p.sexo}</span>
        <span style="display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,.15);padding:2px 8px;border-radius:6px">📱 ${p.telefono}</span>
        <span style="display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,.15);padding:2px 8px;border-radius:6px">💼 ${p.profesion||'—'}</span>
        ${p.grupoSanguineo?`<span style="display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,.2);padding:2px 8px;border-radius:6px;font-weight:700">🩸 ${p.grupoSanguineo}</span>`:''}
      </div>
    </div>
    <div style="text-align:right;flex-shrink:0">
      ${la?`<div style="font-size:2rem;font-weight:800;letter-spacing:-1px;line-height:1">${la.peso} <span style="font-size:.8rem;font-weight:400;opacity:.7">kg</span></div>
      <span style="display:inline-block;padding:3px 10px;border-radius:8px;font-size:.72rem;font-weight:700;background:rgba(255,255,255,.2);margin-top:4px">IMC ${la.imc} · ${ic.l}</span>`:'<span style="display:inline-block;padding:3px 10px;border-radius:8px;font-size:.72rem;background:rgba(255,255,255,.15)">Sin mediciones</span>'}
    </div>
  </div>
</div>

${pa.length?`<div style="padding:12px 18px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;margin-bottom:16px;display:flex;align-items:center;gap:10px">⚠️<div style="flex:1;font-size:.84rem"><strong>${pa.length} alerta(s) pendiente(s)</strong> — <a href="#" onclick="navigate('alertas');return false" style="color:#dc2626;font-weight:600">Ver alertas</a></div></div>`:''}

<!-- Quick info cards -->
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
  <div class="card" style="padding:16px;cursor:pointer;border-top:3px solid var(--primary)" onclick="histTab='mediciones';hTab('mediciones')">
    <div style="font-size:.65rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:4px">⚖️ Peso actual</div>
    <div style="font-size:1.4rem;font-weight:800;letter-spacing:-.5px;color:var(--primary)">${la?la.peso+'kg':'—'}</div>
  </div>
  <div class="card" style="padding:16px;cursor:pointer;border-top:3px solid var(--accent)" onclick="histTab='plan';hTab('plan')">
    <div style="font-size:.65rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:4px">🍽️ Plan activo</div>
    <div style="font-size:1rem;font-weight:700;color:var(--accent)">${activePlan?activePlan.kcalObjetivo+' kcal':'Sin plan'}</div>
  </div>
  <div class="card" style="padding:16px;cursor:pointer;border-top:3px solid #2563eb" onclick="histTab='citas';hTab('citas')">
    <div style="font-size:.65rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:4px">📅 Próxima cita</div>
    <div style="font-size:1rem;font-weight:700;color:#2563eb">${nextAppt?fD(nextAppt.fecha)+' '+nextAppt.hora:'Sin cita'}</div>
  </div>
  <div class="card" style="padding:16px;cursor:pointer;border-top:3px solid #6366f1" onclick="histTab='notas';hTab('notas')">
    <div style="font-size:.65rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:4px">📝 Notas</div>
    <div style="font-size:1rem;font-weight:700;color:#6366f1">${(patNotes[p.id]||[]).length} registros</div>
  </div>
</div>

<!-- Workspace tabs -->
<div class="pill-tabs" style="margin-bottom:18px" id="hTabs" role="tablist" aria-label="Pestañas de historia clínica">
  <button class="pill-tab ${histTab==='anamnesis'?'active':''}" onclick="histTab='anamnesis';hTab('anamnesis',this)">📋 Anamnesis</button>
  <button class="pill-tab ${histTab==='consultas'?'active':''}" onclick="histTab='consultas';hTab('consultas',this)">🩺 Consultas</button>
  <button class="pill-tab ${histTab==='mediciones'?'active':''}" onclick="histTab='mediciones';hTab('mediciones',this)">⚖️ Mediciones</button>
  <button class="pill-tab ${histTab==='analiticas'?'active':''}" onclick="histTab='analiticas';hTab('analiticas',this)">🔬 Analíticas</button>
  <button class="pill-tab ${histTab==='plan'?'active':''}" onclick="histTab='plan';hTab('plan',this)">🍽️ Plan</button>
  <button class="pill-tab ${histTab==='citas'?'active':''}" onclick="histTab='citas';hTab('citas',this)">📅 Citas</button>
  <button class="pill-tab ${histTab==='notas'?'active':''}" onclick="histTab='notas';hTab('notas',this)">📝 Notas</button>
  <button class="pill-tab ${histTab==='diario'?'active':''}" onclick="histTab='diario';hTab('diario',this)">📓 Diario</button>
  <button class="pill-tab ${histTab==='documentos'?'active':''}" onclick="histTab='documentos';hTab('documentos',this)">📎 Documentos</button>
  <button class="pill-tab ${histTab==='farma'?'active':''}" onclick="histTab='farma';hTab('farma',this)">💊 Farmacología</button>
  <button class="pill-tab ${histTab==='resumen'?'active':''}" onclick="histTab='resumen';hTab('resumen',this)">📊 Evolución</button>
</div>
<div id="hTabC"></div>
</div>`;
  hTab(histTab);
}

function hTab(t,el){
  histTab=t;
  if(el){document.querySelectorAll('#hTabs .pill-tab').forEach(x=>x.classList.remove('active'));el.classList.add('active')}
  else{document.querySelectorAll('#hTabs .pill-tab').forEach(x=>{x.classList.toggle('active',x.textContent.toLowerCase().includes(t.substring(0,4)))})}
  const p=gP(selPat),ch=DB.clinicalHistories.find(h=>h.pacienteId===p.id),c=$('hTabC');

  if(t==='anamnesis'){
    // NutriAnamnesis v2 — Multi-anamnesis con historial y comparación
    var anamList=DB.anamnesisData[p.id]||[];
    var anamView=window._anamView||'list';
    var anamEditIdx=window._anamEditIdx; // index in array being edited/viewed
    var anamSection=window._anamSection||'sistemas';

    if(anamView==='list'){
      // ---- MAIN LIST VIEW: show all anamnesis + action buttons ----
      c.innerHTML=`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px">
  <div><h3 style="font-size:1.05rem;font-weight:800;letter-spacing:-.3px;margin:0">📋 Anamnesis nutricional</h3>
  <p style="font-size:.74rem;color:var(--text3);margin-top:2px">${anamList.length?anamList.length+' anamnesis registrada'+(anamList.length>1?'s':''):'Sin anamnesis registrada'}</p></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    ${anamList.length>=2?`<button class="btn btn-outline btn-sm" onclick="openAnamCompare()">📊 Comparar versiones</button>`:``}
    <button class="btn btn-primary btn-sm" onclick="startNewAnam()">+ Nueva anamnesis</button>
  </div>
</div>
${anamList.length?`
<!-- Anamnesis timeline -->
<div style="position:relative;padding-left:28px">
<div style="position:absolute;left:11px;top:8px;bottom:8px;width:2px;background:var(--border);border-radius:2px"></div>
${anamList.map((a,i)=>{
  var isLast=i===anamList.length-1;
  var nSections=Object.keys(a.respuestas||{}).length;
  var nSystems=(a.sistemas||[]).length;
  var tpl=a.template?{nuevo:'Paciente nuevo',dm2:'DM2',sobrepeso:'Sobrepeso',embarazo:'Embarazo'}[a.template]||a.template:'Completa';
  return `<div style="position:relative;margin-bottom:16px">
  <div style="position:absolute;left:-28px;top:14px;width:22px;height:22px;border-radius:50%;background:${isLast?'var(--primary)':'var(--surface2)'};border:2px solid ${isLast?'var(--primary)':'var(--border)'};display:flex;align-items:center;justify-content:center">
    <span style="font-size:.6rem;color:${isLast?'#fff':'var(--text3)'}">V${anamList.length-i}</span>
  </div>
  <div class="card" style="border:${isLast?'2px solid var(--primary)':'1px solid var(--border)'}">
    <div class="card-header" style="padding:14px 18px">
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="card-title" style="margin:0">Anamnesis V${anamList.length-i}</span>
          ${isLast?'<span class="badge badge-primary" style="font-size:.65rem">Vigente</span>':'<span class="badge badge-neutral" style="font-size:.65rem">Anterior</span>'}
          <span class="badge badge-info" style="font-size:.65rem">📋 ${tpl}</span>
        </div>
        <div style="display:flex;gap:14px;margin-top:6px;font-size:.72rem;color:var(--text3)">
          <span>📅 ${fD(a.fecha)}</span>
          <span>📝 ${nSections} campo${nSections!==1?'s':''}</span>
          <span>⚡ ${nSystems} sistema${nSystems!==1?'s':''}</span>
          ${a.profesional?`<span>👩‍⚕️ ${a.profesional}</span>`:''}
        </div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-xs" title="Ver" onclick="viewAnam(${i})">👁️</button>
        ${isLast?`<button class="btn btn-ghost btn-xs" title="Editar" onclick="editAnam(${i})">${IC.edit}</button>`:''}
        <button class="btn btn-ghost btn-xs" title="Duplicar como nueva" onclick="duplicateAnam(${i})">📋</button>
      </div>
    </div>
    ${isLast?`<div class="card-body" style="padding:12px 18px;border-top:1px solid var(--border)">
      ${renderAnamQuickSummary(a,ch)}
    </div>`:''}
  </div></div>`;
}).join('')}
</div>
${renderAnamRedFlags(p)}
`:`
<!-- Empty state — call to action -->
<div class="card" style="border:2px dashed var(--border);text-align:center;padding:40px 24px">
  <div style="font-size:3rem;margin-bottom:12px">📋</div>
  <h3 style="font-size:1rem;font-weight:700;margin-bottom:6px">Sin anamnesis registrada</h3>
  <p style="font-size:.82rem;color:var(--text3);margin-bottom:20px;max-width:400px;margin-left:auto;margin-right:auto">
    Realice la primera anamnesis nutricional para ${p.nombre}. Puede usar una plantilla rápida o completar el formulario completo.
  </p>
  <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:20px">
    <button class="btn btn-primary" onclick="startNewAnam()" style="font-size:.88rem;padding:10px 24px">
      📋 Realizar anamnesis completa
    </button>
  </div>
  <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
    <span style="font-size:.72rem;font-weight:600;color:var(--text3);margin-right:4px">⚡ Plantillas rápidas:</span>
    ${[{id:'nuevo',label:'Paciente nuevo',ic:'👤'},{id:'dm2',label:'DM2',ic:'🩸'},{id:'sobrepeso',label:'Sobrepeso',ic:'⚖️'},{id:'embarazo',label:'Embarazo',ic:'🤰'}].map(t=>`<button class="btn btn-outline btn-xs" onclick="startNewAnam('${t.id}')">${t.ic} ${t.label}</button>`).join('')}
  </div>
</div>`}`;

    } else if(anamView==='form'){
      // ---- FORM VIEW: fill or edit anamnesis ----
      var isEdit=typeof anamEditIdx==='number';
      var anamDraft=window._anamDraft||{};
      var sections=[
        {id:'sistemas',l:'⚡ Sistemas',ic:'1'},
        {id:'personal',l:'👤 Personal',ic:'2'},
        {id:'motivo',l:'🎯 Motivo',ic:'3'},
        {id:'antecedentes',l:'🩺 Antecedentes',ic:'4'},
        {id:'patologia_especifica',l:'🔬 Patología',ic:'5'},
        {id:'dietetica',l:'🍽️ H. Dietética',ic:'6'},
        {id:'estilovida',l:'🌿 Estilo de vida',ic:'7'},
        {id:'recomendaciones',l:'✅ Recomendaciones',ic:'8'}
      ];
      var secIdx=sections.findIndex(s=>s.id===anamSection);

      c.innerHTML=`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
  <div style="display:flex;align-items:center;gap:10px">
    <button class="btn btn-ghost btn-sm" onclick="exitAnamForm()">← Volver</button>
    <h3 style="font-size:.95rem;font-weight:700;margin:0">${isEdit?'✏️ Editando':'📋 Nueva'} anamnesis — ${p.nombre} ${p.apellidos}</h3>
  </div>
  <div style="display:flex;gap:8px">
    <button class="btn btn-outline btn-sm" onclick="exitAnamForm()">'+t('cancel')+'</button>
    <button class="btn btn-primary btn-sm" onclick="saveAnamFull()">💾 Guardar anamnesis</button>
  </div>
</div>

<!-- Progress bar -->
<div style="display:flex;align-items:center;gap:4px;margin-bottom:16px">
  ${sections.map((s,i)=>`<div style="flex:1;height:4px;border-radius:2px;background:${i<=secIdx?'var(--primary)':'var(--border)'};transition:background .3s"></div>`).join('')}
  <span style="font-size:.68rem;color:var(--text3);margin-left:6px">${secIdx+1}/${sections.length}</span>
</div>

<!-- Section pills -->
<div class="pill-tabs" style="margin-bottom:14px">
  ${sections.map(s=>`<button class="pill-tab ${anamSection===s.id?'active':''}" onclick="window._anamSection='${s.id}';hTab('anamnesis')">${s.l}</button>`).join('')}
</div>

<div id="anamContent"></div>

<!-- Navigation buttons -->
<div style="display:flex;justify-content:space-between;margin-top:18px">
  <button class="btn btn-outline btn-sm" ${secIdx===0?'disabled style="opacity:.4"':''} onclick="anamPrevSection()">← Anterior</button>
  ${secIdx<sections.length-1?`<button class="btn btn-primary btn-sm" onclick="anamNextSection()">Siguiente →</button>`
    :`<button class="btn btn-primary btn-sm" onclick="saveAnamFull()">💾 Guardar anamnesis completa</button>`}
</div>`;

      var ac=$('anamContent');
      if(!ac)return;
      if(anamSection==='sistemas'){
        ac.innerHTML=renderAnamSistemas(p);
      } else if(anamSection==='recomendaciones'){
        // Use new ESPEN auto-recs from anamnesis.js
        ac.innerHTML=renderAnamFormSection('recomendaciones',p,ch);
      } else if(anamSection==='patologia_especifica'){
        ac.innerHTML=renderAnamFormSection('patologia_especifica',p,ch);
      } else {
        ac.innerHTML=renderAnamFormSection(anamSection,p,ch);
      }

    } else if(anamView==='view'){
      // ---- READ-ONLY VIEW of a specific anamnesis ----
      var a=anamList[anamEditIdx];
      if(!a){window._anamView='list';hTab('anamnesis');return}
      var vNum=anamList.length-anamEditIdx;
      c.innerHTML=`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
  <div style="display:flex;align-items:center;gap:10px">
    <button class="btn btn-ghost btn-sm" onclick="window._anamView='list';hTab('anamnesis')">← Volver</button>
    <h3 style="font-size:.95rem;font-weight:700;margin:0">📋 Anamnesis V${vNum} — ${fD(a.fecha)}</h3>
    ${anamEditIdx===anamList.length-1?'<span class="badge badge-primary">Vigente</span>':'<span class="badge badge-neutral">Anterior</span>'}
  </div>
  <div style="display:flex;gap:8px">
    ${anamEditIdx===anamList.length-1?`<button class="btn btn-outline btn-sm" onclick="editAnam(${anamEditIdx})">✏️ Editar</button>`:''}
    <button class="btn btn-outline btn-sm" onclick="duplicateAnam(${anamEditIdx})">📋 Duplicar como nueva</button>
  </div>
</div>
<div id="anamViewContent"></div>`;
      var vc=$('anamViewContent');
      if(vc) vc.innerHTML=renderAnamReadonly(a,p,ch);

    } else if(anamView==='compare'){
      // ---- COMPARE VIEW ----
      c.innerHTML=`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
  <div style="display:flex;align-items:center;gap:10px">
    <button class="btn btn-ghost btn-sm" onclick="window._anamView='list';hTab('anamnesis')">← Volver</button>
    <h3 style="font-size:.95rem;font-weight:700;margin:0">📊 Comparar anamnesis</h3>
  </div>
</div>
<div style="display:flex;gap:10px;margin-bottom:16px;align-items:center">
  <select id="cmpA" style="flex:1" onchange="renderAnamComparison()">
    ${anamList.map((a,i)=>`<option value="${i}" ${i===0?'selected':''}>V${anamList.length-i} — ${fD(a.fecha)}</option>`).join('')}
  </select>
  <span style="font-weight:700;color:var(--text3)">vs</span>
  <select id="cmpB" style="flex:1" onchange="renderAnamComparison()">
    ${anamList.map((a,i)=>`<option value="${i}" ${i===1?'selected':''}${anamList.length<2?'disabled':''}>V${anamList.length-i} — ${fD(a.fecha)}</option>`).join('')}
  </select>
</div>
<div id="anamCmpResult"></div>`;
      if(anamList.length>=2) setTimeout(function(){renderAnamComparison()},50);
    }

  } else if(t==='consultas'){
    // Dynamic from completed appointments
    var consultas=DB.appointments.filter(a=>a.pacienteId===p.id&&a.estado==='Realizada').sort((a,b)=>b.fecha.localeCompare(a.fecha));
    c.innerHTML=`<div class="card" style="border-top:3px solid var(--primary)"><div class="card-header"><span class="card-title" style="font-size:.88rem">🩺 Historial de consultas</span><span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.72rem">${consultas.length}</span></div><div class="card-body">
${consultas.length?'<div style="position:relative;padding-left:30px;border-left:2px solid var(--border);margin-left:10px">'+consultas.map(a=>`<div style="position:relative;padding:14px;background:var(--surface2);border-radius:var(--radius-sm);margin-bottom:14px"><div style="position:absolute;left:-39px;top:16px;width:16px;height:16px;border-radius:50%;background:var(--primary);border:3px solid var(--surface)"></div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><strong style="font-size:.86rem">${a.asunto||a.tipo}</strong><div style="display:flex;gap:6px;align-items:center"><span class="badge badge-primary">${fD(a.fecha)}</span>${a.acta?'<span class="badge badge-success" style="font-size:.58rem">📋 Acta</span>':''}</div></div>${a.acta?`<div style="font-size:.78rem;color:var(--text2);margin-top:4px">${a.acta.hallazgos?'<strong>Hallazgos:</strong> '+a.acta.hallazgos+'<br>':''}${a.acta.acuerdos?'<strong>Acuerdos:</strong> '+a.acta.acuerdos+'<br>':''}${a.acta.proximos?'<strong>Próximos pasos:</strong> '+a.acta.proximos+'<br>':''}<span style="font-size:.65rem;color:var(--text3)">Duración: ${a.acta.duracionReal||a.duracion}min · ${a.acta.profesional||''}</span></div>`:a.nota?`<p style="font-size:.82rem;color:var(--text2)">${a.nota}</p>`:''}</div>`).join('')
+'</div>':'<div class="empty-state"><div class="empty-icon">🩺</div><h3>Sin consultas realizadas</h3><p>Las consultas aparecerán aquí cuando se marquen como realizadas.</p></div>'}
</div></div>`;

  } else if(t==='mediciones'){
    // Inline anthropometry — no need to go to another module
    const as=DB.antropometrias.filter(a=>a.pacienteId===p.id).sort((a,b)=>b.fecha.localeCompare(a.fecha));
    c.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><span class="badge badge-neutral">${as.length} mediciones</span><button class="btn btn-primary btn-sm" onclick="openAntroModal()">+ Nueva medición</button></div>
${as.length?`<div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr));margin-bottom:14px">
${[{l:'Peso',v:as[0].peso+'kg',i:'⚖️',d:as.length>1?(as[0].peso-as[1].peso).toFixed(1):null},{l:'IMC',v:as[0].imc,i:'📊',s:imcCat(as[0].imc).l},{l:'% Grasa',v:as[0].grasaCorporal+'%',i:'💧'},{l:'M. musc',v:as[0].masaMuscular+'kg',i:'💪'},{l:'Cintura',v:as[0].cintura+'cm',i:'📏'}].map(s=>`<div class="stat-card" style="padding:12px"><div><div style="font-size:.62rem;color:var(--text3)">${s.i} ${s.l}</div><div style="font-size:1.2rem;font-weight:800;letter-spacing:-.5px;margin-top:2px">${s.v}</div>${s.d&&s.d!=0?`<div class="stat-trend ${s.d<0?'up':'down'}" style="font-size:.65rem">${s.d<0?'↓':'↑'} ${Math.abs(s.d)}kg</div>`:''}${s.s?`<div style="font-size:.62rem;color:var(--text3)">${s.s}</div>`:''}</div></div>`).join('')}</div>
<div class="card"><div class="card-body" style="padding:0;overflow-x:auto"><table><thead><tr><th>Fecha</th><th>Peso</th><th>IMC</th><th>Cintura</th><th>%Grasa</th><th>M.Musc</th><th>Método</th></tr></thead><tbody>
${as.map(a=>`<tr><td>${fD(a.fecha)}</td><td><strong>${a.peso}kg</strong></td><td><span class="badge ${imcCat(a.imc).b}">${a.imc}</span></td><td>${a.cintura}cm</td><td>${a.grasaCorporal}%</td><td>${a.masaMuscular}kg</td><td>${a.metodo}</td></tr>`).join('')}
</tbody></table></div></div>`:'<div class="empty-state"><div class="empty-icon">⚖️</div><h3>Sin mediciones</h3><p>Registre la primera medición antropométrica.</p><button class="btn btn-primary" style="margin-top:12px" onclick="openAntroModal()">+ Primera medición</button></div>'}`;

  } else if(t==='analiticas'){
    // Inline analytics
    const anals=DB.analiticas.filter(a=>a.pacienteId===p.id);
    c.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><span class="badge badge-neutral">${anals.length} analíticas</span><div style="display:flex;gap:6px">${anals.length>=2?`<button class="btn btn-outline btn-sm" onclick="openAnalyticsCompare(${p.id})">📊 Comparar</button>`:''} ${anals.length?`<button class="btn btn-outline btn-sm" onclick="aiInterpretAnalytics(${p.id})">🤖 IA</button>`:''}<button class="btn btn-primary btn-sm" onclick="openNewAnalModal()">+ Nueva</button></div></div>`
    +(anals.length?anals.map(a=>`<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">🔬 ${fD(a.fecha)} ${a.ayuno?'(Ayuno)':''}</span><span class="badge ${a.marcadores.some(m=>m.alerta==='grave')?'badge-danger':a.marcadores.some(m=>m.alerta)?'badge-warning':'badge-success'}">${a.marcadores.filter(m=>m.alerta).length} alertas</span><div style="display:flex;gap:4px;margin-left:auto"><button class="btn btn-ghost btn-xs" onclick="editAnal(${a.id})" title="Editar">${IC.edit}</button><button class="btn btn-ghost btn-xs" onclick="deleteAnal(${a.id})" title="Eliminar" style="color:var(--danger)">✕</button></div></div>
<div class="card-body" style="padding:0;overflow-x:auto"><table><thead><tr><th>Biomarcador</th><th>Valor</th><th>Rango</th><th>Estado</th></tr></thead><tbody>
${a.marcadores.map(m=>`<tr style="${m.alerta?'background:'+(m.alerta==='grave'?'#FFF5F5':m.alerta==='moderada'?'#FFFCF0':'#F0F7FF'):''}"><td><strong>${m.nombre}</strong></td><td style="font-weight:700;color:${m.alerta==='grave'?'var(--danger)':m.alerta==='moderada'?'#8B6914':'var(--text)'}">${m.valor} ${m.unidad}</td><td style="color:var(--text3)">${m.rango}</td><td>${m.alerta?`<span class="badge ${m.alerta==='grave'?'badge-danger':'badge-warning'}">${m.alerta}</span>`:'<span class="badge badge-success">✓</span>'}</td></tr>`).join('')}
</tbody></table></div></div>`).join(''):'<div class="empty-state"><div class="empty-icon">🔬</div><h3>Sin analíticas</h3><p>Registre la primera analítica con el botón superior.</p></div>');

  } else if(t==='plan'){
    // Inline meal plan + Desarrollada connection
    const patPlans=mealPlans.filter(mp=>mp.pacienteId===p.id);
    const activePlan=patPlans.find(mp=>mp.estado==='activo');
    // Check if there's a Desarrollada in progress
    const hasDevState=devState&&devState.patId===p.id&&devState.step>=3;
    const devFoodsCount=hasDevState?devState.comidas.reduce((t,c)=>t+c.alimentos.length,0):0;

    if(activePlan){
      c.innerHTML=renderPlanView(activePlan)
        +'<div style="margin-top:16px;padding:16px;background:var(--surface2);border-radius:var(--radius-sm);border:1px dashed var(--border)">'
        +'<div style="display:flex;justify-content:space-between;align-items:center">'
        +'<div><div style="font-size:.82rem;font-weight:700">🔬 Fórmula Desarrollada</div>'
        +'<div style="font-size:.72rem;color:var(--text3)">Diseñe un nuevo plan con el asistente clínico</div></div>'
        +'<button class="btn btn-primary btn-sm" onclick="selPat='+p.id+';navigate(\'desarrollada\')">Abrir Desarrollada →</button>'
        +'</div>'
        +(hasDevState?'<div style="margin-top:10px;padding:8px 12px;background:var(--primary-light);border-radius:var(--radius-xs);font-size:.75rem;display:flex;justify-content:space-between;align-items:center"><span>⚡ Desarrollo en curso: '+devFoodsCount+' alimentos · Paso '+devState.step+'/5 · '+devState.get+' kcal</span><button class="btn btn-accent btn-xs" onclick="selPat='+p.id+';navigate(\'desarrollada\')">Continuar →</button></div>':'')
        +'</div>';
    } else {
      c.innerHTML=`<div class="empty-state" style="padding:40px 20px">
        <div class="empty-icon">🍽️</div>
        <h3>Sin plan alimentario activo</h3>
        <p style="margin-bottom:20px">Cree un plan personalizado para ${p.nombre} usando la Fórmula Desarrollada o el wizard rápido.</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="selPat=${p.id};navigate('desarrollada')" style="padding:10px 24px">
            🔬 Fórmula Desarrollada
          </button>
          <button class="btn btn-outline" onclick="openNewPlanWizard()">
            ⚡ Wizard rápido
          </button>
          <button class="btn btn-outline" onclick="aiSuggestMealPlan(${p.id})">
            🤖 IA Sugerencia
          </button>
        </div>
        ${hasDevState?`<div style="margin-top:16px;padding:10px 14px;background:var(--primary-light);border-radius:var(--radius-sm);font-size:.78rem">
          ⚡ <strong>Desarrollo en curso:</strong> ${devFoodsCount} alimentos · Paso ${devState.step}/5 · ${devState.get} kcal
          <button class="btn btn-accent btn-xs" style="margin-left:8px" onclick="selPat=${p.id};navigate('desarrollada')">Continuar →</button>
        </div>`:''}
      </div>`;
    }

  } else if(t==='citas'){
    // Inline appointments for this patient
    const patAppts=DB.appointments.filter(a=>a.pacienteId===p.id).sort((a,b)=>b.fecha.localeCompare(a.fecha));
    const upcoming=patAppts.filter(a=>a.estado!=='Cancelada'&&a.estado!=='Realizada');
    const past=patAppts.filter(a=>a.estado==='Realizada'||a.estado==='No asistió');
    c.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><span class="badge badge-neutral">${patAppts.length} citas totales</span><button class="btn btn-primary btn-sm" onclick="openQuickApptModal()">+ Agendar cita</button></div>
${upcoming.length?`<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">📅 Próximas citas</span></div><div class="card-body" style="padding:0"><table><thead><tr><th>Fecha</th><th>Hora</th><th>Asunto</th><th>Estado</th><th></th></tr></thead><tbody>
${upcoming.map(a=>`<tr><td>${fD(a.fecha)}</td><td><strong>${a.hora}</strong></td><td><span class="calendar-event ${a.color}">${a.asunto||a.tipo}</span></td><td><span class="badge ${APPT_STATUS.find(s=>s.name===a.estado)?.badge||'badge-warning'}">${a.estado}</span></td><td><button class="btn btn-ghost btn-xs" onclick="markDone(${a.id});histTab='citas';navigate('historia')">✓</button></td></tr>`).join('')}
</tbody></table></div></div>`:''}
${past.length?`<div class="card"><div class="card-header"><span class="card-title">📁 Citas anteriores</span></div><div class="card-body" style="padding:0"><table><thead><tr><th>Fecha</th><th>Hora</th><th>Asunto</th><th>Estado</th></tr></thead><tbody>
${past.slice(0,10).map(a=>`<tr><td>${fD(a.fecha)}</td><td>${a.hora}</td><td>${a.asunto||a.tipo}</td><td><span class="badge ${a.estado==='Realizada'?'badge-success':'badge-danger'}">${a.estado}</span></td></tr>`).join('')}
</tbody></table></div></div>`:''}
${!upcoming.length&&!past.length?'<div class="empty-state"><div class="empty-icon">📅</div><h3>Sin citas registradas</h3><button class="btn btn-primary" style="margin-top:12px" onclick="openQuickApptModal()">+ Primera cita</button></div>':''}`;

  } else if(t==='notas'){
    // Quick notes — clinical observations per patient
    const notes=patNotes[p.id]||[];
    c.innerHTML=`<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title">📝 Notas clínicas rápidas</span></div><div class="card-body">
      <textarea id="quickNote" rows="3" placeholder="Escriba observaciones, indicaciones, seguimiento... (Enter para guardar)" style="margin-bottom:10px"></textarea>
      <button class="btn btn-primary btn-sm" onclick="saveQuickNote()">Guardar nota</button>
    </div></div>
    ${notes.length?`<div class="card"><div class="card-header"><span class="card-title">Historial de notas</span><span class="badge badge-neutral">${notes.length}</span></div><div class="card-body">
    ${notes.map((n,i)=>`<div style="padding:12px;background:var(--surface2);border-radius:var(--radius-xs);margin-bottom:8px;border-left:3px solid var(--primary)"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:.7rem;color:var(--text3)">${n.fecha}</span><button class="btn btn-ghost btn-xs" onclick="deleteNote(${p.id},${i})" style="color:var(--danger)">✕</button></div><p style="font-size:.82rem;color:var(--text2);white-space:pre-wrap">${n.texto}</p></div>`).join('')}
    </div></div>`:'<div style="text-align:center;padding:20px;color:var(--text3);font-size:.82rem">Sin notas previas. Use el campo de arriba para anotar observaciones.</div>'}`;

  } else if(t==='diario'){
    // Professional view of patient's food diary (synced from portal via localStorage)
    var diary=[];
    try{
      // Load from DB first, then merge with portal localStorage entries
      diary=(DB.diarioData&&DB.diarioData[p.id])?DB.diarioData[p.id]:[];
      var localDiary=JSON.parse(localStorage.getItem('veridia_diario_'+p.id)||'[]');
      if(localDiary.length){
        var existingDates=diary.map(function(d){return d.fecha+d.hora});
        localDiary.forEach(function(d){if(existingDates.indexOf(d.fecha+(d.hora||''))< 0)diary.push(d)});
        if(!DB.diarioData)DB.diarioData={};DB.diarioData[p.id]=diary;
      }
    }catch(e){console.warn('[Veridia]',e.message||e)}
    var symptoms=[];
    try{
      symptoms=(DB.sintomasData&&DB.sintomasData[p.id])?DB.sintomasData[p.id]:[];
      var localSymp=JSON.parse(localStorage.getItem('veridia_sintomas_'+p.id)||'[]');
      if(localSymp.length){
        var existingS=symptoms.map(function(s){return s.fecha+(s.hora||'')});
        localSymp.forEach(function(s){if(existingS.indexOf(s.fecha+(s.hora||''))< 0)symptoms.push(s)});
        if(!DB.sintomasData)DB.sintomasData={};DB.sintomasData[p.id]=symptoms;
      }
    }catch(e){console.warn('[Veridia]',e.message||e)}
    if(!diary.length&&!symptoms.length){
      c.innerHTML='<div class="empty-state"><div class="empty-icon">📄</div><h3>Sin registros del diario</h3><p>El paciente aún no ha registrado ingesta ni síntomas desde el portal.</p></div>';
    } else {
      // Group diary by date
      var dates={};
      diary.forEach(function(d){if(!dates[d.fecha])dates[d.fecha]={comidas:[],sintomas:[]};dates[d.fecha].comidas.push(d)});
      symptoms.forEach(function(s){if(!dates[s.fecha])dates[s.fecha]={comidas:[],sintomas:[]};dates[s.fecha].sintomas.push(s)});
      var sortedDates=Object.keys(dates).sort().reverse().slice(0,14);
      c.innerHTML='<div class="card"><div class="card-header"><span class="card-title">📄 Diario del paciente</span><span class="badge badge-neutral">'+sortedDates.length+' días registrados</span></div>'
      +'<div class="card-body">'
      +sortedDates.map(function(fecha){
        var d=dates[fecha];
        return '<div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--border)">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><strong style="font-size:.88rem">'+fecha+'</strong>'
        +'<div style="display:flex;gap:4px">'
        +(d.sintomas.length?d.sintomas.map(function(s){
          return '<span class="badge '+(s.tipo==='animo'?'badge-primary':s.tipo==='sintoma'?'badge-warning':'badge-neutral')+'" style="font-size:.6rem">'
          +(s.tipo==='animo'?s.valor:s.tipo==='sintoma'?'⚠️ '+s.valor:s.tipo==='hambre'?'🍽️ Hambre:'+s.valor:'💤 '+s.valor+'h')+'</span>';
        }).join(''):'')
        +'</div></div>'
        +(d.comidas.length?d.comidas.map(function(m){
          return '<div style="font-size:.78rem;padding:4px 0;display:flex;gap:8px"><span style="font-weight:600;color:var(--primary);min-width:100px">'+m.toma+'</span><span style="color:var(--text2)">'+m.texto+'</span>'+(m.hora?'<span style="font-size:.65rem;color:var(--text3);margin-left:auto">'+m.hora+'</span>':'')+'</div>';
        }).join(''):'<div style="font-size:.78rem;color:var(--text3)">Solo síntomas registrados</div>')
        +'</div>';
      }).join('')
      +'</div></div>';
    }

  } else if(t==='resumen'){
    // Evolution charts + Clinical Alerts Engine
    const as=DB.antropometrias.filter(a=>a.pacienteId===p.id).sort((a,b)=>a.fecha.localeCompare(b.fecha));
    const edadAnios=age(p.fechaNacimiento);
    const ultimo=as.length?as[as.length-1]:null;
    const penult=as.length>1?as[as.length-2]:null;
    const anals=DB.analiticas.filter(a=>a.pacienteId===p.id).sort((a,b)=>b.fecha.localeCompare(a.fecha));
    const ch=DB.clinicalHistories.find(h=>h.pacienteId===p.id);

    // --- Generate lifecycle clinical alerts ---
    var lcAlerts=generateLifecycleAlerts(p,as,anals,ch);

    c.innerHTML=as.length?`<div class="grid-2">
<div class="card"><div class="card-header"><span class="card-title">📊 Evolución de peso</span></div><div class="card-body">
${svgLineChart({data:as.map(function(a){return{label:a.fecha.slice(5),value:a.peso}}),width:440,height:160,unit:'kg',color:'var(--primary)',title:'Evolución de peso'})}
<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:.76rem;color:var(--text3);flex-wrap:wrap;gap:4px"><span>Inicio: ${as[0].peso}kg</span><span style="color:var(--success);font-weight:700">Actual: ${ultimo.peso}kg (${((ultimo.peso-as[0].peso)>0?'+':'')}${(ultimo.peso-as[0].peso).toFixed(1)}kg)</span>${(function(){if(as.length<3)return'';var n=as.length,sx=0,sy=0,sxy=0,sxx=0;as.forEach(function(a,i){sx+=i;sy+=a.peso;sxy+=i*a.peso;sxx+=i*i});var slope=(n*sxy-sx*sy)/(n*sxx-sx*sx);var dir=slope<-0.1?'↘ Bajando':slope>0.1?'↗ Subiendo':'→ Estable';var cl=slope<-0.1?'var(--success)':slope>0.1?'var(--danger)':'var(--text3)';return'<span style="color:'+cl+';font-weight:600">Tendencia: '+dir+' ('+slope.toFixed(2)+'kg/med)</span>'})()}</div>
</div></div>
<div class="card"><div class="card-header"><span class="card-title">🎯 Métricas actuales</span><span class="badge badge-neutral">${edadAnios}a ${edadAnios<19?'(Pediátrico)':edadAnios>=65?'(Geriátrico)':'(Adulto)'}</span></div><div class="card-body"><ul class="data-list">
${[['IMC',ultimo.imc+' ('+imcCat(ultimo.imc).l+')'],['% Grasa',ultimo.grasaCorporal+'%'],['Masa muscular',ultimo.masaMuscular+' kg'],['Cintura',ultimo.cintura+' cm'],['Pantorrilla',(ultimo.pantorrilla||'—')+(ultimo.pantorrilla?' cm':'')],['ICC',(ultimo.cintura/ultimo.cadera).toFixed(2)],['ICT (cintura/talla)',(ultimo.cintura/ultimo.altura).toFixed(3)+' '+(ultimo.cintura/ultimo.altura>=0.5?'<span class="badge badge-danger" style="font-size:.6rem">↑ Riesgo</span>':'<span class="badge badge-success" style="font-size:.6rem">Normal</span>')],['Gr. visceral',ultimo.grasaVisceral]].map(x=>`<li><span class="label">${x[0]}</span><span class="value">${x[1]}</span></li>`).join('')}
${penult?`<li style="border-top:1px solid var(--border);padding-top:8px;margin-top:8px"><span class="label">Δ Peso (última med.)</span><span class="value" style="color:${(ultimo.peso-penult.peso)<0?'var(--success)':'var(--danger)'};font-weight:700">${(ultimo.peso-penult.peso)>0?'+':''}${(ultimo.peso-penult.peso).toFixed(1)} kg</span></li>`:''}
</ul></div></div></div>

${lcAlerts.length?`
<!-- Lifecycle Clinical Alerts -->
<div class="card" style="margin-top:16px"><div class="card-header">
  <span class="card-title">🚨 Alertas clínicas — Evaluación ciclo vital</span>
  <div style="display:flex;gap:6px">
    <span class="badge badge-danger">${lcAlerts.filter(a=>a.sev==='critica').length} críticas</span>
    <span class="badge badge-warning">${lcAlerts.filter(a=>a.sev==='grave').length} graves</span>
    <span class="badge badge-info">${lcAlerts.filter(a=>a.sev==='moderada').length} moderadas</span>
  </div>
</div>
<div class="card-body" style="padding:14px">
${lcAlerts.map(a=>`<div class="clinical-alert ${a.sev==='critica'?'severe':a.sev==='grave'?'severe':a.sev==='moderada'?'moderate':'mild'}" style="padding:12px;margin-bottom:8px;border-left:4px solid ${a.sev==='critica'?'#dc2626':a.sev==='grave'?'var(--danger)':a.sev==='moderada'?'#d97706':'var(--info)'}">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
    <div style="flex:1">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap">
        <span class="badge ${a.sev==='critica'?'badge-danger':a.sev==='grave'?'badge-danger':a.sev==='moderada'?'badge-warning':'badge-info'}" style="font-size:.62rem">${a.sev.toUpperCase()}</span>
        <span class="badge badge-neutral" style="font-size:.6rem">${a.etapa}</span>
        <span class="badge badge-neutral" style="font-size:.6rem">${a.tipo}</span>
      </div>
      <p style="font-size:.82rem;font-weight:600;margin-bottom:4px">${a.mensaje}</p>
      <p style="font-size:.74rem;color:var(--text2)">💡 ${a.recomendacion}</p>
      ${a.valor?`<p style="font-size:.68rem;color:var(--text3);margin-top:4px">📊 Valor: <strong>${a.valor}</strong> | Umbral: ${a.umbral}</p>`:''}
    </div>
    <button class="btn btn-outline btn-xs" onclick="promoteLifecycleAlert(${p.id},'${a.id}')" title="Registrar como alerta formal">📋</button>
  </div>
</div>`).join('')}
</div></div>`:''}

${'<div class="card" style="margin-top:14px"><div class="card-header"><span class="card-title">🎯 Objetivo de peso</span><button class="btn btn-ghost btn-xs" onclick="setWeightGoal('+p.id+')">✏️</button></div><div class="card-body">'+(function(){
  var goal=null;try{goal=JSON.parse(localStorage.getItem('veridia_goal_'+p.id))}catch(e){console.warn('[Veridia]',e.message||e)}
  if(!goal||!goal.target)return '<div style="text-align:center;font-size:.82rem;color:var(--text3);padding:10px">Sin objetivo definido. <span style="cursor:pointer;color:var(--primary);text-decoration:underline" onclick="setWeightGoal('+p.id+')">Establecer meta</span></div>';
  var inicio=goal.startWeight||as[as.length-1].peso;var actual=ultimo.peso;var target=goal.target;
  var totalDelta=Math.abs(inicio-target);var progreso=totalDelta>0?Math.min(100,Math.round(Math.abs(inicio-actual)/totalDelta*100)):0;
  var color=progreso>=80?'var(--success)':progreso>=40?'var(--accent)':'var(--warning)';
  return '<div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:6px"><span>Inicio: '+inicio+'kg</span><span style="font-weight:700;color:'+color+'">'+progreso+'%</span><span>Meta: '+target+'kg</span></div>'
  +'<div style="height:10px;background:var(--border);border-radius:6px;overflow:hidden"><div style="width:'+progreso+'%;height:100%;background:'+color+';border-radius:6px;transition:width .5s"></div></div>'
  +'<div style="text-align:center;margin-top:8px;font-size:.9rem;font-weight:700;color:'+color+'">Actual: '+actual+'kg '+(actual<=target&&inicio>target?'🎉':'')+'</div>';
})()+'</div></div>'}
${(function(){
  if(typeof calcNRS2002!=='function'||typeof calcGLIM!=='function') return '';
  var nrs=calcNRS2002(p,ultimo?{imc:ultimo.imc}:null,{});
  var glim=calcGLIM(p,as,anals);
  return '<div class="card" style="margin-top:14px"><div class="card-header"><span class="card-title">🏥 Screening ESPEN</span><a href="https://guidelines.espen.org/espen-web-app/home/" target="_blank" style="font-size:.6rem;color:var(--accent)">📖 Guías ESPEN ↗</a></div><div class="card-body">'
  +renderNRS2002(nrs)+renderGLIM(glim)+'</div></div>';
})()}

`:'<div class="empty-state"><div class="empty-icon">📈</div><h3>Sin datos de evolución</h3><p>Registre mediciones antropométricas para ver la evolución.</p></div>';

  } else if(t==='farma'){
    // H5: Farmacología — medicamentos actuales
    if(!DB.patMeds)DB.patMeds={};
    var meds=DB.patMeds[p.id]||[];
    c.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><span class="badge badge-neutral">'+meds.length+' medicamento(s)</span><button class="btn btn-primary btn-sm" onclick="addPatMed('+p.id+')">💊 Añadir</button></div>'
    +(meds.length?'<div class="card"><div class="card-body" style="padding:0;overflow-x:auto"><table><thead><tr><th>Medicamento</th><th>Dosis</th><th>Frecuencia</th><th>Desde</th><th>Interacción nutricional</th><th></th></tr></thead><tbody>'
    +meds.map(function(m,i){return '<tr><td><strong>'+sanitize(m.nombre)+'</strong></td><td>'+sanitize(m.dosis||'')+'</td><td>'+sanitize(m.frecuencia||'')+'</td><td>'+fD(m.desde)+'</td>'
    +'<td style="font-size:.78rem;color:'+(m.interaccion?'var(--danger)':'var(--text3)')+'">'+sanitize(m.interaccion||'Sin interacciones conocidas')+'</td>'
    +'<td><button class="btn btn-ghost btn-xs" style="color:var(--danger)" onclick="removePatMed('+p.id+','+i+')">✕</button></td></tr>'}).join('')
    +'</tbody></table></div></div>'
    :'<div class="empty-state"><div class="empty-icon">💊</div><h3>Sin medicamentos registrados</h3><p>Registre los medicamentos actuales del paciente para detectar interacciones fármaco-nutriente.</p></div>');

  } else if(t==='documentos'){
    // H4: Patient documents tab
    if(!DB.patDocuments)DB.patDocuments={};
    var docs=DB.patDocuments[p.id]||[];
    c.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><span class="badge badge-neutral">'+docs.length+' documento(s)</span><button class="btn btn-primary btn-sm" onclick="addPatDocument('+p.id+')">📎 Adjuntar</button></div>'
    +(docs.length?docs.map(function(d,i){
      return '<div class="card" style="margin-bottom:8px;padding:12px"><div style="display:flex;justify-content:space-between;align-items:center">'
      +'<div><strong style="font-size:.88rem">'+sanitize(d.nombre)+'</strong>'
      +'<div style="font-size:.72rem;color:var(--text3)">'+sanitize(d.tipo||'Documento')+' · '+fD(d.fecha)+(d.notas?' · '+sanitize(d.notas):'')+'</div></div>'
      +'<div style="display:flex;gap:4px"><button class="btn btn-ghost btn-xs" onclick="viewPatDocument('+p.id+','+i+')" title="Ver">'+IC.eye+'</button>'
      +'<button class="btn btn-ghost btn-xs" style="color:var(--danger)" onclick="deletePatDocument('+p.id+','+i+')" title="Eliminar">✕</button></div></div></div>';
    }).join(''):'<div class="empty-state"><div class="empty-icon">📎</div><h3>Sin documentos adjuntos</h3><p>Adjunte informes, derivaciones, recetas médicas u otros documentos.</p></div>');

  } else {
    c.innerHTML='<div class="empty-state"><div class="empty-icon">📋</div><h3>Sin historia clínica</h3><p>Registre la anamnesis en la primera consulta.</p></div>';
  }
}

// Quick appointment from patient workspace
function openQuickApptModal(){
  const p=gP(selPat);if(!p)return;
  openModal(`<div class="modal-header"><h3>📅 Agendar cita — ${p.nombre} ${p.apellidos}</h3><button onclick="closeModal()">${IC.x}</button></div>
<div class="modal-body">
  <div class="form-group"><label class="form-label">Asunto</label><input id="qaDes" value="Consulta de revisión" placeholder="Motivo de la cita"></div>
  <div class="form-row">
    <div class="form-group"><label class="form-label">Fecha</label><input type="date" id="qaDate" value="${new Date().toISOString().slice(0,10)}"></div>
    <div class="form-group"><label class="form-label">Hora</label><input type="time" id="qaTime" value="09:00"></div>
    <div class="form-group"><label class="form-label">Tipo</label><select id="qaType"><option>Revisión</option><option>Primera visita</option><option>Online</option></select></div>
  </div>
  <div class="form-group"><label class="form-label">Nota</label><textarea id="qaNota" rows="2" placeholder="Observaciones para la próxima cita..."></textarea></div>
</div>
<div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="saveQuickAppt()">Agendar</button></div>`);
}

function saveQuickAppt(){
  const tipo=$('qaType').value,cm={'Primera visita':'first','Revisión':'review',Online:'online'};
  const precio=tipo==='Primera visita'?55:tipo==='Online'?30:35;
  DB.appointments.push({id:DB.nextAId++,pacienteId:selPat,profesional:currentUser?currentUser.name:'Lic. Antonella Caverzan',fecha:$('qaDate').value,hora:$('qaTime').value,tipo,asunto:$('qaDes').value||tipo,estado:'Pendiente',pago:'Pendiente',precio:precio,nota:sanitize($('qaNota').value||'')||'',duracion:tipo==='Primera visita'?60:tipo==='Online'?30:45,color:cm[tipo]||'review'});
  closeModal();toast('Cita agendada para '+fD($('qaDate').value));histTab='citas';navigate('historia');
}

// Auto-generate invoice when consultation is completed from workspace
function generateInvoiceFromConsult(apptId){
  const a=DB.appointments.find(x=>x.id===apptId);if(!a)return;
  const p=gP(a.pacienteId);if(!p)return;
  // Find matching service
  var servNombre=a.tipo==='Primera visita'?'Primera consulta nutricional':a.tipo==='Online'?'Consulta online (videollamada)':'Consulta de revisión';
  var serv=SERVICES.find(s=>s.nombre===servNombre)||SERVICES[1];
  var inv={
    id:DB.nextIId++,
    numero:'FAC-'+new Date().getFullYear()+'-'+(1000+DB.nextIId).toString().padStart(4,'0'),
    pacienteId:a.pacienteId,
    fecha:a.fecha||new Date().toISOString().slice(0,10),
    estado:'Pendiente',
    total:serv.precio,
    lineas:[{servicio:serv.nombre,cantidad:1,precio:serv.precio,iva:serv.iva}],
    pagos:[]
  };
  DB.invoices.push(inv);
  return inv;
}

// Quick notes system
function saveQuickNote(){
  const texto=sanitize($('quickNote')?.value?.trim()||'');
  if(!texto){toast('Escriba una nota','error');return}
  if(!patNotes[selPat]) patNotes[selPat]=[];
  patNotes[selPat].unshift({fecha:new Date().toLocaleString('es'),texto:texto});
  toast('Nota guardada');showSaved();histTab='notas';navigate('historia');
}

function deleteNote(patId,idx){
  openModal('<div class="modal-header"><h3>⚠️ Eliminar nota</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body"><p>¿Seguro que deseas eliminar esta nota clínica?</p><p style="font-size:.78rem;color:var(--text3);margin-top:8px">Esta acción no se puede deshacer.</p></div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-danger" onclick="confirmDeleteNote('+patId+','+idx+')">Eliminar</button></div>');
}
function confirmDeleteNote(patId,idx){
  if(patNotes[patId]) patNotes[patId].splice(idx,1);
  closeModal();toast('Nota eliminada','warning');histTab='notas';navigate('historia');
}

// H7: Set weight goal
function setWeightGoal(patId){
  var p=gP(patId);if(!p)return;
  var as=DB.antropometrias.filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return a.fecha.localeCompare(b.fecha)});
  var current=as.length?as[as.length-1].peso:70;
  var existing=null;try{existing=JSON.parse(localStorage.getItem('veridia_goal_'+patId))}catch(e){console.warn('[Veridia]',e.message||e)}
  openModal('<div class="modal-header"><h3>🎯 Objetivo de peso — '+p.nombre+'</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body">'
  +'<div class="form-group"><label class="form-label">Peso actual</label><input type="number" id="goalCurrent" value="'+current+'" step="0.1" disabled style="opacity:.6"></div>'
  +'<div class="form-group"><label class="form-label">Peso objetivo (kg)</label><input type="number" id="goalTarget" value="'+(existing?existing.target:Math.round(current*0.9))+'" step="0.1" min="30" max="300"></div>'
  +'</div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="saveWeightGoal('+patId+')">Guardar</button></div>');
}
function saveWeightGoal(patId){
  var target=parseFloat(($('goalTarget')||{}).value);
  if(!target||target<30){toast('Peso objetivo inválido','error');return}
  var as=DB.antropometrias.filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return a.fecha.localeCompare(b.fecha)});
  var current=as.length?as[as.length-1].peso:70;
  try{localStorage.setItem('veridia_goal_'+patId,JSON.stringify({target:target,startWeight:current,date:new Date().toISOString().slice(0,10)}))}catch(e){console.warn('[Veridia]',e.message||e)}
  closeModal();toast('Objetivo: '+target+'kg');histTab='resumen';navigate('historia');
}

// H4: Patient documents management
function addPatDocument(patId){
  openModal('<div class="modal-header"><h3>📎 Adjuntar Documento</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body"><div class="form-group"><label class="form-label">Nombre del documento *</label><input id="docNombre" class="form-control" placeholder="Ej: Informe endocrinología"></div>'
  +'<div class="form-group"><label class="form-label">Tipo</label><select id="docTipo" class="form-control"><option>Informe médico</option><option>Derivación</option><option>Receta médica</option><option>Analítica externa</option><option>Consentimiento</option><option>Otro</option></select></div>'
  +'<div class="form-group"><label class="form-label">Archivo (PDF/imagen, máx 1MB)</label><input type="file" id="docFile" accept=".pdf,.jpg,.jpeg,.png" class="form-control"></div>'
  +'<div class="form-group"><label class="form-label">Notas</label><input id="docNotas" class="form-control" placeholder="Observaciones..."></div>'
  +'</div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="savePatDocument('+patId+')">📎 Adjuntar</button></div>');
}
function savePatDocument(patId){
  var nombre=($('docNombre')||{}).value;if(!nombre||!nombre.trim()){toast('Nombre requerido','error');return}
  var fileEl=$('docFile');
  var file=fileEl&&fileEl.files?fileEl.files[0]:null;
  function doSave(base64){
    if(!DB.patDocuments)DB.patDocuments={};
    if(!DB.patDocuments[patId])DB.patDocuments[patId]=[];
    DB.patDocuments[patId].push({
      nombre:sanitize(nombre.trim()),tipo:($('docTipo')||{}).value||'Otro',
      notas:sanitize(($('docNotas')||{}).value||''),
      fecha:new Date().toISOString().slice(0,10),
      data:base64||null,fileName:file?file.name:null
    });
    closeModal();saveData();toast('Documento adjuntado','success');histTab='documentos';navigate('historia');
  }
  if(file){
    if(file.size>1048576){toast('Archivo demasiado grande (máx 1MB)','error');return}
    var reader=new FileReader();reader.onload=function(e){doSave(e.target.result)};reader.readAsDataURL(file);
  } else {doSave(null)}
}
function viewPatDocument(patId,idx){
  var docs=(DB.patDocuments||{})[patId]||[];var d=docs[idx];if(!d)return;
  if(d.data){
    if(d.data.startsWith('data:image')){
      openModal('<div class="modal-header"><h3>'+sanitize(d.nombre)+'</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body" style="text-align:center"><img src="'+d.data+'" style="max-width:100%;max-height:70vh;border-radius:8px"></div>');
    } else {
      var w=window.open('','_blank');if(w){w.document.write('<iframe src="'+d.data+'" style="width:100%;height:100vh;border:none"></iframe>')}
    }
  } else {toast('Sin archivo adjunto — solo metadatos','info')}
}
function deletePatDocument(patId,idx){
  if(!confirm('¿Eliminar este documento?'))return;
  ((DB.patDocuments||{})[patId]||[]).splice(idx,1);
  saveData();toast('Documento eliminado','success');histTab='documentos';navigate('historia');
}

// H5: Farmacología functions
function addPatMed(patId){
  openModal('<div class="modal-header"><h3>💊 Añadir Medicamento</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body"><div class="form-group"><label class="form-label">Medicamento *</label><input id="medNom" class="form-control" placeholder="Ej: Metformina"></div>'
  +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
  +'<div class="form-group"><label class="form-label">Dosis</label><input id="medDosis" class="form-control" placeholder="850mg"></div>'
  +'<div class="form-group"><label class="form-label">Frecuencia</label><select id="medFreq" class="form-control"><option>1 vez/día</option><option>2 veces/día</option><option>3 veces/día</option><option>Según necesidad</option><option>Semanal</option></select></div></div>'
  +'<div class="form-group"><label class="form-label">Desde</label><input type="date" id="medDesde" class="form-control" value="'+new Date().toISOString().slice(0,10)+'"></div>'
  +'<div class="form-group"><label class="form-label">Interacción nutricional conocida</label><input id="medInter" class="form-control" placeholder="Ej: Puede causar déficit de B12"></div>'
  +'</div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="savePatMed('+patId+')">Guardar</button></div>');
}
function savePatMed(patId){
  var nom=($('medNom')||{}).value;if(!nom||!nom.trim()){toast('Nombre requerido','error');return}
  if(!DB.patMeds)DB.patMeds={};if(!DB.patMeds[patId])DB.patMeds[patId]=[];
  DB.patMeds[patId].push({nombre:sanitize(nom.trim()),dosis:sanitize(($('medDosis')||{}).value||''),frecuencia:($('medFreq')||{}).value||'',
    desde:($('medDesde')||{}).value||new Date().toISOString().slice(0,10),interaccion:sanitize(($('medInter')||{}).value||'')});
  closeModal();saveData();toast('Medicamento registrado','success');histTab='farma';navigate('historia');
}
function removePatMed(patId,idx){if(!confirm('¿Eliminar?'))return;((DB.patMeds||{})[patId]||[]).splice(idx,1);saveData();toast('Eliminado','success');histTab='farma';navigate('historia')}

// H6: One-page clinical summary export
function exportClinicalSummary(patId){
  var p=gP(patId);if(!p)return;
  var as=DB.antropometrias.filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)});
  var ultimo=as.length?as[0]:null;
  var anals=DB.analiticas.filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)});
  var meds=(DB.patMeds||{})[patId]||[];
  var body='<h2>Datos del Paciente</h2><table>'
  +'<tr><td><strong>Nombre:</strong> '+p.nombre+' '+p.apellidos+'</td><td><strong>DNI:</strong> '+(p.dni||'')+'</td><td><strong>Edad:</strong> '+age(p.fechaNacimiento)+' años</td></tr>'
  +'<tr><td><strong>Sexo:</strong> '+p.sexo+'</td><td><strong>Motivo:</strong> '+(p.motivoConsulta||'')+'</td><td><strong>Grupo:</strong> '+(p.grupoSanguineo||'')+'</td></tr></table>';
  if(ultimo){body+='<h2>Última Antropometría ('+fD(ultimo.fecha)+')</h2><table>'
  +'<tr><td>Peso: '+ultimo.peso+'kg</td><td>Talla: '+ultimo.altura+'cm</td><td>IMC: '+ultimo.imc+' ('+imcCat(ultimo.imc).l+')</td></tr>'
  +'<tr><td>Cintura: '+ultimo.cintura+'cm</td><td>%Grasa: '+ultimo.grasaCorporal+'%</td><td>M.muscular: '+ultimo.masaMuscular+'kg</td></tr></table>'}
  if(anals.length){var a=anals[0];body+='<h2>Última Analítica ('+fD(a.fecha)+')</h2><table><tr><th>Marcador</th><th>Valor</th><th>Rango</th><th>Estado</th></tr>'
  +a.marcadores.map(function(m){return '<tr><td>'+m.nombre+'</td><td><strong>'+m.valor+' '+m.unidad+'</strong></td><td>'+m.rango+'</td><td>'+(m.alerta||'Normal')+'</td></tr>'}).join('')+'</table>'}
  if(meds.length){body+='<h2>Medicación Actual</h2><table><tr><th>Medicamento</th><th>Dosis</th><th>Frecuencia</th><th>Interacción</th></tr>'
  +meds.map(function(m){return '<tr><td>'+m.nombre+'</td><td>'+m.dosis+'</td><td>'+m.frecuencia+'</td><td>'+(m.interaccion||'—')+'</td></tr>'}).join('')+'</table>'}
  universalPDF('Resumen Clínico — '+p.nombre+' '+p.apellidos,body);
}
