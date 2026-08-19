// ===== ANTROPOMETRÍA =====
function rAntro(){
  const p=requirePatient();if(!p)return;
  const as=DB.antropometrias.filter(a=>a.pacienteId===p.id).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  var edadAnios=age(p.fechaNacimiento);

  // ═══ HEADER ═══
  var h='<div class="fade-in">'
  +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px">'
  +'<div style="display:flex;align-items:center;gap:10px">'+patSel(p.id)+'</div>'
  +'<button class="btn btn-primary" style="border-radius:10px;display:flex;align-items:center;gap:6px" onclick="openAntroModal()">'+IC.plus+' Nueva medición</button></div>';

  if(as.length){
    var last=as[0];
    var ic=imcCat(last.imc);
    var prevWeight=as.length>1?(last.peso-as[1].peso).toFixed(1):null;
    var grasaStatus=last.grasaCorporal<20?'bajo':last.grasaCorporal>30?'alto':'normal';
    var grasaColor=grasaStatus==='alto'?'#dc2626':grasaStatus==='bajo'?'#ca8a04':'#16a34a';
    var viscStatus=last.grasaVisceral<=6?'normal':last.grasaVisceral<=12?'elevado':'alto';
    var viscColor=viscStatus==='alto'?'#dc2626':viscStatus==='elevado'?'#ca8a04':'#16a34a';

    // ═══ KPI CARDS ═══
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:14px;margin-bottom:22px">';
    var kpis=[
      {l:'Peso',v:last.peso+'kg',icon:'⚖️',color:'var(--primary)',extra:prevWeight&&prevWeight!=0?'<div style="font-size:.65rem;font-weight:600;color:'+(prevWeight<0?'var(--success)':'var(--danger)')+';margin-top:2px">'+(prevWeight>0?'↑':'↓')+' '+Math.abs(prevWeight)+'kg</div>':''},
      {l:'IMC',v:last.imc,icon:'📊',color:ic.b==='badge-success'?'#16a34a':ic.b==='badge-warning'?'#ca8a04':'#dc2626',extra:'<div style="font-size:.62rem;margin-top:2px;opacity:.7">'+ic.l+'</div>'},
      {l:'% Grasa',v:last.grasaCorporal+'%',icon:'💧',color:'#ea580c',extra:'<div style="font-size:.62rem;margin-top:2px;color:'+grasaColor+'">'+grasaStatus+'</div>'},
      {l:'M. Muscular',v:last.masaMuscular+'kg',icon:'💪',color:'#2563eb',extra:''},
      {l:'Cintura',v:last.cintura+'cm',icon:'📐',color:'var(--accent)',extra:''},
      {l:'Pantorrilla',v:(last.pantorrilla||'—')+(last.pantorrilla?'cm':''),icon:'📐',color:'#6366f1',extra:''},
      {l:'Gr. Visceral',v:last.grasaVisceral,icon:'🔬',color:viscColor,extra:'<div style="font-size:.62rem;margin-top:2px;color:'+viscColor+'">'+viscStatus+'</div>'},
      {l:'ICT',v:last.ict||(last.cintura&&last.altura?(last.cintura/last.altura).toFixed(3):'—'),icon:'📐',color:(last.cintura/last.altura)>=0.5?'#dc2626':'#16a34a',extra:'<div style="font-size:.62rem;margin-top:2px;color:'+((last.cintura/last.altura)>=0.5?'#dc2626':'#16a34a')+'">'+((last.cintura/last.altura)>=0.5?'Riesgo':'Normal')+'</div>'},
      {l:'Dinamometría',v:(last.dinamometria||'—')+(last.dinamometria?'kg':''),icon:'💪',color:'#be185d',extra:''}
    ];
    kpis.forEach(function(k){
      h+='<div class="card" style="padding:16px;border-top:3px solid '+k.color+';text-align:center">'
      +'<div style="font-size:.9rem;margin-bottom:2px">'+k.icon+'</div>'
      +'<div style="font-size:.65rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px;font-weight:600">'+k.l+'</div>'
      +'<div style="font-size:1.3rem;font-weight:800;color:'+k.color+';margin-top:2px;letter-spacing:-.5px">'+k.v+'</div>'
      +k.extra+'</div>';
    });
    h+='</div>';

    // ═══ EVOLUTION CHARTS (if ≥2 measurements) ═══
    if(as.length>=2){
      h+='<div class="card" style="margin-bottom:20px;border-top:3px solid var(--primary)">'
      +'<div class="card-header"><span class="card-title" style="font-size:.88rem">📈 Evolución</span>'
      +'<span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.68rem">'+as.length+' mediciones</span></div>'
      +'<div class="card-body"><div style="display:flex;gap:20px;flex-wrap:wrap">'
      +svgLineChart({data:as.slice().reverse().map(function(a){return{label:fD(a.fecha).slice(0,5),value:a.peso}}),width:380,height:150,unit:'kg',color:'var(--primary)',title:'Peso'})
      +svgLineChart({data:as.slice().reverse().map(function(a){return{label:fD(a.fecha).slice(0,5),value:a.imc}}),width:380,height:150,unit:'',color:'var(--accent)',title:'IMC'})
      +'</div></div></div>';
    }

    // ═══ BODY COMPOSITION ═══
    var muscPct=last.masaMuscular?Math.round(last.masaMuscular/last.peso*100):30;
    var otherPct=Math.max(0,100-Math.round(last.grasaCorporal||25)-muscPct);

    h+='<div class="card" style="margin-bottom:20px;border-top:3px solid #ea580c">'
    +'<div class="card-header"><span class="card-title" style="font-size:.88rem">📊 Composición Corporal</span></div>'
    +'<div class="card-body" style="display:flex;gap:24px;flex-wrap:wrap;align-items:center">'
    +svgDonutChart({data:[
      {label:'Grasa '+last.grasaCorporal+'%',value:Math.round(last.grasaCorporal||25),color:'#ea580c'},
      {label:'Músculo '+muscPct+'%',value:muscPct,color:'#2563eb'},
      {label:'Otro',value:otherPct,color:'#94a3b8'}
    ],size:160,title:'Composición',unit:'%'})
    +'<div style="flex:1;min-width:180px">'
    // Grasa
    +'<div style="padding:10px 14px;background:#fff7ed;border-radius:10px;border-left:3px solid #ea580c;margin-bottom:8px">'
    +'<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:.82rem;font-weight:600">💧 Grasa corporal</span>'
    +'<span style="font-size:1rem;font-weight:800;color:#ea580c">'+last.grasaCorporal+'%</span></div>'
    +'<div style="height:4px;background:#fed7aa;border-radius:2px;margin-top:4px;overflow:hidden"><div style="width:'+Math.min(last.grasaCorporal*2,100)+'%;height:100%;background:#ea580c;border-radius:2px"></div></div>'
    +'<div style="font-size:.65rem;color:'+grasaColor+';font-weight:600;margin-top:2px">'+grasaStatus.toUpperCase()+'</div></div>'
    // Músculo
    +'<div style="padding:10px 14px;background:#eff6ff;border-radius:10px;border-left:3px solid #2563eb;margin-bottom:8px">'
    +'<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:.82rem;font-weight:600">💪 Masa muscular</span>'
    +'<span style="font-size:1rem;font-weight:800;color:#2563eb">'+last.masaMuscular+'kg</span></div>'
    +'<div style="font-size:.65rem;color:var(--text-secondary);margin-top:2px">'+muscPct+'% del peso total</div></div>'
    // Visceral
    +'<div style="padding:10px 14px;background:'+(viscStatus==='alto'?'#fef2f2':viscStatus==='elevado'?'#fffbeb':'#f0fdf4')+';border-radius:10px;border-left:3px solid '+viscColor+'">'
    +'<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:.82rem;font-weight:600">🔬 Grasa visceral</span>'
    +'<span style="font-size:1rem;font-weight:800;color:'+viscColor+'">'+last.grasaVisceral+'</span></div>'
    +'<div style="font-size:.65rem;color:'+viscColor+';font-weight:600;margin-top:2px">'+viscStatus.toUpperCase()+'</div></div>'
    +'</div></div></div>';

    // ═══ OMS PERCENTILE (pediatric) ═══
    if(typeof renderOMSPercentile==='function'&&edadAnios<19){
      h+=renderOMSPercentile(last.peso,last.altura,edadAnios,p.sexo);
    }

    // ═══ HISTORY TABLE ═══
    h+='<div class="card" style="border-top:3px solid var(--text3)">'
    +'<div class="card-header"><span class="card-title" style="font-size:.88rem">📋 Historial de Mediciones</span>'
    +'<span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.68rem">'+as.length+' registros</span></div>'
    +'<div class="card-body" style="padding:0;overflow-x:auto">'
    +'<table role="table" style="width:100%;border-collapse:collapse;font-size:.82rem">'
    +'<thead><tr style="background:var(--surface2)">'
    +'<th style="padding:10px 12px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Fecha</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Peso</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">IMC</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Cintura</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Cadera</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Pantorr.</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">%Grasa</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">M.Musc</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Visc</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Método</th>'
    +'<th style="padding:10px 8px;width:90px"></th></tr></thead><tbody>';
    as.forEach(function(a,i){
      var isAlt=i%2===1;
      var imcInfo=imcCat(a.imc);
      h+='<tr style="border-bottom:1px solid var(--border);background:'+(isAlt?'var(--surface)':'transparent')+'">'
      +'<td style="padding:10px 12px;font-variant-numeric:tabular-nums;font-weight:600;font-size:.8rem">'+fD(a.fecha)+'</td>'
      +'<td style="padding:10px;text-align:center;font-weight:700;font-variant-numeric:tabular-nums">'+a.peso+'kg</td>'
      +'<td style="padding:10px;text-align:center"><span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:.7rem;font-weight:700;background:'+(imcInfo.b==='badge-success'?'#f0fdf4':imcInfo.b==='badge-warning'?'#fffbeb':'#fef2f2')+';color:'+(imcInfo.b==='badge-success'?'#16a34a':imcInfo.b==='badge-warning'?'#92400e':'#dc2626')+'">'+a.imc+'</span></td>'
      +'<td style="padding:10px;text-align:center;font-variant-numeric:tabular-nums">'+a.cintura+'cm</td>'
      +'<td style="padding:10px;text-align:center;font-variant-numeric:tabular-nums">'+a.cadera+'cm</td>'
      +'<td style="padding:10px;text-align:center;font-variant-numeric:tabular-nums">'+(a.pantorrilla||'<span style="color:var(--text3)">—</span>')+(a.pantorrilla?'cm':'')+'</td>'
      +'<td style="padding:10px;text-align:center;font-variant-numeric:tabular-nums">'+a.grasaCorporal+'%</td>'
      +'<td style="padding:10px;text-align:center;font-variant-numeric:tabular-nums">'+a.masaMuscular+'kg</td>'
      +'<td style="padding:10px;text-align:center;font-variant-numeric:tabular-nums">'+a.grasaVisceral+'</td>'
      +'<td style="padding:10px;text-align:center;font-size:.75rem;color:var(--text-secondary)">'+a.metodo+'</td>'
      +'<td style="padding:10px;white-space:nowrap"><div style="display:flex;gap:3px;justify-content:flex-end">'
      +'<button class="btn btn-ghost btn-xs" style="border-radius:6px" onclick="editAntro('+a.id+')" title="Editar">'+IC.edit+'</button>'
      +'<button class="btn btn-ghost btn-xs" style="border-radius:6px;color:var(--danger)" onclick="deleteAntro('+a.id+')" title="Eliminar">✕</button>'
      +(as.length>=2&&i<as.length-1?'<button class="btn btn-ghost btn-xs" style="border-radius:6px" onclick="antroVisualCompare('+a.id+','+as[i+1].id+')" title="Comparar con anterior">⇔</button>':'')
      +'</div></td></tr>';
    });
    h+='</tbody></table></div></div>';

  } else {
    // ═══ EMPTY STATE ═══
    h+='<div class="card" style="text-align:center;padding:50px"><div style="font-size:3.5rem;margin-bottom:14px;opacity:.3">📏</div>'
    +'<p style="color:var(--text-secondary);font-size:.92rem;margin:0;font-weight:600">Sin mediciones antropométricas</p>'
    +'<p style="color:var(--text3);font-size:.78rem;margin:6px 0 20px">Registre la primera medición para comenzar a hacer seguimiento.</p>'
    +'<button class="btn btn-primary" style="border-radius:10px;padding:10px 28px" onclick="openAntroModal()">📐 Primera medición</button></div>';
  }

  h+='</div>';
  $('mainContent').innerHTML=h;
}

