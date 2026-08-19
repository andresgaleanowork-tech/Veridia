// ===== FÓRMULA CLÍNICA =====
function rFormula(){
  const p=requirePatient();if(!p)return;
  const an=DB.antropometrias.filter(a=>a.pacienteId===p.id).sort((a,b)=>b.fecha.localeCompare(a.fecha))[0];
  var hist=(DB.formulaResults&&DB.formulaResults[selPat])||[];
  var lastGet=hist.length?hist[hist.length-1].get:null;

  $('mainContent').innerHTML=`<div class="fade-in">

<!-- Header -->
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px">
  <div style="display:flex;align-items:center;gap:10px">${patSel(p.id)}</div>
  ${lastGet?'<div style="display:flex;align-items:center;gap:8px"><span style="font-size:.72rem;color:var(--text-secondary)">Último GET:</span><span style="font-size:1rem;font-weight:800;color:var(--primary)">'+lastGet+' kcal</span></div>':''}
</div>

<div class="grid-23">
<!-- LEFT: Parameters -->
<div class="card" style="border-top:3px solid var(--primary)">
  <div class="card-header" style="background:var(--primary-light)"><span class="card-title" style="font-size:.88rem">⚙️ Parámetros de Cálculo</span></div>
  <div class="card-body" style="padding:18px 22px"><div style="display:grid;gap:14px">

  <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--surface2);border-radius:8px"><span style="font-size:.82rem">🧮</span><strong style="font-size:.78rem;color:var(--text-secondary)">Fórmula y actividad</strong></div>
  <div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Fórmula GEB</label><select id="fF"><option>Mifflin-St Jeor</option><option>Harris-Benedict</option><option>Owen</option><option>Cunningham</option><option>Schofield (OMS)</option><option>Henry (Oxford)</option></select></div>
  <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Factor actividad</label><select id="fA"><option value="1.2">Sedentario (1.2)</option><option value="1.375">Ligera (1.375)</option><option value="1.55" selected>Moderada (1.55)</option><option value="1.725">Intensa (1.725)</option><option value="1.9">Muy intensa (1.9)</option></select></div></div>

  <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--primary-light);border-radius:8px"><span style="font-size:.82rem">📏</span><strong style="font-size:.78rem;color:var(--primary)">Datos antropométricos</strong></div>
  <div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">⚖️ Peso (kg)</label><input type="number" id="fP" value="${an?an.peso:70}" step="0.1" style="font-size:1.05rem;font-weight:700;text-align:center"></div>
  <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">📐 Altura (cm)</label><input type="number" id="fH" value="${an?an.altura:165}" step="0.1" style="font-size:1.05rem;font-weight:700;text-align:center"></div>
  <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">🎂 Edad</label><input type="number" id="fE" value="${age(p.fechaNacimiento)}" style="font-size:1.05rem;font-weight:700;text-align:center"></div></div>

  <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--accent-light);border-radius:8px"><span style="font-size:.82rem">🔧</span><strong style="font-size:.78rem;color:var(--accent)">Factores y macros</strong></div>
  <div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Sexo</label><select id="fS"><option value="F" ${p.sexo==='FEMENINO'?'selected':''}>F</option><option value="M" ${p.sexo==='MASCULINO'?'selected':''}>M</option></select></div>
  <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Factor estrés</label><input type="number" id="fSt" value="1" step="0.05" style="text-align:center"></div>
  <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Ajuste kcal</label><input type="number" id="fAj" value="0" step="50" style="text-align:center"></div></div>
  <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#fef2f2;border-radius:8px;margin-top:4px"><span style="font-size:.9rem">📉</span><strong style="font-size:.82rem;color:#dc2626">Déficit calórico</strong></div>
  <div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Déficit (%)</label><select id="fDefPct" onchange="applyDeficit()" style="text-align:center"><option value="0">Sin déficit</option><option value="10">-10%</option><option value="15">-15%</option><option value="20">-20%</option><option value="25">-25%</option><option value="30">-30%</option></select></div>
  <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Déficit (kcal)</label><select id="fDefKcal" onchange="applyDeficitKcal()" style="text-align:center"><option value="0">Sin déficit</option><option value="250">-250 kcal</option><option value="500">-500 kcal</option><option value="750">-750 kcal</option><option value="1000">-1000 kcal</option></select></div></div>
  <div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Proteínas (g/kg)</label><input type="number" id="fPk" value="1.2" step="0.1" style="text-align:center"></div>
  <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Grasas (%)</label><input type="number" id="fGp" value="30" style="text-align:center"></div>
  <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">% Grasa corp. <span style="font-size:.55rem;color:var(--text3);text-transform:none;letter-spacing:0">(Cunningham)</span></label><input type="number" id="fGr" value="${an?an.grasaCorporal||25:25}" step="0.1" style="text-align:center"></div></div>

  <button class="btn btn-primary" onclick="calcFormula()" id="fCalcBtn" style="width:100%;padding:12px;font-size:.92rem;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:8px"><span style="font-size:1.1rem">🧮</span> Calcular</button>
  </div></div>
</div>

<!-- RIGHT: Results + History -->
<div>
  <div class="card" id="fRes" style="border-top:3px solid var(--accent)">
    <div class="card-header"><span class="card-title" style="font-size:.88rem">📊 Resultados</span></div>
    <div class="card-body"><div style="text-align:center;padding:30px"><div style="font-size:2.5rem;opacity:.2;margin-bottom:10px">🧮</div><p style="color:var(--text3);font-size:.82rem;margin:0">Pulse <strong>Calcular</strong> para obtener resultados</p></div></div>
  </div>
${(function(){
  if(!hist.length)return '';
  return '<div class="card" style="margin-top:16px;border-top:3px solid #6366f1"><div class="card-header"><span class="card-title" style="font-size:.85rem">📄 Historial de fórmulas</span><span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.68rem">'+hist.length+'</span></div><div class="card-body">'
  +(hist.length>=2?svgLineChart({data:hist.map(function(r){return{label:fD(r.fecha).slice(0,5),value:r.get}}),width:360,height:120,unit:'kcal',color:'var(--primary)',title:'Evolución GET'}):'')
  +'<div style="overflow-x:auto;margin-top:10px;border-radius:10px;border:1px solid var(--border)"><table style="width:100%;border-collapse:collapse;font-size:.8rem"><thead><tr style="background:var(--surface2)">'
  +'<th style="padding:8px 12px;text-align:left;font-size:.65rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Fecha</th>'
  +'<th style="padding:8px;text-align:left;font-size:.65rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Fórmula</th>'
  +'<th style="padding:8px;text-align:center;font-size:.65rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">GEB</th>'
  +'<th style="padding:8px;text-align:center;font-size:.65rem;text-transform:uppercase;letter-spacing:.5px;color:var(--primary);font-weight:600">GET</th>'
  +'<th style="padding:8px;text-align:center;font-size:.65rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">P</th>'
  +'<th style="padding:8px;text-align:center;font-size:.65rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">G</th>'
  +'<th style="padding:8px;text-align:center;font-size:.65rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">HC</th>'
  +'</tr></thead><tbody>'
  +hist.slice().reverse().map(function(r,i){return '<tr style="border-bottom:1px solid var(--border);background:'+(i%2===1?'var(--surface)':'transparent')+'"><td style="padding:8px 12px;font-variant-numeric:tabular-nums;font-size:.78rem">'+fD(r.fecha)+'</td><td style="padding:8px;font-size:.72rem;color:var(--text-secondary)">'+r.formula+'</td><td style="padding:8px;text-align:center;font-variant-numeric:tabular-nums">'+Math.round(r.geb)+'</td><td style="padding:8px;text-align:center;font-weight:800;color:var(--primary);font-variant-numeric:tabular-nums">'+r.get+'</td><td style="padding:8px;text-align:center;font-variant-numeric:tabular-nums">'+r.protG+'g</td><td style="padding:8px;text-align:center;font-variant-numeric:tabular-nums">'+r.grasasG+'g</td><td style="padding:8px;text-align:center;font-variant-numeric:tabular-nums">'+r.hcG+'g</td></tr>'}).join('')
  +'</tbody></table></div></div></div>';
})()}
</div>
</div></div>`;
}

