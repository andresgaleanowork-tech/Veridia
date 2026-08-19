// ===== DESARROLLADA NEXT-GEN — Clinical Co-Pilot =====
// Flujo: Intake → Molécula Calórica → Auto-Desarrollo → Cuadraje/Semáforo → Minuta

// --- Exchange Groups Matrix ---
var XGROUPS={
  verdA:{n:'Verduras A/B',k:25,p:1.5,g:0.2,h:4,fi:2,ex:'Lechuga, tomate, espinacas, pepino, calabacín, berenjena, judías verdes, acelgas'},
  verdC:{n:'Verduras C',k:65,p:3,g:0.3,h:12,fi:3,ex:'Alcachofas, guisantes, remolacha, zanahoria cocida, coles de Bruselas'},
  frutA:{n:'Frutas A',k:35,p:0.6,g:0.2,h:7,fi:1.2,ex:'Fresas, sandía, melón, papaya, pomelo'},
  frutB:{n:'Frutas B',k:55,p:0.7,g:0.3,h:13,fi:2,ex:'Plátano, manzana, pera, naranja, uvas, mango'},
  cereal:{n:'Cereales/Tubérculos',k:350,p:10,g:1.5,h:75,fi:3,ex:'Arroz, pasta, avena, pan, harina (por 100g seco)'},
  tuberc:{n:'Tubérculos',k:80,p:2,g:0.1,h:18,fi:2,ex:'Patata, boniato (por 100g crudo)'},
  vacuna:{n:'Vacuna',k:170,p:20,g:9,h:0,fi:0,ex:'Ternera, buey'},
  aves:{n:'Aves',k:120,p:22,g:3.5,h:0,fi:0,ex:'Pollo, pavo (sin piel)'},
  cerdo:{n:'Cerdo',k:160,p:20,g:8,h:0,fi:0,ex:'Lomo, solomillo'},
  conejo:{n:'Conejo',k:130,p:21,g:4.5,h:0,fi:0,ex:'Conejo'},
  pescBlanco:{n:'Pescado blanco',k:90,p:18,g:1.5,h:0,fi:0,ex:'Merluza, bacalao, lenguado, rape'},
  pescAzul:{n:'Pescado azul',k:180,p:20,g:10,h:0,fi:0,ex:'Salmón, atún, caballa, sardina'},
  huevo:{n:'Huevo',k:75,p:6.5,g:5,h:0.5,fi:0,ex:'1 huevo mediano (60g)'},
  lecheEnt:{n:'Leche entera',k:130,p:6.5,g:7.5,h:10,fi:0,ex:'200ml leche entera'},
  lecheSemi:{n:'Leche semi',k:95,p:6.5,g:3,h:10,fi:0,ex:'200ml leche semidesnatada'},
  lecheDesn:{n:'Leche desnatada',k:70,p:6.5,g:0.3,h:10,fi:0,ex:'200ml leche desnatada'},
  yogur:{n:'Yogur natural',k:60,p:4,g:3,h:5,fi:0,ex:'1 yogur (125g)'},
  queso:{n:'Queso semicurado',k:350,p:25,g:27,h:1,fi:0,ex:'Por 100g'},
  legumbre:{n:'Legumbres',k:330,p:22,g:2,h:55,fi:15,ex:'Lentejas, garbanzos, judías (100g seco)'},
  frutoSeco:{n:'Frutos secos',k:600,p:18,g:52,h:15,fi:8,ex:'Almendras, nueces, avellanas (100g)'},
  aceite:{n:'Aceite/Grasa',k:90,p:0,g:10,h:0,fi:0,ex:'1 cucharada (10ml) AOVE'}
};

// --- Pathology Profiles ---
var DEV_PATOLOGIAS={
  dm2:{name:'Diabetes Mellitus tipo 2',fe:1.0,protGkg:1.2,grasasPct:30,
    micros:{sodio:{max:2000,u:'mg'},fibra:{min:30,u:'g'}},
    note:'Bajo IG · Fibra >30g · HC complejos · Evitar azúcares simples · ESPEN: HC 45-60% VCT',
    espenMacros:'HC 45-60% (bajo IG) · Prot 1.0-1.2 g/kg · Grasas <35% (MUFA prioritario)',
    meds:{metformina:'Sin restricciones alimentarias específicas',sintrom:'⚠️ CONTROLAR Vitamina K: mantener ingesta estable de verduras A/B',insulina:'Sincronizar HC con horario de inyección'}},
  hta:{name:'Hipertensión arterial',fe:1.0,protGkg:1.0,grasasPct:30,
    micros:{sodio:{max:1500,u:'mg'},potasio:{min:3500,u:'mg'}},
    note:'Dieta DASH · Na <1500mg · Potasio alto · Calcio y Magnesio',
    espenMacros:'Na <2g/día (5g sal) · K >3.5g/día · Prot 0.8-1.0 g/kg · Grasas 30%',
    meds:{enalapril:'Evitar exceso de potasio (suplementos)',losartan:'Evitar exceso de potasio',sintrom:'⚠️ Vitamina K estable'}},
  irc:{name:'Insuficiencia renal crónica',fe:1.0,protGkg:0.8,grasasPct:35,
    micros:{sodio:{max:2000,u:'mg'},potasio:{max:2000,u:'mg'},fosforo:{max:800,u:'mg'}},
    note:'Prot 0.6-0.8g/kg prediálisis · K y P controlados · Na moderado',
    espenMacros:'Prediálisis: Prot 0.6-0.8 g/kg · Diálisis: Prot 1.0-1.2 g/kg · Energía 25-35 kcal/kg',
    meds:{}},
  dislipemia:{name:'Dislipemia',fe:1.0,protGkg:1.2,grasasPct:30,
    micros:{},note:'Grasas saturadas <7% · Aumentar omega-3 · Fibra >25g',
    espenMacros:'Grasas saturadas <7% VCT · MUFA 15-20% · PUFA 6-10% · Fibra soluble >10g',
    meds:{atorvastatina:'Evitar pomelo/zumo de pomelo',simvastatina:'Evitar pomelo'}},
  sobrepeso:{name:'Sobrepeso / Obesidad',fe:1.0,protGkg:1.2,grasasPct:30,
    micros:{},note:'Déficit -500kcal · Alta fibra · Alta saciedad · Densidad nutricional',
    espenMacros:'Déficit 500-750 kcal/día · Prot 1.2-1.5 g/kg peso ajustado · Fibra >30g',
    ajusteKcal:-500,meds:{}},
  embarazo:{name:'Embarazo',fe:1.1,protGkg:1.5,grasasPct:30,
    micros:{},note:'+0 kcal 1ºT · +340 kcal 2ºT · +452 kcal 3ºT · Ác. fólico · Hierro · DHA',
    espenMacros:'1ºT: +0 kcal · 2ºT: +340 kcal · 3ºT: +452 kcal · Prot 1.1 g/kg · DHA ≥200mg',
    ajusteKcal:300,meds:{}},
  deportista:{name:'Alto rendimiento deportivo',fe:1.0,protGkg:1.8,grasasPct:25,
    micros:{},note:'Prot 1.6-2.2g/kg · Timing periworkout · HC alto · Hidratación',
    espenMacros:'Prot 1.6-2.2 g/kg · HC 5-8 g/kg (resistencia) · Grasas 20-25%',
    meds:{}},
  celiaco:{name:'Enfermedad celíaca',fe:1.0,protGkg:1.2,grasasPct:30,
    micros:{},note:'Sin gluten estricto · Vigilar hierro, calcio, B12, folato',
    espenMacros:'Sin gluten estricto · Suplementar Fe, Ca, B12, folato si déficit',
    meds:{}},
  epoc:{name:'EPOC',fe:1.0,protGkg:1.4,grasasPct:40,
    micros:{},note:'↑ Grasas 35-40% · ↓ HC 40-45% (menor producción CO₂) · Comidas pequeñas y frecuentes',
    espenMacros:'Energía 30-35 kcal/kg · Prot 1.2-1.5 g/kg · Grasas 35-40% · HC 40-45% · ESPEN: reducir cociente respiratorio',
    meds:{}},
  cirrosis:{name:'Cirrosis hepática',fe:1.0,protGkg:1.3,grasasPct:30,
    micros:{sodio:{max:2000,u:'mg'}},note:'35 kcal/kg/día · Prot 1.2-1.5g/kg · 5-6 comidas · Snack nocturno · AACR si encefalopatía',
    espenMacros:'Energía 35 kcal/kg/día · Prot 1.2-1.5 g/kg · NO restringir proteínas · Snack nocturno HC',
    meds:{}},
  pancreatitis:{name:'Pancreatitis',fe:1.2,protGkg:1.5,grasasPct:20,
    micros:{},note:'Grasas <20% VCT · TCM si malabsorción · Enzimas pancreáticas · Alcohol cero',
    espenMacros:'Grasas <20% VCT · TCM como fuente lipídica · Prot 1.0-1.5 g/kg · Abstinencia alcohol total',
    meds:{}},
  oncologico:{name:'Cáncer (soporte nutricional)',fe:1.2,protGkg:1.5,grasasPct:35,
    micros:{},note:'Prot 1.2-2.0g/kg · Evitar desnutrición · ONS si ingesta <60% · EPA/DHA 2g/día',
    espenMacros:'Energía 25-30 kcal/kg · Prot 1.2-2.0 g/kg · EPA+DHA ≥2g/día · Suplementos orales si ingesta <60%',
    meds:{}},
  sinpat:{name:'Sin patología específica',fe:1.0,protGkg:1.2,grasasPct:30,
    micros:{},note:'Alimentación equilibrada · Dieta mediterránea como base',
    espenMacros:'HC 45-55% · Prot 0.8-1.2 g/kg · Grasas 25-35% · Fibra ≥25g',
    meds:{}}
};

