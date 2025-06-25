<!-- src/components/dashboard/edit-sections/TechnicalConfigForm.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { restaurantStore } from '../../../stores/restaurantStore.ts';
  import InputField from '../../ui/InputField.svelte';
  import ToggleSwitch from '../../ui/ToggleSwitch.svelte';
  import LoadingButton from '../../ui/LoadingButton.svelte';
  import ErrorMessage from '../../ui/ErrorMessage.svelte';
  import SuccessMessage from '../../ui/SuccessMessage.svelte';

  export let restaurant;
  export let restaurantId;

  const dispatch = createEventDispatcher();

  // Form data reactivo
  let formData = {
    // Configuraciones de visibilidad
    showRatings: true,
    allowReviews: true,
    allowOrders: false,
    active: true,
    
    // Configuraciones técnicas
    customDomain: '',
    qrCode: '',
    
    // Plan y estado
    planType: 'free'
  };

  // Estados del formulario
  let isSubmitting = false;
  let error = null;
  let success = null;
  let isGeneratingQR = false;

  // Reactive statements
  $: isUpdating = $restaurantStore.isUpdating;
  $: updateError = $restaurantStore.updateError;

  // Configuraciones disponibles por plan
  const planFeatures = {
    free: {
      customDomain: false,
      advancedAnalytics: false,
      prioritySupport: false,
      unlimitedImages: false,
      customThemes: false
    },
    basic: {
      customDomain: true,
      advancedAnalytics: false,
      prioritySupport: false,
      unlimitedImages: true,
      customThemes: false
    },
    premium: {
      customDomain: true,
      advancedAnalytics: true,
      prioritySupport: true,
      unlimitedImages: true,
      customThemes: true
    },
    enterprise: {
      customDomain: true,
      advancedAnalytics: true,
      prioritySupport: true,
      unlimitedImages: true,
      customThemes: true
    }
  };

  // Actualizar formData cuando cambie restaurant
  $: if (restaurant) {
    formData = {
      showRatings: restaurant.showRatings ?? true,
      allowReviews: restaurant.allowReviews ?? true,
      allowOrders: restaurant.allowOrders ?? false,
      active: restaurant.active ?? true,
      customDomain: restaurant.customDomain || '',
      qrCode: restaurant.qrCode || '',
      planType: restaurant.planType || 'free'
    };
  }

  // Verificar si una función está disponible en el plan actual
  $: currentPlanFeatures = planFeatures[formData.planType] || planFeatures.free;

  async function handleSubmit(event) {
    event.preventDefault();
    
    if (isSubmitting) return;

    // Validación de dominio personalizado
    if (formData.customDomain && !isValidDomain(formData.customDomain)) {
      error = 'El dominio personalizado no tiene un formato válido';
      return;
    }

    isSubmitting = true;
    error = null;
    success = null;

    try {
      const updateData = {
        showRatings: formData.showRatings,
        allowReviews: formData.allowReviews,
        allowOrders: formData.allowOrders,
        active: formData.active,
        customDomain: formData.customDomain.trim(),
        qrCode: formData.qrCode
      };

      const result = await restaurantStore.updateRestaurant(restaurantId, updateData);

      if (result.success) {
        success = 'Configuraciones técnicas actualizadas correctamente';
        dispatch('update');
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          dispatch('close');
        }, 2000);
      } else {
        error = result.error || 'Error actualizando las configuraciones';
      }
    } catch (err) {
      error = err.message || 'Error desconocido';
    } finally {
      isSubmitting = false;
    }
  }

  function isValidDomain(domain) {
    if (!domain) return true; // Opcional
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  }

  async function generateQRCode() {
    if (isGeneratingQR) return;
    
    isGeneratingQR = true;
    error = null;

    try {
      // Generar URL del restaurante
      const restaurantUrl = formData.customDomain 
        ? `https://${formData.customDomain}`
        : `${window.location.origin}/restaurant/${restaurant?.username}`;

      // Aquí podrías usar una API para generar QR, por ahora simulamos
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(restaurantUrl)}`;
      
      formData.qrCode = qrApiUrl;
      
      // En una implementación real, podrías subir el QR a tu servidor
      // const result = await restaurantStore.uploadRestaurantImage(restaurantId, qrBlob, 'qrCode');
      
    } catch (err) {
      error = 'Error generando código QR';
    } finally {
      isGeneratingQR = false;
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      // Podrías mostrar un toast de confirmación aquí
      console.log('Copiado al portapapeles');
    });
  }

  // URLs del restaurante
  $: publicUrl = formData.customDomain 
    ? `https://${formData.customDomain}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/restaurant/${restaurant?.username}`;
</script>

<div class="technical-config-form">
  <!-- Mensajes -->
  {#if error || updateError}
    <div class="message-container">
      <ErrorMessage message={error || updateError} />
    </div>
  {/if}

  {#if success}
    <div class="message-container">
      <SuccessMessage message={success} />
    </div>
  {/if}

  <!-- Estado del plan -->
  <div class="plan-status">
    <div class="plan-content">
      <div class="plan-info">
        <span class="plan-icon">
          {#if formData.planType === 'free'}🆓
          {:else if formData.planType === 'basic'}💫
          {:else if formData.planType === 'premium'}⭐
          {:else}👑{/if}
        </span>
        <div class="plan-details">
          <h4 class="plan-name">
            Plan {formData.planType === 'free' ? 'Gratuito' : 
                  formData.planType === 'basic' ? 'Básico' : 
                  formData.planType === 'premium' ? 'Premium' : 'Enterprise'}
          </h4>
          <p class="plan-description">
            {#if formData.planType === 'free'}
              Funciones básicas para empezar
            {:else if formData.planType === 'basic'}
              Funciones esenciales para tu negocio
            {:else if formData.planType === 'premium'}
              Funciones avanzadas y análisis detallados
            {:else}
              Solución completa para empresas
            {/if}
          </p>
        </div>
      </div>
      {#if formData.planType === 'free'}
        <button type="button" class="upgrade-btn">
          Actualizar Plan 🚀
        </button>
      {/if}
    </div>
  </div>

  <form on:submit={handleSubmit} class="form">
    <!-- Configuraciones de Visibilidad -->
    <div class="form-section">
      <h3 class="section-title">Configuraciones de Visibilidad</h3>
      <p class="section-description">
        Controla qué funciones están disponibles para tus clientes.
      </p>
      
      <div class="toggles-grid">
        <div class="toggle-item">
          <ToggleSwitch
            label="Mostrar calificaciones"
            bind:checked={formData.showRatings}
            color="green"
            help="Permite que los clientes vean las calificaciones"
          />
        </div>

        <div class="toggle-item">
          <ToggleSwitch
            label="Permitir reseñas"
            bind:checked={formData.allowReviews}
            color="blue"
            help="Los clientes pueden dejar comentarios y calificaciones"
          />
        </div>

        <div class="toggle-item">
          <ToggleSwitch
            label="Permitir pedidos online"
            bind:checked={formData.allowOrders}
            color="purple"
            disabled={!currentPlanFeatures.customDomain && formData.planType === 'free'}
            help={formData.planType === 'free' ? 'Disponible en planes pagos' : 'Habilita pedidos directos desde tu página'}
          />
        </div>

        <div class="toggle-item">
          <ToggleSwitch
            label="Restaurante activo"
            bind:checked={formData.active}
            color={formData.active ? 'green' : 'red'}
            help="Controla si tu restaurante es visible públicamente"
          />
        </div>
      </div>
    </div>

    <!-- Configuraciones Técnicas -->
    <div class="form-section">
      <h3 class="section-title">Configuraciones Técnicas</h3>
      <p class="section-description">
        Personaliza aspectos técnicos de tu página web.
      </p>

      <!-- Dominio personalizado -->
      <div class="config-item">
        <InputField
          label="Dominio personalizado"
          id="customDomain"
          type="text"
          bind:value={formData.customDomain}
          placeholder="mi-restaurante.com"
          disabled={!currentPlanFeatures.customDomain}
          help={currentPlanFeatures.customDomain 
            ? 'Tu página será accesible desde este dominio' 
            : `Disponible en plan ${formData.planType === 'free' ? 'Básico' : 'Premium'} o superior`}
          error={formData.customDomain && !isValidDomain(formData.customDomain) ? 'Formato de dominio inválido' : ''}
        />
        
        {#if formData.customDomain && isValidDomain(formData.customDomain)}
          <div class="domain-preview">
            <span class="preview-label">Tu página será:</span>
            <a href="https://{formData.customDomain}" target="_blank" class="preview-link">
              https://{formData.customDomain} 🔗
            </a>
          </div>
        {/if}
      </div>

      <!-- URL actual -->
      <div class="config-item">
        <label class="config-label">URL actual de tu restaurante</label>
        <div class="url-display">
          <span class="url-text">{publicUrl}</span>
          <button 
            type="button" 
            class="copy-btn"
            on:click={() => copyToClipboard(publicUrl)}
            title="Copiar URL"
          >
            📋
          </button>
        </div>
      </div>
    </div>

    <!-- Código QR -->
    <div class="form-section">
      <h3 class="section-title">Código QR</h3>
      <p class="section-description">
        Genera un código QR para que tus clientes accedan fácilmente a tu página.
      </p>

      <div class="qr-container">
        {#if formData.qrCode}
          <div class="qr-preview">
            <img src={formData.qrCode} alt="Código QR del restaurante" class="qr-image" />
            <div class="qr-actions">
              <button 
                type="button" 
                class="qr-btn secondary"
                on:click={() => window.open(formData.qrCode, '_blank')}
              >
                Descargar QR
              </button>
              <button 
                type="button" 
                class="qr-btn primary"
                on:click={generateQRCode}
                disabled={isGeneratingQR}
              >
                {isGeneratingQR ? 'Generando...' : 'Regenerar'}
              </button>
            </div>
          </div>
        {:else}
          <div class="qr-empty">
            <div class="qr-placeholder">
              <span class="qr-placeholder-icon">📱</span>
              <p class="qr-placeholder-text">No hay código QR generado</p>
            </div>
            <button 
              type="button" 
              class="qr-btn primary"
              on:click={generateQRCode}
              disabled={isGeneratingQR || !restaurant?.username}
            >
              {isGeneratingQR ? 'Generando...' : 'Generar Código QR'}
            </button>
          </div>
        {/if}
      </div>
    </div>

    <!-- Información del sistema -->
    <div class="system-info">
      <h4 class="info-title">Información del Sistema</h4>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Estado:</span>
          <span class="info-value {formData.active ? 'active' : 'inactive'}">
            {formData.active ? '🟢 Activo' : '🔴 Inactivo'}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">Última actualización:</span>
          <span class="info-value">
            {restaurant?.updatedAt ? new Date(restaurant.updatedAt).toLocaleDateString() : 'Nunca'}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">Creado:</span>
          <span class="info-value">
            {restaurant?.createdAt ? new Date(restaurant.createdAt).toLocaleDateString() : 'Desconocido'}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">ID del restaurante:</span>
          <span class="info-value mono">{restaurantId}</span>
        </div>
      </div>
    </div>

    <!-- Botones -->
    <div class="form-actions">
      <button
        type="button"
        on:click={() => dispatch('close')}
        class="btn btn-secondary"
        disabled={isSubmitting}
      >
        Cancelar
      </button>
      
      <LoadingButton
        type="submit"
        loading={isSubmitting || isUpdating}
        class="btn btn-primary"
      >
        Guardar Configuraciones
      </LoadingButton>
    </div>
  </form>
</div>

<style>
  /* Variables */
  :root {
    --color-gray-100: #f3f4f6;
    --color-gray-200: #e5e7eb;
    --color-gray-300: #d1d5db;
    --color-gray-400: #9ca3af;
    --color-gray-500: #6b7280;
    --color-gray-600: #4b5563;
    --color-gray-700: #374151;
    --color-gray-900: #111827;
    --color-blue-500: #3b82f6;
    --color-blue-600: #2563eb;
    --color-blue-700: #1d4ed8;
    --color-green-500: #10b981;
    --color-green-600: #059669;
    --color-red-500: #ef4444;
    --color-white: #ffffff;
  }

  .technical-config-form {
    width: 100%;
  }

  .message-container {
    margin-bottom: 1.5rem;
  }

  /* Estado del plan */
  .plan-status {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    color: white;
  }

  .plan-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .plan-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .plan-icon {
    font-size: 2rem;
  }

  .plan-name {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
  }

  .plan-description {
    font-size: 0.875rem;
    margin: 0;
    opacity: 0.9;
  }

  .upgrade-btn {
    padding: 0.5rem 1rem;
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .upgrade-btn:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* Secciones */
  .form-section:not(:first-child) {
    border-top: 1px solid var(--color-gray-200);
    padding-top: 2rem;
  }

  .section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 0.5rem 0;
  }

  .section-description {
    font-size: 0.875rem;
    color: var(--color-gray-600);
    margin: 0 0 1.5rem 0;
    line-height: 1.5;
  }

  /* Grid de toggles */
  .toggles-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 768px) {
    .toggles-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .toggle-item {
    padding: 1rem;
    background-color: var(--color-gray-100);
    border-radius: 0.5rem;
  }

  /* Elementos de configuración */
  .config-item {
    margin-bottom: 1.5rem;
  }

  .config-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-gray-700);
    margin-bottom: 0.5rem;
  }

  /* Preview de dominio */
  .domain-preview {
    margin-top: 0.5rem;
    padding: 0.75rem;
    background-color: var(--color-blue-50);
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .preview-label {
    font-size: 0.75rem;
    color: var(--color-blue-700);
    font-weight: 500;
  }

  .preview-link {
    font-size: 0.75rem;
    color: var(--color-blue-600);
    text-decoration: none;
  }

  .preview-link:hover {
    text-decoration: underline;
  }

  /* Display de URL */
  .url-display {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background-color: var(--color-gray-100);
    border: 1px solid var(--color-gray-300);
    border-radius: 0.5rem;
    gap: 0.5rem;
  }

  .url-text {
    flex: 1;
    font-size: 0.875rem;
    color: var(--color-gray-700);
    font-family: monospace;
  }

  .copy-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: background-color 0.15s ease-in-out;
  }

  .copy-btn:hover {
    background-color: var(--color-gray-200);
  }

  /* Código QR */
  .qr-container {
    background-color: var(--color-gray-100);
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  .qr-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .qr-image {
    width: 200px;
    height: 200px;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }

  .qr-actions {
    display: flex;
    gap: 0.5rem;
  }

  .qr-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
  }

  .qr-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .qr-placeholder-icon {
    font-size: 3rem;
    opacity: 0.5;
  }

  .qr-placeholder-text {
    font-size: 0.875rem;
    color: var(--color-gray-500);
    margin: 0;
  }

  .qr-btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    border: 1px solid transparent;
  }

  .qr-btn.primary {
    background-color: var(--color-blue-600);
    color: white;
  }

  .qr-btn.primary:hover:not(:disabled) {
    background-color: var(--color-blue-700);
  }

  .qr-btn.secondary {
    background-color: var(--color-white);
    color: var(--color-gray-700);
    border-color: var(--color-gray-300);
  }

  .qr-btn.secondary:hover {
    background-color: var(--color-gray-100);
  }

  .qr-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Información del sistema */
  .system-info {
    background-color: var(--color-gray-100);
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  .info-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 1rem 0;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  @media (min-width: 768px) {
    .info-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .info-label {
    font-size: 0.75rem;
    color: var(--color-gray-500);
    font-weight: 500;
  }

  .info-value {
    font-size: 0.75rem;
    color: var(--color-gray-700);
  }

  .info-value.active {
    color: var(--color-green-600);
  }

  .info-value.inactive {
    color: var(--color-red-500);
  }

  .info-value.mono {
    font-family: monospace;
    font-size: 0.625rem;
  }

  /* Botones */
  .form-actions {
    border-top: 1px solid var(--color-gray-200);
    padding-top: 1.5rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .btn {
    padding: 0.625rem 1.25rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    min-width: 120px;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    color: var(--color-gray-700);
    background-color: var(--color-white);
    border-color: var(--color-gray-300);
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: var(--color-gray-100);
  }

  :global(.btn-primary) {
    background-color: var(--color-blue-600) !important;
    color: var(--color-white) !important;
    border-color: var(--color-blue-600) !important;
  }

  :global(.btn-primary:hover:not(:disabled)) {
    background-color: var(--color-blue-700) !important;
    border-color: var(--color-blue-700) !important;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .form-actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }

    .plan-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .qr-actions {
      flex-direction: column;
      width: 100%;
    }

    .qr-btn {
      width: 100%;
    }
  }
</style>