// F3: Show comparison after render
var _fOldRFormula=rFormula;
rFormula=function(){_fOldRFormula();fAutoRecalc();
  if(typeof renderFormulaHistory==='function'){
    var histHtml=renderFormulaHistory();
    if(histHtml){var hd=document.createElement('div');hd.innerHTML=histHtml;
    var fi=document.querySelector('.fade-in');if(fi)fi.appendChild(hd)}
  }
  var el=document.getElementById('mainContent');
  if(el&&typeof renderFormulaComparison==='function'){
    var _cp=gP(selPat);
    if(_cp){
      var _ca=DB.antropometrias.filter(function(a){return a.pacienteId===selPat}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)})[0];
      if(_ca){
        var div=document.createElement('div');div.style.marginTop='18px';
        div.innerHTML=renderFormulaComparison(_ca.peso,_ca.altura,age(_cp.fechaNacimiento),_cp.sexo==='MASCULINO'?'M':'F');
        el.querySelector('.fade-in').appendChild(div);
      }
    }
  }
};

function calcFormula(){
  const w=+$('fP').value,h=+$('fH').value,e=+$('fE').value,s=$('fS').value,fa=+$('fA').value,fe=+$('fSt').value,aj=+$('fAj').value||0,pk=+$('fPk').value,gp=+$('fGp').value,f=$('fF').value;
  var sexCode=s==='M'?'MASCULINO':'FEMENINO';
  let geb;if(f==='Mifflin-St Jeor')geb=10*w+6.25*h-5*e+(s==='M'?5:-161);else if(f==='Harris-Benedict')geb=s==='M'?66.5+13.75*w+5.003*h-6.775*e:655.1+9.563*w+1.85*h-4.676*e;else if(f==='Cunningham'){var mm=w*(1-(parseFloat($('fGr')?$('fGr').value:25)||25)/100);geb=500+22*mm}else if(f==='Schofield (OMS)')geb=typeof formulaSchofield==='function'?formulaSchofield(w,sexCode,e):(s==='M'?879+10.2*w:795+7.18*w);else if(f==='Henry (Oxford)')geb=typeof formulaHenry==='function'?formulaHenry(w,sexCode,e):(s==='M'?879+10.2*w:795+7.18*w);else geb=s==='M'?879+10.2*w:795+7.18*w;
  const get=Math.round(geb*fa*fe)+aj,pG=Math.round(pk*w),pK=pG*4,pP=Math.round(pK/get*100),gK=Math.round(get*gp/100),gG=Math.round(gK/9),hK=get-pK-gK,hG=Math.round(hK/4),hP=100-pP-gp,fi=Math.round(14*get/1000),ag=Math.round(35*w/1000*10)/10;
  var _rh=typeof reqHidrico==='function'?reqHidrico(w):Math.round(35*w);
  var _pi=typeof pesosIdeales==='function'?pesosIdeales(h,sexCode):null;

  $('fRes').innerHTML=`<div class="card-header" style="background:var(--primary-light)"><span class="card-title" style="font-size:.88rem">📊 Resultados</span><span style="display:inline-block;padding:3px 10px;border-radius:8px;font-size:.68rem;font-weight:700;background:var(--primary);color:#fff">✅ Calculado</span></div>
<div class="card-body" style="padding:22px">

<!-- GET Hero -->
<div style="text-align:center;margin-bottom:20px;padding:18px;background:linear-gradient(135deg,var(--primary-light),var(--accent-light));border-radius:14px">
  <div style="font-size:.68rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1.5px;font-weight:600">${f}</div>
  <div style="font-size:2.6rem;font-weight:900;color:var(--primary);letter-spacing:-1px;line-height:1;margin:6px 0">${get}</div>
  <div style="font-size:.82rem;color:var(--text-secondary);font-weight:500">kcal / día</div>
  <div style="font-size:.7rem;color:var(--text3);margin-top:6px">GEB: ${Math.round(geb)} · FA: ×${fa} · FE: ×${fe}${aj?(' · Ajuste: '+(aj>0?'+':'')+aj):''}
  </div>
</div>

<!-- Macros cards -->
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
  <div style="background:var(--accent-light);border-radius:10px;padding:12px;text-align:center;border-top:3px solid var(--accent)">
    <div style="font-size:1.4rem;font-weight:800;color:var(--accent)">${pG}g</div>
    <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Proteínas</div>
    <div style="font-size:.65rem;color:var(--text3);margin-top:2px">${pP}% · ${pK}kcal · ${pk}g/kg</div>
  </div>
  <div style="background:var(--warning-light);border-radius:10px;padding:12px;text-align:center;border-top:3px solid var(--warning)">
    <div style="font-size:1.4rem;font-weight:800;color:var(--warning)">${gG}g</div>
    <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Grasas</div>
    <div style="font-size:.65rem;color:var(--text3);margin-top:2px">${gp}% · ${gK}kcal</div>
  </div>
  <div style="background:#f0fdf4;border-radius:10px;padding:12px;text-align:center;border-top:3px solid #16a34a">
    <div style="font-size:1.4rem;font-weight:800;color:#16a34a">${hG}g</div>
    <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Hidratos</div>
    <div style="font-size:.65rem;color:var(--text3);margin-top:2px">${hP}% · ${hK}kcal</div>
  </div>
</div>

<!-- Micro cards: fiber + water -->
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
  <div style="background:var(--surface2);border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px">
    <span style="font-size:1.1rem">🌿</span>
    <div><div style="font-size:1rem;font-weight:800">${fi}g</div><div style="font-size:.62rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600">Fibra</div></div>
  </div>
  <div style="background:var(--surface2);border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px">
    <span style="font-size:1.1rem">💧</span>
    <div><div style="font-size:1rem;font-weight:800">${Math.round(_rh)}ml</div><div style="font-size:.62rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600">Req. Hídrico</div></div>
  </div>
</div>
${_pi?`
<div style="margin-bottom:18px">
  <div style="font-size:.68rem;font-weight:600;margin-bottom:6px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Peso ideal (5 métodos)</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px">
    <div style="background:var(--surface2);border-radius:8px;padding:8px 10px;text-align:center"><div style="font-size:.92rem;font-weight:800">${_pi.hamwi.toFixed(1)}</div><div style="font-size:.55rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.3px">Hamwi</div></div>
    <div style="background:var(--surface2);border-radius:8px;padding:8px 10px;text-align:center"><div style="font-size:.92rem;font-weight:800">${_pi.devine.toFixed(1)}</div><div style="font-size:.55rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.3px">Devine</div></div>
    <div style="background:var(--surface2);border-radius:8px;padding:8px 10px;text-align:center"><div style="font-size:.92rem;font-weight:800">${_pi.robinson.toFixed(1)}</div><div style="font-size:.55rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.3px">Robinson</div></div>
    <div style="background:var(--surface2);border-radius:8px;padding:8px 10px;text-align:center"><div style="font-size:.92rem;font-weight:800">${_pi.miller.toFixed(1)}</div><div style="font-size:.55rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.3px">Miller</div></div>
    <div style="background:var(--surface2);border-radius:8px;padding:8px 10px;text-align:center"><div style="font-size:.92rem;font-weight:800">${_pi.imc22.toFixed(1)}</div><div style="font-size:.55rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.3px">IMC 22</div></div>
  </div>
</div>`:``}

<!-- Distribution bar -->
<div style="margin-bottom:18px">
  <div style="font-size:.68rem;font-weight:600;margin-bottom:6px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Distribución energética</div>
  <div style="display:flex;height:26px;border-radius:13px;overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,.1)">
    <div style="width:${pP}%;background:var(--accent);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.65rem;font-weight:700">P ${pP}%</div>
    <div style="width:${gp}%;background:#f59e0b;display:flex;align-items:center;justify-content:center;color:#fff;font-size:.65rem;font-weight:700">G ${gp}%</div>
    <div style="width:${hP}%;background:#16a34a;display:flex;align-items:center;justify-content:center;color:#fff;font-size:.65rem;font-weight:700">HC ${hP}%</div>
  </div>
</div>

<!-- Clinical indicators -->
<div style="border-top:1px solid var(--border);padding-top:14px;margin-bottom:16px">
  <div style="font-size:.68rem;font-weight:600;margin-bottom:8px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">📐 Indicadores clínicos</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px">
${[
  {l:'IMC',v:(w/((h/100)**2)).toFixed(1),d:imcCat(w/((h/100)**2)).l},
  {l:'PI Devine',v:s==='M'?(50+0.91*(h-152.4)).toFixed(1):(45.5+0.91*(h-152.4)).toFixed(1),d:'kg'},
  {l:'PI Lorentz',v:s==='M'?(h-100-(h-150)/4).toFixed(1):(h-100-(h-150)/2.5).toFixed(1),d:'kg'},
  {l:'P. Ajustado',v:(+(parseFloat(s==='M'?(50+0.91*(h-152.4)).toFixed(1):(45.5+0.91*(h-152.4)).toFixed(1))+0.25*(w-parseFloat(s==='M'?(50+0.91*(h-152.4)).toFixed(1):(45.5+0.91*(h-152.4)).toFixed(1))))).toFixed(1),d:'PI+25% exc.'}
].map(x=>'<div style="padding:8px 10px;background:var(--surface2);border-radius:8px;text-align:center"><div style="font-size:.58rem;color:var(--text3);text-transform:uppercase;letter-spacing:.3px;font-weight:600">'+x.l+'</div><div style="font-size:1rem;font-weight:800;margin-top:2px">'+x.v+'</div><div style="font-size:.58rem;color:var(--text3)">'+x.d+'</div></div>').join('')}
  </div>
</div>

<!-- Actions -->
<div style="display:flex;gap:8px;flex-wrap:wrap">
  <button class="btn btn-primary btn-sm" style="border-radius:8px;display:flex;align-items:center;gap:4px" onclick="saveFormulaResult()">💾 Guardar en historia</button>
  <button class="btn btn-outline btn-sm" style="border-radius:8px;display:flex;align-items:center;gap:4px" onclick="navigate('desarrollada')">🔬 Desarrollada</button>
  <button class="btn btn-outline btn-sm" style="border-radius:8px;display:flex;align-items:center;gap:4px" onclick="navigate('planes')">📋 Plan</button>
</div>
</div>`;toast(get+' kcal/día');}

