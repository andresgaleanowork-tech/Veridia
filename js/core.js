// ===== ERROR BOUNDARY GLOBAL =====
window.addEventListener('error', function(e) {
  console.warn('[Veridia Error]', e.message, e.filename, e.lineno);
  // Show non-blocking notification
  var t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:60px;right:20px;background:#dc2626;color:#fff;padding:10px 18px;border-radius:10px;font-size:.75rem;z-index:99999;max-width:350px;box-shadow:0 4px 16px rgba(0,0,0,.3)';
  t.innerHTML = '⚠️ Error recuperable: <strong>' + (e.message || 'desconocido').substring(0, 80) + '</strong><br><span style="font-size:.6rem;opacity:.7">El sistema sigue funcionando. Recargue si persiste.</span>';
  document.body.appendChild(t);
  setTimeout(function() { t.style.opacity = '0'; t.style.transition = 'opacity .5s'; setTimeout(function() { t.remove() }, 600) }, 6000);
  e.preventDefault(); // Don't kill the app
});
window.addEventListener('unhandledrejection', function(e) {
  console.warn('[Veridia Promise]', e.reason);
  e.preventDefault();
});

// ===== DATA =====
const DB={
patients:[],
clinicalHistories:[], // Reservado para futuro HC estructurada (hoy datos clínicos en anamnesisData, patNotes, formulaResults)
antropometrias:[],
analiticas:[],
appointments:[],
invoices:[],
cashSession:{id:1,fecha:'',estado:'Abierta',saldoInicial:0,movimientos:[]},
recipes:[],
alerts:[],
bedcaFoods:[],
auditLog:[],
nextPId:1,nextAId:1,nextIId:1,
gastos:[],productos:[],inventario:[],snMonitor:{},alimentosCustom:[],gastosRecurrentes:[],horariosBlock:[],presupuesto:{},iaHistory:[],alimentosUsados:{},
rcCentros:[],rcMenus:[],rcProveedores:[],rcLotes:[],rcMermas:[],rcAppcc:[],rcNextCentroId:1,rcNextMenuId:1,feedback:[]
};
DB.cashSession.fecha=new Date().toISOString().slice(0,10);

// --- Auto-load from localStorage on startup ---
(function(){
  try{
    var saved=JSON.parse(localStorage.getItem('veridia_db'));
    if(saved&&saved.patients&&saved.patients.length){
      DB.patients=saved.patients;
      DB.clinicalHistories=saved.clinicalHistories||[];
      DB.antropometrias=saved.antropometrias||[];
      DB.analiticas=saved.analiticas||[];
      DB.appointments=saved.appointments||[];
      DB.invoices=saved.invoices||[];
      DB.recipes=saved.recipes||[];
      DB.alerts=saved.alerts||[];
      DB.auditLog=saved.auditLog||[];
      if(saved.cashSession)DB.cashSession=saved.cashSession;
      if(saved.anamnesisData)DB.anamnesisData=saved.anamnesisData;
      if(saved.favFoods)DB.favFoods=saved.favFoods;
      if(saved.customPlatos)DB.customPlatos=saved.customPlatos;
      if(saved.formulaResults)DB.formulaResults=saved.formulaResults;
      if(saved.diarioData)DB.diarioData=saved.diarioData;
      if(saved.sintomasData)DB.sintomasData=saved.sintomasData;
      if(saved.nextPId)DB.nextPId=saved.nextPId;
      if(saved.nextAId)DB.nextAId=saved.nextAId;
      if(saved.nextIId)DB.nextIId=saved.nextIId;
      console.debug('💾 Loaded from localStorage:',DB.patients.length,'patients');
    }
  }catch(e){console.warn('[Veridia]',e.message||e)}
})();

// ===== NAV =====
const NAV=[
{s:'Principal',items:[{id:'dashboard',ic:'grid',l:'Dashboard'},{id:'agenda',ic:'cal',l:'Agenda',b:3},{id:'pacientes',ic:'users',l:'Pacientes'}]},
{s:'Clínico',items:[{id:'historia',ic:'clip',l:'Historia Clínica'},{id:'antropometria',ic:'act',l:'Antropometría'},{id:'analiticas',ic:'flask',l:'Analíticas'},{id:'alertas',ic:'warn',l:'Alertas Clínicas'}]},
{s:'Nutrición Clínica',items:[{id:'formula',ic:'calc',l:'Fórmula Clínica'},{id:'desarrollada',ic:'cpu',l:'Desarrollada'},{id:'bedca',ic:'db',l:'Base de Datos Alimentos'},{id:'recetas',ic:'book',l:'Recetas'},{id:'planes',ic:'lay',l:'Planes Alimentarios'}]},
{s:'Nutrición Institucional',items:[{id:'restauracion',ic:'users',l:'Restauración Colectiva'},{id:'soporte',ic:'act',l:'Soporte Nutricional UCI'}]},
{s:'Gestión',items:[{id:'facturacion',ic:'file',l:'Facturación',b:1},{id:'caja',ic:'dollar',l:'Caja'},{id:'contabilidad',ic:'dollar',l:'Contabilidad'},{id:'mensajes',ic:'send',l:'Mensajes'},{id:'ia',ic:'cpu',l:'IA Copilot'},{id:'auditoria',ic:'shield',l:'Auditoría'},{id:'settings',ic:'calc',l:'⚙️ Ajustes'}]}
];

var curMod='dashboard',selPat=null;

// ===== HELPERS =====
const $=id=>document.getElementById(id);
const gP=id=>DB.patients.find(p=>p.id===id);
const age=d=>{const b=new Date(d);return Math.floor((new Date()-b)/31557600000)};
const fD=d=>d?d.split('-').reverse().join('/'):'—';
const ini=(n,a)=>(n[0]||'')+(a?a.split(' ')[0][0]:'');
const aCol=id=>['#0a6e5c','#2563eb','#7c3aed','#db2777','#ea580c','#0891b2'][id%6];
const imcCat=v=>v<18.5?{l:'Bajo peso',b:'badge-info'}:v<25?{l:'Normopeso',b:'badge-success'}:v<30?{l:'Sobrepeso',b:'badge-warning'}:v<35?{l:'Obesidad I',b:'badge-warning'}:v<40?{l:'Obesidad II',b:'badge-danger'}:{l:'Obesidad III',b:'badge-danger'};
const cashTotals=()=>{const m=DB.cashSession.movimientos;return{ing:m.filter(x=>x.tipo==='Ingreso').reduce((s,x)=>s+x.importe,0),egr:m.filter(x=>x.tipo==='Egreso').reduce((s,x)=>s+x.importe,0),efIng:m.filter(x=>x.tipo==='Ingreso'&&x.metodo==='Efectivo').reduce((s,x)=>s+x.importe,0),efEgr:m.filter(x=>x.tipo==='Egreso'&&x.metodo==='Efectivo').reduce((s,x)=>s+x.importe,0)}};

