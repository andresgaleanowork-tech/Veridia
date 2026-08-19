// ===== FEEDBACK + DEMO GUIADO =====
// Sistema de validación con usuarios reales para Beta

// ── Feedback Data ──
if(!DB.feedback) DB.feedback=[];

// ══════════════════════════════════════════════════════
//  FEEDBACK FORM
// ══════════════════════════════════════════════════════

function openFeedback(){
  var user=currentUser?currentUser.name:'Anónimo';
  var mod=curMod||'general';

  openModal('<div class="modal-header"><h3>💬 Tu opinión importa</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body">'
  +'<p style="font-size:.88rem;color:var(--text2);margin-bottom:18px">Estás en la <strong>Beta</strong>. Cada comentario nos ayuda a construir la herramienta que realmente necesitás. Gracias por tomarte un momento.</p>'

  // Q1: Overall experience
  +'<div style="margin-bottom:18px">'
  +'<label style="font-size:.85rem;font-weight:700;display:block;margin-bottom:8px">1. ¿Cómo calificarías tu experiencia general?</label>'
  +'<div id="fbStars1" style="display:flex;gap:6px">'+[1,2,3,4,5].map(function(n){
    return '<button class="fb-star" data-q="q1" data-v="'+n+'" onclick="fbSelectStar(this)" style="width:44px;height:44px;border-radius:12px;border:2px solid var(--border);background:var(--surface);font-size:1.2rem;cursor:pointer;transition:all .2s">'+['😞','😐','🙂','😊','🤩'][n-1]+'</button>';
  }).join('')+'</div></div>'

  // Q2: Ease of use
  +'<div style="margin-bottom:18px">'
  +'<label style="font-size:.85rem;font-weight:700;display:block;margin-bottom:8px">2. ¿Fue fácil encontrar lo que necesitabas?</label>'
  +'<div id="fbStars2" style="display:flex;gap:6px">'+[1,2,3,4,5].map(function(n){
    return '<button class="fb-star" data-q="q2" data-v="'+n+'" onclick="fbSelectStar(this)" style="width:44px;height:44px;border-radius:12px;border:2px solid var(--border);background:var(--surface);font-size:1.2rem;cursor:pointer;transition:all .2s">'+['😞','😐','🙂','😊','🤩'][n-1]+'</button>';
  }).join('')+'</div></div>'

  // Q3: Most useful module
  +'<div style="margin-bottom:18px">'
  +'<label style="font-size:.85rem;font-weight:700;display:block;margin-bottom:8px">3. ¿Qué módulo te resultó más útil?</label>'
  +'<select id="fbModule" class="form-control" style="max-width:300px">'
  +'<option value="">— Seleccionar —</option>'
  +'<option>Dashboard</option><option>Agenda</option><option>Pacientes</option><option>Historia Clínica</option>'
  +'<option>Fórmula Clínica</option><option>Desarrollada</option><option>Planes Alimentarios</option>'
  +'<option>Soporte Nutricional</option><option>Restauración Colectiva</option>'
  +'<option>Facturación</option><option>IA Copilot</option><option>Otro</option>'
  +'</select></div>'

  // Q4: What's missing
  +'<div style="margin-bottom:18px">'
  +'<label style="font-size:.85rem;font-weight:700;display:block;margin-bottom:8px">4. ¿Qué te falta o mejorarías?</label>'
  +'<textarea id="fbMissing" class="form-control" rows="3" placeholder="Ej: Me gustaría poder... / No encontré cómo... / Sería útil que..."></textarea></div>'

  // Q5: Would recommend
  +'<div style="margin-bottom:18px">'
  +'<label style="font-size:.85rem;font-weight:700;display:block;margin-bottom:8px">5. ¿Se lo recomendarías a un/a colega? (NPS)</label>'
  +'<div style="display:flex;gap:4px;flex-wrap:wrap" id="fbNPS">'+Array.from({length:11},function(_,i){
    return '<button class="fb-nps" data-v="'+i+'" onclick="fbSelectNPS(this)" style="width:36px;height:36px;border-radius:8px;border:2px solid var(--border);background:var(--surface);font-size:.78rem;font-weight:700;cursor:pointer;transition:all .2s;color:'+(i<=6?'var(--danger)':i<=8?'var(--warning)':'var(--success)')+'">'+i+'</button>';
  }).join('')+'</div>'
  +'<div style="display:flex;justify-content:space-between;font-size:.65rem;color:var(--text3);margin-top:4px"><span>Nada probable</span><span>Muy probable</span></div></div>'

  // Q6: Free text
  +'<div style="margin-bottom:8px">'
  +'<label style="font-size:.85rem;font-weight:700;display:block;margin-bottom:8px">6. ¿Algo más que quieras contarnos?</label>'
  +'<textarea id="fbComments" class="form-control" rows="2" placeholder="Comentarios libres, ideas, quejas, elogios... todo vale."></textarea></div>'

  +'<div style="font-size:.68rem;color:var(--text3);margin-top:6px">📍 Módulo actual: <strong>'+mod+'</strong> · Usuario: <strong>'+sanitize(user)+'</strong></div>'
  +'</div>'
  +'<div class="modal-footer">'
  +'<button class="btn btn-outline" onclick="closeModal()">Ahora no</button>'
  +'<button class="btn btn-primary" onclick="submitFeedback()">📨 Enviar feedback</button>'
  +'</div>',true);

  // Store selections
  window._fbData={q1:0,q2:0,nps:-1};
}

