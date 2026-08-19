// ============================================================
//  DASHBOARD
// ============================================================
var _dashPeriod='month'; // week|month|quarter|year

function rDash(){
  var _dPeriod=new Date();var periodStart,periodLabel;
  if(_dashPeriod==='week'){periodStart=new Date(_dPeriod);periodStart.setDate(_dPeriod.getDate()-7);periodLabel='Esta semana'}
  else if(_dashPeriod==='quarter'){periodStart=new Date(_dPeriod.getFullYear(),Math.floor(_dPeriod.getMonth()/3)*3,1);periodLabel='Este trimestre'}
  else if(_dashPeriod==='year'){periodStart=new Date(_dPeriod.getFullYear(),0,1);periodLabel='Este año'}
  else{periodStart=new Date(_dPeriod.getFullYear(),_dPeriod.getMonth(),1);periodLabel='Este mes'}
  var pStart=periodStart.toISOString().slice(0,10);
  const today=new Date().toISOString().slice(0,10),thisMonth=today.substring(0,7),ta=DB.appointments.filter(a=>a.fecha===today&&a.estado!=='Cancelada'),ap=DB.patients.filter(p=>p.activo).length,pa=DB.alerts.filter(a=>a.estado==='pendiente').length,mr=DB.invoices.filter(i=>i.fecha>=pStart).reduce((s,i)=>s+i.total,0),pi=DB.invoices.filter(i=>(i.estado==='Pendiente'||i.estado==='Vencida')&&i.fecha>=pStart).length,ct=cashTotals();
  var mesLabel=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][new Date().getMonth()];
  var horaNum=new Date().getHours();
  var saludo=horaNum<12?'Buenos días':horaNum<20?'Buenas tardes':'Buenas noches';

  // ═══ HERO HEADER ═══
  var h='<div class="fade-in">'
  +'<div class="card" style="border:none;background:linear-gradient(135deg,#0E7490 0%,#0891B2 50%,#22D3EE 100%);color:#fff;margin-bottom:22px;border-radius:var(--radius);overflow:hidden;position:relative">'
  +'<div style="position:absolute;top:-30px;right:-30px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.04)"></div>'
  +'<div style="position:absolute;bottom:-50px;right:60px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.02)"></div>'
  +'<div class="card-body" style="padding:26px 30px;position:relative;z-index:1">'
  +'<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px">'
  +'<div><div style="font-size:.72rem;text-transform:uppercase;letter-spacing:1.2px;opacity:.7;margin-bottom:4px">'+saludo+'</div>'
  +'<h1 style="margin:0;font-size:1.4rem;font-weight:800;letter-spacing:-.3px">'+(currentUser?sanitize(currentUser.name):'Profesional')+'</h1>'
  +'<p style="margin:4px 0 0;font-size:.78rem;opacity:.7">'+fD(today)+' · '+periodLabel+'</p></div>'
  +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
  +['week','month','quarter','year'].map(function(p){var labels={week:'S',month:'M',quarter:'T',year:'A'};var full={week:'Semana',month:'Mes',quarter:'Trimestre',year:'Año'};return'<button title="'+full[p]+'" style="width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,'+ (_dashPeriod===p?'.9':'.3') +');background:'+(_dashPeriod===p?'rgba(255,255,255,.25)':'transparent')+';color:#fff;font-weight:700;font-size:.72rem;cursor:pointer;transition:all .2s" onclick="_dashPeriod=\''+p+'\';rDash()">'+labels[p]+'</button>'}).join('')
  +'</div></div></div></div>';

  // ═══ KPI STAT CARDS ═══
  h+='<div class="stats-grid" style="margin-bottom:22px">';
  // Citas hoy
  h+='<div class="stat-card" style="border-top:3px solid var(--primary)"><div class="stat-icon green">'+IC.cal+'</div><div class="stat-info"><h3>'+ta.length+'</h3><p>Citas hoy</p><div class="stat-trend up">'+IC.up+' '+ta.filter(a=>a.estado==='Confirmada').length+' confirmadas</div></div></div>';
  // Pacientes
  h+='<div class="stat-card" style="border-top:3px solid var(--accent)"><div class="stat-icon blue">'+IC.users+'</div><div class="stat-info"><h3>'+ap+'</h3><p>Pacientes activos</p><div class="stat-trend up">'+IC.up+' +'+DB.patients.filter(p=>p.createdAt&&p.createdAt.startsWith(thisMonth)).length+' este mes</div></div></div>';
  // Alertas
  h+='<div class="stat-card" style="border-top:3px solid '+(pa>0?'var(--danger)':'var(--success)')+'"><div class="stat-icon '+(pa>0?'orange':'green')+'">'+IC.warn+'</div><div class="stat-info"><h3>'+pa+'</h3><p>Alertas pendientes</p>'+(pa>0?'<div class="stat-trend down">'+IC.dn+' requiere atención</div>':'<div class="stat-trend up">'+IC.up+' todo al día</div>')+'</div></div>';
  // Mensajes
  h+='<div class="stat-card" style="cursor:pointer;border-top:3px solid #6366f1" onclick="navigate(\'mensajes\')"><div class="stat-icon cyan">'+IC.send+'</div><div class="stat-info"><h3>'+getMsgBadge()+'</h3><p>Mensajes</p></div></div>';
  // Facturado
  h+='<div class="stat-card" style="border-top:3px solid #ca8a04"><div class="stat-icon cyan">'+IC.dollar+'</div><div class="stat-info"><h3>'+fMoney(mr)+'</h3><p>Facturado '+mesLabel+'</p><div class="stat-trend up">'+IC.up+' '+pi+' ptes. cobro</div></div></div>';
  h+='</div>';

  // ═══ QUICK ACTIONS ═══
  h+='<div class="card" style="margin-bottom:20px;border-left:3px solid var(--primary);background:var(--primary-light)">'
  +'<div class="card-body" style="padding:12px 18px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">'
  +'<span style="font-size:.78rem;font-weight:700;color:var(--primary)">⚡ Acciones rápidas</span>'
  +(function(){try{var pend=JSON.parse(localStorage.getItem('veridia_portal_pending')||'[]');if(pend.length)return' <span class="badge badge-warning" style="cursor:pointer" onclick="showPortalPending()">'+pend.length+' registro(s) pendiente(s) del portal</span>';return''}catch(e){return''}}())
  +'<button class="btn btn-primary btn-sm" onclick="navigate(\'desarrollada\')">🔬 Desarrollada</button>'
  +'<button class="btn btn-outline btn-sm" onclick="navigate(\'agenda\')">📅 Nueva cita</button>'
  +'<button class="btn btn-outline btn-sm" onclick="openNewPat()">👤 Nuevo paciente</button>'
  +'<button class="btn btn-outline btn-sm" onclick="navigate(\'bedca\')">🗃️ Alimentos</button>'
  +'<button class="btn btn-outline btn-sm" onclick="startDemoGuiado()">🗺️ Tour guiado</button>'
  +'<button class="btn btn-outline btn-sm" onclick="backupData()">📦 Backup</button>'
  +'<button class="btn btn-ghost btn-sm" onclick="restoreData()">⬆️ Restaurar</button>'
  +'<span style="margin-left:auto;font-size:.62rem;color:var(--text3)">Ctrl+K = paleta</span>'
  +'</div></div>';

  // ═══ URGENT ALERTS BANNER (if any) ═══
  var urgent=DB.alerts.filter(function(a){return a.estado==='pendiente'&&a.severidad==='grave'});
  if(urgent.length){
    h+='<div class="card" style="margin-bottom:20px;border-top:3px solid var(--danger);background:#fef2f2">'
    +'<div class="card-body" style="padding:14px 18px">'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">🚨<strong style="color:var(--danger);font-size:.88rem">'+urgent.length+' alerta(s) urgente(s)</strong></div>';
    urgent.slice(0,3).forEach(function(a){var p=gP(a.pacienteId);
      h+='<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(255,255,255,.6);border-radius:8px;margin:4px 0;border:1px solid #fecaca">'
      +'<div style="font-size:.82rem"><strong>'+(p?sanitize(p.nombre)+' '+sanitize(p.apellidos):'')+'</strong> — <span style="color:var(--text-secondary)">'+a.mensaje+'</span></div>'
      +'<button class="btn btn-ghost btn-xs" onclick="revAlert('+a.id+');rDash()">✓</button></div>';
    });
    h+='</div></div>';
  }

  // ═══ MAIN GRID: 2fr / 1fr ═══
  h+='<div class="grid-23">';

  // ── LEFT COLUMN ──
  h+='<div>';

  // Citas hoy
  h+='<div class="card" style="margin-bottom:18px;border-top:3px solid var(--primary)">'
  +'<div class="card-header"><span class="card-title">📅 Citas hoy — '+fD(today)+'</span>'
  +'<button class="btn btn-primary btn-sm" style="border-radius:8px" onclick="navigate(\'agenda\')">'+IC.plus+' Nueva</button></div>';
  if(ta.length){
    h+='<div class="card-body" style="padding:0"><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.82rem">'
    +'<thead><tr style="background:var(--surface2)">'
    +'<th style="padding:10px 14px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Hora</th>'
    +'<th style="padding:10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Paciente</th>'
    +'<th style="padding:10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Tipo</th>'
    +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Estado</th>'
    +'<th style="padding:10px 8px;width:36px"></th></tr></thead><tbody>';
    ta.forEach(function(a,i){
      var p=gP(a.pacienteId);
      h+='<tr style="border-bottom:1px solid var(--border);background:'+(i%2===1?'var(--surface)':'transparent')+'">'
      +'<td style="padding:10px 14px"><strong style="font-variant-numeric:tabular-nums">'+a.hora+'</strong></td>'
      +'<td style="padding:10px"><div style="display:flex;align-items:center;gap:8px"><div class="avatar avatar-sm" style="background:'+aCol(a.pacienteId)+';color:#fff">'+(p?ini(p.nombre,p.apellidos):'')+'</div>'
      +'<span style="cursor:pointer;color:var(--accent);font-weight:600" onclick="selPat='+a.pacienteId+';navigate(\'historia\')">'+(p?sanitize(p.nombre)+' '+sanitize(p.apellidos):'—')+'</span></div></td>'
      +'<td style="padding:10px"><span class="calendar-event '+a.color+'">'+a.tipo+'</span></td>'
      +'<td style="padding:10px;text-align:center"><span class="badge '+(a.estado==='Confirmada'?'badge-success':'badge-warning')+'">'+a.estado+'</span></td>'
      +'<td style="padding:10px;text-align:center"><button class="btn btn-ghost btn-xs" style="border-radius:6px" onclick="markDone('+a.id+')">✓</button></td></tr>';
    });
    h+='</tbody></table></div></div>';
  } else {
    h+='<div class="card-body" style="text-align:center;padding:30px"><div style="font-size:2rem;opacity:.3;margin-bottom:8px">📅</div>'
    +'<p style="color:var(--text-secondary);font-size:.82rem;margin:0">No hay citas programadas para hoy</p></div>';
  }
  h+='</div>';

  // Evolución de peso
  h+='<div class="card" style="border-top:3px solid var(--accent)"><div class="card-header"><span class="card-title">📈 Evolución de peso</span></div><div class="card-body">';
  var allA=DB.antropometrias.sort((a,b)=>a.fecha.localeCompare(b.fecha));
  if(allA.length<2){
    h+='<div style="text-align:center;color:var(--text3);font-size:.78rem;padding:20px">Registre al menos 2 mediciones para ver la evolución</div>';
  } else {
    var byMonth={};allA.forEach(a=>{var k=a.fecha.substring(0,7);if(!byMonth[k])byMonth[k]=[];byMonth[k].push(a.peso)});
    var months=Object.keys(byMonth).slice(-8);
    var chartData=months.map(k=>({label:k.slice(5),value:Math.round(byMonth[k].reduce((s,v)=>s+v,0)/byMonth[k].length*10)/10}));
    h+=svgLineChart({data:chartData,width:440,height:170,unit:'kg',color:'var(--primary)'});
  }
  h+='<p style="font-size:.68rem;color:var(--text3);margin-top:10px;text-align:center;text-transform:uppercase;letter-spacing:.4px">Promedio peso por mes · Datos reales de antropometría</p>';
  h+='</div></div>';

  h+='</div>'; // end left column

  // ── RIGHT COLUMN ──
  h+='<div>';

  // Alertas recientes
  h+='<div class="card" style="margin-bottom:18px;border-top:3px solid '+(pa>0?'var(--warning)':'var(--success)')+'">'
  +'<div class="card-header"><span class="card-title">⚠️ Alertas recientes</span>'
  +'<button class="btn btn-ghost btn-xs" style="border-radius:6px" onclick="navigate(\'alertas\')">Ver todas →</button></div>'
  +'<div class="card-body" style="padding:10px 14px">';
  var pendAlerts=DB.alerts.filter(a=>a.estado==='pendiente').slice(0,4);
  if(pendAlerts.length){
    pendAlerts.forEach(function(a){
      var p=gP(a.pacienteId);
      h+='<div class="clinical-alert '+(a.severidad==='grave'?'severe':'moderate')+'" style="padding:10px 12px;margin-bottom:6px;border-radius:8px">'
      +'<div style="flex:1"><div style="font-size:.76rem;font-weight:700">'+(p?sanitize(p.nombre)+' '+sanitize(p.apellidos):'')+'</div>'
      +'<div style="font-size:.72rem;margin-top:2px;color:var(--text2)">'+a.mensaje+'</div></div>'
      +'<span class="badge '+(a.severidad==='grave'?'badge-danger':'badge-warning')+'">'+a.severidad+'</span></div>';
    });
  } else {
    h+='<div style="text-align:center;padding:16px;font-size:.82rem;color:var(--text3)">✅ Sin alertas pendientes</div>';
  }
  h+='</div></div>';

  // Caja del día
  h+='<div class="card" style="border-top:3px solid #ca8a04"><div class="card-header"><span class="card-title">💰 Caja del día</span></div><div class="card-body">'
  +'<ul class="data-list">'
  +'<li><span class="label">Saldo inicial</span><span class="value">'+fMoney(DB.cashSession.saldoInicial)+'</span></li>'
  +'<li><span class="label">Ingresos</span><span class="value" style="color:var(--success)">+'+fMoney(ct.ing)+'</span></li>'
  +'<li><span class="label">Egresos</span><span class="value" style="color:var(--danger)">-'+fMoney(ct.egr)+'</span></li>'
  +'<li style="font-weight:700;border-top:2px solid var(--border)"><span class="label" style="font-weight:700">Total</span><span class="value" style="font-size:1rem">'+fMoney(DB.cashSession.saldoInicial+ct.ing-ct.egr)+'</span></li>'
  +'</ul></div></div>';

  h+='</div>'; // end right column

  // ═══ FULL-WIDTH: Resumen del mes ═══
  h+='<div class="card" style="margin-top:18px;border-top:3px solid var(--primary)">'
  +'<div class="card-header"><span class="card-title">📊 Resumen del mes — '+mesLabel.charAt(0).toUpperCase()+mesLabel.slice(1)+'</span></div>'
  +'<div class="card-body">';
  var thisM=new Date().toISOString().slice(0,7);
  var citasMes=DB.appointments.filter(a=>a.fecha.startsWith(thisM)&&a.estado!=='Cancelada').length;
  var realizadas=DB.appointments.filter(a=>a.fecha.startsWith(thisM)&&a.estado==='Realizada').length;
  var noShow=DB.appointments.filter(a=>a.fecha.startsWith(thisM)&&a.estado==='No asistió').length;
  var ingreso=DB.invoices.filter(i=>i.fecha.startsWith(thisM)&&i.estado==='Pagada').reduce((s,i)=>s+i.total,0);
  var pendiente=DB.invoices.filter(i=>i.fecha.startsWith(thisM)&&(i.estado==='Pendiente'||i.estado==='Vencida')).reduce((s,i)=>s+i.total,0);
  var newPats=DB.patients.filter(p=>p.createdAt&&p.createdAt.startsWith(thisM)).length;
  var servCount={};DB.invoices.filter(i=>i.fecha.startsWith(thisM)).forEach(i=>(i.lineas||[]).forEach(l=>{servCount[l.servicio]=(servCount[l.servicio]||0)+1}));
  var topServ=Object.entries(servCount).sort((a,b)=>b[1]-a[1]).slice(0,3);

  h+='<div style="display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:center">';
  h+=svgDonutChart({data:[{label:'Cobrado',value:ingreso,color:'var(--success)'},{label:'Pendiente',value:pendiente||0,color:'var(--warning)'}],size:120,title:'Facturación',unit:CURRENCIES[CURRENCY].symbol});
  h+='<div>'
  +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px">';
  [{l:'Citas totales',v:citasMes,c:'var(--primary)'},{l:'Realizadas',v:realizadas,c:'var(--success)'},{l:'No asistió',v:noShow,c:'var(--danger)'},{l:'Nuevos pacientes',v:newPats,c:'var(--accent)'}].forEach(function(x){
    h+='<div style="padding:12px;background:var(--surface2);border-radius:10px;text-align:center;border-top:2px solid '+x.c+'">'
    +'<div style="font-size:1.3rem;font-weight:800;color:'+x.c+'">'+x.v+'</div>'
    +'<div style="font-size:.62rem;color:var(--text3);text-transform:uppercase;letter-spacing:.4px;font-weight:600;margin-top:2px">'+x.l+'</div></div>';
  });
  h+='</div>';
  if(topServ.length){
    h+='<div style="margin-top:10px;font-size:.72rem;color:var(--text3)"><strong>Top servicios:</strong> '+topServ.map(x=>x[0]+' ('+x[1]+')').join(' · ')+'</div>';
  }
  // Day of week chart
  var days=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  var counts=[0,0,0,0,0,0,0];
  DB.appointments.filter(function(a){return a.estado!=='Cancelada'}).forEach(function(a){var d=new Date(a.fecha).getDay();counts[d===0?6:d-1]++});
  if(counts.reduce(function(s,v){return s+v},0)>0){
    h+='<div style="margin-top:14px">'+svgBarChart({data:days.map(function(d,i){return{label:d,value:counts[i]}}),width:380,height:130,color:'var(--accent)',title:'Citas por día de la semana'})+'</div>';
  }
  h+='</div></div>';
  h+='</div></div>';
  h+='</div>'; // close grid-23

  // ═══ BOTTOM WIDGETS ROW ═══
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px">';

  // D4: Monthly income chart
  h+=(function(){
    var meses={};
    DB.invoices.filter(function(i){return i.estado==='Pagada'}).forEach(function(i){
      var m=i.fecha.substring(0,7);meses[m]=(meses[m]||0)+i.total;
    });
    var keys=Object.keys(meses).sort().slice(-6);
    if(keys.length<2)return '<div class="card" style="border-top:3px solid #16a34a"><div class="card-header"><span class="card-title">📈 Ingresos Mensuales</span></div><div class="card-body" style="text-align:center;padding:24px;color:var(--text3);font-size:.82rem">Necesita al menos 2 meses de facturación</div></div>';
    var data=keys.map(function(k){return{label:k.slice(5),value:Math.round(meses[k])}});
    return '<div class="card" style="border-top:3px solid #16a34a"><div class="card-header"><span class="card-title">📈 Ingresos Mensuales</span></div><div class="card-body">'
    +svgBarChart({data:data,height:140,color:'var(--success)',ylabel:CURRENCIES[CURRENCY].symbol,barWidth:40})+'</div></div>';
  })();

  // D6: Patients without upcoming appointment
  h+=(function(){
    var today=new Date().toISOString().slice(0,10);
    var withAppt={};DB.appointments.filter(function(a){return a.fecha>=today&&a.estado!=='Cancelada'}).forEach(function(a){withAppt[a.pacienteId]=true});
    var sinCita=DB.patients.filter(function(p){return p.activo&&!withAppt[p.id]}).slice(0,5);
    var card='<div class="card" style="border-top:3px solid #ea580c"><div class="card-header"><span class="card-title">📅 Pacientes sin cita</span>';
    if(!sinCita.length)return card+'</div><div class="card-body" style="text-align:center;padding:24px;color:var(--text3);font-size:.82rem">✅ Todos los pacientes tienen citas programadas</div></div>';
    card+='<span class="badge" style="background:#fff7ed;color:#ea580c;font-size:.65rem">'+sinCita.length+'</span></div>'
    +'<div class="card-body" style="padding:0">';
    sinCita.forEach(function(p,i){
      card+='<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 18px;border-bottom:1px solid var(--border);font-size:.82rem;background:'+(i%2===1?'var(--surface)':'transparent')+'">'
      +'<span style="cursor:pointer;color:var(--accent);font-weight:600" onclick="selPat='+p.id+';navigate(\'historia\')">'+p.nombre+' '+p.apellidos+'</span>'
      +'<button class="btn btn-outline btn-xs" style="border-radius:6px" onclick="selPat='+p.id+';navigate(\'agenda\')">＋ Cita</button></div>';
    });
    card+='</div></div>';
    return card;
  })();

  h+='</div>';

  // ═══ SECOND BOTTOM ROW ═══
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px">';

  // D2: Last actions timeline
  h+=(function(){
    var actions=DB.auditLog.slice(-8).reverse();
    if(!actions.length)return '<div class="card" style="border-top:3px solid var(--text3)"><div class="card-header"><span class="card-title">🕐 Últimas acciones</span></div><div class="card-body" style="text-align:center;padding:24px;color:var(--text3);font-size:.82rem">Sin acciones recientes</div></div>';
    var r='<div class="card" style="border-top:3px solid var(--text3)"><div class="card-header"><span class="card-title">🕐 Últimas acciones</span></div>'
    +'<div class="card-body" style="padding:0;max-height:220px;overflow-y:auto"><div style="padding:0 18px">';
    actions.forEach(function(a){
      r+='<div style="display:flex;gap:12px;padding:9px 0;border-bottom:1px solid var(--border);font-size:.78rem;align-items:center">'
      +'<div style="width:8px;height:8px;border-radius:50%;background:var(--primary);flex-shrink:0"></div>'
      +'<div style="flex:1"><strong>'+sanitize(a.action||a.tipo||'')+'</strong> '+(a.target?sanitize(a.target):'')
      +'<div style="font-size:.65rem;color:var(--text3)">'+(a.date||a.fecha||'')+(a.time?' '+a.time:'')+'</div></div></div>';
    });
    r+='</div></div></div>';
    return r;
  })();

  // D1: RC stats widget
  h+=(function(){
    if(typeof rcGetMenuStats!=='function'||!DB.rcCentros||!DB.rcCentros.length){
      return '<div class="card" style="border-top:3px solid var(--primary)"><div class="card-header"><span class="card-title">🏛️ Restauración Colectiva</span></div>'
      +'<div class="card-body" style="text-align:center;padding:24px;color:var(--text3);font-size:.82rem">Sin centros registrados</div></div>';
    }
    var st=rcGetMenuStats();
    return '<div class="card" style="border-top:3px solid var(--primary)"><div class="card-header"><span class="card-title">🏛️ Restauración Colectiva</span>'
    +'<button class="btn btn-ghost btn-sm" style="border-radius:6px" onclick="navigate(\'restauracion\')">Ver →</button></div>'
    +'<div class="card-body"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;text-align:center">'
    +'<div style="padding:10px;background:var(--surface2);border-radius:8px"><div style="font-size:1.3rem;font-weight:800;color:var(--primary)">'+st.centros+'</div><div style="font-size:.62rem;color:var(--text3);text-transform:uppercase;font-weight:600">Centros</div></div>'
    +'<div style="padding:10px;background:var(--surface2);border-radius:8px"><div style="font-size:1.3rem;font-weight:800;color:var(--accent)">'+st.comensalesTotales+'</div><div style="font-size:.62rem;color:var(--text3);text-transform:uppercase;font-weight:600">Comensales</div></div>'
    +'<div style="padding:10px;background:var(--surface2);border-radius:8px"><div style="font-size:1.3rem;font-weight:800">'+st.menus+'</div><div style="font-size:.62rem;color:var(--text3);text-transform:uppercase;font-weight:600">Menús</div></div>'
    +'<div style="padding:10px;background:var(--surface2);border-radius:8px"><div style="font-size:1.3rem;font-weight:800">'+st.appccLogs+'</div><div style="font-size:.62rem;color:var(--text3);text-transform:uppercase;font-weight:600">APPCC</div></div>'
    +'</div></div></div>';
  })();

  h+='</div>';

  h+='</div>';

  // ═══ THIRD ROW: Patients + Services analytics ═══
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px">';

  // Top patients by visits
  h+=(function(){
    var visitCount={};
    DB.appointments.forEach(function(a){if(a.estado==='Realizada')visitCount[a.pacienteId]=(visitCount[a.pacienteId]||0)+1});
    var sorted=Object.entries(visitCount).sort(function(a,b){return b[1]-a[1]}).slice(0,6);
    if(!sorted.length)return '<div class="card" style="border-top:3px solid var(--primary)"><div class="card-header"><span class="card-title">🏆 Pacientes frecuentes</span></div><div class="card-body" style="text-align:center;padding:24px;color:var(--text3);font-size:.82rem">Sin datos de visitas</div></div>';
    var maxV=sorted[0][1];
    var r='<div class="card" style="border-top:3px solid var(--primary)"><div class="card-header"><span class="card-title">🏆 Pacientes frecuentes</span></div><div class="card-body" style="padding:0">';
    sorted.forEach(function(e,i){
      var p=gP(parseInt(e[0]));var v=e[1];
      if(!p)return;
      var pct=Math.round(v/maxV*100);
      r+='<div style="display:flex;align-items:center;gap:12px;padding:10px 18px;border-bottom:1px solid var(--border);font-size:.82rem;background:'+(i%2===1?'var(--surface)':'transparent')+'">'
        +'<div class="avatar avatar-sm" style="background:'+aCol(parseInt(e[0]))+';color:#fff;flex-shrink:0">'+ini(p.nombre,p.apellidos)+'</div>'
        +'<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+sanitize(p.nombre)+' '+sanitize(p.apellidos)+'</span><span style="font-weight:700;color:var(--primary);flex-shrink:0">'+v+'</span></div>'
        +'<div style="height:6px;background:var(--surface2);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:var(--primary);border-radius:3px"></div></div></div></div>';
    });
    r+='</div></div>';
    return r;
  })();

  // Top services
  h+=(function(){
    var svcCount={};
    DB.invoices.forEach(function(i){(i.lineas||[]).forEach(function(l){svcCount[l.servicio]=(svcCount[l.servicio]||0)+1})});
    var sorted=Object.entries(svcCount).sort(function(a,b){return b[1]-a[1]}).slice(0,5);
    if(!sorted.length)return '<div class="card" style="border-top:3px solid var(--accent)"><div class="card-header"><span class="card-title">📊 Servicios más solicitados</span></div><div class="card-body" style="text-align:center;padding:24px;color:var(--text3);font-size:.82rem">Sin datos de facturación</div></div>';
    var maxS=sorted[0][1];
    var icons={'Valoración Nutricional':'🍎','Control Nutricional':'📋','Plan Personalizado':'📊','Evolución Nutricional':'📈','Seguimiento':'🔍','Nutrición Deportiva':'🏋️','Nutrición Clínica':'🏥','Educación Alimentaria':'📚'};
    var r='<div class="card" style="border-top:3px solid var(--accent)"><div class="card-header"><span class="card-title">📊 Servicios más solicitados</span></div><div class="card-body" style="padding:0">';
    sorted.forEach(function(e,i){
      var pct=Math.round(e[1]/maxS*100);
      var colors=['var(--primary)','var(--accent)','#6366f1','#ca8a04','#ea580c'];
      r+='<div style="display:flex;align-items:center;gap:12px;padding:10px 18px;border-bottom:1px solid var(--border);font-size:.82rem;background:'+(i%2===1?'var(--surface)':'transparent')+'">'
        +'<div style="width:32px;height:32px;border-radius:8px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:1rem">'+(icons[e[0]]||'📋')+'</div>'
        +'<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+e[0]+'</span><span style="font-weight:700;color:'+colors[i%5]+';flex-shrink:0">'+e[1]+'</span></div>'
        +'<div style="height:6px;background:var(--surface2);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+colors[i%5]+';border-radius:3px"></div></div></div></div>';
    });
    r+='</div></div>';
    return r;
  })();

  h+='</div>';

  h+='</div>'; // close fade-in
  $('mainContent').innerHTML=h;
}

