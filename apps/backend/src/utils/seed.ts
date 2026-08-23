// Seed initial users and demo patients
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import { createLogger } from '../utils/logger.js';

const seedLogger = createLogger('SEED');

async function seed() {
  seedLogger.info('Seeding initial users...');
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');

  const users = [
    { name: 'Andrés Galeano', email: 'admin@veridia.tech', password: 'Admin2026!', role: 'admin', initials: 'AG' },
    { name: 'Lic. Antonella Caverzan', email: 'antonella@veridia.tech', password: 'Nutri2026!', role: 'nutricionista', initials: 'AC' },
    { name: 'María Recepción', email: 'maria@veridia.tech', password: 'Secre2026!', role: 'secretaria', initials: 'MR' },
  ];

  for (const u of users) {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
    if (exists.rows.length) {
      seedLogger.debug(`User already exists`, { email: u.email });
      continue;
    }
    const hash = await bcrypt.hash(u.password, rounds);
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role, initials) VALUES ($1, $2, $3, $4, $5)',
      [u.name, u.email, hash, u.role, u.initials]
    );
    seedLogger.info('User created', { name: u.name, role: u.role, email: u.email });
  }

  // Seed demo patients
  seedLogger.info('Seeding demo patients...');

  const demoPatients = [
    { nombre: 'María', apellidos: 'González López', dni: '12345678A', fecha_nacimiento: '1985-03-12', sexo: 'FEMENINO', email: 'maria.gonzalez@email.com', telefono: '600111222' },
    { nombre: 'Carlos', apellidos: 'Rodríguez Pérez', dni: '87654321B', fecha_nacimiento: '1978-07-25', sexo: 'MASCULINO', email: 'carlos.rodriguez@email.com', telefono: '600333444' },
    { nombre: 'Ana', apellidos: 'Martínez Silva', dni: '11223344C', fecha_nacimiento: '1992-11-08', sexo: 'FEMENINO', email: 'ana.martinez@email.com', telefono: '600555666' },
    { nombre: 'Pedro', apellidos: 'Sánchez García', dni: '44332211D', fecha_nacimiento: '1965-05-18', sexo: 'MASCULINO', email: 'pedro.sanchez@email.com', telefono: '600777888' },
    { nombre: 'Laura', apellidos: 'Fernández Ruiz', dni: '55667788E', fecha_nacimiento: '1998-01-30', sexo: 'FEMENINO', email: 'laura.fernandez@email.com', telefono: '600999000' },
  ];

  for (const p of demoPatients) {
    const exists = await pool.query('SELECT id FROM patients WHERE dni = $1', [p.dni]);
    if (exists.rows.length) {
      seedLogger.debug(`Patient already exists`, { dni: p.dni });
      continue;
    }
    await pool.query(
      'INSERT INTO patients (nombre, apellidos, dni, fecha_nacimiento, sexo, email, telefono) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [p.nombre, p.apellidos, p.dni, p.fecha_nacimiento, p.sexo, p.email, p.telefono]
    );
    seedLogger.info('Patient created', { nombre: p.nombre, apellidos: p.apellidos, dni: p.dni });
  }

  seedLogger.info('Seed completed');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      seedLogger.error('Seed error', { error: err.message, stack: err.stack });
      process.exit(1);
    });
}

export { seed };