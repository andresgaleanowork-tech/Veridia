import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Pacientes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('muestra la lista de pacientes (seed demo)', async ({ page }) => {
    await page.goto('/patients');
    // El seed crea 5 pacientes demo (María González, Carlos Rodríguez…)
    await expect(page.getByRole('button', { name: 'Nuevo Paciente' })).toBeVisible();
    await expect(page.getByText('González López').first()).toBeVisible({ timeout: 20_000 });
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

    await expect(page.getByText(nombre)).toBeVisible({ timeout: 20_000 });
  });

  test('busca un paciente por nombre', async ({ page }) => {
    await page.goto('/patients');
    await expect(page.getByPlaceholder(/Buscar por nombre/i)).toBeVisible();
    await page.getByPlaceholder(/Buscar por nombre/i).fill('María');
    await expect(page.getByText('María').first()).toBeVisible({ timeout: 20_000 });
  });
});