// --- Template meal plans by pathology ---
function devAutoPlantilla(s){
  var comidas=s.comidas;
  var kcal=s.get;
  // Generate a balanced day using exchange groups
  comidas.forEach(function(c){c.alimentos=[]});
  var p=gP(s.patId);
  var leche=s.patologia.includes('renal')?'lecheDesn':'lecheSemi';
  var cereal_g=40,pan_g=40;

  // Desayuno (~20%)
  var d=comidas[0];
  d.alimentos.push(devMakeFood(leche,200,'ml'));
  d.alimentos.push(devMakeFood('cereal',cereal_g,'g','Copos de avena'));
  d.alimentos.push(devMakeFood('frutB',150,'g','Manzana'));

  // Media mañana (~10%)
  var mm=comidas[1];
  mm.alimentos.push(devMakeFood('yogur',125,'g','Yogur natural'));
  mm.alimentos.push(devMakeFood('frutoSeco',15,'g','Almendras'));

  // Comida (~35%)
  var co=comidas[2];
  co.alimentos.push(devMakeFood('verdA',200,'g','Ensalada mixta'));
  co.alimentos.push(devMakeFood(s.sexo==='M'?'aves':'pescBlanco',150,'g',s.sexo==='M'?'Pechuga de pollo':'Merluza'));
  co.alimentos.push(devMakeFood('cereal',Math.round(kcal>2200?80:60),'g','Arroz integral'));
  co.alimentos.push(devMakeFood('aceite',10,'ml','AOVE'));
  co.alimentos.push(devMakeFood('frutA',150,'g','Fresas'));

  // Merienda (~10%)
  var me=comidas[3];
  me.alimentos.push(devMakeFood('cereal',pan_g,'g','Pan integral'));
  me.alimentos.push(devMakeFood('aves',40,'g','Fiambre de pavo'));

  // Cena (~25%)
  var ce=comidas[4];
  ce.alimentos.push(devMakeFood('verdA',200,'g','Crema de calabacín'));
  ce.alimentos.push(devMakeFood('pescAzul',130,'g','Salmón'));
  ce.alimentos.push(devMakeFood('tuberc',150,'g','Patata cocida'));
  ce.alimentos.push(devMakeFood('aceite',10,'ml','AOVE'));
}

function devMakeFood(groupId,gramos,unit,nombre){
  var xg=XGROUPS[groupId];
  if(!xg) return {food:{n:nombre||groupId,k:0,p:0,gr:0,h:0,fi:0,na:0,K:0,_src:'XG'},gramos:gramos,nombre:nombre||groupId,grupo:groupId,unit:unit||'g'};
  var r=gramos/100;
  // For items measured per portion (leche 200ml=1 portion, yogur 125g=1 portion, huevo 60g=1 unit, aceite 10ml=1 cuch.)
  if(groupId.startsWith('leche')){r=gramos/200} // 200ml = 1 portion
  else if(groupId==='yogur'){r=gramos/125}
  else if(groupId==='huevo'){r=gramos/60}
  else if(groupId==='aceite'){r=gramos/10}
  return {
    food:{n:nombre||xg.n,k:Math.round(xg.k*r),p:+(xg.p*r).toFixed(1),gr:+(xg.g*r).toFixed(1),h:+(xg.h*r).toFixed(1),fi:+(xg.fi*r).toFixed(1),na:0,K:0,_src:'XG'},
    gramos:gramos, nombre:nombre||xg.n, grupo:groupId, unit:unit||'g'
  };
}

// --- State ---
var devState=null;

function devInit(){
  if(!DB.patients.length){devState=null;return}
  if(!selPat||!gP(selPat)){selPat=DB.patients.find(function(p){return p.activo})?.id||DB.patients[0]?.id}
  var p=gP(selPat);if(!p){devState=null;return}
  var an=DB.antropometrias.filter(function(a){return a.pacienteId===selPat}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)})[0];
  var ch=DB.clinicalHistories.find(function(h){return h.pacienteId===selPat});
  devState={
    patId:selPat,step:1,
    peso:an?an.peso:70,altura:an?an.altura:165,edad:age(p.fechaNacimiento),sexo:p.sexo==='MASCULINO'?'M':'F',
    formula:'Mifflin-St Jeor',fa:1.55,fe:1,ajuste:0,
    patologia:'',patKey:'',selectedPaths:[],combinedReqs:null,microVigilados:{},medAlerts:[],
    geb:0,get:0,
    protGkg:1.2,grasasPct:30,
    protG:0,grasasG:0,hcG:0,fibraG:0,aguaL:0,
    comidas:[
      {nombre:'Desayuno',pct:20,alimentos:[]},
      {nombre:'Media mañana',pct:10,alimentos:[]},
      {nombre:'Comida',pct:35,alimentos:[]},
      {nombre:'Merienda',pct:10,alimentos:[]},
      {nombre:'Cena',pct:25,alimentos:[]}
    ],
    messages:[],
    medicacion:ch?ch.medicacion:'',
    alergias:ch?ch.alergias:''
  };
  devCalcGEB();
}

function devCalcGEB(){
  var s=devState;if(!s)return;
  var w=s.peso,h=s.altura,e=s.edad,sx=s.sexo;
  if(s.formula==='Mifflin-St Jeor')s.geb=10*w+6.25*h-5*e+(sx==='M'?5:-161);
  else if(s.formula==='Harris-Benedict')s.geb=sx==='M'?66.5+13.75*w+5.003*h-6.775*e:655.1+9.563*w+1.85*h-4.676*e;
  else s.geb=sx==='M'?879+10.2*w:795+7.18*w;
  s.get=Math.round(s.geb*s.fa*s.fe)+s.ajuste;
  s.protG=Math.round(s.protGkg*w);
  s.grasasG=Math.round(s.get*s.grasasPct/100/9);
  s.hcG=Math.round((s.get-s.protG*4-s.grasasG*9)/4);
  if(s.hcG<0)s.hcG=0;
  s.fibraG=Math.max(25,Math.round(14*s.get/1000));
  s.aguaL=Math.round(35*w/1000*10)/10;
}

function devAccum(){
  var s=devState;if(!s)return{k:0,p:0,g:0,h:0,fi:0,micros:{}};
  var acc={k:0,p:0,g:0,h:0,fi:0,micros:{ca:0,fe:0,na:0,K:0,vc:0,vd:0}};
  s.comidas.forEach(function(c){
    c.alimentos.forEach(function(a){
      var r=(a.gramos||100)/100;
      acc.k+=a.food.k||0;
      acc.p+=a.food.p||0;
      acc.g+=a.food.gr||0;
      acc.h+=a.food.h||0;
      acc.fi+=a.food.fi||0;
      // Micronutrients
      acc.micros.ca+=(a.food.ca||0);
      acc.micros.fe+=(a.food.fe||0);
      acc.micros.na+=(a.food.na||0);
      acc.micros.K+=(a.food.K||0);
      acc.micros.vc+=(a.food.vc||0);
      acc.micros.vd+=(a.food.vd||0);
    });
  });
  return acc;
}

// Micronutrient reference values (IDR)
var MICRO_IDR={
  ca:{name:'Calcio',unit:'mg',idr:1000,max:2500},
  fe:{name:'Hierro',unit:'mg',idr:18,max:45},
  na:{name:'Sodio',unit:'mg',idr:1500,max:2300},
  K:{name:'Potasio',unit:'mg',idr:3500,max:4700},
  vc:{name:'Vitamina C',unit:'mg',idr:90,max:2000},
  vd:{name:'Vitamina D',unit:'µg',idr:15,max:100}
};

// --- Render ---
// ===== DESARROLLADA UI — Amie Design System =====

function rDesarrollada(){
  var pg=requirePatient();if(!pg)return;
  if(!devState||devState.patId!==selPat)devInit();
  if(!devState){$('mainContent').innerHTML='<div class="fade-in"><div class="empty-state"><div class="empty-icon">🔬</div><h3>Seleccione un paciente</h3><button class="btn btn-primary" style="margin-top:14px" onclick="navigate(\'pacientes\')">Ver pacientes</button></div></div>';return}
  var s=devState,p=gP(selPat),steps=['','Datos del paciente','Molécula calórica','Desarrollo','Cuadraje','Minuta'];
  $('mainContent').innerHTML='<div class="fade-in"><div class="dev-wrap">'
  // STEPPER
  +'<div class="dev-stepper" role="navigation" aria-label="Pasos de la desarrollada"><div class="dev-stepper-head"><div class="dev-stepper-logo" style="background:linear-gradient(135deg,var(--primary),var(--accent));font-size:.9rem">🔬</div><div><div style="font-weight:700;font-size:.85rem">Desarrollada</div><div style="font-size:.6rem;color:var(--text3)">Clinical Nutrition</div></div></div>'
  +'<div style="flex:1;padding:12px 0">'
  +[{n:'Datos',s:1},{n:'Macros',s:2},{n:'Desarrollo',s:3},{n:'Cuadraje',s:4},{n:'Minuta',s:5}].map(function(st){
    return '<div class="dev-step'+(s.step===st.s?' active':s.step>st.s?' done':'')+'" onclick="'+(s.step>=st.s?'devState.step='+st.s+';rDesarrollada()':'')+'"><div class="dev-step-num">'+(s.step>st.s?'✓':st.s)+'</div><span style="font-size:.78rem">'+st.n+'</span></div>';
  }).join('')
  +'</div>'
  +'<div style="padding:10px 14px;border-top:1px solid var(--border)"><div style="font-size:.58rem;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Paciente</div>'
  +'<select class="dev-input" style="font-size:.72rem" onchange="selPat=+this.value;devInit();rDesarrollada()">'
  +DB.patients.filter(function(pt){return pt.activo}).map(function(pt){return'<option value="'+pt.id+'"'+(pt.id===selPat?' selected':'')+'>'+pt.nombre+' '+pt.apellidos+'</option>'}).join('')
  +'</select><button class="dev-btn dev-btn-outline" style="width:100%;margin-top:4px;font-size:.65rem" onclick="devInit();rDesarrollada()">↺ Reiniciar</button></div></div>'
  // CONTENT
  +'<div class="dev-content" id="devContent"><div class="dev-mobile-header" style="margin-bottom:12px;padding:10px;background:var(--surface2);border-radius:var(--radius-xs)"><div style="font-weight:700;font-size:.82rem;margin-bottom:6px">🔬 Desarrollada</div>'+patSel(selPat)+'</div></div>'
  // PANEL TOGGLE
  +'<button class="dev-panel-toggle" onclick="toggleDevPanel()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg> Resumen nutricional</button>'
  // PANEL
  +'<div class="dev-panel" id="devPanel"></div>'
  +'</div></div>';
  devRenderPanel();devRenderStep();
}

