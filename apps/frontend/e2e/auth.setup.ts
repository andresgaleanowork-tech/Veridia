import { test as setup, expect } from '@playwright/test';
import { login } from './helpers';

/**
 * Login único compartido: guarda el estado autenticado (localStorage) para
 * el resto de los tests. Así la suite hace 1-2 logins en vez de uno por
 * test (el backend limita intentos de login por IP).
 */
setup('autenticar y guardar estado de sesión', async ({ page }) => {
  await login(page);
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await page.context().storageState({ path: 'e2e/.auth/state.json' });
});
