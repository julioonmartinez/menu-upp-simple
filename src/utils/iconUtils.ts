/**
 * Utilidades para el manejo de iconos Font Awesome
 * Mapea nombres de iconos a clases completas de Font Awesome
 */

// Mapeo completo de iconos - Font Awesome 6.4.0
export const ICON_MAP: Record<string, string> = {
  // Social - Brands
  'instagram': 'fa-brands fa-instagram',
  'facebook': 'fa-brands fa-facebook',
  'twitter': 'fa-brands fa-twitter',
  'youtube': 'fa-brands fa-youtube',
  'linkedin': 'fa-brands fa-linkedin',
  'tiktok': 'fa-brands fa-tiktok',
  'whatsapp': 'fa-brands fa-whatsapp',
  'telegram': 'fa-brands fa-telegram',
  'discord': 'fa-brands fa-discord',
  'twitch': 'fa-brands fa-twitch',
  'spotify': 'fa-brands fa-spotify',
  'pinterest': 'fa-brands fa-pinterest',
  'reddit': 'fa-brands fa-reddit',
  'snapchat': 'fa-brands fa-snapchat',
  'github': 'fa-brands fa-github',
  'apple': 'fa-brands fa-apple',
  'google': 'fa-brands fa-google',
  'amazon': 'fa-brands fa-amazon',
  'paypal': 'fa-brands fa-paypal',
  
  // Comunicación - Solid
  'envelope': 'fa-solid fa-envelope',
  'phone': 'fa-solid fa-phone',
  'mobile': 'fa-solid fa-mobile-screen',
  'comment': 'fa-solid fa-comment',
  'comments': 'fa-solid fa-comments',
  'message': 'fa-solid fa-message',
  'sms': 'fa-solid fa-sms',
  'video': 'fa-solid fa-video',
  'microphone': 'fa-solid fa-microphone',
  'headset': 'fa-solid fa-headset',
  
  // Navegación - Solid
  'home': 'fa-solid fa-home',
  'globe': 'fa-solid fa-globe',
  'link': 'fa-solid fa-link',
  'external-link': 'fa-solid fa-arrow-up-right-from-square',
  'arrow-right': 'fa-solid fa-arrow-right',
  'arrow-left': 'fa-solid fa-arrow-left',
  'arrow-up': 'fa-solid fa-arrow-up',
  'arrow-down': 'fa-solid fa-arrow-down',
  'chevron-right': 'fa-solid fa-chevron-right',
  'chevron-left': 'fa-solid fa-chevron-left',
  'search': 'fa-solid fa-magnifying-glass',
  'map-marker': 'fa-solid fa-location-dot',
  'location-dot': 'fa-solid fa-location-dot',
  'truck': 'fa-solid fa-truck',
  
  // Negocio - Solid
  'briefcase': 'fa-solid fa-briefcase',
  'store': 'fa-solid fa-store',
  'shopping-cart': 'fa-solid fa-cart-shopping',
  'shopping-bag': 'fa-solid fa-bag-shopping',
  'credit-card': 'fa-solid fa-credit-card',
  'money-bill': 'fa-solid fa-money-bill',
  'coins': 'fa-solid fa-coins',
  'chart-line': 'fa-solid fa-chart-line',
  'chart-bar': 'fa-solid fa-chart-bar',
  'trending-up': 'fa-solid fa-arrow-trend-up',
  'building': 'fa-solid fa-building',
  'industry': 'fa-solid fa-industry',
  
  // Restaurante - Solid
  'utensils': 'fa-solid fa-utensils',
  'hamburger': 'fa-solid fa-burger',
  'pizza-slice': 'fa-solid fa-pizza-slice',
  'ice-cream': 'fa-solid fa-ice-cream',
  'coffee': 'fa-solid fa-mug-hot',
  'wine-glass': 'fa-solid fa-wine-glass',
  'beer': 'fa-solid fa-beer-mug-empty',
  'cocktail': 'fa-solid fa-martini-glass',
  'birthday-cake': 'fa-solid fa-cake-candles',
  'cookie': 'fa-solid fa-cookie',
  'fish': 'fa-solid fa-fish',
  'drumstick-bite': 'fa-solid fa-drumstick-bite',
  
  // Contenido - Solid
  'image': 'fa-solid fa-image',
  'images': 'fa-solid fa-images',
  'play': 'fa-solid fa-play',
  'pause': 'fa-solid fa-pause',
  'music': 'fa-solid fa-music',
  'podcast': 'fa-solid fa-podcast',
  'book': 'fa-solid fa-book',
  'newspaper': 'fa-solid fa-newspaper',
  'blog': 'fa-solid fa-blog',
  'file': 'fa-solid fa-file',
  'file-alt': 'fa-solid fa-file-lines',
  'download': 'fa-solid fa-download',
  'upload': 'fa-solid fa-upload',
  
  // Calendario - Solid
  'calendar': 'fa-solid fa-calendar',
  'calendar-day': 'fa-solid fa-calendar-day',
  'calendar-week': 'fa-solid fa-calendar-week',
  'calendar-month': 'fa-solid fa-calendar-days',
  'calendar-check': 'fa-solid fa-calendar-check',
  'calendar-plus': 'fa-solid fa-calendar-plus',
  'clock': 'fa-solid fa-clock',
  'hourglass': 'fa-solid fa-hourglass',
  'stopwatch': 'fa-solid fa-stopwatch',
  
  // Acciones - Solid
  'plus': 'fa-solid fa-plus',
  'minus': 'fa-solid fa-minus',
  'times': 'fa-solid fa-xmark',
  'check': 'fa-solid fa-check',
  'edit': 'fa-solid fa-pen',
  'trash': 'fa-solid fa-trash',
  'save': 'fa-solid fa-floppy-disk',
  'share': 'fa-solid fa-share',
  'heart': 'fa-solid fa-heart',
  'star': 'fa-solid fa-star',
  'bookmark': 'fa-solid fa-bookmark',
  'like': 'fa-solid fa-thumbs-up',
  'dislike': 'fa-solid fa-thumbs-down',
  'eye': 'fa-solid fa-eye',
  'eye-slash': 'fa-solid fa-eye-slash',
  
  // Utilidades - Solid
  'cog': 'fa-solid fa-gear',
  'settings': 'fa-solid fa-gears',
  'tools': 'fa-solid fa-screwdriver-wrench',
  'wrench': 'fa-solid fa-wrench',
  'screwdriver': 'fa-solid fa-screwdriver',
  'hammer': 'fa-solid fa-hammer',
  'key': 'fa-solid fa-key',
  'lock': 'fa-solid fa-lock',
  'unlock': 'fa-solid fa-unlock',
  'shield': 'fa-solid fa-shield-halved',
  'user': 'fa-solid fa-user',
  'users': 'fa-solid fa-users',
  'user-plus': 'fa-solid fa-user-plus',
  'user-minus': 'fa-solid fa-user-minus',
  
  // Información - Solid
  'info': 'fa-solid fa-circle-info',
  'info-circle': 'fa-solid fa-circle-info',
  'question': 'fa-solid fa-circle-question',
  'question-circle': 'fa-solid fa-circle-question',
  'exclamation': 'fa-solid fa-exclamation',
  'exclamation-triangle': 'fa-solid fa-triangle-exclamation',
  'check-circle': 'fa-solid fa-circle-check',
  'times-circle': 'fa-solid fa-circle-xmark',
  'ban': 'fa-solid fa-ban',
  'warning': 'fa-solid fa-triangle-exclamation',
  'lightbulb': 'fa-solid fa-lightbulb',
  
  // Otros - Solid
  'gift': 'fa-solid fa-gift',
  'flag': 'fa-solid fa-flag',
  'fire': 'fa-solid fa-fire',
  'leaf': 'fa-solid fa-leaf',
  'tree': 'fa-solid fa-tree',
  'sun': 'fa-solid fa-sun',
  'moon': 'fa-solid fa-moon',
  'cloud': 'fa-solid fa-cloud',
  'rain': 'fa-solid fa-cloud-rain',
  'snow': 'fa-solid fa-snowflake',
  'umbrella': 'fa-solid fa-umbrella'
};

