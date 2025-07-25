<script>
  import { createEventDispatcher, onDestroy } from 'svelte';
  export let label = '';
  export let currentImage = '';
  export let uploading = false;

  const dispatch = createEventDispatcher();
  let fileInput;
  let previewUrl = '';
  let dragActive = false;

  function handleFile(files) {
    if (files && files[0]) {
      const file = files[0];
      previewUrl = URL.createObjectURL(file);
      dispatch('fileSelected', { file });
    }
  }

  function onInput(e) {
    handleFile(e.target.files);
    e.target.value = '';
  }

  function onDrop(e) {
    e.preventDefault();
    dragActive = false;
    handleFile(e.dataTransfer.files);
  }

  function onDragOver(e) {
    e.preventDefault();
    dragActive = true;
  }

  function onDragLeave(e) {
    e.preventDefault();
    dragActive = false;
  }

  function removeImage() {
    previewUrl = '';
    dispatch('fileSelected', { file: null });
    dispatch('remove');
  }

  $: showImage = previewUrl || currentImage;

  function onUploaderClick(e) {
    if (!showImage && !uploading) {
      fileInput.click();
    }
  }

  function onRemoveBtnClick(e) {
    e.stopPropagation();
    removeImage();
  }

  onDestroy(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  });
</script>

<style>
.mini-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid var(--bg-accent);
  border-radius: 8px;
  padding: 0.7rem 0.5rem;
  width: 120px;
  background: var(--bg-secondary);
  position: relative;
}
.mini-uploader.drag {
  border-color: var(--info);
  background: var(--info-bg);
}
.mini-thumb {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.2rem;
}
.mini-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0,0,0,0.5);
  color: var(--text-inverse);
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.label {
  font-size: 0.9em;
  color: var(--text-muted);
  margin-bottom: 0.2rem;
}
input[type="file"] {
  display: none;
}
.upload-btn {
  font-size: 0.85em;
  color: var(--info);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-top: 0.1rem;
}
</style>

<div class="mini-uploader {dragActive ? 'drag' : ''}"
     on:dragover={onDragOver}
     on:dragleave={onDragLeave}
     on:drop={onDrop}
     on:click={onUploaderClick}>
  <div class="label">{label}</div>
  <div class="mini-thumb">
    {#if showImage}
      <img src={showImage} alt="preview" />
      <button class="remove-btn" type="button" on:click={onRemoveBtnClick} title="Eliminar">×</button>
    {:else}
      <span style="color:var(--text-light);font-size:1.5em;">+</span>
    {/if}
  </div>
  <input type="file" accept="image/*" on:change={onInput} bind:this={fileInput} />
  {#if !showImage}
    <button class="upload-btn" type="button" on:click={(e) => { e.stopPropagation(); fileInput.click(); }} disabled={uploading}>
      {uploading ? 'Cargando...' : 'Subir imagen'}
    </button>
  {/if}
</div> 