process.env.DATABASE_URL = 'postgresql://x:x@localhost:5432/x';
process.env.JWT_SECRET = 'test_secret_key_2026';
process.env.JWT_REFRESH_SECRET = 'test_refresh_key_2026';
process.env.PORT = '0';

const http = require('http');
const jwt = require('jsonwebtoken');

const DEV = process.env.NODE_ENV !== 'production';

function fetch(port, method, path, body, token) {
  if (DEV) console.log('fetch called:', method, path);
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
      if (DEV) console.log('response received:', res.statusCode);
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        if (DEV) console.log('response end');
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
  if (DEV) console.log('Starting...');
  const app = require('/Users/florenciaantonellacaverzan/Documentos/Proyecto/Veridia/backend/src/index.js');
  if (DEV) console.log('App loaded');
  const testServer = http.createServer(app);
  await new Promise((r) => testServer.listen(0, r));
  const P = testServer.address().port;
  if (DEV) console.log('Server on port', P);

  const testToken = jwt.sign({ id: 't', role: 'nutricionista' }, 'test_secret_key_2026', { expiresIn: '1h' });
  const patientId = '11111111-1111-1111-1111-111111111111';

  if (DEV) console.log('About to fetch...');
  const r = await fetch(P, 'GET', `/api/hydration/goals/${patientId}`);
  if (DEV) console.log('Result:', r.status);
  testServer.close();
  process.exit(0);
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
