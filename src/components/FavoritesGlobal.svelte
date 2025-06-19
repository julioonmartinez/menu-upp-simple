<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import type { Dish } from "../interfaces/dish";
    import type { Restaurant } from "../interfaces/restaurant";
    import CardDishDynamic from "../components/Cards/CardDishDyanmic.svelte";
    import RestaurantCardCompact from "../components/RestaurantCardCompact.svelte";
    import { fade, fly } from "svelte/transition";
    import { favoritesStore, favCount, ratingCount } from "../stores/favoritesStore";
    import { 
    ratingStore, 
    searchStore, 
    isInitialized as isRestaurantStoreInitialized 
  } from '../stores/ratingStore';
    
    // Importaciones para restaurantes favoritos
    import { 
        fetchAnonymousRestaurantFavorites,
        fetchUserRestaurantFavorites,
        getDeviceId 
    } from "../services/apiRatingService";
    import { authStore } from "../stores/authStore";

    //estados para los platillos
    let dishesRating: Dish[] = [];
    let dishesSaved: Dish[] = [];
    let allDishes: Dish[] = [];
   
    // Estados para restaurantes
    let restaurantsRating: Restaurant[] = [];
    let restaurantsSaved: Restaurant[] = [];
    
    // CORREGIDO: Estados de loading separados
    let dishesLoaded = false;
    let restaurantsLoaded = false;
    let checked = false;
    let activeTab: 'favorites' | 'ratings' = 'favorites';
    
    // Nuevo estado para el filtro de contenido
    let contentFilter: 'dishes' | 'restaurants' = 'dishes';

    // Props con valores por defecto
    export let backgroundColor = '#FFFFFF';
    export let primaryColor = '#FF4500';
    export let secondaryColor = '#FF4500';
    export let username : string | null = null;
    export let showFloatingButton: boolean = true;
    
    // Variables reactivas para auth
    let isAuthenticated = false;
    let userToken = '';
    let deviceId = '';
    
    // Computed para asegurar que los colores estén bien formateados
    $: formattedPrimaryColor = primaryColor || '#FF4500';
    $: formattedSecondaryColor = secondaryColor || '#FF4500';
    $: formattedBackgroundColor = backgroundColor || 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
    
    // CORREGIDO: Computed mejorados con dependencias explícitas
    $: loading = !dishesLoaded || !restaurantsLoaded;
    $: hasAnyData = dishesSaved.length > 0 || dishesRating.length > 0 || 
                    restaurantsSaved.length > 0 || restaurantsRating.length > 0;
    
    // SOLUCION: Hacer las dependencias explícitas para Svelte
    $: currentItems = (function() {
        // Forzar dependencias explícitas
        const deps = { activeTab, contentFilter, dishesSaved, dishesRating, restaurantsSaved, restaurantsRating };
        
        if (activeTab === 'favorites') {
            return contentFilter === 'dishes' ? dishesSaved : restaurantsSaved;
        } else {
            return contentFilter === 'dishes' ? dishesRating : restaurantsRating;
        }
    })();
    
    $: hasCurrentItems = currentItems && currentItems.length > 0;
    $: itemsCount = currentItems ? currentItems.length : 0;
    
    // CORREGIDO: Función con debugging mejorado
    function getCurrentItems() {
        let items;
        if (activeTab === 'favorites') {
            items = contentFilter === 'dishes' ? dishesSaved : restaurantsSaved;
        } else {
            items = contentFilter === 'dishes' ? dishesRating : restaurantsRating;
        }
        
        console.log('getCurrentItems DETAILED:', {
            activeTab,
            contentFilter,
            itemsLength: items.length,
            itemsType: Array.isArray(items) ? 'array' : typeof items,
            items: items,
            dishesSaved: dishesSaved,
            dishesSavedLength: dishesSaved?.length,
            dishesSavedType: Array.isArray(dishesSaved) ? 'array' : typeof dishesSaved,
            restaurantsSaved: restaurantsSaved,
            dishesRating: dishesRating,
            restaurantsRating: restaurantsRating
        });
        
        return items;
    }
    
    // Función para obtener el ícono según el filtro
    function getFilterIcon(filter: 'dishes' | 'restaurants') {
        return filter === 'dishes' ? 'fa-utensils' : 'fa-store';
    }
    
    // Función para obtener el texto del filtro
    function getFilterText(filter: 'dishes' | 'restaurants') {
        return filter === 'dishes' ? 'Platillos' : 'Restaurantes';
    }
    
    // Función para obtener el conteo según filtro y tab
    function getFilterCount(filter: 'dishes' | 'restaurants', tab: 'favorites' | 'ratings') {
        if (tab === 'favorites') {
            return filter === 'dishes' ? dishesSaved.length : restaurantsSaved.length;
        } else {
            return filter === 'dishes' ? dishesRating.length : restaurantsRating.length;
        }
    }
    
    // Función para cargar restaurantes favoritos
    async function loadFavoriteRestaurants() {
        try {
            console.log('Loading favorite restaurants...');
            if (isAuthenticated && userToken) {
                const response = await fetchUserRestaurantFavorites(userToken, 1, 50);
                restaurantsSaved = response.restaurants || [];
            } else {
                const response = await fetchAnonymousRestaurantFavorites(deviceId, 1, 50);
                restaurantsSaved = response.restaurants || [];
            }
            console.log('Loaded favorite restaurants:', restaurantsSaved.length);
        } catch (error) {
            console.error('Error loading favorite restaurants:', error);
            restaurantsSaved = [];
        }
    }
    
    // CORREGIDO: Función para cargar restaurantes valorados
    async function loadRatedRestaurants() {
        try {
            console.log('Loading rated restaurants...');
            // Por ahora, simularemos esto con localStorage o una implementación básica
            // En una implementación real, tendrías un endpoint para esto
            restaurantsRating = [];
            
            // Si tienes un endpoint para restaurantes calificados, descomenta:
            // if (isAuthenticated && userToken) {
            //     const response = await fetchUserRestaurantRatings(userToken, 1, 50);
            //     restaurantsRating = response.restaurants || [];
            // } else {
            //     const response = await fetchAnonymousRestaurantRatings(deviceId, 1, 50);
            //     restaurantsRating = response.restaurants || [];
            // }
            
            console.log('Loaded rated restaurants:', restaurantsRating.length);
        } catch (error) {
            console.error('Error loading rated restaurants:', error);
            restaurantsRating = [];
        }
    }
    
    // CORREGIDO: onMount mejorado
    onMount(() => {
        console.log('FavoriteGlobal mounting...');
        
        // Inicializar device ID
        deviceId = getDeviceId();
        
        // Verificar estado inicial del store
        const currentState = get(favoritesStore);
        console.log('Initial store state:', {
            favoritesCount: currentState.favorites.length,
            ratingsCount: currentState.ratingsDish.length,
            allDishesCount: currentState.allDishes.length
        });
        
        // Si el store parece vacío, verificar localStorage
        if (currentState.favorites.length === 0 && currentState.ratingsDish.length === 0) {
            console.log('Store appears empty, checking localStorage...');
            if (typeof window !== 'undefined') {
                const savedFavs = localStorage.getItem('favoriteItems');
                const savedRatings = localStorage.getItem('ratingItems');
                console.log('LocalStorage check:', {
                    hasFavorites: !!savedFavs,
                    hasRatings: !!savedRatings,
                    favsLength: savedFavs ? JSON.parse(savedFavs).length : 0,
                    ratingsLength: savedRatings ? JSON.parse(savedRatings).length : 0
                });
            }
        }
        
        // Suscribirse al store de auth
        const unsubscribeAuth = authStore.subscribe((auth) => {
            isAuthenticated = auth.isAuthenticated;
            userToken = auth.token || '';
            console.log('Auth state updated:', { isAuthenticated, hasToken: !!userToken });
        });
        
        // CORREGIDO: Suscripción al store de favoritos con mejor manejo
        const unsubscribeFavorites = favoritesStore.subscribe(state => {
            const prevDishesLoaded = dishesLoaded;
            
            dishesSaved = state.favorites;
            dishesRating = state.ratingsDish;
            allDishes = state.allDishes;
            
            // Marcar platillos como cargados solo si hay datos o si ya estaba cargado
            dishesLoaded = true;
            
            console.log('FavoritesStore updated:', {
                favoritesCount: dishesSaved.length,
                ratingsCount: dishesRating.length,
                allDishesCount: allDishes.length,
                dishesLoaded,
                wasLoaded: prevDishesLoaded
            });
        });
        
        // CORREGIDO: Carga de restaurantes con mejor manejo de errores
        (async () => {
            try {
                console.log('Starting restaurant loading...');
                await Promise.all([
                    loadFavoriteRestaurants(),
                    loadRatedRestaurants()
                ]);
                
                restaurantsLoaded = true;
                checked = true;
                
                console.log('All restaurant data loaded:', {
                    savedCount: restaurantsSaved.length,
                    ratedCount: restaurantsRating.length,
                    restaurantsLoaded,
                    checked
                });
            } catch (error) {
                console.error('Error loading restaurant data:', error);
                restaurantsLoaded = true; // Marcar como cargado aunque haya error
                checked = true;
            }
        })();
        
        // Devolver función de cleanup
        return () => {
            console.log('FavoriteGlobal unmounting...');
            unsubscribeAuth();
            unsubscribeFavorites();
        };
    });
    
    // Función para manejar el toast desde RestaurantCardCompact
    function handleToast(event: { detail: any; }) {
        console.log('Toast from restaurant card:', event.detail);
    }
    
