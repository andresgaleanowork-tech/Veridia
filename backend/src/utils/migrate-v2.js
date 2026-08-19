// Migration v2 — Schema updates for React frontend
// Adds missing columns, tables, and constraints
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('../config/db');

const MIGRATION_V2 = `
-- ==========================================
-- Veridia Migration v2 — Schema Updates
-- ==========================================

-- Add 'trial' role to users constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'nutricionista', 'secretaria', 'trial'));

-- Add missing columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_expires DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dni VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS telefono VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS titulacion VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS matricula VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pais VARCHAR(50);

-- Add missing columns to patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS consents JSONB DEFAULT '{}';

-- Add missing columns to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS acta JSONB DEFAULT '{}';

-- Add missing columns to recipes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'local';
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS mealdb_id VARCHAR(20);

-- Add updated_at trigger to meal_plans
DO $$ BEGIN
  CREATE TRIGGER trg_meal_plans_updated BEFORE UPDATE ON meal_plans FOR EACH ROW EXECUTE FUNCTION update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add updated_at trigger to cash_sessions
DO $$ BEGIN
  CREATE TRIGGER trg_cash_sessions_updated BEFORE UPDATE ON cash_sessions FOR EACH ROW EXECUTE FUNCTION update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- NEW TABLE: gastos (accounting expenses)
CREATE TABLE IF NOT EXISTS gastos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria VARCHAR(50) NOT NULL,
  descripcion TEXT,
  importe DECIMAL(10,2) NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  metodo_pago VARCHAR(30),
  recurrente BOOLEAN DEFAULT false,
  frecuencia VARCHAR(20),
  proveedor VARCHAR(200),
  notas TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);

-- NEW TABLE: horarios_block (blocked agenda slots)
CREATE TABLE IF NOT EXISTS horarios_block (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  motivo TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_horarios_block_fecha ON horarios_block(fecha);

-- NEW TABLE: plan_templates
CREATE TABLE IF NOT EXISTS plan_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  kcal_objetivo INTEGER,
  prot_g INTEGER,
  grasas_g INTEGER,
  hc_g INTEGER,
  comidas JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NEW TABLE: patient_weight_goals
CREATE TABLE IF NOT EXISTS patient_weight_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  peso_inicio DECIMAL(5,1),
  peso_objetivo DECIMAL(5,1),
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  fecha_objetivo DATE,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_weight_goals_paciente ON patient_weight_goals(paciente_id);

-- NEW TABLE: token_blacklist (refresh token revocation)
CREATE TABLE IF NOT EXISTS token_blacklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token ON token_blacklist(token);
`;

const DEV = process.env.NODE_ENV !== 'production';

async function migrateV2() {
  if (DEV) console.log('🔄 Running migration v2...');
  try {
    await pool.query(MIGRATION_V2);
    if (DEV) console.log('✅ Migration v2 complete');
  } catch (err) {
    console.error('❌ Migration v2 failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrateV2();
