// ===== ESPEN GUIDELINES ENGINE — Clinical Nutrition Decision Support =====
// Source: ESPEN Scientific Guidelines 2019-2025 (European Society for Clinical Nutrition and Metabolism)
// Clinical Nutrition Journal — Open Access
// Codification: Veridia HealthTech 2026

// ============================================================
// FASE 1: BASE DE CONOCIMIENTO ESPEN
// ============================================================

// --- ESPEN Micronutrient × Disease Matrix (Clin Nutr 2022;41:1357-1424) ---
var ESPEN_MICROS = {
  'Alcoholismo':         {causa:[],empeora:['B1','Fe'],resultado:['A','D','E','K','B1','B2','B6','B7','B9','B12','C','Zn']},
  'Hepatitis alcohólica':{causa:['B6','Zn'],empeora:['Fe','Zn'],resultado:[]},
  'Anemia':              {causa:['B1','B6','B9','B12','Fe','Cu','Co'],empeora:[],resultado:[]},
  'Caquexia oncológica': {causa:['D','Zn'],empeora:[],resultado:[]},
  'Cardiopatía/IC':      {causa:['B1','B6','D','Se','Fe'],empeora:['Se'],resultado:[]},
  'EPOC':                {causa:['D','Cu','Se','Mn','Zn'],empeora:[],resultado:[]},
  'Fallo intestinal':    {causa:[],empeora:[],resultado:['B2','B7','B9','B12','A','D','E','K','Cu','Fe','Zn']},
  'Gastritis atrófica':  {causa:[],empeora:[],resultado:['B9','B12','C','D','Fe']},
  'Diabetes mellitus':   {causa:['B9','Cr'],empeora:[],resultado:[]},
  'EII (Crohn/CU)':      {causa:[],empeora:['Zn'],resultado:['B1','B6','B12','A','D','E','K','Fe','Se','Zn']},
  'NAFLD':               {causa:['Cu'],empeora:[],resultado:[]},
  'Hepatopatías':        {causa:[],empeora:['Zn'],resultado:['B12','A','D','E','Se','Zn']},
  'Esclerosis múltiple': {causa:['B7'],empeora:[],resultado:[]},
  'Obesidad':            {causa:['β-caroteno','E','Se','Zn'],empeora:['B1','B9','D','Fe','Se','Zn'],resultado:[]},
  'Post-bariátrica':     {causa:[],empeora:[],resultado:['A','D','E','K','B1','B9','B12','C','Cu','Zn','Fe']},
  'Osteoporosis':        {causa:['B12','D','K','Cu','Fe','Zn','Mn','F','Bo'],empeora:[],resultado:[]},
  'ERC':                 {causa:[],empeora:[],resultado:['B1','B6','B9','K','D','Cu','Se','Zn']},
  'Sarcopenia':          {causa:['B1','B12','D','Zn','carnitina'],empeora:['D','Se','Zn'],resultado:[]},
  'Enfermedad crítica':  {causa:[],empeora:['B1','C','D','Cu','Fe','Se','Zn'],resultado:['B1','B12','Cr','D','Fe','Se','Zn']},
  'Pancreatitis':        {causa:[],empeora:['Se'],resultado:['A','D','E','K','B12','Zn']},
  'Cáncer':              {causa:['D','Se'],empeora:['D','Zn','Se'],resultado:['B1','B6','B9','D','Fe','Zn']},
  'Embarazo':            {causa:[],empeora:['B9','Fe','I','D'],resultado:[]},
  'Cirugía mayor':       {causa:[],empeora:['D','Fe','Zn','Se'],resultado:['B1','C','D','Fe','Zn']}
};