function saveFormulaResult(){
  if(!selPat){toast('Seleccione un paciente','error');return}
  var fRes=$('fRes');
  if(!fRes||fRes.querySelector('.empty-state')){toast('Primero calcule la fórmula','error');return}
  var p=gP(selPat);if(!p)return;
  var result={
    fecha:new Date().toISOString().slice(0,10),
    formula:$('fF').value,
    peso:+$('fP').value,altura:+$('fH').value,edad:+$('fE').value,sexo:$('fS').value,
    factorActividad:+$('fA').value,factorEstres:+$('fSt').value,ajuste:+$('fAj').value||0,
    protGkg:+$('fPk').value,grasasPct:+$('fGp').value
  };
  var w=result.peso,h=result.altura,e=result.edad,s=result.sexo,f=result.formula;
  var sx=s==='M'?'MASCULINO':'FEMENINO';
  if(f==='Mifflin-St Jeor')result.geb=10*w+6.25*h-5*e+(s==='M'?5:-161);
  else if(f==='Harris-Benedict')result.geb=s==='M'?66.5+13.75*w+5.003*h-6.775*e:655.1+9.563*w+1.85*h-4.676*e;
  else if(f==='Schofield (OMS)'&&typeof formulaSchofield==='function')result.geb=formulaSchofield(w,sx,e);
  else if(f==='Henry (Oxford)'&&typeof formulaHenry==='function')result.geb=formulaHenry(w,sx,e);
  else result.geb=s==='M'?879+10.2*w:795+7.18*w;
  result.get=Math.round(result.geb*result.factorActividad*result.factorEstres)+result.ajuste;
  result.protG=Math.round(result.protGkg*w);
  result.grasasG=Math.round(result.get*result.grasasPct/100/9);
  result.hcG=Math.round((result.get-result.protG*4-result.grasasG*9)/4);
  if(!DB.formulaResults) DB.formulaResults={};
  if(!DB.formulaResults[selPat]) DB.formulaResults[selPat]=[];
  DB.formulaResults[selPat].push(result);
  toast('Fórmula guardada en historia de '+p.nombre);showSaved();
}

