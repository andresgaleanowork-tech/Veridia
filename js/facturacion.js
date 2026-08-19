// ===== FACTURACIÓN + CONTABILIDAD (adapted from MyCliniK/myclinik) =====
// Services catalog (inspired by MyCliniK Treatment model: name, subservice, price, duration)
var SERVICES=[
  {id:1,nombre:'Primera consulta nutricional',categoria:'Consulta',precio:55,duracion:60,iva:21,desc:'Anamnesis completa, valoración antropométrica, objetivos'},
  {id:2,nombre:'Consulta de revisión',categoria:'Consulta',precio:35,duracion:30,iva:21,desc:'Control de evolución, ajuste de plan'},
  {id:3,nombre:'Consulta online (videollamada)',categoria:'Consulta',precio:30,duracion:30,iva:21,desc:'Seguimiento por videollamada'},
  {id:4,nombre:'Entrega de plan alimentario',categoria:'Plan',precio:30,duracion:45,iva:21,desc:'Elaboración y entrega de dieta personalizada'},
  {id:5,nombre:'Estudio antropométrico completo',categoria:'Estudio',precio:40,duracion:30,iva:21,desc:'Peso, talla, pliegues, perímetros, composición corporal'},
  {id:6,nombre:'Análisis composición corporal (BIA)',categoria:'Estudio',precio:25,duracion:20,iva:21,desc:'Bioimpedancia: % grasa, masa muscular, agua'},
  {id:7,nombre:'Educación nutricional (taller)',categoria:'Educación',precio:20,duracion:60,iva:21,desc:'Sesión grupal o individual de educación alimentaria'},
  {id:8,nombre:'Informe nutricional escrito',categoria:'Informe',precio:30,duracion:0,iva:21,desc:'Informe para médico, seguro o empresa'},
  {id:9,nombre:'Bono 5 revisiones',categoria:'Bono',precio:150,duracion:0,iva:21,desc:'5 consultas de revisión (ahorro '+fMoney(25)+')'},
  {id:10,nombre:'Bono 10 revisiones',categoria:'Bono',precio:280,duracion:0,iva:21,desc:'10 consultas de revisión (ahorro '+fMoney(70)+')'},
  {id:11,nombre:'Pack inicio (1ª consulta + plan + revisión)',categoria:'Pack',precio:120,duracion:0,iva:21,desc:'Primera consulta + plan personalizado + 1 revisión'},
];
var factView='list'; // list | stats | services

function rFact(){
  const all=DB.invoices;
  const pagadas=all.filter(i=>i.estado==='Pagada');
  const pendientes=all.filter(i=>i.estado==='Pendiente'||i.estado==='Vencida');
  const tp=pagadas.reduce((s,i)=>s+i.total,0);
  const tn=pendientes.reduce((s,i)=>s+i.total,0);
  const totalAll=all.reduce((s,i)=>s+i.total,0);

  // Monthly income (MyCliniK: incomeByMonth)
  var meses=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  var ingresosMes=meses.map(()=>0);
  var impagadosMes=meses.map(()=>0);
  all.forEach(i=>{var m=parseInt(i.fecha.split('-')[1])-1;if(i.estado==='Pagada')ingresosMes[m]+=i.total;else if(i.estado!=='Anulada')impagadosMes[m]+=i.total});

  // Income by service (MyCliniK: appointmentByTreatment)
  var ingresosServicio={};
  all.forEach(i=>{i.lineas.forEach(l=>{if(!ingresosServicio[l.servicio])ingresosServicio[l.servicio]=0;ingresosServicio[l.servicio]+=l.precio*l.cantidad})});

  $('mainContent').innerHTML=`<div class="fade-in">
<!-- Stats -->
<!-- Hero Header -->
<div class="card" style="border:none;background:linear-gradient(135deg,#0E7490 0%,#0891B2 50%,#22D3EE 100%);color:#fff;margin-bottom:22px;border-radius:var(--radius);overflow:hidden;position:relative">
<div style="position:absolute;top:-30px;right:-20px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.04)"></div>
<div class="card-body" style="padding:22px 28px;position:relative;z-index:1">
<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">💰
<div><h2 style="margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.3px">Facturación</h2>
<p style="margin:0;font-size:.78rem;opacity:.75">${all.length} facturas · ${fMoney(tp)} cobrado · ${fMoney(tn)} pendiente</p></div></div></div></div>

<!-- KPI Cards -->
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:20px">
  <div class="card" style="padding:16px;text-align:center;border-top:3px solid var(--primary)"><div style="font-size:1.5rem;font-weight:800;color:var(--primary)">${all.length}</div><div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Facturas</div></div>
  <div class="card" style="padding:16px;text-align:center;border-top:3px solid #16a34a"><div style="font-size:1.5rem;font-weight:800;color:#16a34a">${fMoney(tp)}</div><div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Cobrado</div></div>
  <div class="card" style="padding:16px;text-align:center;border-top:3px solid ${tn>0?'#dc2626':'#16a34a'}"><div style="font-size:1.5rem;font-weight:800;color:${tn>0?'#dc2626':'#16a34a'}">${fMoney(tn)}</div><div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Pendiente</div></div>
  <div class="card" style="padding:16px;text-align:center;border-top:3px solid var(--accent)"><div style="font-size:1.5rem;font-weight:800;color:var(--accent)">${fMoney(totalAll)}</div><div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Facturado total</div></div>
</div>

<!-- View tabs -->
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
  <div class="pill-tabs">
    <button class="pill-tab ${factView==='list'?'active':''}" onclick="factView='list';rFact()">📋 Facturas</button>
    <button class="pill-tab ${factView==='stats'?'active':''}" onclick="factView='stats';rFact()">📊 Estadísticas</button>
    <button class="pill-tab ${factView==='services'?'active':''}" onclick="factView='services';rFact()">🏷️ Servicios</button>
  </div>
  <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-outline btn-xs" style="border-radius:8px" onclick="exportInvoices()">📥 CSV</button><button class="btn btn-outline btn-sm" style="border-radius:8px" onclick="openRecurringInvoice()">🔄 Recurrente</button><button class="btn btn-outline btn-sm" style="border-radius:8px" onclick="renderInformeFiscal()">📊 Fiscal</button><button class="btn btn-primary btn-sm" style="border-radius:8px" onclick="openNewInvoiceModal()">${IC.plus} Nueva factura</button></div>
</div>

${factView==='list'?factRenderList(all):factView==='stats'?factRenderStats(ingresosMes,impagadosMes,meses,ingresosServicio,tp,tn):factRenderServices()}
</div>`;
}

