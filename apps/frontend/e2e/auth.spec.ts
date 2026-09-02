import { test, expect } from '@playwright/test';
import { login, expectLoggedIn, ADMIN } from './helpers';

test.describe('Autenticación', () => {
  test('login válido redirige al dashboard', async ({ page }) => {
    await login(page);
    await expectLoggedIn(page);
    await expect(page).toHaveURL(/\/$/);
  });

  test('login con contraseña incorrecta muestra error', async ({ page }) => {
    await login(page, ADMIN.email, 'password-incorrecta');
    await expect(page.getByText(/inválid|incorrect|error/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('ruta protegida redirige a /login sin sesión', async ({ page }) => {
    await page.goto('/patients');
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});