// ═══ MODAL HTML ═══
function antroModalHTML(a){
  var isEdit=!!a;
  return '<div class="modal-header"><h3>'+(isEdit?'✏️'+' Editar medición':'📐 Nueva medición antropométrica')+'</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body"><div style="display:grid;gap:14px">'

  +'<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--primary-light);border-radius:8px"><span style="font-size:.9rem">⚖️</span><strong style="font-size:.82rem;color:var(--primary)">Medidas principales</strong></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">⚖️ Peso (kg) *</label><input type="number" id="aPe" step="0.1" value="'+(a?a.peso:'')+'" style="font-size:1.05rem;font-weight:700;text-align:center"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">📐 Altura (cm) *</label><input type="number" id="aAl" step="0.1" value="'+(a?a.altura:'')+'" style="font-size:1.05rem;font-weight:700;text-align:center"></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Cintura (cm)</label><input type="number" id="aCi" step="0.1" value="'+(a?a.cintura:'')+'"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Cadera (cm)</label><input type="number" id="aCa" step="0.1" value="'+(a?a.cadera:'')+'"></div></div>'

  +'<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--accent-light);border-radius:8px;margin-top:4px"><span style="font-size:.9rem">💧</span><strong style="font-size:.82rem;color:var(--accent)">Composición corporal</strong></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">📐 Pantorrilla (cm)</label><input type="number" id="aPa" step="0.1" placeholder="Diámetro max." value="'+(a?a.pantorrilla||'':'')+'"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">💧 % Grasa corporal</label><input type="number" id="aGr" step="0.1" value="'+(a?a.grasaCorporal:'')+'"></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">💪 M. muscular (kg)</label><input type="number" id="aMu" step="0.1" value="'+(a?a.masaMuscular:'')+'"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">🔬 Gr. visceral</label><input type="number" id="aVi" step="0.1" value="'+(a?a.grasaVisceral:'')+'"></div></div>'

  +'<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#fef3c7;border-radius:8px;margin-top:4px"><span style="font-size:.9rem">📏</span><strong style="font-size:.82rem;color:#92400e">Pliegues cutáneos (mm)</strong></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Bicipital</label><input type="number" id="aPlBi" step="0.1" value="'+(a?a.pliegueBicipital||'':'')+'"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Tricipital</label><input type="number" id="aPlTr" step="0.1" value="'+(a?a.pliegueTricipital||'':'')+'"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Subescapular</label><input type="number" id="aPlSub" step="0.1" value="'+(a?a.pliegueSubescapular||'':'')+'"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Suprailiaco</label><input type="number" id="aPlSup" step="0.1" value="'+(a?a.pliegueSuprailiaco||'':'')+'"></div></div>'

  +'<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#fce7f3;border-radius:8px;margin-top:4px"><span style="font-size:.9rem">💪</span><strong style="font-size:.82rem;color:#be185d">Fuerza muscular</strong></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Dinamometría (kg)</label><input type="number" id="aDin" step="0.1" placeholder="Fuerza prensión mano" value="'+(a?a.dinamometria||'':'')+'"></div></div>'

  +'<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#eff6ff;border-radius:8px;margin-top:4px"><span style="font-size:.9rem">⚙️</span><strong style="font-size:.82rem;color:#2563eb">Método y fecha</strong></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Método</label><select id="aMe"><option'+(a&&a.metodo==='BIA'?' selected':'')+'>BIA</option><option'+(a&&a.metodo==='Pliegues'?' selected':'')+'>Pliegues</option><option'+(a&&a.metodo==='DEXA'?' selected':'')+'>DEXA</option><option'+(a&&a.metodo==='Cinta métrica'?' selected':'')+'>Cinta métrica</option></select></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">📅 Fecha</label><input type="date" id="aFe" value="'+(a?a.fecha:new Date().toISOString().slice(0,10))+'"></div></div>'

  +'</div></div><div class="modal-footer"><button class="btn btn-outline" style="border-radius:8px" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" style="border-radius:8px;padding:10px 24px" onclick="saveAntro('+(isEdit?a.id:'null')+')">'+(isEdit?'✏️ Actualizar':'📏 Guardar medición')+'</button></div>';
}

