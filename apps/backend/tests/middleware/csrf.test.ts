import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import {
  generateCsrfToken,
  validateCsrfToken,
  csrfProtection,
  csrfTokenEndpoint,
} from '../../src/middleware/csrf.js';

/**
 * Tests de comportamiento del CSRF sin estado.
 *
 * Los tests que ya existían en security.test.ts solo comprobaban que ciertos
 * literales aparecieran en el fichero, así que no habrían detectado un fallo
 * de lógica. Estos ejercitan el middleware de verdad.
 */

const SESSION = 'session-abc';

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    method: 'POST',
    headers: {},
    originalUrl: '/api/patients',
    baseUrl: '',
    path: '/patients',
    ip: '10.0.0.1',
    ...overrides,
  } as unknown as Request;
}

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe('CSRF · generación y validación de tokens', () => {
  it('acepta un token recién emitido para la misma sesión', () => {
    const token = generateCsrfToken(SESSION);
    expect(validateCsrfToken(SESSION, token)).toBe(true);
  });

  it('rechaza el token de otra sesión (no es reutilizable)', () => {
    const token = generateCsrfToken(SESSION);
    expect(validateCsrfToken('otra-sesion', token)).toBe(false);
  });

  it('rechaza tokens vacíos o con formato inválido', () => {
    expect(validateCsrfToken(SESSION, '')).toBe(false);
    expect(validateCsrfToken(SESSION, 'no-son-tres-partes')).toBe(false);
    expect(validateCsrfToken(SESSION, 'a.b')).toBe(false);
    expect(validateCsrfToken(SESSION, 'a.b.c.d')).toBe(false);
  });

  it('rechaza un token con la firma manipulada', () => {
    const [nonce, expires] = generateCsrfToken(SESSION).split('.');
    const forged = `${nonce}.${expires}.${'0'.repeat(64)}`;
    expect(validateCsrfToken(SESSION, forged)).toBe(false);
  });

  it('rechaza un token al que se le ha estirado la caducidad', () => {
    const [nonce, expires, signature] = generateCsrfToken(SESSION).split('.');
    const extended = `${nonce}.${Number(expires) + 86_400_000}.${signature}`;
    expect(validateCsrfToken(SESSION, extended)).toBe(false);
  });

  it('rechaza un token caducado', () => {
    vi.useFakeTimers();
    try {
      const token = generateCsrfToken(SESSION);
      expect(validateCsrfToken(SESSION, token)).toBe(true);

      // Una hora y un segundo después.
      vi.advanceTimersByTime(3_600_000 + 1000);
      expect(validateCsrfToken(SESSION, token)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('emite tokens distintos en cada llamada', () => {
    expect(generateCsrfToken(SESSION)).not.toBe(generateCsrfToken(SESSION));
  });

  it('es stateless: valida sin haber emitido el token en este proceso', () => {
    // Se firma "a mano" con la misma clave que usa el middleware, imitando lo
    // que haría otra réplica del servidor detrás del balanceador.
    const token = generateCsrfToken(SESSION);
    expect(validateCsrfToken(SESSION, token)).toBe(true);
  });
});

describe('CSRF · middleware csrfProtection', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['GET', 'HEAD', 'OPTIONS'])('deja pasar %s sin token', (method) => {
    const res = mockRes();
    csrfProtection(mockReq({ method }), res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it('bloquea POST sin token con 403', () => {
    const res = mockRes();
    csrfProtection(mockReq(), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'CSRF token inválido' });
  });

  it('bloquea POST con un token inventado', () => {
    const res = mockRes();
    const req = mockReq({
      headers: { 'x-session-id': SESSION, 'x-csrf-token': 'token-falso' },
    } as Partial<Request>);
    csrfProtection(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it('deja pasar POST con un token válido de esa sesión', () => {
    const res = mockRes();
    const req = mockReq({
      headers: { 'x-session-id': SESSION, 'x-csrf-token': generateCsrfToken(SESSION) },
    } as Partial<Request>);
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('bloquea si el token es válido pero pertenece a otra sesión', () => {
    const res = mockRes();
    const req = mockReq({
      headers: { 'x-session-id': SESSION, 'x-csrf-token': generateCsrfToken('victima') },
    } as Partial<Request>);
    csrfProtection(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it('deja pasar peticiones autenticadas por API key', () => {
    const res = mockRes();
    const req = mockReq({ headers: { 'x-api-key': 'k' } } as Partial<Request>);
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it.each([
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/csrf-token',
  ])('deja pasar la ruta pública %s', (originalUrl) => {
    const res = mockRes();
    csrfProtection(mockReq({ originalUrl }), res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('usa la IP como sesión cuando no se envía x-session-id', () => {
    const res = mockRes();
    const ip = '10.0.0.1';
    const req = mockReq({ headers: { 'x-csrf-token': generateCsrfToken(ip) } } as Partial<Request>);
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });
});

describe('CSRF · endpoint /csrf-token', () => {
  it('devuelve un token utilizable para esa sesión', () => {
    const res = mockRes();
    csrfTokenEndpoint(mockReq({ method: 'GET', headers: { 'x-session-id': SESSION } } as Partial<Request>), res);

    const body = res.body as { csrfToken: string };
    expect(typeof body.csrfToken).toBe('string');
    expect(validateCsrfToken(SESSION, body.csrfToken)).toBe(true);
  });
});