// --- ESPEN Nutritional Requirements by Condition ---
var ESPEN_REQS = {
  // Cirugía (Update 2025, Clin Nutr 53:222-261)
  cirugia:{
    name:'Nutrición perioperatoria',ref:'ESPEN Surgery 2025',
    energy:{min:25,max:30,unit:'kcal/kg/día',note:'25-30 kcal/kg/día (peso ajustado si obesidad)'},
    protein:{min:1.2,max:1.5,unit:'g/kg/día',note:'Aumentar a 1.5-2.0 en cirugía mayor oncológica'},
    carbs:{pct:{min:40,max:55}},fat:{pct:{min:25,max:35}},
    fiber:{min:25,note:'Si tolerancia GI'},
    specific:['Inmuno-nutrición 5-7 días pre-Qx (arginina+omega-3+nucleótidos)','ONS hipercalórico preoperatorio si riesgo','Evitar ayuno >6h sólidos, >2h líquidos claros','Alimentación oral precoz postoperatoria (POD 0-1)','EPA+DHA 2g/día perioperatorio en cáncer'],
    screen:'NRS-2002',glim:true,grade:'A'
  },
  // Geriatría (2019, Clin Nutr 38:10-47)
  geriatria:{
    name:'Nutrición geriátrica',ref:'ESPEN Geriatrics 2019',
    energy:{min:30,max:35,unit:'kcal/kg/día',note:'30 kcal/kg/día; ajustar según actividad'},
    protein:{min:1.0,max:1.2,unit:'g/kg/día',note:'≥1.0 para prevenir sarcopenia; 1.2-1.5 si malnutrido'},
    carbs:{pct:{min:45,max:60}},fat:{pct:{min:25,max:35}},
    fiber:{min:25,note:'Con hidratación adecuada'},
    specific:['Screening con MNA-SF en todos los >65 años','ONS ≥400kcal + ≥30g proteína/día si desnutrición','Vitamina D 800-1000 UI/día universal >65a','Leucina 2.5-2.8g por comida para síntesis muscular','Evitar restricciones dietéticas innecesarias','30 mL/kg/día de líquidos (mínimo 1.5L)','Textura adaptada si disfagia (IDDSI)'],
    screen:'MNA-SF',glim:true,grade:'A'
  },
  // Enfermedad renal (2021, Clin Nutr 40:1644-1668)
  renal:{
    name:'Nutrición en enfermedad renal',ref:'ESPEN Kidney 2021',
    energy:{min:25,max:35,unit:'kcal/kg/día',note:'25-35 kcal/kg/día según estadio y actividad'},
    protein:{min:0.6,max:0.8,unit:'g/kg/día',note:'ERC sin diálisis: 0.6-0.8; Diálisis: 1.0-1.2; HD: 1.2-1.4'},
    carbs:{pct:{min:50,max:60}},fat:{pct:{min:25,max:35}},
    fiber:{min:25,note:'Preferir fuentes con bajo K'},
    specific:['ERC 3-5 sin diálisis: 0.6-0.8g prot/kg/día con suplemento cetoanálogos','HD: 1.2g prot/kg/día mínimo','DPCA: 1.2-1.4g prot/kg/día','Sodio <2.3g/día (5g sal)','Potasio: según niveles séricos (individualizar)','Fósforo: 800-1000mg/día en ERC 3-5','Suplementar Vit D (25-OH <30ng/mL)','Hierro IV si ferritina <200 en HD'],
    screen:'NRS-2002',glim:true,grade:'A'
  },
  // EII (2023, Clin Nutr 42:352-379)
  eii:{
    name:'Nutrición en EII',ref:'ESPEN IBD 2023',
    energy:{min:25,max:35,unit:'kcal/kg/día',note:'Según estado nutricional y actividad de enfermedad'},
    protein:{min:1.0,max:1.5,unit:'g/kg/día',note:'1.2-1.5 en brote activo'},
    carbs:{pct:{min:40,max:55}},fat:{pct:{min:25,max:35}},
    fiber:{min:15,note:'Reducir en estenosis; aumentar en remisión'},
    specific:['NE exclusiva como primera línea en Crohn pediátrico (grado A)','Suplementar Fe IV si anemia + intolerancia oral','Vitamina D: mantener >30ng/mL','Zinc, B12, ácido fólico: monitorizar y suplementar','Dietas de exclusión (CDED) en Crohn como alternativa a NE','Evitar dietas restrictivas innecesarias en remisión','ONS si ingesta <60% de requerimientos >7 días','Omega-3: no evidencia suficiente para mantenimiento'],
    screen:'NRS-2002',glim:true,grade:'A'
  },
  // Enfermedad hepática (2019, Clin Nutr 38:485-521)
  hepatica:{
    name:'Nutrición en hepatopatía',ref:'ESPEN Liver 2019',
    energy:{min:30,max:35,unit:'kcal/kg/día',note:'35 kcal/kg si cirrosis descompensada'},
    protein:{min:1.2,max:1.5,unit:'g/kg/día',note:'1.2-1.5 incluso en encefalopatía; no restringir'},
    carbs:{pct:{min:45,max:65}},fat:{pct:{min:20,max:30}},
    fiber:{min:25,note:'Lactulosa como fibra + prebiótico'},
    specific:['NO restringir proteínas en encefalopatía (grado A)','BCAA si intolerancia a proteínas convencionales','Snack nocturno de 200kcal rico en HC (previene catabolismo)','Sodio <2g/día si ascitis','Fraccionamiento: 4-6 comidas/día','Suplementar Zn si deficiencia (mejora encefalopatía)','NAFLD: déficit calórico 500-1000kcal/día + ejercicio','Evitar alcohol absolutamente'],
    screen:'NRS-2002',glim:true,grade:'A'
  },
  // UCI (2019, Clin Nutr 38:48-79)
  uci:{
    name:'Nutrición en UCI',ref:'ESPEN ICU 2019',
    energy:{min:20,max:25,unit:'kcal/kg/día',note:'Fase aguda: inicio progresivo; 70-100% a día 3-7'},
    protein:{min:1.3,max:1.5,unit:'g/kg/día',note:'Iniciar temprano; hasta 2.0-2.5 en quemados'},
    carbs:{pct:{min:30,max:50}},fat:{pct:{min:30,max:50,note:'Mayor % grasa para reducir CO2 si VM'}},
    fiber:{min:0,note:'Según tolerancia GI'},
    specific:['Calorimetría indirecta como gold standard (grado A)','Nutrición enteral precoz (<48h de ingreso)','Trofismo enteral si inestabilidad hemodinámica','Glutamina IV no recomendada de rutina','Omega-3 parenteral: considerar en sepsis','Tiamina IV empírica en riesgo de síndrome de realimentación','No sobrealimentar: síndrome de realimentación','Selenio: considerar en sepsis/SIRS'],
    screen:'NRS-2002',glim:true,grade:'A'
  },
  // Pancreatitis (2020, Clin Nutr 39:612-631)
  pancreatitis:{
    name:'Nutrición en pancreatitis',ref:'ESPEN Pancreatitis 2020',
    energy:{min:25,max:30,unit:'kcal/kg/día'},
    protein:{min:1.2,max:1.5,unit:'g/kg/día'},
    carbs:{pct:{min:40,max:55}},fat:{pct:{min:20,max:30}},
    fiber:{min:15,note:'Según tolerancia'},
    specific:['Pancreatitis leve: dieta oral precoz (no esperar resolución dolor)','Pancreatitis severa: NE por sonda nasoyeyunal <72h','Dieta baja en grasas inicialmente','Enzimas pancreáticas si insuficiencia exocrina','Triglicéridos de cadena media (MCT) si esteatorrea','Monitorizar vitaminas liposolubles (A, D, E, K)'],
    screen:'NRS-2002',grade:'B'
  },
  // Obesidad con comorbilidades GI/hepáticas (2022)
  obesidad:{
    name:'Obesidad con comorbilidades',ref:'ESPEN-UEG Obesity 2022',
    energy:{min:20,max:25,unit:'kcal/kg peso ajustado',note:'Déficit 500-1000kcal/día'},
    protein:{min:1.2,max:1.5,unit:'g/kg peso ideal',note:'Preservar masa muscular'},
    carbs:{pct:{min:40,max:50}},fat:{pct:{min:25,max:35}},
    fiber:{min:30,note:'≥30g/día para saciedad'},
    specific:['Peso ajustado = PI + 0.25×(peso real - PI)','Dieta mediterránea como patrón preferido','Post-bariátrica: suplementar A, D, E, K, B1, B9, B12, Fe, Cu, Zn','MNA en obesos geriátricos (malnutrición oculta)','Ejercicio: 150-300 min/semana de actividad moderada','VLCD solo bajo supervisión médica (<800kcal)'],
    screen:'NRS-2002',glim:true,grade:'A'
  },
  // Polimórbidos (2023, Clin Nutr 42:1545-1568)
  polimorbido:{
    name:'Polimórbidos hospitalizados',ref:'ESPEN Polymorbid 2023',
    energy:{min:27,max:30,unit:'kcal/kg/día'},
    protein:{min:1.0,max:1.2,unit:'g/kg/día',note:'Ajustar según función renal'},
    carbs:{pct:{min:45,max:55}},fat:{pct:{min:25,max:35}},
    fiber:{min:25,note:'Si tolerancia GI'},
    specific:['Screening nutricional en <48h del ingreso','Plan individualizado de nutrición a los 48-72h','ONS si ingesta <75% durante >3 días','Revisión del plan nutricional c/5-7 días','Suplementar vitamina D si <30ng/mL','Evitar restricciones dietéticas sin indicación clara'],
    screen:'NRS-2002',glim:true,grade:'A'
  },
  // Micronutrientes general (2022, Clin Nutr 41:1357-1424)
  micronutrientes:{
    name:'Micronutrientes',ref:'ESPEN Micronutrient 2022',
    specific:['Monitorizar: Fe, Zn, Se, Cu, Mn, Cr, I, Mo, F','Vitaminas liposolubles: A, D, E, K (malabsorción)','Vitaminas hidrosolubles: B1, B2, B6, B7, B9, B12, C','B1 (tiamina): SIEMPRE antes de glucosa IV','Vitamina D: objetivo sérico >30ng/mL (75nmol/L)','Selenio: 60-75μg/día (100μg si enfermedad crítica)','Zinc: 10-15mg/día (25-50mg si malabsorción)','Hierro: preferir IV si inflamación activa (hepcidina↑)'],
    grade:'A'
  },
  // Cáncer (basado en ESPEN Cancer recommendations)
  cancer:{
    name:'Nutrición oncológica',ref:'ESPEN Cancer Guidelines',
    energy:{min:25,max:30,unit:'kcal/kg/día',note:'30-35 si caquexia'},
    protein:{min:1.2,max:2.0,unit:'g/kg/día',note:'1.5 objetivo mínimo'},
    carbs:{pct:{min:35,max:50}},fat:{pct:{min:30,max:45}},
    fiber:{min:20,note:'Según tolerancia GI'},
    specific:['Screening al diagnóstico y en cada ciclo de QT/RT','EPA+DHA 2g/día (efecto anticaquéctico)','ONS hipercalórico e hiperproteico','BCAA si caquexia severa','Evitar dietas restrictivas sin evidencia (alcalina, cetogénica, etc.)','Micronutrientes: D, Se, Zn por riesgo de déficit','Ejercicio de resistencia para preservar masa muscular','Probióticos en diarrea por QT/RT (evaluar caso a caso)'],
    screen:'NRS-2002',glim:true,grade:'A'
  }
};

