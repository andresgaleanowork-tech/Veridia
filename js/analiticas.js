// ===== ANALÍTICAS =====
function rAnal(){
  const p=requirePatient();if(!p)return;
  const as=DB.analiticas.filter(a=>a.pacienteId===p.id);

  // Collect unique biomarkers for trend
  var allMarkers={};as.forEach(function(a){a.marcadores.forEach(function(m){allMarkers[m.nombre]=m.unidad})});
  var markerNames=Object.keys(allMarkers);
  var totalAlerts=0;var totalGrave=0;
  as.forEach(function(a){a.marcadores.forEach(function(m){if(m.alerta){totalAlerts++;if(m.alerta==='grave')totalGrave++}})});

  // ═══ HEADER ═══
  var h='<div class="fade-in">'
  +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px">'
  +'<div style="display:flex;align-items:center;gap:10px">'+patSel(p.id)+'</div>'
  +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
  +'<button class="btn btn-outline btn-sm" style="border-radius:8px" onclick="importAnalCSV()">📥 Importar CSV</button>'
  +(as.length>=2?'<button class="btn btn-outline btn-sm" style="border-radius:8px" onclick="openAnalyticsCompare('+p.id+')">📊 Comparar</button>':'')
  +(as.length?'<button class="btn btn-outline btn-sm" style="border-radius:8px" onclick="aiInterpretAnalytics('+p.id+')">🤖 IA Interpretar</button>':'')
  +'<button class="btn btn-primary" style="border-radius:10px;display:flex;align-items:center;gap:6px" onclick="openNewAnalModal()">'+IC.plus+' Nueva analítica</button>'
  +'</div></div>';

  // ═══ KPI ROW (if data) ═══
  if(as.length){
    h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px">'
    +'<div class="card" style="padding:16px;text-align:center;border-top:3px solid #6366f1"><div style="font-size:1rem;margin-bottom:2px">🔬</div><div style="font-size:1.6rem;font-weight:800;color:#6366f1">'+as.length+'</div><div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Analíticas</div></div>'
    +'<div class="card" style="padding:16px;text-align:center;border-top:3px solid var(--primary)"><div style="font-size:1rem;margin-bottom:2px">📊</div><div style="font-size:1.6rem;font-weight:800;color:var(--primary)">'+markerNames.length+'</div><div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Biomarcadores</div></div>'
    +'<div class="card" style="padding:16px;text-align:center;border-top:3px solid '+(totalAlerts>0?'#ca8a04':'#16a34a')+'"><div style="font-size:1rem;margin-bottom:2px">'+(totalAlerts>0?'⚡':'✅')+'</div><div style="font-size:1.6rem;font-weight:800;color:'+(totalAlerts>0?'#ca8a04':'#16a34a')+'">'+totalAlerts+'</div><div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Alertas</div></div>'
    +'<div class="card" style="padding:16px;text-align:center;border-top:3px solid '+(totalGrave>0?'#dc2626':'#16a34a')+'"><div style="font-size:1rem;margin-bottom:2px">'+(totalGrave>0?'🚨':'✅')+'</div><div style="font-size:1.6rem;font-weight:800;color:'+(totalGrave>0?'#dc2626':'#16a34a')+'">'+totalGrave+'</div><div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Graves</div></div>'
    +'</div>';
  }

  // ═══ ANALYTICS CARDS ═══
  if(as.length){
    as.forEach(function(a){
      var numAlerts=a.marcadores.filter(function(m){return m.alerta}).length;
      var hasGrave=a.marcadores.some(function(m){return m.alerta==='grave'});
      var hasMod=a.marcadores.some(function(m){return m.alerta==='moderada'});
      var borderColor=hasGrave?'#dc2626':hasMod?'#ca8a04':'#16a34a';
      var statusLabel=hasGrave?'Requiere atención':hasMod?'Valores a vigilar':'Todo normal';
      var statusBadge=hasGrave?'badge-danger':hasMod?'badge-warning':'badge-success';

      h+='<div class="card" style="margin-bottom:18px;border-top:3px solid '+borderColor+'">'
      +'<div class="card-header">'
      +'<div style="display:flex;align-items:center;gap:8px;flex:1"><span class="card-title" style="font-size:.88rem">🔬 '+fD(a.fecha)+'</span>'
      +(a.ayuno?'<span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:.65rem;font-weight:600;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">Ayuno</span>':'')
      +'<span class="badge '+statusBadge+'" style="font-size:.65rem">'+numAlerts+' alerta'+(numAlerts!==1?'s':'')+'</span></div>'
      +'<div style="display:flex;gap:4px">'
      +'<button class="btn btn-ghost btn-xs" style="border-radius:6px" onclick="editAnal('+a.id+')" title="Editar">'+IC.edit+'</button>'
      +'<button class="btn btn-ghost btn-xs" style="border-radius:6px;color:var(--danger)" onclick="deleteAnal('+a.id+')" title="Eliminar">✕</button>'
      +'</div></div>'
      +'<div class="card-body" style="padding:0;overflow-x:auto">'
      +'<table role="table" style="width:100%;border-collapse:collapse;font-size:.82rem">'
      +'<thead><tr style="background:var(--surface2)">'
      +'<th style="padding:10px 14px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Biomarcador</th>'
      +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Valor</th>'
      +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Unidad</th>'
      +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Rango ref.</th>'
      +'<th style="padding:10px;text-align:center;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:600">Estado</th>'
      +'</tr></thead><tbody>';

      a.marcadores.forEach(function(m,i){
        var isAlt=i%2===1;
        var rowBg=m.alerta==='grave'?'#fef2f2':m.alerta==='moderada'?'#fffbeb':m.alerta?'#f0f9ff':(isAlt?'var(--surface)':'transparent');
        var valColor=m.alerta==='grave'?'#dc2626':m.alerta==='moderada'?'#92400e':'var(--text)';

        h+='<tr style="background:'+rowBg+';border-bottom:1px solid var(--border)">'
        +'<td style="padding:10px 14px;font-weight:600">'+m.nombre+'</td>'
        +'<td style="padding:10px;text-align:center;font-size:1rem;font-weight:800;color:'+valColor+';font-variant-numeric:tabular-nums">'+m.valor+'</td>'
        +'<td style="padding:10px;text-align:center;color:var(--text3);font-size:.78rem">'+m.unidad+'</td>'
        +'<td style="padding:10px;text-align:center;color:var(--text3);font-size:.78rem;font-variant-numeric:tabular-nums">'+m.rango+'</td>'
        +'<td style="padding:10px;text-align:center">';
        if(m.alerta){
          h+='<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 10px;border-radius:20px;font-size:.68rem;font-weight:700;'
          +(m.alerta==='grave'?'background:#fef2f2;color:#dc2626;border:1px solid #fecaca">⚠️ Fuera rango':'background:#fffbeb;color:#92400e;border:1px solid #fde68a">⚡ Alerta')
          +'</span>';
        } else {
          h+='<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 10px;border-radius:20px;font-size:.68rem;font-weight:700;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">✓ Normal</span>';
        }
        h+='</td></tr>';
      });
      h+='</tbody></table></div></div>';
    });

    // ═══ TREND CHART ═══
    if(markerNames.length>=1&&as.length>=2){
      h+='<div class="card" style="border-top:3px solid var(--accent)">'
      +'<div class="card-header"><span class="card-title" style="font-size:.88rem">📈 Tendencia de Biomarcador</span></div>'
      +'<div class="card-body">'
      +'<div style="margin-bottom:12px"><select id="bioSelect" onchange="document.getElementById(\'bioTrend\').innerHTML=renderBiomarkerTrend('+p.id+',this.value)" style="font-size:.82rem;padding:8px 14px;border-radius:10px;border:1px solid var(--border);min-width:200px">'
      +markerNames.map(function(m){return '<option value="'+m+'">'+m+' ('+allMarkers[m]+')</option>'}).join('')
      +'</select></div>'
      +'<div id="bioTrend">'+renderBiomarkerTrend(p.id,markerNames[0])+'</div>'
      +'</div></div>';
    }

  } else {
    // ═══ EMPTY STATE ═══
    h+='<div class="card" style="text-align:center;padding:50px"><div style="font-size:3.5rem;margin-bottom:14px;opacity:.3">🔬</div>'
    +'<p style="color:var(--text-secondary);font-size:.92rem;margin:0;font-weight:600">Sin analíticas registradas</p>'
    +'<p style="color:var(--text3);font-size:.78rem;margin:6px 0 20px">Registre la primera analítica con biomarcadores para hacer seguimiento.</p>'
    +'<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'
    +'<button class="btn btn-primary" style="border-radius:10px;padding:10px 28px" onclick="openNewAnalModal()">🔬 Nueva analítica</button>'
    +'<button class="btn btn-outline" style="border-radius:10px" onclick="importAnalCSV()">📥 Importar CSV</button></div></div>';
  }

  h+='</div>';
  $('mainContent').innerHTML=h;
}

