import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import svelte from '@astrojs/svelte';

export default defineConfig({
  output: 'server',
  adapter: vercel({
    runtime: 'serverless'
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
    // --- CAMBIO CLAVE AQUÍ ---
    inlineStylesheets: 'always' // <--- Cambiado de 'auto' a 'always'
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