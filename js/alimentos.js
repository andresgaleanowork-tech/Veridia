// ===== BEDCA MODULE (969 alimentos oficiales embebidos) =====
var bedcaFiltered=[];

var foodSource='bedca'; // 'bedca' | 'off' | 'usda' | 'both'
var offResults=[]; // OpenFoodFacts search results cached
var usdaResults=[]; // USDA FDC search results cached
var offSearchTimer=null;
var usdaSearchTimer=null;

function rBEDCA(){
  $('mainContent').innerHTML='<div class="fade-in">'
  // ═══ HERO HEADER ═══
  +'<div class="card" style="border:none;background:linear-gradient(135deg,#0E7490 0%,#0891B2 50%,#22D3EE 100%);color:#fff;margin-bottom:22px;border-radius:var(--radius);overflow:hidden;position:relative">'
  +'<div style="position:absolute;top:-30px;right:-20px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.04)"></div>'
  +'<div class="card-body" style="padding:22px 28px;position:relative;z-index:1">'
  +'<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px">'
  +'<div><div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">'+'🗃️'
  +'<h2 style="margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.3px">Base de Datos de Alimentos</h2></div>'
  +'<p style="margin:0;font-size:.78rem;opacity:.75">'+(foodSource==='bedca'?'969 alimentos · BEDCA oficial':foodSource==='off'?'OpenFoodFacts · Base abierta mundial':foodSource==='usda'?'USDA FoodData Central · Referencia científica':'BEDCA + OFF + USDA · Búsqueda unificada')+'</p></div>'
  +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
  +'<button class="btn" style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25);font-size:.76rem" onclick="openNewCustomFood()">＋ Alimento custom</button>'
  +'<button class="btn" style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25);font-size:.76rem" onclick="scanBarcode()">📷 Escanear</button>'
  +'</div></div></div></div>'

  // ═══ SOURCE TABS ═══
  +'<div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;align-items:center">'
  +'<div class="pill-tabs" style="margin:0">'
  +'<button class="pill-tab '+(foodSource==='bedca'?'active':'')+'" onclick="foodSource=\'bedca\';offResults=[];usdaResults=[];rBEDCA()"> BEDCA</button>'
  +'<button class="pill-tab '+(foodSource==='off'?'active':'')+'" onclick="foodSource=\'off\';rBEDCA()">🌍 OpenFoodFacts</button>'
  +'<button class="pill-tab '+(foodSource==='usda'?'active':'')+'" onclick="foodSource=\'usda\';rBEDCA()"> USDA</button>'
  +'<button class="pill-tab '+(foodSource==='both'?'active':'')+'" onclick="foodSource=\'both\';rBEDCA()">🔄 Combinada</button>'
  +'</div>'
  +'</div>'
  // Nutrient filter bar
  +'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px">'
  +'<span style="font-size:.72rem;font-weight:600;color:var(--text-secondary);padding:5px 0;white-space:nowrap">🔬 Filtrar por nutriente:</span>'
  +NUTRIENT_FILTERS.map(function(nf){return '<button style="padding:3px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface);font-size:.65rem;cursor:pointer;transition:all .15s" onmouseover="this.style.background=\'var(--primary-light)\';this.style.borderColor=\'var(--primary)\'" onmouseout="this.style.background=\'var(--surface)\';this.style.borderColor=\'var(--border)\'" onclick="filterByNutrient(\''+nf.id+'\')">'+nf.icon+' '+nf.label+'</button>'}).join('')
  +'<button style="padding:3px 10px;border-radius:8px;border:1px solid #7c3aed;background:#f5f3ff;font-size:.65rem;cursor:pointer;color:#7c3aed;font-weight:600" onclick="document.getElementById(\'suplementosSection\').style.display=document.getElementById(\'suplementosSection\').style.display===\'none\'?\'block\':\'none\'">💊 Suplementos</button>'
  +'</div>'
  +'<div id="suplementosSection" style="display:none">'+renderSuplementos()+'</div>'

  // ═══ SOURCE-SPECIFIC CONTROLS ═══
  +(foodSource==='off'?
  '<div style="padding:12px 16px;background:var(--accent-light);border-radius:10px;margin-bottom:14px;font-size:.78rem;display:flex;align-items:center;gap:8px"><span style="font-size:1rem">🌍</span><div><strong>OpenFoodFacts</strong> — Base abierta · Búsqueda en español · Al seleccionar se cargan vitaminas y minerales</div></div>'
  +'<div style="display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap">'
  +'<input type="text" placeholder="🔍 Buscar alimento en español (ej: pollo, arroz, tomate)..." style="flex:1;min-width:240px" id="bS" aria-label="Buscar alimentos" oninput="offSearchDebounce()">'
  +'<span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.72rem" id="bC">'+offResults.length+' resultados</span>'
  +'<span class="badge" style="background:var(--accent-light);color:var(--accent);font-size:.68rem" id="offStatus">Escriba para buscar</span>'
  +'</div>'

  :foodSource==='usda'?
  '<div style="padding:12px 16px;background:#eff6ff;border-radius:10px;margin-bottom:14px;font-size:.78rem;display:flex;align-items:center;gap:8px"><span style="font-size:1rem">🇺🇸</span><div><strong>USDA FoodData Central</strong> — Hasta 114 nutrientes · SR Legacy + Foundation Foods · Datos traducidos al español</div></div>'
  +'<div style="display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap">'
  +'<input type="text" placeholder="🔍 Buscar alimento (ej: pollo, tomate, arroz, leche)..." style="flex:1;min-width:240px" id="bS" aria-label="Buscar alimentos" oninput="usdaSearchDebounce()">'
  +'<select id="usdaDT" onchange="usdaSearchDebounce()" style="min-width:140px"><option value="">Todos los tipos</option><option value="SR Legacy" selected>SR Legacy (ref.)</option><option value="Foundation">Foundation</option><option value="Branded">Productos marca</option></select>'
  +'<span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.72rem" id="bC">'+usdaResults.length+' resultados</span>'
  +'<span class="badge" style="background:#dbeafe;color:#2563eb;font-size:.68rem" id="offStatus">Escriba para buscar</span>'
  +'</div>'

  :foodSource==='both'?
  '<div style="padding:12px 16px;background:var(--primary-light);border-radius:10px;margin-bottom:14px;font-size:.78rem;display:flex;align-items:center;gap:8px"><span style="font-size:1rem">🔀</span><div><strong>Búsqueda combinada</strong> — BEDCA (969 locales) + OpenFoodFacts + USDA FDC</div></div>'
  +'<div style="display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap">'
  +'<input type="text" placeholder="🔍 Buscar alimento..." style="flex:1;min-width:240px" id="bS" aria-label="Buscar alimentos" oninput="bedcaFilter();offSearchDebounce();usdaSearchDebounce()">'
  +'<select id="bG" onchange="bedcaFilter()" style="min-width:180px"><option value="">Todos los grupos</option>'+BEDCA_GRP.map(function(g){return '<option value="'+g.id+'">'+g.n+'</option>'}).join('')+'</select>'
  +'<span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.72rem" id="bC">0 resultados</span>'
  +'</div>'

  :
  '<div style="padding:12px 16px;background:var(--primary-light);border-radius:10px;margin-bottom:14px;font-size:.78rem;display:flex;align-items:center;gap:8px"><span style="font-size:1rem">🇪🇸</span><div><strong>BEDCA oficial</strong> — 969 alimentos · 13 grupos · <a href="https://www.bedca.net/bdpub/" target="_blank" style="color:var(--primary)">bedca.net</a></div></div>'
  +'<div style="display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap">'
  +'<select id="bG" onchange="bedcaFilter()" style="min-width:220px"><option value="">Todos los grupos ('+BEDCA_DB.length+')</option>'+BEDCA_GRP.map(function(g){return '<option value="'+g.id+'">'+g.n+'</option>'}).join('')+'</select>'
  +'<input type="text" placeholder="🔍 Buscar alimento..." style="width:260px" id="bS" aria-label="Buscar alimentos" oninput="bedcaFilter()">'
  +'<span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.72rem" id="bC">'+BEDCA_DB.length+' alimentos</span>'
  +'<span class="badge" style="background:var(--primary-light);color:var(--primary);font-size:.68rem">'+BEDCA_DB.filter(function(f){return "k" in f}).length+' con nutrientes</span>'
  +'</div>'
  )

  // ═══ TABLE CARD ═══
  +'<div class="card" style="border-top:3px solid var(--primary)" id="bedcaCard">'
  +'<div class="card-header"><span class="card-title" style="font-size:.88rem">🗃️ '+{bedca:'Catálogo BEDCA',off:'OpenFoodFacts',usda:'USDA FoodData Central',both:'Búsqueda combinada'}[foodSource]+'</span></div>'
  +'<div class="card-body" style="padding:0;overflow-x:auto;max-height:480px;overflow-y:auto" id="bedcaBody"></div>'
  +'</div>'
  +'<div id="bedcaDetail" style="margin-top:16px;display:none" class="card"></div>'
  +'</div>';
  if(foodSource==='bedca'||foodSource==='both') bedcaFilter();
  if(foodSource==='off' && offResults.length) renderOFFTable(offResults);
  if(foodSource==='usda' && usdaResults.length) renderUSDAtable(usdaResults);
}

function bedcaFilter(){
  var q=($('bS')?$('bS').value:'').toLowerCase();
  var g=$('bG')?$('bG').value:'';
  bedcaFiltered=BEDCA_DB.filter(function(f){
    if(g && f.gi!=g) return false;
    if(q && f.n.toLowerCase().indexOf(q)===-1) return false;
    return true;
  });
  // Include custom foods in search
  if(DB.alimentosCustom&&DB.alimentosCustom.length){
    var customFiltered=DB.alimentosCustom.filter(function(f){
      if(q && f.n.toLowerCase().indexOf(q)===-1) return false;
      return true;
    });
    bedcaFiltered=bedcaFiltered.concat(customFiltered);
  }
  $('bC').textContent=bedcaFiltered.length+' alimentos';
  bedcaRenderTable(bedcaFiltered.slice(0,100));
}

