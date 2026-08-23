import { describe, it, expect } from 'vitest';

describe('Audit Utility Module', () => {
  it('should have audit.ts file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const auditPath = path.join(process.cwd(), 'src/utils/audit.ts');
    expect(fs.existsSync(auditPath)).toBe(true);
  });

  it('should export logAudit function', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/utils/audit.ts'), 'utf-8'
    );
    expect(content).toContain('export async function logAudit');
  });

  it('should export logSecurityEvent function', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/utils/audit.ts'), 'utf-8'
    );
    expect(content).toContain('export async function logSecurityEvent');
  });

  it('should export AUDIT_ACTIONS constants', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/utils/audit.ts'), 'utf-8'
    );
    expect(content).toContain('AUDIT_ACTIONS');
    expect(content).toContain('LOGIN');
    expect(content).toContain('CREATE');
    expect(content).toContain('DELETE');
  });

  it('should have correct audit action values', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/utils/audit.ts'), 'utf-8'
    );
    expect(content).toContain("LOGIN: 'LOGIN'");
    expect(content).toContain("CREATE: 'CREATE'");
    expect(content).toContain("UPDATE: 'UPDATE'");
    expect(content).toContain("DELETE: 'DELETE'");
  });
});
