<script lang="ts">
  import { onMount } from 'svelte';
  import unifiedFavoritesStore from '../stores/unifiedFavoritesStore';
  import FavoriteButton from './microcomponentes/FavoriteButton.svelte';

  // Variables reactivas
  let favorites: any[] = [];
  let isLoading = false;
  let error: string | null = null;

  onMount(async () => {
    // Suscribirse a los favoritos
    const unsubscribeFavorites = unifiedFavoritesStore.favoriteDishes.subscribe(favs => {
      favorites = favs;
    });

    // Suscribirse al estado de carga
    const unsubscribeLoading = unifiedFavoritesStore.isLoadingFavorites().subscribe(loading => {
      isLoading = loading;
    });

    // Suscribirse a errores
    const unsubscribeError = unifiedFavoritesStore.getFavoritesError().subscribe(err => {
      error = err;
    });

    // Cargar favoritos iniciales
    await unifiedFavoritesStore.loadFavorites();

    return () => {
      unsubscribeFavorites();
      unsubscribeLoading();
      unsubscribeError();
    };
  });
</script>

<div class="favorites-container">
  <h2>Mis Favoritos</h2>
  
  {#if isLoading}
    <div class="loading">Cargando favoritos...</div>
  {:else if error}
    <div class="error">Error: {error}</div>
  {:else if favorites.length === 0}
    <div class="empty">No tienes favoritos guardados</div>
  {:else}
    <div class="favorites-grid">
      {#each favorites as favorite}
        <div class="favorite-item">
          <h3>{favorite.name}</h3>
          <p class="price">${favorite.price}</p>
          {#if favorite.rating}
            <p class="rating">⭐ {favorite.rating}</p>
          {/if}
          <FavoriteButton id={favorite.id} title={favorite.name} isSaved={true} />
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .favorites-container {
    padding: 1rem;
  }

  .loading, .error, .empty {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .error {
    color: #dc2626;
  }

  .favorites-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .favorite-item {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    position: relative;
  }

  .favorite-item h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
  }

  .price {
    font-weight: bold;
    color: #059669;
    margin: 0.25rem 0;
  }

  .rating {
    margin: 0.25rem 0;
    color: #f59e0b;
  }
</style> 