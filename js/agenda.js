// ===== AGENDA (adapted from evilnapsis/bookmedik v4) =====
// Statuses & payments inspired by BookMedik schema
var APPT_STATUS=[{id:1,name:'Pendiente',badge:'badge-warning'},{id:2,name:'Confirmada',badge:'badge-info'},{id:3,name:'Realizada',badge:'badge-success'},{id:4,name:'No asistió',badge:'badge-danger'},{id:5,name:'Cancelada',badge:'badge-neutral'}];
var APPT_PAYMENT=[{id:1,name:'Pendiente',badge:'badge-warning'},{id:2,name:'Pagado',badge:'badge-success'},{id:3,name:'Anulado',badge:'badge-danger'}];
var agendaView='upcoming'; // upcoming | today | old | search | week | month

function rAgenda(){
  const today=new Date().toISOString().slice(0,10);
  const all=DB.appointments, upcoming=all.filter(a=>a.fecha>=today&&a.estado!=='Cancelada'&&a.estado!=='Realizada'),
    todayA=all.filter(a=>a.fecha===today&&a.estado!=='Cancelada'),
    pending=all.filter(a=>a.estado==='Pendiente'||a.estado==='Confirmada'),
    old=all.filter(a=>a.fecha<today||a.estado==='Realizada'||a.estado==='No asistió');
  var horaNum=new Date().getHours();
  var nextAppt=upcoming.sort(function(a,b){return a.fecha.localeCompare(b.fecha)||a.hora.localeCompare(b.hora)})[0];

  // ═══ HERO HEADER ═══
  var h='<div class="fade-in">'
  +'<div class="card" style="border:none;background:linear-gradient(135deg,#0E7490 0%,#0891B2 50%,#22D3EE 100%);color:#fff;margin-bottom:22px;border-radius:var(--radius);overflow:hidden;position:relative">'
  +'<div style="position:absolute;top:-40px;right:-20px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.04)"></div>'
  +'<div style="position:absolute;bottom:-60px;right:80px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.02)"></div>'
  +'<div class="card-body" style="padding:22px 28px;position:relative;z-index:1">'
  +'<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px">'
  +'<div><div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">'
  +'<span style="font-size:1.6rem">📅</span>'
  +'<h2 style="margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.3px">Agenda</h2></div>'
  +'<p style="margin:0;font-size:.78rem;opacity:.75">'+fD(today)
  +(nextAppt?' · Próxima: <strong>'+fD(nextAppt.fecha)+' '+nextAppt.hora+'</strong>':'')+'</p></div>'
  +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
  +'<button class="btn" style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25);font-size:.78rem" onclick="exportAppointments()">📥 CSV</button>'
  +'<button class="btn" style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25);font-size:.78rem" onclick="exportICal()">📅 iCal</button>'
  +'<button class="btn" style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25);font-size:.78rem" onclick="printAgendaDay()">🖨️</button>'
  +'<button class="btn" style="background:#fff;color:#2563eb;font-weight:700;border:none" onclick="openApptModal()">'+IC.plus+' Nueva cita</button>'
  +'</div></div></div></div>';

  // ═══ KPI CARDS (clickable as view selectors) ═══
  h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">';
  var kpis=[
    {view:'today',val:todayA.length,label:'Hoy',icon:'📅',color:'var(--primary)',active:agendaView==='today'},
    {view:'upcoming',val:upcoming.length,label:'Próximas',icon:'📋',color:'var(--accent)',active:agendaView==='upcoming'},
    {view:'old',val:old.length,label:'Anteriores',icon:'📁',color:'#ca8a04',active:agendaView==='old'},
    {view:'search',val:all.length,label:'Buscar',icon:'🔍',color:'#6366f1',active:agendaView==='search'}
  ];
  kpis.forEach(function(k){
    h+='<div class="card" style="padding:16px;text-align:center;cursor:pointer;border-top:3px solid '+k.color+';'
    +(k.active?'box-shadow:0 0 0 2px '+k.color+'33;background:'+k.color+'08':'')
    +'" onclick="agendaView=\''+k.view+'\';rAgenda()">'
    +'<div style="font-size:1rem;margin-bottom:2px">'+k.icon+'</div>'
    +'<div style="font-size:1.6rem;font-weight:800;color:'+k.color+';line-height:1">'+k.val+'</div>'
    +'<div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600;margin-top:3px">'+k.label+'</div></div>';
  });
  h+='</div>';

  // ═══ VIEW TABS + ACTION BAR ═══
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">'
  +'<div class="pill-tabs">'
  +'<button class="pill-tab '+(agendaView==='today'?'active':'')+'" onclick="agendaView=\'today\';rAgenda()">📅 Hoy</button>'
  +'<button class="pill-tab '+(agendaView==='week'?'active':'')+'" onclick="agendaView=\'week\';rAgenda()">📅 Semana</button>'
  +'<button class="pill-tab '+(agendaView==='upcoming'?'active':'')+'" onclick="agendaView=\'upcoming\';rAgenda()">📋 Próximas</button>'
  +'<button class="pill-tab '+(agendaView==='old'?'active':'')+'" onclick="agendaView=\'old\';rAgenda()">📁 Anteriores</button>'
  +'<button class="pill-tab '+(agendaView==='month'?'active':'')+'" onclick="agendaView=\'month\';rAgenda()">📅 Mes</button>'
  +'<button class="pill-tab '+(agendaView==='search'?'active':'')+'" onclick="agendaView=\'search\';rAgenda()">🔍 Buscar</button>'
  +'</div>'
  +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
  +'<button class="btn btn-outline btn-sm" style="border-radius:8px" onclick="openRecurringAppt()">🔄 Recurrente</button>'
  +'<button class="btn btn-outline btn-sm" style="border-radius:8px" onclick="openBlockHorario()">🔒 Bloquear</button>'
  +'<button class="btn btn-outline btn-sm" style="border-radius:8px" onclick="document.getElementById(\'agendaTimeline\').innerHTML=renderTimelineToday()">🕐 Timeline</button>'
  +'</div></div>';

  // ═══ VIEWS ═══
  if(agendaView==='week') h+=renderWeekView();
  if(agendaView==='month') h+=renderMonthView();
  if(agendaView==='search'){
    h+=agendaSearchPanel();
    // Professional filter
    var profs=getAgendaProfessionals();
    if(profs.length>1){
      h+='<select style="font-size:.78rem;padding:4px 10px;border-radius:8px;border:1px solid var(--border);margin-bottom:12px" onchange="if(this.value){document.getElementById(\'srchPat\').value=this.value;agendaDoSearch()}else{agendaDoSearch()}">'
      +'<option value="">Todos los profesionales</option>'+profs.map(function(p){return '<option>'+p+'</option>'}).join('')+'</select>';
    }
  }

  // Timeline placeholder
  h+='<div id="agendaTimeline"></div>';

  // Main content
  h+='<div id="agendaList">';
  if(agendaView==='today') h+=agendaRenderDay(today);
  else if(agendaView==='upcoming') h+=agendaRenderTable(upcoming,'Próximas citas');
  else if(agendaView==='old') h+=agendaRenderTable(old,'Citas anteriores (historial)');
  else if(agendaView==='search') h+='<div style="text-align:center;padding:24px;color:var(--text3);font-size:.83rem">Use los filtros de arriba para buscar citas</div>';
  h+='</div>';

  h+='</div>';
  $('mainContent').innerHTML=h;
}

