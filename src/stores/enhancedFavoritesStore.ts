// src/stores/enhancedFavoritesStore.ts
import { derived, writable, get } from "svelte/store";
import type { Dish } from "../interfaces/dish";
import type { Restaurant } from "../interfaces/restaurant";
import { getDeviceId } from "../services/deviceIdService";

// Extender las interfaces para incluir propiedades de estado del usuario
interface DishWithUserState extends Dish {
    userFav?: boolean;
    userRating?: number;
}

interface RestaurantWithUserState extends Restaurant {
    userFav?: boolean;
    userRating?: number;
}
import { 
    fetchAnonymousRestaurantFavorites,
    fetchUserRestaurantFavorites,
    toggleAnonymousRestaurantFavorite,
    toggleRestaurantFavorite
} from "../services/apiRatingService";

// URL base para la API
const API_BASE_URL = import.meta.env.PUBLIC_API_URL || '/api';

interface EnhancedFavoritesState {
    // Platillos
    favoritesDishes: DishWithUserState[];
    ratingsDishes: DishWithUserState[];
    allDishes: DishWithUserState[];
    
    // Restaurantes
    favoritesRestaurants: RestaurantWithUserState[];
    ratingsRestaurants: RestaurantWithUserState[];
    allRestaurants: RestaurantWithUserState[];
    
    // Estado general
    loading: boolean;
    initialized: boolean;
    lastSyncTime: Date | null;
}

const initialState: EnhancedFavoritesState = {
    favoritesDishes: [],
    ratingsDishes: [],
    allDishes: [],
    favoritesRestaurants: [],
    ratingsRestaurants: [],
    allRestaurants: [],
    loading: false,
    initialized: false,
    lastSyncTime: null
};

// Nombres para localStorage
const STORAGE_KEYS = {
    favoritesDishes: 'favoriteItems',
    ratingsDishes: 'ratingItems', 
    allDishes: 'allDishesCache',
    favoritesRestaurants: 'favoriteRestaurants',
    ratingsRestaurants: 'ratingRestaurants',
    allRestaurants: 'allRestaurantsCache',
    lastSync: 'lastSyncTime'
};

const savedMessages = {
    added: "🎉 ¡Elemento guardado con éxito! Lo encontrarás en tu lista de favoritos.",
    removed: "✓ Elemento eliminado de tu lista de guardados."
};