function factRenderList(invoices){
  var totalFact=invoices.reduce(function(s,i){return s+(i.estado!=='Anulada'?i.total:0)},0);
  var totalPend=invoices.filter(function(i){return i.estado==='Pendiente'||i.estado==='Vencida'}).reduce(function(s,i){return s+i.total},0);
  var totalCobrado=invoices.filter(function(i){return i.estado==='Pagada'}).reduce(function(s,i){return s+i.total},0);
  return `
<!-- Filters (inspired by MyCliniK StatisticsController filters) -->
<div class="card" style="margin-bottom:14px"><div class="card-body" style="padding:10px 16px">
<div class="form-row" style="margin:0">
  <div class="form-group" style="margin:0"><select id="fltPat" onchange="factFilter()" style="font-size:.78rem"><option value="">Todos los pacientes</option>${DB.patients.filter(p=>p.activo).map(p=>`<option value="${p.id}">${p.nombre} ${p.apellidos}</option>`).join('')}</select></div>
  <div class="form-group" style="margin:0"><select id="fltSt" onchange="factFilter()" style="font-size:.78rem"><option value="">Todos los estados</option><option>Pagada</option><option>Pendiente</option><option>Vencida</option><option>Anulada</option></select></div>
  <div class="form-group" style="margin:0"><input type="date" id="fltFrom" onchange="factFilter()" style="font-size:.78rem" placeholder="Desde"></div>
  <div class="form-group" style="margin:0"><input type="date" id="fltTo" onchange="factFilter()" style="font-size:.78rem" placeholder="Hasta"></div>
</div></div></div>
<div class="card"><div class="card-header"><span class="card-title" style="font-size:.88rem">📋 Facturas</span><span class="badge badge-neutral" id="factCount">${invoices.length}</span></div>
<div class="card-body" style="padding:0;overflow-x:auto"><table><thead><tr><th>Nº</th><th>Paciente</th><th>Fecha</th><th>Servicio</th><th>Base</th><th>${taxLabel()}</th><th>Total</th><th>Estado</th><th></th></tr></thead><tbody id="factBody">
${invoices.map(i=>{const p=gP(i.pacienteId);const iva=i.lineas.reduce((s,l)=>s+l.precio*l.cantidad*l.iva/100,0);return`<tr class="fact-row" data-pat="${i.pacienteId}" data-st="${i.estado}" data-date="${i.fecha}">
<td><code style="font-size:.74rem">${i.numero}</code></td>
<td>${p?sanitize(p.nombre)+' '+sanitize(p.apellidos):'—'}</td>
<td>${fD(i.fecha)}</td>
<td style="font-size:.78rem">${i.lineas.map(l=>l.servicio).join(', ')}</td>
<td>${fMoney(i.total-iva)}</td>
<td style="color:var(--text3)">${fMoney(iva)}</td>
<td><strong>${fMoney(i.total)}</strong></td>
<td><span class="badge ${i.estado==='Pagada'?'badge-success':i.estado==='Pendiente'?'badge-warning':i.estado==='Vencida'?'badge-danger':'badge-neutral'}">${i.estado}</span></td>
<td><div style="display:flex;gap:3px">
${i.estado!=='Pagada'&&i.estado!=='Anulada'?`<button class="btn btn-outline btn-xs" onclick="openPayModal(${i.id})">💳 Cobrar</button>`:''}
<button class="btn btn-ghost btn-xs" onclick="printInvoice(${i.id})" title="Imprimir">${IC.dl}</button>
${i.estado==='Pendiente'?`<button class="btn btn-ghost btn-xs" style="color:var(--danger)" onclick="anularFactura(${i.id})" title="Anular">✕</button>`:''}
</div></td></tr>`}).join('')}
</tbody></table></div></div>`;
}

