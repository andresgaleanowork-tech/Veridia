// ═══════════════════════════════════════════
//  VERIDIA CONFIG — Centralized API Management
//  Keys loaded from localStorage (set via SuperAdmin)
//  NEVER hardcoded in production
// ═══════════════════════════════════════════

var VERIDIA_CONFIG=(function(){
  var defaults={
    firebase_apiKey:'AIzaSyC70dqaMS6EuUfBGb9B4YJGvz7xJe3qJpk',
    firebase_projectId:'nutrisuite-6e44a',
    firebase_storageBucket:'nutrisuite-6e44a.firebasestorage.app',
    firebase_messagingSenderId:'887176412013',
    firebase_appId:'1:887176412013:web:669eb00481eac96d1e3864',
    firebase_measurementId:'G-5KXFHFRGLD',
    gemini_key:'',
    gemini_model:'gemini-2.0-flash-lite',
    gemini_enabled:true,
    usda_key:'DEMO_KEY',
    usda_enabled:true,
    off_enabled:true,
    themealdb_enabled:true,
    backend_url:'',
    version:'5.2.0'
  };
  // Load saved config
  var saved={};
  try{saved=JSON.parse(localStorage.getItem('veridia_api_config')||'{}');}catch(e){console.warn('[Veridia Config]',e.message||e)}
  // Merge: saved overrides defaults
  var cfg={};
  Object.keys(defaults).forEach(function(k){cfg[k]=saved.hasOwnProperty(k)?saved[k]:defaults[k]});
  // Public API
  return{
    get:function(key){return cfg[key]},
    set:function(key,val){cfg[key]=val;try{localStorage.setItem('veridia_api_config',JSON.stringify(cfg))}catch(e){console.warn('[Veridia Config]',e.message||e)}},
    getAll:function(){return JSON.parse(JSON.stringify(cfg))},
    setAll:function(obj){Object.keys(obj).forEach(function(k){if(defaults.hasOwnProperty(k))cfg[k]=obj[k]});try{localStorage.setItem('veridia_api_config',JSON.stringify(cfg))}catch(e){console.warn('[Veridia Config]',e.message||e)}},
    reset:function(){cfg=JSON.parse(JSON.stringify(defaults));try{localStorage.removeItem('veridia_api_config')}catch(e){console.warn('[Veridia Config]',e.message||e)}},
    keys:function(){return Object.keys(defaults)},
    isConfigured:function(key){return!!cfg[key]&&cfg[key]!==''&&cfg[key]!=='DEMO_KEY'}
  };
})();

// --- Firebase Init (lazy-loaded) ---
var FB=null,fbAuth=null,fbDB=null;
var _firebaseLoaded=false;

function loadFirebaseSDK(){
  if(_firebaseLoaded)return Promise.resolve();
  var sdkBase='https://www.gstatic.com/firebasejs/10.12.2/';
  var scripts=['firebase-app-compat.js','firebase-auth-compat.js','firebase-firestore-compat.js','firebase-analytics-compat.js'];
  return Promise.all(scripts.map(function(s){
    return new Promise(function(resolve,reject){
      var el=document.createElement('script');
      el.src=sdkBase+s;el.onload=resolve;el.onerror=reject;
      document.head.appendChild(el);
    });
  })).then(function(){
    _firebaseLoaded=true;
    try{
      var config={apiKey:"AIzaSyC70dqaMS6EuUfBGb9B4YJGvz7xJe3qJpk",authDomain:"nutrisuite-6e44a.firebaseapp.com",projectId:"nutrisuite-6e44a",storageBucket:"nutrisuite-6e44a.firebasestorage.app",messagingSenderId:"887176412013",appId:"1:887176412013:web:669eb00481eac96d1e3864",measurementId:"G-5KXFHFRGLD"};
      FB=firebase.initializeApp(config);
      fbAuth=firebase.auth();
      fbDB=firebase.firestore();
      if(typeof firebase.analytics==='function')firebase.analytics();
      console.debug('✅ Firebase connected:',config.projectId);
    }catch(e){console.warn('Firebase init skipped:',e.message)}
  }).catch(function(e){console.warn('Firebase SDK load failed:',e.message||e)});
}

