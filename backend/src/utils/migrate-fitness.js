// Database migration — Fitness Platform Integration tables
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('../config/db');

const FITNESS_SCHEMA = `
-- ==========================================
-- Veridia Fitness Platform Integration
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fitness platform connections per patient
CREATE TABLE IF NOT EXISTS fitness_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  platform VARCHAR(30) NOT NULL CHECK (platform IN ('google_fit', 'apple_health', 'fitbit', 'samsung_health', 'garmin')),
  external_user_id VARCHAR(200),
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT '{}',
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(paciente_id, platform)
);

-- Fitness activities imported from platforms
CREATE TABLE IF NOT EXISTS fitness_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES fitness_connections(id) ON DELETE CASCADE,
  platform VARCHAR(30) NOT NULL,
  external_id VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  steps INTEGER DEFAULT 0,
  calories_burned DECIMAL(8,2) DEFAULT 0,
  distance_meters DECIMAL(8,2) DEFAULT 0,
  active_minutes INTEGER DEFAULT 0,
  intensity VARCHAR(20) CHECK (intensity IN ('light', 'moderate', 'vigorous', 'unknown')),
  source_data JSONB DEFAULT '{}',
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(paciente_id, platform, external_id)
);

-- Patient activity factor overrides (manual adjustments by nutritionist)
CREATE TABLE IF NOT EXISTS patient_activity_factors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  factor DECIMAL(4,3) NOT NULL CHECK (factor >= 1.0 AND factor <= 2.5),
  label VARCHAR(50) DEFAULT 'custom',
  reason TEXT,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(paciente_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fitness_connections_paciente ON fitness_connections(paciente_id, active);
CREATE INDEX IF NOT EXISTS idx_fitness_activities_paciente ON fitness_activities(paciente_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_fitness_activities_connection ON fitness_activities(connection_id);
CREATE INDEX IF NOT EXISTS idx_fitness_activities_type ON fitness_activities(type);
CREATE INDEX IF NOT EXISTS idx_patient_activity_factors_paciente ON patient_activity_factors(paciente_id, active);

-- Updated timestamp trigger for fitness_connections
DO $$ BEGIN
  CREATE TRIGGER trg_fitness_connections_updated BEFORE UPDATE ON fitness_connections FOR EACH ROW EXECUTE FUNCTION update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Updated timestamp trigger for patient_activity_factors
DO $$ BEGIN
  CREATE TRIGGER trg_patient_activity_factors_updated BEFORE UPDATE ON patient_activity_factors FOR EACH ROW EXECUTE FUNCTION update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
`;

const DEV = process.env.NODE_ENV !== 'production';

async function migrateFitness() {
  if (DEV) console.log('🔄 Running fitness migration...');
  try {
    await pool.query(FITNESS_SCHEMA);
    if (DEV) console.log('✅ Fitness migration complete');
  } catch (err) {
    console.error('❌ Fitness migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrateFitness();
