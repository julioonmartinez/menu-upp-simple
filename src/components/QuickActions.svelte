<!-- src/components/QuickActions.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { LinkTree } from '../interfaces/links.ts';
  import { linkTreeUrlGenerator } from '../utils/linkTreeUtils.ts';
  import { QRCodeGenerator } from '../utils/qrCodeGenerator.ts';

  // Props
  export let linkTree: LinkTree;
  export let showLabels = true;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let layout: 'horizontal' | 'vertical' | 'grid' = 'horizontal';
  export let variant: 'default' | 'minimal' | 'colorful' = 'default';

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    action: { type: string; data?: any };
    share: { platform: string; url: string };
    qrGenerated: { url: string; qrDataUrl: string };
    copied: { text: string };
    preview: void;
    edit: void;
    analytics: void;
    export: { format: string };
  }>();

  // Local state
  let showShareMenu = false;
  let showExportMenu = false;
  let showQRModal = false;
  let qrCodeDataUrl = '';
  let isGeneratingQR = false;
  let isSharing = false;

  // Computed values
  $: publicUrl = linkTreeUrlGenerator.getPublicUrl(linkTree);
  $: shareUrls = linkTreeUrlGenerator.getSocialShareUrls(linkTree);

  // Action definitions
  const actions = [
    {
      id: 'preview',
      label: 'Vista Previa',
      icon: 'eye',
      color: '#3b82f6',
      handler: handlePreview
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: 'edit',
      color: '#10b981',
      handler: handleEdit
    },
    {
      id: 'share',
      label: 'Compartir',
      icon: 'share',
      color: '#f59e0b',
      handler: handleShare
    },
    {
      id: 'qr',
      label: 'Código QR',
      icon: 'qr-code',
      color: '#8b5cf6',
      handler: handleQR
    },
    {
      id: 'copy',
      label: 'Copiar Enlace',
      icon: 'copy',
      color: '#6b7280',
      handler: handleCopy
    },
    {
      id: 'analytics',
      label: 'Analíticas',
      icon: 'bar-chart',
      color: '#ef4444',
      handler: handleAnalytics
    },
    {
      id: 'export',
      label: 'Exportar',
      icon: 'download',
      color: '#14b8a6',
      handler: handleExport
    }
  ];

  // Platforms for sharing
  const sharePlatforms = [
    { id: 'twitter', label: 'Twitter', icon: 'twitter', color: '#1da1f2' },
    { id: 'facebook', label: 'Facebook', icon: 'facebook', color: '#4267b2' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'message-circle', color: '#25d366' },
    { id: 'telegram', label: 'Telegram', icon: 'send', color: '#0088cc' },
    { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin', color: '#0077b5' },
    { id: 'email', label: 'Email', icon: 'mail', color: '#6b7280' }
  ];

  // Export formats
  const exportFormats = [
    { id: 'json', label: 'JSON', icon: 'file-text', description: 'Exportar configuración' },
    { id: 'csv', label: 'CSV', icon: 'table', description: 'Exportar enlaces como tabla' },
    { id: 'pdf', label: 'PDF', icon: 'file', description: 'Exportar como documento' },
    { id: 'qr', label: 'QR Code', icon: 'qr-code', description: 'Descargar código QR' }
  ];

  // Action handlers
  function handlePreview() {
    window.open(publicUrl, '_blank', 'noopener,noreferrer');
    dispatch('preview');
    dispatch('action', { type: 'preview' });
  }

  function handleEdit() {
    dispatch('edit');
    dispatch('action', { type: 'edit' });
  }

  function handleShare() {
    showShareMenu = !showShareMenu;
    dispatch('action', { type: 'share' });
  }

  async function handleSharePlatform(platform: string) {
    isSharing = true;
    
    try {
      let url = '';
      
      switch (platform) {
        case 'twitter':
          url = shareUrls.twitter;
          break;
        case 'facebook':
          url = shareUrls.facebook;
          break;
        case 'whatsapp':
          url = shareUrls.whatsapp;
          break;
        case 'telegram':
          url = shareUrls.telegram;
          break;
        case 'linkedin':
          url = shareUrls.linkedin;
          break;
        case 'email':
          url = shareUrls.email;
          break;
      }
      
      if (url) {
        if (platform === 'email') {
          window.location.href = url;
        } else {
          window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
        }
      }
      
      dispatch('share', { platform, url });
      showShareMenu = false;
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      isSharing = false;
    }
  }

  async function handleQR() {
    showQRModal = true;
    isGeneratingQR = true;
    
    try {
      const qrGenerator = new QRCodeGenerator();
      qrCodeDataUrl = await qrGenerator.generateQRCode(publicUrl, {
        size: 300,
        margin: 2,
        colorDark: linkTree.textColor || '#000000',
        colorLight: linkTree.backgroundColor || '#ffffff'
      });
      
      dispatch('qrGenerated', { url: publicUrl, qrDataUrl: qrCodeDataUrl });
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      isGeneratingQR = false;
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      showNotification('¡Enlace copiado al portapapeles!');
      dispatch('copied', { text: publicUrl });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = publicUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showNotification('¡Enlace copiado al portapapeles!');
    }
    
    dispatch('action', { type: 'copy', data: { url: publicUrl } });
  }

  function handleAnalytics() {
    dispatch('analytics');
    dispatch('action', { type: 'analytics' });
  }

  function handleExport() {
    showExportMenu = !showExportMenu;
    dispatch('action', { type: 'export' });
  }

  function handleExportFormat(format: string) {
    dispatch('export', { format });
    showExportMenu = false;
    dispatch('action', { type: 'export', data: { format } });
  }

  function downloadQR() {
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.download = `${linkTree.customSlug || linkTree.id}-qr.png`;
      link.href = qrCodeDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  function showNotification(message: string) {
    // Simple notification implementation
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = 'quick-notification';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Close menus when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element;
    if (!target.closest('.dropdown-menu')) {
      showShareMenu = false;
      showExportMenu = false;
    }
  }

  // Get CSS classes based on props
  function getContainerClasses(): string {
    const classes = ['quick-actions'];
    classes.push(`layout-${layout}`);
    classes.push(`size-${size}`);
    classes.push(`variant-${variant}`);
    return classes.join(' ');
  }

  function getActionClasses(action: any): string {
    const classes = ['action-btn'];
    if (size) classes.push(`size-${size}`);
    return classes.join(' ');
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class={getContainerClasses()}>
  {#each actions as action}
    <div class="action-item" class:has-dropdown={action.id === 'share' || action.id === 'export'}>
      <button
        class={getActionClasses(action)}
        style="--action-color: {action.color}"
        on:click={action.handler}
        title={action.label}
        data-action={action.id}
      >
        <i class="icon-{action.icon}"></i>
        {#if showLabels}
          <span class="action-label">{action.label}</span>
        {/if}
      </button>

      <!-- Share Dropdown -->
      {#if action.id === 'share' && showShareMenu}
        <div class="dropdown-menu share-menu">
          <div class="dropdown-header">
            <h4>Compartir en:</h4>
          </div>
          <div class="dropdown-content">
            {#each sharePlatforms as platform}
              <button
                class="dropdown-item"
                style="--platform-color: {platform.color}"
                on:click={() => handleSharePlatform(platform.id)}
                disabled={isSharing}
              >
                <i class="icon-{platform.icon}"></i>
                <span>{platform.label}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Export Dropdown -->
      {#if action.id === 'export' && showExportMenu}
        <div class="dropdown-menu export-menu">
          <div class="dropdown-header">
            <h4>Exportar como:</h4>
          </div>
          <div class="dropdown-content">
            {#each exportFormats as format}
              <button
                class="dropdown-item"
                on:click={() => handleExportFormat(format.id)}
              >
                <i class="icon-{format.icon}"></i>
                <div class="format-info">
                  <span class="format-name">{format.label}</span>
                  <span class="format-description">{format.description}</span>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/each}
</div>

<!-- QR Code Modal -->
{#if showQRModal}
  <div class="modal-overlay" on:click={() => showQRModal = false}>
    <div class="modal qr-modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Código QR</h3>
        <button class="modal-close" on:click={() => showQRModal = false}>
          <i class="icon-x"></i>
        </button>
      </div>
      
      <div class="modal-content">
        <div class="qr-container">
          {#if isGeneratingQR}
            <div class="qr-loading">
              <div class="loading-spinner"></div>
              <p>Generando código QR...</p>
            </div>
          {:else if qrCodeDataUrl}
            <img src={qrCodeDataUrl} alt="Código QR" class="qr-image" />
            <p class="qr-info">
              Escanea este código para acceder a tu LinkTree
            </p>
            <div class="qr-url">{publicUrl}</div>
          {:else}
            <div class="qr-error">
              <p>Error generando código QR</p>
            </div>
          {/if}
        </div>
      </div>
      
      {#if qrCodeDataUrl}
        <div class="modal-actions">
          <button class="btn btn-secondary" on:click={() => showQRModal = false}>
            Cerrar
          </button>
          <button class="btn btn-primary" on:click={downloadQR}>
            <i class="icon-download"></i>
            Descargar
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .quick-actions {
    display: flex;
    gap: 0.5rem;
    position: relative;
  }

  .layout-horizontal {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .layout-vertical {
    flex-direction: column;
  }

  .layout-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 0.75rem;
  }

  .action-item {
    position: relative;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border: none;
    border-radius: 8px;
    background: var(--action-color, #6b7280);
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
    text-align: left;
    width: 100%;
  }

  .action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    filter: brightness(1.1);
  }

  .action-btn:active {
    transform: translateY(0);
  }

  .size-sm .action-btn {
    padding: 0.5rem;
    font-size: 0.875rem;
  }

  .size-md .action-btn {
    padding: 0.75rem;
    font-size: 0.9375rem;
  }

  .size-lg .action-btn {
    padding: 1rem;
    font-size: 1rem;
  }

  .action-label {
    font-size: inherit;
    white-space: nowrap;
  }

  .variant-minimal .action-btn {
    background: transparent;
    color: var(--action-color, #6b7280);
    border: 1px solid var(--action-color, #6b7280);
  }

  .variant-minimal .action-btn:hover {
    background: var(--action-color, #6b7280);
    color: white;
  }

  .variant-colorful .action-btn {
    background: linear-gradient(135deg, var(--action-color, #6b7280), var(--action-color, #6b7280));
    position: relative;
    overflow: hidden;
  }

  .variant-colorful .action-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }

  .variant-colorful .action-btn:hover::before {
    left: 100%;
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    min-width: 200px;
    max-width: 300px;
    animation: dropdownIn 0.2s ease;
  }

  .share-menu {
    right: 0;
    left: auto;
  }

  @keyframes dropdownIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dropdown-header {
    padding: 1rem 1rem 0.5rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .dropdown-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }

  .dropdown-content {
    padding: 0.5rem;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    text-align: left;
    color: #374151;
  }

  .dropdown-item:hover {
    background: #f3f4f6;
    color: var(--platform-color, #3b82f6);
  }

  .dropdown-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .format-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .format-name {
    font-weight: 500;
    font-size: 0.875rem;
  }

  .format-description {
    font-size: 0.75rem;
    color: #6b7280;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 1rem;
  }

  .modal {
    background: white;
    border-radius: 12px;
    max-width: 400px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalIn 0.3s ease;
  }

  @keyframes modalIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h3 {
    margin: 0;
    color: #111827;
  }

  .modal-close {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .modal-close:hover {
    color: #374151;
    background: #f3f4f6;
  }

  .modal-content {
    padding: 1.5rem;
  }

  .qr-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .qr-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
  }

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .qr-image {
    max-width: 100%;
    height: auto;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .qr-info {
    color: #6b7280;
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
  }

  .qr-url {
    background: #f3f4f6;
    padding: 0.75rem;
    border-radius: 6px;
    font-family: monospace;
    font-size: 0.75rem;
    color: #374151;
    word-break: break-all;
  }

  .qr-error {
    padding: 2rem;
    color: #dc2626;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
  }

  /* Notification */
  :global(.quick-notification) {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: #111827;
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 3000;
    animation: notificationIn 0.3s ease;
  }

  @keyframes notificationIn {
    from {
      opacity: 0;
      transform: translateY(100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Responsive */
  @media (max-width: 640px) {
    .layout-horizontal {
      flex-direction: column;
    }

    .layout-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .dropdown-menu {
      position: fixed;
      top: auto;
      bottom: 1rem;
      left: 1rem;
      right: 1rem;
      max-width: none;
    }

    .modal {
      margin: 0.5rem;
      max-width: none;
    }
  }
</style>