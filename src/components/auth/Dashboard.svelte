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
    window.location.href = '/dashboard/first-restaurant'
  }
</script>

<section class="dashboard container p-lg flex flex-col gap-2xl">
  <header class="dashboard-header flex flex-col items-center gap-md text-center">
    <h1 class="text-3xl font-bold text-primary">Panel de Control</h1>
    <p class="text-muted text-lg">Gestiona tus restaurantes y favoritos de forma rápida y sencilla.</p>
  </header>

  <!-- Acciones principales compactas -->
  <div class="main-actions flex flex-col md:flex-row gap-lg justify-center">
    <button type="button" class="btn btn-primary btn-lg flex-1" on:click={goToMyRestaurants} aria-label="Ir a mis restaurantes">
      <i class="fas fa-utensils mr-sm"></i>
      Mis Restaurantes
      <span class="badge ml-sm">{userRests.length}</span>
    </button>
    <button type="button" class="btn btn-secondary btn-lg flex-1" on:click={goToCreateRestaurant} aria-label="Crear nuevo restaurante">
      <i class="fas fa-plus mr-sm"></i>
      Crear Restaurante
    </button>
  </div>

  <!-- Cards Container -->
  <div class="cards-container flex flex-col gap-2xl">
    <!-- Card de Ayuda Simple y Elegante -->
    <div class="help-card-container flex justify-center">
      <div class="help-card card-help">
        <div class="help-card-content">
          <div class="help-icon-wrapper">
            <i class="fas fa-hands-helping help-icon"></i>
          </div>
          <div class="help-text-content">
            <h2 class="help-title">¿Necesitas ayuda para crear tu menú?</h2>
            <p class="help-subtitle">Nuestro equipo está aquí para ayudarte</p>
            <div class="help-cta">
              <span class="help-free-badge">¡Gratis!</span>
              <a href="https://wa.me/5215510986418?text=Hola%2C%20necesito%20ayuda%20para%20crear%20mi%20men%C3%BA%20digital" target="_blank" rel="noopener" class="help-contact-btn">
                <i class="fab fa-whatsapp"></i>
                Contáctanos
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Card de Notificación de Pedido - Preview -->
    <div class="order-notification-container flex justify-center">
      <div class="order-notification-card">
        <div class="notification-header">
          <div class="notification-icon-wrapper">
            <i class="fas fa-bell notification-icon"></i>
          </div>
          <div class="notification-badge">
            <span class="badge-text">NUEVO</span>
          </div>
        </div>
        
        <div class="notification-content">
          <h3 class="notification-title">¡Has recibido un pedido!</h3>
          <div class="order-details">
            <div class="order-info">
              <div class="order-number">
                <i class="fas fa-receipt"></i>
                <span>Pedido #ORD-2024-001</span>
              </div>
              <div class="order-amount">
                <i class="fas fa-dollar-sign"></i>
                <span class="amount">$1,200 MXN</span>
              </div>
            </div>
            <div class="order-items">
              <div class="item">
                <span class="item-name">Hamburguesa Clásica</span>
                <span class="item-quantity">x2</span>
              </div>
              <div class="item">
                <span class="item-name">Papas Fritas</span>
                <span class="item-quantity">x1</span>
              </div>
              <div class="item">
                <span class="item-name">Refresco</span>
                <span class="item-quantity">x2</span>
              </div>
            </div>
            <div class="customer-info">
              <i class="fas fa-user"></i>
              <span>Cliente: María González</span>
            </div>
          </div>
        </div>

        <div class="preview-banner">
          <div class="preview-content">
            <i class="fas fa-rocket preview-icon"></i>
            <div class="preview-text">
              <span class="preview-title">Próximamente</span>
              <span class="preview-subtitle">Recibe pedidos por WhatsApp automáticamente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Summary Section -->
  <div class="summary-section grid gap-lg md:grid-cols-2">
    <div class="summary-card card">
      <div class="summary-header flex items-center gap-sm mb-lg pb-md border-b">
        <i class="fas fa-list-ul text-primary"></i>
        <h3 class="text-lg font-semibold text-primary">Restaurantes Recientes</h3>
      </div>
      <div class="summary-list flex flex-col gap-sm">
        {#each userRests.slice(0, 3) as rest}
          <div class="summary-item flex items-center gap-sm p-sm rounded-md transition-fast hover:bg-gray-light">
            <i class="fas fa-utensils text-muted"></i>
            <span class="summary-text font-medium text-base">{rest.name}</span>
          </div>
        {/each}
        {#if userRests.length === 0}
          <div class="summary-empty flex items-center gap-sm p-lg text-center text-muted italic">
            <i class="fas fa-inbox text-muted"></i>
            <span>No tienes restaurantes aún</span>
          </div>
        {/if}
      </div>
    </div>

    <div class="summary-card card">
      <div class="summary-header flex items-center gap-sm mb-lg pb-md border-b">
        <i class="fas fa-star text-secondary"></i>
        <h3 class="text-lg font-semibold text-secondary">Favoritos Recientes</h3>
      </div>
      <div class="summary-list flex flex-col gap-sm">
        {#each favs.slice(0, 3) as fav}
          <div class="summary-item flex items-center gap-sm p-sm rounded-md transition-fast hover:bg-gray-light">
            <i class="fas fa-heart text-muted"></i>
            <span class="summary-text font-medium text-base">{fav.name}</span>
          </div>
        {/each}
        {#if favs.length === 0}
          <div class="summary-empty flex items-center gap-sm p-lg text-center text-muted italic">
            <i class="fas fa-heart text-muted"></i>
            <span>No tienes favoritos aún</span>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<style>
  /* Mejorar badge para contador */
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.75em;
    background: var(--primary-color);
    color: var(--text-inverse);
    border-radius: var(--radius-full);
    font-size: var(--font-sm);
    font-weight: var(--weight-bold);
    min-width: 1.5em;
    height: 1.5em;
    margin-left: 0.5em;
  }
  .main-actions .btn {
    min-width: 180px;
    max-width: 320px;
    justify-content: center;
    font-size: var(--font-lg);
    position: relative;
    z-index: 2;
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-normal);
  }
  
  .main-actions .btn:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
  .main-actions .btn i {
    font-size: 1.2em;
  }
  .main-actions {
    width: 100%;
    /* max-width: 700px; */
    margin: 0 auto;
    padding: var(--spacing-2xl);
    background: linear-gradient(135deg, #fafbfc, #f8fafc);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--bg-accent);
    position: relative;
    overflow: hidden;
  }
  
  .main-actions::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    opacity: 0.7;
  }
  @media (max-width: 768px) {
    .main-actions {
      flex-direction: column;
      gap: var(--spacing-md);
    }
    .main-actions .btn {
      width: 100%;
      max-width: 100%;
    }
  }


  @media (min-width: 768px) {
    .main-cards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2.5rem;
      align-items: stretch;
      margin-bottom: 3rem;
    }
    .main-cards-grid > div {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .promo-card, .plan-pro-card {
      height: 100%;
      margin-top: 0;
      margin-bottom: 0;
    }
  }

  /* ====================================
     CARD DE AYUDA - DISEÑO UX/UI PROFESIONAL
     ==================================== */
  
  .help-card-container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .help-card {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
    border-radius: var(--radius-2xl);
    padding: var(--spacing-2xl);
    box-shadow: var(--shadow-lg);
    position: relative;
    overflow: hidden;
    transition: all var(--transition-normal);
    border: 1px solid var(--bg-accent);
  }
  
  .help-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 107, 53, 0.05), transparent);
    transition: left 0.6s ease;
  }
  
  .help-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-2xl), 0 0 40px rgba(255, 107, 53, 0.15);
    border-color: var(--primary-color);
  }
  
  .help-card:hover::before {
    left: 100%;
  }
  
  .help-card-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-2xl);
    position: relative;
    z-index: 2;
  }
  
  .help-icon-wrapper {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 32px rgba(255, 107, 53, 0.2);
    border: 2px solid rgba(255, 107, 53, 0.1);
  }
  
  .help-icon {
    font-size: 2rem;
    color: var(--text-inverse);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }
  
  .help-text-content {
    flex: 1;
    color: var(--text-primary);
  }
  
  .help-title {
    font-size: var(--font-2xl);
    font-weight: var(--weight-bold);
    margin-bottom: var(--spacing-sm);
    line-height: var(--leading-tight);
    color: var(--text-primary);
  }
  
  .help-subtitle {
    font-size: var(--font-lg);
    color: var(--text-secondary);
    margin-bottom: var(--spacing-lg);
    font-weight: var(--weight-medium);
  }
  
  .help-cta {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex-wrap: wrap;
  }
  
  .help-free-badge {
    background: var(--success);
    color: var(--text-inverse);
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: var(--radius-full);
    font-size: var(--font-sm);
    font-weight: var(--weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    animation: pulse-glow 2s ease-in-out infinite alternate;
  }
  
  @keyframes pulse-glow {
    0% {
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    100% {
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.5);
    }
  }
  
  .help-contact-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
    color: var(--text-inverse);
    padding: var(--spacing-md) var(--spacing-xl);
    border-radius: var(--radius-lg);
    font-weight: var(--weight-semibold);
    font-size: var(--font-base);
    text-decoration: none;
    border: 1px solid rgba(255, 107, 53, 0.2);
    transition: all var(--transition-normal);
    box-shadow: 0 4px 16px rgba(255, 107, 53, 0.15);
  }
  
  .help-contact-btn:hover {
    background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary-color) 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 107, 53, 0.25);
  }
  
  .help-contact-btn:active {
    transform: translateY(0);
  }
  
  .help-contact-btn i {
    font-size: 1.2em;
  }
  
  /* Responsive para la card de ayuda */
  @media (max-width: 768px) {
    .help-card-container {
      /* padding: 0 var(--spacing-md); */
    }
    
    .help-card {
      margin: 0;
    }
    
    .help-card-content {
      flex-direction: column;
      text-align: center;
      gap: var(--spacing-xl);
    }
    
    .help-icon-wrapper {
      width: 70px;
      height: 70px;
    }
    
    .help-icon {
      font-size: 1.75rem;
    }
    
    .help-title {
      font-size: var(--font-xl);
    }
    
    .help-subtitle {
      font-size: var(--font-base);
    }
    
    .help-cta {
      justify-content: center;
      flex-direction: column;
      gap: var(--spacing-sm);
    }
    
    .help-contact-btn {
      width: 100%;
      justify-content: center;
    }
  }
  
  @media (max-width: 480px) {
    .help-card-container {
      /* padding: 0 var(--spacing-sm); */
    }
    
    .help-card {
      margin: 0;
    }
    
    .help-icon-wrapper {
      width: 60px;
      height: 60px;
    }
    
    .help-icon {
      font-size: 1.5rem;
    }
    
    .help-title {
      font-size: var(--font-lg);
    }
    
    .help-subtitle {
      font-size: var(--font-sm);
    }
    
    .help-cta {
      gap: var(--spacing-xs);
    }
    
    .help-contact-btn {
      padding: var(--spacing-sm) var(--spacing-lg);
      font-size: var(--font-sm);
    }
  }
  
  @media (max-width: 360px) {
    .help-card-container {
      /* padding: 0 var(--spacing-xs); */
    }
    
    .help-card {
      margin: 0;
    }
    
    .help-card-content {
      gap: var(--spacing-lg);
    }
    
    .help-icon-wrapper {
      width: 50px;
      height: 50px;
    }
    
    .help-icon {
      font-size: 1.25rem;
    }
    
    .help-title {
      font-size: var(--font-base);
    }
    
    .help-subtitle {
      font-size: var(--font-xs);
    }
    
    .help-contact-btn {
      padding: var(--spacing-xs) var(--spacing-md);
      font-size: var(--font-xs);
    }
  }
  
  /* Dark mode support para la card de ayuda */
  @media (prefers-color-scheme: dark) {
    .help-card {
      background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
      border-color: var(--bg-accent);
    }
    
    .help-text-content {
      color: var(--text-primary);
    }
    
    .help-title {
      color: var(--text-primary);
    }
    
    .help-subtitle {
      color: var(--text-secondary);
    }
    
    .help-icon-wrapper {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
      border-color: rgba(255, 107, 53, 0.2);
    }
    
    .help-contact-btn {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
      border-color: rgba(255, 107, 53, 0.2);
    }
    
    .help-contact-btn:hover {
      background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary-color) 100%);
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .help-card::before {
      display: none;
    }
    
    .help-card:hover {
      transform: none;
    }
    
    .help-contact-btn:hover {
      transform: none;
    }
    
    .help-free-badge {
      animation: none;
    }
  }

  /* ====================================
     CARD DE NOTIFICACIÓN DE PEDIDOS - PREVIEW
     ==================================== */
  
  .cards-container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  /* Responsive para el contenedor de cards */
  @media (max-width: 768px) {
    .cards-container {
      /* padding: 0 var(--spacing-md); */
      gap: var(--spacing-xl);
    }
  }
  
  @media (max-width: 480px) {
    .cards-container {
      /* padding: 0 var(--spacing-sm); */
      gap: var(--spacing-lg);
    }
  }
  
  @media (max-width: 360px) {
    .cards-container {
      /* padding: 0 var(--spacing-xs); */
      gap: var(--spacing-md);
    }
  }
  
  .order-notification-container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .order-notification-card {
    background: linear-gradient(135deg, #fafbfc, #f8fafc);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-2xl);
    padding: var(--spacing-2xl);
    box-shadow: var(--shadow-lg);
    position: relative;
    overflow: hidden;
    transition: all var(--transition-normal);
  }
  
  .order-notification-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--success) 0%, var(--primary-color) 50%, var(--success) 100%);
    animation: shimmer-border 2s ease-in-out infinite;
  }
  
  @keyframes shimmer-border {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  .order-notification-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
    border-color: var(--primary-color);
  }
  
  .notification-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-lg);
  }
  
  .notification-icon-wrapper {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, var(--success) 0%, var(--success-light) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.2);
  }
  
  .notification-icon {
    font-size: 1.25rem;
    color: var(--text-inverse);
  }
  
  .notification-badge {
    background: var(--primary-color);
    color: var(--text-inverse);
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: var(--radius-full);
    font-size: var(--font-xs);
    font-weight: var(--weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    animation: pulse-badge 2s ease-in-out infinite;
  }
  
  @keyframes pulse-badge {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  .notification-content {
    margin-bottom: var(--spacing-xl);
  }
  
  .notification-title {
    font-size: var(--font-xl);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-lg);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }
  
  .notification-title::before {
    content: '🎉';
    font-size: 1.2em;
  }
  
  .order-details {
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    border: 1px solid var(--bg-accent);
  }
  
  .order-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--bg-accent);
  }
  
  .order-number, .order-amount {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-weight: var(--weight-medium);
    color: var(--text-secondary);
  }
  
  .order-number i, .order-amount i {
    color: var(--primary-color);
    font-size: 0.9em;
  }
  
  .amount {
    font-weight: var(--weight-bold);
    color: var(--success);
    font-size: var(--font-lg);
  }
  
  .order-items {
    margin-bottom: var(--spacing-md);
  }
  
  .item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-xs) 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .item:last-child {
    border-bottom: none;
  }
  
  .item-name {
    font-weight: var(--weight-medium);
    color: var(--text-primary);
  }
  
  .item-quantity {
    background: var(--primary-color);
    color: var(--text-inverse);
    padding: 0.2em 0.6em;
    border-radius: var(--radius-sm);
    font-size: var(--font-xs);
    font-weight: var(--weight-bold);
  }
  
  .customer-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--text-muted);
    font-size: var(--font-sm);
    padding-top: var(--spacing-sm);
    border-top: 1px solid var(--bg-accent);
  }
  
  .customer-info i {
    color: var(--primary-color);
  }
  
  .preview-banner {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    margin-top: var(--spacing-lg);
    position: relative;
    overflow: hidden;
  }
  
  .preview-banner::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.6s ease;
  }
  
  .preview-banner:hover::before {
    left: 100%;
  }
  
  .preview-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    position: relative;
    z-index: 2;
  }
  
  .preview-icon {
    font-size: 1.5rem;
    color: var(--text-inverse);
    animation: rocket-bounce 2s ease-in-out infinite;
  }
  
  @keyframes rocket-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
  
  .preview-text {
    flex: 1;
    color: var(--text-inverse);
  }
  
  .preview-title {
    display: block;
    font-size: var(--font-lg);
    font-weight: var(--weight-bold);
    margin-bottom: var(--spacing-xs);
  }
  
  .preview-subtitle {
    display: block;
    font-size: var(--font-sm);
    opacity: 0.9;
  }
  
  /* Responsive para la card de notificación */
  @media (max-width: 768px) {
    .order-notification-container {
      /* padding: 0 var(--spacing-md); */
    }
    
    .order-notification-card {
      margin: 0;
    }
    
    .notification-header {
      flex-direction: column;
      gap: var(--spacing-md);
      text-align: center;
    }
    
    .order-info {
      flex-direction: column;
      gap: var(--spacing-sm);
      align-items: flex-start;
    }
    
    .preview-content {
      flex-direction: column;
      text-align: center;
      gap: var(--spacing-sm);
    }
    
    .preview-icon {
      font-size: 1.25rem;
    }
  }
  
  @media (max-width: 480px) {
    .order-notification-container {
      /* padding: 0 var(--spacing-sm); */
    }
    
    .order-notification-card {
      margin: 0;
    }
    
    .notification-title {
      font-size: var(--font-lg);
    }
    
    .order-details {
      padding: var(--spacing-md);
    }
    
    .preview-banner {
      padding: var(--spacing-md);
    }
    
    .notification-icon-wrapper {
      width: 40px;
      height: 40px;
    }
    
    .notification-icon {
      font-size: 1rem;
    }
    
    .order-number, .order-amount {
      font-size: var(--font-sm);
    }
    
    .amount {
      font-size: var(--font-base);
    }
    
    .item-name {
      font-size: var(--font-sm);
    }
    
    .customer-info {
      font-size: var(--font-xs);
    }
  }
  
  @media (max-width: 360px) {
    .order-notification-container {
      /* padding: 0 var(--spacing-xs); */
    }
    
    .order-notification-card {
      margin: 0;
    }
    
    .notification-title {
      font-size: var(--font-base);
    }
    
    .notification-title::before {
      font-size: 1em;
    }
    
    .order-details {
      padding: var(--spacing-sm);
    }
    
    .preview-banner {
      padding: var(--spacing-sm);
    }
    
    .preview-title {
      font-size: var(--font-base);
    }
    
    .preview-subtitle {
      font-size: var(--font-xs);
    }
    
    .notification-icon-wrapper {
      width: 35px;
      height: 35px;
    }
    
    .notification-icon {
      font-size: 0.875rem;
    }
  }
  
  /* Dark mode support para la card de notificación */
  @media (prefers-color-scheme: dark) {
    .order-notification-card {
      background: var(--bg-primary);
      border-color: var(--bg-accent);
    }
    
    .order-details {
      background: var(--bg-tertiary);
      border-color: var(--bg-accent);
    }
    
    .item {
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }
    
    .customer-info {
      border-top-color: var(--bg-accent);
    }
  }
  
  /* Reduced motion support para la card de notificación */
  @media (prefers-reduced-motion: reduce) {
    .order-notification-card::before {
      animation: none;
    }
    
    .order-notification-card:hover {
      transform: none;
    }
    
    .notification-badge {
      animation: none;
    }
    
    .preview-icon {
      animation: none;
    }
    
    .preview-banner::before {
      display: none;
    }
  }
  