function markDone(id){
  const a=DB.appointments.find(x=>x.id===id);if(!a)return;
  openConsultActa(id);
}

// ===== REGISTROS PENDIENTES DEL PORTAL =====
function showPortalPending(){
  var pending=[];
  try{pending=JSON.parse(localStorage.getItem('veridia_portal_pending')||'[]')}catch(e){console.warn('[Veridia]',e.message||e)}
  if(!pending.length){toast('No hay registros pendientes','info');return}

  var html='<div class="modal-header"><h3>📋 Registros del Portal del Paciente</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body">';
  html+='<p style="font-size:.78rem;color:var(--text3);margin-bottom:14px">Estos pacientes se registraron desde el portal. Aprobá para crear su ficha en la clínica.</p>';

  pending.forEach(function(p,i){
    var exists=DB.patients.find(function(x){return x.dni&&p.dni&&x.dni.toUpperCase()===p.dni.toUpperCase()});
    html+='<div style="padding:14px;background:var(--surface2);border-radius:10px;margin-bottom:8px;border-left:3px solid '+(exists?'var(--success)':'var(--warning)')+'">'
      +'<div style="display:flex;justify-content:space-between;align-items:center">'
      +'<div><strong>'+p.nombre+' '+p.apellidos+'</strong>'
      +'<div style="font-size:.72rem;color:var(--text3)">DNI: '+p.dni+' · '+p.email+(p.telefono?' · '+p.telefono:'')+'</div>'
      +(exists?'<div style="font-size:.68rem;color:var(--success);font-weight:700;margin-top:2px">✅ Ya existe en la clínica — vinculado automáticamente</div>':'')
      +'</div>'
      +'<div style="display:flex;gap:6px">'
      +(exists?'':'<button class="btn btn-primary btn-sm" style="border-radius:8px" onclick="approvePortalPatient('+i+')">✓ Crear ficha</button>')
      +'<button class="btn btn-ghost btn-xs" onclick="dismissPortalPatient('+i+')" style="color:var(--danger)">✕</button>'
      +'</div></div></div>';
  });

  html+='</div>';
  openModal(html);
}

