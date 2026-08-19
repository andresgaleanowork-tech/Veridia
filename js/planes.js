// ===== PLANES ALIMENTARIOS (conectado a Pacientes + BEDCA + Fórmula + Recetas) =====
var mealPlans=[];
try{var _mp=JSON.parse(localStorage.getItem('veridia_db'));if(_mp&&_mp.mealPlans)_mp.mealPlans.forEach(function(p){mealPlans.push(p)})}catch(e){console.warn('[Veridia]',e.message||e)}
var editingPlan=null;
var MEAL_TYPES=[{t:'Desayuno',pct:20,ic:'☀️'},{t:'Media mañana',pct:10,ic:'🍎'},{t:'Comida',pct:35,ic:'🍽️'},{t:'Merienda',pct:10,ic:'🍽️'},{t:'Cena',pct:25,ic:'🌙'}];

function rPlanes(){
  const p=requirePatient();if(!p)return;
  const patPlans=mealPlans.filter(mp=>mp.pacienteId===selPat);
  const activePlan=patPlans.find(mp=>mp.estado==='activo');

  $('mainContent').innerHTML='<div class="fade-in">'
  // ═══ HERO HEADER ═══
  +'<div class="card" style="border:none;background:linear-gradient(135deg,#0E7490 0%,#0891B2 50%,#22D3EE 100%);color:#fff;margin-bottom:22px;border-radius:var(--radius);overflow:hidden;position:relative">'
  +'<div style="position:absolute;top:-30px;right:-20px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.04)"></div>'
  +'<div class="card-body" style="padding:22px 28px;position:relative;z-index:1">'
  +'<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px">'
  +'<div><div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">'+'🍽️'
  +'<h2 style="margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.3px">Planes Alimentarios</h2></div>'
  +'<p style="margin:0;font-size:.78rem;opacity:.75">'+sanitize(p.nombre)+' '+sanitize(p.apellidos)+(activePlan?' · <strong>'+activePlan.kcalObjetivo+' kcal/día</strong>':' · Sin plan activo')+'</p></div>'
  +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
  +'<button class="btn" style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25);font-size:.78rem" onclick="createPlanFromTemplate()">📋 Desde plantilla</button>'
  +'<button class="btn" style="background:#fff;color:#16a34a;font-weight:700;border:none" onclick="openNewPlanWizard()">'+IC.plus+' Crear plan</button>'
  +'</div></div></div></div>'
  // ═══ PATIENT SELECTOR ═══
  +'<div style="margin-bottom:18px;display:flex;align-items:center;gap:10px"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600;margin:0;white-space:nowrap">Paciente:</label>'+patSel(selPat)+'</div>'
  // ═══ ACTIVE PLAN OR EMPTY STATE ═══
  +(activePlan?renderPlanView(activePlan)
  :'<div class="card" style="text-align:center;padding:50px"><div style="font-size:3.5rem;margin-bottom:14px;opacity:.3">🍽️</div>'
  +'<p style="color:var(--text-secondary);font-size:.92rem;margin:0;font-weight:600">Sin plan alimentario activo</p>'
  +'<p style="color:var(--text3);font-size:.78rem;margin:6px 0 20px;max-width:420px;margin-left:auto;margin-right:auto">Cree un nuevo plan para '+p.nombre+'. El sistema calculará automáticamente los requerimientos y le permitirá seleccionar alimentos de BEDCA.</p>'
  +'<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'
  +'<button class="btn btn-primary" style="border-radius:10px;padding:10px 28px" onclick="openNewPlanWizard()">'+IC.plus+' Crear primer plan</button>'
  +'<button class="btn btn-outline" style="border-radius:10px" onclick="selPat='+selPat+';navigate(\'desarrollada\')">🔬 Desarrollada</button>'
  +'</div></div>')
  // ═══ PLAN HISTORY ═══
  +(patPlans.length>1?'<div class="card" style="margin-top:18px;border-top:3px solid #6366f1"><div class="card-header"><span class="card-title" style="font-size:.85rem">📁 Historial de planes</span><span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.68rem">'+patPlans.length+'</span></div>'
  +'<div class="card-body" style="padding:0;overflow-x:auto"><table role="table" style="width:100%;border-collapse:collapse;font-size:.82rem"><thead><tr style="background:var(--surface2)">'
  +'<th style="padding:10px 14px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Plan</th>'
  +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Fecha</th>'
  +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Kcal</th>'
  +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Estado</th>'
  +'<th style="padding:10px 8px;width:60px"></th></tr></thead><tbody>'
  +patPlans.map(function(mp,i){return '<tr style="border-bottom:1px solid var(--border);background:'+(i%2===1?'var(--surface)':'transparent')+'"><td style="padding:10px 14px;font-weight:600">'+mp.nombre+'</td><td style="padding:10px;text-align:center;font-variant-numeric:tabular-nums;font-size:.78rem">'+fD(mp.fechaCreacion)+'</td><td style="padding:10px;text-align:center;font-weight:700;font-variant-numeric:tabular-nums">'+mp.kcalObjetivo+' kcal</td>'
  +'<td style="padding:10px;text-align:center"><span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:.65rem;font-weight:700;'+(mp.estado==='activo'?'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0':'background:var(--surface2);color:var(--text3);border:1px solid var(--border)')+'">'+mp.estado+'</span></td>'
  +'<td style="padding:10px"><button class="btn btn-outline btn-xs" style="border-radius:6px" onclick="editingPlan='+mp.id+';rPlanes()">Ver</button></td></tr>'}).join('')
  +'</tbody></table></div></div>':'')
  +'</div>';
}

