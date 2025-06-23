// src/services/authService.js

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Clase para manejar todas las operaciones de autenticación
 */
class AuthService {
  
  /**
   * Realiza el login del usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<{user: object, token: string}>}
   */
  async login(email, password) {
    try {
      // Preparar datos para OAuth2PasswordRequestForm
      const formData = new FormData();
      formData.append('username', email); // OAuth2 usa 'username' pero enviaremos el email
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/api/auth/token`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error en el login');
      }

      const tokenData = await response.json();
      const { access_token, token_type } = tokenData;

      // Obtener información del usuario
      const user = await this.getCurrentUser(access_token);

      // Guardar token en cookies (solo en el navegador)
      if (typeof window !== 'undefined') {
        this.setTokenCookie(access_token);
      }

      return {
        user,
        token: access_token,
        token_type
      };
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  /**
   * Registra un nuevo usuario
   * @param {object} userData - Datos del usuario {email, name, password, role}
   * @returns {Promise<object>}
   */
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error en el registro');
      }

      const user = await response.json();
      return user;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  }

  /**
   * Obtiene la información del usuario actual
   * @param {string} token - Token JWT
   * @returns {Promise<object>}
   */
  async getCurrentUser(token = null) {
    try {
      // Si no se proporciona token, intentar obtenerlo de las cookies
      let authToken = token;
      if (!authToken && typeof window !== 'undefined') {
        authToken = this.getTokenFromCookie();
      }

      if (!authToken) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
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
          throw new Error('Token expirado');
        }
        throw new Error('Error obteniendo usuario');
      }

      const user = await response.json();
      return user;
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      throw error;
    }
  }

  /**
   * Actualiza la información del usuario actual
   * @param {object} updateData - Datos a actualizar
   * @returns {Promise<object>}
   */
  async updateCurrentUser(updateData) {
    try {
      const token = this.getTokenFromCookie();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error actualizando usuario');
      }

      const updatedUser = await response.json();
      return updatedUser;
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw error;
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  logout() {
    if (typeof window !== 'undefined') {
      // Eliminar cookie del token
      document.cookie = 'auth_token=; Max-Age=0; path=/; SameSite=Strict';
      
      // Limpiar cualquier storage local si se usa
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      
      // Redirigir al login
      window.location.href = '/login';
    }
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    if (typeof window === 'undefined') return false;
    
    const token = this.getTokenFromCookie();
    return !!token;
  }

  /**
   * Obtiene el token de las cookies
   * @returns {string|null}
   */
  getTokenFromCookie() {
    if (typeof window === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(cookie => 
      cookie.trim().startsWith('auth_token=')
    );
    
    if (authCookie) {
      return authCookie.split('=')[1];
    }
    
    return null;
  }

  /**
   * Guarda el token en una cookie
   * @param {string} token - Token JWT
   */
  setTokenCookie(token) {
    if (typeof window === 'undefined') return;
    
    // Configurar cookie para 24 horas (mismo tiempo que el token del backend)
    const expirationTime = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
    const expirationDate = new Date(Date.now() + expirationTime);
    
    document.cookie = `auth_token=${token}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Strict; Secure=${window.location.protocol === 'https:'}`;
  }

  /**
   * Realiza una petición autenticada a la API
   * @param {string} endpoint - Endpoint de la API
   * @param {object} options - Opciones de fetch
   * @returns {Promise<Response>}
   */
  async authenticatedFetch(endpoint, options = {}) {
    const token = this.getTokenFromCookie();
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const config = {
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
   * @param {object} user - Objeto usuario
   * @param {string} requiredRole - Rol requerido
   * @returns {boolean}
   */
  hasRole(user, requiredRole) {
    if (!user) return false;
    return user.role === requiredRole;
  }

  /**
   * Verifica si el usuario es administrador
   * @param {object} user - Objeto usuario
   * @returns {boolean}
   */
  isAdmin(user) {
    return this.hasRole(user, 'admin');
  }

  /**
   * Verifica si el usuario es propietario
   * @param {object} user - Objeto usuario
   * @returns {boolean}
   */
  isOwner(user) {
    return this.hasRole(user, 'owner');
  }

  /**
   * Verifica si el usuario es cliente
   * @param {object} user - Objeto usuario
   * @returns {boolean}
   */
  isCustomer(user) {
    return this.hasRole(user, 'customer');
  }
}

// Exportar una instancia única del servicio
export const authService = new AuthService();
export default authService;