function fbSelectStar(btn){
  var q=btn.getAttribute('data-q');
  var v=parseInt(btn.getAttribute('data-v'));
  window._fbData[q]=v;
  // Highlight
  var parent=btn.parentElement;
  parent.querySelectorAll('.fb-star').forEach(function(b){
    var bv=parseInt(b.getAttribute('data-v'));
    var isQ=b.getAttribute('data-q')===q;
    if(isQ){
      b.style.borderColor=bv<=v?'var(--primary)':'var(--border)';
      b.style.background=bv<=v?'var(--primary-light)':'var(--surface)';
      b.style.transform=bv===v?'scale(1.15)':'scale(1)';
    }
  });
}

function fbSelectNPS(btn){
  var v=parseInt(btn.getAttribute('data-v'));
  window._fbData.nps=v;
  document.querySelectorAll('.fb-nps').forEach(function(b){
    var bv=parseInt(b.getAttribute('data-v'));
    b.style.borderColor=bv<=v?'var(--primary)':'var(--border)';
    b.style.background=bv<=v?'var(--primary-light)':'var(--surface)';
    b.style.transform=bv===v?'scale(1.15)':'scale(1)';
  });
}

function submitFeedback(){
  var d=window._fbData||{};
  if(!d.q1&&!d.q2&&d.nps<0){toast('Por favor respondé al menos una pregunta','error');return}

  var entry={
    id:Date.now(),
    date:new Date().toISOString(),
    user:currentUser?currentUser.name:'Anónimo',
    email:currentUser?currentUser.email:'',
    module:curMod||'general',
    q1_experience:d.q1||0,
    q2_easeOfUse:d.q2||0,
    q3_bestModule:($('fbModule')||{}).value||'',
    q4_missing:sanitize(($('fbMissing')||{}).value||'').trim(),
    q5_nps:d.nps>=0?d.nps:null,
    q6_comments:sanitize(($('fbComments')||{}).value||'').trim(),
    version:'5.2.0',
    userAgent:navigator.userAgent.substring(0,100),
    screen:window.innerWidth+'x'+window.innerHeight
  };

  DB.feedback.push(entry);

  // Save to Firebase
  if(typeof fbSave==='function'){
    fbSave('feedback','fb_'+entry.id,entry);
  }

  // Save locally
  try{
    var saved=JSON.parse(localStorage.getItem('veridia_feedback')||'[]');
    saved.push(entry);
    localStorage.setItem('veridia_feedback',JSON.stringify(saved));
  }catch(e){console.warn('[Veridia]',e.message||e)}

  closeModal();

  // Thank you message
  setTimeout(function(){
    openModal('<div style="text-align:center;padding:40px 30px">'
    +'<div style="font-size:3rem;margin-bottom:12px">🙏</div>'
    +'<h2 style="font-size:1.3rem;font-weight:800;color:var(--primary);margin-bottom:8px">¡Gracias por tu feedback!</h2>'
    +'<p style="font-size:.88rem;color:var(--text2);max-width:380px;margin:0 auto;line-height:1.6">Tu opinión es lo que nos permite mejorar día a día. Cada sugerencia se revisa personalmente.</p>'
    +'<div style="margin-top:20px"><button class="btn btn-primary" onclick="closeModal()" style="padding:10px 32px">Seguir trabajando →</button></div>'
    +'</div>');
  },300);

  toast('Feedback enviado — ¡Gracias!','success');
}