// ═══ WEEK VIEW ═══
function renderWeekView(){
  var today=new Date();
  var weekOff=typeof agendaWeekOffset!=='undefined'?agendaWeekOffset:0;
  var monday=new Date(today);monday.setDate(today.getDate()-today.getDay()+1+weekOff*7);
  var days=[];
  for(var i=0;i<7;i++){var d=new Date(monday);d.setDate(monday.getDate()+i);days.push(d.toISOString().slice(0,10))}
  var dayNames=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  var hours=['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
  var todayStr=today.toISOString().slice(0,10);

  return '<div class="card" style="border-top:3px solid #2563eb"><div class="card-header">'
  +'<div style="display:flex;align-items:center;gap:8px">'
  +'<button class="btn btn-ghost btn-xs" style="border-radius:6px;width:28px;height:28px" onclick="agendaWeekOffset=(agendaWeekOffset||0)-1;rAgenda()">‹</button>'
  +'<span class="card-title" style="font-size:.88rem">📅 Semana del '+fD(days[0])+' al '+fD(days[6])+'</span>'
  +'<button class="btn btn-ghost btn-xs" style="border-radius:6px;width:28px;height:28px" onclick="agendaWeekOffset=(agendaWeekOffset||0)+1;rAgenda()">›</button>'
  +'<button class="btn btn-outline btn-xs" style="border-radius:6px;font-size:.65rem;margin-left:4px" onclick="agendaWeekOffset=0;rAgenda()">Hoy</button></div>'
  +'<span style="font-size:.58rem;color:var(--text3)">↕ Arrastra citas para mover</span></div>'
  +'<div class="card-body" style="padding:0;overflow-x:auto"><table role="table" style="min-width:700px;border-collapse:collapse"><thead><tr>'
  +'<th style="width:60px;font-size:.68rem;padding:10px 6px;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600">Hora</th>'
  +days.map(function(d,i){
    var isToday=d===todayStr;
    return '<th style="text-align:center;padding:10px 4px;font-size:.72rem;'+(isToday?'background:var(--primary-light);color:var(--primary)':'')+'">'
    +dayNames[i]+'<br><span style="font-size:.62rem;color:var(--text3)">'+d.slice(8)+'</span></th>';
  }).join('')
  +'</tr></thead><tbody>'
  +hours.map(function(hr){
    return '<tr><td style="font-size:.68rem;color:var(--text3);font-weight:600;vertical-align:top;padding:4px 6px;border-right:1px solid var(--border);font-variant-numeric:tabular-nums">'+hr+'</td>'
    +days.map(function(d){
      var cellId='wc_'+d+'_'+hr.replace(':','');
      var appts=DB.appointments.filter(function(a){return a.fecha===d&&a.hora&&a.hora.startsWith(hr.substring(0,2))&&a.estado!=='Cancelada'});
      return '<td id="'+cellId+'" class="drop-zone" data-date="'+d+'" data-hour="'+hr+'" '
      +'ondragover="event.preventDefault();this.classList.add(\'drag-over\')" '
      +'ondragleave="this.classList.remove(\'drag-over\')" '
      +'ondrop="dropAppt(event,\''+d+'\',\''+hr+'\')" '
      +'style="border:1px solid var(--border);vertical-align:top;padding:2px;height:42px;min-width:85px">'
      +(appts.length?appts.map(function(a){
        var p=gP(a.pacienteId);
        return '<div class="appt-draggable" draggable="true" '
        +'ondragstart="dragAppt(event,'+a.id+')" '
        +'ondragend="endDragAppt(event)" '
        +'onclick="viewApptDetail('+a.id+')" '
        +'data-appt-id="'+a.id+'" '
        +'style="padding:3px 6px;background:var(--primary-light);border-left:3px solid var(--primary);border-radius:4px;font-size:.64rem;margin-bottom:2px;cursor:grab" '
        +'title="'+a.hora+' · '+(p?sanitize(p.nombre)+' '+sanitize(p.apellidos):'')+' — Arrastra para mover">'
        +'<strong>'+a.hora.substring(0,5)+'</strong> '+(p?sanitize(p.nombre).substring(0,8):'—')+'</div>';
      }).join(''):'')
      +'</td>';
    }).join('')
    +'</tr>';
  }).join('')
  +'</tbody></table></div></div>';
}

// ═══ SEARCH PANEL ═══
function agendaSearchPanel(){
  return '<div class="card" style="margin-bottom:16px;border-top:3px solid #6366f1">'
  +'<div class="card-header"><span class="card-title" style="font-size:.85rem">🔍 Búsqueda avanzada</span></div>'
  +'<div class="card-body" style="padding:16px 22px">'
  +'<div class="form-row">'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Paciente</label><select id="srchPat" style="font-size:.82rem"><option value="">Todos</option>'+DB.patients.filter(function(p){return p.activo}).map(function(p){return '<option value="'+p.id+'">'+sanitize(p.nombre)+' '+sanitize(p.apellidos)+'</option>'}).join('')+'</select></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Estado</label><select id="srchSt" style="font-size:.82rem"><option value="">Todos</option>'+APPT_STATUS.map(function(s){return '<option value="'+s.name+'">'+s.name+'</option>'}).join('')+'</select></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Desde</label><input type="date" id="srchFrom" value="" style="font-size:.82rem"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Hasta</label><input type="date" id="srchTo" value="" style="font-size:.82rem"></div>'
  +'</div>'
  +'<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-primary btn-sm" style="border-radius:8px" onclick="agendaDoSearch()">🔍 Buscar</button><button class="btn btn-outline btn-sm" style="border-radius:8px" onclick="agendaView=\'upcoming\';rAgenda()">Limpiar</button></div>'
  +'</div></div>';
}

function agendaDoSearch(){
  var pid=$('srchPat')?$('srchPat').value:'',st=$('srchSt')?$('srchSt').value:'',from=$('srchFrom')?$('srchFrom').value:'',to=$('srchTo')?$('srchTo').value:'';
  var results=DB.appointments.filter(function(a){
    if(pid&&a.pacienteId!=pid) return false;
    if(st&&a.estado!==st) return false;
    if(from&&a.fecha<from) return false;
    if(to&&a.fecha>to) return false;
    return true;
  });
  $('agendaList').innerHTML=agendaRenderTable(results,'Resultados ('+results.length+' citas)');
}

// ═══ DAY VIEW ═══
function agendaRenderDay(date){
  const ta=DB.appointments.filter(a=>a.fecha===date&&a.estado!=='Cancelada').sort((a,b)=>a.hora.localeCompare(b.hora));
  const hours=['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
  const dayNames=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const d=new Date(date+'T12:00:00');
  const dayLabel=dayNames[d.getDay()]+', '+date.split('-')[2]+'/'+date.split('-')[1]+'/'+date.split('-')[0];

  var h='<div class="card" style="border-top:3px solid var(--primary)">'
  +'<div class="card-header"><span class="card-title" style="font-size:.88rem">📅 '+dayLabel+'</span>'
  +'<span class="badge" style="background:var(--primary-light);color:var(--primary);font-size:.72rem;font-weight:700">'+ta.length+' citas</span></div>'
  +'<div class="card-body" style="padding:0">';
  hours.forEach(function(hr){
    var apt=ta.find(a=>a.hora&&a.hora.startsWith(hr.split(':')[0]));
    var p=apt?gP(apt.pacienteId):null;
    var stObj=apt?APPT_STATUS.find(s=>s.name===apt.estado):null;
    var payObj=apt?APPT_PAYMENT.find(s=>s.name===(apt.pago||'Pendiente')):null;
    var colorMap={'first':'#2563eb','review':'#16a34a','online':'#7c3aed'};
    var bgMap={'first':'#dbeafe','review':'#dcfce7','online':'#f3e8ff'};
    var accentColor=apt?colorMap[apt.color]||'var(--primary)':'';
    var bgColor=apt?bgMap[apt.color]||'var(--primary-light)':'';

    h+='<div style="display:flex;border-bottom:1px solid var(--border);min-height:52px">'
    +'<div style="width:64px;padding:10px 8px;font-size:.76rem;color:var(--text3);font-weight:600;text-align:center;border-right:1px solid var(--border);flex-shrink:0;font-variant-numeric:tabular-nums">'+hr+'</div>'
    +'<div style="flex:1;padding:6px 12px">';
    if(apt){
      h+='<div style="background:'+bgColor+';padding:10px 14px;border-radius:10px;border-left:4px solid '+accentColor+';cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;transition:transform .15s" onmouseover="this.style.transform=\'translateX(3px)\'" onmouseout="this.style.transform=\'none\'" onclick="viewApptDetail('+apt.id+')">'
      +'<div><div style="font-weight:700;font-size:.84rem">'+apt.hora+' — '+(p?sanitize(p.nombre)+' '+sanitize(p.apellidos):'')+'</div>'
      +'<div style="font-size:.72rem;color:var(--text2);margin-top:2px">'+(apt.asunto||apt.tipo)+' · '+apt.duracion+'min'+(apt.precio?' · '+fMoney(apt.precio):'')+'</div></div>'
      +'<div style="display:flex;gap:4px;flex-shrink:0">'
      +'<span class="badge '+(stObj?stObj.badge:'badge-warning')+'" style="font-size:.6rem">'+apt.estado+'</span>'
      +(payObj&&apt.pago?'<span class="badge '+payObj.badge+'" style="font-size:.6rem">'+apt.pago+'</span>':'')
      +'</div></div>';
    }
    h+='</div></div>';
  });
  h+='</div></div>';
  return h;
}

// ═══ TABLE VIEW ═══
function agendaRenderTable(list,title){
  const sorted=list.sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.hora.localeCompare(b.hora));
  var borderColor=title&&title.includes('Anteriores')?'#ca8a04':title&&title.includes('Resultado')?'#6366f1':'var(--accent)';

  var h='<div class="card" style="border-top:3px solid '+borderColor+'">'
  +'<div class="card-header"><span class="card-title" style="font-size:.88rem">'+(title||'Citas')+'</span>'
  +'<span class="badge" style="background:var(--surface2);color:var(--text-secondary);font-size:.72rem">'+sorted.length+'</span></div>';

  if(!sorted.length){
    h+='<div class="card-body" style="text-align:center;padding:40px"><div style="font-size:2.5rem;opacity:.3;margin-bottom:10px">📅</div>'
    +'<p style="color:var(--text-secondary);font-size:.85rem;margin:0">Sin citas</p></div></div>';
    return h;
  }

  h+='<div class="card-body" style="padding:0;overflow-x:auto">'
  +'<table style="width:100%;border-collapse:collapse;font-size:.82rem">'
  +'<thead><tr style="background:var(--surface2)">'
  +'<th style="padding:10px 12px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Fecha</th>'
  +'<th style="padding:10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Hora</th>'
  +'<th style="padding:10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Paciente</th>'
  +'<th style="padding:10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Asunto</th>'
  +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Estado</th>'
  +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Pago</th>'
  +'<th style="padding:10px;text-align:right;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Precio</th>'
  +'<th style="padding:10px 8px;width:100px"></th></tr></thead><tbody>';

  sorted.forEach(function(a,i){
    var p=gP(a.pacienteId);
    var stObj=APPT_STATUS.find(function(s){return s.name===a.estado});
    var payObj=APPT_PAYMENT.find(function(s){return s.name===(a.pago||'Pendiente')});
    var isAlt=i%2===1;
    var endTime=(function(){var pts=a.hora.split(':');var m=parseInt(pts[1])+(a.duracion||30);var hh=parseInt(pts[0])+Math.floor(m/60);return String(hh%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0')})();

    h+='<tr style="border-bottom:1px solid var(--border);background:'+(isAlt?'var(--surface)':'transparent')+'">'
    +'<td style="padding:10px 12px;font-variant-numeric:tabular-nums;font-size:.8rem">'+fD(a.fecha)+'</td>'
    +'<td style="padding:10px"><strong style="font-variant-numeric:tabular-nums">'+a.hora+'</strong><div style="font-size:.65rem;color:var(--text3);font-variant-numeric:tabular-nums">→ '+endTime+'</div></td>'
    +'<td style="padding:10px"><span style="cursor:pointer;color:var(--accent);font-weight:600" onclick="selPat='+a.pacienteId+';navigate(\'historia\')">'+(p?sanitize(p.nombre)+' '+sanitize(p.apellidos):'—')+'</span></td>'
    +'<td style="padding:10px"><span class="calendar-event '+a.color+'">'+(a.asunto||a.tipo)+'</span></td>'
    +'<td style="padding:10px;text-align:center"><span class="badge '+(stObj?stObj.badge:'badge-warning')+'" style="font-size:.65rem">'+a.estado+'</span></td>'
    +'<td style="padding:10px;text-align:center"><span class="badge '+(payObj?payObj.badge:'badge-warning')+'" style="font-size:.65rem">'+(a.pago||'Pendiente')+'</span></td>'
    +'<td style="padding:10px;text-align:right;font-weight:600;font-variant-numeric:tabular-nums">'+(a.precio?fMoney(a.precio):'<span style="color:var(--text3)">—</span>')+'</td>'
    +'<td style="padding:10px"><div style="display:flex;gap:4px;justify-content:flex-end">'
    +'<button class="btn btn-outline btn-xs" style="border-radius:6px" onclick="viewApptDetail('+a.id+')" title="Ver">'+IC.eye+'</button>'
    +'<button class="btn btn-outline btn-xs" style="border-radius:6px" onclick="editApptModal('+a.id+')" title="Editar">'+IC.edit+'</button>'
    +(a.estado!=='Realizada'&&a.estado!=='Cancelada'?'<button class="btn btn-ghost btn-xs" style="border-radius:6px" onclick="markDone('+a.id+')" title="Realizada">✓</button><button class="btn btn-ghost btn-xs" style="border-radius:6px;color:var(--danger)" onclick="cancelAppt('+a.id+')" title="Cancelar">✕</button>':'')
    +'</div></td></tr>';
  });
  h+='</tbody></table></div></div>';
  return h;
}

// ═══ DETAIL MODAL ═══
function viewApptDetail(id){
  const a=DB.appointments.find(x=>x.id===id);if(!a)return;
  const p=gP(a.pacienteId);
  const stObj=APPT_STATUS.find(s=>s.name===a.estado);
  const payObj=APPT_PAYMENT.find(s=>s.name===(a.pago||'Pendiente'));

  openModal('<div class="modal-header"><h3>📋 Detalle de cita #'+a.id+'</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body">'
  +'<div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap">'
  +'<span class="badge '+(stObj?stObj.badge:'badge-warning')+'">'+a.estado+'</span>'
  +'<span class="badge '+(payObj?payObj.badge:'badge-warning')+'">Pago: '+(a.pago||'Pendiente')+'</span>'
  +'<span class="calendar-event '+a.color+'">'+a.tipo+'</span>'
  +(a.precio?'<span class="badge badge-neutral">'+fMoney(a.precio)+'</span>':'')
  +'</div>'
  +'<div style="display:grid;gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden">'
  +[{l:'Asunto',v:a.asunto||a.tipo},{l:'Paciente',v:p?sanitize(p.nombre)+' '+sanitize(p.apellidos):'—'},{l:'Profesional',v:a.profesional},{l:'Fecha',v:fD(a.fecha)},{l:'Hora',v:a.hora},{l:'Duración',v:a.duracion+' min'}].map(function(x,i){
    return '<div style="display:flex;justify-content:space-between;padding:10px 16px;font-size:.84rem;border-bottom:1px solid var(--border);background:'+(i%2===0?'var(--surface)':'transparent')+'"><span style="color:var(--text-secondary);font-weight:600;font-size:.75rem;text-transform:uppercase;letter-spacing:.4px">'+x.l+'</span><span style="font-weight:600">'+x.v+'</span></div>';
  }).join('')
  +(a.nota?'<div style="display:flex;justify-content:space-between;padding:10px 16px;font-size:.84rem;border-bottom:1px solid var(--border)"><span style="color:var(--text-secondary);font-weight:600;font-size:.75rem;text-transform:uppercase;letter-spacing:.4px">Nota</span><span>'+a.nota+'</span></div>':'')
  +(a.enfermedad?'<div style="display:flex;justify-content:space-between;padding:10px 16px;font-size:.84rem;border-bottom:1px solid var(--border);background:var(--surface)"><span style="color:var(--text-secondary);font-weight:600;font-size:.75rem;text-transform:uppercase;letter-spacing:.4px">Enfermedad</span><span>'+a.enfermedad+'</span></div>':'')
  +(a.sintomas?'<div style="display:flex;justify-content:space-between;padding:10px 16px;font-size:.84rem;border-bottom:1px solid var(--border)"><span style="color:var(--text-secondary);font-weight:600;font-size:.75rem;text-transform:uppercase;letter-spacing:.4px">Síntomas</span><span>'+a.sintomas+'</span></div>':'')
  +(a.medicamentos?'<div style="display:flex;justify-content:space-between;padding:10px 16px;font-size:.84rem"><span style="color:var(--text-secondary);font-weight:600;font-size:.75rem;text-transform:uppercase;letter-spacing:.4px">Medicamentos</span><span>'+a.medicamentos+'</span></div>':'')
  +'</div>'
  +'</div>'
  +'<div class="modal-footer">'
  +(a.estado!=='Realizada'&&a.estado!=='Cancelada'?'<button class="btn btn-outline btn-sm" style="border-radius:8px" onclick="closeModal();editApptModal('+a.id+')">✏️ Editar</button>'
  +'<button class="btn btn-primary btn-sm" style="border-radius:8px" onclick="closeModal();markDone('+a.id+')">✓ Marcar realizada</button>':'')
  +'<button class="btn btn-outline btn-sm" style="border-radius:8px" onclick="sendWhatsAppReminder('+a.id+')">📱 WhatsApp</button>'
  +'<button class="btn btn-ghost btn-sm" style="border-radius:8px" onclick="closeModal()">Cerrar</button>'
  +'</div>',true);
}

// ═══ CREATE / EDIT MODAL ═══
function openApptModal(editId){
  const a=editId?DB.appointments.find(x=>x.id===editId):null;
  const isEdit=!!a;
  openModal('<div class="modal-header"><h3>'+(isEdit?'✏️'+' Editar cita #'+a.id:'📅 Nueva cita')+'</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body"><div style="display:grid;gap:14px">'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Asunto / Motivo *</label><input id="apAs" value="'+(a?a.asunto||a.tipo:'')+'" placeholder="Ej: Consulta de revisión"></div>'
  +'<div class="form-row">'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Paciente *</label><select id="apP">'+DB.patients.filter(function(p){return p.activo}).map(function(p){return '<option value="'+p.id+'" '+(a&&a.pacienteId===p.id?'selected':'')+'>'+sanitize(p.nombre)+' '+sanitize(p.apellidos)+'</option>'}).join('')+'</select></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Tipo</label><select id="apT"><option '+(a&&a.tipo==='Primera visita'?'selected':'')+'>Primera visita</option><option '+(a&&a.tipo==='Revisión'?'selected':'')+'>Revisión</option><option '+(a&&a.tipo==='Online'?'selected':'')+'>Online</option></select></div></div>'
  +'<div class="form-row">'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">📅 Fecha *</label><input type="date" id="apD" value="'+(a?a.fecha:new Date().toISOString().slice(0,10))+'"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">🕐 Hora *</label><input type="time" id="apH" value="'+(a?a.hora:'09:00')+'"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">🕐 Duración</label><input type="number" id="apDur" value="'+(a?a.duracion:45)+'" min="15" step="15"></div></div>'
  +'<div class="form-row">'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Estado cita</label><select id="apSt">'+APPT_STATUS.map(function(s){return '<option '+(a&&a.estado===s.name?'selected':'')+'>'+s.name+'</option>'}).join('')+'</select></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Estado pago</label><select id="apPy">'+APPT_PAYMENT.map(function(s){return '<option '+(a&&a.pago===s.name?'selected':'')+'>'+s.name+'</option>'}).join('')+'</select></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">💰 Precio</label><input type="number" id="apPr" value="'+(a&&a.precio?a.precio:'')+'" step="0.01" placeholder="0.00"></div></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">💬 Notas</label><textarea id="apNo" rows="2" placeholder="Notas sobre la cita...">'+(a&&a.nota?a.nota:'')+'</textarea></div>'
  +'<div class="form-row">'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Enfermedad</label><input id="apEn" value="'+(a&&a.enfermedad?a.enfermedad:'')+'" placeholder="Diagnóstico o patología"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Síntomas</label><input id="apSi" value="'+(a&&a.sintomas?a.sintomas:'')+'" placeholder="Síntomas reportados"></div></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">💊 Medicamentos</label><input id="apMe" value="'+(a&&a.medicamentos?a.medicamentos:'')+'" placeholder="Medicación prescrita"></div>'
  +'</div></div>'
  +'<div class="modal-footer">'
  +'<button class="btn btn-outline" style="border-radius:8px" onclick="closeModal()">'+t('cancel')+'</button>'
  +'<button class="btn btn-primary" style="border-radius:8px;padding:10px 24px" onclick="saveAppt('+(isEdit?a.id:'null')+')">'+(isEdit?'✏️ Actualizar':'📅 Agregar cita')+'</button>'
  +'</div>',true);
}

function editApptModal(id){openApptModal(id)}

function saveAppt(editId){
  const pId=+$('apP').value,tipo=$('apT').value,fecha=$('apD').value,hora=$('apH').value,asunto=sanitize($('apAs').value.trim()),dur=+$('apDur').value||45,estado=$('apSt').value,pago=$('apPy').value,precio=parseFloat($('apPr').value)||0,nota=sanitize($('apNo').value.trim()),enfermedad=sanitize($('apEn').value.trim()),sintomas=sanitize($('apSi').value.trim()),medicamentos=sanitize($('apMe').value.trim());
  // A2: Conflict detection
  var conflicto=DB.appointments.find(function(ex){
    if(ex.estado==='Cancelada')return false;
    if(editId&&ex.id===editId)return false;
    if(ex.fecha!==fecha)return false;
    var exStart=parseInt(ex.hora.replace(':',''));var exEnd=exStart+(ex.duracion||30);
    var newStart=parseInt(hora.replace(':',''));var newEnd=newStart+dur;
    return(newStart<exEnd&&newEnd>exStart);
  });
  if(conflicto){var cp=gP(conflicto.pacienteId);toast('⚠️ Conflicto: '+conflicto.hora+' — '+(cp?sanitize(cp.nombre):'otro paciente'),'warning')}
  if(!asunto||!fecha||!hora){toast('Asunto, fecha y hora son obligatorios','error');return}
  if(fecha<new Date().toISOString().slice(0,10)&&!editId){
    if(!confirm('La fecha seleccionada es en el pasado. ¿Continuar?'))return;
  }
  const dup=DB.appointments.find(a=>a.pacienteId===pId&&a.fecha===fecha&&a.hora===hora&&a.id!==editId&&a.estado!=='Cancelada');
  if(dup){toast('Ya existe una cita para este paciente en esa fecha y hora','error');return}
  const overlap=DB.appointments.find(a=>a.fecha===fecha&&a.hora===hora&&a.id!==editId&&a.estado!=='Cancelada'&&a.pacienteId!==pId);
  if(overlap){var opat=gP(overlap.pacienteId);toast('⚠️ Ya hay cita a las '+hora+' con '+(opat?sanitize(opat.nombre)+' '+sanitize(opat.apellidos):'otro paciente'),'warning')}
  const cm={'Primera visita':'first','Revisión':'review',Online:'online'};
  if(editId){
    const a=DB.appointments.find(x=>x.id===editId);
    if(a){Object.assign(a,{pacienteId:pId,tipo,fecha,hora,asunto,duracion:dur,estado,pago,precio,nota,enfermedad,sintomas,medicamentos,color:cm[tipo]||'review'})}
    closeModal();toast('Cita actualizada');showSaved();
  }else{
    DB.appointments.push({id:DB.nextAId++,pacienteId:pId,profesional:currentUser?currentUser.name:'Lic. Antonella Caverzan',fecha,hora,tipo,asunto,estado,pago,precio,nota,enfermedad,sintomas,medicamentos,duracion:dur,color:cm[tipo]||'review'});
    closeModal();toast('Cita creada');showSaved();
  }
  navigate('agenda');
}

function cancelAppt(id){
  const a=DB.appointments.find(x=>x.id===id);if(!a)return;
  if(a.estado==='Realizada'){toast('No se puede cancelar una cita ya realizada','error');return}
  var p=gP(a.pacienteId);
  openModal('<div class="modal-header"><h3>⚠️ Cancelar cita</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body"><p>¿Cancelar la cita de <strong>'+(p?sanitize(p.nombre)+' '+sanitize(p.apellidos):'')+'</strong> del '+fD(a.fecha)+' a las '+a.hora+'?</p></div><div class="modal-footer"><button class="btn btn-outline" style="border-radius:8px" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-danger" style="border-radius:8px" onclick="confirmCancelAppt('+id+')">Cancelar cita</button></div>');
}
function confirmCancelAppt(id){
  const a=DB.appointments.find(x=>x.id===id);if(!a)return;
  a.estado='Cancelada';
  closeModal();toast('Cita cancelada','warning');
  navigate('agenda');
}

// ===== VISTA MENSUAL =====
var agendaMonthOffset=0;
function renderMonthView(){
  var now=new Date();now.setMonth(now.getMonth()+agendaMonthOffset);
  var year=now.getFullYear(),month=now.getMonth();
  var monthNames=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var firstDay=new Date(year,month,1).getDay();firstDay=firstDay===0?6:firstDay-1;
  var daysInMonth=new Date(year,month+1,0).getDate();
  var today=new Date().toISOString().slice(0,10);

  var html='<div class="card" style="border-top:3px solid var(--primary)"><div class="card-header">'
  +'<div style="display:flex;align-items:center;gap:8px">'
  +'<button class="btn btn-ghost btn-xs" style="border-radius:6px;width:28px;height:28px" onclick="agendaMonthOffset--;rAgenda()">‹</button>'
  +'<span class="card-title" style="font-size:.92rem">'+monthNames[month]+' '+year+'</span>'
  +'<button class="btn btn-ghost btn-xs" style="border-radius:6px;width:28px;height:28px" onclick="agendaMonthOffset++;rAgenda()">›</button>'
  +'<button class="btn btn-outline btn-xs" style="border-radius:6px;font-size:.65rem;margin-left:4px" onclick="agendaMonthOffset=0;rAgenda()">Hoy</button></div></div>';
  html+='<div class="card-body" style="padding:10px"><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">';
  ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].forEach(function(d){html+='<div style="text-align:center;font-size:.68rem;font-weight:700;color:var(--text3);padding:8px;text-transform:uppercase;letter-spacing:.4px">'+d+'</div>'});
  for(var e=0;e<firstDay;e++){html+='<div style="padding:4px;min-height:75px;background:var(--surface2);border-radius:6px"></div>'}
  for(var d=1;d<=daysInMonth;d++){
    var dateStr=year+'-'+String(month+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    var dayAppts=DB.appointments.filter(function(a){return a.fecha===dateStr&&a.estado!=='Cancelada'});
    var isToday=dateStr===today;
    html+='<div class="drop-zone" ondragover="event.preventDefault();this.classList.add(\'drag-over\')" ondragleave="this.classList.remove(\'drag-over\')" ondrop="dropApptMonth(event,\''+dateStr+'\')" style="padding:5px;min-height:75px;background:'+(isToday?'var(--primary-light)':'var(--surface)')+';border-radius:6px;border:'+(isToday?'2px solid var(--primary)':'1px solid var(--border)')+';cursor:pointer;transition:box-shadow .15s" onmouseover="this.style.boxShadow=\'0 2px 8px rgba(0,0,0,.06)\'" onmouseout="this.style.boxShadow=\'none\'" onclick="agendaView=\'today\';agendaRenderDay(\''+dateStr+'\')">';
    html+='<div style="font-size:.72rem;font-weight:'+(isToday?'800':'600')+';color:'+(isToday?'var(--primary)':'var(--text2)')+';margin-bottom:3px">'+d+'</div>';
    dayAppts.slice(0,3).forEach(function(a){
      var p=gP(a.pacienteId);
      html+='<div class="appt-draggable" draggable="true" ondragstart="dragApptMonth(event,'+a.id+')" ondragend="this.style.opacity=1" style="cursor:grab;font-size:.56rem;padding:2px 5px;margin-bottom:1px;border-radius:4px;background:var(--primary);color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+a.hora+' '+(p?p.nombre:'')+' — Arrastra para mover">'+a.hora+' '+(p?sanitize(p.nombre).substring(0,8):'')+'</div>';
    });
    if(dayAppts.length>3)html+='<div style="font-size:.55rem;color:var(--text3)">+'+(dayAppts.length-3)+' más</div>';
    html+='</div>';
  }
  html+='</div></div></div>';
  return html;
}

// ===== DRAG & DROP =====
var _dragApptId=null;
var agendaWeekOffset=0;

function dragAppt(event,apptId){
  _dragApptId=apptId;
  event.dataTransfer.setData('text/plain',apptId);
  event.dataTransfer.effectAllowed='move';
  setTimeout(function(){event.target.classList.add('dragging')},0);
  var ghost=document.createElement('div');
  var a=DB.appointments.find(function(x){return x.id===apptId});
  var p=a?gP(a.pacienteId):null;
  ghost.className='drag-ghost';
  ghost.textContent='📅 '+(a?a.hora+' '+(p?p.nombre:''):'Cita');
  ghost.style.position='absolute';ghost.style.top='-9999px';
  document.body.appendChild(ghost);
  event.dataTransfer.setDragImage(ghost,0,0);
  setTimeout(function(){ghost.remove()},0);
}

function endDragAppt(event){
  event.target.classList.remove('dragging');
  document.querySelectorAll('.drop-zone').forEach(function(z){z.classList.remove('drag-over')});
  _dragApptId=null;
}

function dropAppt(event,newDate,newHour){
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  var apptId=parseInt(event.dataTransfer.getData('text/plain'))||_dragApptId;
  if(!apptId)return;
  var a=DB.appointments.find(function(x){return x.id===apptId});
  if(!a||a.fecha===newDate&&a.hora===newHour)return;
  var conflict=DB.appointments.find(function(x){return x.id!==apptId&&x.fecha===newDate&&x.hora===newHour&&x.estado!=='Cancelada'});
  if(conflict){var cp=gP(conflict.pacienteId);toast('⚠️ Ya hay cita a las '+newHour+' con '+(cp?sanitize(cp.nombre):'otro paciente'),'warning')}
  a.fecha=newDate;a.hora=newHour;
  var p=gP(a.pacienteId);toast('📅 '+(p?p.nombre:'Cita')+' movida → '+fD(newDate)+' '+newHour);
  showSaved();rAgenda();
}

function dragApptMonth(event,apptId){
  _dragApptId=apptId;
  event.dataTransfer.setData('text/plain',apptId);
  event.dataTransfer.effectAllowed='move';
  setTimeout(function(){event.target.style.opacity='0.4'},0);
}

function dropApptMonth(event,newDate){
  event.preventDefault();
  event.currentTarget.style.background='';event.currentTarget.style.boxShadow='';
  var apptId=parseInt(event.dataTransfer.getData('text/plain'))||_dragApptId;
  if(!apptId)return;
  var a=DB.appointments.find(function(x){return x.id===apptId});
  if(!a||a.fecha===newDate)return;
  a.fecha=newDate;
  var p=gP(a.pacienteId);toast('📅 '+(p?p.nombre:'Cita')+' movida → '+fD(newDate));
  showSaved();rAgenda();
}

// #6 Citas recurrentes
function openRecurringAppt(){
  if(!DB.patients.length){toast('Agregue pacientes primero','error');return}
  openModal('<div class="modal-header"><h3>🔄 Cita recurrente</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body"><div style="display:grid;gap:14px">'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Paciente</label><select id="rcPat">'+DB.patients.filter(function(p){return p.activo}).map(function(p){return'<option value="'+p.id+'">'+sanitize(p.nombre)+' '+sanitize(p.apellidos)+'</option>'}).join('')+'</select></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Tipo</label><select id="rcTipo"><option>Revision</option><option>Primera visita</option><option>Online</option></select></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Hora</label><input type="time" id="rcHora" value="10:00"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Duración (min)</label><input type="number" id="rcDur" value="30" min="15" max="120" step="15"></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Frecuencia</label><select id="rcFreq"><option value="7">Semanal</option><option value="14">Quincenal</option><option value="30">Mensual</option></select></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Repeticiones</label><input type="number" id="rcReps" value="4" min="2" max="24"></div></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">📅 Desde</label><input type="date" id="rcDesde" value="'+new Date().toISOString().slice(0,10)+'"></div>'
  +'</div></div><div class="modal-footer"><button class="btn btn-outline" style="border-radius:8px" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" style="border-radius:8px" onclick="saveRecurringAppt()">🔄 Crear citas</button></div>');
}

function saveRecurringAppt(){
  var patId=+$('rcPat').value;var tipo=$('rcTipo').value;
  var hora=$('rcHora').value;var dur=+$('rcDur').value||30;
  var freq=+$('rcFreq').value;var reps=+$('rcReps').value||4;
  var desde=new Date($('rcDesde').value);
  var created=0;
  for(var i=0;i<reps;i++){
    var fecha=new Date(desde.getTime()+i*freq*86400000).toISOString().slice(0,10);
    DB.appointments.push({id:DB.nextAId++,pacienteId:patId,profesional:currentUser?currentUser.name:'Lic. Antonella Caverzan',fecha:fecha,hora:hora,tipo:tipo,asunto:tipo,estado:'Pendiente',pago:'Pendiente',precio:tipo==='Primera visita'?55:35,duracion:dur,color:tipo==='Primera visita'?'first':'review',_recurring:true});
    created++;
  }
  closeModal();toast(created+' citas recurrentes creadas (cada '+freq+' dias)');showSaved();rAgenda();
}

// #8 Bloqueo de horarios
if(!DB.horariosBlock) DB.horariosBlock=[];

function openBlockHorario(){
  openModal('<div class="modal-header"><h3>🔒 Bloquear horario</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body"><div style="display:grid;gap:14px">'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">📅 Fecha</label><input type="date" id="bhFecha" value="'+new Date().toISOString().slice(0,10)+'"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">🕐 Desde</label><input type="time" id="bhDesde" value="13:00"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">🕐 Hasta</label><input type="time" id="bhHasta" value="14:00"></div></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">✏️ Motivo</label><input id="bhMotivo" placeholder="Ej: Almuerzo, reunión..." value="Bloqueo"></div>'
  +'</div></div><div class="modal-footer"><button class="btn btn-outline" style="border-radius:8px" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" style="border-radius:8px" onclick="saveBlockHorario()">🔒 Bloquear</button></div>');
}

function saveBlockHorario(){
  var fecha=$('bhFecha').value;var desde=$('bhDesde').value;var hasta=$('bhHasta').value;
  if(!fecha||!desde||!hasta){toast('Complete todos los campos','error');return}
  DB.horariosBlock.push({id:Date.now(),fecha:fecha,desde:desde,hasta:hasta,motivo:sanitize($('bhMotivo').value.trim()||'Bloqueo')});
  closeModal();toast('Horario bloqueado: '+desde+'-'+hasta);showSaved();rAgenda();
}

// #10 Imprimir agenda del día
function printAgendaDay(){
  var today=new Date().toISOString().slice(0,10);
  var citas=DB.appointments.filter(function(a){return a.fecha===today&&a.estado!=='Cancelada'}).sort(function(a,b){return a.hora.localeCompare(b.hora)});
  var w=window.open('','_blank','width=600,height=800');
  w.document.write('<html><head><title>Agenda '+fD(today)+'</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;padding:20mm;font-size:11px}h1{font-size:16px;color:#2E8B57;margin-bottom:12px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ddd;text-align:left}th{background:#f0f7f4;font-weight:700}.footer{margin-top:20px;font-size:8px;color:#999;text-align:center}</style></head><body>');
  w.document.write('<h1>Agenda — '+fD(today)+'</h1><p style="font-size:10px;color:#888;margin-bottom:14px">'+(currentUser?currentUser.name:'')+'</p>');
  w.document.write('<table><thead><tr><th>Hora</th><th>Paciente</th><th>Tipo</th><th>Duración</th><th>Estado</th><th>Notas</th></tr></thead><tbody>');
  citas.forEach(function(a){var p=gP(a.pacienteId);w.document.write('<tr><td><strong>'+a.hora+'</strong></td><td>'+(p?sanitize(p.nombre)+' '+sanitize(p.apellidos):'—')+'</td><td>'+a.tipo+'</td><td>'+a.duracion+'min</td><td>'+a.estado+'</td><td style="font-size:9px;color:#666">'+(a.nota||'')+'</td></tr>')});
  w.document.write('</tbody></table><div class="footer">Veridia HealthTech &copy; '+new Date().getFullYear()+'</div>');
  w.document.write('<script>setTimeout(function(){window.print()},400)<\/script></body></html>');w.document.close();
}

// A7: WhatsApp reminder
function sendWhatsAppReminder(apptId){
  var a=DB.appointments.find(function(x){return x.id===apptId});if(!a)return;
  var p=gP(a.pacienteId);if(!p||!p.telefono){toast('Paciente sin teléfono registrado','error');return}
  var tel=p.telefono.replace(/[^0-9+]/g,'');
  if(!tel.startsWith('+'))tel='+34'+tel;
  var clinica='';try{clinica=localStorage.getItem('veridia_clinica')||''}catch(e){console.warn('[Veridia]',e.message||e)}
  var msg='Hola '+p.nombre+', le recordamos su cita el '+fD(a.fecha)+' a las '+a.hora
  +(a.asunto?' ('+a.asunto+')':'')
  +(clinica?'. '+clinica:'')+'. Por favor confirme su asistencia. Gracias!';
  window.open('https://wa.me/'+tel.replace('+','')+'?text='+encodeURIComponent(msg),'_blank');
  toast('WhatsApp abierto para '+p.nombre,'success');
}

// A4: Timeline vertical
function renderTimelineToday(){
  var today=new Date().toISOString().slice(0,10);
  var appts=DB.appointments.filter(function(a){return a.fecha===today&&a.estado!=='Cancelada'}).sort(function(a,b){return a.hora.localeCompare(b.hora)});
  var h='<div class="card" style="margin-top:16px;border-top:3px solid #6366f1"><div class="card-header"><span class="card-title" style="font-size:.85rem">🕐 Timeline del día</span></div><div class="card-body">'
  +'<div style="position:relative;padding-left:44px;border-left:2px solid var(--border);margin-left:22px">';
  for(var hour=8;hour<=20;hour++){
    var hStr=String(hour).padStart(2,'0')+':00';
    var slotAppts=appts.filter(function(a){return a.hora.startsWith(String(hour).padStart(2,'0'))});
    h+='<div style="position:relative;min-height:'+(slotAppts.length?'auto':'32px')+';padding:4px 0">'
    +'<div style="position:absolute;left:-54px;font-size:.7rem;color:var(--text3);font-weight:600;font-variant-numeric:tabular-nums">'+hStr+'</div>'
    +'<div style="position:absolute;left:-29px;top:8px;width:10px;height:10px;border-radius:50%;background:'+(slotAppts.length?'var(--primary)':'var(--border)')+';border:2px solid var(--surface)"></div>';
    slotAppts.forEach(function(a){
      var p=gP(a.pacienteId);
      h+='<div style="padding:10px 14px;background:var(--surface2);border-radius:10px;margin-bottom:4px;border-left:3px solid var(--primary);cursor:pointer;transition:transform .15s" onmouseover="this.style.transform=\'translateX(3px)\'" onmouseout="this.style.transform=\'none\'" onclick="viewApptDetail('+a.id+')">'
      +'<strong style="font-size:.84rem">'+a.hora+'</strong> '+(p?sanitize(p.nombre)+' '+sanitize(p.apellidos):'')
      +'<div style="font-size:.72rem;color:var(--text3);margin-top:2px">'+(a.asunto||a.tipo)+' · '+a.duracion+'min · <span class="badge '+(a.estado==='Confirmada'?'badge-success':'badge-warning')+'" style="font-size:.58rem">'+a.estado+'</span></div></div>';
    });
    h+='</div>';
  }
  return h+'</div></div></div>';
}

// A5: Filter by professional
function getAgendaProfessionals(){
  var profs={};DB.appointments.forEach(function(a){if(a.profesional)profs[a.profesional]=1});
  return Object.keys(profs);
}

// A6: iCal export
function exportICal(){
  var cal='BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Veridia HealthTech//ES\n';
  DB.appointments.filter(function(a){return a.estado!=='Cancelada'}).forEach(function(a){
    var p=gP(a.pacienteId);var name=p?sanitize(p.nombre)+' '+sanitize(p.apellidos):'Paciente';
    var dtStart=a.fecha.replace(/-/g,'')+'T'+a.hora.replace(':','')+'00';
    var dur=a.duracion||30;var endH=parseInt(a.hora.split(':')[0]);var endM=parseInt(a.hora.split(':')[1])+dur;
    endH+=Math.floor(endM/60);endM=endM%60;
    var dtEnd=a.fecha.replace(/-/g,'')+'T'+String(endH).padStart(2,'0')+String(endM).padStart(2,'0')+'00';
    cal+='BEGIN:VEVENT\nDTSTART:'+dtStart+'\nDTEND:'+dtEnd+'\nSUMMARY:'+name+' — '+(a.asunto||a.tipo)+'\nDESCRIPTION:'+(a.nota||'')+'\nEND:VEVENT\n';
  });
  cal+='END:VCALENDAR';
  var blob=new Blob([cal],{type:'text/calendar'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='veridia_citas.ics';a.click();
  toast('Calendario exportado (.ics)','success');
}
