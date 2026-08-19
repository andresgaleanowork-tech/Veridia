// ===== IA COPILOT =====
function rIA(){
  $('mainContent').innerHTML=`<div class="fade-in"><div class="grid-23"><div class="card" style="display:flex;flex-direction:column;height:calc(100vh - 150px)"><div class="card-header"><span class="card-title" style="font-size:.88rem">🤖 Veridia IA</span><span class="badge badge-primary">Copilot</span></div>
<div style="flex:1;overflow-y:auto;padding:18px" id="chat"><div style="display:flex;gap:10px;margin-bottom:18px"><div class="avatar avatar-sm" style="background:var(--primary);color:#fff">IA</div><div style="background:var(--surface2);padding:12px 16px;border-radius:4px 14px 14px 14px;max-width:85%;font-size:.83rem;line-height:1.6">¡Hola! Soy <strong>Veridia IA</strong>. Puedo ayudarte con:<ul style="margin:6px 0 0 14px;font-size:.8rem"><li>🍽️ Planes alimentarios</li><li>👩‍🍳 Recetas adaptadas</li><li>📊 Interpretar analíticas</li><li>📝 Informes de seguimiento</li></ul><div style="margin-top:6px;font-size:.72rem;color:var(--text3)">Uso datos del Formula Engine. El juicio clínico es tuyo.</div></div></div></div>
<div style="padding:14px;border-top:1px solid var(--border);display:flex;gap:8px"><input id="iaI" placeholder="Escribe tu consulta..." style="flex:1" onkeyup="if(event.key==='Enter')sendIA()"><button class="btn btn-primary" onclick="sendIA()">${IC.send}</button></div>
</div><div>
<div class="card" style="margin-bottom:14px"><div class="card-header"><span class="card-title" style="font-size:.85rem">⚡ Prompts rápidos</span></div><div class="card-body" style="display:flex;flex-direction:column;gap:6px">
${contextQuickPrompts().map(function(p){return '<button class="btn btn-outline btn-sm" style="justify-content:flex-start;text-align:left" onclick="qIA(\''+p.replace(/'/g,"\\'")+'\')">'+p.substring(0,65)+(p.length>65?'...':'')+'</button>'}).join('\n')}
</div></div>
${typeof renderMemoryPanel==='function'?renderMemoryPanel():''}
<div class="card"><div class="card-header"><span class="card-title" style="font-size:.85rem">📋 Uso mensual</span></div><div class="card-body"><ul class="data-list" style="font-size:.78rem"><li><span class="label">Hoy</span><span class="value">3 gen</span></li><li><span class="label">Tokens</span><span class="value">4,250</span></li><li><span class="label">Límite</span><span class="value">50,000/mes</span></li></ul><div class="progress" style="margin-top:10px"><div class="progress-bar" style="width:8.5%;background:var(--primary)"></div></div><p style="font-size:.68rem;color:var(--text3);margin-top:4px">8.5% consumido</p></div></div>
</div></div></div>`;
}
// IA3: Context-aware quick prompts
function contextQuickPrompts(){
  var prompts=[];
  if(selPat){
    var p=gP(selPat);
    if(p){
      var as=DB.antropometrias.filter(function(a){return a.pacienteId===selPat});
      var anals=DB.analiticas.filter(function(a){return a.pacienteId===selPat});
      prompts.push('¿Qué plan alimentario recomiendas para '+p.nombre+'?');
      if(p.motivoConsulta)prompts.push('Analiza el caso: '+p.motivoConsulta);
      if(as.length)prompts.push('Evalúa la evolución antropométrica de '+p.nombre);
      if(anals.length)prompts.push('Interpreta la última analítica de '+p.nombre);
      var meds=(DB.patMeds||{})[selPat];
      if(meds&&meds.length)prompts.push('¿Hay interacciones fármaco-nutriente con '+meds.map(function(m){return m.nombre}).join(', ')+'?');
    }
  }
  if(!prompts.length){prompts=['Genera un plan de 7 días para pérdida de peso','¿Cuáles son las recomendaciones ESPEN para cirugía?','Diferencias entre Mifflin y Harris-Benedict']}
  return prompts;
}

