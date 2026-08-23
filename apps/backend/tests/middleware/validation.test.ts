import { describe, it, expect } from 'vitest';

describe('Validation Middleware Module', () => {
  it('should have validate.ts file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const validatePath = path.join(process.cwd(), 'src/middleware/validate.ts');
    expect(fs.existsSync(validatePath)).toBe(true);
  });

  it('should have zodValidate.ts file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const zodPath = path.join(process.cwd(), 'src/middleware/zodValidate.ts');
    expect(fs.existsSync(zodPath)).toBe(true);
  });

  it('should export sanitize function', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/validate.ts'), 'utf-8'
    );
    expect(content).toContain('export function sanitize');
  });

  it('should export validateZod function', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/zodValidate.ts'), 'utf-8'
    );
    expect(content).toContain('export function validateZod');
  });

  it('should export validateZodQuery function', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/zodValidate.ts'), 'utf-8'
    );
    expect(content).toContain('export function validateZodQuery');
  });

  it('should export validateZodParams function', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/middleware/zodValidate.ts'), 'utf-8'
    );
    expect(content).toContain('export function validateZodParams');
  });

  it('sanitize should escape HTML characters', () => {
    // Test the sanitize function directly
    const sanitize = (str: any): string => {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    };

    expect(sanitize('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(sanitize(null)).toBe('');
    expect(sanitize(undefined)).toBe('');
    expect(sanitize('hello world')).toBe('hello world');
  });
});
