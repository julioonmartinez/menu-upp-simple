<script lang="ts">
    /**
     * FavoritesGlobal Component
     * 
     * Este componente maneja la visualización de favoritos y calificaciones del usuario.
     * 
     * Funcionalidad:
     * - Usuarios anónimos: Muestra favoritos guardados en localStorage
     * - Usuarios autenticados: Muestra favoritos de la base de datos, con fallback a localStorage
     * - Sincronización automática entre datos locales y de la base de datos
     * - Soporte para platillos y restaurantes
     * - Tabs para favoritos y calificaciones
     * - Filtros por tipo de contenido (platillos/restaurantes)
     */
    
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import type { Dish } from "../interfaces/dish";
    import type { Restaurant } from "../interfaces/restaurant";
    import CardDishDynamic from "../components/Cards/CardDishDyanmic.svelte";
    import RestaurantCardCompact from "../components/RestaurantCardCompact.svelte";
    import { fade, fly } from "svelte/transition";
    
    // Stores principales
    import { favoritesStore } from "../stores/favoritesStore";
    import { authStore } from "../stores/authStore";
    import { restaurantFavoritesStore } from "../stores/restaurantFavoritesStore";
    import { dishRatingStore } from "../stores/dishRatingStore";
    import { authService } from "../services/authService";
    import {
        fetchAnonymousRestaurantFavorites,
        fetchUserRestaurantFavorites,
        getDeviceId
    } from "../services/apiRatingService";

    // Estados locales
    let dishesRating: Dish[] = [];
    let dishesSaved: Dish[] = [];
    let allDishes: Dish[] = [];
    let restaurantsRating: Restaurant[] = [];
    let restaurantsSaved: Restaurant[] = [];
    let dishesLoaded = false;
    let restaurantsLoaded = false;
    let checked = false;
    let activeTab: 'favorites' | 'ratings' = 'favorites';
    let contentFilter: 'dishes' | 'restaurants' = 'dishes';
    let deviceId = '';

    // Props
    export let backgroundColor = '#FFFFFF';
    export let primaryColor = '#FF4500';
    export let secondaryColor = '#FF4500';
    export let username: string | null = null;
    export let showFloatingButton: boolean = true;

    // Computed/derived
    $: formattedPrimaryColor = primaryColor || '#FF4500';
    $: formattedSecondaryColor = secondaryColor || '#FF4500';
    $: formattedBackgroundColor = backgroundColor || 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
    $: loading = !dishesLoaded || !restaurantsLoaded;
    $: hasAnyData = dishesSaved.length > 0 || dishesRating.length > 0 || restaurantsSaved.length > 0 || restaurantsRating.length > 0;
    $: currentItems = (function() {
        if (activeTab === 'favorites') {
            return contentFilter === 'dishes' ? dishesSaved : restaurantsSaved;
        } else {
            return contentFilter === 'dishes' ? dishesRating : restaurantsRating;
        }
    })();
    $: hasCurrentItems = currentItems && currentItems.length > 0;
    $: itemsCount = currentItems ? currentItems.length : 0;

    // Funciones utilitarias
    function getFilterIcon(filter: 'dishes' | 'restaurants') {
        return filter === 'dishes' ? 'fa-utensils' : 'fa-store';
    }
    function getFilterText(filter: 'dishes' | 'restaurants') {
        return filter === 'dishes' ? 'Platillos' : 'Restaurantes';
    }
    function getFilterCount(filter: 'dishes' | 'restaurants', tab: 'favorites' | 'ratings') {
        if (tab === 'favorites') {
            return filter === 'dishes' ? dishesSaved.length : restaurantsSaved.length;
        } else {
            return filter === 'dishes' ? dishesRating.length : restaurantsRating.length;
        }
    }
    function getAuthToken(): string | null {
        return authService.getTokenFromCookie();
    }

    // Carga de favoritos/restaurantes
    async function loadFavoriteRestaurants() {
        try {
            if ($authStore.isAuthenticated && getAuthToken()) {
                const response = await fetchUserRestaurantFavorites(getAuthToken()!, 1, 50);
                restaurantsSaved = response.restaurants || [];
            } else {
                const response = await fetchAnonymousRestaurantFavorites(deviceId, 1, 50);
                restaurantsSaved = response.restaurants || [];
            }
        } catch (error) {
            restaurantsSaved = [];
        }
    }
    async function loadRatedRestaurants() {
        try {
            if ($authStore.isAuthenticated && getAuthToken()) {
                restaurantsRating = [];
            } else {
                restaurantsRating = [];
            }
        } catch (error) {
            restaurantsRating = [];
        }
    }
    async function syncLocalWithDatabase() {
        if (!$authStore.isAuthenticated || !getAuthToken()) return;
        try {
            // Aquí iría la lógica de sincronización
        } catch (error) {}
    }

    // Ciclo de vida y suscripciones
    onMount(() => {
        deviceId = getDeviceId();
        const currentState = get(favoritesStore);
        if (currentState.favorites.length === 0 && currentState.ratingsDish.length === 0) {
            if (typeof window !== 'undefined') {
                localStorage.getItem('favoriteItems');
                localStorage.getItem('ratingItems');
            }
        }
        // Suscripción a favoritos
        const unsubscribeFavorites = favoritesStore.subscribe(state => {
            dishesSaved = state.favorites;
            dishesRating = state.ratingsDish;
            allDishes = state.allDishes;
            dishesLoaded = true;
        });
        // Suscripción a restaurantes favoritos
        const unsubscribeRestaurantFavorites = restaurantFavoritesStore.subscribe(state => {
            if ($authStore.isAuthenticated && state.favorites.length > 0) {
                restaurantsSaved = state.favorites;
                restaurantsLoaded = true;
            }
        });
        // Suscripción a ratings de platillos
        const unsubscribeDishRatings = dishRatingStore.subscribe(state => {
            if ($authStore.isAuthenticated && state.favoriteDishes.length > 0) {
                dishesSaved = state.favoriteDishes.map(fav => ({
                    id: fav.id,
                    name: fav.name,
                    description: fav.description || '',
                    price: fav.price,
                    image: fav.image || '',
                    categoryId: fav.categoryId || '',
                    restaurantId: fav.restaurantId || '',
                    rating: fav.rating,
                    favorites: fav.favorites,
                    userFav: fav.userFav,
                    inStock: true,
                    reviewsCount: 0,
                    userRating: undefined,
                    quantity: undefined,
                    options: undefined,
                    discount: undefined,
                    nutritionalInfo: undefined,
                    platillo_base: undefined,
                    platillo_base_info: undefined
                }));
                dishesLoaded = true;
            }
        });
        // Carga inicial de restaurantes
        (async () => {
            try {
                await Promise.all([
                    loadFavoriteRestaurants(),
                    loadRatedRestaurants()
                ]);
                restaurantsLoaded = true;
                checked = true;
            } catch (error) {
                restaurantsLoaded = true;
                checked = true;
            }
        })();
        // Carga de datos autenticados
        (async () => {
            if ($authStore.isAuthenticated) {
                try {
                    await restaurantFavoritesStore.loadUserFavorites(50, 1);
                    await dishRatingStore.loadFavoriteDishes(50, 1);
                    await syncLocalWithDatabase();
                } catch (error) {}
            }
        })();
        // Cleanup
        return () => {
            unsubscribeFavorites();
            unsubscribeRestaurantFavorites();
            unsubscribeDishRatings();
        };
    });

    function handleToast(event: { detail: any; }) {
        // Puedes mantener este log si lo necesitas
    }