// ============================================================
// FASE 2: MICRONUTRIENTES INTELIGENTES
// ============================================================

// Dosis de suplementación ESPEN recomendadas (por micronutriente)
var ESPEN_SUPPL = {
  'A':    {name:'Vitamina A',dose:'700-900μg/día',risk:'Hepatotoxicidad en exceso'},
  'D':    {name:'Vitamina D',dose:'800-2000 UI/día (20-50μg)',risk:'Hipercalcemia si >4000UI/día sin control',target:'25-OH >30ng/mL'},
  'E':    {name:'Vitamina E',dose:'15mg/día α-tocoferol',risk:'Anticoagulante en dosis altas'},
  'K':    {name:'Vitamina K',dose:'90-120μg/día',risk:'Interacción con anticoagulantes orales'},
  'B1':   {name:'Tiamina',dose:'100-300mg/día IV si riesgo reali.',risk:'SIEMPRE antes de glucosa IV'},
  'B2':   {name:'Riboflavina',dose:'1.1-1.3mg/día',risk:'Baja toxicidad'},
  'B6':   {name:'Piridoxina',dose:'1.3-2mg/día',risk:'Neuropatía si >100mg/día crónico'},
  'B7':   {name:'Biotina',dose:'30-60μg/día',risk:'Interfiere con análisis de troponina'},
  'B9':   {name:'Ácido fólico',dose:'400μg/día (800μg embarazo)',risk:'Enmascara déficit B12'},
  'B12':  {name:'Vitamina B12',dose:'2.4μg/día (1000μg IM si déficit)',risk:'Baja toxicidad'},
  'C':    {name:'Vitamina C',dose:'100-200mg/día',risk:'Oxalatos si >1g/día en ERC'},
  'Fe':   {name:'Hierro',dose:'Fe IV si inflamación activa; oral 100-200mg/día',risk:'GI adversos orales; hemosiderosis'},
  'Zn':   {name:'Zinc',dose:'10-25mg/día (50mg si malabsorción)',risk:'Interfiere absorción Cu si >50mg'},
  'Se':   {name:'Selenio',dose:'60-100μg/día',risk:'Toxicidad >400μg/día'},
  'Cu':   {name:'Cobre',dose:'0.9-1.5mg/día',risk:'Wilson: contraindicado'},
  'Mn':   {name:'Manganeso',dose:'1.8-2.3mg/día',risk:'Neurotoxicidad en hepatopatía'},
  'Cr':   {name:'Cromo',dose:'25-35μg/día',risk:'Nefrotoxicidad en dosis altas'},
  'I':    {name:'Yodo',dose:'150μg/día (250μg embarazo)',risk:'Tiroiditis en exceso'},
  'Co':   {name:'Cobalto',dose:'Como parte de B12',risk:'Cardiotoxicidad en exceso'},
  'F':    {name:'Flúor',dose:'3-4mg/día',risk:'Fluorosis dental/esquelética'},
  'Bo':   {name:'Boro',dose:'1-3mg/día',risk:'Baja toxicidad'},
  'β-caroteno':{name:'β-caroteno',dose:'3-6mg/día (alimentos)',risk:'Carotenodermia; no suplementar en fumadores'},
  'carnitina':{name:'L-carnitina',dose:'1-2g/día',risk:'GI adversos'},
  'Omega-3':{name:'EPA+DHA',dose:'2g/día combinado',risk:'Anticoagulante en dosis altas'}
};

