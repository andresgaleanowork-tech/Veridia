import { describe, it, expect } from 'vitest';

describe('Drizzle Schema Definitions', () => {
  it('should have all schema files', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const schemaDir = path.join(process.cwd(), 'src/db/schema');
    const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.ts'));
    expect(files.length).toBeGreaterThanOrEqual(10);
  });

  it('should have _common.ts with enums', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/db/schema/_common.ts'), 'utf-8'
    );
    expect(content).toContain('pgEnum');
    expect(content).toContain('roleEnum');
    expect(content).toContain('sexoEnum');
  });

  it('should have patients.ts schema', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/db/schema/patients.ts'), 'utf-8'
    );
    expect(content).toContain('pgTable');
    expect(content).toContain('patients');
    expect(content).toContain('nombre');
    expect(content).toContain('apellidos');
  });

  it('should have users.ts schema', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/db/schema/users.ts'), 'utf-8'
    );
    expect(content).toContain('pgTable');
    expect(content).toContain('users');
    expect(content).toContain('email');
    expect(content).toContain('role');
  });

  it('should have appointments.ts schema', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/db/schema/appointments.ts'), 'utf-8'
    );
    expect(content).toContain('pgTable');
    expect(content).toContain('appointments');
    expect(content).toContain('fecha');
    expect(content).toContain('hora');
  });

  it('should have billing.ts schema', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/db/schema/billing.ts'), 'utf-8'
    );
    expect(content).toContain('pgTable');
    expect(content).toContain('invoices');
    expect(content).toContain('total');
  });

  it('should have clinical.ts schema', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/db/schema/clinical.ts'), 'utf-8'
    );
    expect(content).toContain('pgTable');
    expect(content).toContain('antropometrias');
    expect(content).toContain('anamnesis');
  });

  it('should have nutrition.ts schema', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/db/schema/nutrition.ts'), 'utf-8'
    );
    expect(content).toContain('pgTable');
    expect(content).toContain('foods');
    expect(content).toContain('recipes');
    expect(content).toContain('meal_plans');
  });

  it('should have index.ts barrel export', async () => {
    const content = (await import('fs')).readFileSync(
      (await import('path')).join(process.cwd(), 'src/db/schema/index.ts'), 'utf-8'
    );
    expect(content).toContain('export');
    expect(content).toContain('from');
  });
});