/**
 * MODERN DASHBOARD STYLES
 * Aplicando el mismo concepto sutil de los otros componentes
 */

/* Header principal moderno */
.dashboard-header {
  background: linear-gradient(135deg, #fafbfc, #f8fafc);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-2xl);
  border: 1px solid var(--bg-accent);
  position: relative;
  overflow: hidden;
}
.dashboard-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  opacity: 0.7;
}

.dashboard-header h1 {
  position: relative;
  z-index: 2;
}
.dashboard-header p {
  position: relative;
  z-index: 2;
}

/* Acciones principales mejoradas */

/* Cards de resumen modernizadas */
.summary-card {
  background: linear-gradient(135deg, #fafbfc, #f8fafc);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--bg-accent);
  padding: var(--spacing-2xl);
  position: relative;
  overflow: hidden;
  transition: all var(--transition-normal);
}
.summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  opacity: 0.7;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-color);
}

.summary-header {
  position: relative;
  z-index: 2;
  border-bottom: 1px solid var(--bg-accent) !important;
}

.summary-list {
  position: relative;
  z-index: 2;
}

.summary-item {
  background: var(--bg-primary);
  border: 1px solid var(--bg-accent);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
}
.summary-item:hover {
  background: var(--bg-secondary);
  border-color: var(--primary-color);
  transform: translateX(4px);
}

