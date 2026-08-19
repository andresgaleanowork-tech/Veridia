// ===== RESTAURACIÓN COLECTIVA — Nutrición Institucional =====
// Gestión de servicios de alimentación masivos: colegios, hospitales, geriátricos, universidades, empresas
// APPCC · IDDSI · Trazabilidad · Costeo · Mermas · Auditoría Nutricional

// ── Data Structures ──
if(!DB.rcCentros) DB.rcCentros=[];
if(!DB.rcMenus) DB.rcMenus=[];
if(!DB.rcProveedores) DB.rcProveedores=[];
if(!DB.rcLotes) DB.rcLotes=[];
if(!DB.rcMermas) DB.rcMermas=[];
if(!DB.rcAppcc) DB.rcAppcc=[];
if(!DB.rcNextCentroId) DB.rcNextCentroId=1;
if(!DB.rcNextMenuId) DB.rcNextMenuId=1;
(function(){try{var s=JSON.parse(localStorage.getItem('veridia_db'));if(s){
  if(s.rcCentros)DB.rcCentros=s.rcCentros;if(s.rcMenus)DB.rcMenus=s.rcMenus;
  if(s.rcProveedores)DB.rcProveedores=s.rcProveedores;if(s.rcLotes)DB.rcLotes=s.rcLotes;
  if(s.rcMermas)DB.rcMermas=s.rcMermas;if(s.rcAppcc)DB.rcAppcc=s.rcAppcc;
  if(s.rcNextCentroId)DB.rcNextCentroId=s.rcNextCentroId;if(s.rcNextMenuId)DB.rcNextMenuId=s.rcNextMenuId;
}}catch(e){console.warn('[Veridia]',e.message||e)}})();

// ── Constants ──
var RC_INST_TYPES=[
  {id:'colegio',label:'Colegio',icon:'🏫',edadGrupo:'4-12',derivaciones:['sin_gluten','sin_lactosa','sin_huevo','sin_frutos_secos','sin_cerdo','vegetariano']},
  {id:'hospital',label:'Hospital',icon:'🏥',edadGrupo:'adulto',derivaciones:['disfagia','hiposodica','diabetico','renal','hepatica','sin_gluten','sin_lactosa','vegetariano']},
  {id:'geriatrico',label:'Residencia Geriátrica',icon:'🏠',edadGrupo:'65+',derivaciones:['disfagia','facil_masticacion','hiposodica','diabetico','hiperproteica','sin_gluten','sin_lactosa']},
  {id:'universidad',label:'Universidad',icon:'🎓',edadGrupo:'18-30',derivaciones:['sin_gluten','sin_lactosa','sin_huevo','sin_frutos_secos','vegetariano','vegano','halal']},
  {id:'empresa',label:'Empresa/Comedor',icon:'🏢',edadGrupo:'adulto',derivaciones:['sin_gluten','sin_lactosa','vegetariano','vegano','halal','sin_cerdo']}
];

// 14 alérgenos UE (Reglamento 1169/2011)
var ALERGENOS_14=[
  {id:1,code:'GLU',name:'Gluten',icon:'🌾',desc:'Cereales con gluten (trigo, centeno, cebada, avena, espelta, kamut)'},
  {id:2,code:'CRU',name:'Crustáceos',icon:'🦐',desc:'Crustáceos y productos a base de crustáceos'},
  {id:3,code:'HUE',name:'Huevos',icon:'🥚',desc:'Huevos y productos a base de huevo'},
  {id:4,code:'PES',name:'Pescado',icon:'🐟',desc:'Pescado y productos a base de pescado'},
  {id:5,code:'CAC',name:'Cacahuetes',icon:'🥜',desc:'Cacahuetes y productos a base de cacahuetes'},
  {id:6,code:'SOJ',name:'Soja',icon:'🫘',desc:'Soja y productos a base de soja'},
  {id:7,code:'LAC',name:'Lácteos',icon:'🥛',desc:'Leche y derivados (incluida lactosa)'},
  {id:8,code:'FRU',name:'Frutos de cáscara',icon:'🌰',desc:'Almendras, avellanas, nueces, anacardos, pacanas, nueces de Brasil, pistachos, macadamias'},
  {id:9,code:'API',name:'Apio',icon:'🥬',desc:'Apio y productos derivados'},
  {id:10,code:'MOS',name:'Mostaza',icon:'🟡',desc:'Mostaza y productos derivados'},
  {id:11,code:'SES',name:'Sésamo',icon:'⚪',desc:'Granos de sésamo y productos a base de sésamo'},
  {id:12,code:'SO2',name:'Sulfitos',icon:'🟣',desc:'Dióxido de azufre y sulfitos (>10mg/kg o 10mg/L)'},
  {id:13,code:'ALT',name:'Altramuces',icon:'🟤',desc:'Altramuces y productos a base de altramuces'},
  {id:14,code:'MOL',name:'Moluscos',icon:'🐚',desc:'Moluscos y productos a base de moluscos'}
];

// IDDSI Framework (International Dysphagia Diet Standardisation Initiative)
var IDDSI_LEVELS=[
  {level:0,name:'Líquido fino',color:'#FFFFFF',desc:'Fluye como agua. Sin espesante.',test:'Prueba de jeringa: fluye libremente en 10s'},
  {level:1,name:'Ligeramente espeso',color:'#D4D4D4',desc:'Más espeso que agua, fluye por jeringa.',test:'Prueba de jeringa: 1-4 mL restantes en 10s'},
  {level:2,name:'Poco espeso',color:'#FFB6C1',desc:'Fluye lentamente de cuchara.',test:'Prueba de jeringa: 4-8 mL restantes en 10s'},
  {level:3,name:'Moderadamente espeso / Liquidado',color:'#FFA500',desc:'Se puede beber de taza, mantiene forma en cuchara.',test:'Prueba de jeringa: >8 mL restantes. Prueba de tenedor: gotea lentamente'},
  {level:4,name:'Puré / Extremadamente espeso',color:'#FF4500',desc:'No se puede beber. Cae del tenedor formando montículo.',test:'Prueba de tenedor: no gotea. Prueba de cuchara: mantiene forma'},
  {level:5,name:'Picado y húmedo',color:'#228B22',desc:'Trozos ≤4mm. Se puede comer con tenedor o cuchara.',test:'Prueba de presión del tenedor: se aplasta fácilmente. Trozos ≤4mm×4mm'},
  {level:6,name:'Suave y del tamaño de un bocado',color:'#1E90FF',desc:'Trozos ≤15mm. Suave, tierno, húmedo.',test:'Prueba de presión del tenedor: se aplasta. Trozos ≤15mm×15mm'},
  {level:7,name:'Normal / Fácil de masticar',color:'#000000',desc:'Texturas normales. Sin restricciones.',test:'Sin pruebas requeridas (textura estándar)'}
];

// Factores de corrección por merma (peso bruto → peso neto)
var FACTORES_MERMA={
  'Ternera (sin hueso)':1.05,'Ternera (con hueso)':1.35,'Cerdo (sin hueso)':1.08,'Cerdo (con hueso)':1.30,
  'Pollo entero':1.40,'Pollo (pechuga)':1.10,'Pollo (muslo)':1.25,'Pescado entero':1.50,
  'Pescado (filete)':1.05,'Merluza entera':1.55,'Salmón filete':1.08,'Gambas':1.45,
  'Patata':1.20,'Zanahoria':1.15,'Cebolla':1.12,'Tomate':1.05,'Lechuga':1.30,
  'Pimiento':1.25,'Judías verdes':1.10,'Espinacas':1.35,'Brócoli':1.40,
  'Coliflor':1.45,'Calabacín':1.10,'Berenjena':1.08,'Acelgas':1.40,
  'Naranja':1.35,'Manzana':1.10,'Plátano':1.35,'Melón':1.40,'Sandía':1.45,
  'Kiwi':1.15,'Piña':1.50,'Pera':1.10,'Melocotón':1.15,'Fresa':1.08,
  'Arroz':1.00,'Pasta':1.00,'Lentejas':1.00,'Garbanzos':1.00,'Harina':1.00,
  'Pan':1.00,'Aceite':1.00,'Leche':1.00,'Huevo':1.12,'Queso':1.00
};

// Límites nutricionales por grupo de edad (por menú completo)
var LIMITES_NUTRICIONALES={
  '4-12':{kcalMin:550,kcalMax:750,grasaSatMax:8,azucarMax:15,sodioMax:600,protMin:15,fibraMin:5},
  '13-17':{kcalMin:700,kcalMax:950,grasaSatMax:10,azucarMax:20,sodioMax:800,protMin:20,fibraMin:7},
  '18-30':{kcalMin:650,kcalMax:900,grasaSatMax:10,azucarMax:20,sodioMax:900,protMin:18,fibraMin:8},
  'adulto':{kcalMin:600,kcalMax:850,grasaSatMax:10,azucarMax:18,sodioMax:900,protMin:18,fibraMin:8},
  '65+':{kcalMin:500,kcalMax:750,grasaSatMax:8,azucarMax:15,sodioMax:600,protMin:20,fibraMin:6}
};

// Score de carga de trabajo por tipo de elaboración
var CARGA_TRABAJO={
  'Crudo/Ensalada':1,'Hervido':1,'Plancha':2,'Horno':2,'Guiso':3,'Salteado':2,
  'Fritura':3,'Empanado':4,'Relleno':4,'Elaboración compleja':5,'Repostería':4,'Puré':2
};

// Derivaciones terapéuticas
var DERIVACIONES={
  disfagia:{label:'Disfagia',iddsiDefault:4,desc:'Textura modificada según nivel IDDSI',icon:'🫗'},
  facil_masticacion:{label:'Fácil masticación',iddsiDefault:6,desc:'Suave y del tamaño de un bocado',icon:'🦷'},
  hiposodica:{label:'Hiposódica estricta',desc:'Sodio <1500mg/día, sin sal añadida',icon:'🧂',maxSodio:500},
  diabetico:{label:'Diabético',desc:'Control glucémico, sin azúcar simple, IG bajo',icon:'💉',maxAzucar:8},
  hiperproteica:{label:'Hiperprotéica',desc:'≥30g proteína/comida',icon:'💪',minProteina:30},
  renal:{label:'Renal',desc:'Control K/P/Na, proteína ajustada',icon:'🫘'},
  hepatica:{label:'Hepática',desc:'Proteína vegetal prioritaria, restricción grasa',icon:'🫁'},
  sin_gluten:{label:'Sin gluten',alergeno:'GLU',icon:'🌾'},
  sin_lactosa:{label:'Sin lactosa',alergeno:'LAC',icon:'🥛'},
  sin_huevo:{label:'Sin huevo',alergeno:'HUE',icon:'🥚'},
  sin_frutos_secos:{label:'Sin frutos secos',alergeno:'FRU',icon:'🌰'},
  sin_cerdo:{label:'Sin cerdo',desc:'Adaptación cultural',icon:'🐷'},
  vegetariano:{label:'Vegetariano',desc:'Sin carne ni pescado',icon:'🥬'},
  vegano:{label:'Vegano',desc:'Sin productos animales',icon:'🌱'},
  halal:{label:'Halal',desc:'Conforme a normativa halal',icon:'☪️'}
};

var TURNOS_COMIDA=['Desayuno','Media mañana','Comida','Merienda','Cena','Recena'];
var RC_MENU_ESTADOS=[{id:'borrador',label:'Borrador',color:'#94a3b8'},{id:'publicado',label:'Publicado',color:'#16a34a'},{id:'archivado',label:'Archivado',color:'#6b7280'}];
var RC_DIAS_SEMANA=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

// ── Tab state ──
var rcTab='resumen';
var rcSelCentro=null;
var rcSelMenu=null;

// ══════════════════════════════════════════════════════
//  RENDER PRINCIPAL
// ══════════════════════════════════════════════════════
function rRestauracion(){
  var tabs=[
    {id:'resumen',ic:'📊',l:t('rc_resumen')||'Resumen'},
    {id:'centros',ic:'🏛️',l:t('rc_centros')||'Centros'},
    {id:'menus',ic:'📋',l:t('rc_menus')||'Menús'},
    {id:'escalado',ic:'📐',l:t('rc_escalado')||'Escalado'},
    {id:'costeo',ic:'💰',l:t('rc_costeo')||'Costeo'},
    {id:'auditoria',ic:'✅',l:t('rc_auditoria')||'Auditoría'},
    {id:'appcc',ic:'🛡️',l:t('rc_appcc')||'APPCC'},
    {id:'trazabilidad',ic:'📤',l:t('rc_trazabilidad')||'Trazabilidad'},
    {id:'mermas',ic:'📉',l:t('rc_mermas')||'Mermas'}
  ];
  $('mainContent').innerHTML='<div class="fade-in">'
  +'<div class="card" style="border:none;background:linear-gradient(135deg,#0E7490 0%,#0891B2 50%,#22D3EE 100%);color:#fff;margin-bottom:20px;border-radius:var(--radius);padding:22px 28px">'
  +'<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">'
  +'<span style="font-size:1.8rem">🏛️</span>'
  +'<div><h2 style="margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.3px">'+(t('rc_title')||'Restauración Colectiva')+'</h2>'
  +'<p style="margin:0;font-size:.75rem;opacity:.75">Nutrición institucional · Colegios · Hospitales · Geriátricos · Empresas</p></div>'
  +'<span class="badge" style="background:rgba(255,255,255,.2);color:#fff;font-size:.68rem;border:1px solid rgba(255,255,255,.3);margin-left:auto">INSTITUCIONAL</span>'
  +'</div></div>'
  +'<div class="pill-tabs" style="margin-bottom:20px">'+tabs.map(function(tb){
    return '<button class="pill-tab '+(rcTab===tb.id?'active':'')+'" onclick="rcTab=\''+tb.id+'\';rRestauracion()">'+tb.ic+' '+tb.l+'</button>';
  }).join('')+'</div>'
  +'<div id="rcContent"></div></div>';

  var c=$('rcContent');
  var tabMap={resumen:rcRenderResumen,centros:rcRenderCentros,menus:rcRenderMenus,escalado:rcRenderEscalado,costeo:rcRenderCosteo,auditoria:rcRenderAuditoria,appcc:rcRenderAppcc,trazabilidad:rcRenderTrazabilidad,mermas:rcRenderMermas};
  if(tabMap[rcTab]) tabMap[rcTab](c);
}

// ══════════════════════════════════════════════════════
//  TAB 0: RESUMEN / DASHBOARD
// ══════════════════════════════════════════════════════
function rcRenderResumen(c){
  var stats=rcGetMenuStats();
  var lotesProximos=rcLotesProximosACaducar();
  var mermaAlertas=rcAnalyzeMermas();
  var appccNoConf=(DB.rcAppcc||[]).filter(function(l){return l.resultado==='NO_CONFORME'}).length;
  var appccTotal=(DB.rcAppcc||[]).length;
  var lotesVencidos=(DB.rcLotes||[]).filter(function(l){return l.caducidad&&new Date(l.caducidad)<new Date()&&l.estado!=='recall'}).length;

  // ═══ KPI CARDS ═══
  var kpis=[
    {val:stats.centros,label:'Centros activos',icon:'🏛️',color:'var(--primary)'},
    {val:stats.comensalesTotales,label:'Comensales totales',icon:'👥',color:'var(--accent)'},
    {val:stats.menus,label:'Menús creados',icon:'📋',color:'var(--text)'},
    {val:stats.proveedores,label:'Proveedores',icon:'🏛️',color:'#7c3aed'},
    {val:appccTotal,label:'Registros APPCC'+(appccNoConf?' <span style="color:#dc2626">('+appccNoConf+' NC)</span>':''),icon:'🛡️',color:appccNoConf>0?'#dc2626':'#16a34a'},
    {val:stats.lotes,label:'Lotes trazados',icon:'📦',color:'#0891b2'}
  ];
  var h='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:20px">';
  kpis.forEach(function(k){
    h+='<div class="card" style="padding:20px;text-align:center;border-top:3px solid '+k.color+'">'
    +'<div style="font-size:1.3rem;margin-bottom:4px">'+k.icon+'</div>'
    +'<div style="font-size:2rem;font-weight:800;color:'+k.color+';line-height:1;font-variant-numeric:tabular-nums">'+k.val+'</div>'
    +'<div style="font-size:.72rem;color:var(--text-secondary);margin-top:4px;text-transform:uppercase;letter-spacing:.4px;font-weight:600">'+k.label+'</div></div>';
  });
  h+='</div>';

  // ═══ ALERTAS ACTIVAS ═══
  var alertas=[];
  if(lotesProximos.length) alertas.push({tipo:'warn',icon:'🌡️',msg:'<strong>'+lotesProximos.length+'</strong> lote(s) próximo(s) a caducar (≤7 días)'});
  if(mermaAlertas.length) alertas.push({tipo:'error',icon:'📉',msg:'<strong>'+mermaAlertas.length+'</strong> plato(s) con rechazo >25% en 3+ ciclos consecutivos'});
  if(appccNoConf>0) alertas.push({tipo:'error',icon:'🛡️',msg:'<strong>'+appccNoConf+'</strong> registro(s) APPCC No Conforme(s) pendientes'});
  if(lotesVencidos>0) alertas.push({tipo:'error',icon:'⚠️',msg:'<strong>'+lotesVencidos+'</strong> lote(s) con fecha de caducidad vencida'});

  if(alertas.length){
    h+='<div class="card" style="margin-bottom:20px;border-top:3px solid #dc2626">'
    +'<div class="card-header"><span class="card-title" style="font-size:.88rem;color:#dc2626">🚨 Alertas Activas</span>'
    +'<span class="badge" style="background:#fef2f2;color:#dc2626;font-size:.68rem">'+alertas.length+'</span></div>'
    +'<div class="card-body" style="padding:10px 18px">';
    alertas.forEach(function(a){
      var bg=a.tipo==='error'?'#fef2f2':'#fffbeb';
      var border=a.tipo==='error'?'#fecaca':'#fde68a';
      h+='<div style="padding:10px 14px;margin:5px 0;border-radius:8px;font-size:.84rem;background:'+bg+';border:1px solid '+border+';display:flex;align-items:center;gap:10px">'
      +'<span style="font-size:1.1rem;flex-shrink:0">'+a.icon+'</span><span>'+a.msg+'</span></div>';
    });
    h+='</div></div>';
  }

  // ═══ CENTROS + CICLOS (2 columns) ═══
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">';

  // Centros con derivaciones
  h+='<div class="card" style="border-top:3px solid var(--primary)">'
  +'<div class="card-header"><span class="card-title" style="font-size:.85rem">🏛️ Centros y Derivaciones</span></div>'
  +'<div class="card-body" style="padding:8px 18px">';
  if(DB.rcCentros.length){
    DB.rcCentros.forEach(function(ct){
      var tipo=RC_INST_TYPES.find(function(t){return t.id===ct.tipo})||{icon:'🏛️',label:ct.tipo};
      h+='<div style="padding:10px 0;border-bottom:1px solid var(--border)">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">'
      +'<div style="display:flex;align-items:center;gap:8px"><span style="font-size:1.2rem">'+tipo.icon+'</span>'
      +'<div><strong style="font-size:.84rem">'+sanitize(ct.nombre)+'</strong>'
      +'<div style="font-size:.7rem;color:var(--text-secondary)">'+ct.comensales+' comensales · '+tipo.label+'</div></div></div>'
      +'<div style="display:flex;gap:3px;flex-wrap:wrap">'+(ct.derivacionesActivas||[]).slice(0,6).map(function(d){
        var der=DERIVACIONES[d]||{icon:'🔹',label:d};
        return '<span title="'+der.label+'" style="font-size:.8rem;cursor:default">'+der.icon+'</span>';
      }).join(' ')+'</div></div></div>';
    });
  } else {
    h+='<div style="text-align:center;padding:20px;opacity:.5;font-size:.85rem">Sin centros registrados</div>';
  }
  h+='</div></div>';

  // Ciclos activos + menús por estado
  h+='<div>';
  // Current cycles
  if(typeof rcGetCurrentCycleMenu==='function'&&DB.rcCentros.length){
    var hasCycles=false;
    DB.rcCentros.forEach(function(ct){
      var cycle=rcGetCurrentCycleMenu(ct.id);
      if(cycle&&cycle.menu){
        if(!hasCycles){h+='<div class="card" style="margin-bottom:16px;border-top:3px solid var(--accent)">'
        +'<div class="card-header"><span class="card-title" style="font-size:.85rem">🔄 Ciclos Activos</span></div>'
        +'<div class="card-body" style="padding:10px 18px">';hasCycles=true;}
        h+='<div style="padding:8px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">'
        +'<div><strong style="font-size:.82rem">'+sanitize(ct.nombre)+'</strong>'
        +'<div style="font-size:.7rem;color:var(--text-secondary)">Semana '+cycle.semanaActual+'/'+cycle.ciclo.semanas+' → '+sanitize(cycle.menu.nombre)+'</div></div>'
        +'<span class="badge" style="background:var(--accent);color:#fff;font-size:.65rem">S'+cycle.semanaActual+'</span></div>';
      }
    });
    if(hasCycles) h+='</div></div>';
  }

  // Menús por estado
  if(DB.rcMenus.length){
    var porEstado={borrador:0,publicado:0,archivado:0};
    DB.rcMenus.forEach(function(m){porEstado[m.estado||'borrador']=(porEstado[m.estado||'borrador']||0)+1});
    h+='<div class="card" style="border-top:3px solid #6366f1">'
    +'<div class="card-header"><span class="card-title" style="font-size:.85rem">📋 Menús por Estado</span></div>'
    +'<div class="card-body" style="padding:14px 18px"><div style="display:flex;gap:16px;flex-wrap:wrap">';
    RC_MENU_ESTADOS.forEach(function(e){
      h+='<div style="display:flex;align-items:center;gap:8px">'
      +'<span style="width:10px;height:10px;border-radius:50%;background:'+e.color+';display:inline-block"></span>'
      +'<span style="font-size:.82rem">'+e.label+': <strong>'+(porEstado[e.id]||0)+'</strong></span></div>';
    });
    h+='</div></div></div>';
  }
  h+='</div>';
  h+='</div>';

  // Responsive
  h+='<style>@media(max-width:800px){#rcContent>div:nth-child(3){grid-template-columns:1fr !important}}</style>';

  c.innerHTML=h;
}

