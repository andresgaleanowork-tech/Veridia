// ===== CONTABILIDAD AVANZADA — Gastos, Inventario, Productos =====

// --- Estructura de datos ---
if(!DB.gastos) DB.gastos=[];
if(!DB.inventario) DB.inventario=[];
if(!DB.productos) DB.productos=[];
try{
  var _vdb=JSON.parse(localStorage.getItem('veridia_db'));
  if(_vdb){
    if(_vdb.gastos) DB.gastos=_vdb.gastos;
    if(_vdb.inventario) DB.inventario=_vdb.inventario;
    if(_vdb.productos) DB.productos=_vdb.productos;
  }
}catch(e){console.warn('[Veridia]',e.message||e)}

// Categorías de gastos
var GASTO_CATS=['Alquiler','Suministros','Material clínico','Suplementos','Marketing','Software','Seguros','Limpieza','Formación','Otros'];

// --- Render principal ---
function rContabilidad(){
  var contabTab=window._contabTab||'resumen';
  var tabs=[
    {id:'resumen',ic:'📊',l:'Resumen'},
    {id:'gastos',ic:'📉',l:'Gastos'},
    {id:'productos',ic:'🏷️',l:'Productos'},
    {id:'inventario',ic:'📦',l:'Inventario'}
  ];

  $('mainContent').innerHTML='<div class="fade-in">'
  // Hero Header
  +'<div class="card" style="border:none;background:linear-gradient(135deg,#0E7490 0%,#0891B2 50%,#22D3EE 100%);color:#fff;margin-bottom:22px;border-radius:var(--radius);overflow:hidden;position:relative">'
  +'<div style="position:absolute;top:-30px;right:-20px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.04)"></div>'
  +'<div class="card-body" style="padding:22px 28px;position:relative;z-index:1">'
  +'<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">'
  +'<span style="font-size:1.6rem">📊</span>'
  +'<div><h2 style="margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.3px">Contabilidad</h2>'
  +'<p style="margin:0;font-size:.78rem;opacity:.75">Gastos · Productos · Inventario · Balance</p></div></div></div></div>'
  +'<div class="pill-tabs" style="margin-bottom:18px">'+tabs.map(function(t){return '<button class="pill-tab '+(contabTab===t.id?'active':'')+'" onclick="window._contabTab=\''+t.id+'\';rContabilidad()">'+t.ic+' '+t.l+'</button>'}).join('')+'</div>'
  +'<div id="contabContent"></div></div>';

  var c=$('contabContent');
  if(contabTab==='resumen') renderContabResumen(c);
  else if(contabTab==='gastos') renderContabGastos(c);
  else if(contabTab==='productos') renderContabProductos(c);
  else if(contabTab==='inventario') renderContabInventario(c);
}

function renderContabResumen(c){
  var thisMonth=new Date().toISOString().slice(0,7);
  var ingresos=DB.invoices.filter(function(i){return i.fecha.startsWith(thisMonth)&&i.estado==='Pagada'}).reduce(function(s,i){return s+i.total},0);
  var gastos=DB.gastos.filter(function(g){return g.fecha.startsWith(thisMonth)}).reduce(function(s,g){return s+g.importe},0);
  var beneficio=ingresos-gastos;

  // By category
  var byCat={};DB.gastos.filter(function(g){return g.fecha.startsWith(thisMonth)}).forEach(function(g){byCat[g.categoria]=(byCat[g.categoria]||0)+g.importe});
  var catData=Object.entries(byCat).map(function(e){return{label:e[0],value:Math.round(e[1])}});

  c.innerHTML='<div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-bottom:16px">'
  +'<div class="stat-card"><div class="stat-icon green">'+IC.dollar+'</div><div class="stat-info"><h3 style="color:var(--success)">'+fMoney(ingresos)+'</h3><p>Ingresos del mes</p></div></div>'
  +'<div class="stat-card"><div class="stat-icon orange">'+IC.dollar+'</div><div class="stat-info"><h3 style="color:var(--danger)">'+fMoney(gastos)+'</h3><p>Gastos del mes</p></div></div>'
  +'<div class="stat-card" style="border-color:'+(beneficio>=0?'var(--success)':'var(--danger)')+'"><div class="stat-icon '+(beneficio>=0?'green':'orange')+'">'+IC.dollar+'</div><div class="stat-info"><h3 style="color:'+(beneficio>=0?'var(--success)':'var(--danger)')+'">'+fMoney(beneficio)+'</h3><p>Beneficio neto</p></div></div>'
  +'<div class="stat-card"><div class="stat-icon blue">'+IC.db+'</div><div class="stat-info"><h3>'+DB.productos.length+'</h3><p>Productos</p></div></div>'
  +'</div>'
  +'<div class="grid-23"><div class="card"><div class="card-header"><span class="card-title" style="font-size:.85rem">📉 Gastos por categoría</span></div><div class="card-body">'
  +(catData.length?svgBarChart({data:catData,width:400,height:180,unit:CURRENCIES[CURRENCY].symbol,color:'var(--danger)'}):'<p style="color:var(--text3);font-size:.82rem">Sin gastos este mes</p>')
  +'</div></div>'
  +'<div class="card"><div class="card-header"><span class="card-title" style="font-size:.85rem">⚖️ Balance mensual</span></div><div class="card-body">'
  +svgDonutChart({data:[{label:'Ingresos',value:Math.round(ingresos),color:'var(--success)'},{label:'Gastos',value:Math.round(gastos),color:'var(--danger)'}],size:140,title:'Balance',unit:CURRENCIES[CURRENCY].symbol})
  +'</div></div></div>';

  // Wire: comparativa mensual
  try{renderComparativaMensual()}catch(e){console.warn('[Veridia]',e.message||e)}
}