function toast(m,t='success'){const c=$('toastContainer'),e=document.createElement('div');e.className=`toast toast-${t}`;e.innerHTML=`${t==='success'?IC.chk:t==='error'?IC.x:'ℹ️'} ${m}`;c.appendChild(e);requestAnimationFrame(()=>e.classList.add('show'));setTimeout(()=>{e.classList.remove('show');setTimeout(()=>e.remove(),350)},3200);if(t==='success')fbSyncDB()}

// Save state indicator
function showSaved(){var d=$('saveDot');if(!d)return;d.className='save-dot show';d.querySelector('span').textContent='Guardado';d.querySelector('.dot').style.background='var(--success)';clearTimeout(d._t);d._t=setTimeout(function(){d.className='save-dot'},2500)}
// showSaving() removed — was never invoked
function openModal(h,lg){const o=$('modalOverlay'),m=$('modalContent');m.className='modal'+(lg?' modal-lg':'');m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.innerHTML=h;o.classList.add('show');var fc=m.querySelector('input,button,select,textarea,[tabindex]');if(fc)setTimeout(function(){fc.focus()},100)}
function closeModal(){$('modalOverlay').classList.remove('show');var m=$('modalContent');if(m){m.removeAttribute('aria-modal');m.removeAttribute('role')}}
function toggleSidebar(){const s=$('sidebar');if(window.innerWidth<=768)s.classList.toggle('mobile-open');else s.classList.toggle('collapsed')}

function renderNav(){
  $('sidebarNav').innerHTML=NAV.map(s=>`<div class="nav-section" role="group" aria-label="${s.s}"><div class="nav-section-title">${s.s}</div>${s.items.map(i=>`<div class="nav-item ${curMod===i.id?'active':''}" role="link" tabindex="0" aria-current="${curMod===i.id?'page':'false'}" onclick="navigate('${i.id}')" onkeydown="if(event.key==='Enter')navigate('${i.id}')">${IC[i.ic]}<span class="nav-item-text">${i.l}</span>${i.b?`<span class="nav-badge" aria-label="${i.b} pendientes">${i.b}</span>`:''}</div>`).join('')}</div>`).join('');
}

function navigate(id,p){
  if(_formDirty){if(!confirm('Hay cambios sin guardar. ¿Continuar?'))return;_formDirty=false}
  curMod=id;renderNav();
  const T={dashboard:t('dashboard'),agenda:t('agenda'),pacientes:t('patients'),historia:t('clinical_history'),antropometria:t('anthropometry'),analiticas:t('analytics'),alertas:t('clinical_alerts'),formula:t('clinical_formula'),desarrollada:t('desarrollada'),bedca:t('food_database'),recetas:t('recipes'),planes:t('meal_plans'),restauracion:t('restauracion'),facturacion:t('billing'),caja:t('cash_register'),mensajes:t('messages'),ia:t('ia_copilot'),auditoria:t('audit')};
  $('headerTitle').textContent=T[id]||id;
  // G7: Patient breadcrumb for patient-dependent modules
  var patMods=['historia','antropometria','analiticas','formula','desarrollada','planes','soporte','alertas'];
  var hdr=$('headerTitle');
  if(patMods.includes(id)&&selPat){
    var _bp=gP(selPat);
    if(_bp)hdr.innerHTML=(T[id]||id)+' <span style="font-size:.72rem;font-weight:400;color:var(--text2);margin-left:8px">👤 '+sanitize(_bp.nombre)+' '+sanitize(_bp.apellidos)+'</span>';
  }
  $('mainContent').scrollTop=0;
  const R={dashboard:typeof rDash==='function'?rDash:null,agenda:typeof rAgenda==='function'?rAgenda:null,pacientes:typeof rPat==='function'?rPat:null,historia:typeof rHist==='function'?rHist:null,antropometria:typeof rAntro==='function'?rAntro:null,analiticas:typeof rAnal==='function'?rAnal:null,alertas:typeof rAlerts==='function'?rAlerts:null,formula:typeof rFormula==='function'?rFormula:null,soporte:typeof rSoporteNutricional==='function'?rSoporteNutricional:null,desarrollada:typeof rDesarrollada==='function'?rDesarrollada:null,bedca:typeof rBEDCA==='function'?rBEDCA:null,recetas:typeof rRecetas==='function'?rRecetas:null,planes:typeof rPlanes==='function'?rPlanes:null,restauracion:typeof rRestauracion==='function'?rRestauracion:null,facturacion:typeof rFact==='function'?rFact:null,caja:typeof rCaja==='function'?rCaja:null,contabilidad:typeof rContabilidad==='function'?rContabilidad:null,mensajes:typeof rMensajes==='function'?rMensajes:null,ia:typeof rIA==='function'?rIA:null,auditoria:typeof rAudit==='function'?rAudit:null,settings:typeof rSettings==='function'?rSettings:null};
  if(R[id])R[id](p);
  if(typeof updTodayBadge==='function')updTodayBadge();
  if(window.innerWidth<=768)$('sidebar').classList.remove('mobile-open');
}

function updAlertDot(){const n=DB.alerts.filter(a=>a.estado==='pendiente').length;const d=$('alertDot');if(d)d.style.display=n>0?'block':'none'}
function updTodayBadge(){var today=new Date().toISOString().slice(0,10);var count=DB.appointments.filter(function(a){return a.fecha===today&&a.estado!=='Cancelada'&&a.estado!=='Realizada'}).length;var el=$('todayBadge');if(el){el.textContent=count>0?count+'📅':'';el.style.display=count>0?'inline-flex':'none'}}
function handleGlobalSearch(e){if(e.key==='Enter'){const q=e.target.value.trim().toLowerCase();if(!q)return;
  // Search in patients
  const r=DB.patients.filter(p=>{
    var txt=(p.nombre+' '+p.apellidos+' '+(p.dni||'')+' '+(p.email||'')+' '+(p.telefono||'')+' '+(p.motivoConsulta||'')+' '+(p.tags||[]).join(' ')).toLowerCase();
    return txt.includes(q);
  });
  if(r.length===1){selPat=r[0].id;navigate('historia');e.target.value='';return}
  if(r.length>1){navigate('pacientes',{search:q});e.target.value='';return}
  // Search in appointments
  var appt=DB.appointments.find(a=>(a.asunto||'').toLowerCase().includes(q));
  if(appt){selPat=appt.pacienteId;navigate('agenda');e.target.value='';return}
  // Search in recipes
  var rec=DB.recipes.find(r=>(r.nombre||'').toLowerCase().includes(q));
  if(rec){navigate('recetas');e.target.value='';return}
  // Search in meal plans
  var plan=(typeof mealPlans!=='undefined')?mealPlans.find(function(mp){return(mp.nombre||'').toLowerCase().includes(q)}):null;
  if(plan){selPat=plan.pacienteId;navigate('planes');e.target.value='';return}
  // Search in notes
  if(typeof patNotes!=='undefined'){for(var pid in patNotes){var found=patNotes[pid].find(function(n){return(n.texto||'').toLowerCase().includes(q)});if(found){selPat=+pid;navigate('historia');e.target.value='';return}}}
  // No results
  toast('Sin resultados para "'+q+'"','info');e.target.value=''}}

