// ═══════════════════════════════════════════════════════
// VERIDIA HEALTHTECH — v-pathology.js
// Pathology protocols, FODMAP, EII, cetogénica, sarcopenia,
// bariátrica, prediabetes, drug interactions, purinas, alérgenos
// ═══════════════════════════════════════════════════════

var PURINAS_CLASSIFICATION = {
  alto: ['Vísceras (hígado, riñón)','Marisco (mejillones, gambas)','Anchoas','Sardinas','Arenque','Extracto de carne','Levadura de cerveza'],
  moderado: ['Carnes rojas','Pollo','Pavo','Legumbres','Espinacas','Espárragos','Champiñones','Coliflor','Guisantes'],
  bajo: ['Lácteos desnatados','Huevos','Cereales','Pan','Pasta','Arroz','Frutas','Verduras (mayoría)','Frutos secos','Aceite de oliva','Café','Té']
};

var EII_FASES = {
  brote: { nombre:'Brote agudo', dieta:'Dieta baja en fibra insoluble, baja en residuos', evitar:['Lácteos','Fibra insoluble','Alimentos crudos','Picantes','Alcohol','Cafeína','Fritos','Legumbres enteras'], permitir:['Arroz blanco','Pan blanco tostado','Pollo hervido','Pescado blanco','Plátano maduro','Zanahoria cocida','Patata cocida','Caldo desgrasado'], suplementos:['Hierro IV si anemia','Vitamina B12','Ácido fólico','Zinc','Glutamina (controvertido)'] },
  remision: { nombre:'Remisión', dieta:'Dieta mediterránea adaptada, reintroducción progresiva', evitar:['Ultraprocesados','Alcohol excesivo','Emulsionantes (E466, E433)'], permitir:['Verduras cocidas → crudas gradual','Frutas peladas','Legumbres (trituradas primero)','Pescado azul (omega-3)','Yogur (si tolera)','Frutos secos (triturados primero)'], suplementos:['Probióticos (cepas específicas)','Omega-3','Vitamina D','Hierro oral si tolera'] }
};

var FODMAP_CLASSIFICATION = {
  alto: ['Ajo','Cebolla','Trigo','Centeno','Manzana','Pera','Sandía','Mango','Leche','Yogur','Miel','Champiñones','Coliflor','Alcachofa','Lentejas','Garbanzos','Judías','Aguacate','Ciruela'],
  bajo: ['Arroz','Avena','Quinoa','Patata','Zanahoria','Calabacín','Pepino','Lechuga','Espinacas','Tomate','Plátano (verde)','Arándanos','Fresa','Naranja','Kiwi','Pollo','Pescado','Huevo','Aceite de oliva','Queso curado','Mantequilla']
};

var DIETA_CETOGENICA = {
  clasica_4_1: { ratio:'4:1', grasaPct:90, protPct:6, hcPct:4, nota:'Más restrictiva, mayor eficacia en epilepsia refractaria' },
  clasica_3_1: { ratio:'3:1', grasaPct:87, protPct:8, hcPct:5, nota:'Moderada, para niños pequeños o inicio' },
  MCT: { ratio:'MCT', grasaPct:71, protPct:10, hcPct:19, nota:'Con aceite MCT, permite más HC y proteína' },
  atkins_mod: { ratio:'Atkins mod.', grasaPct:65, protPct:25, hcPct:10, nota:'Menos restrictiva, HC <20g/día, sin ratio fijo' }
};

var EWGSOP2_CRITERIA = {
  screening: { tool:'SARC-F', cutoff:'≥4 puntos', questions:['Fuerza','Asistencia caminando','Levantarse de silla','Subir escaleras','Caídas'] },
  diagnosis: { measure:'Fuerza de prensión (dinamometría)', cutoff_m:'<27 kg', cutoff_f:'<16 kg' },
  confirmation: { measure:'Masa muscular (DEXA/BIA)', cutoff_m:'<7.0 kg/m²', cutoff_f:'<5.5 kg/m²' },
  severity: { measure:'Rendimiento físico (velocidad marcha)', cutoff:'<0.8 m/s' },
  plan: { proteina:'1.2-1.5 g/kg/día (con leucina ≥3g/comida)', distribucion:'Distribuir proteína en 3-4 comidas (25-40g/comida)', suplementos:['Vitamina D (800-1000 UI)','HMB (3g/día)','Creatina (3-5g/día)','Omega-3 (EPA+DHA 2g)'], ejercicio:'Resistencia progresiva 2-3x/semana + balance + marcha', leucina_rich:['Suero de leche (whey)','Pollo','Atún','Soja','Huevo','Leche'] }
};

