// ===== NUTRIANAMNESIS v3 — Sistemas primero, preguntas por patología, ESPEN =====
// Flujo: SISTEMAS → datos personales → motivo → antecedentes → H. dietética → estilo vida → recomendaciones ESPEN

var ANAM_SYSTEMS=[
  {id:'endocrino',name:'Endocrino-Metabólico',ic:'⚡',color:'#f59e0b',pathologies:['DM1','DM2','Prediabetes','Resistencia insulínica','Hipotiroidismo','Hipertiroidismo','SOP','Cushing','Hiperuricemia/Gota']},
  {id:'cardiovascular',name:'Cardiovascular',ic:'❤️',color:'#ef4444',pathologies:['HTA','Dislipemia','Insuficiencia cardíaca','Aterosclerosis','Cardiopatía isquémica','Síndrome metabólico']},
  {id:'renal',name:'Renal',ic:'🫘',color:'#8b5cf6',pathologies:['ERC estadio 1-3','ERC estadio 4-5','Litiasis renal','Síndrome nefrótico','Nefropatía diabética','Hemodiálisis']},
  {id:'digestivo',name:'Digestivo',ic:'🍽️',color:'#22c55e',pathologies:['Crohn','Colitis ulcerosa','SII','Celiaquía','SIBO','ERGE','Gastritis','Pancreatitis','Diverticulosis']},
  {id:'hepatobiliar',name:'Hepatobiliar',ic:'🟡',color:'#eab308',pathologies:['Esteatosis hepática (MAFLD)','Hepatitis','Cirrosis compensada','Cirrosis descompensada','Colelitiasis','Encefalopatía hepática']},
  {id:'nervioso',name:'Nervioso',ic:'🧠',color:'#6366f1',pathologies:['Migraña','Epilepsia','Alzheimer','Parkinson','Esclerosis múltiple']},
  {id:'respiratorio',name:'Respiratorio',ic:'🫁',color:'#06b6d4',pathologies:['EPOC','Asma','Fibrosis quística','Apnea del sueño','Fibrosis pulmonar']},
  {id:'inmunologico',name:'Inmunológico',ic:'🛡️',color:'#14b8a6',pathologies:['Alergias alimentarias','Inmunodeficiencia','Enf. autoinmune','Lupus','Artritis reumatoide']},
  {id:'musculoesqueletico',name:'Músculo-Esquelético',ic:'🦴',color:'#78716c',pathologies:['Osteoporosis','Sarcopenia','Fibromialgia','Fractura por fragilidad']},
  {id:'ginecologico',name:'Ginecológico',ic:'🌸',color:'#ec4899',pathologies:['SOP','Endometriosis','Menopausia','Embarazo','Lactancia','Infertilidad']},
  {id:'saludmental',name:'Salud Mental',ic:'🧩',color:'#a855f7',pathologies:['Anorexia nerviosa','Bulimia nerviosa','Trastorno por atracón','Ansiedad','Depresión','Ortorexia']},
  {id:'hematologico',name:'Hematológico',ic:'🩸',color:'#dc2626',pathologies:['Anemia ferropénica','Anemia megaloblástica','Hemocromatosis','Déficit B12/folato']},
  {id:'oncologico',name:'Oncológico',ic:'🎗️',color:'#be185d',pathologies:['Cáncer activo en tratamiento','Post-quimioterapia','Post-cirugía oncológica','Caquexia tumoral']},
  {id:'deportivo',name:'Deportivo',ic:'🏋️',color:'#2563eb',pathologies:['Ganancia muscular','Alto rendimiento','Recuperación lesión','RED-S','Maratón/ultra']},
];