// --- Gemini AI ---
var GEMINI_KEY=VERIDIA_CONFIG.get('gemini_key')||'';
var GEMINI_MODEL='gemini-2.0-flash-lite';
var GEMINI_URL='https://generativelanguage.googleapis.com/v1beta/models/';
var API_BASE=''; // Set to backend URL when available (e.g., 'http://localhost:3456')
// Auto-detect backend
(function(){try{
  var loc=window.location;
  if(loc.port==='3456'||loc.hostname!=='localhost'&&!loc.protocol.startsWith('file')){
    API_BASE=loc.origin;
    console.debug('🔗 Backend detected:',API_BASE);
  }
}catch(e){console.warn('[Veridia]',e.message||e)}})();

function geminiAsk(prompt,opts){
  // Check if Gemini is enabled and configured
  if(typeof VERIDIA_CONFIG!=='undefined'){
    if(!VERIDIA_CONFIG.get('gemini_enabled'))return Promise.resolve('⚠️ Gemini IA deshabilitada. Activar desde SuperAdmin → APIs & Keys.');
    if(!VERIDIA_CONFIG.get('gemini_key')&&!API_BASE)return Promise.resolve('⚠️ Gemini sin API key. Configurar en SuperAdmin → APIs & Keys.');
  }
  opts=opts||{};
  var systemPrompt=opts.system||'Eres un asistente de nutrición clínica profesional. Responde siempre en español, de forma concisa y clínicamente precisa. Usa formato con negritas (**texto**) y listas cuando corresponda.';
  var maxTokens=opts.maxTokens||800;
  var gModel=typeof VERIDIA_CONFIG!=='undefined'?(VERIDIA_CONFIG.get('gemini_model')||'gemini-2.0-flash-lite'):(opts.model||GEMINI_MODEL);
  var gKey=typeof VERIDIA_CONFIG!=='undefined'?(VERIDIA_CONFIG.get('gemini_key')||GEMINI_KEY):GEMINI_KEY;

  // Use backend proxy if available
  if(API_BASE){
    return fetch(API_BASE+'/api/proxy/gemini',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({prompt:prompt,context:systemPrompt})
    }).then(function(r){return r.json()}).then(function(d){return d.text||d.error||'Sin respuesta'})
    .catch(function(){return geminiAskDirect(prompt,gKey,gModel,systemPrompt,maxTokens,opts)});
  }
  return geminiAskDirect(prompt,gKey,gModel,systemPrompt,maxTokens,opts);
}

function geminiAskDirect(prompt,key,model,systemPrompt,maxTokens,opts){
  opts=opts||{};
  return fetch(GEMINI_URL+model+':generateContent?key='+key,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      system_instruction:{parts:[{text:systemPrompt}]},
      contents:[{parts:[{text:prompt}]}],
      generationConfig:{maxOutputTokens:maxTokens,temperature:opts.temperature||0.7}
    })
  })
  .then(function(r){
    if(r.status===429)throw new Error('QUOTA_EXCEEDED');
    if(!r.ok)throw new Error('API_ERROR_'+r.status);
    return r.json();
  })
  .then(function(d){
    if(!d.candidates||!d.candidates[0])throw new Error('NO_RESPONSE');
    return d.candidates[0].content.parts[0].text;
  });
}

// Build patient context for AI prompts

// ═══════════════════════════════════════════
//  SEC-F5: Anonymize patient data before sending to Gemini
//  RGPD Art. 9 — Special category data (health) protection
//  Never send: real name, DNI, email, phone, address
// ═══════════════════════════════════════════
function anonymizeForAI(text){
  if(!text)return text;
  // Remove DNI patterns (8 digits + letter, or similar)
  text=text.replace(/\b\d{7,8}[A-Za-z]\b/g,'[DNI_REDACTED]');
  // Remove email patterns
  text=text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,'[EMAIL_REDACTED]');
  // Remove phone patterns (various formats)
  text=text.replace(/\+?\d[\d\s.-]{7,14}\d/g,'[TEL_REDACTED]');
  // Remove common address patterns
  text=text.replace(/(?:Calle|Av\.|Avda\.|C\/|Paseo|Plaza)\s+[^,;.\n]+/gi,'[DIR_REDACTED]');
  return text;
}

