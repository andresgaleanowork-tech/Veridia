import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRateLimiter } from '../../src/middleware/rateLimit';

type Next = () => void;
type Res = express.Response;

/** Lanza `finish` manualmente para simular el cierre de la respuesta. */
function finish(res: Res, statusCode: number) {
  res.statusCode = statusCode;
  res.end();
}

describe('createRateLimiter', () => {
  let app: express.Express;

  beforeEach(() => {
    // keyGenerator con sal no global: cada test usa su propia key.
    app = express();
  });

  it('bloquea con 429 al superar max dentro de la ventana', async () => {
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 2,
      keyGenerator: () => 'test-block',
    });
    app.use(limiter);
    app.get('/', (_req, res) => finish(res, 200));

    expect((await request(app).get('/')).status).toBe(200);
    expect((await request(app).get('/')).status).toBe(200);
    const third = await request(app).get('/');
    expect(third.status).toBe(429);
    expect(third.headers['retry-after']).toBeDefined();
  });

  it('no cuenta peticiones exitosas con skipSuccessfulRequests', async () => {
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 2,
      skipSuccessfulRequests: true,
      keyGenerator: () => 'test-skip-ok',
    });
    app.use(limiter);
    app.get('/', (_req, res) => finish(res, 200));

    // 5 éxitos seguidos: ninguno consume presupuesto.
    for (let i = 0; i < 5; i++) {
      expect((await request(app).get('/')).status).toBe(200);
    }
  });

  it('con skipSuccessfulRequests sí cuentan los fallos (4xx/5xx)', async () => {
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 2,
      skipSuccessfulRequests: true,
      keyGenerator: () => 'test-skip-fail',
    });
    app.use(limiter);
    app.get('/', (_req, res) => finish(res, 401));

    expect((await request(app).get('/')).status).toBe(401);
    expect((await request(app).get('/')).status).toBe(401);
    expect((await request(app).get('/')).status).toBe(429);
  });

  it('mezcla: logins válidos no bloquean a la sesión', async () => {
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 3,
      skipSuccessfulRequests: true,
      keyGenerator: () => 'test-mix',
    });
    app.use(limiter);
    // 200 con flag ok, 401 sin él
    app.get('/', (req, res) => finish(res, req.query.ok ? 200 : 401));

    for (let i = 0; i < 6; i++) expect((await request(app).get('/?ok=1')).status).toBe(200);
    // Con count=1 tras los éxitos: 2 fallos hasta llegar a max=3 → 4to 429
    expect((await request(app).get('/')).status).toBe(401);
    expect((await request(app).get('/')).status).toBe(401);
    expect((await request(app).get('/')).status).toBe(429);
  });
});
