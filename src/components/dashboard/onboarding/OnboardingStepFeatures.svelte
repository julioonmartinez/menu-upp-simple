<script>
  import { createEventDispatcher } from 'svelte';
  import { restaurantStore } from '../../../stores/restaurantStore';
  import { toastStore } from '../../../stores/toastStore';
  import TagInput from '../../ui/TagInput.svelte';
  
  export let restaurant;
  export let restaurantId;
  const dispatch = createEventDispatcher();

  let formData = {
    cuisineType: restaurant?.cuisineType || [],
    features: restaurant?.features || [],
    paymentMethods: restaurant?.paymentMethods || [],
    priceRange: restaurant?.priceRange || 'medium'
  };
  let isSubmitting = false;
  let error = null;

  // Exponer método save() para el wizard
  export async function save() {
    isSubmitting = true;
    error = null;
    try {
      const updateData = {
        cuisineType: formData.cuisineType,
        features: formData.features,
        paymentMethods: formData.paymentMethods,
        priceRange: formData.priceRange
      };
      
      const result = await restaurantStore.updateRestaurant(restaurantId, updateData);
      if (result.success) {
        return true;
      } else {
        error = result.error;
        if (error) {
          toastStore.error(error);
        }
        return false;
      }
    } catch (e) {
      error = e?.message || 'Error desconocido';
      toastStore.error(error);
      return false;
    } finally {
      isSubmitting = false;
    }
  }

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

  function handleTagsChange(field, event) {
    formData[field] = event.detail.tags;
    formData = { ...formData };
  }
</script>

<div class="onboarding-features flex flex-col gap-xl w-full max-w-lg mx-auto animate-fade-in">
  <h2 class="text-2xl font-bold text-primary text-center mb-lg">¡Cuéntanos más sobre tu restaurante!</h2>
  <p class="text-muted text-center mb-xl">Ayuda a los clientes a conocerte mejor con estas características.</p>
  
  <form class="flex flex-col gap-lg" on:submit|preventDefault={() => {}}>
    <!-- Tipos de Cocina -->
    <div class="flex flex-col gap-xs">
      <label class="font-medium text-secondary">Tipos de Cocina</label>
      <TagInput
        bind:value={formData.cuisineType}
        suggestions={cuisineSuggestions}
        maxTags={5}
        placeholder="Ej: Mexicana, Italiana, Vegetariana..."
        help="Máximo 5 tipos de cocina"
        on:change={(e) => handleTagsChange('cuisineType', e)}
      />
    </div>

    <!-- Características -->
    <div class="flex flex-col gap-xs">
      <label class="font-medium text-secondary">Características y Servicios</label>
      <TagInput
        bind:value={formData.features}
        suggestions={featureSuggestions}
        maxTags={8}
        placeholder="Ej: WiFi gratuito, Terraza, Pet-friendly..."
        help="Servicios y características especiales"
        on:change={(e) => handleTagsChange('features', e)}
      />
    </div>

    <!-- Métodos de Pago -->
    <div class="flex flex-col gap-xs">
      <label class="font-medium text-secondary">Métodos de Pago</label>
      <TagInput
        bind:value={formData.paymentMethods}
        suggestions={paymentSuggestions}
        maxTags={6}
        placeholder="Ej: Efectivo, Tarjeta de crédito, PayPal..."
        help="Formas de pago que aceptas"
        on:change={(e) => handleTagsChange('paymentMethods', e)}
      />
    </div>

    <!-- Rango de Precios -->
    <div class="flex flex-col gap-xs">
      <label class="font-medium text-secondary">Rango de Precios</label>
      <div class="grid grid-cols-2 gap-sm">
        {#each priceRanges as range}
          <label class="price-option relative block cursor-pointer">
            <input
              type="radio"
              name="priceRange"
              value={range.value}
              bind:group={formData.priceRange}
              class="price-radio absolute opacity-0 pointer-events-none"
            />
            <div class="price-content p-md border-2 rounded bg-white transition-all">
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

    {#if isSubmitting}
      <div class="text-center text-muted mt-lg animate-pulse">Guardando...</div>
    {/if}
  </form>
</div>

<style>
.onboarding-features {
  padding: 0;
  margin: 0 auto;
  box-sizing: border-box;
}

.price-radio:checked + .price-content {
  border-color: var(--primary-color);
  background: var(--bg-accent);
}

.price-option:hover .price-content {
  border-color: var(--primary-light);
}

@media (max-width: 640px) {
  .grid-cols-2 {
    grid-template-columns: 1fr;
  }
}
</style> 