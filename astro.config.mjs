import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static', 
  site: 'https://menu-upp-basic.vercel.app',
  
  // Configuración para desarrollo
  server: {
    port: 3000,
    host: true
  },
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
        default: 'true' // Por defecto usar mock data
      }
    }
  }
});