# Utilidades de Iconos

Este módulo proporciona utilidades para el manejo de iconos Font Awesome en el proyecto.

## Funciones Disponibles

### `getIconClass(iconName, fallback?)`

Obtiene la clase CSS completa de Font Awesome para un nombre de icono.

**Parámetros:**
- `iconName` (string): Nombre del icono (ej: "twitter", "home", "envelope")
- `fallback` (string, opcional): Clase de fallback si no se encuentra el icono (por defecto: 'fa-solid fa-link')

**Retorna:**
- `string`: Clase CSS completa de Font Awesome

**Ejemplo:**
```typescript
import { getIconClass } from '../utils/iconUtils.ts';

// Obtener clase para Twitter
const twitterClass = getIconClass('twitter'); // 'fa-brands fa-twitter'

// Obtener clase para un icono que no existe
const unknownClass = getIconClass('icono-inexistente'); // 'fa-solid fa-link'
```

### `iconExists(iconName)`

Verifica si un nombre de icono existe en el mapeo.

**Parámetros:**
- `iconName` (string): Nombre del icono a verificar

**Retorna:**
- `boolean`: true si el icono existe, false en caso contrario

**Ejemplo:**
```typescript
import { iconExists } from '../utils/iconUtils.ts';

const exists = iconExists('twitter'); // true
const notExists = iconExists('icono-inexistente'); // false
```

### `getAvailableIcons()`

Obtiene todos los nombres de iconos disponibles.

**Retorna:**
- `string[]`: Array con todos los nombres de iconos

### `getIconsByCategory()`

Obtiene iconos organizados por categoría.

**Retorna:**
- `Record<string, string[]>`: Objeto con categorías y sus iconos

### `getPopularIcons()`

Obtiene iconos populares/usados frecuentemente.

**Retorna:**
- `Array<{ name: string; label: string; class: string }>`: Array con iconos populares

## Uso en Componentes

### En IconPicker.svelte

```svelte
<script>
  import { getIconClass, getPopularIcons, getIconsByCategory, iconExists } from '../../utils/iconUtils.ts';
  
  // Usar las utilidades importadas
  const popularIcons = getPopularIcons();
  const iconCategories = getIconsByCategory();
  
  function getCurrentIconClass() {
    if (!value) return 'fa-solid fa-circle-question';
    return getIconClass(value);
  }
</script>
```

### En LinkManager.svelte

```svelte
<script>
  import { getIconClass } from '../utils/iconUtils.ts';
  
  function getLinkIconClass(link: Link): string {
    if (link.icon) {
      return getIconClass(link.icon);
    }
    return LINK_TYPE_ICONS[link.type] || 'fa-solid fa-link';
  }
</script>

<template>
  <i class="{getLinkIconClass(link)}"></i>
</template>
```

## Iconos Soportados

El mapeo incluye iconos de las siguientes categorías:

- **Social**: instagram, facebook, twitter, youtube, linkedin, etc.
- **Comunicación**: envelope, phone, mobile, comment, etc.
- **Navegación**: home, globe, link, search, etc.
- **Negocio**: briefcase, store, shopping-cart, etc.
- **Restaurante**: utensils, hamburger, pizza-slice, etc.
- **Contenido**: image, video, music, book, etc.
- **Acciones**: plus, minus, edit, trash, etc.
- **Utilidades**: cog, tools, user, lock, etc.

## Ventajas

1. **Consistencia**: Todos los componentes usan el mismo mapeo de iconos
2. **Mantenibilidad**: Los cambios en el mapeo se reflejan en toda la aplicación
3. **Reutilización**: No hay duplicación de código de mapeo
4. **Tipado**: Soporte completo de TypeScript
5. **Flexibilidad**: Fácil agregar nuevos iconos o categorías 