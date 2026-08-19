// ===== MÓDULO DE AJUSTES DEL SISTEMA =====

function rSettings(){
  var langNames={es:'🇪🇸 Español',en:'🇬🇧 English',pt:'🇧🇷 Português'};
  var currInfo=CURRENCIES[CURRENCY];
  var timeoutMin=Math.round(SESSION_TIMEOUT_MS/60000);
  var themeColor=localStorage.getItem('veridia_theme_color')||'#2E8B57';

  $('mainContent').innerHTML='<div class="fade-in">'
  +'<div class="card" style="border:none;background:linear-gradient(135deg,#0E7490 0%,#0891B2 50%,#22D3EE 100%);color:#fff;margin-bottom:22px;border-radius:var(--radius);padding:22px 28px"><div style="display:flex;align-items:center;gap:14px">⚙️<div><h2 style="margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.3px">Configuración</h2><p style="margin:0;font-size:.78rem;opacity:.75">Idioma · Moneda · Tema · Seguridad · Datos</p></div></div></div>'
  +'<div class="grid-23">'

  // Column 1: Settings
  +'<div>'
  // Idioma
  +'<div class="card" style="margin-bottom:16px"><div class="card-header"><span class="card-title" style="font-size:.85rem">🌍 Idioma</span></div><div class="card-body">'
  +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
  +['es','en','pt'].map(function(l){return '<button class="btn '+(LANG===l?'btn-primary':'btn-outline')+' btn-sm" onclick="setLang(\''+l+'\');navigate(\'settings\')">'+langNames[l]+'</button>'}).join('')
  +'</div></div></div>'

  // Moneda
  +'<div class="card" style="margin-bottom:16px"><div class="card-header"><span class="card-title" style="font-size:.85rem">💰 Moneda y fiscalidad</span></div><div class="card-body">'
  +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px">'
  +Object.entries(CURRENCIES).map(function(e){var c=e[0],v=e[1];return '<div style="padding:8px;border-radius:var(--radius-xs);border:2px solid '+(CURRENCY===c?'var(--primary)':'var(--border)')+';cursor:pointer;background:'+(CURRENCY===c?'var(--primary-light)':'var(--surface)')+'" onclick="setCurrency(\''+c+'\');navigate(\'settings\')">'
  +'<div style="font-weight:800">'+v.symbol+' '+c+'</div><div style="font-size:.6rem;color:var(--text3)">'+v.name+'</div><div style="font-size:.58rem;color:var(--text3)">'+v.tax+' '+v.taxRate+'%</div></div>'}).join('')
  +'</div></div></div>'

  // Tema
  +'<div class="card" style="margin-bottom:16px"><div class="card-header"><span class="card-title" style="font-size:.85rem">☀️ Tema y apariencia</span></div><div class="card-body">'
  +'<div style="margin-bottom:12px"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Color primario</label><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">'
  +['#0891B2','#0E7490','#2563eb','#7c3aed','#db2777','#ea580c','#059669','#0f766e'].map(function(c){return '<div style="width:32px;height:32px;border-radius:50%;background:'+c+';cursor:pointer;border:3px solid '+(c===themeColor?'var(--text)':'transparent')+'" onclick="setThemeColor(\''+c+'\');navigate(\'settings\')"></div>'}).join('')
  +'<input type="color" value="'+themeColor+'" onchange="setThemeColor(this.value);navigate(\'settings\')" style="width:32px;height:32px;border:none;padding:0;cursor:pointer;border-radius:50%">'
  +'</div></div>'
  +'<div><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Modo</label><div style="display:flex;gap:8px">'
  +'<button class="btn '+(darkMode?'btn-outline':'btn-primary')+' btn-sm" onclick="if(darkMode)toggleDarkMode();navigate(\'settings\')">☀️ Claro</button>'
  +'<button class="btn '+(darkMode?'btn-primary':'btn-outline')+' btn-sm" onclick="if(!darkMode)toggleDarkMode();navigate(\'settings\')">🌙 Oscuro</button>'
  +'</div></div>'
  +'</div></div>'

  +'</div>'

  // Column 2: System
  +'<div>'

  // Sesión
  +'<div class="card" style="margin-bottom:16px"><div class="card-header"><span class="card-title" style="font-size:.85rem">🔒 Seguridad</span></div><div class="card-body">'
  +'<div style="margin-bottom:12px"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Timeout de sesión</label><div style="display:flex;gap:6px">'
  +[15,30,60,120].map(function(m){return '<button class="btn '+(timeoutMin===m?'btn-primary':'btn-outline')+' btn-sm" onclick="setSessionTimeout('+m+');navigate(\'settings\')">'+m+' min</button>'}).join('')
  +'</div></div>'
  +'<div><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Contraseña</label>'
  +'<button class="btn btn-outline btn-sm" onclick="openChangePasswordModal()">🔑 Cambiar contraseña</button>'
  +'</div><div style="margin-top:12px"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Perfil y clínica</label><div style="display:flex;gap:6px;flex-wrap:wrap">'
  +'<button class="btn btn-outline btn-sm" onclick="openEditProfile()">👤 Perfil profesional</button>'
  +'<button class="btn btn-outline btn-sm" onclick="openEditClinica()">🏥 Datos clínica</button></div>'
  +'</div></div></div>'

  // Datos
  +'<div class="card" style="margin-bottom:16px"><div class="card-header"><span class="card-title" style="font-size:.85rem">💾 Datos y backup</span></div><div class="card-body">'
  +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">'
  +'<button class="btn btn-primary btn-sm" onclick="backupData()">📦 Backup completo</button>'
  +'<button class="btn btn-outline btn-sm" onclick="restoreData()">⬆️ Restaurar backup</button>'
  +'<button class="btn btn-outline btn-sm" onclick="exportConfig()">⚙️ Export Config</button>'
  +'<button class="btn btn-outline btn-sm" onclick="importConfig()">📥 Import Config</button><button class="btn btn-outline btn-sm" onclick="viewFeedbackPanel()">📊 Ver Feedback</button>'
  +'</div>'
  +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
  +'<button class="btn btn-ghost btn-sm" onclick="exportPatients()">📥 Pacientes CSV</button>'
  +'<button class="btn btn-ghost btn-sm" onclick="exportInvoices()">📥 Facturas CSV</button>'
  +'<button class="btn btn-ghost btn-sm" onclick="exportAppointments()">📥 Citas CSV</button>'
  +'<button class="btn btn-ghost btn-sm" onclick="exportAuditLog()">📥 Auditoría CSV</button>'
  +'</div>'
  +'<div style="margin-top:12px;font-size:.72rem;color:var(--text3)">'
  +'<strong>Almacenamiento:</strong> localStorage '+(function(){try{var s=JSON.stringify(localStorage).length;return '('+Math.round(s/1024)+'KB usados)'}catch(e){return ''}}())
  +' · Firestore: '+(typeof fbDB!=='undefined'&&fbDB?'conectado ✅':'offline')
  +'</div></div></div>'

  // Info
  +'<div class="card" style="margin-bottom:16px"><div class="card-header"><span class="card-title" style="font-size:.85rem">ℹ️ Información del sistema</span></div><div class="card-body">'
  +'<ul class="data-list" style="font-size:.78rem">'
  +'<li><span class="label">Versión</span><span class="value">Veridia Pro V5</span></li>'
  +'<li><span class="label">Pacientes</span><span class="value">'+DB.patients.length+'</span></li>'
  +'<li><span class="label">Citas totales</span><span class="value">'+DB.appointments.length+'</span></li>'
  +'<li><span class="label">Facturas</span><span class="value">'+DB.invoices.length+'</span></li>'
  +'<li><span class="label">Recetas</span><span class="value">'+DB.recipes.length+'</span></li>'
  +'<li><span class="label">BEDCA alimentos</span><span class="value">'+(typeof BEDCA_DB!=='undefined'?BEDCA_DB.length:0)+'</span></li>'
  +'<li><span class="label">Desarrollador</span><span class="value">Andrés Galeano</span></li>'
  +'</ul><div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border)"><button class="btn btn-outline btn-sm" style="width:100%" onclick="openSupportTicket()">🎫 Abrir ticket de soporte</button></div>'
  +'</ul></div></div>'

  +'</div></div></div>';
}

