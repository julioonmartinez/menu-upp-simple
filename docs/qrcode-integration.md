# Integración de Generador de Códigos QR

## Descripción

Se ha integrado la librería `qrcode` para generar códigos QR personalizables en el proyecto Astro con componentes Svelte.

## Instalación

```bash
npm install qrcode
```

## Componentes

### 1. QRCodeGenerator.svelte

Componente dedicado para la generación de códigos QR con opciones avanzadas de personalización.

#### Props

- `url` (string): URL que se codificará en el QR
- `restaurantName` (string): Nombre del restaurante para el archivo de descarga

#### Events

- `generated`: Se dispara cuando se genera un nuevo QR
  - `event.detail.dataUrl`: Data URL del QR generado
  - `event.detail.config`: Configuración utilizada

#### Características

- **Colores predefinidos**: 6 esquemas de colores diferentes
- **Tamaño configurable**: De 200px a 600px
- **Niveles de corrección**: L (7%), M (15%), Q (25%), H (30%)
- **Margen personalizable**: De 0px a 10px
- **Descarga directa**: Descarga el QR como imagen PNG

### 2. TechnicalConfigForm.svelte

Componente principal actualizado que integra el generador de QR.

## Uso Básico

```svelte
<script>
  import QRCodeGenerator from './QRCodeGenerator.svelte';
  
  let restaurantUrl = 'https://mi-restaurante.com';
  let restaurantName = 'Mi Restaurante';
</script>

<QRCodeGenerator 
  url={restaurantUrl}
  restaurantName={restaurantName}
  on:generated={(event) => {
    console.log('QR generado:', event.detail.dataUrl);
  }}
/>
```

## Configuración Avanzada

### Opciones de la librería qrcode

```javascript
const options = {
  width: 300,                    // Ancho en píxeles
  margin: 2,                     // Margen alrededor del QR
  color: {
    dark: '#000000',            // Color del QR
    light: '#FFFFFF'            // Color de fondo
  },
  errorCorrectionLevel: 'M',    // Nivel de corrección (L, M, Q, H)
  type: 'image/png',            // Tipo de imagen
  quality: 0.92                 // Calidad (solo para JPEG)
};
```

### Generación programática

```javascript
import QRCode from 'qrcode';

// Generar como Data URL
const dataUrl = await QRCode.toDataURL('https://ejemplo.com', {
  width: 300,
  color: { dark: '#1E40AF', light: '#FFFFFF' }
});

// Generar como Canvas
const canvas = document.createElement('canvas');
await QRCode.toCanvas(canvas, 'https://ejemplo.com', options);

// Generar como string (SVG)
const svg = await QRCode.toString('https://ejemplo.com', { type: 'svg' });
```

## Personalización de Colores

El componente incluye 6 esquemas de colores predefinidos:

1. **Clásico**: Negro sobre blanco
2. **Azul**: Azul sobre blanco
3. **Verde**: Verde sobre blanco
4. **Rojo**: Rojo sobre blanco
5. **Púrpura**: Púrpura sobre blanco
6. **Naranja**: Naranja sobre blanco

## Niveles de Corrección de Errores

- **L (7%)**: Menor tamaño, menor corrección
- **M (15%)**: Balanceado (recomendado)
- **Q (25%)**: Mayor corrección, mayor tamaño
- **H (30%)**: Máxima corrección de errores

## Integración con el Store

Para guardar el QR generado en el servidor:

```javascript
// En el evento generated
on:generated={async (event) => {
  const { dataUrl } = event.detail;
  
  // Actualizar el restaurante con el nuevo QR
  const result = await restaurantStore.updateRestaurant(restaurantId, {
    qrCode: dataUrl
  });
  
  if (result.success) {
    // QR guardado exitosamente
  }
}}
```

## Consideraciones de Rendimiento

1. **Generación asíncrona**: Los QR se generan de forma asíncrona para no bloquear la UI
2. **Caché**: Considera implementar caché para evitar regenerar QRs idénticos
3. **Tamaño de archivo**: Los QR generados como Data URLs pueden ser grandes, considera compresión

## Compatibilidad

- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ Dispositivos móviles
- ✅ SSR (Server-Side Rendering) con Astro
- ✅ TypeScript

## Troubleshooting

### Error: "QRCode is not defined"

Asegúrate de que la librería esté instalada:

```bash
npm install qrcode
```

### Error: "Cannot read property 'toDataURL'"

Verifica que la importación sea correcta:

```javascript
import QRCode from 'qrcode';
```

### QR no se genera

1. Verifica que la URL no esté vacía
2. Asegúrate de que la URL sea válida
3. Revisa la consola del navegador para errores

## Ejemplos de Uso

### QR para menú digital

```svelte
<QRCodeGenerator 
  url={`${window.location.origin}/menu/${restaurant.id}`}
  restaurantName={restaurant.name}
/>
```

### QR para reservas

```svelte
<QRCodeGenerator 
  url={`${window.location.origin}/reservar/${restaurant.id}`}
  restaurantName={`${restaurant.name} - Reservas`}
/>
```

### QR personalizado para eventos

```svelte
<QRCodeGenerator 
  url={`${window.location.origin}/evento/${eventId}`}
  restaurantName={`${restaurant.name} - ${eventName}`}
/>
``` 