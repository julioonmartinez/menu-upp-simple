<script>
  import { createEventDispatcher } from 'svelte';
  import { useLinkTrees } from '../../../stores/linkTreeStore';
  import { toastStore } from '../../../stores/toastStore';
  import IconPicker from '../../ui/IconPicker.svelte';
  import ColorPicker from '../../ui/ColorPicker.svelte';
  import { getIconClass } from '../../../utils/iconUtils';
  import { LinkType } from '../../../interfaces/links';
  import './OnboardingStepLink.css';
  
  export let restaurant;
  export let restaurantId;
  const dispatch = createEventDispatcher();

  console.log('OnboardingStepLink props:', { restaurant, restaurantId });

  // Store para manejar links
//   const {
//     loadLinkTreeByRestaurant,
//     createLink,
//     currentLinkTree
//   } = useLinkTrees();

  // Store para manejar links
  const {
    loadLinkTreeByRestaurant,
    createLink,
    currentLinkTree
  } = useLinkTrees();

  let linkTreeId = null;
  let isSubmitting = false;
  let error = null;
  let isLinkTreeLoaded = false;

  // Form data
  let formData = {
    title: '',
    url: '',
    icon: '',
    description: '',
    type: LinkType.CUSTOM,
    customColor: '#FFFFFF',
    active: true
  };

  // Opciones rápidas predefinidas
  const quickOptions = [
    {
      id: 'location',
      title: 'Ubicación',
      icon: 'location-dot',
      description: 'Visita mi restaurante',
      placeholder: 'https://maps.google.com/...',
      color: '#ef4444'
    },
    {
      id: 'website',
      title: 'Página Web',
      icon: 'globe',
      description: 'Visita mi sitio web',
      placeholder: 'https://tu-restaurante.com',
      color: '#3b82f6'
    },
    {
      id: 'instagram',
      title: 'Instagram',
      icon: 'instagram',
      description: 'Sígueme en Instagram',
      placeholder: 'https://instagram.com/tu-usuario',
      color: '#e4405f'
    },
    {
      id: 'facebook',
      title: 'Facebook',
      icon: 'facebook',
      description: 'Sígueme en Facebook',
      placeholder: 'https://facebook.com/tu-pagina',
      color: '#1877f2'
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      icon: 'whatsapp',
      description: 'Escríbeme por WhatsApp',
      placeholder: 'https://wa.me/521234567890',
      color: '#25d366'
    },
    {
      id: 'phone',
      title: 'Teléfono',
      icon: 'phone',
      description: 'Llámame directamente',
      placeholder: 'tel:+521234567890',
      color: '#10b981'
    },
    {
      id: 'delivery',
      title: 'Delivery',
      icon: 'truck',
      description: 'Pide a domicilio',
      placeholder: 'https://uber.com/...',
      color: '#f59e0b'
    },
    {
      id: 'youtube',
      title: 'YouTube',
      icon: 'youtube',
      description: 'Suscríbete a mi canal',
      placeholder: 'https://youtube.com/@tu-canal',
      color: '#ff0000'
    },
    {
      id: 'tiktok',
      title: 'TikTok',
      icon: 'tiktok',
      description: 'Sígueme en TikTok',
      placeholder: 'https://tiktok.com/@tu-usuario',
      color: '#000000'
    },
    {
      id: 'twitter',
      title: 'Twitter',
      icon: 'twitter',
      description: 'Sígueme en Twitter',
      placeholder: 'https://twitter.com/tu-usuario',
      color: '#1da1f2'
    },
    {
      id: 'linkedin',
      title: 'LinkedIn',
      icon: 'linkedin',
      description: 'Conecta profesionalmente',
      placeholder: 'https://linkedin.com/in/tu-perfil',
      color: '#0077b5'
    },
    {
      id: 'custom',
      title: 'Personalizado',
      icon: 'link',
      description: 'Otro enlace importante',
      placeholder: 'https://ejemplo.com',
      color: '#8b5cf6'
    }
  ];

  let selectedOption = null;
  let scrollContainer;
  let showLeftIndicator = false;
  let showRightIndicator = true;

  // Exponer método save() para el wizard
  export async function save() {
    // Si no hay datos en el formulario, permitir continuar sin guardar
    if (!formData.title.trim() && !formData.url.trim()) {
      return true;
    }

    // Validar que al menos tenga título y URL
    if (!formData.title.trim()) {
      toastStore.error('El título es requerido');
      return false;
    }

    if (!formData.url.trim()) {
      toastStore.error('La URL es requerida');
      return false;
    }

    // Validar formato de URL
    try {
      new URL(formData.url);
    } catch {
      toastStore.error('La URL no tiene un formato válido');
      return false;
    }

    isSubmitting = true;
    error = null;

    try {
      // 1. Cargar LinkTree si no está cargado
      if (!isLinkTreeLoaded) {
        await loadLinkTree();
      }

      if (!linkTreeId) {
        error = 'No se pudo cargar el LinkTree';
        toastStore.error(error);
        return false;
      }

      // 2. Crear el enlace
      console.log('Creating link with data:', { linkTreeId, formData });
      const result = await createLink(linkTreeId, {
        ...formData,
        order: 1 // Agregar después del enlace del menú existente (order 0)
      });

      if (result.success && result.link) {
        toastStore.success('Enlace agregado correctamente');
        return true;
      } else {
        error = result.error || 'No se pudo crear el enlace';
        toastStore.error(error);
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

  async function loadLinkTree() {
    try {
      console.log('Loading LinkTree for restaurant:', restaurantId);
      const result = await loadLinkTreeByRestaurant(restaurantId);
      console.log('LoadLinkTree result:', result);
      if (result.success && result.data) {
        linkTreeId = result.data.id;
        isLinkTreeLoaded = true;
        console.log('LinkTree loaded successfully, ID:', linkTreeId);
      } else {
        throw new Error('No se pudo cargar el LinkTree');
      }
    } catch (err) {
      console.error('Error loading LinkTree:', err);
      throw new Error('Error al cargar el LinkTree');
    }
  }

  function selectQuickOption(option) {
    selectedOption = option;
    formData = {
      title: option.title,
      url: '',
      icon: option.icon,
      description: option.description,
      type: LinkType.CUSTOM,
      customColor: '#FFFFFF',
      active: true
    };
  }

  function clearSelection() {
    selectedOption = null;
    formData = {
      title: '',
      url: '',
      icon: '',
      description: '',
      type: LinkType.CUSTOM,
      customColor: '#FFFFFF',
      active: true
    };
  }

  // Funciones para manejar el scroll horizontal
  function handleScroll() {
    if (!scrollContainer) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
    showLeftIndicator = scrollLeft > 0;
    showRightIndicator = scrollLeft < scrollWidth - clientWidth - 1;
  }

  function scrollLeft() {
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: -200, behavior: 'smooth' });
    }
  }

  function scrollRight() {
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: 200, behavior: 'smooth' });
    }
  }
