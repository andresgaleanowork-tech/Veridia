import { expect, type Page } from '@playwright/test';

/** Credenciales de desarrollo (seed de apps/backend/src/utils/seed.ts). */
export const ADMIN = { email: 'admin@veridia.tech', password: 'Admin2026!' };

export async function login(page: Page, email = ADMIN.email, password = ADMIN.password) {
  await page.goto('/login');
  // exact: getByLabel también hace match por aria-label substring; el botón
  // "Mostrar contraseña" de la caja rompe el strict mode sin exact.
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
}

export async function expectLoggedIn(page: Page) {
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
}