var DPP_PROTOCOL = {
  objetivo:'Pérdida 5-7% peso corporal + 150 min/semana actividad moderada',
  dieta: { kcal:'Déficit 500-750 kcal/día', grasa:'<30% del VET, saturada <10%', fibra:'≥25 g/día', hc:'45-55% VET, bajo IG preferente', patron:'Dieta mediterránea o DASH' },
  metas_semanales: ['Semana 1-4: Automonitoreo de ingesta','Semana 5-8: Aumento gradual actividad','Semana 9-16: Estrategias conductuales','Semana 17-24: Mantenimiento y ajustes'],
  monitoreo: ['Glucosa ayunas cada 3 meses','HbA1c cada 6 meses','Peso semanal','Perímetro cintura mensual']
};

var BARIATRICA_FASES = [
  {fase:1,nombre:'Líquidos claros',dias:'1-2 días',permitido:['Agua','Caldo desgrasado','Gelatina sin azúcar','Infusiones'],ml_vez:'30-60 ml'},
  {fase:2,nombre:'Líquidos completos',dias:'2-14 días',permitido:['Leche desnatada','Yogur líquido sin azúcar','Proteína líquida','Sopas coladas'],ml_vez:'60-120 ml'},
  {fase:3,nombre:'Puré / Triturado',dias:'14-30 días',permitido:['Purés de verdura','Pollo triturado','Pescado desmenuzado','Huevo revuelto blando','Fruta triturada'],g_vez:'60-120 g'},
  {fase:4,nombre:'Blanda',dias:'30-60 días',permitido:['Pollo tierno','Pescado al vapor','Verdura muy cocida','Fruta blanda','Pan tostado blando'],g_vez:'120-180 g'},
  {fase:5,nombre:'Normal adaptada',dias:'>60 días',permitido:['Dieta normal adaptada','Masticar 20-30 veces','No beber con comidas','Suplementos vitales de por vida'],g_vez:'150-250 g'}
];

var ALERGENOS_REACTIVIDAD = {
  leche: { grupo:'Proteínas lácteas', cruzado:['Leche de cabra (92%)','Leche de oveja (90%)','Leche de búfala'], alternativas:['Bebida de soja','Bebida de avena','Bebida de almendra','Bebida de arroz'] },
  huevo: { grupo:'Proteínas de huevo', cruzado:['Clara más que yema','Huevo de codorniz (posible)'], alternativas:['Sustitutos veganos (lino+agua, chía+agua, puré de manzana en repostería)'] },
  pescado: { grupo:'Parvalbúminas', cruzado:['Otros pescados (50-70%)','No con marisco'], alternativas:['Omega-3 de linaza/chía/nueces','Suplemento DHA de alga'] },
  marisco: { grupo:'Tropomiosina', cruzado:['Crustáceos entre sí (75%)','Moluscos (menor)','Ácaros del polvo (posible)'], alternativas:['Proteínas de carne/pollo/huevo','Legumbres'] },
  frutos_secos: { grupo:'Proteínas de almacenamiento', cruzado:['Nuez-pecana (alta)','Anacardo-pistacho (alta)','Almendra-avellana (moderada)'], alternativas:['Semillas (girasol, calabaza, sésamo)','Coco (generalmente tolerado)'] },
  trigo: { grupo:'Gliadinas/gluteninas', cruzado:['Centeno','Cebada','Espelta','Kamut'], alternativas:['Arroz','Maíz','Quinoa','Trigo sarraceno','Mijo','Sorgo'] }
};

