# Sistema de Notificaciones y Confirmaciones

## Toast Notifications

El sistema de toasts permite mostrar notificaciones temporales de manera elegante y no intrusiva.

### Uso Básico

```javascript
import { toastStore } from '../stores/toastStore.ts';

// Mostrar un toast de éxito
toastStore.success('¡Operación completada exitosamente!');

// Mostrar un toast de error
toastStore.error('Ha ocurrido un error');

// Mostrar un toast informativo
toastStore.info('Información importante');

// Con duración personalizada (en milisegundos)
toastStore.success('Mensaje', 6000); // 6 segundos
```

### Tipos de Toast

- **success**: Verde con icono de check ✅
- **error**: Rojo con icono de error ❌  
- **info**: Azul con icono informativo ℹ️

### Características

- ✅ Auto-cierre configurable
- ✅ Pausa al hacer hover (desktop)
- ✅ Barra de progreso visual
- ✅ Animaciones suaves
- ✅ Responsive design
- ✅ Accesibilidad (ARIA labels)
- ✅ Múltiples toasts simultáneos

## Confirmation Modal

Modal de confirmación para acciones destructivas o importantes.

### Uso Básico

```svelte
<script>
  import ConfirmationModal from './ui/ConfirmationModal.svelte';
  
  let showConfirm = false;
  let isDeleting = false;
  
  function handleDelete() {
    showConfirm = true;
  }
  
  async function confirmDelete() {
    isDeleting = true;
    try {
      // Realizar acción destructiva
      await deleteItem();
      toastStore.success('Elemento eliminado');
    } catch (error) {
      toastStore.error('Error al eliminar');
    } finally {
      isDeleting = false;
      showConfirm = false;
    }
  }
  
  function cancelDelete() {
    showConfirm = false;
  }
</script>

<button on:click={handleDelete}>Eliminar</button>

<ConfirmationModal
  isOpen={showConfirm}
  title="Eliminar Elemento"
  message="¿Estás seguro de que quieres eliminar este elemento? Esta acción no se puede deshacer."
  confirmText="Eliminar"
  cancelText="Cancelar"
  type="danger"
  loading={isDeleting}
  loadingText="Eliminando..."
  on:confirm={confirmDelete}
  on:cancel={cancelDelete}
/>
```

### Props del ConfirmationModal

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `isOpen` | boolean | false | Controla si el modal está visible |
| `title` | string | 'Confirmar Acción' | Título del modal |
| `message` | string | '¿Estás seguro...?' | Mensaje de confirmación |
| `confirmText` | string | 'Confirmar' | Texto del botón de confirmación |
| `cancelText` | string | 'Cancelar' | Texto del botón de cancelación |
| `type` | 'danger' \| 'warning' \| 'info' | 'danger' | Tipo de confirmación (afecta colores) |
| `icon` | string | '⚠️' | Icono personalizado |
| `loading` | boolean | false | Estado de carga |
| `loadingText` | string | 'Procesando...' | Texto durante la carga |

### Tipos de Confirmación

- **danger**: Rojo - Para acciones destructivas
- **warning**: Amarillo - Para advertencias
- **info**: Azul - Para información general

### Características

- ✅ Animaciones suaves
- ✅ Teclas de acceso (ESC para cancelar, Enter para confirmar)
- ✅ Estado de carga con spinner
- ✅ Diseño responsive
- ✅ Backdrop click para cerrar
- ✅ Accesibilidad completa

## Integración en el Layout

El `ToastContainer` ya está integrado en el layout principal (`Layout.astro`) para mostrar toasts globalmente:

```astro
<!-- En Layout.astro -->
<ToastContainer client:load />
```

## Mejores Prácticas

1. **Usar toasts para feedback inmediato**: Éxitos, errores, información temporal
2. **Usar confirmaciones para acciones destructivas**: Eliminar, desactivar, etc.
3. **Mensajes claros y concisos**: Evitar texto muy largo
4. **Duración apropiada**: 4 segundos por defecto, ajustar según importancia
5. **No abusar**: No mostrar toasts para cada acción pequeña

## Ejemplos de Uso Común

### Crear elemento exitoso
```javascript
toastStore.success(`¡${itemName} creado exitosamente!`);
```

### Error de validación
```javascript
toastStore.error('Por favor, completa todos los campos requeridos');
```

### Confirmar eliminación
```javascript
// En lugar de confirm()
function handleDelete(item) {
  itemToDelete = item;
  showDeleteConfirm = true;
}
```

### Actualización exitosa
```javascript
toastStore.success('Cambios guardados correctamente');
``` 