.summary-empty {
  background: var(--bg-secondary);
  border: 1px solid var(--bg-accent);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
}

/* Responsive mejorado */
@media (max-width: 768px) {
  .dashboard-header {
    padding: var(--spacing-xl);
  }
  .main-actions {
    padding: var(--spacing-xl);
  }
  .help-card {
    padding: var(--spacing-xl);
  }
  .order-notification-card {
    padding: var(--spacing-xl);
  }
  .summary-card {
    padding: var(--spacing-xl);
  }
}

@media (max-width: 640px) {
  .dashboard-header {
    padding: var(--spacing-lg);
  }
  .main-actions {
    padding: var(--spacing-lg);
  }
  .help-card {
    padding: var(--spacing-lg);
  }
  .order-notification-card {
    padding: var(--spacing-lg);
  }
  .summary-card {
    padding: var(--spacing-lg);
  }
}

@media (max-width: 480px) {
  .dashboard-header {
    padding: var(--spacing-md);
  }
  .dashboard-header h1 {
    font-size: var(--font-2xl);
  }
  .dashboard-header p {
    font-size: var(--font-base);
  }
  .main-actions {
    padding: var(--spacing-md);
  }
  .help-card {
    padding: var(--spacing-md);
  }
  .order-notification-card {
    padding: var(--spacing-md);
  }
  .summary-card {
    padding: var(--spacing-md);
  }
}

@media (max-width: 360px) {
  .dashboard-header {
    padding: var(--spacing-sm);
  }
  .dashboard-header h1 {
    font-size: var(--font-xl);
  }
  .dashboard-header p {
    font-size: var(--font-sm);
  }
  .main-actions {
    padding: var(--spacing-sm);
  }
  .help-card {
    padding: var(--spacing-sm);
  }
  .order-notification-card {
    padding: var(--spacing-sm);
  }
  .summary-card {
    padding: var(--spacing-sm);
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .dashboard-header,
  .main-actions,
  .help-card,
  .order-notification-card,
  .summary-card {
    background: linear-gradient(135deg, #1e293b, #334155);
  }
  .summary-item {
    background: var(--bg-primary);
  }
  .summary-item:hover {
    background: var(--bg-secondary);
  }
  .summary-empty {
    background: var(--bg-secondary);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .main-actions .btn:hover,
  .summary-card:hover,
  .summary-item:hover {
    transform: none;
  }
}
  
</style>
