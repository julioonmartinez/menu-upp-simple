<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  let activeCategory: any = 'general';
  let searchQuery = '';
  let expandedFaqs = new Set();

  const categories = [
    {
      id: 'general',
      name: 'General',
      icon: 'fa-solid fa-info-circle',
      description: 'Preguntas generales sobre MenuUpp'
    },
    {
      id: 'restaurants',
      name: 'Restaurantes',
      icon: 'fa-solid fa-store',
      description: 'Gestión de restaurantes y menús'
    },
    {
      id: 'account',
      name: 'Cuenta',
      icon: 'fa-solid fa-user',
      description: 'Configuración de cuenta y perfil'
    },
    {
      id: 'technical',
      name: 'Técnico',
      icon: 'fa-solid fa-tools',
      description: 'Problemas técnicos y soporte'
    }
  ];

  const faqs = {
    general: [
      {
        question: '¿Qué es MenuUpp?',
        answer: 'MenuUpp es una plataforma que permite a los restaurantes crear y gestionar sus menús digitales de forma fácil y profesional. Los clientes pueden ver los menús, hacer pedidos y gestionar reservas desde cualquier dispositivo.'
      },
      {
        question: '¿Es gratuito usar MenuUpp?',
        answer: 'MenuUpp ofrece un plan gratuito con funcionalidades básicas. También tenemos planes premium con características avanzadas como analíticas, personalización avanzada y soporte prioritario.'
      },
      {
        question: '¿Cómo puedo empezar a usar MenuUpp?',
        answer: 'Regístrate gratuitamente, crea tu primer restaurante, añade categorías y platillos a tu menú. ¡Es así de simple!'
      }
    ],
    restaurants: [
      {
        question: '¿Cómo creo mi primer restaurante?',
        answer: 'Ve a "Mis Restaurantes" en el menú lateral y haz clic en "Nuevo Restaurante". Completa la información básica y ¡listo!'
      },
      {
        question: '¿Puedo tener múltiples restaurantes?',
        answer: 'Sí, puedes gestionar múltiples restaurantes desde una sola cuenta. Cada restaurante tendrá su propio menú y configuración.'
      },
      {
        question: '¿Cómo personalizo el diseño de mi menú?',
        answer: 'En la configuración de tu restaurante puedes cambiar colores, fuentes, logos y más para que coincida con tu marca.'
      }
    ],
    account: [
      {
        question: '¿Cómo cambio mi contraseña?',
        answer: 'Ve a "Mi Perfil" y luego a "Configuración de Seguridad" para cambiar tu contraseña.'
      },
      {
        question: '¿Puedo cambiar mi correo electrónico?',
        answer: 'Por seguridad, el cambio de correo electrónico requiere verificación. Contacta con soporte para este proceso.'
      },
      {
        question: '¿Cómo elimino mi cuenta?',
        answer: 'Puedes eliminar tu cuenta desde la configuración de perfil. Ten en cuenta que esta acción es irreversible.'
      }
    ],
    technical: [
      {
        question: '¿Qué navegadores son compatibles?',
        answer: 'MenuUpp funciona en todos los navegadores modernos: Chrome, Firefox, Safari, Edge y otros basados en Chromium.'
      },
      {
        question: '¿Hay una aplicación móvil?',
        answer: 'MenuUpp es una aplicación web progresiva (PWA) que funciona como una app nativa en dispositivos móviles.'
      },
      {
        question: '¿Cómo reporto un problema técnico?',
        answer: 'Usa el formulario de contacto en esta página o envía un email a soporte@menuupp.com con detalles del problema.'
      }
    ]
  };

  function toggleFaq(id: string) {
    if (expandedFaqs.has(id)) {
      expandedFaqs.delete(id);
    } else {
      expandedFaqs.add(id);
    }
    expandedFaqs = expandedFaqs; // Trigger reactivity
  }
  function filterFaqs() {
    if (!searchQuery) return faqs[activeCategory as keyof typeof faqs];
    
    return faqs[activeCategory as keyof typeof faqs].filter((faq: { question: string; answer: string }) => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }


  $: filteredFaqs = filterFaqs();
</script>

<div class="help-center">
  <!-- Barra de búsqueda -->
  <div class="search-section">
    <div class="search-container">
      <i class="fa-solid fa-search search-icon"></i>
      <input
        type="text"
        class="search-input"
        placeholder="Buscar en la ayuda..."
        bind:value={searchQuery}
      />
      {#if searchQuery}
        <button class="clear-search" on:click={() => searchQuery = ''}>
          <i class="fa-solid fa-times"></i>
        </button>
      {/if}
    </div>
  </div>

  <!-- Categorías -->
  <div class="categories-section">
    <h2 class="section-title">Categorías de Ayuda</h2>
    <div class="categories-grid">
      {#each categories as category}
        <button
          class="category-card"
          class:active={activeCategory === category.id}
          on:click={() => activeCategory = category.id}
        >
          <div class="category-icon">
            <i class={category.icon}></i>
          </div>
          <div class="category-content">
            <h3 class="category-name">{category.name}</h3>
            <p class="category-description">{category.description}</p>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- FAQs -->
  <div class="faqs-section">
    <div class="section-header">
      <h2 class="section-title">
        Preguntas Frecuentes - {categories.find(c => c.id === activeCategory)?.name}
      </h2>
      {#if searchQuery}
        <p class="search-results">
          {filteredFaqs.length} resultado{filteredFaqs.length !== 1 ? 's' : ''} encontrado{filteredFaqs.length !== 1 ? 's' : ''}
        </p>
      {/if}
    </div>

    <div class="faqs-list">
      {#each filteredFaqs as faq, index}
        <div 
          class="faq-item"
          class:expanded={expandedFaqs.has(`${activeCategory}-${index}`)}
          transition:fly={{ y: 20, duration: 300, delay: index * 50 }}
        >
          <button
            class="faq-question"
            on:click={() => toggleFaq(`${activeCategory}-${index}`)}
          >
            <span class="faq-text">{faq.question}</span>
            <i class="fa-solid fa-chevron-down faq-icon"></i>
          </button>
          {#if expandedFaqs.has(`${activeCategory}-${index}`)}
            <div class="faq-answer" transition:fade={{ duration: 200 }}>
              <p>{faq.answer}</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    {#if filteredFaqs.length === 0 && searchQuery}
      <div class="no-results">
        <i class="fa-solid fa-search"></i>
        <h3>No se encontraron resultados</h3>
        <p>Intenta con otros términos de búsqueda o revisa las categorías disponibles.</p>
      </div>
    {/if}
  </div>

  <!-- Contacto -->
  <div class="contact-section">
    <div class="contact-card">
      <div class="contact-icon">
        <i class="fa-solid fa-headset"></i>
      </div>
      <div class="contact-content">
        <h3>¿Necesitas más ayuda?</h3>
        <p>Nuestro equipo de soporte está aquí para ayudarte</p>
        <div class="contact-actions">
          <button class="btn btn-primary">
            <i class="fa-solid fa-envelope"></i>
            Contactar Soporte
          </button>
          <button class="btn btn-secondary">
            <i class="fa-solid fa-comments"></i>
            Chat en Vivo
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .help-center {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3xl);
  }

  /* Búsqueda */
  .search-section {
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    padding: var(--spacing-2xl);
    box-shadow: var(--shadow-md);
  }

  .search-container {
    position: relative;
    max-width: 600px;
    margin: 0 auto;
  }

  .search-icon {
    position: absolute;
    left: var(--spacing-lg);
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    z-index: 1;
  }

  .search-input {
    width: 100%;
    padding: var(--spacing-lg) var(--spacing-2xl) var(--spacing-lg) 3rem;
    border: 2px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    font-size: var(--font-lg);
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: all var(--transition-normal);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }

  .clear-search {
    position: absolute;
    right: var(--spacing-lg);
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: var(--spacing-xs);
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }

  .clear-search:hover {
    color: var(--text-primary);
    background: var(--bg-tertiary);
  }

  /* Categorías */
  .categories-section {
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    padding: var(--spacing-2xl);
    box-shadow: var(--shadow-md);
  }

  .section-title {
    font-size: var(--font-2xl);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-xl) 0;
  }

  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-lg);
  }

  .category-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    padding: var(--spacing-xl);
    background: var(--bg-tertiary);
    border: 2px solid transparent;
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-normal);
    text-align: left;
  }

  .category-card:hover {
    background: var(--bg-accent);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .category-card.active {
    border-color: var(--primary-color);
    background: var(--primary-color);
    color: var(--text-inverse);
  }

  .category-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    color: var(--primary-color);
    font-size: var(--font-xl);
    flex-shrink: 0;
  }

  .category-card.active .category-icon {
    background: rgba(255, 255, 255, 0.2);
    color: var(--text-inverse);
  }

  .category-name {
    font-size: var(--font-lg);
    font-weight: var(--weight-semibold);
    margin: 0 0 var(--spacing-xs) 0;
  }

  .category-description {
    font-size: var(--font-sm);
    color: var(--text-muted);
    margin: 0;
  }

  .category-card.active .category-description {
    color: rgba(255, 255, 255, 0.8);
  }

  /* FAQs */
  .faqs-section {
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    padding: var(--spacing-2xl);
    box-shadow: var(--shadow-md);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xl);
  }

  .search-results {
    font-size: var(--font-sm);
    color: var(--text-muted);
    margin: 0;
  }

  .faqs-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .faq-item {
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: all var(--transition-normal);
  }

  .faq-item:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-sm);
  }

  .faq-question {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: var(--spacing-xl);
    background: var(--bg-tertiary);
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
  }

  .faq-question:hover {
    background: var(--bg-accent);
  }

  .faq-text {
    font-size: var(--font-base);
    font-weight: var(--weight-medium);
    color: var(--text-primary);
  }

  .faq-icon {
    color: var(--text-muted);
    transition: transform var(--transition-fast);
  }

  .faq-item.expanded .faq-icon {
    transform: rotate(180deg);
  }

  .faq-answer {
    padding: 0 var(--spacing-xl) var(--spacing-xl) var(--spacing-xl);
    background: var(--bg-primary);
  }

  .faq-answer p {
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    margin: 0;
  }

  /* Sin resultados */
  .no-results {
    text-align: center;
    padding: var(--spacing-4xl);
    color: var(--text-muted);
  }

  .no-results i {
    font-size: var(--font-4xl);
    margin-bottom: var(--spacing-lg);
  }

  .no-results h3 {
    font-size: var(--font-xl);
    margin: 0 0 var(--spacing-md) 0;
  }

  /* Contacto */
  .contact-section {
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    padding: var(--spacing-2xl);
    box-shadow: var(--shadow-md);
  }

  .contact-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-2xl);
    text-align: center;
  }

  .contact-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    background: var(--primary-gradient);
    border-radius: var(--radius-full);
    color: var(--text-inverse);
    font-size: var(--font-3xl);
    flex-shrink: 0;
  }

  .contact-content {
    flex: 1;
  }

  .contact-content h3 {
    font-size: var(--font-2xl);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-sm) 0;
  }

  .contact-content p {
    color: var(--text-muted);
    margin: 0 0 var(--spacing-xl) 0;
  }

  .contact-actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .categories-grid {
      grid-template-columns: 1fr;
    }

    .section-header {
      flex-direction: column;
      gap: var(--spacing-md);
      align-items: flex-start;
    }

    .contact-card {
      flex-direction: column;
      text-align: center;
    }

    .contact-actions {
      flex-direction: column;
    }
  }

  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    .search-section,
    .categories-section,
    .faqs-section,
    .contact-section {
      background: var(--bg-primary);
      border-color: var(--bg-accent);
    }

    .category-card {
      background: var(--bg-tertiary);
    }

    .category-card:hover {
      background: var(--bg-accent);
    }

    .faq-question {
      background: var(--bg-tertiary);
    }

    .faq-question:hover {
      background: var(--bg-accent);
    }
  }
</style> 