// ===== PATIENT SELECTOR =====
const patSel=(current)=>`<select style="max-width:280px" onchange="selPat=+this.value;navigate('${curMod}')">${DB.patients.filter(p=>p.activo).map(p=>`<option value="${p.id}" ${p.id===current?'selected':''}>${p.nombre} ${p.apellidos}</option>`).join('')}</select>`;

// Guard: require a patient to be selected and exist
function requirePatient(){
  if(!DB.patients.length){
    $('mainContent').innerHTML='<div class="fade-in"><div class="empty-state"><div class="empty-icon">👥</div><h3>Sin pacientes registrados</h3><p>Registre su primer paciente para acceder a este módulo.</p><button class="btn btn-primary" style="margin-top:14px" onclick="navigate(\'pacientes\')">+ Nuevo paciente</button></div></div>';
    return null;
  }
  if(!selPat||!gP(selPat)){selPat=DB.patients.find(p=>p.activo)?.id||DB.patients[0]?.id}
  var p=gP(selPat);
  if(!p){
    $('mainContent').innerHTML='<div class="fade-in"><div class="empty-state"><div class="empty-icon">⚠️</div><h3>Paciente no encontrado</h3><p>Seleccione un paciente activo.</p><button class="btn btn-primary" style="margin-top:14px" onclick="navigate(\'pacientes\')">Ver pacientes</button></div></div>';
    return null;
  }
  return p;
}

// ===== PAGINACIÓN =====
var _pageState={};
function paginate(key,items,perPage){
  perPage=perPage||25;
  if(!_pageState[key])_pageState[key]={page:0};
  var st=_pageState[key];
  var total=items.length,pages=Math.ceil(total/perPage);
  if(st.page>=pages)st.page=Math.max(0,pages-1);
  var start=st.page*perPage,end=start+perPage;
  var paged=items.slice(start,end);
  var info={items:paged,page:st.page,pages:pages,total:total,start:start+1,end:Math.min(end,total)};
  return info;
}
// G13: Items per page selector
function perPageSelector(key,currentPP,refreshFn){
  return '<select style="font-size:.7rem;padding:2px 6px;border-radius:4px;border:1px solid var(--border);margin-left:8px" onchange="_pagePerPage[\''+key+'\']=+this.value;_pageState[\''+key+'\']={page:0};'+refreshFn+'">'
  +[10,20,50,100].map(function(n){return '<option value="'+n+'" '+(n===currentPP?'selected':'')+'>'+n+'/pág</option>'}).join('')+'</select>';
}
var _pagePerPage={};
function pageNav(key,info,refreshFn){
  if(info.pages<=1)return'';
  return'<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;font-size:.78rem">'
    +'<button class="btn btn-ghost btn-xs" onclick="_pageState[\''+key+'\'].page=0;'+refreshFn+'" '+(info.page===0?'disabled':'')+'>«</button>'
    +'<button class="btn btn-ghost btn-xs" onclick="_pageState[\''+key+'\'].page--;'+refreshFn+'" '+(info.page===0?'disabled':'')+'>‹ Anterior</button>'
    +'<span style="color:var(--text2)">'+info.start+'–'+info.end+' de '+info.total+'</span>'
    +'<button class="btn btn-ghost btn-xs" onclick="_pageState[\''+key+'\'].page++;'+refreshFn+'" '+(info.page>=info.pages-1?'disabled':'')+'>Siguiente ›</button>'
    +'<button class="btn btn-ghost btn-xs" onclick="_pageState[\''+key+'\'].page='+(info.pages-1)+';'+refreshFn+'" '+(info.page>=info.pages-1?'disabled':'')+'>»</button>'
    +'</div>';
}

// ===== VALIDACIÓN =====
function isValidEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ===== AUTO-SAVE PERIÓDICO =====
var _lastSaveTime=null;
setInterval(function(){
  if(typeof fbSyncDB==='function'){fbSyncDB();_lastSaveTime=new Date()}
},60000); // cada 60 segundos

function getLastSaveLabel(){
  if(!_lastSaveTime) return '';
  var diff=Math.round((Date.now()-_lastSaveTime.getTime())/1000);
  if(diff<10)return 'hace unos segundos';
  if(diff<60)return 'hace '+diff+'s';
  return 'hace '+Math.floor(diff/60)+'min';
}

// ===== UNDO SYSTEM (snapshot-based) =====
var _undoStack=[];
var _undoMax=10;

function undoPush(label){
  var snapshot={
    patients:JSON.parse(JSON.stringify(DB.patients)),
    antropometrias:JSON.parse(JSON.stringify(DB.antropometrias)),
    analiticas:JSON.parse(JSON.stringify(DB.analiticas)),
    appointments:JSON.parse(JSON.stringify(DB.appointments)),
    invoices:JSON.parse(JSON.stringify(DB.invoices)),
    recipes:JSON.parse(JSON.stringify(DB.recipes)),
    alerts:JSON.parse(JSON.stringify(DB.alerts)),
    nextPId:DB.nextPId,nextAId:DB.nextAId,nextIId:DB.nextIId,
    label:label,time:new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'})
  };
  _undoStack.push(snapshot);
  if(_undoStack.length>_undoMax)_undoStack.shift();
}

function undoPop(){
  if(!_undoStack.length){toast('No hay acciones para deshacer','info');return}
  var snap=_undoStack.pop();
  DB.patients=snap.patients;DB.antropometrias=snap.antropometrias;
  DB.analiticas=snap.analiticas;DB.appointments=snap.appointments;
  DB.invoices=snap.invoices;DB.recipes=snap.recipes;DB.alerts=snap.alerts;
  DB.nextPId=snap.nextPId;DB.nextAId=snap.nextAId;DB.nextIId=snap.nextIId;
  toast('↩ Deshecho: '+snap.label,'info');
  navigate(curMod);showSaved();
}

// Hook into toast success to auto-snapshot
var _origToast=toast;
toast=function(m,t){
  if(t==='success'||!t)undoPush(m);
  _origToast(m,t);
};

// ===== ONBOARDING — Bienvenida + Tour Guiado =====
var _obStep=0;
var _obTotalSteps=0;

function checkOnboarding() {
  if (DB.patients.length > 0) return;
  try { if (localStorage.getItem('veridia_onboarded')) return } catch(e) {}
  setTimeout(function(){ obShowStep(0) }, 700);
}

