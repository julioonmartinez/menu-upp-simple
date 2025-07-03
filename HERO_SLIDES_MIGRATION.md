# Hero Slides Migration Guide

## Resumen de Cambios

Se han actualizado completamente el servicio y store de hero slides para que coincidan con los nuevos endpoints del backend.

## Cambios Principales

### 1. Estructura de Datos

#### Antes (index-based):
```typescript
interface HeroSlideResponse {
  index: number;
  imageUrl: string;
  title: string;
  subtitle: string;
  alt?: string;
  image_data?: ImageData;
}
```

#### Ahora (position-based):
```typescript
interface HeroSlideResponse {
  position: number; // Cambiado de 'index' a 'position'
  imageUrl: string;
  title: string;
  subtitle: string;
  alt?: string;
  image_data?: ImageData;
}
```

### 2. Endpoints Actualizados

#### Servicio (`heroSlidesService.ts`):
- **GET** `/api/restaurants/{restaurantId}/hero-slides` - Obtener todos los slides
- **GET** `/api/restaurants/{restaurantId}/hero-slides/{position}` - Obtener slide por posición
- **POST** `/api/restaurants/{restaurantId}/hero-slides` - Agregar nuevo slide
- **PUT** `/api/restaurants/{restaurantId}/hero-slides/{position}` - Actualizar slide por posición
- **DELETE** `/api/restaurants/{restaurantId}/hero-slides/{position}` - Eliminar slide por posición
- **PUT** `/api/restaurants/{restaurantId}/hero-slides/reorder` - Reordenar slides
- **POST** `/api/restaurants/{restaurantId}/hero-slides/bulk` - Agregar múltiples slides
- **GET** `/api/restaurants/{restaurantId}/hero-slides/info` - Información de upload

### 3. Métodos Actualizados

#### Store (`heroSlidesStore.ts`):

**Cambios en firmas de métodos:**
```typescript
// Antes
updateHeroSlide(restaurantId: string, slideIndex: number, ...)
deleteHeroSlide(restaurantId: string, slideIndex: number)
reorderHeroSlides(restaurantId: string, newOrder: number[])

// Ahora
updateHeroSlide(restaurantId: string, slidePosition: number, ...)
deleteHeroSlide(restaurantId: string, slidePosition: number)
reorderHeroSlides(restaurantId: string, newPositions: number[])
```

**Nuevos métodos agregados:**
```typescript
loadHeroSlideByPosition(restaurantId: string, position: number)
getSlidesOrderedByPosition(): Readable<HeroSlideResponse[]>
getSlideByPosition(position: number): Readable<HeroSlideResponse | undefined>
```

### 4. Tipos Actualizados

#### Request/Response Types:
```typescript
// HeroSlideCreateRequest
interface HeroSlideCreateRequest {
  title: string;
  subtitle: string;
  alt?: string;
  position?: number; // Nuevo: opcional, se asigna automáticamente
}

// HeroSlideUpdateRequest
interface HeroSlideUpdateRequest {
  title?: string;
  subtitle?: string;
  alt?: string;
  position?: number; // Nuevo: permite cambiar posición
}

// ReorderRequest
interface ReorderRequest {
  new_positions: number[]; // Cambiado de 'new_order' a 'new_positions'
}
```

### 5. Utilidades de Compatibilidad

Se agregaron utilidades para mantener compatibilidad con código existente:

```typescript
utils = {
  positionToIndex: (position: number): number => position,
  indexToPosition: (index: number): number => index,
  getNextAvailablePosition: (slides: HeroSlideResponse[]): number
}
```

### 6. Interfaz de Restaurant

Se actualizó la interfaz `HeroSlide` en `restaurant.ts`:

```typescript
export interface HeroSlide {
  imageUrl: string;
  title: string;
  subtitle: string;
  alt?: string;
  position: number; // Agregado: posición del slide (0-4)
  image_data?: ImageData;
}
```

## Migración de Código Existente

### 1. Cambiar referencias de `index` a `position`:

```typescript
// Antes
const slide = slides.find(s => s.index === 0);

// Ahora
const slide = slides.find(s => s.position === 0);
```

### 2. Actualizar llamadas a métodos:

```typescript
// Antes
await heroSlidesStore.updateHeroSlide(restaurantId, 0, slideData);

// Ahora
await heroSlidesStore.updateHeroSlide(restaurantId, 0, slideData);
// (La firma es la misma, pero internamente usa 'position')
```

### 3. Usar nuevos stores derivados:

```typescript
// Obtener slides ordenados por posición
$: orderedSlides = $heroSlidesStore.getSlidesOrderedByPosition();

// Obtener slide específico por posición
$: firstSlide = $heroSlidesStore.getSlideByPosition(0);
```

## Nuevas Funcionalidades

### 1. Carga de Slide Individual
```typescript
const result = await heroSlidesStore.loadHeroSlideByPosition(restaurantId, 2);
```

### 2. Slides Ordenados
```typescript
const orderedSlides = heroSlidesStore.getSlidesOrderedByPosition();
```

### 3. Búsqueda por Posición
```typescript
const slide = heroSlidesStore.getSlideByPosition(1);
```

### 4. Utilidades de Posición
```typescript
const nextPosition = heroSlidesStore.utils.getNextAvailablePosition(slides);
```

## Compatibilidad

El código mantiene compatibilidad hacia atrás en la mayoría de casos:

- Los métodos públicos mantienen las mismas firmas
- Se agregaron utilidades de conversión
- Los stores derivados funcionan igual
- La estructura de datos es similar

## Testing

Para probar la migración:

1. Verificar que los endpoints respondan correctamente
2. Probar operaciones CRUD básicas
3. Verificar que el reordenamiento funcione
4. Comprobar que la carga masiva funcione
5. Validar que los stores reactivos se actualicen correctamente

## Notas Importantes

- **Posiciones**: Las posiciones van de 0 a 4 (máximo 5 slides)
- **Autenticación**: Todas las operaciones de escritura requieren autenticación
- **Cache**: Se mantiene el sistema de cache de 2 minutos para slides
- **Errores**: Se mantiene el sistema de manejo de errores específicos por operación 