function openAntroModal(){openModal(antroModalHTML(null))}

function editAntro(id){
  var a=DB.antropometrias.find(function(x){return x.id===id});
  if(!a){toast('Medición no encontrada','error');return}
  openModal(antroModalHTML(a));
}

function saveAntro(editId){
  var w=parseFloat(($('aPe')||{}).value),h=parseFloat(($('aAl')||{}).value);
  if(!w||!h||w<20||w>500||h<50||h>250){toast('Peso y altura válidos requeridos','error');return}
  var data={
    pacienteId:selPat,
    fecha:$('aFe')?$('aFe').value:new Date().toISOString().slice(0,10),
    peso:w,altura:h,imc:+(w/((h/100)**2)).toFixed(1),
    cintura:parseFloat(($('aCi')||{}).value)||0,cadera:parseFloat(($('aCa')||{}).value)||0,
    pantorrilla:parseFloat(($('aPa')||{}).value)||0,grasaCorporal:parseFloat(($('aGr')||{}).value)||0,
    masaMuscular:parseFloat(($('aMu')||{}).value)||0,grasaVisceral:parseFloat(($('aVi')||{}).value)||0,
    pliegueBicipital:parseFloat(($('aPlBi')||{}).value)||0,
    pliegueTricipital:parseFloat(($('aPlTr')||{}).value)||0,
    pliegueSubescapular:parseFloat(($('aPlSub')||{}).value)||0,
    pliegueSuprailiaco:parseFloat(($('aPlSup')||{}).value)||0,
    dinamometria:parseFloat(($('aDin')||{}).value)||0,
    ict:h>0?+(parseFloat(($('aCi')||{}).value)/h).toFixed(3):0,
    metodo:($('aMe')||{}).value||'BIA'
  };
  if(editId){
    var existing=DB.antropometrias.find(function(x){return x.id===editId});
    if(existing) Object.assign(existing,data);
    closeModal();toast('Medición actualizada');
  } else {
    data.id=(DB.antropometrias.length?Math.max.apply(null,DB.antropometrias.map(function(a){return a.id}))+1:1);
    DB.antropometrias.push(data);
    closeModal();toast('Medición registrada');
  }
  showSaved();navigate('antropometria');
}

