// ===== BACKUP / RESTORE =====
function backupData(){
  var data={
    version:'5.0',exportDate:new Date().toISOString(),
    patients:DB.patients,clinicalHistories:DB.clinicalHistories,
    antropometrias:DB.antropometrias,analiticas:DB.analiticas,
    appointments:DB.appointments,invoices:DB.invoices,
    recipes:DB.recipes,alerts:DB.alerts,
    cashSession:DB.cashSession,auditLog:DB.auditLog,
    mealPlans:typeof mealPlans!=='undefined'?mealPlans:[],
    anamnesisData:DB.anamnesisData||{},
    favFoods:DB.favFoods||[],customPlatos:DB.customPlatos||[],
    formulaResults:DB.formulaResults||{},
    patNotes:typeof patNotes!=='undefined'?patNotes:{},
    chatDB:typeof chatDB!=='undefined'?chatDB:{},
    planTemplates:typeof planTemplates!=='undefined'?planTemplates:[],
    diarioData:DB.diarioData||{},
    gastos:DB.gastos||[],productos:DB.productos||[],inventario:DB.inventario||[],snMonitor:DB.snMonitor||{},alimentosCustom:DB.alimentosCustom||[],gastosRecurrentes:DB.gastosRecurrentes||[],horariosBlock:DB.horariosBlock||[],presupuesto:DB.presupuesto||{},iaHistory:DB.iaHistory||[],alimentosUsados:DB.alimentosUsados||{},
      rcCentros:DB.rcCentros||[],rcMenus:DB.rcMenus||[],rcProveedores:DB.rcProveedores||[],rcLotes:DB.rcLotes||[],rcMermas:DB.rcMermas||[],rcAppcc:DB.rcAppcc||[],rcNextCentroId:DB.rcNextCentroId||1,rcNextMenuId:DB.rcNextMenuId||1,
    feedback:DB.feedback||[],soporteNutricional:typeof SN!=='undefined'?SN.data:{},
    sintomasData:DB.sintomasData||{},
    lang:typeof LANG!=='undefined'?LANG:'es',
    currency:typeof CURRENCY!=='undefined'?CURRENCY:'EUR'
  };
  var json=JSON.stringify(data,null,2);
  var blob=new Blob([json],{type:'application/json'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='nutrisuite_backup_'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
  auditAction('EXPORT','Backup completo','Todos los datos');
  toast('📦 Backup descargado ('+Math.round(json.length/1024)+'KB)');
}

function restoreData(){
  openModal('<div class="modal-header"><h3>📦 Restaurar backup</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body">'
  +'<div class="alert alert-warning" style="margin-bottom:14px">⚠️ <strong>Atención:</strong> Esto reemplazará TODOS los datos actuales con los del archivo de backup.</div>'
  +'<div class="form-group"><label class="form-label">Seleccionar archivo de backup (.json)</label><input type="file" id="restoreFile" accept=".json" style="padding:10px"></div>'
  +'</div>'
  +'<div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancelar</button><button class="btn btn-danger" onclick="doRestore()">⚠️ Restaurar datos</button></div>');
}

function doRestore(){
  var file=$('restoreFile');if(!file||!file.files[0]){toast('Seleccione un archivo','error');return}
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var data=JSON.parse(e.target.result);
      if(!data.version||!data.patients){toast('Archivo de backup inválido','error');return}
      DB.patients=data.patients||[];
      DB.clinicalHistories=data.clinicalHistories||[];
      DB.antropometrias=data.antropometrias||[];
      DB.analiticas=data.analiticas||[];
      DB.appointments=data.appointments||[];
      DB.invoices=data.invoices||[];
      DB.recipes=data.recipes||[];
      DB.alerts=data.alerts||[];
      DB.auditLog=data.auditLog||[];
      if(data.cashSession)DB.cashSession=data.cashSession;
      if(data.mealPlans&&typeof mealPlans!=='undefined'){mealPlans.length=0;data.mealPlans.forEach(function(p){mealPlans.push(p)})}
      if(data.anamnesisData)DB.anamnesisData=data.anamnesisData;
      if(data.favFoods)DB.favFoods=data.favFoods;
      if(data.customPlatos)DB.customPlatos=data.customPlatos;
      if(data.formulaResults)DB.formulaResults=data.formulaResults;
      if(data.patNotes&&typeof patNotes!=='undefined'){for(var k in data.patNotes)patNotes[k]=data.patNotes[k]}
      if(data.chatDB&&typeof chatDB!=='undefined'){for(var k in data.chatDB)chatDB[k]=data.chatDB[k]}
      if(data.planTemplates&&typeof planTemplates!=='undefined'){planTemplates.length=0;data.planTemplates.forEach(function(t){planTemplates.push(t)})}
      if(data.diarioData)DB.diarioData=data.diarioData;
      if(data.gastos)DB.gastos=data.gastos;
      if(data.productos)DB.productos=data.productos;
      if(data.inventario)DB.inventario=data.inventario;
      if(data.snMonitor)DB.snMonitor=data.snMonitor;
      if(data.alimentosCustom)DB.alimentosCustom=data.alimentosCustom;
      if(data.gastosRecurrentes)DB.gastosRecurrentes=data.gastosRecurrentes;
      if(data.horariosBlock)DB.horariosBlock=data.horariosBlock;
      if(data.presupuesto)DB.presupuesto=data.presupuesto;
      if(data.iaHistory)DB.iaHistory=data.iaHistory;
      if(data.alimentosUsados)DB.alimentosUsados=data.alimentosUsados;
      if(data.rcCentros)DB.rcCentros=data.rcCentros;if(data.rcMenus)DB.rcMenus=data.rcMenus;
      if(data.rcProveedores)DB.rcProveedores=data.rcProveedores;if(data.rcLotes)DB.rcLotes=data.rcLotes;
      if(data.rcMermas)DB.rcMermas=data.rcMermas;if(data.rcAppcc)DB.rcAppcc=data.rcAppcc;
      if(data.rcNextCentroId)DB.rcNextCentroId=data.rcNextCentroId;if(data.rcNextMenuId)DB.rcNextMenuId=data.rcNextMenuId;
      if(data.soporteNutricional&&typeof SN!=='undefined')SN.data=data.soporteNutricional;
      if(data.sintomasData)DB.sintomasData=data.sintomasData;
      if(data.lang&&typeof setLang==='function')setLang(data.lang);
      if(data.currency&&typeof setCurrency==='function')setCurrency(data.currency);
      // Recalculate IDs
      DB.nextPId=Math.max(0,...DB.patients.map(function(p){return p.id||0}))+1;
      DB.nextAId=Math.max(0,...DB.appointments.map(function(a){return a.id||0}))+1;
      DB.nextIId=Math.max(0,...DB.invoices.map(function(i){return i.id||0}))+1;
      closeModal();
      auditAction('IMPORT','Restore backup',data.patients.length+' pacientes');
      toast('✅ Backup restaurado: '+data.patients.length+' pacientes, '+data.appointments.length+' citas');
      fbSyncDB();
      navigate('dashboard');
    }catch(err){toast('Error al leer backup: '+err.message,'error')}
  };
  reader.readAsText(file.files[0]);
}

