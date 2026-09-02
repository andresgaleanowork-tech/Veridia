/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import type { ViteDevServer } from 'vite';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function tryImportPlaywright() {
  try {
    const playwrightModule = await import('playwright');
    const browser = await playwrightModule.chromium.launch({ headless: true });
    await browser.close();
    return true;
  } catch {
    return false;
  }
}

async function tryImportStorybookTest() {
  try {
    const { storybookTest } = await import('@storybook/addon-vitest/vitest-plugin');
    const { playwright } = await import('@vitest/browser-playwright');
    return { storybookTest, playwright };
  } catch {
    return null;
  }
}

function cspNoncePlugin() {
  let nonce = '';
  return {
    name: 'csp-nonce',
    transformIndexHtml(html: string) {
      nonce = crypto.randomUUID().replace(/-/g, '').substring(0, 32);
      return html.replace(/\{\{CSP_NONCE\}\}/g, nonce);
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use((_req: any, res: any, next: any) => {
        ;
        (res as any).locals = {
          cspNonce: nonce
        };
        next();
      });
    }
  };
}
export default defineConfig(async () => {
  const projects: any[] = [{
    extends: true,
    test: {
      name: 'unit',
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
      include: ['src/**/*.test.{ts,tsx}', 'src/**/__tests__/**/*.test.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.stories.{ts,tsx}']
    }
  }];

  const hasPlaywright = await tryImportPlaywright();
  const storybookPlugins = await tryImportStorybookTest();

  if (hasPlaywright && storybookPlugins) {
    projects.push({
      extends: true,
      plugins: [
        storybookPlugins.storybookTest({
          configDir: path.join(__dirname, '.storybook')
        })
      ],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: storybookPlugins.playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    });
  }

  return {
    plugins: [react(), tailwindcss(), cspNoncePlugin()],
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
      }
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          // Docker por defecto; en host/CI se puede apuntar con VITE_PROXY_TARGET
          target: process.env.VITE_PROXY_TARGET || 'http://host.docker.internal:3457',
          changeOrigin: true,
          rewrite: (path: string) => path
        }
      }
    },
    test: {
      projects
    }
  };
});