// ═══ PREGUNTAS ESPECÍFICAS POR PATOLOGÍA ═══
var ANAM_PATHOLOGY_QUESTIONS={
  'DM1':[
    {id:'dm_tipo_tto',label:'¿Qué tipo de tratamiento farmacológico lleva? (insulina tipo, dosis, horarios)',type:'textarea'},
    {id:'dm_hba1c',label:'Últimos niveles de HbA1c',type:'text',placeholder:'Ej: 7.2%'},
    {id:'dm_glucosa_ayunas',label:'Última glucosa en ayunas',type:'text',placeholder:'Ej: 110 mg/dL'},
    {id:'dm_hipoglucemias',label:'¿Con qué frecuencia experimenta hipoglucemias?',type:'select',options:['Nunca','Rara vez (1/mes)','Ocasional (1/semana)','Frecuente (>2/semana)']},
    {id:'dm_alimentos_hipo',label:'¿Qué alimentos consume para remontar hipoglucemias?',type:'text'},
    {id:'dm_conteo_hc',label:'¿Realiza conteo de hidratos de carbono?',type:'select',options:['Sí, siempre','A veces','No, nunca','No sabe qué es']},
    {id:'dm_bomba',label:'¿Usa bomba de insulina o sensor continuo de glucosa?',type:'select',options:['Bomba + sensor','Solo sensor (MCG)','Solo inyecciones','Ninguno']},
  ],
  'DM2':[
    {id:'dm2_tto',label:'Tratamiento farmacológico actual (nombre, dosis, horarios)',type:'textarea'},
    {id:'dm2_hba1c',label:'Últimos niveles de HbA1c',type:'text',placeholder:'Ej: 6.8%'},
    {id:'dm2_glucosa',label:'Última glucosa en ayunas',type:'text',placeholder:'Ej: 125 mg/dL'},
    {id:'dm2_hipoglucemias',label:'¿Experimenta episodios de hipoglucemia?',type:'select',options:['Nunca','Rara vez','Ocasional','Frecuente']},
    {id:'dm2_alimentos_hipo',label:'¿Qué alimentos usa para remontar hipoglucemias?',type:'text'},
    {id:'dm2_autocontrol',label:'¿Se mide la glucosa en casa? ¿Con qué frecuencia?',type:'select',options:['No','1-2x/semana','Diario','Varias al día']},
    {id:'dm2_pie',label:'¿Le han revisado los pies en el último año?',type:'select',options:['Sí','No','No recuerda']},
  ],
  'HTA':[
    {id:'hta_medicacion',label:'Antihipertensivos actuales (nombre, dosis)',type:'textarea'},
    {id:'hta_valores',label:'Últimos valores de presión arterial',type:'text',placeholder:'Ej: 140/85 mmHg'},
    {id:'hta_autocontrol',label:'¿Se toma la presión en casa?',type:'select',options:['Sí, regularmente','A veces','Nunca']},
    {id:'hta_sal',label:'¿Añade sal a las comidas ya preparadas?',type:'select',options:['Siempre','A veces','Nunca']},
    {id:'hta_ultraprocesados',label:'¿Consume embutidos, snacks salados o ultraprocesados con frecuencia?',type:'select',options:['Diario','3-4x/semana','1-2x/semana','Rara vez','Nunca']},
  ],
  'Dislipemia':[
    {id:'dlp_medicacion',label:'¿Toma estatinas u otros hipolipemiantes? (nombre, dosis)',type:'textarea'},
    {id:'dlp_colesterol',label:'Último perfil lipídico (CT, LDL, HDL, TG)',type:'text',placeholder:'Ej: CT 240, LDL 160, HDL 45, TG 180'},
    {id:'dlp_omega3',label:'¿Consume pescado azul o suplementos de omega-3?',type:'select',options:['Sí, regularmente','A veces','Nunca']},
    {id:'dlp_grasas_sat',label:'¿Consume frecuentemente mantequilla, nata, embutidos grasos?',type:'select',options:['Diario','3-4x/semana','1-2x/semana','Rara vez']},
  ],
  'EPOC':[
    {id:'epoc_fev1',label:'Último valor de FEV1 (%)',type:'text',placeholder:'Ej: 55%'},
    {id:'epoc_oxigeno',label:'¿Usa oxígeno domiciliario?',type:'select',options:['No','Sí, nocturno','Sí, continuo']},
    {id:'epoc_peso',label:'¿Ha perdido peso involuntariamente en los últimos 6 meses?',type:'select',options:['No','Sí, <5%','Sí, 5-10%','Sí, >10%']},
    {id:'epoc_disnea',label:'¿Tiene dificultad para respirar al comer?',type:'select',options:['Nunca','A veces','Frecuentemente','Siempre']},
    {id:'epoc_comidas',label:'¿Prefiere comidas pequeñas y frecuentes?',type:'select',options:['Sí','No','No lo ha probado']},
  ],
  'Esteatosis hepática (MAFLD)':[
    {id:'mafld_ecografia',label:'Resultado de última ecografía hepática',type:'select',options:['Normal','Esteatosis leve','Esteatosis moderada','Esteatosis severa','No se ha hecho']},
    {id:'mafld_enzimas',label:'Valores de transaminasas (AST/ALT/GGT)',type:'text',placeholder:'Ej: AST 35, ALT 48, GGT 62'},
    {id:'mafld_fructosa',label:'¿Consume bebidas azucaradas o zumos frecuentemente?',type:'select',options:['Diario','3-4x/semana','1-2x/semana','Nunca']},
    {id:'mafld_alcohol',label:'Consumo de alcohol semanal',type:'select',options:['Nada','1-7 UBE/sem','8-14 UBE/sem','>14 UBE/sem']},
  ],
  'Cirrosis compensada':[
    {id:'cirr_child',label:'Clasificación Child-Pugh',type:'select',options:['A (5-6 puntos)','B (7-9 puntos)','C (10-15 puntos)','No clasificado']},
    {id:'cirr_varices',label:'¿Tiene varices esofágicas?',type:'select',options:['No','Sí, sin sangrado','Sí, con antecedente de sangrado']},
    {id:'cirr_ascitis',label:'¿Presenta ascitis?',type:'select',options:['No','Leve','Moderada-severa']},
    {id:'cirr_encefalopatia',label:'¿Ha tenido episodios de encefalopatía hepática?',type:'select',options:['Nunca','Sí, leves','Sí, graves']},
  ],
  'ERC estadio 4-5':[
    {id:'erc_tfg',label:'Última tasa de filtrado glomerular (TFG/eGFR)',type:'text',placeholder:'Ej: 22 mL/min'},
    {id:'erc_dialisis',label:'¿Está en diálisis?',type:'select',options:['No','Hemodiálisis','Diálisis peritoneal','En lista de espera']},
    {id:'erc_potasio',label:'Último valor de potasio sérico',type:'text',placeholder:'Ej: 5.2 mEq/L'},
    {id:'erc_fosforo',label:'Último valor de fósforo sérico',type:'text',placeholder:'Ej: 4.8 mg/dL'},
    {id:'erc_restricciones',label:'¿Sigue alguna restricción alimentaria actualmente?',type:'textarea',placeholder:'K, Na, P, líquidos...'},
  ],
  'Celiaquía':[
    {id:'cel_diagnostico',label:'¿Cómo se diagnosticó? (biopsia, serología, genética)',type:'text'},
    {id:'cel_gluten',label:'¿Sigue dieta sin gluten estrictamente?',type:'select',options:['Sí, 100%','Casi siempre (transgresiones raras)','A veces como gluten','No llevo dieta sin gluten']},
    {id:'cel_contaminacion',label:'¿Tiene cuidado con la contaminación cruzada?',type:'select',options:['Sí, siempre','A veces','No sé qué es']},
    {id:'cel_sintomas',label:'¿Tiene síntomas digestivos actualmente?',type:'select',options:['No, asintomático','Leves ocasionales','Moderados frecuentes','Severos']},
  ],
  'SII':[
    {id:'sii_subtipo',label:'Subtipo predominante',type:'select',options:['SII-D (diarrea)','SII-E (estreñimiento)','SII-M (mixto)','SII-NC (no clasificado)']},
    {id:'sii_fodmap',label:'¿Ha probado dieta baja en FODMAP?',type:'select',options:['No','Sí, con mejoría','Sí, sin mejoría','En curso']},
    {id:'sii_triggers',label:'¿Identifica alimentos desencadenantes?',type:'textarea',placeholder:'Lácteos, legumbres, cebolla, ajo...'},
    {id:'sii_estres',label:'¿Los síntomas empeoran con el estrés?',type:'select',options:['Sí, claramente','A veces','No']},
  ],
  'Anemia ferropénica':[
    {id:'anemia_ferritina',label:'Último valor de ferritina',type:'text',placeholder:'Ej: 12 ng/mL'},
    {id:'anemia_hierro',label:'¿Toma suplementos de hierro? (tipo, dosis)',type:'text'},
    {id:'anemia_menstruacion',label:'¿Menstruaciones abundantes?',type:'select',options:['No aplica','No','Sí, moderadas','Sí, abundantes']},
    {id:'anemia_consumo_carne',label:'¿Con qué frecuencia consume carne roja?',type:'select',options:['Nunca (vegetariano)','1x/semana','2-3x/semana','4+x/semana']},
  ],
  'Embarazo':[
    {id:'emb_semanas',label:'Semanas de gestación',type:'number',placeholder:'Ej: 28'},
    {id:'emb_trimestre',label:'Trimestre',type:'select',options:['Primero (1-12 sem)','Segundo (13-27 sem)','Tercero (28-40 sem)']},
    {id:'emb_nauseas',label:'¿Tiene náuseas o vómitos?',type:'select',options:['No','Leves','Moderados','Severos (hiperémesis)']},
    {id:'emb_diabetes_gest',label:'¿Le han diagnosticado diabetes gestacional?',type:'select',options:['No','Sí','Pendiente de curva (SOG)']},
    {id:'emb_suplementos',label:'¿Toma ácido fólico, hierro, yodo?',type:'textarea',placeholder:'Nombre y dosis'},
    {id:'emb_ganancia',label:'Ganancia de peso hasta ahora',type:'text',placeholder:'Ej: +8 kg'},
  ],
  'Cáncer activo en tratamiento':[
    {id:'onc_tipo',label:'Tipo de cáncer y estadio',type:'text'},
    {id:'onc_tratamiento',label:'Tratamiento actual (QT, RT, inmunoterapia, cirugía)',type:'textarea'},
    {id:'onc_apetito',label:'¿Tiene pérdida de apetito?',type:'select',options:['No','Leve','Moderada','Severa']},
    {id:'onc_peso_perdido',label:'¿Ha perdido peso en los últimos 3 meses?',type:'select',options:['No','<5%','5-10%','>10%']},
    {id:'onc_nauseas',label:'¿Tiene náuseas, vómitos o mucositis?',type:'select',options:['No','Náuseas leves','Náuseas + vómitos','Mucositis oral']},
    {id:'onc_suplementos',label:'¿Usa suplementos nutricionales orales (ONS)?',type:'select',options:['No','Sí, 1/día','Sí, 2+/día']},
  ],
};