// ===== INFORME CLÍNICO IMPRIMIBLE =====
function generateClinicalReport(patId){
  var p=gP(patId);if(!p){toast('Paciente no encontrado','error');return}
  var ch=DB.clinicalHistories.find(function(h){return h.pacienteId===patId});
  var antros=DB.antropometrias.filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)});
  var anals=DB.analiticas.filter(function(a){return a.pacienteId===patId}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)});
  var ultimo=antros[0];
  var activePlan=(typeof mealPlans!=='undefined')?mealPlans.find(function(mp){return mp.pacienteId===patId&&mp.estado==='activo'}):null;
  var alerts=DB.alerts.filter(function(a){return a.pacienteId===patId&&a.estado==='pendiente'});

  var w=window.open('','_blank','width=800,height=600');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Informe Clínico — '+p.nombre+' '+p.apellidos+'</title>'
  +'<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;font-size:11px;color:#333;padding:20mm;max-width:210mm;margin:0 auto}h1{font-size:16px;margin-bottom:4px;color:#2E8B57}h2{font-size:13px;margin:16px 0 6px;padding-bottom:4px;border-bottom:2px solid #2E8B57;color:#2E8B57}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:3px solid #2E8B57}.meta{font-size:9px;color:#888;line-height:1.6}.section{margin-bottom:14px}table{width:100%;border-collapse:collapse;font-size:10px;margin:6px 0}th,td{padding:5px 8px;border:1px solid #e0e0e0;text-align:left}th{background:#f0f7f4;font-weight:700;color:#2E8B57}.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:8px;font-weight:700}.badge-danger{background:#fee;color:#c33}.badge-warning{background:#ffd;color:#885}.badge-success{background:#efe;color:#363}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.value{font-weight:700;font-size:12px}.label{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:.5px}.footer{margin-top:30px;padding-top:12px;border-top:2px solid #2E8B57;font-size:8px;color:#aaa;display:flex;justify-content:space-between}.logo-block{display:flex;align-items:center;gap:10px}.signature{margin-top:40px;text-align:right;font-size:10px;color:#555}@media print{body{padding:10mm}}</style></head><body>'
  +'<div class="header"><div class="logo-block"><div><h1>Veridia HealthTech</h1><div class="meta">Clínica de Nutrición · Lic. Antonella Caverzan<br>Informe Clínico Nutricional · '+new Date().toLocaleDateString('es-ES')+'</div></div></div><div style="text-align:right"><div style="font-size:14px;font-weight:700;color:#2E8B57">'+p.nombre+' '+p.apellidos+'</div><div class="meta">'+(p.dni?'DNI: '+p.dni+'<br>':'')+age(p.fechaNacimiento||p.fecha_nacimiento)+' años · '+(p.sexo||'')+(p.telefono?'<br>Tel: '+p.telefono:'')+'</div></div></div>'
  // Datos personales
  +'<div class="section"><h2>📋 Datos del paciente</h2><div class="grid">'
  +'<div><span class="label">Motivo consulta</span><br><span class="value">'+(p.motivoConsulta||p.motivo_consulta||'—')+'</span></div>'
  +'<div><span class="label">Contacto</span><br>'+(p.email||'')+(p.telefono?' · '+p.telefono:'')+'</div>'
  +'</div></div>'
  // Antecedentes
  +(ch?'<div class="section"><h2>🩺 Antecedentes</h2><div class="grid">'
  +'<div><span class="label">Personales</span><br>'+(ch.antecedentes||'—')+'</div>'
  +'<div><span class="label">Familiares</span><br>'+(ch.antecedentesFamiliares||'—')+'</div>'
  +'<div><span class="label">Alergias</span><br><strong>'+(ch.alergias||'Ninguna')+'</strong></div>'
  +'<div><span class="label">Medicación</span><br>'+(ch.medicacion||'Ninguna')+'</div>'
  +'</div></div>':'')
  // Antropometría
  +(ultimo?'<div class="section"><h2>⚖️ Antropometría actual ('+fD(ultimo.fecha)+')</h2><div class="grid" style="grid-template-columns:repeat(4,1fr)">'
  +[{l:'Peso',v:ultimo.peso+'kg'},{l:'Talla',v:ultimo.altura+'cm'},{l:'IMC',v:ultimo.imc+' ('+imcCat(ultimo.imc).l+')'},{l:'Cintura',v:ultimo.cintura+'cm'},{l:'Cadera',v:ultimo.cadera+'cm'},{l:'Pantorrilla',v:(ultimo.pantorrilla||'—')+'cm'},{l:'% Grasa',v:ultimo.grasaCorporal+'%'},{l:'M. Muscular',v:ultimo.masaMuscular+'kg'}
  ].map(function(x){return'<div><span class="label">'+x.l+'</span><br><span class="value">'+x.v+'</span></div>'}).join('')
  +'</div>'
  +(antros.length>1?'<table><thead><tr><th>Fecha</th><th>Peso</th><th>IMC</th><th>Cintura</th><th>% Grasa</th></tr></thead><tbody>'
  +antros.slice(0,6).map(function(a){return'<tr><td>'+fD(a.fecha)+'</td><td><strong>'+a.peso+'kg</strong></td><td>'+a.imc+'</td><td>'+a.cintura+'cm</td><td>'+a.grasaCorporal+'%</td></tr>'}).join('')
  +'</tbody></table>':'')
  +'</div>':'')
  // Analíticas
  +(anals.length?'<div class="section"><h2>🔬 Última analítica ('+fD(anals[0].fecha)+')</h2><table><thead><tr><th>Biomarcador</th><th>Valor</th><th>Rango</th><th>Estado</th></tr></thead><tbody>'
  +anals[0].marcadores.map(function(m){return'<tr><td>'+m.nombre+'</td><td><strong>'+m.valor+' '+m.unidad+'</strong></td><td>'+m.rango+'</td><td>'+(m.alerta?'<span class="badge badge-'+(m.alerta==='grave'?'danger':'warning')+'">'+m.alerta+'</span>':'<span class="badge badge-success">Normal</span>')+'</td></tr>'}).join('')
  +'</tbody></table></div>':'')
  // Alertas
  +(alerts.length?'<div class="section"><h2>🚨 Alertas activas</h2>'
  +alerts.map(function(a){return'<div style="padding:6px;margin-bottom:4px;background:#fee;border-left:3px solid #c33;font-size:10px"><strong>'+a.mensaje+'</strong><br><span style="color:#888">'+a.recomendacion+'</span></div>'}).join('')+'</div>':'')
  // Plan activo
  +(activePlan?'<div class="section"><h2>🍽️ Plan alimentario activo</h2><div class="grid" style="grid-template-columns:repeat(5,1fr);margin-bottom:8px">'
  +[{l:'Kcal',v:activePlan.kcalObjetivo},{l:'Prot',v:activePlan.protG+'g'},{l:'Grasas',v:activePlan.grasasG+'g'},{l:'HC',v:activePlan.hcG+'g'},{l:'Patología',v:activePlan.patologia||'—'}
  ].map(function(x){return'<div><span class="label">'+x.l+'</span><br><span class="value">'+x.v+'</span></div>'}).join('')+'</div></div>':'')
  // Footer
  +'<div class="signature"><div style="border-top:1px solid #999;display:inline-block;padding-top:4px;min-width:200px">Firma: '+(currentUser?currentUser.name:'Lic. Antonella Caverzan')+'</div><div style="font-size:8px;color:#aaa;margin-top:2px">Lic. en Nutrición</div></div>'
  +'<div class="footer"><span>Veridia HealthTech © '+new Date().getFullYear()+' · Informe generado el '+new Date().toLocaleDateString('es-ES')+' a las '+new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})+'</span><span>Documento confidencial · Datos protegidos por RGPD/LOPD-GDD</span></div>'
  +'<script>setTimeout(function(){window.print()},500)<\/script></body></html>');
  w.document.close();
  auditAction('EXPORT','Informe clínico',p.nombre+' '+p.apellidos);
}

