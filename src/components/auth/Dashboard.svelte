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

<section class="dashboard container p-lg flex flex-col gap-xl">
  <header class="flex flex-col items-center gap-md text-center mt-3xl mb-xl">
    <h1 class="text-3xl font-bold text-primary">Panel de Control</h1>
    <p class="text-muted text-lg">Gestiona tus restaurantes y favoritos de forma rápida y sencilla.</p>
  </header>

  <!-- Acciones principales compactas -->
  <div class="main-actions flex flex-col md:flex-row gap-lg justify-center mb-xl">
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

  <!-- Contenedor de las dos cards principales en grid responsivo -->
  <div class="main-cards-grid flex flex-col gap-2xl md:grid md:grid-cols-2 md:gap-3xl md:items-stretch md:mb-2xl">
    <!-- Card Promocional Servicio Especial -->
    <div>
      <div class="promo-card  themed-card flex flex-col md:flex-col items-center gap-lg p-2xl mb-xl mt-xl shadow-lg relative overflow-visible h-full">
        <!-- Cinta de descuento -->
        <div class="discount-badge-wrapper">
          <span class="discount-badge bg-success text-inverse font-bold px-md py-xs rounded-xl shadow-md text-base tracking-wide animate-bounce">
            -30% OFF
          </span>
        </div>
        <div class="flex-1 flex flex-col gap-md">
          <div class="flex items-center gap-md mb-sm">
            <i class="fas fa-bolt text-3xl animate-bounce"></i>
            <span class="uppercase font-bold tracking-wider text-base">¡Promoción Especial!</span>
          </div>
          <h2 class="text-2xl font-extrabold leading-tight mb-xs">¿Quieres tu menú digital sin complicaciones?</h2>
          <div class="price-section flex flex-col items-center justify-center gap-xs p-md mb-md mt-xs bg-opacity-20 rounded-2xl shadow-md border border-white/30 max-w-xs mx-auto relative overflow-visible">
            <div class="ribbon-discount">-30%</div>
            <div class="flex items-center gap-sm mb-xs">
              <span style="font-size: 1.25rem; font-weight: 600; opacity: 0.6;">de <span style="text-decoration: line-through;">$999</span> a</span>
            </div>
            <div class="flex items-baseline gap-xs">
              <span class="text-4xl font-black text-accent">$699</span>
              <span class="text-base font-semibold text-success">MXN</span>
            </div>
            <div class="text-xs opacity-80 mt-xs mb-sm">¡Precio final, todo incluido!</div>
          </div>
          <!-- Lista de beneficios mejorada -->
          <ul class="list-disc improved-benefits-list pl-2xl text-base mb-md opacity-90">
            <li><i class="fas fa-sync-alt text-success mr-xs"></i> Actualizaciones ilimitadas</li>
            <li><i class="fas fa-globe text-accent mr-xs"></i> Subdominio gratis</li>
            <li><i class="fas fa-link text-primary mr-xs"></i> O conecta tu propio dominio</li>
            <li><i class="fas fa-headset text-secondary mr-xs"></i> Asistencia personalizada 24h</li>
          </ul>
          <a href="https://wa.me/5215510986418?text=Hola%2C%20quiero%20mi%20men%C3%BA%20digital%20con%20la%20promo%20de%20MenuUpp" target="_blank" rel="noopener" class="btn btn-inverse btn-lg btn-rounded flex items-center gap-sm shadow-md hover:scale-105 transition-bounce" style="background: #25D366; color: #fff;">
            <i class="fab fa-whatsapp text-2xl"></i>
            ¡Solicitar por WhatsApp!
          </a>
        </div>
        <div class="hidden md:block flex-shrink-0">
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Menú digital" style="width: 160px; height: 160px; object-fit: contain; filter: drop-shadow(0 8px 32px rgba(0,0,0,0.15));" loading="lazy" />
        </div>
      </div>
    </div>
    <!-- Card Plan Pro -->
    <div>
      <div class="plan-pro-card themed-card flex flex-col md:flex-col items-center gap-lg p-2xl mb-xl mt-xl shadow-lg border-l-4 border-primary relative overflow-visible h-full">
        <div class="planpro-flex-1 flex flex-col h-full">
          <div class="flex items-center gap-md mb-sm">
            <i class="fas fa-crown text-3xl text-accent"></i>
            <span class="uppercase font-bold tracking-wider text-base text-primary">Plan Pro: Expande tu Negocio</span>
          </div>
          <h2 class="text-xl font-extrabold leading-tight mb-xs text-primary">Crea más de 5 restaurantes y accede a beneficios exclusivos</h2>
          <!-- Sección de precio mejorada -->
          <div class="planpro-price-wrapper">
            <span class="planpro-badge">PRO</span>
            <div class="planpro-price-main">
              <span class="planpro-currency">$</span>
              <span class="planpro-amount">199</span>
              <span class="planpro-period">MXN/mes</span>
            </div>
          </div>
          
          <ul class="pro-benefits-list pl-2xl text-base mb-md opacity-90">
            <li><i class="fas fa-store-alt text-primary mr-xs"></i> Crea has 30 restaurantes</li>
            <li><i class="fab fa-whatsapp text-success mr-xs"></i>Cada restaurante tiene su propio dominio</li>
            <li><i class="fas fa-headset text-secondary mr-xs"></i> Soporte prioritario 24/7</li>
            <li><i class="fas fa-chart-line text-accent mr-xs"></i> <span class="font-bold text-accent">Nuevo:</span> Estadísticas de visitas</li>
          </ul>
          
          <div class="planpro-btn-wrapper" style="margin-top:auto;">
            <a href="https://wa.me/5215510986418?text=Hola%2C%20quiero%20el%20Plan%20Pro%20de%20MenuUpp" target="_blank" rel="noopener" class="btn btn-primary btn-lg btn-rounded w-full flex items-center gap-sm shadow-md w-fit">
              <i class="fab fa-whatsapp text-2xl"></i>
              ¡Quiero el Plan Pro!
            </a>
          </div>
        </div>
        <div class="hidden md:block flex-shrink-0">
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135768.png" alt="Plan Pro" style="width: 140px; height: 140px; object-fit: contain; filter: drop-shadow(0 8px 32px rgba(0,0,0,0.10));" loading="lazy" />
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Summary Section -->
  <div class="summary-section grid gap-lg md:grid-cols-2 mt-xl">
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
  }
  .main-actions .btn i {
    font-size: 1.2em;
  }
  .main-actions {
    width: 100%;
    max-width: 700px;
    margin: 0 auto;
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
  .discount-badge-wrapper {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 10;
    display: flex;
    align-items: flex-start;
  }
  @media (max-width: 768px) {
    .discount-badge-wrapper {
      position: static;
      justify-content: center;
      margin-bottom: 1rem;
      width: 100%;
    }
    .promo-card {
      flex-direction: column;
      align-items: stretch;
    }
  }
  .discount-badge {
    background: linear-gradient(90deg, #10b981 60%, #34d399 100%);
    box-shadow: 0 4px 16px rgba(16,185,129,0.15);
    letter-spacing: 0.04em;
    border: 2px solid #fff2;
    min-width: 90px;
    text-align: center;
  }
  .promo-price-row {
    flex-wrap: wrap;
  }
  @media (max-width: 600px) {
    .promo-price-responsive {
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      text-align: center;
    }
    .promo-price-responsive span {
      margin: 0 !important;
    }
    .promo-price-responsive .text-3xl {
      margin-top: 0.25rem;
      margin-bottom: 0.25rem;
    }
  }
  .price-section {
    background: rgba(255,255,255,0.18);
    border-radius: 1.25rem;
    box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    border: 1.5px solid rgba(255,255,255,0.18);
    margin-bottom: 1.5rem;
    margin-top: 0.5rem;
    max-width: 320px;
    width: 100%;
    transition: box-shadow 0.2s;
    position: relative;
    overflow: visible;
    padding: 0.5rem 0.3rem;
  }
  .price-section:hover {
    box-shadow: 0 8px 32px rgba(255,107,53,0.10), 0 2px 8px rgba(16,185,129,0.10);
  }
  .ribbon-discount {
    position: absolute;
    top: 18px;
    right: -48px;
    width: 140px;
    background: linear-gradient(90deg, #10b981 60%, #34d399 100%);
    color: #fff;
    text-align: center;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 0.4em 0;
    transform: rotate(32deg);
    box-shadow: 0 4px 16px rgba(16,185,129,0.15);
    border-radius: 0.5em;
    z-index: 20;
    border: 2px solid #fff2;
    pointer-events: none;
  }
  @media (max-width: 600px) {
    .price-section {
      /* padding: 1.25rem 0.5rem; */
      max-width: 100%;
    }
    .ribbon-discount {
      top: 12px;
      right: -38px;
      width: 110px;
      font-size: 0.95rem;
    }
  }
  .benefits-bar {
    background: rgba(255,255,255,0.10);
    border-radius: 0.75rem;
    padding: 0.25rem 0.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0;
    width: 100%;
    font-size: 0.92em;
    flex-wrap: wrap;
    gap: 0.5em;
    justify-content: center;
  }
  .benefit {
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 0.25em;
    font-size: 0.98em;
  }
  .separator {
    color: #fff8;
    font-size: 1.1em;
    margin: 0 0.2em;
    user-select: none;
  }
  @media (max-width: 600px) {
    .benefits-bar {
      font-size: 0.85em;
      gap: 0.25em;
      padding: 0.25rem 0.1rem;
    }
    .benefit {
      font-size: 0.93em;
    }
  }
  .improved-benefits-list {
    margin-top: -0.5rem;
    margin-bottom: 2rem;
    padding-left: 2rem;
    list-style-type: disc;
    /* color: var(--text-inverse); */
    background: rgba(255,255,255,0.08);
    border-radius: 1rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    font-size: 1.04em;
    font-weight: 500;
    overflow: hidden;
  }
  .improved-benefits-list li {
    display: flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.5em 0.5em 0.5em 0;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    transition: background 0.15s;
  }
  .improved-benefits-list li:last-child {
    border-bottom: none;
  }
  .improved-benefits-list i {
    min-width: 1.2em;
    text-align: center;
    font-size: 1.1em;
    opacity: 0.92;
  }
  @media (max-width: 600px) {
    .improved-benefits-list {
      font-size: 0.97em;
      padding-left: 1.2rem;
    }
    .improved-benefits-list li {
      padding: 0.45em 0.2em 0.45em 0;
    }
  }
  .plan-pro-card {
    border-left: 6px solid var(--primary-color);
    background: rgba(255,255,255,0.95);
    border-radius: 1.5rem;
    box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    margin-bottom: 2.5rem;
    margin-top: 2.5rem;
    max-width: 900px;
    width: 100%;
    transition: box-shadow 0.2s;
    position: relative;
    overflow: visible;
    
  }
  .plan-pro-card:hover {
    box-shadow: 0 8px 32px rgba(255,107,53,0.10), 0 2px 8px rgba(16,185,129,0.10);
  }
  .pro-benefits-list {
    margin-top: 0.5rem;
    margin-bottom: 1.5rem;
    padding-left: 2rem;
    list-style-type: disc;
    color: var(--text-primary);
    background: rgba(255,255,255,0.08);
    border-radius: 1rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    font-size: 1.04em;
    font-weight: 500;
    overflow: hidden;
  }
  .pro-benefits-list li {
    display: flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.5em 0.5em 0.5em 0;
    border-bottom: 1px solid rgba(0,0,0,0.06);
    transition: background 0.15s;
  }
  .pro-benefits-list li:last-child {
    border-bottom: none;
  }
  .pro-benefits-list i {
    min-width: 1.2em;
    text-align: center;
    font-size: 1.1em;
    opacity: 0.92;
  }
  @media (max-width: 900px) {
    .plan-pro-card {
      flex-direction: column;
      align-items: stretch;
      padding: 1.5rem 1rem;
    }
    .plan-pro-card img {
      margin: 0 auto;
    }
  }
  @media (max-width: 600px) {
    .plan-pro-card {
      font-size: 0.97em;
      padding: 1.25rem 0.5rem;
      max-width: 100%;
    }
    .pro-benefits-list {
      font-size: 0.95em;
      padding-left: 1.2rem;
    }
    .pro-benefits-list li {
      padding: 0.45em 0.2em 0.45em 0;
    }
  }
  .themed-card {
    background: var(--bg-primary);
    color: var(--text-primary);
    border-color: var(--bg-accent);
    box-shadow: var(--shadow-md);
    transition: background 0.2s, color 0.2s, border-color 0.2s;
  }
  .themed-card .text-accent {
    color: var(--primary-color);
  }
  .themed-card .text-success {
    color: var(--success);
  }
  .themed-card .text-secondary {
    color: var(--secondary-color);
  }
  .themed-card .text-primary {
    color: var(--text-primary);
  }
  .themed-card .bg-opacity-20 {
    background: rgba(255,255,255,0.18);
  }
  @media (prefers-color-scheme: dark) {
    .themed-card {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border-color: var(--bg-accent);
      box-shadow: var(--shadow-lg);
    }
    .themed-card .bg-opacity-20 {
      background: rgba(30,41,59,0.18);
    }
    .themed-card .pro-benefits-list, .themed-card .improved-benefits-list {
      background: rgba(30,41,59,0.18);
      color: var(--text-primary);
    }
  }
  .main-cards-grid {
    width: 100%;
    margin: 0 auto 2rem auto;
    max-width: 1200px;
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
  /* Elimina utilidades tipo Tailwind no presentes en global-styles.css y reemplaza por CSS puro */
.promo-card, .plan-pro-card {
  max-width: 370px;
  margin-left: auto;
  margin-right: auto;
  padding: 1rem 0.75rem;
  min-height: unset;
  max-height: unset;
  box-sizing: border-box;
  font-size: 0.97em;
  background: var(--bg-primary);
  color: var(--text-primary);
  border-radius: 1.5rem;
  border: 1px solid var(--bg-accent);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.promo-card .price-section, .plan-pro-card .price-section {
  /* padding: 1.5rem 1rem; */
  max-width: 220px;
  background: rgba(255,255,255,0.18);
  border-radius: 1rem;
  margin: 0 auto 0.5rem auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1px solid var(--bg-accent);
  text-align: center;
}
.promo-card img, .plan-pro-card img {
  width: 60px;
  height: 60px;
  min-width: 48px;
  min-height: 48px;
  max-width: 70px;
  max-height: 70px;
  object-fit: contain;
  filter: drop-shadow(0 4px 16px rgba(0,0,0,0.10));
}
.promo-card ul, .plan-pro-card ul {
  font-size: 0.93em;
  margin-bottom: 0.5rem;
  margin-top: 0.2rem;
  padding-left: 1rem;
  background: rgba(255,255,255,0.08);
  border-radius: 0.75rem;
  box-shadow: 0 1px 6px rgba(0,0,0,0.03);
  width: 100%;
}
.promo-card ul li, .plan-pro-card ul li {
  display: flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.35em 0.2em 0.35em 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.promo-card ul li:last-child, .plan-pro-card ul li:last-child {
  border-bottom: none;
}
.promo-card .btn, .plan-pro-card .btn {
  font-size: 0.97em;
  padding: 1rem 1.2rem;
  min-height: 34px;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  font-weight: 600;
  background: var(--primary-gradient);
  color: var(--text-inverse);
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  transition: background 0.2s;
}
.promo-card .btn:active, .plan-pro-card .btn:active {
  background: var(--primary-dark);
}
.promo-card h2, .plan-pro-card h2 {
  font-size: 1.1rem;
  margin-bottom: 0.3rem;
  font-weight: 700;
  color: var(--primary-color);
  text-align: center;
}
.promo-card .flex-1, .plan-pro-card .flex-1 {
  gap: 0.5rem;
}
.promo-card .ribbon-discount, .plan-pro-card .ribbon-discount {
  font-size: 0.9em;
  width: 80px;
  right: -28px;
  top: 10px;
  padding: 0.25em 0;
  position: absolute;
  background: linear-gradient(90deg, #10b981 60%, #34d399 100%);
  color: #fff;
  text-align: center;
  font-weight: 700;
  letter-spacing: 0.04em;
  border-radius: 0.5em;
  z-index: 20;
  border: 2px solid #fff2;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(16,185,129,0.10);
  transform: rotate(32deg);
}
.promo-card .discount-badge, .plan-pro-card .discount-badge {
  font-size: 0.9em;
  padding: 0.25em 0.7em;
  background: linear-gradient(90deg, #10b981 60%, #34d399 100%);
  color: #fff;
  border-radius: 1em;
  font-weight: 700;
  border: 2px solid #fff2;
  box-shadow: 0 2px 8px rgba(16,185,129,0.10);
}
@media (min-width: 768px) {
  .main-cards-grid {
    gap: 1rem;
  }
  .promo-card, .plan-pro-card {
    max-width: 340px;
    padding: 1.8rem 1.5rem;
    font-size: 0.95em;
  }
  .promo-card img, .plan-pro-card img {
    width: 50px;
    height: 50px;
    max-width: 60px;
    max-height: 60px;
  }
  .promo-card ul, .plan-pro-card ul {
    font-size: 0.91em;
  }
}
@media (max-width: 600px) {
  .promo-card, .plan-pro-card {
    max-width: 100%;
    padding: 1.5rem 1.2rem;
    font-size: 0.95em;
  }
  .promo-card img, .plan-pro-card img {
    width: 44px;
    height: 44px;
    max-width: 50px;
    max-height: 50px;
  }
  .promo-card ul, .plan-pro-card ul {
    font-size: 0.89em;
  }
}
  .promo-card:hover, .plan-pro-card:hover {
    box-shadow: none;
    transform: none;
  }
  .planpro-flex-1 {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .planpro-btn-wrapper {
    margin-top: auto;
    display: flex;
    justify-content: center;
    width: 100%;
    padding-top: 0.5rem;
  }

  /* --- Estilos modernos para la sección de precio Plan Pro --- */
  .planpro-price-wrapper {
    position: relative;
    background: rgba(255,255,255,0.18); /* Igual que .price-section de promo-card */
    border: 1px solid var(--bg-accent);
    border-radius: 1.2em;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    padding: 1.2em 1.5em 1em 1.5em;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 1.5em;
    margin-top: 0.5em;
    min-width: 180px;
    max-width: 260px;
    color: var(--text-inverse);
  }
  .planpro-badge {
    position: absolute;
    top: -0.9em;
    right: 1.2em;
    background: var(--secondary-color);
    color: #fff;
    font-size: 0.85em;
    font-weight: 700;
    padding: 0.25em 0.9em;
    border-radius: 1em;
    box-shadow: 0 2px 8px rgba(0,0,0,0.10);
    letter-spacing: 0.04em;
  }
  .planpro-price-main {
    display: flex;
    align-items: baseline;
    gap: 0.2em;
  }
  .planpro-currency {
    font-size: 1.2em;
    font-weight: 600;
    opacity: 0.85;
    margin-right: 0.1em;
  }
  .planpro-amount {
    font-size: 2.8em;
    font-weight: 900;
    letter-spacing: -0.03em;
    margin-right: 0.15em;
    text-shadow: 0 2px 8px rgba(0,0,0,0.10);
    color: var(--primary-color);
  }
  .planpro-period {
    font-size: 1em;
    font-weight: 500;
    color: var(--success);
    margin-left: 0.2em;
    opacity: 0.95;
  }
</style>
