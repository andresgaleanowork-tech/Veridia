// ===== VERIDIA i18n — Multi-idioma + Multi-moneda =====
// Idiomas soportados: ES (default), EN, PT
// Monedas soportadas: EUR (€), USD ($), ARS ($), MXN ($), CLP ($), COP ($), PEN (S/), GBP (£)

var LANG = 'es'; // Default
var CURRENCY = 'EUR'; // Default

// ===== CONFIGURACIÓN DE MONEDAS =====
var CURRENCIES = {
  EUR: { symbol: '€', name: 'Euro', pos: 'after', decimals: 2, tax: 'IVA', taxRate: 21 },
  USD: { symbol: '$', name: 'Dólar estadounidense', pos: 'before', decimals: 2, tax: 'Tax', taxRate: 0 },
  ARS: { symbol: '$', name: 'Peso argentino', pos: 'before', decimals: 0, tax: 'IVA', taxRate: 21 },
  MXN: { symbol: '$', name: 'Peso mexicano', pos: 'before', decimals: 2, tax: 'IVA', taxRate: 16 },
  CLP: { symbol: '$', name: 'Peso chileno', pos: 'before', decimals: 0, tax: 'IVA', taxRate: 19 },
  COP: { symbol: '$', name: 'Peso colombiano', pos: 'before', decimals: 0, tax: 'IVA', taxRate: 19 },
  PEN: { symbol: 'S/', name: 'Sol peruano', pos: 'before', decimals: 2, tax: 'IGV', taxRate: 18 },
  GBP: { symbol: '£', name: 'Libra esterlina', pos: 'before', decimals: 2, tax: 'VAT', taxRate: 20 },
  BRL: { symbol: 'R$', name: 'Real brasileño', pos: 'before', decimals: 2, tax: 'ICMS', taxRate: 17 }
};

// Format money with the active currency
function fMoney(amount) {
  if (amount === null || amount === undefined) return '—';
  var c = CURRENCIES[CURRENCY] || CURRENCIES.EUR;
  var val = c.decimals === 0 ? Math.round(amount).toLocaleString() : Number(amount).toFixed(c.decimals);
  return c.pos === 'before' ? c.symbol + val : val + c.symbol;
}

// Get tax label (IVA, VAT, IGV, etc.)
function taxLabel() { return (CURRENCIES[CURRENCY] || CURRENCIES.EUR).tax; }
// Get tax rate for active currency
function taxRate() { return (CURRENCIES[CURRENCY] || CURRENCIES.EUR).taxRate; }

