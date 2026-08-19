// ===== PACIENTES =====
function rPat(p){
  var q=p&&p.search||'';
  var fl;
  if(q.startsWith('tag:')){var tagQ=q.substring(4).toLowerCase();fl=DB.patients.filter(function(x){return(x.tags||[]).some(function(t){return t.toLowerCase()===tagQ})})}
  else{fl=q?DB.patients.filter(function(x){return(x.nombre+' '+x.apellidos+' '+x.dni+' '+(x.tags||[]).join(' ')).toLowerCase().includes(q.toLowerCase())}):DB.patients}
  if(q)_pageState['pat']={page:0};
  var pg=paginate('pat',fl,20);

  var activos=DB.patients.filter(function(p){return p.activo}).length;
  var archivados=DB.patients.length-activos;
  var thisMonth=new Date().toISOString().slice(0,7);
  var nuevosEsteMes=DB.patients.filter(function(p){return p.createdAt&&p.createdAt.startsWith(thisMonth)}).length;

  // All unique tags
  var allTags={};DB.patients.forEach(function(p){(p.tags||[]).forEach(function(t){allTags[t]=(allTags[t]||0)+1})});
  var tagKeys=Object.keys(allTags).sort(function(a,b){return allTags[b]-allTags[a]});

  // ═══ HERO HEADER ═══
  var h='<div class="fade-in">'
  +'<div class="card" style="border:none;background:linear-gradient(135deg,#0E7490 0%,#0891B2 50%,#22D3EE 100%);color:#fff;margin-bottom:22px;border-radius:var(--radius);overflow:hidden;position:relative">'
  +'<div style="position:absolute;top:-30px;right:-20px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.04)"></div>'
  +'<div style="position:absolute;bottom:-50px;right:80px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,.02)"></div>'
  +'<div class="card-body" style="padding:22px 28px;position:relative;z-index:1">'
  +'<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px">'
  +'<div><div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">'
  +'<span style="font-size:1.6rem">👥</span>'
  +'<h2 style="margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.3px">Pacientes</h2></div>'
  +'<p style="margin:0;font-size:.78rem;opacity:.75">'+activos+' activos · '+archivados+' archivados'+(nuevosEsteMes?' · <strong>+'+nuevosEsteMes+' este mes</strong>':'')+'</p></div>'
  +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
  +'<button class="btn" style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25);font-size:.78rem" onclick="exportPatients()">📥 Exportar CSV</button>'
  +'<button class="btn" style="background:#fff;color:#1A8A8A;font-weight:700;border:none" onclick="openNewPat()">'+IC.plus+' Nuevo paciente</button>'
  +'</div></div></div></div>';

  // ═══ SEARCH + FILTERS ═══
  h+='<div style="display:flex;gap:10px;align-items:center;margin-bottom:18px;flex-wrap:wrap">'
  +'<div style="flex:1;min-width:200px;position:relative">'
  +'<input type="text" placeholder="Buscar por nombre, DNI o etiqueta..." style="width:100%;padding-left:14px;font-size:.85rem" id="pSrch" value="'+sanitize(q)+'" onkeyup="if(event.key===\'Enter\')navigate(\'pacientes\',{search:this.value})" aria-label="Buscar pacientes" role="searchbox">'
  +'</div>'
  +'<select style="width:160px;font-size:.78rem" onchange="navigate(\'pacientes\',{search:this.value?\'tag:\'+this.value:\'\'})">'
  +'<option value="">🏷️ Todos los tags</option>'+tagKeys.map(function(t){return '<option '+(q==='tag:'+t?'selected':'')+'>'+t+' ('+allTags[t]+')</option>'}).join('')
  +'</select>'
  +'<span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.72rem;padding:6px 12px;border-radius:8px">'+fl.length+' resultado'+(fl.length!==1?'s':'')+'</span>'
  +'</div>';

  // ═══ PATIENT TABLE ═══
  h+='<div class="card" style="border-top:3px solid var(--accent)">'
  +'<div class="card-body" style="padding:0;overflow-x:auto">';

  if(!pg.items.length){
    h+='<div style="text-align:center;padding:50px"><div style="font-size:3rem;opacity:.3;margin-bottom:12px">👥</div>'
    +'<p style="color:var(--text-secondary);font-size:.88rem;margin:0">'+(q?'Sin resultados para "'+sanitize(q)+'"':'No hay pacientes registrados')+'</p>'
    +(q?'<button class="btn btn-outline btn-sm" style="margin-top:12px;border-radius:8px" onclick="navigate(\'pacientes\')">Limpiar búsqueda</button>':'')
    +'</div>';
  } else {
    h+='<table style="width:100%;border-collapse:collapse;font-size:.82rem" role="table" aria-label="Lista de pacientes">'
    +'<thead><tr style="background:var(--surface2)">'
    +'<th style="padding:10px 12px;width:40px" scope="col"></th>'
    +'<th style="padding:10px 10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600" scope="col">Nombre</th>'
    +'<th style="padding:10px 10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">DNI</th>'
    +'<th style="padding:10px 10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Edad</th>'
    +'<th style="padding:10px 10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Sexo</th>'
    +'<th style="padding:10px 10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Teléfono</th>'
    +'<th style="padding:10px 10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Última cita</th>'
    +'<th style="padding:10px 10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Estado</th>'
    +'<th style="padding:10px 8px;width:110px"></th>'
    +'</tr></thead><tbody>';

    pg.items.forEach(function(pt,i){
      var isAlt=i%2===1;
      var lastAppt=DB.appointments.filter(function(a){return a.pacienteId===pt.id}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)})[0];
      var sexIcon=pt.sexo==='FEMENINO'?'♀':pt.sexo==='MASCULINO'?'♂':'⚧';
      var sexColor=pt.sexo==='FEMENINO'?'#db2777':pt.sexo==='MASCULINO'?'#2563eb':'#6366f1';
      var isNew=pt.createdAt&&pt.createdAt.startsWith(thisMonth);

      h+='<tr style="border-bottom:1px solid var(--border);background:'+(isAlt?'var(--surface)':'transparent')+';transition:background .15s" onmouseover="this.style.background=\'var(--primary-light)\'" onmouseout="this.style.background=\''+(isAlt?'var(--surface)':'transparent')+'\'">'
      // Avatar
      +'<td style="padding:10px 12px">'
      +(pt.foto
        ?'<img src="'+pt.foto+'" style="width:34px;height:34px;border-radius:10px;object-fit:cover;border:2px solid var(--border)">'
        :'<div class="avatar avatar-sm" style="background:'+aCol(pt.id)+';color:#fff;border-radius:10px;width:34px;height:34px;font-size:.7rem">'+ini(pt.nombre,pt.apellidos)+'</div>')
      +'</td>'
      // Name
      +'<td style="padding:10px"><div>'
      +'<strong style="cursor:pointer;color:var(--accent);font-size:.84rem" onclick="selPat='+pt.id+';navigate(\'historia\')" role="link" tabindex="0" onkeydown="if(event.key===\'Enter\'){selPat='+pt.id+';navigate(\'historia\')}">'+sanitize(pt.nombre)+' '+sanitize(pt.apellidos)+'</strong>'
      +(isNew?'<span style="display:inline-block;margin-left:6px;padding:1px 6px;border-radius:4px;font-size:.55rem;font-weight:700;background:var(--primary);color:#fff;vertical-align:middle">NUEVO</span>':'')
      +(pt.motivoConsulta?'<div style="font-size:.68rem;color:var(--text3);margin-top:1px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+sanitize(pt.motivoConsulta)+'">'+sanitize(pt.motivoConsulta)+'</div>':'')
      +'</div></td>'
      // DNI
      +'<td style="padding:10px"><code style="font-size:.75rem;background:var(--surface2);padding:2px 6px;border-radius:4px">'+sanitize(pt.dni)+'</code></td>'
      // Age
      +'<td style="padding:10px;text-align:center;font-variant-numeric:tabular-nums;font-weight:600">'+age(pt.fechaNacimiento)+'<span style="font-size:.65rem;color:var(--text3);font-weight:400">a</span></td>'
      // Sex
      +'<td style="padding:10px;text-align:center"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:'+sexColor+'14;color:'+sexColor+';font-size:.85rem;font-weight:700">'+sexIcon+'</span></td>'
      // Phone
      +'<td style="padding:10px"><a href="tel:'+pt.telefono+'" style="color:var(--accent);text-decoration:none;font-size:.8rem;font-variant-numeric:tabular-nums">'+pt.telefono+'</a></td>'
      // Last appointment
      +'<td style="padding:10px;text-align:center;font-size:.75rem;font-variant-numeric:tabular-nums;color:var(--text3)">'+(lastAppt?fD(lastAppt.fecha):'<span style="opacity:.4">—</span>')+'</td>'
      // Status + tags
      +'<td style="padding:10px;text-align:center">'
      +'<span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:.65rem;font-weight:700;'
      +(pt.activo?'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0':'background:var(--surface2);color:var(--text3);border:1px solid var(--border)')
      +'">'+(pt.activo?'Activo':'Archivado')+'</span>'
      +((pt.tags||[]).length?'<div style="display:flex;gap:2px;justify-content:center;margin-top:3px;flex-wrap:wrap">'
      +(pt.tags||[]).slice(0,3).map(function(t){return '<span style="font-size:.52rem;padding:1px 4px;border-radius:3px;background:var(--accent-light);color:var(--accent);font-weight:600">'+t+'</span>'}).join('')
      +((pt.tags||[]).length>3?'<span style="font-size:.52rem;color:var(--text3)">+'+((pt.tags||[]).length-3)+'</span>':'')
      +'</div>':'')
      +'</td>'
      // Actions
      +'<td style="padding:10px"><div style="display:flex;gap:4px;justify-content:flex-end">'
      +'<button class="btn btn-outline btn-xs" style="border-radius:6px" onclick="selPat='+pt.id+';navigate(\'historia\')" title="Ver historia">'+IC.eye+'</button>'
      +'<button class="btn btn-outline btn-xs" style="border-radius:6px" onclick="editPat('+pt.id+')" title="Editar">'+IC.edit+'</button>'
      +(pt.activo
        ?'<button class="btn btn-ghost btn-xs" style="border-radius:6px;color:var(--text3)" onclick="togglePatActive('+pt.id+')" title="Archivar">📁</button>'
        :'<button class="btn btn-ghost btn-xs" style="border-radius:6px;color:var(--success)" onclick="togglePatActive('+pt.id+')" title="Reactivar">✓</button>')
      +'</div></td></tr>';
    });
    h+='</tbody></table>';
  }
  h+='</div></div>';

  // Pagination
  h+=pageNav('pat',pg,"navigate('pacientes'"+(q?",{search:'"+q+"'}":"")+")");

  h+='</div>';
  $('mainContent').innerHTML=h;
}