// Función: obtener perfil de micronutrientes por patologías del paciente
function getESPENMicroProfile(patologias){
  var profile={causa:{},empeora:{},resultado:{},suplementar:[]};
  if(!patologias||!patologias.length) return profile;

  patologias.forEach(function(pat){
    // Buscar en ESPEN_MICROS (coincidencia parcial)
    Object.entries(ESPEN_MICROS).forEach(function(e){
      var key=e[0],data=e[1];
      if(pat.toLowerCase().includes(key.toLowerCase())||key.toLowerCase().includes(pat.toLowerCase().substring(0,6))){
        data.causa.forEach(function(m){profile.causa[m]=(profile.causa[m]||0)+1});
        data.empeora.forEach(function(m){profile.empeora[m]=(profile.empeora[m]||0)+1});
        data.resultado.forEach(function(m){profile.resultado[m]=(profile.resultado[m]||0)+1});
      }
    });
  });

  // Build supplementation list
  var allMicros=new Set([...Object.keys(profile.causa),...Object.keys(profile.empeora),...Object.keys(profile.resultado)]);
  allMicros.forEach(function(m){
    var info=ESPEN_SUPPL[m];
    if(info){
      var priority=(profile.causa[m]||0)*3+(profile.empeora[m]||0)*2+(profile.resultado[m]||0);
      profile.suplementar.push({micro:m,name:info.name,dose:info.dose,risk:info.risk,target:info.target||'',priority:priority,
        reasons:{causa:!!profile.causa[m],empeora:!!profile.empeora[m],resultado:!!profile.resultado[m]}});
    }
  });
  profile.suplementar.sort(function(a,b){return b.priority-a.priority});
  return profile;
}

// Función: obtener requerimientos ESPEN por condición
function getESPENReqs(conditionKey){
  return ESPEN_REQS[conditionKey]||null;
}

// ============================================================
// FASE 3: SCREENING & ALGORITMOS DE DECISIÓN CLÍNICA
// ============================================================

// --- NRS-2002 (Nutritional Risk Screening) ---
function calcNRS2002(patient,antro,enfermedad){
  var score=0;var details=[];
  // Componente nutricional (0-3)
  var imc=antro?antro.imc:0;
  var pesoLoss=0; // % pérdida en 3 meses
  if(antro&&antro.length>=2){var last=antro[0],prev=antro[antro.length>2?antro.length-2:1];if(prev.peso>0)pesoLoss=((prev.peso-last.peso)/prev.peso)*100}
  var ingesta=enfermedad?enfermedad.ingesta||100:100; // % de ingesta habitual

  if(imc<18.5){score+=3;details.push('IMC <18.5: +3')}
  else if(pesoLoss>5){score+=2;details.push('Pérdida peso >5% en 3m: +2')}
  else if(pesoLoss>3||ingesta<75){score+=1;details.push('Pérdida 3-5% o ingesta <75%: +1')}

  // Componente de severidad de enfermedad (0-3)
  var sev=enfermedad?enfermedad.severidad||0:0;
  if(sev>=3){score+=3;details.push('Enfermedad severa (UCI/Qx mayor): +3')}
  else if(sev>=2){score+=2;details.push('Enfermedad moderada: +2')}
  else if(sev>=1){score+=1;details.push('Enfermedad leve: +1')}

  // Edad ≥70: +1
  var edad=patient?age(patient.fechaNacimiento):0;
  if(edad>=70){score+=1;details.push('Edad ≥70: +1')}

  return{
    score:score,
    risk:score>=3?'ALTO':score>=2?'MODERADO':'BAJO',
    action:score>=3?'Iniciar plan nutricional individualizado':score>=2?'Re-evaluar semanalmente':'Screening semanal',
    details:details,
    ref:'NRS-2002 (Kondrup 2003)'
  };
}

