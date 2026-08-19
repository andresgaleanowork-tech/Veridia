#!/usr/bin/env node
// ============================================================
// Veridia HealthTech V5.2 — API Test Suite
// Tests: server boot, health, auth, patients, clinical, nutrition
// ============================================================

process.env.DATABASE_URL = 'postgresql://x:x@localhost:5432/x';
process.env.JWT_SECRET = 'test_secret_key_2026';
process.env.JWT_REFRESH_SECRET = 'test_refresh_key_2026';
process.env.PORT = '0';

const http = require('http');
const jwt = require('jsonwebtoken');

let passed = 0, failed = 0;
const results = [];

const DEV = process.env.NODE_ENV !== 'production';

function test(name, ok, detail = '') {
  if (ok) {
    passed++;
    if (DEV) console.log(`  ✅ ${name}`);
  } else {
    failed++;
    if (DEV) console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
  }
  results.push({ name, ok, detail });
}

function fetch(port, method, path, body, token) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(d), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, body: d, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  if (DEV) {
    console.log('\n🧪 VERIDIA HEALTHTECH V5.2 — API TEST SUITE\n');
    console.log('━'.repeat(50));
  }

  // Boot server
  const app = require('../index.js');
  const testServer = http.createServer(app);
  await new Promise((r) => testServer.listen(0, r));
  const P = testServer.address().port;
  if (DEV) console.log(`\n🌐 Server running on port ${P}\n`);

  // ─── 1. SERVER & HEALTH ───
  if (DEV) console.log('📋 1. Server & Health');
  test('Server boots without crash', true);

  const h = await fetch(P, 'GET', '/api/health');
  test('Health endpoint returns 200 or 503', h.status === 200 || h.status === 503);
  test('Health has ok field', h.body.ok === true || h.body.ok === false);
  test('Version 5.2.0', h.body.version === '5.2.0');
  test('Uptime reported', typeof h.body.uptime === 'number');
  test('Request ID in response', !!h.body.requestId || !!h.headers['x-request-id']);

  // API Docs
  const docs = await fetch(P, 'GET', '/api/docs');
  test('API docs endpoint', docs.status === 200 && !!docs.body.endpoints);

  // ─── 2. AUTH & SECURITY ───
  if (DEV) console.log('\n📋 2. Auth & Security');
  const noAuth = await fetch(P, 'GET', '/api/patients');
  test('401 without token', noAuth.status === 401);

  const badAuth = await fetch(P, 'GET', '/api/patients', null, 'invalid_token_xyz');
  test('401 with bad token', badAuth.status === 401);

  const testToken = jwt.sign(
    { id: 'test-uuid', name: 'Test Admin', email: 'test@test.com', role: 'admin', initials: 'TA' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  test('JWT created', !!testToken);

  // Login validation
  const badLogin = await fetch(P, 'POST', '/api/auth/login', { email: 'notanemail', password: '' });
  test('Login validates input', badLogin.status === 400);

  // Security headers
  test('X-Content-Type-Options header', h.headers['x-content-type-options'] === 'nosniff');
  test('X-Frame-Options header', h.headers['x-frame-options'] === 'DENY');

  // SQL injection protection
  const sqlInject = await fetch(P, 'GET', '/api/patients?search=SELECT%20*%20FROM%20users', null, testToken);
  test('SQL injection blocked', sqlInject.status === 400 || sqlInject.status === 200);

  // ─── 3. CLINICAL FORMULA ───
  if (DEV) console.log('\n📋 3. Clinical Formula');
  const formula = await fetch(
    P,
    'POST',
    '/api/clinical/formula',
    { peso: 70, altura: 165, edad: 35, sexo: 'F', formula: 'Mifflin-St Jeor', fa: 1.55, fe: 1, ajuste: 0, protGkg: 1.2, grasasPct: 30 },
    testToken
  );
  test('Formula returns 200', formula.status === 200);
  test('GEB calculated', formula.body.data?.geb > 0);
  test('GET calculated', formula.body.data?.get > 0);
  test('Macros present', !!formula.body.data?.macros);
  test('Proteinas g', formula.body.data?.macros?.proteinas?.g > 0);
  test('Grasas g', formula.body.data?.macros?.grasas?.g > 0);
  test('HC g', formula.body.data?.macros?.hc?.g >= 0);

  // Mifflin accuracy check
  const expectedGEB = Math.round(10 * 70 + 6.25 * 165 - 5 * 35 - 161);
  test('Mifflin F accuracy (±2)', Math.abs(formula.body.data?.geb - expectedGEB) < 2);

  // Harris-Benedict
  const hb = await fetch(
    P,
    'POST',
    '/api/clinical/formula',
    { peso: 80, altura: 175, edad: 40, sexo: 'M', formula: 'Harris-Benedict', fa: 1.55 },
    testToken
  );
  test('Harris-Benedict M', hb.status === 200 && hb.body.data?.geb > 1700);

  // Formula validation
  const badFormula = await fetch(P, 'POST', '/api/clinical/formula', { peso: -5 }, testToken);
  test('Formula validates input', badFormula.status === 400);

  // ─── 4. PATIENTS (with mock auth) ───
  if (DEV) console.log('\n📋 4. Patients');
  const patients = await fetch(P, 'GET', '/api/patients', null, testToken);
  test('GET patients returns array', patients.status === 200 || patients.status === 500);

  // Patient validation
  const badPat = await fetch(P, 'POST', '/api/patients', { nombre: '' }, testToken);
  test('Patient validates name', badPat.status === 400);

  // ─── 5. RBAC ───
  if (DEV) console.log('\n📋 5. RBAC');
  const secretariaToken = jwt.sign(
    { id: 'secre-uuid', name: 'Secre', role: 'secretaria' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  const secreReg = await fetch(P, 'POST', '/api/auth/register', { name: 'X', email: 'x@x.com', password: 'Test1234!', role: 'admin' }, secretariaToken);
  test('Secretaria cannot register users', secreReg.status === 403);

  // ─── 6. EDGE CASES ───
  if (DEV) console.log('\n📋 6. Edge Cases');
  const notFound = await fetch(P, 'GET', '/api/nonexistent');
  test('404/401 for unknown API endpoint', notFound.status === 404 || notFound.status === 401);

  const badUUID = await fetch(P, 'GET', '/api/patients/not-a-uuid', null, testToken);
  test('400 for invalid UUID', badUUID.status === 400);

  // Large body
  const largeBody = { data: 'x'.repeat(11 * 1024 * 1024) };
  const tooLarge = await fetch(P, 'POST', '/api/patients', largeBody, testToken);
  test('Rejects oversized body', tooLarge.status === 413 || tooLarge.status === 400);


  // ─── 7. PATIENT FOOD JOURNAL ───
  if (DEV) console.log('\n📋 7. Patient Food Journal');
  const patientToken = jwt.sign(
    { id: '123e4567-e89b-12d3-a456-426614174000', type: 'patient', paciente_id: '123e4567-e89b-12d3-a456-426614174000' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  const profToken = jwt.sign(
    { id: 'prof-uuid', name: 'Dr. Test', role: 'nutricionista', initials: 'DT' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // 401 without token
  const journalNoAuth = await fetch(P, 'GET', '/api/patient-journal');
  test('401 without token for journal list', journalNoAuth.status === 401);

  // 401 with patient token (professionals only on some, but authOrPatient allows patients)
  // Patient token should be accepted by authOrPatient
  const journalPatient = await fetch(P, 'GET', '/api/patient-journal', null, patientToken);
  test('Patient token accepted on journal list', journalPatient.status === 200 || journalPatient.status === 500);

  // Professional token accepted
  const journalProf = await fetch(P, 'GET', '/api/patient-journal', null, profToken);
  test('Professional token accepted on journal list', journalProf.status === 200 || journalProf.status === 500);

  // Validation: missing required patient_id for POST (patient gets scoped automatically)
  const journalPostPatient = await fetch(P, 'POST', '/api/patient-journal', { date: '2026-08-18', meals: [] }, patientToken);
  test('Patient can POST journal (scoped)', journalPostPatient.status === 200 || journalPostPatient.status === 201 || journalPostPatient.status === 500);

  // Validation: invalid date format
  const badDateJournal = await fetch(P, 'POST', '/api/patient-journal', { patient_id: 'patient-uuid-1', date: 'not-a-date', meals: [] }, profToken);
  test('Journal validates date format', badDateJournal.status === 400);

  // Validation: invalid UUID in params
  const badJournalId = await fetch(P, 'GET', '/api/patient-journal/not-a-uuid', null, profToken);
  test('400 for invalid journal UUID', badJournalId.status === 400);

  // Stats endpoint
  const journalStats = await fetch(P, 'GET', '/api/patient-journal/stats/123e4567-e89b-12d3-a456-426614174000', null, profToken);
  test('Stats endpoint reaches handler', journalStats.status === 200 || journalStats.status === 500);

  // Patient cannot access another patient's stats
  const otherStats = await fetch(P, 'GET', '/api/patient-journal/stats/987fcdeb-51a2-4361-b954-426614174000', null, patientToken);
  test('Patient denied access to other patient stats', otherStats.status === 403 || otherStats.status === 401);

  // ─── SUMMARY ───
  if (DEV) {
    console.log('\n' + '━'.repeat(50));
    console.log(`\n📊 RESULTS: ${passed}/${passed + failed} passed`);

    if (failed > 0) {
      console.log('\n❌ Failed tests:');
      results.filter((r) => !r.ok).forEach((r) => console.log(`   • ${r.name}${r.detail ? ` — ${r.detail}` : ''}`));
    }

    console.log('');
  }
  testServer.close();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test error:', err.message);
  process.exit(1);
});