// ═══ RECOMENDACIONES ESPEN POR PATOLOGÍA ═══
var ANAM_ESPEN_RECS={
  'DM1':{generales:['Conteo de HC por raciones','Distribución regular de comidas','Monitorizar glucemia pre/post-prandial','Ajustar insulina según ingesta'],incorporar:['Fibra soluble (avena, legumbres)','HC de bajo IG','Verduras en todas las comidas','Proteínas magras'],evitar:['Azúcares simples aislados','Zumos de fruta','Comidas irregulares','Alcohol en ayunas'],coccion:['Al vapor, horno, plancha','Evitar fritos y rebozados'],pautas:['Llevar siempre glucosa rápida (15g HC)','Planificar comidas con horarios fijos','No saltarse comidas','Separar ingesta de alcohol de las comidas']},
  'DM2':{generales:['Priorizar alimentos de bajo índice glucémico','Fibra ≥30g/día','HC 45-60% del VCT (preferir complejos)','Control de porciones'],incorporar:['Legumbres (≥3x/semana)','Verduras de hoja verde','Cereales integrales','Frutos secos (puñado/día)','Pescado azul (≥2x/semana)','Canela, vinagre (modulan glucemia)'],evitar:['Bebidas azucaradas','Zumos envasados','Pan blanco, arroz blanco en exceso','Ultraprocesados','Miel, mermelada, azúcar de mesa'],coccion:['Al vapor, horno, plancha, guiso','Evitar fritos y empanados'],pautas:['Comer despacio (≥20 min)','Empezar por verdura o proteína','Caminar 15 min post-comida','Peso saludable como objetivo prioritario']},
  'HTA':{generales:['Restricción de sodio <2g/día (5g sal)','Dieta DASH','Mantener peso saludable','Potasio adecuado (frutas, verduras)'],incorporar:['Frutas y verduras (≥5 raciones/día)','Lácteos desnatados','Legumbres','Pescado','Potasio: plátano, aguacate, espinaca'],evitar:['Sal añadida','Embutidos y fiambres','Conservas y encurtidos','Snacks salados','Quesos curados','Caldos comerciales'],coccion:['Sin sal, usar especias y hierbas aromáticas','Limón, vinagre, ajo como aliño'],pautas:['Leer etiquetas: sodio <0.3g/100g','No poner salero en la mesa','Reducir sal gradualmente (4 semanas)','Actividad física regular ≥150min/semana']},
  'Dislipemia':{generales:['Reducir grasas saturadas <7% VCT','Aumentar grasas insaturadas (MUFA, PUFA)','Fibra soluble ≥10g/día','Fitosteroles 2g/día si disponibles'],incorporar:['AOVE como grasa principal','Pescado azul (≥3x/semana)','Nueces (30g/día)','Avena, cebada (β-glucanos)','Legumbres (≥4x/semana)','Frutas y verduras variadas'],evitar:['Grasas trans (bollería industrial)','Mantequilla, nata, manteca','Embutidos grasos','Aceite de palma/coco','Vísceras','Yema >4/semana si CT>240'],coccion:['AOVE, plancha, horno, vapor','Evitar fritos en aceite reutilizado'],pautas:['Dieta mediterránea como base','Ejercicio aeróbico ≥150min/semana','Control de peso','Limitar alcohol (máx 1-2 copas vino/día)']},
  'EPOC':{generales:['Energía: 30-35 kcal/kg/día','Proteína: 1.2-1.5 g/kg/día','Aumentar proporción de grasas (35-40% VCT)','Disminuir HC (40-45% VCT) para reducir CO₂','Comidas pequeñas y frecuentes (5-6/día)'],incorporar:['Alimentos calórica y nutricionalmente densos','AOVE, frutos secos, aguacate','Proteínas en cada comida','Lácteos enteros si bajo peso','Omega-3 (antiinflamatorio)'],evitar:['Comidas copiosas (dificultan respiración)','Bebidas gaseosas','Alimentos que producen gases','Exceso de HC simples'],coccion:['Texturas fáciles de masticar','Platos poco elaborados','Evitar humos de cocción'],pautas:['Comer sentado con espalda recta','Descansar antes de comer','Usar oxígeno durante comida si prescrito','Líquidos entre comidas (no durante)','Suplementos hipercalóricos si IMC<21']},
  'Esteatosis hepática (MAFLD)':{generales:['Pérdida de peso 7-10% si sobrepeso/obesidad','Reducir fructosa y azúcares añadidos','Dieta mediterránea','Ejercicio ≥150 min/semana'],incorporar:['AOVE','Pescado azul','Café (2-3 tazas/día: hepatoprotector)','Verduras crucíferas','Fibra ≥25g/día'],evitar:['Fructosa añadida (refrescos, zumos)','Alcohol','Ultraprocesados','Grasas trans','Exceso de HC refinados'],coccion:['Al vapor, horno, plancha'],pautas:['Pérdida gradual (0.5-1 kg/sem)','No hacer dietas muy restrictivas','Vitamina E 800 UI/día (si biopsia NASH, sin diabetes)','Control de TG y transaminasas cada 3-6 meses']},
  'Cirrosis compensada':{generales:['Energía: 35 kcal/kg/día','Proteína: 1.2-1.5 g/kg/día (NO restringir)','Comidas frecuentes (5-6/día) con snack nocturno','Evitar ayunos prolongados'],incorporar:['Proteínas vegetales y lácteas (preferibles)','AACR si encefalopatía','HC complejos como base energética','Snack nocturno rico en HC (previene catabolismo)'],evitar:['Alcohol (estricto)','Exceso de sodio si ascitis','Proteínas animales en exceso si encefalopatía','Suplementos de hierro sin indicación'],coccion:['Sin sal si retención hídrica','Texturas adaptadas si varices esofágicas'],pautas:['Cena tardía + snack antes de dormir','Suplementar vitaminas liposolubles (A,D,E,K)','Zinc si déficit','Control de ascitis y edemas']},
  'Celiaquía':{generales:['Dieta sin gluten estricta y permanente','Evitar contaminación cruzada','Suplementar déficits (Fe, Ca, VitD, folato)','Control serológico anual (anti-tTG)'],incorporar:['Cereales sin gluten: arroz, maíz, quinoa, trigo sarraceno, mijo','Legumbres','Tubérculos','Todas las frutas y verduras','Carnes, pescados, huevos, lácteos naturales'],evitar:['Trigo, cebada, centeno, avena contaminada','Salsas comerciales (revisar etiqueta)','Cerveza convencional','Embutidos (pueden contener gluten)','Rebozados y empanados convencionales'],coccion:['Utensilios exclusivos o bien lavados','Aceite de fritura no compartido','Superficies limpias'],pautas:['Leer SIEMPRE etiquetas','Buscar sello "sin gluten"','Cuidado en restaurantes','Avena solo certificada sin gluten']},
  'Embarazo':{generales:['1er trim: +0 kcal; 2do: +340 kcal; 3er: +452 kcal','Proteína: 1.1 g/kg/día','Suplementar: ácido fólico 400µg, yodo 200µg, hierro si déficit','Vitamina D 600 UI/día'],incorporar:['Alimentos ricos en hierro hemo','Lácteos (Ca ≥1000mg/día)','Pescado azul pequeño (sardina, boquerón)','Legumbres, verduras de hoja','DHA (omega-3) ≥200mg/día'],evitar:['Pescado de gran tamaño (mercurio: atún rojo, pez espada)','Carne/pescado crudo (toxoplasmosis)','Quesos sin pasteurizar','Alcohol (cero)','Cafeína >200mg/día','Embutidos sin congelar previamente'],coccion:['Cocción completa de carnes','Lavar bien frutas y verduras','Congelar embutidos 48h antes de consumir'],pautas:['Ganancia de peso según IMC pregestacional','Comidas frecuentes si náuseas','Hidratación ≥2L/día','Actividad física moderada si no contraindicada']},
};