// --- GLIM Criteria (Global Leadership Initiative on Malnutrition) ---
function calcGLIM(patient,antros,analiticas){
  var phenotypic=[];var etiologic=[];

  if(!antros||!antros.length) return{diagnosed:false,criteria:[],note:'Datos insuficientes'};

  var last=antros[0];
  var edad=patient?age(patient.fechaNacimiento):0;

  // Phenotypic criteria (need ≥1)
  // 1. Weight loss
  if(antros.length>=2){
    var prev=antros[antros.length>3?antros.length-3:antros.length-1];
    var pctLoss=prev.peso>0?((prev.peso-last.peso)/prev.peso)*100:0;
    if(pctLoss>10) phenotypic.push({c:'Pérdida de peso >10%',severity:'severa'});
    else if(pctLoss>5) phenotypic.push({c:'Pérdida de peso 5-10%',severity:'moderada'});
  }
  // 2. Low BMI
  if(edad>=70&&last.imc<22) phenotypic.push({c:'IMC <22 (≥70 años)',severity:last.imc<20?'severa':'moderada'});
  else if(edad<70&&last.imc<20) phenotypic.push({c:'IMC <20 (<70 años)',severity:last.imc<18.5?'severa':'moderada'});
  // 3. Reduced muscle mass
  if(last.masaMuscular&&last.masaMuscular<(patient&&patient.sexo==='FEMENINO'?20:25))
    phenotypic.push({c:'Masa muscular reducida',severity:'moderada'});

  // Etiologic criteria (need ≥1)
  // 1. Reduced food intake
  etiologic.push({c:'Evaluar ingesta alimentaria (<50% >1 semana)',type:'intake'});
  // 2. Inflammation/disease
  if(analiticas&&analiticas.length){
    var lastAnal=analiticas[0];
    var pcr=lastAnal.marcadores.find(function(m){return m.nombre.toLowerCase().includes('pcr')||m.nombre.toLowerCase().includes('crp')});
    if(pcr&&pcr.valor>5) etiologic.push({c:'PCR elevada ('+pcr.valor+'): inflamación activa',type:'inflammation'});
    var albumin=lastAnal.marcadores.find(function(m){return m.nombre.toLowerCase().includes('albúmina')||m.nombre.toLowerCase().includes('albumin')});
    if(albumin&&albumin.valor<3.5) etiologic.push({c:'Albúmina baja ('+albumin.valor+'): posible inflamación/malnutrición',type:'inflammation'});
  }

  var diagnosed=phenotypic.length>=1&&etiologic.length>=1;
  var severity='moderada';
  if(phenotypic.some(function(p){return p.severity==='severa'})) severity='severa';

  return{
    diagnosed:diagnosed,
    severity:severity,
    phenotypic:phenotypic,
    etiologic:etiologic,
    criteria:phenotypic.concat(etiologic),
    action:diagnosed?(severity==='severa'?'Malnutrición SEVERA — intervención nutricional urgente':'Malnutrición MODERADA — plan nutricional individualizado'):'No cumple criterios GLIM actualmente',
    ref:'GLIM (Cederholm 2019)'
  };
}

// --- MNA-SF (Mini Nutritional Assessment - Short Form) para geriátricos ---
function calcMNASF(patient,antro,datos){
  if(!patient||!antro) return null;
  var edad=age(patient.fechaNacimiento);
  if(edad<65) return null; // Solo para ≥65

  var score=0;var items=[];
  var d=datos||{};

  // A: Ingesta alimentaria (0-2)
  var ing=d.ingesta||'normal';
  if(ing==='normal'){score+=2;items.push('Ingesta normal: 2')}
  else if(ing==='moderada'){score+=1;items.push('Ingesta moderadamente reducida: 1')}
  else{items.push('Ingesta severamente reducida: 0')}

  // B: Pérdida de peso (0-3)
  var wl=d.pesoLoss||'no';
  if(wl==='no'){score+=3;items.push('Sin pérdida peso: 3')}
  else if(wl==='nosabe'){score+=2;items.push('No sabe: 2')}
  else if(wl==='1-3kg'){score+=2;items.push('Pérdida 1-3kg: 2')}
  else{items.push('Pérdida >3kg: 0')}

  // C: Movilidad (0-2)
  var mob=d.movilidad||'independiente';
  if(mob==='independiente'){score+=2;items.push('Movilidad independiente: 2')}
  else if(mob==='limitada'){score+=1;items.push('Movilidad limitada: 1')}
  else{items.push('Cama/sillón: 0')}

  // D: Estrés psicológico/enfermedad aguda (0-2)
  if(!d.estresAgudo){score+=2;items.push('Sin estrés agudo: 2')}else{items.push('Estrés/enfermedad aguda: 0')}

  // E: Problemas neuropsicológicos (0-2)
  var neuro=d.neuropsico||'no';
  if(neuro==='no'){score+=2;items.push('Sin problemas neuropsico: 2')}
  else if(neuro==='leve'){score+=1;items.push('Demencia leve: 1')}
  else{items.push('Demencia severa: 0')}

  // F: IMC o circunferencia pantorrilla (0-3)
  if(antro.imc>=23){score+=3;items.push('IMC ≥23: 3')}
  else if(antro.imc>=21){score+=2;items.push('IMC 21-22.9: 2')}
  else if(antro.imc>=19){score+=1;items.push('IMC 19-20.9: 1')}
  else{items.push('IMC <19: 0')}

  return{
    score:score,
    maxScore:14,
    status:score>=12?'Normal':score>=8?'Riesgo de malnutrición':'Malnutrición',
    items:items,
    action:score>=12?'Screening anual':score>=8?'Evaluación nutricional completa':'Intervención nutricional + MNA completo',
    ref:'MNA-SF (Rubenstein 2001, ESPEN Geriatrics 2019)'
  };
}

