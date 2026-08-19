// Fitness API test suite
const http = require('http');
const assert = require('assert');

const BASE = process.env.API_BASE || 'http://localhost:3456';
let authHeader = '';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const DEV = process.env.NODE_ENV !== 'production';

async function runTests() {
  if (DEV) console.log('🧪 Running fitness API tests...\n');
  let passed = 0;
  let failed = 0;

  const check = async (name, fn) => {
    try {
      await fn();
      if (DEV) console.log(`  ✅ ${name}`);
      passed++;
    } catch (err) {
      if (DEV) console.log(`  ❌ ${name}: ${err.message}`);
      failed++;
    }
  };

  await check('GET /api/fitness/activities/:id sin auth devuelve 401', async () => {
    const res = await request('GET', '/api/fitness/activities/12345678-1234-1234-1234-123456789012');
    assert.strictEqual(res.status, 401, `Esperado 401, recibido ${res.status}`);
  });

  await check('GET /api/fitness/summary/:id sin auth devuelve 401', async () => {
    const res = await request('GET', '/api/fitness/summary/12345678-1234-1234-1234-123456789012');
    assert.strictEqual(res.status, 401, `Esperado 401, recibido ${res.status}`);
  });

  await check('GET /api/fitness/disconnect sin auth devuelve 401', async () => {
    const res = await request('GET', '/api/fitness/disconnect');
    assert.strictEqual(res.status, 401, `Esperado 401, recibido ${res.status}`);
  });

  await check('POST /api/fitness/connect/:platform sin auth devuelve 401', async () => {
    const res = await request('POST', '/api/fitness/connect/google_fit', { paciente_id: '12345678-1234-1234-1234-123456789012' });
    assert.strictEqual(res.status, 401, `Esperado 401, recibido ${res.status}`);
  });

  if (DEV) console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