function buildPatientContext(patId){
  var p=gP(patId);if(!p)return'Sin paciente seleccionado.';
  var ch=DB.clinicalHistories.find(function(h){return h.pacienteId===patId});
  var antro=DB.antropometrias.filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)})[0];
  var anal=DB.analiticas.filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)})[0];
  var ctx='PACIENTE: Paciente_'+p.id+', '+age(p.fechaNacimiento)+'años, '+(p.sexo||'')+'.';
  if(p.motivoConsulta||p.motivo_consulta)ctx+=' Motivo: '+(p.motivoConsulta||p.motivo_consulta)+'.';
  if(ch){
    if(ch.antecedentes)ctx+=' Antecedentes: '+ch.antecedentes+'.';
    if(ch.alergias&&ch.alergias!=='Ninguna conocida')ctx+=' Alergias: '+ch.alergias+'.';
    if(ch.medicacion&&ch.medicacion!=='Ninguna')ctx+=' Medicación: '+ch.medicacion+'.';
  }
  if(antro)ctx+=' Antropometría: peso '+antro.peso+'kg, talla '+antro.altura+'cm, IMC '+antro.imc+', cintura '+antro.cintura+'cm'+(antro.pantorrilla?', pantorrilla '+antro.pantorrilla+'cm':'')+'.';
  if(anal){
    var alertas=anal.marcadores.filter(function(m){return m.alerta});
    if(alertas.length)ctx+=' Alertas analíticas: '+alertas.map(function(m){return m.nombre+' '+m.valor+m.unidad+' ('+m.rango+')'}).join(', ')+'.';
  }
  return anonymizeForAI(ctx);
}

// --- Firestore helpers ---
function fbSave(collection,id,data){
  if(!fbDB)return Promise.resolve();
  return fbDB.collection(collection).doc(id).set(data,{merge:true}).catch(function(e){console.warn('fbSave error:',e.message)});
}
function fbGet(collection,id){
  if(!fbDB)return Promise.resolve(null);
  return fbDB.collection(collection).doc(id).get().then(function(doc){return doc.exists?doc.data():null}).catch(function(){return null});
}
function fbList(collection,where,orderBy,limit){
  if(!fbDB)return Promise.resolve([]);
  var ref=fbDB.collection(collection);
  if(where)where.forEach(function(w){ref=ref.where(w[0],w[1],w[2])});
  if(orderBy)ref=ref.orderBy(orderBy[0],orderBy[1]||'asc');
  if(limit)ref=ref.limit(limit);
  return ref.get().then(function(snap){return snap.docs.map(function(d){var data=d.data();data._id=d.id;return data})}).catch(function(){return[]});
}
function fbDelete(collection,id){
  if(!fbDB)return Promise.resolve();
  return fbDB.collection(collection).doc(id).delete().catch(function(e){console.warn('fbDelete:',e.message)});
}