function obShowStep(step) {
  _obStep = step;

  // ── STEP 0: BIENVENIDA ──
  if (step === 0) {
    openModal(
      '<div style="text-align:center;padding:40px 30px 10px">'
      + '<div style="font-size:3.5rem;margin-bottom:16px;animation:obPulse 2s infinite">🌿</div>'
      + '<h2 style="font-size:1.6rem;font-weight:800;letter-spacing:-.5px;margin-bottom:8px;color:var(--primary)">¡Bienvenido/a a Veridia HealthTech!</h2>'
      + '<div style="font-size:.82rem;color:var(--text2);margin-bottom:24px">BETA v5.1 · Clinical Nutrition ERP</div>'
      + '<div style="max-width:440px;margin:0 auto;text-align:left">'
      + '<p style="font-size:.92rem;line-height:1.7;margin-bottom:16px;color:var(--text)">Antes que nada, <strong>gracias por confiar en nosotros</strong>. Sabemos que tu tiempo es valioso y que elegir una herramienta para tu práctica clínica es una decisión importante.</p>'
      + '<p style="font-size:.92rem;line-height:1.7;margin-bottom:16px;color:var(--text)">Veridia nace del trabajo conjunto entre <strong>nutricionistas clínicos</strong> e <strong>ingenieros de software</strong>, y cada día trabajamos para que sea más completa, más intuitiva y más útil para vos.</p>'
      + '<div style="background:var(--primary-light,#E8F5EE);border-radius:12px;padding:16px;margin-bottom:16px">'
      + '<p style="font-size:.85rem;line-height:1.6;color:var(--text);margin:0">🚀 <strong>Preparamos una visita guiada rápida</strong> para que conozcas los módulos principales y puedas comenzar a trabajar en minutos. ¡Son solo 2 pasos!</p>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '<div style="padding:10px 30px 30px;display:flex;justify-content:center;gap:12px">'
      + '<button class="btn btn-primary" onclick="obShowStep(1)" style="padding:12px 36px;font-size:.95rem">Comenzar la visita guiada →</button>'
      + '</div>'
      + '<style>@keyframes obPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}</style>'
    , true);
    return;
  }

  // ── STEP 1: CONFIGURACIÓN ──
  if (step === 1) {
    openModal(
      '<div class="modal-header"><h3>⚙️ Configuremos tu espacio — Paso 1 de 2</h3></div>'
      + '<div class="modal-body">'
      + '<div style="display:flex;gap:6px;margin-bottom:20px">' + obProgressDots(1, 2) + '</div>'
      + '<p style="font-size:.88rem;color:var(--text2);margin-bottom:18px">Solo necesitamos un par de datos para personalizar tu experiencia.</p>'
      + '<div class="form-group"><label class="form-label">Nombre de tu clínica / consultorio</label><input id="obClinica" value="Clínica de Nutrición" placeholder="Mi clínica" style="font-size:.95rem"></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'
      + '<div class="form-group"><label class="form-label">Profesional principal</label><input id="obProf" value="' + (currentUser ? currentUser.name : 'Lic. Antonella Caverzan') + '"></div>'
      + '<div class="form-group"><label class="form-label">Moneda</label><select id="obCurr">' + Object.entries(CURRENCIES).map(function(e) { return '<option value="' + e[0] + '"' + (CURRENCY === e[0] ? ' selected' : '') + '>' + e[1].symbol + ' ' + e[0] + ' — ' + e[1].name + '</option>' }).join('') + '</select></div></div>'
      + '<div style="margin-top:18px;padding:16px;background:var(--surface2,#f5f5f5);border-radius:12px">'
      + '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:.88rem"><input type="checkbox" id="obDemo" checked> <span>Cargar <strong>paciente demo</strong> con datos completos para explorar todos los módulos</span></label>'
      + '</div>'
      + '</div>'
      + '<div class="modal-footer">'
      + '<button class="btn" style="opacity:.6" onclick="obShowStep(0)">← Atrás</button>'
      + '<button class="btn btn-primary" onclick="obShowStep(2)">Siguiente — Tour guiado →</button>'
      + '</div>'
    , true);
    return;
  }

  // ── STEP 2: TOUR GUIADO ──
  if (step === 2) {
    var tourModules = [
      {id:'dashboard', icon:'📊', name:'Dashboard', desc:'Tu panel principal con KPIs: pacientes, citas del día, evolución de peso, ocupación y resumen mensual.'},
      {id:'pacientes', icon:'👥', name:'Pacientes', desc:'Registro completo: datos personales, DNI, tags, patologías. Desde acá accedes a todo el historial clínico.'},
      {id:'historia', icon:'📋', name:'Historia Clínica', desc:'9 pestañas: anamnesis, consultas, antropometría, analíticas, plan alimentario, citas, notas, diario, evolución.'},
      {id:'formula', icon:'🧮', name:'Fórmula Clínica', desc:'Calcula GEB/GET con 5 fórmulas (Mifflin, Harris-Benedict, Owen, Cunningham, Penn State). Peso ideal + indicadores.'},
      {id:'desarrollada', icon:'🔬', name:'Desarrollada', desc:'Copiloto clínico en 5 pasos: paciente → macros → alimentos BEDCA → cuadraje → minuta exportable. Multi-patología.'},
      {id:'planes', icon:'🍽️', name:'Planes Alimentarios', desc:'Crea planes por comida con alimentos de BEDCA. Copia entre pacientes, plantillas, lista de compras, adherencia.'},
      {id:'restauracion', icon:'🏛️', name:'Restauración Colectiva', desc:'Menús institucionales, APPCC, IDDSI, trazabilidad, escalado, costeo, auditoría y control de mermas.'},
      {id:'ia', icon:'🤖', name:'IA Copilot', desc:'Asistente clínico con Gemini: interpreta analíticas, genera planes 7 días, sugiere por patología. Contexto automático.'},
      {id:'facturacion', icon:'💳', name:'Facturación', desc:'Facturas multilínea con impuestos dinámicos, descuentos, recurrencia, impresión profesional, informes fiscales.'},
      {id:'settings', icon:'⚙️', name:'Ajustes', desc:'Idioma (ES/EN/PT), moneda (9), tema de color, timeout de sesión, perfil profesional, datos de clínica, backup.'}
    ];

    var tourHtml = tourModules.map(function(m, i) {
      return '<div class="ob-tour-item" style="display:flex;gap:14px;padding:14px 16px;border-radius:12px;cursor:pointer;transition:all .2s;border:1px solid transparent" '
      + 'onmouseenter="this.style.background=\'var(--primary-light,#E8F5EE)\';this.style.borderColor=\'var(--primary)\'" '
      + 'onmouseleave="this.style.background=\'transparent\';this.style.borderColor=\'transparent\'" '
      + 'onclick="obQuickNav(\'' + m.id + '\')">'
      + '<div style="font-size:1.6rem;min-width:36px;text-align:center;padding-top:2px">' + m.icon + '</div>'
      + '<div><strong style="font-size:.9rem">' + m.name + '</strong>'
      + '<p style="font-size:.78rem;color:var(--text2);margin:3px 0 0;line-height:1.5">' + m.desc + '</p></div>'
      + '</div>';
    }).join('');

    openModal(
      '<div class="modal-header"><h3>🗺️ Tour guiado — Paso 2 de 2</h3></div>'
      + '<div class="modal-body">'
      + '<div style="display:flex;gap:6px;margin-bottom:16px">' + obProgressDots(2, 2) + '</div>'
      + '<p style="font-size:.88rem;color:var(--text2);margin-bottom:6px">Estos son los módulos principales de Veridia. <strong>Hacé clic en cualquiera</strong> para ir directamente, o completá el tour para empezar en el Dashboard.</p>'
      + '<div style="display:grid;gap:4px;max-height:52vh;overflow-y:auto;padding-right:4px">'
      + tourHtml
      + '</div>'
      + '<div style="margin-top:16px;padding:14px;background:linear-gradient(135deg,var(--primary-light,#E8F5EE),#E6F5F5);border-radius:12px;text-align:center">'
      + '<p style="font-size:.82rem;color:var(--text);margin:0">💡 <strong>Consejo:</strong> Usa <kbd style="background:var(--surface2,#eee);padding:2px 6px;border-radius:4px;font-size:.75rem">Ctrl+K</kbd> en cualquier momento para buscar módulos, pacientes o funciones.</p>'
      + '</div>'
      + '</div>'
      + '<div class="modal-footer">'
      + '<button class="btn" style="opacity:.6" onclick="obShowStep(1)">← Atrás</button>'
      + '<button class="btn btn-primary" onclick="obFinish()" style="padding:10px 32px">🚀 ¡Comenzar a trabajar!</button>'
      + '</div>'
    , true);
    return;
  }
}