</script>

<div class="onboarding-link flex flex-col gap-xl w-full max-w-lg mx-auto animate-fade-in">
  <h2 class="text-2xl font-bold text-primary text-center mb-lg">¡Agrega un enlace adicional!</h2>
  <p class="text-muted text-center mb-xl">Ya tienes un enlace a tu menú. Agrega otro enlace importante como tu ubicación, redes sociales o página web.</p>
  
  <!-- Opciones rápidas -->
  <div class="quick-options">
    <h3 class="text-lg font-semibold text-primary mb-md">Opciones rápidas</h3>
    <div class="quick-options-container">
      <div 
        class="quick-options-scroll"
        bind:this={scrollContainer}
        on:scroll={handleScroll}
      >
        {#each quickOptions as option}
          <button
            class="quick-option-chip"
            class:selected={selectedOption?.id === option.id}
            on:click={() => selectQuickOption(option)}
          >
            <div class="chip-icon" style="background-color: {option.color}">
              <i class="{getIconClass(option.icon)}"></i>
            </div>
            <div class="chip-content">
              <div class="chip-title">{option.title}</div>
              <div class="chip-description">{option.description}</div>
            </div>
          </button>
        {/each}
      </div>
      <!-- Indicadores de scroll -->
      <div class="scroll-indicators">
        <button 
          class="scroll-indicator left" 
          class:visible={showLeftIndicator}
          on:click={scrollLeft}
          disabled={!showLeftIndicator}
        >
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <button 
          class="scroll-indicator right" 
          class:visible={showRightIndicator}
          on:click={scrollRight}
          disabled={!showRightIndicator}
        >
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>

  <!-- Formulario -->
  <form class="link-form flex flex-col gap-lg" on:submit|preventDefault={() => {}}>
    <div class="flex flex-col gap-xs">
      <label class="font-medium text-secondary" for="link-title">Título del enlace</label>
      <input 
        id="link-title" 
        class="input" 
        type="text" 
        placeholder="Ej: Ubicación, Instagram, Página Web..."
        bind:value={formData.title}
        required
      />
    </div>

    <div class="flex flex-col gap-xs">
      <label class="font-medium text-secondary" for="link-url">URL</label>
      <input 
        id="link-url" 
        class="input" 
        type="url" 
        placeholder={selectedOption?.placeholder || "https://ejemplo.com"}
        bind:value={formData.url}
        required
      />
      {#if selectedOption?.placeholder}
        <span class="text-xs text-muted">Ejemplo: {selectedOption.placeholder}</span>
      {/if}
    </div>

    <div class="flex flex-col gap-xs">
      <label class="font-medium text-secondary" for="link-description">Descripción (opcional)</label>
      <textarea 
        id="link-description" 
        class="input" 
        placeholder="Descripción breve del enlace..."
        bind:value={formData.description}
        rows="2"
      ></textarea>
    </div>

    <div class="flex gap-lg">
      <div class="flex-1">
        <label class="font-medium text-secondary mb-xs block">Icono</label>
        <IconPicker bind:value={formData.icon} />
      </div>
      
      <div class="flex-1">
        <label class="font-medium text-secondary mb-xs block">Color</label>
        <ColorPicker bind:value={formData.customColor} />
      </div>
    </div>



    <!-- Botón para limpiar selección -->
    {#if selectedOption}
      <button 
        type="button" 
        class="btn btn-secondary btn-sm self-start"
        on:click={clearSelection}
      >
        <i class="fa-solid fa-times"></i>
        Limpiar selección
      </button>
    {/if}

    {#if isSubmitting}
      <div class="text-center text-muted mt-lg animate-pulse">Guardando enlace...</div>
    {/if}
  </form>

  <!-- Nota informativa -->
  <div class="info-note">
    <i class="fa-solid fa-info-circle text-info"></i>
    <p class="text-sm text-muted">
      <strong>Nota:</strong> Este paso es opcional. Puedes continuar sin agregar un enlace adicional y hacerlo más tarde desde el dashboard.
    </p>
  </div>
</div>