// ===== DICCIONARIO i18n =====
var I18N = {
  es: {
    // === COMMON ===
    save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar', close: 'Cerrar',
    search: 'Buscar', filter: 'Filtrar', new: 'Nuevo', back: 'Volver', next: 'Siguiente', previous: 'Anterior',
    yes: 'Sí', no: 'No', confirm: 'Confirmar', loading: 'Cargando...', ok: 'Aceptar',
    actions: 'Acciones', details: 'Detalles', export: 'Exportar', import: 'Importar', print: 'Imprimir',
    download: 'Descargar', upload: 'Subir', reset: 'Reiniciar', refresh: 'Actualizar',

    // === AUTH ===
    login: 'Iniciar Sesión', logout: 'Cerrar sesión', register: 'Registrar',
    email: 'Email', password: 'Contraseña', forgot_password: 'Recuperar contraseña',
    welcome: 'Bienvenido/a', create_account: 'Crear Cuenta',

    // === NAV ===
    dashboard: 'Dashboard', agenda: 'Agenda Clínica', patients: 'Pacientes',
    clinical_history: 'Historia Clínica', anthropometry: 'Antropometría', analytics: 'Analíticas',
    clinical_alerts: 'Alertas Clínicas', clinical_formula: 'Fórmula Clínica', desarrollada: 'Desarrollada',
    food_database: 'Base de Datos Alimentos', recipes: 'Recetas', meal_plans: 'Planes Alimentarios',
    billing: 'Facturación', cash_register: 'Caja', messages: 'Mensajes', ia_copilot: 'IA Copilot',
    audit: 'Auditoría', restauracion: 'Restauración Colectiva',

    // === RESTAURACIÓN COLECTIVA ===
    rc_title: 'Restauración Colectiva', rc_resumen: 'Resumen', rc_centros: 'Centros',
    rc_menus: 'Menús', rc_escalado: 'Escalado', rc_costeo: 'Costeo',
    rc_auditoria: 'Auditoría', rc_appcc: 'APPCC', rc_trazabilidad: 'Trazabilidad',
    rc_mermas: 'Mermas',

    // === PATIENTS ===
    patient: 'Paciente', new_patient: 'Nuevo paciente', edit_patient: 'Editar paciente',
    name: 'Nombre', surname: 'Apellidos', dni: 'DNI', birthdate: 'Fecha nacimiento',
    sex: 'Sexo', female: 'Femenino', male: 'Masculino', other: 'Otro',
    phone: 'Teléfono', address: 'Dirección', profession: 'Profesión',
    nationality: 'Nacionalidad', consultation_reason: 'Motivo de consulta',
    blood_type: 'Grupo sanguíneo', tags: 'Etiquetas', active: 'Activo', archived: 'Archivado',

    // === APPOINTMENTS ===
    appointment: 'Cita', new_appointment: 'Nueva cita', today: 'Hoy', week: 'Semana', month: 'Mes',
    upcoming: 'Próximas', past: 'Anteriores', pending: 'Pendiente', confirmed: 'Confirmada',
    completed: 'Realizada', no_show: 'No asistió', cancelled: 'Cancelada',
    time: 'Hora', type: 'Tipo', status: 'Estado', professional: 'Profesional',

    // === CLINICAL ===
    weight: 'Peso', height: 'Altura', bmi: 'IMC', waist: 'Cintura', hip: 'Cadera',
    body_fat: '% Grasa corporal', muscle_mass: 'M. muscular', visceral_fat: 'Gr. visceral',
    method: 'Método', measurement: 'Medición', new_measurement: 'Nueva medición',
    underweight: 'Bajo peso', normal_weight: 'Normopeso', overweight: 'Sobrepeso',
    obesity_1: 'Obesidad I', obesity_2: 'Obesidad II', obesity_3: 'Obesidad III',

    // === FORMULA ===
    formula: 'Fórmula', activity_factor: 'Factor actividad', stress_factor: 'Factor estrés',
    sedentary: 'Sedentario', light: 'Ligera', moderate: 'Moderada', intense: 'Intensa',
    very_intense: 'Muy intensa', calculate: 'Calcular', results: 'Resultados',
    proteins: 'Proteínas', fats: 'Grasas', carbs: 'HC', fiber: 'Fibra', water: 'Agua',
    ideal_weight: 'Peso ideal', adjusted_weight: 'Peso ajustado',

    // === BILLING ===
    invoice: 'Factura', new_invoice: 'Nueva factura', invoiced: 'Facturado',
    paid: 'Pagada', unpaid: 'Pendiente', overdue: 'Vencida', voided: 'Anulada',
    collect: 'Cobrar', void_invoice: 'Anular', subtotal: 'Base imponible',
    total: 'Total', payment_method: 'Método de pago', cash: 'Efectivo',
    card: 'Tarjeta', transfer: 'Transferencia', service: 'Servicio', price: 'Precio',
    quantity: 'Cantidad', first_visit: 'Primera consulta', review: 'Revisión',

    // === CASH REGISTER ===
    opening_balance: 'Saldo inicial', income: 'Ingresos', expense: 'Egresos',
    close_cash: 'Cierre de caja', movement: 'Movimiento', new_movement: 'Nuevo movimiento',

    // === REPORTS ===
    clinical_report: 'Informe clínico', print_report: 'Imprimir informe',
    backup: 'Copia de seguridad', restore: 'Restaurar',

    // === MISC ===
    dark_mode: 'Modo oscuro', light_mode: 'Modo claro', quick_actions: 'Acciones rápidas',
    quick_navigation: 'Navegación rápida', no_data: 'Sin datos', no_results: 'Sin resultados',
    required_fields: 'Campos obligatorios', saved: 'Guardado', updated: 'Actualizado',
    deleted: 'Eliminado', created: 'Creado', error: 'Error',
    this_month: 'este mes', confidential: 'Documento confidencial',
    data_protected: 'Datos protegidos por RGPD',
    monthly_summary: 'Resumen del mes', weight_evolution: 'Evolución de peso',
    per_month: 'por mes', from_anthropometry: 'Datos reales de antropometría',
  },

  en: {
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', close: 'Close',
    search: 'Search', filter: 'Filter', new: 'New', back: 'Back', next: 'Next', previous: 'Previous',
    yes: 'Yes', no: 'No', confirm: 'Confirm', loading: 'Loading...', ok: 'OK',
    actions: 'Actions', details: 'Details', export: 'Export', import: 'Import', print: 'Print',
    download: 'Download', upload: 'Upload', reset: 'Reset', refresh: 'Refresh',

    login: 'Sign In', logout: 'Sign Out', register: 'Register',
    email: 'Email', password: 'Password', forgot_password: 'Forgot password',
    welcome: 'Welcome', create_account: 'Create Account',

    dashboard: 'Dashboard', agenda: 'Appointments', patients: 'Patients',
    clinical_history: 'Clinical History', anthropometry: 'Anthropometry', analytics: 'Lab Results',
    clinical_alerts: 'Clinical Alerts', clinical_formula: 'Clinical Formula', desarrollada: 'Meal Builder',
    food_database: 'Food Database', recipes: 'Recipes', meal_plans: 'Meal Plans',
    billing: 'Billing', cash_register: 'Cash Register', messages: 'Messages', ia_copilot: 'AI Copilot',
    audit: 'Audit Log', restauracion: 'Foodservice Management',
    rc_title: 'Foodservice Management', rc_resumen: 'Overview', rc_centros: 'Centers',
    rc_menus: 'Menus', rc_escalado: 'Scaling', rc_costeo: 'Costing',
    rc_auditoria: 'Audit', rc_appcc: 'HACCP', rc_trazabilidad: 'Traceability',
    rc_mermas: 'Waste',

    patient: 'Patient', new_patient: 'New patient', edit_patient: 'Edit patient',
    name: 'Name', surname: 'Surname', dni: 'ID Number', birthdate: 'Date of birth',
    sex: 'Sex', female: 'Female', male: 'Male', other: 'Other',
    phone: 'Phone', address: 'Address', profession: 'Profession',
    nationality: 'Nationality', consultation_reason: 'Reason for consultation',
    blood_type: 'Blood type', tags: 'Tags', active: 'Active', archived: 'Archived',

    appointment: 'Appointment', new_appointment: 'New appointment', today: 'Today', week: 'Week', month: 'Month',
    upcoming: 'Upcoming', past: 'Past', pending: 'Pending', confirmed: 'Confirmed',
    completed: 'Completed', no_show: 'No show', cancelled: 'Cancelled',
    time: 'Time', type: 'Type', status: 'Status', professional: 'Professional',

    weight: 'Weight', height: 'Height', bmi: 'BMI', waist: 'Waist', hip: 'Hip',
    body_fat: 'Body fat %', muscle_mass: 'Muscle mass', visceral_fat: 'Visceral fat',
    method: 'Method', measurement: 'Measurement', new_measurement: 'New measurement',
    underweight: 'Underweight', normal_weight: 'Normal weight', overweight: 'Overweight',
    obesity_1: 'Obesity I', obesity_2: 'Obesity II', obesity_3: 'Obesity III',

    formula: 'Formula', activity_factor: 'Activity factor', stress_factor: 'Stress factor',
    sedentary: 'Sedentary', light: 'Light', moderate: 'Moderate', intense: 'Intense',
    very_intense: 'Very intense', calculate: 'Calculate', results: 'Results',
    proteins: 'Proteins', fats: 'Fats', carbs: 'Carbs', fiber: 'Fiber', water: 'Water',
    ideal_weight: 'Ideal weight', adjusted_weight: 'Adjusted weight',

    invoice: 'Invoice', new_invoice: 'New invoice', invoiced: 'Invoiced',
    paid: 'Paid', unpaid: 'Unpaid', overdue: 'Overdue', voided: 'Voided',
    collect: 'Collect', void_invoice: 'Void', subtotal: 'Subtotal',
    total: 'Total', payment_method: 'Payment method', cash: 'Cash',
    card: 'Card', transfer: 'Transfer', service: 'Service', price: 'Price',
    quantity: 'Quantity', first_visit: 'First visit', review: 'Follow-up',

    opening_balance: 'Opening balance', income: 'Income', expense: 'Expenses',
    close_cash: 'Close register', movement: 'Transaction', new_movement: 'New transaction',

    clinical_report: 'Clinical report', print_report: 'Print report',
    backup: 'Backup', restore: 'Restore',

    dark_mode: 'Dark mode', light_mode: 'Light mode', quick_actions: 'Quick actions',
    quick_navigation: 'Quick navigation', no_data: 'No data', no_results: 'No results',
    required_fields: 'Required fields', saved: 'Saved', updated: 'Updated',
    deleted: 'Deleted', created: 'Created', error: 'Error',
    this_month: 'this month', confidential: 'Confidential document',
    data_protected: 'Data protected by GDPR',
    monthly_summary: 'Monthly summary', weight_evolution: 'Weight evolution',
    per_month: 'per month', from_anthropometry: 'Real anthropometry data',
  },

  pt: {
    save: 'Salvar', cancel: 'Cancelar', delete: 'Excluir', edit: 'Editar', close: 'Fechar',
    search: 'Pesquisar', filter: 'Filtrar', new: 'Novo', back: 'Voltar', next: 'Próximo', previous: 'Anterior',
    yes: 'Sim', no: 'Não', confirm: 'Confirmar', loading: 'Carregando...', ok: 'OK',
    actions: 'Ações', details: 'Detalhes', export: 'Exportar', import: 'Importar', print: 'Imprimir',
    download: 'Baixar', upload: 'Enviar', reset: 'Reiniciar', refresh: 'Atualizar',

    login: 'Entrar', logout: 'Sair', register: 'Registrar',
    email: 'Email', password: 'Senha', forgot_password: 'Esqueceu a senha',
    welcome: 'Bem-vindo/a', create_account: 'Criar Conta',

    dashboard: 'Painel', agenda: 'Agenda Clínica', patients: 'Pacientes',
    clinical_history: 'História Clínica', anthropometry: 'Antropometria', analytics: 'Análises',
    clinical_alerts: 'Alertas Clínicas', clinical_formula: 'Fórmula Clínica', desarrollada: 'Desenvolvida',
    food_database: 'Banco de Alimentos', recipes: 'Receitas', meal_plans: 'Planos Alimentares',
    billing: 'Faturamento', cash_register: 'Caixa', messages: 'Mensagens', ia_copilot: 'IA Copilot',
    audit: 'Auditoria', restauracion: 'Alimentação Coletiva',
    rc_title: 'Alimentação Coletiva', rc_resumen: 'Resumo', rc_centros: 'Centros',
    rc_menus: 'Menus', rc_escalado: 'Escalonamento', rc_costeo: 'Custeio',
    rc_auditoria: 'Auditoria', rc_appcc: 'APPCC', rc_trazabilidad: 'Rastreabilidade',
    rc_mermas: 'Desperdício',

    patient: 'Paciente', new_patient: 'Novo paciente', edit_patient: 'Editar paciente',
    name: 'Nome', surname: 'Sobrenome', dni: 'CPF', birthdate: 'Data de nascimento',
    sex: 'Sexo', female: 'Feminino', male: 'Masculino', other: 'Outro',
    phone: 'Telefone', address: 'Endereço', profession: 'Profissão',
    nationality: 'Nacionalidade', consultation_reason: 'Motivo da consulta',
    blood_type: 'Tipo sanguíneo', tags: 'Etiquetas', active: 'Ativo', archived: 'Arquivado',

    appointment: 'Consulta', new_appointment: 'Nova consulta', today: 'Hoje', week: 'Semana', month: 'Mês',
    upcoming: 'Próximas', past: 'Anteriores', pending: 'Pendente', confirmed: 'Confirmada',
    completed: 'Realizada', no_show: 'Não compareceu', cancelled: 'Cancelada',
    time: 'Hora', type: 'Tipo', status: 'Status', professional: 'Profissional',

    weight: 'Peso', height: 'Altura', bmi: 'IMC', waist: 'Cintura', hip: 'Quadril',
    body_fat: '% Gordura corporal', muscle_mass: 'Massa muscular', visceral_fat: 'Gordura visceral',
    method: 'Método', measurement: 'Medição', new_measurement: 'Nova medição',
    underweight: 'Abaixo do peso', normal_weight: 'Peso normal', overweight: 'Sobrepeso',
    obesity_1: 'Obesidade I', obesity_2: 'Obesidade II', obesity_3: 'Obesidade III',

    formula: 'Fórmula', activity_factor: 'Fator atividade', stress_factor: 'Fator estresse',
    sedentary: 'Sedentário', light: 'Leve', moderate: 'Moderada', intense: 'Intensa',
    very_intense: 'Muito intensa', calculate: 'Calcular', results: 'Resultados',
    proteins: 'Proteínas', fats: 'Gorduras', carbs: 'HC', fiber: 'Fibra', water: 'Água',
    ideal_weight: 'Peso ideal', adjusted_weight: 'Peso ajustado',

    invoice: 'Fatura', new_invoice: 'Nova fatura', invoiced: 'Faturado',
    paid: 'Paga', unpaid: 'Pendente', overdue: 'Vencida', voided: 'Anulada',
    collect: 'Receber', void_invoice: 'Anular', subtotal: 'Subtotal',
    total: 'Total', payment_method: 'Forma de pagamento', cash: 'Dinheiro',
    card: 'Cartão', transfer: 'Transferência', service: 'Serviço', price: 'Preço',
    quantity: 'Quantidade', first_visit: 'Primeira consulta', review: 'Retorno',

    opening_balance: 'Saldo inicial', income: 'Receitas', expense: 'Despesas',
    close_cash: 'Fechamento de caixa', movement: 'Movimento', new_movement: 'Novo movimento',

    clinical_report: 'Relatório clínico', print_report: 'Imprimir relatório',
    backup: 'Backup', restore: 'Restaurar',

    dark_mode: 'Modo escuro', light_mode: 'Modo claro', quick_actions: 'Ações rápidas',
    quick_navigation: 'Navegação rápida', no_data: 'Sem dados', no_results: 'Sem resultados',
    required_fields: 'Campos obrigatórios', saved: 'Salvo', updated: 'Atualizado',
    deleted: 'Excluído', created: 'Criado', error: 'Erro',
    this_month: 'este mês', confidential: 'Documento confidencial',
    data_protected: 'Dados protegidos pela LGPD',
    monthly_summary: 'Resumo do mês', weight_evolution: 'Evolução de peso',
    per_month: 'por mês', from_anthropometry: 'Dados reais de antropometria',
  }
};

