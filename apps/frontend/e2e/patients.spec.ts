import { test, expect } from '@playwright/test';

// Ejecuta bajo el proyecto chromium, que ya arranca autenticado gracias a
// auth.setup.ts (storageState). No hace falta login por test.
test.describe('Pacientes', () => {
  test('muestra la lista de pacientes (seed demo)', async ({ page }) => {
    await page.goto('/patients');
    await expect(page.getByRole('button', { name: 'Nuevo Paciente' })).toBeVisible();
    // El seed crea 5 pacientes demo; la columna "Paciente" muestra el nombre
    await expect(page.getByText('María', { exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Pedro', { exact: true })).toBeVisible();
  });

  test('crea un paciente nuevo y aparece en la lista', async ({ page }) => {
    const dni = `${Math.floor(10_000_000 + Math.random() * 89_999_999)}A`;
    const nombre = `E2E ${Date.now()}`;

    // Diagnóstico: si falla, revela qué pasó (peticiones, errores de form).
    const apiCalls: string[] = [];
    const consoleErrors: string[] = [];
    let post: { status: number; body: string } | null = null;
    page.on('response', (r) => {
      if (!r.url().includes('/api/')) return;
      const line = `${r.request().method()} ${new URL(r.url()).pathname} → ${r.status()}`;
      apiCalls.push(line);
      if (r.request().method() === 'POST' && r.url().includes('/api/patients')) {
        r.text()
          .then((b) => { post = { status: r.status(), body: b.slice(0, 300) }; })
          .catch(() => {});
      }
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 150));
    });

    await page.goto('/patients');
    await page.getByRole('button', { name: 'Nuevo Paciente' }).click();

    // exact: 'Juan' substring-matching would also hit the email
    // input (placeholder "juan@email.com"), breaking strict mode.
    await page.getByPlaceholder('Juan', { exact: true }).fill(nombre);
    await page.getByPlaceholder('García López', { exact: true }).fill('Paciente E2E');
    await page.getByPlaceholder('12345678A', { exact: true }).fill(dni);

    await page.getByRole('button', { name: 'Crear Paciente' }).click();

    try {
      await expect(page.getByText(nombre, { exact: true })).toBeVisible({ timeout: 15_000 });
    } catch {
      const formErrors = await page.locator('.text-red-400').allTextContents().catch(() => []);
      const dialogOpen = await page.getByRole('dialog').isVisible().catch(() => false);
      throw new Error(
        [
          'Diagnóstico creación de paciente:',
          `  POST /patients: ${post ? `${post.status} ${post.body}` : 'NINGUNA (el form no envió la petición)'}`,
          `  diálogo abierto al final: ${dialogOpen}`,
          `  errores visibles del form: ${formErrors.join(' | ') || 'ninguno'}`,
          `  llamadas /api: ${apiCalls.join(' , ') || 'ninguna'}`,
          `  errores de consola: ${consoleErrors.slice(0, 3).join(' || ') || 'ninguno'}`,
        ].join('\n'),
      );
    }
  });

  test('busca un paciente por nombre', async ({ page }) => {
    await page.goto('/patients');
    const search = page.getByPlaceholder(/Buscar por nombre/i);
    await expect(search).toBeVisible();
    await search.fill('Laura');

    // El filtro es server-side (debounce 300ms): Laura aparece, Pedro desaparece
    await expect(page.getByText('Laura', { exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Pedro', { exact: true })).toHaveCount(0, { timeout: 20_000 });
  });
});
