// src/types/auth.ts

/**
 * Tipos centralizados para autenticación
 */

// Roles disponibles en el sistema
export type UserRole = 'customer' | 'owner' | 'admin';

// Interface principal del usuario
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active?: boolean;
}

// Credenciales de login
export interface LoginCredentials {
  email: string;
  password: string;
}

// Datos para registro
export interface RegisterData {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}

// Datos para actualización de usuario
export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: UserRole;
  password?: string;
}

// Respuesta de login de la API
export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// Resultado genérico para operaciones de autenticación
export interface AuthResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Estado de autenticación del store
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Resultado específico de login
export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

// Resultado específico de registro
export interface RegisterResult {
  success: boolean;
  user?: User;
  error?: string;
}

// Resultado específico de actualización
export interface UpdateResult {
  success: boolean;
  user?: User;
  error?: string;
}

// Error de la API
export interface ApiError {
  detail: string;
  status?: number;
}

// Contexto de Astro con información de autenticación
export interface AuthLocals {
  user: User | null;
  isAuthenticated: boolean;
}

// Configuración de cookies
export interface CookieConfig {
  name: string;
  expiryHours: number;
  sameSite: 'Strict' | 'Lax' | 'None';
  secure: boolean;
}

// Configuración del middleware
export interface MiddlewareConfig {
  protectedRoutes: string[];
  adminRoutes: string[];
  guestOnlyRoutes: string[];
  apiBaseUrl: string;
}

// Tipos para validación
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Tipos para formularios
export interface FormErrors {
  [key: string]: string;
}

// Hook de autenticación
export interface UseAuthReturn {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  canAccess: boolean;
  
  // Roles
  isAdmin: boolean;
  isOwner: boolean;
  isCustomer: boolean;
  
  // Métodos
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<RegisterResult>;
  updateUser: (updateData: UpdateUserData) => Promise<UpdateResult>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// Tipos de eventos del store
export type AuthEvent = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_USER'; payload: User }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

// Configuración del servicio de autenticación
export interface AuthServiceConfig {
  apiBaseUrl: string;
  tokenCookieName: string;
  tokenExpiryHours: number;
  endpoints: {
    login: string;
    register: string;
    me: string;
    refresh: string;
  };
}

// Guards para verificación de tipos
export function isUser(obj: any): obj is User {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.name === 'string' &&
    ['customer', 'owner', 'admin'].includes(obj.role);
}

export function isAuthState(obj: any): obj is AuthState {
  return obj &&
    typeof obj.isAuthenticated === 'boolean' &&
    typeof obj.isLoading === 'boolean' &&
    typeof obj.isInitialized === 'boolean' &&
    (obj.user === null || isUser(obj.user)) &&
    (obj.error === null || typeof obj.error === 'string');
}

export function isValidRole(role: string): role is UserRole {
  return ['customer', 'owner', 'admin'].includes(role);
}

// Constantes
export const USER_ROLES = {
  CUSTOMER: 'customer' as const,
  OWNER: 'owner' as const,
  ADMIN: 'admin' as const
} as const;

export const AUTH_EVENTS = {
  LOGIN_START: 'LOGIN_START' as const,
  LOGIN_SUCCESS: 'LOGIN_SUCCESS' as const,
  LOGIN_ERROR: 'LOGIN_ERROR' as const,
  LOGOUT: 'LOGOUT' as const,
  REFRESH_USER: 'REFRESH_USER' as const,
  CLEAR_ERROR: 'CLEAR_ERROR' as const,
  SET_LOADING: 'SET_LOADING' as const
} as const;

// Utilidades para roles
export const ROLE_HIERARCHY = {
  admin: 3,
  owner: 2,
  customer: 1
} as const;

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function getRoleLabel(role: UserRole): string {
  const labels = {
    customer: 'Cliente',
    owner: 'Propietario',
    admin: 'Administrador'
  };
  return labels[role];
}

// Exportar todos los tipos como un namespace también
export namespace Auth {
  export type Role = UserRole;
  export type State = AuthState;
  export type Result<T = any> = AuthResult<T>;
  export type LoginCreds = LoginCredentials;
//   export type RegisterData = RegisterData;
  export type UpdateData = UpdateUserData;
  export type Locals = AuthLocals;
  export type Config = AuthServiceConfig;
}