function renderPlanView(plan){
  const p=gP(plan.pacienteId);
  const totals=calcPlanTotals(plan);
  const pPct=plan.kcalObjetivo>0?Math.round(totals.p*4/plan.kcalObjetivo*100):0;
  const gPct=plan.kcalObjetivo>0?Math.round(totals.g*9/plan.kcalObjetivo*100):0;
  const hPct=100-pPct-gPct;

  return `
<div class="card" style="margin-bottom:14px;border-top:3px solid var(--primary)"><div class="card-header">
  <span class="card-title" style="font-size:.88rem">🍽️ ${plan.nombre}</span>
  <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
    <span class="badge badge-success">${plan.estado}</span>
    <span class="badge badge-primary">${plan.kcalObjetivo} kcal/día</span>
    ${plan.patologia?`<span class="badge badge-warning" style="font-size:.6rem">⚕️ ${plan.patologia}</span>`:''}
    ${plan.formulaUsada?`<span class="badge badge-neutral" style="font-size:.58rem">🔬 ${plan.formulaUsada}</span>`:''}
    <button class="btn btn-outline btn-xs" onclick="generatePlanPDF(mealPlans.find(mp=>mp.pacienteId===selPat&&mp.estado==='activo')?.id)">📄 PDF real</button>
    <button class="btn btn-outline btn-xs" onclick="generateShoppingList(mealPlans.find(mp=>mp.pacienteId===selPat&&mp.estado==='activo')?.id)">📦 Lista compra</button>
    <button class="btn btn-outline btn-xs" onclick="savePlanAsTemplate(mealPlans.find(mp=>mp.pacienteId===selPat&&mp.estado==='activo')?.id)">📋 Guardar plantilla</button>
  </div>
</div>
<div class="card-body" style="padding:14px">
  <!-- Macro targets vs actual -->
  <div style="display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap">
    <div style="flex:1;min-width:200px">
      <div style="font-size:.72rem;font-weight:600;color:var(--text2);margin-bottom:6px">Objetivo diario</div>
      <div style="display:flex;gap:12px;font-size:.82rem">
        <span><strong>${plan.kcalObjetivo}</strong> kcal</span>
        <span style="color:var(--accent)"><strong>${plan.protG}g</strong> P</span>
        <span style="color:var(--warning)"><strong>${plan.grasasG}g</strong> G</span>
        <span style="color:var(--success)"><strong>${plan.hcG}g</strong> HC</span>
      </div>
    </div>
    <div style="flex:1;min-width:200px">
      <div style="font-size:.72rem;font-weight:600;color:var(--text2);margin-bottom:6px">Promedio real (Lunes)</div>
      <div style="display:flex;gap:12px;font-size:.82rem">
        <span><strong>${totals.kcal}</strong> kcal</span>
        <span style="color:var(--accent)"><strong>${totals.p}g</strong> P</span>
        <span style="color:var(--warning)"><strong>${totals.g}g</strong> G</span>
        <span style="color:var(--success)"><strong>${totals.h}g</strong> HC</span>
      </div>
    </div>
  </div>
  <!-- Progress bars -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:14px">
    ${[{l:'Energía',v:totals.kcal,t:plan.kcalObjetivo,u:'kcal',c:'var(--primary)'},{l:'Proteínas',v:totals.p,t:plan.protG,u:'g',c:'var(--accent)'},{l:'Grasas',v:totals.g,t:plan.grasasG,u:'g',c:'var(--warning)'},{l:'HC',v:totals.h,t:plan.hcG,u:'g',c:'var(--success)'}].map(x=>{
      const pct=x.t>0?Math.min(Math.round(x.v/x.t*100),120):0;
      const ok=pct>=90&&pct<=110;
      return`<div style="font-size:.72rem"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="color:var(--text2);font-weight:600">${x.l}</span><span style="${ok?'color:var(--success)':'color:var(--warning)'};font-weight:700">${pct}%</span></div><div class="progress"><div class="progress-bar" style="width:${Math.min(pct,100)}%;background:${x.c}"></div></div></div>`;
    }).join('')}
  </div>
</div></div>

<!-- Days -->
${plan.dias.map((dia,di)=>`
<div class="meal-day">
  <div class="meal-day-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'':'none'">
    <span>📅 ${dia.dia} ${dia.comidas.length?'':'<span style=\"font-size:.7rem;color:var(--text3)\">(vacío)</span>'}</span>
    <div style="display:flex;gap:8px;align-items:center">
      ${dia.comidas.length?`<span style="font-size:.72rem;color:var(--text3)">${dia.comidas.reduce((s,c)=>s+c.kcal,0)} kcal</span>`:''}
      <button class="btn btn-outline btn-xs" onclick="event.stopPropagation();openAddMealModal(${plan.id},${di})">+ Comida</button>
    </div>
  </div>
  <div class="meal-day-body"${di>1&&!dia.comidas.length?' style="display:none"':''}>
    ${dia.comidas.length?dia.comidas.map((c,ci)=>`
      <div class="meal-item" style="flex-wrap:wrap">
        <span class="meal-type">${MEAL_TYPES.find(m=>m.t===c.tipo)?.ic||'🍽️'} ${c.tipo}</span>
        <span class="meal-foods">${c.items.map(it=>it.nombre+' <span style="color:var(--text3);font-size:.72rem">'+it.gramos+'g</span>').join(' · ')}</span>
        <span class="meal-kcal" style="display:flex;gap:8px;align-items:center">
          <span>${c.kcal} kcal</span>
          <span style="font-size:.68rem;color:var(--accent)">${c.p}g P</span>
          <span style="font-size:.68rem;color:var(--warning)">${c.g}g G</span>
          <span style="font-size:.68rem;color:var(--success)">${c.h}g HC</span>
          <button class="btn btn-ghost btn-xs" onclick="removeMeal(${plan.id},${di},${ci})" style="color:var(--danger)">✕</button>
        </span>
      </div>
    `).join(''):`<div style="padding:12px;text-align:center;font-size:.78rem;color:var(--text3)">Sin comidas asignadas · <a href="#" onclick="event.preventDefault();openAddMealModal(${plan.id},${di})" style="font-weight:600">Agregar comida</a></div>`}
  </div>
</div>
`).join('')}`;
}