function renderContabGastos(c){
  var sorted=DB.gastos.slice().sort(function(a,b){return b.fecha.localeCompare(a.fecha)});
  c.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><span class="badge badge-neutral">'+sorted.length+' gastos</span><button class="btn btn-primary btn-sm" onclick="openNewGastoModal()">'+IC.plus+' Nuevo gasto</button><button class="btn btn-outline btn-sm" onclick="openGastoRecurrente()">🔄 Recurrente</button><button class="btn btn-outline btn-sm" onclick="renderInformePL()">📊 P&L</button><button class="btn btn-outline btn-sm" onclick="openPresupuesto()">📈 Presupuesto</button></div>'
  +'<div class="card"><div class="card-body" style="padding:0;overflow-x:auto"><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Importe</th><th></th></tr></thead><tbody>'
  +sorted.map(function(g,i){return '<tr><td>'+fD(g.fecha)+'</td><td><strong>'+g.concepto+'</strong></td><td><span class="badge badge-neutral" style="font-size:.6rem">'+g.categoria+'</span></td><td style="font-weight:700;color:var(--danger)">-'+fMoney(g.importe)+'</td><td><button class="btn btn-ghost btn-xs" onclick="rcDeleteGasto('+DB.gastos.indexOf(g)+')" style="color:var(--danger)">✕</button></td></tr>'}).join('')
  +'</tbody></table></div></div>';
}

function openNewGastoModal(){
  openModal('<div class="modal-header"><h3>📉 Nuevo gasto</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body">'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Concepto *</label><input id="gConcepto" placeholder="Ej: Material de oficina"></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Importe *</label><input type="number" id="gImporte" step="0.01" placeholder="0.00"></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Categoría</label><select id="gCat">'+GASTO_CATS.map(function(c){return '<option>'+c+'</option>'}).join('')+'</select></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Fecha</label><input type="date" id="gFecha" value="'+new Date().toISOString().slice(0,10)+'"></div></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Nota</label><input id="gNota" placeholder="Descripción adicional (opcional)"></div>'
  +'</div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="saveGasto()" style="border-radius:8px">📉 Registrar gasto</button></div>');
}
function saveGasto(){
  var concepto=sanitize($('gConcepto').value.trim());
  var importe=parseFloat($('gImporte').value);
  if(!concepto||!importe){toast('Concepto e importe obligatorios','error');return}
  DB.gastos.push({id:Date.now(),concepto:concepto,importe:importe,categoria:$('gCat').value,fecha:$('gFecha').value,nota:sanitize($('gNota').value.trim())});
  closeModal();toast('Gasto registrado: '+fMoney(importe));showSaved();rContabilidad();
}