// ===== TRANSLATE FUNCTION =====
function t(key) {
  var dict = I18N[LANG] || I18N.es;
  return dict[key] || (I18N.es[key]) || key;
}

// ===== SWITCH LANGUAGE =====
function setLang(lang) {
  if (!I18N[lang]) { toast('Idioma no disponible: ' + lang, 'error'); return; }
  LANG = lang;
  try { localStorage.setItem('veridia_lang', lang); } catch (e) { console.warn('[Veridia]', e.message || e); }
  // A4.6: Update HTML lang attribute for accessibility
  try { document.documentElement.lang = lang; } catch (e) { /* */ }
  // Re-render current module
  if (typeof navigate === 'function' && typeof curMod !== 'undefined') navigate(curMod);
  toast((lang === 'es' ? '🇪🇸 Español' : lang === 'en' ? '🇬🇧 English' : '🇧🇷 Português') + ' activado');
}

// ===== SWITCH CURRENCY =====
function setCurrency(code) {
  if (!CURRENCIES[code]) { toast('Moneda no disponible: ' + code, 'error'); return; }
  CURRENCY = code;
  // Update tax rates in SERVICES
  if (typeof SERVICES !== 'undefined') {
    var newRate = CURRENCIES[code].taxRate;
    SERVICES.forEach(function (s) { s.iva = newRate; });
  }
  try { localStorage.setItem('veridia_currency', code); } catch (e) { console.warn('[Veridia]', e.message || e); }
  if (typeof navigate === 'function' && typeof curMod !== 'undefined') navigate(curMod);
  toast(CURRENCIES[code].symbol + ' ' + CURRENCIES[code].name + ' · ' + taxLabel() + ' ' + taxRate() + '%');
}