function approvePortalPatient(idx){
  var pending=[];
  try{pending=JSON.parse(localStorage.getItem('veridia_portal_pending')||'[]')}catch(e){console.warn('[Veridia]',e.message||e)}
  var p=pending[idx];if(!p)return;

  if(DB.patients.some(function(x){return x.dni&&p.dni&&x.dni.toUpperCase()===p.dni.toUpperCase()})){
    toast('Ya existe un paciente con ese DNI — vinculación automática','info');
    pending.splice(idx,1);
    localStorage.setItem('veridia_portal_pending',JSON.stringify(pending));
    closeModal();showPortalPending();
    return;
  }

  DB.patients.push({
    id:DB.nextPId++,nombre:p.nombre,apellidos:p.apellidos,dni:p.dni,
    fechaNacimiento:'1990-01-01',sexo:'',email:p.email,telefono:p.telefono||'',
    direccion:'',profesion:'',nacionalidad:'',estadoCivil:'',educacion:'',
    procedencia:'',motivoConsulta:'Registro desde portal',
    grupoSanguineo:'',tags:['portal'],portalPass:p.pass||'1234',
    portalRegistered:true,activo:true,clinicaId:1,
    createdAt:new Date().toISOString().slice(0,10)
  });

  pending.splice(idx,1);
  localStorage.setItem('veridia_portal_pending',JSON.stringify(pending));
  toast('✅ Paciente '+p.nombre+' '+p.apellidos+' creado desde portal');
  showSaved();
  closeModal();
  if(pending.length)setTimeout(showPortalPending,400);
  else navigate('dashboard');
}

function dismissPortalPatient(idx){
  var pending=[];
  try{pending=JSON.parse(localStorage.getItem('veridia_portal_pending')||'[]')}catch(e){console.warn('[Veridia]',e.message||e)}
  pending.splice(idx,1);
  localStorage.setItem('veridia_portal_pending',JSON.stringify(pending));
  closeModal();
  if(pending.length)setTimeout(showPortalPending,400);
  else{toast('Registro descartado','warning');navigate('dashboard')}
}
