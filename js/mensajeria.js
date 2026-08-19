// ===== MENSAJERÍA BIDIRECCIONAL (Paciente ↔ Nutricionista) =====
// Chat storage: {pacienteId: {enabled:bool, messages:[{from,text,time,read}], unread:int}}
var chatDB={};
try{var _cd=JSON.parse(localStorage.getItem('veridia_db'));if(_cd&&_cd.chatDB)chatDB=_cd.chatDB}catch(e){console.warn('[Veridia]',e.message||e)}

function getMsgBadge(){return Object.values(chatDB).reduce((s,c)=>s+c.unread,0)}

function rMensajes(){
  var totalUnread=getMsgBadge();
  var chatsActivos=Object.entries(chatDB).filter(([pid,c])=>c.enabled).map(([pid,c])=>({pid:+pid,chat:c,patient:gP(+pid)})).filter(x=>x.patient);
  var chatsInactivos=Object.entries(chatDB).filter(([pid,c])=>!c.enabled).map(([pid,c])=>({pid:+pid,chat:c,patient:gP(+pid)})).filter(x=>x.patient);

  $('mainContent').innerHTML=`<div class="fade-in">
<!-- Hero -->
<div class="card" style="border:none;background:linear-gradient(135deg,#0E7490 0%,#0891B2 50%,#22D3EE 100%);color:#fff;margin-bottom:22px;border-radius:var(--radius);overflow:hidden;position:relative"><div style="position:absolute;top:-30px;right:-20px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.04)"></div><div class="card-body" style="padding:22px 28px;position:relative;z-index:1"><div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">💬<div><h2 style="margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.3px">Mensajería</h2><p style="margin:0;font-size:.78rem;opacity:.75">${chatsActivos.length} chats activos · ${totalUnread} sin leer</p></div></div></div></div>

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px">
  <div class="card" style="padding:16px;text-align:center;border-top:3px solid ${totalUnread>0?'#dc2626':'#16a34a'}"><div style="font-size:1.5rem;font-weight:800;color:${totalUnread>0?'#dc2626':'#16a34a'}">${totalUnread}</div><div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Sin leer</div></div>
  <div class="card" style="padding:16px;text-align:center;border-top:3px solid var(--primary)"><div style="font-size:1.5rem;font-weight:800;color:var(--primary)">${chatsActivos.length}</div><div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Chats activos</div></div>
  <div class="card" style="padding:16px;text-align:center;border-top:3px solid var(--text3)"><div style="font-size:1.5rem;font-weight:800;color:var(--text3)">${chatsInactivos.length}</div><div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);font-weight:600;margin-top:2px">Desactivados</div></div>
</div>

<div style="display:grid;grid-template-columns:280px 1fr;gap:16px;height:calc(100vh - 240px);min-height:400px">
  <!-- Inbox -->
  <div class="card" style="display:flex;flex-direction:column;overflow:hidden">
    <div class="card-header" style="flex-shrink:0"><span class="card-title" style="font-size:.85rem">📧 Bandeja</span></div><div style="padding:6px 10px;border-bottom:1px solid var(--border)"><input type="text" placeholder="🔍 Buscar..." style="width:100%;padding:5px 10px;border:1px solid var(--border);border-radius:6px;font-size:.78rem" onkeyup="if(event.key==='Enter'){var r=searchChat(this.value);if(r&&r.length){openChat(r[0].patId)}else{toast('Sin resultados','info')}}"></div>
    <div style="flex:1;overflow-y:auto" id="msgInbox">
      ${chatsActivos.length?chatsActivos.sort((a,b)=>b.chat.unread-a.chat.unread).map(x=>{
        var lastMsg=x.chat.messages.length?x.chat.messages[x.chat.messages.length-1]:null;
        return `<div style="padding:12px 16px;border-bottom:1px solid var(--border);cursor:pointer;transition:var(--spring);display:flex;gap:10px;align-items:center;${x.chat.unread?'background:var(--primary-light)':''}" onclick="openChat(${x.pid})" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background='${x.chat.unread?'var(--primary-light)':''}'" id="inbox_${x.pid}">
          <div class="avatar avatar-sm" style="background:${aCol(x.pid)};color:#fff;flex-shrink:0">${ini(x.patient.nombre,x.patient.apellidos)}</div>
          <div style="flex:1;overflow:hidden">
            <div style="display:flex;justify-content:space-between;align-items:center"><strong style="font-size:.82rem">${x.patient.nombre} ${x.patient.apellidos}</strong>${x.chat.unread?`<span class="badge badge-primary" style="font-size:.58rem">${x.chat.unread}</span>`:''}</div>
            <div style="font-size:.72rem;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">${lastMsg?lastMsg.text.substring(0,40)+'...':'Sin mensajes'}</div>
          </div>
        </div>`;
      }).join(''):'<div style="padding:20px;text-align:center;color:var(--text3);font-size:.82rem">Sin chats activos</div>'}
      ${chatsInactivos.length?`<div style="padding:8px 16px;font-size:.65rem;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;font-weight:600;border-bottom:1px solid var(--border);background:var(--surface2)">Desactivados</div>`+chatsInactivos.map(x=>`<div style="padding:10px 16px;border-bottom:1px solid var(--border);opacity:.5;font-size:.78rem;display:flex;align-items:center;gap:8px"><span>${x.patient.nombre} ${x.patient.apellidos}</span><span class="badge badge-neutral" style="font-size:.55rem">OFF</span></div>`).join(''):''}
    </div>
  </div>

  <!-- Chat area -->
  <div class="card" style="display:flex;flex-direction:column;overflow:hidden" id="msgChatArea">
    <div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--text3)">
      <div style="text-align:center"><div style="font-size:2rem;margin-bottom:8px;opacity:.3">💬</div><p style="font-size:.82rem">Seleccioná un paciente para abrir el chat</p></div>
    </div>
  </div>
</div>
</div>`;

  // Sync badge in nav
  syncMsgBadge();
}

