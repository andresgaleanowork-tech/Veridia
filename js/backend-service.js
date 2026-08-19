// ═══════════════════════════════════════════
//  VERIDIA — BackendService
//  API REST abstraction layer
//  localStorage offline fallback
// ═══════════════════════════════════════════

var BackendService=(function(){
  var BASE='';
  var token=null;
  var refreshToken=null;
  var _online=false;

  // Auto-detect backend URL
  (function(){
    try{
      var loc=window.location;
      if(loc.port==='3457'||loc.port==='3456'){
        BASE=loc.origin;
        _online=true;
        console.debug('🔗 Backend detected:',BASE);
      }
    }catch(e){}
  })();

  function headers(){
    var h={'Content-Type':'application/json'};
    if(token)h['Authorization']='Bearer '+token;
    return h;
  }

  function api(method,path,body){
    if(!_online)return Promise.reject('offline');
    var opts={method:method,headers:headers()};
    if(body)opts.body=JSON.stringify(body);
    return fetch(BASE+'/api'+path,opts).then(function(r){
      if(r.status===401&&path!=='/auth/login'){
        // Token expired — try refresh
        return refreshToken_().then(function(){return api(method,path,body)});
      }
      return r.json().then(function(d){
        if(!r.ok)throw new Error(d.error||d.message||'API error');
        return d;
      });
    });
  }

  function refreshToken_(){
    if(!refreshToken)return Promise.reject('no refresh token');
    return fetch(BASE+'/api/auth/refresh',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({refreshToken:refreshToken})
    }).then(function(r){return r.json()}).then(function(d){
      if(d.token){token=d.token;saveTokens();return d}
      throw new Error('Refresh failed');
    }).catch(function(){
      token=null;refreshToken=null;clearTokens();
      throw new Error('Session expired');
    });
  }

  function saveTokens(){
    try{
      localStorage.setItem('veridia_auth_token',token||'');
      localStorage.setItem('veridia_refresh_token',refreshToken||'');
    }catch(e){}
  }
  function loadTokens(){
    try{
      token=localStorage.getItem('veridia_auth_token')||null;
      refreshToken=localStorage.getItem('veridia_refresh_token')||null;
    }catch(e){}
  }
  function clearTokens(){
    try{
      localStorage.removeItem('veridia_auth_token');
      localStorage.removeItem('veridia_refresh_token');
    }catch(e){}
  }

  // Load tokens on init
  loadTokens();

  return{
    isOnline:function(){return _online&&!!token},

    // === AUTH ===
    login:function(email,password){
      return api('POST','/auth/login',{email:email,password:password}).then(function(d){
        token=d.token;refreshToken=d.refreshToken;saveTokens();
        return d.user;
      });
    },
    logout:function(){token=null;refreshToken=null;clearTokens()},
    getMe:function(){return api('GET','/auth/me')},
    changePassword:function(current,newPw){return api('PUT','/auth/password',{currentPassword:current,newPassword:newPw})},

    // === PATIENTS ===
    getPatients:function(params){
      params=params||{};
      var q='?page='+(params.page||1)+'&limit='+(params.limit||50);
      if(params.activo!==undefined)q+='&activo='+params.activo;
      if(params.search)q+='&search='+encodeURIComponent(params.search);
      return api('GET','/patients'+q);
    },
    getPatient:function(id){return api('GET','/patients/'+id)},
    getPatientFull:function(id){return api('GET','/patients/'+id+'/full')},
    createPatient:function(data){return api('POST','/patients',data)},
    updatePatient:function(id,data){return api('PUT','/patients/'+id,data)},

    // === CLINICAL ===
    createAntropometria:function(data){return api('POST','/clinical/antropometria',data)},
    getAntropometrias:function(pid){return api('GET','/clinical/antropometria/'+pid)},
    createAnalitica:function(data){return api('POST','/clinical/analitica',data)},
    calculateFormula:function(data){return api('POST','/clinical/formula',data)},
    getAlerts:function(pid){return api('GET','/clinical/alerts/'+pid)},
    reviewAlert:function(id){return api('PUT','/clinical/alerts/'+id+'/review')},

    // === FOODS ===
    searchOFF:function(q){return api('GET','/foods/off/search?q='+encodeURIComponent(q))},
    searchUSDA:function(q){return api('GET','/foods/usda/search?q='+encodeURIComponent(q))},
    getOFFProduct:function(code){return api('GET','/foods/off/product/'+code)},

    // === SYNC ===
    syncToCloud:function(db){
      if(!_online||!token)return Promise.resolve(false);
      // Future: batch upload local data to backend
      return Promise.resolve(true);
    },
    loadFromCloud:function(){
      if(!_online||!token)return Promise.resolve(null);
      return api('GET','/patients?limit=500').then(function(d){return d.data});
    },

    // === TOKEN MANAGEMENT ===
    hasToken:function(){return!!token},
    getToken:function(){return token}
  };
})();