function obProgressDots(current, total) {
  var html = '';
  for (var i = 1; i <= total; i++) {
    var active = i === current;
    var done = i < current;
    html += '<div style="display:flex;align-items:center;gap:6px">'
    + '<div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;'
    + (active ? 'background:var(--primary);color:#fff' : done ? 'background:var(--primary);color:#fff;opacity:.6' : 'background:var(--surface2,#eee);color:var(--text3)')
    + '">' + (done ? '✓' : i) + '</div>'
    + '<span style="font-size:.78rem;font-weight:' + (active ? '700' : '400') + ';color:' + (active ? 'var(--text)' : 'var(--text3)') + '">' + (i === 1 ? 'Configuración' : 'Tour') + '</span>'
    + (i < total ? '<div style="width:40px;height:2px;background:' + (done ? 'var(--primary)' : 'var(--border,#ddd)') + ';border-radius:2px;margin:0 4px"></div>' : '')
    + '</div>';
  }
  return html;
}

function obQuickNav(moduleId) {
  obFinish(moduleId);
}

function obFinish(targetModule) {
  var clinica = $('obClinica') ? $('obClinica').value : 'Clínica de Nutrición';
  var curr = $('obCurr') ? $('obCurr').value : CURRENCY;
  var loadDemo = $('obDemo') ? $('obDemo').checked : false;

  if (curr !== CURRENCY) setCurrency(curr);
  try { localStorage.setItem('veridia_clinica', clinica) } catch(e) {}
  try { localStorage.setItem('veridia_onboarded', '1') } catch(e) {}

  if (loadDemo) loadDemoData();

  closeModal();
  toast('✅ ¡' + clinica + ' configurada! Bienvenido/a a Veridia');
  navigate(targetModule || 'dashboard');
}

// Keep legacy name for tests
function finishOnboarding() { obFinish() }

function loadDemoData() {
  var today = new Date().toISOString().slice(0, 10);
  var lastMonth = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  var twoMonths = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  var tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  var nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  // Paciente demo
  DB.patients.push({
    id: DB.nextPId++, nombre: 'María', apellidos: 'González López', dni: '12345678A',
    fechaNacimiento: '1988-05-15', sexo: 'FEMENINO', email: 'maria.demo@email.com',
    telefono: '612345678', direccion: 'Calle Demo 1, Madrid', profesion: 'Profesora',
    nacionalidad: 'Española', estadoCivil: 'Casada', educacion: 'Universidad',
    procedencia: 'Madrid', motivoConsulta: 'Pérdida de peso saludable + control analítica',
    grupoSanguineo: 'A+', tags: ['demo', 'sobrepeso', 'dislipidemia'],
    activo: true, clinicaId: 1, createdAt: twoMonths
  });

  // Antropometría (3 mediciones de evolución)
  DB.antropometrias.push(
    { id: 1, pacienteId: 1, fecha: twoMonths, peso: 78, altura: 165, imc: 28.7, cintura: 88, cadera: 104, pantorrilla: 36, grasaCorporal: 34, masaMuscular: 24, grasaVisceral: 7, metodo: 'BIA' },
    { id: 2, pacienteId: 1, fecha: lastMonth, peso: 75.5, altura: 165, imc: 27.7, cintura: 85, cadera: 102, pantorrilla: 36, grasaCorporal: 32, masaMuscular: 24.5, grasaVisceral: 6, metodo: 'BIA' },
    { id: 3, pacienteId: 1, fecha: today, peso: 73, altura: 165, imc: 26.8, cintura: 82, cadera: 100, pantorrilla: 36, grasaCorporal: 30, masaMuscular: 25, grasaVisceral: 5, metodo: 'BIA' }
  );

  // Analíticas
  DB.analiticas.push({
    id: 1, pacienteId: 1, fecha: lastMonth, ayuno: true,
    marcadores: [
      { nombre: 'Glucosa', valor: 98, unidad: 'mg/dL', rango: '70-100', alerta: null },
      { nombre: 'HbA1c', valor: 5.4, unidad: '%', rango: '4-5.7', alerta: null },
      { nombre: 'Colesterol Total', valor: 235, unidad: 'mg/dL', rango: '<200', alerta: 'moderada' },
      { nombre: 'HDL', valor: 52, unidad: 'mg/dL', rango: '>40', alerta: null },
      { nombre: 'LDL', valor: 158, unidad: 'mg/dL', rango: '<130', alerta: 'moderada' },
      { nombre: 'Triglicéridos', valor: 165, unidad: 'mg/dL', rango: '<150', alerta: 'leve' },
      { nombre: 'Ferritina', valor: 35, unidad: 'ng/mL', rango: '20-200', alerta: null },
      { nombre: 'Vitamina D', valor: 22, unidad: 'ng/mL', rango: '30-100', alerta: 'moderada' },
      { nombre: 'TSH', valor: 2.8, unidad: 'mUI/L', rango: '0.4-4.5', alerta: null },
      { nombre: 'Hemoglobina', valor: 13.2, unidad: 'g/dL', rango: '12-16', alerta: null }
    ]
  });

  // Citas
  DB.appointments.push(
    { id: DB.nextAId++, pacienteId: 1, profesional: 'Lic. Antonella Caverzan', fecha: twoMonths, hora: '10:00', tipo: 'Primera visita', asunto: 'Primera consulta nutricional', estado: 'Realizada', pago: 'Pagado', precio: 55, duracion: 60, color: 'first', acta: { hallazgos: 'Sobrepeso IMC 28.7, dislipidemia, vitamina D baja', acuerdos: 'Plan hipocalórico 1600kcal, suplementar VitD', proximos: 'Control peso en 1 mes' } },
    { id: DB.nextAId++, pacienteId: 1, profesional: 'Lic. Antonella Caverzan', fecha: lastMonth, hora: '10:00', tipo: 'Revisión', asunto: 'Control mensual', estado: 'Realizada', pago: 'Pagado', precio: 35, duracion: 30, color: 'review' },
    { id: DB.nextAId++, pacienteId: 1, profesional: 'Lic. Antonella Caverzan', fecha: tomorrow, hora: '11:00', tipo: 'Revisión', asunto: 'Revisión + nueva analítica', estado: 'Confirmada', pago: 'Pendiente', precio: 35, duracion: 30, color: 'review' }
  );

  // Facturas
  DB.invoices.push(
    { id: DB.nextIId++, numero: 'FAC-2026-001', pacienteId: 1, fecha: twoMonths, estado: 'Pagada', total: 55, lineas: [{ servicio: 'Primera consulta nutricional', cantidad: 1, precio: 55, iva: CURRENCIES[CURRENCY].taxRate }], pagos: [{ metodo: 'Tarjeta', importe: 55, fecha: twoMonths }] },
    { id: DB.nextIId++, numero: 'FAC-2026-002', pacienteId: 1, fecha: lastMonth, estado: 'Pagada', total: 35, lineas: [{ servicio: 'Consulta de revisión', cantidad: 1, precio: 35, iva: CURRENCIES[CURRENCY].taxRate }], pagos: [{ metodo: 'Efectivo', importe: 35, fecha: lastMonth }] }
  );

  // Receta demo
  DB.recipes.push({
    id: 1, nombre: 'Bowl mediterráneo de quinoa', categoria: 'Almuerzo', raciones: 2,
    kcal: 420, prot: 22, grasas: 18, hc: 45, fibra: 8,
    ingredientes: [{ nombre: 'Quinoa cocida', gramos: 150, k: 180 }, { nombre: 'Pechuga de pollo', gramos: 120, k: 140 }, { nombre: 'Tomate cherry', gramos: 80, k: 16 }, { nombre: 'Aguacate', gramos: 50, k: 80 }, { nombre: 'Aceite de oliva', gramos: 10, k: 90 }],
    pasos: ['Cocinar la quinoa según indicaciones del paquete.', 'Grillar la pechuga de pollo cortada en tiras.', 'Cortar los tomates cherry por la mitad y el aguacate en láminas.', 'Montar el bowl: base de quinoa, pollo, tomate, aguacate.', 'Aliñar con aceite de oliva virgen extra y una pizca de sal.'],
    source: 'local'
  });

  selPat = 1;
  showSaved();
}