function deleteAntro(id){
  var a=DB.antropometrias.find(function(x){return x.id===id});
  if(!a)return;
  openModal('<div class="modal-header"><h3>⚠️ Eliminar medición</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body"><p style="font-size:.88rem">¿Eliminar la medición del <strong>'+fD(a.fecha)+'</strong> ('+a.peso+'kg)?</p><p style="font-size:.78rem;color:var(--text3);margin-top:8px">Esta acción no se puede deshacer.</p></div><div class="modal-footer"><button class="btn btn-outline" style="border-radius:8px" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-danger" style="border-radius:8px" onclick="confirmDeleteAntro('+id+')">🗑️ Eliminar</button></div>');
}
function confirmDeleteAntro(id){
  DB.antropometrias=DB.antropometrias.filter(function(x){return x.id!==id});
  closeModal();toast('Medición eliminada','warning');showSaved();navigate('antropometria');
}

// #21 Pliegues cutáneos — Durnin-Womersley
function calcPliegueDW(triceps,biceps,subescapular,suprailiac,edad,sexo){
  var sum=triceps+biceps+subescapular+suprailiac;
  var logSum=Math.log10(sum);
  var density;
  if(sexo==='M'){
    if(edad<17)density=1.1533-0.0643*logSum;
    else if(edad<20)density=1.1620-0.0630*logSum;
    else if(edad<30)density=1.1631-0.0632*logSum;
    else if(edad<40)density=1.1422-0.0544*logSum;
    else if(edad<50)density=1.1620-0.0700*logSum;
    else density=1.1715-0.0779*logSum;
  } else {
    if(edad<17)density=1.1369-0.0598*logSum;
    else if(edad<20)density=1.1549-0.0678*logSum;
    else if(edad<30)density=1.1599-0.0717*logSum;
    else if(edad<40)density=1.1423-0.0632*logSum;
    else if(edad<50)density=1.1333-0.0612*logSum;
    else density=1.1339-0.0645*logSum;
  }
  var grasa=((4.95/density)-4.5)*100;
  return{sumPliegues:sum,densidad:Math.round(density*10000)/10000,grasaPct:Math.round(grasa*10)/10,formula:'Durnin-Womersley (4 pliegues)',ref:'Durnin & Womersley 1974'};
}