function createEnhancedFavoritesStore() {
    const isBrowser = typeof window !== 'undefined';
    
    const { subscribe, set, update } = writable<EnhancedFavoritesState>(initialState);

    // === FUNCIONES HELPER PARA STORAGE ===
    
    function saveToLocalStorage<T>(key: string, data: T) {
        if (!isBrowser) return;
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Error saving ${key} to localStorage:`, e);
        }
    }
    
    function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
        if (!isBrowser) return defaultValue;
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch (e) {
            console.error(`Error loading ${key} from localStorage:`, e);
            return defaultValue;
        }
    }

    // === FUNCIONES DE SINCRONIZACIÓN CON SERVIDOR ===
    
    async function syncDishWithServer(dish: DishWithUserState, isAddingFavorite: boolean) {
        if (!isBrowser) return;
        
        try {
            const deviceId = getDeviceId();
            if (!deviceId) return;
            
            const endpoint = `${API_BASE_URL}/anonymous/favorites/dish/${dish.id}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Device-ID': deviceId
                },
                body: JSON.stringify({ action: isAddingFavorite ? 'add' : 'remove' })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Dish synced with server:', result);
                
                // Actualizar contador de favoritos si el servidor lo devuelve
                if (result && typeof result.favorites !== 'undefined') {
                    updateDishFavoritesCount(dish.id!, result.favorites);
                }
            }
        } catch (error) {
            console.error('❌ Error syncing dish with server:', error);
        }
    }
    
    async function syncRestaurantWithServer(
        restaurant: RestaurantWithUserState, 
        isAddingFavorite: boolean, 
        isAuthenticated: boolean = false, 
        token?: string
    ) {
        if (!isBrowser) return;
        
        try {
            if (isAuthenticated && token) {
                const result = await toggleRestaurantFavorite(restaurant.id!, token);
                console.log('✅ Restaurant synced with server (authenticated):', result);
            } else {
                const deviceId = getDeviceId();
                const result = await toggleAnonymousRestaurantFavorite(
                    restaurant.id!, 
                    deviceId, 
                    isAddingFavorite ? 'add' : 'remove'
                );
                console.log('✅ Restaurant synced with server (anonymous):', result);
            }
        } catch (error) {
            console.error('❌ Error syncing restaurant with server:', error);
        }
    }

    // === FUNCIONES DE INICIALIZACIÓN ===
    
    function initializeFromLocalStorage() {
        if (!isBrowser) return;
        
        try {
            update(state => ({
                ...state,
                favoritesDishes: loadFromLocalStorage(STORAGE_KEYS.favoritesDishes, []),
                ratingsDishes: loadFromLocalStorage(STORAGE_KEYS.ratingsDishes, []),
                allDishes: loadFromLocalStorage(STORAGE_KEYS.allDishes, []),
                favoritesRestaurants: loadFromLocalStorage(STORAGE_KEYS.favoritesRestaurants, []),
                ratingsRestaurants: loadFromLocalStorage(STORAGE_KEYS.ratingsRestaurants, []),
                allRestaurants: loadFromLocalStorage(STORAGE_KEYS.allRestaurants, []),
                lastSyncTime: loadFromLocalStorage(STORAGE_KEYS.lastSync, null),
                initialized: true
            }));
            
            console.log('✅ Enhanced favorites store initialized from localStorage');
        } catch (e) {
            console.error('❌ Error initializing from localStorage:', e);
        }
    }

    // === FUNCIONES PARA OBTENER DATOS ===
    
    async function getDishById(id: string | number): Promise<DishWithUserState | null> {
        if (!isBrowser) return null;
        
        const currentState = get({ subscribe });
        let dish = currentState.allDishes.find(d => d.id === id);
        
        if (dish) return dish;
        
        try {
            const response = await fetch(`${API_BASE_URL}/dishes/${id}`);
            if (!response.ok) throw new Error(`Error fetching dish: ${response.status}`);
            
            const fetchedDish = await response.json() as Dish;
            const dishWithUserState: DishWithUserState = { ...fetchedDish };
            
            update(state => {
                const newAllDishes = [...state.allDishes, dishWithUserState];
                saveToLocalStorage(STORAGE_KEYS.allDishes, newAllDishes);
                
                return {
                    ...state,
                    allDishes: newAllDishes
                };
            });
            
            return dishWithUserState;
        } catch (error) {
            console.error('❌ Error fetching dish:', error);
            return null;
        }
    }
    
    async function getRestaurantById(id: string | number): Promise<RestaurantWithUserState | null> {
        if (!isBrowser) return null;
        
        const currentState = get({ subscribe });
        let restaurant = currentState.allRestaurants.find(r => r.id === id);
        
        if (restaurant) return restaurant;
        
        try {
            const response = await fetch(`${API_BASE_URL}/restaurants/${id}`);
            if (!response.ok) throw new Error(`Error fetching restaurant: ${response.status}`);
            
            const fetchedRestaurant = await response.json() as Restaurant;
            const restaurantWithUserState: RestaurantWithUserState = { ...fetchedRestaurant };
            
            update(state => {
                const newAllRestaurants = [...state.allRestaurants, restaurantWithUserState];
                saveToLocalStorage(STORAGE_KEYS.allRestaurants, newAllRestaurants);
                
                return {
                    ...state,
                    allRestaurants: newAllRestaurants
                };
            });
            
            return restaurantWithUserState;
        } catch (error) {
            console.error('❌ Error fetching restaurant:', error);
            return null;
        }
    }

    // === FUNCIONES PARA ACTUALIZAR CONTADORES ===
    
    function updateDishFavoritesCount(dishId: string | number, newCount: number) {
        update(state => {
            const updateDishInArray = (dishes: DishWithUserState[]) => 
                dishes.map(d => d.id === dishId ? { ...d, favorites: newCount } : d);

            const updatedAllDishes = updateDishInArray(state.allDishes);
            const updatedFavorites = updateDishInArray(state.favoritesDishes);
            const updatedRatings = updateDishInArray(state.ratingsDishes);

            saveToLocalStorage(STORAGE_KEYS.allDishes, updatedAllDishes);
            saveToLocalStorage(STORAGE_KEYS.favoritesDishes, updatedFavorites);
            saveToLocalStorage(STORAGE_KEYS.ratingsDishes, updatedRatings);

            return {
                ...state,
                allDishes: updatedAllDishes,
                favoritesDishes: updatedFavorites,
                ratingsDishes: updatedRatings
            };
        });
    }

    // Inicializar si estamos en el browser
    if (isBrowser) {
        initializeFromLocalStorage();
    }

    return {
        subscribe,
        
        // === MÉTODOS GENERALES ===
        
        init: () => {
            if (isBrowser && !get({ subscribe }).initialized) {
                initializeFromLocalStorage();
            }
        },
        
        setLoading: (loading: boolean) => {
            update(state => ({ ...state, loading }));
        },

        // === MÉTODOS PARA PLATILLOS ===
        
        setAllDishes: (dishes: Dish[]) => {
            update(state => {
                const mergedDishes: DishWithUserState[] = [...dishes];
                
                // Mantener propiedades de favoritos y ratings
                state.favoritesDishes.forEach(fav => {
                    const index = mergedDishes.findIndex(d => d.id === fav.id);
                    if (index >= 0) {
                        mergedDishes[index] = { ...mergedDishes[index], userFav: true };
                    } else {
                        mergedDishes.push(fav);
                    }
                });
                
                state.ratingsDishes.forEach(rated => {
                    const index = mergedDishes.findIndex(d => d.id === rated.id);
                    if (index >= 0) {
                        mergedDishes[index] = { 
                            ...mergedDishes[index], 
                            userRating: rated.userRating 
                        };
                    }
                });
                
                saveToLocalStorage(STORAGE_KEYS.allDishes, mergedDishes);
                
                return {
                    ...state,
                    allDishes: mergedDishes
                };
            });
        },
        
        toggleDishFavorite: async (id: string | number) => {
            const dish = await getDishById(id);
            if (!dish) {
                console.error('❌ Cannot toggle favorite: Dish not found with ID:', id);
                return;
            }
            
            let isAddingFavorite = false;
            let eventDetail;
            
            update(state => {
                const indexFav = state.favoritesDishes.findIndex(fav => fav.id === id);
                let newFav: DishWithUserState[] = [];
                
                if (indexFav >= 0) {
                    // Quitar de favoritos
                    newFav = state.favoritesDishes.filter(fav => fav.id !== id);
                    eventDetail = { 
                        itemId: id, 
                        itemTitle: dish.name, 
                        isSaved: false, 
                        message: savedMessages.removed, 
                        savedCount: newFav.length,
                        type: 'dish'
                    };
                    isAddingFavorite = false;
                } else {
                    // Añadir a favoritos
                    const dishWithFav: DishWithUserState = { ...dish, userFav: true };
                    newFav = [...state.favoritesDishes, dishWithFav];
                    eventDetail = { 
                        itemId: id, 
                        itemTitle: dish.name, 
                        isSaved: true, 
                        message: savedMessages.added, 
                        savedCount: newFav.length,
                        type: 'dish'
                    };
                    isAddingFavorite = true;
                }
                
                saveToLocalStorage(STORAGE_KEYS.favoritesDishes, newFav);
                
                // Actualizar allDishes
                const updatedAllDishes = state.allDishes.map(d => {
                    if (d.id === id) {
                        return { ...d, userFav: isAddingFavorite };
                    }
                    return d;
                });
                
                if (!updatedAllDishes.some(d => d.id === id)) {
                    updatedAllDishes.push({ ...dish, userFav: isAddingFavorite });
                }
                
                saveToLocalStorage(STORAGE_KEYS.allDishes, updatedAllDishes);
                
                // Disparar evento para UI
                if (eventDetail && isBrowser) {
                    window.dispatchEvent(new CustomEvent('savedItemsUpdated', { 
                        detail: eventDetail 
                    }));
                }
                
                return {
                    ...state,
                    favoritesDishes: newFav,
                    allDishes: updatedAllDishes
                };
            });
            
            // Sincronizar con servidor
            await syncDishWithServer(dish, isAddingFavorite);
        },
        
        setDishRating: async (dishId: string | number, rating: number) => {
            if (!isBrowser) return;
            
            const dish = await getDishById(dishId);
            if (!dish) {
                console.error('❌ Cannot set rating: Dish not found with ID:', dishId);
                return;
            }
            
            update(state => {
                const ratingDishIndex = state.ratingsDishes.findIndex(d => d.id === dishId);
                let newRatingsDish = [...state.ratingsDishes];
                
                if (ratingDishIndex >= 0) {
                    newRatingsDish[ratingDishIndex] = { 
                        ...newRatingsDish[ratingDishIndex], 
                        userRating: rating 
                    };
                } else {
                    newRatingsDish.push({ ...dish, userRating: rating });
                }
                
                // También actualizar en favoritos si existe
                const favIndex = state.favoritesDishes.findIndex(d => d.id === dishId);
                let newFavorites = [...state.favoritesDishes];
                
                if (favIndex >= 0) {
                    newFavorites[favIndex] = { 
                        ...newFavorites[favIndex], 
                        userRating: rating 
                    };
                }
                
                // Actualizar en allDishes
                const updatedAllDishes = state.allDishes.map(d => {
                    if (d.id === dishId) {
                        return { ...d, userRating: rating };
                    }
                    return d;
                });
                
                if (!updatedAllDishes.some(d => d.id === dishId)) {
                    updatedAllDishes.push({ ...dish, userRating: rating });
                }
                
                // Guardar en localStorage
                saveToLocalStorage(STORAGE_KEYS.ratingsDishes, newRatingsDish);
                saveToLocalStorage(STORAGE_KEYS.favoritesDishes, newFavorites);
                saveToLocalStorage(STORAGE_KEYS.allDishes, updatedAllDishes);
                
                return {
                    ...state,
                    ratingsDishes: newRatingsDish,
                    favoritesDishes: newFavorites,
                    allDishes: updatedAllDishes
                };
            });
        },

        // === MÉTODOS PARA RESTAURANTES ===
        
        setAllRestaurants: (restaurants: Restaurant[]) => {
            update(state => {
                const mergedRestaurants: RestaurantWithUserState[] = [...restaurants];
                
                // Mantener propiedades de favoritos
                state.favoritesRestaurants.forEach(fav => {
                    const index = mergedRestaurants.findIndex(r => r.id === fav.id);
                    if (index >= 0) {
                        mergedRestaurants[index] = { ...mergedRestaurants[index], userFav: true };
                    } else {
                        mergedRestaurants.push(fav);
                    }
                });
                
                saveToLocalStorage(STORAGE_KEYS.allRestaurants, mergedRestaurants);
                
                return {
                    ...state,
                    allRestaurants: mergedRestaurants
                };
            });
        },
        
        toggleRestaurantFavorite: async (
            id: string | number, 
            isAuthenticated: boolean = false, 
            token?: string
        ) => {
            const restaurant = await getRestaurantById(id);
            if (!restaurant) {
                console.error('❌ Cannot toggle favorite: Restaurant not found with ID:', id);
                return;
            }
            
            let isAddingFavorite = false;
            let eventDetail;
            
            update(state => {
                const indexFav = state.favoritesRestaurants.findIndex(fav => fav.id === id);
                let newFav: RestaurantWithUserState[] = [];
                
                if (indexFav >= 0) {
                    // Quitar de favoritos
                    newFav = state.favoritesRestaurants.filter(fav => fav.id !== id);
                    eventDetail = { 
                        itemId: id, 
                        itemTitle: restaurant.name, 
                        isSaved: false, 
                        message: savedMessages.removed, 
                        savedCount: newFav.length,
                        type: 'restaurant'
                    };
                    isAddingFavorite = false;
                } else {
                    // Añadir a favoritos
                    const restaurantWithFav: RestaurantWithUserState = { ...restaurant, userFav: true };
                    newFav = [...state.favoritesRestaurants, restaurantWithFav];
                    eventDetail = { 
                        itemId: id, 
                        itemTitle: restaurant.name, 
                        isSaved: true, 
                        message: savedMessages.added, 
                        savedCount: newFav.length,
                        type: 'restaurant'
                    };
                    isAddingFavorite = true;
                }
                
                saveToLocalStorage(STORAGE_KEYS.favoritesRestaurants, newFav);
                
                // Actualizar allRestaurants
                const updatedAllRestaurants = state.allRestaurants.map(r => {
                    if (r.id === id) {
                        return { ...r, userFav: isAddingFavorite };
                    }
                    return r;
                });
                
                if (!updatedAllRestaurants.some(r => r.id === id)) {
                    updatedAllRestaurants.push({ ...restaurant, userFav: isAddingFavorite });
                }
                
                saveToLocalStorage(STORAGE_KEYS.allRestaurants, updatedAllRestaurants);
                
                // Disparar evento para UI
                if (eventDetail && isBrowser) {
                    window.dispatchEvent(new CustomEvent('savedItemsUpdated', { 
                        detail: eventDetail 
                    }));
                }
                
                return {
                    ...state,
                    favoritesRestaurants: newFav,
                    allRestaurants: updatedAllRestaurants
                };
            });
            
            // Sincronizar con servidor
            await syncRestaurantWithServer(restaurant, isAddingFavorite, isAuthenticated, token);
        },
        
        // === MÉTODOS DE CARGA DESDE SERVIDOR ===
        
        loadRestaurantFavorites: async (isAuthenticated: boolean = false, token?: string) => {
            try {
                update(state => ({ ...state, loading: true }));
                
                let restaurants: Restaurant[] = [];
                
                if (isAuthenticated && token) {
                    const response = await fetchUserRestaurantFavorites(token, 1, 100);
                    restaurants = response.restaurants;
                } else {
                    const deviceId = getDeviceId();
                    const response = await fetchAnonymousRestaurantFavorites(deviceId, 1, 100);
                    restaurants = response.restaurants;
                }
                
                // Convertir a RestaurantWithUserState
                const restaurantsWithUserState: RestaurantWithUserState[] = restaurants.map(r => ({ ...r, userFav: true }));
                
                update(state => {
                    saveToLocalStorage(STORAGE_KEYS.favoritesRestaurants, restaurantsWithUserState);
                    
                    return {
                        ...state,
                        favoritesRestaurants: restaurantsWithUserState,
                        loading: false,
                        lastSyncTime: new Date()
                    };
                });
                
                console.log('✅ Loaded restaurant favorites:', restaurantsWithUserState.length);
            } catch (error) {
                console.error('❌ Error loading restaurant favorites:', error);
                update(state => ({ ...state, loading: false }));
            }
        },

        // === MÉTODOS DE UTILIDAD ===
        
        clearAll: () => {
            if (!isBrowser) return;
            
            Object.values(STORAGE_KEYS).forEach(key => {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    console.error(`Error removing ${key} from localStorage:`, e);
                }
            });
            
            set(initialState);
        },
        
        getStats: () => {
            const state = get({ subscribe });
            return {
                dishes: {
                    favorites: state.favoritesDishes.length,
                    rated: state.ratingsDishes.length,
                    total: state.allDishes.length
                },
                restaurants: {
                    favorites: state.favoritesRestaurants.length,
                    rated: state.ratingsRestaurants.length,
                    total: state.allRestaurants.length
                },
                lastSync: state.lastSyncTime
            };
        }
    };
}

// Crear y exportar store
export const enhancedFavoritesStore = createEnhancedFavoritesStore();

// Propiedades derivadas
export const dishFavCount = derived(
    enhancedFavoritesStore,
    $store => $store.favoritesDishes.length
);

export const dishRatingCount = derived(
    enhancedFavoritesStore,
    $store => $store.ratingsDishes.length
);

export const restaurantFavCount = derived(
    enhancedFavoritesStore,
    $store => $store.favoritesRestaurants.length
);

export const restaurantRatingCount = derived(
    enhancedFavoritesStore,
    $store => $store.ratingsRestaurants.length
);

export const totalFavCount = derived(
    enhancedFavoritesStore,
    $store => $store.favoritesDishes.length + $store.favoritesRestaurants.length
);

export const totalRatingCount = derived(
    enhancedFavoritesStore,
    $store => $store.ratingsDishes.length + $store.ratingsRestaurants.length
);

export const isLoading = derived(
    enhancedFavoritesStore,
    $store => $store.loading
);

export const isInitialized = derived(
    enhancedFavoritesStore,
    $store => $store.initialized
);