<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import './OnboardingStepQRCode.css';
  import { toastStore } from '../../../stores/toastStore';

  export let restaurant;
  export let restaurantId;
  const dispatch = createEventDispatcher();

  let showConfetti = false;
  let qrLoaded = false;
  let showActions = false;

  // Construir la URL pública
  $: publicUrl = restaurant?.username
    ? `${window.location.origin}/${restaurant.username}`
    : '';

  // QR code data del restaurante (si ya fue generado y guardado)
  $: qrUrl = restaurant?.qrCode_data?.url || '';

  onMount(() => {
    // Secuencia de animaciones épicas
    setTimeout(() => {
      showConfetti = true;
    }, 300);

    setTimeout(() => {
      qrLoaded = true;
    }, 800);

    setTimeout(() => {
      showActions = true;
    }, 1200);
  });

  function handleFinish() {
    dispatch('next');
  }

  function copyUrl() {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      toastStore.success('¡Enlace copiado al portapapeles!');
    }
  }

  async function downloadQR() {
    if (!qrUrl) return;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-${restaurant?.name || 'restaurant'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toastStore.success('¡QR descargado exitosamente!');
    } catch (e) {
      toastStore.error('Error al descargar el QR');
    }
  }

  function shareQR() {
    if (navigator.share && qrUrl) {
      navigator.share({
        title: `${restaurant?.name || 'Mi Restaurante'} - Menú Digital`,
        text: '¡Mira mi menú digital!',
        url: publicUrl
      });
    } else {
      copyUrl();
    }
  }

  function addMoreDishes() {
    // Navegar al paso de platillos
    window.location.href = `/dashboard/restaurant/${restaurantId}/dishes`;
  }

  function viewMenu() {
    window.open(publicUrl, '_blank');
  }

  // Método save para el wizard (siempre retorna true ya que es el paso final)
  async function save() {
    return true;
  }

  // Exponer el método save para el componente padre
  export { save };
</script>

<!-- Confeti épico -->
{#if showConfetti}
  <div class="confetti-container">
    {#each Array(30) as _, i}
      <div 
        class="confetti-piece"
        style="
          --delay: {Math.random() * 2}s;
          --left: {Math.random() * 100}%;
          --color: {['#ff6b35', '#0D1B2A', '#10b981', '#ff8c69', '#e55a2b', '#34d399', '#64748b'][Math.floor(Math.random() * 7)]};
        "
      ></div>
    {/each}
  </div>
{/if}

<div class="onboarding-final-step">
  <!-- Header compacto y elegante -->
  <div class="achievement-header">
    <div class="trophy-icon">
      <i class="fas fa-trophy"></i>
    </div>
    
    <h1 class="achievement-title">
      <span class="title-line">¡Tu menú está</span>
      <span class="title-line highlight">listo!</span>
    </h1>
    
    <p class="achievement-subtitle">
      Has creado algo increíble. ¡Es hora de compartirlo!
    </p>
  </div>

  <!-- QR Code optimizado -->
  {#if qrUrl}
    <div class="qr-showcase {qrLoaded ? 'loaded' : ''}">
      <div class="qr-glow"></div>
      <img 
        src={qrUrl} 
        alt="Código QR del restaurante" 
        class="qr-image"
        on:load={() => qrLoaded = true}
      />
      <div class="qr-badge">
        <i class="fas fa-qrcode"></i>
        QR Activo
      </div>
    </div>
  {:else}
    <div class="qr-placeholder">
      <div class="placeholder-icon">
        <i class="fas fa-qrcode"></i>
      </div>
      <p>QR en generación...</p>
    </div>
  {/if}

  <!-- URL pública compacta -->
  <div class="url-section">
    <div class="url-container">
      <div class="url-icon">
        <i class="fas fa-link"></i>
      </div>
      <input 
        class="url-input" 
        type="text" 
        readonly 
        value={publicUrl}
        placeholder="URL de tu menú"
      />
      <button class="url-copy-btn" on:click={copyUrl}>
        <i class="fas fa-copy"></i>
      </button>
    </div>
  </div>

  <!-- Acciones principales optimizadas -->
  <div class="action-grid {showActions ? 'visible' : ''}">
    <button class="action-card primary" on:click={viewMenu}>
      <div class="action-icon">
        <i class="fas fa-eye"></i>
      </div>
      <div class="action-content">
        <h3>Ver Menú</h3>
        <p>Explora tu creación</p>
      </div>
      <div class="action-arrow">
        <i class="fas fa-arrow-right"></i>
      </div>
    </button>

    <button class="action-card secondary" on:click={shareQR}>
      <div class="action-icon">
        <i class="fas fa-share-alt"></i>
      </div>
      <div class="action-content">
        <h3>Compartir QR</h3>
        <p>Llega a más clientes</p>
      </div>
      <div class="action-arrow">
        <i class="fas fa-arrow-right"></i>
      </div>
    </button>

    <button class="action-card tertiary" on:click={addMoreDishes}>
      <div class="action-icon">
        <i class="fas fa-plus"></i>
      </div>
      <div class="action-content">
        <h3>Más Platillos</h3>
        <p>Expande tu menú</p>
      </div>
      <div class="action-arrow">
        <i class="fas fa-arrow-right"></i>
      </div>
    </button>
  </div>

  <!-- Botón de finalizar optimizado -->
  <div class="finish-section">
    <button class="finish-btn" on:click={handleFinish}>
      <span>¡Finalizar Onboarding!</span>
      <div class="finish-sparkles">
        <div class="sparkle"></div>
        <div class="sparkle"></div>
        <div class="sparkle"></div>
      </div>
    </button>
  </div>
</div>