// ===== SETTINGS MODAL =====
function openLocaleSettings() {
  var langOpts = [
    { code: 'es', flag: '🇪🇸', name: 'Español' },
    { code: 'en', flag: '🇬🇧', name: 'English' },
    { code: 'pt', flag: '🇧🇷', name: 'Português' }
  ];
  var currOpts = Object.entries(CURRENCIES).map(function (e) {
    return { code: e[0], symbol: e[1].symbol, name: e[1].name, tax: e[1].tax + ' ' + e[1].taxRate + '%' };
  });

  openModal(
    '<div class="modal-header"><h3>🌍 Idioma y moneda</h3><button onclick="closeModal()">' + IC.x + '</button></div>'
    + '<div class="modal-body">'
    + '<div class="form-group"><label class="form-label">Idioma de la interfaz</label>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    + langOpts.map(function (l) {
      return '<div style="padding:12px 18px;border-radius:var(--radius-xs);border:2px solid ' + (LANG === l.code ? 'var(--primary)' : 'var(--border)') + ';cursor:pointer;text-align:center;min-width:100px;background:' + (LANG === l.code ? 'var(--primary-light)' : 'var(--surface)') + '" onclick="setLang(\'' + l.code + '\');closeModal();setTimeout(openLocaleSettings,400)">'
        + '<div style="font-size:1.5rem">' + l.flag + '</div><div style="font-size:.78rem;font-weight:700;margin-top:4px">' + l.name + '</div></div>';
    }).join('')
    + '</div></div>'
    + '<div class="form-group" style="margin-top:18px"><label class="form-label">Moneda y fiscalidad</label>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px">'
    + currOpts.map(function (c) {
      return '<div style="padding:10px;border-radius:var(--radius-xs);border:2px solid ' + (CURRENCY === c.code ? 'var(--primary)' : 'var(--border)') + ';cursor:pointer;background:' + (CURRENCY === c.code ? 'var(--primary-light)' : 'var(--surface)') + '" onclick="setCurrency(\'' + c.code + '\');closeModal();setTimeout(openLocaleSettings,400)">'
        + '<div style="font-size:1rem;font-weight:800">' + c.symbol + ' ' + c.code + '</div><div style="font-size:.62rem;color:var(--text3)">' + c.name + '</div><div style="font-size:.58rem;color:var(--text3)">' + c.tax + '</div></div>';
    }).join('')
    + '</div></div>'
    + '<div class="form-group" style="margin-top:18px"><label class="form-label">🎨 Color primario</label>'
    + '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">'
    + ['#0891B2','#0E7490','#2563eb','#7c3aed','#db2777','#ea580c','#059669','#0f766e'].map(function(c){
      return '<div style="width:30px;height:30px;border-radius:50%;background:'+c+';cursor:pointer;border:3px solid '+(c===(localStorage.getItem('veridia_theme_color')||'#2E8B57')?'var(--text)':'transparent')+'" onclick="setThemeColor(\''+c+'\');closeModal();setTimeout(openLocaleSettings,300)"></div>';
    }).join('')
    + '<input type="color" value="'+(localStorage.getItem('veridia_theme_color')||'#2E8B57')+'" onchange="setThemeColor(this.value);closeModal();setTimeout(openLocaleSettings,300)" style="width:30px;height:30px;border:none;padding:0;cursor:pointer;border-radius:50%">'
    + '</div></div>'
    + '<div class="form-group" style="margin-top:18px"><label class="form-label">Timeout de sesión</label>'
    + '<div style="display:flex;gap:6px">'
    + [15,30,60].map(function(m){ return '<div style="padding:8px 14px;border-radius:var(--radius-xs);border:2px solid '+(Math.round(SESSION_TIMEOUT_MS/60000)===m?'var(--primary)':'var(--border)')+';cursor:pointer;text-align:center;background:'+(Math.round(SESSION_TIMEOUT_MS/60000)===m?'var(--primary-light)':'var(--surface)')+'" onclick="setSessionTimeout('+m+');closeModal();setTimeout(openLocaleSettings,400)"><strong>'+m+'</strong><div style="font-size:.6rem;color:var(--text3)">min</div></div>'}).join('')
    + '</div></div>'
    + '</div><div class="modal-footer"><button class="btn btn-primary" onclick="closeModal()">OK</button></div>'
  );
}

