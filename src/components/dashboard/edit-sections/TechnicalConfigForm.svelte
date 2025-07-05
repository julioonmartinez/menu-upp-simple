<!-- src/components/dashboard/edit-sections/TechnicalConfigForm.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { restaurantStore } from '../../../stores/restaurantStore.ts';
  import InputField from '../../ui/InputField.svelte';
  import ToggleSwitch from '../../ui/ToggleSwitch.svelte';
  import LoadingButton from '../../ui/LoadingButton.svelte';
  import ErrorMessage from '../../ui/ErrorMessage.svelte';
  import SuccessMessage from '../../ui/SuccessMessage.svelte';
  // import QRCode from 'qrcode';
  import QRCodeGeneratorComponent from './QRCodeGenerator.svelte';

  export let restaurant;
  export let restaurantId;

  const dispatch = createEventDispatcher();

  // Form data reactivo
  let formData = {
    // Configuraciones de visibilidad
    showRatings: true,
    allowReviews: true,
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
        : `https://menuupp.com/${restaurant?.username}`;

      // Generar QR usando la librería qrcode
      const QRCode = await import('qrcode');
      const qrDataUrl = await QRCode.toDataURL(restaurantUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      formData.qrCode = qrDataUrl;
      
      // Opcional: Guardar el QR en el servidor
      // const result = await restaurantStore.updateRestaurant(restaurantId, { qrCode: qrDataUrl });
      
    } catch (err) {
      console.error('Error generando QR:', err);
      error = 'Error generando código QR';
    } finally {
      isGeneratingQR = false;
    }
  }

  async function downloadQRCode() {
    if (!formData.qrCode) return;
    
    try {
      // Crear un enlace temporal para descargar
      const link = document.createElement('a');
      link.href = formData.qrCode;
      link.download = `qr-${restaurant?.username || 'restaurant'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error descargando QR:', err);
      error = 'Error descargando código QR';
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
    : `${typeof window !== 'undefined' ? `https://menuupp.com` : ''}/${restaurant?.username}`;
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
        <div class="plan-icon">
          {#if formData.planType === 'free'}
            <i class="fas fa-gift"></i>
          {:else if formData.planType === 'basic'}
            <i class="fas fa-star"></i>
          {:else if formData.planType === 'premium'}
            <i class="fas fa-crown"></i>
          {:else}
            <i class="fas fa-rocket"></i>
          {/if}
        </div>
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
          <i class="fas fa-arrow-up"></i>
          Actualizar Plan
        </button>
      {/if}
    </div>
  </div>

  <form on:submit={handleSubmit} class="form">
    <!-- Configuraciones de Visibilidad -->
    <div class="form-section">
      <h3 class="section-title">
        <i class="fas fa-eye"></i>
        Configuraciones de Visibilidad
      </h3>
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
          <div class="coming-soon-toggle" on:click={() => {
            // Mostrar notificación de que la función está por venir
            if (typeof window !== 'undefined' && window.showNotification) {
              window.showNotification('¡Próximamente!', 'La función de pedidos online estará disponible muy pronto. ¡Mantente atento a las actualizaciones!', 'info');
            } else {
              // Fallback simple
              alert('¡Próximamente! La función de pedidos online estará disponible muy pronto.');
            }
          }}>
            <div class="coming-soon-content">
              <div class="coming-soon-header">
                <i class="fas fa-shopping-cart coming-soon-icon"></i>
                <span class="coming-soon-label">Permitir pedidos online</span>
                <div class="coming-soon-badge">
                  <i class="fas fa-clock"></i>
                  Próximamente
                </div>
              </div>
              <p class="coming-soon-description">
                Habilita pedidos directos desde tu página web. Esta función estará disponible muy pronto.
              </p>
              <div class="coming-soon-features">
                <div class="feature-item">
                  <i class="fas fa-check-circle"></i>
                  <span>Carrito de compras integrado</span>
                </div>
                <div class="feature-item">
                  <i class="fas fa-check-circle"></i>
                  <span>Pagos seguros online</span>
                </div>
                <div class="feature-item">
                  <i class="fas fa-check-circle"></i>
                  <span>Gestión de pedidos en tiempo real</span>
                </div>
              </div>
              <div class="coming-soon-hint">
                <i class="fas fa-info-circle"></i>
                <span>Haz clic para más información</span>
              </div>
            </div>
          </div>
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
      <h3 class="section-title">
        <i class="fas fa-cogs"></i>
        Configuraciones Técnicas
      </h3>
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
            <span class="preview-label">
              <i class="fas fa-link"></i>
              Tu página será:
            </span>
            <a href="https://{formData.customDomain}" target="_blank" class="preview-link">
              https://{formData.customDomain}
              <i class="fas fa-external-link-alt"></i>
            </a>
          </div>
        {/if}
      </div>

      <!-- URL actual -->
      <div class="config-item">
        <label class="config-label">
          <i class="fas fa-globe"></i>
          URL actual de tu restaurante
        </label>
        <div class="url-display">
          <span class="url-text">{publicUrl}</span>
          <button 
            type="button" 
            class="copy-btn"
            on:click={() => copyToClipboard(publicUrl)}
            title="Copiar URL"
          >
            <i class="fas fa-copy"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Código QR -->
    <div class="form-section">
      <h3 class="section-title">
        <i class="fas fa-qrcode"></i>
        Código QR
      </h3>
      <p class="section-description">
        Genera un código QR personalizado para que tus clientes accedan fácilmente a tu página.
      </p>

      <QRCodeGeneratorComponent 
        url={publicUrl}
        restaurantName={restaurant?.username}
        restaurantId={restaurantId}
        qrCodeData={restaurant?.qrCode_data || null}
        on:generated={(event) => {
          formData.qrCode = event.detail.dataUrl;
        }}
        on:saved={(event) => {
          if (event.detail.success) {
            // El QR se guardó correctamente en el servidor
            // Actualizar el formulario con la respuesta del servidor
            if (event.detail.data?.qrCode_data?.url) {
              formData.qrCode = event.detail.data.qrCode_data.url;
            }
            // Mostrar mensaje de éxito
            success = 'Código QR guardado correctamente en el servidor';
            setTimeout(() => {
              success = null;
            }, 3000);
          } else {
            // Mostrar error
            error = event.detail.error || 'Error guardando código QR';
          }
        }}
      />
    </div>
    

    <!-- Información del sistema -->
    <div class="system-info">
      <h4 class="info-title">
        <i class="fas fa-info-circle"></i>
        Información del Sistema
      </h4>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">
            <i class="fas fa-circle"></i>
            Estado:
          </span>
          <span class="info-value {formData.active ? 'active' : 'inactive'}">
            {#if formData.active}
              <i class="fas fa-check-circle"></i>
              Activo
            {:else}
              <i class="fas fa-times-circle"></i>
              Inactivo
            {/if}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">
            <i class="fas fa-clock"></i>
            Última actualización:
          </span>
          <span class="info-value">
            {restaurant?.updatedAt ? new Date(restaurant.updatedAt).toLocaleDateString() : 'Nunca'}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">
            <i class="fas fa-calendar-plus"></i>
            Creado:
          </span>
          <span class="info-value">
            {restaurant?.createdAt ? new Date(restaurant.createdAt).toLocaleDateString() : 'Desconocido'}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">
            <i class="fas fa-fingerprint"></i>
            ID del restaurante:
          </span>
          <span class="info-value mono">{restaurantId}</span>
        </div>
      </div>
    </div>

    <!-- Botones -->
    <div class="form-actions">
      <button
        type="button"
        on:click={() => dispatch('close')}
        class="cancel-button"
        disabled={isSubmitting}
      >
        <i class="fas fa-times"></i>
        Cancelar
      </button>
      
      <LoadingButton
        type="submit"
        loading={isSubmitting || isUpdating}
        variant="primary"
        size="md"
      >
        <i class="fas fa-save"></i>
        Guardar Configuraciones
      </LoadingButton>
    </div>
  </form>
</div>

<style>
  /* Container principal */
  .technical-config-form {
    width: 100%;
  }

  /* Mensajes */
  .message-container {
    margin-bottom: var(--spacing-2xl);
  }

  /* Estado del plan */
  .plan-status {
    background: var(--primary-gradient-bold);
    border-radius: var(--radius-xl);
    padding: var(--spacing-2xl);
    margin-bottom: var(--spacing-2xl);
    color: var(--text-inverse);
    box-shadow: var(--shadow-lg);
  }

  .plan-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-lg);
  }

  .plan-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
  }

  .plan-icon {
    font-size: var(--font-4xl);
    opacity: 0.9;
  }

  .plan-name {
    font-size: var(--font-xl);
    font-weight: var(--weight-bold);
    margin: 0 0 var(--spacing-xs) 0;
  }

  .plan-description {
    font-size: var(--font-sm);
    margin: 0;
    opacity: 0.9;
    line-height: var(--leading-relaxed);
  }

  .upgrade-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-xl);
    background-color: rgba(255, 255, 255, 0.2);
    color: var(--text-inverse);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: var(--radius-lg);
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: all var(--transition-normal);
    backdrop-filter: var(--backdrop-blur-sm);
  }

  .upgrade-btn:hover {
    background-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }

  .upgrade-btn:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: 2px;
  }

  /* Formulario */
  .form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3xl);
  }

  /* Secciones */
  .form-section:not(:first-child) {
    border-top: 1px solid var(--bg-accent);
    padding-top: var(--spacing-3xl);
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-xl);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-sm) 0;
  }

  .section-title i {
    color: var(--primary-color);
  }

  .section-description {
    font-size: var(--font-sm);
    color: var(--text-secondary);
    margin: 0 0 var(--spacing-2xl) 0;
    line-height: var(--leading-relaxed);
  }

  /* Grid de toggles */
  .toggles-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-2xl);
  }

  @media (min-width: 768px) {
    .toggles-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .toggle-item {
    padding: var(--spacing-xl);
    background-color: var(--bg-tertiary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--bg-accent);
    transition: all var(--transition-normal);
  }

  .toggle-item:hover {
    background-color: var(--bg-primary);
    box-shadow: var(--shadow-sm);
  }

  /* Elementos de configuración */
  .config-item {
    margin-bottom: var(--spacing-2xl);
  }

  .config-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
  }

  .config-label i {
    color: var(--primary-color);
  }

  /* Preview de dominio */
  .domain-preview {
    margin-top: var(--spacing-sm);
    padding: var(--spacing-md);
    background-color: var(--info-bg);
    border: 1px solid var(--info);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .preview-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-xs);
    color: var(--info);
    font-weight: var(--weight-medium);
  }

  .preview-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-xs);
    color: var(--info);
    text-decoration: none;
    transition: all var(--transition-fast);
  }

  .preview-link:hover {
    color: var(--primary-color);
    text-decoration: underline;
  }

  /* Display de URL */
  .url-display {
    display: flex;
    align-items: center;
    padding: var(--spacing-md) var(--spacing-lg);
    background-color: var(--bg-tertiary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    gap: var(--spacing-sm);
  }

  .url-text {
    flex: 1;
    font-size: var(--font-sm);
    color: var(--text-secondary);
    font-family: 'Courier New', monospace;
  }

  .copy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--spacing-sm);
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    transition: all var(--transition-fast);
    min-width: 32px;
    min-height: 32px;
  }

  .copy-btn:hover {
    background-color: var(--bg-accent);
    color: var(--primary-color);
  }

  .copy-btn:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  /* Código QR */
  .qr-container {
    background-color: var(--bg-tertiary);
    border-radius: var(--radius-xl);
    padding: var(--spacing-2xl);
    border: 1px solid var(--bg-accent);
  }

  .qr-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-lg);
  }

  .qr-image {
    width: 200px;
    height: 200px;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--bg-accent);
  }

  .qr-actions {
    display: flex;
    gap: var(--spacing-sm);
  }

  .qr-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-lg);
    padding: var(--spacing-3xl);
  }

  .qr-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .qr-placeholder-icon {
    font-size: var(--font-5xl);
    color: var(--text-light);
    opacity: 0.5;
  }

  .qr-placeholder-text {
    font-size: var(--font-sm);
    color: var(--text-muted);
    margin: 0;
  }

  .qr-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-xl);
    border-radius: var(--radius-md);
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: all var(--transition-normal);
    border: 1px solid transparent;
    min-height: 44px;
  }

  .qr-btn.primary {
    background-color: var(--primary-color);
    color: var(--text-inverse);
  }

  .qr-btn.primary:hover:not(:disabled) {
    background-color: var(--primary-dark);
    transform: translateY(-1px);
  }

  .qr-btn.secondary {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border-color: var(--bg-accent);
  }

  .qr-btn.secondary:hover {
    background-color: var(--bg-tertiary);
    border-color: var(--primary-color);
  }

  .qr-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .qr-btn:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  /* Información del sistema */
  .system-info {
    background-color: var(--bg-tertiary);
    border-radius: var(--radius-xl);
    padding: var(--spacing-2xl);
    border: 1px solid var(--bg-accent);
  }

  .info-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-lg);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-lg) 0;
  }

  .info-title i {
    color: var(--primary-color);
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
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
    padding: var(--spacing-sm) 0;
  }

  .info-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-xs);
    color: var(--text-muted);
    font-weight: var(--weight-medium);
  }

  .info-value {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-xs);
    color: var(--text-secondary);
    font-weight: var(--weight-medium);
  }

  .info-value.active {
    color: var(--success);
  }

  .info-value.inactive {
    color: var(--error);
  }

  .info-value.mono {
    font-family: 'Courier New', monospace;
    font-size: 0.625rem;
  }

  /* Acciones del formulario */
  .form-actions {
    border-top: 1px solid var(--bg-accent);
    padding-top: var(--spacing-2xl);
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
    flex-wrap: wrap;
  }

  .cancel-button {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-2xl);
    border-radius: var(--radius-lg);
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    border: 1px solid var(--bg-accent);
    cursor: pointer;
    transition: all var(--transition-normal);
    min-width: 120px;
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }

  .cancel-button:hover:not(:disabled) {
    background-color: var(--bg-tertiary);
    border-color: var(--text-muted);
    transform: translateY(-1px);
  }

  .cancel-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .cancel-button:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .form-section {
      padding: var(--spacing-lg);
    }
    
    .toggles-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
    }
    
    .form-actions {
      flex-direction: column;
      gap: var(--spacing-md);
    }
    
    .btn {
      width: 100%;
    }
  }

  /* Coming Soon Toggle Styles */
  .coming-soon-toggle {
    background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
    border: 2px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    padding: var(--spacing-xl);
    position: relative;
    overflow: hidden;
    transition: all var(--transition-normal);
    cursor: pointer;
    user-select: none;
  }

  .coming-soon-toggle::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 107, 53, 0.05), transparent);
    transition: left 0.8s ease;
  }

  .coming-soon-toggle:hover::before {
    left: 100%;
  }

  .coming-soon-toggle:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }

  .coming-soon-toggle:active {
    transform: translateY(0) scale(0.98);
    transition: all var(--transition-fast);
  }

  .coming-soon-content {
    position: relative;
    z-index: 1;
  }

  .coming-soon-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
    flex-wrap: wrap;
  }

  .coming-soon-icon {
    font-size: var(--font-2xl);
    color: var(--primary-color);
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: pulse 2s ease-in-out infinite;
  }

  .coming-soon-label {
    font-size: var(--font-lg);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    flex: 1;
  }

  .coming-soon-badge {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    color: var(--text-inverse);
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: var(--radius-full);
    font-size: var(--font-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: var(--shadow-sm);
    animation: bounce 2s ease-in-out infinite;
  }

  .coming-soon-badge i {
    font-size: var(--font-sm);
  }

  .coming-soon-description {
    color: var(--text-secondary);
    font-size: var(--font-sm);
    line-height: var(--leading-relaxed);
    margin-bottom: var(--spacing-lg);
  }

  .coming-soon-features {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-sm);
    color: var(--text-muted);
    transition: color var(--transition-fast);
  }

  .feature-item:hover {
    color: var(--text-secondary);
  }

  .feature-item i {
    color: var(--success);
    font-size: var(--font-base);
    flex-shrink: 0;
  }

  .coming-soon-hint {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--bg-accent);
    font-size: var(--font-xs);
    color: var(--text-light);
    font-style: italic;
  }

  .coming-soon-hint i {
    color: var(--primary-color);
    font-size: var(--font-sm);
  }

  /* Animations */
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.8;
    }
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-4px);
    }
  }

  /* Responsive adjustments for coming soon */
  @media (max-width: 640px) {
    .coming-soon-header {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-sm);
    }
    
    .coming-soon-label {
      font-size: var(--font-base);
    }
    
    .coming-soon-badge {
      align-self: flex-start;
    }
    
    .coming-soon-features {
      gap: var(--spacing-xs);
    }
  }

  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .coming-soon-toggle:hover {
      transform: none;
    }
    
    .coming-soon-toggle:active {
      transform: scale(0.95);
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .coming-soon-toggle::before,
    .coming-soon-icon,
    .coming-soon-badge {
      animation: none;
    }
    
    .coming-soon-toggle:hover {
      transform: none;
    }
  }
</style>