</script>

<div 
    class="ratings-container" 
    class:active={hasAnyData}
>
    {#if loading}
        <div class="loading-container">
            <div class="loader-ring">
                <div class="loader-ring-inner"></div>
            </div>
            <div class="loading-text">Buscando tu colección...</div>
        </div>
    {:else if hasAnyData}
        <div class="rated-dishes">
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
                <div class="items-grid">
                    {#each currentItems as item, index (item.id)}
                        <div in:fly={{y: 20, delay: index * 50, duration: 300}}>
                            {#if contentFilter === 'dishes'}
                                <CardDishDynamic
                                    item={item as Dish} 
                                    index={index} 
                                    storeMode={false}
                                    primaryColor={formattedPrimaryColor}
                                    secondaryColor={formattedSecondaryColor}
                                    backgroundColor={formattedBackgroundColor}
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
                        <!-- NUEVO: Mostrar si hay datos en otras secciones -->
                        <!-- {#if hasAnyData && !hasCurrentItems}
                            <p class="empty-hint">
                                Pero tienes elementos en otras secciones. 
                                Prueba cambiar de pestaña o filtro.
                            </p>
                        {/if} -->
                        <p class="empty-description">
                            {#if contentFilter === 'dishes'}
                                Explora nuestro menú y {activeTab === 'favorites' ? 'guarda' : 'califica'} tus platillos favoritos.
                            {:else}
                                Descubre nuevos restaurantes y {activeTab === 'favorites' ? 'guárdalos' : 'califícalos'} para encontrarlos fácilmente.
                            {/if}
                        </p>
                        <a href={contentFilter === 'dishes' ? "/buscar" : "/restaurantes"} class="explore-button">
                            Explorar {getFilterText(contentFilter).toLowerCase()}
                            <i class="fa-solid fa-arrow-right arrow-margin"></i>
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
                <a href="/buscar" class="explore-button">
                    Comenzar a explorar
                    <i class="fa-solid fa-arrow-right arrow-margin"></i>
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
    /* Estilos base mantenidos */
    .icon-primary {
        color: var(--primary-color);
    }
    
    .arrow-margin {
        margin-left: 0.5rem;
    }

    /* NUEVO: Estilos para debug info */
    .debug-info {
        background: #f0f0f0;
        border: 1px solid #ddd;
        padding: 0.5rem;
        margin: 0.5rem 0;
        font-size: 0.75rem;
        border-radius: 0.25rem;
        font-family: monospace;
        color: #666;
    }

    .loading-details {
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-top: 0.5rem;
        opacity: 0.8;
    }

    .empty-hint {
        color: var(--color-text-light);
        opacity: 0.9;
        margin-bottom: 0.5rem;
        font-weight: 500;
        font-size: 0.9rem;
        background-color: rgba(255, 255, 255, 0.1);
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        border-left: 3px solid rgba(255, 255, 255, 0.3);
    }

    .ratings-container {
        min-height: 100vh;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        background-color: var(--bg-secondary);
        overflow-x: hidden;
    }
    
    .ratings-container.active {
        justify-content: flex-start;
        padding-top: 1.5rem;
    }

    .header-container {
        text-align: center;
        margin-bottom: 1.5rem;
        width: 100%;
    }

    .main-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
        position: relative;
        display: inline-block;
    }

    .main-title::after {
        content: "";
        position: absolute;
        bottom: -0.25rem;
        left: 50%;
        transform: translateX(-50%);
        width: 60px;
        height: 3px;
        background-color: var(--primary-color);
        border-radius: 3px;
    }

    .subtitle {
        font-size: 0.9rem;
        color: var(--text-secondary);
        opacity: 0.8;
        margin-bottom: 1.25rem;
    }

    /* Tabs principales */
    .tabs-container {
        display: flex;
        justify-content: center;
        margin-bottom: 1rem;
    }

    .tabs {
        display: flex;
        width: 100%;
        max-width: 320px;
        padding: 0.3rem;
        background-color: var(--bg-accent);
        border-radius: 1.75rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .tab-button {
        flex: 1;
        padding: 0.6rem 0.75rem;
        border: none;
        border-radius: 1.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.3rem;
        font-size: 0.9rem;
    }

    .tab-button.active {
        background-color: var(--primary-color);
        color: white;
        box-shadow: 0 2px 8px rgba(216, 64, 64, 0.3);
    }

    /* Filtros de contenido */
    .content-filters {
        display: flex;
        justify-content: center;
        margin-bottom: 1rem;
    }

    .filter-buttons {
        display: flex;
        gap: 0.5rem;
        padding: 0.25rem;
        background-color: var(--bg-tertiary);
        border-radius: 1rem;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    }

    .filter-button {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.5rem 0.75rem;
        border: none;
        border-radius: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 500;
        font-size: 0.85rem;
        color: var(--text-secondary);
        background: transparent;
        position: relative;
    }

    .filter-button.active {
        background-color: var(--primary-color);
        color: white;
        box-shadow: 0 1px 6px rgba(255, 107, 53, 0.3);
    }

    .filter-button:hover:not(.active) {
        background-color: rgba(255, 107, 53, 0.1);
        color: var(--primary-color);
    }

    .filter-badge {
        background-color: rgba(255, 255, 255, 0.2);
        color: inherit;
        padding: 0.125rem 0.375rem;
        border-radius: 0.75rem;
        font-size: 0.75rem;
        font-weight: 600;
        min-width: 1.25rem;
        text-align: center;
        line-height: 1;
    }

    .filter-button:not(.active) .filter-badge {
        background-color: var(--primary-color);
        color: white;
    }

    /* Section header */
    .section-header {
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
        gap: 0.5rem;
        justify-content: space-between;
    }

    .section-title {
        font-size: 1.2rem;
        color: var(--text-primary);
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-weight: 600;
    }

    .badge {
        background-color: var(--primary-color);
        color: white;
        padding: 0.2rem 0.6rem;
        border-radius: 1rem;
        font-size: 0.8rem;
        font-weight: 500;
        height: 100%;
        display: flex;
        align-items: center;
    }
    
    /* Grid unificado para items */
    .items-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(1, 1fr);
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
        margin-top: 1rem;
        color: var(--text-primary);
        font-size: 0.9rem;
        font-weight: 500;
    }
    
    /* Estados vacíos */
    .rated-dishes {
        width: 100%;
        max-width: 1200px;
    }
    
    .empty-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        min-height: 60vh;
        padding: 1rem;
    }
    
    .empty-state {
        background: var(--primary-gradient-bold);
        border-radius: 1.25rem;
        color: white;
        padding: 2rem 1.5rem;
        text-align: center;
        box-shadow: 0 8px 20px rgba(163, 29, 29, 0.15);
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 350px;
        transition: all 0.3s ease;
    }
    
    .icon-container {
        background-color: rgba(255, 255, 255, 0.15);
        color: var(--color-text-light);
        width: 70px;
        height: 70px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;
        border: 3px solid rgba(255, 255, 255, 0.2);
    }
    
    .empty-icon {
        font-size: 1.75rem;
        color: white;
    }
    
    .empty-title {
        font-size: 1.5rem;
        color: var(--color-text-light);
        margin-bottom: 0.5rem;
        font-weight: 600;
    }
    
    .empty-description {
        color: var(--color-text-light);
        opacity: 0.9;
        margin-bottom: 1.5rem;
        line-height: 1.4;
        font-size: 0.95rem;
    }
    
    .explore-button {
        display: flex;
        align-items: center;
        background-color: var(--secondary-color);
        color: var(--primary-color);
        padding: 0.75rem 1.25rem;
        border-radius: 2rem;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .explore-button:hover {
        background-color: var(--bg-color);
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
    }
    
    @keyframes rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Responsive */
    @media (max-width: 400px) {
        .tab-text {
            display: none;
        }
        
        .tab-button {
            padding: 0.6rem;
        }
        
        .tab-button i {
            font-size: 1.1rem;
        }
        
        .filter-button span:not(.filter-badge) {
            display: none;
        }
        
        .filter-button {
            padding: 0.5rem;
        }
        
        .debug-info {
            font-size: 0.65rem;
            padding: 0.25rem;
        }
    }
    
    @media (min-width: 480px) {
        .main-title {
            font-size: 2rem;
        }
        
        .subtitle {
            font-size: 1rem;
        }
        
        .section-title {
            font-size: 1.4rem;
        }
        
        .empty-state {
            padding: 2.5rem 2rem;
        }
    }
    
    @media (min-width: 640px) {
        .items-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.25rem;
        }
        
        .header-container {
            margin-bottom: 2rem;
        }
    }
    
    @media (min-width: 1024px) {
        .items-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
        }
        
        .ratings-container {
            padding: 2rem;
        }
    }
    
    /* Floating button styles (mantenidos) */
    .floating-button {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background-color: var(--primary-color);
        color: white;
        border-radius: 3rem;
        padding: 0.75rem 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20;
        overflow: hidden;
        transition: all 0.3s ease;
    }
    
    .floating-button:hover {
        transform: translateY(-5px);
        background-color: var(--primary-color);
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
        margin-right: 0.75rem;
    }
    
    .label {
        font-weight: 500;
        font-size: 1rem;
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
    
    @media (max-width: 768px) {
        .floating-button {
            bottom: 1.5rem;
            right: 1.5rem;
            padding: 0.6rem 1rem;
        }
        
        .icon {
            margin-right: 0.5rem;
        }
        
        .label {
            font-size: 0.9rem;
        }
    }
</style>