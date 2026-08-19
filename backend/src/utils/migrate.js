// Database migration — creates all tables
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('../config/db');

const SCHEMA = `
-- ==========================================
-- Veridia Pro V5 — PostgreSQL Schema
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS (authentication + roles)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'nutricionista', 'secretaria')),
  initials VARCHAR(4),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PATIENTS
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  dni VARCHAR(20) UNIQUE,
  fecha_nacimiento DATE,
  sexo VARCHAR(20) CHECK (sexo IN ('MASCULINO', 'FEMENINO', 'OTRO')),
  email VARCHAR(200),
  telefono VARCHAR(30),
  direccion TEXT,
  profesion VARCHAR(100),
  nacionalidad VARCHAR(50),
  estado_civil VARCHAR(30),
  educacion VARCHAR(50),
  procedencia VARCHAR(100),
  motivo_consulta TEXT,
  grupo_sanguineo VARCHAR(10),
  activo BOOLEAN DEFAULT true,
  clinica_id INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLINICAL HISTORIES (versioned)
CREATE TABLE IF NOT EXISTS clinical_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  antecedentes TEXT,
  antecedentes_familiares TEXT,
  alergias TEXT,
  medicacion TEXT,
  suplementacion TEXT,
  historial_ponderal JSONB DEFAULT '{}',
  actividad_fisica JSONB DEFAULT '{}',
  habitos_toxicos TEXT,
  sueno TEXT,
  estres TEXT,
  ingesta_hidrica TEXT,
  observaciones TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ANAMNESIS (multiple per patient, timestamped)
CREATE TABLE IF NOT EXISTS anamnesis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  fecha DATE DEFAULT CURRENT_DATE,
  template VARCHAR(30),
  profesional VARCHAR(200),
  sistemas TEXT[] DEFAULT '{}',
  respuestas JSONB DEFAULT '{}',
  red_flags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ANTHROPOMETRICS
CREATE TABLE IF NOT EXISTS antropometrias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  peso DECIMAL(5,1),
  altura DECIMAL(5,1),
  imc DECIMAL(4,1),
  cintura DECIMAL(5,1),
  cadera DECIMAL(5,1),
  pantorrilla DECIMAL(5,1),
  grasa_corporal DECIMAL(4,1),
  masa_muscular DECIMAL(5,1),
  grasa_visceral DECIMAL(4,1),
  metodo VARCHAR(30) DEFAULT 'BIA',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ANALYTICS (lab results)
CREATE TABLE IF NOT EXISTS analiticas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  ayuno BOOLEAN DEFAULT true,
  marcadores JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPOINTMENTS
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  profesional VARCHAR(200),
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  tipo VARCHAR(30),
  asunto TEXT,
  estado VARCHAR(20) DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Confirmada', 'Realizada', 'No asistió', 'Cancelada')),
  pago VARCHAR(20) DEFAULT 'Pendiente',
  precio DECIMAL(8,2) DEFAULT 0,
  duracion INTEGER DEFAULT 45,
  nota TEXT,
  enfermedad TEXT,
  sintomas TEXT,
  medicamentos TEXT,
  color VARCHAR(20) DEFAULT 'review',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero VARCHAR(30) UNIQUE NOT NULL,
  paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado VARCHAR(20) DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Pagada', 'Vencida', 'Anulada')),
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  lineas JSONB DEFAULT '[]',
  pagos JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CASH SESSION
CREATE TABLE IF NOT EXISTS cash_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado VARCHAR(20) DEFAULT 'Abierta' CHECK (estado IN ('Abierta', 'Cerrada')),
  saldo_inicial DECIMAL(10,2) DEFAULT 0,
  movimientos JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RECIPES
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  categoria VARCHAR(30),
  raciones INTEGER DEFAULT 1,
  kcal DECIMAL(8,1),
  prot DECIMAL(6,1),
  grasas DECIMAL(6,1),
  hc DECIMAL(6,1),
  fibra DECIMAL(6,1),
  ingredientes TEXT[] DEFAULT '{}',
  pasos TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MEAL PLANS
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  nombre VARCHAR(200),
  estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'borrador')),
  fecha_creacion DATE DEFAULT CURRENT_DATE,
  kcal_objetivo INTEGER,
  prot_g INTEGER,
  grasas_g INTEGER,
  hc_g INTEGER,
  fibra_g INTEGER,
  agua_l DECIMAL(3,1),
  formula_usada VARCHAR(50),
  factor_actividad DECIMAL(4,3),
  patologia VARCHAR(200),
  dias JSONB DEFAULT '[]',
  comidas JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLINICAL ALERTS
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tipo VARCHAR(30),
  severidad VARCHAR(20) CHECK (severidad IN ('leve', 'moderada', 'grave', 'critica')),
  mensaje TEXT NOT NULL,
  recomendacion TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'revisada')),
  fecha DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MESSAGES (patient <-> nutritionist)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL CHECK (sender IN ('patient', 'nutri')),
  text TEXT NOT NULL,
  "read" BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOG
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  usuario VARCHAR(200),
  rol VARCHAR(30),
  accion VARCHAR(30) NOT NULL,
  entidad VARCHAR(100),
  paciente VARCHAR(200),
  ip VARCHAR(50),
  detalles JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TOKEN BLACKLIST (for JWT revocation)
CREATE TABLE IF NOT EXISTS token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  reason VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token ON token_blacklist(token);

-- FOOD FAVORITES
CREATE TABLE IF NOT EXISTS food_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_data JSONB NOT NULL,
  source VARCHAR(10) DEFAULT 'BEDCA',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CUSTOM DISHES
CREATE TABLE IF NOT EXISTS custom_dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  raciones INTEGER DEFAULT 1,
  ingredientes JSONB DEFAULT '[]',
  kcal DECIMAL(8,1),
  prot DECIMAL(6,1),
  grasas DECIMAL(6,1),
  hc DECIMAL(6,1),
  fibra DECIMAL(6,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PATIENT DIARY (from portal)
CREATE TABLE IF NOT EXISTS patient_diary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  toma VARCHAR(30),
  texto TEXT,
  hora TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PATIENT SYMPTOMS (from portal)
CREATE TABLE IF NOT EXISTS patient_symptoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo VARCHAR(20) CHECK (tipo IN ('animo', 'hambre', 'sueno', 'sintoma')),
  valor TEXT,
  hora TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_patients_activo ON patients(activo);
CREATE INDEX IF NOT EXISTS idx_patients_dni ON patients(dni);
CREATE INDEX IF NOT EXISTS idx_antropometrias_paciente ON antropometrias(paciente_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_analiticas_paciente ON analiticas(paciente_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_fecha ON appointments(fecha, hora);
CREATE INDEX IF NOT EXISTS idx_appointments_paciente ON appointments(paciente_id);
CREATE INDEX IF NOT EXISTS idx_invoices_paciente ON invoices(paciente_id);
CREATE INDEX IF NOT EXISTS idx_invoices_estado ON invoices(estado);
CREATE INDEX IF NOT EXISTS idx_alerts_estado ON alerts(estado);
CREATE INDEX IF NOT EXISTS idx_messages_paciente ON messages(paciente_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meal_plans_paciente ON meal_plans(paciente_id, estado);
CREATE INDEX IF NOT EXISTS idx_clinical_histories_paciente ON clinical_histories(paciente_id);

-- Updated trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
`;

