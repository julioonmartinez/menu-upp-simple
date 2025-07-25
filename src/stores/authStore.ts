// src/stores/authStore.ts
import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { authService, type User, type LoginCredentials, type RegisterData, type UpdateUserData, type AuthResult } from '../services/authService.ts';

// Types para el estado de autenticación
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Types para acciones de autenticación
export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface RegisterResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface UpdateResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Estado inicial de la autenticación
 */
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false
};

/**
 * Clase para manejar el estado de autenticación con TypeScript
 */
class AuthStore {
  private store: Writable<AuthState>;
  
  // Stores derivados públicos
  public readonly subscribe: Writable<AuthState>['subscribe'];
  public readonly user: Readable<User | null>;
  public readonly isAuthenticated: Readable<boolean>;
  public readonly isLoading: Readable<boolean>;
  public readonly error: Readable<string | null>;
  public readonly isInitialized: Readable<boolean>;
  public readonly isAdmin: Readable<boolean>;
  public readonly isOwner: Readable<boolean>;
  public readonly isCustomer: Readable<boolean>;
  public readonly userRole: Readable<string | null>;

  constructor() {
    this.store = writable<AuthState>(initialState);
    this.subscribe = this.store.subscribe;

    // Stores derivados
    this.user = derived(this.store, $state => $state.user);
    this.isAuthenticated = derived(this.store, $state => $state.isAuthenticated);
    this.isLoading = derived(this.store, $state => $state.isLoading);
    this.error = derived(this.store, $state => $state.error);
    this.isInitialized = derived(this.store, $state => $state.isInitialized);
    
    // Stores derivados para roles
    this.isAdmin = derived(this.store, $state => 
      authService.isAdmin($state.user)
    );
    
    this.isOwner = derived(this.store, $state => 
      authService.isOwner($state.user)
    );
    
    this.isCustomer = derived(this.store, $state => 
      authService.isCustomer($state.user)
    );
    
    this.userRole = derived(this.store, $state => 
      $state.user?.role || null
    );
  }

  /**
   * Inicializa el store verificando si hay un usuario autenticado
   */
  async init(): Promise<void> {
    this.setLoading(true);
    this.clearError();
    
    try {
      if (typeof window !== 'undefined' && authService.isAuthenticated()) {
        const result = await authService.getCurrentUser();
        
        if (result.success && result.data) {
          this.store.update(state => ({
            ...state,
            user: result.data!,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            isInitialized: true
          }));
        } else {
          this.store.update(state => ({
            ...initialState,
            isInitialized: true
          }));
        }
      } else {
        this.store.update(state => ({
          ...initialState,
          isInitialized: true
        }));
      }
    } catch (error) {
      this.store.update(state => ({
        ...initialState,
        error: error instanceof Error ? error.message : 'Error inicializando autenticación',
        isInitialized: true
      }));
    }
  }