// ===== LOADING STATES =====
function showLoading(msg) {
  var el = document.createElement('div');
  el.id = 'veridiaLoading';
  el.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.3);z-index:99998;display:flex;align-items:center;justify-content:center';
  el.innerHTML = '<div style="background:var(--surface);padding:24px 40px;border-radius:16px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.2)"><div class="spinner" style="margin:0 auto 12px"></div><div style="font-size:.85rem;font-weight:600;color:var(--text)">' + (msg || 'Cargando...') + '</div></div>';
  document.body.appendChild(el);
}
function hideLoading() {
  var el = document.getElementById('veridiaLoading');
  if (el) el.remove();
}

// ===== TOOLTIPS DE AYUDA =====


// ===== MEMORY MANAGEMENT: Limit unbounded arrays =====
var DB_LIMITS={
  auditLog:500,     // Last 500 audit entries
  alerts:200,       // Last 200 alerts
  feedback:100,     // Last 100 feedback entries
  rcAppcc:500,      // Last 500 APPCC logs
  rcMermas:300,     // Last 300 waste records
  rcLotes:200       // Last 200 lot records
};

function trimDBArrays(){
  var trimmed=0;
  Object.keys(DB_LIMITS).forEach(function(key){
    var limit=DB_LIMITS[key];
    var arr=DB[key];
    if(Array.isArray(arr)&&arr.length>limit){
      var excess=arr.length-limit;
      DB[key]=arr.slice(excess);
      trimmed+=excess;
    }
  });
  // Chat messages: max 200 per patient
  if(typeof chatDB!=='undefined'){
    Object.keys(chatDB).forEach(function(k){
      var chat=chatDB[k];
      if(chat&&chat.messages&&chat.messages.length>200){
        trimmed+=chat.messages.length-200;
        chat.messages=chat.messages.slice(-200);
      }
    });
  }
  // Undo stack is already limited to 10
  if(trimmed>0) console.debug('[Veridia] Trimmed '+trimmed+' old records');
  return trimmed;
}

// Monitor localStorage usage
function getStorageUsage(){
  var total=0;
  try{
    for(var k in localStorage){
      if(localStorage.hasOwnProperty(k)){
        total+=localStorage.getItem(k).length*2; // UTF-16 = 2 bytes/char
      }
    }
  }catch(e){console.warn('[Veridia]',e.message||e)}
  return{bytes:total,kb:Math.round(total/1024),pct:Math.round(total/5242880*100),
    warning:total>4194304, // 80% of 5MB
    critical:total>4718592  // 90% of 5MB
  };
}

// Auto-trim before save
var _origSaveData=typeof saveData==='function'?saveData:null;
function saveData(){
  trimDBArrays();
  var usage=getStorageUsage();
  if(usage.warning){
    console.warn('[Veridia] localStorage at '+usage.pct+'% ('+usage.kb+'KB/5120KB)');
    if(usage.critical) toast('⚠️ Almacenamiento al '+usage.pct+'% — Considere hacer backup y limpiar datos antiguos','warning');
  }
  if(_origSaveData) return _origSaveData();
}

// ===== G6: UNSAVED DATA GUARD =====
var _formDirty=false;
function markFormDirty(){_formDirty=true}
function clearFormDirty(){_formDirty=false}
window.addEventListener('beforeunload',function(e){
  if(_formDirty){e.preventDefault();e.returnValue='Hay cambios sin guardar. ¿Seguro que deseas salir?';return e.returnValue}
});