function openSupportTicket(){
  openModal('<div class="modal-header"><h3>🎫 Soporte Veridia</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Asunto</label><input id="stAsunto" placeholder="Describe tu problema..."></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Mensaje</label><textarea id="stMsg" rows="4" placeholder="Detalla lo que ocurre..."></textarea></div></div>'
  +'<div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="sendSupportTicket()" style="border-radius:8px">🎫 Enviar ticket</button></div>');
}
function sendSupportTicket(){
  var asunto=sanitize($('stAsunto')?$('stAsunto').value.trim():'');
  var msg=sanitize($('stMsg')?$('stMsg').value.trim():'');
  if(!asunto){toast('Escribe un asunto','error');return}
  try{
    var tickets=JSON.parse(localStorage.getItem('veridia_erp_tickets')||'[]');
    tickets.push({id:'erp_'+Date.now(),email:currentUser?currentUser.email:'',asunto:asunto,mensaje:msg,fecha:new Date().toISOString().slice(0,10)});
    localStorage.setItem('veridia_erp_tickets',JSON.stringify(tickets));
  }catch(e){console.warn('[Veridia]',e.message||e)}
  closeModal();toast('Ticket enviado. El equipo de soporte te contactara pronto.');
}

// #68 Perfil del profesional
function openEditProfile(){
  var prof=JSON.parse(localStorage.getItem('veridia_profile')||'{}');
  openModal('<div class="modal-header"><h3>👤 Perfil profesional</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body">'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Nombre completo</label><input id="prfNombre" value="'+(prof.nombre||currentUser?.name||'')+'"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Titulo</label><input id="prfTitulo" value="'+(prof.titulo||'Lic. en Nutricion')+'"></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Matricula/Colegiado</label><input id="prfMatricula" value="'+(prof.matricula||'')+'"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Especialidad</label><input id="prfEspec" value="'+(prof.especialidad||'Nutricion clinica')+'"></div></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Email profesional</label><input id="prfEmail" value="'+(prof.email||currentUser?.email||'')+'"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Firma digital (texto)</label><input id="prfFirma" value="'+(prof.firma||'')+'" placeholder="Ej: Lic. Antonella Caverzan — MP 1234"></div>'
  +'</div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="saveProfile()" style="border-radius:8px">👤 Guardar</button></div>');
}

