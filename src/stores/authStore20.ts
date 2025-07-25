// src/stores/authStore.svelte.ts
import { authService } from '../services/authService.js';

/**
 * Tipos para la autenticación
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'owner' | 'customer';
  avatar?: string;
  phone?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

/**
 * Store de autenticación usando Svelte 5 Runes
 */
class AuthStore {
  // Estado reactivo usando runes
  private _user = $state<User | null>(null);
  private _isLoading = $state<boolean>(false);
  private _error = $state<string | null>(null);

  // Getters reactivos
  get user(): User | null {
    return this._user;
  }

  get isAuthenticated(): boolean {
    return this._user !== null;
  }

  get isLoading(): boolean {
    return this._isLoading;
  }

  get error(): string | null {
    return this._error;
  }

  // Getters derivados para roles
  get isAdmin(): boolean {
    return this._user?.role === 'admin' ?? false;
  }

  get isOwner(): boolean {
    return this._user?.role === 'owner' ?? false;
  }

  get isCustomer(): boolean {
    return this._user?.role === 'customer' ?? false;
  }

  get userRole(): string | null {
    return this._user?.role ?? null;
  }

  /**
   * Inicializa el store verificando si hay un usuario autenticado
   */
  async init(): Promise<void> {
    this._isLoading = true;
    this._error = null;
    
    try {
      if (typeof window !== 'undefined' && authService.isAuthenticated()) {
        const user = await authService.getCurrentUser();
        this._user = user;
      } else {
        this._user = null;
      }
    } catch (error) {
     
      this._error = error instanceof Error ? error.message : 'Error de inicialización';
      this._user = null;
    } finally {
      this._isLoading = false;
    }
  }

  /**
   * Realiza el login del usuario
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    this._isLoading = true;
    this._error = null;
    
    try {
      const { user, token } = await authService.login(credentials.email, credentials.password);
      
      this._user = user;
      this._isLoading = false;
      
      return { success: true, user };
    } catch (error) {
      this._isLoading = false;
      const errorMessage = error instanceof Error ? error.message : 'Error en el login';
      this._error = errorMessage;
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Registra un nuevo usuario
   */
  async register(userData: RegisterData): Promise<AuthResult> {
    this._isLoading = true;
    this._error = null;
    
    try {
      const user = await authService.register(userData);
      
      // Después del registro, hacer login automático
      const loginResult = await authService.login(userData.email, userData.password);
      
      this._user = loginResult.user;
      this._isLoading = false;
      
      return { success: true, user: loginResult.user };
    } catch (error) {
      this._isLoading = false;
      const errorMessage = error instanceof Error ? error.message : 'Error en el registro';
      this._error = errorMessage;
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Actualiza la información del usuario actual
   */
  async updateUser(updateData: Partial<User>): Promise<AuthResult> {
    if (!this._user) {
      return { success: false, error: 'No hay usuario autenticado' };
    }

    this._isLoading = true;
    this._error = null;
    
    try {
      const updatedUser = await authService.updateCurrentUser(updateData);
      
      this._user = updatedUser;
      this._isLoading = false;
      
      return { success: true, user: updatedUser };
    } catch (error) {
      this._isLoading = false;
      const errorMessage = error instanceof Error ? error.message : 'Error actualizando usuario';
      this._error = errorMessage;
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Recarga los datos del usuario actual
   */
  async refreshUser(): Promise<void> {
    if (!this.isAuthenticated) return;

    this._isLoading = true;
    
    try {
      const user = await authService.getCurrentUser();
      this._user = user;
      this._error = null;
    } catch (error) {
     
      // Si hay error, posiblemente el token expiró
      this.logout();
    } finally {
      this._isLoading = false;
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    authService.logout();
    this._user = null;
    this._isLoading = false;
    this._error = null;
  }

  /**
   * Limpia el error del store
   */
  clearError(): void {
    this._error = null;
  }

  /**
   * Establece el estado de carga manualmente
   */
  setLoading(isLoading: boolean): void {
    this._isLoading = isLoading;
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(requiredRole: string): boolean {
    return this._user?.role === requiredRole ?? false;
  }

  /**
   * Verifica si el usuario puede acceder a una funcionalidad
   */
  canAccess(requiredRole?: string): boolean {
    if (!requiredRole) return this.isAuthenticated;
    return this.hasRole(requiredRole);
  }
}

// Instancia única del store
export const authStore = new AuthStore();

/**
 * Hook personalizado para usar en componentes
 */
export function useAuth(requiredRole?: string) {
  return {
    // Estado
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    error: authStore.error,
    isAdmin: authStore.isAdmin,
    isOwner: authStore.isOwner,
    isCustomer: authStore.isCustomer,
    userRole: authStore.userRole,
    
    // Verificaciones
    canAccess: authStore.canAccess(requiredRole),
    hasRole: (role: string) => authStore.hasRole(role),
    
    // Acciones
    login: (credentials: LoginCredentials) => authStore.login(credentials),
    register: (userData: RegisterData) => authStore.register(userData),
    logout: () => authStore.logout(),
    updateUser: (data: Partial<User>) => authStore.updateUser(data),
    refreshUser: () => authStore.refreshUser(),
    clearError: () => authStore.clearError(),
    init: () => authStore.init()
  };
}

/**
 * Función helper para inicializar la autenticación en el cliente
 */
export async function initAuth(): Promise<void> {
  if (typeof window !== 'undefined') {
    await authStore.init();
  }
}