var DRUG_NUTRIENT_INTERACTIONS = [
  {farmaco:'Metformina',nutriente:'Vitamina B12',efecto:'Reduce absorción de B12 (20-30% tras 4+ años)',accion:'Monitorizar B12, suplementar si <300 pg/mL'},
  {farmaco:'Omeprazol/IBP',nutriente:'Calcio, Magnesio, B12, Hierro',efecto:'Reduce absorción por aumento pH gástrico',accion:'Suplementar Ca citrato (no carbonato), monitorizar Mg y B12'},
  {farmaco:'Estatinas',nutriente:'CoQ10',efecto:'Reduce síntesis de Coenzima Q10',accion:'Considerar suplementar CoQ10 100-200mg si mialgia'},
  {farmaco:'Warfarina',nutriente:'Vitamina K',efecto:'Vitamina K antagoniza el efecto anticoagulante',accion:'Mantener ingesta de vit K CONSTANTE (no eliminar)'},
  {farmaco:'Corticoides',nutriente:'Calcio, Vitamina D',efecto:'Aumenta pérdida de Ca, reduce absorción',accion:'Suplementar Ca 1000mg + Vit D 800UI, monitorizar DEXA'},
  {farmaco:'Diuréticos tiazida',nutriente:'Potasio, Magnesio',efecto:'Aumenta excreción renal de K y Mg',accion:'Dieta rica en K (plátano, patata), monitorizar electrolitos'},
  {farmaco:'Diuréticos asa',nutriente:'Potasio, Calcio, Magnesio',efecto:'Pérdida aumentada de K, Ca, Mg',accion:'Suplementar K, monitorizar Ca y Mg'},
  {farmaco:'Levotiroxina',nutriente:'Calcio, Hierro, Soja, Fibra',efecto:'Reducen absorción si se toman juntos',accion:'Tomar levotiroxina 60 min antes de Ca/Fe/soja/fibra'},
  {farmaco:'Litio',nutriente:'Sodio',efecto:'Cambios en Na alteran niveles de litio',accion:'Mantener ingesta de Na constante, evitar restricción severa'},
  {farmaco:'Metotrexato',nutriente:'Ácido fólico',efecto:'Antagonista del folato',accion:'Suplementar ácido fólico 5mg/semana (día diferente al MTX)'},
  {farmaco:'IECA',nutriente:'Potasio',efecto:'Retención de K (riesgo hiperpotasemia)',accion:'Limitar alimentos ricos en K si eGFR <45'},
  {farmaco:'Antiepilépticos',nutriente:'Vitamina D, Ácido fólico, Calcio',efecto:'Aumentan catabolismo de Vit D, reducen folato',accion:'Suplementar VitD 1000UI, folato 1mg, monitorizar Ca'},
  {farmaco:'Orlistat',nutriente:'Vitaminas liposolubles (A,D,E,K)',efecto:'Reduce absorción de grasas y vitaminas liposolubles',accion:'Suplementar ADEK al acostarse (≥2h después de orlistat)'},
  {farmaco:'Antibióticos',nutriente:'Probióticos, Hierro, Calcio',efecto:'Alteran microbiota, quelación con minerales',accion:'Probióticos post-antibiótico, separar Fe/Ca 2h del ATB'}
];
function getDrugInteractions(medicamentos) {
  if (!medicamentos || !medicamentos.length) return [];
  var results = []; medicamentos.forEach(function(med) { var medLower = (med.nombre || med || '').toLowerCase(); DRUG_NUTRIENT_INTERACTIONS.forEach(function(inter) { if (medLower.includes(inter.farmaco.toLowerCase()) || inter.farmaco.toLowerCase().includes(medLower)) results.push(inter) }) });
  return results;
}

var BRISTOL_SCALE = [
  {tipo:1,desc:'Trozos duros separados (difícil de evacuar)',img:'🟤⚫',indica:'Estreñimiento severo'},
  {tipo:2,desc:'Forma de salchicha pero grumosa',img:'🟤🟤',indica:'Estreñimiento'},
  {tipo:3,desc:'Salchicha con grietas en superficie',img:'🟤',indica:'Normal'},
  {tipo:4,desc:'Salchicha lisa y blanda',img:'🟫',indica:'Normal ideal'},
  {tipo:5,desc:'Trozos blandos con bordes definidos',img:'🟡',indica:'Falta de fibra'},
  {tipo:6,desc:'Trozos blandos, bordes irregulares',img:'🟡💧',indica:'Diarrea leve'},
  {tipo:7,desc:'Acuosa, sin trozos sólidos',img:'💧',indica:'Diarrea'}
];

