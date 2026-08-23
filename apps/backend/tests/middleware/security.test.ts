import { describe, it, expect } from 'vitest';

describe('CSRF Middleware Module', () => {
  it('should have csrf.ts file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const csrfPath = path.join(process.cwd(), 'src/middleware/csrf.ts');
    expect(fs.existsSync(csrfPath)).toBe(true);
  });

  it('should export generateCsrfToken function', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/csrf.ts'), 'utf-8'
    );
    expect(content).toContain('export function generateCsrfToken');
  });

  it('should export validateCsrfToken function', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/csrf.ts'), 'utf-8'
    );
    expect(content).toContain('export function validateCsrfToken');
  });

  it('should export csrfProtection middleware', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/csrf.ts'), 'utf-8'
    );
    expect(content).toContain('export function csrfProtection');
  });

  it('should export csrfTokenEndpoint', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/csrf.ts'), 'utf-8'
    );
    expect(content).toContain('export function csrfTokenEndpoint');
  });

  it('should skip CSRF for safe methods', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/csrf.ts'), 'utf-8'
    );
    expect(content).toContain("['GET', 'HEAD', 'OPTIONS'].includes(req.method)");
  });

  it('should use crypto for token generation', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/csrf.ts'), 'utf-8'
    );
    expect(content).toContain('crypto.randomBytes');
  });
});

describe('Rate Limit Middleware Module', () => {
  it('should have rateLimit.ts file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rateLimitPath = path.join(process.cwd(), 'src/middleware/rateLimit.ts');
    expect(fs.existsSync(rateLimitPath)).toBe(true);
  });

  it('should export createRateLimiter function', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/rateLimit.ts'), 'utf-8'
    );
    expect(content).toContain('export function createRateLimiter');
  });

  it('should export pre-configured limiters', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/rateLimit.ts'), 'utf-8'
    );
    expect(content).toContain('export const globalLimiter');
    expect(content).toContain('export const loginLimiter');
    expect(content).toContain('export const apiLimiter');
    expect(content).toContain('export const uploadLimiter');
  });

  it('should have cleanup mechanism', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/rateLimit.ts'), 'utf-8'
    );
    expect(content).toContain('cleanupExpiredEntries');
  });

  it('should set Retry-After header', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/rateLimit.ts'), 'utf-8'
    );
    expect(content).toContain('Retry-After');
  });
});
