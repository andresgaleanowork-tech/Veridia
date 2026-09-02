import { expect, type Page } from '@playwright/test';

/** Credenciales de desarrollo (seed de apps/backend/src/utils/seed.ts). */
export const ADMIN = { email: 'admin@veridia.tech', password: 'Admin2026!' };

export async function login(page: Page, email = ADMIN.email, password = ADMIN.password) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
}

export async function expectLoggedIn(page: Page) {
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
}
