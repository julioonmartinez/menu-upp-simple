// src/config/authConfig.ts

import type { AuthServiceConfig, MiddlewareConfig, CookieConfig } from '../types/auth.ts';

/**
 * Configuración central de autenticación
 */

// URLs base según el entorno
const getApiBaseUrl = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';
  }
  return process.env.PUBLIC_API_URL || 'http://localhost:8000';
};

// Configuración del servicio de autenticación
export const authServiceConfig: AuthServiceConfig = {
  apiBaseUrl: getApiBaseUrl(),
  tokenCookieName: 'auth_token',
  tokenExpiryHours: 24,
  endpoints: {
    login: '/auth/token',
    register: '/auth/register',
    me: '/users/me',
    refresh: '/auth/refresh' // Por si implementas refresh tokens
  }
};

// Configuración de cookies
export const cookieConfig: CookieConfig = {
  name: 'auth_token',
  expiryHours: 24,
  sameSite: 'Strict',
  secure: typeof window !== 'undefined' ? window.location.protocol === 'https:' : false
};

// Configuración del middleware
export const middlewareConfig: MiddlewareConfig = {
  protectedRoutes: [
    '/dashboard',
    '/profile',
    '/admin',
    '/restaurants/create',
    '/restaurants/edit',
    '/restaurants/manage',
    '/settings',
    '/users'
  ],
  adminRoutes: [
    '/admin',
    '/users',
    '/analytics/admin'
  ],
  guestOnlyRoutes: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password'
  ],
  apiBaseUrl: getApiBaseUrl()
};

// Configuración de validación
export const validationConfig = {
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 254,
    required: true
  },
  password: {
    minLength: 6,
    maxLength: 128,
    requireNumbers: false, // Cambiar a true si quieres requerir números
    requireSpecialChars: false, // Cambiar a true si quieres requerir caracteres especiales
    requireUppercase: false, // Cambiar a true si quieres requerir mayúsculas
    required: true
  },
  name: {
    minLength: 2,
    maxLength: 100,
    regex: /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, // Permite letras, acentos y espacios
    required: true
  }
} as const;

// Configuración de roles y permisos
export const roleConfig = {
  roles: [
    {
      value: 'customer',
      label: 'Cliente',
      description: 'Usuario que puede ver menús y hacer valoraciones',
      permissions: ['view_restaurants', 'create_ratings', 'manage_favorites']
    },
    {
      value: 'owner',
      label: 'Propietario',
      description: 'Propietario de restaurante que puede gestionar su negocio',
      permissions: [
        'view_restaurants', 
        'create_ratings', 
        'manage_favorites',
        'create_restaurant',
        'manage_own_restaurant',
        'view_analytics'
      ]
    },
    {
      value: 'admin',
      label: 'Administrador',
      description: 'Administrador del sistema con acceso completo',
      permissions: ['*'] // Todos los permisos
    }
  ],
  hierarchy: {
    admin: 3,
    owner: 2,
    customer: 1
  } as const
} as const;

// Mensajes de error personalizados
export const errorMessages = {
  auth: {
    invalidCredentials: 'Email o contraseña incorrectos',
    tokenExpired: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente',
    networkError: 'Error de conexión. Verifica tu conexión a internet',
    serverError: 'Error del servidor. Inténtalo más tarde',
    unauthorized: 'No tienes permisos para realizar esta acción',
    emailAlreadyExists: 'Este email ya está registrado',
    weakPassword: 'La contraseña es muy débil',
    invalidEmail: 'El formato del email no es válido'
  },
  validation: {
    required: 'Este campo es requerido',
    emailInvalid: 'Ingresa un email válido',
    passwordTooShort: `La contraseña debe tener al menos ${validationConfig.password.minLength} caracteres`,
    passwordTooLong: `La contraseña no puede tener más de ${validationConfig.password.maxLength} caracteres`,
    nameTooShort: `El nombre debe tener al menos ${validationConfig.name.minLength} caracteres`,
    nameTooLong: `El nombre no puede tener más de ${validationConfig.name.maxLength} caracteres`,
    nameInvalid: 'El nombre solo puede contener letras y espacios'
  },
  network: {
    offline: 'No hay conexión a internet',
    timeout: 'La solicitud ha tardado demasiado',
    serverUnavailable: 'El servidor no está disponible'
  }
} as const;

// Configuración de UI
export const uiConfig = {
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  },
  breakpoints: {
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1280
  },
  delays: {
    redirectAfterLogin: 500,
    errorDisplay: 200,
    autoLogout: 60000 // 1 minuto de inactividad antes de mostrar warning
  }
} as const;

// Configuración de desarrollo/debug
export const debugConfig = {
  enableConsoleLogging: import.meta.env?.DEV || process.env.NODE_ENV === 'development',
  enableDebugPanel: import.meta.env?.DEV || process.env.NODE_ENV === 'development',
  logLevel: 'info' as 'error' | 'warn' | 'info' | 'debug',
  enableNetworkLogging: false
} as const;

// Utilidades de configuración
export class ConfigValidator {
  static validateApiUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static validateTokenExpiry(hours: number): boolean {
    return hours > 0 && hours <= 24 * 7; // Máximo 7 días
  }

  static validateEnvironment(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateApiUrl(authServiceConfig.apiBaseUrl)) {
      errors.push('URL de API inválida');
    }

    if (!this.validateTokenExpiry(authServiceConfig.tokenExpiryHours)) {
      errors.push('Tiempo de expiración de token inválido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Función para obtener configuración según el entorno
export function getEnvironmentConfig() {
  const isDev = import.meta.env?.DEV || process.env.NODE_ENV === 'development';
  const isProd = import.meta.env?.PROD || process.env.NODE_ENV === 'production';
  
  return {
    isDev,
    isProd,
    isTest: process.env.NODE_ENV === 'test',
    apiUrl: authServiceConfig.apiBaseUrl,
    debug: debugConfig.enableConsoleLogging,
    secure: cookieConfig.secure
  };
}

// Función helper para logging condicionado
export function debugLog(message: string, ...args: any[]): void {
  if (debugConfig.enableConsoleLogging) {
    console.log(`[Auth Debug] ${message}`, ...args);
  }
}

export function debugError(message: string, error?: Error): void {
  if (debugConfig.enableConsoleLogging) {
    console.error(`[Auth Error] ${message}`, error);
  }
}

// Exportar configuración completa
export const authConfig = {
  service: authServiceConfig,
  middleware: middlewareConfig,
  cookies: cookieConfig,
  validation: validationConfig,
  roles: roleConfig,
  errors: errorMessages,
  ui: uiConfig,
  debug: debugConfig
} as const;

export default authConfig;