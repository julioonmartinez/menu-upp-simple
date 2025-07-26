/**
 * Color utilities for handling contrast and icon colors
 */

/**
 * Calculates the relative luminance of a color
 * @param r Red component (0-255)
 * @param g Green component (0-255)
 * @param b Blue component (0-255)
 * @returns Relative luminance value
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Converts hex color to RGB components
 * @param hex Hex color string (with or without #)
 * @returns RGB object or null if invalid
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Determines if a color is light or dark
 * @param color Hex color string
 * @returns 'light' or 'dark'
 */
export function getColorBrightness(color: string): 'light' | 'dark' {
  const rgb = hexToRgb(color);
  if (!rgb) return 'dark'; // Default to dark if invalid color
  
  const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5 ? 'light' : 'dark';
}

/**
 * Gets the appropriate icon color based on background color
 * @param backgroundColor Hex background color
 * @returns Hex color for the icon
 */
export function getIconColor(backgroundColor: string): string {
  const brightness = getColorBrightness(backgroundColor);
  
  if (brightness === 'light') {
    // For light backgrounds, use dark colors
    return '#1f2937'; // Dark gray
  } else {
    // For dark backgrounds, use light colors
    return '#ffffff'; // White
  }
}

/**
 * Gets the appropriate icon color class for Tailwind CSS
 * @param backgroundColor Hex background color
 * @returns Tailwind CSS class for text color
 */
export function getIconColorClass(backgroundColor: string): string {
  const brightness = getColorBrightness(backgroundColor);
  
  if (brightness === 'light') {
    return 'text-gray-800'; // Dark text for light backgrounds
  } else {
    return 'text-white'; // White text for dark backgrounds
  }
}

/**
 * Checks if two colors have sufficient contrast ratio
 * @param color1 First hex color
 * @param color2 Second hex color
 * @param ratio Minimum contrast ratio (default: 4.5 for normal text)
 * @returns True if contrast is sufficient
 */
export function hasSufficientContrast(color1: string, color2: string, ratio: number = 4.5): boolean {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return false;
  
  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  const contrastRatio = (brightest + 0.05) / (darkest + 0.05);
  
  return contrastRatio >= ratio;
} 