function bedcaRenderTable(foods){
  if(!foods.length){$('bedcaBody').innerHTML='<div style="text-align:center;padding:40px"><div style="font-size:2.5rem;opacity:.3;margin-bottom:10px">🔍</div><p style="color:var(--text-secondary);font-size:.85rem;margin:0">Sin resultados</p><p style="color:var(--text3);font-size:.78rem;margin:4px 0 0">Ajuste el filtro o grupo.</p></div>';return;}
  $('bedcaBody').innerHTML='<table style="width:100%;border-collapse:collapse;font-size:.82rem"><thead><tr style="background:var(--surface2)">'
    +'<th style="padding:10px 14px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Alimento</th>'
    +'<th style="padding:10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Grupo</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Kcal</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--accent);font-weight:600">Prot</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--warning);font-weight:600">Grasas</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--success);font-weight:600">HC</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Fibra</th>'
    +'<th style="padding:10px 8px;width:40px"></th></tr></thead><tbody>'
    +foods.map(function(f,idx){
      var has='k' in f;
      var isAlt=idx%2===1;
      return '<tr style="cursor:pointer;border-bottom:1px solid var(--border);background:'+(isAlt?'var(--surface)':'transparent')+';transition:background .12s" onmouseover="this.style.background=\'var(--primary-light)\'" onmouseout="this.style.background=\''+(isAlt?'var(--surface)':'transparent')+'\'" onclick="bedcaShowDetail('+f.id+')">'
        +'<td style="padding:10px 14px"><strong style="font-size:.82rem">'+f.n+'</strong></td>'
        +'<td style="padding:10px"><span style="font-size:.6rem;padding:2px 6px;border-radius:4px;background:var(--surface2);color:var(--text-secondary)">'+f.g.replace(/y derivados|, moluscos.*|, semillas.*/g,'').trim()+'</span></td>'
        +(has?'<td style="padding:10px;text-align:center;font-weight:800;font-variant-numeric:tabular-nums">'+f.k+'</td><td style="padding:10px;text-align:center;color:var(--accent);font-weight:600;font-variant-numeric:tabular-nums">'+f.p+'</td><td style="padding:10px;text-align:center;color:var(--warning);font-weight:600;font-variant-numeric:tabular-nums">'+f.gr+'</td><td style="padding:10px;text-align:center;color:var(--success);font-weight:600;font-variant-numeric:tabular-nums">'+f.h+'</td><td style="padding:10px;text-align:center;font-variant-numeric:tabular-nums">'+f.fi+'</td>'
              :'<td colspan="5" style="padding:10px;color:var(--text3);font-size:.78rem;text-align:center">— datos no disponibles —</td>')
        +'<td style="padding:10px">'+(has?'<button class="btn btn-primary btn-xs" style="border-radius:6px" onclick="event.stopPropagation();bedcaShowDetail('+f.id+')">📊</button>':'')+'</td>'
        +'</tr>';
    }).join('')
    +'</tbody></table>'
    +(bedcaFiltered.length>100?'<div style="padding:12px;text-align:center;font-size:.78rem;color:var(--text3)">Mostrando 100 de '+bedcaFiltered.length+' — refine su búsqueda</div>':'');
}

var bedcaSelectedId=null;