// ══════════════════════════════════════════════════════
//  TAB 1: CENTROS / INSTITUCIONES
// ══════════════════════════════════════════════════════
function rcRenderCentros(c){
  var centros=DB.rcCentros;
  var totalCom=centros.reduce(function(s,ct){return s+(ct.comensales||0)},0);

  var h='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px">'
  +'<div style="display:flex;align-items:center;gap:10px"><span style="font-size:.82rem;color:var(--text-secondary)"><strong style="color:var(--text);font-size:.92rem">'+centros.length+'</strong> centro(s)'
  +(totalCom>0?' · <strong style="color:var(--accent)">'+totalCom+'</strong> comensales':'')+'</span></div>'
  +'<button class="btn btn-primary" style="border-radius:10px;display:flex;align-items:center;gap:6px" onclick="rcOpenNewCentro()"><span style="font-size:1.1rem">＋</span> Nuevo Centro</button></div>';

  if(!centros.length){
    h+='<div class="card" style="text-align:center;padding:50px">'
    +'<div style="font-size:3.5rem;margin-bottom:14px;opacity:.3">🏛️</div>'
    +'<p style="color:var(--text-secondary);font-size:.92rem;margin:0;font-weight:600">No hay centros registrados</p>'
    +'<p style="color:var(--text3);font-size:.78rem;margin:6px 0 0">Crea tu primer centro institucional para comenzar.</p></div>';
  } else {
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">';
    centros.forEach(function(ct){
      var tipo=RC_INST_TYPES.find(function(t){return t.id===ct.tipo})||{icon:'🏛️',label:ct.tipo};
      var numMenus=DB.rcMenus.filter(function(m){return m.centroId===ct.id}).length;
      h+='<div class="card" style="cursor:pointer;border-top:3px solid var(--primary)" onclick="rcViewCentro('+parseInt(ct.id)+')">'
      +'<div class="card-body" style="padding:20px">'
      // Header row
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">'
      +'<div style="width:48px;height:48px;border-radius:12px;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:1.5rem">'+tipo.icon+'</div>'
      +'<span class="badge" style="background:var(--primary-light);color:var(--primary);font-size:.68rem;font-weight:600">'+tipo.label+'</span></div>'
      // Name + address
      +'<h3 style="margin:0 0 4px;font-size:.95rem;font-weight:700">'+sanitize(ct.nombre)+'</h3>'
      +'<div style="color:var(--text-secondary);font-size:.78rem;margin-bottom:14px;min-height:18px">'+sanitize(ct.direccion||'Sin dirección')+'</div>'
      // Stats grid
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
      +'<div style="background:var(--surface2);border-radius:8px;padding:8px 10px;text-align:center"><div style="font-size:1.1rem;font-weight:800;color:var(--primary)">'+ct.comensales+'</div><div style="font-size:.62rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600">Comensales</div></div>'
      +'<div style="background:var(--surface2);border-radius:8px;padding:8px 10px;text-align:center"><div style="font-size:1.1rem;font-weight:800;color:var(--accent)">'+(ct.turnos||[]).length+'</div><div style="font-size:.62rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600">Turnos</div></div>'
      +'<div style="background:var(--surface2);border-radius:8px;padding:8px 10px;text-align:center"><div style="font-size:1.1rem;font-weight:800">'+(ct.derivacionesActivas||[]).length+'</div><div style="font-size:.62rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600">Derivaciones</div></div>'
      +'<div style="background:var(--surface2);border-radius:8px;padding:8px 10px;text-align:center"><div style="font-size:1.1rem;font-weight:800">'+numMenus+'</div><div style="font-size:.62rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600">Menús</div></div>'
      +'</div>'
      // Derivaciones icons
      +((ct.derivacionesActivas||[]).length?'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:12px;padding-top:10px;border-top:1px solid var(--border)">'
      +(ct.derivacionesActivas||[]).map(function(d){var der=DERIVACIONES[d]||{icon:'🔹',label:d};return '<span title="'+der.label+'" style="font-size:.75rem;padding:2px 6px;background:var(--surface2);border-radius:6px;cursor:default">'+der.icon+' <span style="font-size:.6rem;color:var(--text-secondary)">'+der.label+'</span></span>'}).join('')
      +'</div>':'')
      +'</div></div>';
    });
    h+='</div>';
  }
  c.innerHTML=h;
}

function rcOpenNewCentro(editCt){
  var isEdit=!!editCt;
  var tipoOpts=RC_INST_TYPES.map(function(t){return '<option value="'+t.id+'" '+(isEdit&&editCt.tipo===t.id?'selected':'')+'>'+t.icon+' '+t.label+'</option>'}).join('');
  var turnoChecks=TURNOS_COMIDA.map(function(t,i){
    var checked=isEdit?(editCt.turnos||[]).includes(t):(i===2||i===4);
    return '<label style="display:flex;align-items:center;gap:6px;font-size:.84rem;padding:4px 10px;background:var(--surface2);border-radius:8px;cursor:pointer"><input type="checkbox" id="rcT_'+i+'" '+(checked?'checked':'')+'> '+t+'</label>';
  }).join('');

  openModal((isEdit?'✏️ Editar':'🏛️ Nuevo')+' Centro Institucional','<div style="display:grid;gap:14px">'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Nombre del centro *</label><input id="rcNombre" class="form-control" placeholder="Ej: Residencia Santa María" value="'+sanitize(isEdit?editCt.nombre:'')+'"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Tipo de institución *</label><select id="rcTipo" class="form-control" onchange="rcTipoChanged('+(isEdit?'true':'false')+')">'+tipoOpts+'</select></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Dirección</label><input id="rcDir" class="form-control" placeholder="Dirección completa" value="'+sanitize(isEdit?editCt.direccion||'':'')+'"></div>'
  +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Contacto</label><input id="rcContacto" class="form-control" placeholder="Nombre responsable" value="'+sanitize(isEdit?editCt.contacto||'':'')+'"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Teléfono</label><input id="rcTel" class="form-control" placeholder="+34..." value="'+sanitize(isEdit?editCt.telefono||'':'')+'"></div></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">N° comensales habituales *</label><input id="rcCom" type="number" class="form-control" value="'+(isEdit?editCt.comensales:100)+'" min="1" style="font-size:1.05rem;font-weight:700;text-align:center"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Comensales por derivación (opcional)</label>'
  +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px" id="rcComDeriv"></div></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Turnos activos</label><div style="display:flex;flex-wrap:wrap;gap:8px" id="rcTurnos">'+turnoChecks+'</div></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Derivaciones obligatorias</label><div id="rcDerivs" style="display:flex;flex-wrap:wrap;gap:8px"></div></div>'
  +'</div>','<button class="btn btn-primary" style="padding:10px 28px" onclick="rcSaveCentro('+(isEdit?editCt.id:'null')+')">'+IC.chk+(isEdit?' Actualizar':' Guardar Centro')+'</button>');
  rcTipoChanged(isEdit);
  if(isEdit){
    setTimeout(function(){
      document.querySelectorAll('input[name="rcDeriv"]').forEach(function(cb){
        cb.checked=(editCt.derivacionesActivas||[]).includes(cb.value);
      });
      rcBuildComDerivFields(editCt);
    },30);
  }
}

function rcTipoChanged(preserveChecks){
  var tipo=$('rcTipo').value;
  var inst=RC_INST_TYPES.find(function(t){return t.id===tipo});
  var dv=$('rcDerivs');if(!dv)return;
  dv.innerHTML=(inst?inst.derivaciones:[]).map(function(d){
    var der=DERIVACIONES[d]||{label:d,icon:'🔹'};
    return '<label style="display:flex;align-items:center;gap:4px;font-size:.82rem;background:var(--surface2);padding:5px 12px;border-radius:8px;cursor:pointer">'
    +'<input type="checkbox" name="rcDeriv" value="'+d+'" '+(preserveChecks?'':'checked')+'> '+der.icon+' '+der.label+'</label>';
  }).join('');
  rcBuildComDerivFields(null);
}

function rcBuildComDerivFields(editCt){
  var container=$('rcComDeriv');if(!container)return;
  var derivs=[];document.querySelectorAll('input[name="rcDeriv"]:checked').forEach(function(cb){derivs.push(cb.value)});
  var comDeriv=editCt?editCt.comensalesPorDerivacion||{}:{};
  container.innerHTML=derivs.map(function(d){
    var der=DERIVACIONES[d]||{label:d,icon:'🔹'};
    return '<div style="display:flex;align-items:center;gap:4px;font-size:.8rem"><span>'+der.icon+'</span>'
    +'<input type="number" class="form-control" style="width:60px;padding:2px 6px;font-size:.8rem" id="rcCD_'+d+'" value="'+(comDeriv[d]||0)+'" min="0" placeholder="0">'
    +'<span>'+der.label+'</span></div>';
  }).join('');
}

function rcSaveCentro(editId){
  var nombre=$('rcNombre').value.trim();
  var tipo=$('rcTipo').value;
  var com=parseInt($('rcCom').value)||0;
  if(!nombre){toast('Nombre requerido','error');return}
  if(com<1){toast('Mínimo 1 comensal','error');return}

  var turnos=[];
  TURNOS_COMIDA.forEach(function(t,i){var cb=$('rcT_'+i);if(cb&&cb.checked)turnos.push(t)});
  if(!turnos.length){toast('Selecciona al menos un turno','error');return}

  var derivs=[];
  document.querySelectorAll('input[name="rcDeriv"]:checked').forEach(function(cb){derivs.push(cb.value)});

  var comDeriv={};
  derivs.forEach(function(d){var el=$('rcCD_'+d);if(el){var v=parseInt(el.value);if(v>0)comDeriv[d]=v}});

  if(editId){
    var ct=DB.rcCentros.find(function(c){return c.id===editId});
    if(ct){
      ct.nombre=sanitize(nombre);ct.tipo=tipo;ct.direccion=sanitize($('rcDir').value.trim());
      ct.contacto=sanitize($('rcContacto').value.trim());ct.telefono=sanitize($('rcTel').value.trim());
      ct.comensales=com;ct.turnos=turnos;ct.derivacionesActivas=derivs;ct.comensalesPorDerivacion=comDeriv;
      closeModal();saveData();toast('Centro actualizado','success');rRestauracion();return;
    }
  }
  DB.rcCentros.push({
    id:DB.rcNextCentroId++,nombre:sanitize(nombre),tipo:tipo,
    direccion:sanitize($('rcDir').value.trim()),contacto:sanitize($('rcContacto').value.trim()),
    telefono:sanitize($('rcTel').value.trim()),comensales:com,turnos:turnos,
    derivacionesActivas:derivs,comensalesPorDerivacion:comDeriv,
    createdAt:new Date().toISOString().slice(0,10),activo:true
  });
  closeModal();saveData();toast('Centro "'+sanitize(nombre)+'" creado','success');rRestauracion();
}

function rcViewCentro(id){
  var ct=DB.rcCentros.find(function(c){return c.id===id});if(!ct)return;
  var tipo=RC_INST_TYPES.find(function(t){return t.id===ct.tipo})||{icon:'🏛️',label:ct.tipo};
  var menus=DB.rcMenus.filter(function(m){return m.centroId===id});

  var derivsHtml=(ct.derivacionesActivas||[]).map(function(d){
    var der=DERIVACIONES[d]||{label:d,icon:'🔹'};
    var count=ct.comensalesPorDerivacion&&ct.comensalesPorDerivacion[d]?(' ('+ct.comensalesPorDerivacion[d]+')'):' ';
    return '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;background:var(--surface2);border-radius:8px;font-size:.78rem">'+der.icon+' '+der.label+count+'</span>';
  }).join(' ');

  openModal(tipo.icon+' '+sanitize(ct.nombre),'<div style="display:grid;gap:14px">'
  +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">'
  +'<div style="background:var(--surface2);border-radius:10px;padding:14px;text-align:center"><div style="font-size:.68rem;text-transform:uppercase;color:var(--text-secondary);font-weight:600;margin-bottom:4px">Tipo</div><div style="font-weight:700;font-size:.88rem">'+tipo.label+'</div></div>'
  +'<div style="background:var(--surface2);border-radius:10px;padding:14px;text-align:center"><div style="font-size:.68rem;text-transform:uppercase;color:var(--text-secondary);font-weight:600;margin-bottom:4px">Comensales</div><div style="font-weight:800;font-size:1.2rem;color:var(--primary)">'+ct.comensales+'</div></div>'
  +'<div style="background:var(--surface2);border-radius:10px;padding:14px;text-align:center"><div style="font-size:.68rem;text-transform:uppercase;color:var(--text-secondary);font-weight:600;margin-bottom:4px">Turnos</div><div style="font-weight:700;font-size:.82rem">'+(ct.turnos||[]).join(', ')+'</div></div></div>'
  +'<div style="font-size:.84rem"><strong style="color:var(--text-secondary);font-size:.72rem;text-transform:uppercase;letter-spacing:.4px">📍 Dirección</strong><br>'+(ct.direccion||'—')+'</div>'
  +'<div style="font-size:.84rem"><strong style="color:var(--text-secondary);font-size:.72rem;text-transform:uppercase;letter-spacing:.4px">👤 Contacto</strong><br>'+(ct.contacto||'—')+' · '+(ct.telefono||'—')+'</div>'
  +'<div><strong style="color:var(--text-secondary);font-size:.72rem;text-transform:uppercase;letter-spacing:.4px">🔀 Derivaciones activas</strong><br><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">'+derivsHtml+'</div></div>'
  +'<div style="font-size:.84rem"><strong style="color:var(--text-secondary);font-size:.72rem;text-transform:uppercase;letter-spacing:.4px">📋 Menús asociados</strong><br>'+menus.length+'</div></div>',
  '<button class="btn btn-outline" style="border-radius:8px" onclick="closeModal();rcOpenNewCentro(DB.rcCentros.find(function(c){return c.id==='+id+'}))">✏️ Editar</button>'
  +' <button class="btn" style="background:#dc2626;color:#fff;border-radius:8px" onclick="rcDeleteCentro('+id+')">🗑️ Eliminar</button>');
}

function rcDeleteCentro(id){
  if(!confirm('¿Eliminar este centro y todos sus menús asociados?'))return;
  DB.rcCentros=DB.rcCentros.filter(function(c){return c.id!==id});
  DB.rcMenus=DB.rcMenus.filter(function(m){return m.centroId!==id});
  closeModal();saveData();toast('Centro eliminado','success');rRestauracion();
}

