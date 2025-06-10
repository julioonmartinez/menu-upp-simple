// src/services/analyticsService.ts
// Servicio de analytics para tracking de interacciones del menú

// src/services/analyticsService.ts (Actualizado para integrarse con tu backend FastAPI)
import { getDeviceId } from "./deviceIdService";

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || '/api';

// Verificar si estamos en el navegador
const isBrowser = typeof window !== 'undefined';

/**
 * Cache en memoria para evitar múltiples registros de la misma vista
 */
const viewsCache = new Set<string>();

/**
 * Registra una vista de un recurso (restaurante, plato, link tree)
 */
export async function recordView(resourceType: any, resourceId: any) {
  if (!isBrowser) return;
  
  try {
    // Evitar registrar la misma vista múltiples veces en la misma sesión
    const cacheKey = `${resourceType}:${resourceId}`;
    if (viewsCache.has(cacheKey)) {
      console.log(`Vista ya registrada para ${cacheKey}, omitiendo duplicado`);
      return;
    }
    viewsCache.add(cacheKey);
    
    // Obtener el device ID de forma consistente
    const deviceId = getDeviceId();
    
    console.log(`Registrando vista para ${resourceType}:${resourceId} con device ID: ${deviceId}`);
    
    // Datos para enviar
    const analyticsData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer || 'direct',
      path: window.location.pathname,
      url: window.location.href
    };
    
    // IMPORTANTE: Usar sendBeacon para eventos que pueden ocurrir al salir de la página
    if (navigator.sendBeacon) {
      const headers = {
        type: 'application/json',
      };
      
      const data = new Blob([JSON.stringify(analyticsData)], headers);
      const url = `${API_BASE_URL}/analytics/view/${resourceType}/${resourceId}`;
      
      // Enviar con sendBeacon primero (sin headers personalizados)
      const success = navigator.sendBeacon(url, data);
      console.log(`Analytics via sendBeacon: ${success ? 'exitoso' : 'fallido'}`);
      
      // Enviar también con fetch para asegurar que el header X-Device-ID llegue
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': deviceId, // Encabezado crucial para contar visitas únicas
        },
        body: JSON.stringify(analyticsData),
        keepalive: true
      }).catch(e => console.error('Error en fetch después de sendBeacon:', e));
      
      return;
    }
    
    // Fallback a fetch si sendBeacon no está disponible
    const response = await fetch(`${API_BASE_URL}/analytics/view/${resourceType}/${resourceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId, // Encabezado crucial para contar visitas únicas
      },
      body: JSON.stringify(analyticsData),
      keepalive: true,
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    console.log(`Analytics enviados via fetch: ${response.ok ? 'exitoso' : 'fallido'}`);
  } catch (error) {
    console.error('Error registrando vista:', error);
  }
}

// Caché para clics recientes para evitar duplicados
const recentClicks = new Map<string, number>();

/**
 * Registra un clic en un enlace
 */
export async function recordLinkClick(linkId: string) {
  if (!isBrowser) return;
  
  try {
    // Evitar doble registro de clics (debounce)
    const now = Date.now();
    const lastClick = recentClicks.get(linkId) || 0;
    if (now - lastClick < 500) { // Ignorar clics con menos de 500ms de diferencia
      console.log(`Clic demasiado rápido para ${linkId}, omitiendo duplicado`);
      return;
    }
    recentClicks.set(linkId, now);
    
    const deviceId = getDeviceId();
    console.log(`Registrando clic para link:${linkId} con device ID: ${deviceId}`);
    
    // Datos para enviar
    const analyticsData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      pageUrl: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer || 'direct'
    };
    
    // IMPORTANTE: Tu backend espera X-Device-ID como header, no en el cuerpo
    
    // Usar sendBeacon para que el seguimiento funcione incluso si el usuario abandona la página
    if (navigator.sendBeacon) {
      const data = new Blob([JSON.stringify(analyticsData)], {
        type: 'application/json',
      });
      
      // Crear sendBeacon con headers (truco usando Headers y Request)
      const headers = new Headers({
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId
      });
      
      const url = `${API_BASE_URL}/analytics/click/link/${linkId}`;
      
      // Hay una limitación en sendBeacon que no permite enviar headers personalizados directamente
      // Enviamos sin headers primero e intentamos con fetch después
      const success = navigator.sendBeacon(url, data);
      console.log(`Analytics de clic enviados via sendBeacon: ${success ? 'exitoso' : 'fallido'}`);
      
      // Como sendBeacon no permite headers personalizados, hacemos un segundo intento con fetch
      if (success) {
        // Enviar de nuevo con fetch solo para asegurar que el header X-Device-ID llegue
        fetch(url, {
          method: 'POST',
          headers: {
            'X-Device-ID': deviceId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({...analyticsData, sendBeacon: true}),
          keepalive: true,
          mode: 'no-cors' // Importante para evitar problemas CORS
        }).catch(() => {/* Ignoramos errores aquí */});
      }
      
      return;
    }
    
    // Fallback a fetch si sendBeacon no está disponible
    const response = await fetch(`${API_BASE_URL}/analytics/click/link/${linkId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId,
      },
      body: JSON.stringify(analyticsData),
      keepalive: true,
    });
    
    console.log(`Analytics de clic enviados via fetch: ${response.ok ? 'exitoso' : 'fallido'}`);
  } catch (error) {
    console.error('Error registrando clic de link:', error);
  }
}

