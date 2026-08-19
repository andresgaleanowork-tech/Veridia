# Database Schema — localStorage + Firestore

## Primary Store: `localStorage('veridia_db')`

```javascript
const DB = {
  // ═══ CORE ENTITIES ═══
  patients: [{
    id: Number,              // Auto-increment from DB.nextPId
    nombre: String,
    apellidos: String,
    dni: String,             // Unique identifier
    fechaNacimiento: String, // 'YYYY-MM-DD'
    sexo: 'FEMENINO'|'MASCULINO'|'OTRO',
    email: String,
    telefono: String,
    direccion: String,
    profesion: String,
    nacionalidad: String,
    estadoCivil: String,
    educacion: String,
    procedencia: String,
    motivoConsulta: String,
    grupoSanguineo: String, // 'A+', 'O-', etc.
    tags: [String],          // ['diabetes', 'embarazo']
    portalPass: String,      // Portal del Paciente password
    portalRegistered: Boolean,
    foto: String,            // Base64 data URL (max 300KB)
    activo: Boolean,
    clinicaId: Number,
    createdAt: String        // 'YYYY-MM-DD'
  }],

  antropometrias: [{
    id: Number,
    pacienteId: Number,
    fecha: String,           // 'YYYY-MM-DD'
    peso: Number,            // kg
    altura: Number,          // cm
    imc: Number,             // auto-calculated
    cintura: Number,         // cm
    cadera: Number,          // cm
    pantorrilla: Number,     // cm
    grasaCorporal: Number,   // %
    masaMuscular: Number,    // kg
    grasaVisceral: Number,   // level
    pliegueBicipital: Number,    // mm (NEW v5.2)
    pliegueTricipital: Number,   // mm
    pliegueSubescapular: Number, // mm
    pliegueSuprailiaco: Number,  // mm
    dinamometria: Number,    // kg (NEW v5.2)
    ict: Number,             // Índice Cintura-Talla (NEW v5.2)
    metodo: 'BIA'|'Pliegues'|'DEXA'|'Cinta métrica'
  }],

  analiticas: [{
    id: Number,
    pacienteId: Number,
    fecha: String,
    ayuno: Boolean,
    marcadores: [{
      nombre: String,        // 'Glucosa', 'HbA1c', 'LDL', etc.
      valor: Number,
      unidad: String,        // 'mg/dL', '%', 'ng/mL', etc.
      rango: String,         // '70-100', '<200', '>40'
      alerta: null|'leve'|'moderada'|'grave'
    }]
    // Auto-calculated indices from clinical-tools.js:
    // HOMA-IR, TG/HDL, FLI, FIB-4, PCR
  }],

  appointments: [{
    id: Number,
    pacienteId: Number,
    profesional: String,     // 'Lic. Antonella Caverzan'
    fecha: String,
    hora: String,            // 'HH:MM'
    tipo: 'Primera visita'|'Revisión'|'Online',
    asunto: String,
    estado: 'Pendiente'|'Confirmada'|'Realizada'|'No asistió'|'Cancelada',
    pago: 'Pendiente'|'Pagado'|'Anulado',
    precio: Number,
    nota: String,
    duracion: Number,        // minutes
    color: 'first'|'review'|'online',
    enfermedad: String,
    sintomas: String,
    medicamentos: String,
    acta: {                  // Filled when marked as "Realizada"
      hallazgos: String,
      acuerdos: String,
      proximos: String,
      duracionReal: Number,
      profesional: String
    },
    _recurring: Boolean,
    _reminderSent: Boolean
  }],

  invoices: [{
    id: Number,
    numero: String,          // 'FAC-2026-00001'
    pacienteId: Number,
    fecha: String,
    estado: 'Pendiente'|'Pagada'|'Vencida'|'Anulada',
    total: Number,           // with tax
    lineas: [{
      servicio: String,
      cantidad: Number,
      precio: Number,
      precioOriginal: Number,
      descuento: Number,     // %
      iva: Number            // %
    }],
    pagos: [{
      metodo: 'Efectivo'|'Tarjeta'|'Transferencia'|'Bono',
      importe: Number,
      fecha: String
    }]
  }],

  cashSession: {
    id: Number,
    fecha: String,
    estado: 'Abierta'|'Cerrada',
    saldoInicial: Number,
    movimientos: [{
      tipo: 'Ingreso'|'Egreso',
      concepto: String,
      importe: Number,
      metodo: String,
      hora: String
    }]
  },

  // ═══ CLINICAL DATA ═══
  recipes: [{
    id: Number,
    nombre: String,
    categoria: String,
    raciones: Number,
    kcal: Number, prot: Number, grasas: Number, hc: Number, fibra: Number,
    ingredientes: [String|Object],
    pasos: [String],
    source: String,          // 'TheMealDB' or null
    sourceThumb: String,
    v: Number                // version
  }],

  alerts: [{
    id: Number,
    pacienteId: Number,
    tipo: String,
    severidad: 'leve'|'moderada'|'grave'|'critica',
    mensaje: String,
    recomendacion: String,
    fecha: String,
    estado: 'pendiente'|'revisada',
    valor: String,
    umbral: String
  }],

  // ═══ ANAMNESIS (v3) ═══
  anamnesisData: {
    // [pacienteId]: Array of anamnesis snapshots
    // Each: { fecha, template, profesional, sistemas:[], respuestas:{}, redFlags:[] }
  },

  // ═══ FORMULA RESULTS ═══
  formulaResults: {
    // [pacienteId]: Array of { fecha, formula, peso, altura, edad, sexo, geb, get, protG, grasasG, hcG, ... }
  },

  // ═══ MEDICATIONS ═══
  patMeds: {
    // [pacienteId]: [{ nombre, dosis, frecuencia, desde, interaccion }]
  },

  // ═══ DOCUMENTS ═══
  patDocuments: {
    // [pacienteId]: [{ nombre, tipo, notas, fecha, data(base64), fileName }]
  },

  // ═══ RESTAURACIÓN COLECTIVA ═══
  rcCentros: [{
    id: Number, nombre: String, tipo: String, // 'colegio'|'hospital'|'geriatrico'|...
    direccion: String, contacto: String, telefono: String,
    comensales: Number, turnos: [String],
    derivacionesActivas: [String], comensalesPorDerivacion: {}
  }],
  rcMenus: [{
    id: Number, centroId: Number, nombre: String,
    fechaInicio: String, fechaFin: String,
    dias: [String], platos: {}, // {dia_turno: [{nombre,tipo,carga,alergenos,iddsi}]}
    derivaciones: {}, estado: 'borrador'|'publicado'|'archivado'
  }],
  rcProveedores: [{ id, nombre, cif, contacto, email, categoria, productos }],
  rcLotes: [{ id, proveedor, producto, numLote, fechaRecepcion, caducidad, platosUsados, centrosAfectados, estado }],
  rcMermas: [{ id, fecha, plato, centro, racionesServidas, racionesDesechadas, kgDesechados, pctRechazo, motivo }],
  rcAppcc: [{ id, fecha, hora, punto, plato, temperatura, resultado, responsable, observaciones, foto }],

  // ═══ CONTABILIDAD ═══
  gastos: [{ id, concepto, importe, categoria, fecha, nota }],
  productos: [{ id, nombre, categoria, precioCompra, precioVenta, stock, descripcion, activo }],
  inventario: [{ id, productoId, producto, tipo, cantidad, fecha, nota }],
  gastosRecurrentes: [{ id, concepto, importe, categoria, frecuencia, activo }],
  presupuesto: {}, // { 'YYYY-MM': { ingresos, gastos } }

  // ═══ MISC ═══
  auditLog: [],    // { action, target, date, time }
  iaHistory: [],   // { q, a, fecha }
  feedback: [],    // NPS responses
  alimentosCustom: [], // Custom foods
  favFoods: [],    // Favorite foods
  customPlatos: [], // Compound dishes
  nextPId: Number,
  nextAId: Number,
  nextIId: Number,
  rcNextCentroId: Number,
  rcNextMenuId: Number,
};
```

## Other localStorage Keys
- `veridia_api_config` — API keys (Gemini, Firebase, USDA)
- `veridia_chats` — Chat messages (synced between portals)
- `veridia_portal_pending` — Portal patient registrations pending approval
- `veridia_cookies_accepted` — Cookie consent
- `veridia_ia_consent` — RGPD AI consent
- `veridia_currency` — Selected currency code
- `veridia_lang` — Selected language
- `veridia_theme_color` — Primary color hex
- `veridia_goal_[patId]` — Weight goal per patient
- `veridia_diario_[patId]` — Food diary entries
- `veridia_sintomas_[patId]` — Symptom tracker entries
- `veridia_profile` — Professional profile data
- `veridia_clinica` — Clinic name/data

## Firestore Structure
```
clinics/
  clinic_default/
    patients: []
    antropometrias: []
    analiticas: []
    appointments: []
    mealPlans: []
    alerts: []
    // Full DB sync via fbSyncDB()
```

## Memory Management
- `trimDBArrays()`: auditLog:500, alerts:200, feedback:100, rcAppcc:500, rcMermas:300, rcLotes:200, chat:200/patient
- `getStorageUsage()`: warns at 80%, critical at 90% of 5MB localStorage
