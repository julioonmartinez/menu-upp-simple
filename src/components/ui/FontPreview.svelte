<!-- src/components/ui/FontPreview.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getFontUrl } from '../../utils/fontLoader';

  export let fontFamily: string;
  export let restaurantName: string = 'Nombre del Restaurante';
  export let description: string = 'Descripción del restaurante aparecerá aquí...';

  let fontUrl: string;

  onMount(() => {
    fontUrl = getFontUrl(fontFamily);
    
    // Crear link element para cargar la fuente
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    document.head.appendChild(link);
  });

  $: if (fontFamily) {
    fontUrl = getFontUrl(fontFamily);
  }
</script>

<div class="font-preview" style="font-family: '{fontFamily}', sans-serif">
  <h4 class="preview-title">Vista Previa de Fuente</h4>
  <h1 class="font-preview-h1">{restaurantName}</h1>
  <h2 class="font-preview-h2">Especialidades de la Casa</h2>
  <p class="font-preview-p">
    {description}
  </p>
  <div class="font-info">
    <span class="font-name">Fuente: {fontFamily}</span>
  </div>
</div>

<style>
  .font-preview {
    background-color: var(--bg-tertiary, #f8f9fa);
    border-radius: var(--radius-xl, 16px);
    padding: var(--spacing-2xl, 2rem);
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.08));
    margin-top: var(--spacing-lg, 1rem);
  }

  .preview-title {
    font-size: var(--font-lg, 1.125rem);
    font-weight: var(--weight-semibold, 600);
    color: var(--text-primary, #2c2c2c);
    margin: 0 0 var(--spacing-lg, 1rem) 0;
  }

  .font-preview-h1 {
    font-size: var(--font-4xl, 2.25rem);
    font-weight: var(--weight-bold, 700);
    margin: 0 0 var(--spacing-sm, 0.5rem) 0;
    color: var(--text-primary, #2c2c2c);
    line-height: var(--leading-tight, 1.25);
  }

  .font-preview-h2 {
    font-size: var(--font-2xl, 1.5rem);
    font-weight: var(--weight-semibold, 600);
    margin: 0 0 var(--spacing-lg, 1rem) 0;
    color: var(--text-secondary, #6b7280);
    line-height: var(--leading-snug, 1.375);
  }

  .font-preview-p {
    font-size: var(--font-base, 1rem);
    line-height: var(--leading-relaxed, 1.625);
    margin: 0 0 var(--spacing-lg, 1rem) 0;
    color: var(--text-secondary, #6b7280);
  }

  .font-info {
    border-top: 1px solid var(--bg-accent, #e5e7eb);
    padding-top: var(--spacing-md, 0.75rem);
    margin-top: var(--spacing-lg, 1rem);
  }

  .font-name {
    font-size: var(--font-sm, 0.875rem);
    color: var(--text-muted, #9ca3af);
    font-weight: var(--weight-medium, 500);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .font-preview {
      padding: var(--spacing-xl, 1.5rem);
    }

    .font-preview-h1 {
      font-size: var(--font-3xl, 1.875rem);
    }

    .font-preview-h2 {
      font-size: var(--font-xl, 1.25rem);
    }
  }
</style> 