function calcPlanTotals(plan){
  // Calculate from first day with data
  const dia=plan.dias.find(d=>d.comidas.length>0);
  if(!dia) return {kcal:0,p:0,g:0,h:0};
  return dia.comidas.reduce((s,c)=>({kcal:s.kcal+c.kcal,p:s.p+c.p,g:s.g+c.g,h:s.h+c.h}),{kcal:0,p:0,g:0,h:0});
}

// ===== WIZARD: Create new plan =====
function openNewPlanWizard(){
  if(!selPat) selPat=1;
  const p=gP(selPat);
  const antro=DB.antropometrias.filter(a=>a.pacienteId===selPat).sort((a,b)=>b.fecha.localeCompare(a.fecha))[0];
  const peso=antro?antro.peso:70;
  const altura=antro?antro.altura:165;
  const ed=age(p.fechaNacimiento);
  const sexo=p.sexo==='MASCULINO'?'M':'F';
  // Auto-calc formulas
  const gebMifflin=10*peso+6.25*altura-5*ed+(sexo==='M'?5:-161);
  const gebHB=sexo==='M'?(66.5+13.75*peso+5.003*altura-6.775*ed):(655.1+9.563*peso+1.85*altura-4.676*ed);
  const gebOwen=sexo==='M'?(879+10.2*peso):(795+7.18*peso);

  // Default meal structure
  window._planMeals=[
    {nombre:'Desayuno',pct:20},{nombre:'Media mañana',pct:10},{nombre:'Almuerzo',pct:30},
    {nombre:'Merienda',pct:10},{nombre:'Cena',pct:25},{nombre:'Post-cena',pct:5}
  ];

  openModal(`<div class="modal-header"><h3>🍽️ Crear plan alimentario</h3><button onclick="closeModal()">${IC.x}</button></div>
<div class="modal-body" style="max-height:75vh;overflow-y:auto">
  ${typeof wizProgressBar==='function'?wizProgressBar(0,4):''}
  <div class="alert alert-info" style="margin-bottom:14px">
    Paciente: <strong>${p.nombre} ${p.apellidos}</strong> · ${peso}kg · ${altura}cm · ${ed}a · ${p.sexo}
  </div>

  <!-- FORMULA SELECTION -->
  <div class="card" style="margin-bottom:14px;border-top:3px solid var(--primary)"><div class="card-header"><span class="card-title" style="font-size:.85rem">📊 Cálculo energético</span></div><div class="card-body">
  <div class="form-row">
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Fórmula GEB</label>
      <select id="wpFormula" onchange="wizRecalc()">
        <option value="mifflin" selected>Mifflin-St Jeor (${Math.round(gebMifflin)} kcal)</option>
        <option value="hb">Harris-Benedict (${Math.round(gebHB)} kcal)</option>
        <option value="owen">Owen (${Math.round(gebOwen)} kcal)</option>
        <option value="manual">Manual (ingreso libre)</option>
      </select>
    </div>
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Factor actividad</label>
      <select id="wpFA" onchange="wizRecalc()">
        <option value="1.2">Sedentario (1.2)</option>
        <option value="1.375">Ligera (1.375)</option>
        <option value="1.55" selected>Moderada (1.55)</option>
        <option value="1.725">Intensa (1.725)</option>
        <option value="1.9">Muy intensa (1.9)</option>
      </select>
    </div>
  </div>
  <div class="form-row">
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">GEB calculado</label><input type="number" id="wpGEB" value="${Math.round(gebMifflin)}" readonly style="background:var(--surface2)"></div>
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Factor termogénico (%)</label><input type="number" id="wpFT" value="10" min="0" max="30" onchange="wizRecalc()"></div>
  </div>
  <div class="form-row">
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">GET calculado (kcal)</label><input type="number" id="wpGET" value="${Math.round(gebMifflin*1.55*1.1)}" readonly style="background:var(--surface2);font-weight:700"></div>
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Ajuste calórico (kcal)</label><input type="number" id="wpAjuste" value="0" step="50" placeholder="-500 déficit, +300 superávit" onchange="wizRecalc()"></div>
  </div>
  <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">⚡ Kcal OBJETIVO final</label><input type="number" id="wpKcal" value="${Math.round(gebMifflin*1.55*1.1)}" step="25" style="font-size:1.1rem;font-weight:800;text-align:center;border:2px solid var(--primary)" onchange="wizRecalcMacros()"></div>
  </div></div>

  <!-- MACROS -->
  <div class="card" style="margin-bottom:14px;border-top:3px solid var(--accent)"><div class="card-header"><span class="card-title" style="font-size:.85rem">🔬 Macronutrientes</span></div><div class="card-body">
  <div class="form-row">
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Proteínas g/kg</label><input type="number" id="wpProtKg" value="1.2" step="0.1" min="0.5" max="3" onchange="wizRecalcMacros()"></div>
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Proteínas (g)</label><input type="number" id="wpProt" value="${Math.round(1.2*peso)}" onchange="wizRecalcFromG()"></div>
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">% VCT</label><input type="number" id="wpProtPct" value="${Math.round(1.2*peso*4/(gebMifflin*1.55*1.1)*100)}" readonly style="background:var(--surface2)"></div>
  </div>
  <div class="form-row">
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Grasas (%)</label><input type="number" id="wpGrasasPct" value="30" min="15" max="45" onchange="wizRecalcMacros()"></div>
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Grasas (g)</label><input type="number" id="wpGrasas" value="${Math.round(gebMifflin*1.55*1.1*0.30/9)}" onchange="wizRecalcFromG()"></div>
  </div>
  <div class="form-row">
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">HC (g) — auto</label><input type="number" id="wpHC" value="${Math.round((gebMifflin*1.55*1.1-Math.round(1.2*peso)*4-Math.round(gebMifflin*1.55*1.1*0.30/9)*9)/4)}" readonly style="background:var(--surface2)"></div>
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">% VCT HC</label><input type="number" id="wpHCPct" readonly style="background:var(--surface2)"></div>
  </div>
  <div class="form-row">
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Fibra (g)</label><input type="number" id="wpFibra" value="${Math.round(14*gebMifflin*1.55*1.1/1000)}"></div>
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Agua (L)</label><input type="number" id="wpAgua" value="${(35*peso/1000).toFixed(1)}" step="0.1"></div>
  </div>
  <div id="wpMacroBar" style="margin-top:8px"></div>
  </div></div>

  <!-- MEALS / COMIDAS -->
  <div class="card" style="margin-bottom:14px;border-top:3px solid #ca8a04"><div class="card-header"><span class="card-title" style="font-size:.85rem">🍽️ Comidas del día</span>
    <button class="btn btn-outline btn-xs" onclick="addPlanMeal()">+ Agregar comida</button>
  </div><div class="card-body">
  <p style="font-size:.72rem;color:var(--text3);margin-bottom:10px">Configure el número de comidas y el % del VCT para cada una. Total debe sumar 100%.</p>
  <div id="wpMealsContainer"></div>
  <div id="wpMealsTotal" style="margin-top:8px"></div>
  </div></div>

  <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Nombre del plan</label><input id="wpNombre" value="Plan nutricional — ${p.nombre}" placeholder="Nombre del plan"></div>
  <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Días</label>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map((d,i)=>`<label style="display:flex;align-items:center;gap:4px;font-size:.82rem;cursor:pointer"><input type="checkbox" class="wpDia" value="${d}" ${i<5?'checked':''}> ${d}</label>`).join('')}</div>
  </div>
</div>
<div class="modal-footer">
  <button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button>
  <button class="btn btn-primary" onclick="createPlanFromWizard()" style="border-radius:8px;padding:10px 24px">🍽️ Crear plan</button>
</div>`,true);
  // Store calc params for wizRecalc
  window._wizData={peso:peso,altura:altura,edad:ed,sexo:sexo,gebMifflin:gebMifflin,gebHB:gebHB,gebOwen:gebOwen};
  // Sync with formula if available
  if(DB.formulaResults&&DB.formulaResults[selPat]&&DB.formulaResults[selPat].length){
    var lastFormula=DB.formulaResults[selPat][DB.formulaResults[selPat].length-1];
    if(lastFormula.get&&$('wpKcal')){
      $('wpKcal').value=lastFormula.get;
      toast('Kcal sincronizadas desde última fórmula: '+lastFormula.get+' kcal','info');
    }
  }
  setTimeout(function(){wizRecalcMacros();renderPlanMeals()},50);
}