function devRenderPanel(){
  var el=$('devPanel');if(!el)return;
  var s=devState,acc=devAccum();
  function bar(l,cur,obj,u,isMax){
    var pct=obj>0?Math.min(Math.round(cur/obj*100),150):0;
    var c=isMax?(cur>obj?'var(--danger)':cur>obj*.9?'var(--warning)':'var(--success)'):(pct>=90&&pct<=110?'var(--success)':pct>110?'var(--danger)':'var(--warning)');
    var ic=isMax?(cur>obj?'🔴':'🟢'):(pct>=90&&pct<=110?'🟢':pct>110?'🔴':'🟡');
    return '<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-size:.68rem;margin-bottom:2px"><span style="font-weight:600">'+ic+' '+l+'</span><span><b style="color:'+c+'">'+Math.round(cur)+'</b><span style="color:var(--text3)">/'+obj+u+'</span></span></div><div class="dev-bar"><div class="dev-bar-fill" style="width:'+Math.min(pct,100)+'%;background:'+c+'"></div></div>'
    +(isMax&&cur>obj?'<div style="font-size:.55rem;color:var(--danger);margin-top:1px">⚠ Supera límite</div>':'')+'</div>';
  }
  el.textContent = ''
  +'<div style="text-align:center;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--border)">'
  +'<div style="font-size:.55rem;text-transform:uppercase;letter-spacing:2px;color:var(--text3)">GET Objetivo</div>'
  +'<div style="font-size:2rem;font-weight:900;color:var(--primary);letter-spacing:-1px">'+s.get+' <span style="font-size:.7rem;font-weight:400;color:var(--text3)">kcal</span></div></div>'
  +'<div class="dev-grid-3" style="gap:5px;margin-bottom:14px">'
  +'<div class="dev-macro" style="border-top:3px solid var(--accent)"><div class="dev-macro-val" style="color:var(--accent)">'+s.protG+'g</div><div class="dev-macro-label">Prot</div></div>'
  +'<div class="dev-macro" style="border-top:3px solid var(--warning)"><div class="dev-macro-val" style="color:var(--warning)">'+s.grasasG+'g</div><div class="dev-macro-label">Grasas</div></div>'
  +'<div class="dev-macro" style="border-top:3px solid var(--success)"><div class="dev-macro-val" style="color:var(--success)">'+s.hcG+'g</div><div class="dev-macro-label">HC</div></div>'
  +'</div>'
  +'<div style="font-size:.72rem;font-weight:700;margin-bottom:6px">Cuadraje</div>'
  +bar('Energía',acc.k,s.get,' kcal')+bar('Proteínas',acc.p,s.protG,'g')+bar('Grasas',acc.g,s.grasasG,'g')+bar('HC',acc.h,s.hcG,'g')+bar('Fibra',acc.fi,s.fibraG,'g')
  +'<div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border)"><div style="font-size:.6rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Micronutrientes</div>'
  +Object.entries(MICRO_IDR).map(function(e){var key=e[0],m=e[1];var cur=Math.round(acc.micros[key]||0);return bar(m.name,cur,m.idr,m.unit,'🔬')}).join('')+'</div>';

  // ESPEN Micronutrient recommendations
  if(s.patologia&&typeof renderESPENMicroPanel==='function'){
    var patList=s.selectedPaths?s.selectedPaths.map(function(k){var lp=DEV_PATOLOGIAS[k];return lp?lp.name:k}):s.patologia?[s.patologia]:[];
    el.innerHTML+=renderESPENMicroPanel(patList);
  }
  for(var mk in s.microVigilados){var mv=s.microVigilados[mk];el.innerHTML+=bar(mk.charAt(0).toUpperCase()+mk.slice(1),acc.micros[mk]||0,mv.max||mv.min||0,' '+mv.u,!!mv.max)}
  if(s.patologia) el.innerHTML+='<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border)"><div style="font-size:.58rem;text-transform:uppercase;letter-spacing:1px;color:var(--text3);font-weight:600">❤️ Patología</div><div style="font-size:.82rem;font-weight:700;margin:4px 0">'+s.patologia+'</div><div style="font-size:.68rem;color:var(--text3)">'+(DEV_PATOLOGIAS[s.patKey]?DEV_PATOLOGIAS[s.patKey].note:'')+'</div>'
  +(s.medAlerts.length?'<div class="alert alert-warning" style="margin-top:6px;font-size:.65rem;padding:6px 8px">'+s.medAlerts.map(function(a){return '💊 '+a}).join('<br>')+'</div>':'')+'</div>';
  if(s.alergias&&s.alergias!=='Ninguna conocida') el.innerHTML+='<div class="alert alert-danger" style="margin-top:6px;font-size:.65rem;padding:6px 8px">⚠️ '+s.alergias+'</div>';
  el.innerHTML+='<div style="margin-top:10px;text-align:center;font-size:.6rem;color:var(--text3)">'+s.comidas.reduce(function(t,c){return t+c.alimentos.length},0)+' alimentos · '+s.comidas.length+' tomas</div>';
}

function devRenderStep(){
  var el=$('devContent');if(!el)return;
  var s=devState,p=gP(selPat);
  if(s.step===1) devRenderStep1(el,s,p);
  else if(s.step===2) devRenderStep2(el,s,p);
  else if(s.step===3) devRenderStep3(el,s,p);
  else if(s.step===4) devRenderStep4(el,s,p);
  else if(s.step===5) devRenderStep5(el,s,p);
}

function devRenderStep1(el,s,p){
  // Wire: load template selector
  var _tplHtml='';
  if(DB.devTemplates&&DB.devTemplates.length){
    _tplHtml='<div style="margin-bottom:14px;padding:10px;background:var(--surface2,#f5f5f5);border-radius:8px"><strong style="font-size:.82rem">📋 Cargar plantilla:</strong> '
    +'<select style="font-size:.82rem;padding:4px 8px;border-radius:6px;border:1px solid var(--border);margin-left:6px" onchange="if(this.value)devLoadTemplate(this.value)">'
    +'<option value="">— Seleccionar —</option>'
    +DB.devTemplates.map(function(t){return '<option value="'+t.id+'">'+t.nombre+' ('+t.get+'kcal)</option>'}).join('')
    +'</select></div>';
  }
  var ch=DB.clinicalHistories.find(function(h){return h.pacienteId===s.patId});
  el.innerHTML=''+_tplHtml+'<div class="dev-step-container"><h2 style="font-size:1.1rem;font-weight:800;margin-bottom:2px">📋 Recepción de datos</h2><p style="font-size:.78rem;color:var(--text3);margin-bottom:18px">Datos cargados. Ajuste y seleccione patología.</p>'
  +'<div class="card" style="margin-bottom:14px"><div class="card-body"><div class="dev-grid-3">'
  +[{l:'Peso',v:s.peso+'kg'},{l:'Talla',v:s.altura+'cm'},{l:'Edad',v:s.edad+'a'},{l:'Sexo',v:s.sexo==='M'?'♂ Masculino':'♀ Femenino'},{l:'Medicación',v:s.medicacion||'Ninguna'},{l:'Alergias',v:s.alergias||'Ninguna'}
  ].map(function(f){return'<div class="stat-card" style="padding:10px"><div style="font-size:.58rem;text-transform:uppercase;color:var(--text3);letter-spacing:.5px">'+f.l+'</div><div style="font-size:.92rem;font-weight:700;margin-top:2px">'+f.v+'</div></div>'}).join('')
  +'</div></div></div>'
  +'<div class="card" style="margin-bottom:14px;border-top:3px solid var(--accent)"><div class="card-header"><span class="card-title" style="font-size:.85rem">⚙️ Parámetros de cálculo</span></div><div class="card-body"><div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Fórmula</label><select id="devFormula" class="dev-input"><option'+(s.formula==='Mifflin-St Jeor'?' selected':'')+'>Mifflin-St Jeor</option><option'+(s.formula==='Harris-Benedict'?' selected':'')+'>Harris-Benedict</option><option'+(s.formula==='Owen'?' selected':'')+'>Owen</option></select></div><div class="form-group"><label class="form-label">Factor actividad</label><select id="devFA" class="dev-input"><option value="1.2"'+(s.fa===1.2?' selected':'')+'>Sedentario (1.2)</option><option value="1.375"'+(s.fa===1.375?' selected':'')+'>Ligera (1.375)</option><option value="1.55"'+(s.fa===1.55?' selected':'')+'>Moderada (1.55)</option><option value="1.725"'+(s.fa===1.725?' selected':'')+'>Intensa (1.725)</option><option value="1.9"'+(s.fa===1.9?' selected':'')+'>Muy intensa (1.9)</option></select></div></div></div></div>'
  +'<div class="card" style="margin-bottom:18px;border-top:3px solid #dc2626"><div class="card-header"><span class="card-title" style="font-size:.85rem">❤️ Patología clínica</span></div><div class="card-body"><div class="dev-grid-auto">'
  +Object.keys(DEV_PATOLOGIAS).map(function(k){var pat=DEV_PATOLOGIAS[k];var sel=s.selectedPaths&&s.selectedPaths.indexOf(k)>=0;return'<div class="dev-pat-card'+(sel?' active':'')+'" onclick="devSelectPat(\''+k+'\')"><div style="display:flex;align-items:center;gap:4px"><span style="font-size:.7rem">'+(sel?'☑':'☐')+'</span><strong style="font-size:.78rem;color:'+(sel?'var(--primary)':'var(--text)')+'">'+pat.name+'</strong></div><div style="font-size:.6rem;color:var(--text3);margin-top:2px">'+pat.note.split('·')[0].trim()+'</div></div>'}).join('')
  +(s.selectedPaths&&s.selectedPaths.length?'<div style="margin-top:12px;padding:12px;background:var(--primary-light);border-radius:var(--radius-sm);border:1px solid var(--primary)"><div style="font-size:.72rem;font-weight:700;color:var(--primary);margin-bottom:6px">'+s.selectedPaths.length+' patología(s) seleccionada(s): '+s.patologia+'</div>'+(s.combinedReqs?'<div style="font-size:.68rem;color:var(--text2)">Proteínas: '+s.combinedReqs.prot.min+'-'+s.combinedReqs.prot.max+' g/kg · Grasas: '+s.combinedReqs.grasas.min+'-'+s.combinedReqs.grasas.max+'%'+(s.combinedReqs.restrict.length?' · <span style="color:var(--danger)">Restringir: '+s.combinedReqs.restrict.join(', ')+'</span>':'')+(s.combinedReqs.increase.length?' · <span style="color:var(--success)">Aumentar: '+s.combinedReqs.increase.join(', ')+'</span>':'')+'</div>':'')+'</div>':'')
  +'</div></div></div>'
  +'<div class="dev-actions"><button class="btn btn-primary" onclick="devStep1Next()" style="padding:10px 28px;border-radius:10px">🧮 Calcular macros →</button></div></div>';
}