// --- ESPEN Clinical Decision Flowcharts ---
var ESPEN_FLOWCHARTS = {
  general:{
    name:'Algoritmo general de soporte nutricional',
    ref:'ESPEN Guidelines 2023',
    steps:[
      {id:'screen',q:'¿Screening nutricional positivo (NRS-2002 ≥3)?',yes:'assess',no:'rescreen',note:'Realizar en <48h del primer contacto'},
      {id:'assess',q:'¿Cumple criterios GLIM de malnutrición?',yes:'oral_possible',no:'risk_plan',note:'Evaluar criterios fenotípicos + etiológicos'},
      {id:'risk_plan',q:'Paciente en riesgo — Plan preventivo',action:'ONS + consejo dietético + re-screening semanal',end:true},
      {id:'oral_possible',q:'¿Puede alimentarse por vía oral?',yes:'oral_sufficient',no:'gi_functional'},
      {id:'oral_sufficient',q:'¿Ingesta oral ≥60% de requerimientos?',yes:'ons',no:'enteral'},
      {id:'ons',q:'Suplementación oral (ONS)',action:'ONS ≥400kcal + ≥30g prot/día + fortification + consejo dietético',end:true},
      {id:'enteral',q:'¿Tracto GI funcional?',yes:'ne',no:'np'},
      {id:'gi_functional',q:'¿Tracto GI funcional?',yes:'ne',no:'np'},
      {id:'ne',q:'Nutrición enteral',action:'Sonda nasogástrica/nasoyeyunal o PEG/PEJ según duración prevista',end:true},
      {id:'np',q:'Nutrición parenteral',action:'NP central o periférica según duración y osmolaridad',end:true},
      {id:'rescreen',q:'Re-screening',action:'Repetir NRS-2002 semanalmente en hospitalizados; mensualmente en ambulatorios',end:true}
    ]
  },
  perioperatorio:{
    name:'Nutrición perioperatoria',
    ref:'ESPEN Surgery 2025',
    steps:[
      {id:'risk',q:'¿Riesgo nutricional (NRS-2002 ≥3) o sarcopenia?',yes:'severe_risk',no:'eras'},
      {id:'severe_risk',q:'¿Riesgo severo (pérdida >10-15% en 6m)?',yes:'postpone',no:'preop_ons'},
      {id:'postpone',q:'¿Es posible postponer cirugía 7-14 días?',yes:'prehab',no:'preop_ons'},
      {id:'prehab',q:'Prehab nutricional 7-14 días',action:'ONS hipercalórico 600kcal/día + inmuno-nutrición (Arg+ω3+nucleótidos) + ejercicio',end:true},
      {id:'preop_ons',q:'Pre-operatorio',action:'ONS preoperatorio ≥3 días + carga HC 2h pre-Qx (maltodextrina) + inmuno-nutrición si cáncer GI',end:true},
      {id:'eras',q:'Protocolo ERAS estándar',action:'No ayuno prolongado + líquidos claros 2h pre-Qx + alimentación oral precoz POD0-1 + movilización',end:true}
    ]
  },
  renal:{
    name:'Nutrición en ERC',
    ref:'ESPEN Kidney 2021',
    steps:[
      {id:'stage',q:'¿Estadio de ERC?',options:[
        {label:'ERC 1-2 (FG >60)',next:'erc_early'},
        {label:'ERC 3-4 (FG 15-59)',next:'erc_moderate'},
        {label:'ERC 5 sin diálisis (FG <15)',next:'erc_severe'},
        {label:'Hemodiálisis',next:'hd'},
        {label:'Diálisis peritoneal',next:'dpca'}
      ]},
      {id:'erc_early',q:'ERC temprana',action:'Proteína 0.8-1.0g/kg · Sodio <2.3g · Dieta mediterránea · Monitorizar K/P según analítica',end:true},
      {id:'erc_moderate',q:'ERC moderada',action:'Proteína 0.6-0.8g/kg + cetoanálogos · Na <2g · K individualizar · P 800-1000mg · Suplementar VitD si <30ng/mL',end:true},
      {id:'erc_severe',q:'ERC avanzada pre-diálisis',action:'Proteína 0.6-0.8g/kg + cetoanálogos · Restricción K/P estricta · Na <2g · Bicarbonato si acidosis · Evaluar inicio diálisis',end:true},
      {id:'hd',q:'Hemodiálisis',action:'Proteína ≥1.2g/kg · Energía 25-35kcal/kg · K <2.4g · P <800mg · Na <2g · Líquidos según diuresis residual · Fe IV si ferritina <200',end:true},
      {id:'dpca',q:'Diálisis peritoneal',action:'Proteína 1.2-1.4g/kg · Considerar calorías del dializado (glucosa) · K libre generalmente · P <1000mg',end:true}
    ]
  }
};

