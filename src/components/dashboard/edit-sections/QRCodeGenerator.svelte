<!-- src/components/dashboard/edit-sections/QRCodeGenerator.svelte -->
<script>
  import QRCode from 'qrcode-generator';
  export let url = '';
  export let restaurantName = '';

  let dataUrl = '';

  $: {
    if (url) {
      const qr = QRCode(0, 'L');
      qr.addData(url);
      qr.make();
      dataUrl = qr.createDataURL(8);
    } else {
      dataUrl = '';
    }
  }

  function downloadQRCode() {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qr-${restaurantName || 'restaurant'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
</script>

<div class="qr-generator">
  <div class="qr-preview-section">
    {#if dataUrl}
      <div class="qr-preview">
        <img src={dataUrl} alt="Código QR" class="qr-image" />
        <button class="qr-download-btn" on:click={downloadQRCode}>
          <i class="fas fa-download"></i> Descargar QR
        </button>
      </div>
    {:else}
      <div class="qr-empty">
        <div class="qr-placeholder">
          <i class="fas fa-qrcode"></i>
          <p>No hay código QR configurado</p>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .qr-generator {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xl);
  }
  .qr-preview-section {
    display: flex;
    justify-content: center;
  }
  .qr-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-lg);
    padding: var(--spacing-2xl);
    background: var(--bg-tertiary);
    border-radius: var(--radius-xl);
    border: 1px solid var(--bg-accent);
  }
  .qr-image {
    width: 300px;
    height: 300px;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--bg-accent);
  }
  .qr-empty {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }
  .qr-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-lg);
    color: var(--text-muted);
  }
  .qr-placeholder i {
    font-size: var(--font-4xl);
    opacity: 0.5;
  }
  .qr-placeholder p {
    margin: 0;
    font-size: var(--font-sm);
  }
  .qr-download-btn {
    margin-top: var(--spacing-lg);
    padding: var(--spacing-md) var(--spacing-xl);
    background-color: var(--primary-color);
    color: var(--text-inverse);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    transition: background 0.2s;
  }
  .qr-download-btn:hover {
    background-color: var(--primary-dark);
  }
  @media (max-width: 768px) {
    .qr-image {
      width: 250px;
      height: 250px;
    }
  }
</style> 