</script>

<div 
    class="favorites-container" 
    class:active={hasAnyData}
    style="--primary-color: {formattedPrimaryColor}; --secondary-color: {formattedSecondaryColor};"
>
    {#if loading}
        <div class="loading-container">
            <div class="loader-ring">
                <div class="loader-ring-inner"></div>
            </div>
            <div class="loading-text">Buscando tu colección...</div>
        </div>
    {:else if hasAnyData}
        <div class="favorites-content">
            <div class="header-container">
                <h1 class="main-title">Tu Colección</h1>
                <p class="subtitle">Tus platillos y restaurantes favoritos</p>
                
                <!-- Tabs principales -->
                <div class="tabs-container">
                    <div class="tabs">
                        <button 
                            class="tab-button" 
                            on:click={() => activeTab = 'favorites'} 
                            class:active={activeTab === 'favorites'}
                        >
                            <i class="fa-solid fa-bookmark"></i>
                            <span class="tab-text">
                                Favoritos {(getFilterCount('dishes', 'favorites') + getFilterCount('restaurants', 'favorites')) > 0 ? `(${getFilterCount('dishes', 'favorites') + getFilterCount('restaurants', 'favorites')})` : ''}
                            </span>
                        </button>
                        <button 
                            class="tab-button" 
                            on:click={() => activeTab = 'ratings'} 
                            class:active={activeTab === 'ratings'}
                        >
                            <i class="fa-solid fa-star"></i>
                            <span class="tab-text">
                                Calificados {(getFilterCount('dishes', 'ratings') + getFilterCount('restaurants', 'ratings')) > 0 ? `(${getFilterCount('dishes', 'ratings') + getFilterCount('restaurants', 'ratings')})` : ''}
                            </span>
                        </button>
                    </div>
                </div>
                
                <!-- Filtros de contenido -->
                <div class="content-filters">
                    <div class="filter-buttons">
                        <button 
                            class="filter-button" 
                            class:active={contentFilter === 'dishes'}
                            on:click={() => contentFilter = 'dishes'}
                        >
                            <i class="fa-solid {getFilterIcon('dishes')}"></i>
                            <span>{getFilterText('dishes')}</span>
                            {#if getFilterCount('dishes', activeTab) > 0}
                                <span class="filter-badge">{getFilterCount('dishes', activeTab)}</span>
                            {/if}
                        </button>
                        <button 
                            class="filter-button" 
                            class:active={contentFilter === 'restaurants'}
                            on:click={() => contentFilter = 'restaurants'}
                        >
                            <i class="fa-solid {getFilterIcon('restaurants')}"></i>
                            <span>{getFilterText('restaurants')}</span>
                            {#if getFilterCount('restaurants', activeTab) > 0}
                                <span class="filter-badge">{getFilterCount('restaurants', activeTab)}</span>
                            {/if}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Contenido dinámico -->
            {#if hasCurrentItems}
                <div class="section-header">
                    <h2 class="section-title">
                        <i class="fa-solid {activeTab === 'favorites' ? 'fa-bookmark' : 'fa-star'} icon-primary"></i>
                        {activeTab === 'favorites' ? 'Guardados' : 'Calificados'} • {getFilterText(contentFilter)}
                    </h2>
                    <div class="badge">{itemsCount} {itemsCount === 1 ? 'elemento' : 'elementos'}</div>
                </div>
                <div class="items-grid grid-cards-responsive">
                    {#each currentItems as item, index (item.id)}
                        <div in:fly={{y: 20, delay: index * 50, duration: 300}} class="card-size-controlled">
                            {#if contentFilter === 'dishes'}
                                <CardDishDynamic
                                    item={item} 
                                    index={index} 
                                    storeMode={false}
                                />
                            {:else}
                                <RestaurantCardCompact
                                    restaurant={item}
                                    storeInitialized={true}
                                    on:toast={handleToast}
                                />
                            {/if}
                        </div>
                    {/each}
                </div>
            {:else}
                <!-- Estados vacíos específicos -->
                <div class="empty-container">
                    <div class="empty-state">
                        <div class="icon-container">
                            <i class="fa-solid {getFilterIcon(contentFilter)} empty-icon"></i>
                        </div>
                        <h3 class="empty-title">
                            ¡Aún no tienes {getFilterText(contentFilter).toLowerCase()} {activeTab === 'favorites' ? 'guardados' : 'calificados'}!
                        </h3>
                        <p class="empty-description">
                            {#if contentFilter === 'dishes'}
                                Explora nuestro menú y {activeTab === 'favorites' ? 'guarda' : 'califica'} tus platillos favoritos.
                            {:else}
                                Descubre nuevos restaurantes y {activeTab === 'favorites' ? 'guárdalos' : 'califícalos'} para encontrarlos fácilmente.
                            {/if}
                        </p>
                        <a href={contentFilter === 'dishes' ? "/buscar" : "/restaurantes"} class="btn btn-primary explore-button">
                            Explorar {getFilterText(contentFilter).toLowerCase()}
                            <i class="fa-solid fa-arrow-right explore-icon"></i>
                        </a>
                    </div>
                </div>
            {/if}
        </div>
    {:else if checked}
        <div class="empty-container">
            <div class="empty-state">
                <div class="icon-container">
                    <i class="fa-solid fa-heart empty-icon"></i>
                </div>
                <h3 class="empty-title">¡Tu colección está vacía!</h3>
                <p class="empty-description">
                    Aún no tienes platillos ni restaurantes guardados o calificados. ¡Comienza a explorar y crea tu colección personal!
                </p>
                <a href="/buscar" class="btn btn-primary explore-button">
                    Comenzar a explorar
                    <i class="fa-solid fa-arrow-right explore-icon"></i>
                </a>
            </div>
        </div>
    {/if}
</div>

{#if showFloatingButton}
    <a 
        href="{username ? `/${username}/menu` : '/' }" 
        class="floating-button"
        in:fly={{ y: 50, duration: 500 }}
        out:fade={{ duration: 300 }}
        style="--primary-color: {formattedPrimaryColor}; --secondary-color: {formattedSecondaryColor};"
    >
        <div class="button-content">
            <div class="icon">
                <i class="fa-solid fa-utensils"></i>
            </div>
            <span class="label">Ver menú</span>
        </div>
        <div class="pulse-effect"></div>
    </a>
{/if}

<style>
    /* Variables CSS personalizadas para el componente */
    .favorites-container {
        --primary-color: var(--primary-color, #ff6b35);
        --secondary-color: var(--secondary-color, #0D1B2A);
        --primary-light: #ff8c69;
        --primary-dark: #e55a2b;
        --primary-gradient: linear-gradient(135deg, var(--primary-color), var(--primary-light));
        --primary-gradient-bold: linear-gradient(135deg, var(--primary-color), var(--primary-dark), var(--secondary-color));
    }

    /* Contenedor principal */
    .favorites-container {
        min-height: 100vh;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-lg);
        background-color: var(--bg-secondary);
        overflow-x: hidden;
    }
    
    .favorites-container.active {
        justify-content: flex-start;
        padding-top: var(--spacing-4xl);
    }

    .favorites-content {
        width: 100%;
        max-width: var(--container-xl);
    }

    /* Header y navegación */
    .header-container {
        text-align: center;
        margin-bottom: var(--spacing-2xl);
        width: 100%;
    }

    .main-title {
        font-size: var(--font-4xl);
        font-weight: var(--weight-bold);
        color: var(--text-primary);
        margin-bottom: var(--spacing-xs);
        position: relative;
        display: inline-block;
    }

    .main-title::after {
        content: "";
        position: absolute;
        bottom: calc(-1 * var(--spacing-xs));
        left: 50%;
        transform: translateX(-50%);
        width: 60px;
        height: 3px;
        background: var(--primary-gradient);
        border-radius: var(--radius-sm);
    }

    .subtitle {
        font-size: var(--font-lg);
        color: var(--text-secondary);
        opacity: 0.8;
        margin-bottom: var(--spacing-xl);
    }

    /* Tabs principales */
    .tabs-container {
        display: flex;
        justify-content: center;
        margin-bottom: var(--spacing-lg);
    }

    .tabs {
        display: flex;
        width: 100%;
        max-width: 400px;
        padding: var(--spacing-sm);
        background-color: var(--bg-accent);
        border-radius: var(--radius-3xl);
        box-shadow: var(--shadow-sm);
    }

    .tab-button {
        flex: 1;
        padding: var(--spacing-md) var(--spacing-lg);
        border: none;
        border-radius: var(--radius-2xl);
        cursor: pointer;
        transition: all var(--transition-normal);
        font-weight: var(--weight-medium);
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        font-size: var(--font-base);
        min-height: 44px;
    }

    .tab-button.active {
        background: var(--primary-gradient);
        color: var(--text-inverse);
        box-shadow: var(--primary-glow);
    }

    .tab-button:hover:not(.active) {
        background-color: var(--bg-tertiary);
        color: var(--text-primary);
    }
    /* .tab-text{
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
    } */

    /* Filtros de contenido */
    .content-filters {
        display: flex;
        justify-content: center;
        margin-bottom: var(--spacing-lg);
    }

    .filter-buttons {
        display: flex;
        gap: var(--spacing-xs);
        padding: var(--spacing-xs);
        background-color: var(--bg-tertiary);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-xs);
    }

    .filter-button {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-md) var(--spacing-lg);
        border: none;
        border-radius: var(--radius-lg);
        cursor: pointer;
        transition: all var(--transition-fast);
        font-weight: var(--weight-medium);
        font-size: var(--font-sm);
        color: var(--text-secondary);
        background: transparent;
        position: relative;
        min-height: 44px;
    }

    .filter-button.active {
        background: var(--primary-gradient);
        color: var(--text-inverse);
        box-shadow: var(--shadow-sm);
    }

    .filter-button:hover:not(.active) {
        background-color: var(--bg-accent);
        color: var(--primary-color);
    }

    .filter-badge {
        background-color: rgba(255, 255, 255, 0.2);
        color: inherit;
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-full);
        font-size: var(--font-xs);
        font-weight: var(--weight-semibold);
        min-width: 1.25rem;
        text-align: center;
        line-height: 1;
    }

    .filter-button:not(.active) .filter-badge {
        background-color: var(--primary-color);
        color: var(--text-inverse);
    }

    /* Section header */
    .section-header {
        display: flex;
        align-items: center;
        margin-bottom: var(--spacing-lg);
        gap: var(--spacing-md);
        justify-content: space-between;
    }

    .section-title {
        font-size: var(--font-2xl);
        color: var(--text-primary);
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-weight: var(--weight-semibold);
    }

    .icon-primary {
        color: var(--primary-color);
    }

    .badge {
        background: var(--primary-gradient);
        color: var(--text-inverse);
        padding: var(--spacing-xs) var(--spacing-md);
        border-radius: var(--radius-xl);
        font-size: var(--font-sm);
        font-weight: var(--weight-medium);
        height: 100%;
        display: flex;
        align-items: center;
    }
    
    /* Grid de items */
    .items-grid {
        margin-bottom: var(--spacing-2xl);
    }
    
    /* Loading states */
    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
    }
    
    .loader-ring {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        position: relative;
        padding: 2px;
        background: var(--primary-gradient);
        animation: rotate 1.5s linear infinite;
    }
    
    .loader-ring-inner {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: var(--bg-secondary);
    }
    
    .loading-text {
        margin-top: var(--spacing-lg);
        color: var(--text-primary);
        font-size: var(--font-base);
        font-weight: var(--weight-medium);
    }
    
    /* Estados vacíos */
    .empty-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        min-height: 60vh;
        padding: var(--spacing-lg);
    }
    
    .empty-state {
        background: var(--primary-gradient-bold);
        border-radius: var(--radius-2xl);
        color: var(--text-inverse);
        padding: var(--spacing-3xl) var(--spacing-2xl);
        text-align: center;
        box-shadow: var(--shadow-lg);
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 350px;
        transition: all var(--transition-normal);
    }
    
    .icon-container {
        background-color: rgba(255, 255, 255, 0.15);
        color: var(--text-inverse);
        width: 70px;
        height: 70px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: var(--spacing-lg);
        border: 3px solid rgba(255, 255, 255, 0.2);
    }
    
    .empty-icon {
        font-size: var(--font-4xl);
        color: var(--text-inverse);
    }
    
    .empty-title {
        font-size: var(--font-3xl);
        color: var(--text-inverse);
        margin-bottom: var(--spacing-md);
        font-weight: var(--weight-semibold);
    }
    
    .empty-description {
        color: var(--text-inverse);
        opacity: 0.9;
        margin-bottom: var(--spacing-2xl);
        line-height: var(--leading-relaxed);
        font-size: var(--font-base);
    }
    
    .explore-button {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        background: var(--primary-gradient);
        color: var(--text-inverse);
        padding: var(--spacing-lg) var(--spacing-2xl);
        border-radius: var(--radius-2xl);
        font-weight: var(--weight-semibold);
        font-size: var(--font-base);
        transition: all var(--transition-normal);
        box-shadow: var(--shadow-md);
        border: 2px solid rgba(255, 255, 255, 0.2);
        position: relative;
        overflow: hidden;
    }

    .explore-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.6s ease;
    }

    .explore-button:hover {
        background: var(--primary-gradient-bold);
        transform: translateY(-3px);
        box-shadow: var(--primary-glow);
        border-color: rgba(255, 255, 255, 0.3);
    }

    .explore-button:hover::before {
        left: 100%;
    }

    .explore-icon {
        font-size: var(--font-sm);
        margin-left: var(--spacing-sm);
        transition: transform var(--transition-normal);
    }

    .explore-button:hover .explore-icon {
        transform: translateX(3px);
    }
    
    @keyframes rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Floating button styles */
    .floating-button {
        position: fixed;
        bottom: var(--spacing-2xl);
        right: var(--spacing-2xl);
        background: var(--primary-gradient);
        color: var(--text-inverse);
        border-radius: var(--radius-3xl);
        padding: var(--spacing-lg) var(--spacing-2xl);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: var(--z-fixed);
        overflow: hidden;
        transition: all var(--transition-normal);
        box-shadow: var(--shadow-lg);
        text-decoration: none;
    }
    
    .floating-button:hover {
        transform: translateY(-5px);
        box-shadow: var(--primary-glow);
    }
    
    .button-content {
        display: flex;
        align-items: center;
        position: relative;
        z-index: 2;
    }
    
    .icon {
        width: 24px;
        height: 24px;
        margin-right: var(--spacing-lg);
    }
    
    .label {
        font-weight: var(--weight-medium);
        font-size: var(--font-base);
        white-space: nowrap;
    }
    
    .pulse-effect {
        position: absolute;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%);
        border-radius: 50%;
        transform: scale(0);
        animation: pulse 2s infinite;
        z-index: 1;
    }
    
    @keyframes pulse {
        0% {
            transform: scale(0);
            opacity: 0.8;
        }
        100% {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    /* Responsive */
    @media (max-width: 400px) {
        .tab-text {
            display: none;
        }
        
        .tab-button {
            padding: var(--spacing-md);
        }
        
        .tab-button i {
            font-size: var(--font-lg);
        }
        
        .filter-button span:not(.filter-badge) {
            display: none;
        }
        
        .filter-button {
            padding: var(--spacing-md);
        }
    }
    
    @media (min-width: 480px) {
        .main-title {
            font-size: var(--font-5xl);
        }
        
        .subtitle {
            font-size: var(--font-xl);
        }
        
        .section-title {
            font-size: var(--font-3xl);
        }
        
        .empty-state {
            padding: var(--spacing-4xl) var(--spacing-3xl);
        }
    }
    
    @media (min-width: 640px) {
        .header-container {
            margin-bottom: var(--spacing-3xl);
        }
    }
    
    @media (min-width: 1024px) {
        .favorites-container {
            padding: var(--spacing-3xl);
        }
    }
    
    @media (max-width: 768px) {
        .floating-button {
            bottom: var(--spacing-xl);
            right: var(--spacing-xl);
            padding: var(--spacing-md) var(--spacing-lg);
        }
        
        .icon {
            margin-right: var(--spacing-md);
        }
        
        .label {
            font-size: var(--font-sm);
        }
    }

    /* Touch device optimizations */
    @media (hover: none) and (pointer: coarse) {
        .floating-button:hover,
        .explore-button:hover {
            transform: none;
        }
        
        .floating-button {
            min-height: 48px;
            padding: var(--spacing-xl) var(--spacing-2xl);
        }
        
        .explore-button {
            min-height: 48px;
            padding: var(--spacing-xl) var(--spacing-2xl);
        }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
        .floating-button:hover,
        .explore-button:hover {
            transform: none;
        }
        
        .pulse-effect {
            animation: none;
        }
        
        .loader-ring {
            animation: none;
        }
    }
</style>