// ===== EXPORT CSV =====
function exportCSV(filename,headers,rows){
  var csv=headers.join(',')+'\n';
  rows.forEach(function(r){csv+=r.map(function(c){return'"'+String(c||'').replace(/"/g,'""')+'"'}).join(',')+'\n'});
  var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();
  toast('📥 '+filename+' descargado');
}

function exportPatients(){
  var h=['Nombre','Apellidos','DNI','Fecha Nac.','Sexo','Email','Teléfono','Motivo','Activo'];
  var r=DB.patients.map(function(p){return[p.nombre,p.apellidos,p.dni,p.fechaNacimiento||p.fecha_nacimiento,p.sexo,p.email,p.telefono,p.motivoConsulta||p.motivo_consulta,p.activo?'Sí':'No']});
  exportCSV('pacientes_'+new Date().toISOString().slice(0,10)+'.csv',h,r);
}

function exportInvoices(){
  var h=['Número','Paciente','Fecha','Estado','Total ('+CURRENCIES[CURRENCY].symbol+')'];
  var r=DB.invoices.map(function(i){var p=gP(i.pacienteId);return[i.numero,p?p.nombre+' '+p.apellidos:'—',i.fecha,i.estado,i.total]});
  exportCSV('facturas_'+new Date().toISOString().slice(0,10)+'.csv',h,r);
}

function exportAppointments(){
  var h=['Fecha','Hora','Paciente','Tipo','Estado','Precio ('+CURRENCIES[CURRENCY].symbol+')'];
  var r=DB.appointments.map(function(a){var p=gP(a.pacienteId);return[a.fecha,a.hora,p?p.nombre+' '+p.apellidos:'—',a.tipo,a.estado,a.precio]});
  exportCSV('citas_'+new Date().toISOString().slice(0,10)+'.csv',h,r);
}

function exportAuditLog(){
  var h=['Fecha','Usuario','Rol','Acción','Entidad','Paciente','IP'];
  var r=DB.auditLog.map(function(l){return[l.fecha,l.usuario,l.rol,l.accion,l.entidad,l.paciente,l.ip]});
  exportCSV('auditoria_'+new Date().toISOString().slice(0,10)+'.csv',h,r);
}

// ===== AUDITORÍA =====
function rAudit(){
  $('mainContent').innerHTML=`<div class="fade-in"><div class="alert alert-info">🔒 Registro inmutable · RGPD/LOPD · Retención según normativa</div>
<div class="card"><div class="card-header"><span class="card-title">📋 Audit Log</span><div style="display:flex;gap:6px"><select style="width:auto" id="aF" onchange="fAudit()"><option>Todas</option><option>CREATE</option><option>READ</option><option>UPDATE</option><option>LOGIN</option></select><button class="btn btn-outline btn-sm" onclick="exportAuditLog()">${IC.dl} CSV</button></div></div>
<div class="card-body" style="padding:0;overflow-x:auto"><table><thead><tr><th>Fecha</th><th>Usuario</th><th>Rol</th><th>Acción</th><th>Entidad</th><th>Paciente</th><th>IP</th></tr></thead><tbody id="aB">
${DB.auditLog.map(l=>`<tr class="ar" data-a="${l.accion}"><td><code style="font-size:.72rem">${l.fecha}</code></td><td>${l.usuario}</td><td><span class="badge badge-neutral">${l.rol}</span></td><td><span class="badge ${l.accion==='CREATE'?'badge-success':l.accion==='UPDATE'?'badge-warning':l.accion==='LOGIN'?'badge-info':'badge-neutral'}">${l.accion}</span></td><td>${l.entidad}</td><td>${l.paciente}</td><td style="color:var(--text3);font-size:.78rem">${l.ip}</td></tr>`).join('')}
</tbody></table></div></div></div>`;
}
function fAudit(){const f=$('aF').value;document.querySelectorAll('.ar').forEach(r=>r.style.display=(f==='Todas'||r.dataset.a===f)?'':'none')}

// G14: Universal PDF export with clinic branding
function universalPDF(title,bodyHtml){
  var clinica='';try{clinica=localStorage.getItem('veridia_clinica')||'Clínica de Nutrición'}catch(e){console.warn('[Veridia]',e.message||e)}
  var prof=currentUser?currentUser.name:'';
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+title+'</title>'
  +'<style>body{font-family:Arial,sans-serif;margin:30px;font-size:12px;color:#333}'
  +'h1{color:#2E8B57;font-size:16px;border-bottom:2px solid #2E8B57;padding-bottom:6px}'
  +'h2{font-size:13px;margin-top:14px}table{width:100%;border-collapse:collapse;margin:8px 0}'
  +'th,td{border:1px solid #ddd;padding:5px;text-align:left;font-size:11px}th{background:#f5f5f5}'
  +'.header{display:flex;justify-content:space-between;margin-bottom:16px}'
  +'.footer{margin-top:30px;font-size:9px;color:#999;border-top:1px solid #ddd;padding-top:8px}'
  +'</style></head><body>'
  +'<div class="header"><div><h1>'+title+'</h1><div>'+clinica+'</div></div>'
  +'<div style="text-align:right;font-size:11px"><strong>Fecha:</strong> '+new Date().toLocaleDateString('es-ES')
  +'<br><strong>Profesional:</strong> '+prof+'</div></div>'
  +bodyHtml
  +'<div class="footer">Generado por Veridia HealthTech · '+new Date().toLocaleString('es-ES')+'</div>'
  +'</body></html>';
  var w=window.open('','_blank');
  if(w){w.document.write(html);w.document.close();setTimeout(function(){w.print()},300)}
  else{toast('Permite popups para imprimir','error')}
}