function factFilter(){
  var pid=$('fltPat')?$('fltPat').value:'',st=$('fltSt')?$('fltSt').value:'',from=$('fltFrom')?$('fltFrom').value:'',to=$('fltTo')?$('fltTo').value:'',numQ=$('fltNum')?$('fltNum').value.trim().toLowerCase():'';
  var count=0;
  document.querySelectorAll('.fact-row').forEach(r=>{
    var show=true;
    if(pid&&r.dataset.pat!==pid) show=false;
    if(st&&r.dataset.st!==st) show=false;
    if(from&&r.dataset.date<from) show=false;
    if(to&&r.dataset.date>to) show=false;
    r.style.display=show?'':'none';
    if(show) count++;
  });
  if($('factCount'))$('factCount').textContent=count;
}

function factRenderStats(ingresosMes,impagadosMes,meses,ingresosServicio,tp,tn){
  const maxIng=Math.max(...ingresosMes,1);
  return `
<div class="grid-2">
  <!-- Monthly income chart (MyCliniK: incomeByMonth) -->
  <div class="card"><div class="card-header"><span class="card-title" style="font-size:.85rem">📊 Ingresos mensuales</span></div><div class="card-body">
    ${svgBarChart({data:meses.slice(0,6).map(function(m,i){return{label:m,value:ingresosMes[i]}}),width:460,height:190,unit:CURRENCIES[CURRENCY].symbol,color:'var(--primary)'})}
  </div></div>

  <!-- Paid vs Unpaid (MyCliniK: unpaidByMonth) -->
  <div class="card"><div class="card-header"><span class="card-title" style="font-size:.85rem">💰 Cobrado vs Pendiente</span></div><div class="card-body">
    <div style="display:flex;align-items:center;gap:20px;margin-bottom:16px">
      <div style="text-align:center;flex:1"><div style="font-size:2rem;font-weight:900;color:var(--success)">${fMoney(tp)}</div><div style="font-size:.72rem;color:var(--text3)">Cobrado</div></div>
      <div style="text-align:center;flex:1"><div style="font-size:2rem;font-weight:900;color:var(--danger)">${fMoney(tn)}</div><div style="font-size:.72rem;color:var(--text3)">Pendiente</div></div>
    </div>
    <div style="display:flex;height:20px;border-radius:10px;overflow:hidden">
      <div style="width:${tp+tn>0?tp/(tp+tn)*100:50}%;background:var(--success);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.62rem;font-weight:700">${tp+tn>0?Math.round(tp/(tp+tn)*100):0}%</div>
      <div style="width:${tp+tn>0?tn/(tp+tn)*100:50}%;background:var(--danger);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.62rem;font-weight:700">${tp+tn>0?Math.round(tn/(tp+tn)*100):0}%</div>
    </div>
  </div></div>

  <!-- Income by service (MyCliniK: appointmentByTreatment) -->
  <div class="card" style="grid-column:1/-1"><div class="card-header"><span class="card-title" style="font-size:.85rem">🏷️ Facturación por servicio</span></div><div class="card-body" style="padding:0">
    <table><thead><tr><th>Servicio</th><th>Importe facturado</th><th>%</th><th></th></tr></thead><tbody>
    ${Object.entries(ingresosServicio).sort((a,b)=>b[1]-a[1]).map(([serv,total])=>{
      const pct=tp+tn>0?Math.round(total/(tp+tn)*100):0;
      return`<tr><td><strong>${serv}</strong></td><td>${fMoney(total)}</td><td>${pct}%</td><td><div class="progress" style="width:120px"><div class="progress-bar" style="width:${pct}%;background:var(--primary)"></div></div></td></tr>`;
    }).join('')}
    </tbody></table>
  </div></div>
</div>`;
}