// ═══ STORE + MIGRATION ═══
if(!DB.anamnesisData) DB.anamnesisData={};
(function(){for(var k in DB.anamnesisData){
  var v=DB.anamnesisData[k];
  if(v&&!Array.isArray(v)){DB.anamnesisData[k]=[Object.assign({fecha:new Date().toISOString().slice(0,10),template:'migrated',profesional:currentUser?currentUser.name:''},v)]}
}})();

// ═══ NEW ORDER: Sistemas primero ═══
var ANAM_SECTION_TITLES={
  sistemas:'⚡ Sistemas clínicos (seleccionar primero)',
  personal:'👤 Datos personales',
  motivo:'🎯 Motivo de consulta',
  antecedentes:'🩺 Antecedentes',
  patologia_especifica:'🔬 Preguntas por patología',
  dietetica:'🍽️ Historia dietética',
  estilovida:'🌿 Estilo de vida',
  recomendaciones:'✅ Recomendaciones ESPEN'
};
var ANAM_SECTIONS_ORDER=['sistemas','personal','motivo','antecedentes','patologia_especifica','dietetica','estilovida','recomendaciones'];

// ═══ FIELD DEFINITIONS ═══
function getAnamFields(section,p,ch,draft){
  var r=draft||{};
  if(section==='personal') return [
    {id:'edad',label:'Edad',type:'number',unit:'años',value:r.edad||age(p.fechaNacimiento)},
    {id:'sexo',label:'Sexo biológico',type:'select',options:['Femenino','Masculino','Otro'],value:r.sexo||p.sexo||''},
    {id:'ocupacion',label:'Ocupación',type:'text',value:r.ocupacion||p.profesion||''},
    {id:'estadoCivil',label:'Estado civil',type:'select',options:['Soltero/a','Casado/a','Divorciado/a','Viudo/a'],value:r.estadoCivil||p.estadoCivil||''},
    {id:'nivelEducativo',label:'Nivel educativo',type:'select',options:['Primaria','Secundaria','Universitaria','Posgrado'],value:r.nivelEducativo||p.educacion||''},
    {id:'grupoFamiliar',label:'¿Con quién vive?',type:'text',value:r.grupoFamiliar||''},
    {id:'quienCocina',label:'¿Quién cocina en casa?',type:'text',value:r.quienCocina||''},
    {id:'grupoSanguineo',label:'Grupo sanguíneo',type:'select',options:['A+','A-','B+','B-','AB+','AB-','O+','O-','No sabe'],value:r.grupoSanguineo||p.grupoSanguineo||''},
    {id:'otros_registros',label:'Otros registros / observaciones',type:'textarea',value:r.otros_registros||'',placeholder:'Información adicional relevante...'},
  ];
  if(section==='motivo') return [
    {id:'motivoConsulta',label:'Motivo de consulta principal',type:'textarea',value:r.motivoConsulta||p.motivoConsulta||'',placeholder:'¿Por qué consulta hoy?'},
    {id:'objetivos',label:'Objetivos del paciente',type:'textarea',value:r.objetivos||'',placeholder:'¿Qué espera lograr?'},
    {id:'expectativas',label:'Expectativas de tiempo',type:'select',options:['1-2 meses','3-6 meses','6-12 meses','Largo plazo','No definido'],value:r.expectativas||''},
    {id:'derivadoPor',label:'Derivado por',type:'text',value:r.derivadoPor||'',placeholder:'Médico, endocrinólogo, iniciativa propia...'},
    {id:'consultaPreviaEN',label:'¿Consultó nutricionista antes?',type:'select',options:['No, es primera vez','Sí, hace menos de 1 año','Sí, hace más de 1 año'],value:r.consultaPreviaEN||''},
  ];
  if(section==='antecedentes') return [
    {id:'antPersonales',label:'Antecedentes personales',type:'textarea',value:r.antPersonales||(ch?ch.antecedentes:''),placeholder:'Patologías diagnosticadas, cirugías, internaciones...'},
    {id:'antFamiliares',label:'Antecedentes familiares',type:'textarea',value:r.antFamiliares||(ch?ch.antecedentesFamiliares:''),placeholder:'Padre, madre, hermanos: diabetes, HTA, obesidad, cáncer...'},
    {id:'alergias',label:'Alergias e intolerancias alimentarias',type:'textarea',value:r.alergias||(ch?ch.alergias:''),placeholder:'Frutos secos, lactosa, gluten, mariscos...'},
    {id:'medicacion',label:'Medicación actual',type:'textarea',value:r.medicacion||(ch?ch.medicacion:''),placeholder:'Nombre, dosis, frecuencia...'},
    {id:'suplementos',label:'Suplementación',type:'textarea',value:r.suplementos||(ch?ch.suplementacion:''),placeholder:'Vitaminas, minerales, proteínas...'},
    {id:'cirugias',label:'Cirugías previas',type:'text',value:r.cirugias||'',placeholder:'Tipo y año'},
    {id:'embarazos',label:'Embarazos/partos (si aplica)',type:'text',value:r.embarazos||'',placeholder:'Número, complicaciones'},
  ];
  if(section==='dietetica') return [
    {id:'tipoDieta',label:'Tipo de alimentación actual',type:'select',options:['Omnívora','Flexitariana','Vegetariana','Vegana','Mediterránea','Keto/Low carb','Sin restricciones','Otra'],value:r.tipoDieta||''},
    {id:'comidasDia',label:'Comidas al día',type:'select',options:['1-2','3','4','5','6 o más'],value:r.comidasDia||''},
    {id:'saltaComidas',label:'¿Suele saltarse comidas?',type:'select',options:['Nunca','A veces','Frecuentemente','Siempre'],value:r.saltaComidas||''},
    {id:'comidaSaltada',label:'¿Cuál comida se salta más?',type:'select',options:['Desayuno','Almuerzo','Merienda','Cena','Ninguna'],value:r.comidaSaltada||''},
    {id:'picoteo',label:'¿Picotea entre comidas?',type:'select',options:['Nunca','A veces','Frecuentemente','Siempre'],value:r.picoteo||''},
    {id:'comoFuera',label:'¿Cuántas veces come fuera/delivery por semana?',type:'select',options:['0','1-2','3-4','5+'],value:r.comoFuera||''},
    {id:'consumoAlcohol',label:'Consumo de alcohol',type:'select',options:['Nunca','Ocasional (1-2/mes)','Social (1-2/semana)','Frecuente (3+/semana)','Diario'],value:r.consumoAlcohol||''},
    {id:'consumoAgua',label:'Consumo diario de agua',type:'select',options:['<500ml','500ml-1L','1-1.5L','1.5-2L','2-3L','>3L'],value:r.consumoAgua||''},
    {id:'recordatorio24h',label:'Recordatorio 24h (comidas de ayer)',type:'textarea',value:r.recordatorio24h||'',placeholder:'Desayuno: ...\nMedia mañana: ...\nComida: ...\nMerienda: ...\nCena: ...'},
    {id:'aversiones',label:'Alimentos que NO le gustan',type:'textarea',value:r.aversiones||'',placeholder:'Lista de alimentos que rechaza'},
    {id:'preferencias',label:'Alimentos favoritos',type:'textarea',value:r.preferencias||'',placeholder:'Lista de alimentos preferidos'},
  ];
  if(section==='estilovida') return [
    {id:'actTipo',label:'Tipo de actividad física',type:'text',value:r.actTipo||(ch?ch.actividadFisica.tipo:''),placeholder:'Caminar, correr, gimnasio, yoga...'},
    {id:'actFreq',label:'Frecuencia',type:'select',options:['Sedentario','1-2x/semana','3-4x/semana','5-6x/semana','Diario'],value:r.actFreq||''},
    {id:'actIntensidad',label:'Intensidad',type:'select',options:['Baja','Moderada','Alta','Muy alta'],value:r.actIntensidad||(ch?ch.actividadFisica.intensidad:'')},
    {id:'actDuracion',label:'Duración por sesión',type:'select',options:['<30 min','30-45 min','45-60 min','60-90 min','>90 min'],value:r.actDuracion||''},
    {id:'suenoHoras',label:'Horas de sueño',type:'select',options:['<5h','5-6h','6-7h','7-8h','8-9h','>9h'],value:r.suenoHoras||''},
    {id:'suenoCalidad',label:'Calidad del sueño',type:'select',options:['Mala','Regular','Buena','Excelente'],value:r.suenoCalidad||''},
    {id:'estres',label:'Nivel de estrés (1-10)',type:'number',value:r.estres||'',placeholder:'1=bajo 10=muy alto'},
    {id:'tabaco',label:'Tabaco',type:'select',options:['No fumador','Exfumador','<10 cig/día','10-20 cig/día','>20 cig/día'],value:r.tabaco||''},
    {id:'transitoIntestinal',label:'Tránsito intestinal',type:'select',options:['Regular (diario)','Cada 2-3 días','Estreñimiento frecuente','Diarrea frecuente','Alternante'],value:r.transitoIntestinal||''},
    {id:'escBristol',label:'Escala de Bristol predominante',type:'select',options:['Tipo 1-2 (duro)','Tipo 3-4 (normal)','Tipo 5-6 (blando)','Tipo 7 (líquido)'],value:r.escBristol||''},
  ];
  return [];
}