// Wizard recalculation functions
function wizRecalc(){
  var d=window._wizData;if(!d)return;
  var formula=$('wpFormula').value;
  var fa=parseFloat($('wpFA').value);
  var ft=parseFloat($('wpFT').value)||0;
  var geb;
  if(formula==='mifflin') geb=d.gebMifflin;
  else if(formula==='hb') geb=d.gebHB;
  else if(formula==='owen') geb=d.gebOwen;
  else geb=parseFloat($('wpGEB').value)||d.gebMifflin;
  if(formula!=='manual') $('wpGEB').value=Math.round(geb);
  var get=Math.round(geb*fa*(1+ft/100));
  $('wpGET').value=get;
  var ajuste=parseInt($('wpAjuste').value)||0;
  $('wpKcal').value=get+ajuste;
  wizRecalcMacros();
}

function wizRecalcMacros(){
  var kcal=parseInt($('wpKcal').value)||1800;
  var protKg=parseFloat($('wpProtKg').value)||1.2;
  var d=window._wizData;
  var protG=Math.round(protKg*(d?d.peso:70));
  $('wpProt').value=protG;
  $('wpProtPct').value=Math.round(protG*4/kcal*100);
  var grasasPct=parseInt($('wpGrasasPct').value)||30;
  var grasasG=Math.round(kcal*grasasPct/100/9);
  $('wpGrasas').value=grasasG;
  var hcG=Math.round((kcal-protG*4-grasasG*9)/4);
  if(hcG<0) hcG=0;
  $('wpHC').value=hcG;
  $('wpHCPct').value=Math.round(hcG*4/kcal*100);
  renderMacroBar(kcal,protG,grasasG,hcG);
  renderPlanMeals();
}

function wizRecalcFromG(){
  var kcal=parseInt($('wpKcal').value)||1800;
  var protG=parseInt($('wpProt').value)||80;
  var grasasG=parseInt($('wpGrasas').value)||60;
  var hcG=Math.round((kcal-protG*4-grasasG*9)/4);
  if(hcG<0) hcG=0;
  $('wpHC').value=hcG;
  var d=window._wizData;
  $('wpProtKg').value=(protG/(d?d.peso:70)).toFixed(1);
  $('wpProtPct').value=Math.round(protG*4/kcal*100);
  $('wpGrasasPct').value=Math.round(grasasG*9/kcal*100);
  $('wpHCPct').value=Math.round(hcG*4/kcal*100);
  renderMacroBar(kcal,protG,grasasG,hcG);
  renderPlanMeals();
}

