<!-- src/components/AppInitializer.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '../stores/authStore';
  import { restaurantFavoritesStore } from '../stores/restaurantFavoritesStore';
   import { dishRatingStore } from '../stores/dishRatingStore';
    import restaurantStore from '../stores/restaurantStore';
  // Props que puede recibir del servidor (opcional)
  const { serverUser = null, serverAuth = false } = $props<{ serverUser?: any; serverAuth?: boolean }>();

  // Estado de inicialización
  let isInitializing = $state(true);
  let initError = $state<string | null>(null);

  onMount(async () => {
    try {
      // 1. Inicializar autenticación primero
      if (serverUser && serverAuth) {
        // Pre-cargar el estado con los datos del servidor si están disponibles
        console.log('Pre-loading auth state from server');
      }
      
      await authStore.init();
      
      // 2. Si el usuario está autenticado, cargar favoritos
      if (authStore.getIsAuthenticated()) {
        console.log('User authenticated, loading favorites...');
        await restaurantFavoritesStore.loadUserFavorites();
        await dishRatingStore.loadFavoriteDishes()
        await restaurantStore.loadUserRestaurants() 
        
        console.log('Favorites loaded successfully');
      }
      
      isInitializing = false;
      console.log('App initialization completed');
      
    } catch (error) {
      console.error('Error during app initialization:', error);
      initError = error instanceof Error ? error.message : 'Error de inicialización';
      isInitializing = false;
    }
  });

  // Exponer estado de inicialización al padre
  export function getInitializationState() {
    return {
      isInitializing,
      initError,
      isComplete: !isInitializing && !initError
    };
  }
</script>

<!-- Este componente no renderiza nada visible -->
<div style="display: none;"></div>