// ══════════════════════════════════════════════════════
//  DEMO GUIADO INTERACTIVO (Walkthrough)
// ══════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════
//  DEMO GUIADO — Tour interactivo de la plataforma
// ══════════════════════════════════════════════════════
var _demoStep=0;
var _demoSteps=[];
var _demoOverlay=null;
var _demoHighlightedEls=[];

function startDemoGuiado(){
  try{
  if(!DB.patients||!DB.patients.length) loadDemoData();
  if(!DB.patients||!DB.patients.length){toast('Error: no se pudieron cargar los datos de demo','error');return}
  selPat=DB.patients[0].id;

  _demoSteps=[
    {
      module:'dashboard',
      title:'📊 Dashboard',
      desc:'Tu centro de control. Citas del día, pacientes activos, alertas, ingresos y evolución de peso — todo de un vistazo.',
      highlight:'.stats-grid'
    },
    {
      module:'pacientes',
      title:'👥 Pacientes',
      desc:'Tu cartera clínica completa. Busca por nombre o DNI, filtra por tags, exporta CSV. Clic en un nombre para abrir su Historia Clínica.',
      highlight:'table'
    },
    {
      module:'historia',
      title:'📋 Historia Clínica',
      desc:'10 pestañas por paciente: anamnesis, consultas, antropometría, analíticas, plan alimentario, farmacología, documentos y más.',
      action:function(){histTab='resumen';rHist()},
      highlight:'.pill-tabs'
    },
    {
      module:'antropometria',
      title:'⚖️ Antropometría',
      desc:'Registra peso, IMC, pliegues, BIA. Gráficos de evolución automáticos. Percentiles OMS para menores de 19 años.',
      highlight:'.card'
    },
    {
      module:'formula',
      title:'🧮 Fórmula Clínica',
      desc:'5 fórmulas (Mifflin, Harris-Benedict, Owen, Cunningham, Penn State). Los inputs se recalculan en tiempo real con auto-save.',
      highlight:'#fCalcBtn'
    },
    {
      module:'desarrollada',
      title:'🔬 Desarrollada',
      desc:'El copiloto clínico en 5 pasos: datos → molécula calórica → alimentos BEDCA → cuadraje → minuta exportable.',
      highlight:'.dev-stepper'
    },
    {
      module:'planes',
      title:'🍽️ Planes Alimentarios',
      desc:'Wizard de creación, plantillas reutilizables, copia entre pacientes. Cada comida con alimentos BEDCA y cálculo automático.',
      highlight:null
    },
    {
      module:'facturacion',
      title:'💳 Facturación',
      desc:'Facturas multilínea con IVA, descuentos, cobro con registro en caja. Facturas recurrentes e informes fiscales.',
      highlight:null
    },
    {
      module:'restauracion',
      title:'🏛️ Restauración Colectiva',
      desc:'Para instituciones: menús semanales con derivaciones automáticas, APPCC, escalado con factores de merma, trazabilidad completa.',
      action:function(){rcTab='resumen';rRestauracion()},
      highlight:'.pill-tabs'
    },
    {
      module:'ia',
      title:'🤖 IA Copilot',
      desc:'Gemini interpreta analíticas, genera planes de 7 días, sugiere por patología. Los prompts se adaptan al paciente seleccionado.',
      highlight:null
    }
  ];

  _demoStep=0;
  showDemoStep();

  // Keyboard support
  document.removeEventListener('keydown',_demoKeyHandler);
  document.addEventListener('keydown',_demoKeyHandler);
  }catch(e){console.error('[Tour]',e);toast('Error al iniciar tour: '+e.message,'error')}
}

function _demoKeyHandler(e){
  if(e.key==='Escape') endDemoGuiado();
  else if(e.key==='ArrowRight'||e.key===' ') demoNext();
  else if(e.key==='ArrowLeft') demoBack();
}

