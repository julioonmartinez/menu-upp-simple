<script lang="ts">
  import { onMount } from 'svelte';
  import type { Restaurant } from '../../interfaces/restaurant';
  import { userRestaurants , useRestaurants } from '../../stores/restaurantStore';
  import { favorites, favoritesCount } from '../../stores/restaurantFavoritesStore';
  import { get } from 'svelte/store';

  let userRests: Restaurant[] = [];
  let favs: Restaurant[] = [];
  let favsTotal: number = 0;

  // Suscribirse a las stores reactivas
  $: userRests = get(userRestaurants) || [];
  $: favs = get(favorites) || [];
  $: favsTotal = get(favoritesCount) || 0;

  function goToMyRestaurants() {
    window.location.href = '/dashboard/restaurants';
  }
  function goToFavorites() {
    window.location.href = '/favorites';
  }
  function goToCreateRestaurant() {
    window.location.href = '/dashboard/restaurant-create';
  }
</script>

<section class="dashboard container p-lg flex flex-col gap-xl">
  <header class="flex flex-col items-center gap-md text-center mt-3xl mb-xl">
    <h1 class="text-3xl font-bold text-primary">Panel de Control</h1>
    <p class="text-muted text-lg">Gestiona tus restaurantes y favoritos de forma rápida y sencilla.</p>
  </header>

  <div class="grid grid-cols-1 gap-lg md:grid-cols-3">
    <!-- Mis Restaurantes -->
    <button type="button" class="card card-glass flex flex-col items-center p-lg shadow-lg rounded-xl hover:shadow-xl transition-all cursor-pointer w-full text-left" on:click={goToMyRestaurants} aria-label="Ir a mis restaurantes">
      <span class="text-4xl mb-md">🍽️</span>
      <h2 class="text-xl font-semibold mb-xs">Mis Restaurantes</h2>
      <p class="text-muted mb-md">Administra y edita tus restaurantes.</p>
      <span class="bg-primary text-inverse rounded-full px-md py-xs text-lg font-bold">{userRests.length}</span>
    </button>

    <!-- Favoritos -->
    <button type="button" class="card card-glass flex flex-col items-center p-lg shadow-lg rounded-xl hover:shadow-xl transition-all cursor-pointer w-full text-left" on:click={goToFavorites} aria-label="Ir a favoritos">
      <span class="text-4xl mb-md">⭐</span>
      <h2 class="text-xl font-semibold mb-xs">Favoritos</h2>
      <p class="text-muted mb-md">Tus restaurantes favoritos en un solo lugar.</p>
      <span class="bg-secondary text-inverse rounded-full px-md py-xs text-lg font-bold">{favsTotal}</span>
    </button>

    <!-- Crear Restaurante -->
    <button type="button" class="card card-glass flex flex-col items-center p-lg shadow-lg rounded-xl hover:shadow-xl transition-all cursor-pointer bg-gradient-primary w-full text-left" on:click={goToCreateRestaurant} aria-label="Crear nuevo restaurante">
      <span class="text-4xl mb-md">➕</span>
      <h2 class="text-xl font-semibold mb-xs">Crear Nuevo Restaurante</h2>
      <p class="text-muted mb-md">Agrega un nuevo restaurante a tu menú digital.</p>
      <span class="btn btn-primary btn-lg mt-md w-full">Crear</span>
    </button>
  </div>

  <!-- Resumen rápido (opcional) -->
  <div class="mt-2xl grid grid-cols-1 md:grid-cols-2 gap-lg">
    <div class="card p-lg flex flex-col gap-md">
      <h3 class="text-lg font-semibold mb-xs">Resumen de Restaurantes</h3>
      <ul class="flex flex-col gap-xs">
        {#each userRests.slice(0, 3) as rest}
          <li class="flex items-center gap-md">
            <span class="rounded-full bg-accent w-8 h-8 flex items-center justify-center text-xl">🍴</span>
            <span class="text-base font-medium">{rest.name}</span>
          </li>
        {/each}
        {#if userRests.length === 0}
          <li class="text-muted">No tienes restaurantes aún.</li>
        {/if}
      </ul>
    </div>
    <div class="card p-lg flex flex-col gap-md">
      <h3 class="text-lg font-semibold mb-xs">Resumen de Favoritos</h3>
      <ul class="flex flex-col gap-xs">
        {#each favs.slice(0, 3) as fav}
          <li class="flex items-center gap-md">
            <span class="rounded-full bg-accent w-8 h-8 flex items-center justify-center text-xl">⭐</span>
            <span class="text-base font-medium">{fav.name}</span>
          </li>
        {/each}
        {#if favs.length === 0}
          <li class="text-muted">No tienes favoritos aún.</li>
        {/if}
      </ul>
    </div>
  </div>
</section>

<style>
  @media (max-width: 768px) {
    .dashboard {
      padding: var(--spacing-md);
    }
    .card {
      min-width: 0;
    }
  }
</style>