function openChat(patId){
  // Wire: show typing indicator briefly on open
  setTimeout(function(){if(typeof showTypingIndicator==="function")showTypingIndicator(patId)},1000);
  var ch=chatDB[patId];if(!ch)return;
  var p=gP(patId);if(!p)return;

  // Mark all as read
  ch.messages.forEach(m=>{if(m.from==='patient')m.read=true});
  ch.unread=0;
  syncMsgBadge();

  // Update inbox highlighting
  document.querySelectorAll('[id^="inbox_"]').forEach(el=>{el.style.background='';el.querySelector('.badge')?.remove()});

  var chatArea=$('msgChatArea');
  chatArea.innerHTML=`
  <div class="card-header" style="flex-shrink:0;gap:10px">
    <div style="display:flex;align-items:center;gap:10px">
      <div class="avatar avatar-sm" style="background:${aCol(patId)};color:#fff">${ini(p.nombre,p.apellidos)}</div>
      <div><strong style="font-size:.88rem">${p.nombre} ${p.apellidos}</strong><div style="font-size:.68rem;color:var(--text3)">Paciente · ${p.telefono||''}</div></div>
    </div>
    <div style="display:flex;gap:6px;align-items:center">
      <span class="badge ${ch.enabled?'badge-success':'badge-neutral'}">${ch.enabled?'Chat activo':'Desactivado'}</span>
      <button class="btn btn-outline btn-xs" onclick="selPat=${patId};navigate('historia')" title="Ver ficha">${IC.eye} Ficha</button>
    </div>
  </div>
  <div style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px" id="chatMsgArea">
    ${ch.messages.map(m=>`<div style="display:flex;gap:8px;${m.from==='nutri'?'flex-direction:row-reverse;align-self:flex-end':'align-self:flex-start'};max-width:75%">
      <div class="avatar avatar-sm" style="background:${m.from==='nutri'?'var(--primary)':aCol(patId)};color:#fff;flex-shrink:0">${m.from==='nutri'?'AC':ini(p.nombre,p.apellidos)}</div>
      <div><div style="padding:10px 14px;border-radius:${m.from==='nutri'?'14px 4px 14px 14px':'4px 14px 14px 14px'};background:${m.from==='nutri'?'var(--primary)':'var(--surface2)'};color:${m.from==='nutri'?'#fff':'var(--text)'};font-size:.82rem;line-height:1.5">${m.text}</div>
      <div style="font-size:.58rem;color:var(--text3);margin-top:3px;${m.from==='nutri'?'text-align:right':''}">${m.time}</div></div>
    </div>`).join('')}
  </div>
  ${ch.enabled?`<div style="padding:12px;border-top:1px solid var(--border);display:flex;gap:8px;flex-shrink:0">
    <input type="text" id="nutriMsg" placeholder="Escribí tu respuesta..." style="flex:1" onkeyup="if(event.key==='Enter')sendNutriMsg(${patId})">
    <button class="btn btn-primary btn-sm" onclick="sendNutriMsg(${patId})">${IC.send}</button>
  </div>`:`<div style="padding:14px;border-top:1px solid var(--border);text-align:center;color:var(--text3);font-size:.78rem;background:var(--surface2)">✕ Chat desactivado para este paciente. <a href="#" onclick="event.preventDefault();toggleChat(${patId},true)">Activar</a></div>`}`;

  // Scroll to bottom
  setTimeout(()=>{var a=$('chatMsgArea');if(a)a.scrollTop=a.scrollHeight},50);
}