// F1: Auto-recalc on input change
function fAutoRecalc(){
  setTimeout(function(){
    var ids=['fP','fH','fE','fA','fSt','fAj','fPk','fGp'];
    ids.forEach(function(id){
      var el=document.getElementById(id);
      if(el) el.addEventListener('input',function(){clearTimeout(window._fRecalcTimer);window._fRecalcTimer=setTimeout(calcFormula,400)});
    });
    var sels=['fS','fF'];
    sels.forEach(function(id){
      var el=document.getElementById(id);
      if(el) el.addEventListener('change',function(){calcFormula()});
    });
  },100);
}

// F2: Show formula history inline
function renderFormulaHistory(){
  if(!selPat||!DB.formulaResults||!DB.formulaResults[selPat])return '';
  var hist=DB.formulaResults[selPat];
  if(!hist||!hist.length)return '';
  return '<div class="card" style="margin-top:14px;border-top:3px solid #6366f1"><div class="card-header"><span class="card-title" style="font-size:.85rem">📄 Historial</span></div>'
  +'<div class="card-body" style="padding:0;overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.8rem"><thead><tr style="background:var(--surface2)"><th style="padding:8px 12px;text-align:left;font-size:.65rem;text-transform:uppercase;color:var(--text-secondary);font-weight:600">Fecha</th><th style="padding:8px;text-align:left;font-size:.65rem;text-transform:uppercase;color:var(--text-secondary);font-weight:600">Fórmula</th><th style="padding:8px;text-align:center;font-size:.65rem;text-transform:uppercase;color:var(--text-secondary);font-weight:600">GEB</th><th style="padding:8px;text-align:center;font-size:.65rem;text-transform:uppercase;color:var(--primary);font-weight:600">GET</th><th style="padding:8px;text-align:center;font-size:.65rem;text-transform:uppercase;color:var(--text-secondary);font-weight:600">Prot g/kg</th></tr></thead><tbody>'
  +hist.slice(-5).reverse().map(function(r,i){return '<tr style="border-bottom:1px solid var(--border);background:'+(i%2===1?'var(--surface)':'transparent')+'"><td style="padding:8px 12px;font-variant-numeric:tabular-nums;font-size:.78rem">'+fD(r.fecha||'')+'</td><td style="padding:8px;font-size:.75rem;color:var(--text-secondary)">'+r.formula+'</td><td style="padding:8px;text-align:center;font-weight:600;font-variant-numeric:tabular-nums">'+Math.round(r.geb)+'</td><td style="padding:8px;text-align:center;font-weight:800;color:var(--primary);font-variant-numeric:tabular-nums">'+Math.round(r.get)+'</td><td style="padding:8px;text-align:center;font-variant-numeric:tabular-nums">'+r.protGkg+'</td></tr>'}).join('')
  +'</tbody></table></div></div>';
}

