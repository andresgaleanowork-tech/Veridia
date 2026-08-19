// Seed initial users (run after migrate)
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

const DEV = process.env.NODE_ENV !== 'production';

async function seed() {
  if (DEV) console.log('🌱 Seeding initial users...');
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;

  const users = [
    { name: 'Andrés Galeano', email: 'admin@veridia.tech', password: 'Admin2026!', role: 'admin', initials: 'AG' },
    { name: 'Lic. Antonella Caverzan', email: 'antonella@veridia.tech', password: 'Nutri2026!', role: 'nutricionista', initials: 'AC' },
    { name: 'María Recepción', email: 'maria@veridia.tech', password: 'Secre2026!', role: 'secretaria', initials: 'MR' },
  ];

  for (const u of users) {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
    if (exists.rows.length) {
      if (DEV) console.log(`  ⏭ ${u.email} ya existe`);
      continue;
    }
    const hash = await bcrypt.hash(u.password, rounds);
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role, initials) VALUES ($1, $2, $3, $4, $5)',
      [u.name, u.email, hash, u.role, u.initials]
    );
    if (DEV) console.log(`  ✅ ${u.name} (${u.role}) — ${u.email}`);
  }

  if (DEV) console.log('✅ Seed complete');
  await pool.end();
}

seed().catch(err => { console.error('❌ Seed error:', err.message); process.exit(1); });