function factRenderServices(){
  return `<div class="card"><div class="card-header"><span class="card-title" style="font-size:.85rem">🏷️ Catálogo de servicios</span><button class="btn btn-outline btn-xs" onclick="toast('Servicio añadido')">${IC.plus} Nuevo</button></div>
<div class="card-body" style="padding:0"><table><thead><tr><th>Servicio</th><th>Categoría</th><th>Precio</th><th>Duración</th><th>${taxLabel()}</th></tr></thead><tbody>
${SERVICES.map(s=>`<tr><td><div><strong>${s.nombre}</strong>${s.desc?'<div style="font-size:.68rem;color:var(--text3);margin-top:2px">'+s.desc+'</div>':''}</div></td><td><span class="badge badge-neutral">${s.categoria}</span></td><td style="font-weight:700">${fMoney(s.precio)}</td><td>${s.duracion?s.duracion+' min':'—'}</td><td>${s.iva}%</td></tr>`).join('')}
</tbody></table></div></div>`;
}

var _invLines=[];
function openNewInvoiceModal(){
  _invLines=[];
  var today=new Date().toISOString().slice(0,10);
  openModal('<div class="modal-header"><h3>💰 Nueva factura</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body">'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Paciente *</label><select id="nfPat">'+DB.patients.filter(function(p){return p.activo}).map(function(p){return'<option value="'+p.id+'">'+sanitize(p.nombre)+' '+sanitize(p.apellidos)+'</option>'}).join('')+'</select></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Fecha</label><input type="date" id="nfDate" value="'+today+'"></div></div>'
  +'<div style="margin-bottom:14px"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Servicios *</label>'
  +'<div style="display:flex;gap:6px;margin-bottom:8px"><select id="nfServ" style="flex:1">'+SERVICES.map(function(s){return'<option value="'+s.id+'">'+s.nombre+' — '+fMoney(s.precio)+'</option>'}).join('')+'</select>'
  +'<input type="number" id="nfCant" value="1" min="1" max="99" style="width:55px;text-align:center"><button class="btn btn-primary btn-sm" onclick="addInvLine()">+</button></div>'
  +'<div id="invLinesBody" style="font-size:.78rem"></div><div id="invTotal" style="text-align:right;font-weight:700;margin-top:8px"></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Método de pago</label><select id="nfMetodo"><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option><option>Bono</option></select></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Estado</label><select id="nfEstado"><option>Pendiente</option><option>Pagada</option></select></div></div></div>'
  +'<div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="saveNewInvoice()" style="border-radius:8px;padding:10px 24px">💰 Crear factura</button></div>',true);
}
function addInvLine(){var servId=+$('nfServ').value,serv=SERVICES.find(function(s){return s.id===servId});if(!serv)return;var cant=parseInt($('nfCant').value)||1;_invLines.push({servicio:serv.nombre,cantidad:cant,precio:serv.precio,iva:serv.iva});renderInvLines()}
function removeInvLine(idx){_invLines.splice(idx,1);renderInvLines()}
function renderInvLines(){var el=$('invLinesBody');if(!el)return;var total=_invLines.reduce(function(s,l){return s+l.precio*l.cantidad},0);var tax=_invLines.reduce(function(s,l){return s+l.precio*l.cantidad*l.iva/100},0);el.innerHTML=_invLines.map(function(l,i){return'<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)"><span>'+l.cantidad+'x '+l.servicio+'</span><span style="display:flex;align-items:center;gap:8px"><strong>'+fMoney(l.precio*l.cantidad)+'</strong><button onclick="removeInvLine('+i+')" style="background:none;border:none;color:var(--danger);cursor:pointer">✕</button></span></div>'}).join('');var te=$('invTotal');if(te)te.innerHTML=_invLines.length?'<span style="color:var(--text3);font-size:.72rem">'+taxLabel()+' '+taxRate()+'%: '+fMoney(tax)+'</span> · Total: <strong>'+fMoney(total+tax)+'</strong>':''}

function saveNewInvoice(){
  if(!_invLines.length){toast('Agregue al menos un servicio','error');return}
  if(!gP(+$('nfPat').value)){toast('Seleccione un paciente válido','error');return}
  var total=_invLines.reduce(function(s,l){return s+l.precio*l.cantidad},0);
  var tax=_invLines.reduce(function(s,l){return s+l.precio*l.cantidad*l.iva/100},0);
  var inv={id:DB.nextIId++,numero:'FAC-'+new Date().getFullYear()+'-'+String(DB.nextIId).padStart(5,'0'),pacienteId:+$('nfPat').value,fecha:$('nfDate').value||new Date().toISOString().slice(0,10),estado:$('nfEstado').value,total:Math.round((total+tax)*100)/100,lineas:_invLines.map(function(l){var desc=parseFloat($('nfDescuento')?$('nfDescuento').value:0)||0;return{servicio:l.servicio,cantidad:l.cantidad,precio:l.precio*(1-desc/100),precioOriginal:l.precio,descuento:desc,iva:l.iva}}),pagos:[]};
  if(inv.estado==='Pagada')inv.pagos=[{metodo:$('nfMetodo').value,importe:inv.total,fecha:inv.fecha}];
  DB.invoices.push(inv);_invLines=[];
  closeModal();toast('Factura '+inv.numero+' creada ('+fMoney(inv.total)+')');showSaved();navigate('facturacion');
}

