// import type { Promotion } from "../types/Promotion";


export interface Dish {
    id?: string | number,
    name: string,
    description: string,
    price: number,
    rating: number,
    reviewsCount?: number,
    image: string,
    favorites: number,
    userRating?: number,
    userFav?: boolean,
    // Nuevos campos para funcionalidad de tienda
    inStock?: boolean,       // Indica si el platillo está disponible
    quantity?: number,       // Cantidad en el carrito
    options?: DishOption[],  // Opciones personalizables (tamaño, extras, etc.)
    discount?: number,       // Porcentaje de descuento si hay oferta
    nutritionalInfo?: {      // Información nutricional opcional
        calories?: number,
        protein?: number,
        carbs?: number,
        fat?: number,
        allergens?: string[]
    }
}

export interface DishOption {
    id: string | number,
    name: string,
    price: number,
    selected?: boolean
}