function showDemoStep(){
  if(_demoStep>=_demoSteps.length){
    endDemoComplete();
    return;
  }

  var step=_demoSteps[_demoStep];
  var total=_demoSteps.length;

  _formDirty=false;
  try{navigate(step.module)}catch(e){console.warn('[Tour] navigate error:',e)}
  if(step.action) setTimeout(function(){try{step.action()}catch(e){console.warn('[Tour] action error:',e)}},200);

  setTimeout(function(){
    removeDemoOverlay();

    // ═══ DARK BACKDROP ═══
    var backdrop=document.createElement('div');
    backdrop.id='demoBackdrop';
    backdrop.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9997;transition:opacity .3s;cursor:pointer';
    backdrop.onclick=function(){endDemoGuiado()};
    document.body.appendChild(backdrop);

    // ═══ SPOTLIGHT on highlighted element ═══
    if(step.highlight){
      var el=document.querySelector(step.highlight);
      if(el){
        _demoHighlightedEls.push(el);
        el.style.position='relative';
        el.style.zIndex='9998';
        el.style.boxShadow='0 0 0 4px var(--primary), 0 0 0 9999px rgba(0,0,0,.45)';
        el.style.borderRadius='12px';
        el.style.transition='box-shadow .4s ease';
      }
    }

    // ═══ TOOLTIP CARD ═══
    var tip=document.createElement('div');
    tip.id='demoTooltip';
    tip.style.cssText='position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(20px);z-index:9999;'
    +'background:var(--surface,#fff);border:2px solid var(--primary);border-radius:20px;padding:22px 26px;'
    +'max-width:460px;width:calc(100vw - 40px);box-shadow:0 20px 60px rgba(0,0,0,.25);'
    +'opacity:0;transition:opacity .35s ease,transform .35s ease';

    // Progress dots
    var dots='<div style="display:flex;gap:5px;align-items:center">';
    for(var d=0;d<total;d++){
      var dotColor=d<_demoStep?'var(--primary)':d===_demoStep?'var(--primary)':'var(--border)';
      var dotSize=d===_demoStep?'8px':'5px';
      dots+='<div style="width:'+dotSize+';height:'+dotSize+';border-radius:50%;background:'+dotColor+';transition:all .3s"></div>';
    }
    dots+='</div>';

    tip.innerHTML=''
    // Header: dots + step counter + close
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
    +dots
    +'<div style="display:flex;align-items:center;gap:10px">'
    +'<span style="font-size:.65rem;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.8px">'+(_demoStep+1)+' / '+total+'</span>'
    +'<button onclick="endDemoGuiado()" style="background:var(--surface2,#f0f0f0);border:none;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:.75rem;color:var(--text3);display:flex;align-items:center;justify-content:center;transition:background .2s" onmouseover="this.style.background=\'var(--danger-light)\';this.style.color=\'var(--danger)\'" onmouseout="this.style.background=\'var(--surface2)\';this.style.color=\'var(--text3)\'" title="Cerrar tour (ESC)">✕</button>'
    +'</div></div>'
    // Title
    +'<h3 style="font-size:1.05rem;font-weight:800;margin-bottom:6px;letter-spacing:-.3px">'+step.title+'</h3>'
    // Description
    +'<p style="font-size:.84rem;color:var(--text2);line-height:1.65;margin-bottom:18px">'+step.desc+'</p>'
    // Navigation
    +'<div style="display:flex;justify-content:space-between;align-items:center">'
    +(_demoStep>0
      ?'<button onclick="demoBack()" style="background:none;border:1px solid var(--border);padding:8px 18px;border-radius:10px;font-size:.82rem;font-weight:600;cursor:pointer;color:var(--text2);transition:all .2s" onmouseover="this.style.borderColor=\'var(--primary)\';this.style.color=\'var(--primary)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.color=\'var(--text2)\'">← Anterior</button>'
      :'<span style="font-size:.68rem;color:var(--text3)">ESC para salir · ← → para navegar</span>')
    +'<button onclick="demoNext()" style="background:var(--primary);color:#fff;border:none;padding:9px 24px;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 4px 12px rgba(46,139,87,.25)" onmouseover="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 6px 16px rgba(46,139,87,.35)\'" onmouseout="this.style.transform=\'none\';this.style.boxShadow=\'0 4px 12px rgba(46,139,87,.25)\'">'
    +(_demoStep<total-1?'Siguiente →':'🎉 Finalizar')
    +'</button></div>';

    document.body.appendChild(tip);

    // Animate in
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        tip.style.opacity='1';
        tip.style.transform='translateX(-50%) translateY(0)';
      });
    });
    // Fallback if rAF is throttled (background tab)
    setTimeout(function(){tip.style.opacity='1';tip.style.transform='translateX(-50%) translateY(0)'},100);

  },300);
}

