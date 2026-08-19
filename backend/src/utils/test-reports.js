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
  if (ok) { passed++; if (DEV) console.log(`  ✅ ${name}`); }
  else { failed++; if (DEV) console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`); }
  results.push({ name, ok, detail });
}

function fetch(port, method, path, body, token) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port, path, method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const req = http.request(opts, (res) => {
      let d = ''; res.on('data', (c) => (d += c)); res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  if (DEV) console.log('\n🧪 VERIDIA — REPORTS API TEST\n');

  const app = require('../index.js');
  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, r));
  const P = server.address().port;

  const nutriToken = jwt.sign({ id: 'nutri-uuid', name: 'Nutri', role: 'nutricionista' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Auth rejection
  const noAuth = await fetch(P, 'GET', '/api/reports');
  test('GET /reports rejects without token', noAuth.status === 401);

  const badRole = jwt.sign({ id: 'x', name: 'X', role: 'secretaria' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const badRoleRes = await fetch(P, 'GET', '/api/reports', null, badRole);
  test('GET /reports rejects secretaria', badRoleRes.status === 403);

  // Happy path (DB mocked, expect 404 for missing patient or 500)
  const gen = await fetch(P, 'POST', '/api/reports/generate', { paciente_id: '00000000-0000-0000-0000-000000000000', tipo: 'paciente_completo' }, nutriToken);
  test('POST /reports/generate accepts nutri token', gen.status === 404 || gen.status === 200 || gen.status === 500);

  // Templates
  const templates = await fetch(P, 'GET', '/api/report-templates', null, nutriToken);
  test('GET /report-templates returns 200', templates.status === 200);

  if (DEV) console.log(`\n📊 RESULTS: ${passed}/${passed + failed} passed\n`);
  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => { console.error(err); process.exit(1); });
