<script lang="ts">
  import { onMount } from 'svelte';
  import type { Restaurant } from '../../interfaces/restaurant';
  import {   useRestaurants } from '../../stores/restaurantStore';
  import { useRestaurantFavorites } from '../../stores/restaurantFavoritesStore';
  import { get } from 'svelte/store';

  const { favorites, favoritesCount,  } = useRestaurantFavorites();
  const {userRestaurants} = useRestaurants();
  let userRests: Restaurant[] = $derived($userRestaurants) ;
  let favs: Restaurant[] = $derived($favorites);
  let favsTotal: number = $derived($favoritesCount) ;

  // Suscribirse a las stores reactivas
  // $: userRests = get(userRestaurants) || [];
  
  // $: favs = get(favorites) || [];
  // $: favsTotal = get(favoritesCount) || 0;

 

  function goToMyRestaurants() {
    window.location.href = '/dashboard/restaurant-create';
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

  <!-- Stats Overview Cards -->
  <div class="stats-overview">
    <div class="stat-card">
      <i class="fas fa-utensils text-3xl text-primary mb-sm"></i>
      <div class="stat-value">{userRests.length}</div>
      <div class="stat-label">Mis Restaurantes</div>
    </div>
    
    <div class="stat-card">
      <i class="fas fa-heart text-3xl text-secondary mb-sm"></i>
      <div class="stat-value">{favsTotal}</div>
      <div class="stat-label">Favoritos</div>
    </div>
  </div>

  <!-- Main Action Cards Grid -->
  <div class="dashboard-grid">
    <!-- Mis Restaurantes -->
    <button type="button" class="dashboard-card dashboard-card-primary" on:click={goToMyRestaurants} aria-label="Ir a mis restaurantes">
      <div class="card-icon">
        <i class="fas fa-utensils"></i>
      </div>
      <div class="card-content">
        <h3 class="card-title">Mis Restaurantes</h3>
        <p class="card-description">Administra y edita tus restaurantes</p>
        <div class="card-badge">{userRests.length}</div>
      </div>
      <div class="card-arrow">
        <i class="fas fa-arrow-right"></i>
      </div>
    </button>

    <!-- Favoritos -->
    <button type="button" class="dashboard-card dashboard-card-secondary" on:click={goToFavorites} aria-label="Ir a favoritos">
      <div class="card-icon">
        <i class="fas fa-heart"></i>
      </div>
      <div class="card-content">
        <h3 class="card-title">Favoritos</h3>
        <p class="card-description">Tus restaurantes favoritos</p>
        <div class="card-badge">{favsTotal}</div>
      </div>
      <div class="card-arrow">
        <i class="fas fa-arrow-right"></i>
      </div>
    </button>

    <!-- Crear Restaurante -->
    <button type="button" class="dashboard-card dashboard-card-accent" on:click={goToCreateRestaurant} aria-label="Crear nuevo restaurante">
      <div class="card-icon">
        <i class="fas fa-plus"></i>
      </div>
      <div class="card-content">
        <h3 class="card-title">Crear Restaurante</h3>
        <p class="card-description">Agrega un nuevo restaurante</p>
        <div class="card-action">
          <i class="fas fa-rocket"></i>
          <span>Crear</span>
        </div>
      </div>
      <div class="card-arrow">
        <i class="fas fa-arrow-right"></i>
      </div>
    </button>
  </div>

  <!-- Quick Summary Section -->
  <div class="summary-section">
    <div class="summary-card">
      <div class="summary-header">
        <i class="fas fa-list-ul text-primary"></i>
        <h3>Restaurantes Recientes</h3>
      </div>
      <div class="summary-list">
        {#each userRests.slice(0, 3) as rest}
          <div class="summary-item">
            <i class="fas fa-utensils text-muted"></i>
            <span class="summary-text">{rest.name}</span>
          </div>
        {/each}
        {#if userRests.length === 0}
          <div class="summary-empty">
            <i class="fas fa-inbox text-muted"></i>
            <span>No tienes restaurantes aún</span>
          </div>
        {/if}
      </div>
    </div>

    <div class="summary-card">
      <div class="summary-header">
        <i class="fas fa-star text-secondary"></i>
        <h3>Favoritos Recientes</h3>
      </div>
      <div class="summary-list">
        {#each favs.slice(0, 3) as fav}
          <div class="summary-item">
            <i class="fas fa-heart text-muted"></i>
            <span class="summary-text">{fav.name}</span>
          </div>
        {/each}
        {#if favs.length === 0}
          <div class="summary-empty">
            <i class="fas fa-heart text-muted"></i>
            <span>No tienes favoritos aún</span>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<style>
  /* Dashboard Grid Layout */
  .dashboard-grid {
    display: grid;
    gap: var(--spacing-lg);
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Dashboard Cards */
  .dashboard-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    padding: var(--spacing-xl);
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    transition: all var(--transition-normal);
    cursor: pointer;
    text-align: left;
    overflow: hidden;
    min-height: 120px;
  }

  .dashboard-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.6s ease;
  }

  .dashboard-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }

  .dashboard-card:hover::before {
    left: 100%;
  }

  .dashboard-card:hover .card-arrow {
    transform: translateX(4px);
    opacity: 1;
  }

  /* Card Variants */
  .dashboard-card-primary {
    border-left: 4px solid var(--primary-color);
  }

  .dashboard-card-primary:hover {
    border-color: var(--primary-color);
    box-shadow: 0 8px 32px rgba(255, 107, 53, 0.2);
  }

  .dashboard-card-secondary {
    border-left: 4px solid var(--secondary-color);
  }

  .dashboard-card-secondary:hover {
    border-color: var(--secondary-color);
    box-shadow: 0 8px 32px rgba(13, 27, 42, 0.2);
  }

  .dashboard-card-accent {
    border-left: 4px solid var(--primary-color);
    background: var(--primary-gradient);
    color: var(--text-inverse);
  }

  .dashboard-card-accent:hover {
    box-shadow: var(--primary-glow);
  }

  .dashboard-card-accent .card-icon {
    background: rgba(255, 255, 255, 0.2);
    color: var(--text-inverse);
  }

  .dashboard-card-accent .card-description {
    color: rgba(255, 255, 255, 0.8);
  }

  /* Card Icon */
  .card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-lg);
    color: var(--primary-color);
    font-size: 1.25rem;
    flex-shrink: 0;
    transition: all var(--transition-normal);
  }

  .dashboard-card:hover .card-icon {
    transform: scale(1.1);
  }

  /* Card Content */
  .card-content {
    flex: 1;
    min-width: 0;
  }

  .card-title {
    font-size: var(--font-lg);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
    line-height: 1.2;
  }

  .card-description {
    font-size: var(--font-sm);
    color: var(--text-muted);
    margin-bottom: var(--spacing-sm);
    line-height: 1.4;
  }

  .card-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--primary-color);
    color: var(--text-inverse);
    border-radius: var(--radius-full);
    font-size: var(--font-sm);
    font-weight: var(--weight-bold);
    min-width: 24px;
    height: 24px;
  }

  .card-action {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-md);
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
  }

  /* Card Arrow */
  .card-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: var(--text-muted);
    opacity: 0.6;
    transition: all var(--transition-normal);
    flex-shrink: 0;
  }

  /* Summary Section */
  .summary-section {
    display: grid;
    gap: var(--spacing-lg);
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    max-width: 1200px;
    margin: 0 auto;
  }

  .summary-card {
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    padding: var(--spacing-xl);
    box-shadow: var(--shadow-md);
    transition: all var(--transition-normal);
  }

  .summary-card:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }

  .summary-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--bg-accent);
  }

  .summary-header h3 {
    font-size: var(--font-lg);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
  }

  .summary-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .summary-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
  }

  .summary-item:hover {
    background: var(--bg-tertiary);
  }

  .summary-text {
    font-size: var(--font-base);
    color: var(--text-primary);
    font-weight: var(--weight-medium);
  }

  .summary-empty {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-lg);
    text-align: center;
    color: var(--text-muted);
    font-style: italic;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }

    .dashboard-card {
      padding: var(--spacing-lg);
      min-height: 100px;
    }

    .card-icon {
      width: 40px;
      height: 40px;
      font-size: 1rem;
    }

    .card-title {
      font-size: var(--font-base);
    }

    .card-description {
      font-size: var(--font-sm);
    }

    .summary-section {
      grid-template-columns: 1fr;
    }

    .summary-card {
      padding: var(--spacing-lg);
    }
  }

  @media (max-width: 480px) {
    .dashboard-card {
      flex-direction: column;
      text-align: center;
      gap: var(--spacing-md);
    }

    .card-arrow {
      display: none;
    }

    .card-badge {
      align-self: center;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .dashboard-card {
      background: var(--bg-primary);
      border-color: var(--bg-accent);
    }

    .card-icon {
      background: var(--bg-tertiary);
    }

    .summary-card {
      background: var(--bg-primary);
      border-color: var(--bg-accent);
    }

    .summary-item:hover {
      background: var(--bg-tertiary);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .dashboard-card,
    .summary-card {
      transition: none;
    }

    .dashboard-card:hover,
    .summary-card:hover {
      transform: none;
    }

    .dashboard-card::before {
      display: none;
    }
  }
</style>