function devRenderStep2(el,s,p){
  var pP=Math.round(s.protG*4/s.get*100),hP=100-pP-s.grasasPct;
  el.innerHTML='<div class="dev-step-container"><h2 style="font-size:1.1rem;font-weight:800;margin-bottom:2px">🔬 Molécula calórica</h2><p style="font-size:.78rem;color:var(--text3);margin-bottom:18px">Adaptada a <strong style="color:var(--primary)">'+s.patologia+'</strong>. Ajuste y apruebe.</p>'
  +'<div class="dev-grid-4" style="margin-bottom:16px">'
  +[{l:'GEB',v:Math.round(s.geb)+' kcal'},{l:'FA × FE',v:'×'+s.fa+' × ×'+s.fe},{l:'Ajuste',v:s.ajuste+' kcal'},{l:'GET',v:s.get+' kcal',big:1}
  ].map(function(x){return'<div class="stat-card" style="padding:12px;text-align:center"><div style="font-size:.55rem;text-transform:uppercase;color:var(--text3)">'+x.l+'</div><div style="font-size:'+(x.big?'1.3':'.92')+'rem;font-weight:'+(x.big?'900':'700')+';color:'+(x.big?'var(--primary)':'var(--text)')+';margin-top:3px">'+x.v+'</div></div>'}).join('')+'</div>'
  +'<div class="card" style="margin-bottom:16px"><div class="card-header"><span class="card-title">Macronutrientes</span></div><div class="card-body">'
  +'<div class="dev-grid-3" style="margin-bottom:14px">'
  +'<div class="dev-card" style="padding:14px;border-top:3px solid var(--accent)"><div class="dev-macro-label">Proteínas</div><div class="dev-macro-val" style="color:var(--accent)">'+s.protG+'g</div><div class="form-row" style="margin-top:6px"><label style="font-size:.62rem;color:var(--text3)">g/kg:</label><input type="number" id="devProtKg" value="'+s.protGkg+'" step="0.1" min="0.5" max="3" class="dev-input" style="text-align:center;font-weight:700" onchange="devRecalcMacros()"></div><div style="font-size:.6rem;color:var(--text3);margin-top:4px">'+pP+'% · '+s.protG*4+' kcal</div></div>'
  +'<div class="dev-card" style="padding:14px;border-top:3px solid var(--warning)"><div class="dev-macro-label">Grasas</div><div class="dev-macro-val" style="color:var(--warning)">'+s.grasasG+'g</div><div class="form-row" style="margin-top:6px"><label style="font-size:.62rem;color:var(--text3)">%VCT:</label><input type="number" id="devGrPct" value="'+s.grasasPct+'" min="15" max="45" class="dev-input" style="text-align:center;font-weight:700" onchange="devRecalcMacros()"></div><div style="font-size:.6rem;color:var(--text3);margin-top:4px">'+s.grasasPct+'% · '+s.grasasG*9+' kcal</div></div>'
  +'<div class="dev-card" style="padding:14px;border-top:3px solid var(--success)"><div class="dev-macro-label">HC</div><div class="dev-macro-val" style="color:var(--success)">'+s.hcG+'g</div><div style="font-size:.62rem;color:var(--text3);margin-top:6px">Por diferencia</div><div style="font-size:.6rem;color:var(--text3);margin-top:4px">'+hP+'% · '+s.hcG*4+' kcal</div></div>'
  +'</div>'
  +'<div style="display:flex;height:12px;border-radius:6px;overflow:hidden"><div style="width:'+pP+'%;background:var(--accent)"></div><div style="width:'+s.grasasPct+'%;background:var(--warning)"></div><div style="width:'+hP+'%;background:var(--success)"></div></div>'
  +'</div></div>'
  +'<div class="dev-actions"><button class="btn btn-outline" style="border-radius:8px" onclick="devState.step=1;rDesarrollada()">← Volver</button><button class="btn btn-primary" style="padding:10px 28px;border-radius:10px" onclick="devStep2Approve()">✓ Aprobar y desarrollar →</button></div></div>';
}

function devRenderStep3(el,s,p){
  el.innerHTML='<div class="dev-step3-layout">'
  +'<div class="dev-card dev-food-sidebar" style="display:flex;flex-direction:column">'
  +'<div style="padding:12px;border-bottom:1px solid var(--border)">'
  +'<div style="font-size:.78rem;font-weight:700;margin-bottom:8px">🔍 Catálogo de alimentos</div>'
  +'<input id="devFoodSearch" class="dev-input" placeholder="Buscar alimento..." oninput="devSearchFood(this.value)">'
  +'<div style="display:flex;gap:4px;margin-top:6px">'
  +['bedca','xg','off','usda'].map(function(src){return'<div class="dev-src-tab'+(devFoodSrc===src?' active':'')+'" onclick="devFoodSrc=\''+src+'\';devSearchFood(document.getElementById(\'devFoodSearch\').value);devRenderStep3Tabs()">'+{bedca:'BEDCA',xg:'Grupos',off:'OFF',usda:'USDA'}[src]+'</div>'}).join('')
  +'</div></div>'
  +'<div style="flex:1;overflow-y:auto" id="devFoodResults"><div style="padding:20px;text-align:center;font-size:.72rem;color:var(--text3)">Escriba para buscar<br><br><span style="font-size:.62rem">Clic = ver detalle<br>Doble clic = agregar</span></div></div></div>'
  +'<div class="dev-meals-area">'
  +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px"><h2 style="font-size:1rem;font-weight:800;margin:0">🍽️ Tomas del día</h2>'
  +'<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-outline btn-sm" onclick="devState.step=2;rDesarrollada()">← Macros</button><button class="btn btn-outline btn-sm" onclick="showEquivalencias()">📐 Equivalencias</button><button class="btn btn-primary btn-sm" onclick="devState.step=4;rDesarrollada()">Cuadraje →</button></div></div>'
  +s.comidas.map(function(c,ci){
    var cK=c.alimentos.reduce(function(t,a){return t+a.food.k},0);
    var objK=Math.round(s.get*c.pct/100);
    var pct=objK>0?Math.round(cK/objK*100):0;
    return '<div class="dev-meal'+(devTargetMeal===ci?' active':'')+'">'
    +'<div class="dev-meal-head"><div style="display:flex;align-items:center;gap:6px"><strong style="font-size:.82rem">'+c.nombre+'</strong><span class="badge badge-neutral" style="font-size:.58rem">'+c.pct+'% · ~'+objK+'kcal</span></div>'
    +'<div style="display:flex;align-items:center;gap:6px"><span class="badge '+(pct>110?'badge-danger':pct>=80?'badge-success':'badge-warning')+'" style="font-size:.62rem">'+cK+' kcal</span>'
    +'<button class="dev-btn '+(devTargetMeal===ci?'dev-btn-success':'dev-btn-primary')+'" style="font-size:.62rem;padding:3px 8px" onclick="devAddFoodTo('+ci+')">'+(devTargetMeal===ci?'✓ Activa':'Seleccionar')+'</button></div></div>'
    +(c.alimentos.length?c.alimentos.map(function(a,ai){
      return '<div class="dev-food-row" draggable="true" ondragstart="devDragStart(event,'+ci+','+ai+')" ondragend="devDragEnd(event)"><span style="color:var(--text3);cursor:grab">⠿</span><span style="flex:1;font-weight:600">'+a.nombre+'</span>'
      +'<input type="number" value="'+a.gramos+'" min="1" max="9999" class="dev-input dev-input-sm" style="text-align:center;font-weight:700" onchange="devUpdateGrams('+ci+','+ai+',this.value)">'
      +'<span style="font-size:.58rem;color:var(--text3)">'+(a.unit||'g')+'</span>'
      +'<span style="color:var(--primary);font-weight:700;min-width:40px;text-align:right;font-size:.75rem">'+a.food.k+'<span style="font-size:.5rem;color:var(--text3)">kcal</span></span>'
      +'<span style="font-size:.58rem;color:var(--text3)">P'+a.food.p+' G'+a.food.gr+' HC'+a.food.h+'</span>'
      +'<button style="background:none;border:none;cursor:pointer;font-size:.75rem" onclick="devSuggestSubstitute('+ci+','+ai+')" title="Sustituir">🔄</button>'
      +'<button style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:.75rem" onclick="devRemoveFood('+ci+','+ai+')">✕</button></div>';
    }).join(''):'<div style="padding:14px;text-align:center;font-size:.72rem;color:var(--text3)">Sin alimentos — busque y haga doble clic</div>')
    +'</div>';
  }).join('')+'</div></div>';
}