function demoNext(){
  _clearHighlights();
  _demoStep++;
  showDemoStep();
}

function demoBack(){
  _clearHighlights();
  _demoStep=Math.max(0,_demoStep-1);
  showDemoStep();
}

function endDemoGuiado(){
  _clearHighlights();
  removeDemoOverlay();
  _demoStep=0;
  document.removeEventListener('keydown',_demoKeyHandler);
  toast('Tour finalizado','info');
}

function endDemoComplete(){
  _clearHighlights();
  removeDemoOverlay();
  _demoStep=0;
  document.removeEventListener('keydown',_demoKeyHandler);

  openModal('<div style="text-align:center;padding:44px 30px">'
  +'<div style="font-size:3.5rem;margin-bottom:16px">🎉</div>'
  +'<h2 style="font-size:1.3rem;font-weight:800;color:var(--primary);margin-bottom:8px;letter-spacing:-.3px">¡Tour completado!</h2>'
  +'<p style="font-size:.88rem;color:var(--text2);max-width:380px;margin:0 auto;line-height:1.65">Ya conocés los módulos principales de Veridia. Presioná <kbd style="background:var(--surface2);padding:3px 10px;border-radius:6px;font-size:.78rem;font-weight:700">?</kbd> en cualquier momento para ver los atajos de teclado.</p>'
  +'<div style="margin-top:22px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'
  +'<button class="btn btn-outline" style="border-radius:10px" onclick="closeModal();openFeedback()">💬 Dar feedback</button>'
  +'<button class="btn btn-primary" style="border-radius:10px;padding:10px 28px" onclick="closeModal()">🚀 Comenzar a trabajar</button>'
  +'</div></div>');
}

function _clearHighlights(){
  _demoHighlightedEls.forEach(function(el){
    if(el){
      el.style.boxShadow='';
      el.style.zIndex='';
      el.style.position='';
    }
  });
  _demoHighlightedEls=[];
}

function removeDemoOverlay(){
  var bd=document.getElementById('demoBackdrop');if(bd)bd.remove();
  var tip=document.getElementById('demoTooltip');if(tip)tip.remove();
}


// ══════════════════════════════════════════════════════
//  FEEDBACK VIEWER (for SuperAdmin integration)
// ══════════════════════════════════════════════════════

function getFeedbackSummary(){
  var all=DB.feedback||[];
  try{
    var local=JSON.parse(localStorage.getItem('veridia_feedback')||'[]');
    // Merge without duplicates
    local.forEach(function(l){
      if(!all.find(function(a){return a.id===l.id})) all.push(l);
    });
  }catch(e){console.warn('[Veridia]',e.message||e)}

  if(!all.length) return {count:0,avgExperience:0,avgEase:0,avgNPS:0,entries:[]};

  var totalExp=0,countExp=0,totalEase=0,countEase=0,totalNPS=0,countNPS=0;
  all.forEach(function(f){
    if(f.q1_experience){totalExp+=f.q1_experience;countExp++}
    if(f.q2_easeOfUse){totalEase+=f.q2_easeOfUse;countEase++}
    if(f.q5_nps!=null&&f.q5_nps>=0){totalNPS+=f.q5_nps;countNPS++}
  });

  return {
    count:all.length,
    avgExperience:countExp?Math.round(totalExp/countExp*10)/10:0,
    avgEase:countEase?Math.round(totalEase/countEase*10)/10:0,
    avgNPS:countNPS?Math.round(totalNPS/countNPS*10)/10:0,
    promoters:all.filter(function(f){return f.q5_nps>=9}).length,
    passives:all.filter(function(f){return f.q5_nps>=7&&f.q5_nps<=8}).length,
    detractors:all.filter(function(f){return f.q5_nps!=null&&f.q5_nps<=6}).length,
    entries:all.sort(function(a,b){return b.id-a.id})
  };
}