/**
 * Registra una interacción con un plato
 */
export function trackDishInteraction(dishId: string, eventType: string) {
  if (!isBrowser) return;
  
  try {
    const deviceId = getDeviceId();
    console.log(`Registrando ${eventType} para plato:${dishId}`);
    
    // Mapeo de eventos internos a endpoints de backend
    const eventEndpointMap: {[key: string]: string} = {
      'favorite': 'favorite/dish',
      'cart_add': 'click/link', // Para cart_add usamos click/link con un prefijo
      'rating': 'click/link' // Para rating usamos click/link con un prefijo
    };
    
    // Si es un evento que no tiene endpoint directo, usar click/link con prefijo
    if (!eventEndpointMap[eventType]) {
      recordLinkClick(`dish-${eventType}-${dishId}`);
      return;
    }
    
    // Para eventos con endpoint directo
    const endpoint = eventEndpointMap[eventType];
    const resourceId = endpoint === 'click/link' ? `dish-${eventType}-${dishId}` : dishId;
    
    // Datos para enviar
    const analyticsData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      pageUrl: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer || 'direct'
    };
    
    // Usar sendBeacon para fiabilidad
    if (navigator.sendBeacon) {
      const data = new Blob([JSON.stringify(analyticsData)], {
        type: 'application/json',
      });
      
      const url = `${API_BASE_URL}/analytics/${endpoint}/${resourceId}`;
      const success = navigator.sendBeacon(url, data);
      console.log(`Analytics de interacción enviados via sendBeacon: ${success ? 'exitoso' : 'fallido'}`);
      
      // Enviar de nuevo con fetch para asegurar headers
      fetch(url, {
        method: 'POST',
        headers: {
          'X-Device-ID': deviceId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({...analyticsData, sendBeacon: true}),
        keepalive: true,
        mode: 'no-cors'
      }).catch(() => {/* Ignoramos errores aquí */});
      
      return;
    }
    
    // Fallback a fetch
    fetch(`${API_BASE_URL}/analytics/${endpoint}/${resourceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId,
      },
      body: JSON.stringify(analyticsData),
      keepalive: true,
    }).catch(err => console.error(`Error trackingDishInteraction: ${err}`));
  } catch (error) {
    console.error(`Error rastreando ${eventType} del plato:`, error);
  }
}

/**
 * Registra una interacción con una categoría
 */
export function trackCategoryInteraction(categoryId: string) {
  if (!isBrowser) return;
  recordLinkClick(`category-${categoryId}`);
}

/**
 * Inicializa el observador de intersección para rastrear vistas de platos
 */
export function initDishViewObserver(selector = '.card-wrapper') {
  if (!isBrowser || typeof IntersectionObserver === 'undefined') return;
  
  console.log(`Inicializando observador para ${selector}`);
  
  // Configuración del observador
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Obtener ID del plato desde el atributo data
        const element = entry.target as HTMLElement;
        const itemId = element.dataset.itemId;
        
        // Si tenemos un ID, registrar vista
        if (itemId) {
          recordView('dish', itemId);
          
          // Dejar de observar este elemento después de registrar la vista
          observer.unobserve(element);
        }
      }
    });
  }, {
    threshold: 0.5, // El elemento debe estar al menos 50% visible
    rootMargin: '0px'
  });
  
  // Observar todos los elementos que coincidan con el selector
  setTimeout(() => {
    document.querySelectorAll(selector).forEach(element => {
      observer.observe(element);
    });
    console.log(`Observando ${document.querySelectorAll(selector).length} elementos`);
  }, 300); // Pequeño retraso para asegurarse de que los elementos estén renderizados
  
  return observer;
}