var FFQ_CATEGORIES = [
  {cat:'Lácteos',items:['Leche','Yogur','Queso curado','Queso fresco']},
  {cat:'Proteínas',items:['Carne roja','Pollo/Pavo','Pescado blanco','Pescado azul','Huevos','Legumbres']},
  {cat:'Cereales',items:['Pan blanco','Pan integral','Arroz','Pasta','Cereales desayuno']},
  {cat:'Frutas y Verduras',items:['Frutas frescas','Verduras cocidas','Ensalada/crudas','Zumo natural']},
  {cat:'Grasas',items:['Aceite de oliva','Mantequilla','Frutos secos','Aguacate']},
  {cat:'Otros',items:['Azúcar/Miel','Refrescos','Alcohol','Bollería/Dulces','Snacks salados','Comida rápida']}
];
var FFQ_FREQUENCIES = ['Nunca','<1/sem','1-2/sem','3-4/sem','5-6/sem','1/día','2-3/día','>3/día'];

var ESTACIONALIDAD = {
  ene:['Naranja','Mandarina','Kiwi','Manzana','Pera','Alcachofa','Brócoli','Coliflor','Espinacas','Puerro'],
  feb:['Naranja','Mandarina','Fresa (inicio)','Alcachofa','Brócoli','Espárragos','Espinacas','Acelga'],
  mar:['Fresa','Naranja','Kiwi','Espárrago','Alcachofa','Habas','Guisantes','Espinacas'],
  abr:['Fresa','Cereza (inicio)','Níspero','Espárrago','Guisantes','Habas','Judías verdes','Lechuga'],
  may:['Cereza','Fresa','Melocotón (inicio)','Albaricoque','Calabacín','Judías verdes','Tomate','Pepino'],
  jun:['Cereza','Melocotón','Sandía','Melón','Ciruela','Tomate','Pimiento','Berenjena','Calabacín'],
  jul:['Sandía','Melón','Melocotón','Nectarina','Higo','Tomate','Pimiento','Berenjena','Maíz'],
  ago:['Sandía','Melón','Higo','Uva','Tomate','Pimiento','Berenjena'],
  sep:['Uva','Higo','Manzana','Pera','Granada','Seta','Calabaza','Berenjena'],
  oct:['Manzana','Pera','Granada','Caqui','Mandarina','Calabaza','Setas','Boniato'],
  nov:['Naranja','Mandarina','Caqui','Granada','Kiwi','Alcachofa','Calabaza','Boniato','Col'],
  dic:['Naranja','Mandarina','Kiwi','Piña','Manzana','Col','Brócoli','Coliflor','Puerro']
};
function getSeasonalFoods(month) { var months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']; return ESTACIONALIDAD[months[month !== undefined ? month : new Date().getMonth()]] || [] }

function scaleRecipe(recipe, newRaciones) {
  if (!recipe || !recipe.raciones || recipe.raciones <= 0) return recipe;
  var factor = newRaciones / recipe.raciones; var scaled = JSON.parse(JSON.stringify(recipe)); scaled.raciones = newRaciones;
  scaled.kcal = Math.round((scaled.kcal || 0) * factor); scaled.prot = Math.round(((scaled.prot || 0) * factor) * 10) / 10; scaled.grasas = Math.round(((scaled.grasas || 0) * factor) * 10) / 10; scaled.hc = Math.round(((scaled.hc || 0) * factor) * 10) / 10;
  if (scaled.ingredientes) { scaled.ingredientes = scaled.ingredientes.map(function(ing) { if (typeof ing === 'object') { var copy = JSON.parse(JSON.stringify(ing)); if (copy.g) copy.g = Math.round(copy.g * factor); if (copy.gramos) copy.gramos = Math.round(copy.gramos * factor); if (copy.cantidad) copy.cantidad = Math.round(copy.cantidad * factor); return copy } return ing }) }
  return scaled;
}

function getBirthdayAlerts(daysAhead) {
  daysAhead = daysAhead || 7; var today = new Date();
  return DB.patients.filter(function(p) { if (!p.activo || !p.fechaNacimiento) return false; var bd = new Date(p.fechaNacimiento); bd.setFullYear(today.getFullYear()); if (bd < today) bd.setFullYear(today.getFullYear() + 1); return Math.ceil((bd - today) / 86400000) <= daysAhead }).map(function(p) { var bd = new Date(p.fechaNacimiento); bd.setFullYear(today.getFullYear()); if (bd < today) bd.setFullYear(today.getFullYear() + 1); return { paciente: p, dias: Math.ceil((bd - today) / 86400000), edad: today.getFullYear() - new Date(p.fechaNacimiento).getFullYear(), fecha: bd.toISOString().slice(0, 10) } });
}
