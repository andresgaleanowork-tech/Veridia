require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('../config/db');

const MIGRATION_REPORTS = `
-- ==========================================
-- Veridia Migration — Reports & Templates
-- ==========================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  plantilla VARCHAR(100) DEFAULT 'default',
  titulo VARCHAR(255),
  file_content TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_paciente ON reports(paciente_id);
CREATE INDEX IF NOT EXISTS idx_reports_tipo ON reports(tipo);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50) NOT NULL,
  contenido JSONB DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_templates_tipo ON report_templates(tipo);
`;

const DEV = process.env.NODE_ENV !== 'production';

async function migrateReports() {
  if (DEV) console.log('🔄 Running migration reports...');
  try {
    await pool.query(MIGRATION_REPORTS);
    if (DEV) console.log('✅ Migration reports complete');
  } catch (err) {
    console.error('❌ Migration reports failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrateReports();