// --- PRODUCTOS (suplementos, recetarios, etc) ---
function renderContabProductos(c){
  c.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><span class="badge badge-neutral">'+DB.productos.length+' productos</span><button class="btn btn-primary btn-sm" onclick="openNewProductoModal()">'+IC.plus+' Nuevo producto</button></div>'
  +(DB.productos.length?'<div class="card"><div class="card-body" style="padding:0;overflow-x:auto"><table><thead><tr><th>Producto</th><th>Categoría</th><th>Precio venta</th><th>Stock</th><th>Estado</th><th></th></tr></thead><tbody>'
  +DB.productos.map(function(p){return '<tr><td><strong>'+p.nombre+'</strong><div style="font-size:.65rem;color:var(--text3)">'+( p.descripcion||'')+'</div></td><td><span class="badge badge-neutral" style="font-size:.6rem">'+p.categoria+'</span></td><td style="font-weight:700">'+fMoney(p.precioVenta)+'</td><td>'+(p.stock!==undefined?p.stock:'—')+'</td><td><span class="badge '+(p.activo!==false?'badge-success':'badge-neutral')+'">'+(p.activo!==false?'Activo':'Inactivo')+'</span></td><td><button class="btn btn-ghost btn-xs" onclick="editProducto('+p.id+')">'+IC.edit+'</button></td></tr>'}).join('')
  +'</tbody></table></div></div>':'<div style="text-align:center;padding:40px"><div style="font-size:3rem;opacity:.3;margin-bottom:12px">🏷️</div><p style="color:var(--text-secondary);font-size:.88rem;margin:0;font-weight:600">Sin productos</p><p style="color:var(--text3);font-size:.78rem;margin:6px 0 0">Cree productos para venta: suplementos, recetarios, bonos, etc.</p></div>');
}

function openNewProductoModal(editId){
  var p=editId?DB.productos.find(function(x){return x.id===editId}):null;
  openModal('<div class="modal-header"><h3>'+(p?'Editar':'Nuevo')+' producto</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body">'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Nombre *</label><input id="prdNom" value="'+(p?p.nombre:'')+'"></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Categoría</label><select id="prdCat"><option'+(p&&p.categoria==='Suplemento'?' selected':'')+'>Suplemento</option><option'+(p&&p.categoria==='Recetario'?' selected':'')+'>Recetario</option><option'+(p&&p.categoria==='Bono'?' selected':'')+'>Bono</option><option'+(p&&p.categoria==='Material'?' selected':'')+'>Material</option><option'+(p&&p.categoria==='Otro'?' selected':'')+'>Otro</option></select></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Precio de compra</label><input type="number" id="prdCompra" step="0.01" value="'+(p?p.precioCompra||'':'')+'"></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Precio de venta *</label><input type="number" id="prdVenta" step="0.01" value="'+(p?p.precioVenta:'')+'"></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Stock</label><input type="number" id="prdStock" value="'+(p?p.stock||'':'')+'"></div></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Descripción</label><input id="prdDesc" value="'+(p?p.descripcion||'':'')+'"></div>'
  +'</div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="saveProducto('+(editId||'null')+')">Guardar</button></div>');
}

function editProducto(id){openNewProductoModal(id)}

function saveProducto(editId){
  var nombre=sanitize($('prdNom').value.trim());
  var precioVenta=parseFloat($('prdVenta').value);
  if(!nombre||!precioVenta){toast('Nombre y precio obligatorios','error');return}
  var data={nombre:nombre,categoria:$('prdCat').value,precioCompra:parseFloat($('prdCompra').value)||0,precioVenta:precioVenta,stock:parseInt($('prdStock').value)||0,descripcion:sanitize($('prdDesc').value.trim()),activo:true};
  if(editId){var p=DB.productos.find(function(x){return x.id===editId});if(p)Object.assign(p,data)}
  else{data.id=Date.now();DB.productos.push(data)}
  closeModal();toast('Producto guardado');showSaved();rContabilidad();
}