function devRenderStep3Tabs(){var dc=$('devContent');if(dc){var tabs=dc.querySelectorAll('.dev-src-tab');tabs.forEach(function(t){t.className='dev-src-tab'+(t.textContent.toLowerCase()===devFoodSrc||({bedca:'BEDCA',xg:'Grupos',off:'OFF',usda:'USDA'})[devFoodSrc]===t.textContent?' active':'')})}}

function toggleDevPanel(){var p=$('devPanel');if(p)p.classList.toggle('collapsed')}

function devRenderStep4(el,s,p){
  var acc=devAccum();
  function row(l,cur,obj,u){
    var pct=obj>0?Math.round(cur/obj*100):0;var st=pct>=90&&pct<=110?'success':pct>110?'danger':'warning';
    return '<tr><td style="font-weight:600">'+(pct>=90&&pct<=110?'🟢':pct>110?'🔴':'🟡')+' '+l+'</td><td style="text-align:right"><strong style="color:var(--'+st+')">'+Math.round(cur)+'</strong></td><td style="text-align:right;color:var(--text3)">'+obj+'</td><td style="text-align:right;color:var(--text3)">'+u+'</td><td style="text-align:right"><span class="badge badge-'+st+'" style="font-size:.62rem">'+pct+'%</span></td><td style="width:80px"><div class="dev-bar"><div class="dev-bar-fill" style="width:'+Math.min(pct,100)+'%;background:var(--'+st+')"></div></div></td></tr>';
  }
  el.innerHTML='<div class="dev-step-container"><h2 style="font-size:1.1rem;font-weight:800;margin-bottom:16px">📊 Cuadraje final</h2>'
  +'<div class="card" style="margin-bottom:16px;border-top:3px solid var(--primary)"><div class="card-body" style="padding:0;overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.82rem"><thead><tr style="background:var(--surface2)"><th style="padding:10px 14px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Nutriente</th><th style="padding:10px;text-align:right;font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:var(--primary);font-weight:600">Actual</th><th style="padding:10px;text-align:right;font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Objetivo</th><th style="padding:10px;text-align:right;font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Ud</th><th style="padding:10px;text-align:right;font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">%</th><th style="padding:10px;width:80px;font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Barra</th></tr></thead><tbody>'
  +row('Energía',acc.k,s.get,'kcal')+row('Proteínas',acc.p,s.protG,'g')+row('Grasas',acc.g,s.grasasG,'g')+row('HC',acc.h,s.hcG,'g')+row('Fibra',acc.fi,s.fibraG,'g');
  // All micronutrients (always shown)
  el.innerHTML+='<tr><td colspan="6" style="padding:8px 14px;border-top:2px solid var(--border);font-size:.65rem;color:var(--text3);text-transform:uppercase;letter-spacing:1px">Vitaminas y minerales</td></tr>';
  Object.entries(MICRO_IDR).forEach(function(e){var key=e[0],m=e[1];el.innerHTML+=row(m.name,Math.round(acc.micros[key]||0),m.idr,m.unit)});
  el.innerHTML+='</tbody></table></div></div>'
  +'<div class="dev-actions"><button class="btn btn-outline" style="border-radius:8px" onclick="devState.step=3;rDesarrollada()">← Ajustar</button><button class="btn btn-primary" style="padding:10px 28px;border-radius:10px" onclick="devState.step=5;rDesarrollada()">📄 Generar minuta →</button></div></div>';
}

function devRenderStep5(el,s,p){
  var acc=devAccum(),pP=Math.round(s.protG*4/s.get*100),hP=100-pP-s.grasasPct;
  el.innerHTML='<div class="dev-step-container"><h2 style="font-size:1.1rem;font-weight:800;margin-bottom:2px">📄 Fórmula Desarrollada</h2><p style="font-size:.78rem;color:var(--text3);margin-bottom:16px">'+p.nombre+' '+p.apellidos+' · '+s.patologia+' · '+new Date().toLocaleDateString('es-ES')+'</p>'
  +'<div class="dev-grid-5" style="margin-bottom:16px">'
  +[{l:'GET',v:s.get+' kcal',c:'primary'},{l:'Proteínas',v:s.protG+'g ('+pP+'%)',c:'accent'},{l:'Grasas',v:s.grasasG+'g ('+s.grasasPct+'%)',c:'warning'},{l:'HC',v:s.hcG+'g ('+hP+'%)',c:'success'},{l:'Fibra',v:s.fibraG+'g',c:'info'}
  ].map(function(x){return'<div class="stat-card" style="padding:10px;text-align:center"><div style="font-size:.55rem;color:var(--text3);text-transform:uppercase">'+x.l+'</div><div style="font-size:.88rem;font-weight:800;color:var(--'+x.c+');margin-top:2px">'+x.v+'</div></div>'}).join('')+'</div>'
  +s.comidas.map(function(c){if(!c.alimentos.length)return'';var cK=c.alimentos.reduce(function(t,a){return t+a.food.k},0);
    return '<div class="card" style="margin-bottom:10px"><div class="card-header"><span class="card-title" style="font-size:.82rem">'+c.nombre+'</span><span class="badge badge-primary" style="font-size:.65rem">'+cK+' kcal</span></div>'
    +'<div class="card-body" style="padding:0"><table><tbody>'
    +c.alimentos.map(function(a){return'<tr><td style="font-weight:600">'+a.nombre+'</td><td style="text-align:right;color:var(--text3)">'+a.gramos+(a.unit||'g')+'</td><td style="text-align:right;color:var(--primary);font-weight:700">'+a.food.k+' kcal</td><td style="text-align:right;color:var(--text3)">P'+a.food.p+'g</td><td style="text-align:right;color:var(--text3)">G'+a.food.gr+'g</td><td style="text-align:right;color:var(--text3)">HC'+a.food.h+'g</td></tr>'}).join('')
    +'</tbody></table></div></div>';
  }).join('')
  +'<div class="dev-actions" style="margin-top:16px"><button class="btn btn-outline" style="border-radius:8px" onclick="devState.step=3;rDesarrollada()">← Editar</button><button class="btn btn-outline" style="border-radius:8px" onclick="devPreviewMinuta()">👁️ Preview</button><button class="btn btn-outline" style="border-radius:8px" onclick="devSaveAsTemplate()">📋 Plantilla</button><button class="btn btn-primary" style="padding:10px 28px;border-radius:10px" onclick="devSaveMinuta()">💾 Guardar minuta</button></div></div>';
}

var devFoodSrc='bedca';
var devFoodSearchResults=[];
var devTargetMeal=0;
var devExpandedFood=-1;