function openPayModal(id){
  var inv=DB.invoices.find(i=>i.id===id);if(!inv)return;
  openModal(`<div class="modal-header"><h3>💳 Cobrar ${inv.numero}</h3><button onclick="closeModal()">${IC.x}</button></div>
<div class="modal-body">
  <p style="font-size:.85rem;margin-bottom:14px">Total a cobrar: <strong>${inv.total}</strong></p>
  <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Método de pago</label><select id="payMet"><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option><option>Bono</option></select></div>
  <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Importe</label><input type="number" id="payAmt" value="${inv.total}" step="0.01"></div>
</div>
<div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="processPayment(${id})" style="border-radius:8px;padding:10px 24px">💳 Confirmar cobro</button></div>`);
}

function processPayment(id){
  var inv=DB.invoices.find(i=>i.id===id);if(!inv)return;
  inv.estado='Pagada';
  inv.pagos=[{metodo:$('payMet').value,importe:parseFloat($('payAmt').value)||inv.total,fecha:new Date().toISOString().slice(0,10)}];
  // Add to cash movements
  DB.cashSession.movimientos.push({tipo:'Ingreso',concepto:'Cobro '+inv.numero,importe:inv.total,metodo:$('payMet').value,hora:new Date().toTimeString().slice(0,5)});
  closeModal();toast('Cobro registrado — '+fMoney(inv.total));showSaved();navigate('facturacion');
}

function payInv(id,direct){var inv=DB.invoices.find(i=>i.id===id);if(!inv)return;if(direct){inv.estado='Pagada';inv.pagos=[{metodo:'Efectivo',importe:inv.total,fecha:new Date().toISOString().slice(0,10)}];toast('Cobrada');if(typeof navigate==='function')navigate('facturacion');return}openPayModal(id)}

function anularFactura(id){
  var inv=DB.invoices.find(i=>i.id===id);if(!inv)return;
  openModal('<div class="modal-header"><h3>⚠️ Anular factura</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body"><p>¿Anular la factura <strong>'+inv.numero+'</strong> por '+fMoney(inv.total)+'?</p><p style="font-size:.78rem;color:var(--text3);margin-top:8px">La factura quedará registrada como anulada.</p></div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-danger" onclick="confirmAnularFactura('+id+')">Anular</button></div>');
}
function confirmAnularFactura(id){
  var inv=DB.invoices.find(i=>i.id===id);if(!inv)return;
  inv.estado='Anulada';closeModal();toast('Factura anulada','warning');showSaved();navigate('facturacion');
}