// ═══ RENDER SECTION FORM ═══
function renderAnamFormSection(section,p,ch){
  var draft=window._anamDraft||{};

  // PATOLOGÍA ESPECÍFICA: generate questions from selected pathologies
  if(section==='patologia_especifica'){
    var sistemas=draft._sistemas||[];
    var selectedPaths=[];
    sistemas.forEach(function(sysId){
      var path=draft['_syspath_'+sysId];
      if(path) selectedPaths.push(path);
      // Multi-select: check for array
      var multi=draft['_syspaths_'+sysId];
      if(multi&&Array.isArray(multi)) multi.forEach(function(mp){if(selectedPaths.indexOf(mp)<0)selectedPaths.push(mp)});
    });

    if(!selectedPaths.length){
      return '<div class="card"><div class="card-header"><span class="card-title">🔬 Preguntas por patología</span></div>'
      +'<div class="card-body" style="text-align:center;padding:30px;color:var(--text3)"><p>Seleccione patologías en el paso "Sistemas clínicos" para ver preguntas específicas.</p></div></div>';
    }

    var html='';
    selectedPaths.forEach(function(pathName){
      var questions=ANAM_PATHOLOGY_QUESTIONS[pathName];
      if(!questions)return;
      html+='<div class="card" style="margin-bottom:14px;border-left:4px solid var(--primary)"><div class="card-header"><span class="card-title">🔬 '+pathName+'</span>'
      +'<span class="badge badge-primary" style="font-size:.65rem">'+questions.length+' preguntas</span></div>'
      +'<div class="card-body">';
      questions.forEach(function(q){
        var val=draft[q.id]||'';
        html+='<div class="form-group"><label class="form-label">'+q.label+'</label>';
        if(q.type==='textarea') html+='<textarea id="af_'+q.id+'" rows="2" placeholder="'+(q.placeholder||'')+'">'+val+'</textarea>';
        else if(q.type==='select') html+='<select id="af_'+q.id+'"><option value="">— Seleccionar —</option>'+(q.options||[]).map(function(o){return '<option '+(val.toLowerCase()===o.toLowerCase()?'selected':'')+'>'+o+'</option>'}).join('')+'</select>';
        else if(q.type==='number') html+='<input type="number" id="af_'+q.id+'" value="'+val+'" placeholder="'+(q.placeholder||'')+'" step="0.1">';
        else html+='<input type="text" id="af_'+q.id+'" value="'+val+'" placeholder="'+(q.placeholder||'')+'">';
        html+='</div>';
      });
      html+='</div></div>';
    });

    // "Otros registros" field
    html+='<div class="card"><div class="card-header"><span class="card-title">📝 Otros registros</span></div>'
    +'<div class="card-body"><div class="form-group"><label class="form-label">Observaciones adicionales sobre las patologías</label>'
    +'<textarea id="af_patologia_otros" rows="3" placeholder="Notas clínicas adicionales, hallazgos relevantes...">'+(draft.patologia_otros||'')+'</textarea></div></div></div>';

    return html;
  }

  // RECOMENDACIONES ESPEN: auto-generate from selected pathologies
  if(section==='recomendaciones'){
    var sistemas=draft._sistemas||[];
    var selectedPaths=[];
    sistemas.forEach(function(sysId){
      var path=draft['_syspath_'+sysId];
      if(path) selectedPaths.push(path);
      var multi=draft['_syspaths_'+sysId];
      if(multi&&Array.isArray(multi)) multi.forEach(function(mp){if(selectedPaths.indexOf(mp)<0)selectedPaths.push(mp)});
    });

    if(!selectedPaths.length){
      return '<div class="card"><div class="card-header"><span class="card-title">✅ Recomendaciones</span></div>'
      +'<div class="card-body" style="text-align:center;padding:30px;color:var(--text3)"><p>Seleccione patologías para generar recomendaciones ESPEN automáticas.</p></div></div>';
    }

    var html='';
    selectedPaths.forEach(function(pathName){
      var recs=ANAM_ESPEN_RECS[pathName];
      if(!recs)return;
      html+='<div class="card" style="margin-bottom:16px;border-top:3px solid var(--primary)">'
      +'<div class="card-header"><span class="card-title">📋 '+pathName+' — Recomendaciones ESPEN</span></div>'
      +'<div class="card-body">';

      if(recs.generales){
        html+='<div style="margin-bottom:14px"><div style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--primary);margin-bottom:6px">Recomendaciones generales</div>'
        +'<ul style="font-size:.82rem;padding-left:18px;color:var(--text2)">'+recs.generales.map(function(r){return '<li style="margin-bottom:3px">'+r+'</li>'}).join('')+'</ul></div>';
      }
      if(recs.incorporar){
        html+='<div style="margin-bottom:14px"><div style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#16a34a;margin-bottom:6px">✅ Alimentos a incorporar</div>'
        +'<div style="display:flex;flex-wrap:wrap;gap:4px">'+recs.incorporar.map(function(a){return '<span style="display:inline-block;padding:3px 10px;background:#f0fdf4;color:#166534;border-radius:8px;font-size:.75rem;border:1px solid #bbf7d0">'+a+'</span>'}).join('')+'</div></div>';
      }
      if(recs.evitar){
        html+='<div style="margin-bottom:14px"><div style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#dc2626;margin-bottom:6px">❌ Alimentos a evitar</div>'
        +'<div style="display:flex;flex-wrap:wrap;gap:4px">'+recs.evitar.map(function(a){return '<span style="display:inline-block;padding:3px 10px;background:#fef2f2;color:#991b1b;border-radius:8px;font-size:.75rem;border:1px solid #fecaca">'+a+'</span>'}).join('')+'</div></div>';
      }
      if(recs.coccion){
        html+='<div style="margin-bottom:14px"><div style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#ca8a04;margin-bottom:6px">🍳 Modos de cocción</div>'
        +'<ul style="font-size:.82rem;padding-left:18px;color:var(--text2)">'+recs.coccion.map(function(c){return '<li style="margin-bottom:3px">'+c+'</li>'}).join('')+'</ul></div>';
      }
      if(recs.pautas){
        html+='<div><div style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--accent);margin-bottom:6px">📋 Pautas higiénico-dietéticas</div>'
        +'<ul style="font-size:.82rem;padding-left:18px;color:var(--text2)">'+recs.pautas.map(function(p){return '<li style="margin-bottom:3px">'+p+'</li>'}).join('')+'</ul></div>';
      }

      html+='</div></div>';
    });

    // Editable notes
    html+='<div class="card"><div class="card-header"><span class="card-title">✏️ Personalizar recomendaciones</span></div>'
    +'<div class="card-body"><div class="form-group"><label class="form-label">Modificaciones / notas personalizadas</label>'
    +'<textarea id="af_recs_custom" rows="4" placeholder="Añada, modifique o elimine recomendaciones según el caso clínico...">'+(draft.recs_custom||'')+'</textarea></div></div></div>';

    return html;
  }

  // Standard sections
  var fields=getAnamFields(section,p,ch,draft);
  return '<div class="card"><div class="card-header"><span class="card-title">'+(ANAM_SECTION_TITLES[section]||section)+'</span></div>'
  +'<div class="card-body">'
  +fields.map(function(f){return '<div class="form-group">'
    +'<label class="form-label">'+f.label+(f.unit?' ('+f.unit+')':'')+'</label>'
    +(f.type==='textarea'?'<textarea id="af_'+f.id+'" rows="2" placeholder="'+(f.placeholder||'')+'">'+(f.value||'')+'</textarea>':
      f.type==='select'?'<select id="af_'+f.id+'"><option value="">— Seleccionar —</option>'+(f.options||[]).map(function(o){return '<option '+((f.value||'').toLowerCase()===o.toLowerCase()?'selected':'')+'>'+o+'</option>'}).join('')+'</select>':
      f.type==='number'?'<input type="number" id="af_'+f.id+'" value="'+(f.value||'')+'" placeholder="'+(f.placeholder||'')+'" step="0.1">':
      '<input type="text" id="af_'+f.id+'" value="'+(f.value||'')+'" placeholder="'+(f.placeholder||'')+'">')
    +'</div>'}).join('')
  +'</div></div>';
}

