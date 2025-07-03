<!-- src/components/ui/ToastTest.svelte -->
<script>
  import { toastStore } from '../../stores/toastStore.ts';
  
  function showSuccessToast() {
    toastStore.success('¡Operación completada exitosamente! 🎉');
  }
  
  function showErrorToast() {
    toastStore.error('Ha ocurrido un error inesperado ❌');
  }
  
  function showInfoToast() {
    toastStore.info('Esta es una notificación informativa 💡');
  }
  
  function showLongToast() {
    toastStore.success('Este es un mensaje más largo para probar cómo se comporta el toast con contenido extenso. Debería ajustarse correctamente al espacio disponible.', 8000);
  }
</script>

<div class="toast-test-container">
  <h2>Prueba del Sistema de Notificaciones</h2>
  
  <div class="test-buttons">
    <button class="btn btn-success" on:click={showSuccessToast}>
      <i class="fa-solid fa-check"></i>
      Toast de Éxito
    </button>
    
    <button class="btn btn-error" on:click={showErrorToast}>
      <i class="fa-solid fa-times"></i>
      Toast de Error
    </button>
    
    <button class="btn btn-info" on:click={showInfoToast}>
      <i class="fa-solid fa-info"></i>
      Toast Informativo
    </button>
    
    <button class="btn btn-warning" on:click={showLongToast}>
      <i class="fa-solid fa-file-text"></i>
      Toast Largo
    </button>
  </div>
  
  <div class="test-info">
    <h3>Características a probar:</h3>
    <ul>
      <li>✅ Diferentes tipos de toast (success, error, info)</li>
      <li>✅ Auto-cierre después de 4 segundos</li>
      <li>✅ Pausa al hacer hover (desktop)</li>
      <li>✅ Barra de progreso visual</li>
      <li>✅ Botón de cerrar manual</li>
      <li>✅ Múltiples toasts simultáneos</li>
      <li>✅ Responsive design</li>
    </ul>
  </div>
</div>

<style>
  .toast-test-container {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .test-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin: 2rem 0;
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 150px;
    justify-content: center;
  }
  
  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .btn-success {
    background: #10b981;
    color: white;
  }
  
  .btn-error {
    background: #ef4444;
    color: white;
  }
  
  .btn-info {
    background: #3b82f6;
    color: white;
  }
  
  .btn-warning {
    background: #f59e0b;
    color: white;
  }
  
  .test-info {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.5rem;
    margin-top: 2rem;
  }
  
  .test-info h3 {
    margin: 0 0 1rem 0;
    color: #1e293b;
  }
  
  .test-info ul {
    margin: 0;
    padding-left: 1.5rem;
  }
  
  .test-info li {
    margin: 0.5rem 0;
    color: #475569;
  }
  
  @media (max-width: 640px) {
    .test-buttons {
      flex-direction: column;
    }
    
    .btn {
      width: 100%;
    }
  }
</style> 