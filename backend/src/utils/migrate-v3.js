require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('../config/db');

const SQL = `
  CREATE TABLE IF NOT EXISTS ai_scribe_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    professional_id UUID NOT NULL REFERENCES users(id),
    audio_url TEXT,
    transcription TEXT,
    soap_note JSONB,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_ai_scribe_patient ON ai_scribe_notes(patient_id);
  CREATE INDEX IF NOT EXISTS idx_ai_scribe_professional ON ai_scribe_notes(professional_id);

  CREATE TABLE IF NOT EXISTS meal_plan_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    objectives JSONB NOT NULL,
    duration_days INTEGER DEFAULT 7,
    is_auto_generated BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS meal_plan_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_template_id UUID REFERENCES meal_plan_templates(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    meals JSONB NOT NULL,
    total_calories INTEGER,
    total_macros JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_meal_plan_templates_created ON meal_plan_templates(created_by);
  CREATE INDEX IF NOT EXISTS idx_meal_plan_days_plan ON meal_plan_days(plan_template_id);

  ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS password_hash TEXT;
  ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT false;
  ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS portal_token UUID UNIQUE;

  CREATE TABLE IF NOT EXISTS patient_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_patient_sessions_patient ON patient_sessions(patient_id);
  CREATE INDEX IF NOT EXISTS idx_patient_sessions_token ON patient_sessions(token);

  CREATE TABLE IF NOT EXISTS automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id INTEGER,
    name VARCHAR(255) NOT NULL,
    trigger VARCHAR(100) NOT NULL,
    conditions JSONB,
    actions JSONB,
    active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    automation_id UUID REFERENCES automations(id),
    trigger_data JSONB,
    result JSONB,
    executed_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_automations_trigger ON automations(trigger);
  CREATE INDEX IF NOT EXISTS idx_automations_active ON automations(active);
  CREATE INDEX IF NOT EXISTS idx_automation_logs_automation ON automation_logs(automation_id);

  CREATE TABLE IF NOT EXISTS patient_food_journals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    date DATE NOT NULL,
    meals JSONB,
    symptoms TEXT[],
    exercise JSONB,
    water_intake INTEGER DEFAULT 0,
    mood VARCHAR(50),
    notes TEXT,
    photo_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id, date)
  );

  CREATE INDEX IF NOT EXISTS idx_patient_food_journals_patient ON patient_food_journals(patient_id);
  CREATE INDEX IF NOT EXISTS idx_patient_food_journals_date ON patient_food_journals(date);
`;

async function migrate() {
  await pool.query(SQL);
  console.log('✅ migrate-v3: tablas Fase 1 creadas');
  await pool.end();
}

migrate().catch(e => { console.error(e); process.exit(1); });