// ===== G10: NOTIFICATION CENTER =====
function openNotifications(){
  var items=[];
  // Pending alerts
  DB.alerts.filter(function(a){return a.estado==='pendiente'}).forEach(function(a){
    var p=gP(a.pacienteId);
    items.push({icon:'🚨',text:a.mensaje,sub:(p?p.nombre:'')+'—'+a.severidad,date:a.fecha,action:'revAlert('+a.id+');closeModal();navigate("alertas")'});
  });
  // Today appointments
  var today=new Date().toISOString().slice(0,10);
  DB.appointments.filter(function(a){return a.fecha===today&&a.estado!=='Cancelada'&&a.estado!=='Realizada'}).forEach(function(a){
    var p=gP(a.pacienteId);
    items.push({icon:'📅',text:a.hora+' — '+(a.asunto||a.tipo),sub:p?p.nombre+' '+p.apellidos:'',date:today,action:'navigate("agenda")'});
  });
  // Overdue invoices
  DB.invoices.filter(function(i){return i.estado==='Vencida'}).forEach(function(i){
    var p=gP(i.pacienteId);
    items.push({icon:'💳',text:'Factura '+i.numero+' vencida — '+fMoney(i.total),sub:p?p.nombre:'',date:i.fecha,action:'navigate("facturacion")'});
  });
  // Unread messages
  DB.patients.filter(function(p){return p.activo}).forEach(function(p){
    var key='chat_'+p.id;var chat=typeof chatDB!=='undefined'?chatDB[key]:null;
    if(chat&&chat.unread){items.push({icon:'💬',text:'Mensaje sin leer',sub:p.nombre+' '+p.apellidos,date:'',action:'openChat('+p.id+');closeModal()'})}
  });
  // RC: expiring lots
  if(typeof rcLotesProximosACaducar==='function'){
    rcLotesProximosACaducar().forEach(function(l){
      items.push({icon:'🧊',text:l.producto+' — Lote '+l.numLote+' próximo a caducar',sub:l.proveedor,date:l.caducidad,action:'rcTab="trazabilidad";navigate("restauracion")'});
    });
  }

  items.sort(function(a,b){return(b.date||'').localeCompare(a.date||'')});

  var h='<div class="modal-header"><h3>🔔 Notificaciones ('+items.length+')</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body" style="max-height:60vh;overflow-y:auto">';
  if(!items.length){h+='<div style="text-align:center;padding:30px;color:var(--text3)"><div style="font-size:2.5rem;margin-bottom:8px">🔕</div>Sin notificaciones pendientes</div>'}
  else{items.forEach(function(it){
    h+='<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);cursor:pointer;align-items:flex-start" onclick="'+it.action+'">'
    +'<div style="font-size:1.3rem;min-width:28px;text-align:center">'+it.icon+'</div>'
    +'<div style="flex:1"><div style="font-size:.85rem;font-weight:600">'+it.text+'</div>'
    +'<div style="font-size:.72rem;color:var(--text3)">'+it.sub+(it.date?' · '+fD(it.date):'')+'</div></div></div>';
  })}
  h+='</div>';
  openModal(h);
}

// ===== G9: KEYBOARD SHORTCUTS PANEL =====
function showKeyboardShortcuts(){
  openModal('<div class="modal-header"><h3>⌨️ Atajos de teclado</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body"><div style="display:grid;gap:6px;font-size:.85rem">'
  +[['Ctrl+K','Paleta de comandos'],['Ctrl+P','Buscar paciente'],['Ctrl+A','Nueva cita'],
    ['Ctrl+N','Nuevo paciente'],['Ctrl+Z','Deshacer última acción'],['Ctrl+S','Guardar/Sincronizar'],
    ['Ctrl+B','Backup de datos'],['Ctrl+D','Ir a Dashboard'],['?','Este panel de atajos'],
    ['Esc','Cerrar modal/popup']
  ].map(function(s){return '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--surface2,#f5f5f5);border-radius:8px">'
  +'<kbd style="background:var(--text);color:#fff;padding:3px 10px;border-radius:6px;font-size:.78rem;font-weight:700;font-family:monospace">'+s[0]+'</kbd>'
  +'<span>'+s[1]+'</span></div>'}).join('')
  +'</div></div>');
}
document.addEventListener('keydown',function(e){
  if(e.key==='?'&&!e.ctrlKey&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){showKeyboardShortcuts();e.preventDefault()}
  if(e.ctrlKey&&e.key==='k'){e.preventDefault();if(typeof openCommandPalette==='function')openCommandPalette();return}
  if(e.ctrlKey&&e.key==='d'){e.preventDefault();navigate('dashboard')}
  if(e.ctrlKey&&e.key==='s'){e.preventDefault();if(typeof fbSyncDB==='function')fbSyncDB();toast('Sincronizado','success')}
  if(e.ctrlKey&&e.key==='b'){e.preventDefault();if(typeof backupData==='function')backupData()}
  if(e.ctrlKey&&e.key==='n'){e.preventDefault();if(typeof openNewPat==='function')openNewPat()}
  if(e.key==='Escape'){closeModal()}
});

// ===== G11: OFFLINE DETECTION =====
window.addEventListener('online',function(){var b=document.getElementById('offlineBanner');if(b)b.remove();toast('Conexión restaurada','success')});
window.addEventListener('offline',function(){
  if(document.getElementById('offlineBanner'))return;
  var b=document.createElement('div');b.id='offlineBanner';
  b.style.cssText='position:fixed;top:0;left:0;right:0;background:#dc2626;color:#fff;padding:8px 16px;text-align:center;font-size:.82rem;font-weight:600;z-index:99999';
  b.textContent='📡 Sin conexión — Los datos se guardan localmente';
  document.body.appendChild(b);
});

// ===== LAZY LOADING MODULES =====
var _loadedModules={};
function lazyLoadModule(name,callback){
  if(_loadedModules[name]){if(callback)callback();return}
  showLoading('Cargando módulo '+name+'...');
  var script=document.createElement('script');
  script.src='js/'+name+'.js';
  script.onload=function(){_loadedModules[name]=true;hideLoading();if(callback)callback()};
  script.onerror=function(){hideLoading();toast('Error al cargar módulo '+name,'error')};
  document.head.appendChild(script);
}

var HELP_TIPS = {
  dashboard: 'Panel principal con KPIs, citas del día, evolución de peso y resumen mensual.',
  agenda: 'Gestión de citas: vista día/semana/mes. Arrastra citas para moverlas. Ctrl+A.',
  pacientes: 'Registro de pacientes. Clic en nombre → historia clínica. Ctrl+P.',
  historia: 'Ficha completa: 9 tabs (anamnesis, consultas, mediciones, analíticas, plan, citas, notas, diario, evolución). Incluye screening ESPEN.',
  antropometria: 'Mediciones: peso, IMC, % grasa, masa muscular. Gráficos de evolución automáticos.',
  formula: 'Cálculo de GEB/GET con 4 fórmulas (Mifflin, Harris-Benedict, Owen, Cunningham). Peso ideal + indicadores.',
  desarrollada: 'Copiloto clínico en 5 pasos: paciente → macros → alimentos → cuadraje → minuta. Selección múltiple de patologías + ESPEN micronutrientes.',
  bedca: 'Base de 969 alimentos españoles oficiales + OpenFoodFacts + USDA. Datos nutricionales completos.',
  planes: 'Planes alimentarios con wizard rápido. Cada plan tiene comidas con alimentos de BEDCA.',
  recetas: 'Recetas propias + importación de TheMealDB (traducción automática EN→ES).',
  facturacion: 'Facturas multilínea con IVA/impuesto dinámico. Impresión profesional.',
  contabilidad: 'Gastos, productos (suplementos/recetarios), inventario con alertas de stock.',
  settings: 'Idioma, moneda, color del tema, timeout de sesión, backup de datos.',
  restauracion: 'Restauración colectiva: planificación de menús institucionales, escalado, APPCC, trazabilidad, IDDSI, mermas y auditoría nutricional.',
  ia: 'Asistente IA (Gemini): interpreta analíticas, sugiere planes, responde consultas clínicas.'
};

