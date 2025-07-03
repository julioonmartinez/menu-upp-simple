<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '../stores/authStore';
  import { fade, fly } from 'svelte/transition';

  let user: any = null;
  let isLoading = false;
  let isSubmitted = false;
  let message = '';
  let messageType = '';

  // Form data
  let formData = {
    type: 'suggestion',
    subject: '',
    description: '',
    rating: 5,
    includeContact: false,
    contactEmail: ''
  };

  const feedbackTypes = [
    { value: 'suggestion', label: 'Sugerencia', icon: 'fa-solid fa-lightbulb' },
    { value: 'bug', label: 'Reportar Error', icon: 'fa-solid fa-bug' },
    { value: 'feature', label: 'Nueva Funcionalidad', icon: 'fa-solid fa-plus-circle' },
    { value: 'general', label: 'General', icon: 'fa-solid fa-comment' }
  ];

  onMount(() => {
    const currentUser = authStore.getCurrentUser();
    if (currentUser) {
      user = currentUser;
      formData.contactEmail = currentUser.email || '';
    }
  });

  async function handleSubmit() {
    if (!formData.subject.trim() || !formData.description.trim()) {
      showMessage('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    isLoading = true;
    message = '';

    try {
      // Simular envío (aquí iría la llamada real a la API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      isSubmitted = true;
      showMessage('¡Gracias por tu feedback! Lo revisaremos pronto.', 'success');
      
      // Reset form
      formData = {
        type: 'suggestion',
        subject: '',
        description: '',
        rating: 5,
        includeContact: false,
        contactEmail: user?.email || ''
      };
    } catch (error) {
      showMessage('Error al enviar el feedback. Inténtalo de nuevo.', 'error');
    } finally {
      isLoading = false;
    }
  }

  function showMessage(text: string, type: string) {
    message = text;
    messageType = type;
    setTimeout(() => {
      message = '';
    }, 5000);
  }

  function handleTypeChange(type: string) {
    formData.type = type;
  }

  function handleRatingChange(rating: number) {
    formData.rating = rating;
  }
</script>

<div class="feedback-form">
  <!-- Mensaje de estado -->
  {#if message}
    <div 
      class="message"
      class:success={messageType === 'success'}
      class:error={messageType === 'error'}
      transition:fly={{ y: -20, duration: 300 }}
    >
      <i class="fa-solid {messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>{message}</span>
    </div>
  {/if}

  {#if isSubmitted}
    <!-- Mensaje de éxito -->
    <div class="success-section" transition:fly={{ y: 20, duration: 300 }}>
      <div class="success-icon">
        <i class="fa-solid fa-check-circle"></i>
      </div>
      <h2>¡Feedback Enviado!</h2>
      <p>Gracias por compartir tu opinión con nosotros. Tu feedback nos ayuda a mejorar MenuUpp.</p>
      <button class="btn btn-primary" on:click={() => isSubmitted = false}>
        Enviar otro feedback
      </button>
    </div>
  {:else}
    <!-- Formulario -->
    <form class="form-container" on:submit|preventDefault={handleSubmit}>
      <!-- Tipo de feedback -->
      <div class="form-section">
        <h3 class="section-title">Tipo de Feedback</h3>
        <div class="type-grid">
          {#each feedbackTypes as type}
            <button
              type="button"
              class="type-card"
              class:active={formData.type === type.value}
              on:click={() => handleTypeChange(type.value)}
            >
              <i class={type.icon}></i>
              <span>{type.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Asunto -->
      <div class="form-section">
        <label for="subject" class="form-label">Asunto *</label>
        <input
          id="subject"
          type="text"
          class="input"
          bind:value={formData.subject}
          placeholder="Describe brevemente tu feedback"
          required
        />
      </div>

      <!-- Descripción -->
      <div class="form-section">
        <label for="description" class="form-label">Descripción *</label>
        <textarea
          id="description"
          class="input"
          bind:value={formData.description}
          placeholder="Proporciona detalles sobre tu feedback..."
          rows="6"
          required
        ></textarea>
      </div>

      <!-- Calificación -->
      <div class="form-section">
        <label class="form-label">¿Cómo calificarías tu experiencia con MenuUpp?</label>
        <div class="rating-container">
          {#each Array(5) as _, i}
            <button
              type="button"
              class="rating-star"
              class:active={formData.rating >= i + 1}
              on:click={() => handleRatingChange(i + 1)}
            >
              <i class="fa-solid fa-star"></i>
            </button>
          {/each}
          <span class="rating-text">
            {formData.rating === 1 && 'Muy malo'}
            {formData.rating === 2 && 'Malo'}
            {formData.rating === 3 && 'Regular'}
            {formData.rating === 4 && 'Bueno'}
            {formData.rating === 5 && 'Excelente'}
          </span>
        </div>
      </div>

      <!-- Información de contacto -->
      <div class="form-section">
        <div class="contact-toggle">
          <label class="toggle">
            <input 
              type="checkbox" 
              bind:checked={formData.includeContact}
            />
            <span class="toggle-slider"></span>
          </label>
          <div class="toggle-content">
            <h4>Incluir información de contacto</h4>
            <p>Permítenos contactarte si necesitamos más información sobre tu feedback</p>
          </div>
        </div>

        {#if formData.includeContact}
          <div class="contact-field" transition:fade={{ duration: 200 }}>
            <label for="contactEmail" class="form-label">Email de contacto</label>
            <input
              id="contactEmail"
              type="email"
              class="input"
              bind:value={formData.contactEmail}
              placeholder="tu@email.com"
            />
          </div>
        {/if}
      </div>

      <!-- Acciones -->
      <div class="form-actions">
        <button 
          type="submit"
          class="btn btn-primary"
          disabled={isLoading}
        >
          {#if isLoading}
            <i class="fa-solid fa-spinner fa-spin"></i>
            Enviando...
          {:else}
            <i class="fa-solid fa-paper-plane"></i>
            Enviar Feedback
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>

<style>
  .feedback-form {
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    padding: var(--spacing-3xl);
    box-shadow: var(--shadow-md);
  }

  /* Mensaje */
  .message {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    font-weight: var(--weight-medium);
    margin-bottom: var(--spacing-xl);
  }

  .message.success {
    background: var(--success-bg);
    color: var(--success);
    border: 1px solid var(--success);
  }

  .message.error {
    background: var(--error-bg);
    color: var(--error);
    border: 1px solid var(--error);
  }

  /* Sección de éxito */
  .success-section {
    text-align: center;
    padding: var(--spacing-4xl) var(--spacing-2xl);
  }

  .success-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    background: var(--success-bg);
    border-radius: var(--radius-full);
    color: var(--success);
    font-size: var(--font-4xl);
    margin: 0 auto var(--spacing-xl) auto;
  }

  .success-section h2 {
    font-size: var(--font-3xl);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-md) 0;
  }

  .success-section p {
    font-size: var(--font-lg);
    color: var(--text-muted);
    margin: 0 0 var(--spacing-2xl) 0;
  }

  /* Formulario */
  .form-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xl);
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .section-title {
    font-size: var(--font-lg);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  .form-label {
    font-weight: var(--weight-medium);
    color: var(--text-primary);
    font-size: var(--font-sm);
  }

  /* Tipos de feedback */
  .type-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-md);
  }

  .type-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-lg);
    background: var(--bg-tertiary);
    border: 2px solid transparent;
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-normal);
  }

  .type-card:hover {
    background: var(--bg-accent);
    transform: translateY(-2px);
  }

  .type-card.active {
    border-color: var(--primary-color);
    background: var(--primary-color);
    color: var(--text-inverse);
  }

  .type-card i {
    font-size: var(--font-xl);
  }

  .type-card span {
    font-weight: var(--weight-medium);
    text-align: center;
  }

  /* Calificación */
  .rating-container {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .rating-star {
    background: none;
    border: none;
    color: var(--bg-accent);
    font-size: var(--font-2xl);
    cursor: pointer;
    transition: all var(--transition-fast);
    padding: var(--spacing-xs);
  }

  .rating-star:hover,
  .rating-star.active {
    color: #fbbf24;
    transform: scale(1.1);
  }

  .rating-text {
    font-weight: var(--weight-medium);
    color: var(--text-secondary);
    margin-left: var(--spacing-md);
  }

  /* Toggle de contacto */
  .contact-toggle {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-lg);
  }

  .toggle {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
    flex-shrink: 0;
  }

  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--bg-accent);
    transition: all var(--transition-fast);
    border-radius: 24px;
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: all var(--transition-fast);
    border-radius: 50%;
  }

  input:checked + .toggle-slider {
    background-color: var(--primary-color);
  }

  input:checked + .toggle-slider:before {
    transform: translateX(26px);
  }

  .toggle-content h4 {
    font-size: var(--font-base);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-xs) 0;
  }

  .toggle-content p {
    font-size: var(--font-sm);
    color: var(--text-muted);
    margin: 0;
  }

  .contact-field {
    margin-top: var(--spacing-lg);
  }

  /* Acciones */
  .form-actions {
    display: flex;
    justify-content: center;
    padding-top: var(--spacing-xl);
    border-top: 1px solid var(--bg-accent);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .feedback-form {
      padding: var(--spacing-xl);
    }

    .type-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .rating-container {
      flex-wrap: wrap;
    }

    .contact-toggle {
      flex-direction: column;
      gap: var(--spacing-md);
    }
  }

  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    .feedback-form {
      background: var(--bg-primary);
      border-color: var(--bg-accent);
    }

    .type-card {
      background: var(--bg-tertiary);
    }

    .type-card:hover {
      background: var(--bg-accent);
    }
  }
</style> 