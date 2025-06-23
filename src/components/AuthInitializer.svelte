<!-- src/components/AuthInitializer.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '../stores/authStore';
  
  // Props que puede recibir del servidor (opcional)
  export let serverUser: any = null;
  export let serverAuth: boolean = false;

  onMount(async () => {
    // Si tenemos datos del servidor, los podemos usar para pre-cargar el estado
    if (serverUser && serverAuth) {
      // Pre-cargar el estado con los datos del servidor antes de la inicialización
    //   authStore.store.update(state => ({
    //     ...state,
    //     user: serverUser,
    //     isAuthenticated: serverAuth,
    //     isInitialized: true
    //   }));
    }
    
    // Inicializar el store (esto verificará el token en localStorage/cookies)
    await authStore.init();
  });
</script>

<!-- Este componente no renderiza nada visible -->
<div style="display: none;"></div>