// ═══ NEW PATIENT MODAL ═══
function openNewPat(){
  openModal('<div class="modal-header"><h3>👤 Nuevo paciente</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body"><div style="display:grid;gap:14px">'

  // Section: Personal data
  +'<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--primary-light);border-radius:8px;margin-bottom:2px"><span style="font-size:.9rem">📋</span><strong style="font-size:.82rem;color:var(--primary)">Datos personales</strong></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Nombre *</label><input id="npN"></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Apellidos *</label><input id="npA"></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">DNI / Documento *</label><input id="npD" maxlength="12"></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Fecha nacimiento</label><input type="date" id="npF"></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Sexo</label><select id="npS"><option value="FEMENINO">Femenino</option><option value="MASCULINO">Masculino</option><option value="OTRO">Otro</option></select></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Grupo sanguíneo</label><select id="npGS"><option value="">—</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option></select></div></div>'

  // Section: Demographics
  +'<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--accent-light);border-radius:8px;margin:6px 0 2px"><span style="font-size:.9rem">🌍</span><strong style="font-size:.82rem;color:var(--accent)">Datos demográficos</strong></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Nacionalidad</label><input id="npNac" value="Argentina"></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Procedencia</label><input id="npProc" placeholder="Ciudad / localidad"></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Estado civil</label><select id="npEC"><option value="soltero/a">Soltero/a</option><option value="casado/a">Casado/a</option><option value="divorciado/a">Divorciado/a</option><option value="viudo/a">Viudo/a</option><option value="otro">Otro</option></select></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Nivel educación</label><select id="npEdu"><option>Primaria</option><option>Secundaria</option><option selected>Universitaria</option><option>Posgrado</option><option>Otro</option></select></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Profesión / Ocupación</label><input id="npP" placeholder="Profesión"></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Motivo de consulta</label><input id="npMot" placeholder="¿Por qué consulta?"></div></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">🏷️ Etiquetas <span style="font-size:.6rem;color:var(--text3);text-transform:none;letter-spacing:0">(separadas por coma)</span></label><input id="npTags" placeholder="ej: diabetes, embarazo, vegetariano"></div>'

  // Section: Contact
  +'<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#eff6ff;border-radius:8px;margin:6px 0 2px"><span style="font-size:.9rem">📱</span><strong style="font-size:.82rem;color:#2563eb">Contacto</strong></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">📧 Email</label><input type="email" id="npE" placeholder="correo@ejemplo.com"></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">📱 Teléfono</label><input id="npT" placeholder="Teléfono"></div></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">📍 Dirección</label><input id="npDir" placeholder="Dirección completa"></div>'

  +'</div></div><div class="modal-footer"><button class="btn btn-outline" style="border-radius:8px" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" style="border-radius:8px;padding:10px 24px" onclick="savePat()">👤 Registrar paciente</button></div>',true);
}

