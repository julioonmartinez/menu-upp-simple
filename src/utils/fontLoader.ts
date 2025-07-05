// src/utils/fontLoader.ts

// Mapeo de fuentes a URLs de Google Fonts
export const fontUrls: Record<string, string> = {
  'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'Roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
  'Open Sans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap',
  'Montserrat': 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap',
  'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
  'Lato': 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
  'Nunito': 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap',
  'Playfair Display': 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
  'Dancing Script': 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap'
};

// Fuentes disponibles para el selector
export const fontFamilies = [
  { value: 'Inter', label: 'Inter (Moderna)' },
  { value: 'Roboto', label: 'Roboto (Clásica)' },
  { value: 'Open Sans', label: 'Open Sans (Amigable)' },
  { value: 'Montserrat', label: 'Montserrat (Elegante)' },
  { value: 'Poppins', label: 'Poppins (Redonda)' },
  { value: 'Lato', label: 'Lato (Profesional)' },
  { value: 'Nunito', label: 'Nunito (Casual)' },
  { value: 'Playfair Display', label: 'Playfair (Serif)' },
  { value: 'Dancing Script', label: 'Dancing Script (Script)' }
];

/**
 * Obtiene la URL de Google Fonts para una fuente específica
 * @param fontFamily - Nombre de la fuente
 * @returns URL de la fuente o la URL por defecto (Inter)
 */
export function getFontUrl(fontFamily?: string): string {
  const selectedFont = fontFamily || 'Inter';
  return fontUrls[selectedFont as keyof typeof fontUrls] || fontUrls['Inter'];
}

/**
 * Obtiene el CSS para la familia de fuentes
 * @param fontFamily - Nombre de la fuente
 * @returns CSS string para font-family
 */
export function getFontFamilyCSS(fontFamily?: string): string {
  const selectedFont = fontFamily || 'Inter';
  return `'${selectedFont}', sans-serif`;
}

/**
 * Verifica si una fuente es válida
 * @param fontFamily - Nombre de la fuente a verificar
 * @returns true si la fuente es válida
 */
export function isValidFont(fontFamily: string): boolean {
  return fontFamily in fontUrls;
} 