// #23 Percentiles pediátricos OMS
function getOMS_Percentile(sexo,edadMeses,peso,altura){
  var result={available:false,note:'Percentiles OMS requieren tablas completas. Consultar who.int/childgrowth'};
  if(edadMeses>0&&edadMeses<=228){
    result.available=true;
    result.edadMeses=edadMeses;
    result.note='Paciente pediatrico ('+Math.round(edadMeses/12*10)/10+' años). Evaluar con curvas de crecimiento OMS.';
  }
  return result;
}

// AN2: OMS percentiles for pediatric patients
function renderOMSPercentile(peso,altura,edad,sexo){
  if(edad>=19)return '';
  var pesos_p50_ninos=[3.3,9.6,12.2,14.3,16.3,18.4,20.5,22.9,25.3,28.1,31.4,35.6,39.9,45.3,50.8,56.7,62.1,66.0,68.9];
  var pesos_p50_ninas=[3.2,8.9,11.5,13.9,15.9,17.9,19.9,22.1,24.8,28.0,32.0,37.0,41.5,46.1,50.3,53.5,55.9,57.4,58.0];
  var ref=sexo==='FEMENINO'?pesos_p50_ninas:pesos_p50_ninos;
  var p50=ref[Math.min(Math.floor(edad),18)]||ref[18];
  var pct=Math.round(peso/p50*100);
  var percentile=pct>115?'> P97':pct>107?'P85-P97':pct>93?'P15-P85':pct>85?'P3-P15':'< P3';
  var color=pct>115||pct<85?'#dc2626':pct>107||pct<93?'#ca8a04':'#16a34a';
  return '<div class="card" style="margin-bottom:20px;border-top:3px solid '+color+'">'
  +'<div class="card-header"><span class="card-title" style="font-size:.88rem">📈 Percentil OMS (Pediátrico)</span>'
  +'<span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.68rem">'+edad+' años · '+sexo+'</span></div>'
  +'<div class="card-body"><div style="display:flex;justify-content:space-between;align-items:center">'
  +'<div><div style="font-size:1.4rem;font-weight:800;color:'+color+'">'+percentile+'</div>'
  +'<div style="font-size:.78rem;color:var(--text-secondary);margin-top:2px">Peso: <strong>'+peso+'kg</strong> vs P50 referencia: <strong>'+p50.toFixed(1)+'kg</strong> ('+pct+'%)</div></div>'
  +'</div></div></div>';
}

