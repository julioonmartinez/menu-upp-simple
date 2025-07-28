<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let label = '';
  export let currentImage: string | null | undefined = null;
  export let accept = 'image/*';
  export let maxSize = 5; // MB
  export let width: number | string | null | undefined = 96;
  export let height: number | string | null | undefined = 96;
  export let required = false;
  export let disabled = false;
  export let uploading = false;
  export let error = '';

  const dispatch = createEventDispatcher();
  let fileInput: HTMLInputElement;
  let previewUrl: string | null | undefined = currentImage;

  $: previewUrl = currentImage;

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) dispatch('fileSelected', { file });
  }

  function triggerFileInput() {
    if (!disabled && fileInput) fileInput.click();
  }

  function removeImage() {
    dispatch('remove');
  }
</script>

<div class="compact-image-card">
  <div class="image-container" style="width: {width}px; height: {height}px;">
    {#if previewUrl}
      <img src={previewUrl} alt="Preview" class="image-preview" />
    {:else}
      <div class="image-placeholder">+</div>
    {/if}
    <div class="actions-compact-image-card">
      <button type="button" class="action-btn-compact-image-card" aria-label="Cambiar imagen" on:click={triggerFileInput} disabled={disabled || uploading}>
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
      </button>
      {#if previewUrl}
        <button type="button" class="action-btn-compact-image-card remove" aria-label="Eliminar imagen" on:click={removeImage} disabled={disabled || uploading}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      {/if}
    </div>
    {#if uploading}
      <div class="upload-progress"><div class="spinner"></div></div>
    {/if}
    <input
      bind:this={fileInput}
      type="file"
      {accept}
      on:change={handleFileSelect}
      style="display: none;"
      {disabled}
    />
  </div>
  <div class="label">{label}{#if required}<span class="required">*</span>{/if}</div>
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
</div>

<style>
  .compact-image-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    min-width: 96px;
    max-width: 120px;
  }
  .image-container {
    position: relative;
    border: 1.5px solid var(--bg-accent, #e5e7eb);
    border-radius: 1rem;
    background: var(--bg-primary, #fff);
    overflow: hidden;
    width: 96px;
    height: 96px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.04));
  }
  .image-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 1rem;
  }
  .image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    color: var(--text-muted, #9ca3af);
    background: var(--bg-accent, #f3f4f6);
    border-radius: 1rem;
  }
  .actions-compact-image-card {
    position: absolute;
    bottom: 0.25rem;
    right: 0.25rem;
    display: flex;
    gap: 0.25rem;
    z-index: 2;
  }
  .action-btn-compact-image-card {
    background: var(--bg-primary, #fff);
    border: 1px solid var(--bg-accent, #e5e7eb);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.2s, border 0.2s;
    box-shadow: var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.04));
  }
  .action-btn-compact-image-card.remove {
    background: var(--error, #fee2e2);
    color: var(--error-dark, #b91c1c);
    border-color: var(--error, #fee2e2);
  }
  .action-btn-compact-image-card:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .upload-progress {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;
    border-radius: 1rem;
  }
  .spinner {
    width: 1.5rem;
    height: 1.5rem;
    border: 2px solid transparent;
    border-bottom: 2px solid var(--primary-color, #3b82f6);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .label {
    font-size: 0.95rem;
    color: var(--text-primary, #111827);
    text-align: center;
    font-weight: 500;
  }
  .required {
    color: var(--error, #ef4444);
    margin-left: 0.15em;
  }
  .error-message {
    color: var(--error, #ef4444);
    font-size: 0.85rem;
    text-align: center;
    margin-top: 0.15em;
  }
  @media (max-width: 640px) {
    .compact-image-card {
      min-width: 80px;
      max-width: 100px;
    }
    .image-container {
      width: 80px;
      height: 80px;
    }
  }
</style> 