// --- INVENTARIO ---
function renderContabInventario(c){
  var _lowStock=typeof checkLowStock==='function'?checkLowStock():[];
  var lowStock=DB.productos.filter(function(p){return p.stock!==undefined&&p.stock<=3&&p.activo!==false});
  c.innerHTML=(_lowStock.length?'<div style="padding:10px;background:#fef2f2;border-radius:8px;margin-bottom:12px;font-size:.85rem;border-left:3px solid #dc2626">⚠️ <strong>Stock bajo:</strong> '+_lowStock.map(function(p){return p.nombre+' ('+p.stock+'u)'}).join(', ')+'</div>':'')+(lowStock.length?'<div class="clinical-alert moderate" style="margin-bottom:14px"><strong>⚠️ Stock bajo:</strong> '+lowStock.map(function(p){return p.nombre+' ('+p.stock+')'}).join(', ')+'</div>':'')
  +'<div class="card"><div class="card-header"><span class="card-title">📦 Movimientos de inventario</span><button class="btn btn-primary btn-sm" onclick="openMovInventarioModal()">'+IC.plus+' Movimiento</button></div>'
  +'<div class="card-body" style="padding:0;overflow-x:auto"><table><thead><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Nota</th></tr></thead><tbody>'
  +DB.inventario.slice().reverse().map(function(m){return '<tr><td>'+fD(m.fecha)+'</td><td><strong>'+m.producto+'</strong></td><td><span class="badge '+(m.tipo==='Entrada'?'badge-success':'badge-warning')+'">'+m.tipo+'</span></td><td style="font-weight:700;color:'+(m.tipo==='Entrada'?'var(--success)':'var(--danger)')+'">'+( m.tipo==='Entrada'?'+':'-')+m.cantidad+'</td><td style="font-size:.72rem;color:var(--text3)">'+( m.nota||'')+'</td></tr>'}).join('')
  +'</tbody></table></div></div>';
}

function openMovInventarioModal(){
  if(!DB.productos.length){toast('Cree al menos un producto primero','error');return}
  openModal('<div class="modal-header"><h3>📦 Movimiento de inventario</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body">'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Producto</label><select id="invProd">'+DB.productos.map(function(p){return '<option value="'+p.id+'">'+p.nombre+' (stock: '+(p.stock||0)+')</option>'}).join('')+'</select></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Tipo</label><select id="invTipo"><option>Entrada</option><option>Salida</option></select></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Cantidad</label><input type="number" id="invCant" min="1" value="1"></div><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Fecha</label><input type="date" id="invFecha" value="'+new Date().toISOString().slice(0,10)+'"></div></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Nota</label><input id="invNota" placeholder="Motivo (opcional)"></div>'
  +'</div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="saveMovInventario()" style="border-radius:8px">📦 Registrar</button></div>');
}

function saveMovInventario(){
  var prodId=+$('invProd').value;
  var prod=DB.productos.find(function(p){return p.id===prodId});
  if(!prod){toast('Producto no encontrado','error');return}
  var cant=parseInt($('invCant').value)||1;
  var tipo=$('invTipo').value;
  if(tipo==='Salida'&&prod.stock<cant){toast('Stock insuficiente ('+prod.stock+')','error');return}
  prod.stock=(prod.stock||0)+(tipo==='Entrada'?cant:-cant);
  DB.inventario.push({id:Date.now(),productoId:prodId,producto:prod.nombre,tipo:tipo,cantidad:cant,fecha:$('invFecha').value,nota:sanitize($('invNota').value.trim())});
  closeModal();toast(tipo+': '+cant+'x '+prod.nombre+' (stock: '+prod.stock+')');showSaved();rContabilidad();
}

// #51 Gastos recurrentes
function openGastoRecurrente(){
  openModal('<div class="modal-header"><h3>🔄 Gasto recurrente</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body">'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Concepto *</label><input id="grConcepto" placeholder="Ej: Alquiler"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Importe *</label><input type="number" id="grImporte" step="0.01"></div></div>'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Categoria</label><select id="grCat">'+GASTO_CATS.map(function(c){return'<option>'+c+'</option>'}).join('')+'</select></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Frecuencia</label><select id="grFreq"><option value="mensual">Mensual</option><option value="trimestral">Trimestral</option><option value="anual">Anual</option></select></div></div>'
  +'</div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button><button class="btn btn-primary" onclick="saveGastoRecurrente()" style="border-radius:8px">🔄 Guardar</button></div>');
}

function saveGastoRecurrente(){
  var concepto=sanitize($('grConcepto').value.trim());
  var importe=parseFloat($('grImporte').value);
  if(!concepto||!importe){toast('Concepto e importe obligatorios','error');return}
  if(!DB.gastosRecurrentes)DB.gastosRecurrentes=[];
  DB.gastosRecurrentes.push({id:Date.now(),concepto:concepto,importe:importe,categoria:$('grCat').value,frecuencia:$('grFreq').value,activo:true});
  closeModal();toast('Gasto recurrente registrado');showSaved();rContabilidad();
}