function devSearchFood(q){
  if(!q||q.length<2){var r=$('devFoodResults');if(r)r.innerHTML='<div style="padding:20px;text-align:center;font-size:.72rem;color:var(--text3)">Escriba 2+ caracteres</div>';return}
  var results=[];
  if(devFoodSrc==='bedca'){
    results=BEDCA_DB.filter(function(f){return f.n&&f.n.toLowerCase().includes(q.toLowerCase())}).slice(0,30).map(function(f){return{id:f.id,n:f.n,k:f.k||0,p:f.p||0,g:f.gr||0,h:f.h||0,fi:f.fi||0,src:'BEDCA',food:f}});
    devFoodSearchResults=results;devRenderFoodResults(results);
  } else if(devFoodSrc==='xg'){
    results=Object.keys(XGROUPS).filter(function(k){return XGROUPS[k].n.toLowerCase().includes(q.toLowerCase())||XGROUPS[k].ex.toLowerCase().includes(q.toLowerCase())}).map(function(k){var x=XGROUPS[k];return{id:'XG_'+k,n:x.n,k:x.k,p:x.p,g:x.g,h:x.h,fi:x.fi,src:'XG',xgKey:k,ex:x.ex}});
    devFoodSearchResults=results;devRenderFoodResults(results);
  } else if(devFoodSrc==='off'){
    $('devFoodResults').innerHTML='<div style="padding:16px;text-align:center;font-size:.72rem;color:var(--warning)">⏳ Buscando en OFF...</div>';
    fetch('https://world.openfoodfacts.net/cgi/search.pl?search_terms='+encodeURIComponent(q)+'&json=1&page_size=20&lc=es&fields=code,product_name,product_name_es,brands,nutriments')
    .then(function(r){return r.json()}).then(function(d){
      devFoodSearchResults=(d.products||[]).filter(function(p){var n=p.nutriments||{};return n['energy-kcal_100g']||n['proteins_100g']}).map(function(p){var n=p.nutriments||{};return{id:'OFF_'+p.code,n:p.product_name_es||p.product_name||'?',k:n['energy-kcal_100g']||0,p:n['proteins_100g']||0,g:n['fat_100g']||0,h:n['carbohydrates_100g']||0,fi:n['fiber_100g']||0,src:'OFF',brand:p.brands||'',food:{n:p.product_name_es||p.product_name,k:n['energy-kcal_100g']||0,p:n['proteins_100g']||0,gr:n['fat_100g']||0,h:n['carbohydrates_100g']||0,fi:n['fiber_100g']||0,na:n['sodium_100g']?n['sodium_100g']*1000:0,K:n['potassium_100g']?n['potassium_100g']*1000:0,_src:'OFF'}}});
      devRenderFoodResults(devFoodSearchResults);
    }).catch(function(e){$('devFoodResults').innerHTML='<div style="padding:12px;font-size:.72rem;color:var(--danger)">Error: '+e.message+'</div>'});
  } else if(devFoodSrc==='usda'){
    $('devFoodResults').innerHTML='<div style="padding:16px;text-align:center;font-size:.72rem;color:var(--warning)">⏳ Buscando en USDA...</div>';
    fetch('https://api.nal.usda.gov/fdc/v1/foods/search?api_key='+USDA_KEY+'&query='+encodeURIComponent(usdaTranslateQuery(q))+'&pageSize=20&dataType=SR%20Legacy')
    .then(function(r){return r.json()}).then(function(d){
      devFoodSearchResults=(d.foods||[]).map(function(f){var nuts={};(f.foodNutrients||[]).forEach(function(n){nuts[n.nutrientName]=n});var kcalN=nuts['Energy'];var kc=(kcalN&&kcalN.unitName==='KCAL')?kcalN.value:0;return{id:'USDA_'+f.fdcId,n:usdaTranslate(f.description),k:kc,p:(nuts['Protein']||{}).value||0,g:(nuts['Total lipid (fat)']||{}).value||0,h:(nuts['Carbohydrate, by difference']||{}).value||0,fi:(nuts['Fiber, total dietary']||{}).value||0,src:'USDA',nameEN:f.description,food:{n:usdaTranslate(f.description),k:kc,p:(nuts['Protein']||{}).value||0,gr:(nuts['Total lipid (fat)']||{}).value||0,h:(nuts['Carbohydrate, by difference']||{}).value||0,fi:(nuts['Fiber, total dietary']||{}).value||0,na:(nuts['Sodium, Na']||{}).value||0,K:(nuts['Potassium, K']||{}).value||0,_src:'USDA'}}}).filter(function(f){return f.k>0||f.p>0});
      devRenderFoodResults(devFoodSearchResults);
    }).catch(function(e){$('devFoodResults').innerHTML='<div style="padding:12px;font-size:.72rem;color:var(--danger)">Error: '+e.message+'</div>'});
  }
}

function devRenderFoodResults(results){
  var el=$('devFoodResults');if(!el)return;
  if(!results.length){el.innerHTML='<div style="padding:16px;text-align:center;font-size:.72rem;color:var(--text3)">Sin resultados</div>';return}
  el.innerHTML='<div style="font-size:.58rem;color:var(--text3);padding:4px 8px;border-bottom:1px solid var(--border)">'+results.length+' · <b>Clic</b> = detalle · <b>Doble clic</b> = agregar</div>'
  +results.map(function(f,i){
    var isExp=devExpandedFood===i;
    return '<div style="border-bottom:1px solid var(--border)">'
    +'<div class="dev-food-row" style="cursor:pointer;background:'+(isExp?'var(--primary-light)':'')+'" onclick="devExpandFood('+i+')" ondblclick="devPickFood('+i+')">'
    +'<div style="flex:1;min-width:0"><div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:'+(isExp?'var(--primary)':'var(--text)')+'">'+f.n+'</div>'
    +(f.brand?'<div style="font-size:.58rem;color:var(--text3)">'+f.brand+'</div>':'')+'</div>'
    +'<span class="badge badge-'+(f.src==='BEDCA'?'primary':f.src==='OFF'?'success':f.src==='USDA'?'info':'warning')+'" style="font-size:.5rem">'+f.src+'</span>'
    +'<span style="font-weight:700;color:var(--primary);font-size:.75rem;min-width:30px;text-align:right">'+Math.round(f.k)+'</span></div>'
    +(isExp?devRenderFoodDetail(f,i):'')+'</div>';
  }).join('');
}

function devRenderFoodDetail(f,idx){
  var macros=[{l:'Kcal',v:Math.round(f.k),c:'text'},{l:'Prot',v:f.p,c:'accent'},{l:'Grasas',v:f.g,c:'warning'},{l:'HC',v:f.h,c:'success'},{l:'Fibra',v:f.fi,c:'text3'}];
  var micros=[],base=f.food||f;
  if(base.ca)micros.push({l:'Ca',v:Math.round(base.ca),u:'mg'});
  if(base.fe)micros.push({l:'Fe',v:base.fe,u:'mg'});
  if(base.na)micros.push({l:'Na',v:Math.round(base.na),u:'mg'});
  if(base.K)micros.push({l:'K',v:Math.round(base.K),u:'mg'});
  if(base.vc)micros.push({l:'VitC',v:base.vc,u:'mg'});
  if(base.vd)micros.push({l:'VitD',v:base.vd,u:'µg'});
  var mealName=devState&&devState.comidas?devState.comidas[devTargetMeal].nombre:'comida';
  return '<div class="dev-food-detail"><div class="dev-food-detail-grid">'+macros.map(function(m){return'<div class="dev-food-detail-cell"><div style="font-size:.55rem;color:var(--text3)">'+m.l+'</div><div style="font-weight:700;font-size:.78rem;color:var(--'+m.c+')">'+m.v+'</div></div>'}).join('')+'</div>'
  +(micros.length?'<div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:6px">'+micros.map(function(m){return'<span class="dev-micro-badge">'+m.l+': <b>'+m.v+'</b>'+m.u+'</span>'}).join('')+'</div>':'')
  +(f.ex?'<div style="font-size:.58rem;color:var(--text3);margin-bottom:6px">📋 '+f.ex+'</div>':'')
  +'<div style="font-size:.52rem;color:var(--text3);margin-bottom:6px">Valores por 100g</div>'
  +'<div style="display:flex;gap:6px;align-items:center"><input type="number" id="devAddGrams_'+idx+'" value="100" min="1" max="9999" step="5" class="dev-input" style="width:55px;text-align:center;font-weight:700;padding:5px"><span style="font-size:.65rem;color:var(--text3)">g</span>'
  +'<button class="dev-btn dev-btn-primary" style="flex:1" onclick="devPickFood('+idx+')">+ Agregar a '+mealName+'</button></div></div>';
}

function devExpandFood(idx){devExpandedFood=devExpandedFood===idx?-1:idx;devRenderFoodResults(devFoodSearchResults)}

function devPickFood(idx){
  var f=devFoodSearchResults[idx];if(!f)return;var s=devState;
  var inp=document.getElementById('devAddGrams_'+idx);var grams=inp?parseInt(inp.value)||100:100;
  if(!inp&&f.xgKey){if(f.xgKey.startsWith('leche'))grams=200;else if(f.xgKey==='yogur')grams=125;else if(f.xgKey==='huevo')grams=60;else if(f.xgKey==='aceite')grams=10;else if(f.xgKey==='frutoSeco')grams=20}
  var food;
  if(f.xgKey){food=devMakeFood(f.xgKey,grams,f.xgKey==='aceite'||f.xgKey.startsWith('leche')?'ml':'g')}
  else{var r=grams/100;var b=f.food||f;food={food:{n:b.n||f.n,k:Math.round((b.k||0)*r),p:Number(((b.p||0)*r).toFixed(1)),gr:Number(((b.gr||b.g||0)*r).toFixed(1)),h:Number(((b.h||0)*r).toFixed(1)),fi:Number(((b.fi||0)*r).toFixed(1)),na:Math.round((b.na||0)*r),K:Math.round((b.K||0)*r),ca:Math.round((b.ca||0)*r),fe:Number(((b.fe||0)*r).toFixed(1)),vc:Number(((b.vc||0)*r).toFixed(1)),vd:Number(((b.vd||0)*r).toFixed(2)),_src:f.src||'BEDCA'},gramos:grams,nombre:f.n,unit:'g'}}
  s.comidas[devTargetMeal].alimentos.push(food);devExpandedFood=-1;devRenderPanel();devRenderStep();toast('✓ '+f.n+' → '+s.comidas[devTargetMeal].nombre);
}

function devAddFoodTo(ci){devTargetMeal=ci;var inp=$('devFoodSearch');if(inp){inp.focus();inp.placeholder='Buscar para '+devState.comidas[ci].nombre+'...'};devRenderStep()}
function devRemoveFood(ci,ai){devState.comidas[ci].alimentos.splice(ai,1);devRenderPanel();devRenderStep()}
function devUpdateGrams(ci,ai,val){var a=devState.comidas[ci].alimentos[ai];if(!a)return;var ratio=(parseInt(val)||100)/a.gramos;a.gramos=parseInt(val)||100;a.food.k=Math.round(a.food.k*ratio);a.food.p=Number((a.food.p*ratio).toFixed(1));a.food.gr=Number((a.food.gr*ratio).toFixed(1));a.food.h=Number((a.food.h*ratio).toFixed(1));a.food.fi=Number((a.food.fi*ratio).toFixed(1));if(a.food.na)a.food.na=Math.round(a.food.na*ratio);if(a.food.K)a.food.K=Math.round(a.food.K*ratio);devRenderPanel();devRenderStep()}
function devRecalcMacros(){var s=devState;if($('devProtKg'))s.protGkg=parseFloat($('devProtKg').value)||1.2;if($('devGrPct'))s.grasasPct=parseInt($('devGrPct').value)||30;devCalcGEB();rDesarrollada()}

