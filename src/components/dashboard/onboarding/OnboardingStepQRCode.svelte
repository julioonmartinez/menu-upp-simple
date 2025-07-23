<script>
  import { createEventDispatcher } from 'svelte';

  export let restaurant;
  export let restaurantId;
  const dispatch = createEventDispatcher();

  // Construir la URL pública
  $: publicUrl = restaurant?.username
    ? `https://www.menuupp.com/${restaurant.username}`
    : '';

  // QR code data del restaurante (si ya fue generado y guardado)
  $: qrUrl = restaurant?.qrCode_data?.url || '';

  function handleFinish() {
    dispatch('next');
  }

  function copyUrl() {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
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

<style>
  .onboarding-final-step {
    text-align: center;
    max-width: 500px;
    margin: 0 auto;
  }
  .qr-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .qr-image {
    width: 220px;
    height: 220px;
    border-radius: 16px;
    border: 1px solid #eee;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    background: #fff;
  }
  .qr-actions {
    margin-top: 0.5rem;
  }
  .public-url-section {
    display: flex;
    gap: 1rem;
    justify-content: center;
    align-items: center;
    margin-top: 2rem;
    flex-wrap: wrap;
  }
  .public-url {
    width: 300px;
    max-width: 100%;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid #ddd;
    font-size: 1rem;
  }
</style> 