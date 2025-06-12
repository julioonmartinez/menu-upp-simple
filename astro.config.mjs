import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import svelte from '@astrojs/svelte'
export default defineConfig({
 output: 'server', // ✅ Era 'static'
 adapter: vercel({
    runtime: 'serverless' 
  }), 
  site: 'https://menu-upp-basic.vercel.app',
  integrations: [svelte()],
  // Configuración para desarrollo
  server: {
    port: 3000,
    host: true
  },
  // experimental: {
  //   serverIslands: true
  // },
  //  adapter: vercel(),
  // Optimizaciones
  build: {
    assets: 'assets',
    inlineStylesheets: 'auto'
  },
  
  // Variables de entorno
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
        default: 'false' // Por defecto usar mock data
      }
    }
  }
});