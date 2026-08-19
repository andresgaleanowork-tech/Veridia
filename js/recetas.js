// ===== RECETAS — CRUD local + TheMealDB Explorer =====
var nextRecId=(function(){try{var r=JSON.parse(localStorage.getItem('veridia_db'));if(r&&r.recipes&&r.recipes.length)return Math.max.apply(null,r.recipes.map(function(x){return x.id||0}))+1}catch(e){console.warn('[Veridia]',e.message||e)}return 1})();
var recetasTab='local'; // 'local' | 'mealdb'
var mealdbCache={};
var mealdbResults=[];

// EN→ES ingredient translator (reuses existing USDA_TR)
var MEAL_TR={'Chicken':'Pollo','Beef':'Ternera','Pork':'Cerdo','Lamb':'Cordero','Salmon':'Salmón','Tuna':'Atún','Rice':'Arroz','Pasta':'Pasta','Egg':'Huevo','Eggs':'Huevos','Milk':'Leche','Butter':'Mantequilla','Cheese':'Queso','Cream':'Crema/Nata','Flour':'Harina','Sugar':'Azúcar','Salt':'Sal','Pepper':'Pimienta','Olive Oil':'Aceite de oliva','Garlic':'Ajo','Onion':'Cebolla','Tomato':'Tomate','Tomatoes':'Tomates','Potato':'Patata','Potatoes':'Patatas','Carrot':'Zanahoria','Lemon':'Limón','Lime':'Lima','Honey':'Miel','Ginger':'Jengibre','Soy Sauce':'Salsa de soja','Vinegar':'Vinagre','Parsley':'Perejil','Basil':'Albahaca','Oregano':'Orégano','Thyme':'Tomillo','Cumin':'Comino','Paprika':'Pimentón','Cinnamon':'Canela','Chilli':'Chile','Broccoli':'Brócoli','Spinach':'Espinacas','Mushrooms':'Champiñones','Avocado':'Aguacate','Coconut Milk':'Leche de coco','Breadcrumbs':'Pan rallado','Water':'Agua','Stock':'Caldo','Bread':'Pan','Yogurt':'Yogur','Celery':'Apio','Cucumber':'Pepino','Lettuce':'Lechuga','Corn':'Maíz','Beans':'Judías','Lentils':'Lentejas','Chickpeas':'Garbanzos','Almonds':'Almendras','Walnuts':'Nueces','Peanuts':'Cacahuetes','Chocolate':'Chocolate','Vanilla':'Vainilla','Sesame':'Sésamo','Spring Onions':'Cebolleta'};