// --- Render functions ---

// Render ESPEN micro profile panel
function renderESPENMicroPanel(patologias){
  var profile=getESPENMicroProfile(patologias);
  if(!profile.suplementar.length) return '';

  return '<div class="card" style="margin-top:14px;border-left:3px solid var(--accent)"><div class="card-header"><span class="card-title">💊 ESPEN Micronutrientes</span><span class="badge badge-info" style="font-size:.58rem">Clin Nutr 2022</span></div><div class="card-body" style="padding:10px 14px">'
  +profile.suplementar.slice(0,10).map(function(s){
    var color=s.priority>=4?'var(--danger)':s.priority>=2?'var(--warning)':'var(--text3)';
    var reasons=[];
    if(s.reasons.causa) reasons.push('Déficit favorece la enfermedad');
    if(s.reasons.empeora) reasons.push('Déficit empeora la condición');
    if(s.reasons.resultado) reasons.push('Déficit como resultado de la enfermedad');
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:.75rem">'
    +'<div><strong style="color:'+color+'">'+s.name+'</strong>'
    +'<div style="font-size:.58rem;color:var(--text3)">'+reasons.join(' · ')+'</div></div>'
    +'<div style="text-align:right"><div style="font-size:.68rem;font-weight:600">'+s.dose+'</div>'
    +(s.risk?'<div style="font-size:.52rem;color:var(--danger)">⚠ '+s.risk+'</div>':'')+'</div></div>';
  }).join('')
  +'<div style="margin-top:8px;font-size:.58rem;color:var(--text3)">Fuente: ESPEN Practical Short Micronutrient Guideline (Berger et al. 2022)</div>'
  +'</div></div>';
}

// Render ESPEN flowchart interactivo
function renderESPENFlowchart(chartKey,currentStep){
  var chart=ESPEN_FLOWCHARTS[chartKey];
  if(!chart) return '<p>Flowchart no encontrado</p>';
  if(!currentStep) currentStep=chart.steps[0].id;
  var step=chart.steps.find(function(s){return s.id===currentStep});
  if(!step) return '';

  var html='<div class="card" style="border-left:3px solid var(--primary)"><div class="card-header"><span class="card-title">🔀 '+chart.name+'</span><span class="badge badge-neutral" style="font-size:.58rem">'+chart.ref+'</span></div><div class="card-body">';

  if(step.end){
    html+='<div style="padding:16px;background:var(--success-light,var(--primary-light));border-radius:var(--radius-sm);border:2px solid var(--success,var(--primary))">'
    +'<div style="font-size:.85rem;font-weight:700;margin-bottom:6px">✅ '+step.q+'</div>'
    +'<div style="font-size:.78rem;color:var(--text2)">'+step.action+'</div></div>'
    +'<button class="btn btn-outline btn-sm" style="margin-top:10px" onclick="renderESPENFlowInPlace(\''+chartKey+'\',\''+chart.steps[0].id+'\')">↺ Reiniciar algoritmo</button>';
  } else if(step.options){
    html+='<div style="font-size:.88rem;font-weight:700;margin-bottom:12px">'+step.q+'</div>'
    +'<div style="display:flex;flex-direction:column;gap:6px">'
    +step.options.map(function(o){return '<button class="btn btn-outline" style="text-align:left;padding:10px 16px" onclick="renderESPENFlowInPlace(\''+chartKey+'\',\''+o.next+'\')">'+o.label+' →</button>'}).join('')
    +'</div>';
  } else {
    html+='<div style="font-size:.88rem;font-weight:700;margin-bottom:12px">'+step.q+'</div>'
    +(step.note?'<div style="font-size:.72rem;color:var(--text3);margin-bottom:10px">ℹ️ '+step.note+'</div>':'')
    +'<div style="display:flex;gap:8px">'
    +'<button class="btn btn-primary" onclick="renderESPENFlowInPlace(\''+chartKey+'\',\''+step.yes+'\')">Sí</button>'
    +'<button class="btn btn-outline" onclick="renderESPENFlowInPlace(\''+chartKey+'\',\''+step.no+'\')">No</button>'
    +'</div>';
  }
  html+='</div></div>';
  return html;
}

function renderESPENFlowInPlace(chartKey,stepId){
  var container=$('espenFlowContainer');
  if(container) container.innerHTML=renderESPENFlowchart(chartKey,stepId);
}

// Render NRS-2002 result
function renderNRS2002(result){
  if(!result) return '';
  var color=result.risk==='ALTO'?'var(--danger)':result.risk==='MODERADO'?'var(--warning)':'var(--success)';
  return '<div style="padding:12px;border-radius:var(--radius-sm);border:2px solid '+color+';background:'+color+'10">'
  +'<div style="display:flex;justify-content:space-between;align-items:center"><div><strong style="font-size:.88rem">NRS-2002</strong><span class="badge" style="margin-left:8px;background:'+color+';color:#fff">'+result.score+' pts — Riesgo '+result.risk+'</span></div></div>'
  +'<div style="font-size:.72rem;color:var(--text2);margin-top:6px">'+result.details.join(' · ')+'</div>'
  +'<div style="font-size:.72rem;font-weight:600;margin-top:6px;color:'+color+'">→ '+result.action+'</div>'
  +'<div style="font-size:.55rem;color:var(--text3);margin-top:4px">'+result.ref+'</div></div>';
}

