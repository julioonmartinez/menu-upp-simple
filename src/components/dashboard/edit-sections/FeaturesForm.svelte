<!-- src/components/dashboard/edit-sections/FeaturesForm.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { restaurantStore } from '../../../stores/restaurantStore.ts';
  import TagInput from '../../ui/TagInput.svelte';
  import LoadingButton from '../../ui/LoadingButton.svelte';
  import ErrorMessage from '../../ui/ErrorMessage.svelte';
  import SuccessMessage from '../../ui/SuccessMessage.svelte';

  export let restaurant;
  export let restaurantId;

  const dispatch = createEventDispatcher();

  // Form data reactivo
  let formData = {
    cuisineType: [],
    features: [],
    paymentMethods: [],
    priceRange: 'medium'
  };

  // Estados del formulario
  let isSubmitting = false;
  let error = null;
  let success = null;
  let isClosing = false;

  // Reactive statements
  $: isUpdating = $restaurantStore.isUpdating;
  $: updateError = $restaurantStore.updateError;

  // Sugerencias para tipos de cocina
  const cuisineSuggestions = [
    'Mexicana', 'Italiana', 'Asiática', 'Francesa', 'Americana',
    'Japonesa', 'China', 'Tailandesa', 'India', 'Mediterránea',
    'Española', 'Árabe', 'Peruana', 'Argentina', 'Brasileña',
    'Coreana', 'Vietnamita', 'Griega', 'Turca', 'Marroquí',
    'Fusión', 'Contemporánea', 'Tradicional', 'Gourmet', 'Casera',
    'Vegetariana', 'Vegana', 'Saludable', 'Orgánica', 'Sin gluten',
    'Mariscos', 'Parrilla', 'BBQ', 'Pizza', 'Pasta',
    'Sushi', 'Tacos', 'Hamburguesas', 'Comida rápida', 'Café'
  ];

  // Sugerencias para características
  const featureSuggestions = [
    'WiFi gratuito', 'Estacionamiento', 'Terraza', 'Aire acondicionado',
    'Pet-friendly', 'Zona infantil', 'Música en vivo', 'Karaoke',
    'Reservas online', 'Delivery', 'Para llevar', 'Servicio a domicilio',
    'Abierto 24 horas', 'Desayunos', 'Buffet', 'Barra libre',
    'Evento privados', 'Catering', 'Cumpleaños', 'Bodas',
    'Acceso para discapacitados', 'Baños', 'TV', 'Deportes',
    'Vista panorámica', 'Jardín', 'Piscina', 'Spa',
    'Bar', 'Cocteles', 'Vinos', 'Cervezas artesanales',
    'Desayuno incluido', 'Menú del día', 'Especialidades locales',
    'Chef especializado', 'Ingredientes frescos', 'Producto local'
  ];

  // Sugerencias para métodos de pago
  const paymentSuggestions = [
    'Efectivo', 'Tarjeta de crédito', 'Tarjeta de débito',
    'Visa', 'Mastercard', 'American Express',
    'PayPal', 'Apple Pay', 'Google Pay', 'Samsung Pay',
    'Transferencia bancaria', 'OXXO Pay', 'Mercado Pago',
    'Clip', 'Square', 'Terminal punto de venta',
    'Bitcoins', 'Criptomonedas', 'Cheques',
    'Vales de despensa', 'Tarjetas de regalo'
  ];

  // Opciones de rango de precios
  const priceRanges = [
    { value: 'low', label: 'Económico ($)', description: 'Menos de $200 por persona' },
    { value: 'medium', label: 'Moderado ($$)', description: '$200 - $500 por persona' },
    { value: 'high', label: 'Caro ($$$)', description: '$500 - $1000 por persona' },
    { value: 'premium', label: 'Premium ($$$$)', description: 'Más de $1000 por persona' }
  ];

  // Actualizar formData cuando cambie restaurant
  $: if (restaurant) {
    formData = {
      cuisineType: restaurant.cuisineType || [],
      features: restaurant.features || [],
      paymentMethods: restaurant.paymentMethods || [],
      priceRange: restaurant.priceRange || 'medium'
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    
    if (isSubmitting) return;

    // Validación básica
    if (formData.cuisineType.length === 0) {
      error = 'Debes agregar al menos un tipo de cocina';
      return;
    }

    if (formData.paymentMethods.length === 0) {
      error = 'Debes agregar al menos un método de pago';
      return;
    }

    isSubmitting = true;
    error = null;
    success = null;

    try {
      const updateData = {
        cuisineType: formData.cuisineType,
        features: formData.features,
        paymentMethods: formData.paymentMethods,
        priceRange: formData.priceRange
      };

      const result = await restaurantStore.updateRestaurant(restaurantId, updateData);

      if (result.success) {
        success = 'Características del restaurante actualizadas correctamente';
        dispatch('update');
        isClosing = true;
        setTimeout(() => {
          isClosing = false;
          dispatch('close');
        }, 2000);
      } else {
        error = result.error || 'Error actualizando las características';
        isSubmitting = false;
      }
    } catch (err) {
      error = err.message || 'Error desconocido';
    } finally {
      isSubmitting = false;
    }
  }

  function handleTagsChange(field, event) {
    formData[field] = event.detail.tags;
    error = null; // Limpiar errores al hacer cambios
  }
</script>

<div class="features-form w-full container">
  <!-- Mensajes -->
  {#if error || updateError}
    <div class="message-container mb-2xl">
      <ErrorMessage message={error || updateError} />
    </div>
  {/if}

  {#if success}
    <div class="message-container mb-2xl">
      <SuccessMessage message={success} />
    </div>
  {/if}

  <form on:submit={handleSubmit} class="form flex flex-col gap-3xl">
    <!-- Tipos de Cocina -->
    <div class="form-section flex flex-col gap-xl">
      <h3 class="section-title text-lg font-semibold text-primary m-0 mb-sm">Tipos de Cocina</h3>
      <p class="section-description text-sm text-muted mb-lg">
        Define qué tipo de comida ofreces. Esto ayuda a los clientes a encontrarte.
      </p>
      
      <TagInput
        label="Especialidades culinarias"
        bind:value={formData.cuisineType}
        suggestions={cuisineSuggestions}
        maxTags={8}
        placeholder="Ej: Mexicana, Italiana, Vegetariana..."
        help="Máximo 8 tipos de cocina"
        required
        on:change={(e) => handleTagsChange('cuisineType', e)}
      />
    </div>

    <!-- Características y Servicios -->
    <div class="form-section flex flex-col gap-xl border-t pt-2xl">
      <h3 class="section-title text-lg font-semibold text-primary m-0 mb-sm">Características y Servicios</h3>
      <p class="section-description text-sm text-muted mb-lg">
        ¿Qué hace especial a tu restaurante? Agrega servicios y comodidades.
      </p>
      
      <TagInput
        label="Servicios y características"
        bind:value={formData.features}
        suggestions={featureSuggestions}
        maxTags={15}
        placeholder="Ej: WiFi gratuito, Terraza, Pet-friendly..."
        help="Servicios, comodidades y características especiales"
        on:change={(e) => handleTagsChange('features', e)}
      />
    </div>

    <!-- Métodos de Pago -->
    <div class="form-section flex flex-col gap-xl border-t pt-2xl">
      <h3 class="section-title text-lg font-semibold text-primary m-0 mb-sm">Métodos de Pago</h3>
      <p class="section-description text-sm text-muted mb-lg">
        Indica qué formas de pago aceptas para que los clientes lo sepan.
      </p>
      
      <TagInput
        label="Formas de pago aceptadas"
        bind:value={formData.paymentMethods}
        suggestions={paymentSuggestions}
        maxTags={10}
        placeholder="Ej: Efectivo, Tarjeta de crédito, PayPal..."
        help="Métodos de pago que aceptas"
        required
        on:change={(e) => handleTagsChange('paymentMethods', e)}
      />
    </div>

    <!-- Rango de Precios -->
    <div class="form-section flex flex-col gap-xl border-t pt-2xl">
      <h3 class="section-title text-lg font-semibold text-primary m-0 mb-sm">Rango de Precios</h3>
      <p class="section-description text-sm text-muted mb-lg">
        Ayuda a los clientes a saber qué esperar en términos de costo.
      </p>
      
      <div class="price-range-options grid grid-cols-1 md:grid-cols-2 gap-md">
        {#each priceRanges as range}
          <label class="price-option relative block cursor-pointer">
            <input
              type="radio"
              name="priceRange"
              value={range.value}
              bind:group={formData.priceRange}
              class="price-radio absolute opacity-0 pointer-events-none"
            />
            <div class="price-content p-xl border-2 rounded bg-white transition-all">
              <div class="price-header flex items-center justify-between mb-xs">
                <span class="price-label text-sm font-semibold text-primary">{range.label}</span>
                <span class="price-symbols text-base">
                  {#each Array(range.value === 'low' ? 1 : range.value === 'medium' ? 2 : range.value === 'high' ? 3 : 4) as _}
                    💰
                  {/each}
                </span>
              </div>
              <p class="price-description text-xs text-muted m-0">{range.description}</p>
            </div>
          </label>
        {/each}
      </div>
    </div>

    <!-- Vista Previa -->
    <div class="preview-section bg-gray rounded-xl p-2xl">
      <h4 class="preview-title text-base font-semibold text-primary m-0 mb-lg">Vista Previa del Perfil</h4>
      <div class="preview-card bg-white rounded-lg overflow-hidden shadow">
        <div class="preview-header" style="background: var(--primary-gradient-bold); padding: var(--spacing-lg) var(--spacing-2xl); color: var(--text-inverse); display: flex; align-items: center; justify-content: space-between;">
          <h5 class="preview-restaurant-name text-lg font-bold m-0">
            {restaurant?.name || 'Tu Restaurante'}
          </h5>
          <div class="preview-price-range text-base">
            {#each Array(formData.priceRange === 'low' ? 1 : formData.priceRange === 'medium' ? 2 : formData.priceRange === 'high' ? 3 : 4) as _}
              💰
            {/each}
          </div>
        </div>
        
        <div class="preview-content p-2xl flex flex-col gap-lg">
          {#if formData.cuisineType.length > 0}
            <div class="preview-group flex flex-col gap-xs">
              <span class="preview-label text-xs font-semibold text-muted uppercase tracking-wide">Cocina:</span>
              <span class="preview-value text-sm text-secondary">{formData.cuisineType.join(', ')}</span>
            </div>
          {/if}
          
          {#if formData.features.length > 0}
            <div class="preview-group flex flex-col gap-xs">
              <span class="preview-label text-xs font-semibold text-muted uppercase tracking-wide">Servicios:</span>
              <div class="preview-features grid grid-cols-auto gap-2xs">
                {#each formData.features.slice(0, 6) as feature}
                  <span class="preview-feature text-xs text-muted">✓ {feature}</span>
                {/each}
                {#if formData.features.length > 6}
                  <span class="preview-feature text-xs text-muted">+{formData.features.length - 6} más</span>
                {/if}
              </div>
            </div>
          {/if}
          
          {#if formData.paymentMethods.length > 0}
            <div class="preview-group flex flex-col gap-xs">
              <span class="preview-label text-xs font-semibold text-muted uppercase tracking-wide">Pagos:</span>
              <span class="preview-value text-sm text-secondary">{formData.paymentMethods.slice(0, 3).join(', ')}{formData.paymentMethods.length > 3 ? '...' : ''}</span>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Botones -->
    <div class="form-actions border-t pt-xl flex justify-end gap-md flex-wrap">
      <button
        type="button"
        on:click={() => dispatch('close')}
        class="btn btn-secondary"
        disabled={isSubmitting || isClosing}
      >
        Cancelar
      </button>
      
      <LoadingButton
        type="submit"
        loading={isSubmitting || isUpdating || isClosing}
        disabled={formData.cuisineType.length === 0 || formData.paymentMethods.length === 0 || isClosing}
        class="btn btn-primary"
      >
        Guardar Características
      </LoadingButton>
    </div>
  </form>
</div>

<style>
  .features-summary { color: var(--text-inverse); }
  .summary-content { width: 100%; }
  .summary-icon { font-size: 1.5rem; }
  .summary-details .detail-item { background: var(--bg-glass); }
  .form-field.full-width, .col-span-full { grid-column: 1 / -1; }
  .price-radio:checked + .price-content {
    border-color: var(--primary-color);
    background: var(--bg-accent);
  }
  .price-option:hover .price-content {
    border-color: var(--primary-light);
  }
  @media (max-width: 640px) {
    .form-actions { flex-direction: column; }
    .btn { width: 100%; }
    .price-range-options { grid-template-columns: 1fr; }
    .summary-details { flex-direction: column; align-items: flex-start; }
    .detail-separator { display: none; }
  }
</style>