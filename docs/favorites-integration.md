# Sistema Unificado de Favoritos

## Descripción

El sistema unificado de favoritos permite manejar favoritos tanto para usuarios autenticados como anónimos de manera transparente. Utiliza dos stores internos:

- **`favoritesStore`**: Para usuarios anónimos (almacenamiento local)
- **`dishRatingStore`**: Para usuarios autenticados (API del servidor)

## Arquitectura

### Stores Involucrados

1. **`unifiedFavoritesStore`** (Nuevo): Store unificado que actúa como adaptador
2. **`favoritesStore`**: Maneja favoritos para usuarios anónimos
3. **`dishRatingStore`**: Maneja favoritos para usuarios autenticados
4. **`authStore`**: Proporciona el estado de autenticación

### Flujo de Datos

```
Componente → unifiedFavoritesStore → [authStore] → favoritesStore (anónimo) | dishRatingStore (autenticado)
```

## Uso Básico

### En Componentes

```svelte
<script>
  import unifiedFavoritesStore from '../stores/unifiedFavoritesStore';
  
  // Verificar si un platillo está en favoritos
  const isFavorite = unifiedFavoritesStore.isDishFavorite(dishId);
  
  // Alternar favorito
  const toggleFavorite = async () => {
    await unifiedFavoritesStore.toggleFavorite(dishId);
  };
</script>
```

### En FavoriteButton.svelte

El componente `FavoriteButton.svelte` ya está actualizado para usar el store unificado:

```svelte
<script>
  import unifiedFavoritesStore from '../../stores/unifiedFavoritesStore';
  
  // El componente maneja automáticamente:
  // - Usuarios autenticados → dishRatingStore
  // - Usuarios anónimos → favoritesStore
</script>
```

## API del Store Unificado

### Métodos Principales

#### `isDishFavorite(dishId: string | number): Readable<boolean>`
Verifica si un platillo está en favoritos.

```typescript
const isFavorite = unifiedFavoritesStore.isDishFavorite('dish-123');
isFavorite.subscribe(isFav => console.log('Es favorito:', isFav));
```

#### `toggleFavorite(dishId: string | number): Promise<void>`
Alterna el estado de favorito de un platillo.

```typescript
await unifiedFavoritesStore.toggleFavorite('dish-123');
```

#### `isTogglingFavorite(dishId: string | number): Readable<boolean>`
Verifica si se está procesando el cambio de favorito.

```typescript
const isToggling = unifiedFavoritesStore.isTogglingFavorite('dish-123');
isToggling.subscribe(toggling => console.log('Procesando:', toggling));
```

### Stores Derivados

#### `favoriteDishes: Readable<any[]>`
Lista de todos los favoritos del usuario actual.

```typescript
unifiedFavoritesStore.favoriteDishes.subscribe(favorites => {
  console.log('Favoritos:', favorites);
});
```

#### `favoriteCount: Readable<number>`
Número total de favoritos.

```typescript
unifiedFavoritesStore.favoriteCount.subscribe(count => {
  console.log('Total favoritos:', count);
});
```

#### `isLoadingFavorites(): Readable<boolean>`
Estado de carga de favoritos (solo para usuarios autenticados).

```typescript
unifiedFavoritesStore.isLoadingFavorites().subscribe(loading => {
  console.log('Cargando:', loading);
});
```

#### `getFavoritesError(): Readable<string | null>`
Errores en la carga de favoritos (solo para usuarios autenticados).

```typescript
unifiedFavoritesStore.getFavoritesError().subscribe(error => {
  if (error) console.error('Error:', error);
});
```

## Migración

### Antes (Código Antiguo)

```svelte
<script>
  import { favoritesStore } from '../../stores/favoritesStore';
  import dishRatingStore from '../../stores/dishRatingStore';
  import { authStore } from '../../stores/authStore';
  
  // Lógica compleja para manejar ambos stores
  let isAuthenticated = false;
  
  onMount(() => {
    authStore.isAuthenticated.subscribe(authenticated => {
      isAuthenticated = authenticated;
      // Configurar suscripciones según el estado
    });
  });
  
  async function toggleFavorite() {
    if (isAuthenticated) {
      await dishRatingStore.toggleFavorite(id);
    } else {
      await favoritesStore.toggleFavorite(id);
    }
  }
</script>
```

### Después (Código Nuevo)

```svelte
<script>
  import unifiedFavoritesStore from '../../stores/unifiedFavoritesStore';
  
  // Lógica simplificada
  async function toggleFavorite() {
    await unifiedFavoritesStore.toggleFavorite(id);
  }
</script>
```

## Ventajas del Sistema Unificado

1. **Simplicidad**: Un solo store para manejar favoritos
2. **Transparencia**: Los componentes no necesitan conocer el estado de autenticación
3. **Consistencia**: API uniforme para ambos tipos de usuario
4. **Mantenibilidad**: Lógica centralizada en un solo lugar
5. **Escalabilidad**: Fácil agregar nuevas funcionalidades

## Consideraciones

### Usuarios Anónimos
- Los favoritos se almacenan en `localStorage`
- No hay estado de carga (operaciones síncronas)
- No hay manejo de errores del servidor

### Usuarios Autenticados
- Los favoritos se sincronizan con el servidor
- Hay estado de carga para operaciones asíncronas
- Manejo completo de errores

### Transiciones
- Cuando un usuario anónimo se autentica, los favoritos locales se mantienen
- Los favoritos del servidor se cargan automáticamente
- No hay migración automática de favoritos locales al servidor

## Ejemplos de Uso

### Lista de Favoritos

```svelte
<script>
  import unifiedFavoritesStore from '../stores/unifiedFavoritesStore';
  
  let favorites = [];
  
  onMount(() => {
    const unsubscribe = unifiedFavoritesStore.favoriteDishes.subscribe(favs => {
      favorites = favs;
    });
    
    unifiedFavoritesStore.loadFavorites();
    
    return unsubscribe;
  });
</script>

<div class="favorites-list">
  {#each favorites as favorite}
    <div class="favorite-item">
      <h3>{favorite.name}</h3>
      <FavoriteButton id={favorite.id} title={favorite.name} />
    </div>
  {/each}
</div>
```

### Contador de Favoritos

```svelte
<script>
  import { favoriteCount } from '../stores/unifiedFavoritesStore';
</script>

<div class="favorites-counter">
  Favoritos: {$favoriteCount}
</div>
```

### Estado de Carga

```svelte
<script>
  import unifiedFavoritesStore from '../stores/unifiedFavoritesStore';
  
  let isLoading = false;
  
  onMount(() => {
    const unsubscribe = unifiedFavoritesStore.isLoadingFavorites().subscribe(loading => {
      isLoading = loading;
    });
    
    return unsubscribe;
  });
</script>

{#if isLoading}
  <div class="loading">Cargando favoritos...</div>
{/if}
``` 