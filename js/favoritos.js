// ===== ALIMENTOS FAVORITOS + PLATOS COMPUESTOS + LISTA DE COMPRA =====

// Favoritos - persisted in localStorage
if(!DB.favFoods) DB.favFoods=[];
(function(){try{var f=JSON.parse(localStorage.getItem('veridia_favFoods')||'[]');if(f.length)DB.favFoods=f}catch(e){console.warn('[Veridia]',e.message||e)}})();

function toggleFavFood(food){
  var idx=DB.favFoods.findIndex(function(f){return f.n===food.n&&f._src===food._src});
  if(idx>=0){DB.favFoods.splice(idx,1);toast('Eliminado de favoritos')}
  else{DB.favFoods.push({n:food.n,k:food.k||0,p:food.p||0,gr:food.gr||0,h:food.h||0,fi:food.fi||0,ca:food.ca,fe:food.fe,na:food.na,K:food.K,vc:food.vc,vd:food.vd,_src:food._src||'BEDCA',g:food.g||''});toast('⭐ '+food.n+' añadido a favoritos')}
  try{localStorage.setItem('veridia_favFoods',JSON.stringify(DB.favFoods))}catch(e){console.warn('[Veridia]',e.message||e)}
}

function isFavFood(name,src){return DB.favFoods.some(function(f){return f.n===name&&f._src===(src||'BEDCA')})}

// Platos compuestos
if(!DB.customPlatos) DB.customPlatos=[];
(function(){try{var p=JSON.parse(localStorage.getItem('veridia_customPlatos')||'[]');if(p.length)DB.customPlatos=p}catch(e){console.warn('[Veridia]',e.message||e)}})();

function openNewPlatoModal(){
  window._platoIngredients=[];
  openModal('<div class="modal-header"><h3>🍽️ Nuevo plato compuesto</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body">'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Nombre del plato *</label><input id="cpNombre" placeholder="Ej: Mi ensalada de atún"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Raciones</label><input type="number" id="cpRaciones" value="1" min="1"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Ingredientes</label>'
  +'<div style="display:flex;gap:6px;margin-bottom:8px"><input id="cpBuscar" placeholder="Buscar en BEDCA..." oninput="searchPlatoIng(this.value)" style="flex:1"><span id="cpCount" class="badge badge-neutral">0 ingredientes</span></div>'
  +'<div id="cpSuggestions" style="max-height:120px;overflow-y:auto;margin-bottom:8px"></div>'
  +'<div id="cpIngList"></div></div>'
  +'<div id="cpTotals" style="padding:10px;background:var(--surface2);border-radius:var(--radius-xs);font-size:.78rem;color:var(--text3)">Añada ingredientes para ver los totales</div>'
  +'</div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="saveCustomPlato()" style="border-radius:8px">🍽️ Guardar plato</button></div>');
}

function searchPlatoIng(q){
  var el=$('cpSuggestions');if(!el||q.length<2){if(el)el.innerHTML='';return}
  var results=BEDCA_DB.filter(function(f){return f.n&&f.n.toLowerCase().includes(q.toLowerCase())}).slice(0,8);
  el.innerHTML=results.map(function(f,i){
    return '<div style="padding:5px 8px;cursor:pointer;font-size:.75rem;border-bottom:1px solid var(--border)" onclick="addPlatoIng('+f.id+')" onmouseover="this.style.background=\'var(--surface2)\'" onmouseout="this.style.background=\'\'"><strong>'+f.n+'</strong> · '+Math.round(f.k||0)+' kcal/100g</div>';
  }).join('');
}

function addPlatoIng(foodId){
  var f=BEDCA_DB.find(function(x){return x.id===foodId});if(!f)return;
  window._platoIngredients.push({food:f,gramos:100});
  $('cpBuscar').value='';$('cpSuggestions').innerHTML='';
  renderPlatoIngs();
}

function renderPlatoIngs(){
  var list=$('cpIngList'),totals=$('cpTotals'),count=$('cpCount');
  if(!list)return;
  var ings=window._platoIngredients;
  count.textContent=ings.length+' ingredientes';
  list.innerHTML=ings.map(function(ing,i){
    return '<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--border);font-size:.78rem"><span style="flex:1;font-weight:600">'+ing.food.n+'</span>'
    +'<input type="number" value="'+ing.gramos+'" min="1" style="width:55px;text-align:center;font-size:.75rem" onchange="window._platoIngredients['+i+'].gramos=parseInt(this.value)||100;renderPlatoIngs()">g'
    +'<button class="btn btn-ghost btn-xs" style="color:var(--danger)" onclick="window._platoIngredients.splice('+i+',1);renderPlatoIngs()">✕</button></div>';
  }).join('');
  // Totals
  var tk=0,tp=0,tg=0,th=0,tfi=0;
  ings.forEach(function(ing){var r=ing.gramos/100;tk+=(ing.food.k||0)*r;tp+=(ing.food.p||0)*r;tg+=(ing.food.gr||0)*r;th+=(ing.food.h||0)*r;tfi+=(ing.food.fi||0)*r});
  totals.innerHTML='<strong>Total:</strong> '+Math.round(tk)+' kcal · P'+tp.toFixed(1)+'g · G'+tg.toFixed(1)+'g · HC'+th.toFixed(1)+'g · Fibra'+tfi.toFixed(1)+'g';
}