function printInvoice(id){
  var inv=DB.invoices.find(i=>i.id===id);if(!inv)return;
  var p=gP(inv.pacienteId);
  var w=window.open('','_blank','width=800,height=600');
  w.document.write('<html><head><title>Factura '+inv.numero+'</title><style>body{font-family:Inter,system-ui,sans-serif;padding:40px;color:#1a1a2e;max-width:700px;margin:0 auto}h1{color:#2E8B57;font-size:1.6rem;margin-bottom:4px}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #2E8B57;padding-bottom:16px;margin-bottom:24px}.meta{font-size:.82rem;color:#666;line-height:1.7}table{width:100%;border-collapse:collapse;margin:20px 0}th{background:#f8f9fa;text-align:left;padding:10px 12px;font-size:.78rem;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e0e0e0}td{padding:10px 12px;border-bottom:1px solid #eee;font-size:.85rem}.total-row{font-weight:700;font-size:1.1rem;border-top:2px solid #2E8B57}.estado{display:inline-block;padding:4px 12px;border-radius:12px;font-size:.72rem;font-weight:700}.pagada{background:#dcfce7;color:#166534}.pendiente{background:#fef3c7;color:#92400e}.anulada{background:#fee2e2;color:#991b1b;text-decoration:line-through}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-size:.72rem;color:#999;text-align:center}</style></head><body>');
  w.document.write('<div class="header"><div><h1>Veridia HealthTech</h1><div class="meta">Clínica de Nutrición · Lic. Antonella Caverzan<br>CIF: B00000000 · info@veridia.tech</div></div><div style="text-align:right"><div style="font-size:1.3rem;font-weight:800;color:#2E8B57">'+inv.numero+'</div><div class="meta">Fecha: '+fD(inv.fecha)+'<br>Estado: <span class="estado '+(inv.estado==='Pagada'?'pagada':inv.estado==='Anulada'?'anulada':'pendiente')+'">'+inv.estado+'</span></div></div></div>');
  w.document.write('<div style="background:#f8f9fa;padding:14px 18px;border-radius:8px;margin-bottom:20px"><div style="font-size:.72rem;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:4px">Paciente</div><div style="font-weight:700">'+(p?sanitize(p.nombre)+' '+sanitize(p.apellidos):'—')+'</div>'+(p?'<div class="meta">DNI: '+p.dni+(p.direccion?' · '+p.direccion:'')+'</div>':'')+'</div>');
  w.document.write('<table><thead><tr><th>Servicio</th><th>Cant.</th><th>Precio</th><th>${taxLabel()}</th><th>Subtotal</th></tr></thead><tbody>');
  var subtotal=0;
  inv.lineas.forEach(function(l){var sub=l.cantidad*l.precio;subtotal+=sub;w.document.write('<tr><td>'+l.servicio+'</td><td style="text-align:center">'+l.cantidad+'</td><td>'+fMoney(l.precio)+'</td><td>'+l.iva+'%</td><td style="text-align:right">'+fMoney(sub)+'</td></tr>')});
  var iva=subtotal*0.21;
  w.document.write('<tr><td colspan="4" style="text-align:right;font-size:.82rem;color:#666">Base imponible</td><td style="text-align:right">'+fMoney(subtotal)+'</td></tr>');
  w.document.write('<tr><td colspan="4" style="text-align:right;font-size:.82rem;color:#666">'+taxLabel()+' '+taxRate()+'%</td><td style="text-align:right">'+fMoney(iva)+'</td></tr>');
  w.document.write('<tr class="total-row"><td colspan="4" style="text-align:right">TOTAL</td><td style="text-align:right">'+fMoney(inv.total)+'</td></tr>');
  w.document.write('</tbody></table>');
  if(inv.pagos&&inv.pagos.length){w.document.write('<div style="margin-top:16px;font-size:.82rem"><strong>Pagos:</strong> ');inv.pagos.forEach(function(pg){w.document.write(pg.metodo+' '+fMoney(pg.importe)+' ('+fD(pg.fecha)+') ')});w.document.write('</div>')}
  w.document.write('<div class="footer">Veridia HealthTech © '+new Date().getFullYear()+' · Desarrollado por Andrés Galeano<br>Este documento es una factura simplificada según normativa vigente.</div>');
  w.document.write('<script>setTimeout(function(){window.print()},400)<\/script></body></html>');
  w.document.close();
}