function viewFeedbackPanel(){
  var s=getFeedbackSummary();

  var npsScore=s.count?(s.promoters-s.detractors)/s.count*100:0;
  var npsColor=npsScore>=50?'var(--success)':npsScore>=0?'var(--warning)':'var(--danger)';

  var h='<div class="modal-header"><h3>📊 Panel de Feedback Beta</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
  +'<div class="modal-body">'
  +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:20px">'
  +'<div class="card" style="text-align:center;padding:16px"><div style="font-size:2rem;font-weight:900;color:var(--primary)">'+s.count+'</div><div style="font-size:.72rem;color:var(--text3)">Respuestas</div></div>'
  +'<div class="card" style="text-align:center;padding:16px"><div style="font-size:2rem;font-weight:900">'+s.avgExperience+'</div><div style="font-size:.72rem;color:var(--text3)">Experiencia /5</div></div>'
  +'<div class="card" style="text-align:center;padding:16px"><div style="font-size:2rem;font-weight:900">'+s.avgEase+'</div><div style="font-size:.72rem;color:var(--text3)">Facilidad /5</div></div>'
  +'<div class="card" style="text-align:center;padding:16px"><div style="font-size:2rem;font-weight:900;color:'+npsColor+'">'+Math.round(npsScore)+'</div><div style="font-size:.72rem;color:var(--text3)">NPS Score</div></div>'
  +'</div>';

  if(s.count){
    h+='<div style="display:flex;gap:8px;margin-bottom:16px;font-size:.82rem">'
    +'<span class="badge badge-success">😊 Promotores: '+s.promoters+'</span>'
    +'<span class="badge badge-warning">😐 Pasivos: '+s.passives+'</span>'
    +'<span class="badge badge-danger">😞 Detractores: '+s.detractors+'</span></div>';

    h+='<h4 style="font-size:.88rem;margin-bottom:10px">Últimas respuestas</h4>'
    +'<div style="max-height:300px;overflow-y:auto">';
    s.entries.slice(0,20).forEach(function(f){
      var date=f.date?new Date(f.date).toLocaleDateString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';
      h+='<div style="padding:12px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;font-size:.82rem">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
      +'<strong>'+sanitize(f.user||'Anónimo')+'</strong>'
      +'<span style="font-size:.68rem;color:var(--text3)">'+date+' · '+sanitize(f.module||'')+'</span></div>'
      +'<div style="display:flex;gap:10px;margin-bottom:6px">'
      +(f.q1_experience?'<span>Exp: '+['😞','😐','🙂','😊','🤩'][f.q1_experience-1]+'</span>':'')
      +(f.q2_easeOfUse?'<span>Fácil: '+['😞','😐','🙂','😊','🤩'][f.q2_easeOfUse-1]+'</span>':'')
      +(f.q5_nps!=null?'<span>NPS: <strong style="color:'+(f.q5_nps>=9?'var(--success)':f.q5_nps>=7?'var(--warning)':'var(--danger)')+'">'+f.q5_nps+'</strong></span>':'')
      +(f.q3_bestModule?'<span style="font-size:.72rem;color:var(--text3)">⭐ '+sanitize(f.q3_bestModule)+'</span>':'')
      +'</div>'
      +(f.q4_missing?'<div style="padding:6px 10px;background:var(--surface2);border-radius:6px;font-size:.78rem;margin-bottom:4px">💡 '+sanitize(f.q4_missing)+'</div>':'')
      +(f.q6_comments?'<div style="font-size:.78rem;color:var(--text2)">💬 '+sanitize(f.q6_comments)+'</div>':'')
      +'<div style="font-size:.6rem;color:var(--text3);margin-top:4px">'+sanitize(f.screen||'')+' · v'+sanitize(f.version||'')+'</div>'
      +'</div>';
    });
    h+='</div>';
  } else {
    h+='<div style="text-align:center;padding:30px;color:var(--text3)"><div style="font-size:2.5rem;margin-bottom:8px">📭</div>Sin feedback todavía. Los usuarios pueden enviar sus opiniones con el botón 💬 Feedback.</div>';
  }

  h+='</div>';
  openModal(h,true);
}