// ===== ALERTAS =====
function rAlerts(){
  const pe=DB.alerts.filter(a=>a.estado==='pendiente'),re=DB.alerts.filter(a=>a.estado!=='pendiente');
  var totalGrave=pe.filter(function(a){return a.severidad==='grave'}).length;

  var h='<div class="fade-in">';

  // Header
  if(pe.length){
    h+='<div class="card" style="border:none;background:linear-gradient(135deg,#0E7490 0%,#0891B2 50%,#22D3EE 100%);color:#fff;margin-bottom:22px;border-radius:var(--radius);padding:22px 28px">'
    +'<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">'
    +'<span style="font-size:1.6rem">🚨</span>'
    +'<div><h2 style="margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.3px">Alertas Clínicas</h2>'
    +'<p style="margin:0;font-size:.78rem;opacity:.75">'+pe.length+' pendiente'+(pe.length!==1?'s':'')+(totalGrave>0?' · <strong>'+totalGrave+' grave'+(totalGrave!==1?'s':'')+'</strong>':'')+'</p></div>'
    +'</div></div>';
  } else {
    h+='<div class="card" style="border:none;background:linear-gradient(135deg,#0E7490 0%,#0891B2 50%,#22D3EE 100%);color:#fff;margin-bottom:22px;border-radius:var(--radius);padding:22px 28px">'
    +'<div style="display:flex;align-items:center;gap:14px">'
    +'<span style="font-size:1.6rem">✅</span>'
    +'<div><h2 style="margin:0;font-size:1.15rem;font-weight:800">Alertas Clínicas</h2>'
    +'<p style="margin:0;font-size:.78rem;opacity:.75">Sin alertas pendientes</p></div></div></div>';
  }

  // Tabs
  h+='<div class="pill-tabs" style="margin-bottom:18px">'
  +'<button class="pill-tab active" id="tP" onclick="$(\'aP\').style.display=\'\';$(\'aR\').style.display=\'none\';this.classList.add(\'active\');$(\'tR\').classList.remove(\'active\')">⚠️ Pendientes ('+pe.length+')</button>'
  +'<button class="pill-tab" id="tR" onclick="$(\'aR\').style.display=\'\';$(\'aP\').style.display=\'none\';this.classList.add(\'active\');$(\'tP\').classList.remove(\'active\')">✅ Revisadas ('+re.length+')</button></div>';

  // Pendientes
  h+='<div id="aP">';
  if(pe.length){
    pe.forEach(function(a){
      var p=gP(a.pacienteId);
      var borderColor=a.severidad==='grave'?'#dc2626':a.severidad==='moderada'?'#ca8a04':'#2563eb';
      h+='<div class="card" style="margin-bottom:12px;border-left:4px solid '+borderColor+';padding:16px 20px">'
      +'<div style="display:flex;align-items:flex-start;gap:12px">'
      +'<div style="flex:1">'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">'
      +'<span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:.65rem;font-weight:700;background:'+(a.severidad==='grave'?'#fef2f2;color:#dc2626;border:1px solid #fecaca':a.severidad==='moderada'?'#fffbeb;color:#92400e;border:1px solid #fde68a':'#eff6ff;color:#2563eb;border:1px solid #bfdbfe')+'">'+a.severidad.toUpperCase()+'</span>'
      +'<strong style="font-size:.84rem">'+(p?sanitize(p.nombre)+' '+sanitize(p.apellidos):'')+'</strong>'
      +'<span style="font-size:.68rem;color:var(--text3)">'+a.tipo+' · '+a.fecha+'</span></div>'
      +'<p style="font-size:.84rem;margin:0 0 4px;color:var(--text)">'+a.mensaje+'</p>'
      +'<p style="font-size:.76rem;color:var(--text-secondary);margin:0">💡 '+a.recomendacion+'</p>'
      +'</div>'
      +'<button class="btn btn-outline btn-sm" style="border-radius:8px;flex-shrink:0" onclick="revAlert('+a.id+')">✓ Revisar</button>'
      +'</div></div>';
    });
  } else {
    h+='<div style="text-align:center;padding:30px;color:var(--text3);font-size:.85rem">✅ No hay alertas pendientes</div>';
  }
  h+='</div>';

  // Revisadas
  h+='<div id="aR" style="display:none">';
  if(re.length){
    re.forEach(function(a){
      var p=gP(a.pacienteId);
      h+='<div style="padding:12px 18px;margin-bottom:6px;background:var(--surface2);border-radius:10px;opacity:.6;display:flex;align-items:center;gap:10px">'
      +'<div style="flex:1;font-size:.82rem"><strong>'+(p?sanitize(p.nombre)+' '+sanitize(p.apellidos):'')+'</strong> — '+a.mensaje
      +'<span style="display:inline-block;padding:2px 6px;border-radius:8px;font-size:.6rem;font-weight:700;background:#f0fdf4;color:#16a34a;margin-left:6px">Revisada</span></div></div>';
    });
  } else {
    h+='<div style="text-align:center;padding:30px;color:var(--text3);font-size:.85rem">Sin alertas revisadas</div>';
  }
  h+='</div></div>';

  $('mainContent').innerHTML=h;
}

function revAlert(id){const a=DB.alerts.find(x=>x.id===id);if(a){a.estado='revisada';toast('Alerta revisada');updAlertDot();navigate('alertas')}}