// Cooking instruction translator EN→ES (phrase-level + word-level)
var COOK_TR=[
  // Phrases first (longer matches take priority)
  ['Preheat oven to','Precalentar el horno a'],['preheat oven to','precalentar el horno a'],
  ['Bring to a boil','Llevar a ebullición'],['bring to a boil','llevar a ebullición'],
  ['Bring to the boil','Llevar a ebullición'],
  ['Remove from heat','Retirar del fuego'],['remove from heat','retirar del fuego'],
  ['Remove from the oven','Retirar del horno'],['remove from the oven','retirar del horno'],
  ['Let stand','Dejar reposar'],['let stand','dejar reposar'],['Let it rest','Dejar reposar'],
  ['Let cool','Dejar enfriar'],['let cool','dejar enfriar'],
  ['Set aside','Reservar'],['set aside','reservar'],
  ['Stir well','Mezclar bien'],['stir well','mezclar bien'],
  ['Stir to combine','Mezclar para integrar'],
  ['Season with salt and pepper','Salpimentar al gusto'],['season with salt and pepper','salpimentar al gusto'],
  ['Season to taste','Sazonar al gusto'],['season to taste','sazonar al gusto'],
  ['To taste','al gusto'],
  ['Serve immediately','Servir inmediatamente'],['serve immediately','servir inmediatamente'],
  ['Serve hot','Servir caliente'],['Serve warm','Servir tibio'],['Serve cold','Servir frío'],
  ['Cut into','Cortar en'],['cut into','cortar en'],
  ['Chop finely','Picar finamente'],['chop finely','picar finamente'],['Finely chop','Picar finamente'],
  ['Dice the','Cortar en cubos'],['dice the','cortar en cubos'],
  ['Slice the','Cortar en rodajas'],['slice the','cortar en rodajas'],['thinly sliced','en rodajas finas'],
  ['Mix together','Mezclar'],['mix together','mezclar'],['Mix well','Mezclar bien'],
  ['Stir in','Incorporar'],['stir in','incorporar'],['Fold in','Incorporar suavemente'],
  ['Pour over','Verter sobre'],['pour over','verter sobre'],['Pour into','Verter en'],['pour into','verter en'],
  ['Drain well','Escurrir bien'],['drain well','escurrir bien'],['Drain the','Escurrir'],
  ['Pat dry','Secar con papel'],
  ['Cover with','Cubrir con'],['cover with','cubrir con'],['Cover and','Tapar y'],
  ['Place in','Colocar en'],['place in','colocar en'],['Place the','Colocar'],['place the','colocar'],
  ['Add the','Añadir'],['add the','añadir'],['Add a','Añadir'],
  ['Cook for','Cocinar durante'],['cook for','cocinar durante'],
  ['Cook until','Cocinar hasta que'],['cook until','cocinar hasta que'],
  ['Bake for','Hornear durante'],['bake for','hornear durante'],
  ['Bake at','Hornear a'],['bake at','hornear a'],
  ['Roast for','Asar durante'],['roast for','asar durante'],
  ['Fry the','Freír'],['fry the','freír'],['Fry until','Freír hasta que'],
  ['Sauté the','Saltear'],['sauté the','saltear'],['Saute the','Saltear'],
  ['Grill the','Asar a la parrilla'],['grill the','asar a la parrilla'],
  ['Boil the','Hervir'],['boil the','hervir'],['Boil for','Hervir durante'],
  ['Simmer for','Cocinar a fuego lento durante'],['simmer for','cocinar a fuego lento durante'],
  ['Simmer until','Cocinar a fuego lento hasta que'],
  ['Steam the','Cocinar al vapor'],['steam the','cocinar al vapor'],
  ['Brown the','Dorar'],['brown the','dorar'],
  ['Toast the','Tostar'],['toast the','tostar'],
  ['Whisk the','Batir'],['whisk the','batir'],['Whisk together','Batir juntos'],
  ['Beat the','Batir'],['beat the','batir'],
  ['Blend until','Triturar hasta que'],['blend until','triturar hasta que'],
  ['Mash the','Machacar'],['mash the','machacar'],
  ['Knead the','Amasar'],['knead the','amasar'],
  ['Roll out','Estirar la masa'],['roll out','estirar la masa'],
  ['Spread the','Extender'],['spread the','extender'],
  ['Sprinkle with','Espolvorear con'],['sprinkle with','espolvorear con'],
  ['Drizzle with','Rociar con'],['drizzle with','rociar con'],
  ['Garnish with','Decorar con'],['garnish with','decorar con'],
  ['Top with','Cubrir con'],['top with','cubrir con'],
  ['Flip and','Dar la vuelta y'],['flip and','dar la vuelta y'],
  ['Turn over','Dar la vuelta'],
  ['Transfer to','Transferir a'],['transfer to','transferir a'],
  ['Heat the','Calentar'],['heat the','calentar'],['Heat oil','Calentar aceite'],
  ['In a large','En una'],['in a large','en una'],
  ['In a small','En un pequeño'],['in a small','en un pequeño'],
  ['In a bowl','En un bol'],['in a bowl','en un bol'],
  ['In a pan','En una sartén'],['in a pan','en una sartén'],
  ['In a pot','En una olla'],['in a pot','en una olla'],
  ['on medium heat','a fuego medio'],['on high heat','a fuego alto'],['on low heat','a fuego lento'],
  ['over medium heat','a fuego medio'],['over high heat','a fuego alto'],['over low heat','a fuego lento'],
  ['medium-high heat','fuego medio-alto'],['medium heat','fuego medio'],
  ['until golden','hasta dorar'],['until golden brown','hasta que esté dorado'],
  ['until tender','hasta que esté tierno'],['until soft','hasta que esté blando'],
  ['until cooked through','hasta que esté bien cocido'],['until done','hasta que esté listo'],
  ['until smooth','hasta que esté suave'],['until thickened','hasta que espese'],
  ['until fragrant','hasta que esté aromático'],['until translucent','hasta que esté transparente'],
  ['degrees','grados'],['minutes','minutos'],['minute','minuto'],['hours','horas'],['hour','hora'],
  ['tablespoons','cucharadas'],['tablespoon','cucharada'],['teaspoons','cucharaditas'],['teaspoon','cucharadita'],
  ['meanwhile','mientras tanto'],['Meanwhile','Mientras tanto'],
  ['approximately','aproximadamente'],['optional','opcional'],['if needed','si es necesario'],
  ['a pinch of','una pizca de'],['a handful of','un puñado de'],
  ['chicken breasts','pechugas de pollo'],['chicken breast','pechuga de pollo'],
  ['chicken thighs','muslos de pollo'],
  ['baking pan','bandeja de horno'],['baking sheet','bandeja de horno'],['baking dish','fuente de horno'],
  ['frying pan','sartén'],['saucepan','cacerola'],['skillet','sartén'],['casserole dish','fuente'],
  ['mixing bowl','bol'],['large bowl','bol grande'],
  ['aluminium foil','papel de aluminio'],['aluminum foil','papel de aluminio'],['parchment paper','papel de hornear'],
  ['olive oil','aceite de oliva'],['vegetable oil','aceite vegetal'],['cooking oil','aceite de cocina'],
  ['corn starch','maicena'],['cornstarch','maicena'],['all-purpose flour','harina común'],
  ['brown sugar','azúcar moreno'],['white sugar','azúcar blanco'],['icing sugar','azúcar glas'],
  ['black pepper','pimienta negra'],['ground pepper','pimienta molida'],
  ['fresh','fresco/a'],['chopped','picado/a'],['minced','picado fino'],['grated','rallado/a'],['diced','en cubos'],['sliced','en rodajas'],['crushed','machacado/a'],['peeled','pelado/a'],['trimmed','limpio/a'],
  ['Enjoy','¡Buen provecho!'],['enjoy','¡buen provecho!'],
  // Additional verbs and common terms
  ['Spray','Rociar'],['spray','rociar'],['Combine','Combinar'],['combine','combinar'],
  ['Remove','Retirar'],['remove','retirar'],['Bake','Hornear'],['bake','hornear'],
  ['Reduce','Reducir'],['reduce','reducir'],['Marinate','Marinar'],['marinate','marinar'],
  ['Stuff','Rellenar'],['stuff','rellenar'],['Arrange','Disponer'],['arrange','disponer'],
  ['Brush','Pincelar'],['brush','pincelar'],['Coat','Cubrir/Rebozar'],['coat','cubrir'],
  ['Toss','Mezclar/Voltear'],['toss','mezclar'],['Strain','Colar'],['strain','colar'],
  ['Grease','Engrasar'],['grease','engrasar'],['Soak','Remojar'],['soak','remojar'],
  ['Rinse','Enjuagar'],['rinse','enjuagar'],['Squeeze','Exprimir'],['squeeze','exprimir'],
  ['Shred','Desmenuzar'],['shred','desmenuzar'],['Stir','Revolver'],['stir','revolver'],
  ['Discard','Desechar'],['discard','desechar'],
  // Prepositions and connectors (careful with partial matches)
  ['with the ','con '],['and the ','y '],['or the ','o '],
  ['and ','y '],['or ','o '],['but ','pero '],
  ['into the ','en '],['from the ','del '],['over the ','sobre '],
  ['through ','a través de '],['before serving','antes de servir'],['after ','después de '],
  ['then ','luego '],['Then ','Luego '],['also ','también '],
  ['each ','cada '],['both ','ambos '],['other side','otro lado'],['each side','cada lado'],
  ['well ','bien '],['slowly','lentamente'],['quickly','rápidamente'],['gently','suavemente'],
  ['remaining','restante'],['prepared','preparado'],['desired','deseado'],
  ['once','una vez'],['twice','dos veces'],['about ','aprox. '],
  ['thick','grueso'],['thin','fino'],['crispy','crujiente'],['tender','tierno'],
  ['evenly','uniformemente'],['completely','completamente'],['slightly','ligeramente'],
  ['serving','servir'],['stirring','revolviendo'],['cooking','cocinando'],
  ['boiling','hirviendo'],['simmering','cocinando a fuego lento']
];

