// src/services/authService.ts

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'owner' | 'admin';
  active?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  role?: 'customer' | 'owner' | 'admin';
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface AuthResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: 'customer' | 'owner' | 'admin';
  password?: string;
}

// API Error interface
export interface ApiError {
  detail: string;
  status?: number;
}

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Clase para manejar todas las operaciones de autenticación con TypeScript
 */
class AuthService {
  private readonly TOKEN_COOKIE_NAME = 'auth_token';
  private readonly TOKEN_EXPIRY_HOURS = 24;

  /**
   * Realiza el login del usuario
   */
  async login(email: string, password: string): Promise<AuthResult<{ user: User; token: string }>> {
    try {
      // Preparar datos para OAuth2PasswordRequestForm
      const formData = new FormData();
      formData.append('username', email); // OAuth2 usa 'username' pero enviaremos el email
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/auth/token`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error en el login'
        };
      }

      const tokenData: LoginResponse = await response.json();
      const { access_token, token_type } = tokenData;

      // Obtener información del usuario
      const userResult = await this.getCurrentUser(access_token);
      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          error: 'Error obteniendo información del usuario'
        };
      }

      // Guardar token en cookies (solo en el navegador)
      if (this.isBrowser()) {
        this.setTokenCookie(access_token);
      }

      return {
        success: true,
        data: {
          user: userResult.data,
          token: access_token
        }
      };
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en el login'
      };
    }
  }

  /**
   * Registra un nuevo usuario
   */
  async register(userData: RegisterData): Promise<AuthResult<User>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error en el registro'
        };
      }

      const user: User = await response.json();
      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en el registro'
      };
    }
  }

  /**
   * Obtiene la información del usuario actual
   */
  async getCurrentUser(token?: string): Promise<AuthResult<User>> {
    try {
      // Si no se proporciona token, intentar obtenerlo de las cookies
      let authToken = token;
      if (!authToken && this.isBrowser()) {
        authToken = this.getTokenFromCookie()!;
      }

      if (!authToken) {
        return {
          success: false,
          error: 'No hay token de autenticación'
        };
      }

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado o inválido
          this.logout();
          return {
            success: false,
            error: 'Token expirado'
          };
        }
        return {
          success: false,
          error: 'Error obteniendo usuario'
        };
      }

      const user: User = await response.json();
      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo usuario'
      };
    }
  }

  /**
   * Actualiza la información del usuario actual
   */
  async updateCurrentUser(updateData: UpdateUserData): Promise<AuthResult<User>> {
    try {
      const token = this.getTokenFromCookie();
      if (!token) {
        return {
          success: false,
          error: 'No hay token de autenticación'
        };
      }

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error actualizando usuario'
        };
      }

      const updatedUser: User = await response.json();
      return {
        success: true,
        data: updatedUser
      };
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido actualizando usuario'
      };
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    if (this.isBrowser()) {
      // Eliminar cookie del token
      document.cookie = `${this.TOKEN_COOKIE_NAME}=; Max-Age=0; path=/; SameSite=Strict`;
      
      // Limpiar cualquier storage local si se usa
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      
      // Redirigir al login
      window.location.href = '/login';
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    if (!this.isBrowser()) return false;
    
    const token = this.getTokenFromCookie();
    return !!token;
  }

  /**
   * Obtiene el token de las cookies
   */
  getTokenFromCookie(): string | null {
    if (!this.isBrowser()) return null;
    
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${this.TOKEN_COOKIE_NAME}=`)
    );
    
    if (authCookie) {
      return authCookie.split('=')[1];
    }
    
    return null;
  }

  /**
   * Guarda el token en una cookie
   */
  private setTokenCookie(token: string): void {
    if (!this.isBrowser()) return;
    
    // Configurar cookie para 24 horas (mismo tiempo que el token del backend)
    const expirationTime = this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000; // 24 horas en milisegundos
    const expirationDate = new Date(Date.now() + expirationTime);
    
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `${this.TOKEN_COOKIE_NAME}=${token}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Strict${isSecure ? '; Secure' : ''}`;
  }

  /**
   * Realiza una petición autenticada a la API
   */
  async authenticatedFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getTokenFromCookie();
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // ✅ CORRECCIÓN CRÍTICA: Solo agregar Content-Type si NO es FormData
    const defaultHeaders: HeadersInit = {
      'Authorization': `Bearer ${token}`,
    };

    // ✅ IMPORTANTE: Solo agregar Content-Type para JSON, NO para FormData
    if (!(options.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Si el token expiró, hacer logout automático
    if (response.status === 401) {
      this.logout();
      throw new Error('Sesión expirada');
    }

    return response;
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(user: User | null, requiredRole: string): boolean {
    if (!user) return false;
    return user.role === requiredRole;
  }

  /**
   * Verifica si el usuario es administrador
   */
  isAdmin(user: User | null): boolean {
    return this.hasRole(user, 'admin');
  }

  /**
   * Verifica si el usuario es propietario
   */
  isOwner(user: User | null): boolean {
    return this.hasRole(user, 'owner');
  }

  /**
   * Verifica si el usuario es cliente
   */
  isCustomer(user: User | null): boolean {
    return this.hasRole(user, 'customer');
  }

  /**
   * Verifica si estamos en el navegador
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * Obtiene los roles disponibles
   */
  getAvailableRoles(): Array<{ value: string; label: string }> {
    return [
      { value: 'customer', label: 'Cliente' },
      { value: 'owner', label: 'Propietario' },
      { value: 'admin', label: 'Administrador' }
    ];
  }

  /**
   * Valida el formato de email
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida la fortaleza de la contraseña
   */
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres');
    }
    
    if (!/[A-Za-z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Exportar una instancia única del servicio
export const authService = new AuthService();
export default authService;