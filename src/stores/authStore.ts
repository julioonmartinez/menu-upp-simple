// stores/authStore.ts
import { writable } from 'svelte/store';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: any | null;
  loading: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  user: null,
  loading: true
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,
    
    // Inicializar el store (llamar en app startup)
    init: async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const user = localStorage.getItem('auth_user');
        
        if (token && user) {
          set({
            isAuthenticated: true,
            token,
            user: JSON.parse(user),
            loading: false
          });
        } else {
          set({
            isAuthenticated: false,
            token: null,
            user: null,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error initializing auth store:', error);
        set({
          isAuthenticated: false,
          token: null,
          user: null,
          loading: false
        });
      }
    },

    // Login
    login: (token: string, user: any) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      
      set({
        isAuthenticated: true,
        token,
        user,
        loading: false
      });
    },

    // Logout
    logout: () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      set({
        isAuthenticated: false,
        token: null,
        user: null,
        loading: false
      });
    },

    // Actualizar usuario
    updateUser: (user: any) => {
      localStorage.setItem('auth_user', JSON.stringify(user));
      update(state => ({ ...state, user }));
    }
  };
}

export const authStore = createAuthStore();

// ===== INICIALIZAR EN TU APP PRINCIPAL =====
// En tu archivo principal de Astro/Svelte, agregar:

/*
// En tu layout principal o _app.astro
import { authStore } from './stores/authStore';

// Inicializar el store cuando la app cargue
if (typeof window !== 'undefined') {
  authStore.init();
}
*/