  /**
   * Realiza el login del usuario
   */
  async login(email: string, password: string): Promise<LoginResult> {
    this.setLoading(true);
    this.clearError();
    
    try {
      const result = await authService.login(email, password);
      
      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          user: result.data!.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        }));

        return { 
          success: true, 
          user: result.data.user 
        };
      } else {
        this.store.update(state => ({
          ...state,
          isLoading: false,
          error: result.error || 'Error en el login'
        }));
        
        return { 
          success: false, 
          error: result.error || 'Error en el login' 
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en el login';
      
      this.store.update(state => ({
        ...state,
        isLoading: false,
        error: errorMessage
      }));
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  /**
   * Registra un nuevo usuario
   */
  async register(userData: RegisterData): Promise<RegisterResult> {
    this.setLoading(true);
    this.clearError();
    
    try {
      const registerResult = await authService.register(userData);
      
      if (!registerResult.success) {
        this.store.update(state => ({
          ...state,
          isLoading: false,
          error: registerResult.error || 'Error en el registro'
        }));
        
        return { 
          success: false, 
          error: registerResult.error || 'Error en el registro' 
        };
      }
      
      // Después del registro, hacer login automático
      const loginResult = await authService.login(userData.email, userData.password);
      
      if (loginResult.success && loginResult.data) {
        this.store.update(state => ({
          ...state,
          user: loginResult.data!.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        }));

        return { 
          success: true, 
          user: loginResult.data.user 
        };
      } else {
        this.store.update(state => ({
          ...state,
          isLoading: false,
          error: 'Registro exitoso, pero error en login automático'
        }));
        
        return { 
          success: false, 
          error: 'Registro exitoso, pero error en login automático' 
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en el registro';
      
      this.store.update(state => ({
        ...state,
        isLoading: false,
        error: errorMessage
      }));
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  /**
   * Actualiza la información del usuario actual
   */
  async updateUser(updateData: UpdateUserData): Promise<UpdateResult> {
    this.setLoading(true);
    this.clearError();
    
    try {
      const result = await authService.updateCurrentUser(updateData);
      
      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          user: result.data!,
          isLoading: false,
          error: null
        }));

        return { 
          success: true, 
          user: result.data 
        };
      } else {
        this.store.update(state => ({
          ...state,
          isLoading: false,
          error: result.error || 'Error actualizando usuario'
        }));
        
        return { 
          success: false, 
          error: result.error || 'Error actualizando usuario' 
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido actualizando usuario';
      
      this.store.update(state => ({
        ...state,
        isLoading: false,
        error: errorMessage
      }));
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  /**
   * Recarga los datos del usuario actual
   */
  async refreshUser(): Promise<void> {
    const currentState = this.getCurrentState();
    if (!currentState.isAuthenticated) return;

    this.setLoading(true);
    
    try {
      const result = await authService.getCurrentUser();
      
      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          user: result.data!,
          isLoading: false,
          error: null
        }));
      } else {
        // Si hay error, posiblemente el token expiró
        this.logout();
      }
    } catch (error) {
      console.error('Error refrescando usuario:', error);
      // Si hay error, posiblemente el token expiró
      this.logout();
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    authService.logout();
    this.store.set(initialState);
  }

  /**
   * Limpia el error del store
   */
  clearError(): void {
    this.store.update(state => ({ 
      ...state, 
      error: null 
    }));
  }

  /**
   * Establece el estado de carga
   */
  setLoading(isLoading: boolean): void {
    this.store.update(state => ({ 
      ...state, 
      isLoading 
    }));
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(requiredRole: string): Readable<boolean> {
    return derived(this.store, $state => 
      authService.hasRole($state.user, requiredRole)
    );
  }

  /**
   * Obtiene el estado actual (para uso en funciones)
   */
  public getCurrentState(): AuthState {
    if (typeof window === 'undefined') {
      return initialState;
    }
    
    let currentState: AuthState;
    this.store.subscribe(state => {
      currentState = state;
    })();
    return currentState!;
  }

  /**
   * Método helper para obtener el usuario actual sincrónicamente
   */
  getCurrentUser(): User | null {
    return this.getCurrentState().user;
  }

  /**
   * Método helper para verificar autenticación sincrónicamente
   */
  getIsAuthenticated(): boolean {
    return this.getCurrentState().isAuthenticated;
  }

  /**
   * Método helper para obtener el estado de carga sincrónicamente
   */
  getIsLoading(): boolean {
    return this.getCurrentState().isLoading;
  }

  /**
   * Método helper para obtener errores sincrónicamente
   */
  getError(): string | null {
    return this.getCurrentState().error;
  }
}

/**
 * Instancia única del store de autenticación
 */
export const authStore = new AuthStore();

// Exports individuales para compatibilidad con la sintaxis anterior
export const user = authStore.user;
export const isAuthenticated = authStore.isAuthenticated;
export const isLoading = authStore.isLoading;
export const authError = authStore.error;
export const isInitialized = authStore.isInitialized;
export const isAdmin = authStore.isAdmin;
export const isOwner = authStore.isOwner;
export const isCustomer = authStore.isCustomer;
export const userRole = authStore.userRole;

/**
 * Función helper para inicializar la autenticación en el cliente
 * Debe llamarse en el componente principal de la aplicación
 */
export async function initAuth(): Promise<void> {
  if (typeof window !== 'undefined') {
    await authStore.init();
  }
}

/**
 * Hook personalizado para usar en componentes que requieren autenticación
 */
export function useAuth(requiredRole?: string) {
  const state = authStore.getCurrentState();
  
  const canAccess = requiredRole 
    ? authService.hasRole(state.user, requiredRole)
    : state.isAuthenticated;

  return {
    // Estado
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    isInitialized: state.isInitialized,
    canAccess,
    
    // Roles
    isAdmin: authService.isAdmin(state.user),
    isOwner: authService.isOwner(state.user),
    isCustomer: authService.isCustomer(state.user),
    
    // Métodos
    login: authStore.login.bind(authStore),
    logout: authStore.logout.bind(authStore),
    register: authStore.register.bind(authStore),
    updateUser: authStore.updateUser.bind(authStore),
    refreshUser: authStore.refreshUser.bind(authStore),
    clearError: authStore.clearError.bind(authStore)
  };
}

/**
 * Función helper para verificar roles específicos
 */
export function createRoleChecker(requiredRole: string): Readable<boolean> {
  return authStore.hasRole(requiredRole);
}

// Default export
export default authStore;