function bedcaShowDetail(foodId){
  var f=BEDCA_DB.find(function(x){return x.id===foodId;});
  // Also search in OFF and USDA results
  if(!f && offResults.length) f=offResults.find(function(x){return x.id===foodId;});
  if(!f && usdaResults.length) f=usdaResults.find(function(x){return x.id===foodId;});
  if(!f && DB.alimentosCustom) f=DB.alimentosCustom.find(function(x){return x.id===foodId;});
  if(!f||!('k' in f)){toast('Sin datos nutricionales para este alimento','warning');return;}
  bedcaSelectedId=foodId;
  var det=$('bedcaDetail');
  det.style.display='block';
  var srcBadge=f._src==='USDA'?'🇺🇸 USDA':f._src==='OFF'?'🌍 OpenFoodFacts':'🇪🇸 BEDCA';
  var srcColor=f._src==='USDA'?'badge-warning':f._src==='OFF'?'badge-success':'badge-info';
  det.innerHTML='<div class="card-header" style="background:var(--primary-light)"><span class="card-title" style="font-size:.92rem">🔬 '+f.n+'</span><div style="display:flex;gap:6px;align-items:center"><span class="badge badge-primary">ID: '+f.id+'</span><span class="badge badge-neutral">'+(f.g||'')+'</span><span class="badge '+srcColor+'">'+srcBadge+'</span><button class="btn btn-ghost btn-xs" onclick="toggleFavFood({n:\''+f.n.replace(/'/g,"\\'")+'\',_src:\'BEDCA\'})" title="Favorito" style="font-size:1rem">'+(isFavFood(f.n,'BEDCA')?'★':'☆')+'</button></div></div>'
  +'<div class="card-body">'
  +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap"><label style="font-size:.82rem;font-weight:700;color:var(--text2);white-space:nowrap">⚖️ Cantidad:</label>'
  +'<div style="display:flex;align-items:center;gap:6px"><input type="number" id="bedcaGrams" value="100" min="1" max="9999" step="1" style="width:90px;text-align:center;font-weight:700;font-size:1rem;padding:8px" oninput="bedcaRecalc()"><span style="font-size:.85rem;color:var(--text3);font-weight:600">gramos</span></div>'
  +'<div style="display:flex;gap:4px;flex-wrap:wrap">'
  +[25,50,100,150,200,300].map(function(g){return '<button style="padding:3px 10px;border-radius:12px;font-size:.68rem;font-weight:600;background:'+(g===100?'var(--primary)':'var(--surface3)')+';color:'+(g===100?'#fff':'var(--text2)')+';border:1px solid '+(g===100?'var(--primary)':'var(--border)')+';cursor:pointer" onclick="$(\'bedcaGrams\').value='+g+';bedcaRecalc()">'+g+'g</button>';}).join('')
  +'</div></div>'
  +'<div id="bedcaCalcBody"></div>'
  +'<div class="form-actions" style="margin-top:12px"><button class="btn btn-ghost btn-sm" onclick="$(\'bedcaDetail\').style.display=\'none\'">Cerrar</button></div>'
  +'</div>';
  bedcaRecalc();
  if(det.scrollIntoView) det.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function bedcaRecalc(){
  var f=BEDCA_DB.find(function(x){return x.id===bedcaSelectedId;});
  if(!f && offResults.length) f=offResults.find(function(x){return x.id===bedcaSelectedId;});
  if(!f && usdaResults.length) f=usdaResults.find(function(x){return x.id===bedcaSelectedId;});
  if(!f && DB.alimentosCustom) f=DB.alimentosCustom.find(function(x){return x.id===bedcaSelectedId;});
  if(!f) return;
  var grams=parseFloat($('bedcaGrams').value)||100;
  var r=grams/100; // ratio

  // Calculate scaled values
  var kcal=+(f.k*r).toFixed(1);
  var prot=+(f.p*r).toFixed(1);
  var grasas=+(f.gr*r).toFixed(1);
  var hc=+(f.h*r).toFixed(1);
  var fibra=+(f.fi*r).toFixed(1);
  var ca=f.ca!=null?+(f.ca*r).toFixed(1):null;
  var fe=f.fe!=null?+(f.fe*r).toFixed(2):null;
  var na=f.na!=null?+(f.na*r).toFixed(1):null;
  var k=f.K!=null?+(f.K*r).toFixed(1):null;
  var vc=f.vc!=null?+(f.vc*r).toFixed(1):null;
  var vd=f.vd!=null?+(f.vd*r).toFixed(2):null;

  // Macro distribution
  var pK=prot*4,gK=grasas*9,hK=hc*4,tot=pK+gK+hK;
  var pP=tot>0?Math.round(pK/tot*100):0,gP=tot>0?Math.round(gK/tot*100):0,hP=100-pP-gP;

  // Highlight buttons
  document.querySelectorAll('#bedcaDetail button[onclick*="bedcaGrams"]').forEach(function(btn){
    var bv=parseInt(btn.textContent);
    btn.style.background=bv===grams?'var(--primary)':'var(--surface3)';
    btn.style.color=bv===grams?'#fff':'var(--text2)';
    btn.style.borderColor=bv===grams?'var(--primary)':'var(--border)';
  });

  var macros=[
    {l:'Energía',v:kcal,v100:f.k,u:'kcal',c:'var(--text)',big:1},
    {l:'Proteínas',v:prot,v100:f.p,u:'g',c:'var(--accent)'},
    {l:'Grasas',v:grasas,v100:f.gr,u:'g',c:'var(--warning)'},
    {l:'HC',v:hc,v100:f.h,u:'g',c:'var(--success)'},
    {l:'Fibra',v:fibra,v100:f.fi,u:'g',c:'var(--text2)'}
  ];

  // Build complete micronutrient list from ALL available data
  var allMicros=[];
  // Minerals
  allMicros.push({l:'Calcio',v:ca,v100:f.ca,u:'mg',cat:'mineral',ic:'🦴'});
  allMicros.push({l:'Hierro',v:fe,v100:f.fe,u:'mg',cat:'mineral',ic:'🩸'});
  allMicros.push({l:'Sodio',v:na,v100:f.na,u:'mg',cat:'mineral',ic:'🧂'});
  allMicros.push({l:'Potasio',v:k,v100:f.K,u:'mg',cat:'mineral',ic:'⚡'});
  // Vitamins
  allMicros.push({l:'Vitamina C',v:vc,v100:f.vc,u:'mg',cat:'vitamina',ic:'🍊'});
  allMicros.push({l:'Vitamina D',v:vd,v100:f.vd,u:'µg',cat:'vitamina',ic:'☀️'});
  // OFF extended nutrients (if present from OpenFoodFacts data)
  if(f._off){
    var n=f._off;
    if(n['vitamin-a_100g']!=null) allMicros.push({l:'Vitamina A',v:+(n['vitamin-a_100g']*r).toFixed(2),v100:n['vitamin-a_100g'],u:'µg',cat:'vitamina',ic:'🥕'});
    if(n['vitamin-e_100g']!=null) allMicros.push({l:'Vitamina E',v:+(n['vitamin-e_100g']*r).toFixed(2),v100:n['vitamin-e_100g'],u:'mg',cat:'vitamina',ic:'🌻'});
    if(n['vitamin-b1_100g']!=null) allMicros.push({l:'Vitamina B1',v:+(n['vitamin-b1_100g']*r).toFixed(3),v100:n['vitamin-b1_100g'],u:'mg',cat:'vitamina',ic:'🅱️'});
    if(n['vitamin-b2_100g']!=null) allMicros.push({l:'Vitamina B2',v:+(n['vitamin-b2_100g']*r).toFixed(3),v100:n['vitamin-b2_100g'],u:'mg',cat:'vitamina',ic:'🅱️'});
    if(n['vitamin-b6_100g']!=null) allMicros.push({l:'Vitamina B6',v:+(n['vitamin-b6_100g']*r).toFixed(3),v100:n['vitamin-b6_100g'],u:'mg',cat:'vitamina',ic:'🅱️'});
    if(n['vitamin-b9_100g']!=null) allMicros.push({l:'Ácido fólico (B9)',v:+(n['vitamin-b9_100g']*r).toFixed(1),v100:n['vitamin-b9_100g'],u:'µg',cat:'vitamina',ic:'🥬'});
    if(n['vitamin-b12_100g']!=null) allMicros.push({l:'Vitamina B12',v:+(n['vitamin-b12_100g']*r).toFixed(3),v100:n['vitamin-b12_100g'],u:'µg',cat:'vitamina',ic:'🥩'});
    if(n['vitamin-k_100g']!=null) allMicros.push({l:'Vitamina K',v:+(n['vitamin-k_100g']*r).toFixed(2),v100:n['vitamin-k_100g'],u:'µg',cat:'vitamina',ic:'🥦'});
    if(n['magnesium_100g']!=null) allMicros.push({l:'Magnesio',v:+(n['magnesium_100g']*r).toFixed(1),v100:n['magnesium_100g'],u:'mg',cat:'mineral',ic:'💎'});
    if(n['zinc_100g']!=null) allMicros.push({l:'Zinc',v:+(n['zinc_100g']*r).toFixed(2),v100:n['zinc_100g'],u:'mg',cat:'mineral',ic:'🔩'});
    if(n['phosphorus_100g']!=null) allMicros.push({l:'Fósforo',v:+(n['phosphorus_100g']*r).toFixed(1),v100:n['phosphorus_100g'],u:'mg',cat:'mineral',ic:'💡'});
    if(n['manganese_100g']!=null) allMicros.push({l:'Manganeso',v:+(n['manganese_100g']*r).toFixed(3),v100:n['manganese_100g'],u:'mg',cat:'mineral',ic:'⚙️'});
    if(n['copper_100g']!=null) allMicros.push({l:'Cobre',v:+(n['copper_100g']*r).toFixed(3),v100:n['copper_100g'],u:'mg',cat:'mineral',ic:'🟤'});
    if(n['selenium_100g']!=null) allMicros.push({l:'Selenio',v:+(n['selenium_100g']*r).toFixed(2),v100:n['selenium_100g'],u:'µg',cat:'mineral',ic:'🌰'});
    if(n['iodine_100g']!=null) allMicros.push({l:'Yodo',v:+(n['iodine_100g']*r).toFixed(2),v100:n['iodine_100g'],u:'µg',cat:'mineral',ic:'🧪'});
    // Extra macros from OFF
    if(n['saturated-fat_100g']!=null) macros.push({l:'G. saturadas',v:+(n['saturated-fat_100g']*r).toFixed(1),v100:n['saturated-fat_100g'],u:'g',c:'#dc2626'});
    if(n['sugars_100g']!=null) macros.push({l:'Azúcares',v:+(n['sugars_100g']*r).toFixed(1),v100:n['sugars_100g'],u:'g',c:'#f59e0b'});
    if(n['salt_100g']!=null) macros.push({l:'Sal',v:+(n['salt_100g']*r).toFixed(2),v100:n['salt_100g'],u:'g',c:'#78716c'});
  }

  var minerals=allMicros.filter(function(m){return m.cat==='mineral'&&m.v!=null});
  var vitamins=allMicros.filter(function(m){return m.cat==='vitamina'&&m.v!=null});

  $('bedcaCalcBody').textContent = ''
  +'<div style="font-size:.7rem;color:var(--text3);margin-bottom:8px;text-align:right">Valores para <strong style="color:var(--text)">'+grams+'g</strong>'+(grams!==100?' <span style="opacity:.6">(base 100g)</span>':'')+(f._src?' · <span class="badge '+(f._src==='OFF'?'badge-info':'badge-primary')+'" style="font-size:.6rem">'+f._src+'</span>':'')+'</div>'
  // Macros grid
  +'<div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(90px,1fr));margin-bottom:8px">'
  +macros.map(function(m){
    return '<div class="stat-card" style="padding:10px;text-align:center">'
      +'<div style="font-size:.62rem;color:var(--text3)">'+m.l+'</div>'
      +'<div style="font-size:'+(m.big?'1.3':'1')+'rem;font-weight:800;color:'+m.c+'">'+m.v+'</div>'
      +'<div style="font-size:.58rem;color:var(--text3)">'+m.u+'</div>'
      +(grams!==100?'<div style="font-size:.55rem;color:var(--text3);margin-top:2px;opacity:.6">100g: '+m.v100+'</div>':'')
      +'</div>';
  }).join('')
  +'</div>'
  // Caloric distribution bar
  +(tot>0?'<div style="margin:10px 0"><div style="font-size:.68rem;font-weight:600;margin-bottom:4px;color:var(--text2)">Distribución calórica <span style="font-weight:400;color:var(--text3)">('+kcal+' kcal total)</span></div><div style="display:flex;height:18px;border-radius:9px;overflow:hidden"><div style="width:'+pP+'%;background:var(--accent);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.58rem;font-weight:700">'+(pP>8?'P '+pP+'%':'')+'</div><div style="width:'+gP+'%;background:#f59e0b;display:flex;align-items:center;justify-content:center;color:#fff;font-size:.58rem;font-weight:700">'+(gP>8?'G '+gP+'%':'')+'</div><div style="width:'+hP+'%;background:var(--success);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.58rem;font-weight:700">'+(hP>8?'HC '+hP+'%':'')+'</div></div></div>':'')
  // Vitamins section
  +(vitamins.length?'<h4 style="font-size:.78rem;font-weight:700;margin:14px 0 6px;color:var(--text2)">🧪 Vitaminas</h4>'
  +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px">'
  +vitamins.map(function(m){
    return '<div style="padding:8px 10px;background:var(--surface2);border-radius:var(--radius-xs);border:1px solid var(--border)">'
      +'<div style="font-size:.62rem;color:var(--text3)">'+m.ic+' '+m.l+'</div>'
      +'<div style="font-size:.92rem;font-weight:700">'+m.v+' <span style="font-size:.62rem;color:var(--text3)">'+m.u+'</span></div>'
      +(grams!==100&&m.v100!=null?'<div style="font-size:.55rem;color:var(--text3);opacity:.6">100g: '+m.v100+'</div>':'')
      +'</div>';
  }).join('')+'</div>':'')
  // Minerals section
  +(minerals.length?'<h4 style="font-size:.78rem;font-weight:700;margin:14px 0 6px;color:var(--text2)">⚒️ Minerales</h4>'
  +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px">'
  +minerals.map(function(m){
    return '<div style="padding:8px 10px;background:var(--surface2);border-radius:var(--radius-xs);border:1px solid var(--border)">'
      +'<div style="font-size:.62rem;color:var(--text3)">'+m.ic+' '+m.l+'</div>'
      +'<div style="font-size:.92rem;font-weight:700">'+m.v+' <span style="font-size:.62rem;color:var(--text3)">'+m.u+'</span></div>'
      +(grams!==100&&m.v100!=null?'<div style="font-size:.55rem;color:var(--text3);opacity:.6">100g: '+m.v100+'</div>':'')
      +'</div>';
  }).join('')+'</div>':'')
  +(!vitamins.length&&!minerals.length?'<div style="padding:10px;background:var(--surface2);border-radius:var(--radius-xs);margin-top:8px;font-size:.78rem;color:var(--text3);text-align:center">Sin datos de micronutrientes disponibles para este alimento</div>':'');
}

// ===== OPENFOODFACTS — Direct API integration (NO proxy needed) =====
// Repo: https://github.com/openfoodfacts/openfoodfacts-server (v2.95.1)
// Endpoint: world.openfoodfacts.net — CORS enabled (Access-Control-Allow-Origin: *)
// Search: /cgi/search.pl?search_terms=...&json=1 (full text search in Spanish)
// Product: /api/v2/product/{barcode}.json (full nutrient data + nutriments_estimated)

var OFF_BASE='https://world.openfoodfacts.net';

function offSearchDebounce(){
  clearTimeout(offSearchTimer);
  offSearchTimer=setTimeout(offSearch,500);
}

function offSearch(){
  var q=($('bS')||{}).value||'';
  if(q.length<2){offResults=[];if($('bedcaBody'))$('bedcaBody').innerHTML='<div style="padding:20px;text-align:center;color:var(--text3);font-size:.82rem">Escriba al menos 2 caracteres para buscar en OpenFoodFacts...</div>';return}
  if($('offStatus'))$('offStatus').textContent='Buscando...';
  if($('offStatus'))$('offStatus').className='badge badge-warning';

  var url=OFF_BASE+'/cgi/search.pl?search_terms='+encodeURIComponent(q)
    +'&json=1&page_size=50&lc=es'
    +'&fields=code,product_name,product_name_es,product_name_en,generic_name,generic_name_es,brands,nutriments,categories_tags,nutrition_grades,nova_group,image_small_url';

  fetch(url)
  .then(function(r){
    if(!r.ok) throw new Error('HTTP '+r.status);
    return r.json();
  })
  .then(function(data){
    offProcessResults(data.products||[],data.count||0);
  })
  .catch(function(err){
    console.error('OFF search error:',err);
    if($('offStatus')){$('offStatus').textContent='Error: '+err.message;$('offStatus').className='badge badge-danger'}
    toast('Error al buscar en OpenFoodFacts: '+err.message,'error');
  });
}

function offProcessResults(products,totalCount){
  offResults=products.map(function(h){
    var n=h.nutriments||{};
    var nombre=h.product_name_es||h.product_name||h.generic_name_es||h.generic_name||'Sin nombre';
    nombre=offTranslate(nombre);
    var brands=h.brands||'';
    return {
      id:'OFF_'+(h.code||Math.random().toString(36).slice(2)),
      n:nombre,
      g:(h.categories_tags||[]).map(function(c){return offTranslateCat(c)}).filter(function(c){return c})[0]||'OpenFoodFacts',
      k:n['energy-kcal_100g']||0,
      p:n['proteins_100g']||0,
      gr:n['fat_100g']||0,
      h:n['carbohydrates_100g']||0,
      fi:n['fiber_100g']||0,
      ca:n['calcium_100g']!=null?+(n['calcium_100g']*1000).toFixed(1):null,
      fe:n['iron_100g']!=null?+(n['iron_100g']*1000).toFixed(2):null,
      na:n['sodium_100g']!=null?+(n['sodium_100g']*1000).toFixed(1):null,
      K:n['potassium_100g']!=null?+(n['potassium_100g']*1000).toFixed(1):null,
      vc:n['vitamin-c_100g']!=null?+(n['vitamin-c_100g']*1000).toFixed(1):null,
      vd:n['vitamin-d_100g']!=null?+(n['vitamin-d_100g']*1000000).toFixed(2):null,
      _off:n,
      _src:'OFF',
      _brand:brands,
      _code:h.code||'',
      _nutriscore:h.nutrition_grades||'',
      _img:h.image_small_url||'',
      _enriched:false
    };
  }).filter(function(f){return f.k>0||f.p>0||f.h>0});

  if($('offStatus')){
    $('offStatus').textContent=offResults.length+' mostrados de '+totalCount+' totales';
    $('offStatus').className='badge badge-success';
  }
  if($('bC'))$('bC').textContent=offResults.length+' resultados';

  if(foodSource==='both'){bedcaFilter()}else{renderOFFTable(offResults)}
}

// Enrich a single product with full barcode lookup (vitamins, minerals, allergens)
function offEnrichProduct(code,callback){
  var url=OFF_BASE+'/api/v2/product/'+code+'.json?fields=code,product_name,product_name_es,brands,nutriments,nutriments_estimated,nutrition_grades,nova_group,categories_tags,ingredients_text_es,allergens_tags,traces_tags,quantity';
  fetch(url)
  .then(function(r){return r.json()})
  .then(function(data){
    if(data.status===0){callback(null);return}
    var p=data.product||{};
    var merged=Object.assign({},p.nutriments_estimated||{},p.nutriments||{});
    callback(merged,p);
  })
  .catch(function(err){
    console.warn('OFF enrich error:',err);
    callback(null);
  });
}

// Basic EN→ES food name translator
function offTranslate(name){
  if(!name) return name;
  var tr={
    'chicken':'pollo','breast':'pechuga','rice':'arroz','milk':'leche','water':'agua',
    'orange':'naranja','apple':'manzana','banana':'plátano','tomato':'tomate','cheese':'queso',
    'egg':'huevo','eggs':'huevos','bread':'pan','butter':'mantequilla','sugar':'azúcar',
    'salt':'sal','oil':'aceite','olive':'oliva','fish':'pescado','salmon':'salmón',
    'tuna':'atún','beef':'ternera','pork':'cerdo','lamb':'cordero','turkey':'pavo',
    'shrimp':'camarones','yogurt':'yogur','cream':'crema','flour':'harina','pasta':'pasta',
    'chocolate':'chocolate','coffee':'café','tea':'té','juice':'zumo','wine':'vino',
    'beer':'cerveza','whole':'integral','skim':'desnatado','low fat':'bajo en grasa',
    'organic':'ecológico','natural':'natural','fresh':'fresco','frozen':'congelado',
    'canned':'en conserva','dried':'seco','raw':'crudo','cooked':'cocido',
    'lettuce':'lechuga','spinach':'espinacas','carrot':'zanahoria','onion':'cebolla',
    'garlic':'ajo','pepper':'pimiento','potato':'patata','bean':'judía','beans':'judías',
    'lentil':'lenteja','lentils':'lentejas','chickpea':'garbanzo','chickpeas':'garbanzos',
    'almond':'almendra','almonds':'almendras','walnut':'nuez','walnuts':'nueces',
    'peanut':'cacahuete','peanuts':'cacahuetes','hazelnut':'avellana','hazelnuts':'avellanas',
    'strawberry':'fresa','strawberries':'fresas','blueberry':'arándano','grape':'uva','grapes':'uvas',
    'peach':'melocotón','pear':'pera','melon':'melón','watermelon':'sandía','pineapple':'piña',
    'mango':'mango','coconut':'coco','avocado':'aguacate','corn':'maíz','oat':'avena','oats':'avena',
    'honey':'miel','jam':'mermelada','sauce':'salsa','vinegar':'vinagre','mustard':'mostaza',
    'ham':'jamón','sausage':'salchicha','bacon':'bacon','sardine':'sardina','sardines':'sardinas',
    'mushroom':'champiñón','mushrooms':'champiñones','broccoli':'brócoli','cauliflower':'coliflor',
    'cabbage':'col','zucchini':'calabacín','pumpkin':'calabaza','cucumber':'pepino',
    'celery':'apio','parsley':'perejil','basil':'albahaca','oregano':'orégano',
    'cinnamon':'canela','ginger':'jengibre','turmeric':'cúrcuma'
  };
  // Only translate if name is mostly English (has no Spanish chars)
  if(/[áéíóúñ¿¡]/i.test(name)) return name;
  var lower=name.toLowerCase();
  for(var en in tr){
    var re=new RegExp('\\b'+en+'\\b','gi');
    if(re.test(lower)){name=name.replace(re,tr[en])}
  }
  return name;
}

function offTranslateCat(cat){
  if(!cat) return '';
  // Format: "en:category-name" → "Nombre categoría"
  var c=cat.replace(/^[a-z]{2}:/,'').replace(/-/g,' ');
  var tr={'plant based foods':'Alimentos vegetales','fruits and vegetables based foods':'Frutas y verduras',
    'vegetables':'Verduras','fruits':'Frutas','cereals and potatoes':'Cereales y patatas',
    'dairy':'Lácteos','meats':'Carnes','fish':'Pescados','beverages':'Bebidas',
    'snacks':'Snacks','breads':'Panes','cheeses':'Quesos','yogurts':'Yogures',
    'cereals':'Cereales','legumes':'Legumbres','nuts':'Frutos secos',
    'sweetened beverages':'Bebidas azucaradas','breakfast cereals':'Cereales desayuno'};
  return tr[c]||c.charAt(0).toUpperCase()+c.slice(1);
}

function renderOFFTable(items){
  var el=$('bedcaBody');if(!el)return;
  if(!items.length){el.innerHTML='<div style="padding:20px;text-align:center;color:var(--text3);font-size:.82rem">Sin resultados. Pruebe con otro término de búsqueda.</div>';return}
  el.innerHTML='<table><thead><tr><th>Alimento</th><th>Marca</th><th>Kcal</th><th>Prot</th><th>Grasas</th><th>HC</th><th>Fibra</th><th>Fuente</th></tr></thead><tbody>'
    +items.slice(0,100).map(function(f){
      return '<tr style="cursor:pointer" onclick="bedcaShowDetail(\''+f.id+'\')">'
        +'<td style="font-weight:600;font-size:.82rem">'+f.n+'</td>'
        +'<td style="font-size:.72rem;color:var(--text3)">'+(f._brand||'—')+'</td>'
        +'<td>'+Math.round(f.k)+'</td>'
        +'<td style="color:var(--accent)">'+f.p.toFixed(1)+'</td>'
        +'<td>'+f.gr.toFixed(1)+'</td>'
        +'<td style="color:var(--success)">'+f.h.toFixed(1)+'</td>'
        +'<td>'+f.fi.toFixed(1)+'</td>'
        +'<td><span class="badge badge-info" style="font-size:.6rem">OFF</span>'+(f._nutriscore?'<span class="badge" style="font-size:.55rem;margin-left:2px;background:'
          +({a:'#1e8f4e',b:'#60ac0e',c:'#eeae0e',d:'#e63e11',e:'#ff0000'}[f._nutriscore]||'#999')
          +';color:#fff">'+f._nutriscore.toUpperCase()+'</span>':'')+'</td></tr>';
    }).join('')
    +'</tbody></table>'
    +(items.length>100?'<div style="padding:8px;text-align:center;font-size:.72rem;color:var(--text3)">Mostrando 100 de '+items.length+'</div>':'');
}

// Override bedcaShowDetail to support OFF foods with auto-enrichment
(function(){
  var origFn=bedcaShowDetail;
  bedcaShowDetail=function(foodId){
    if(typeof foodId==='string'&&foodId.startsWith('OFF_')){
      var f=offResults.find(function(x){return x.id===foodId});
      if(!f){toast('Alimento no encontrado','error');return}
      var existing=BEDCA_DB.find(function(x){return x.id===foodId});
      if(!existing) BEDCA_DB.push(f);
      bedcaSelectedId=foodId;
      var det=$('bedcaDetail');
      det.style.display='block';
      var nsColors={a:'#1e8f4e',b:'#60ac0e',c:'#eeae0e',d:'#e63e11',e:'#ff0000'};
      det.innerHTML='<div class="card-header" style="background:var(--primary-light)"><span class="card-title" style="font-size:.92rem">🔬 '+f.n+'</span><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="badge badge-info">OpenFoodFacts</span>'+(f._brand?'<span class="badge badge-neutral">'+f._brand+'</span>':'')+'<span class="badge badge-neutral" style="font-size:.6rem">'+f._code+'</span>'+(f._nutriscore?'<span class="badge" style="background:'+(nsColors[f._nutriscore]||'#999')+';color:#fff">Nutri-Score '+f._nutriscore.toUpperCase()+'</span>':'')+'</div></div>'
      +'<div class="card-body">'
      +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap"><label style="font-size:.82rem;font-weight:700;color:var(--text2);white-space:nowrap">⚖️ Cantidad:</label>'
      +'<div style="display:flex;align-items:center;gap:6px"><input type="number" id="bedcaGrams" value="100" min="1" max="9999" step="1" style="width:90px;text-align:center;font-weight:700;font-size:1rem;padding:8px" oninput="bedcaRecalc()"><span style="font-size:.85rem;color:var(--text3);font-weight:600">gramos</span></div>'
      +'<div style="display:flex;gap:4px;flex-wrap:wrap">'
      +[25,50,100,150,200,300].map(function(g){return '<button style="padding:3px 10px;border-radius:12px;font-size:.68rem;font-weight:600;background:'+(g===100?'var(--primary)':'var(--surface3)')+';color:'+(g===100?'#fff':'var(--text2)')+';border:1px solid '+(g===100?'var(--primary)':'var(--border)')+';cursor:pointer" onclick="$(\'bedcaGrams\').value='+g+';bedcaRecalc()">'+g+'g</button>'}).join('')
      +'</div></div>'
      +'<div id="offEnrichStatus" style="padding:6px 10px;background:var(--info-light);border-radius:var(--radius-xs);font-size:.72rem;color:var(--text3);margin-bottom:10px">⏳ Cargando datos nutricionales completos...</div>'
      +'<div id="bedcaCalcBody"></div>'
      +'<div class="form-actions" style="margin-top:12px"><button class="btn btn-ghost btn-sm" onclick="$(\'bedcaDetail\').style.display=\'none\'">Cerrar</button></div>'
      +'</div>';
      bedcaRecalc();
      if(det.scrollIntoView) det.scrollIntoView({behavior:'smooth',block:'nearest'});

      // Auto-enrich with full barcode lookup for vitamins/minerals
      if(f._code&&!f._enriched){
        offEnrichProduct(f._code,function(allNut,prod){
          if(!allNut){
            var st=$('offEnrichStatus');
            if(st) st.innerHTML='ℹ️ Datos básicos (sin micronutrientes extendidos para este producto)';
            return;
          }
          // Merge enriched data into the food object
          f._off=allNut;
          f._enriched=true;
          // Update extra product info
          if(prod){
            if(prod.ingredients_text_es) f._ingredients=prod.ingredients_text_es;
            if(prod.allergens_tags) f._allergens=prod.allergens_tags;
            if(prod.quantity) f._quantity=prod.quantity;
          }
          // Count available nutrients
          var nutCount=Object.keys(allNut).filter(function(k){return k.endsWith('_100g')&&allNut[k]&&allNut[k]!==0}).length;
          var st=$('offEnrichStatus');
          if(st) st.innerHTML='✅ <strong>'+nutCount+' nutrientes</strong> cargados (nutriments + estimados)'
            +(f._ingredients?' · <span title="'+f._ingredients+'">📋 Ingredientes disponibles</span>':'')
            +(f._allergens&&f._allergens.length?' · <span style="color:var(--danger)">⚠️ '+f._allergens.length+' alérgenos</span>':'');
          // Re-render with enriched data
          bedcaRecalc();
        });
      } else {
        var st=$('offEnrichStatus');
        if(st&&f._enriched){var nutCount=Object.keys(f._off||{}).filter(function(k){return k.endsWith('_100g')&&f._off[k]&&f._off[k]!==0}).length;st.innerHTML='✅ <strong>'+nutCount+' nutrientes</strong> disponibles'}
        else if(st) st.style.display='none';
      }
    } else if(typeof foodId==='string'&&foodId.startsWith('USDA_')){
      // Handle USDA food detail
      var uf=usdaResults.find(function(x){return x.id===foodId});
      if(!uf){toast('Alimento USDA no encontrado','error');return}
      // Push to BEDCA_DB temporarily for bedcaRecalc
      var existing=BEDCA_DB.find(function(x){return x.id===foodId});
      if(!existing) BEDCA_DB.push(uf);
      origFn(foodId);
    } else {
      origFn(foodId);
    }
  };
})();

// Update bedcaFilter for combined mode
bedcaFilter=function(){
  var el=$('bedcaBody');if(!el) return;
  var q=($('bS')||{}).value||'';
  var g=($('bG')||{}).value||'';
  bedcaFiltered=BEDCA_DB.filter(function(f){
    if(typeof f.id==='string'&&f.id.startsWith('OFF_')) return false; // Skip OFF entries in BEDCA array
    return(!g||f.gi==g)&&(!q||f.n.toLowerCase().indexOf(q.toLowerCase())>=0);
  });
  $('bC').textContent=bedcaFiltered.length+(foodSource==='both'&&offResults.length?' BEDCA + '+offResults.length+' OFF':'')+' alimentos';
  // Render BEDCA table
  bedcaRenderTable(bedcaFiltered.slice(0,100));
  // If combined mode, append OFF results below
  if(foodSource==='both'){
    var existing=el.innerHTML;
    if(offResults.length){
      existing+='<div style="padding:10px;background:var(--info-light);text-align:center;font-size:.78rem;font-weight:600;color:#1A6DAD;border-top:2px solid var(--border)">🌍 OpenFoodFacts ('+offResults.length+')</div>'
      +'<table><tbody>'
      +offResults.slice(0,30).map(function(f){
        return '<tr style="cursor:pointer" onclick="bedcaShowDetail(\''+f.id+'\')">'
          +'<td style="font-weight:600;font-size:.82rem">'+f.n+'</td>'
          +'<td>'+Math.round(f.k)+'</td>'
          +'<td style="color:var(--accent)">'+f.p.toFixed(1)+'</td>'
          +'<td>'+f.gr.toFixed(1)+'</td>'
          +'<td style="color:var(--success)">'+f.h.toFixed(1)+'</td>'
          +'<td>'+f.fi.toFixed(1)+'</td>'
          +'<td><span class="badge badge-info" style="font-size:.6rem">OFF</span></td></tr>';
      }).join('')+'</tbody></table>';
    }
    if(usdaResults.length){
      existing+='<div style="padding:10px;background:#EFF6FF;text-align:center;font-size:.78rem;font-weight:600;color:#1e40af;border-top:2px solid var(--border)">🇺🇸 USDA FDC ('+usdaResults.length+')</div>'
      +'<table><tbody>'
      +usdaResults.slice(0,30).map(function(f){
        return '<tr style="cursor:pointer" onclick="bedcaShowDetail(\''+f.id+'\')">'
          +'<td style="font-weight:600;font-size:.82rem">'+f.n+'</td>'
          +'<td>'+Math.round(f.k)+'</td>'
          +'<td style="color:var(--accent)">'+f.p.toFixed(1)+'</td>'
          +'<td>'+f.gr.toFixed(1)+'</td>'
          +'<td style="color:var(--success)">'+f.h.toFixed(1)+'</td>'
          +'<td>'+f.fi.toFixed(1)+'</td>'
          +'<td><span class="badge" style="font-size:.6rem;background:#1e40af;color:#fff">USDA</span></td></tr>';
      }).join('')+'</tbody></table>';
    }
    el.innerHTML=existing;
  }
};

// ===== USDA FOODDATA CENTRAL — Direct API (CORS ✓, DEMO_KEY) =====
// API: https://api.nal.usda.gov/fdc/v1/ — Public domain (CC0 1.0)
// Docs: https://fdc.nal.usda.gov/api-guide
// Up to 114 nutrients per food (SR Legacy) — 13 vitamins, 10+ minerals, amino acids

var USDA_API='https://api.nal.usda.gov/fdc/v1';
var USDA_KEY=typeof VERIDIA_CONFIG!=='undefined'?VERIDIA_CONFIG.get('usda_key'):'DEMO_KEY'; // Users should get their own key at fdc.nal.usda.gov/api-key-signup

// EN→ES food name translations for USDA
var USDA_TR={
  'raw':'crudo/a','cooked':'cocido/a','roasted':'asado/a','boiled':'hervido/a','fried':'frito/a','baked':'horneado/a','grilled':'a la parrilla','steamed':'al vapor','dried':'seco/a','frozen':'congelado/a','canned':'en conserva','fresh':'fresco/a',
  'chicken':'pollo','breast':'pechuga','thigh':'muslo','wing':'ala','drumstick':'pata','turkey':'pavo','beef':'ternera','pork':'cerdo','lamb':'cordero','veal':'ternera lechal','liver':'hígado','kidney':'riñón',
  'salmon':'salmón','tuna':'atún','sardine':'sardina','cod':'bacalao','shrimp':'camarón','trout':'trucha','mackerel':'caballa','anchovy':'anchoa','haddock':'abadejo','herring':'arenque',
  'egg':'huevo','eggs':'huevos','milk':'leche','cheese':'queso','yogurt':'yogur','butter':'mantequilla','cream':'crema/nata','cottage':'requesón','mozzarella':'mozzarella','cheddar':'cheddar',
  'rice':'arroz','bread':'pan','wheat':'trigo','oat':'avena','oats':'avena','corn':'maíz','barley':'cebada','rye':'centeno','pasta':'pasta','noodle':'fideo','flour':'harina','cereal':'cereal',
  'tomato':'tomate','tomatoes':'tomates','potato':'patata','potatoes':'patatas','carrot':'zanahoria','onion':'cebolla','garlic':'ajo','pepper':'pimiento','peppers':'pimientos','lettuce':'lechuga','spinach':'espinacas','broccoli':'brócoli','cauliflower':'coliflor','cabbage':'col/repollo','cucumber':'pepino','celery':'apio','mushroom':'champiñón','mushrooms':'champiñones','pea':'guisante','peas':'guisantes','bean':'judía','beans':'judías','lentil':'lenteja','lentils':'lentejas','chickpea':'garbanzo','chickpeas':'garbanzos','eggplant':'berenjena','zucchini':'calabacín','pumpkin':'calabaza','squash':'calabaza','asparagus':'espárrago','artichoke':'alcachofa','beet':'remolacha','turnip':'nabo','radish':'rábano','leek':'puerro','kale':'col rizada',
  'apple':'manzana','apples':'manzanas','banana':'plátano','bananas':'plátanos','orange':'naranja','oranges':'naranjas','grape':'uva','grapes':'uvas','strawberry':'fresa','strawberries':'fresas','blueberry':'arándano','blueberries':'arándanos','raspberry':'frambuesa','peach':'melocotón','pear':'pera','plum':'ciruela','cherry':'cereza','cherries':'cerezas','watermelon':'sandía','melon':'melón','pineapple':'piña','mango':'mango','avocado':'aguacate','coconut':'coco','lemon':'limón','lime':'lima','fig':'higo','date':'dátil','kiwi':'kiwi','papaya':'papaya','pomegranate':'granada',
  'almond':'almendra','almonds':'almendras','walnut':'nuez','walnuts':'nueces','peanut':'cacahuete','peanuts':'cacahuetes','hazelnut':'avellana','cashew':'anacardo','pistachio':'pistacho','sunflower':'girasol','sesame':'sésamo','flax':'lino','chia':'chía',
  'oil':'aceite','olive':'oliva','sugar':'azúcar','honey':'miel','salt':'sal','vinegar':'vinagre','soy':'soja','tofu':'tofu',
  'whole':'integral','skim':'desnatado','low-fat':'bajo en grasa','nonfat':'sin grasa','without':'sin','with':'con','and':'y','or':'o','in':'en','on':'sobre',
  'sweet':'dulce','sour':'ácido/a','hot':'picante','spicy':'picante','plain':'natural','light':'ligero',
  'fat':'grasa','skin':'piel','bone':'hueso','meat':'carne','seed':'semilla','seeds':'semillas','juice':'zumo','sauce':'salsa','soup':'sopa','broth':'caldo','stew':'guiso','salad':'ensalada'
};

function usdaTranslate(name){
  if(!name) return name;
  var result=name;
  // Replace full words, case-insensitive, longest first
  var keys=Object.keys(USDA_TR).sort(function(a,b){return b.length-a.length});
  for(var i=0;i<keys.length;i++){
    var en=keys[i];
    var es=USDA_TR[en].split('/')[0]; // Take first variant
    var re=new RegExp('\\b'+en+'\\b','gi');
    result=result.replace(re,es);
  }
  // Clean up commas and extra spaces
  return result.replace(/\s+/g,' ').trim();
}

// USDA nutrient name → our field mapping
var USDA_NUT_MAP={
  'Energy':{f:'k',u:'kcal',onlyUnit:'KCAL'},
  'Protein':{f:'p',u:'g'},
  'Total lipid (fat)':{f:'gr',u:'g'},
  'Carbohydrate, by difference':{f:'h',u:'g'},
  'Fiber, total dietary':{f:'fi',u:'g'},
  'Calcium, Ca':{f:'ca',u:'mg'},
  'Iron, Fe':{f:'fe',u:'mg'},
  'Sodium, Na':{f:'na',u:'mg'},
  'Potassium, K':{f:'K',u:'mg'},
  'Vitamin C, total ascorbic acid':{f:'vc',u:'mg'},
  'Vitamin D (D2 + D3)':{f:'vd',u:'µg'}
};

function usdaSearchDebounce(){
  clearTimeout(usdaSearchTimer);
  usdaSearchTimer=setTimeout(usdaSearch,500);
}

function usdaSearch(){
  // Check if USDA is enabled via config
  if(typeof VERIDIA_CONFIG!=='undefined'&&!VERIDIA_CONFIG.get('usda_enabled')){
    if($('offStatus')){$('offStatus').textContent='USDA deshabilitada';$('offStatus').className='badge badge-neutral'}
    return;
  }
  var q=($('bS')||{}).value||'';
  if(q.length<2){usdaResults=[];if($('bedcaBody'))$('bedcaBody').innerHTML='<div style="padding:20px;text-align:center;color:var(--text3);font-size:.82rem">Escriba al menos 2 caracteres para buscar en USDA FDC...</div>';return}
  if($('offStatus'))$('offStatus').textContent='Buscando...';
  if($('offStatus'))$('offStatus').className='badge badge-warning';

  // Translate Spanish search term to English for USDA
  var qEN=usdaTranslateQuery(q);

  var dt=$('usdaDT')?$('usdaDT').value:'SR Legacy';
  // Use backend proxy if available (protects API key)
  var url;
  if(typeof API_BASE!=='undefined'&&API_BASE){
    url=API_BASE+'/api/proxy/usda/search?query='+encodeURIComponent(qEN)+'&pageSize=50';
  } else {
    url=USDA_API+'/foods/search?api_key='+USDA_KEY+'&query='+encodeURIComponent(qEN)+'&pageSize=50';
  }
  if(dt) url+='&dataType='+encodeURIComponent(dt);

  fetch(url)
  .then(function(r){
    if(r.status===429){throw new Error('Límite de peticiones alcanzado (DEMO_KEY: 30/hora). Espere o registre su propia API key.')}
    if(!r.ok) throw new Error('HTTP '+r.status);
    return r.json();
  })
  .then(function(data){
    usdaResults=(data.foods||[]).map(function(f){
      var nuts={};
      (f.foodNutrients||[]).forEach(function(n){
        nuts[n.nutrientName]=n;
      });
      var kcalN=nuts['Energy'];
      var kcal=(kcalN&&kcalN.unitName==='KCAL')?kcalN.value:0;
      // If Energy is kJ, convert
      if(kcalN&&kcalN.unitName==='kJ') kcal=Math.round(kcalN.value/4.184);

      return {
        id:'USDA_'+f.fdcId,
        n:usdaTranslate(f.description||''),
        _nameEN:f.description||'',
        g:f.foodCategory||f.dataType||'USDA',
        k:kcal,
        p:(nuts['Protein']||{}).value||0,
        gr:(nuts['Total lipid (fat)']||{}).value||0,
        h:(nuts['Carbohydrate, by difference']||{}).value||0,
        fi:(nuts['Fiber, total dietary']||{}).value||0,
        ca:(nuts['Calcium, Ca']||{}).value||null,
        fe:(nuts['Iron, Fe']||{}).value||null,
        na:(nuts['Sodium, Na']||{}).value||null,
        K:(nuts['Potassium, K']||{}).value||null,
        vc:(nuts['Vitamin C, total ascorbic acid']||{}).value||null,
        vd:(nuts['Vitamin D (D2 + D3)']||{}).value||null,
        _off:null,
        _usda:nuts,
        _usdaRaw:f.foodNutrients||[],
        _src:'USDA',
        _fdcId:f.fdcId,
        _dataType:f.dataType||'',
        _brand:f.brandOwner||f.brandName||'',
        _enriched:true // USDA search already returns all nutrients
      };
    }).filter(function(f){return f.k>0||f.p>0||f.h>0});

    if($('offStatus')){
      $('offStatus').textContent=usdaResults.length+' de '+(data.totalHits||0)+' totales';
      $('offStatus').className='badge badge-success';
    }
    if($('bC'))$('bC').textContent=usdaResults.length+' resultados';

    if(foodSource==='both'){bedcaFilter()}else{renderUSDAtable(usdaResults)}
  })
  .catch(function(err){
    console.error('USDA error:',err);
    if($('offStatus')){$('offStatus').textContent=err.message;$('offStatus').className='badge badge-danger'}
    toast('Error USDA: '+err.message,'error');
  });
}

// Translate Spanish food terms to English for USDA query
function usdaTranslateQuery(q){
  var rev={};
  for(var en in USDA_TR){
    var es=USDA_TR[en].split('/')[0].toLowerCase();
    if(!rev[es]) rev[es]=en;
  }
  var words=q.toLowerCase().split(/\s+/);
  return words.map(function(w){return rev[w]||w}).join(' ');
}

function renderUSDAtable(items){
  var el=$('bedcaBody');if(!el)return;
  if(!items.length){el.innerHTML='<div style="padding:20px;text-align:center;color:var(--text3);font-size:.82rem">Sin resultados. Pruebe con otro término.</div>';return}
  el.innerHTML='<table><thead><tr><th>Alimento</th><th>Original (EN)</th><th>Kcal</th><th>Prot</th><th>Grasas</th><th>HC</th><th>Fibra</th><th>Fuente</th></tr></thead><tbody>'
    +items.slice(0,100).map(function(f){
      return '<tr style="cursor:pointer" onclick="bedcaShowDetail(\''+f.id+'\')">'
        +'<td style="font-weight:600;font-size:.82rem">'+f.n+'</td>'
        +'<td style="font-size:.68rem;color:var(--text3);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+f._nameEN+'">'+f._nameEN+'</td>'
        +'<td>'+Math.round(f.k)+'</td>'
        +'<td style="color:var(--accent)">'+f.p.toFixed(1)+'</td>'
        +'<td>'+f.gr.toFixed(1)+'</td>'
        +'<td style="color:var(--success)">'+f.h.toFixed(1)+'</td>'
        +'<td>'+f.fi.toFixed(1)+'</td>'
        +'<td><span class="badge" style="font-size:.6rem;background:#1e40af;color:#fff">USDA</span>'
        +'<div style="font-size:.55rem;color:var(--text3)">'+f._dataType+'</div></td></tr>';
    }).join('')
    +'</tbody></table>';
}

// Extend bedcaShowDetail to handle USDA foods
(function(){
  var prevShow=bedcaShowDetail;
  bedcaShowDetail=function(foodId){
    if(typeof foodId==='string'&&foodId.startsWith('USDA_')){
      var f=usdaResults.find(function(x){return x.id===foodId});
      if(!f){toast('Alimento no encontrado','error');return}
      var existing=BEDCA_DB.find(function(x){return x.id===foodId});
      if(!existing) BEDCA_DB.push(f);
      bedcaSelectedId=foodId;
      // Build extended _off compatible structure from USDA raw nutrients for bedcaRecalc
      if(!f._off){
        var offCompat={};
        (f._usdaRaw||[]).forEach(function(n){
          var nm=n.nutrientName||'';var v=n.value;var u=(n.unitName||'').toUpperCase();
          // Map to OFF-compatible keys (per 100g, in grams for minerals)
          if(nm==='Vitamin A, RAE') offCompat['vitamin-a_100g']=v; // µg
          if(nm==='Vitamin E (alpha-tocopherol)') offCompat['vitamin-e_100g']=v; // mg→ keep mg
          if(nm==='Thiamin') offCompat['vitamin-b1_100g']=v;
          if(nm==='Riboflavin') offCompat['vitamin-b2_100g']=v;
          if(nm==='Vitamin B-6') offCompat['vitamin-b6_100g']=v;
          if(nm==='Folate, total') offCompat['vitamin-b9_100g']=v;
          if(nm==='Vitamin B-12') offCompat['vitamin-b12_100g']=v;
          if(nm==='Vitamin K (phylloquinone)') offCompat['vitamin-k_100g']=v;
          if(nm==='Niacin') offCompat['vitamin-pp_100g']=v;
          if(nm==='Pantothenic acid') offCompat['pantothenic-acid_100g']=v;
          if(nm==='Magnesium, Mg') offCompat['magnesium_100g']=v;
          if(nm==='Zinc, Zn') offCompat['zinc_100g']=v;
          if(nm==='Phosphorus, P') offCompat['phosphorus_100g']=v;
          if(nm==='Manganese, Mn') offCompat['manganese_100g']=v;
          if(nm==='Copper, Cu') offCompat['copper_100g']=v;
          if(nm==='Selenium, Se') offCompat['selenium_100g']=v;
          if(nm==='Fatty acids, total saturated') offCompat['saturated-fat_100g']=v;
          if(nm==='Total Sugars') offCompat['sugars_100g']=v;
          if(nm==='Cholesterol') offCompat['cholesterol_100g']=v;
          if(nm==='Water') offCompat['water_100g']=v;
        });
        f._off=offCompat;
      }
      var det=$('bedcaDetail');
      det.style.display='block';
      var nutCount=(f._usdaRaw||[]).length;
      det.innerHTML='<div class="card-header" style="background:var(--primary-light)"><span class="card-title" style="font-size:.92rem">🔬 '+f.n+'</span><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="badge" style="background:#1e40af;color:#fff">USDA FDC</span><span class="badge badge-neutral">'+f._dataType+'</span><span class="badge badge-neutral" style="font-size:.6rem">fdcId: '+f._fdcId+'</span><span class="badge badge-success" style="font-size:.6rem">'+nutCount+' nutrientes</span></div></div>'
      +'<div class="card-body">'
      +'<div style="font-size:.72rem;color:var(--text3);margin-bottom:8px">🇺🇸 <em>'+f._nameEN+'</em></div>'
      +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap"><label style="font-size:.82rem;font-weight:700;color:var(--text2);white-space:nowrap">⚖️ Cantidad:</label>'
      +'<div style="display:flex;align-items:center;gap:6px"><input type="number" id="bedcaGrams" value="100" min="1" max="9999" step="1" style="width:90px;text-align:center;font-weight:700;font-size:1rem;padding:8px" oninput="bedcaRecalc()"><span style="font-size:.85rem;color:var(--text3);font-weight:600">gramos</span></div>'
      +'<div style="display:flex;gap:4px;flex-wrap:wrap">'
      +[25,50,100,150,200,300].map(function(g){return '<button style="padding:3px 10px;border-radius:12px;font-size:.68rem;font-weight:600;background:'+(g===100?'var(--primary)':'var(--surface3)')+';color:'+(g===100?'#fff':'var(--text2)')+';border:1px solid '+(g===100?'var(--primary)':'var(--border)')+';cursor:pointer" onclick="$(\'bedcaGrams\').value='+g+';bedcaRecalc()">'+g+'g</button>'}).join('')
      +'</div></div>'
      +'<div id="bedcaCalcBody"></div>'
      +'<div class="form-actions" style="margin-top:12px"><button class="btn btn-ghost btn-sm" onclick="$(\'bedcaDetail\').style.display=\'none\'">Cerrar</button></div>'
      +'</div>';
      bedcaRecalc();
      if(det.scrollIntoView) det.scrollIntoView({behavior:'smooth',block:'nearest'});
    } else {
      prevShow(foodId);
    }
  };
})();

// #34 Alimentos personalizados
if(!DB.alimentosCustom) DB.alimentosCustom=[];
try{var _ac=JSON.parse(localStorage.getItem('veridia_db'));if(_ac&&_ac.alimentosCustom)DB.alimentosCustom=_ac.alimentosCustom}catch(e){console.warn('[Veridia]',e.message||e)}

function openNewCustomFood(){
  openModal('<div class="modal-header"><h3>🍽️ Alimento personalizado</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body">'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">🍽️ Nombre *</label><input id="cfNom" placeholder="Ej: Empanada de carne"></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Kcal /100g</label><input type="number" id="cfK" step="0.1"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Prot (g)</label><input type="number" id="cfP" step="0.1"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Grasa (g)</label><input type="number" id="cfG" step="0.1"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">HC (g)</label><input type="number" id="cfH" step="0.1"></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Fibra (g)</label><input type="number" id="cfFi" step="0.1" value="0"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Sodio (mg)</label><input type="number" id="cfNa" value="0"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Grupo</label><select id="cfGrupo"><option>Miscelanea</option><option>Lacteos</option><option>Carnicos</option><option>Pescados</option><option>Cereales</option><option>Legumbres</option><option>Verduras</option><option>Frutas</option></select></div></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">📏 Medida casera</label><input id="cfMedida" placeholder="Ej: 1 unidad = 80g"></div>'
  +'</div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="saveCustomFood()" style="border-radius:8px">🍽️ Guardar</button></div>');
}

function saveCustomFood(){
  var nom=sanitize($('cfNom')?$('cfNom').value.trim():'');
  if(!nom){toast('Nombre obligatorio','error');return}
  var food={
    id:'custom_'+Date.now(),n:nom,gi:0,g:$('cfGrupo')?$('cfGrupo').value:'Miscelanea',
    k:parseFloat($('cfK')?$('cfK').value:0)||0,
    p:parseFloat($('cfP')?$('cfP').value:0)||0,
    gr:parseFloat($('cfG')?$('cfG').value:0)||0,
    h:parseFloat($('cfH')?$('cfH').value:0)||0,
    fi:parseFloat($('cfFi')?$('cfFi').value:0)||0,
    na:parseFloat($('cfNa')?$('cfNa').value:0)||0,
    ca:0,fe:0,K:0,vc:0,vd:0,
    _custom:true,
    _medida:$('cfMedida')?$('cfMedida').value.trim():''
  };
  DB.alimentosCustom.push(food);
  closeModal();toast('Alimento "'+nom+'" agregado');showSaved();navigate('bedca');
}

// #35 Medidas caseras comunes
var MEDIDAS_CASERAS={
  'cucharada':15,'cucharadita':5,'taza':240,'vaso':200,
  'unidad pequeña':60,'unidad mediana':100,'unidad grande':150,
  'rebanada':30,'puñado':25,'plato':200
};

// #36 Scanner código barras (preparado — necesita cámara)
function scanBarcode(){
  toast('Funcion de scanner disponible con camara del dispositivo. Use la busqueda de OpenFoodFacts por nombre.','info');
}

// #37 Historial de alimentos más usados
if(!DB.alimentosUsados) DB.alimentosUsados={};

function trackFoodUsage(foodName){
  DB.alimentosUsados[foodName]=(DB.alimentosUsados[foodName]||0)+1;
}

function getMostUsedFoods(limit){
  return Object.entries(DB.alimentosUsados).sort(function(a,b){return b[1]-a[1]}).slice(0,limit||10);
}

// ═══ FILTRO POR NUTRIENTES ═══

// ═══ PRE-LOADED CUSTOM FOODS (missing from BEDCA) ═══
(function(){
  if(!DB.alimentosCustom) DB.alimentosCustom=[];
  var preloaded=[
    {id:'custom_chia',n:'Semillas de chía',gi:0,g:'Semillas',k:486,p:16.5,gr:30.7,h:42.1,fi:34.4,ca:631,fe:7.7,na:16,K:407,vc:1.6,vd:0,_src:'Custom'},
    {id:'custom_lino_molido',n:'Semillas de lino molidas',gi:0,g:'Semillas',k:534,p:18.3,gr:42.2,h:28.9,fi:27.3,ca:255,fe:5.7,na:30,K:813,vc:0.6,vd:0,_src:'Custom'},
    {id:'custom_hemp',n:'Semillas de cáñamo (hemp)',gi:0,g:'Semillas',k:553,p:31.6,gr:48.8,h:8.7,fi:4,ca:70,fe:7.9,na:5,K:1200,vc:0.5,vd:0,_src:'Custom'},
    {id:'custom_calabaza',n:'Semillas de calabaza',gi:0,g:'Semillas',k:559,p:30.2,gr:49.1,h:10.7,fi:6,ca:46,fe:8.8,na:7,K:809,vc:1.9,vd:0,_src:'Custom'},
    {id:'custom_girasol',n:'Semillas de girasol',gi:0,g:'Semillas',k:584,p:20.8,gr:51.5,h:20,fi:8.6,ca:78,fe:5.3,na:9,K:645,vc:1.4,vd:0,_src:'Custom'},
  ];
  preloaded.forEach(function(pf){
    if(!DB.alimentosCustom.find(function(x){return x.id===pf.id})){
      DB.alimentosCustom.push(pf);
    }
  });
})();

var NUTRIENT_FILTERS=[
  {id:'hierro',label:'Ricos en Hierro',key:'fe',min:3,unit:'mg/100g',icon:'🩸'},
  {id:'calcio',label:'Ricos en Calcio',key:'ca',min:100,unit:'mg/100g',icon:'🦴'},
  {id:'potasio',label:'Ricos en Potasio',key:'K',min:300,unit:'mg/100g',icon:'⚡'},
  {id:'vitc',label:'Ricos en Vitamina C',key:'vc',min:30,unit:'mg/100g',icon:'🍊'},
  {id:'vitd',label:'Ricos en Vitamina D',key:'vd',min:2,unit:'µg/100g',icon:'☀️'},
  {id:'fibra',label:'Ricos en Fibra',key:'fi',min:5,unit:'g/100g',icon:'🌾'},
  {id:'proteina',label:'Ricos en Proteína',key:'p',min:15,unit:'g/100g',icon:'💪'},
  {id:'omega3',label:'Ricos en Omega-3 (pescados)',key:'gr',min:5,unit:'g grasa/100g',icon:'🐟',filter:function(f){return f.n&&f.n.toLowerCase().match(/salmón|sardina|atún|caballa|anchoa|trucha|arenque|boquerón/)}},
  {id:'bajo_sodio',label:'Bajos en Sodio',key:'na',max:100,unit:'mg/100g',icon:'🧂',invert:true},
  {id:'bajo_grasa',label:'Bajos en Grasa',key:'gr',max:3,unit:'g/100g',icon:'💧',invert:true},
  {id:'bajo_azucar',label:'Bajo Índice Glucémico',key:'h',max:10,unit:'g HC/100g',icon:'🍬',invert:true},
];

function filterByNutrient(filterId){
  var nf=NUTRIENT_FILTERS.find(function(f){return f.id===filterId});
  if(!nf)return;
  var results;
  if(nf.filter){
    results=BEDCA_DB.filter(function(f){return 'k' in f && nf.filter(f)});
  } else if(nf.invert){
    results=BEDCA_DB.filter(function(f){return 'k' in f && f[nf.key]!=null && f[nf.key]<=nf.max && f[nf.key]>0});
  } else {
    results=BEDCA_DB.filter(function(f){return 'k' in f && f[nf.key]!=null && f[nf.key]>=nf.min});
  }
  results.sort(function(a,b){return (b[nf.key]||0)-(a[nf.key]||0)});
  
  var el=$('bedcaBody');
  if(!el)return;
  $('bC').textContent=results.length+' alimentos';
  if(!results.length){el.innerHTML='<div style="text-align:center;padding:30px;color:var(--text3)">Sin resultados para este filtro</div>';return}
  
  el.innerHTML='<div style="padding:8px 14px;background:var(--primary-light);font-size:.78rem;font-weight:600;color:var(--primary)">'+nf.icon+' '+nf.label+' — '+results.length+' alimentos'+(nf.invert?' (≤'+nf.max+' '+nf.unit+')':' (≥'+nf.min+' '+nf.unit+')')+'</div>'
  +'<table style="width:100%;border-collapse:collapse;font-size:.82rem"><thead><tr style="background:var(--surface2)">'
  +'<th style="padding:10px 14px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Alimento</th>'
  +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--primary);font-weight:600">'+nf.key.toUpperCase()+'</th>'
  +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Kcal</th>'
  +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Prot</th>'
  +'</tr></thead><tbody>'
  +results.slice(0,50).map(function(f,i){
    return '<tr style="border-bottom:1px solid var(--border);background:'+(i%2?'var(--surface)':'transparent')+';cursor:pointer" onclick="bedcaShowDetail('+f.id+')">'
    +'<td style="padding:10px 14px"><strong>'+f.n+'</strong></td>'
    +'<td style="padding:10px;text-align:center;font-weight:800;color:var(--primary)">'+(f[nf.key]||0)+'</td>'
    +'<td style="padding:10px;text-align:center">'+f.k+'</td>'
    +'<td style="padding:10px;text-align:center">'+f.p+'</td></tr>';
  }).join('')+'</tbody></table>';
}

// ═══ SUPLEMENTOS ═══
var SUPLEMENTOS_DB=[
  {nombre:'Vitamina D3',dosis:'1000-4000 UI/día',mg:'25-100 µg',indicacion:'Déficit VitD (<30 ng/mL), osteoporosis, inmunidad',precaucion:'Toxicidad >10.000 UI/día crónico'},
  {nombre:'Hierro (fumarato/bisglicinato)',dosis:'30-100 mg/día',mg:'30-100 mg Fe elemental',indicacion:'Anemia ferropénica, ferritina <30 ng/mL',precaucion:'Tomar con vitamina C, separar de lácteos y té'},
  {nombre:'Omega-3 (EPA+DHA)',dosis:'1-3 g/día',mg:'1000-3000 mg EPA+DHA',indicacion:'Dislipemia (TG elevados), antiinflamatorio, cardiovascular',precaucion:'Puede aumentar LDL en algunos pacientes'},
  {nombre:'Magnesio (citrato/bisglicinato)',dosis:'200-400 mg/día',mg:'200-400 mg Mg elemental',indicacion:'Calambres, migraña, estrés, resistencia insulínica',precaucion:'Efecto laxante a dosis altas (óxido de Mg)'},
  {nombre:'Zinc',dosis:'15-30 mg/día',mg:'15-30 mg Zn elemental',indicacion:'Inmunidad, cicatrización, cirrosis, déficit comprobado',precaucion:'Separar de hierro, puede causar náuseas en ayunas'},
  {nombre:'Vitamina B12',dosis:'1000-2000 µg/día (oral)',mg:'1-2 mg',indicacion:'Veganos, metformina crónica, cirugía bariátrica, anemia megaloblástica',precaucion:'Sin toxicidad conocida por vía oral'},
  {nombre:'Ácido fólico',dosis:'400-800 µg/día',mg:'0.4-0.8 mg',indicacion:'Embarazo (prevención DTN), anemia megaloblástica',precaucion:'Dosis >1mg puede enmascarar déficit B12'},
  {nombre:'Probióticos',dosis:'10⁹-10¹⁰ UFC/día',mg:'1-10 billones UFC',indicacion:'SII, diarrea por ATB, disbiosis, SIBO post-tratamiento',precaucion:'Elegir cepa según evidencia (Lactobacillus, Saccharomyces)'},
  {nombre:'Calcio',dosis:'500-1000 mg/día',mg:'500-1000 mg Ca elemental',indicacion:'Osteoporosis, menopausia, ingesta láctea insuficiente',precaucion:'No superar 500mg por toma. Separar de hierro'},
  {nombre:'Vitamina C',dosis:'500-1000 mg/día',mg:'500-1000 mg',indicacion:'Mejora absorción hierro, inmunidad, antioxidante',precaucion:'>2g/día puede causar diarrea o litiasis renal'},
  {nombre:'Colágeno hidrolizado',dosis:'10 g/día',mg:'10.000 mg',indicacion:'Articulaciones, piel, sarcopenia',precaucion:'Baja calidad proteica (no reemplaza proteína dietaria)'},
  {nombre:'Creatina monohidrato',dosis:'3-5 g/día',mg:'3000-5000 mg',indicacion:'Rendimiento deportivo, sarcopenia, cognición',precaucion:'Hidratación adecuada. Seguro a largo plazo'},
];

function renderSuplementos(){
  return '<div class="card" style="margin-top:16px;border-top:3px solid #7c3aed"><div class="card-header"><span class="card-title" style="font-size:.85rem">💊 Base de Suplementos</span>'
  +'<span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.68rem">'+SUPLEMENTOS_DB.length+' suplementos</span></div>'
  +'<div class="card-body" style="padding:0;overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.8rem">'
  +'<thead><tr style="background:var(--surface2)">'
  +'<th style="padding:10px 14px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Suplemento</th>'
  +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Dosis</th>'
  +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">mg/µg</th>'
  +'<th style="padding:10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Indicación</th>'
  +'<th style="padding:10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:#ca8a04;font-weight:600">Precaución</th>'
  +'</tr></thead><tbody>'
  +SUPLEMENTOS_DB.map(function(s,i){
    return '<tr style="border-bottom:1px solid var(--border);background:'+(i%2?'var(--surface)':'transparent')+'">'
    +'<td style="padding:10px 14px;font-weight:700">'+s.nombre+'</td>'
    +'<td style="padding:10px;text-align:center;font-variant-numeric:tabular-nums">'+s.dosis+'</td>'
    +'<td style="padding:10px;text-align:center;font-variant-numeric:tabular-nums;color:var(--primary);font-weight:600">'+s.mg+'</td>'
    +'<td style="padding:10px;font-size:.75rem;color:var(--text2)">'+s.indicacion+'</td>'
    +'<td style="padding:10px;font-size:.75rem;color:#92400e">⚠️ '+s.precaucion+'</td></tr>';
  }).join('')+'</tbody></table></div></div>';
}
