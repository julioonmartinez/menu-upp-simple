<script lang="ts">
  // Componente de prueba para verificar variables CSS
  import { onMount } from 'svelte';
  
  let primaryColor = '';
  let bgPrimary = '';
  let textPrimary = '';
  
  onMount(() => {
    // Obtener valores de las variables CSS
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    primaryColor = computedStyle.getPropertyValue('--primary-color').trim();
    bgPrimary = computedStyle.getPropertyValue('--bg-primary').trim();
    textPrimary = computedStyle.getPropertyValue('--text-primary').trim();
    
    console.log('🔍 Variables CSS detectadas:');
    console.log('--primary-color:', primaryColor);
    console.log('--bg-primary:', bgPrimary);
    console.log('--text-primary:', textPrimary);
  });
</script>

<div class="css-test">
  <h3>🔍 Test de Variables CSS</h3>
  
  <div class="test-grid">
    <div class="test-item">
      <h4>Primary Color</h4>
      <div class="color-box primary-color"></div>
      <p>Valor: {primaryColor || 'No detectado'}</p>
    </div>
    
    <div class="test-item">
      <h4>Background Primary</h4>
      <div class="color-box bg-primary"></div>
      <p>Valor: {bgPrimary || 'No detectado'}</p>
    </div>
    
    <div class="test-item">
      <h4>Text Primary</h4>
      <div class="color-box text-primary"></div>
      <p>Valor: {textPrimary || 'No detectado'}</p>
    </div>
  </div>
  
  <div class="test-buttons">
    <button class="btn btn-primary">Botón Primary</button>
    <button class="btn btn-secondary">Botón Secondary</button>
  </div>
  
  <div class="test-card">
    <h4>Card de Prueba</h4>
    <p>Este es un texto de prueba usando las variables globales.</p>
  </div>
</div>

<style>
  .css-test {
    padding: var(--spacing-2xl);
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    margin: var(--spacing-lg);
  }
  
  .test-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-lg);
    margin: var(--spacing-lg) 0;
  }
  
  .test-item {
    text-align: center;
    padding: var(--spacing-lg);
    background: var(--bg-primary);
    border-radius: var(--radius-md);
    border: 1px solid var(--bg-accent);
  }
  
  .color-box {
    width: 60px;
    height: 60px;
    border-radius: var(--radius-md);
    margin: 0 auto var(--spacing-sm);
    border: 2px solid var(--bg-accent);
  }
  
  .color-box.primary-color {
    background-color: var(--primary-color);
  }
  
  .color-box.bg-primary {
    background-color: var(--bg-primary);
    border: 2px solid var(--text-primary);
  }
  
  .color-box.text-primary {
    background-color: var(--text-primary);
  }
  
  .test-buttons {
    display: flex;
    gap: var(--spacing-md);
    margin: var(--spacing-lg) 0;
    justify-content: center;
  }
  
  .test-card {
    background: var(--bg-primary);
    padding: var(--spacing-xl);
    border-radius: var(--radius-lg);
    border: 1px solid var(--bg-accent);
    box-shadow: var(--shadow-sm);
  }
  
  .test-card h4 {
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
  }
  
  .test-card p {
    color: var(--text-secondary);
  }
</style> 