// AN3: Visual comparator between 2 measurements
function antroVisualCompare(id1,id2){
  var a=DB.antropometrias.find(function(x){return x.id===id1});
  var b=DB.antropometrias.find(function(x){return x.id===id2});
  if(!a||!b)return;
  var fields=[['Peso','peso','kg'],['IMC','imc',''],['% Grasa','grasaCorporal','%'],['M. Muscular','masaMuscular','kg'],['Cintura','cintura','cm'],['Cadera','cadera','cm'],['Gr. Visceral','grasaVisceral','']];

  var h='<div class="modal-header"><h3>⇔ '+fD(a.fecha)+' vs '+fD(b.fecha)+'</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body">'
  +'<div style="overflow-x:auto;border-radius:10px;border:1px solid var(--border)"><table style="width:100%;border-collapse:collapse;font-size:.84rem">'
  +'<thead><tr style="background:var(--surface2)">'
  +'<th style="padding:10px 14px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Parámetro</th>'
  +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--primary);font-weight:600">'+fD(a.fecha)+'</th>'
  +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--accent);font-weight:600">'+fD(b.fecha)+'</th>'
  +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Δ Cambio</th></tr></thead><tbody>';
  fields.forEach(function(f,i){
    var va=a[f[1]]||0;var vb=b[f[1]]||0;var delta=vb-va;
    var color=Math.abs(delta)<0.1?'var(--text-secondary)':delta<0?'#16a34a':'#dc2626';
    var isAlt=i%2===1;
    h+='<tr style="border-bottom:1px solid var(--border);background:'+(isAlt?'var(--surface)':'transparent')+'">'
    +'<td style="padding:10px 14px;font-weight:600">'+f[0]+'</td>'
    +'<td style="padding:10px;text-align:center;font-variant-numeric:tabular-nums">'+va+f[2]+'</td>'
    +'<td style="padding:10px;text-align:center;font-variant-numeric:tabular-nums">'+vb+f[2]+'</td>'
    +'<td style="padding:10px;text-align:center;font-weight:700;color:'+color+'"><span style="display:inline-block;padding:2px 8px;border-radius:8px;background:'+color+'11">'+(delta>0?'+':'')+delta.toFixed(1)+f[2]+'</span></td></tr>';
  });
  h+='</tbody></table></div></div>';
  openModal(h);
}
