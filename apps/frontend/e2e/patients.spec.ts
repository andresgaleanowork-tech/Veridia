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

    await page.goto('/patients');
    await page.getByRole('button', { name: 'Nuevo Paciente' }).click();

    await page.getByPlaceholder('Juan').fill(nombre);
    await page.getByPlaceholder('García López').fill('Paciente E2E');
    await page.getByPlaceholder('12345678A').fill(dni);
    await page.getByRole('button', { name: 'Crear Paciente' }).click();

    await expect(page.getByText(nombre, { exact: true })).toBeVisible({ timeout: 20_000 });
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
