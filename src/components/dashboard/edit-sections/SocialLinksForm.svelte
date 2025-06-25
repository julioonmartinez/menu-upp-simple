<!-- src/components/dashboard/edit-sections/SocialLinksForm.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { restaurantStore } from '../../../stores/restaurantStore.ts';
  import InputField from '../../ui/InputField.svelte';
  import LoadingButton from '../../ui/LoadingButton.svelte';
  import ErrorMessage from '../../ui/ErrorMessage.svelte';
  import SuccessMessage from '../../ui/SuccessMessage.svelte';

  export let restaurant;
  export let restaurantId;

  const dispatch = createEventDispatcher();

  // Form data reactivo
  let formData = {
    facebook: '',
    instagram: '',
    twitter: '',
    tiktok: '',
    youtube: '',
    linkedin: '',
    whatsapp: '',
    telegram: '',
    pinterest: '',
    snapchat: '',
    other: ''
  };

  // Estados del formulario
  let isSubmitting = false;
  let error = null;
  let success = null;

  // Reactive statements
  $: isUpdating = $restaurantStore.isUpdating;
  $: updateError = $restaurantStore.updateError;

  // Configuración de redes sociales
  const socialNetworks = [
    {
      key: 'facebook',
      name: 'Facebook',
      icon: '📘',
      placeholder: 'https://facebook.com/tu-restaurante',
      pattern: /^https?:\/\/(www\.)?(facebook|fb)\.com\/.+/i,
      baseUrl: 'https://facebook.com/'
    },
    {
      key: 'instagram',
      name: 'Instagram',
      icon: '📷',
      placeholder: 'https://instagram.com/tu-restaurante',
      pattern: /^https?:\/\/(www\.)?instagram\.com\/.+/i,
      baseUrl: 'https://instagram.com/'
    },
    {
      key: 'twitter',
      name: 'Twitter / X',
      icon: '🐦',
      placeholder: 'https://twitter.com/tu-restaurante',
      pattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/i,
      baseUrl: 'https://twitter.com/'
    },
    {
      key: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      placeholder: 'https://tiktok.com/@tu-restaurante',
      pattern: /^https?:\/\/(www\.)?tiktok\.com\/@.+/i,
      baseUrl: 'https://tiktok.com/@'
    },
    {
      key: 'youtube',
      name: 'YouTube',
      icon: '📺',
      placeholder: 'https://youtube.com/c/tu-restaurante',
      pattern: /^https?:\/\/(www\.)?youtube\.com\/(c\/|channel\/|user\/).+/i,
      baseUrl: 'https://youtube.com/c/'
    },
    {
      key: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      placeholder: 'https://linkedin.com/company/tu-restaurante',
      pattern: /^https?:\/\/(www\.)?linkedin\.com\/(company\/|in\/).+/i,
      baseUrl: 'https://linkedin.com/company/'
    },
    {
      key: 'whatsapp',
      name: 'WhatsApp',
      icon: '💬',
      placeholder: '+52 123 456 7890 o https://wa.me/52123456789',
      pattern: /^(\+?[\d\s\-\(\)]+|https?:\/\/(wa\.me|api\.whatsapp\.com)\/.+)$/i,
      baseUrl: 'https://wa.me/'
    },
    {
      key: 'telegram',
      name: 'Telegram',
      icon: '✈️',
      placeholder: 'https://t.me/tu-restaurante',
      pattern: /^https?:\/\/(www\.)?(t\.me|telegram\.me)\/.+/i,
      baseUrl: 'https://t.me/'
    },
    {
      key: 'pinterest',
      name: 'Pinterest',
      icon: '📌',
      placeholder: 'https://pinterest.com/tu-restaurante',
      pattern: /^https?:\/\/(www\.)?pinterest\.com\/.+/i,
      baseUrl: 'https://pinterest.com/'
    },
    {
      key: 'snapchat',
      name: 'Snapchat',
      icon: '👻',
      placeholder: 'https://snapchat.com/add/tu-restaurante',
      pattern: /^https?:\/\/(www\.)?snapchat\.com\/add\/.+/i,
      baseUrl: 'https://snapchat.com/add/'
    },
    {
      key: 'other',
      name: 'Otro Enlace',
      icon: '🔗',
      placeholder: 'https://tu-sitio-web.com',
      pattern: /^https?:\/\/.+/i,
      baseUrl: 'https://'
    }
  ];

  // Actualizar formData cuando cambie restaurant
  $: if (restaurant?.socialLinks) {
    formData = {
      facebook: restaurant.socialLinks.facebook || '',
      instagram: restaurant.socialLinks.instagram || '',
      twitter: restaurant.socialLinks.twitter || '',
      tiktok: restaurant.socialLinks.tiktok || '',
      youtube: restaurant.socialLinks.youtube || '',
      linkedin: restaurant.socialLinks.linkedin || '',
      whatsapp: restaurant.socialLinks.whatsapp || '',
      telegram: restaurant.socialLinks.telegram || '',
      pinterest: restaurant.socialLinks.pinterest || '',
      snapchat: restaurant.socialLinks.snapchat || '',
      other: restaurant.socialLinks.other || ''
    };
  }

  // Validación de URLs
  function validateUrl(url, pattern) {
    if (!url.trim()) return { isValid: true, error: null };
    
    // Para WhatsApp, permitir números de teléfono
    if (pattern.source.includes('wa\\.me')) {
      // Si es solo un número, convertir a formato WhatsApp
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (phoneRegex.test(url.trim())) {
        return { isValid: true, error: null, suggestion: `https://wa.me/${url.replace(/\D/g, '')}` };
      }
    }
    
    const isValid = pattern.test(url);
    return {
      isValid,
      error: isValid ? null : 'Formato de URL no válido'
    };
  }

  // Auto-completar URLs
  function autoCompleteUrl(value, baseUrl, key) {
    if (!value.trim()) return value;
    
    // Si ya tiene protocolo, no modificar
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }
    
    // Para WhatsApp con números
    if (key === 'whatsapp' && /^\+?[\d\s\-\(\)]+$/.test(value)) {
      const cleanNumber = value.replace(/\D/g, '');
      return `https://wa.me/${cleanNumber}`;
    }
    
    // Auto-completar con la base URL
    return baseUrl + value;
  }

  function handleUrlBlur(key, network) {
    const value = formData[key];
    if (value.trim()) {
      const completed = autoCompleteUrl(value, network.baseUrl, key);
      formData[key] = completed;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    
    if (isSubmitting) return;

    // Validar todas las URLs
    let hasErrors = false;
    const errors = {};

    for (const network of socialNetworks) {
      const validation = validateUrl(formData[network.key], network.pattern);
      if (!validation.isValid) {
        errors[network.key] = validation.error;
        hasErrors = true;
      }
      
      // Aplicar sugerencia si existe
      if (validation.suggestion) {
        formData[network.key] = validation.suggestion;
      }
    }

    if (hasErrors) {
      error = 'Por favor corrige los enlaces con formato incorrecto';
      return;
    }

    isSubmitting = true;
    error = null;
    success = null;

    try {
      // Filtrar enlaces vacíos
      const socialLinks = {};
      for (const [key, value] of Object.entries(formData)) {
        if (value.trim()) {
          socialLinks[key] = value.trim();
        }
      }

      const result = await restaurantStore.updateRestaurant(restaurantId, {
        socialLinks
      });

      if (result.success) {
        success = 'Enlaces de redes sociales actualizados correctamente';
        dispatch('update');
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          dispatch('close');
        }, 2000);
      } else {
        error = result.error || 'Error actualizando las redes sociales';
      }
    } catch (err) {
      error = err.message || 'Error desconocido';
    } finally {
      isSubmitting = false;
    }
  }

  // Contar enlaces activos
  $: activeLinksCount = Object.values(formData).filter(link => link.trim()).length;
