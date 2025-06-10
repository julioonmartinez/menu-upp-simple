// src/types/Promotion.ts (modificado)
import type { Dish } from "../interfaces/dish";

export interface PromotionItem {
  dish:Dish,  // ID del plato asociado
  quantity: number;        // Cantidad incluida en la promoción
  isCustomizable: boolean; // Si el usuario puede personalizar este item
  isOptional: boolean;     // Si es un item opcional de la promoción
  extraPrice?: number;     // Precio adicional si aplica (ej: cambiar tamaño)
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  image: string;
  fullDescription: string;
  validUntil: string;
  conditions: string[];
  discount: number;
  discountType: 'percentage' | 'fixed' | '2x1';
  availableDays: string[];
  timeRange?: {
    start: string;
    end: string;
  };
  tags: string[];
  gallery?: string[];
  
  // Nuevos campos para manejar platos incluidos
  items: PromotionItem[];  // Lista de platos incluidos en la promoción
  originalPrice: number;   // Precio original (sin descuento)
  finalPrice: number;      // Precio final después del descuento
  stockControl: boolean;   // Si esta promoción afecta al inventario
}