function savePat(){
  if(typeof checkPatientLimit==='function'&&!checkPatientLimit())return;
  const n=sanitize($('npN').value.trim()),a=sanitize($('npA').value.trim()),d=sanitize($('npD').value.trim());
  if(!n||!a||!d){toast('Campos obligatorios','error');return}
  if(DB.patients.some(function(p){return p.dni===d})){toast('DNI duplicado','error');return}
  var em=$('npE').value.trim();
  if(em&&!isValidEmail(em)){toast('Email no válido','error');return}
  DB.patients.push({id:DB.nextPId++,nombre:n,apellidos:a,dni:d,fechaNacimiento:$('npF').value||'1990-01-01',sexo:$('npS').value,email:$('npE').value,telefono:$('npT').value,direccion:sanitize($('npDir').value||''),profesion:sanitize($('npP').value),nacionalidad:sanitize($('npNac').value||''),estadoCivil:$('npEC').value||'',educacion:$('npEdu').value||'',procedencia:sanitize($('npProc').value||''),motivoConsulta:sanitize($('npMot').value||''),grupoSanguineo:$('npGS').value||'',tags:($('npTags').value||'').split(',').map(function(t){return t.trim()}).filter(Boolean),activo:true,clinicaId:1,createdAt:new Date().toISOString().slice(0,10)});
  closeModal();toast(n+' '+a+' registrado');showSaved();navigate('pacientes');
}