function renderMacroBar(kcal,pG,gG,hG){
  var pK=pG*4,gK=gG*9,hK=hG*4,t=pK+gK+hK;
  var pp=t>0?Math.round(pK/t*100):0,gp=t>0?Math.round(gK/t*100):0,hp=100-pp-gp;
  var el=$('wpMacroBar');if(!el)return;
  el.innerHTML='<div style="display:flex;height:16px;border-radius:8px;overflow:hidden;margin-bottom:4px">'
    +'<div style="width:'+pp+'%;background:var(--accent);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.58rem;font-weight:700">'+(pp>8?'P '+pp+'%':'')+'</div>'
    +'<div style="width:'+gp+'%;background:#f59e0b;display:flex;align-items:center;justify-content:center;color:#fff;font-size:.58rem;font-weight:700">'+(gp>8?'G '+gp+'%':'')+'</div>'
    +'<div style="width:'+hp+'%;background:var(--success);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.58rem;font-weight:700">'+(hp>8?'HC '+hp+'%':'')+'</div>'
    +'</div><div style="font-size:.65rem;color:var(--text3)">Total: '+Math.round(t)+' kcal · P '+pG+'g ('+Math.round(pK)+' kcal) · G '+gG+'g ('+Math.round(gK)+' kcal) · HC '+hG+'g ('+Math.round(hK)+' kcal)</div>';
}

function renderPlanMeals(){
  var el=$('wpMealsContainer');if(!el)return;
  var meals=window._planMeals||[];
  var kcal=parseInt($('wpKcal')?$('wpKcal').value:1800)||1800;
  el.innerHTML=meals.map(function(m,i){
    var mKcal=Math.round(kcal*m.pct/100);
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;padding:8px;background:var(--surface2);border-radius:var(--radius-xs)">'
      +'<input type="text" value="'+m.nombre+'" style="flex:1;font-size:.82rem;font-weight:600" onchange="window._planMeals['+i+'].nombre=this.value">'
      +'<input type="number" value="'+m.pct+'" min="0" max="100" style="width:60px;text-align:center;font-weight:700" onchange="window._planMeals['+i+'].pct=parseInt(this.value)||0;renderPlanMeals()">'
      +'<span style="font-size:.72rem;color:var(--text3);white-space:nowrap">% = <strong>'+mKcal+' kcal</strong></span>'
      +'<button class="btn btn-ghost btn-xs" style="color:var(--danger)" onclick="window._planMeals.splice('+i+',1);renderPlanMeals()">✕</button>'
      +'</div>';
  }).join('');
  // Total
  var total=meals.reduce(function(s,m){return s+m.pct},0);
  var totEl=$('wpMealsTotal');
  if(totEl) totEl.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;font-size:.78rem;padding:6px 8px;border-radius:var(--radius-xs);background:'+(total===100?'var(--success-light)':'var(--warning-light)')+'">'
    +'<span><strong>'+meals.length+' comidas</strong> · Total: <strong style="color:'+(total===100?'var(--success)':'var(--danger)')+'">'+total+'%</strong>'+(total!==100?' <span style="color:var(--danger)">(debe ser 100%)</span>':'')+'</span>'
    +'<span style="font-weight:700">'+kcal+' kcal</span></div>';
}

function addPlanMeal(){
  if(!window._planMeals) window._planMeals=[];
  window._planMeals.push({nombre:'Colación',pct:5});
  renderPlanMeals();
}

function createPlanFromWizard(){
  const dias=[];
  document.querySelectorAll('.wpDia:checked').forEach(cb=>dias.push({dia:cb.value,comidas:[]}));
  if(!dias.length){toast('Seleccione al menos un día','error');return}
  var meals=window._planMeals||[];
  var totalPct=meals.reduce(function(s,m){return s+m.pct},0);
  if(totalPct!==100){toast('El % total de comidas debe sumar 100% (actual: '+totalPct+'%)','error');return}
  // Pre-populate comidas structure for each day
  dias.forEach(function(d){
    d.comidas=meals.map(function(m){return{nombre:m.nombre,pct:m.pct,alimentos:[]}});
  });
  const plan={
    id:(mealPlans.length?Math.max.apply(null,mealPlans.map(function(p){return p.id||0}))+1:1),
    pacienteId:selPat,
    nombre:$('wpNombre').value||'Plan nutricional',
    estado:'activo',
    fechaCreacion:new Date().toISOString().slice(0,10),
    kcalObjetivo:+$('wpKcal').value||1800,
    protG:+$('wpProt').value||80,
    grasasG:+$('wpGrasas').value||60,
    hcG:+$('wpHC').value||220,
    fibraG:+$('wpFibra').value||25,
    aguaL:+$('wpAgua').value||2,
    formulaUsada:$('wpFormula')?$('wpFormula').value:'mifflin',
    factorActividad:$('wpFA')?parseFloat($('wpFA').value):1.55,
    comidas:meals.map(function(m){return{nombre:m.nombre,pct:m.pct}}),
    dias:dias
  };
  mealPlans.filter(mp=>mp.pacienteId===selPat).forEach(mp=>mp.estado='inactivo');
  mealPlans.push(plan);
  closeModal();
  window._planMeals=null;
  window._wizData=null;
  showSaved();
  toast('✅ Plan creado — '+plan.kcalObjetivo+' kcal · '+meals.length+' comidas · '+dias.length+' días. Ve a Historia Clínica → Plan para verlo.');
  navigate('planes');
}