/**
 * Obtiene la clase CSS completa de Font Awesome para un nombre de icono
 * @param iconName - Nombre del icono (ej: "twitter", "home", "envelope")
 * @param fallback - Clase de fallback si no se encuentra el icono
 * @returns Clase CSS completa de Font Awesome
 */
export function getIconClass(iconName: string | undefined, fallback: string = 'fa-solid fa-link'): string {
  if (!iconName) return fallback;
  
  const normalizedName = iconName.toLowerCase().trim();
  return ICON_MAP[normalizedName] || fallback;
}

/**
 * Verifica si un nombre de icono existe en el mapeo
 * @param iconName - Nombre del icono a verificar
 * @returns true si el icono existe, false en caso contrario
 */
export function iconExists(iconName: string | undefined): boolean {
  if (!iconName) return false;
  return iconName.toLowerCase().trim() in ICON_MAP;
}

/**
 * Obtiene todos los nombres de iconos disponibles
 * @returns Array con todos los nombres de iconos
 */
export function getAvailableIcons(): string[] {
  return Object.keys(ICON_MAP);
}

/**
 * Obtiene iconos por categoría
 * @returns Objeto con categorías y sus iconos
 */
export function getIconsByCategory(): Record<string, string[]> {
  return {
    'Social': ['instagram', 'facebook', 'twitter', 'youtube', 'linkedin', 'tiktok', 'whatsapp', 'telegram', 'discord', 'twitch', 'spotify', 'pinterest', 'reddit', 'snapchat', 'github'],
    'Comunicación': ['envelope', 'phone', 'mobile', 'comment', 'message', 'sms', 'video', 'microphone', 'headset'],
    'Navegación': ['home', 'globe', 'link', 'external-link', 'arrow-right', 'arrow-left', 'search', 'map-marker', 'location-dot', 'truck'],
    'Negocio': ['briefcase', 'store', 'shopping-cart', 'credit-card', 'chart-line', 'building', 'industry'],
    'Restaurante': ['utensils', 'hamburger', 'pizza-slice', 'coffee', 'wine-glass', 'beer', 'birthday-cake'],
    'Contenido': ['image', 'video', 'music', 'book', 'newspaper', 'file', 'download'],
    'Acciones': ['plus', 'minus', 'edit', 'trash', 'save', 'share', 'heart', 'star', 'eye'],
    'Utilidades': ['cog', 'tools', 'user', 'lock', 'shield', 'key']
  };
}

