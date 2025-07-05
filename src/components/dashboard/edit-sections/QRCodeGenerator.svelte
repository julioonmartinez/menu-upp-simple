<!-- src/components/dashboard/edit-sections/QRCodeGenerator.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { restaurantStore } from '../../../stores/restaurantStore.ts';
  // import QRCode from 'qrcode';

  export let url = '';
  export let restaurantName = '';
  export let qrCodeData = null; // qrCode_data object from restaurant
  export let restaurantId = ''; // Restaurant ID for uploading

  const dispatch = createEventDispatcher();

  // Estados
  let qrDataUrl = '';
  let isGenerating = false;
  let isSaving = false;
  let error = null;

  // File input reference
  let fileInput;

  // Función para convertir data URL a File
  function dataURLtoFile(dataUrl, filename) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  }

  // Verificar si existe un QR válido
  $: hasValidQR = qrCodeData && qrCodeData.url && qrCodeData.url.trim() !== '';

  // Inicializar qrDataUrl solo si existe un QR válido
  $: if (hasValidQR && qrCodeData.url && !qrDataUrl) {
    qrDataUrl = qrCodeData.url;
  }

  async function generateQR() {
    if (!url || isGenerating) return;
    
    isGenerating = true;
    error = null;

    try {
      const QRCode = await import('qrcode');
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      qrDataUrl = dataUrl;
      dispatch('generated', { dataUrl, config: { width: 300 } });
    } catch (err) {
      console.error('Error generando QR:', err);
      error = 'Error generando código QR';
    } finally {
      isGenerating = false;
    }
  }

  async function downloadQR() {
    if (!qrDataUrl) return;
    
    try {
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `qr-${restaurantName || 'restaurant'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error descargando QR:', err);
      error = 'Error descargando código QR';
    }
  }

  async function saveQRToServer() {
    if (!qrDataUrl || !restaurantId || isSaving) return;
    
    isSaving = true;
    error = null;

    try {
      // Convertir data URL a File
      const filename = `qr-${restaurantName || 'restaurant'}.png`;
      const qrFile = dataURLtoFile(qrDataUrl, filename);
      
      // Subir usando el método uploadRestaurantImage
      const result = await restaurantStore.uploadRestaurantImage(restaurantId, qrFile, 'qrCode');
      
      if (result.success) {
        dispatch('saved', { success: true, data: result.restaurant });
        // Actualizar el QR local con la respuesta del servidor
        if (result.restaurant?.qrCode_data?.url) {
          qrDataUrl = result.restaurant.qrCode_data.url;
        }
      } else {
        error = result.error || 'Error guardando código QR';
        dispatch('saved', { success: false, error: result.error });
      }
    } catch (err) {
      console.error('Error guardando QR:', err);
      error = 'Error guardando código QR';
      dispatch('saved', { success: false, error: 'Error guardando código QR' });
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="qr-generator">
  <!-- Vista previa del QR -->
  <div class="qr-preview-section">
    {#if hasValidQR && qrDataUrl}
      <div class="qr-preview">
        <img src={qrDataUrl} alt="Código QR" class="qr-image" />
        <div class="qr-info">
          <p class="qr-url">{url}</p>
          <p class="qr-status">
            <i class="fas fa-check-circle"></i>
            QR guardado en servidor
          </p>
        </div>
        <div class="qr-actions">
          <button
            type="button"
            class="qr-btn secondary"
            on:click={downloadQR}
          >
            <i class="fas fa-download"></i>
            Descargar
          </button>
        </div>
      </div>
    {:else if qrDataUrl && !hasValidQR}
      <div class="qr-preview">
        <img src={qrDataUrl} alt="Código QR" class="qr-image" />
        <div class="qr-info">
          <p class="qr-url">{url}</p>
          <p class="qr-status">
            <i class="fas fa-info-circle"></i>
            QR generado (no guardado)
          </p>
        </div>
        <div class="qr-actions">
          <button
            type="button"
            class="qr-btn secondary"
            on:click={downloadQR}
          >
            <i class="fas fa-download"></i>
            Descargar
          </button>
          {#if restaurantId}
            <button
              type="button"
              class="qr-btn success"
              on:click={saveQRToServer}
              disabled={isSaving}
            >
              {#if isSaving}
                <i class="fas fa-spinner fa-spin"></i>
                Guardando...
              {:else}
                <i class="fas fa-save"></i>
                Guardar en Servidor
              {/if}
            </button>
          {/if}
        </div>
      </div>
    {:else}
      <div class="qr-empty">
        <div class="qr-placeholder">
          <i class="fas fa-qrcode"></i>
          <p>No hay código QR configurado</p>
          <button
            type="button"
            class="qr-btn primary"
            on:click={generateQR}
            disabled={isGenerating || !url}
          >
            {#if isGenerating}
              <i class="fas fa-spinner fa-spin"></i>
              Generando...
            {:else}
              <i class="fas fa-magic"></i>
              Generar Código QR
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </div>

  {#if error}
    <div class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      {error}
    </div>
  {/if}
</div>

<style>
  .qr-generator {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xl);
  }

  /* Vista previa del QR */
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

  .qr-info {
    text-align: center;
  }

  .qr-url {
    font-size: var(--font-sm);
    color: var(--text-secondary);
    margin: 0 0 var(--spacing-xs) 0;
    word-break: break-all;
  }

  .qr-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    font-size: var(--font-xs);
    color: var(--info);
    margin: 0;
  }

  .qr-actions {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
    justify-content: center;
  }

  .qr-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-xl);
    border-radius: var(--radius-md);
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: all var(--transition-normal);
    border: 1px solid transparent;
    min-height: 44px;
  }

  .qr-btn.primary {
    background-color: var(--primary-color);
    color: var(--text-inverse);
  }

  .qr-btn.primary:hover:not(:disabled) {
    background-color: var(--primary-dark);
    transform: translateY(-1px);
  }

  .qr-btn.secondary {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border-color: var(--bg-accent);
  }

  .qr-btn.secondary:hover {
    background-color: var(--bg-tertiary);
    border-color: var(--primary-color);
  }

  .qr-btn.success {
    background-color: var(--success);
    color: var(--text-inverse);
  }

  .qr-btn.success:hover:not(:disabled) {
    background-color: var(--success-dark);
    transform: translateY(-1px);
  }

  .qr-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
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

  .error-message {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    background-color: var(--error-bg);
    border: 1px solid var(--error);
    border-radius: var(--radius-md);
    color: var(--error);
    font-size: var(--font-sm);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .qr-image {
      width: 250px;
      height: 250px;
    }
    
    .qr-actions {
      flex-direction: column;
      width: 100%;
    }
    
    .qr-btn {
      width: 100%;
      justify-content: center;
    }
  }
</style> 