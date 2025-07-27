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
  let error = null;
  let success = null;

  // ESTADOS PARA GUARDADO AUTOMÁTICO Y BOTÓN FLOTANTE
  let isDirty = false;
  let isSaving = false;
  let saveError = null;
  let lastSaved = null;
  let autoSaveTimeout;

  // Detectar cambios en formData para activar guardado automático
  $: if (restaurant && formData) {
    // Compara los valores actuales con los originales
    const hasChanges = JSON.stringify(formData) !== JSON.stringify({
      cuisineType: restaurant.cuisineType || [],
      features: restaurant.features || [],
      paymentMethods: restaurant.paymentMethods || [],
      priceRange: restaurant.priceRange || 'medium'
    });
    isDirty = hasChanges;
    if (hasChanges) {
      debounceAutoSave();
    }
  }

  function debounceAutoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      autoSave();
    }, 1500); // 1.5 segundos de espera
  }

  async function autoSave() {
    if (!isDirty || isSaving) return;
    isSaving = true;
    saveError = null;
    try {
      await saveFormData();
      lastSaved = new Date();
      isDirty = false;
    } catch (err) {
      saveError = err.message || 'Error al guardar automáticamente';
    } finally {
      isSaving = false;
    }
  }

  async function saveFormData() {
    // Validación básica
    if (formData.cuisineType.length === 0) {
      throw new Error('Debes agregar al menos un tipo de cocina');
    }
    if (formData.paymentMethods.length === 0) {
      throw new Error('Debes agregar al menos un método de pago');
    }

    const updateData = {
      cuisineType: formData.cuisineType,
      features: formData.features,
      paymentMethods: formData.paymentMethods,
      priceRange: formData.priceRange
    };

    const result = await restaurantStore.updateRestaurant(restaurantId, updateData);
    if (!result.success) {
      throw new Error(result.error || 'Error actualizando las características');
    }
  }

  // Guardar manualmente desde el botón flotante
  async function handleManualSave() {
    isSaving = true;
    saveError = null;
    try {
      await saveFormData();
      lastSaved = new Date();
      isDirty = false;
    } catch (err) {
      saveError = err.message || 'Error al guardar';
    } finally {
      isSaving = false;
    }
  }

  // Prevenir salida si hay cambios sin guardar
  function handleBeforeUnload(event) {
    if (isDirty) {
      event.preventDefault();
      event.returnValue = '';
      return '';
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload);
  }

  // Reactive statements
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



  function handleTagsChange(field, event) {
    formData[field] = event.detail.tags;
    error = null; // Limpiar errores al hacer cambios
    // El guardado automático se activará automáticamente por el reactive statement
  }
</script>

<div class="features-form w-full container">
  <!-- Header -->
  <div class="form-header">
    <h2>Características del Restaurante</h2>
    <p class="subtitle">
      Define el tipo de cocina, servicios y métodos de pago de tu restaurante
    </p>
  </div>

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

  <form class="form flex flex-col gap-3xl">
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


  </form>
</div>

<!-- BOTÓN FLOTANTE DE GUARDAR -->
<div class="floating-save-btn">
  <button
    class="btn btn-primary floating"
    on:click={handleManualSave}
    disabled={!isDirty || isSaving || formData.cuisineType.length === 0 || formData.paymentMethods.length === 0}
    aria-label="Guardar características"
    type="button"
  >
    {#if isSaving}
      Guardando...
    {:else if saveError}
      Reintentar
    {:else if !isDirty && lastSaved}
      Guardado ✓
    {:else}
      Guardar
    {/if}
  </button>
  {#if saveError}
    <div class="save-status error">{saveError}</div>
  {:else if isSaving}
    <div class="save-status saving">Guardando...</div>
  {:else if !isDirty && lastSaved}
    <div class="save-status success">Guardado</div>
  {/if}
</div>

<style>
  .form-header h2 {
    color: var(--primary-color);
    font-size: var(--font-3xl);
    font-weight: var(--weight-bold);
    margin: 0 0 var(--spacing-md) 0;
  }

  .form-header .subtitle {
    color: var(--text-muted);
    font-size: var(--font-base);
    margin: 0;
  }

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
    .price-range-options { grid-template-columns: 1fr; }
    .summary-details { flex-direction: column; align-items: flex-start; }
    .detail-separator { display: none; }
  }

  /* Estilos para el botón flotante */
  .floating-save-btn {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  .floating-save-btn .floating {
    min-width: 120px;
    font-size: 1rem;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    border-radius: 2rem;
    padding: 0.75rem 2rem;
  }
  .save-status {
    margin-top: 0.5rem;
    font-size: 0.95rem;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  .save-status.saving { color: #888; }
  .save-status.success { color: #1a7f37; }
  .save-status.error { color: #b91c1c; }
  @media (max-width: 640px) {
    .floating-save-btn {
      right: 1rem;
      bottom: 1rem;
    }
    .floating-save-btn .floating {
      width: 100%;
      min-width: 0;
      padding: 0.75rem 1.5rem;
    }
  }
</style>