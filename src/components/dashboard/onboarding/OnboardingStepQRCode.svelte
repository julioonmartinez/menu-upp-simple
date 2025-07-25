<script>
  import { createEventDispatcher } from 'svelte';
  import './OnboardingStepQRCode.css';
  import { toastStore } from '../../../stores/toastStore';

  export let restaurant;
  export let restaurantId;
  const dispatch = createEventDispatcher();

  // Construir la URL pública
  $: publicUrl = restaurant?.username
    ? `${window.location.origin}/${restaurant.username}`
    : '';

  // QR code data del restaurante (si ya fue generado y guardado)
  $: qrUrl = restaurant?.qrCode_data?.url || '';

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
    } catch (e) {
      // Puedes mostrar un error si quieres
    }
  }
</script>

<div class="onboarding-final-step">
  <h2>¡Tu restaurante está listo!</h2>
  <p>Comparte tu perfil o descarga el código QR para que tus clientes puedan acceder fácilmente.</p>

  {#if qrUrl}
    <div class="qr-preview">
      <img src={qrUrl} alt="Código QR del restaurante" class="qr-image" />
      <div class="qr-actions">
        <button class="btn btn-secondary" on:click={downloadQR}>Descargar QR</button>
      </div>
    </div>
  {:else}
    <p>No se ha generado un código QR para este restaurante.</p>
  {/if}

  <div class="public-url-section">
    <input class="public-url" type="text" readonly value={publicUrl} />
    <button class="btn btn-secondary" on:click={copyUrl}>Copiar enlace</button>
    <a class="btn btn-primary" href={publicUrl} target="_blank" rel="noopener noreferrer">
      Ver perfil público
    </a>
  </div>

  <!-- <div style="margin-top: 2rem; text-align: right;">
    <button class="btn btn-success" on:click={handleFinish}>
      Finalizar
    </button>
  </div> -->
</div>

