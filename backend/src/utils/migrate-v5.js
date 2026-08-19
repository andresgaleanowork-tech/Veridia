require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('../config/db');

const SQL = `
  CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    settings JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id INTEGER REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    permissions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id),
    role_id UUID REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
  );

  CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
  CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);

  ALTER TABLE IF EXISTS foods ADD COLUMN IF NOT EXISTS region VARCHAR(100);
  ALTER TABLE IF EXISTS foods ADD COLUMN IF NOT EXISTS is_local BOOLEAN DEFAULT false;
  ALTER TABLE IF EXISTS foods ADD COLUMN IF NOT EXISTS source VARCHAR(100);
  CREATE INDEX IF NOT EXISTS idx_foods_region ON foods(region);
`;

async function migrate() {
  await pool.query(SQL);
  console.log('✅ migrate-v5: tenants, roles, user_roles');
  await pool.end();
}
migrate().catch(e => { console.error(e); process.exit(1); });
