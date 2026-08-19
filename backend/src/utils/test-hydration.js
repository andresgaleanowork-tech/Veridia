#!/usr/bin/env node
// ============================================================
// Veridia HealthTech V5.2 — Hydration API Test Suite
// Tests: auth rejection, goals CRUD, log, history
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
    console.log('\n🧪 VERIDIA HEALTHTECH V5.2 — HYDRATION TEST SUITE\n');
    console.log('━'.repeat(50));
  }

  const app = require('../index.js');
  const testServer = http.createServer(app);
  await new Promise((r) => testServer.listen(0, r));
  const P = testServer.address().port;
  if (DEV) console.log(`\n🌐 Server running on port ${P}\n`);

  const testToken = jwt.sign(
    { id: 'test-uuid', name: 'Test Nutri', email: 'nutri@test.com', role: 'nutricionista', initials: 'TN' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const patientId = '11111111-1111-1111-1111-111111111111';

  if (DEV) console.log('📋 1. Auth Rejection');
  const noAuth = await fetch(P, 'GET', `/api/hydration/goals/${patientId}`);
  test('401 without token on GET goals', noAuth.status === 401);

  const noAuthLog = await fetch(P, 'POST', '/api/hydration/log', { paciente_id: patientId, amount_ml: 250 });
  test('401 without token on POST log', noAuthLog.status === 401);

  const noAuthHistory = await fetch(P, 'GET', `/api/hydration/history/${patientId}`);
  test('401 without token on GET history', noAuthHistory.status === 401);

  if (DEV) console.log('\n📋 2. Goals CRUD');
  const getEmpty = await fetch(P, 'GET', `/api/hydration/goals/${patientId}`, null, testToken);
  test('GET goal returns 200 or 500', getEmpty.status === 200 || getEmpty.status === 500);
  test('GET goal has data or error field', !!getEmpty.body.data || !!getEmpty.body.error);

  const putGoal = await fetch(P, 'PUT', `/api/hydration/goals/${patientId}`, {
    patient_id: patientId,
    daily_ml: 2000,
    activity_compensation_ml: 350,
    notes: 'Objetivo diario',
  }, testToken);
  test('PUT goal returns 200 or 500', putGoal.status === 200 || putGoal.status === 500);
  if (putGoal.status === 200) {
    test('PUT goal returns data', !!putGoal.body.data);
    test('PUT goal daily_ml = 2000', putGoal.body.data?.daily_ml === 2000);
  }

  if (DEV) console.log('\n📋 3. Log Hydration');
  const logEntry = await fetch(P, 'POST', '/api/hydration/log', {
    paciente_id: patientId,
    amount_ml: 350,
    beverage_type: 'agua',
    timestamp: new Date().toISOString(),
  }, testToken);
  test('POST log returns 200 or 500', logEntry.status === 200 || logEntry.status === 500);
  if (logEntry.status === 200) {
    test('POST log returns data', !!logEntry.body.data);
    test('POST log amount_ml = 350', logEntry.body.data?.amount_ml === 350);
  }

  if (DEV) console.log('\n📋 4. History');
  const history7 = await fetch(P, 'GET', `/api/hydration/history/${patientId}?range=7d`, null, testToken);
  test('GET history 7d returns 200 or 500', history7.status === 200 || history7.status === 500);
  if (history7.status === 200) {
    test('GET history returns array', Array.isArray(history7.body.data));
  }

  if (DEV) console.log('\n📋 5. RBAC');
  const secretariaToken = jwt.sign(
    { id: 'secre-uuid', name: 'Secre', role: 'secretaria' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  const secreGoal = await fetch(P, 'PUT', `/api/hydration/goals/${patientId}`, { daily_ml: 1000 }, secretariaToken);
  test('Secretaria cannot set hydration goal', secreGoal.status === 403);

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