// Deficit functions
function applyDeficit(){
  var pct=parseInt($('fDefPct')?$('fDefPct').value:0)||0;
  if(pct>0){
    $('fDefKcal').value='0'; // Reset other selector
    var get=parseInt($('fAj')?0:0); // Don't use Ajuste for this
    // Calculate: we apply deficit to the base GET before ajuste
    // Just set the Ajuste field to negative value
    var baseGet=parseInt($('fP')?$('fP').value:70)*10; // rough estimate
    // Better: just recalc with negative adjustment
    $('fAj').value=-Math.round(pct/100*parseFloat(getComputedGET()));
    calcFormula();
  } else {
    $('fAj').value=0;
    calcFormula();
  }
}

function applyDeficitKcal(){
  var kcal=parseInt($('fDefKcal')?$('fDefKcal').value:0)||0;
  if(kcal>0){
    $('fDefPct').value='0';
    $('fAj').value=-kcal;
    calcFormula();
  } else {
    $('fAj').value=0;
    calcFormula();
  }
}

function getComputedGET(){
  var w=+($('fP')||{}).value||70,h=+($('fH')||{}).value||165,e=+($('fE')||{}).value||30,s=($('fS')||{}).value||'F',fa=+($('fA')||{}).value||1.55,fe=+($('fSt')||{}).value||1,f=($('fF')||{}).value||'Mifflin-St Jeor';
  var geb;if(f==='Mifflin-St Jeor')geb=10*w+6.25*h-5*e+(s==='M'?5:-161);else if(f==='Harris-Benedict')geb=s==='M'?66.5+13.75*w+5.003*h-6.775*e:655.1+9.563*w+1.85*h-4.676*e;else geb=s==='M'?879+10.2*w:795+7.18*w;
  return Math.round(geb*fa*fe);
}
