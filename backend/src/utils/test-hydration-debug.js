#!/usr/bin/env node
process.env.DATABASE_URL = 'postgresql://x:x@localhost:5432/x';
process.env.JWT_SECRET = 'test_secret_key_2026';
process.env.JWT_REFRESH_SECRET = 'test_refresh_key_2026';
process.env.PORT = '0';

const http = require('http');
const jwt = require('jsonwebtoken');

function fetch(port, method, path, body, token) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: { 'Content-Type': 'application/json', 'Connection': 'close' },
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
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const DEV = process.env.NODE_ENV !== 'production';

async function run() {
  const app = require('../index.js');
  const testServer = http.createServer(app);
  await new Promise((r) => testServer.listen(0, r));
  const P = testServer.address().port;
  if (DEV) console.log('Server on port', P);

  const testToken = jwt.sign(
    { id: 'test-uuid', name: 'Test Nutri', email: 'nutri@test.com', role: 'nutricionista', initials: 'TN' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const patientId = '11111111-1111-1111-1111-111111111111';

  if (DEV) console.log('1. Testing 404...');
  try {
    const r = await fetch(P, 'GET', `/api/hydration/goals/${patientId}`);
    if (DEV) console.log('404 test result:', r.status);
  } catch (e) {
    if (DEV) console.log('404 test error:', e.message);
  }

  if (DEV) console.log('2. Testing 401...');
  try {
    const r = await fetch(P, 'GET', `/api/hydration/goals/${patientId}`, null, testToken);
    if (DEV) console.log('401 test result:', r.status);
  } catch (e) {
    if (DEV) console.log('401 test error:', e.message);
  }

  if (DEV) console.log('Done');
  testServer.close();
}

run().catch(e => console.error('Fatal:', e.message));