function saveCustomPlato(){
  var nombre=($('cpNombre')||{}).value;
  if(!nombre){toast('Nombre requerido','error');return}
  if(!window._platoIngredients.length){toast('Añada ingredientes','error');return}
  var raciones=parseInt(($('cpRaciones')||{}).value)||1;
  var tk=0,tp=0,tg=0,th=0,tfi=0;
  window._platoIngredients.forEach(function(ing){var r=ing.gramos/100;tk+=(ing.food.k||0)*r;tp+=(ing.food.p||0)*r;tg+=(ing.food.gr||0)*r;th+=(ing.food.h||0)*r;tfi+=(ing.food.fi||0)*r});
  DB.customPlatos.push({
    id:Date.now(),nombre:nombre,raciones:raciones,
    ingredientes:window._platoIngredients.map(function(i){return{nombre:i.food.n,gramos:i.gramos}}),
    kcal:Math.round(tk/raciones),prot:+(tp/raciones).toFixed(1),grasas:+(tg/raciones).toFixed(1),hc:+(th/raciones).toFixed(1),fibra:+(tfi/raciones).toFixed(1)
  });
  try{localStorage.setItem('veridia_customPlatos',JSON.stringify(DB.customPlatos))}catch(e){console.warn('[Veridia]',e.message||e)}
  closeModal();toast('Plato "'+nombre+'" guardado ✅');
  if(curMod==='recetas')navigate('recetas');
}

// Lista de compra automática desde plan activo
function generateShoppingList(planId){
  var plan=mealPlans.find(function(mp){return mp.id===planId});
  if(!plan||!plan.dias){toast('Plan sin días configurados','error');return}
  // Aggregate ingredients from all days/meals
  var items={};
  plan.dias.forEach(function(dia){
    (dia.comidas||[]).forEach(function(comida){
      (comida.alimentos||[]).forEach(function(al){
        var key=al.nombre||al.food?.n||'Alimento';
        if(!items[key])items[key]={nombre:key,gramos:0,count:0};
        items[key].gramos+=(al.gramos||100);
        items[key].count++;
      });
    });
  });
  // Also use devState if connected
  if(devState&&devState.patId===plan.pacienteId&&devState.comidas){
    devState.comidas.forEach(function(c){
      c.alimentos.forEach(function(al){
        var key=al.nombre||'Alimento';
        if(!items[key])items[key]={nombre:key,gramos:0,count:0};
        items[key].gramos+=(al.gramos||100)*plan.dias.length;
        items[key].count+=plan.dias.length;
      });
    });
  }
  var sorted=Object.values(items).sort(function(a,b){return b.gramos-a.gramos});
  // Categorize
  var cats={
    'Carnes y pescados':['pollo','pavo','ternera','cerdo','salmón','merluza','atún','sardina','huevo','pechuga','lomo'],
    'Lácteos':['leche','yogur','queso','kéfir','requesón','nata'],
    'Verduras':['lechuga','tomate','espinaca','brócoli','calabacín','zanahoria','pepino','cebolla','pimiento','judía','guisante','alcachofa','berenjena','acelga','col'],
    'Frutas':['manzana','plátano','naranja','fresa','sandía','melón','pera','uva','kiwi','mango','papaya'],
    'Cereales y legumbres':['arroz','pasta','pan','avena','lenteja','garbanzo','harina','patata','boniato','quinoa','cereal'],
    'Frutos secos':['almendra','nuez','avellana','cacahuete','pistacho'],
    'Aceites y condimentos':['aceite','AOVE','vinagre','sal','especias','limón']
  };
  var categorized={};
  sorted.forEach(function(item){
    var cat='Otros';
    var low=item.nombre.toLowerCase();
    for(var c in cats){if(cats[c].some(function(k){return low.includes(k)})){cat=c;break}}
    if(!categorized[cat])categorized[cat]=[];
    categorized[cat].push(item);
  });

  openModal('<div class="modal-header"><h3>🛒 Lista de la compra</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body">'
  +'<div class="alert alert-info" style="margin-bottom:14px">Generada desde <strong>'+plan.nombre+'</strong> · '+plan.dias.length+' días · '+sorted.length+' productos</div>'
  +Object.keys(categorized).map(function(cat){
    return '<div style="margin-bottom:14px"><div style="font-size:.82rem;font-weight:700;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid var(--border)">'+cat+'</div>'
    +categorized[cat].map(function(item){
      var display=item.gramos>=1000?Math.round(item.gramos/100)/10+'kg':Math.round(item.gramos)+'g';
      return '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:.78rem"><input type="checkbox" style="width:16px;height:16px"><span style="flex:1">'+item.nombre+'</span><span style="color:var(--text3)">×'+item.count+'</span><strong>'+display+'</strong></div>';
    }).join('')+'</div>';
  }).join('')
  +'<button class="btn btn-outline btn-sm" style="width:100%" onclick="copyShoppingList()">📋 Copiar como texto</button>'
  +'</div>',true);
}

function copyShoppingList(){
  var text='🛒 Lista de la compra\\n';
  document.querySelectorAll('#modalContent .modal-body div[style*="margin-bottom:14px"]').forEach(function(cat){
    var title=cat.querySelector('div[style*="font-weight:700"]');
    if(title)text+=('\\n'+title.textContent+'\\n');
    cat.querySelectorAll('div[style*="padding:4px"]').forEach(function(item){
      var spans=item.querySelectorAll('span');
      if(spans.length>=2)text+=('  □ '+spans[0].textContent+' — '+(item.querySelector('strong')||{}).textContent+'\\n');
    });
  });
  try{navigator.clipboard.writeText(text.replace(/\\n/g,'\\n'));toast('Lista copiada al portapapeles ✅')}catch(e){toast('Error al copiar','error')}
}

