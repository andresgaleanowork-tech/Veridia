import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateEnv } from '../../src/config/env.js';

const saved = { ...process.env };

describe('validateEnv (fail-fast)', () => {
  beforeEach(() => {
    process.env = { ...saved };
    delete process.env.NODE_ENV;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.CORS_ORIGIN;
  });

  afterEach(() => {
    process.env = saved;
  });

  it('produce: falla si faltan variables obligatorias', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_URL;
    expect(() => validateEnv()).toThrow(/DATABASE_URL/);
  });

  it('produce: exige CORS_ORIGIN', () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://u:p@h:5432/db';
    process.env.JWT_SECRET = 'a'.repeat(48);
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(48);
    expect(() => validateEnv()).toThrow(/CORS_ORIGIN/);
  });

  it('dev: pasa con secretos efímeros si faltan JWT', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://u:p@h:5432/db';
    expect(() => validateEnv()).not.toThrow();
    expect(process.env.JWT_SECRET).toBeTruthy();
    expect(process.env.JWT_REFRESH_SECRET).toBeTruthy();
    expect(process.env.JWT_SECRET).not.toBe(process.env.JWT_REFRESH_SECRET);
  });

  it('dev: no genera secretos si ya existen', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://u:p@h:5432/db';
    process.env.JWT_SECRET = 'mi-secreto-dev';
    validateEnv();
    expect(process.env.JWT_SECRET).toBe('mi-secreto-dev');
  });
});