function devSelectPat(key){
  var s=devState;
  // Multi-pathology: toggle selection
  if(!s.selectedPaths) s.selectedPaths=[];
  var idx=s.selectedPaths.indexOf(key);
  if(idx>=0) s.selectedPaths.splice(idx,1); else s.selectedPaths.push(key);

  // Combine requirements from all selected pathologies
  if(s.selectedPaths.length){
    // Legacy DEV_PATOLOGIAS
    var legacyPat=DEV_PATOLOGIAS[s.selectedPaths[0]];
    if(legacyPat){s.patKey=s.selectedPaths[0];s.patologia=legacyPat.name;s.fe=legacyPat.fe;s.protGkg=legacyPat.protGkg;s.grasasPct=legacyPat.grasasPct;s.microVigilados=legacyPat.micros||{};s.ajuste=legacyPat.ajusteKcal||0}
    // Combine PATHOLOGY_DB requirements
    var combined={prot:{min:0.8,max:1.2},grasas:{min:25,max:35},restrict:[],increase:[],notes:[],micros:{}};
    s.selectedPaths.forEach(function(k){
      // Check PATHOLOGY_DB categories
      if(typeof PATHOLOGY_DB!=='undefined'){
        Object.entries(PATHOLOGY_DB).forEach(function(e){
          var cat=e[0],data=e[1];
          if(data.conditions&&data.conditions.some(function(c){return c.id===k})){
            var r=data.reqs;if(!r)return;
            combined.prot.min=Math.max(combined.prot.min,r.prot.min);
            combined.prot.max=Math.min(combined.prot.max+0.3,r.prot.max);
            combined.grasas.min=Math.max(combined.grasas.min,r.grasas.min);
            combined.grasas.max=Math.min(combined.grasas.max,r.grasas.max);
            if(r.restrict)r.restrict.forEach(function(x){if(combined.restrict.indexOf(x)<0)combined.restrict.push(x)});
            if(r.increase)r.increase.forEach(function(x){if(combined.increase.indexOf(x)<0)combined.increase.push(x)});
            if(r.notes)combined.notes.push(r.notes);
            if(r.micros)Object.assign(combined.micros,r.micros);
          }
        });
      }
      // Also check legacy DEV_PATOLOGIAS
      var lp=DEV_PATOLOGIAS[k];
      if(lp){
        if(lp.protGkg)combined.prot.min=Math.max(combined.prot.min,lp.protGkg-0.2);
        if(lp.micros)Object.assign(combined.micros,lp.micros);
      }
    });
    s.combinedReqs=combined;
    s.patologia=s.selectedPaths.map(function(k){var lp=DEV_PATOLOGIAS[k];return lp?lp.name:k}).join(' + ');
    s.microVigilados=combined.micros;
    if(combined.prot.min>s.protGkg)s.protGkg=combined.prot.min;
  } else {
    s.patKey='';s.patologia='';s.combinedReqs=null;
  }
  s.medAlerts=[];
  rDesarrollada();
}

function devStep1Next(){
  var s=devState;
  if(!s.selectedPaths||!s.selectedPaths.length){toast('Seleccione al menos una patología','error');return}
  if($('devFormula'))s.formula=$('devFormula').value;
  if($('devFA'))s.fa=parseFloat($('devFA').value);
  devCalcGEB();s.step=2;rDesarrollada();
}

function devStep2Approve(){devAutoPlantilla(devState);devState.step=3;rDesarrollada();toast('Macros aprobados · Plantilla generada')}
function devSaveMinuta(){
  var s=devState;if(!s)return;
  var p=gP(selPat);if(!p)return;

  // Build a proper mealPlan from devState
  var dias=['Lunes','Martes','Miércoles','Jueves','Viernes'];
  var planDias=dias.map(function(diaName){
    return {
      dia:diaName,
      comidas:s.comidas.filter(function(c){return c.alimentos.length>0}).map(function(c){
        var cK=c.alimentos.reduce(function(t,a){return t+(a.food.k||0)},0);
        var cP=c.alimentos.reduce(function(t,a){return t+(a.food.p||0)},0);
        var cG=c.alimentos.reduce(function(t,a){return t+(a.food.gr||0)},0);
        var cH=c.alimentos.reduce(function(t,a){return t+(a.food.h||0)},0);
        return {
          tipo:c.nombre,
          items:c.alimentos.map(function(a){
            return {alimentoId:null,nombre:a.nombre||a.food.n,gramos:a.gramos||100};
          }),
          kcal:Math.round(cK),p:+cP.toFixed(1),g:+cG.toFixed(1),h:+cH.toFixed(1)
        };
      })
    };
  });

  var plan={
    id:(mealPlans.length?Math.max.apply(null,mealPlans.map(function(p){return p.id||0}))+1:1),
    pacienteId:selPat,
    nombre:'Fórmula Desarrollada — '+(s.patologia||'Plan nutricional'),
    estado:'activo',
    fechaCreacion:new Date().toISOString().slice(0,10),
    kcalObjetivo:s.get,
    protG:s.protG,
    grasasG:s.grasasG,
    hcG:s.hcG,
    fibraG:s.fibraG,
    aguaL:s.aguaL,
    formulaUsada:s.formula||'Mifflin-St Jeor',
    factorActividad:s.fa||1.55,
    patologia:s.patologia||'',
    dias:planDias
  };

  // Deactivate previous plans for this patient
  mealPlans.filter(function(mp){return mp.pacienteId===selPat}).forEach(function(mp){mp.estado='inactivo'});

  // Add the new plan
  mealPlans.push(plan);

  auditAction('CREATE','Fórmula Desarrollada → Plan',p.nombre+' '+p.apellidos+' · '+s.get+'kcal · '+s.patologia);
  toast('✅ Plan alimentario creado desde Desarrollada — visible en la ficha del paciente');
}
function $$(id){return document.getElementById(id)}

// BEDCA_GRP loaded from bedca-data.js
// BEDCA_DB loaded from bedca-data.js

// #30 Horarios de comida
// #31 Notas por comida
// These are added as fields to devState.comidas
// Already available via devState — just need UI in step 3

// #32 Sugerencia automática de alimentos por patología ESPEN
function devSuggestFoodsByPathology(){
  if(!devState||!devState.selectedPaths||!devState.selectedPaths.length){toast('Seleccione patologia primero','info');return}
  var suggestions={
    'dm2':['Verduras de hoja verde','Legumbres','Avena integral','Pescado azul','Frutos secos','Aceite de oliva'],
    'obesidad':['Verduras variadas','Proteinas magras (pollo, pavo)','Legumbres','Frutas enteras','Yogur natural','Huevos'],
    'renal':['Arroz','Clara de huevo','Pollo','Manzana','Pepino','Aceite de oliva'],
    'hepatica':['AACR (leucina, isoleucina, valina)','HC complejos nocturnos','Frutas','Verduras','Proteina vegetal','Aceite MCT'],
    'eii':['Platano maduro','Arroz blanco','Pollo hervido','Zanahoria cocida','Patata','Caldo de huesos'],
    'cancer':['Proteinas de alto valor biologico','Huevos','Pescado azul (omega-3)','Frutos secos','Aceite de oliva','Aguacate']
  };
  var found=[];
  devState.selectedPaths.forEach(function(k){
    var kLow=k.toLowerCase();
    Object.entries(suggestions).forEach(function(e){
      if(kLow.includes(e[0])||e[0].includes(kLow.substring(0,4))){
        e[1].forEach(function(f){if(found.indexOf(f)<0)found.push(f)});
      }
    });
  });
  if(!found.length) found=['Verduras variadas','Proteinas magras','Frutas enteras','Cereales integrales','Aceite de oliva','Legumbres'];
  toast('Alimentos sugeridos: '+found.slice(0,5).join(', '),'info');
}

// #33 Modo vegetariano/vegano filter
var devDietFilter='todos'; // todos|vegetariano|vegano

function devSetDietFilter(filter){
  devDietFilter=filter;
  toast('Filtro: '+filter);
  if(devFoodSearchResults.length) devRenderFoodResults(devFoodSearchResults);
}

// DE1: Save current desarrollada as reusable template
function devSaveAsTemplate(){
  if(!devState||devState.step<4){toast('Completa al menos hasta el paso 4','error');return}
  var nombre=prompt('Nombre de la plantilla:',devState.patologia||'Plantilla');
  if(!nombre)return;
  var template={
    id:'devt_'+Date.now(),
    nombre:nombre,
    patologia:devState.patologia||'',
    get:devState.get,geb:devState.geb,
    protGkg:devState.protGkg,grasasPct:devState.grasasPct,
    comidas:JSON.parse(JSON.stringify(devState.comidas)),
    createdAt:new Date().toISOString().slice(0,10)
  };
  if(!DB.devTemplates)DB.devTemplates=[];
  DB.devTemplates.push(template);
  saveData();toast('Plantilla "'+nombre+'" guardada','success');
}
function devLoadTemplate(id){
  if(!DB.devTemplates)return;
  var tpl=DB.devTemplates.find(function(t){return t.id===id});if(!tpl)return;
  if(!confirm('¿Cargar plantilla "'+tpl.nombre+'"? Se reemplazará el desarrollo actual.'))return;
  devState.get=tpl.get;devState.geb=tpl.geb;
  devState.protGkg=tpl.protGkg;devState.grasasPct=tpl.grasasPct;
  devState.patologia=tpl.patologia;
  devState.comidas=JSON.parse(JSON.stringify(tpl.comidas));
  devState.step=4;
  rDesarrollada();toast('Plantilla cargada','success');
}