function sendNutriMsg(patId){
  var input=$('nutriMsg');if(!input)return;
  var text=input.value.trim();if(!text)return;
  input.value='';
  if(!chatDB[patId])chatDB[patId]={enabled:true,messages:[],unread:0};
  chatDB[patId].messages.push({from:'nutri',text:sanitize(text),time:new Date().toLocaleString('es',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}),read:true});
  // Save to localStorage for portal sync
  saveChatToStorage();
  openChat(patId);
  var _np=gP(patId);if(_np&&typeof notifyNewMessage==='function')notifyNewMessage(_np.nombre+' '+_np.apellidos);
  toast('Mensaje enviado');
}

function toggleChat(patId,enable){
  if(!chatDB[patId])chatDB[patId]={enabled:false,messages:[],unread:0};
  chatDB[patId].enabled=enable;
  toast(enable?'Chat activado para este paciente':'Chat desactivado — el paciente no puede escribir',enable?'success':'warning');
  if(curMod==='mensajes')rMensajes();
  saveChatToStorage();
}

function syncMsgBadge(){
  var total=getMsgBadge();
  // Update nav badge for mensajes
  var navItems=document.querySelectorAll('.nav-item');
  navItems.forEach(ni=>{
    if(ni.textContent.includes('Mensajes')){
      var existing=ni.querySelector('.nav-badge');
      if(existing)existing.remove();
      if(total>0){var b=document.createElement('span');b.className='nav-badge';b.textContent=total;ni.appendChild(b)}
    }
  });
  // Update alert dot
  var dot=$('alertDot');
  if(dot)dot.style.display=(total>0||DB.alerts.filter(a=>a.estado==='pendiente').length>0)?'block':'none';
}

// saveChatToStorage() y loadChatFromStorage() definidas en auth.js (con secureStore)

// Load on init (defer until auth.js is loaded)
setTimeout(function(){if(typeof loadChatFromStorage==='function')loadChatFromStorage()},0);
// Poll for new messages from patient portal every 3 seconds
setInterval(function(){
  try{
    var d=localStorage.getItem('veridia_chats');
    if(d){
      var parsed=JSON.parse(d);
      var hadNew=false;
      Object.entries(parsed).forEach(function([pid,ch]){
        if(chatDB[pid]&&ch.messages.length>chatDB[pid].messages.length){
          // New messages from patient
          var newMsgs=ch.messages.slice(chatDB[pid].messages.length);
          newMsgs.forEach(function(m){if(m.from==='patient'&&!m.read){chatDB[pid].unread++;hadNew=true}});
          chatDB[pid].messages=ch.messages;
        }
      });
      if(hadNew){syncMsgBadge();if(curMod==='mensajes')rMensajes();toast('💬 Nuevo mensaje de paciente','info')}
    }
  }catch(e){console.warn('[Veridia]',e.message||e)}
},3000);

// ===== AUTO-RECORDATORIO DE CITAS (24h antes) =====
function checkAppointmentReminders(){
  var tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);
  var tStr=tomorrow.toISOString().slice(0,10);
  var upcoming=DB.appointments.filter(function(a){return a.fecha===tStr&&(a.estado==='Pendiente'||a.estado==='Confirmada')});
  upcoming.forEach(function(a){
    var p=gP(a.pacienteId);if(!p)return;
    // Check if reminder already sent
    var key='reminder_'+a.id;
    if(a._reminderSent)return;
    // Auto-create message in chat
    if(!chatDB[a.pacienteId])chatDB[a.pacienteId]={enabled:true,messages:[],unread:0};
    var msg='📅 Recordatorio: Tiene cita mañana '+a.fecha+' a las '+a.hora+' ('+( a.asunto||a.tipo)+'). Por favor confirme su asistencia.';
    chatDB[a.pacienteId].messages.push({from:'nutri',text:msg,time:new Date().toLocaleString('es',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}),read:true,auto:true});
    a._reminderSent=true;
    saveChatToStorage();
  });
  if(upcoming.length)syncMsgBadge();
}
// Run check every 30 min
setInterval(checkAppointmentReminders,1800000);
// Also run on login (after 3s)
setTimeout(checkAppointmentReminders,3000);