function aplicarGastosRecurrentes(){
  if(!DB.gastosRecurrentes)return;
  var hoy=new Date();var mesActual=hoy.toISOString().slice(0,7);
  DB.gastosRecurrentes.filter(function(gr){return gr.activo}).forEach(function(gr){
    var yaExiste=DB.gastos.some(function(g){return g.concepto===gr.concepto&&g.fecha&&g.fecha.startsWith(mesActual)&&g._recurrente});
    if(!yaExiste){
      if(gr.frecuencia==='mensual'||(gr.frecuencia==='trimestral'&&hoy.getMonth()%3===0)||(gr.frecuencia==='anual'&&hoy.getMonth()===0)){
        DB.gastos.push({id:Date.now(),concepto:gr.concepto,importe:gr.importe,categoria:gr.categoria,fecha:hoy.toISOString().slice(0,10),nota:'Auto-generado (recurrente)',_recurrente:true});
      }
    }
  });
}
aplicarGastosRecurrentes();

// #52 Informes de periodo (P&L)
function renderInformePL(){
  var hoy=new Date();var mes=hoy.toISOString().slice(0,7);
  var ingresos=DB.invoices.filter(function(i){return i.fecha.startsWith(mes)&&i.estado==='Pagada'}).reduce(function(s,i){return s+i.total},0);
  var gastos=DB.gastos.filter(function(g){return g.fecha&&g.fecha.startsWith(mes)}).reduce(function(s,g){return s+g.importe},0);
  var beneficio=ingresos-gastos;
  var margen=ingresos>0?Math.round(beneficio/ingresos*100):0;

  openModal('<div class="modal-header"><h3>P&L — '+mes+'</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body">'
  +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px;text-align:center">'
  +'<div style="padding:14px;background:#dcfce7;border-radius:var(--radius-xs)"><div style="font-size:1.3rem;font-weight:900;color:#166534">'+fMoney(ingresos)+'</div><div style="font-size:.68rem;color:#166534">Ingresos</div></div>'
  +'<div style="padding:14px;background:#fee2e2;border-radius:var(--radius-xs)"><div style="font-size:1.3rem;font-weight:900;color:#991b1b">'+fMoney(gastos)+'</div><div style="font-size:.68rem;color:#991b1b">Gastos</div></div>'
  +'<div style="padding:14px;background:'+(beneficio>=0?'#dbeafe':'#fee2e2')+';border-radius:var(--radius-xs)"><div style="font-size:1.3rem;font-weight:900;color:'+(beneficio>=0?'#1e40af':'#991b1b')+'">'+fMoney(beneficio)+'</div><div style="font-size:.68rem">Beneficio ('+margen+'%)</div></div></div>'
  +'<h4 style="font-size:.82rem;margin:12px 0 6px">Ingresos por servicio</h4>'
  +'<div style="font-size:.78rem">'+Object.entries(DB.invoices.filter(function(i){return i.fecha.startsWith(mes)&&i.estado==="Pagada"}).reduce(function(acc,i){(i.lineas||[]).forEach(function(l){acc[l.servicio]=(acc[l.servicio]||0)+l.precio*l.cantidad});return acc},{})).sort(function(a,b){return b[1]-a[1]}).map(function(e){return'<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)"><span>'+e[0]+'</span><strong>'+fMoney(e[1])+'</strong></div>'}).join('')+'</div>'
  +'<h4 style="font-size:.82rem;margin:12px 0 6px">Gastos por categoria</h4>'
  +'<div style="font-size:.78rem">'+Object.entries(DB.gastos.filter(function(g){return g.fecha&&g.fecha.startsWith(mes)}).reduce(function(acc,g){acc[g.categoria]=(acc[g.categoria]||0)+g.importe;return acc},{})).sort(function(a,b){return b[1]-a[1]}).map(function(e){return'<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)"><span>'+e[0]+'</span><strong style="color:var(--danger)">'+fMoney(e[1])+'</strong></div>'}).join('')+'</div>'
  +'</div><div class="modal-footer"><button class="btn btn-primary" onclick="closeModal()">Cerrar</button></div>');
}

// #53 Categorización de ingresos cruzada
// Ya implementada en renderInformePL()