</script>

<div class="social-links-form">
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

  <!-- Contador de enlaces -->
  <div class="links-counter">
    <div class="counter-content">
      <span class="counter-icon">🔗</span>
      <span class="counter-text">
        {activeLinksCount} enlace{activeLinksCount !== 1 ? 's' : ''} configurado{activeLinksCount !== 1 ? 's' : ''}
      </span>
    </div>
  </div>

  <form on:submit={handleSubmit} class="form">
    <!-- Redes Sociales Principales -->
    <div class="form-section">
      <h3 class="section-title">Redes Sociales Principales</h3>
      
      <div class="social-grid">
        {#each socialNetworks.slice(0, 6) as network}
          <div class="social-field">
            <div class="social-header">
              <span class="social-icon">{network.icon}</span>
              <span class="social-name">{network.name}</span>
            </div>
            
            <InputField
              id={network.key}
              type="url"
              bind:value={formData[network.key]}
              placeholder={network.placeholder}
              help={formData[network.key] ? '✓ Enlace válido' : 'Opcional'}
              on:blur={() => handleUrlBlur(network.key, network)}
            />
            
            {#if formData[network.key]}
              <div class="link-preview">
                <a 
                  href={formData[network.key]} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="preview-link"
                >
                  Abrir {network.name} 🔗
                </a>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Otras Redes y Contacto -->
    <div class="form-section">
      <h3 class="section-title">Mensajería y Otros Enlaces</h3>
      
      <div class="social-grid">
        {#each socialNetworks.slice(6) as network}
          <div class="social-field">
            <div class="social-header">
              <span class="social-icon">{network.icon}</span>
              <span class="social-name">{network.name}</span>
            </div>
            
            <InputField
              id={network.key}
              type={network.key === 'whatsapp' ? 'tel' : 'url'}
              bind:value={formData[network.key]}
              placeholder={network.placeholder}
              help={formData[network.key] ? '✓ Enlace válido' : 'Opcional'}
              on:blur={() => handleUrlBlur(network.key, network)}
            />
            
            {#if formData[network.key]}
              <div class="link-preview">
                <a 
                  href={formData[network.key]} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="preview-link"
                >
                  {network.key === 'whatsapp' ? 'Abrir WhatsApp' : `Abrir ${network.name}`} 🔗
                </a>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Tips de uso -->
    <div class="tips-section">
      <h4 class="tips-title">💡 Consejos para mejores resultados</h4>
      <ul class="tips-list">
        <li>Usa URLs completas (ej: https://instagram.com/tu-restaurante)</li>
        <li>Para WhatsApp puedes usar tu número directamente: +52 123 456 7890</li>
        <li>Verifica que tus perfiles estén públicos y actualizados</li>
        <li>Los enlaces aparecerán en tu página pública del restaurante</li>
      </ul>
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
        Guardar Enlaces
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
    --color-gray-500: #6b7280;
    --color-gray-600: #4b5563;
    --color-gray-700: #374151;
    --color-gray-900: #111827;
    --color-blue-500: #3b82f6;
    --color-blue-600: #2563eb;
    --color-blue-700: #1d4ed8;
    --color-green-500: #10b981;
    --color-white: #ffffff;
  }

  .social-links-form {
    width: 100%;
  }

  .message-container {
    margin-bottom: 1.5rem;
  }

  /* Contador de enlaces */
  .links-counter {
    background-color: var(--color-blue-50);
    border: 1px solid var(--color-blue-200);
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .counter-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .counter-icon {
    font-size: 1.25rem;
  }

  .counter-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-blue-800);
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
    margin: 0 0 1.5rem 0;
  }

  /* Grid de redes sociales */
  .social-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 768px) {
    .social-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Campo de red social */
  .social-field {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .social-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .social-icon {
    font-size: 1.25rem;
  }

  .social-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-gray-700);
  }

  /* Preview de enlaces */
  .link-preview {
    margin-top: 0.5rem;
  }

  .preview-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: var(--color-blue-600);
    text-decoration: none;
    padding: 0.25rem 0.5rem;
    background-color: var(--color-blue-50);
    border-radius: 0.375rem;
    transition: all 0.15s ease-in-out;
  }

  .preview-link:hover {
    background-color: var(--color-blue-100);
    color: var(--color-blue-700);
  }

  /* Sección de tips */
  .tips-section {
    background-color: var(--color-gray-100);
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  .tips-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 1rem 0;
  }

  .tips-list {
    margin: 0;
    padding-left: 1.25rem;
    color: var(--color-gray-600);
  }

  .tips-list li {
    font-size: 0.875rem;
    line-height: 1.5;
    margin-bottom: 0.5rem;
  }

  .tips-list li:last-child {
    margin-bottom: 0;
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

    .social-grid {
      grid-template-columns: 1fr;
    }
  }
</style>