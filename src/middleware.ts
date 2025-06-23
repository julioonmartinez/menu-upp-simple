// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import type { User } from './types/auth.ts';
import { middlewareConfig, debugLog, debugError } from './config/authConfig.ts';

// Tipos para Astro locals
declare global {
  namespace App {
    interface Locals {
      user: User | null;
      isAuthenticated: boolean;
    }
  }
}

// Configuración del middleware
const {
  protectedRoutes,
  adminRoutes,
  guestOnlyRoutes,
  apiBaseUrl
} = middlewareConfig;

/**
 * Verifica si el token JWT es válido consultando la API
 */
async function verifyToken(token: string): Promise<User | null> {
  if (!token) {
    debugLog('No token provided for verification');
    return null;
  }
  
  try {
    debugLog('Verifying token with API');
    
    const response = await fetch(`${apiBaseUrl}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const user: User = await response.json();
      debugLog('Token verification successful', { userId: user.id, email: user.email });
      return user;
    }
    
    debugLog('Token verification failed', { status: response.status });
    return null;
  } catch (error) {
    debugError('Error verifying token', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Obtiene el usuario desde las cookies si existe un token válido
 */
async function getUserFromCookies(cookies: any): Promise<User | null> {
  const token = cookies.get('auth_token')?.value;
  if (!token) {
    debugLog('No auth token found in cookies');
    return null;
  }
  
  debugLog('Found auth token in cookies, verifying...');
  return await verifyToken(token);
}

/**
 * Verifica si una ruta requiere autenticación
 */
function isProtectedRoute(pathname: string): boolean {
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  if (isProtected) {
    debugLog('Route is protected', { pathname });
  }
  return isProtected;
}

/**
 * Verifica si una ruta requiere rol de administrador
 */
function isAdminRoute(pathname: string): boolean {
  const isAdmin = adminRoutes.some(route => pathname.startsWith(route));
  if (isAdmin) {
    debugLog('Route requires admin privileges', { pathname });
  }
  return isAdmin;
}

/**
 * Verifica si una ruta es solo para usuarios no autenticados
 */
function isGuestOnlyRoute(pathname: string): boolean {
  const isGuestOnly = guestOnlyRoutes.some(route => pathname.startsWith(route));
  if (isGuestOnly) {
    debugLog('Route is guest-only', { pathname });
  }
  return isGuestOnly;
}

/**
 * Crea una URL de redirección segura
 */
function createRedirectUrl(pathname: string, search: string = ''): string {
  const redirectParam = encodeURIComponent(pathname + search);
  return `/login?redirect=${redirectParam}`;
}

/**
 * Verifica si el usuario tiene los permisos necesarios para la ruta
 */
function hasRequiredPermissions(user: User, pathname: string): boolean {
  // Si es ruta de admin, verificar que el usuario sea admin
  if (isAdminRoute(pathname)) {
    return user.role === 'admin';
  }
  
  // Para rutas protegidas normales, cualquier usuario autenticado puede acceder
  if (isProtectedRoute(pathname)) {
    return true;
  }
  
  return true;
}

/**
 * Logs de seguridad para auditoría
 */
function logSecurityEvent(
  event: 'access_granted' | 'access_denied' | 'redirect' | 'error',
  details: {
    pathname: string;
    userId?: string;
    userRole?: string;
    reason?: string;
    ip?: string;
  }
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    ...details
  };
  
  debugLog(`Security Event: ${event}`, logEntry);
  
  // En producción, aquí podrías enviar logs a un servicio de monitoreo
  // como DataDog, Sentry, CloudWatch, etc.
}

/**
 * Middleware principal de autenticación con TypeScript
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, redirect, locals, clientAddress } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const userIP = clientAddress || 'unknown';

  // Inicializar locals con valores por defecto
  locals.user = null;
  locals.isAuthenticated = false;

  debugLog('Processing request', { 
    pathname, 
    method: request.method,
    userAgent: request.headers.get('user-agent')?.substring(0, 100) 
  });

  try {
    // Obtener usuario de las cookies
    const user = await getUserFromCookies(cookies);
    
    // Establecer información del usuario en locals
    if (user) {
      locals.user = user;
      locals.isAuthenticated = true;
      
      debugLog('User authenticated', { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      });
    }

    // Manejar rutas solo para invitados
    if (isGuestOnlyRoute(pathname) && user) {
      logSecurityEvent('redirect', {
        pathname,
        userId: user.id,
        userRole: user.role,
        reason: 'authenticated_user_on_guest_route',
        ip: userIP
      });
      
      return redirect('/dashboard');
    }

    // Manejar rutas protegidas
    if (isProtectedRoute(pathname)) {
      if (!user) {
        logSecurityEvent('access_denied', {
          pathname,
          reason: 'unauthenticated_access_attempt',
          ip: userIP
        });
        
        const redirectUrl = createRedirectUrl(pathname, url.search);
        return redirect(redirectUrl);
      }

      // Verificar permisos específicos
      if (!hasRequiredPermissions(user, pathname)) {
        logSecurityEvent('access_denied', {
          pathname,
          userId: user.id,
          userRole: user.role,
          reason: 'insufficient_permissions',
          ip: userIP
        });
        
        // Redirigir según el rol del usuario
        const fallbackUrl = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        return redirect(fallbackUrl);
      }

      logSecurityEvent('access_granted', {
        pathname,
        userId: user.id,
        userRole: user.role,
        ip: userIP
      });
    }

    // Agregar headers de seguridad
    const response = await next();
    
    // Headers de seguridad básicos
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Solo en HTTPS
    if (url.protocol === 'https:') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    return response;

  } catch (error) {
    debugError('Middleware error', error instanceof Error ? error : new Error(String(error)));
    
    logSecurityEvent('error', {
      pathname,
      reason: 'middleware_exception',
      ip: userIP
    });

    // En caso de error crítico, permitir continuar pero sin autenticación
    locals.user = null;
    locals.isAuthenticated = false;
    
    return next();
  }
});

// Función auxiliar para validar configuración del middleware
export function validateMiddlewareConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!apiBaseUrl) {
    errors.push('API base URL is not configured');
  }

  if (!Array.isArray(protectedRoutes) || protectedRoutes.length === 0) {
    errors.push('No protected routes configured');
  }

  if (!Array.isArray(adminRoutes)) {
    errors.push('Admin routes configuration is invalid');
  }

  if (!Array.isArray(guestOnlyRoutes)) {
    errors.push('Guest-only routes configuration is invalid');
  }

  // Verificar que no haya conflictos entre rutas
  const conflictingRoutes = protectedRoutes.filter(route => 
    guestOnlyRoutes.includes(route)
  );

  if (conflictingRoutes.length > 0) {
    errors.push(`Conflicting routes found: ${conflictingRoutes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validar configuración al cargar el módulo
const configValidation = validateMiddlewareConfig();
if (!configValidation.isValid) {
  console.error('Middleware configuration errors:', configValidation.errors);
}