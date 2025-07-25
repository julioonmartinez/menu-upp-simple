// app/stores/favoritesStore.ts
import { derived, writable, get } from "svelte/store";
import type { Dish } from "../interfaces/dish";
import { getDeviceId } from "../services/deviceIdService";

// URL base para la API
const API_BASE_URL = import.meta.env.PUBLIC_API_URL || '/api';

interface FavoritesState {
    favorites: Dish[];
    ratingsDish: Dish[];
    allDishes: Dish[]; // Nuevo: almacenamos todos los platos conocidos
}

const initialState: FavoritesState = {
    favorites: [],
    ratingsDish: [],
    allDishes: [] // Inicialmente vacío
};

const nameLocalRating = 'ratingItems';
const nameLocalFavorite = 'favoriteItems';
const nameLocalAllDishes = 'allDishesCache'; // Nuevo: caché de todos los platos

const savedMessages = {
    added: "🎉 ¡Elemento guardado con éxito! Lo encontrarás en tu lista de favoritos.",
    removed: "✓ Elemento eliminado de tu lista de guardados."
};

function createFavoritesStore() {
    const isBrowser = typeof window !== 'undefined';
    
    const { subscribe, set, update } = writable<FavoritesState>(initialState);

    // Función para obtener un plato por ID (primero del store, luego de la API)
const getDishById = async (id: string | number): Promise<Dish | null> => {
    if (!isBrowser) return null;
    
    // 1. Intentar obtener del estado actual
    const currentState = get({ subscribe });
    let dish = currentState.allDishes.find(d => d.id === id);
    
    if (dish) {
        return dish;
    }
    
    // 2. Si no está en el estado, intentar obtener de la API
    try {
        const response = await fetch(`${API_BASE_URL}/dishes/${id}`);
        
        if (!response.ok) {
            throw new Error(`Error fetching dish: ${response.status}`);
        }
        
        const fetchedDish = await response.json() as Dish;
        
        // Guardar el plato en el estado para futuras referencias
        update(state => {
            const newAllDishes = [...state.allDishes, fetchedDish];
            
            // También actualizar el caché local
            if (isBrowser) {
                try {
                    localStorage.setItem(nameLocalAllDishes, JSON.stringify(newAllDishes));
                } catch (e) {
                    
                }
            }
            
            return {
                ...state,
                allDishes: newAllDishes
            };
        });
        
        return fetchedDish;
    } catch (error) {
        
        return null;
    }
};

    // Función para inicializar con los datos del localStorage
    const initializeFromLocalStorage = () => {
        if (!isBrowser) return;
        
        try {
            // Cargar favoritos
            const favoriteItemsStr = localStorage.getItem(nameLocalFavorite);
            const favoriteItems: Dish[] = favoriteItemsStr ? JSON.parse(favoriteItemsStr) : [];
            
            // Cargar ratings
            const ratingItemsStr = localStorage.getItem(nameLocalRating);
            const ratingItems: Dish[] = ratingItemsStr ? JSON.parse(ratingItemsStr) : [];
            
            // Cargar caché de todos los platos
            const allDishesStr = localStorage.getItem(nameLocalAllDishes);
            const allDishes: Dish[] = allDishesStr ? JSON.parse(allDishesStr) : [];
            
            // Actualizar el estado con los datos cargados
            update(state => ({
                ...state,
                favorites: favoriteItems,
                ratingsDish: ratingItems,
                allDishes: allDishes
            }));
            
        } catch (e) {
            
        }
    };

    // Función para guardar favoritos en localStorage
    const saveToLocalStorageFavorites = (favoriteItems: Dish[]) => {
        if (!isBrowser) return;
        
        try {
            localStorage.setItem(nameLocalFavorite, JSON.stringify(favoriteItems));
        } catch (e) {
            
        }
    };

    // Función para guardar ratings en localStorage
    const saveToLocalStorageRating = (ratingItems: Dish[]) => {
        if (!isBrowser) return;
        
        try {
            localStorage.setItem(nameLocalRating, JSON.stringify(ratingItems));
        } catch (e) {
            
        }
    };

    // Función para sincronizar favoritos con el servidor
    const syncWithServer = async (dish: Dish, isAddingFavorite: boolean) => {
        if (!isBrowser) return;
        
        try {
            const deviceId = getDeviceId();
            if (!deviceId) {
                return;
            }
            
            const endpoint = `${API_BASE_URL}/anonymous/favorites/dish/${dish.id}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Device-ID': deviceId
                },
                body: JSON.stringify({ action: isAddingFavorite ? 'add' : 'remove' })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                return;
            }
            
            const result = await response.json();
            
            // Actualizar el count total si el servidor lo devuelve
            if (result && typeof result.favorites !== 'undefined') {
                update(state => {
                    // Actualizar el count en el plato específico en allDishes
                    const updatedAllDishes = state.allDishes.map(d => {
                        if (d.id === dish.id) {
                            return { ...d, favorites: result.favorites };
                        }
                        return d;
                    });
                    
                    // También actualizar en favorites si existe
                    const updatedFavorites = state.favorites.map(d => {
                        if (d.id === dish.id) {
                            return { ...d, favorites: result.favorites };
                        }
                        return d;
                    });
                    
                    // Y en ratingsDish si existe
                    const updatedRatingsDish = state.ratingsDish.map(d => {
                        if (d.id === dish.id) {
                            return { ...d, favorites: result.favorites };
                        }
                        return d;
                    });
                    
                    // Guardar en localStorage
                    if (isBrowser) {
                        try {
                            localStorage.setItem(nameLocalAllDishes, JSON.stringify(updatedAllDishes));
                            localStorage.setItem(nameLocalFavorite, JSON.stringify(updatedFavorites));
                            localStorage.setItem(nameLocalRating, JSON.stringify(updatedRatingsDish));
                        } catch (e) {
                            
                        }
                    }
                    
                    return {
                        ...state,
                        allDishes: updatedAllDishes,
                        favorites: updatedFavorites,
                        ratingsDish: updatedRatingsDish
                    };
                });
            }
        } catch (error) {
            
        }
    };

    // Inicialización
    if (isBrowser) {
        initializeFromLocalStorage();
    }

    return {
        subscribe,
        
        // Método para actualizar todos los platos conocidos
        setAllDishes: (dishes: Dish[]) => {
            update(state => {
                // Fusionar los nuevos platos con los que ya tenemos
                // manteniendo propiedades como userFav y userRating
                const mergedDishes = [...dishes];
                
                // Para cada plato existente, verificar si está en favoritos o tiene rating
                state.favorites.forEach(fav => {
                    const index = mergedDishes.findIndex(d => d.id === fav.id);
                    if (index >= 0) {
                        mergedDishes[index] = { ...mergedDishes[index], userFav: true };
                    } else {
                        // Si no existe en los nuevos, lo agregamos
                        mergedDishes.push(fav);
                    }
                });
                
                state.ratingsDish.forEach(rated => {
                    const index = mergedDishes.findIndex(d => d.id === rated.id);
                    if (index >= 0) {
                        mergedDishes[index] = { 
                            ...mergedDishes[index], 
                            userRating: rated.userRating 
                        };
                    }
                });
                
                // Guardar en localStorage
                if (isBrowser) {
                    try {
                        localStorage.setItem(nameLocalAllDishes, JSON.stringify(mergedDishes));
                    } catch (e) {
                        
                    }
                }
                
                return {
                    ...state,
                    allDishes: mergedDishes
                };
            });
        },
        
        // Función para alternar favorito
        toggleFavorite: async (id: string | number) => {
            
            // Obtener el plato (primero del store, luego de API si es necesario)
            const dish = await getDishById(id);
            
            if (!dish) {
                return;
            }
            
            let isAddingFavorite = false;
            let eventDetail;
            
            update(state => {
                // Verificar si ya está en favoritos
                let indexFav = state.favorites.findIndex(fav => fav.id === id);
                let newFav: Dish[] = [];
                
                if (indexFav >= 0) {
                    // Quitar de favoritos
                    newFav = state.favorites.filter(fav => fav.id !== id);
                    eventDetail = { 
                        itemId: id, 
                        itemTitle: dish.name, 
                        isSaved: false, 
                        message: savedMessages.removed, 
                        savedCount: newFav.length 
                    };
                    isAddingFavorite = false;
                } else {
                    // Añadir a favoritos
                    // Crear una copia con userFav = true
                    const dishWithFav = { ...dish, userFav: true };
                    newFav = [...state.favorites, dishWithFav];
                    eventDetail = { 
                        itemId: id, 
                        itemTitle: dish.name, 
                        isSaved: true, 
                        message: savedMessages.added, 
                        savedCount: newFav.length 
                    };
                    isAddingFavorite = true;
                }
                
                // Guardar en localStorage
                saveToLocalStorageFavorites(newFav);
                
                // Actualizar allDishes para reflejar estado userFav
                const updatedAllDishes = state.allDishes.map(d => {
                    if (d.id === id) {
                        return { ...d, userFav: isAddingFavorite };
                    }
                    return d;
                });
                
                // Si no encontramos el plato en allDishes, agregarlo
                if (!updatedAllDishes.some(d => d.id === id)) {
                    updatedAllDishes.push({ ...dish, userFav: isAddingFavorite });
                }
                
                // Disparar evento para UI
                if (eventDetail && isBrowser) {
                    window.dispatchEvent(new CustomEvent('savedItemsUpdated', { 
                        detail: eventDetail 
                    }));
                }
                
                return {
                    ...state,
                    favorites: newFav,
                    allDishes: updatedAllDishes
                };
            });
            
            // Sincronizar con el servidor
            await syncWithServer(dish, isAddingFavorite);

            try {
                // Registrar evento de analítica (vista especial de favorito)
                fetch(`${API_BASE_URL}/analytics/favorite/dish/${id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Device-ID': getDeviceId()
                    }
                }).catch(e => console.error('Analytics error:', e));
            } catch (e) {
                
            }
        },
        
        // Función para establecer rating
        setRating: async (dishId: string | number, rating: number) => {
            if (!isBrowser) return;
            
            // Obtener el plato (primero del store, luego de API si es necesario)
            const dish = await getDishById(dishId);
            
            if (!dish) {
                return;
            }
            
            let updated = false;
            
            update(state => {
                // Actualizar en ratingsDish
                const ratingDishIndex = state.ratingsDish.findIndex(d => d.id === dishId);
                let newRatingsDish = [...state.ratingsDish];
                
                if (ratingDishIndex >= 0) {
                    newRatingsDish[ratingDishIndex] = { 
                        ...newRatingsDish[ratingDishIndex], 
                        userRating: rating 
                    };
                } else {
                    newRatingsDish.push({ ...dish, userRating: rating });
                }
                
                // También actualizar en favorites si existe
                const favIndex = state.favorites.findIndex(d => d.id === dishId);
                let newFavorites = [...state.favorites];
                
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
                
                // Si no encontramos el plato en allDishes, agregarlo
                if (!updatedAllDishes.some(d => d.id === dishId)) {
                    updatedAllDishes.push({ ...dish, userRating: rating });
                }
                
                // Guardar en localStorage
                saveToLocalStorageRating(newRatingsDish);
                updated = true;
                
                return {
                    ...state,
                    ratingsDish: newRatingsDish,
                    favorites: newFavorites,
                    allDishes: updatedAllDishes
                };
            });
            
            // Si se actualizó localmente, sincronizar con el servidor
            if (updated) {
                try {
                    const deviceId = getDeviceId();
                    if (!deviceId) return;
                    
                    const endpoint = `${API_BASE_URL}/anonymous/ratings/dish/${dishId}`;
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Device-ID': deviceId
                        },
                        body: JSON.stringify({ rating })
                    });
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        return;
                    }
                    
                    const result = await response.json();
                    
                    // Actualizar el rating promedio si el servidor lo devuelve
                    if (result && typeof result.rating === 'number' && 
                        typeof result.reviewsCount === 'number') {
                        
                        update(state => {
                            // Actualizar el rating en el plato específico
                            const updatedAllDishes = state.allDishes.map(d => {
                                if (d.id === dishId) {
                                    return { 
                                        ...d, 
                                        rating: result.rating,
                                        reviewsCount: result.reviewsCount
                                    };
                                }
                                return d;
                            });
                            
                            // También actualizar en favorites y ratingsDish si existe
                            const updatedFavorites = state.favorites.map(d => {
                                if (d.id === dishId) {
                                    return { 
                                        ...d, 
                                        rating: result.rating,
                                        reviewsCount: result.reviewsCount
                                    };
                                }
                                return d;
                            });
                            
                            const updatedRatingsDish = state.ratingsDish.map(d => {
                                if (d.id === dishId) {
                                    return { 
                                        ...d, 
                                        rating: result.rating,
                                        reviewsCount: result.reviewsCount
                                    };
                                }
                                return d;
                            });
                            
                            return {
                                ...state,
                                allDishes: updatedAllDishes,
                                favorites: updatedFavorites,
                                ratingsDish: updatedRatingsDish
                            };
                        });
                    }
                } catch (error) {
                    
                }
            }
        }
    };
}

// Crear y exportar store
export const favoritesStore = createFavoritesStore();

// Propiedades derivadas
export const favCount = derived(
    favoritesStore,
    $favoritesStore => $favoritesStore.favorites.length
);

export const ratingCount = derived(
    favoritesStore,
    $favoritesStore => $favoritesStore.ratingsDish.length
);