/**
 * Obtiene iconos populares/usados frecuentemente
 * @returns Array con iconos populares
 */
export function getPopularIcons(): Array<{ name: string; label: string; class: string }> {
  return [
    { name: 'instagram', label: 'Instagram', class: 'fa-brands fa-instagram' },
    { name: 'facebook', label: 'Facebook', class: 'fa-brands fa-facebook' },
    { name: 'twitter', label: 'Twitter', class: 'fa-brands fa-twitter' },
    { name: 'youtube', label: 'YouTube', class: 'fa-brands fa-youtube' },
    { name: 'whatsapp', label: 'WhatsApp', class: 'fa-brands fa-whatsapp' },
    { name: 'linkedin', label: 'LinkedIn', class: 'fa-brands fa-linkedin' },
    { name: 'tiktok', label: 'TikTok', class: 'fa-brands fa-tiktok' },
    { name: 'telegram', label: 'Telegram', class: 'fa-brands fa-telegram' },
    { name: 'envelope', label: 'Email', class: 'fa-solid fa-envelope' },
    { name: 'phone', label: 'Teléfono', class: 'fa-solid fa-phone' },
    { name: 'home', label: 'Inicio', class: 'fa-solid fa-home' },
    { name: 'globe', label: 'Sitio Web', class: 'fa-solid fa-globe' },
    { name: 'link', label: 'Enlace', class: 'fa-solid fa-link' },
    { name: 'map-marker', label: 'Ubicación', class: 'fa-solid fa-location-dot' },
    { name: 'calendar', label: 'Calendario', class: 'fa-solid fa-calendar' },
    { name: 'utensils', label: 'Menú', class: 'fa-solid fa-utensils' },
    { name: 'shopping-cart', label: 'Tienda', class: 'fa-solid fa-cart-shopping' },
    { name: 'heart', label: 'Corazón', class: 'fa-solid fa-heart' },
    { name: 'star', label: 'Estrella', class: 'fa-solid fa-star' },
    { name: 'plus', label: 'Agregar', class: 'fa-solid fa-plus' },
    { name: 'edit', label: 'Editar', class: 'fa-solid fa-pen' },
    { name: 'trash', label: 'Eliminar', class: 'fa-solid fa-trash' },
    { name: 'eye', label: 'Ver', class: 'fa-solid fa-eye' },
    { name: 'search', label: 'Buscar', class: 'fa-solid fa-magnifying-glass' },
    { name: 'cog', label: 'Configuración', class: 'fa-solid fa-gear' },
    { name: 'user', label: 'Usuario', class: 'fa-solid fa-user' },
    { name: 'info', label: 'Info', class: 'fa-solid fa-circle-info' },
    { name: 'question', label: 'Ayuda', class: 'fa-solid fa-circle-question' }
  ];
} 