// ===== CAJA (enhanced with MyCliniK statistics) =====
function rCaja(){
  const cs=DB.cashSession,ct=cashTotals(),tEf=cs.saldoInicial+ct.efIng-ct.efEgr;
  const tTotal=cs.saldoInicial+ct.ing-ct.egr;
  // Group by method
  var byMethod={};
  cs.movimientos.filter(m=>m.tipo==='Ingreso').forEach(m=>{if(!byMethod[m.metodo])byMethod[m.metodo]=0;byMethod[m.metodo]+=m.importe});

  $('mainContent').innerHTML=`<div class="fade-in">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
  <div style="display:flex;align-items:center;gap:10px"><h3 style="font-size:1rem">💰 Caja — ${fD(cs.fecha)}</h3><span class="badge ${cs.estado==='Abierta'?'badge-success':'badge-neutral'}">${cs.estado}</span></div>
  <div style="display:flex;gap:8px">
    ${cs.estado==='Abierta'?`<button class="btn btn-outline btn-sm" onclick="openNewMovModal()">${IC.plus} Movimiento</button>
    <button class="btn btn-danger btn-sm" onclick="closeCash()">🔒 Cerrar caja</button>`:
    '<button class="btn btn-primary btn-sm" onclick="DB.cashSession.estado=\'Abierta\';rCaja();toast(\'Caja reabierta\')">🔒 Reabrir</button>'}
  </div>
</div>

<div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin-bottom:14px">
  <div class="stat-card"><div class="stat-info"><p>Saldo inicial</p><h3>${fMoney(cs.saldoInicial)}</h3></div></div>
  <div class="stat-card"><div class="stat-info"><p style="color:var(--success)">Ingresos</p><h3 style="color:var(--success)">${fMoney(ct.ing)}</h3></div></div>
  <div class="stat-card"><div class="stat-info"><p style="color:var(--danger)">Egresos</p><h3 style="color:var(--danger)">${fMoney(ct.egr)}</h3></div></div>
  <div class="stat-card" style="background:var(--primary-light)"><div class="stat-info"><p>Efectivo teórico</p><h3>${fMoney(tEf)}</h3></div></div>
  <div class="stat-card"><div class="stat-info"><p>Total general</p><h3 style="font-weight:900">${fMoney(tTotal)}</h3></div></div>
</div>

<div class="grid-23">
<div class="card"><div class="card-header"><span class="card-title" style="font-size:.85rem">📄 Movimientos del día</span><span class="badge badge-neutral">${cs.movimientos.length}</span></div>
<div class="card-body" style="padding:0"><table><thead><tr><th>Hora</th><th>Tipo</th><th>Concepto</th><th>Método</th><th>Importe</th></tr></thead><tbody>
${cs.movimientos.map(m=>`<tr>
<td>${m.hora}</td>
<td><span class="badge ${m.tipo==='Ingreso'?'badge-success':'badge-danger'}">${m.tipo}</span></td>
<td>${m.concepto}</td>
<td><span class="badge badge-neutral">${m.metodo}</span></td>
<td style="font-weight:700;color:${m.tipo==='Ingreso'?'var(--success)':'var(--danger)'}">${m.tipo==='Ingreso'?'+':'-'}${fMoney(m.importe)}</td>
</tr>`).join('')}
</tbody></table></div></div>

<div>
  <!-- By payment method -->
  <div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title" style="font-size:.85rem">💳 Por método</span></div><div class="card-body">
    <ul class="data-list">${Object.entries(byMethod).map(([met,total])=>`<li><span class="label">${met}</span><span class="value" style="color:var(--success)">+${total}</span></li>`).join('')||'<li><span class="label">Sin ingresos</span></li>'}</ul>
  </div></div>
  <!-- Quick actions -->
  <div class="card"><div class="card-header"><span class="card-title" style="font-size:.85rem">⚡ Acciones</span></div><div class="card-body" style="display:flex;flex-direction:column;gap:6px">
    <button class="btn btn-outline btn-sm" style="justify-content:flex-start" onclick="toast('Reporte exportado')">📄 Exportar reporte</button>
    <button class="btn btn-outline btn-sm" style="justify-content:flex-start" onclick="navigate('facturacion')">📋 Ver facturas</button>
  </div></div>
</div>
</div></div>`;
}

function openNewMovModal(){
  if(DB.cashSession.estado==='Cerrada'){toast('La caja está cerrada. Reábrala para registrar movimientos.','error');return}
  openModal(`<div class="modal-header"><h3>📄 Nuevo movimiento</h3><button onclick="closeModal()">${IC.x}</button></div>
<div class="modal-body">
  <div class="form-row">
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Tipo</label><select id="nmTipo"><option>Ingreso</option><option>Egreso</option></select></div>
    <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Método</label><select id="nmMet"><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select></div>
  </div>
  <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Concepto *</label><input id="nmConc" placeholder="Descripción del movimiento"></div>
  <div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Importe *</label><input type="number" id="nmImp" step="0.01" placeholder="0.00"></div>
</div>
<div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="saveNewMov()" style="border-radius:8px">📄 Registrar</button></div>`);
}

function saveNewMov(){
  var conc=$('nmConc').value.trim(),imp=parseFloat($('nmImp').value);
  if(!conc||!imp){toast('Concepto e importe requeridos','error');return}
  DB.cashSession.movimientos.push({tipo:$('nmTipo').value,concepto:conc,importe:imp,metodo:$('nmMet').value,hora:new Date().toTimeString().slice(0,5)});
  closeModal();toast('Movimiento registrado');navigate('caja');
}

function closeCash(){const ct=cashTotals(),tEf=DB.cashSession.saldoInicial+ct.efIng-ct.efEgr;openModal(`<div class="modal-header"><h3>🔒 Cierre de caja</h3><button onclick="closeModal()">${IC.x}</button></div><div class="modal-body"><p style="margin-bottom:14px">Efectivo contado:</p><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Importe ($)</label><input type="number" id="cC" step="0.01"></div><div class="alert alert-info">Teórico: <strong>${tEf}</strong></div></div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-danger" onclick="confirmClose()">Confirmar</button></div>`)}
function confirmClose(){const ct=cashTotals(),tEf=DB.cashSession.saldoInicial+ct.efIng-ct.efEgr,c=parseFloat($('cC').value)||0,d=c-tEf;DB.cashSession.estado='Cerrada';closeModal();toast(`Cerrada. Descuadre: ${d>=0?'+':''}${fMoney(d)}`,Math.abs(d)>5?'warning':'success');navigate('caja')}