function trCookStep(text){
  if(!text)return text;
  var r=text;
  // Apply phrase translations (longest first, already ordered)
  COOK_TR.forEach(function(pair){
    r=r.split(pair[0]).join(pair[1]);
  });
  // Also translate ingredient names
  for(var en in MEAL_TR){
    var re=new RegExp('\\b'+en+'\\b','gi');
    if(re.test(r)){
      r=r.replace(re,MEAL_TR[en]);
    }
  }
  return r;
}

function trMealIng(name){
  if(!name)return name;
  for(var en in MEAL_TR){
    if(name.toLowerCase().includes(en.toLowerCase())){
      return name.replace(new RegExp(en,'gi'),MEAL_TR[en]);
    }
  }
  return name;
}

function rRecetas(){
  $('mainContent').innerHTML='<div class="fade-in">'
  // ═══ HERO HEADER ═══
  +'<div class="card" style="border:none;background:linear-gradient(135deg,#0E7490 0%,#0891B2 50%,#22D3EE 100%);color:#fff;margin-bottom:22px;border-radius:var(--radius);overflow:hidden;position:relative">'
  +'<div style="position:absolute;top:-30px;right:-20px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.04)"></div>'
  +'<div class="card-body" style="padding:22px 28px;position:relative;z-index:1">'
  +'<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px">'
  +'<div><div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">'+'🍽️'
  +'<h2 style="margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.3px">Recetas</h2></div>'
  +'<p style="margin:0;font-size:.78rem;opacity:.75">'+DB.recipes.length+' recetas propias · TheMealDB mundial</p></div>'
  +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
  +(recetasTab==='local'?'<button class="btn" style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25);font-size:.78rem" onclick="openNewPlatoModal()">🍽️ Plato compuesto</button>'
  +'<button class="btn" style="background:#fff;color:#b45309;font-weight:700;border:none" onclick="openNewRecipeModal()">'+IC.plus+' Nueva receta</button>':'')
  +'</div></div></div></div>'

  // ═══ TABS ═══
  +'<div class="pill-tabs" style="margin-bottom:18px">'
  +'<button class="pill-tab '+(recetasTab==='local'?'active':'')+'" onclick="recetasTab=\'local\';rRecetas()">📋 Mis recetas ('+DB.recipes.length+')</button>'
  +'<button class="pill-tab '+(recetasTab==='mealdb'?'active':'')+'" onclick="recetasTab=\'mealdb\';rRecetas()">🌍 TheMealDB</button>'
  +'</div>'

  +(recetasTab==='mealdb'?renderMealDBExplorer():renderLocalRecipes())
  +'</div>';
}

