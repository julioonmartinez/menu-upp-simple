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
  let error = null;
  let success = null;

  // ESTADOS PARA GUARDADO AUTOMÁTICO Y BOTÓN FLOTANTE
  let isDirty = false;
  let isSaving = false;
  let saveError = null;
  let lastSaved = null;
  let autoSaveTimeout;

  // Detectar cambios en formData para activar guardado automático
  $: if (restaurant?.socialLinks && formData) {
    // Compara los valores actuales con los originales
    const hasChanges = JSON.stringify(formData) !== JSON.stringify({
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
      throw new Error('Por favor corrige los enlaces con formato incorrecto');
    }

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
    
    if (!result.success) {
      throw new Error(result.error || 'Error actualizando las redes sociales');
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
      success = 'Enlaces de redes sociales actualizados correctamente';
      dispatch('update');
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        success = null;
      }, 3000);
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



  // Contar enlaces activos
  $: activeLinksCount = Object.values(formData).filter(link => link.trim()).length;
</script>

<div class="social-links-form">
  <!-- Header -->
  <div class="form-header">
    <h2>Redes Sociales</h2>
    <p class="subtitle">
      Conecta tus redes sociales para que tus clientes puedan encontrarte
    </p>
  </div>

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

  <form class="form">
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

  </form>
</div>

<!-- BOTÓN FLOTANTE DE GUARDAR -->
<div class="floating-save-btn">
  <button
    class="btn btn-primary floating"
    on:click={handleManualSave}
    disabled={!isDirty || isSaving}
    aria-label="Guardar enlaces de redes sociales"
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
  /* Container principal */
  .social-links-form {
    width: 100%;
  }

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
    .social-grid {
      grid-template-columns: 1fr;
    }

    .tips-list {
      padding-left: var(--spacing-xl);
    }
  }

  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .preview-link:hover {
      transform: none;
    }

    .preview-link {
      min-height: 44px;
      padding: var(--spacing-sm) var(--spacing-md);
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .preview-link {
      transition: none;
    }

    .preview-link:hover {
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

    .preview-link {
      border-width: 2px;
    }
  }

  /* Focus management */
  .preview-link:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  /* Print styles */
  @media print {
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