// #48 Auto-vencimiento de facturas pendientes (>30 días)
function autoVencerFacturas(){
  var hoy=new Date().toISOString().slice(0,10);
  var hace30=new Date(Date.now()-30*86400000).toISOString().slice(0,10);
  DB.invoices.forEach(function(inv){
    if(inv.estado==='Pendiente'&&inv.fecha<hace30){
      inv.estado='Vencida';
    }
  });
}
// Run on module load
autoVencerFacturas();

// #49 Factura recurrente
function openRecurringInvoice(){
  if(!DB.patients.length){toast('Agregue pacientes','error');return}
  openModal('<div class="modal-header"><h3>🔄 Factura recurrente</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body">'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Paciente</label><select id="riPat">'+DB.patients.filter(function(p){return p.activo}).map(function(p){return'<option value="'+p.id+'">'+sanitize(p.nombre)+' '+sanitize(p.apellidos)+'</option>'}).join('')+'</select></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Servicio</label><select id="riServ">'+SERVICES.map(function(s){return'<option value="'+s.id+'">'+s.nombre+' — '+fMoney(s.precio)+'</option>'}).join('')+'</select></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Frecuencia</label><select id="riFreq"><option value="30">Mensual</option><option value="14">Quincenal</option></select></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Repeticiones</label><input type="number" id="riReps" value="3" min="2" max="12"></div></div>'
  +'</div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="saveRecurringInvoice()" style="border-radius:8px">🔄 Crear facturas</button></div>');
}

function saveRecurringInvoice(){
  var patId=+$('riPat').value;var servId=+$('riServ').value;
  var serv=SERVICES.find(function(s){return s.id===servId});if(!serv)return;
  var freq=+$('riFreq').value;var reps=+$('riReps').value;
  for(var i=0;i<reps;i++){
    var fecha=new Date(Date.now()+i*freq*86400000).toISOString().slice(0,10);
    DB.invoices.push({id:DB.nextIId++,numero:'FAC-'+new Date().getFullYear()+'-'+String(DB.nextIId).padStart(5,'0'),pacienteId:patId,fecha:fecha,estado:'Pendiente',total:serv.precio,lineas:[{servicio:serv.nombre,cantidad:1,precio:serv.precio,iva:serv.iva}],pagos:[],_recurring:true});
  }
  closeModal();toast(reps+' facturas recurrentes creadas');showSaved();navigate('facturacion');
}

// #50 Informe fiscal mensual
function renderInformeFiscal(){
  var mes=new Date().toISOString().slice(0,7);
  var facturas=DB.invoices.filter(function(i){return i.fecha.startsWith(mes)&&i.estado!=='Anulada'});
  var base=facturas.reduce(function(s,i){return s+i.lineas.reduce(function(ls,l){return ls+l.precio*l.cantidad},0)},0);
  var iva=facturas.reduce(function(s,i){return s+i.lineas.reduce(function(ls,l){return ls+l.precio*l.cantidad*l.iva/100},0)},0);
  var total=base+iva;

  openModal('<div class="modal-header"><h3>Informe fiscal — '+mes+'</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body">'
  +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;text-align:center;margin-bottom:14px">'
  +'<div style="padding:14px;background:var(--surface2);border-radius:var(--radius-xs)"><div style="font-size:1.2rem;font-weight:900">'+fMoney(base)+'</div><div style="font-size:.68rem;color:var(--text3)">Base imponible</div></div>'
  +'<div style="padding:14px;background:var(--surface2);border-radius:var(--radius-xs)"><div style="font-size:1.2rem;font-weight:900">'+fMoney(iva)+'</div><div style="font-size:.68rem;color:var(--text3)">'+taxLabel()+' repercutido</div></div>'
  +'<div style="padding:14px;background:var(--primary-light);border-radius:var(--radius-xs)"><div style="font-size:1.2rem;font-weight:900;color:var(--primary)">'+fMoney(total)+'</div><div style="font-size:.68rem;color:var(--text3)">Total facturado</div></div></div>'
  +'<div style="font-size:.78rem"><strong>Facturas del periodo:</strong> '+facturas.length+'<br>'
  +'<strong>Pagadas:</strong> '+facturas.filter(function(i){return i.estado==='Pagada'}).length+' ('+fMoney(facturas.filter(function(i){return i.estado==='Pagada'}).reduce(function(s,i){return s+i.total},0))+')<br>'
  +'<strong>Pendientes:</strong> '+facturas.filter(function(i){return i.estado==='Pendiente'}).length+'</div>'
  +'</div><div class="modal-footer"><button class="btn btn-primary" onclick="closeModal()">Cerrar</button></div>');
}
