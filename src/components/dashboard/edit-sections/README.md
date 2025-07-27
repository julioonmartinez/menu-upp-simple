# Modal de Cambio de Username

## Descripción

El `UsernameChangeModal` es un modal especializado para manejar el cambio de username de un restaurante de manera segura y con las mejores prácticas de UX/UI.

## Características

### 🛡️ Seguridad y UX
- **Modal dedicado**: El cambio de username se maneja en un modal separado para evitar cambios accidentales
- **Warnings claros**: Muestra advertencias sobre las consecuencias del cambio
- **Validación en tiempo real**: Verifica disponibilidad del username mientras el usuario escribe
- **Preview de URL**: Muestra cómo se verá la nueva URL

### ⚠️ Warnings Importantes
El modal advierte sobre:
- Códigos QR que dejarán de funcionar
- Necesidad de generar nuevos códigos QR
- Cambio en la URL del menú
- Enlaces compartidos que dejarán de funcionar

### 🎨 Diseño
- Usa el sistema de diseño global (no Tailwind)
- Responsive design
- Estados de loading y error
- Feedback visual claro

## Uso

### En BasicInfoForm.svelte

```svelte
<script>
  import UsernameChangeModal from './UsernameChangeModal.svelte';
  
  let showUsernameModal = false;
  
  function openUsernameModal() {
    showUsernameModal = true;
  }
  
  function handleUsernameUpdate(event) {
    const { newUsername } = event.detail;
    // Actualizar el username en el formulario
    formData.username = newUsername;
  }
</script>

<!-- Campo de username (solo lectura) -->
<div class="username-field-container">
  <div class="username-display">
    <label>Username (URL)</label>
    <div class="username-current">
      <span>{formData.username}</span>
      <span>menuupp.com/{formData.username}</span>
    </div>
  </div>
  <button on:click={openUsernameModal}>
    Cambiar Username
  </button>
</div>

<!-- Modal -->
<UsernameChangeModal
  isOpen={showUsernameModal}
  currentUsername={formData.username}
  {restaurantId}
  on:close={() => showUsernameModal = false}
  on:update={handleUsernameUpdate}
/>
```

## Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `isOpen` | `boolean` | ✅ | Controla si el modal está abierto |
| `currentUsername` | `string` | ✅ | Username actual del restaurante |
| `restaurantId` | `string` | ✅ | ID del restaurante |

## Events

| Event | Payload | Descripción |
|-------|---------|-------------|
| `close` | - | Se dispara cuando se cierra el modal |
| `update` | `{ newUsername: string }` | Se dispara cuando se actualiza el username exitosamente |

## Funcionalidades

### Validación de Username
- Formato automático (solo letras minúsculas, números, guiones y guiones bajos)
- Verificación de disponibilidad en tiempo real usando el store
- Debounce de 500ms para evitar muchas peticiones
- Estados visuales claros: loading, disponible, no disponible, error

### Estados del Modal
- **Loading**: Mientras verifica disponibilidad
- **Error**: Si hay problemas de red o username no disponible
- **Success**: Cuando el username está disponible
- **Submitting**: Mientras se actualiza el username

### Responsive Design
- En móvil: Botón de "Cambiar Username" ocupa todo el ancho
- Modal se adapta a diferentes tamaños de pantalla
- Warnings se reorganizan en columnas en pantallas pequeñas

## Integración con el Sistema

### Guardado Automático
- El username se excluye del guardado automático del formulario principal
- Solo se actualiza a través del modal especializado
- Evita cambios accidentales durante la edición de otros campos

### Store Integration
- Usa `restaurantStore.updateRestaurant()` para actualizar
- Usa `restaurantStore.checkUsernameAvailability()` para verificar disponibilidad
- Usa `restaurantStore.getIsUsernameAvailable()` para obtener estado de disponibilidad
- Maneja automáticamente estados de loading y error del store
- Cache de disponibilidad de usernames para mejor performance

## Mejores Prácticas Implementadas

1. **Separación de responsabilidades**: El modal maneja solo el cambio de username
2. **Feedback claro**: Warnings visibles sobre las consecuencias
3. **Validación robusta**: Verificación en tiempo real
4. **UX consistente**: Sigue el patrón de diseño del sistema
5. **Accesibilidad**: Labels apropiados y navegación por teclado
6. **Performance**: Debounce para evitar peticiones excesivas 