function renderLocalRecipes(){
  if(!DB.recipes.length) return '<div class="card" style="text-align:center;padding:50px"><div style="font-size:3.5rem;margin-bottom:14px;opacity:.3">🍽️</div><p style="color:var(--text-secondary);font-size:.92rem;margin:0;font-weight:600">Sin recetas creadas</p><p style="color:var(--text3);font-size:.78rem;margin:6px 0 20px">Cree recetas propias o explore TheMealDB para importar ideas.</p><div style="display:flex;gap:10px;justify-content:center"><button class="btn btn-primary" style="border-radius:10px;padding:10px 24px" onclick="openNewRecipeModal()">📋 Nueva receta</button><button class="btn btn-outline" style="border-radius:10px" onclick="recetasTab=\'mealdb\';rRecetas()">🌍 Explorar TheMealDB</button></div></div>';
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
${DB.recipes.map(r=>`<div class="card" style="cursor:pointer" onclick="viewRec(${r.id})"><div style="height:6px;background:var(--primary)"></div><div class="card-body">
<h3 style="font-size:.92rem;font-weight:700;margin-bottom:8px;letter-spacing:-.2px">${r.nombre}</h3>
<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap"><span class="badge badge-primary">${r.categoria}</span><span class="badge badge-neutral">${r.raciones}rac</span></div>
<div style="display:flex;gap:14px;font-size:.78rem;margin-bottom:10px"><div><strong>${r.kcal}</strong> <span style="color:var(--text3)">kcal</span></div><div><strong style="color:var(--accent)">${r.prot}g</strong> P</div><div><strong style="color:var(--warning)">${r.grasas}g</strong> G</div><div><strong style="color:var(--success)">${r.hc}g</strong> HC</div></div>
<div style="display:flex;height:5px;border-radius:3px;overflow:hidden"><div style="width:${Math.round(r.prot*4/Math.max(r.kcal,1)*100)}%;background:var(--accent)"></div><div style="width:${Math.round(r.grasas*9/Math.max(r.kcal,1)*100)}%;background:var(--warning)"></div><div style="width:${Math.round(r.hc*4/Math.max(r.kcal,1)*100)}%;background:var(--success)"></div></div>
<div style="margin-top:10px;display:flex;gap:4px"><button class="btn btn-outline btn-xs" onclick="event.stopPropagation();openEditRecipeModal(${r.id})">${IC.edit}</button><button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();deleteRecipe(${r.id})" style="color:var(--danger)">✕</button></div>
</div></div>`).join('')}
</div>`;
}

function renderMealDBExplorer(){
  var catOpts=['Beef','Chicken','Dessert','Lamb','Pasta','Pork','Seafood','Side','Starter','Vegan','Vegetarian','Breakfast','Goat','Miscellaneous'].map(function(c){return '<option>'+c+'</option>'}).join('');
  var areaOpts=['Spanish','Mexican','Italian','French','Japanese','Chinese','Indian','Thai','Greek','American','British','Moroccan','Turkish','Vietnamese','Croatian','Egyptian','Filipino','Jamaican','Malaysian','Polish','Portuguese','Russian','Tunisian','Unknown'].map(function(a){return '<option>'+a+'</option>'}).join('');
  var r='<div class="card" style="margin-bottom:14px;border-top:3px solid var(--accent)">'
  +'<div class="card-header"><span class="card-title" style="font-size:.88rem">🌍 TheMealDB — Recetas del mundo</span><span class="badge" style="background:var(--accent-light);color:var(--accent);font-size:.6rem"><a href="https://www.themealdb.com" target="_blank" style="color:inherit">themealdb.com</a></span></div>'
  +'<div class="card-body">'
  +'<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">'
  +'<input id="mealSearch" placeholder="🔍 Buscar receta (ej: chicken, pasta, salad)..." style="flex:1;min-width:200px" oninput="mealdbSearchDebounce()">'
  +'<select id="mealCat" onchange="mealdbFilterCat(this.value)" style="min-width:140px"><option value="">Todas las categorías</option>'+catOpts+'</select>'
  +'<select id="mealArea" onchange="mealdbFilterArea(this.value)" style="min-width:130px"><option value="">Todas las cocinas</option>'+areaOpts+'</select>'
  +'</div>'
  +'<div id="mealResults">'+(mealdbResults.length?'':'<div style="text-align:center;padding:20px;color:var(--text3);font-size:.82rem">Busque por nombre, explore por categoría o cocina</div>')+'</div>'
  +'</div></div>';
  if(mealdbResults.length) setTimeout(function(){renderMealDBResults()},50);
  return r;
}

var _mealSearchTimer=null;
function mealdbSearchDebounce(){clearTimeout(_mealSearchTimer);_mealSearchTimer=setTimeout(mealdbSearch,400)}

function mealdbSearch(){
  var q=($('mealSearch')||{}).value||'';
  if(q.length<2){$('mealResults').innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);font-size:.82rem">Escriba al menos 2 caracteres</div>';return}
  $('mealResults').innerHTML='<div style="text-align:center;padding:20px;color:var(--warning);font-size:.82rem">⏳ Buscando en TheMealDB...</div>';
  fetch('https://www.themealdb.com/api/json/v1/1/search.php?s='+encodeURIComponent(q))
  .then(function(r){return r.json()}).then(function(d){
    mealdbResults=d.meals||[];
    renderMealDBResults();
  }).catch(function(e){$('mealResults').innerHTML='<div style="color:var(--danger);padding:12px;font-size:.78rem">Error: '+e.message+'</div>'});
}

function mealdbFilterCat(cat){
  if(!cat){mealdbResults=[];renderMealDBResults();return}
  $('mealResults').innerHTML='<div style="text-align:center;padding:20px;color:var(--warning);font-size:.82rem">⏳ Cargando '+cat+'...</div>';
  fetch('https://www.themealdb.com/api/json/v1/1/filter.php?c='+encodeURIComponent(cat))
  .then(function(r){return r.json()}).then(function(d){
    mealdbResults=(d.meals||[]).map(function(m){return{idMeal:m.idMeal,strMeal:m.strMeal,strMealThumb:m.strMealThumb,strCategory:cat,_partial:true}});
    renderMealDBResults();
  }).catch(function(e){$('mealResults').innerHTML='<div style="color:var(--danger)">Error: '+e.message+'</div>'});
}

function mealdbFilterArea(area){
  if(!area){mealdbResults=[];renderMealDBResults();return}
  $('mealResults').innerHTML='<div style="text-align:center;padding:20px;color:var(--warning);font-size:.82rem">⏳ Cargando cocina '+area+'...</div>';
  fetch('https://www.themealdb.com/api/json/v1/1/filter.php?a='+encodeURIComponent(area))
  .then(function(r){return r.json()}).then(function(d){
    mealdbResults=(d.meals||[]).map(function(m){return{idMeal:m.idMeal,strMeal:m.strMeal,strMealThumb:m.strMealThumb,strArea:area,_partial:true}});
    renderMealDBResults();
  }).catch(function(e){$('mealResults').innerHTML='<div style="color:var(--danger)">Error: '+e.message+'</div>'});
}

function renderMealDBResults(){
  var el=$('mealResults');if(!el)return;
  if(!mealdbResults.length){el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);font-size:.82rem">Sin resultados</div>';return}
  el.innerHTML='<div style="font-size:.68rem;color:var(--text3);margin-bottom:8px">'+mealdbResults.length+' recetas encontradas</div>'
  +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">'
  +mealdbResults.slice(0,30).map(function(m){
    return '<div class="card" style="cursor:pointer;overflow:hidden" onclick="viewMealDB(\''+m.idMeal+'\')">'
    +(m.strMealThumb?'<div style="height:120px;background:url('+m.strMealThumb+'/preview) center/cover;border-bottom:1px solid var(--border)"></div>':'')
    +'<div style="padding:10px"><div style="font-size:.82rem;font-weight:700;margin-bottom:4px;line-height:1.3">'+m.strMeal+'</div>'
    +'<div style="display:flex;gap:4px;flex-wrap:wrap">'
    +(m.strCategory?'<span class="badge badge-primary" style="font-size:.58rem">'+m.strCategory+'</span>':'')
    +(m.strArea?'<span class="badge badge-neutral" style="font-size:.58rem">'+m.strArea+'</span>':'')
    +'</div></div></div>';
  }).join('')+'</div>';
}

function viewMealDB(id){
  // Check cache
  if(mealdbCache[id]){showMealDBDetail(mealdbCache[id]);return}
  openModal('<div class="modal-body" style="text-align:center;padding:40px"><div class="spinner" style="margin:0 auto"></div><p style="margin-top:12px;font-size:.82rem;color:var(--text3)">Cargando receta...</p></div>');
  fetch('https://www.themealdb.com/api/json/v1/1/lookup.php?i='+id)
  .then(function(r){return r.json()}).then(function(d){
    var meal=(d.meals||[])[0];
    if(!meal){closeModal();toast('Receta no encontrada','error');return}
    mealdbCache[id]=meal;
    closeModal();
    showMealDBDetail(meal);
  }).catch(function(e){closeModal();toast('Error: '+e.message,'error')});
}

function showMealDBDetail(m){
  // Extract ingredients + measures
  var ings=[];
  for(var i=1;i<=20;i++){
    var name=(m['strIngredient'+i]||'').trim();
    var measure=(m['strMeasure'+i]||'').trim();
    if(name) ings.push({name:name,nameES:trMealIng(name),measure:measure});
  }
  // Parse instructions into steps and translate to Spanish
  var steps=(m.strInstructions||'').split(/\r?\n/).filter(function(s){return s.trim().length>3}).map(function(s){return trCookStep(s.trim())});

  openModal('<div class="modal-header"><h3>'+m.strMeal+'</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body" style="max-height:75vh;overflow-y:auto">'
  // Image + tags
  +(m.strMealThumb?'<div style="height:200px;background:url('+m.strMealThumb+') center/cover;border-radius:var(--radius-xs);margin-bottom:14px"></div>':'')
  +'<div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">'
  +'<span class="badge badge-primary">'+( m.strCategory||'')+'</span>'
  +'<span class="badge badge-neutral">'+(m.strArea||'')+'</span>'
  +(m.strTags?m.strTags.split(',').map(function(t){return'<span class="badge badge-info" style="font-size:.58rem">'+t.trim()+'</span>'}).join(''):'')
  +'<span class="badge badge-neutral" style="font-size:.58rem">🌍 TheMealDB #'+m.idMeal+'</span>'
  +'</div>'
  // Ingredients
  +'<h4 style="margin-bottom:8px;font-size:.87rem">🍽️ Ingredientes ('+ings.length+')</h4>'
  +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:14px">'
  +ings.map(function(ing){
    return '<div style="padding:6px 8px;background:var(--surface2);border-radius:var(--radius-xs);font-size:.78rem;display:flex;justify-content:space-between"><span style="font-weight:600">'+ing.nameES+'</span><span style="color:var(--text3)">'+ing.measure+'</span></div>';
  }).join('')
  +'</div>'
  // Instructions
  +'<h4 style="margin-bottom:8px;font-size:.87rem">✏️ Preparación</h4>'
  +'<ol style="padding-left:18px;font-size:.82rem;color:var(--text2);line-height:1.7">'
  +steps.map(function(s){return'<li style="margin-bottom:6px">'+s.trim()+'</li>'}).join('')
  +'</ol>'
  // YouTube link
  +(m.strYoutube?'<div style="margin-top:14px"><a href="'+m.strYoutube+'" target="_blank" class="btn btn-outline btn-sm" style="color:var(--danger)">▶️ Ver en YouTube</a></div>':'')
  +'</div>'
  // Footer: Import button
  +'<div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cerrar</button><button class="btn btn-primary" onclick="importMealDB(\''+m.idMeal+'\')">📥 Importar a mis recetas</button></div>'
  ,true);
}

function importMealDB(id){
  var m=mealdbCache[id];if(!m){toast('Receta no en caché','error');return}
  var ings=[];
  for(var i=1;i<=20;i++){
    var name=(m['strIngredient'+i]||'').trim();
    var measure=(m['strMeasure'+i]||'').trim();
    if(name) ings.push(measure+' '+trMealIng(name));
  }
  var steps=(m.strInstructions||'').split(/\r?\n/).filter(function(s){return s.trim().length>3}).map(function(s){return trCookStep(s.trim())});

  DB.recipes.push({
    id:nextRecId++,
    nombre:trMealIng(m.strMeal)||m.strMeal,
    nombreOriginal:m.strMeal,
    categoria:m.strCategory||'Comida',
    raciones:2,
    kcal:0, prot:0, grasas:0, hc:0, fibra:0,
    ingredientes:ings,
    pasos:steps,
    source:'TheMealDB',
    sourceId:m.idMeal,
    sourceArea:m.strArea||'',
    sourceThumb:m.strMealThumb||'',
    v:1
  });
  closeModal();
  toast('📥 '+m.strMeal+' importada — edite los macros manualmente');showSaved();
  recetasTab='local';
  navigate('recetas');
}

function viewRec(id){const r=DB.recipes.find(x=>x.id===id);if(!r)return;openModal(`<div class="modal-header"><h3>${r.nombre}</h3><button onclick="closeModal()">${IC.x}</button></div><div class="modal-body" style="max-height:75vh;overflow-y:auto">
${r.sourceThumb?`<div style="height:180px;background:url(${r.sourceThumb}) center/cover;border-radius:var(--radius-xs);margin-bottom:14px"></div>`:''}
<div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap"><span class="badge badge-primary">${r.categoria}</span><span class="badge badge-neutral">${r.raciones} rac</span>${r.kcal?`<span class="badge badge-success">${r.kcal} kcal/rac</span>`:'<span class="badge badge-warning">Sin macros — editar</span>'}${r.source?`<span class="badge badge-info" style="font-size:.58rem">🌍 ${r.source}</span>`:''}</div>
<h4 style="margin-bottom:6px;font-size:.87rem">Ingredientes</h4><ul style="padding-left:18px;margin-bottom:14px;font-size:.83rem;color:var(--text2)">${r.ingredientes.map(i=>`<li style="margin-bottom:3px">${i}</li>`).join('')}</ul>
<h4 style="margin-bottom:6px;font-size:.87rem">Preparación</h4><ol style="padding-left:18px;font-size:.83rem;color:var(--text2)">${r.pasos.map(p=>`<li style="margin-bottom:5px">${p}</li>`).join('')}</ol>
${r.kcal?`<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border);display:flex;gap:18px;font-size:.83rem"><div><strong>${r.kcal}</strong> kcal</div><div style="color:var(--accent)"><strong>${r.prot}g</strong> P</div><div style="color:var(--warning)"><strong>${r.grasas}g</strong> G</div><div style="color:var(--success)"><strong>${r.hc}g</strong> HC</div><div><strong>${r.fibra}g</strong> fibra</div></div>`:'<div style="margin-top:14px;padding:10px;background:var(--warning-light);border-radius:var(--radius-xs);font-size:.78rem">⚠️ Receta importada sin macros. <a href="#" onclick="event.preventDefault();closeModal();openEditRecipeModal('+r.id+')">Editar y añadir macros</a></div>'}
</div>`,true)}

function openNewRecipeModal(editId){
  var r=editId?DB.recipes.find(x=>x.id===editId):null;
  window._recIngredients=r?r.ingredientes.map(function(ing){
    var m=ing.match(/^(.+?)\s+(\d+)g?$/);
    return m?{nombre:m[1],gramos:+m[2],bedcaId:null}:{nombre:ing,gramos:100,bedcaId:null};
  }):[];

  openModal(`<div class="modal-header"><h3>${r?'Editar':'Nueva'} receta</h3><button onclick="closeModal()">${IC.x}</button></div>
<div class="modal-body">
  <div class="form-row">
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">🍽️ Nombre *</label><input id="rcNom" value="${r?r.nombre:''}" placeholder="Nombre de la receta"></div>
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Categoría</label><select id="rcCat"><option ${r&&r.categoria==='Desayuno'?'selected':''}>Desayuno</option><option ${r&&r.categoria==='Almuerzo'?'selected':''}>Almuerzo</option><option ${!r||r.categoria==='Comida'?'selected':''}>Comida</option><option ${r&&r.categoria==='Merienda'?'selected':''}>Merienda</option><option ${r&&r.categoria==='Cena'?'selected':''}>Cena</option><option ${r&&r.categoria==='Snack'?'selected':''}>Snack</option></select></div>
  </div>
  <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">🍽️ Raciones</label><input type="number" id="rcRac" value="${r?r.raciones:1}" min="1"></div>

  <div style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:14px">
    <div style="font-size:.78rem;font-weight:700;color:var(--text2);margin-bottom:8px">🌿 Ingredientes (desde BEDCA)</div>
    <div style="display:flex;gap:6px;margin-bottom:8px">
      <input type="text" id="rcBuscar" placeholder="Buscar alimento BEDCA..." style="flex:1;font-size:.82rem" oninput="filterRecipeFoods()">
    </div>
    <div id="rcFoodResults" style="max-height:140px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-xs);margin-bottom:10px;display:none"></div>
    <div id="rcIngList" style="min-height:30px"></div>
    <div id="rcTotals" style="margin-top:8px"></div>
  </div>

  <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">✏️ Preparación</label><textarea id="rcPasos" rows="3" placeholder="Un paso por línea...">${r?r.pasos.join('\n'):''}</textarea></div>
</div>
<div class="modal-footer">
  <button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button>
  <button class="btn btn-primary" onclick="saveRecipe(${editId||'null'})">${r?'Actualizar':'Crear receta'}</button>
</div>`,true);
  renderRecipeIngredients();
}

function openEditRecipeModal(id){openNewRecipeModal(id)}

function filterRecipeFoods(){
  var q=$('rcBuscar').value.toLowerCase();
  var res=$('rcFoodResults');
  if(q.length<2){res.style.display='none';return}
  var foods=BEDCA_DB.filter(function(f){return 'k' in f && f.n.toLowerCase().indexOf(q)!==-1}).slice(0,15);
  res.style.display='block';
  res.innerHTML=foods.map(function(f){
    return '<div style="padding:6px 10px;border-bottom:1px solid var(--border);cursor:pointer;font-size:.78rem;display:flex;justify-content:space-between" onmouseover="this.style.background=\'var(--primary-light)\'" onmouseout="this.style.background=\'\'" onclick="addRecipeIngredient('+f.id+')"><span>'+f.n+'</span><span style="color:var(--text3)">'+f.k+'kcal</span></div>';
  }).join('')||'<div style="padding:10px;font-size:.78rem;color:var(--text3)">Sin resultados</div>';
}

function addRecipeIngredient(foodId){
  var f=BEDCA_DB.find(function(x){return x.id===foodId});
  if(!f)return;
  window._recIngredients.push({nombre:f.n,gramos:100,bedcaId:f.id,k:f.k,p:f.p,g:f.gr,h:f.h,fi:f.fi});
  $('rcBuscar').value='';
  $('rcFoodResults').style.display='none';
  renderRecipeIngredients();
}

function removeRecipeIng(idx){
  window._recIngredients.splice(idx,1);
  renderRecipeIngredients();
}

function renderRecipeIngredients(){
  // #38 Live recalc
  var tk=0,tp=0,tg=0,th=0;
  (window._recIngredients||[]).forEach(function(it){
    if(it.bedcaId){var f=BEDCA_DB.find(function(x){return x.id===it.bedcaId});if(f){var r=it.gramos/100;tk+=f.k*r;tp+=f.p*r;tg+=f.gr*r;th+=f.h*r}}
    else if(it.k){var r2=it.gramos/100;tk+=it.k*r2;tp+=it.p*r2;tg+=(it.g||it.gr||0)*r2;th+=it.h*r2}
  });
  var liveEl=$('rcLiveCalc');
  if(liveEl)liveEl.innerHTML='<div style="display:flex;gap:10px;font-size:.72rem;padding:6px 0"><span><b>'+Math.round(tk)+'</b> kcal</span><span>P:<b>'+Math.round(tp)+'g</b></span><span>G:<b>'+Math.round(tg)+'g</b></span><span>HC:<b>'+Math.round(th)+'g</b></span></div>';

  var items=window._recIngredients;
  var list=$('rcIngList');
  if(!items.length){list.innerHTML='<span style="font-size:.75rem;color:var(--text3)">Sin ingredientes. Busque alimentos arriba.</span>';$('rcTotals').textContent = '';return}

  list.innerHTML=items.map(function(it,i){
    return '<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--border);font-size:.78rem"><span style="flex:1"><strong>'+it.nombre+'</strong></span><input type="number" value="'+it.gramos+'" min="1" style="width:55px;text-align:center;font-size:.78rem;padding:3px" onchange="window._recIngredients['+i+'].gramos=+this.value;renderRecipeIngredients()"><span style="color:var(--text3);font-size:.68rem">g</span><button onclick="removeRecipeIng('+i+')" style="color:var(--danger);background:none;border:none;cursor:pointer">✕</button></div>';
  }).join('');

  // Calculate totals
  var tk=0,tp=0,tg=0,th=0,tfi=0;
  items.forEach(function(it){
    if(it.bedcaId){var f=BEDCA_DB.find(function(x){return x.id===it.bedcaId});if(f){var r=it.gramos/100;tk+=f.k*r;tp+=f.p*r;tg+=f.gr*r;th+=f.h*r;tfi+=(f.fi||0)*r}}
    else if(it.k){var r=it.gramos/100;tk+=it.k*r;tp+=it.p*r;tg+=it.g*r;th+=it.h*r;tfi+=(it.fi||0)*r}
  });
  var rac=+($('rcRac')?$('rcRac').value:1)||1;
  $('rcTotals').innerHTML='<div style="display:flex;gap:12px;padding:8px;background:var(--surface2);border-radius:var(--radius-xs);font-size:.78rem;font-weight:600"><span>Total: '+Math.round(tk)+' kcal</span><span style="color:var(--accent)">P: '+Math.round(tp)+'g</span><span style="color:var(--warning)">G: '+Math.round(tg)+'g</span><span style="color:var(--success)">HC: '+Math.round(th)+'g</span><span>Fibra: '+Math.round(tfi)+'g</span></div>'+(rac>1?'<div style="font-size:.68rem;color:var(--text3);margin-top:4px">Por ración ('+rac+'): '+Math.round(tk/rac)+' kcal</div>':'');
}

function saveRecipe(editId){
  var nom=sanitize($('rcNom').value.trim());if(!nom){toast('Nombre obligatorio','error');return}
  var items=window._recIngredients;if(!items.length){toast('Agregue al menos un ingrediente','error');return}

  // Calc totals from BEDCA
  var tk=0,tp=0,tg=0,th=0,tfi=0;
  items.forEach(function(it){
    if(it.bedcaId){var f=BEDCA_DB.find(function(x){return x.id===it.bedcaId});if(f){var r=it.gramos/100;tk+=f.k*r;tp+=f.p*r;tg+=f.gr*r;th+=f.h*r;tfi+=(f.fi||0)*r}}
    else if(it.k){var r=it.gramos/100;tk+=it.k*r;tp+=it.p*r;tg+=it.g*r;th+=it.h*r;tfi+=(it.fi||0)*r}
  });
  var rac=+$('rcRac').value||1;
  var pasos=$('rcPasos').value.trim().split('\n').filter(function(s){return s.trim()});

  var recipe={
    id:editId||nextRecId++,
    nombre:nom,
    categoria:$('rcCat').value,
    tiempoPreparacion:parseInt(($('rcTiempo')||{}).value)||0,
    foto:window._recipePhoto||null,
    raciones:rac,
    kcal:Math.round(tk/rac),
    prot:Math.round(tp/rac),
    grasas:Math.round(tg/rac),
    hc:Math.round(th/rac),
    fibra:Math.round(tfi/rac),
    ingredientes:items.map(function(it){return it.nombre+' '+it.gramos+'g'}),
    pasos:pasos.length?pasos:['Preparar según indicaciones'],
    v:editId?(DB.recipes.find(function(x){return x.id===editId}).v||1)+1:1
  };

  if(editId){var idx=DB.recipes.findIndex(function(x){return x.id===editId});if(idx>=0)DB.recipes[idx]=recipe}
  else{DB.recipes.push(recipe)}

  closeModal();toast(editId?'Receta actualizada':'Receta creada — '+recipe.kcal+' kcal/ración');navigate('recetas');
}

function deleteRecipe(id){
  var r=DB.recipes.find(function(x){return x.id===id});
  openModal('<div class="modal-header"><h3>⚠️ Eliminar receta</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body"><p>¿Seguro que deseas eliminar <strong>'+(r?r.nombre:'esta receta')+'</strong>?</p><p style="font-size:.78rem;color:var(--text3);margin-top:8px">Esta acción no se puede deshacer.</p></div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-danger" onclick="confirmDeleteRecipe('+id+')">Eliminar</button></div>');
}
function confirmDeleteRecipe(id){
  DB.recipes=DB.recipes.filter(function(x){return x.id!==id});
  closeModal();toast('Receta eliminada','warning');navigate('recetas');
}

// #39 Foto de receta (preparado como campo base64)
// #40 Compartir receta con paciente
function shareRecipeWithPatient(recipeId){
  if(!selPat){toast('Seleccione paciente primero','error');return}
  var r=DB.recipes.find(function(x){return x.id===recipeId});if(!r)return;
  var p=gP(selPat);if(!p)return;
  // Add to patient chat
  if(typeof chatDB!=='undefined'){
    if(!chatDB[selPat])chatDB[selPat]={enabled:true,messages:[],unread:0};
    var msg='🍽️ *Receta: '+r.nombre+'*\n\n';
    if(r.ingredientes&&r.ingredientes.length){
      msg+='Ingredientes:\n';
      r.ingredientes.forEach(function(i){msg+='• '+(i.nombre||i.n||i)+' ('+(i.gramos||i.g||'')+'g)\n'});
    }
    if(r.pasos&&r.pasos.length){
      msg+='\nPreparacion:\n';
      r.pasos.forEach(function(p,i){msg+=(i+1)+'. '+p+'\n'});
    }
    chatDB[selPat].messages.push({from:'nutri',text:msg,time:new Date().toLocaleString('es',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}),read:true});
    if(typeof saveChatToStorage==='function')saveChatToStorage();
    toast('Receta "'+r.nombre+'" enviada a '+p.nombre+' por mensajeria');
  }
}

// #41 Recetas por patología
function filterRecipesByPathology(pathology){
  // Simple keyword-based filtering
  var keywords={
    'diabetes':['integral','sin azucar','bajo IG','avena','legumbres','verdura'],
    'celiaca':['sin gluten','arroz','maiz','quinoa','patata'],
    'renal':['bajo sodio','bajo potasio','clara','arroz'],
    'hepatica':['bajo sodio','sin alcohol','AACR'],
    'oncologica':['hipercalorica','hiperproteica','omega-3']
  };
  toast('Filtro por patologia: busque recetas con ingredientes recomendados para '+pathology,'info');
}
