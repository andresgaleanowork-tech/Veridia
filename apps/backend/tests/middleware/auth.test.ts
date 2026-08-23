import { describe, it, expect } from 'vitest';

describe('Auth Middleware Module', () => {
  it('should have auth.ts file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const authPath = path.join(process.cwd(), 'src/middleware/auth.ts');
    expect(fs.existsSync(authPath)).toBe(true);
  });

  it('should export authenticate function', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/auth.ts'), 'utf-8'
    );
    expect(content).toContain('export function authenticate');
  });

  it('should export authorize function', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/auth.ts'), 'utf-8'
    );
    expect(content).toContain('export function authorize');
  });

  it('should export hashPassword function', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/auth.ts'), 'utf-8'
    );
    expect(content).toContain('export function hashPassword');
  });

  it('should export comparePassword function', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/auth.ts'), 'utf-8'
    );
    expect(content).toContain('export function comparePassword');
  });

  it('should use jwt for token verification', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/auth.ts'), 'utf-8'
    );
    expect(content).toContain('jwt.verify');
  });

  it('should handle token expiration', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/auth.ts'), 'utf-8'
    );
    expect(content).toContain('TokenExpiredError');
  });
});