// DE2: Preview minuta before saving
function devPreviewMinuta(){
  if(!devState||devState.step<4){toast('Completa al menos hasta paso 4','error');return}
  var p=gP(devState.patId)||{nombre:'Paciente',apellidos:''};
  var h='<div class="modal-header"><h3>📄 Preview — '+p.nombre+' '+p.apellidos+'</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body" style="max-height:70vh;overflow-y:auto"><div style="font-size:.82rem">'
  +'<div class="dev-grid-3" style="gap:8px;margin-bottom:16px">'
  +'<div class="card" style="text-align:center;padding:12px"><div style="font-size:1.5rem;font-weight:800;color:var(--primary)">'+devState.get+'</div><div style="font-size:.72rem">kcal/día</div></div>'
  +'<div class="card" style="text-align:center;padding:12px"><div style="font-size:1.5rem;font-weight:800;color:var(--accent)">'+(devState.protGkg||1.2)+'</div><div style="font-size:.72rem">g prot/kg</div></div>'
  +'<div class="card" style="text-align:center;padding:12px"><div style="font-size:1.5rem;font-weight:800">'+(devState.grasasPct||30)+'%</div><div style="font-size:.72rem">grasas</div></div></div>';
  devState.comidas.forEach(function(com){
    h+='<div style="margin-bottom:12px"><strong style="color:var(--primary)">'+com.nombre+'</strong> ('+com.pct+'%)'
    +'<div style="margin-left:12px;font-size:.78rem">';
    com.alimentos.forEach(function(al){h+='<div style="padding:2px 0">· '+al.nombre+' — '+al.gramos+'g ('+Math.round(al.kcal)+' kcal)</div>'});
    h+='</div></div>';
  });
  h+='</div></div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Volver</button><button class="btn btn-primary" onclick="closeModal();devSaveMinuta()">💾 Guardar definitivo</button></div>';
  openModal(h,true);
}

// DE3: Suggest equivalent food substitution
function devSuggestSubstitute(comidaIdx,alimentoIdx){
  if(!devState)return;
  var al=devState.comidas[comidaIdx].alimentos[alimentoIdx];
  if(!al||typeof BEDCA_DB==='undefined')return;
  var original=BEDCA_DB.find(function(f){return f.n===al.nombre});
  if(!original){toast('Alimento no encontrado en BEDCA','error');return}
  // Find foods in same group with similar kcal
  var candidates=BEDCA_DB.filter(function(f){
    return f.gi===original.gi&&f.n!==original.n&&Math.abs(f.k-original.k)<original.k*0.3;
  }).slice(0,8);
  if(!candidates.length){toast('Sin sustitutos equivalentes encontrados','info');return}
  var h='<div class="modal-header"><h3>🔄 Sustitutos para: '+al.nombre+'</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body">'
  +'<table class="table" style="font-size:.82rem"><thead><tr><th>Alimento</th><th>Kcal/100g</th><th>Prot</th><th>HC</th><th>Grasa</th><th></th></tr></thead><tbody>'
  +candidates.map(function(f){return '<tr><td>'+f.n+'</td><td>'+Math.round(f.k)+'</td><td>'+(f.p||0).toFixed(1)+'</td><td>'+(f.h||0).toFixed(1)+'</td><td>'+(f.gr||0).toFixed(1)+'</td>'
  +'<td><button class="btn btn-primary btn-xs" onclick="devDoSubstitute('+comidaIdx+','+alimentoIdx+',\''+f.n.replace(/'/g,"\\'")+'\',' +Math.round(f.k)+');closeModal()">Usar</button></td></tr>'}).join('')
  +'</tbody></table></div>';
  openModal(h);
}
function devDoSubstitute(ci,ai,nombre,kcalPer100){
  var al=devState.comidas[ci].alimentos[ai];
  al.nombre=nombre;al.kcal=kcalPer100*al.gramos/100;
  devRenderPanel();devRenderStep();
  toast('Sustituido por '+nombre,'success');
}

// ═══ 4.5 EQUIVALENCIAS DE ALIMENTOS ═══
var FOOD_EQUIVALENCIAS={
  'Frutas':{porcion:'150g',equiv:[
    {nombre:'1 manzana mediana',g:150},{nombre:'1 naranja grande',g:200},
    {nombre:'1 plátano mediano',g:120},{nombre:'2 kiwis',g:150},
    {nombre:'1 taza fresas',g:150},{nombre:'1 tajada sandía',g:200},
    {nombre:'1 pera mediana',g:160},{nombre:'½ taza arándanos',g:75},
    {nombre:'1 melocotón',g:150},{nombre:'10 uvas',g:80}
  ]},
  'Cereales/HC':{porcion:'30g HC',equiv:[
    {nombre:'1 rebanada pan integral',g:40},{nombre:'3 cda arroz cocido',g:60},
    {nombre:'½ taza pasta cocida',g:70},{nombre:'3 galletas integrales',g:30},
    {nombre:'½ taza avena cocida',g:80},{nombre:'1 tortilla de maíz',g:30},
    {nombre:'2 tostadas',g:30},{nombre:'½ taza quinoa cocida',g:80},
    {nombre:'1 papa pequeña',g:80},{nombre:'½ taza legumbres cocidas',g:80}
  ]},
  'Proteínas':{porcion:'100g',equiv:[
    {nombre:'1 filete pechuga pollo',g:120},{nombre:'1 filete merluza',g:130},
    {nombre:'2 huevos',g:100},{nombre:'1 lata atún',g:80},
    {nombre:'100g tofu firme',g:100},{nombre:'½ taza legumbres secas',g:60},
    {nombre:'1 filete ternera',g:120},{nombre:'100g salmón',g:100},
    {nombre:'3 claras',g:100},{nombre:'80g jamón serrano',g:80}
  ]},
  'Grasas':{porcion:'10g',equiv:[
    {nombre:'1 cda AOVE',g:10},{nombre:'6 almendras',g:10},
    {nombre:'3 nueces',g:10},{nombre:'¼ aguacate',g:30},
    {nombre:'1 cda mantequilla',g:10},{nombre:'1 cda semillas lino',g:10},
    {nombre:'1 cda semillas chía',g:10},{nombre:'1 cda tahini',g:10}
  ]},
  'Lácteos':{porcion:'200ml / 1 ración',equiv:[
    {nombre:'1 vaso leche',g:200},{nombre:'2 yogures naturales',g:250},
    {nombre:'1 yogur griego',g:150},{nombre:'30g queso curado',g:30},
    {nombre:'60g queso fresco',g:60},{nombre:'1 vaso kéfir',g:200},
    {nombre:'200ml bebida soja',g:200},{nombre:'1 vaso leche sin lactosa',g:200}
  ]},
  'Verduras':{porcion:'200g',equiv:[
    {nombre:'1 plato ensalada mixta',g:200},{nombre:'1 taza brócoli cocido',g:150},
    {nombre:'2 tomates medianos',g:200},{nombre:'1 taza espinacas crudas',g:50},
    {nombre:'1 zanahoria grande',g:100},{nombre:'½ calabacín',g:150},
    {nombre:'1 taza judías verdes',g:150},{nombre:'1 taza coliflor',g:150}
  ]}
};

function showEquivalencias(){
  var html='<div class="modal-header"><h3>📐 Equivalencias de Alimentos</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body" style="max-height:70vh;overflow-y:auto">'
  +'<p style="font-size:.82rem;color:var(--text3);margin-bottom:14px">Tabla de intercambios: alimentos con valor nutricional similar que pueden sustituirse entre sí.</p>';

  Object.keys(FOOD_EQUIVALENCIAS).forEach(function(grupo){
    var eq=FOOD_EQUIVALENCIAS[grupo];
    html+='<div class="card" style="margin-bottom:12px;border-left:4px solid var(--primary)">'
    +'<div class="card-header"><span class="card-title" style="font-size:.85rem">'+grupo+'</span>'
    +'<span class="badge" style="background:var(--primary-light);color:var(--primary);font-size:.65rem">1 porción ≈ '+eq.porcion+'</span></div>'
    +'<div class="card-body" style="padding:8px 14px">'
    +'<div class="dev-grid-auto" style="gap:6px">'
    +eq.equiv.map(function(e){
      return '<div style="padding:6px 10px;background:var(--surface2);border-radius:8px;font-size:.78rem;display:flex;justify-content:space-between;align-items:center">'
      +'<span>'+e.nombre+'</span><span style="font-size:.68rem;color:var(--text3);font-weight:600">'+e.g+'g</span></div>';
    }).join('')
    +'</div></div></div>';
  });

  html+='</div>';
  openModal(html,true);
}

// ═══ 4.6 DRAG & DROP DE ALIMENTOS ENTRE COMIDAS ═══
function devDragStart(event,comidaIdx,alimentoIdx){
  event.dataTransfer.setData('text/plain',comidaIdx+','+alimentoIdx);
  event.dataTransfer.effectAllowed='move';
  setTimeout(function(){event.target.style.opacity='0.4'},0);
}

function devDragEnd(event){
  event.target.style.opacity='1';
}

function devDropOnMeal(event,targetComidaIdx){
  event.preventDefault();
  event.currentTarget.style.background='';
  var data=event.dataTransfer.getData('text/plain').split(',');
  var srcComida=parseInt(data[0]);
  var srcAlimento=parseInt(data[1]);
  if(isNaN(srcComida)||isNaN(srcAlimento))return;
  if(srcComida===targetComidaIdx)return; // Same meal, no move

  var s=devState;
  if(!s||!s.comidas[srcComida]||!s.comidas[targetComidaIdx])return;
  var item=s.comidas[srcComida].alimentos.splice(srcAlimento,1)[0];
  if(!item)return;
  s.comidas[targetComidaIdx].alimentos.push(item);
  toast('Alimento movido a '+s.comidas[targetComidaIdx].nombre);
  devRenderPanel();devRenderStep();
}