// #54 Presupuesto vs real
if(!DB.presupuesto) DB.presupuesto={};

function openPresupuesto(){
  var mes=new Date().toISOString().slice(0,7);
  var pres=DB.presupuesto[mes]||{ingresos:0,gastos:0};
  var realIng=DB.invoices.filter(function(i){return i.fecha.startsWith(mes)&&i.estado==='Pagada'}).reduce(function(s,i){return s+i.total},0);
  var realGas=DB.gastos.filter(function(g){return g.fecha&&g.fecha.startsWith(mes)}).reduce(function(s,g){return s+g.importe},0);

  openModal('<div class="modal-header"><h3>Presupuesto vs Real — '+mes+'</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body">'
  +'<div class="form-row"><div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Presupuesto ingresos</label><input type="number" id="presIng" value="'+(pres.ingresos||'')+'" step="50" placeholder="0"></div>'
  +'<div class="form-group"><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);font-weight:600">Presupuesto gastos</label><input type="number" id="presGas" value="'+(pres.gastos||'')+'" step="50" placeholder="0"></div></div>'
  +'<button class="btn btn-outline btn-sm" style="margin-bottom:14px" onclick="DB.presupuesto[\''+mes+'\']={ingresos:+$(\'presIng\').value,gastos:+$(\'presGas\').value};showSaved();toast(\'Presupuesto guardado\')">Guardar presupuesto</button>'
  +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'
  +'<div><h4 style="font-size:.82rem;margin-bottom:8px;color:var(--success)">Ingresos</h4>'
  +'<div style="font-size:.82rem">Presupuesto: <strong>'+fMoney(pres.ingresos||0)+'</strong></div>'
  +'<div style="font-size:.82rem">Real: <strong>'+fMoney(realIng)+'</strong></div>'
  +'<div style="font-size:.82rem;font-weight:700;color:'+(realIng>=(pres.ingresos||0)?'var(--success)':'var(--danger)')+'">'+Math.round(pres.ingresos?realIng/pres.ingresos*100:0)+'% del objetivo</div></div>'
  +'<div><h4 style="font-size:.82rem;margin-bottom:8px;color:var(--danger)">Gastos</h4>'
  +'<div style="font-size:.82rem">Presupuesto: <strong>'+fMoney(pres.gastos||0)+'</strong></div>'
  +'<div style="font-size:.82rem">Real: <strong>'+fMoney(realGas)+'</strong></div>'
  +'<div style="font-size:.82rem;font-weight:700;color:'+(realGas<=(pres.gastos||1)?'var(--success)':'var(--danger)')+'">'+Math.round(pres.gastos?realGas/pres.gastos*100:0)+'% usado</div></div></div>'
  +'</div><div class="modal-footer"><button class="btn btn-primary" onclick="closeModal()">Cerrar</button></div>');
}

function rcDeleteGasto(idx){
  if(!confirm('¿Eliminar este gasto?'))return;
  DB.gastos.splice(idx,1);rContabilidad();showSaved();
}

// CO2: Monthly comparison bar chart
function renderComparativaMensual(){
  var meses={};
  DB.gastos.forEach(function(g){var m=g.fecha.substring(0,7);if(!meses[m])meses[m]={gastos:0,ingresos:0};meses[m].gastos+=g.importe});
  DB.invoices.filter(function(i){return i.estado==='Pagada'}).forEach(function(i){var m=i.fecha.substring(0,7);if(!meses[m])meses[m]={gastos:0,ingresos:0};meses[m].ingresos+=i.total});
  var keys=Object.keys(meses).sort().slice(-6);
  if(keys.length<2) return;
  var data=keys.map(function(k){return{label:k.slice(5),value:Math.round(meses[k].ingresos-meses[k].gastos)}});
  var el=document.getElementById('contabContent');
  if(el){el.innerHTML+='<div class="card" style="margin-top:14px"><div class="card-header"><span class="card-title" style="font-size:.85rem">📊 Beneficio mensual</span></div><div class="card-body">'+svgBarChart({data:data,height:160,color:'var(--success)',ylabel:CURRENCIES[CURRENCY].symbol})+'</div></div>'}
}

// CO3: Low stock alert check
function checkLowStock(){
  return DB.productos.filter(function(p){return p.activo&&p.stock!==undefined&&p.stock<=3});
}