// ===== ADD MEAL with BEDCA food picker =====
function openAddMealModal(planId,diaIdx){
  const plan=mealPlans.find(mp=>mp.id===planId);
  if(!plan) return;

  openModal(`<div class="modal-header"><h3>🍽️ Agregar comida — ${plan.dias[diaIdx].dia}</h3><button onclick="closeModal()">${IC.x}</button></div>
<div class="modal-body">
  <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Tipo de comida</label>
    <select id="amTipo">${MEAL_TYPES.map(m=>`<option value="${m.t}">${m.ic} ${m.t} (${m.pct}%)</option>`).join('')}</select>
  </div>

  <div style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:14px">
    <div style="font-size:.78rem;font-weight:700;color:var(--text2);margin-bottom:8px">🌿 Agregar alimentos desde BEDCA</div>
    <div style="display:flex;gap:6px;margin-bottom:8px">
      <input type="text" id="amBuscar" placeholder="Buscar alimento..." style="flex:1;font-size:.82rem" oninput="filterFoodPicker()">
      <select id="amGrupo" style="width:auto;font-size:.78rem" onchange="filterFoodPicker()">
        <option value="">Todos</option>${BEDCA_GRP.map(g=>`<option value="${g.id}">${g.n.replace(/y derivados|, moluscos.*/g,'').trim()}</option>`).join('')}
      </select>
    </div>
    <div id="amFoodList" style="max-height:180px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-xs)"></div>
  </div>

  <div style="font-size:.78rem;font-weight:700;color:var(--text2);margin-bottom:6px">📋 Alimentos seleccionados</div>
  <div id="amSelected" style="min-height:40px;border:1px dashed var(--border);border-radius:var(--radius-xs);padding:8px">
    <span style="font-size:.75rem;color:var(--text3)" id="amEmptyMsg">Ningún alimento seleccionado. Busque y haga clic para agregar.</span>
  </div>
  <div id="amTotals" style="margin-top:10px;font-size:.78rem;color:var(--text3)"></div>

  <div class="form-group" style="margin-top:12px"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">O agregar receta existente</label>
    <select id="amReceta" onchange="addRecipeToMeal()"><option value="">— Seleccionar receta —</option>${DB.recipes.map(r=>`<option value="${r.id}">${r.nombre} (${r.kcal} kcal)</option>`).join('')}</select>
  </div>
</div>
<div class="modal-footer">
  <button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button>
  <button class="btn btn-primary" onclick="saveMealToPlan(${planId},${diaIdx})">Agregar comida</button>
</div>`,true);

  window._mealItems=[];
  filterFoodPicker();
}

function filterFoodPicker(){
  const q=($('amBuscar')?$('amBuscar').value:'').toLowerCase();
  const g=$('amGrupo')?$('amGrupo').value:'';
  const results=BEDCA_DB.filter(f=>{
    if(!('k' in f)) return false;
    if(g&&f.gi!=g) return false;
    if(q&&f.n.toLowerCase().indexOf(q)===-1) return false;
    return true;
  }).slice(0,30);

  $('amFoodList').innerHTML=results.length?results.map(f=>
    `<div style="padding:6px 10px;border-bottom:1px solid var(--border);cursor:pointer;font-size:.78rem;display:flex;justify-content:space-between;align-items:center;transition:background .1s" onmouseover="this.style.background='var(--primary-light)'" onmouseout="this.style.background=''" onclick="pickFood(${f.id})">
      <span><strong>${f.n}</strong> <span style="color:var(--text3);font-size:.68rem">${f.g.replace(/y derivados|, moluscos.*|, semillas.*/g,'').trim()}</span></span>
      <span style="color:var(--text3);font-size:.7rem">${f.k}kcal · P${f.p} · G${f.gr} · HC${f.h}</span>
    </div>`
  ).join(''):'<div style="padding:12px;text-align:center;font-size:.78rem;color:var(--text3)">Sin resultados</div>';
}

function pickFood(foodId){
  const f=BEDCA_DB.find(x=>x.id===foodId);
  if(!f) return;
  window._mealItems.push({alimentoId:f.id,nombre:f.n,gramos:100,k100:f.k,p100:f.p,g100:f.gr,h100:f.h});
  renderSelectedFoods();
}

function addRecipeToMeal(){
  const rid=+$('amReceta').value;
  if(!rid) return;
  const r=DB.recipes.find(x=>x.id===rid);
  if(!r) return;
  window._mealItems.push({alimentoId:null,nombre:'[Receta] '+r.nombre,gramos:r.raciones*100,k100:r.kcal,p100:r.prot,g100:r.grasas,h100:r.hc,isRecipe:true});
  $('amReceta').value='';
  renderSelectedFoods();
}

function removePickedFood(idx){
  window._mealItems.splice(idx,1);
  renderSelectedFoods();
}

function renderSelectedFoods(){
  const items=window._mealItems;
  if(!items.length){
    $('amSelected').innerHTML='<span style="font-size:.75rem;color:var(--text3)">Ningún alimento seleccionado.</span>';
    $('amTotals').innerHTML='';
    return;
  }
  $('amSelected').innerHTML=items.map((it,i)=>{
    const r=(it.isRecipe?1:it.gramos/100);
    return `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--border);font-size:.78rem">
      <span style="flex:1"><strong>${it.nombre}</strong></span>
      ${it.isRecipe?`<span style="color:var(--text3)">${Math.round(it.k100)} kcal</span>`:`<input type="number" value="${it.gramos}" min="1" style="width:60px;text-align:center;font-size:.78rem;padding:3px" onchange="window._mealItems[${i}].gramos=+this.value;renderSelectedFoods()">`}
      ${it.isRecipe?'':`<span style="color:var(--text3);font-size:.68rem">g</span>`}
      <span style="font-size:.68rem;color:var(--text3)">${Math.round(it.k100*r)}kcal</span>
      <button onclick="removePickedFood(${i})" style="color:var(--danger);background:none;border:none;cursor:pointer;font-size:.9rem;padding:0 4px">✕</button>
    </div>`;
  }).join('');

  // Totals
  let tk=0,tp=0,tg=0,th=0;
  items.forEach(it=>{const r=it.isRecipe?1:it.gramos/100;tk+=it.k100*r;tp+=it.p100*r;tg+=it.g100*r;th+=it.h100*r});
  $('amTotals').innerHTML=`<div style="display:flex;gap:12px;padding:8px;background:var(--surface2);border-radius:var(--radius-xs);font-weight:600">
    <span>Total: <strong>${Math.round(tk)}</strong> kcal</span>
    <span style="color:var(--accent)">P: ${Math.round(tp)}g</span>
    <span style="color:var(--warning)">G: ${Math.round(tg)}g</span>
    <span style="color:var(--success)">HC: ${Math.round(th)}g</span>
  </div>`;
}