// ═══ EDIT PATIENT MODAL ═══
function editPat(id){
  const p=gP(id);if(!p)return;
  openModal('<div class="modal-header"><h3>✏️ '+sanitize(p.nombre)+' '+sanitize(p.apellidos)+'</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body"><div style="display:grid;gap:14px">'

  +'<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--primary-light);border-radius:8px;margin-bottom:2px"><span style="font-size:.9rem">📋</span><strong style="font-size:.82rem;color:var(--primary)">Datos personales</strong></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Nombre</label><input id="epN" value="'+p.nombre+'"></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Apellidos</label><input id="epA" value="'+p.apellidos+'"></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">📱 Teléfono</label><input id="epT" value="'+p.telefono+'"></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">📧 Email</label><input id="epE" value="'+p.email+'"></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Grupo sanguíneo</label><select id="epGS"><option value="">—</option>'+['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(function(g){return '<option'+(p.grupoSanguineo===g?' selected':'')+'>'+g+'</option>'}).join('')+'</select></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Motivo consulta</label><input id="epMot" value="'+(p.motivoConsulta||'')+'"></div></div>'

  +'<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--accent-light);border-radius:8px;margin:6px 0 2px"><span style="font-size:.9rem">🌍</span><strong style="font-size:.82rem;color:var(--accent)">Demográficos</strong></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Nacionalidad</label><input id="epNac" value="'+(p.nacionalidad||'')+'"></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Procedencia</label><input id="epProc" value="'+(p.procedencia||'')+'"></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Estado civil</label><select id="epEC">'+['soltero/a','casado/a','divorciado/a','viudo/a','otro'].map(function(s){return '<option'+(p.estadoCivil===s?' selected':'')+'>'+s+'</option>'}).join('')+'</select></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Educación</label><input id="epEdu" value="'+(p.educacion||'')+'"></div></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Estado</label><select id="epAc"><option value="true" '+(p.activo?'selected':'')+'>✅ Activo</option><option value="false" '+(!p.activo?'selected':'')+'>📦 Archivado</option></select></div>'

  +'</div></div><div class="modal-footer"><button class="btn btn-outline" style="border-radius:8px" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" style="border-radius:8px;padding:10px 24px" onclick="saveEditP('+id+')">✏️ Guardar cambios</button></div>',true);
}

function saveEditP(id){
  const p=gP(id);if(!p)return;
  p.nombre=$('epN').value;p.apellidos=$('epA').value;p.telefono=$('epT').value;p.email=$('epE').value;
  p.grupoSanguineo=$('epGS').value;p.motivoConsulta=$('epMot').value;p.nacionalidad=$('epNac').value;
  p.procedencia=$('epProc').value;p.estadoCivil=$('epEC').value;p.educacion=$('epEdu').value;
  p.activo=$('epAc').value==='true';
  closeModal();toast('Actualizado');showSaved();
  if(typeof auditAction==='function')auditAction('EDIT','Paciente',p.nombre+' '+p.apellidos);
  navigate('pacientes');
}

// ═══ ARCHIVE / REACTIVATE ═══
function togglePatActive(id){
  var p=gP(id);if(!p)return;
  var action=p.activo?'archivar':'reactivar';
  var name=p.nombre+' '+p.apellidos;
  openModal('<div class="modal-header"><h3>'+(p.activo?'📦 Archivar':'✅ Reactivar')+' paciente</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body"><p style="font-size:.88rem">¿Deseas '+action+' a <strong>'+name+'</strong>?</p>'
  +(p.activo?'<p style="font-size:.78rem;color:var(--text3);margin-top:8px">El paciente dejará de aparecer en selectores activos pero sus datos se conservan.</p>':'')
  +'</div><div class="modal-footer"><button class="btn btn-outline" style="border-radius:8px" onclick="closeModal()">'+t('cancel')+'</button>'
  +'<button class="btn '+(p.activo?'btn-warning':'btn-primary')+'" style="border-radius:8px" onclick="confirmTogglePat('+id+')">'+(p.activo?'📦 Archivar':'✅ Reactivar')+'</button></div>');
}

function confirmTogglePat(id){
  var p=gP(id);if(!p)return;
  p.activo=!p.activo;
  closeModal();toast(p.nombre+' '+(p.activo?'reactivado':'archivado'));showSaved();navigate('pacientes');
}

// P1: Patient photo upload
function handlePatientPhoto(patId,input){
  if(!input.files||!input.files[0])return;
  var file=input.files[0];
  if(file.size>300000){toast('Imagen demasiado grande (máx 300KB)','error');return}
  var reader=new FileReader();
  reader.onload=function(e){
    var p=gP(patId);if(p){p.foto=e.target.result;saveData();toast('Foto actualizada','success');navigate('pacientes')}
  };
  reader.readAsDataURL(file);
}