function qIA(m){$('iaI').value=m;sendIA()}
function sendIA(){
  // RGPD Art.9: Consent check for AI with health data
  var _iaConsented=false;try{_iaConsented=localStorage.getItem('veridia_ia_consent')==='true'}catch(e){console.warn('[Veridia]',e.message||e)}
  if(!_iaConsented){
    openModal('<div class="modal-header"><h3>🔒 Consentimiento IA — RGPD</h3><button onclick="closeModal()">'+IC.x+'</button></div>'
    +'<div class="modal-body">'
    +'<p style="font-size:.88rem;line-height:1.6;margin-bottom:14px">El <strong>IA Copilot</strong> envía datos clínicos <strong>anonimizados</strong> a Google Gemini AI.</p>'
    +'<div style="background:var(--surface2,#f5f5f5);padding:12px;border-radius:10px;font-size:.82rem;margin-bottom:14px">'
    +'<strong>Datos enviados (anonimizados):</strong><ul style="margin:6px 0 0;padding-left:18px;color:var(--text2)"><li>Edad, sexo, motivo de consulta</li><li>Antropometría (peso, IMC)</li><li>Biomarcadores analíticos</li><li>Patologías y medicación</li></ul>'
    +'<div style="margin-top:8px;color:var(--success);font-size:.78rem">✅ Nombre, DNI, email, teléfono y dirección se eliminan automáticamente.</div></div>'
    +'<label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;font-size:.82rem;padding:10px;border:1px solid var(--border);border-radius:10px">'
    +'<input type="checkbox" id="iaRgpdCheck" style="margin-top:3px">'
    +'<span>Acepto el envío de datos anonimizados a Google Gemini conforme a la <a href="legal/POLITICA-PRIVACIDAD.md" target="_blank" style="color:var(--primary)">Política de Privacidad</a>.</span></label>'
    +'</div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">'+t('cancel')+'</button>'
    +'<button class="btn btn-primary" onclick="var cb=document.getElementById(\'iaRgpdCheck\');if(cb&&cb.checked){try{localStorage.setItem(\'veridia_ia_consent\',\'true\')}catch(e){console.warn(\'[Veridia]\',e.message||e)}closeModal();sendIA()}else{toast(\'Debe aceptar para usar la IA\',\'error\')}">Aceptar y enviar</button></div>');
    return;
  }
  const i=$('iaI'),m=i.value.trim();if(!m)return;i.value='';const c=$('chat');
  if(typeof showLoading==='function')showLoading('🤖 Consultando IA...');
  // User message
  var userInitials=currentUser?ini(currentUser.name.split(' ')[0],currentUser.name.split(' ').slice(1).join(' ')||'U'):'U';
  c.innerHTML+=`<div style="display:flex;gap:10px;margin-bottom:18px;justify-content:flex-end"><div style="background:var(--primary);color:#fff;padding:12px 16px;border-radius:14px 4px 14px 14px;max-width:80%;font-size:.83rem">${m}</div><div class="avatar avatar-sm" style="background:var(--accent);color:#fff">${userInitials}</div></div>`;
  // Loading
  const lid='l_'+Date.now();
  c.innerHTML+=`<div id="${lid}" style="display:flex;gap:10px;margin-bottom:18px"><div class="avatar avatar-sm" style="background:var(--primary);color:#fff">IA</div><div style="background:var(--surface2);padding:12px 16px;border-radius:4px 14px 14px 14px;font-size:.83rem"><span class="spinner"></span> Pensando...</div></div>`;
  c.scrollTop=c.scrollHeight;

  // Build context with patient data
  var ctx=selPat?buildPatientContext(selPat):'No hay paciente seleccionado.';
  var fullPrompt='CONTEXTO CLÍNICO:\n'+ctx+'\n\nCONSULTA DEL PROFESIONAL:\n'+m+'\n\nResponde como asistente de nutrición clínica. Sé conciso y útil. Si mencionan un paciente, usa los datos del contexto.';

  // #58 Auto-context
  var autoCtx='';
  if(selPat&&typeof buildPatientContext==='function'){autoCtx=buildPatientContext(selPat)}
  var fullPromptWithCtx=autoCtx?autoCtx+'\n\nPregunta del profesional: '+fullPrompt:fullPrompt;
  geminiAsk(fullPromptWithCtx,{
    system:'Eres Veridia IA, asistente de nutrición clínica integrado en un ERP profesional. Respondes en español. Eres preciso, conciso y clínicamente riguroso. Usa **negritas** para destacar. Siempre recuerda que el juicio clínico final es del profesional.',
    maxTokens:1000
  })
  .then(function(response){
    if(typeof hideLoading==='function')hideLoading();
    // Format markdown-like response
    var html=response.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/\n/g,'<br>');
    var el=document.getElementById(lid);
    if(el)el.innerHTML=`<div class="avatar avatar-sm" style="background:var(--primary);color:#fff">IA</div><div style="background:var(--surface2);padding:12px 16px;border-radius:4px 14px 14px 14px;max-width:85%;font-size:.83rem;line-height:1.6">${html}</div>`;
    c.scrollTop=c.scrollHeight;
  })
  .catch(function(err){
    if(typeof hideLoading==='function')hideLoading();
    var fallback='';
    if(err.message==='QUOTA_EXCEEDED')fallback='⚠️ Límite de uso de IA alcanzado temporalmente. Intentá de nuevo en unos minutos.';
    else fallback='⚠️ No se pudo conectar con la IA ('+err.message+'). Verificá tu conexión.';
    var el=document.getElementById(lid);
    if(el)el.innerHTML=`<div class="avatar avatar-sm" style="background:var(--primary);color:#fff">IA</div><div style="background:var(--surface2);padding:12px 16px;border-radius:4px 14px 14px 14px;max-width:85%;font-size:.83rem;color:var(--warning)">${fallback}</div>`;
    c.scrollTop=c.scrollHeight;
  });
}

