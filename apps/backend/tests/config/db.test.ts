import { describe, it, expect } from 'vitest';

describe('Config DB Module', () => {
  it('should have db.ts file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const dbPath = path.join(process.cwd(), 'src/config/db.ts');
    expect(fs.existsSync(dbPath)).toBe(true);
  });

  it('should export db instance type', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/config/db.ts'), 'utf-8'
    );
    expect(content).toContain('export const db');
    expect(content).toContain('drizzle');
  });

  it('should export query helper', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/config/db.ts'), 'utf-8'
    );
    expect(content).toContain('export const query');
  });

  it('should export transaction helper', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/config/db.ts'), 'utf-8'
    );
    expect(content).toContain('export const transaction');
  });

  it('should export pool', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/config/db.ts'), 'utf-8'
    );
    expect(content).toContain('export { pool }');
  });
});