function saveMealToPlan(planId,diaIdx){
  const items=window._mealItems;
  if(!items||!items.length){toast('Agregue al menos un alimento','error');return}
  const tipo=$('amTipo').value;
  let tk=0,tp=0,tg=0,th=0;
  items.forEach(it=>{const r=it.isRecipe?1:it.gramos/100;tk+=it.k100*r;tp+=it.p100*r;tg+=it.g100*r;th+=it.h100*r});

  const plan=mealPlans.find(mp=>mp.id===planId);
  if(!plan) return;
  plan.dias[diaIdx].comidas.push({
    tipo:tipo,
    items:items.map(it=>({alimentoId:it.alimentoId,nombre:it.nombre,gramos:it.gramos})),
    kcal:Math.round(tk),
    p:Math.round(tp),
    g:Math.round(tg),
    h:Math.round(th)
  });
  window._mealItems=[];
  closeModal();
  toast(tipo+' agregado con '+items.length+' alimentos');
  navigate('planes');
}

function removeMeal(planId,diaIdx,mealIdx){
  const plan=mealPlans.find(mp=>mp.id===planId);
  if(!plan) return;
  var comida=plan.dias[diaIdx].comidas[mealIdx];
  var nombre=comida?comida.nombre||'esta comida':'esta comida';
  openModal('<div class="modal-header"><h3>⚠️ Eliminar comida</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body"><p>¿Eliminar <strong>'+nombre+'</strong> del plan?</p></div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-danger" onclick="confirmRemoveMeal('+planId+','+diaIdx+','+mealIdx+')">Eliminar</button></div>');
}
function confirmRemoveMeal(planId,diaIdx,mealIdx){
  const plan=mealPlans.find(mp=>mp.id===planId);
  if(!plan) return;
  plan.dias[diaIdx].comidas.splice(mealIdx,1);
  closeModal();toast('Comida eliminada','warning');
  navigate('planes');
}

// ===== PLANTILLAS DE PLANES =====
var planTemplates=[];
try{var _pt=JSON.parse(localStorage.getItem('veridia_db'));if(_pt&&_pt.planTemplates)planTemplates=_pt.planTemplates}catch(e){console.warn('[Veridia]',e.message||e)}

function savePlanAsTemplate(planId){
  var plan=mealPlans.find(function(mp){return mp.id===planId});if(!plan)return;
  var name=prompt('Nombre de la plantilla:',plan.nombre+' (Plantilla)');
  if(!name)return;
  var template=JSON.parse(JSON.stringify(plan));
  template.id=planTemplates.length+1;
  template.nombre=name;
  template.pacienteId=null;
  template._isTemplate=true;
  template.createdAt=new Date().toISOString().slice(0,10);
  planTemplates.push(template);
  toast('Plantilla "'+name+'" guardada ✅');showSaved();
}

function createPlanFromTemplate(){
  if(!planTemplates.length){toast('No hay plantillas guardadas','info');return}
  if(!selPat){toast('Seleccione un paciente primero','error');return}
  var html='<div class="modal-header"><h3>📋 Crear plan desde plantilla</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body">';
  planTemplates.forEach(function(t){
    html+='<div style="padding:12px;background:var(--surface2);border-radius:var(--radius-xs);margin-bottom:8px;cursor:pointer;border:1px solid var(--border)" onclick="applyPlanTemplate('+t.id+')" onmouseover="this.style.borderColor=\'var(--primary)\'" onmouseout="this.style.borderColor=\'var(--border)\'">'
      +'<strong>'+t.nombre+'</strong><div style="font-size:.72rem;color:var(--text3);margin-top:2px">'+t.kcal+'kcal · '+t.dias.length+' días · Creada: '+fD(t.createdAt)+'</div></div>';
  });
  html+='</div>';
  openModal(html);
}

function applyPlanTemplate(templateId){
  var tmpl=planTemplates.find(function(t){return t.id===templateId});
  if(!tmpl||!selPat)return;
  var plan=JSON.parse(JSON.stringify(tmpl));
  plan.id=mealPlans.length+1;
  plan.pacienteId=selPat;
  plan._isTemplate=false;
  plan.estado='activo';
  plan.fecha=new Date().toISOString().slice(0,10);
  // Deactivate previous plans
  mealPlans.filter(function(mp){return mp.pacienteId===selPat}).forEach(function(mp){mp.estado='inactivo'});
  mealPlans.push(plan);
  closeModal();toast('Plan aplicado desde plantilla "'+tmpl.nombre+'"');showSaved();navigate('planes');
}

// #42 Copiar plan entre pacientes
function copyPlanToPatient(planId){
  if(!planId){toast('Seleccione un plan','error');return}
  var plan=mealPlans.find(function(p){return p.id===planId});if(!plan)return;
  openModal('<div class="modal-header"><h3>Copiar plan a otro paciente</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body">'
  +'<p style="font-size:.82rem;margin-bottom:12px">Plan: <strong>'+plan.nombre+'</strong> ('+plan.kcalObjetivo+' kcal)</p>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Paciente destino</label><select id="cpDest">'
  +DB.patients.filter(function(p){return p.activo&&p.id!==plan.pacienteId}).map(function(p){return'<option value="'+p.id+'">'+sanitize(p.nombre)+' '+sanitize(p.apellidos)+'</option>'}).join('')
  +'</select></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Ajuste kcal</label><input type="number" id="cpAjuste" value="0" step="50" placeholder="Ej: -200 para reducir"></div>'
  +'</div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="doCopyPlan('+planId+')">Copiar</button></div>');
}