// Render GLIM result
function renderGLIM(result){
  if(!result) return '';
  var color=result.diagnosed?(result.severity==='severa'?'var(--danger)':'var(--warning)'):'var(--success)';
  return '<div style="padding:12px;border-radius:var(--radius-sm);border:2px solid '+color+';background:'+color+'10;margin-top:10px">'
  +'<div style="display:flex;justify-content:space-between;align-items:center"><strong style="font-size:.88rem">GLIM</strong><span class="badge" style="background:'+color+';color:#fff">'+(result.diagnosed?'Malnutrición '+result.severity:'Sin malnutrición')+'</span></div>'
  +(result.phenotypic.length?'<div style="font-size:.72rem;margin-top:6px"><strong>Fenotípicos:</strong> '+result.phenotypic.map(function(p){return p.c}).join(', ')+'</div>':'')
  +'<div style="font-size:.72rem;font-weight:600;margin-top:6px;color:'+color+'">→ '+result.action+'</div>'
  +'<div style="font-size:.55rem;color:var(--text3);margin-top:4px">'+result.ref+'</div></div>';
}

// #66 Más flowcharts
ESPEN_FLOWCHARTS.hepatico={
  name:'Nutricion en hepatopatia',ref:'ESPEN Liver 2019',
  steps:[
    {id:'screen',q:'Screening nutricional (RFH-NPT) positivo?',yes:'assess',no:'rescreen'},
    {id:'assess',q:'Child-Pugh C o sarcopenia?',yes:'high_risk',no:'moderate'},
    {id:'high_risk',q:'Alto riesgo nutricional hepatico',action:'Energia 35kcal/kg peso seco. Proteina 1.2-1.5g/kg. NO restringir proteinas. Colacion nocturna HC. AACR si encefalopatia. [ESPEN Liver Rec. 14-15]',end:true},
    {id:'moderate',q:'Riesgo moderado',action:'Energia 30-35kcal/kg. Proteina 1.2g/kg. Snack nocturno. Evaluar sarcopenia por TC. [ESPEN Liver Rec. 12]',end:true},
    {id:'rescreen',q:'Re-screening',action:'Repetir RFH-NPT en 7 dias (hospitalizados) o 3 meses (ambulatorios). [ESPEN Liver Rec. 7]',end:true}
  ]
};

ESPEN_FLOWCHARTS.oncologico={
  name:'Nutricion oncologica',ref:'ESPEN Cancer Guidelines',
  steps:[
    {id:'screen',q:'Screening al diagnostico (NRS-2002 >= 3)?',yes:'assess',no:'monitor'},
    {id:'assess',q:'Perdida peso >5% o ingesta <60%?',yes:'intervene',no:'counsel'},
    {id:'intervene',q:'Tipo de intervencion',options:[
      {label:'Puede comer oral',next:'ons'},
      {label:'No tolera oral (mucositis, disfagia)',next:'enteral'},
      {label:'Obstruccion GI / ileo',next:'parenteral'}
    ]},
    {id:'ons',q:'ONS + consejo dietetico',action:'ONS hipercalorico hiperproteico. EPA+DHA 2g/dia. Proteina 1.2-1.5g/kg. Ejercicio resistencia. [ESPEN Cancer Rec.]',end:true},
    {id:'enteral',q:'Nutricion enteral',action:'NE por SNG/PEG. Formula hiperproteica o inmuno (si pre-Qx). Monitorizar tolerancia.',end:true},
    {id:'parenteral',q:'Nutricion parenteral',action:'NP suplementaria o total. Emulsion lipidica con omega-3 (SMOFlipid/Omegaven). Proteina 1.5-2.0g/kg.',end:true},
    {id:'counsel',q:'Consejo dietetico',action:'Dieta enriquecida. Evitar restricciones sin evidencia (alcalina, cetogenica). Re-screening cada ciclo QT/RT.',end:true},
    {id:'monitor',q:'Monitorizar',action:'Re-screening en cada ciclo de QT/RT o mensualmente. Peso semanal.',end:true}
  ]
};

ESPEN_FLOWCHARTS.geriatrico={
  name:'Nutricion geriatrica',ref:'ESPEN Geriatrics 2019',
  steps:[
    {id:'screen',q:'MNA-SF < 12 puntos?',yes:'assess',no:'normal'},
    {id:'assess',q:'MNA-SF 8-11 (riesgo) o < 8 (malnutricion)?',options:[
      {label:'8-11: Riesgo',next:'risk'},
      {label:'< 8: Malnutricion',next:'malnutrition'}
    ]},
    {id:'risk',q:'Riesgo de malnutricion',action:'Evaluacion dietetica completa. ONS si ingesta <75%. Vitamina D 800-1000UI/dia. Proteina >= 1.0g/kg. Ejercicio adaptado. [ESPEN Geriatrics Rec.]',end:true},
    {id:'malnutrition',q:'Malnutricion establecida',action:'ONS >= 400kcal + >= 30g proteina/dia. Leucina 2.5-2.8g/comida. Vitamina D. Evaluar disfagia (IDDSI). Evitar restricciones innecesarias. 30mL/kg/dia liquidos. [ESPEN Geriatrics Rec.]',end:true},
    {id:'normal',q:'Estado nutricional normal',action:'Screening anual. Dieta mediterranea. Ejercicio 150min/semana. Vitamina D preventiva. Hidratacion >= 1.5L/dia.',end:true}
  ]
};
