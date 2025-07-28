import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import svelte from '@astrojs/svelte';

export default defineConfig({
  output: 'server',
  adapter: vercel({
    runtime: 'serverless',
    speedInsights: {
      enabled: true
    }
  }),
  site: 'https://menu-upp-basic.vercel.app',
  integrations: [svelte({
      compilerOptions: {
        hydratable: true
      }
    })],
  server: {
    port: 3000,
    host: true
  },
  build: {
    assets: 'assets',
    inlineStylesheets: 'always'
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['svelte']
          }
        }
      }
    },
    css: {
      devSourcemap: false
    },
    optimizeDeps: {
      include: ['svelte']
    }
  },
  env: {
    schema: {
      PUBLIC_API_URL: {
        context: 'client',
        access: 'public',
        type: 'string',
        default: 'http://localhost:8000/api'
      },
      PUBLIC_USE_MOCK_DATA: {
        context: 'client',
        access: 'public',
        type: 'string',
        default: 'false'
      }
    }
  }
});