function showHelp(moduleId) {
  var tip = HELP_TIPS[moduleId];
  if (!tip) return;
  toast('ℹ️ ' + tip, 'info');
}

// ═══════════════════════════════════════════
//  EXPORTACIÓN PDF PROFESIONAL
// ═══════════════════════════════════════════

function exportPatientPDF(patId, section) {
  var p = gP(patId);
  if (!p) return toast('Paciente no encontrado', 'error');

  var sections = section ? [section] : ['ficha', 'antropometria', 'analiticas', 'planes'];
  var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ficha — ' + p.nombre + ' ' + p.apellidos + '</title>'
    + '<style>'
    + '@page{size:A4;margin:20mm 18mm}'
    + 'body{font-family:"Segoe UI",Arial,sans-serif;color:#1a1a1a;font-size:11px;line-height:1.5;padding:0;margin:0}'
    + 'h1{font-size:18px;color:#2E8B57;border-bottom:2px solid #2E8B57;padding-bottom:6px;margin:0 0 12px}'
    + 'h2{font-size:13px;color:#333;border-bottom:1px solid #ddd;padding-bottom:4px;margin:14px 0 8px}'
    + 'h3{font-size:11px;color:#555;margin:10px 0 4px}'
    + '.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}'
    + '.header img{height:36px}'
    + '.meta{font-size:10px;color:#666;text-align:right}'
    + '.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}'
    + '.field{padding:4px 0}'
    + '.label{font-size:9px;text-transform:uppercase;color:#888;letter-spacing:.5px}'
    + '.value{font-size:11px;font-weight:500}'
    + 'table{width:100%;border-collapse:collapse;font-size:10px}'
    + 'th{background:#f0f0f0;padding:6px 8px;text-align:left;font-size:9px;text-transform:uppercase;color:#555}'
    + 'td{padding:5px 8px;border-bottom:1px solid #eee}'
    + '.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:600}'
    + '.badge-green{background:#dcfce7;color:#166534}'
    + '.badge-red{background:#fef2f2;color:#dc2626}'
    + '.badge-yellow{background:#fefce8;color:#a16207}'
    + '.footer{position:fixed;bottom:0;left:0;right:0;text-align:center;font-size:8px;color:#aaa;border-top:1px solid #eee;padding:6px}'
    + '@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}'
    + '</style></head><body>';

  // Header
  html += '<div class="header"><div><h1>📋 Ficha Clínica</h1><div style="font-size:13px;color:#555">' + p.nombre + ' ' + p.apellidos + '</div></div>'
    + '<div class="meta">Veridia HealthTech v5.2<br>Fecha: ' + fD(new Date().toISOString().slice(0, 10)) + '<br>DNI: ' + (p.dni || '—') + '</div></div>';

  // Ficha
  if (sections.indexOf('ficha') !== -1) {
    html += '<h2>👤 Datos Personales</h2><div class="grid">';
    [{l:'Fecha nacimiento',v:fD(p.fechaNacimiento)},{l:'Sexo',v:p.sexo||'—'},{l:'Email',v:p.email||'—'},{l:'Teléfono',v:p.telefono||'—'},
     {l:'Dirección',v:p.direccion||'—'},{l:'Profesión',v:p.profesion||'—'},{l:'Nacionalidad',v:p.nacionalidad||'—'},{l:'Estado civil',v:p.estadoCivil||'—'},
     {l:'Grupo sanguíneo',v:p.grupoSanguineo||'—'},{l:'Motivo consulta',v:p.motivoConsulta||'—'}
    ].forEach(function(f){html+='<div class="field"><div class="label">'+f.l+'</div><div class="value">'+f.v+'</div></div>'});
    html += '</div>';
  }

  // Antropometría
  if (sections.indexOf('antropometria') !== -1) {
    var antros = (DB.antropometrias || []).filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return a.fecha.localeCompare(b.fecha)});
    html += '<h2>📐 Antropometría</h2>';
    if (antros.length) {
      html += '<table><thead><tr><th>Fecha</th><th>Peso</th><th>IMC</th><th>% Grasa</th><th>Masa muscular</th><th>Cintura</th><th>Cadera</th></tr></thead><tbody>';
      antros.forEach(function(a){
        html += '<tr><td>'+fD(a.fecha)+'</td><td>'+(a.peso||'—')+' kg</td><td>'+(a.imc||'—')+'</td><td>'+(a.grasaCorporal||'—')+'%</td><td>'+(a.masaMuscular||'—')+' kg</td><td>'+(a.cintura||'—')+' cm</td><td>'+(a.cadera||'—')+' cm</td></tr>';
      });
      html += '</tbody></table>';
    } else { html += '<p style="color:#888">Sin mediciones registradas</p>' }
  }

  // Analíticas
  if (sections.indexOf('analiticas') !== -1) {
    var anals = (DB.analiticas || []).filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return a.fecha.localeCompare(b.fecha)});
    html += '<h2>🧪 Analíticas</h2>';
    if (anals.length) {
      html += '<table><thead><tr><th>Fecha</th><th>Hb</th><th>Glucosa</th><th>Col total</th><th>HDL</th><th>LDL</th><th>Triglicéridos</th><th>HbA1c</th></tr></thead><tbody>';
      anals.forEach(function(a){
        html += '<tr><td>'+fD(a.fecha)+'</td><td>'+(a.hemoglobina||'—')+'</td><td>'+(a.glucosa||'—')+'</td><td>'+(a.colesterolTotal||'—')+'</td><td>'+(a_hdl||'—')+'</td><td>'+(a_ldl||'—')+'</td><td>'+(a.trigliceridos||'—')+'</td><td>'+(a.hba1c||'—')+'</td></tr>';
      });
      html += '</tbody></table>';
    } else { html += '<p style="color:#888">Sin analíticas registradas</p>' }
  }

  // Planes
  if (sections.indexOf('planes') !== -1) {
    var planes = (DB.planes || []).filter(function(pl){return pl.patientId===patId});
    html += '<h2>🍽️ Planes Alimentarios</h2>';
    if (planes.length) {
      planes.forEach(function(pl){
        html += '<h3>' + (pl.name || 'Plan') + ' — ' + fD(pl.startDate || pl.created) + '</h3>';
        (pl.meals || []).forEach(function(m){
          html += '<div style="margin:4px 0"><strong>' + (m.name || '') + ':</strong> ';
          (m.foods || []).forEach(function(f){html += (f.name || '') + ' (' + (f.quantity || '') + '), '});
          html += '</div>';
        });
      });
    } else { html += '<p style="color:#888">Sin planes asignados</p>' }
  }

  html += '<div class="footer">Veridia HealthTech · Exportado el ' + new Date().toLocaleString('es-ES') + ' · ' + (currentUser ? currentUser.email : '') + '</div>';
  html += '</body></html>';

  var win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(function(){win.print()}, 500);
    toast('📄 PDF abierto — Use Imprimir → Guardar como PDF', 'info');
  } else {
    toast('Permita popups para exportar PDF', 'warning');
  }
}