// #56 Plantillas de mensajes rápidos
var MSG_TEMPLATES=[
  {l:'📅 Recordar cita',t:'Hola! Le recordamos su cita de mañana. Por favor confirme su asistencia. Gracias!'},
  {l:'📋 Traer analíticas',t:'Recuerde traer los resultados de su última analítica de sangre a la próxima consulta.'},
  {l:'✅ Plan enviado',t:'Le hemos enviado su plan alimentario actualizado. Revíselo y consúltenos cualquier duda.'},
  {l:'⚖️'+' Control peso',t:'Es momento de su control de peso semanal. Registre su peso en el Portal del Paciente.'},
  {l:'🍽️'+' Seguimiento',t:'¿Cómo va con el plan? Cuéntenos si ha tenido dificultades para seguir las indicaciones.'},
  {l:'💊 Suplementación',t:'Recuerde tomar su suplementación según las indicaciones: '}
];

function showMsgTemplates(patId){
  var html='<div style="display:flex;flex-direction:column;gap:4px">';
  MSG_TEMPLATES.forEach(function(t){
    html+='<button class="btn btn-outline btn-xs" style="text-align:left" onclick="useMsgTemplate('+patId+',\''+t.t.replace(/'/g,"\\'")+'\')">'+t.l+'</button>';
  });
  html+='</div>';
  var inp=$('msgInput');
  if(inp){
    var div=document.createElement('div');div.id='msgTemplates';div.style.cssText='position:absolute;bottom:50px;right:10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-xs);padding:8px;box-shadow:var(--shadow);z-index:10;max-width:300px';
    div.innerHTML=html;
    inp.parentNode.style.position='relative';
    var existing=$('msgTemplates');if(existing)existing.remove();
    inp.parentNode.appendChild(div);
  }
}

function useMsgTemplate(patId,text){
  var inp=$('msgInput');if(inp)inp.value=text;
  var tpl=$('msgTemplates');if(tpl)tpl.remove();
}

// M3: Search in chat history
function searchChat(query){
  if(!query||query.length<2)return;
  var q=query.toLowerCase();
  var results=[];
  DB.patients.filter(function(p){return p.activo}).forEach(function(p){
    var key='chat_'+p.id;
    var chat=typeof chatDB!=='undefined'?chatDB[key]:null;
    if(!chat)return;
    (chat.messages||[]).forEach(function(m){
      if((m.text||'').toLowerCase().includes(q)){
        results.push({patId:p.id,patName:sanitize(p.nombre)+' '+sanitize(p.apellidos),text:m.text,date:m.date,from:m.from});
      }
    });
  });
  return results;
}

// M1: Visual notification for new message
function notifyNewMessage(patName){
  var notif=document.createElement('div');
  notif.style.cssText='position:fixed;top:80px;right:20px;background:var(--primary);color:#fff;padding:12px 20px;border-radius:12px;font-size:.85rem;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.2);cursor:pointer;animation:fadeSlideIn .3s ease-out';
  notif.innerHTML='💬 Nuevo mensaje de <strong>'+patName+'</strong>';
  notif.onclick=function(){notif.remove();navigate('mensajes')};
  document.body.appendChild(notif);
  setTimeout(function(){notif.style.opacity='0';notif.style.transition='opacity .4s';setTimeout(function(){notif.remove()},500)},5000);
}

// M2: Typing indicator (UI ready — backend real-time needed)
function showTypingIndicator(patId){
  var el=document.getElementById('typingIndicator_'+patId);
  if(!el){el=document.createElement('div');el.id='typingIndicator_'+patId;
    el.style.cssText='font-size:.72rem;color:var(--text3);padding:4px 12px;font-style:italic';
    el.textContent='escribiendo...';
    var chat=document.getElementById('chatBody');if(chat)chat.appendChild(el)}
  clearTimeout(el._t);el._t=setTimeout(function(){el.remove()},3000);
}