// ══════════════════════════════════════════════════════
//  TAB 2: MENÚS BASALES + DERIVACIONES
// ══════════════════════════════════════════════════════
function rcRenderMenus(c){
  if(!DB.rcCentros.length){
    c.innerHTML='<div class="card" style="text-align:center;padding:40px"><p>⚠️ Primero debes crear un centro en la pestaña "Centros".</p></div>';return;
  }
  var centroOpts=DB.rcCentros.map(function(ct){return '<option value="'+ct.id+'" '+(rcSelCentro===ct.id?'selected':'')+'>'+sanitize(ct.nombre)+'</option>'}).join('');
  var centro=rcSelCentro?DB.rcCentros.find(function(ct){return ct.id===rcSelCentro}):DB.rcCentros[0];
  if(!rcSelCentro&&centro) rcSelCentro=centro.id;

  var menus=DB.rcMenus.filter(function(m){return m.centroId===rcSelCentro});

  var h='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">'
  +'<div style="display:flex;align-items:center;gap:10px"><label>Centro:</label><select class="form-control" style="width:auto" onchange="rcSelCentro=parseInt(this.value);rRestauracion()">'+centroOpts+'</select></div>'
  +'<button class="btn btn-outline" onclick="rcOpenCompareMenus()">⇔ Comparar</button><button class="btn btn-outline" onclick="rcCicloMenu()">🔄 Ciclo</button><button class="btn btn-primary" onclick="rcOpenNewMenu()">＋ Nuevo Menú</button></div>';

  if(!menus.length){
    h+='<div class="card" style="text-align:center;padding:40px;opacity:.6"><div style="font-size:3rem;margin-bottom:12px">📋</div><p>No hay menús para este centro. Crea tu primer menú semanal.</p></div>';
  } else {
    menus.forEach(function(menu){
      var audit=rcAuditMenu(menu,centro);
      var auditColor=audit.score>=80?'#16a34a':audit.score>=60?'#ca8a04':'#dc2626';
      var estadoInfo=RC_MENU_ESTADOS.find(function(e){return e.id===(menu.estado||'borrador')})||RC_MENU_ESTADOS[0];
      h+='<div class="card" style="margin-bottom:16px">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">'
      +'<div><h3 style="margin:0">'+sanitize(menu.nombre||'Menú #'+menu.id)+'</h3>'
      +'<div style="font-size:.8rem;color:var(--text-secondary)">Semana: '+fD(menu.fechaInicio)+' — '+fD(menu.fechaFin)+'</div></div>'
      +'<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">'
      +'<span class="badge" style="background:'+estadoInfo.color+';color:#fff">'+estadoInfo.label+'</span>'
      +'<span class="badge" style="background:'+auditColor+';color:#fff">Audit: '+audit.score+'%</span>'
      +'<select style="font-size:.7rem;padding:2px 6px;border-radius:4px;border:1px solid var(--border)" onchange="rcChangeMenuEstado('+menu.id+',this.value)">'
      +RC_MENU_ESTADOS.map(function(e){return '<option value="'+e.id+'" '+(e.id===(menu.estado||'borrador')?'selected':'')+'>'+e.label+'</option>'}).join('')+'</select>'
      +'<button class="btn btn-sm" title="Editar" onclick="rcEditMenu('+menu.id+')">✏️</button>'
      +'<button class="btn btn-sm" title="Duplicar" onclick="rcDuplicateMenu('+menu.id+')">📄</button>'
      +'<button class="btn btn-sm" title="Exportar PDF" onclick="rcExportMenuPDF('+menu.id+')">🖨️</button>'
      +'<button class="btn btn-sm" style="color:#dc2626" title="Eliminar" onclick="rcDeleteMenu('+menu.id+')">🗑️</button>'
      +'</div></div>';

      // Weekly grid
      h+='<div style="overflow-x:auto"><table class="table" style="font-size:.8rem;min-width:700px"><thead><tr><th>Turno</th>';
      var diasActivos=menu.dias||RC_DIAS_SEMANA.slice(0,5);
      diasActivos.forEach(function(d){h+='<th>'+d+'</th>'});
      h+='</tr></thead><tbody>';
      (centro.turnos||['Comida']).forEach(function(turno){
        h+='<tr><td><strong>'+turno+'</strong></td>';
        diasActivos.forEach(function(dia){
          var platos=(menu.platos||{})[dia+'_'+turno]||[];
          h+='<td style="vertical-align:top;min-width:110px">';
          if(platos.length){
            platos.forEach(function(p){
              var alergenoTags=(p.alergenos||[]).map(function(a){
                var al=ALERGENOS_14.find(function(x){return x.code===a});
                return al?'<span title="'+al.name+'" style="font-size:.6rem;background:#fecaca;padding:1px 3px;border-radius:3px">'+al.code+'</span>':'';
              }).join(' ');
              var cargaColor=p.carga>=4?'#dc2626':p.carga>=3?'#ca8a04':'#16a34a';
              var iddsiTag=p.iddsi!=null&&p.iddsi<7?' <span style="font-size:.55rem;background:'+IDDSI_LEVELS[p.iddsi].color+';color:#fff;padding:0 3px;border-radius:2px">I'+p.iddsi+'</span>':'';
              h+='<div style="padding:2px 0;border-bottom:1px dashed var(--border);cursor:pointer" onclick="rcFichaPlato('+JSON.stringify(p).replace(/"/g,'&quot;')+')">'
              +'<div style="font-size:.78rem">'+sanitize(p.nombre)+'</div>'
              +'<div style="display:flex;gap:3px;align-items:center;margin-top:1px;flex-wrap:wrap">'
              +'<span style="font-size:.55rem;color:'+cargaColor+'">⚡'+p.carga+'</span>'+iddsiTag+' '+alergenoTags+'</div></div>';
            });
          } else { h+='<span style="opacity:.2;font-size:.7rem">vacío</span>' }
          h+='</td>';
        });
        h+='</tr>';
      });
      h+='</tbody></table></div>';

      // Derivaciones generadas
      if(menu.derivaciones&&Object.keys(menu.derivaciones).length){
        h+='<details style="margin-top:12px"><summary style="cursor:pointer;font-weight:600">🔀 Derivaciones generadas ('
        +Object.keys(menu.derivaciones).length+')</summary><div style="margin-top:8px">';
        Object.keys(menu.derivaciones).forEach(function(dk){
          var dv=menu.derivaciones[dk];
          var der=DERIVACIONES[dk]||{label:dk,icon:'🔹'};
          h+='<div class="card" style="margin:8px 0;padding:10px"><strong>'+der.icon+' '+(dv.label||der.label)+'</strong>';
          // Show per-plato adaptations
          if(dv.adaptaciones&&Object.keys(dv.adaptaciones).length){
            h+='<div style="margin-top:6px">';
            Object.keys(dv.adaptaciones).forEach(function(key){
              dv.adaptaciones[key].forEach(function(a){
                h+='<div style="font-size:.8rem;padding:3px 0;border-bottom:1px dotted var(--border)"><span style="color:var(--text-secondary)">'+key.replace('_',' ')+':</span> '
                +sanitize(a.original)+' → <strong>'+sanitize(a.adaptado.nombre)+'</strong>'
                +'<br><span style="font-size:.72rem;color:var(--accent)">'+a.cambios.join(' · ')+'</span></div>';
              });
            });
            h+='</div>';
          } else {
            h+='<div style="font-size:.8rem;margin-top:4px;color:var(--text-secondary)">'+sanitize(dv.notas||'Derivación aplicable')+'</div>';
          }
          h+='</div>';
        });
        h+='</div></details>';
      }
      h+='</div>';
    });
  }
  c.innerHTML=h;
}

function rcChangeMenuEstado(id,estado){
  var menu=DB.rcMenus.find(function(m){return m.id===id});
  if(menu){menu.estado=estado;saveData();toast('Estado → '+estado,'success')}
}

function rcOpenNewMenu(editMenu){
  var centro=DB.rcCentros.find(function(ct){return ct.id===rcSelCentro});
  if(!centro){toast('Selecciona un centro','error');return}
  var isEdit=!!editMenu;
  var hoy=isEdit?editMenu.fechaInicio:new Date().toISOString().slice(0,10);
  var fin=isEdit?editMenu.fechaFin:new Date(Date.now()+6*86400000).toISOString().slice(0,10);
  var turnos=centro.turnos||['Comida'];

  // Day selector
  var diasCheck=RC_DIAS_SEMANA.map(function(d,i){
    var checked=isEdit?(editMenu.dias||[]).includes(d):(i<5);
    return '<label style="display:flex;align-items:center;gap:4px;font-size:.82rem"><input type="checkbox" class="rcDiaCheck" value="'+d+'" '+(checked?'checked':'')+'> '+d+'</label>';
  }).join(' ');

  var h='<div style="display:grid;gap:12px">'
  +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">'
  +'<div class="form-group"><label>Nombre</label><input id="rcMenuNombre" class="form-control" value="'+(isEdit?sanitize(editMenu.nombre):'Menú S'+(DB.rcMenus.filter(function(m){return m.centroId===rcSelCentro}).length+1))+'"></div>'
  +'<div class="form-group"><label>Fecha inicio</label><input id="rcMenuInicio" type="date" class="form-control" value="'+hoy+'"></div>'
  +'<div class="form-group"><label>Fecha fin</label><input id="rcMenuFin" type="date" class="form-control" value="'+fin+'"></div></div>'
  +'<div class="form-group"><label>Días activos</label><div style="display:flex;flex-wrap:wrap;gap:8px">'+diasCheck+'</div></div>'
  +'<div id="rcMenuGrid" style="overflow-x:auto"></div>'
  +'<div id="rcCargaTotal" style="padding:10px;border-radius:8px;background:var(--bg-secondary);font-size:.85rem"></div></div>';

  openModal((isEdit?'Editar':'Nuevo')+' Menú — '+sanitize(centro.nombre),h,
  '<button class="btn btn-primary" onclick="rcSaveMenu('+(isEdit?editMenu.id:'null')+')">'+IC.chk+(isEdit?' Actualizar':' Guardar')+'</button>',{wide:true});

  window._rcTempPlatos={};
  window._rcTurnos=turnos;

  // Load existing platos for edit
  if(isEdit){
    var dias=editMenu.dias||RC_DIAS_SEMANA.slice(0,5);
    dias.forEach(function(dia,di){
      turnos.forEach(function(turno,ti){
        var key=dia+'_'+turno;
        var platos=(editMenu.platos||{})[key]||[];
        if(platos.length) window._rcTempPlatos[ti+'_'+di]=JSON.parse(JSON.stringify(platos));
      });
    });
  }

  // Initial grid render + attach change listener
  rcRebuildMenuGrid();
  document.querySelectorAll('.rcDiaCheck').forEach(function(cb){
    cb.addEventListener('change',function(){rcRebuildMenuGrid()});
  });
}

function rcGetSelectedDias(){
  var dias=[];document.querySelectorAll('.rcDiaCheck:checked').forEach(function(cb){dias.push(cb.value)});return dias;
}

function rcRebuildMenuGrid(){
  var dias=rcGetSelectedDias();
  var turnos=window._rcTurnos||[];
  window._rcDias=dias;
  var grid='<table class="table" style="font-size:.8rem"><thead><tr><th style="min-width:80px">Turno</th>';
  dias.forEach(function(d){grid+='<th style="min-width:130px">'+d+'</th>'});
  grid+='</tr></thead><tbody>';
  turnos.forEach(function(turno,ti){
    grid+='<tr><td><strong>'+turno+'</strong></td>';
    dias.forEach(function(dia,di){
      grid+='<td style="vertical-align:top">'
      +'<div id="rcPlatos_'+ti+'_'+di+'" style="min-height:24px">'+rcRenderCellPlatos(ti,di)+'</div>'
      +'<button class="btn btn-sm" style="font-size:.65rem;padding:1px 6px;margin-top:3px" onclick="rcAddPlato('+ti+','+di+')">＋</button></td>';
    });
    grid+='</tr>';
  });
  grid+='</tbody></table>';
  var el=$('rcMenuGrid');if(el)el.innerHTML=grid;
  rcUpdateCargaDisplay();
}

function rcRenderCellPlatos(ti,di){
  var key=ti+'_'+di;
  var platos=window._rcTempPlatos[key]||[];
  return platos.map(function(p,idx){
    var tags=(p.alergenos||[]).map(function(a){return '<span style="font-size:.5rem;background:#fecaca;padding:0 2px;border-radius:2px">'+a+'</span>'}).join(' ');
    var iddsiTag=p.iddsi!=null&&p.iddsi<7?' <span style="font-size:.5rem;background:'+IDDSI_LEVELS[p.iddsi].color+';color:#fff;padding:0 2px;border-radius:2px">I'+p.iddsi+'</span>':'';
    return '<div style="font-size:.72rem;padding:1px 0;border-bottom:1px dashed var(--border)">'
    +sanitize(p.nombre)+' <span style="color:'+(p.carga>=4?'#dc2626':'#16a34a')+'">⚡'+p.carga+'</span>'+iddsiTag+' '
    +tags+' <span style="cursor:pointer;color:#dc2626" onclick="rcRemovePlato('+ti+','+di+','+idx+')">✕</span></div>';
  }).join('');
}

function rcAddPlato(ti,di){
  var key=ti+'_'+di;
  var formId='rcPlatoForm_'+ti+'_'+di;
  if($(formId)){$(formId).remove();return}

  var tipoOpts=Object.keys(CARGA_TRABAJO).map(function(k){return '<option value="'+k+'">'+k+' (⚡'+CARGA_TRABAJO[k]+')</option>'}).join('');
  var alergenoChecks=ALERGENOS_14.map(function(a){
    return '<label style="display:inline-flex;align-items:center;gap:2px;font-size:.7rem;margin:1px"><input type="checkbox" name="rcAlerg_'+key+'" value="'+a.code+'"> '+a.icon+'</label>';
  }).join('');
  var iddsiOpts=IDDSI_LEVELS.map(function(l){return '<option value="'+l.level+'" '+(l.level===7?'selected':'')+'>'+l.level+' — '+l.name+'</option>'}).join('');

  var container=$('rcPlatos_'+ti+'_'+di);
  var form=document.createElement('div');form.id=formId;
  form.style.cssText='background:var(--bg-secondary);padding:6px;border-radius:6px;margin-top:3px';
  form.innerHTML='<input id="rcPN_'+key+'" class="form-control" placeholder="Nombre del plato" style="font-size:.78rem;margin-bottom:3px">'
  +'<select id="rcPT_'+key+'" class="form-control" style="font-size:.72rem;margin-bottom:3px">'+tipoOpts+'</select>'
  +'<select id="rcPI_'+key+'" class="form-control" style="font-size:.72rem;margin-bottom:3px">'+iddsiOpts+'</select>'
  +'<div style="margin-bottom:3px;font-size:.65rem">'+alergenoChecks+'</div>'
  +'<div style="display:flex;gap:3px"><button class="btn btn-sm btn-primary" style="font-size:.65rem" onclick="rcConfirmPlato('+ti+','+di+')">✓</button>'
  +'<button class="btn btn-sm" style="font-size:.65rem" onclick="document.getElementById(\''+formId+'\').remove()">✕</button></div>';
  container.appendChild(form);
}

function rcConfirmPlato(ti,di){
  var key=ti+'_'+di;
  var nameEl=$('rcPN_'+key);if(!nameEl||!nameEl.value.trim()){toast('Nombre requerido','error');return}
  var tipo=$('rcPT_'+key).value;
  var iddsi=parseInt($('rcPI_'+key).value);
  var alergenos=[];
  document.querySelectorAll('input[name="rcAlerg_'+key+'"]:checked').forEach(function(cb){alergenos.push(cb.value)});

  if(!window._rcTempPlatos[key])window._rcTempPlatos[key]=[];
  window._rcTempPlatos[key].push({
    nombre:sanitize(nameEl.value.trim()),tipo:tipo,carga:CARGA_TRABAJO[tipo]||2,
    alergenos:alergenos,ingredientes:[],iddsi:iddsi
  });

  var container=$('rcPlatos_'+ti+'_'+di);
  container.innerHTML=rcRenderCellPlatos(ti,di);
  var formEl=$('rcPlatoForm_'+ti+'_'+di);if(formEl)formEl.remove();
  rcUpdateCargaDisplay();
}

function rcRemovePlato(ti,di,idx){
  var key=ti+'_'+di;
  if(window._rcTempPlatos[key])window._rcTempPlatos[key].splice(idx,1);
  var container=$('rcPlatos_'+ti+'_'+di);
  if(container) container.innerHTML=rcRenderCellPlatos(ti,di);
  rcUpdateCargaDisplay();
}

function rcUpdateCargaDisplay(){
  var el=$('rcCargaTotal');if(!el)return;
  var turnos=window._rcTurnos||[];
  var dias=window._rcDias||[];
  var alertas=[];
  var UMBRAL=12;

  dias.forEach(function(dia,di){
    turnos.forEach(function(turno,ti){
      var platos=window._rcTempPlatos[ti+'_'+di]||[];
      var sum=platos.reduce(function(s,p){return s+(p.carga||0)},0);
      if(sum>UMBRAL) alertas.push('⚠️ <strong>'+dia+' '+turno+'</strong>: Carga '+sum+'/'+UMBRAL+' — ¡SUPERA UMBRAL!');
    });
  });

  if(alertas.length){
    el.style.cssText='padding:10px;border-radius:8px;background:#fef2f2;border:1px solid #fecaca;font-size:.85rem';
    el.innerHTML='<strong style="color:#dc2626">⚠️ Alerta de Carga de Trabajo</strong><br>'+alertas.join('<br>')
    +'<br><span style="font-size:.75rem;color:#666">El menú no podrá publicarse hasta resolver las sobrecargas (umbral: '+UMBRAL+' pts/turno).</span>';
  } else {
    el.style.cssText='padding:10px;border-radius:8px;background:var(--bg-secondary);font-size:.85rem';
    el.innerHTML='✅ <strong>Carga de trabajo dentro del umbral</strong> (máx. '+UMBRAL+' pts/turno)';
  }
}

function rcSaveMenu(editId){
  var nombre=$('rcMenuNombre').value.trim()||'Menú';
  var inicio=$('rcMenuInicio').value;
  var fin=$('rcMenuFin').value;
  var centro=DB.rcCentros.find(function(ct){return ct.id===rcSelCentro});
  if(!centro){toast('Centro no encontrado','error');return}

  var turnos=window._rcTurnos||[];
  var dias=rcGetSelectedDias();
  if(!dias.length){toast('Selecciona al menos un día','error');return}
  var UMBRAL=12;
  var bloqueado=false;
  dias.forEach(function(dia,di){
    turnos.forEach(function(turno,ti){
      var platos=window._rcTempPlatos[ti+'_'+di]||[];
      var sum=platos.reduce(function(s,p){return s+(p.carga||0)},0);
      if(sum>UMBRAL)bloqueado=true;
    });
  });
  if(bloqueado){toast('No se puede guardar: carga supera '+UMBRAL+' pts en algún turno','error');return}

  var platosMap={};
  dias.forEach(function(dia,di){
    turnos.forEach(function(turno,ti){
      platosMap[dia+'_'+turno]=window._rcTempPlatos[ti+'_'+di]||[];
    });
  });

  var derivaciones=rcGenerarDerivaciones(platosMap,centro);

  if(editId){
    var existing=DB.rcMenus.find(function(m){return m.id===editId});
    if(existing){
      existing.nombre=sanitize(nombre);existing.fechaInicio=inicio;existing.fechaFin=fin;
      existing.dias=dias;existing.platos=platosMap;existing.derivaciones=derivaciones;
      closeModal();saveData();toast('Menú actualizado con '+Object.keys(derivaciones).length+' derivaciones','success');
      rRestauracion();return;
    }
  }

  DB.rcMenus.push({
    id:DB.rcNextMenuId++,centroId:rcSelCentro,nombre:sanitize(nombre),
    fechaInicio:inicio,fechaFin:fin,dias:dias,platos:platosMap,
    derivaciones:derivaciones,createdAt:new Date().toISOString().slice(0,10),estado:'borrador'
  });
  closeModal();saveData();
  toast('Menú creado con '+Object.keys(derivaciones).length+' derivaciones','success');
  rRestauracion();
}

// ── Generador automático de derivaciones ──
function rcGenerarDerivaciones(platosMap,centro){
  var derivaciones={};
  (centro.derivacionesActivas||[]).forEach(function(dk){
    var der=DERIVACIONES[dk];if(!der)return;
    var notas=[];var adaptaciones={};

    Object.keys(platosMap).forEach(function(key){
      platosMap[key].forEach(function(p){
        var adaptado=Object.assign({},p);
        var cambios=[];

        if(der.alergeno&&p.alergenos&&p.alergenos.includes(der.alergeno)){
          cambios.push('Sustituir por versión sin '+der.label);
          adaptado.nombre=p.nombre+' (sin '+der.label.replace('Sin ','').toLowerCase()+')';
        }
        if(dk==='disfagia'){
          var nivelIddsi=der.iddsiDefault||4;
          var iddsiInfo=IDDSI_LEVELS.find(function(l){return l.level===nivelIddsi});
          adaptado.iddsi=nivelIddsi;adaptado.nombre=p.nombre+' (IDDSI '+nivelIddsi+')';
          cambios.push('IDDSI '+nivelIddsi+': '+(iddsiInfo?iddsiInfo.name:''));
          cambios.push('Validar: '+(iddsiInfo?iddsiInfo.test:''));
        }
        if(dk==='facil_masticacion'){adaptado.iddsi=6;adaptado.nombre=p.nombre+' (fácil masticación)';cambios.push('Trozos ≤15mm, textura suave')}
        if(dk==='hiposodica'){cambios.push('Sin sal. Máx '+(der.maxSodio||500)+'mg Na');adaptado.nombre=p.nombre+' (hiposódica)'}
        if(dk==='diabetico'){cambios.push('Sin azúcar simple. IG bajo');adaptado.nombre=p.nombre+' (diabético)'}
        if(dk==='sin_cerdo'&&p.nombre.toLowerCase().match(/cerdo|jamón|bacon|chorizo|salchich|lomo|costilla/)){
          cambios.push('Sustituir cerdo por alternativa');adaptado.nombre=p.nombre.replace(/cerdo|jamón|bacon/gi,'alternativa');
        }
        if(dk==='vegetariano'&&p.nombre.toLowerCase().match(/pollo|ternera|cerdo|pescado|merluza|salmón|atún|carne|filete/)){
          cambios.push('Proteína vegetal (legumbres, tofu, tempeh)');adaptado.nombre='Alternativa vegetariana';
        }
        if(dk==='vegano'&&p.nombre.toLowerCase().match(/pollo|ternera|cerdo|pescado|leche|queso|huevo|nata|mantequilla|carne|filete|merluza|salmón|atún|yogur/)){
          cambios.push('Sustituir ingredientes animales');adaptado.nombre='Alternativa vegana';
        }
        if(cambios.length){
          if(!adaptaciones[key])adaptaciones[key]=[];
          adaptaciones[key].push({original:p.nombre,adaptado:adaptado,cambios:cambios});
          notas=notas.concat(cambios);
        }
      });
    });

    if(notas.length>0||['disfagia','facil_masticacion','hiposodica','diabetico'].includes(dk)){
      derivaciones[dk]={label:der.label,icon:der.icon,adaptaciones:adaptaciones,
        notas:notas.length?notas.slice(0,5).join('. '):'Derivación aplicable sin cambios específicos esta semana.'};
    }
  });
  return derivaciones;
}

function rcEditMenu(id){
  var menu=DB.rcMenus.find(function(m){return m.id===id});if(!menu)return;
  rcOpenNewMenu(menu);
}

function rcDuplicateMenu(id){
  var menu=DB.rcMenus.find(function(m){return m.id===id});if(!menu)return;
  var dup=JSON.parse(JSON.stringify(menu));
  dup.id=DB.rcNextMenuId++;dup.nombre=menu.nombre+' (copia)';
  dup.createdAt=new Date().toISOString().slice(0,10);dup.estado='borrador';
  DB.rcMenus.push(dup);saveData();toast('Menú duplicado','success');rRestauracion();
}

function rcDeleteMenu(id){
  if(!confirm('¿Eliminar este menú?'))return;
  DB.rcMenus=DB.rcMenus.filter(function(m){return m.id!==id});
  saveData();toast('Menú eliminado','success');rRestauracion();
}

function rcExportMenuPDF(id){
  var menu=DB.rcMenus.find(function(m){return m.id===id});if(!menu)return;
  var centro=DB.rcCentros.find(function(ct){return ct.id===menu.centroId})||{nombre:'Centro',turnos:['Comida']};
  var dias=menu.dias||[];var turnos=centro.turnos||['Comida'];

  var rows='';
  turnos.forEach(function(turno){
    rows+='<tr><td style="font-weight:700;background:#f0f0f0;padding:6px">'+turno+'</td>';
    dias.forEach(function(dia){
      var platos=(menu.platos||{})[dia+'_'+turno]||[];
      rows+='<td style="padding:6px;vertical-align:top;font-size:11px">'+platos.map(function(p){
        var tags=(p.alergenos||[]).map(function(a){return '<span style="color:#c00;font-weight:700;font-size:9px">['+a+']</span>'}).join(' ');
        return sanitize(p.nombre)+(tags?' '+tags:'');
      }).join('<br>')+(platos.length?'':'—')+'</td>';
    });
    rows+='</tr>';
  });

  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+sanitize(menu.nombre)+'</title>'
  +'<style>body{font-family:Arial,sans-serif;margin:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;text-align:left;padding:6px}th{background:#2E8B57;color:#fff;font-size:12px}h1{font-size:18px;color:#2E8B57}h2{font-size:13px;color:#666}</style></head><body>'
  +'<h1>🏛️ '+sanitize(centro.nombre)+' — '+sanitize(menu.nombre)+'</h1>'
  +'<h2>Semana: '+fD(menu.fechaInicio)+' — '+fD(menu.fechaFin)+'</h2>'
  +'<table><thead><tr><th>Turno</th>'+dias.map(function(d){return '<th>'+d+'</th>'}).join('')+'</tr></thead><tbody>'+rows+'</tbody></table>'
  +'<p style="font-size:10px;color:#999;margin-top:20px">Generado por Veridia HealthTech · '+new Date().toLocaleDateString('es-ES')+'</p>'
  +'</body></html>';
  var w=window.open('','_blank');if(w){w.document.write(html);w.document.close();w.print()}
  else toast('Permite popups para imprimir','error');
}

// ══════════════════════════════════════════════════════
//  TAB 3: ESCALADO DE INGREDIENTES
// ══════════════════════════════════════════════════════
function rcRenderEscalado(c){
  // Pre-load from menu if available
  var menuOpts='<option value="">— Carga manual —</option>';
  DB.rcMenus.forEach(function(m){menuOpts+='<option value="'+m.id+'">'+sanitize(m.nombre)+'</option>'});

  // Group FACTORES_MERMA by category for reference table
  var fcCategories={
    '🥩 Carnes':['Ternera (sin hueso)','Ternera (con hueso)','Cerdo (sin hueso)','Cerdo (con hueso)','Pollo entero','Pollo (pechuga)','Pollo (muslo)'],
    '🐟 Pescados/Mariscos':['Pescado entero','Pescado (filete)','Merluza entera','Salmón filete','Gambas'],
    '🥬 Verduras/Hortalizas':['Patata','Zanahoria','Cebolla','Tomate','Lechuga','Pimiento','Judías verdes','Espinacas','Brócoli','Coliflor','Calabacín','Berenjena','Acelgas'],
    '🍎 Frutas':['Naranja','Manzana','Plátano','Melón','Sandía','Kiwi','Piña','Pera','Melocotón','Fresa'],
    '🌾 Cereales/Otros':['Arroz','Pasta','Lentejas','Garbanzos','Harina','Pan','Aceite','Leche','Huevo','Queso']
  };

  var h='<div style="display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start">';

  // ── LEFT COLUMN: Calculator ──
  h+='<div>'
  // Header card
  +'<div class="card" style="border-top:3px solid var(--primary);margin-bottom:16px">'
  +'<div class="card-header" style="background:var(--primary-light)"><span class="card-title" style="font-size:1rem">📐 Escalado de Ingredientes</span></div>'
  +'<div class="card-body" style="padding:18px 22px">'
  +'<p style="color:var(--text-secondary);font-size:.82rem;margin:0 0 16px">Recalcula cantidades para el número real de comensales, aplicando factores de corrección por merma (peso bruto vs peso neto).</p>'

  // Cargar desde menú
  +'<div class="form-group" style="margin-bottom:16px"><label style="font-size:.78rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Cargar desde menú</label>'
  +'<select id="rcEscMenu" class="form-control" onchange="rcPreloadEscalado()" style="max-width:100%">'+menuOpts+'</select></div>'

  // Comensales row — visual cards
  +'<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:end;margin-bottom:18px">'
  +'<div class="form-group" style="margin:0"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">🍽️ Base (receta)</label>'
  +'<input id="rcComBase" type="number" class="form-control" value="10" min="1" style="font-size:1.15rem;font-weight:700;text-align:center;padding:10px 8px"></div>'
  +'<div style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;background:var(--primary);color:#fff;border-radius:50%;font-size:1.2rem;font-weight:700;flex-shrink:0;margin-bottom:2px;box-shadow:0 3px 10px rgba(46,139,87,.25)">→</div>'
  +'<div class="form-group" style="margin:0"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">🎯 Objetivo</label>'
  +'<input id="rcComObj" type="number" class="form-control" value="100" min="1" style="font-size:1.15rem;font-weight:700;text-align:center;padding:10px 8px;border-color:var(--primary);background:var(--primary-light)"></div></div>'

  // Ingredientes textarea
  +'<div class="form-group" style="margin-bottom:16px"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">✏️ Ingredientes</label>'
  +'<div style="font-size:.72rem;color:var(--text-secondary);margin-bottom:6px">Un ingrediente por línea: <code style="background:var(--surface2);padding:1px 5px;border-radius:3px;font-size:.7rem">nombre | cantidad_g</code></div>'
  +'<textarea id="rcIngredientes" class="form-control" rows="7" style="font-family:\'Cascadia Code\',\'Fira Code\',monospace;font-size:.82rem;line-height:1.6;border-radius:10px" placeholder="Pollo (pechuga) | 150\nPatata | 200\nCebolla | 50\nZanahoria | 80\nAceite | 15\nSal | 3"></textarea></div>'

  // Calcular button
  +'<button class="btn btn-primary" onclick="rcCalcEscalado()" style="width:100%;padding:12px;font-size:.92rem;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:8px">'
  +'<span style="font-size:1.1rem">📐</span> Calcular Escalado</button>'
  +'</div></div>'

  // Result area
  +'<div id="rcEscaladoResult" style="margin-top:0"></div>'
  +'</div>';

  // ── RIGHT COLUMN: Factor Reference ──
  h+='<div>'
  +'<div class="card" style="border-top:3px solid var(--accent);position:sticky;top:80px">'
  +'<div class="card-header" style="background:var(--accent-light);padding:12px 18px"><span class="card-title" style="font-size:.88rem">📊 Factores de Corrección</span>'
  +'<span class="badge" style="background:var(--accent);color:#fff;font-size:.65rem">'+Object.keys(FACTORES_MERMA).length+' items</span></div>'
  +'<div class="card-body" style="padding:0;max-height:calc(100vh - 200px);overflow-y:auto">';

  Object.keys(fcCategories).forEach(function(catName){
    var items=fcCategories[catName];
    h+='<div style="padding:10px 16px;border-bottom:1px solid var(--border)">'
    +'<div style="font-weight:700;font-size:.78rem;margin-bottom:6px;color:var(--text)">'+catName+'</div>'
    +'<div style="display:grid;gap:3px">';
    items.forEach(function(k){
      var f=FACTORES_MERMA[k];if(!f)return;
      var merma=Math.round((1-1/f)*100);
      var barW=Math.min(merma*2.5,100);
      var barColor=merma>30?'#dc2626':merma>15?'#ca8a04':merma>0?'var(--primary)':'var(--surface3)';
      h+='<div style="display:grid;grid-template-columns:1fr 50px 40px;gap:6px;align-items:center;font-size:.73rem;padding:3px 0'+(merma>30?';background:#fef2f2;margin:0 -4px;padding-left:4px;padding-right:4px;border-radius:4px':'')+'">'
      +'<div style="display:flex;align-items:center;gap:6px"><span style="color:var(--text)">'+k+'</span></div>'
      +'<div style="display:flex;align-items:center;gap:4px"><div style="flex:1;height:4px;background:var(--surface3);border-radius:2px;overflow:hidden"><div style="width:'+barW+'%;height:100%;background:'+barColor+';border-radius:2px"></div></div></div>'
      +'<div style="text-align:right;font-weight:600;font-variant-numeric:tabular-nums;color:'+(merma>30?'#dc2626':merma>15?'#ca8a04':'var(--text-secondary)')+'">×'+f.toFixed(2)+'</div></div>';
    });
    h+='</div></div>';
  });

  h+='</div></div></div>';

  // Close main grid
  h+='</div>';

  // ── Responsive: collapse to single column on narrow screens ──
  h+='<style>'
  +'@media(max-width:900px){#rcContent>div:first-child{grid-template-columns:1fr !important}}'
  +'</style>';

  c.innerHTML=h;
}

function rcPreloadEscalado(){
  var menuId=parseInt($('rcEscMenu').value);if(!menuId)return;
  var menu=DB.rcMenus.find(function(m){return m.id===menuId});if(!menu)return;
  var centro=DB.rcCentros.find(function(ct){return ct.id===menu.centroId});
  if(centro) $('rcComObj').value=centro.comensales;
  // Extract unique plato names as ingredient list (simplified)
  var platos=[];
  Object.keys(menu.platos||{}).forEach(function(k){
    (menu.platos[k]||[]).forEach(function(p){if(platos.indexOf(p.nombre)===-1)platos.push(p.nombre)});
  });
  $('rcIngredientes').value=platos.map(function(p){return p+' | 100'}).join('\n');
  toast('Platos cargados desde menú','info');
}

function rcCalcEscalado(){
  var base=parseInt($('rcComBase').value)||1;
  var obj=parseInt($('rcComObj').value)||1;
  var factor=obj/base;
  var lines=$('rcIngredientes').value.trim().split('\n').filter(function(l){return l.trim()});
  if(!lines.length){toast('Añade al menos un ingrediente','error');return}

  var rows=lines.map(function(line){
    var parts=line.split('|').map(function(s){return s.trim()});
    var nombre=parts[0]||'Desconocido';
    var cantBase=parseFloat(parts[1])||0;
    var cantTotal=cantBase*factor;
    var fcKey=Object.keys(FACTORES_MERMA).find(function(k){return nombre.toLowerCase().includes(k.toLowerCase())});
    var fc=fcKey?FACTORES_MERMA[fcKey]:1.00;
    var bruto=cantTotal*fc;
    return {nombre:nombre,cantBase:cantBase,cantTotal:cantTotal,fc:fc,fcKey:fcKey||'—',bruto:bruto,merma:Math.round((1-1/fc)*100),sinFactor:!fcKey};
  });

  var totalNeto=0,totalBruto=0;
  rows.forEach(function(r){totalNeto+=r.cantTotal;totalBruto+=r.bruto});
  var totalMermaKg=totalBruto-totalNeto;
  var mermaPct=totalBruto>0?Math.round((totalMermaKg/totalBruto)*100):0;
  var conFactor=rows.filter(function(r){return !r.sinFactor}).length;
  var sinFactor=rows.filter(function(r){return r.sinFactor}).length;

  // ── Summary cards ──
  var h='<div class="card" style="border-top:3px solid var(--primary);margin-top:20px">'
  +'<div class="card-header" style="background:linear-gradient(135deg,var(--primary-light),var(--accent-light))"><span class="card-title" style="font-size:.95rem">📐 Resultado del Escalado</span>'
  +'<span class="badge" style="background:var(--primary);color:#fff;font-size:.72rem">×'+factor.toFixed(2)+'</span></div>'
  +'<div class="card-body" style="padding:18px 22px">';

  // KPI row
  h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">'
  +'<div style="background:var(--primary-light);border-radius:10px;padding:14px 12px;text-align:center">'
  +'<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:var(--primary);font-weight:600;margin-bottom:4px">Comensales</div>'
  +'<div style="font-size:1.4rem;font-weight:800;color:var(--primary)">'+base+' → '+obj+'</div></div>'
  +'<div style="background:var(--accent-light);border-radius:10px;padding:14px 12px;text-align:center">'
  +'<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:var(--accent);font-weight:600;margin-bottom:4px">Peso Neto Total</div>'
  +'<div style="font-size:1.4rem;font-weight:800;color:var(--accent)">'+rcFormatKg(totalNeto)+'</div></div>'
  +'<div style="background:#fef3c7;border-radius:10px;padding:14px 12px;text-align:center">'
  +'<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:#92400e;font-weight:600;margin-bottom:4px">Peso Bruto Total</div>'
  +'<div style="font-size:1.4rem;font-weight:800;color:#92400e">'+rcFormatKg(totalBruto)+'</div></div>'
  +'<div style="background:'+(mermaPct>20?'#fef2f2':'#f0fdf4')+';border-radius:10px;padding:14px 12px;text-align:center">'
  +'<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:'+(mermaPct>20?'#991b1b':'#166534')+';font-weight:600;margin-bottom:4px">Merma Estimada</div>'
  +'<div style="font-size:1.4rem;font-weight:800;color:'+(mermaPct>20?'#dc2626':'#16a34a')+'">'+rcFormatKg(totalMermaKg)+'</div>'
  +'<div style="font-size:.7rem;color:'+(mermaPct>20?'#dc2626':'#16a34a')+'">'+mermaPct+'% del bruto</div></div></div>';

  // Legend
  if(sinFactor>0){
    h+='<div style="display:flex;gap:12px;align-items:center;margin-bottom:14px;padding:8px 12px;background:var(--surface2);border-radius:8px;font-size:.75rem">'
    +'<span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:50%;background:var(--primary);display:inline-block"></span> Con factor ('+conFactor+')</span>'
    +'<span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:50%;background:var(--surface3);border:1px dashed var(--border);display:inline-block"></span> Sin factor — ×1.00 ('+sinFactor+')</span></div>';
  }

  // ── Table ──
  h+='<div style="overflow-x:auto;border-radius:10px;border:1px solid var(--border)"><table style="width:100%;border-collapse:collapse;font-size:.82rem">'
  +'<thead><tr style="background:var(--surface2)">'
  +'<th style="padding:10px 14px;text-align:left;font-size:.7rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Ingrediente</th>'
  +'<th style="padding:10px 10px;text-align:center;font-size:.7rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600;white-space:nowrap">Por persona</th>'
  +'<th style="padding:10px 10px;text-align:center;font-size:.7rem;text-transform:uppercase;letter-spacing:.6px;color:var(--accent);font-weight:600;white-space:nowrap">Peso Neto</th>'
  +'<th style="padding:10px 10px;text-align:center;font-size:.7rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Factor</th>'
  +'<th style="padding:10px 10px;text-align:center;font-size:.7rem;text-transform:uppercase;letter-spacing:.6px;color:#92400e;font-weight:600;white-space:nowrap">Peso Bruto</th>'
  +'<th style="padding:10px 10px;text-align:center;font-size:.7rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Merma</th>'
  +'</tr></thead><tbody>';

  rows.forEach(function(r,i){
    var isAlt=i%2===1;
    var rowBg=r.sinFactor?(isAlt?'var(--surface)':'transparent'):(isAlt?'rgba(46,139,87,.03)':'transparent');
    var mermaBadge='';
    if(r.merma>30) mermaBadge='<span style="display:inline-block;padding:2px 7px;border-radius:12px;font-size:.68rem;font-weight:600;background:#fef2f2;color:#dc2626">'+r.merma+'%</span>';
    else if(r.merma>15) mermaBadge='<span style="display:inline-block;padding:2px 7px;border-radius:12px;font-size:.68rem;font-weight:600;background:#fef3c7;color:#92400e">'+r.merma+'%</span>';
    else if(r.merma>0) mermaBadge='<span style="display:inline-block;padding:2px 7px;border-radius:12px;font-size:.68rem;font-weight:600;background:#f0fdf4;color:#166534">'+r.merma+'%</span>';
    else mermaBadge='<span style="color:var(--text-secondary);font-size:.75rem">—</span>';

    var factorBadge=r.sinFactor
      ?'<span style="color:var(--text-secondary);font-size:.75rem">×1.00</span>'
      :'<span style="display:inline-block;padding:2px 7px;border-radius:12px;font-size:.72rem;font-weight:600;background:var(--primary-light);color:var(--primary)">×'+r.fc.toFixed(2)+'</span>';

    h+='<tr style="background:'+rowBg+';border-bottom:1px solid var(--border)">'
    +'<td style="padding:10px 14px"><div style="display:flex;align-items:center;gap:8px">'
    +(r.sinFactor?'':'<span style="width:6px;height:6px;border-radius:50%;background:var(--primary);flex-shrink:0"></span>')
    +'<div><strong style="font-size:.84rem">'+sanitize(r.nombre)+'</strong>'
    +(r.fcKey!=='—'?'<div style="font-size:.65rem;color:var(--text-secondary);margin-top:1px">'+r.fcKey+'</div>':'')
    +'</div></div></td>'
    +'<td style="padding:10px;text-align:center;font-variant-numeric:tabular-nums">'+r.cantBase.toFixed(0)+' g</td>'
    +'<td style="padding:10px;text-align:center;font-weight:600;font-variant-numeric:tabular-nums;color:var(--accent)">'+rcFormatKg(r.cantTotal)+'</td>'
    +'<td style="padding:10px;text-align:center">'+factorBadge+'</td>'
    +'<td style="padding:10px;text-align:center;font-weight:700;font-variant-numeric:tabular-nums;color:#92400e">'+rcFormatKg(r.bruto)+'</td>'
    +'<td style="padding:10px;text-align:center">'+mermaBadge+'</td></tr>';
  });

  // Total row
  h+='<tr style="background:var(--surface2);border-top:2px solid var(--primary)">'
  +'<td style="padding:12px 14px;font-weight:700;font-size:.88rem" colspan="2">TOTAL ('+rows.length+' ingredientes)</td>'
  +'<td style="padding:12px 10px;text-align:center;font-weight:800;font-size:.92rem;color:var(--accent)">'+rcFormatKg(totalNeto)+'</td>'
  +'<td style="padding:12px 10px;text-align:center"></td>'
  +'<td style="padding:12px 10px;text-align:center;font-weight:800;font-size:.92rem;color:#92400e">'+rcFormatKg(totalBruto)+'</td>'
  +'<td style="padding:12px 10px;text-align:center"><span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:.72rem;font-weight:700;background:var(--primary);color:#fff">+'+rcFormatKg(totalMermaKg)+'</span></td></tr>';

  h+='</tbody></table></div>';

  // ── Actions ──
  h+='<div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">'
  +'<button class="btn btn-primary" style="border-radius:8px;display:flex;align-items:center;gap:6px" onclick="rcExportOrdenCompra()">📥 Exportar Orden de Compra CSV</button>'
  +'<button class="btn btn-outline" style="border-radius:8px;display:flex;align-items:center;gap:6px" onclick="rcPrintEscalado()">🖨️ Imprimir</button></div>'

  +'</div></div>';

  $('rcEscaladoResult').innerHTML=h;
  window._rcLastEscalado={rows:rows,base:base,obj:obj,totalNeto:totalNeto,totalBruto:totalBruto};
}

function rcPrintEscalado(){
  if(!window._rcLastEscalado)return;var d=window._rcLastEscalado;
  var rows='';d.rows.forEach(function(r){
    rows+='<tr><td style="padding:6px 10px">'+r.nombre+'</td><td style="padding:6px;text-align:center">'+r.cantBase.toFixed(0)+'g</td>'
    +'<td style="padding:6px;text-align:center">'+rcFormatKg(r.cantTotal)+'</td><td style="padding:6px;text-align:center">×'+r.fc.toFixed(2)+'</td>'
    +'<td style="padding:6px;text-align:center;font-weight:700">'+rcFormatKg(r.bruto)+'</td><td style="padding:6px;text-align:center">'+(r.merma>0?r.merma+'%':'—')+'</td></tr>';
  });
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Escalado '+d.base+'→'+d.obj+'</title>'
  +'<style>body{font-family:Arial,sans-serif;margin:24px;color:#333}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #ddd;font-size:12px}th{background:#2E8B57;color:#fff;padding:8px;text-align:center}h1{color:#2E8B57;font-size:18px}h2{font-size:13px;color:#666}.total{background:#f0f5f2;font-weight:700}p.footer{font-size:9px;color:#999;margin-top:30px}</style></head><body>'
  +'<h1>📐 Escalado de Ingredientes con Factor de Corrección</h1>'
  +'<h2>'+d.base+' → '+d.obj+' comensales (factor ×'+(d.obj/d.base).toFixed(2)+')</h2>'
  +'<table><thead><tr><th>Ingrediente</th><th>Por persona</th><th>Peso Neto</th><th>Factor</th><th>Peso Bruto</th><th>Merma</th></tr></thead><tbody>'
  +rows+'<tr class="total"><td colspan="2">TOTAL</td><td style="padding:6px;text-align:center">'+rcFormatKg(d.totalNeto)+'</td><td></td><td style="padding:6px;text-align:center">'+rcFormatKg(d.totalBruto)+'</td><td></td></tr></tbody></table>'
  +'<p class="footer">Generado por Veridia HealthTech · '+new Date().toLocaleDateString('es-ES')+'</p></body></html>';
  var w=window.open('','_blank');if(w){w.document.write(html);w.document.close();w.print()}else toast('Permite popups','error');
}

function rcFormatKg(g){return g>=1000?(g/1000).toFixed(2)+' kg':Math.round(g)+' g'}

function rcExportOrdenCompra(){
  if(!window._rcLastEscalado)return;var d=window._rcLastEscalado;
  var csv='Ingrediente;Peso Neto (g);Factor;Peso Bruto (g);Merma %\n';
  d.rows.forEach(function(r){csv+=r.nombre+';'+Math.round(r.cantTotal)+';'+r.fc.toFixed(2)+';'+Math.round(r.bruto)+';'+r.merma+'\n'});
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download='orden_compra_'+d.obj+'_comensales.csv';a.click();toast('CSV exportado','success');
}

// ══════════════════════════════════════════════════════
//  TAB 4: COSTEO DINÁMICO
// ══════════════════════════════════════════════════════
function rcRenderCosteo(c){
  if(!DB.rcMenus.length){c.innerHTML='<div class="card" style="text-align:center;padding:50px"><div style="font-size:3.5rem;margin-bottom:14px;opacity:.3">💰</div><p style="color:var(--text-secondary);font-size:.88rem;margin:0">No hay menús creados.</p></div>';return}
  var menuOpts=DB.rcMenus.map(function(m){return '<option value="'+m.id+'">'+sanitize(m.nombre)+'</option>'}).join('');
  var centro=rcSelCentro?DB.rcCentros.find(function(ct){return ct.id===rcSelCentro}):null;

  var h='<div class="card" style="border-top:3px solid #ca8a04;margin-bottom:20px">'
  +'<div class="card-header" style="background:#fffbeb"><span class="card-title" style="font-size:.92rem">💰 Costeo Dinámico por Menú</span></div>'
  +'<div class="card-body" style="padding:18px 22px">'
  +'<p style="color:var(--text-secondary);font-size:.82rem;margin:0 0 16px">Calcula el coste total cruzando platos con el maestro de precios. Asigna precio por plato para mayor precisión.</p>'
  +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:16px">'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">📋 Menú</label><select id="rcCosteoMenu" class="form-control" onchange="rcLoadCosteoPlatos()">'+menuOpts+'</select></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">👥 Comensales</label><input id="rcCosteoCom" type="number" class="form-control" value="'+(centro?centro.comensales:100)+'" style="font-size:1.05rem;font-weight:700;text-align:center"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">💶 Coste base/plato</label><input id="rcCosteoBase" type="number" class="form-control" value="2.50" step="0.10" min="0" style="font-size:1.05rem;font-weight:700;text-align:center"></div></div>'
  +'<div id="rcCosteoPlatos" style="margin-bottom:16px"></div>'
  +'<button class="btn btn-primary" style="width:100%;padding:12px;font-size:.92rem;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:8px" onclick="rcCalcCosteo()"><span style="font-size:1.1rem">💰</span> Calcular Costeo</button>'
  +'<div id="rcCosteoResult" style="margin-top:0"></div></div></div>';

  // Carga de trabajo reference
  h+='<div class="card" style="border-top:3px solid var(--accent)">'
  +'<div class="card-header"><span class="card-title" style="font-size:.85rem">⚡ Score de Carga de Trabajo</span>'
  +'<span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.68rem">Máx 12 pts/turno</span></div>'
  +'<div class="card-body" style="padding:14px 20px">'
  +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px">';
  Object.keys(CARGA_TRABAJO).forEach(function(k){
    var score=CARGA_TRABAJO[k];
    var barW=score*20;
    var sColor=score>=4?'#dc2626':score>=3?'#ca8a04':'#16a34a';
    h+='<div style="display:flex;align-items:center;gap:10px;padding:7px 12px;background:var(--surface2);border-radius:8px;font-size:.82rem">'
    +'<span style="background:'+sColor+';color:#fff;padding:3px 8px;border-radius:6px;font-weight:800;min-width:22px;text-align:center;font-size:.78rem">'+score+'</span>'
    +'<div style="flex:1"><div style="font-size:.8rem">'+k+'</div>'
    +'<div style="height:3px;background:var(--surface3);border-radius:2px;margin-top:3px;overflow:hidden"><div style="width:'+barW+'%;height:100%;background:'+sColor+';border-radius:2px"></div></div>'
    +'</div></div>';
  });
  h+='</div></div></div>';
  c.innerHTML=h;
  rcLoadCosteoPlatos();
}

function rcLoadCosteoPlatos(){
  var menuId=parseInt(($('rcCosteoMenu')||{}).value);
  var menu=DB.rcMenus.find(function(m){return m.id===menuId});
  var el=$('rcCosteoPlatos');if(!el||!menu)return;
  var uniquePlatos={};
  Object.keys(menu.platos||{}).forEach(function(k){
    (menu.platos[k]||[]).forEach(function(p){if(!uniquePlatos[p.nombre])uniquePlatos[p.nombre]={count:0,carga:p.carga};uniquePlatos[p.nombre].count++});
  });
  if(!Object.keys(uniquePlatos).length){el.textContent = '';return}
  var h='<div style="padding:12px 16px;background:var(--surface2);border-radius:10px;margin-top:8px"><div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600;margin-bottom:8px">💶 Precios por plato (opcional)</div>'
  +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:6px">';
  Object.keys(uniquePlatos).forEach(function(name){
    h+='<div style="display:flex;align-items:center;gap:6px;font-size:.8rem"><input type="number" step="0.10" min="0" class="form-control rcPlatoPrice" data-name="'+sanitize(name)+'" style="width:70px;padding:4px 6px;font-size:.8rem;text-align:center;font-weight:600" placeholder="'+fMoney(0)+'"> '+sanitize(name)+' <span style="color:var(--text-secondary);font-size:.7rem">(×'+uniquePlatos[name].count+')</span></div>';
  });
  h+='</div></div>';
  el.innerHTML=h;
}

function rcCalcCosteo(){
  var menuId=parseInt($('rcCosteoMenu').value);
  var menu=DB.rcMenus.find(function(m){return m.id===menuId});
  if(!menu){toast('Menú no encontrado','error');return}
  var comensales=parseInt($('rcCosteoCom').value)||100;
  var costoBase=parseFloat($('rcCosteoBase').value)||2.50;

  var precios={};
  document.querySelectorAll('.rcPlatoPrice').forEach(function(el){
    var v=parseFloat(el.value);if(v>0)precios[el.getAttribute('data-name')]=v;
  });

  var totalPlatos=0;var totalCarga=0;var totalCosto=0;var turnoCargas={};
  var dias=menu.dias||[];
  var centro=DB.rcCentros.find(function(ct){return ct.id===menu.centroId});
  var turnos=centro?(centro.turnos||['Comida']):['Comida'];

  dias.forEach(function(dia){
    turnos.forEach(function(turno){
      var platos=(menu.platos||{})[dia+'_'+turno]||[];
      var turnoCarga=0;
      platos.forEach(function(p){
        totalPlatos++;turnoCarga+=(p.carga||0);
        var precio=precios[p.nombre]||costoBase;
        totalCosto+=precio*comensales;
      });
      totalCarga+=turnoCarga;
      if(!turnoCargas[dia])turnoCargas[dia]={};
      turnoCargas[dia][turno]={platos:platos.length,carga:turnoCarga,overload:turnoCarga>12};
    });
  });

  var costoPorComensal=comensales?totalCosto/comensales:0;
  var costoDiario=dias.length?totalCosto/dias.length:0;

  // KPI cards
  var h='<div class="card" style="border-top:3px solid #ca8a04;margin-top:20px">'
  +'<div class="card-header" style="background:#fffbeb"><span class="card-title" style="font-size:.88rem">📊 Resultado — '+sanitize(menu.nombre)+'</span></div>'
  +'<div class="card-body" style="padding:18px 22px">'
  +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">'
  +'<div style="background:#fffbeb;border-radius:10px;padding:14px;text-align:center;border:1px solid #fde68a"><div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:#92400e;font-weight:600;margin-bottom:4px">Costo Semanal</div><div style="font-size:1.4rem;font-weight:800;color:#92400e">'+fMoney(totalCosto)+'</div></div>'
  +'<div style="background:var(--accent-light);border-radius:10px;padding:14px;text-align:center"><div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:var(--accent);font-weight:600;margin-bottom:4px">Por Comensal/Sem</div><div style="font-size:1.4rem;font-weight:800;color:var(--accent)">'+fMoney(costoPorComensal)+'</div></div>'
  +'<div style="background:var(--primary-light);border-radius:10px;padding:14px;text-align:center"><div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:var(--primary);font-weight:600;margin-bottom:4px">Costo Diario</div><div style="font-size:1.4rem;font-weight:800;color:var(--primary)">'+fMoney(costoDiario)+'</div></div>'
  +'<div style="background:var(--surface2);border-radius:10px;padding:14px;text-align:center"><div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600;margin-bottom:4px">Platos Totales</div><div style="font-size:1.4rem;font-weight:800">'+totalPlatos+'</div></div></div>';

  if(totalPlatos>0){
    var chartData=[];
    dias.forEach(function(dia){var s=0;turnos.forEach(function(t){var tc=turnoCargas[dia]&&turnoCargas[dia][t];if(tc)s+=tc.carga});chartData.push({label:dia.substring(0,3),value:s})});
    h+=svgBarChart({data:chartData,height:160,color:'var(--primary)',ylabel:'Carga',barWidth:40});
  }

  // Carga table
  h+='<div style="margin-top:18px"><div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600;margin-bottom:8px">⚡ Carga por Día / Turno</div>'
  +'<div style="overflow-x:auto;border-radius:10px;border:1px solid var(--border)"><table style="width:100%;border-collapse:collapse;font-size:.82rem">'
  +'<thead><tr style="background:var(--surface2)"><th style="padding:10px 14px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Día</th>';
  turnos.forEach(function(t){h+='<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">'+t+'</th>'});
  h+='<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Total</th></tr></thead><tbody>';
  dias.forEach(function(dia,i){
    var diaCarga=0;var isAlt=i%2===1;
    h+='<tr style="background:'+(isAlt?'var(--surface)':'transparent')+';border-bottom:1px solid var(--border)"><td style="padding:10px 14px;font-weight:600">'+dia+'</td>';
    turnos.forEach(function(turno){
      var tc=turnoCargas[dia]&&turnoCargas[dia][turno]?turnoCargas[dia][turno]:{platos:0,carga:0};
      diaCarga+=tc.carga;
      h+='<td style="padding:10px;text-align:center;'+(tc.overload?'background:#fef2f2':'')+'\">'+(tc.platos?tc.platos+'p · <strong style="color:'+(tc.overload?'#dc2626':'inherit')+'">⚡'+tc.carga+'</strong>':'<span style="color:var(--text3)">—</span>')+'</td>';
    });
    h+='<td style="padding:10px;text-align:center;font-weight:700">⚡'+diaCarga+'</td></tr>';
  });
  h+='</tbody></table></div></div>';
  h+='</div></div>';
  $('rcCosteoResult').innerHTML=h;
}

// ══════════════════════════════════════════════════════
//  TAB 5: AUDITORÍA NUTRICIONAL
// ══════════════════════════════════════════════════════
function rcRenderAuditoria(c){
  if(!DB.rcMenus.length){c.innerHTML='<div class="card" style="text-align:center;padding:50px"><div style="font-size:3.5rem;margin-bottom:14px;opacity:.3">✅</div><p style="color:var(--text-secondary);font-size:.88rem;margin:0">No hay menús para auditar.</p></div>';return}
  var menuOpts=DB.rcMenus.map(function(m){return '<option value="'+m.id+'">'+sanitize(m.nombre)+'</option>'}).join('');
  c.innerHTML='<div class="card" style="border-top:3px solid #16a34a">'
  +'<div class="card-header" style="background:#f0fdf4"><span class="card-title" style="font-size:.92rem">✅ Auditoría Nutricional</span></div>'
  +'<div class="card-body" style="padding:18px 22px">'
  +'<p style="color:var(--text-secondary);font-size:.82rem;margin:0 0 16px">Verifica rotación, variedad y límites según baremos legales por grupo de edad.</p>'
  +'<div style="display:flex;gap:14px;align-items:end;margin-bottom:16px;flex-wrap:wrap">'
  +'<div class="form-group" style="flex:1;min-width:200px;margin:0"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">📋 Seleccionar menú</label><select id="rcAuditMenu" class="form-control">'+menuOpts+'</select></div>'
  +'<button class="btn btn-primary" style="border-radius:10px;padding:10px 24px;display:flex;align-items:center;gap:6px;white-space:nowrap" onclick="rcRunAuditoria()">✅ Ejecutar Auditoría</button></div>'
  +'<div id="rcAuditResult"></div></div></div>';
}

function rcAuditMenu(menu,centro){
  var result={score:0,checks:[],warnings:[],errors:[]};
  var totalChecks=8;var passed=0;
  var dias=menu.dias||[];
  var turnos=centro?(centro.turnos||['Comida']):['Comida'];

  var platosPorDia={};var todosPlatos=[];
  dias.forEach(function(dia){
    platosPorDia[dia]=[];
    turnos.forEach(function(turno){
      ((menu.platos||{})[dia+'_'+turno]||[]).forEach(function(p){
        platosPorDia[dia].push(p.nombre.toLowerCase());
        todosPlatos.push(p.nombre.toLowerCase());
      });
    });
  });

  var rotOk=true;
  for(var i=1;i<dias.length;i++){
    (platosPorDia[dias[i-1]]||[]).forEach(function(p){
      if((platosPorDia[dias[i]]||[]).includes(p)){rotOk=false;result.warnings.push('Rotación: "'+p+'" en '+dias[i-1]+' y '+dias[i])}
    });
  }
  if(rotOk){passed++;result.checks.push('✅ Rotación: Sin repeticiones consecutivas')}else result.checks.push('⚠️ Rotación: Platos repetidos consecutivamente');

  var verdura=todosPlatos.filter(function(p){return p.match(/ensalada|verdura|brócoli|espinaca|acelga|lechuga|tomate|zanahoria|calabacín|judías verdes|coliflor|pimiento|berenjena|alcachofa/)}).length;
  if(verdura>=3){passed++;result.checks.push('✅ Verdura: '+verdura+'/sem (mín. 3)')}else{result.checks.push('⚠️ Verdura: '+verdura+'/sem (mín. 3)');result.warnings.push('Insuficiente verdura: '+verdura)}

  var legum=todosPlatos.filter(function(p){return p.match(/lentejas|garbanzos|judías|alubias|habas|guisantes|soja|legumbre/)}).length;
  if(legum>=1){passed++;result.checks.push('✅ Legumbres: '+legum+'/sem (mín. 1)')}else{result.checks.push('⚠️ Legumbres: '+legum+'/sem (mín. 1)');result.warnings.push('Faltan legumbres')}

  var fruta=todosPlatos.filter(function(p){return p.match(/fruta|manzana|naranja|plátano|pera|kiwi|fresa|melón|sandía|melocotón|piña|uva|mandarina/)}).length;
  if(fruta>=4){passed++;result.checks.push('✅ Fruta: '+fruta+'/sem (mín. 4)')}else{result.checks.push('⚠️ Fruta: '+fruta+'/sem (mín. 4)');result.warnings.push('Insuficiente fruta: '+fruta)}

  var pescado=todosPlatos.filter(function(p){return p.match(/pescado|merluza|salmón|atún|bacalao|dorada|lubina|sardina|boquerón|rape|lenguado|trucha/)}).length;
  if(pescado>=2){passed++;result.checks.push('✅ Pescado: '+pescado+'/sem (mín. 2)')}else{result.checks.push('⚠️ Pescado: '+pescado+'/sem (mín. 2)');result.warnings.push('Insuficiente pescado: '+pescado)}

  var protAnimal=todosPlatos.filter(function(p){return p.match(/pollo|ternera|cerdo|pescado|merluza|salmón|atún|huevo|carne|filete|pavo|cordero/)}).length;
  var protVegetal=todosPlatos.filter(function(p){return p.match(/lentejas|garbanzos|tofu|tempeh|soja|judías|alubias|quinoa|seitán/)}).length;
  var totalProt=protAnimal+protVegetal;
  if(totalProt>0&&protVegetal>=Math.floor(totalProt*0.2)){passed++;result.checks.push('✅ Balance proteico: '+protAnimal+' animal / '+protVegetal+' vegetal')}
  else if(totalProt===0){passed++;result.checks.push('✅ Balance proteico: Sin datos suficientes')}
  else{result.checks.push('⚠️ Balance proteico: '+protAnimal+' animal / '+protVegetal+' vegetal (poca variedad)');result.warnings.push('Pocas fuentes vegetales de proteína')}

  var cargaOk=true;
  dias.forEach(function(dia){turnos.forEach(function(turno){
    var sum=((menu.platos||{})[dia+'_'+turno]||[]).reduce(function(s,p){return s+(p.carga||0)},0);
    if(sum>12){cargaOk=false;result.errors.push('Carga excedida '+dia+' '+turno+': '+sum+'/12')}
  })});
  if(cargaOk){passed++;result.checks.push('✅ Carga: Dentro del umbral')}else result.checks.push('❌ Carga: Superada');

  var sinEtiq=0;
  Object.keys(menu.platos||{}).forEach(function(key){
    (menu.platos[key]||[]).forEach(function(p){
      var n=p.nombre.toLowerCase();var al=p.alergenos||[];
      if(n.match(/leche|queso|nata|yogur|bechamel/)&&!al.includes('LAC'))sinEtiq++;
      if(n.match(/huevo|tortilla|revuelto|flan|bizcocho/)&&!al.includes('HUE'))sinEtiq++;
      if(n.match(/pan|pasta|harina|rebozado|empanado|croqueta/)&&!al.includes('GLU'))sinEtiq++;
      if(n.match(/gambas|langostino|marisco/)&&!al.includes('CRU'))sinEtiq++;
      if(n.match(/pescado|merluza|salmón|atún|bacalao/)&&!al.includes('PES'))sinEtiq++;
    });
  });
  if(sinEtiq===0){passed++;result.checks.push('✅ Alérgenos: Etiquetado OK')}else{result.checks.push('⚠️ Alérgenos: ~'+sinEtiq+' sin etiquetar');result.warnings.push(sinEtiq+' platos necesitan etiquetado')}

  result.score=Math.round(passed/totalChecks*100);
  return result;
}

function rcRunAuditoria(){
  var menuId=parseInt($('rcAuditMenu').value);
  var menu=DB.rcMenus.find(function(m){return m.id===menuId});
  if(!menu){toast('Menú no encontrado','error');return}
  var centro=DB.rcCentros.find(function(ct){return ct.id===menu.centroId});
  if(!centro){toast('Centro no encontrado','error');return}

  var audit=rcAuditMenu(menu,centro);
  var tipo=RC_INST_TYPES.find(function(t){return t.id===centro.tipo})||{edadGrupo:'adulto'};
  var limites=LIMITES_NUTRICIONALES[tipo.edadGrupo]||LIMITES_NUTRICIONALES['adulto'];
  var sc=audit.score>=80?'#16a34a':audit.score>=60?'#ca8a04':'#dc2626';

  // SVG donut
  var pct=audit.score/100;var r=50;var circ=2*Math.PI*r;
  var h='<div class="card" style="border-top:3px solid '+sc+';margin-top:20px">'
  +'<div class="card-body" style="padding:22px">'
  // Score + checklist side by side
  +'<div style="display:grid;grid-template-columns:auto 1fr;gap:28px;align-items:start;margin-bottom:20px">'
  // Donut
  +'<div style="text-align:center">'
  +'<svg width="130" height="130" viewBox="0 0 130 130"><circle cx="65" cy="65" r="'+r+'" fill="none" stroke="var(--surface3)" stroke-width="10" opacity=".3"/>'
  +'<circle cx="65" cy="65" r="'+r+'" fill="none" stroke="'+sc+'" stroke-width="10" stroke-dasharray="'+(pct*circ)+' '+circ+'" stroke-linecap="round" transform="rotate(-90 65 65)"/>'
  +'<text x="65" y="60" text-anchor="middle" font-size="28" font-weight="800" fill="'+sc+'">'+audit.score+'%</text>'
  +'<text x="65" y="78" text-anchor="middle" font-size="11" fill="var(--text-secondary)" font-weight="600">Calidad</text></svg>'
  +'<div style="font-size:.78rem;font-weight:700;color:'+sc+';margin-top:4px">'+(audit.score>=80?'EXCELENTE':audit.score>=60?'ACEPTABLE':'NECESITA MEJORAS')+'</div></div>'
  // Checklist
  +'<div><div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600;margin-bottom:8px">📋 Checklist ('+audit.checks.length+' criterios)</div>'
  +'<div style="display:grid;gap:4px">';
  audit.checks.forEach(function(ch){
    var isOk=ch.startsWith('✅');
    h+='<div style="padding:8px 12px;background:'+(isOk?'#f0fdf4':'#fffbeb')+';border-radius:8px;font-size:.82rem;border-left:3px solid '+(isOk?'#16a34a':'#ca8a04')+'">'+ch+'</div>';
  });
  h+='</div></div></div>';

  // Warnings + errors
  if(audit.warnings.length||audit.errors.length){
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">';
    if(audit.warnings.length){
      h+='<div style="background:#fffbeb;border-radius:10px;padding:14px;border:1px solid #fde68a"><div style="font-size:.75rem;font-weight:700;color:#92400e;margin-bottom:6px">⚠️ Advertencias ('+audit.warnings.length+')</div>'
      +'<ul style="font-size:.8rem;margin:0;padding-left:16px;color:#92400e">';audit.warnings.forEach(function(w){h+='<li style="margin:3px 0">'+w+'</li>'});h+='</ul></div>';
    }
    if(audit.errors.length){
      h+='<div style="background:#fef2f2;border-radius:10px;padding:14px;border:1px solid #fecaca"><div style="font-size:.75rem;font-weight:700;color:#dc2626;margin-bottom:6px">❌ Errores ('+audit.errors.length+')</div>'
      +'<ul style="font-size:.8rem;margin:0;padding-left:16px;color:#dc2626">';audit.errors.forEach(function(e){h+='<li style="margin:3px 0">'+e+'</li>'});h+='</ul></div>';
    }
    h+='</div>';
  }

  // Nutritional limits
  h+='<div style="border-top:1px solid var(--border);padding-top:16px"><div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600;margin-bottom:10px">📊 Límites por Menú — Grupo: '+tipo.edadGrupo+'</div>'
  +'<div style="overflow-x:auto;border-radius:10px;border:1px solid var(--border)"><table style="width:100%;border-collapse:collapse;font-size:.82rem">'
  +'<thead><tr style="background:var(--surface2)"><th style="padding:10px 14px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Parámetro</th>'
  +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:#16a34a;font-weight:600">Mín</th>'
  +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:#dc2626;font-weight:600">Máx</th></tr></thead><tbody>'
  +'<tr style="border-bottom:1px solid var(--border)"><td style="padding:8px 14px">Kilocalorías</td><td style="padding:8px;text-align:center;font-weight:600">'+limites.kcalMin+'</td><td style="padding:8px;text-align:center;font-weight:600">'+limites.kcalMax+'</td></tr>'
  +'<tr style="border-bottom:1px solid var(--border);background:var(--surface)"><td style="padding:8px 14px">Grasa saturada (g)</td><td style="padding:8px;text-align:center;color:var(--text3)">—</td><td style="padding:8px;text-align:center;font-weight:600">'+limites.grasaSatMax+'</td></tr>'
  +'<tr style="border-bottom:1px solid var(--border)"><td style="padding:8px 14px">Azúcares simples (g)</td><td style="padding:8px;text-align:center;color:var(--text3)">—</td><td style="padding:8px;text-align:center;font-weight:600">'+limites.azucarMax+'</td></tr>'
  +'<tr style="border-bottom:1px solid var(--border);background:var(--surface)"><td style="padding:8px 14px">Sodio (mg)</td><td style="padding:8px;text-align:center;color:var(--text3)">—</td><td style="padding:8px;text-align:center;font-weight:600">'+limites.sodioMax+'</td></tr>'
  +'<tr style="border-bottom:1px solid var(--border)"><td style="padding:8px 14px">Proteína (g)</td><td style="padding:8px;text-align:center;font-weight:600">'+limites.protMin+'</td><td style="padding:8px;text-align:center;color:var(--text3)">—</td></tr>'
  +'<tr><td style="padding:8px 14px">Fibra (g)</td><td style="padding:8px;text-align:center;font-weight:600">'+limites.fibraMin+'</td><td style="padding:8px;text-align:center;color:var(--text3)">—</td></tr>'
  +'</tbody></table></div></div>';

  h+='</div></div>';
  $('rcAuditResult').innerHTML=h;
}

// ══════════════════════════════════════════════════════
//  TAB 6: APPCC
// ══════════════════════════════════════════════════════
function rcRenderAppcc(c){
  var logs=DB.rcAppcc||[];
  var pg=paginate('rcAppcc',logs.slice().reverse(),20);

  // ── Compute KPIs ──
  var totalLogs=logs.length;
  var conformes=logs.filter(function(l){return l.resultado==='CONFORME'}).length;
  var noConformes=totalLogs-conformes;
  var pctConf=totalLogs>0?Math.round(conformes/totalLogs*100):100;
  var hoy=new Date().toISOString().slice(0,10);
  var logsHoy=logs.filter(function(l){return l.fecha===hoy}).length;
  var ncHoy=logs.filter(function(l){return l.fecha===hoy&&l.resultado!=='CONFORME'}).length;
  // Last 7 days trend
  var last7=[];for(var dd=6;dd>=0;dd--){
    var d7=new Date(Date.now()-dd*86400000).toISOString().slice(0,10);
    var dayLogs=logs.filter(function(l){return l.fecha===d7});
    var dayNC=dayLogs.filter(function(l){return l.resultado!=='CONFORME'}).length;
    last7.push({date:d7,total:dayLogs.length,nc:dayNC});
  }
  // Per-punto breakdown
  var puntoStats={};logs.forEach(function(l){
    var p=l.punto||'Otro';if(!puntoStats[p])puntoStats[p]={total:0,nc:0};
    puntoStats[p].total++;if(l.resultado!=='CONFORME')puntoStats[p].nc++;
  });

  // ═══ HEADER ═══
  var h='<div class="card" style="border:none;background:linear-gradient(135deg,#0E7490 0%,#0891B2 50%,#22D3EE 100%);color:#fff;margin-bottom:20px;border-radius:var(--radius)">'
  +'<div class="card-body" style="padding:22px 28px">'
  +'<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">'
  +'<div><div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">🛡️<h2 style="margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.3px">Control APPCC</h2></div>'
  +'<p style="margin:0;font-size:.78rem;opacity:.8">Análisis de Peligros y Puntos de Control Crítico · Reglamento (CE) 852/2004</p></div>'
  +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
  +'<button class="btn" style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25);backdrop-filter:blur(4px)" onclick="rcExportAppcc()">📥 Exportar CSV</button>'
  +'<button class="btn" style="background:#fff;color:var(--primary);font-weight:700;border:none" onclick="rcNewAppccLog()">＋ Nuevo Registro</button>'
  +'</div></div></div></div>';

  // ═══ KPI CARDS ═══
  var statusColor=pctConf>=90?'#16a34a':pctConf>=70?'#ca8a04':'#dc2626';
  var statusLabel=pctConf>=90?'EXCELENTE':pctConf>=70?'ACEPTABLE':'CRÍTICO';
  // Donut SVG
  var donutR=28;var donutCirc=2*Math.PI*donutR;var donutPct=pctConf/100;
  var donutSvg='<svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="'+donutR+'" fill="none" stroke="var(--surface3)" stroke-width="6" opacity=".3"/>'
  +'<circle cx="36" cy="36" r="'+donutR+'" fill="none" stroke="'+statusColor+'" stroke-width="6" stroke-dasharray="'+(donutPct*donutCirc)+' '+donutCirc+'" stroke-linecap="round" transform="rotate(-90 36 36)"/>'
  +'<text x="36" y="34" text-anchor="middle" font-size="15" font-weight="800" fill="'+statusColor+'">'+pctConf+'%</text>'
  +'<text x="36" y="46" text-anchor="middle" font-size="7" fill="var(--text-secondary)" font-weight="600">CONF.</text></svg>';

  h+='<div style="display:grid;grid-template-columns:auto repeat(3,1fr);gap:14px;margin-bottom:20px;align-items:stretch">';

  // Donut card
  h+='<div class="card" style="display:flex;align-items:center;gap:16px;padding:18px 22px">'
  +donutSvg
  +'<div><div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.8px;color:var(--text-secondary);font-weight:600">Estado General</div>'
  +'<div style="font-size:1rem;font-weight:800;color:'+statusColor+';margin:2px 0">'+statusLabel+'</div>'
  +'<div style="font-size:.72rem;color:var(--text-secondary)">'+conformes+' ✅ / '+noConformes+' ❌ de '+totalLogs+'</div></div></div>';

  // Today card
  h+='<div class="card" style="padding:18px 20px;display:flex;flex-direction:column;justify-content:center">'
  +'<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.8px;color:var(--text-secondary);font-weight:600;margin-bottom:6px">📅 Hoy</div>'
  +'<div style="font-size:1.8rem;font-weight:800;color:var(--text);line-height:1">'+logsHoy+'</div>'
  +'<div style="font-size:.72rem;color:var(--text-secondary);margin-top:2px">registro'+(logsHoy!==1?'s':'')+' hoy'+(ncHoy>0?' · <span style="color:#dc2626;font-weight:600">'+ncHoy+' NC</span>':'')+'</div></div>';

  // No conformes card
  h+='<div class="card" style="padding:18px 20px;display:flex;flex-direction:column;justify-content:center;border-left:3px solid '+(noConformes>0?'#dc2626':'#16a34a')+'">'
  +'<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.8px;color:var(--text-secondary);font-weight:600;margin-bottom:6px">'+(noConformes>0?'❌':'✅')+' No Conformes</div>'
  +'<div style="font-size:1.8rem;font-weight:800;color:'+(noConformes>0?'#dc2626':'#16a34a')+';line-height:1">'+noConformes+'</div>'
  +'<div style="font-size:.72rem;color:var(--text-secondary);margin-top:2px">'+(noConformes>0?'Requieren acción correctiva':'Todo conforme')+'</div></div>';

  // Total card
  h+='<div class="card" style="padding:18px 20px;display:flex;flex-direction:column;justify-content:center">'
  +'<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.8px;color:var(--text-secondary);font-weight:600;margin-bottom:6px">📊 Total Registros</div>'
  +'<div style="font-size:1.8rem;font-weight:800;color:var(--accent);line-height:1">'+totalLogs+'</div>'
  +'<div style="font-size:.72rem;color:var(--text-secondary);margin-top:2px">desde el inicio</div></div>';
  h+='</div>';

  // ═══ 7-DAY SPARKLINE + PER-PUNTO BREAKDOWN ═══
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">';

  // 7-day mini chart
  h+='<div class="card" style="border-top:3px solid var(--primary)">'
  +'<div class="card-header"><span class="card-title" style="font-size:.85rem">📈 Últimos 7 días</span></div>'
  +'<div class="card-body" style="padding:14px 18px">';
  var maxDay=Math.max.apply(null,last7.map(function(d){return d.total}))||1;
  h+='<div style="display:flex;align-items:flex-end;gap:6px;height:80px">';
  last7.forEach(function(d7){
    var barH=d7.total>0?Math.max(Math.round(d7.total/maxDay*70),6):3;
    var ncH=d7.nc>0?Math.max(Math.round(d7.nc/maxDay*70),4):0;
    var dayLabel=d7.date.slice(8,10)+'/'+d7.date.slice(5,7);
    h+='<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">'
    +'<div style="font-size:.6rem;color:var(--text-secondary);font-variant-numeric:tabular-nums">'+(d7.total||'')+'</div>'
    +'<div style="position:relative;width:100%;max-width:32px;height:'+barH+'px;background:var(--primary);border-radius:4px 4px 2px 2px;overflow:hidden">'
    +(ncH>0?'<div style="position:absolute;bottom:0;width:100%;height:'+ncH+'px;background:#dc2626;border-radius:0 0 2px 2px"></div>':'')
    +'</div>'
    +'<div style="font-size:.58rem;color:var(--text3);font-variant-numeric:tabular-nums">'+dayLabel+'</div></div>';
  });
  h+='</div>'
  +'<div style="display:flex;gap:12px;margin-top:10px;font-size:.65rem;color:var(--text-secondary)">'
  +'<span style="display:flex;align-items:center;gap:3px"><span style="width:8px;height:8px;background:var(--primary);border-radius:2px;display:inline-block"></span> Conforme</span>'
  +'<span style="display:flex;align-items:center;gap:3px"><span style="width:8px;height:8px;background:#dc2626;border-radius:2px;display:inline-block"></span> No Conforme</span></div>'
  +'</div></div>';

  // Per-punto breakdown
  h+='<div class="card" style="border-top:3px solid var(--accent)">'
  +'<div class="card-header"><span class="card-title" style="font-size:.85rem">🔍 Por Punto de Control</span></div>'
  +'<div class="card-body" style="padding:8px 18px">';
  var puntoKeys=Object.keys(puntoStats).sort(function(a,b){return puntoStats[b].total-puntoStats[a].total});
  if(puntoKeys.length){
    puntoKeys.forEach(function(pk){
      var ps=puntoStats[pk];var pctOk=ps.total>0?Math.round((ps.total-ps.nc)/ps.total*100):100;
      var barColor=pctOk>=90?'var(--primary)':pctOk>=70?'#ca8a04':'#dc2626';
      h+='<div style="padding:7px 0;border-bottom:1px solid var(--border)">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">'
      +'<span style="font-size:.78rem;font-weight:600">'+sanitize(pk)+'</span>'
      +'<span style="font-size:.68rem;font-variant-numeric:tabular-nums;color:var(--text-secondary)">'+ps.total+' reg.'+(ps.nc>0?' · <span style="color:#dc2626;font-weight:600">'+ps.nc+' NC</span>':'')+'</span></div>'
      +'<div style="height:5px;background:var(--surface3);border-radius:3px;overflow:hidden"><div style="width:'+pctOk+'%;height:100%;background:'+barColor+';border-radius:3px;transition:width .4s ease"></div></div></div>';
    });
  } else {
    h+='<div style="text-align:center;padding:20px;opacity:.5;font-size:.85rem">Sin registros aún</div>';
  }
  h+='</div></div>';
  h+='</div>';

  // ═══ PCC REFERENCE CARDS ═══
  h+='<div class="card" style="margin-bottom:20px;border-top:3px solid #dc2626">'
  +'<div class="card-header"><span class="card-title" style="font-size:.85rem">🌡️ Puntos de Control Crítico — Límites Operativos</span></div>'
  +'<div class="card-body" style="padding:14px 20px">'
  +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px">';

  var pccItems=[
    {icon:'🥚🍖',title:'Cocción de riesgo',desc:'Huevo, carne picada, aves',limit:'≥ 75°C',sublimit:'centro del producto',color:'#dc2626',bg:'#fef2f2'},
    {icon:'🔥',title:'Mantenimiento caliente',desc:'Platos ya cocinados en línea',limit:'≥ 65°C',sublimit:'servicio continuo',color:'#ea580c',bg:'#fff7ed'},
    {icon:'❄️',title:'Refrigeración',desc:'Alimentos perecederos',limit:'≤ 4°C',sublimit:'máx 2h fuera de frío',color:'#2563eb',bg:'#eff6ff'},
    {icon:'🌡️',title:'Congelación',desc:'Productos congelados',limit:'≤ -18°C',sublimit:'no recongelar',color:'#7c3aed',bg:'#f5f3ff'},
    {icon:'⏱️',title:'Enfriamiento rápido',desc:'De cocción a refrigeración',limit:'< 2 horas',sublimit:'de 65°C a 10°C',color:'#0891b2',bg:'#ecfeff'},
    {icon:'📦',title:'Recepción MP',desc:'Materia prima al llegar',limit:'Verificar T°',sublimit:'aspecto, caducidad, etiqueta',color:'#0891b2',bg:'#ecfeff'}
  ];
  pccItems.forEach(function(pcc){
    h+='<div style="background:'+pcc.bg+';border-radius:12px;padding:16px;border:1px solid '+pcc.color+'22;display:flex;gap:12px;align-items:flex-start">'
    +'<div style="font-size:1.4rem;flex-shrink:0;margin-top:2px">'+pcc.icon+'</div>'
    +'<div style="flex:1;min-width:0">'
    +'<div style="font-size:.82rem;font-weight:700;color:'+pcc.color+';margin-bottom:2px">'+pcc.title+'</div>'
    +'<div style="font-size:.72rem;color:var(--text-secondary);margin-bottom:6px">'+pcc.desc+'</div>'
    +'<div style="display:inline-block;background:'+pcc.color+';color:#fff;padding:3px 10px;border-radius:6px;font-size:.82rem;font-weight:800;letter-spacing:.3px">'+pcc.limit+'</div>'
    +'<div style="font-size:.65rem;color:var(--text-secondary);margin-top:3px">'+pcc.sublimit+'</div>'
    +'</div></div>';
  });
  h+='</div></div></div>';

  // ═══ REFERENCE PANELS: Alérgenos + IDDSI ═══
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">';

  // 14 Allergens
  h+='<div class="card" style="border-top:3px solid #e11d48">'
  +'<div class="card-header" style="cursor:pointer" onclick="var b=this.nextElementSibling;b.style.display=b.style.display===\'none\'?\'block\':\'none\';this.querySelector(\'.appcc-chevron\').textContent=b.style.display===\'none\'?\'▸\':\'▾\'">'
  +'<span class="card-title" style="font-size:.82rem">🏷️ 14 Alérgenos UE <span style="font-size:.68rem;font-weight:400;color:var(--text-secondary)">Reg. 1169/2011</span></span>'
  +'<span class="appcc-chevron" style="font-size:.8rem;color:var(--text-secondary)">▾</span></div>'
  +'<div class="card-body" style="padding:10px 16px">'
  +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">';
  ALERGENOS_14.forEach(function(a){
    h+='<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:8px;font-size:.76rem;transition:background .2s" onmouseover="this.style.background=\'var(--surface2)\'" onmouseout="this.style.background=\'transparent\'">'
    +'<span style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:#fef2f2;border-radius:6px;font-size:.9rem;flex-shrink:0">'+a.icon+'</span>'
    +'<div><strong style="color:#e11d48;font-size:.68rem">'+a.code+'</strong> <span style="color:var(--text)">'+a.name+'</span></div></div>';
  });
  h+='</div></div></div>';

  // IDDSI
  h+='<div class="card" style="border-top:3px solid #6366f1">'
  +'<div class="card-header" style="cursor:pointer" onclick="var b=this.nextElementSibling;b.style.display=b.style.display===\'none\'?\'block\':\'none\';this.querySelector(\'.appcc-chevron\').textContent=b.style.display===\'none\'?\'▸\':\'▾\'">'
  +'<span class="card-title" style="font-size:.82rem">🫗 IDDSI Niveles 0-7 <span style="font-size:.68rem;font-weight:400;color:var(--text-secondary)">Disfagia</span></span>'
  +'<span class="appcc-chevron" style="font-size:.8rem;color:var(--text-secondary)">▾</span></div>'
  +'<div class="card-body" style="padding:8px 14px"><div style="display:grid;gap:4px">';
  IDDSI_LEVELS.forEach(function(l){
    var textColor=l.level<=1?'#333':'#fff';
    h+='<div style="display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:8px;transition:background .2s" onmouseover="this.style.background=\'var(--surface2)\'" onmouseout="this.style.background=\'transparent\'">'
    +'<div style="width:30px;height:30px;background:'+l.color+';color:'+textColor+';border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.82rem;flex-shrink:0;border:1px solid '+(l.level===0?'var(--border)':'transparent')+'">'+l.level+'</div>'
    +'<div style="flex:1;min-width:0"><div style="font-size:.76rem;font-weight:600;color:var(--text)">'+l.name+'</div>'
    +'<div style="font-size:.65rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+l.test+'">🧪 '+l.test+'</div></div></div>';
  });
  h+='</div></div></div>';
  h+='</div>';

  // ═══ LOGS TABLE ═══
  h+='<div class="card" style="border-top:3px solid var(--primary)">'
  +'<div class="card-header">'
  +'<span class="card-title" style="font-size:.88rem">📋 Registro de Controles</span>'
  +'<span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.72rem">'+totalLogs+' total</span></div>';

  if(pg.items.length){
    var puntoIcons={'Recepción materia prima':'📦','Almacenamiento frío':'❄️','Descongelación':'🧊','Cocción':'🔥','Enfriamiento rápido':'⏱️','Mantenimiento caliente':'🌡️','Servicio':'🍽️','Limpieza':'🧹'};
    h+='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.8rem">'
    +'<thead><tr style="background:var(--surface2)">'
    +'<th style="padding:10px 12px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600;white-space:nowrap">Fecha / Hora</th>'
    +'<th style="padding:10px 10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Punto de Control</th>'
    +'<th style="padding:10px 10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Plato / Alimento</th>'
    +'<th style="padding:10px 10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Temp.</th>'
    +'<th style="padding:10px 10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Resultado</th>'
    +'<th style="padding:10px 10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Responsable</th>'
    +'<th style="padding:10px 8px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600;width:32px"></th>'
    +'</tr></thead><tbody>';

    pg.items.forEach(function(log,i){
      var ok=log.resultado==='CONFORME';
      var isAlt=i%2===1;
      var rowBg=!ok?'#fef2f2':(isAlt?'var(--surface)':'transparent');
      var pIcon=puntoIcons[log.punto]||'🔹';

      // Temperature badge
      var tempBadge='<span style="color:var(--text-secondary)">—</span>';
      if(log.temperatura!=null){
        var t=log.temperatura;
        var tColor=t>=75?'#16a34a':t>=65?'#ca8a04':t<=4?'#2563eb':t<=-18?'#7c3aed':t<65&&t>4?'#dc2626':'var(--text)';
        tempBadge='<span style="display:inline-block;padding:2px 8px;border-radius:6px;font-weight:700;font-size:.78rem;font-variant-numeric:tabular-nums;background:'+(ok?'#f0fdf4':'#fef2f2')+';color:'+tColor+'">'+t+'°C</span>';
      }

      h+='<tr style="background:'+rowBg+';border-bottom:1px solid var(--border)">'
      +'<td style="padding:10px 12px;white-space:nowrap"><div style="font-size:.8rem;font-weight:600;font-variant-numeric:tabular-nums">'+fD(log.fecha)+'</div>'
      +(log.hora?'<div style="font-size:.68rem;color:var(--text-secondary)">'+log.hora+' h</div>':'')+'</td>'
      +'<td style="padding:10px"><div style="display:flex;align-items:center;gap:6px"><span style="font-size:.9rem">'+pIcon+'</span><span style="font-size:.8rem">'+sanitize(log.punto||'')+'</span></div></td>'
      +'<td style="padding:10px"><strong style="font-size:.8rem">'+sanitize(log.plato||'')+'</strong>'
      +(log.observaciones?'<div style="font-size:.65rem;color:var(--text-secondary);margin-top:1px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+sanitize(log.observaciones)+'">💬 '+sanitize(log.observaciones)+'</div>':'')
      +'</td>'
      +'<td style="padding:10px;text-align:center">'+tempBadge+'</td>'
      +'<td style="padding:10px;text-align:center">'
      +(ok
        ?'<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 10px;border-radius:20px;font-size:.7rem;font-weight:700;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">✅ Conforme</span>'
        :'<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 10px;border-radius:20px;font-size:.7rem;font-weight:700;background:#fef2f2;color:#dc2626;border:1px solid #fecaca">❌ No Conforme</span>')
      +'</td>'
      +'<td style="padding:10px"><span style="font-size:.78rem;color:var(--text-secondary)">'+sanitize(log.responsable||'—')+'</span></td>'
      +'<td style="padding:10px;text-align:center">'
      +(log.foto?'<span style="cursor:pointer;font-size:.85rem" onclick="rcViewAppccPhoto(\''+log.id+'\')" title="Ver foto">📷</span>':'')
      +'</td></tr>';
    });

    h+='</tbody></table></div>'
    +'<div style="padding:12px 18px;border-top:1px solid var(--border)">'+pageNav('rcAppcc',pg,'rRestauracion()')+'</div>';
  } else {
    h+='<div class="card-body" style="text-align:center;padding:40px">'
    +'<div style="font-size:3rem;margin-bottom:12px;opacity:.4">🛡️</div>'
    +'<p style="color:var(--text-secondary);font-size:.88rem;margin:0">No hay registros APPCC aún.</p>'
    +'<p style="color:var(--text3);font-size:.78rem;margin:6px 0 0">Pulsa <strong>＋ Nuevo Registro</strong> para comenzar.</p></div>';
  }
  h+='</div>';

  // Responsive
  h+='<style>'
  +'@media(max-width:900px){#rcContent>div:nth-child(2){grid-template-columns:1fr 1fr !important}#rcContent>div:nth-child(3){grid-template-columns:1fr !important}}'
  +'@media(max-width:600px){#rcContent>div:nth-child(2){grid-template-columns:1fr !important}#rcContent>div:nth-child(5){grid-template-columns:1fr !important}}'
  +'</style>';

  c.innerHTML=h;
}

// ── Photo handling for APPCC ──
function rcHandleAppccPhoto(input){
  var preview=$('rcAppccPhotoPreview');if(!preview)return;
  if(!input.files||!input.files[0]){preview.textContent = '';window._rcAppccPhotoData=null;return}
  var reader=new FileReader();
  reader.onload=function(e){
    window._rcAppccPhotoData=e.target.result;
    preview.innerHTML='<div style="margin-top:6px;position:relative;display:inline-block">'
    +'<img src="'+e.target.result+'" style="max-width:200px;max-height:150px;border-radius:8px;border:2px solid var(--border);object-fit:cover">'
    +'<span style="position:absolute;top:-6px;right:-6px;background:#dc2626;color:#fff;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;cursor:pointer" '
    +'onclick="window._rcAppccPhotoData=null;this.parentElement.remove()">✕</span></div>';
  };
  reader.readAsDataURL(input.files[0]);
}

function rcViewAppccPhoto(logId){
  var log=(DB.rcAppcc||[]).find(function(l){return l.id==logId||l.id===parseInt(logId)});
  if(!log||!log.foto){toast('Sin foto','info');return}
  openModal('📷 Evidencia — '+sanitize(log.plato||''),
    '<div style="text-align:center"><img src="'+log.foto+'" style="max-width:100%;max-height:70vh;border-radius:10px;border:1px solid var(--border)">'
    +'<div style="margin-top:10px;font-size:.82rem;color:var(--text-secondary)">'+fD(log.fecha)+' '+(log.hora||'')+' · '+sanitize(log.punto||'')+'</div></div>');
}

function rcNewAppccLog(){
  var puntos=[
    {v:'Recepción materia prima',ic:'📦'},
    {v:'Almacenamiento frío',ic:'❄️'},
    {v:'Descongelación',ic:'🧊'},
    {v:'Cocción',ic:'🔥'},
    {v:'Enfriamiento rápido',ic:'⏱️'},
    {v:'Mantenimiento caliente',ic:'🌡️'},
    {v:'Servicio',ic:'🍽️'},
    {v:'Limpieza',ic:'🧹'}
  ];
  var pOpts=puntos.map(function(p){return '<option value="'+p.v+'">'+p.ic+' '+p.v+'</option>'}).join('');

  openModal('🛡️ Nuevo Registro APPCC','<div style="display:grid;gap:14px">'

  // Punto de control
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Punto de control *</label>'
  +'<select id="rcAppccPunto" class="form-control" style="font-size:.88rem">'+pOpts+'</select></div>'

  // Plato
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Plato / Alimento *</label>'
  +'<input id="rcAppccPlato" class="form-control" placeholder="Ej: Tortilla de patata" style="font-size:.88rem"></div>'

  // Temp + Resultado row
  +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">🌡️ Temperatura (°C)</label>'
  +'<input id="rcAppccTemp" type="number" class="form-control" step="0.1" placeholder="75.0" style="font-size:1.1rem;font-weight:700;text-align:center"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Resultado</label>'
  +'<select id="rcAppccRes" class="form-control" style="font-size:.88rem"><option value="CONFORME">✅ Conforme</option><option value="NO_CONFORME">❌ No Conforme</option></select></div></div>'

  // Responsable
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">👤 Responsable</label>'
  +'<input id="rcAppccResp" class="form-control" value="'+(currentUser?sanitize(currentUser.name):'')+'"></div>'

  // Observaciones
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">💬 Observaciones</label>'
  +'<textarea id="rcAppccObs" class="form-control" rows="2" placeholder="Notas adicionales..."></textarea></div>'

  // Photo
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">📷 Foto evidencia (opcional)</label>'
  +'<input type="file" id="rcAppccPhoto" accept="image/*" class="form-control" onchange="rcHandleAppccPhoto(this)"></div>'
  +'<div id="rcAppccPhotoPreview"></div>'

  // Live temp gauge
  +'<div id="rcAppccGauge" style="padding:12px 16px;border-radius:10px;background:var(--surface2);text-align:center;font-size:.82rem;display:none"></div>'

  // Alert
  +'<div id="rcAppccAlert" style="display:none;padding:12px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#dc2626;font-size:.85rem"></div>'
  +'</div>','<button class="btn btn-primary" style="padding:10px 28px;font-size:.88rem" onclick="rcSaveAppccLog()">🛡️ Registrar Control</button>');

  // Auto-alert for risky foods + live gauge
  function updateAppccUI(){
    var temp=parseFloat(($('rcAppccTemp')||{}).value)||0;
    var plato=(($('rcAppccPlato')||{}).value||'').toLowerCase();
    var alertEl=$('rcAppccAlert');
    var gaugeEl=$('rcAppccGauge');

    // Temperature gauge
    if(gaugeEl){
      if(temp!==0){
        gaugeEl.style.display='block';
        var gColor=temp>=75?'#16a34a':temp>=65?'#ca8a04':'#dc2626';
        var gLabel=temp>=75?'✅ Temperatura segura (cocción)':temp>=65?'⚠️ Zona de riesgo — verificar':'❌ Temperatura insuficiente';
        if(temp<=4){gColor='#2563eb';gLabel='✅ Refrigeración correcta'}
        if(temp<=-18){gColor='#7c3aed';gLabel='✅ Congelación correcta'}
        if(temp>4&&temp<65){gColor='#dc2626';gLabel='🚨 ZONA DE PELIGRO (4°C – 65°C)'}
        // Mini gauge bar
        var gPct=Math.min(Math.max((temp+20)/120*100,0),100);
        gaugeEl.innerHTML='<div style="display:flex;align-items:center;gap:12px;justify-content:center;flex-wrap:wrap">'
        +'<div style="font-size:1.3rem;font-weight:800;color:'+gColor+';font-variant-numeric:tabular-nums">'+temp+'°C</div>'
        +'<div style="flex:1;max-width:200px"><div style="height:8px;background:linear-gradient(90deg,#7c3aed 0%,#2563eb 20%,#dc2626 35%,#dc2626 55%,#ca8a04 65%,#16a34a 75%,#16a34a 100%);border-radius:4px;position:relative">'
        +'<div style="position:absolute;top:-4px;left:'+gPct+'%;width:3px;height:16px;background:'+gColor+';border-radius:2px;transform:translateX(-50%);box-shadow:0 0 6px '+gColor+'"></div></div></div>'
        +'<div style="font-size:.78rem;font-weight:600;color:'+gColor+'">'+gLabel+'</div></div>';
      } else { gaugeEl.style.display='none' }
    }

    // Risky food alert
    if(alertEl){
      var risky=plato.match(/huevo|tortilla|mayonesa|carbonara|carne picada|pollo|pavo|hamburguesa/);
      if(risky&&temp>0&&temp<75){
        alertEl.style.display='block';
        alertEl.innerHTML='⚠️ <strong>ALERTA APPCC:</strong> Producto de riesgo detectado a <strong>'+temp+'°C</strong> (mínimo 75°C). Se marcará como <strong>NO CONFORME</strong>.';
        $('rcAppccRes').value='NO_CONFORME';
      } else { alertEl.style.display='none' }
    }
  }
  $('rcAppccTemp').addEventListener('input',updateAppccUI);
  $('rcAppccPlato').addEventListener('input',updateAppccUI);
}

function rcSaveAppccLog(){
  var plato=$('rcAppccPlato').value.trim();
  if(!plato){toast('Plato requerido','error');return}
  var temp=parseFloat($('rcAppccTemp').value);
  var resultado=$('rcAppccRes').value;
  if(plato.toLowerCase().match(/huevo|tortilla|mayonesa|carbonara|carne picada|pollo|pavo|hamburguesa/)&&temp>0&&temp<75) resultado='NO_CONFORME';

  DB.rcAppcc.push({
    id:Date.now(),fecha:new Date().toISOString().slice(0,10),hora:new Date().toTimeString().slice(0,5),
    punto:$('rcAppccPunto').value,plato:sanitize(plato),temperatura:temp||null,
    resultado:resultado==='CONFORME'?'CONFORME':'NO_CONFORME',
    responsable:sanitize($('rcAppccResp').value.trim()),
    observaciones:sanitize(($('rcAppccObs')||{}).value||'').trim(),
    foto:window._rcAppccPhotoData||null
  });
  window._rcAppccPhotoData=null;
  closeModal();saveData();toast('APPCC registrado'+(resultado!=='CONFORME'?' — ⚠️ NO CONFORME':''),'success');rRestauracion();
}

function rcExportAppcc(){
  if(!(DB.rcAppcc||[]).length){toast('Sin registros para exportar','info');return}
  var csv='Fecha;Hora;Punto;Plato;Temp;Resultado;Responsable;Observaciones\n';
  (DB.rcAppcc||[]).forEach(function(l){csv+=l.fecha+';'+(l.hora||'')+';'+l.punto+';'+l.plato+';'+(l.temperatura||'')+';'+l.resultado+';'+(l.responsable||'')+';'+(l.observaciones||'')+'\n'});
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download='appcc_registros_'+new Date().toISOString().slice(0,10)+'.csv';a.click();toast('CSV exportado','success');
}

// ══════════════════════════════════════════════════════
//  TAB 7: TRAZABILIDAD
// ══════════════════════════════════════════════════════
function rcRenderTrazabilidad(c){
  var lotes=DB.rcLotes||[];var proveedores=DB.rcProveedores||[];
  var lotesProx=rcLotesProximosACaducar();
  var lotesActivos=lotes.filter(function(l){return l.estado!=='recall'&&l.estado!=='consumido'}).length;

  // ═══ HEADER ═══
  var h='<div class="card" style="border:none;background:linear-gradient(135deg,#0E7490 0%,#0891B2 50%,#22D3EE 100%);color:#fff;margin-bottom:20px;border-radius:var(--radius)">'
  +'<div class="card-body" style="padding:22px 28px">'
  +'<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">'
  +'<div><div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">📤<h2 style="margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.3px">Trazabilidad Sanitaria</h2></div>'
  +'<p style="margin:0;font-size:.78rem;opacity:.8">Gestión de proveedores, lotes y cadena de custodia</p></div>'
  +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
  +'<button class="btn" style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25)" onclick="rcOpenProveedorModal()">🏭 Proveedor</button>'
  +'<button class="btn" style="background:#fff;color:#0891b2;font-weight:700;border:none" onclick="rcNewLote()">＋ Nuevo Lote</button>'
  +'</div></div></div></div>';

  // ═══ KPI ROW ═══
  h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">'
  +'<div class="card" style="padding:18px;text-align:center;border-top:3px solid #0891b2"><div style="font-size:1.6rem;font-weight:800;color:#0891b2">'+proveedores.length+'</div><div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Proveedores</div></div>'
  +'<div class="card" style="padding:18px;text-align:center;border-top:3px solid var(--primary)"><div style="font-size:1.6rem;font-weight:800;color:var(--primary)">'+lotesActivos+'</div><div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Lotes Activos</div></div>'
  +'<div class="card" style="padding:18px;text-align:center;border-top:3px solid '+(lotesProx.length>0?'#ca8a04':'#16a34a')+'"><div style="font-size:1.6rem;font-weight:800;color:'+(lotesProx.length>0?'#ca8a04':'#16a34a')+'">'+lotesProx.length+'</div><div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Próx. Caducidad</div></div>'
  +'<div class="card" style="padding:18px;text-align:center;border-top:3px solid #dc2626"><div style="font-size:1.6rem;font-weight:800;color:#dc2626">'+lotes.filter(function(l){return l.estado==='recall'}).length+'</div><div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Recalls</div></div>'
  +'</div>';

  // ═══ CADUCIDAD ALERTS ═══
  if(lotesProx.length){
    h+='<div class="card" style="margin-bottom:20px;border-top:3px solid #ca8a04">'
    +'<div class="card-header" style="background:#fffbeb"><span class="card-title" style="font-size:.85rem;color:#92400e">🧊 Lotes próximos a caducar (≤7 días)</span>'
    +'<span class="badge" style="background:#fef3c7;color:#92400e;font-size:.68rem">'+lotesProx.length+'</span></div>'
    +'<div class="card-body" style="padding:10px 18px">';
    lotesProx.forEach(function(l){
      var dias=Math.ceil((new Date(l.caducidad)-new Date())/86400000);
      var isVencido=dias<0;
      h+='<div style="padding:8px 12px;margin:4px 0;border-radius:8px;font-size:.84rem;background:'+(isVencido?'#fef2f2':'#fffbeb')+';border:1px solid '+(isVencido?'#fecaca':'#fde68a')+';display:flex;align-items:center;gap:8px">'
      +'<span style="font-size:1rem">'+(isVencido?'❌':'⚠️')+'</span>'
      +'<div><strong>'+sanitize(l.producto)+'</strong> <span style="font-size:.72rem;color:var(--text-secondary)">(Lote: '+sanitize(l.numLote)+')</span><br>'
      +'<span style="font-size:.78rem;color:'+(isVencido?'#dc2626':'#92400e')+'">'+(isVencido?'VENCIDO hace '+Math.abs(dias)+' días':'Caduca en <strong>'+dias+'</strong> días')+'</span></div></div>';
    });
    h+='</div></div>';
  }

  // ═══ PROVEEDORES ═══
  if(proveedores.length){
    h+='<div class="card" style="margin-bottom:20px;border-top:3px solid #7c3aed">'
    +'<div class="card-header"><span class="card-title" style="font-size:.85rem">🏭 Proveedores</span>'
    +'<span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.68rem">'+proveedores.length+'</span></div>'
    +'<div class="card-body" style="padding:14px 18px">'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px">';
    proveedores.forEach(function(p,i){
      h+='<div style="padding:14px;background:var(--surface2);border-radius:10px;border:1px solid var(--border)">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px"><strong style="font-size:.86rem">'+sanitize(p.nombre)+'</strong>'
      +'<div style="display:flex;gap:4px"><span style="cursor:pointer;font-size:.8rem" onclick="rcEditProveedor('+i+')">✏️</span><span style="cursor:pointer;font-size:.8rem" onclick="rcEmailProveedor('+i+')" title="Email pedido">📧</span><span style="cursor:pointer;font-size:.8rem" onclick="rcDeleteProveedor('+i+')">🗑️</span></div></div>'
      +(p.cif?'<div style="font-size:.7rem;color:var(--text-secondary)">CIF: '+sanitize(p.cif)+'</div>':'')
      +(p.categoria?'<span style="display:inline-block;padding:1px 6px;background:var(--primary-light);color:var(--primary);border-radius:4px;font-size:.65rem;font-weight:600;margin-top:4px">'+sanitize(p.categoria)+'</span>':'')
      +'<div style="font-size:.76rem;color:var(--text-secondary);margin-top:4px">'+sanitize(p.contacto||'')+'</div>'
      +(p.productos?'<div style="font-size:.72rem;color:var(--text3);margin-top:2px;font-style:italic">'+sanitize(p.productos)+'</div>':'')
      +'</div>';
    });
    h+='</div></div></div>';
  }

  // ═══ LOTES TABLE ═══
  h+='<div class="card" style="border-top:3px solid #0891b2">'
  +'<div class="card-header"><span class="card-title" style="font-size:.88rem">📦 Lotes</span>'
  +'<span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.72rem">'+lotes.length+' total</span></div>';
  if(lotes.length){
    h+='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.8rem">'
    +'<thead><tr style="background:var(--surface2)">'
    +'<th style="padding:10px 12px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Proveedor</th>'
    +'<th style="padding:10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Producto</th>'
    +'<th style="padding:10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Lote</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Recepción</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Caducidad</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Estado</th>'
    +'<th style="padding:10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Platos</th>'
    +'<th style="padding:10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Centros</th>'
    +'<th style="padding:10px 8px;text-align:center;width:60px"></th>'
    +'</tr></thead><tbody>';
    lotes.slice().reverse().forEach(function(l,i){
      var idx=lotes.length-1-i;
      var diasCad=l.caducidad?Math.ceil((new Date(l.caducidad)-new Date())/86400000):999;
      var cadColor=diasCad<0?'#dc2626':diasCad<7?'#ca8a04':'inherit';
      var estadoColors={recall:'#dc2626',consumido:'#6b7280',activo:'#16a34a'};
      var estado=l.estado||'activo';
      var isAlt=i%2===1;
      var rowBg=estado==='recall'?'#fef2f2':(isAlt?'var(--surface)':'transparent');
      h+='<tr style="background:'+rowBg+';border-bottom:1px solid var(--border)">'
      +'<td style="padding:10px 12px;font-size:.8rem">'+sanitize(l.proveedor||'')+'</td>'
      +'<td style="padding:10px"><strong style="font-size:.8rem">'+sanitize(l.producto||'')+'</strong></td>'
      +'<td style="padding:10px"><code style="font-size:.72rem;background:var(--surface2);padding:2px 6px;border-radius:4px">'+sanitize(l.numLote||'')+'</code></td>'
      +'<td style="padding:10px;text-align:center;font-variant-numeric:tabular-nums;font-size:.78rem">'+fD(l.fechaRecepcion)+'</td>'
      +'<td style="padding:10px;text-align:center;color:'+cadColor+';font-weight:'+(diasCad<7?'700':'400')+';font-variant-numeric:tabular-nums;font-size:.78rem">'+fD(l.caducidad)+'</td>'
      +'<td style="padding:10px;text-align:center"><span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:.68rem;font-weight:700;background:'+(estadoColors[estado]||'#16a34a')+';color:#fff">'+estado+'</span></td>'
      +'<td style="padding:10px;font-size:.72rem;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+((l.platosUsados||[]).join(', '))+'">'+((l.platosUsados||[]).length?(l.platosUsados||[]).join(', '):'<span style="color:var(--text3)">—</span>')+'</td>'
      +'<td style="padding:10px;font-size:.72rem">'+((l.centrosAfectados||[]).length?(l.centrosAfectados||[]).join(', '):'<span style="color:var(--text3)">—</span>')+'</td>'
      +'<td style="padding:10px;text-align:center;white-space:nowrap"><button class="btn btn-sm" style="font-size:.7rem;padding:3px 8px;border-radius:6px" onclick="rcEditLote('+idx+')">✏️</button> '
      +'<button class="btn btn-sm" style="font-size:.7rem;padding:3px 8px;border-radius:6px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca" onclick="rcRecallLote(\''+sanitize(l.numLote)+'\')">🚨</button></td></tr>';
    });
    h+='</tbody></table></div>';
  } else {
    h+='<div class="card-body" style="text-align:center;padding:40px"><div style="font-size:3rem;opacity:.3;margin-bottom:12px">📦</div>'
    +'<p style="color:var(--text-secondary);font-size:.85rem;margin:0">No hay lotes registrados</p></div>';
  }
  h+='</div>';
  c.innerHTML=h;
}

function rcOpenProveedorModal(editIdx){
  var isEdit=editIdx!=null;var p=isEdit?DB.rcProveedores[editIdx]:{};
  openModal((isEdit?'Editar':'Nuevo')+' Proveedor','<div style="display:grid;gap:12px">'
  +'<div class="form-group"><label>Nombre *</label><input id="rcProvNombre" class="form-control" value="'+sanitize(p.nombre||'')+'"></div>'
  +'<div class="form-group"><label>CIF</label><input id="rcProvCif" class="form-control" value="'+sanitize(p.cif||'')+'"></div>'
  +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
  +'<div class="form-group"><label>Contacto</label><input id="rcProvContacto" class="form-control" value="'+sanitize(p.contacto||'')+'"></div>'
  +'<div class="form-group"><label>Email</label><input id="rcProvEmail" class="form-control" type="email" value="'+sanitize(p.email||'')+'"></div></div>'
  +'<div class="form-group"><label>Categoría</label><select id="rcProvCat" class="form-control">'
  +['Carnes','Pescados','Lácteos','Frutas y Verduras','Cereales','Congelados','Conservas','Bebidas','Otros'].map(function(cat){return '<option value="'+cat+'" '+(p.categoria===cat?'selected':'')+'>'+cat+'</option>'}).join('')+'</select></div>'
  +'<div class="form-group"><label>Productos suministrados</label><input id="rcProvProd" class="form-control" value="'+sanitize(p.productos||'')+'"></div>'
  +'</div>','<button class="btn btn-primary" onclick="rcSaveProveedor('+(isEdit?editIdx:'null')+')">'+IC.chk+(isEdit?' Actualizar':' Guardar')+'</button>');
}
function rcEditProveedor(i){rcOpenProveedorModal(i)}

function rcSaveProveedor(editIdx){
  var nombre=$('rcProvNombre').value.trim();
  if(!nombre){toast('Nombre requerido','error');return}
  var obj={id:Date.now(),nombre:sanitize(nombre),cif:sanitize($('rcProvCif').value.trim()),
    contacto:sanitize($('rcProvContacto').value.trim()),email:sanitize($('rcProvEmail').value.trim()),
    categoria:$('rcProvCat').value,productos:sanitize($('rcProvProd').value.trim())};
  if(editIdx!=null&&DB.rcProveedores[editIdx]){obj.id=DB.rcProveedores[editIdx].id;DB.rcProveedores[editIdx]=obj}
  else DB.rcProveedores.push(obj);
  closeModal();saveData();toast('Proveedor guardado','success');rRestauracion();
}
function rcDeleteProveedor(i){if(!confirm('¿Eliminar proveedor?'))return;DB.rcProveedores.splice(i,1);saveData();toast('Eliminado','success');rRestauracion()}

function rcNewLote(){
  var provOpts='<option value="">— Seleccionar —</option>'+DB.rcProveedores.map(function(p){return '<option value="'+sanitize(p.nombre)+'">'+sanitize(p.nombre)+'</option>'}).join('');
  if(!DB.rcProveedores.length){toast('Primero registra un proveedor','error');return}
  var centroOpts=DB.rcCentros.map(function(c){return '<label style="display:flex;align-items:center;gap:4px;font-size:.85rem"><input type="checkbox" name="rcLoteCentro" value="'+sanitize(c.nombre)+'" checked> '+sanitize(c.nombre)+'</label>'}).join('');

  openModal('Registrar Lote','<div style="display:grid;gap:12px">'
  +'<div class="form-group"><label>Proveedor *</label><select id="rcLoteProv" class="form-control">'+provOpts+'</select></div>'
  +'<div class="form-group"><label>Producto *</label><input id="rcLoteProd" class="form-control" placeholder="Pechuga de pollo"></div>'
  +'<div class="form-group"><label>N° Lote *</label><input id="rcLoteNum" class="form-control" placeholder="L-2026-0587"></div>'
  +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
  +'<div class="form-group"><label>Recepción</label><input id="rcLoteFecha" type="date" class="form-control" value="'+new Date().toISOString().slice(0,10)+'"></div>'
  +'<div class="form-group"><label>Caducidad</label><input id="rcLoteCad" type="date" class="form-control"></div></div>'
  +'<div class="form-group"><label>Platos donde se usó</label><input id="rcLotePlatos" class="form-control" placeholder="Plato 1, Plato 2..."></div>'
  +'<div class="form-group"><label>Centros</label><div style="display:flex;flex-wrap:wrap;gap:8px">'+(centroOpts||'<span style="opacity:.5">Sin centros</span>')+'</div></div>'
  +'</div>','<button class="btn btn-primary" onclick="rcSaveLote(null)">'+IC.chk+' Registrar</button>');
}

function rcEditLote(idx){
  var l=DB.rcLotes[idx];if(!l)return;
  rcNewLote();
  setTimeout(function(){
    if($('rcLoteProv'))$('rcLoteProv').value=l.proveedor||'';
    if($('rcLoteProd'))$('rcLoteProd').value=l.producto||'';
    if($('rcLoteNum'))$('rcLoteNum').value=l.numLote||'';
    if($('rcLoteFecha'))$('rcLoteFecha').value=l.fechaRecepcion||'';
    if($('rcLoteCad'))$('rcLoteCad').value=l.caducidad||'';
    if($('rcLotePlatos'))$('rcLotePlatos').value=(l.platosUsados||[]).join(', ');
    (l.centrosAfectados||[]).forEach(function(cn){
      var cb=document.querySelector('input[name="rcLoteCentro"][value="'+cn+'"]');if(cb)cb.checked=true;
    });
    var btn=document.querySelector('#modal .btn-primary');
    if(btn){btn.setAttribute('onclick','rcSaveLote('+idx+')');btn.innerHTML=IC.chk+' Actualizar'}
  },80);
}

function rcSaveLote(editIdx){
  var prov=($('rcLoteProv')||{}).value;var prod=$('rcLoteProd').value.trim();var num=$('rcLoteNum').value.trim();
  if(!prod||!num){toast('Producto y Lote requeridos','error');return}
  if(!prov){toast('Selecciona proveedor','error');return}
  var centros=[];document.querySelectorAll('input[name="rcLoteCentro"]:checked').forEach(function(cb){centros.push(cb.value)});
  var platos=$('rcLotePlatos').value.trim().split(',').map(function(s){return s.trim()}).filter(function(s){return s});

  var obj={id:Date.now(),proveedor:prov,producto:sanitize(prod),numLote:sanitize(num),
    fechaRecepcion:$('rcLoteFecha').value,caducidad:$('rcLoteCad').value,
    platosUsados:platos,centrosAfectados:centros,estado:'activo'};
  if(editIdx!=null&&DB.rcLotes[editIdx]){obj.id=DB.rcLotes[editIdx].id;obj.estado=DB.rcLotes[editIdx].estado;DB.rcLotes[editIdx]=obj}
  else DB.rcLotes.push(obj);
  closeModal();saveData();toast('Lote guardado','success');rRestauracion();
}

function rcRecallLote(numLote){
  var lote=(DB.rcLotes||[]).find(function(l){return l.numLote===numLote});
  if(!lote){toast('Lote no encontrado','error');return}
  lote.estado='recall';saveData();

  var centros=(lote.centrosAfectados||[]).length?lote.centrosAfectados.join(', '):'No especificados';
  var platos=(lote.platosUsados||[]).length?lote.platosUsados.join(', '):'No especificados';
  var diasDesde=Math.ceil((new Date()-new Date(lote.fechaRecepcion))/86400000);
  var comExpuestos=DB.rcCentros.filter(function(ct){return(lote.centrosAfectados||[]).includes(ct.nombre)}).reduce(function(s,ct){return s+(ct.comensales||0)},0);

  openModal('🚨 RECALL — '+sanitize(numLote),'<div style="background:#fef2f2;border:2px solid #dc2626;border-radius:10px;padding:16px;margin-bottom:12px">'
  +'<h3 style="color:#dc2626;margin:0 0 8px">⚠️ ALERTA DE RECALL</h3>'
  +'<div style="display:grid;gap:6px;font-size:.88rem">'
  +'<div><strong>Proveedor:</strong> '+sanitize(lote.proveedor)+'</div>'
  +'<div><strong>Producto:</strong> '+sanitize(lote.producto)+'</div>'
  +'<div><strong>Lote:</strong> <code>'+sanitize(lote.numLote)+'</code></div>'
  +'<div><strong>Recepción:</strong> '+fD(lote.fechaRecepcion)+' (hace '+diasDesde+' días)</div>'
  +'<div><strong>Platos:</strong> '+sanitize(platos)+'</div>'
  +'<div><strong>Centros:</strong> '+sanitize(centros)+'</div>'
  +'<div style="font-size:1.1rem;font-weight:700;color:#dc2626;margin-top:6px">Comensales expuestos: '+comExpuestos+'</div></div></div>'
  +'<div style="background:var(--bg-secondary);padding:12px;border-radius:8px;font-size:.8rem"><strong>Acciones requeridas:</strong>'
  +'<ol style="margin:4px 0"><li>Retirar inmediatamente producto del lote</li><li>Notificar centros afectados</li>'
  +'<li>Comunicar a autoridad sanitaria</li><li>Contactar proveedor: '+sanitize(lote.proveedor)+'</li><li>Documentar acciones correctivas</li></ol></div>',
  '<button class="btn" onclick="rcExportRecall(\''+sanitize(numLote)+'\')">📄 Export Informe</button>');
}

function rcExportRecall(numLote){
  var lote=(DB.rcLotes||[]).find(function(l){return l.numLote===numLote});if(!lote)return;
  var comExp=DB.rcCentros.filter(function(ct){return(lote.centrosAfectados||[]).includes(ct.nombre)}).reduce(function(s,ct){return s+(ct.comensales||0)},0);
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>RECALL '+sanitize(numLote)+'</title>'
  +'<style>body{font-family:Arial;margin:30px}h1{color:#dc2626}table{border-collapse:collapse;width:100%;margin:10px 0}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f5f5f5}.alert{background:#fef2f2;border:2px solid #dc2626;padding:16px;border-radius:8px;margin:16px 0}</style></head><body>'
  +'<h1>🚨 INFORME DE RECALL</h1><p>Fecha: '+new Date().toLocaleDateString('es-ES')+' '+new Date().toLocaleTimeString('es-ES')+'</p>'
  +'<div class="alert"><strong>PRODUCTO:</strong> '+sanitize(lote.producto)+'<br><strong>LOTE:</strong> '+sanitize(lote.numLote)+'<br><strong>PROVEEDOR:</strong> '+sanitize(lote.proveedor)+'</div>'
  +'<table><tr><th>Campo</th><th>Valor</th></tr>'
  +'<tr><td>Recepción</td><td>'+fD(lote.fechaRecepcion)+'</td></tr>'
  +'<tr><td>Caducidad</td><td>'+fD(lote.caducidad)+'</td></tr>'
  +'<tr><td>Platos afectados</td><td>'+((lote.platosUsados||[]).join(', ')||'—')+'</td></tr>'
  +'<tr><td>Centros afectados</td><td>'+((lote.centrosAfectados||[]).join(', ')||'—')+'</td></tr>'
  +'<tr><td>Comensales expuestos</td><td><strong>'+comExp+'</strong></td></tr></table>'
  +'<h2>Acciones Requeridas</h2><ol><li>Retirar producto del lote '+sanitize(lote.numLote)+'</li><li>Notificar centros</li><li>Comunicar a autoridad sanitaria</li><li>Contactar proveedor</li><li>Documentar acciones correctivas</li></ol>'
  +'<p style="font-size:10px;color:#999;margin-top:30px">Generado por Veridia HealthTech</p></body></html>';
  var w=window.open('','_blank');if(w){w.document.write(html);w.document.close();w.print()}
  else toast('Permite popups','error');
}

// ══════════════════════════════════════════════════════
//  TAB 8: MERMAS
// ══════════════════════════════════════════════════════
function rcRenderMermas(c){
  var mermas=DB.rcMermas||[];
  var totalKg=mermas.reduce(function(s,m){return s+(m.kgDesechados||0)},0);
  var avgPct=mermas.length>0?mermas.reduce(function(s,m){return s+(m.pctRechazo||0)},0)/mermas.length:0;

  // ═══ HEADER ═══
  var h='<div class="card" style="border:none;background:linear-gradient(135deg,#0E7490 0%,#0891B2 50%,#22D3EE 100%);color:#fff;margin-bottom:20px;border-radius:var(--radius)">'
  +'<div class="card-body" style="padding:22px 28px">'
  +'<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">'
  +'<div><div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">📉<h2 style="margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.3px">Control de Mermas</h2></div>'
  +'<p style="margin:0;font-size:.78rem;opacity:.8">Registro de comida desechada y análisis predictivo</p></div>'
  +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
  +'<button class="btn" style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25)" onclick="rcExportMermas()">📥 Exportar CSV</button>'
  +'<button class="btn" style="background:#fff;color:#dc2626;font-weight:700;border:none" onclick="rcNewMerma()">＋ Registrar Merma</button>'
  +'</div></div></div></div>';

  // ═══ KPI ROW ═══
  var avgColor=avgPct>25?'#dc2626':avgPct>15?'#ca8a04':'#16a34a';
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px">'
  +'<div class="card" style="padding:18px;text-align:center;border-top:3px solid var(--text)"><div style="font-size:1.6rem;font-weight:800">'+mermas.length+'</div><div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Registros</div></div>'
  +'<div class="card" style="padding:18px;text-align:center;border-top:3px solid '+avgColor+'"><div style="font-size:1.6rem;font-weight:800;color:'+avgColor+'">'+avgPct.toFixed(1)+'%</div><div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Rechazo Medio</div></div>'
  +'<div class="card" style="padding:18px;text-align:center;border-top:3px solid #ea580c"><div style="font-size:1.6rem;font-weight:800;color:#ea580c">'+totalKg.toFixed(1)+' kg</div><div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Total Desechado</div></div>'
  +'</div>';

  var platosAlerta=rcAnalyzeMermas();
  var ranking=rcPlatoRanking();

  // ═══ RANKING + ALERTAS (2 col) ═══
  if(ranking.length>=2||platosAlerta.length){
    h+='<div style="display:grid;grid-template-columns:'+(ranking.length>=2&&platosAlerta.length?'1fr 1fr':'1fr')+';gap:16px;margin-bottom:20px">';

    if(ranking.length>=2){
      h+='<div class="card" style="border-top:3px solid var(--primary)">'
      +'<div class="card-header"><span class="card-title" style="font-size:.85rem">⭐ Ranking de Platos</span>'
      +'<span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.65rem">menor desperdicio</span></div>'
      +'<div class="card-body" style="padding:0"><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.8rem"><thead><tr style="background:var(--surface2)">'
      +'<th style="padding:8px 12px;text-align:center;font-size:.65rem;text-transform:uppercase;color:var(--text-secondary);width:32px">#</th>'
      +'<th style="padding:8px;text-align:left;font-size:.65rem;text-transform:uppercase;color:var(--text-secondary)">Plato</th>'
      +'<th style="padding:8px;text-align:center;font-size:.65rem;text-transform:uppercase;color:var(--text-secondary)">Rechazo</th>'
      +'<th style="padding:8px;text-align:center;font-size:.65rem;text-transform:uppercase;color:var(--text-secondary)">Reg.</th></tr></thead><tbody>';
      ranking.slice(0,10).forEach(function(r,i){
        var pc=r.avgRechazo>25?'#dc2626':r.avgRechazo>15?'#ca8a04':'#16a34a';
        h+='<tr style="border-bottom:1px solid var(--border)">'
        +'<td style="padding:8px 12px;text-align:center;font-weight:700;color:var(--text-secondary)">'+(i+1)+'</td>'
        +'<td style="padding:8px"><strong>'+sanitize(r.plato)+'</strong></td>'
        +'<td style="padding:8px;text-align:center"><span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:.72rem;font-weight:700;background:'+(pc==='#16a34a'?'#f0fdf4':pc==='#ca8a04'?'#fffbeb':'#fef2f2')+';color:'+pc+'">'+r.avgRechazo.toFixed(1)+'%</span></td>'
        +'<td style="padding:8px;text-align:center;color:var(--text-secondary)">'+r.count+'</td></tr>';
      });
      h+='</tbody></table></div></div></div>';
    }

    if(platosAlerta.length){
      h+='<div class="card" style="border-top:3px solid #dc2626">'
      +'<div class="card-header"><span class="card-title" style="font-size:.85rem;color:#dc2626">🚨 Alertas</span>'
      +'<span class="badge" style="background:#fef2f2;color:#dc2626;font-size:.65rem">Rechazo >25% × 3+ ciclos</span></div>'
      +'<div class="card-body" style="padding:10px 18px">';
      platosAlerta.forEach(function(pa){
        h+='<div style="padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;margin:6px 0">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><strong style="font-size:.84rem">'+sanitize(pa.plato)+'</strong>'
        +'<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:.72rem;font-weight:700;background:#dc2626;color:#fff">'+pa.avgRechazo.toFixed(1)+'%</span></div>'
        +'<div style="font-size:.76rem;color:#991b1b">'+pa.ciclos+' ciclos · 💡 Revisar palatabilidad o sustituir plato</div></div>';
      });
      h+='</div></div>';
    }
    h+='</div>';
  }

  // ═══ EVOLUTION CHART ═══
  if(mermas.length>=2){
    var cd=mermas.slice(-20).map(function(m){return{label:(m.plato||'').substring(0,10),value:m.pctRechazo||0}});
    h+='<div class="card" style="margin-bottom:20px;border-top:3px solid #ea580c">'
    +'<div class="card-header"><span class="card-title" style="font-size:.85rem">📈 Evolución de Rechazo</span></div>'
    +'<div class="card-body" style="padding:14px 18px">'+svgBarChart({data:cd,height:180,color:'#dc2626',ylabel:'% Rechazo',barWidth:28})+'</div></div>';
  }

  // ═══ LOGS TABLE ═══
  var pg=paginate('rcMermas',mermas.slice().reverse(),20);
  h+='<div class="card" style="border-top:3px solid var(--text)">'
  +'<div class="card-header"><span class="card-title" style="font-size:.88rem">📋 Registros</span>'
  +'<span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.72rem">'+mermas.length+' total</span></div>';
  if(pg.items.length){
    h+='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.8rem">'
    +'<thead><tr style="background:var(--surface2)">'
    +'<th style="padding:10px 12px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Fecha</th>'
    +'<th style="padding:10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Plato</th>'
    +'<th style="padding:10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Centro</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Servidas</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Desech.</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">kg</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:#dc2626;font-weight:600">%</th>'
    +'<th style="padding:10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Motivo</th>'
    +'<th style="padding:10px 8px;width:32px"></th></tr></thead><tbody>';
    pg.items.forEach(function(m,i){
      var pct=m.pctRechazo||0;var pc=pct>25?'#dc2626':pct>15?'#ca8a04':'#16a34a';
      var origIdx=mermas.indexOf(m)!==-1?mermas.indexOf(m):mermas.findIndex(function(x){return x.id===m.id});
      var isAlt=i%2===1;
      var rowBg=pct>25?'#fef2f2':(isAlt?'var(--surface)':'transparent');
      h+='<tr style="background:'+rowBg+';border-bottom:1px solid var(--border)">'
      +'<td style="padding:10px 12px;font-variant-numeric:tabular-nums;font-size:.78rem">'+fD(m.fecha)+'</td>'
      +'<td style="padding:10px"><strong style="font-size:.8rem">'+sanitize(m.plato)+'</strong></td>'
      +'<td style="padding:10px;font-size:.78rem;color:var(--text-secondary)">'+sanitize(m.centro||'—')+'</td>'
      +'<td style="padding:10px;text-align:center;font-variant-numeric:tabular-nums">'+m.racionesServidas+'</td>'
      +'<td style="padding:10px;text-align:center;font-variant-numeric:tabular-nums;font-weight:600">'+m.racionesDesechadas+'</td>'
      +'<td style="padding:10px;text-align:center;font-variant-numeric:tabular-nums;font-size:.78rem">'+(m.kgDesechados?m.kgDesechados.toFixed(1):'<span style="color:var(--text3)">—</span>')+'</td>'
      +'<td style="padding:10px;text-align:center"><span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:.72rem;font-weight:700;background:'+(pc==='#16a34a'?'#f0fdf4':pc==='#ca8a04'?'#fffbeb':'#fef2f2')+';color:'+pc+'">'+pct.toFixed(1)+'%</span></td>'
      +'<td style="padding:10px;font-size:.76rem;color:var(--text-secondary)">'+sanitize(m.motivo||'')+'</td>'
      +'<td style="padding:10px;text-align:center"><span style="cursor:pointer;font-size:.8rem" onclick="rcDeleteMerma('+origIdx+')">🗑️</span></td></tr>';
    });
    h+='</tbody></table></div>'
    +'<div style="padding:12px 18px;border-top:1px solid var(--border)">'+pageNav('rcMermas',pg,'rRestauracion()')+'</div>';
  } else {
    h+='<div class="card-body" style="text-align:center;padding:40px"><div style="font-size:3rem;opacity:.3;margin-bottom:12px">📉</div>'
    +'<p style="color:var(--text-secondary);font-size:.85rem;margin:0">No hay mermas registradas</p></div>';
  }
  h+='</div>';
  c.innerHTML=h;
}

function rcNewMerma(){
  var centroOpts='<option value="">— Todos —</option>'+DB.rcCentros.map(function(ct){return '<option value="'+sanitize(ct.nombre)+'">'+sanitize(ct.nombre)+'</option>'}).join('');
  var motivos=['Rechazo por sabor','Rechazo por textura','Rechazo por presentación','Exceso de producción','Caducidad','Temperatura inadecuada','Contaminación','Otro'];

  openModal('📉 Registrar Merma','<div style="display:grid;gap:14px">'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">🍽️ Plato *</label><input id="rcMermaPlato" class="form-control" placeholder="Ej: Paella de marisco"></div>'
  +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">🏛️ Centro</label><select id="rcMermaCentro" class="form-control">'+centroOpts+'</select></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">📅 Fecha</label><input id="rcMermaFecha" type="date" class="form-control" value="'+new Date().toISOString().slice(0,10)+'"></div></div>'
  +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Servidas *</label><input id="rcMermaServ" type="number" class="form-control" value="100" min="1" style="font-size:1.05rem;font-weight:700;text-align:center"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Desechadas *</label><input id="rcMermaDes" type="number" class="form-control" value="0" min="0" style="font-size:1.05rem;font-weight:700;text-align:center"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">kg desechados</label><input id="rcMermaKg" type="number" class="form-control" value="" step="0.1" min="0" placeholder="Opcional" style="text-align:center"></div></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">📝 Motivo</label><select id="rcMermaMotivo" class="form-control">'+motivos.map(function(m){return '<option>'+m+'</option>'}).join('')+'</select></div>'
  +'<div id="rcMermaPct" style="padding:12px 16px;background:var(--surface2);border-radius:10px;text-align:center;font-size:.9rem"></div>'
  +'</div>','<button class="btn btn-primary" style="padding:10px 28px;font-size:.88rem" onclick="rcSaveMerma()">📉 Registrar Merma</button>');

  function upd(){var s=parseInt(($('rcMermaServ')||{}).value)||1;var d=parseInt(($('rcMermaDes')||{}).value)||0;var p=d/s*100;
    var cl=p>25?'#dc2626':p>15?'#ca8a04':'#16a34a';
    var el=$('rcMermaPct');if(el)el.innerHTML='Rechazo: <strong style="font-size:1.2rem;color:'+cl+'">'+p.toFixed(1)+'%</strong>'+(p>25?' ⚠️ Supera umbral':'');
  }
  $('rcMermaServ').addEventListener('input',upd);$('rcMermaDes').addEventListener('input',upd);upd();
}

function rcSaveMerma(){
  var plato=$('rcMermaPlato').value.trim();var s=parseInt($('rcMermaServ').value)||0;var d=parseInt($('rcMermaDes').value)||0;
  if(!plato){toast('Plato requerido','error');return}if(s<1){toast('Raciones requeridas','error');return}
  var kg=parseFloat($('rcMermaKg').value)||null;
  DB.rcMermas.push({id:Date.now(),fecha:$('rcMermaFecha').value,plato:sanitize(plato),
    centro:$('rcMermaCentro').value,racionesServidas:s,racionesDesechadas:d,
    kgDesechados:kg,pctRechazo:d/s*100,motivo:$('rcMermaMotivo').value});
  closeModal();saveData();toast('Merma registrada','success');rRestauracion();
}

function rcDeleteMerma(idx){if(!confirm('¿Eliminar registro?'))return;DB.rcMermas.splice(idx,1);saveData();toast('Eliminado','success');rRestauracion()}

function rcExportMermas(){
  if(!(DB.rcMermas||[]).length){toast('Sin registros para exportar','info');return}
  var csv='Fecha;Plato;Centro;Servidas;Desechadas;kg;% Rechazo;Motivo\n';
  (DB.rcMermas||[]).forEach(function(m){csv+=m.fecha+';'+m.plato+';'+(m.centro||'')+';'+m.racionesServidas+';'+m.racionesDesechadas+';'+(m.kgDesechados||'')+';'+m.pctRechazo.toFixed(1)+';'+(m.motivo||'')+'\n'});
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='mermas_'+new Date().toISOString().slice(0,10)+'.csv';a.click();toast('CSV exportado','success');
}

function rcAnalyzeMermas(){
  var by={};(DB.rcMermas||[]).forEach(function(m){if(!by[m.plato])by[m.plato]=[];by[m.plato].push(m.pctRechazo||0)});
  var alertas=[];
  Object.keys(by).forEach(function(p){var r=by[p];if(r.length>=3){var l3=r.slice(-3);if(l3.every(function(v){return v>25})){
    alertas.push({plato:p,avgRechazo:l3.reduce(function(s,v){return s+v},0)/3,ciclos:r.length})}}});
  return alertas;
}

// ══════════════════════════════════════════════════════
//  FICHA TÉCNICA DE PLATO
// ══════════════════════════════════════════════════════
function rcBedcaLookup(nombre){
  if(typeof BEDCA_DB==='undefined')return null;
  var q=nombre.toLowerCase();
  return BEDCA_DB.find(function(f){return f.n.toLowerCase().includes(q)});
}

function rcFichaPlato(plato){
  if(!plato)return;
  var alergenoTags=(plato.alergenos||[]).map(function(code){
    var a=ALERGENOS_14.find(function(x){return x.code===code});
    return a?'<span style="display:inline-flex;align-items:center;gap:4px;background:#fef2f2;padding:5px 10px;border-radius:8px;font-size:.78rem;border:1px solid #fecaca">'+a.icon+' <strong style="color:#e11d48">'+a.code+'</strong> '+a.name+'</span>':'';
  }).join(' ');

  var iddsiInfo=IDDSI_LEVELS.find(function(l){return l.level===(plato.iddsi!=null?plato.iddsi:7)});
  var cargaColor=(plato.carga||0)>=4?'#dc2626':(plato.carga||0)>=3?'#ca8a04':'#16a34a';

  openModal('📋 Ficha: '+sanitize(plato.nombre),'<div style="display:grid;gap:14px">'
  // Badges row
  +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
  +'<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:20px;font-size:.78rem;font-weight:700;background:'+cargaColor+'22;color:'+cargaColor+';border:1px solid '+cargaColor+'44">⚡ Carga: '+(plato.carga||0)+'/5</span>'
  +'<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:20px;font-size:.78rem;font-weight:700;background:'+(iddsiInfo?iddsiInfo.color:'#000')+';color:'+(plato.iddsi!=null&&plato.iddsi<=1?'#333':'#fff')+'">IDDSI '+(plato.iddsi!=null?plato.iddsi:7)+'</span>'
  +'<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:20px;font-size:.78rem;font-weight:600;background:var(--surface2);color:var(--text-secondary)">'+sanitize(plato.tipo||'—')+'</span></div>'
  // Alérgenos
  +(alergenoTags?'<div><div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-bottom:6px">🏷️ Alérgenos</div><div style="display:flex;flex-wrap:wrap;gap:6px">'+alergenoTags+'</div></div>'
  :'<div style="padding:10px 14px;background:#f0fdf4;border-radius:8px;font-size:.82rem;color:#166534;border:1px solid #bbf7d0">🏷️ <strong>Sin alérgenos declarados</strong></div>')
  // IDDSI detail
  +(iddsiInfo&&plato.iddsi!=null&&plato.iddsi<7?'<div style="border-left:4px solid '+iddsiInfo.color+';padding:12px 16px;background:var(--surface2);border-radius:0 10px 10px 0">'
  +'<strong style="font-size:.84rem">IDDSI '+iddsiInfo.level+': '+iddsiInfo.name+'</strong><br><span style="font-size:.82rem;color:var(--text-secondary)">'+iddsiInfo.desc+'</span>'
  +'<br><span style="font-size:.78rem;color:var(--accent)">🧪 '+iddsiInfo.test+'</span></div>':'')
  // BEDCA data
  +(function(){var bd=rcBedcaLookup(plato.nombre);if(!bd)return '';
    return '<div style="background:var(--accent-light);border-radius:10px;padding:14px 16px;border:1px solid var(--accent)22">'
    +'<div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.4px;color:var(--accent);font-weight:600;margin-bottom:8px">🔬 Datos BEDCA: '+bd.n+'</div>'
    +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">'
    +'<div style="text-align:center;background:var(--surface);border-radius:8px;padding:8px"><div style="font-size:1rem;font-weight:800;color:var(--primary)">'+Math.round(bd.k)+'</div><div style="font-size:.62rem;text-transform:uppercase;color:var(--text-secondary);font-weight:600">Kcal</div></div>'
    +'<div style="text-align:center;background:var(--surface);border-radius:8px;padding:8px"><div style="font-size:1rem;font-weight:800;color:#dc2626">'+(bd.p||0).toFixed(1)+'g</div><div style="font-size:.62rem;text-transform:uppercase;color:var(--text-secondary);font-weight:600">Prot</div></div>'
    +'<div style="text-align:center;background:var(--surface);border-radius:8px;padding:8px"><div style="font-size:1rem;font-weight:800;color:#ca8a04">'+(bd.gr||0).toFixed(1)+'g</div><div style="font-size:.62rem;text-transform:uppercase;color:var(--text-secondary);font-weight:600">Grasa</div></div>'
    +'<div style="text-align:center;background:var(--surface);border-radius:8px;padding:8px"><div style="font-size:1rem;font-weight:800;color:#0891b2">'+(bd.h||0).toFixed(1)+'g</div><div style="font-size:.62rem;text-transform:uppercase;color:var(--text-secondary);font-weight:600">HC</div></div>'
    +'</div></div>'})()
  +'</div>');
}

function rcEmailProveedor(provIdx){
  var p=(DB.rcProveedores||[])[provIdx];if(!p||!p.email){toast('Proveedor sin email','error');return}
  var body='Estimado '+p.nombre+',%0A%0AAdjuntamos pedido semanal.%0A%0AGracias.';
  window.open('mailto:'+p.email+'?subject=Pedido+semanal&body='+body);
}

function rcPlatoRanking(){
  var by={};(DB.rcMermas||[]).forEach(function(m){if(!by[m.plato])by[m.plato]={sum:0,count:0};by[m.plato].sum+=m.pctRechazo||0;by[m.plato].count++});
  var ranking=Object.keys(by).map(function(p){return{plato:p,avgRechazo:by[p].sum/by[p].count,count:by[p].count}}).sort(function(a,b){return a.avgRechazo-b.avgRechazo});
  return ranking;
}

function rcCompareMenus(id1,id2){
  var m1=DB.rcMenus.find(function(m){return m.id===id1});
  var m2=DB.rcMenus.find(function(m){return m.id===id2});
  if(!m1||!m2){toast('Selecciona dos menús','error');return}
  var dias=m1.dias||[];
  var h='<div class="modal-header"><h3>Comparar: '+sanitize(m1.nombre)+' vs '+sanitize(m2.nombre)+'</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body" style="overflow-x:auto"><table class="table" style="font-size:.78rem"><thead><tr><th>Día</th><th>'+sanitize(m1.nombre)+'</th><th>'+sanitize(m2.nombre)+'</th></tr></thead><tbody>';
  dias.forEach(function(d){
    var p1=Object.keys(m1.platos||{}).filter(function(k){return k.startsWith(d)}).map(function(k){return(m1.platos[k]||[]).map(function(p){return p.nombre}).join(', ')}).join('; ');
    var p2=Object.keys(m2.platos||{}).filter(function(k){return k.startsWith(d)}).map(function(k){return(m2.platos[k]||[]).map(function(p){return p.nombre}).join(', ')}).join('; ');
    h+='<tr><td><strong>'+d+'</strong></td><td>'+sanitize(p1||'—')+'</td><td>'+sanitize(p2||'—')+'</td></tr>';
  });
  h+='</tbody></table></div>';
  openModal(h,true);
}

// ══════════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════
function rcGetMenuStats(){
  return {centros:DB.rcCentros.length,menus:DB.rcMenus.length,proveedores:(DB.rcProveedores||[]).length,
    lotes:(DB.rcLotes||[]).length,mermas:(DB.rcMermas||[]).length,appccLogs:(DB.rcAppcc||[]).length,
    comensalesTotales:DB.rcCentros.reduce(function(s,c){return s+(c.comensales||0)},0)};
}

function rcLotesProximosACaducar(){
  var hoy=new Date();
  return (DB.rcLotes||[]).filter(function(l){
    if(!l.caducidad||l.estado==='consumido')return false;
    var dias=Math.ceil((new Date(l.caducidad)-hoy)/86400000);
    return dias<=7;
  });
}

function rcValidateIDDSI(plato,targetLevel){
  var level=IDDSI_LEVELS.find(function(l){return l.level===targetLevel});
  if(!level)return{valid:false,msg:'Nivel IDDSI inválido'};
  return{valid:true,level:targetLevel,name:level.name,test:level.test,desc:level.desc,color:level.color};
}

//  UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════
function rcGetMenuStats(){
  return {centros:DB.rcCentros.length,menus:DB.rcMenus.length,proveedores:(DB.rcProveedores||[]).length,
    lotes:(DB.rcLotes||[]).length,mermas:(DB.rcMermas||[]).length,appccLogs:(DB.rcAppcc||[]).length,
    comensalesTotales:DB.rcCentros.reduce(function(s,c){return s+(c.comensales||0)},0)};
}

function rcLotesProximosACaducar(){
  var hoy=new Date();
  return (DB.rcLotes||[]).filter(function(l){
    if(!l.caducidad||l.estado==='consumido')return false;
    var dias=Math.ceil((new Date(l.caducidad)-hoy)/86400000);
    return dias<=7;
  });
}

function rcValidateIDDSI(plato,targetLevel){
  var level=IDDSI_LEVELS.find(function(l){return l.level===targetLevel});
  if(!level)return{valid:false,msg:'Nivel IDDSI inválido'};
  return{valid:true,level:targetLevel,name:level.name,test:level.test,desc:level.desc,color:level.color};
}

function rcCalcScaling(recipeBase,comensalesBase,comensalesTarget){
  var factor=comensalesTarget/comensalesBase;
  return{factor:factor,ingredientes:(recipeBase||[]).map(function(ing){
    var neto=ing.cantidad*factor;
    var fcKey=Object.keys(FACTORES_MERMA).find(function(k){return ing.nombre.toLowerCase().includes(k.toLowerCase())});
    var fc=fcKey?FACTORES_MERMA[fcKey]:1.0;
    return{nombre:ing.nombre,cantidadBase:ing.cantidad,cantidadNeta:neto,factorCorreccion:fc,cantidadBruta:neto*fc,sinFactor:!fcKey};
  })};
}

function rcCalcWorkloadScore(platos){
  var total=(platos||[]).reduce(function(s,p){return s+(p.carga||CARGA_TRABAJO[p.tipo]||2)},0);
  return{score:total,overload:total>12,platos:platos?platos.length:0};
}

// RC4: Menu cycle rotation
function rcCicloMenu(){
  if(!DB.rcMenus.length||!rcSelCentro){toast('Selecciona un centro con menús','error');return}
  var menus=DB.rcMenus.filter(function(m){return m.centroId===rcSelCentro&&m.estado==='publicado'});
  if(menus.length<2){toast('Necesitas al menos 2 menús publicados','error');return}
  var semanas=parseInt(prompt('¿Semanas de ciclo? (2-8)',menus.length))||menus.length;
  if(semanas<2||semanas>8){toast('Ciclo entre 2 y 8 semanas','error');return}
  if(!DB.rcCiclos)DB.rcCiclos=[];
  DB.rcCiclos.push({id:'ciclo_'+Date.now(),centroId:rcSelCentro,semanas:semanas,
    menuIds:menus.slice(0,semanas).map(function(m){return m.id}),
    inicioFecha:new Date().toISOString().slice(0,10),activo:true,createdAt:new Date().toISOString().slice(0,10)});
  saveData();toast('Ciclo de '+semanas+' semanas creado','success');rRestauracion();
}

function rcGetCurrentCycleMenu(centroId){
  if(!DB.rcCiclos)return null;
  var ciclo=DB.rcCiclos.find(function(c){return c.centroId===centroId&&c.activo});
  if(!ciclo)return null;
  var semanasPasadas=Math.floor((new Date()-new Date(ciclo.inicioFecha))/(7*86400000));
  var idx=semanasPasadas%ciclo.semanas;
  var menuId=ciclo.menuIds[idx];
  return{ciclo:ciclo,semanaActual:idx+1,menuId:menuId,menu:DB.rcMenus.find(function(m){return m.id===menuId})};
}