function saveProfile(){
  var prof={
    nombre:$('prfNombre')?$('prfNombre').value.trim():'',
    titulo:$('prfTitulo')?$('prfTitulo').value.trim():'',
    matricula:$('prfMatricula')?$('prfMatricula').value.trim():'',
    especialidad:$('prfEspec')?$('prfEspec').value.trim():'',
    email:$('prfEmail')?$('prfEmail').value.trim():'',
    firma:$('prfFirma')?$('prfFirma').value.trim():''
  };
  try{localStorage.setItem('veridia_profile',JSON.stringify(prof))}catch(e){console.warn('[Veridia]',e.message||e)}
  closeModal();toast('Perfil actualizado');
}

// #69 Datos de la clínica
function openEditClinica(){
  var cl=JSON.parse(localStorage.getItem('veridia_clinica_data')||'{}');
  openModal('<div class="modal-header"><h3>Datos de la clinica</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body">'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Nombre</label><input id="clNombre" value="'+(cl.nombre||localStorage.getItem('veridia_clinica')||'Clinica de Nutricion')+'"></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">CIF/NIF</label><input id="clCIF" value="'+(cl.cif||'')+'"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Telefono</label><input id="clTel" value="'+(cl.telefono||'')+'"></div></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Direccion</label><input id="clDir" value="'+(cl.direccion||'')+'"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Email</label><input id="clEmail" value="'+(cl.email||'')+'"></div>'
  +'</div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="saveClinicaData()">Guardar</button></div>');
}

function saveClinicaData(){
  var cl={
    nombre:$('clNombre')?$('clNombre').value.trim():'',
    cif:$('clCIF')?$('clCIF').value.trim():'',
    telefono:$('clTel')?$('clTel').value.trim():'',
    direccion:$('clDir')?$('clDir').value.trim():'',
    email:$('clEmail')?$('clEmail').value.trim():''
  };
  try{localStorage.setItem('veridia_clinica_data',JSON.stringify(cl));localStorage.setItem('veridia_clinica',cl.nombre)}catch(e){console.warn('[Veridia]',e.message||e)}
  closeModal();toast('Datos de clinica actualizados');
}

// S2: Export/import clinic configuration
function exportConfig(){
  var config={
    clinica:localStorage.getItem('veridia_clinica')||'',
    currency:CURRENCY,lang:LANG,
    themeColor:localStorage.getItem('veridia_theme_color')||'#2E8B57',
    sessionTimeout:localStorage.getItem('veridia_timeout')||'30',
    exportDate:new Date().toISOString()
  };
  var blob=new Blob([JSON.stringify(config,null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='veridia-config.json';a.click();
  toast('Configuración exportada','success');
}
function importConfig(){
  var input=document.createElement('input');input.type='file';input.accept='.json';
  input.onchange=function(){
    var reader=new FileReader();
    reader.onload=function(e){
      try{
        var cfg=JSON.parse(e.target.result);
        if(cfg.clinica)localStorage.setItem('veridia_clinica',cfg.clinica);
        if(cfg.currency)setCurrency(cfg.currency);
        if(cfg.lang)setLang(cfg.lang);
        if(cfg.themeColor)setThemeColor(cfg.themeColor);
        if(cfg.sessionTimeout)localStorage.setItem('veridia_timeout',cfg.sessionTimeout);
        toast('Configuración importada — recargando...','success');
        setTimeout(function(){location.reload()},1500);
      }catch(err){toast('Archivo de configuración inválido','error')}
    };
    reader.readAsText(input.files[0]);
  };
  input.click();
}