// ===== CUSTOM THEME COLOR =====
function setThemeColor(hex){
  // S1: Live preview with smooth transition
  document.body.style.transition='all .3s ease';
  document.documentElement.style.setProperty('--primary',hex);
  // Derive light variant
  var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  document.documentElement.style.setProperty('--primary-light','rgba('+r+','+g+','+b+',0.08)');
  document.documentElement.style.setProperty('--primary-glow','rgba('+r+','+g+','+b+',0.2)');
  document.documentElement.style.setProperty('--primary-dark','rgb('+Math.max(0,r-30)+','+Math.max(0,g-30)+','+Math.max(0,b-30)+')');
  try{localStorage.setItem('veridia_theme_color',hex)}catch(e){console.warn('[Veridia]',e.message||e)}
  document.querySelector('meta[name="theme-color"]').content=hex;
}
try{var savedColor=localStorage.getItem('veridia_theme_color');if(savedColor)setTimeout(function(){setThemeColor(savedColor)},0)}catch(e){console.warn('[Veridia]',e.message||e)}

// ===== AUTO-LOAD PREFERENCES =====
try {
  var savedLang = localStorage.getItem('veridia_lang');
  if (savedLang && I18N[savedLang]) LANG = savedLang;
  var savedCurr = localStorage.getItem('veridia_currency');
  if (savedCurr && CURRENCIES[savedCurr]) {
    CURRENCY = savedCurr;
    // Apply tax rate to services on load
    setTimeout(function () {
      if (typeof SERVICES !== 'undefined') {
        var rate = CURRENCIES[CURRENCY].taxRate;
        SERVICES.forEach(function (s) { s.iva = rate; });
      }
    }, 100);
  }
} catch (e) { console.warn('[Veridia]', e.message || e); }
