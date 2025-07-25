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
  let isClosing = false;

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
        isClosing = true;
        setTimeout(() => {
          isClosing = false;
          dispatch('close');
        }, 2000);
      } else {
        error = result.error || 'Error actualizando las redes sociales';
        isSubmitting = false;
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
        class="cancel-button"
        disabled={isSubmitting || isClosing}
      >
        Cancelar
      </button>
      
      <LoadingButton
        type="submit"
        loading={isSubmitting || isUpdating || isClosing}
        disabled={isClosing}
        variant="primary"
        size="md"
      >
        Guardar Enlaces
      </LoadingButton>
    </div>
  </form>
</div>

<style>
  /* Container principal */
  .social-links-form {
    width: 100%;
  }

  /* Mensajes */
  .message-container {
    margin-bottom: var(--spacing-2xl);
  }

  /* Contador de enlaces */
  .links-counter {
    background-color: var(--info-bg);
    border: 1px solid var(--info);
    border-radius: var(--radius-xl);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-2xl);
    box-shadow: var(--shadow-sm);
  }

  .counter-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .counter-icon {
    font-size: var(--font-xl);
  }

  .counter-text {
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    color: var(--info);
  }

  /* Formulario */
  .form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3xl);
  }

  /* Secciones del formulario */
  .form-section:not(:first-child) {
    border-top: 1px solid var(--bg-accent);
    padding-top: var(--spacing-3xl);
  }

  .section-title {
    font-size: var(--font-xl);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-2xl) 0;
  }

  /* Grid de redes sociales */
  .social-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-2xl);
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
    gap: var(--spacing-md);
  }

  .social-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .social-icon {
    font-size: var(--font-xl);
  }

  .social-name {
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    color: var(--text-primary);
  }

  /* Preview de enlaces */
  .link-preview {
    margin-top: var(--spacing-sm);
  }

  .preview-link {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-xs);
    color: var(--primary-color);
    text-decoration: none;
    padding: var(--spacing-xs) var(--spacing-sm);
    background-color: var(--bg-accent);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
    border: 1px solid transparent;
  }

  .preview-link:hover {
    background-color: var(--bg-tertiary);
    color: var(--primary-dark);
    border-color: var(--primary-color);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  .preview-link:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  /* Sección de tips */
  .tips-section {
    background-color: var(--bg-tertiary);
    border-radius: var(--radius-xl);
    padding: var(--spacing-2xl);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--bg-accent);
  }

  .tips-title {
    font-size: var(--font-lg);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-lg) 0;
  }

  .tips-list {
    margin: 0;
    padding-left: var(--spacing-2xl);
    color: var(--text-secondary);
  }

  .tips-list li {
    font-size: var(--font-sm);
    line-height: var(--leading-relaxed);
    margin-bottom: var(--spacing-sm);
  }

  .tips-list li:last-child {
    margin-bottom: 0;
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
    .form {
      gap: var(--spacing-2xl);
    }

    .form-section:not(:first-child) {
      padding-top: var(--spacing-2xl);
    }

    .section-title {
      font-size: var(--font-lg);
      margin-bottom: var(--spacing-xl);
    }

    .tips-section {
      padding: var(--spacing-xl);
    }

    .links-counter {
      padding: var(--spacing-md);
    }
  }

  @media (max-width: 640px) {
    .form-actions {
      flex-direction: column;
    }

    .cancel-button {
      width: 100%;
    }

    .social-grid {
      grid-template-columns: 1fr;
    }

    .tips-list {
      padding-left: var(--spacing-xl);
    }
  }

  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .preview-link:hover,
    .cancel-button:hover {
      transform: none;
    }

    .preview-link,
    .cancel-button {
      min-height: 44px;
    }

    .preview-link {
      padding: var(--spacing-sm) var(--spacing-md);
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .preview-link,
    .cancel-button {
      transition: none;
    }

    .preview-link:hover,
    .cancel-button:hover {
      transform: none;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .links-counter {
      background-color: var(--bg-accent);
      border-color: var(--info);
    }

    .tips-section {
      background-color: var(--bg-accent);
      border-color: var(--bg-tertiary);
    }

    .preview-link {
      background-color: var(--bg-accent);
      color: var(--primary-light);
    }

    .preview-link:hover {
      background-color: var(--bg-tertiary);
      color: var(--primary-color);
    }

    .cancel-button {
      background-color: var(--bg-tertiary);
      border-color: var(--bg-accent);
      color: var(--text-primary);
    }

    .cancel-button:hover:not(:disabled) {
      background-color: var(--bg-accent);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .form-section:not(:first-child) {
      border-top-width: 2px;
    }

    .links-counter,
    .tips-section {
      border-width: 2px;
    }

    .preview-link,
    .cancel-button {
      border-width: 2px;
    }

    .form-actions {
      border-top-width: 2px;
    }
  }

  /* Focus management */
  .preview-link:focus-visible,
  .cancel-button:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  /* Print styles */
  @media print {
    .form-actions {
      display: none;
    }

    .links-counter,
    .tips-section {
      border: 1px solid black;
      box-shadow: none;
    }

    .preview-link {
      border: 1px solid black;
      background: white !important;
      color: black !important;
    }
  }

  /* Animation for counter */
  .links-counter {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Hover effects for social fields */
  .social-field {
    transition: all var(--transition-fast);
  }

  .social-field:hover {
    transform: translateX(4px);
  }

  /* Reduced motion for social fields */
  @media (prefers-reduced-motion: reduce) {
    .social-field:hover {
      transform: none;
    }

    .links-counter {
      animation: none;
    }
  }
</style>