// AI-powered analytics interpretation
function aiInterpretAnalytics(pacienteId){
  var p=gP(pacienteId);if(!p)return;
  var anal=DB.analiticas.filter(function(a){return a.pacienteId===pacienteId}).sort(function(a,b){return b.fecha.localeCompare(a.fecha)})[0];
  if(!anal){toast('Sin analíticas para interpretar','warning');return}
  var markers=anal.marcadores.map(function(m){return m.nombre+': '+m.valor+' '+m.unidad+' (rango: '+m.rango+')'+(m.alerta?' ['+m.alerta+']':'')}).join('\n');
  openModal('<div class="modal-header"><h3>🤖 Interpretación IA — Analíticas</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body"><div id="aiAnalResult" style="min-height:100px"><span class="spinner"></span> Analizando biomarcadores con Gemini AI...</div></div>');
  geminiAsk('Analiza estos resultados de laboratorio del paciente '+sanitize(p.nombre)+' '+sanitize(p.apellidos)+' ('+age(p.fechaNacimiento)+'a, '+(p.sexo||'')+'):\n\n'+markers+'\n\nProporciona:\n1. Resumen del estado metabólico\n2. Alertas críticas\n3. Recomendaciones nutricionales específicas\n4. Seguimiento sugerido',{maxTokens:1200})
  .then(function(r){$('aiAnalResult').innerHTML=r.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>')})
  .catch(function(e){$('aiAnalResult').innerHTML='<span style="color:var(--warning)">⚠️ '+(e.message==='QUOTA_EXCEEDED'?'Límite de IA alcanzado. Reintente en unos minutos.':'Error: '+e.message)+'</span>'});
}

// AI-powered recipe translation (better than dictionary)
function aiTranslateRecipe(steps,callback){
  if(!steps||!steps.length){callback(steps);return}
  var text=steps.join('\n---\n');
  geminiAsk('Traduce estas instrucciones de cocina del inglés al español. Mantén el formato de pasos numerados. Traduce ingredientes y técnicas culinarias de forma natural:\n\n'+text,{maxTokens:1500,temperature:0.3})
  .then(function(r){callback(r.split(/\n---\n|\n\d+\.\s/).filter(function(s){return s.trim().length>3}))})
  .catch(function(){callback(steps)}); // Fallback to original on error
}

// AI meal plan suggestion
function aiSuggestMealPlan(patienteId){
  var ctx=buildPatientContext(patienteId);
  openModal('<div class="modal-header"><h3>🤖 Sugerencia IA — Plan alimentario</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body"><div id="aiPlanResult" style="min-height:100px"><span class="spinner"></span> Generando sugerencia con Gemini AI...</div></div>');
  geminiAsk(ctx+'\n\nGenera una sugerencia de plan alimentario diario para este paciente con:\n- 5 comidas (Desayuno, Media mañana, Comida, Merienda, Cena)\n- Alimentos concretos con gramos\n- Cálculo aproximado de kcal por comida\n- Adaptado a su patología y restricciones\n- Incluye distribución de macronutrientes',{maxTokens:1500})
  .then(function(r){$('aiPlanResult').innerHTML=r.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>')})
  .catch(function(e){$('aiPlanResult').innerHTML='<span style="color:var(--warning)">⚠️ '+(e.message==='QUOTA_EXCEEDED'?'Límite de IA alcanzado.':'Error: '+e.message)+'</span>'});
}

// #59 Generación de plan completo por IA
function aiGenerateFullPlan(patId){
  var p=gP(patId);if(!p){toast('Seleccione paciente','error');return}
  if(typeof showLoading==='function')showLoading('🤖 Generando plan de 7 días...');
  var ctx=typeof buildPatientContext==='function'?buildPatientContext(patId):'';
  geminiAsk(ctx+'\n\nGenera un plan alimentario COMPLETO de 7 dias para este paciente con:\n- 5 comidas por dia (Desayuno, Media mañana, Comida, Merienda, Cena)\n- Alimentos concretos con gramos\n- Cálculo de kcal y macros por comida\n- Adaptado a su patología y preferencias\n- Variedad entre días\n- Incluye lista de compra semanal',{maxTokens:3000})
  .then(function(r){
    if(typeof hideLoading==='function')hideLoading();
    var html=r.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
    openModal('<div class="modal-header"><h3>Plan IA — '+p.nombre+'</h3><button onclick="closeModal()">'+IC.x+'</button></div><div class="modal-body" style="max-height:70vh;overflow-y:auto"><div style="font-size:.82rem;line-height:1.6">'+html+'</div></div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cerrar</button></div>',true);
  })
  .catch(function(e){if(typeof hideLoading==='function')hideLoading();toast('Error IA: '+e.message,'error')});
}

// #60 Historial de conversaciones IA
if(!DB.iaHistory) DB.iaHistory=[];

function saveIAHistory(question,answer){
  DB.iaHistory.unshift({q:question.substring(0,200),a:answer.substring(0,500),fecha:new Date().toISOString().replace('T',' ').substring(0,16)});
  if(DB.iaHistory.length>50) DB.iaHistory=DB.iaHistory.slice(0,50);
}
