import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import type { ViteDevServer } from 'vite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

function cspNoncePlugin() {
  let nonce = ''
  return {
    name: 'csp-nonce',
    transformIndexHtml(html: string) {
      nonce = crypto.randomUUID().replace(/-/g, '').substring(0, 32)
      return html.replace(/\{\{CSP_NONCE\}\}/g, nonce)
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use((_req: any, res: any, next: any) => {
        ;(res as any).locals = { cspNonce: nonce }
        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), cspNoncePlugin()],
  resolve: {
    alias: {
      '@': `${__dirname}src`,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3456',
        changeOrigin: true,
      },
    },
  },
})