// ═══ SISTEMAS RENDER — MULTI-SELECT PATHOLOGIES ═══
function renderAnamSistemas(p){
  var draft=window._anamDraft||{};
  var patSystems=draft._sistemas||[];

  return '<div class="card" style="border-top:3px solid var(--primary)"><div class="card-header"><span class="card-title">⚡ Sistemas clínicos implicados</span>'
  +'<span class="badge badge-neutral">'+patSystems.length+' sistema(s) activo(s)</span></div>'
  +'<div class="card-body">'
  +'<p style="font-size:.78rem;color:var(--text3);margin-bottom:14px">Seleccione los sistemas afectados. Puede elegir <strong>múltiples patologías</strong> dentro de cada sistema. Las preguntas y recomendaciones se generarán automáticamente.</p>'
  +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">'
  +ANAM_SYSTEMS.map(function(s){
    var active=patSystems.includes(s.id);
    var selectedPaths=draft['_syspaths_'+s.id]||[];
    // Legacy single-select compat
    var legacySingle=draft['_syspath_'+s.id];
    if(legacySingle&&!selectedPaths.length) selectedPaths=[legacySingle];

    return '<div style="padding:14px;border-radius:var(--radius-sm);border:2px solid '+(active?s.color:'var(--border)')+';background:'+(active?s.color+'12':'var(--surface)')+';cursor:pointer;transition:all .2s" onclick="toggleAnamSystemDraft(\''+s.id+'\')">'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span style="font-size:1.3rem">'+s.ic+'</span><div><strong style="font-size:.82rem">'+s.name+'</strong>'+(active?'<span style="display:block;font-size:.6rem;color:'+s.color+';font-weight:700">✓ ACTIVO — '+selectedPaths.length+' patología(s)</span>':'')+'</div></div>'
    // Pathology chips — MULTI SELECT
    +'<div style="display:flex;flex-wrap:wrap;gap:3px" onclick="event.stopPropagation()">'
    +s.pathologies.map(function(pp){
      var sel=selectedPaths.includes(pp);
      return '<span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:.65rem;font-weight:600;cursor:pointer;transition:all .15s;border:1px solid '+(sel?s.color:'var(--border)')+';background:'+(sel?s.color:'var(--surface2)')+';color:'+(sel?'#fff':'var(--text3)')+'" onclick="event.stopPropagation();toggleAnamPathology(\''+s.id+'\',\''+pp.replace(/'/g,"\\'")+'\')">'+pp+'</span>';
    }).join('')
    +'</div></div>';
  }).join('')
  +'</div></div></div>';
}

// ═══ TOGGLE SYSTEM ═══
function toggleAnamSystemDraft(sysId){
  if(!window._anamDraft) window._anamDraft={};
  if(!window._anamDraft._sistemas) window._anamDraft._sistemas=[];
  var sys=window._anamDraft._sistemas;
  var idx=sys.indexOf(sysId);
  if(idx>=0){
    sys.splice(idx,1);
    delete window._anamDraft['_syspaths_'+sysId];
    delete window._anamDraft['_syspath_'+sysId];
  } else {
    sys.push(sysId);
    if(!window._anamDraft['_syspaths_'+sysId]) window._anamDraft['_syspaths_'+sysId]=[];
  }
  hTab('anamnesis');
}

// ═══ TOGGLE INDIVIDUAL PATHOLOGY (multi-select within a system) ═══
function toggleAnamPathology(sysId,pathName){
  if(!window._anamDraft) window._anamDraft={};
  if(!window._anamDraft._sistemas) window._anamDraft._sistemas=[];

  // Auto-activate system if not active
  if(!window._anamDraft._sistemas.includes(sysId)){
    window._anamDraft._sistemas.push(sysId);
  }

  if(!window._anamDraft['_syspaths_'+sysId]) window._anamDraft['_syspaths_'+sysId]=[];
  var paths=window._anamDraft['_syspaths_'+sysId];
  var idx=paths.indexOf(pathName);
  if(idx>=0) paths.splice(idx,1);
  else paths.push(pathName);

  // Legacy compat: also set single select to first
  window._anamDraft['_syspath_'+sysId]=paths[0]||'';

  // If no paths selected, deactivate system
  if(!paths.length){
    var sysIdx=window._anamDraft._sistemas.indexOf(sysId);
    if(sysIdx>=0) window._anamDraft._sistemas.splice(sysIdx,1);
  }

  hTab('anamnesis');
}

// Legacy compat
function toggleAnamSystem(patId,sysId){toggleAnamSystemDraft(sysId)}