function doCopyPlan(planId){
  var plan=mealPlans.find(function(p){return p.id===planId});if(!plan)return;
  var destId=+$('cpDest').value;var ajuste=parseInt($('cpAjuste')?$('cpAjuste').value:0)||0;
  var dest=gP(destId);if(!dest)return;

  var newPlan=JSON.parse(JSON.stringify(plan));
  newPlan.id=(mealPlans.length?Math.max.apply(null,mealPlans.map(function(p){return p.id||0}))+1:1);
  newPlan.pacienteId=destId;
  newPlan.nombre='Plan '+dest.nombre+' (copiado)';
  newPlan.kcalObjetivo+=ajuste;
  newPlan.fechaCreacion=new Date().toISOString().slice(0,10);
  newPlan.estado='activo';

  mealPlans.filter(function(mp){return mp.pacienteId===destId}).forEach(function(mp){mp.estado='inactivo'});
  mealPlans.push(newPlan);
  closeModal();toast('Plan copiado a '+dest.nombre+' ('+newPlan.kcalObjetivo+' kcal)');showSaved();
}

// #44 Plan semanal variado (diferente cada día)
// Ya soportado: plan.dias tiene un array por día con comidas independientes

// #45 Adherencia del paciente
function calcAdherencia(planId){
  var plan=mealPlans.find(function(p){return p.id===planId});if(!plan)return null;
  // Check if patient has diary entries
  var patId=plan.pacienteId;
  var diary=(DB.diarioData&&DB.diarioData[patId])||[];
  if(!diary.length) return{pct:0,note:'Sin registros del diario. El paciente puede registrar desde el Portal.'};

  var totalComidas=plan.dias.reduce(function(s,d){return s+d.comidas.length},0);
  var registradas=diary.length;
  var pct=totalComidas>0?Math.round(registradas/totalComidas*100):0;

  return{pct:Math.min(pct,100),registradas:registradas,total:totalComidas,note:pct>=80?'Excelente adherencia':pct>=50?'Adherencia moderada':'Baja adherencia'};
}

// PL1: Wizard progress steps indicator
function wizProgressBar(step,total){
  var steps=['Macros','Comidas','Alimentos','Revisar'];
  var h='<div style="display:flex;gap:4px;margin-bottom:18px;align-items:center">';
  for(var i=0;i<steps.length;i++){
    var active=i===step;var done=i<step;
    h+='<div style="flex:1;text-align:center"><div style="height:4px;border-radius:2px;background:'+(done?'var(--primary)':active?'var(--accent)':'var(--border)')+';margin-bottom:4px"></div>'
    +'<span style="font-size:.65rem;font-weight:'+(active?'700':'400')+';color:'+(active?'var(--primary)':done?'var(--accent)':'var(--text3)')+'">'+steps[i]+'</span></div>';
    if(i<steps.length-1) h+='<div style="width:8px"></div>';
  }

  // Wire: adherencia chart
  h+='<div style="margin-top:14px"><button class="btn btn-outline btn-sm" onclick="document.getElementById(\'adhChart\').innerHTML=renderAdherenciaChart('+plan.id+')">📊 Ver adherencia</button><div id="adhChart" style="margin-top:8px"></div></div>';
return h+'</div>';
}

// PL3: Adherencia temporal chart
function renderAdherenciaChart(planId){
  var plan=mealPlans.find(function(mp){return mp.id===planId});
  if(!plan||!plan.adherencia||plan.adherencia.length<2)return '<p style="font-size:.78rem;color:var(--text3)">Registre adherencia en al menos 2 fechas para ver la evolución.</p>';
  var data=plan.adherencia.slice(-14).map(function(a){return{label:a.fecha?a.fecha.slice(5):'',value:a.pct||0}});
  return svgLineChart({data:data,height:140,unit:'%',color:'var(--primary)',title:'Evolución de adherencia'});
}

// ═══ ESPEN recommendations in plan ═══
function renderPlanESPENRecs(plan){
  if(!plan.patologia&&!plan.formulaUsada) return '';
  // Try to find patology from DEV_PATOLOGIAS or plan metadata
  var patKey=null;
  if(plan.patologia){
    for(var k in DEV_PATOLOGIAS){
      if(DEV_PATOLOGIAS[k].name&&plan.patologia.toLowerCase().includes(DEV_PATOLOGIAS[k].name.toLowerCase().substring(0,8))){
        patKey=k;break;
      }
    }
  }
  if(!patKey) return '';
  var pat=DEV_PATOLOGIAS[patKey];
  if(!pat) return '';
  var html='<div class="card" style="margin-top:16px;border-top:3px solid var(--primary)"><div class="card-header"><span class="card-title" style="font-size:.85rem">📋 Recomendaciones ESPEN — '+pat.name+'</span></div><div class="card-body">';
  if(pat.espenMacros){
    html+='<div style="padding:10px 14px;background:var(--primary-light);border-radius:8px;margin-bottom:12px;font-size:.82rem"><strong>Distribución ESPEN:</strong> '+pat.espenMacros+'</div>';
  }
  html+='<div style="font-size:.82rem;color:var(--text2);line-height:1.6">'+pat.note+'</div>';
  // Check ANAM_ESPEN_RECS if available
  if(typeof ANAM_ESPEN_RECS!=='undefined'){
    var pathNames=[pat.name];
    pathNames.forEach(function(pn){
      var recs=ANAM_ESPEN_RECS[pn];
      if(!recs)return;
      if(recs.incorporar){
        html+='<div style="margin-top:10px"><strong style="font-size:.72rem;color:#16a34a">✅ Incorporar:</strong> <span style="font-size:.78rem;color:var(--text2)">'+recs.incorporar.join(' · ')+'</span></div>';
      }
      if(recs.evitar){
        html+='<div style="margin-top:6px"><strong style="font-size:.72rem;color:#dc2626">❌ Evitar:</strong> <span style="font-size:.78rem;color:var(--text2)">'+recs.evitar.join(' · ')+'</span></div>';
      }
    });
  }
  html+='</div></div>';
  return html;
}
