import type { Promotion } from "../types/Promotion";


export interface Dish {
    categoryId: string;
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

// Interfaz para elementos en el carrito
export interface CartItem extends Dish {
    type: 'dish'
    quantity: number,
    item:Dish,
    selectedOptions?: DishOption[],
    totalPrice: number,  // Precio calculado con cantidad y opciones
}

// Interfaz para ofertas en el carrito
export interface PromotionCartItem {
    type: 'promo',
    id?: string;
    promotionId: string;         // ID de la promoción base
    title: string;               // Título de la promoción
    promo: Promotion;
    quantity: number;            // Cantidad de esta promoción en el carrito
    originalPrice: number;       // Precio original sin descuento
    discount: number;            // Monto del descuento aplicado
    totalPrice: number;          // Precio final con descuento
    notes?: string;              // Notas o personalizaciones adicionales
}

// Modificar la interfaz del carrito para manejar tanto platos como ofertas
export interface ShoppingCart {
    id?:string,
    items: CartItem[];             // Platos individuales
    promotions: PromotionCartItem[]; // Ofertas
    totalItems: number;           // Total de elementos (platos + ofertas)
    subtotal: number;             // Subtotal sin impuestos
    taxes: number;                  // Impuestos aplicables
    code?: string,                //código de descuento
    discount: number;             // Descuento total aplicado
    total: number;                // Total a pagar
    userId?: string;              // ID del usuario para persistencia
    createdAt?: Date;              // Fecha de creación
    updatedAt?: Date;              // Última actualización
}