// --- Sync DB to Firestore (progressive migration) ---
var fbSyncTimer=null;
function fbSyncDB(){
  // Save to localStorage ALWAYS (works offline)
  try{
    var snapshot={
      patients:DB.patients,clinicalHistories:DB.clinicalHistories,
      antropometrias:DB.antropometrias,analiticas:DB.analiticas,
      appointments:DB.appointments,invoices:DB.invoices,
      recipes:DB.recipes,alerts:DB.alerts,
      cashSession:DB.cashSession,auditLog:DB.auditLog,
      mealPlans:typeof mealPlans!=='undefined'?mealPlans:[],
      planTemplates:typeof planTemplates!=='undefined'?planTemplates:[],
      anamnesisData:DB.anamnesisData||{},
      favFoods:DB.favFoods||[],customPlatos:DB.customPlatos||[],
      patNotes:typeof patNotes!=='undefined'?patNotes:{},
      chatDB:typeof chatDB!=='undefined'?chatDB:{},
      formulaResults:DB.formulaResults||{},
      gastos:DB.gastos||[],soporteNutricional:typeof SN!=='undefined'?SN.data:{},snMonitor:DB.snMonitor||{},alimentosCustom:DB.alimentosCustom||[],gastosRecurrentes:DB.gastosRecurrentes||[],horariosBlock:DB.horariosBlock||[],presupuesto:DB.presupuesto||{},iaHistory:DB.iaHistory||[],alimentosUsados:DB.alimentosUsados||{},
      rcCentros:DB.rcCentros||[],rcMenus:DB.rcMenus||[],rcProveedores:DB.rcProveedores||[],rcLotes:DB.rcLotes||[],rcMermas:DB.rcMermas||[],rcAppcc:DB.rcAppcc||[],rcNextCentroId:DB.rcNextCentroId||1,rcNextMenuId:DB.rcNextMenuId||1,
      feedback:DB.feedback||[],productos:DB.productos||[],inventario:DB.inventario||[],
      diarioData:DB.diarioData||{},
      sintomasData:DB.sintomasData||{},
      nextPId:DB.nextPId,nextAId:DB.nextAId,nextIId:DB.nextIId,
      _ts:Date.now()
    };
    localStorage.setItem('veridia_db',JSON.stringify(snapshot));
  }catch(e){console.warn('[Veridia]',e.message||e)}
  // Also sync to Firebase cloud (if available)
  if(!fbDB||!currentUser)return;
  clearTimeout(fbSyncTimer);
  fbSyncTimer=setTimeout(function(){
    fbSave('clinics','clinic_default',{
      patients:DB.patients,clinicalHistories:DB.clinicalHistories,
      antropometrias:DB.antropometrias,analiticas:DB.analiticas,
      appointments:DB.appointments,invoices:DB.invoices,
      recipes:DB.recipes,alerts:DB.alerts,cashSession:DB.cashSession,
      mealPlans:typeof mealPlans!=='undefined'?mealPlans:[],
      updatedAt:new Date().toISOString(),
      planTemplates:typeof planTemplates!=='undefined'?planTemplates:[],
      updatedBy:currentUser?currentUser.name:'—'
    });
  },3000);
}

// --- Load DB from Firestore on login ---
function fbLoadDB(){
  if(!fbDB)return Promise.resolve(false);
  // Add timeout to prevent hanging in sandboxed environments
  return Promise.race([
    fbLoadDBInner(),
    new Promise(function(r){setTimeout(function(){r(false)},4000)})
  ]);
}
function fbLoadDBInner(){
  return fbGet('clinics','clinic_default').then(function(data){
    if(!data)return false;
    // Only load if remote has data
    if(data.patients&&data.patients.length){
      DB.patients=data.patients;
      DB.clinicalHistories=data.clinicalHistories||[];
      DB.antropometrias=data.antropometrias||[];
      DB.analiticas=data.analiticas||[];
      DB.appointments=data.appointments||[];
      DB.invoices=data.invoices||[];
      DB.recipes=data.recipes||[];
      DB.alerts=data.alerts||[];
      if(data.cashSession)DB.cashSession=data.cashSession;
      if(data.mealPlans&&typeof mealPlans!=='undefined'){mealPlans.length=0;data.mealPlans.forEach(function(p){mealPlans.push(p)})}
      if(data.formulaResults)DB.formulaResults=data.formulaResults;
      if(data.diarioData)DB.diarioData=data.diarioData;
      if(data.sintomasData)DB.sintomasData=data.sintomasData;
      // Recalculate nextIds
      DB.nextPId=Math.max(...DB.patients.map(function(p){return p.id||0}),0)+1;
      DB.nextAId=Math.max(...DB.appointments.map(function(a){return a.id||0}),0)+1;
      DB.nextIId=Math.max(...DB.invoices.map(function(i){return i.id||0}),0)+1;
      console.debug('☁️ Loaded from Firestore:',DB.patients.length,'patients');
      return true;
    }
    return false;
  });
}