const DEV = process.env.NODE_ENV !== 'production';

async function migrate() {
  if (DEV) console.log('🔄 Running database migration...');
  try {
    await pool.query(SCHEMA);
    if (DEV) console.log('✅ Migration complete — all tables created');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();

// ═══════════════════════════════════════════
//  PERFORMANCE INDEXES
//  Run after initial migration
// ═══════════════════════════════════════════

const INDEXES = `
-- Patient lookups
CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(active);
CREATE INDEX IF NOT EXISTS idx_patients_clinic ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_dni ON patients(dni);

-- Anthropometry by patient + date
CREATE INDEX IF NOT EXISTS idx_antro_patient ON antropometrias(patient_id);
CREATE INDEX IF NOT EXISTS idx_antro_fecha ON antropometrias(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_antro_patient_fecha ON antropometrias(patient_id, fecha DESC);

-- Analytics by patient
CREATE INDEX IF NOT EXISTS idx_anal_patient ON analiticas(patient_id);
CREATE INDEX IF NOT EXISTS idx_anal_fecha ON analiticas(fecha DESC);

-- Appointments by date (most common query)
CREATE INDEX IF NOT EXISTS idx_appt_fecha ON appointments(fecha);
CREATE INDEX IF NOT EXISTS idx_appt_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appt_estado ON appointments(estado);
CREATE INDEX IF NOT EXISTS idx_appt_fecha_estado ON appointments(fecha, estado);

-- Invoices by patient + status (billing queries)
CREATE INDEX IF NOT EXISTS idx_inv_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_inv_estado ON invoices(estado);
CREATE INDEX IF NOT EXISTS idx_inv_fecha ON invoices(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_inv_patient_estado ON invoices(patient_id, estado);

-- Meal plans by patient
CREATE INDEX IF NOT EXISTS idx_plans_patient ON meal_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_plans_estado ON meal_plans(estado);

-- Messages by patient
CREATE INDEX IF NOT EXISTS idx_msg_patient ON messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_msg_read ON messages(read);

-- Audit log by date
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);

-- Alerts by patient + status
CREATE INDEX IF NOT EXISTS idx_alerts_patient ON alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_estado ON alerts(estado);

-- Favorites
CREATE INDEX IF NOT EXISTS idx_favs_user ON food_favorites(user_id);
`;

const DEV = process.env.NODE_ENV !== 'production';

async function createIndexes(pool) {
  try {
    await pool.query(INDEXES);
    if (DEV) console.log('✅ Performance indexes created/verified');
  } catch (err) {
    console.error('❌ Index creation error:', err.message);
  }
}

module.exports.createIndexes = createIndexes;
module.exports.INDEXES = INDEXES;
