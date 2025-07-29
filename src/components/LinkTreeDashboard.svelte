<!-- src/components/LinkTreeDashboard.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import type { LinkTree, Link, LinkTreeAnalytics } from '../interfaces/links.ts';
  import type { Restaurant } from '../interfaces/restaurant.ts';
  import { 
    formatClickCount, 
    getLinkTreePublicUrl,
    getActiveLinks,
    groupLinksByType,
    LINK_TYPE_LABELS 
  } from '../interfaces/links.ts';
  import { useLinkTrees } from '../stores/linkTreeStore.ts';
  import { useRestaurants } from '../stores/restaurantStore.ts';
  import { toastStore } from '../stores/toastStore.ts';
  import LinkManager from './LinkManager.svelte';
  import Modal from './ui/Modal.svelte';
  import ConfirmationModal from './ui/ConfirmationModal.svelte';
  import LinkTreeForm from './LinkTreeForm.svelte';
  import GlobalModal from './ui/GlobalModal.svelte';
  import type { ApiResult } from '../services/linkTreeService.ts';
  import LoadingSpinner from './ui/LoadingSpinner.svelte';

  // Props
  const { restaurantId= null } = $props<{
    restaurantId: string;
    // linkTree?: LinkTree | null;
  }>();

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Svelte 5 state
  // Eliminado showShareModal
  let showEditModal = $state(false);
  let loadResult = $state<ApiResult<LinkTree | null> | null>(null);
  let isInitialLoading = $state(true);
  let linkTree: LinkTree | null = $state(null);
  
  // Stores - Usando directamente los stores reactivos
  const {
    currentLinkTree: currentLinkTreeStore,
    currentAnalytics: currentAnalyticsStore,
    isLoadingCurrent: isLoadingCurrentStore,
    isLoadingAnalytics: isLoadingAnalyticsStore,
    isDeleting: isDeletingStore,
    isUpdating: isUpdatingStore,
    error: errorStore,
    updateError: updateErrorStore,
    loadLinkTreeByRestaurant,
    loadAnalytics,
    deleteLinkTree,
    createLinkTree,
    updateLinkTree
  } = useLinkTrees();

  const {
    currentRestaurant: currentRestaurantStore,
    isLoading: isLoadingRestaurantStore,
    error: restaurantErrorStore,
    loadRestaurant
  } = useRestaurants();

  // Estados derivados usando los stores reactivos
  let currentLinkTree = $derived(linkTree || $currentLinkTreeStore);
  let currentRestaurant = $derived($currentRestaurantStore || loadResult?.restaurant || null);
  let currentAnalytics = $derived($currentAnalyticsStore);
  
  // Estados de loading usando stores reactivos
  let isLoadingData = $derived($isLoadingCurrentStore || $isLoadingRestaurantStore);
  let isLoadingAnalytics = $derived($isLoadingAnalyticsStore);
  
  // Errores usando stores reactivos
  let errorMessage = $derived($errorStore || $restaurantErrorStore);

  // Estado de la aplicación - SIMPLIFICADO
  let appState = $derived.by(() => {
    // Si estamos en carga inicial o cargando datos
    if (isInitialLoading || isLoadingData) {
      return 'loading';
    }

    // Si hay un resultado de carga y falló
    if (loadResult && !loadResult.success) {
      if (loadResult.errorType === 'RESTAURANT_NOT_FOUND') return 'restaurant_not_found';
      if (loadResult.errorType === 'PERMISSION_DENIED') return 'permission_denied';
      if (loadResult.errorType === 'NETWORK_ERROR') return 'network_error';
      return 'unknown_error';
    }

    // Si tenemos resultado exitoso pero sin LinkTree
    if (loadResult && loadResult.success && loadResult.data === null) {
      return 'no_linktree';
    }

    // Si tenemos LinkTree y restaurante
    if (currentLinkTree && currentRestaurant) {
      return 'dashboard';
    }

    // Si no tenemos LinkTree pero sí restaurante
    if (!currentLinkTree && currentRestaurant) {
      return 'no_linktree';
    }

    // Estado por defecto
    return 'loading';
  });

  // Estados derivados para el LinkTree
  let publicUrl = $derived(currentLinkTree ? getLinkTreePublicUrl(currentLinkTree) : '');
  let safeLinks = $derived(currentLinkTree && Array.isArray(currentLinkTree.links) ? currentLinkTree.links : []);
  let totalLinks = $derived(safeLinks.length);
  let activeLinkCount = $derived(currentLinkTree ? getActiveLinks(safeLinks).length : 0);

  // onMount
  onMount(async () => {
    await loadAllData();
  });

  // Función principal para cargar datos
  async function loadAllData() {
    try {
      isInitialLoading = true;
      
      // 1. Cargar restaurante
      await loadRestaurantData();
      
      // 2. Cargar LinkTree solo si no viene como prop
      if (!linkTree) {
        await loadLinkTreeData();
      }
      
      // 3. Cargar analytics si tenemos LinkTree
      if (currentLinkTree) {
        await loadAnalyticsData();
      }
      
    } catch (error) {
      // error handling
    } finally {
      isInitialLoading = false;
    }
  }

  // Loaders individuales
  async function loadRestaurantData() {
    try {
      await loadRestaurant(restaurantId);
    } catch (err) {
      // error handling
    }
  }

  async function loadLinkTreeData() {
    try {
      const result = await loadLinkTreeByRestaurant(restaurantId);
      loadResult = result;
     if(result.data){
       linkTree = result.data
     }
    } catch (err) {
      loadResult = {
        success: false,
        error: err instanceof Error ? err.message : 'Error desconocido',
        errorType: 'NETWORK_ERROR'
      };
    }
  }

  async function loadAnalyticsData() {
    if (!currentLinkTree?.id) return;
    try {
      await loadAnalytics(currentLinkTree.id);
    } catch (err) {
      // error handling
    }
  }

  async function handleLinkChanged() {
    await loadLinkTreeData();
    await loadAnalyticsData();
  }

  // Actions
  function handleEditLinkTree() {
    if (currentLinkTree) {
      showEditModal = true;
    }
  }

  // Manejar éxito del formulario de LinkTree
  async function handleLinkTreeSuccess(updatedLinkTree: LinkTree) {
    // Actualizar el estado local
    linkTree = updatedLinkTree;
    
    // Recargar datos para asegurar sincronización
    await loadLinkTreeData();
    await loadAnalyticsData();
    
    // Toast de éxito
    toastStore.success('LinkTree actualizado correctamente');
    
    // Cerrar modal
    showEditModal = false;
  }

  // Manejar la cancelación del formulario
  function handleFormCancel() {
    showEditModal = false;
  }

  // Manejar subida de imágenes
  function handleImageUpload(event: CustomEvent ) {
    // Eliminado log de subida de imagen
  }

  async function handleCreateLinkTree() {
    try {
      if (!currentRestaurant) {
        toastStore.error('Error: No se pudieron cargar los datos del restaurante');
        return;
      }
      
      const linkTreeData  = {
        restaurantId,
        customSlug: currentRestaurant.username,
        title: `${currentRestaurant.name} - Enlaces`,
        description: `Encuentra todos los enlaces de ${currentRestaurant.name}`,
        isPublic: true
      };
      
      const result = await createLinkTree(linkTreeData);
      
      if (result.success && result.linkTree) {
        // Actualizar el estado local
        linkTree = result.linkTree;
        await loadLinkTreeData();
        
        // Toast de éxito
        toastStore.success('LinkTree creado correctamente');
      } else {
        toastStore.error(result.error || 'No se pudo crear el LinkTree');
      }
    } catch (err) {
      toastStore.error('Error creando LinkTree');
    }
  }

  // Eliminada lógica de compartir/copyToClipboard

  let analyticsSummary = $derived.by(() => {
    if (!currentAnalytics) return null;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const todayViews = currentAnalytics.views.daily.find(d => d.date === today)?.count || 0;
    const yesterdayViews = currentAnalytics.views.daily.find(d => d.date === yesterday)?.count || 0;
    const todayClicks = currentAnalytics.clicks.daily.find(d => d.date === today)?.count || 0;
    const yesterdayClicks = currentAnalytics.clicks.daily.find(d => d.date === yesterday)?.count || 0;
    return {
      todayViews,
      yesterdayViews,
      todayClicks,
      yesterdayClicks,
      viewsChange: yesterdayViews > 0 ? ((todayViews - yesterdayViews) / yesterdayViews * 100) : 0,
      clicksChange: yesterdayClicks > 0 ? ((todayClicks - yesterdayClicks) / yesterdayClicks * 100) : 0
    };
  });


</script>

<div class="container mx-auto p-lg md:p-xl">
  <!-- Loading State -->
  {#if appState === 'loading'}
    <div class="loading-state">
      <LoadingSpinner />
    </div>
  
  <!-- Restaurant Not Found -->
  {:else if appState === 'restaurant_not_found'}
    <div class="error-state">
      <div class="text-6xl mb-md">🏪</div>
      <h3 class="text-xl font-semibold mb-xs text-primary">Restaurante No Encontrado</h3>
      <p class="text-muted mb-xs">No se encontró el restaurante con el ID especificado.</p>
      <p class="text-light text-sm mb-md">ID: {restaurantId}</p>
      <button class="btn btn-primary" on:click={loadAllData}>
        Reintentar
      </button>
    </div>
  
  <!-- Permission Denied -->
  {:else if appState === 'permission_denied'}
    <div class="error-state">
      <div class="text-6xl mb-md">🔒</div>
      <h3 class="text-xl font-semibold mb-xs" style="color: var(--error);">Sin Permisos</h3>
      <p class="text-muted mb-md">No tienes permisos para ver este LinkTree.</p>
      <button class="btn btn-primary" on:click={() => window.history.back()}>
        Volver
      </button>
    </div>
  
  <!-- Network Error -->
  {:else if appState === 'network_error'}
    <div class="error-state">
      <div class="text-6xl mb-md">🌐</div>
      <h3 class="text-xl font-semibold mb-xs" style="color: var(--error);">Error de Conexión</h3>
      <p class="text-muted mb-md">No se pudo conectar con el servidor. Verifica tu conexión a internet.</p>
      <button class="btn btn-primary" on:click={loadAllData}>
        Reintentar
      </button>
    </div>
  
  <!-- Unknown Error -->
  {:else if appState === 'unknown_error'}
    <div class="error-state">
      <div class="text-6xl mb-md">⚠️</div>
      <h3 class="text-xl font-semibold mb-xs" style="color: var(--error);">Error</h3>
      <p class="text-muted mb-md">{loadResult?.error || 'Ha ocurrido un error desconocido'}</p>
      <button class="btn btn-primary" on:click={loadAllData}>
        Reintentar
      </button>
    </div>
  
  <!-- No LinkTree State -->
  {:else if appState === 'no_linktree'}
    <div class="empty-state">
      <div class="text-6xl mb-md">🔗</div>
      <h3 class="text-xl font-semibold mb-xs text-primary">No tienes un LinkTree</h3>
      <p class="text-muted mb-md">Crea tu primera página de enlaces para <strong>{currentRestaurant?.name}</strong> y comparte todos tus links importantes en un solo lugar.</p>
      <div class="bg-tertiary border rounded-lg p-md mb-lg">
        <p class="text-sm font-medium mb-xs"><strong>Tu LinkTree será creado con la URL:</strong></p>
        <code class="url-preview">/{currentRestaurant?.username}</code>
      </div>
      <button class="btn btn-primary" on:click={handleCreateLinkTree}>
        <i class="icon-plus"></i>
        Crear LinkTree para {currentRestaurant?.name}
      </button>
    </div>
  
  <!-- Dashboard Content -->
  {:else if appState === 'dashboard'}
    <!-- Header -->
    <div class="dashboard-header">
      <div class="dashboard-header-content">
        <div class="flex justify-between items-start gap-xl flex-col md:flex-row">
          <div class="flex-1">
            <div class="flex items-center gap-md mb-xs">
              <h1 class="text-2xl md:text-3xl font-bold text-primary m-0">{currentLinkTree?.title || `${currentRestaurant?.name} - Enlaces`}</h1>
              <span class="status-badge" class:public={currentLinkTree?.isPublic} class:private={!currentLinkTree?.isPublic}>
                {currentLinkTree?.isPublic ? 'Público' : 'Privado'}
              </span>
            </div>
            
            {#if currentLinkTree?.description}
              <p class="text-muted mb-md leading-relaxed">{currentLinkTree.description}</p>
            {/if}
            
            <div class="meta-info">
              <span class="meta-item">
                <i class="icon-link"></i>
                {activeLinkCount} de {totalLinks} enlaces activos
              </span>
              <span class="meta-item">
                <i class="icon-store"></i>
                Restaurante: {currentRestaurant?.name}
              </span>
              {#if publicUrl}
                <span class="meta-item">
                  <i class="icon-globe"></i>
                  <a href={publicUrl} target="_blank" rel="noopener" class="text-accent">{publicUrl}</a>
                </span>
              {/if}
            </div>
          </div>
          
          <div class="flex gap-xs flex-shrink-0">
            <button class="btn btn-primary" on:click={handleEditLinkTree}>
              <i class="icon-edit"></i>
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Solo sección de Enlaces -->
    <div class="tab-content">
      <LinkManager 
        linkTreeId={currentLinkTree?.id!}
        links={safeLinks.slice() }
        editable={true}
        showAnalytics={true}
        restaurantUsername={currentRestaurant?.username || ''}
        on:linkCreated={handleLinkChanged}
        on:linkUpdated={handleLinkChanged}
        on:linkDeleted={handleLinkChanged}
      />
    </div>

  <!-- Estado inesperado -->
  {:else}
    <div class="error-state">
      <div class="text-6xl mb-md">❓</div>
      <h3 class="text-xl font-semibold mb-xs" style="color: var(--error);">Estado Inesperado</h3>
      <p class="text-muted mb-md">El componente está en un estado inesperado: <code>{appState}</code></p>
      <button class="btn btn-primary" on:click={loadAllData}>
        Recargar
      </button>
      <details class="mt-lg text-xs text-muted">
        <summary>Debug Info</summary>
        <pre class="text-left mt-xs">{JSON.stringify({
          appState,
          currentLinkTree: !!currentLinkTree,
          currentRestaurant: !!currentRestaurant,
          isInitialLoading,
          isLoadingData,
          loadResult
        }, null, 2)}</pre>
      </details>
    </div>
  {/if}
</div>

<!-- Modal de Edición del LinkTree -->
<GlobalModal 
  isOpen={showEditModal} 
  title="Editar LinkTree" 
  size="lg"
  on:close={handleFormCancel}
>
  <LinkTreeForm 
    linkTreeId={linkTree?.id}
    restaurantId={restaurantId}
    onSuccess={handleLinkTreeSuccess}
    onCancel={handleFormCancel}
  />
</GlobalModal>

<!-- Eliminado Share Modal -->

<style>
  /* ========================================
     ESTILOS ESPECÍFICOS DEL COMPONENTE
     Usando variables globales donde sea posible
     ======================================== */

  /* URL Preview - estilo específico */
  .url-preview {
    background: var(--bg-tertiary);
    color: var(--primary-color);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono, monospace);
    font-weight: var(--weight-semibold);
    font-size: var(--font-sm);
  }

  /* Status Badge - componente específico */
  .status-badge {
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: var(--radius-full);
    font-size: var(--font-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-badge.public {
    background: var(--success-bg);
    color: var(--success);
  }

  .status-badge.private {
    background: var(--warning-bg);
    color: var(--warning);
  }

  /* Dashboard Header - Rediseñado con concepto moderno */
  .dashboard-header {
    background: linear-gradient(135deg, #fafbfc, #f8fafc);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-lg);
    padding: var(--spacing-3xl);
    margin-bottom: var(--spacing-3xl);
    border: 1px solid var(--bg-accent);
    position: relative;
    overflow: hidden;
  }

  .dashboard-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    opacity: 0.7;
  }

  .dashboard-header-content {
    position: relative;
    z-index: 1;
  }

  /* Meta Info - Mejorado */
  .meta-info {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-lg);
    font-size: var(--font-sm);
    color: var(--text-secondary);
    margin-top: var(--spacing-lg);
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--bg-tertiary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--bg-accent);
    transition: all var(--transition-normal);
  }

  .meta-item:hover {
    background: var(--bg-primary);
    border-color: var(--primary-color);
    transform: translateY(-1px);
  }

  /* Dashboard Tabs - Rediseñado */
  .dashboard-tabs {
    display: flex;
    background: var(--bg-primary);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    padding: var(--spacing-sm);
    margin-bottom: var(--spacing-2xl);
    border: 1px solid var(--bg-accent);
  }

  .tab {
    flex: 1;
    padding: var(--spacing-md) var(--spacing-lg);
    border: none;
    background: transparent;
    color: var(--text-muted);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: var(--transition-normal);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    font-weight: var(--weight-medium);
    font-size: var(--font-base);
    position: relative;
  }

  .tab:hover {
    color: var(--text-primary);
    background: var(--bg-tertiary);
    transform: translateY(-1px);
  }

  .tab.active {
    background: var(--primary-color);
    color: var(--text-inverse);
    box-shadow: var(--shadow-sm);
  }

  .tab.active::before {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 3px;
    background: var(--primary-color);
    border-radius: var(--radius-sm);
  }

  /* Tab Content - Mejorado */
  /* .tab-content {
    background: var(--bg-primary);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    border: 1px solid var(--bg-accent);
    transition: all var(--transition-normal);
  }

  .tab-content:hover {
    box-shadow: var(--shadow-xl);
    border-color: rgba(255, 107, 53, 0.2);
  } */

  /* Stats Overview - Rediseñado con concepto moderno */
  .stats-overview {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-2xl);
  }

  @media (min-width: 768px) {
    .stats-overview {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .stat-card {
    background: linear-gradient(135deg, #fafbfc, #f8fafc);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    padding: var(--spacing-xl);
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    transition: all var(--transition-normal);
    position: relative;
    overflow: hidden;
  }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--primary-gradient);
    transform: scaleX(0);
    transition: transform var(--transition-normal);
  }

  .stat-card:hover::before {
    transform: scaleX(1);
  }

  .stat-card:hover {
    box-shadow: var(--shadow-xl);
    transform: translateY(-4px);
    border-color: var(--primary-color);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-inverse);
    font-size: var(--font-lg);
    position: relative;
  }

  .stat-card.visits .stat-icon { 
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
  }
  .stat-card.clicks .stat-icon { 
    background: linear-gradient(135deg, var(--success), var(--success-light));
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  }
  .stat-card.visitors .stat-icon { 
    background: linear-gradient(135deg, var(--warning), #fbbf24);
    box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
  }
  .stat-card.links .stat-icon { 
    background: linear-gradient(135deg, var(--info), #60a5fa);
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: var(--font-2xl);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
    line-height: var(--leading-tight);
  }

  .stat-label {
    color: var(--text-secondary);
    font-size: var(--font-sm);
    margin-bottom: var(--spacing-xs);
    font-weight: var(--weight-medium);
  }

  .stat-change {
    font-size: var(--font-xs);
    font-weight: var(--weight-medium);
  }

  .stat-change.positive { color: var(--success); }
  .stat-change.negative { color: var(--error); }

  /* Popular Links Section - Rediseñado */
  .popular-links-section {
    margin-top: var(--spacing-2xl);
  }

  .popular-links {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .popular-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--bg-accent);
    transition: all var(--transition-normal);
    position: relative;
    overflow: hidden;
  }

  .popular-link::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--primary-color);
    transform: scaleY(0);
    transition: transform var(--transition-normal);
  }

  .popular-link:hover::before {
    transform: scaleY(1);
  }

  .popular-link:hover {
    background: var(--bg-tertiary);
    transform: translateX(4px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary-color);
  }

  .link-info {
    flex: 1;
  }

  .link-name {
    font-weight: var(--weight-medium);
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-base);
  }

  .click-count {
    font-size: var(--font-sm);
    color: var(--text-secondary);
  }

  .click-bar {
    width: 100px;
    height: 8px;
    background: var(--bg-accent);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .click-fill {
    height: 100%;
    background: var(--primary-color);
    transition: width var(--transition-normal);
  }

  /* Analytics Content - Rediseñado */
  .analytics-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xl);
  }

  .chart-section {
    background: linear-gradient(135deg, #fafbfc, #f8fafc);
    border-radius: var(--radius-xl);
    padding: var(--spacing-2xl);
    border: 1px solid var(--bg-accent);
    position: relative;
    overflow: hidden;
  }

  .chart-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    opacity: 0.7;
  }

  .chart-container {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    border: 1px solid var(--bg-accent);
  }

  .simple-chart {
    display: flex;
    justify-content: space-between;
    align-items: end;
    height: 200px;
    gap: var(--spacing-sm);
  }

  .chart-bar {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  .bar-fill {
    width: 100%;
    background: linear-gradient(to top, var(--primary-color), var(--primary-light));
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    min-height: 4px;
    margin-bottom: auto;
    transition: height var(--transition-normal);
    box-shadow: 0 2px 8px rgba(255, 107, 53, 0.2);
  }

  .bar-label {
    font-size: var(--font-xs);
    color: var(--text-secondary);
    margin-top: var(--spacing-sm);
    text-transform: uppercase;
    font-weight: var(--weight-medium);
  }

  .bar-value {
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    color: var(--text-primary);
    margin-top: var(--spacing-xs);
  }

  /* Estados - Rediseñados con concepto moderno */
  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-4xl);
    text-align: center;
    background: linear-gradient(135deg, #fafbfc, #f8fafc);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--bg-accent);
    min-height: 400px;
    position: relative;
    overflow: hidden;
  }

  .loading-state::before,
  .error-state::before,
  .empty-state::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    opacity: 0.7;
  }

  .loading-state .animate-spin {
    margin-bottom: var(--spacing-lg);
  }

  .error-state .text-6xl,
  .empty-state .text-6xl {
    margin-bottom: var(--spacing-lg);
    font-size: 4rem;
  }

  .error-state h3,
  .empty-state h3 {
    font-size: var(--font-xl);
    font-weight: var(--weight-bold);
    margin-bottom: var(--spacing-md);
    line-height: var(--leading-tight);
  }

  .error-state h3 {
    color: var(--error);
  }

  .empty-state h3 {
    color: var(--primary-color);
  }

  .error-state p,
  .empty-state p {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-lg);
    max-width: 500px;
    line-height: var(--leading-relaxed);
  }

  /* Modal Styles - Mejorados */
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
    z-index: var(--z-modal);
    padding: var(--spacing-lg);
    backdrop-filter: blur(4px);
  }

  .modal {
    background: var(--bg-primary);
    border-radius: var(--radius-2xl);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-2xl);
    border: 1px solid var(--bg-accent);
    position: relative;
    overflow: hidden;
  }

  .modal::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    opacity: 0.7;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-xl);
    border-bottom: 1px solid var(--bg-accent);
    position: relative;
    z-index: 1;
  }

  .modal-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: var(--spacing-sm);
    border-radius: var(--radius-sm);
    transition: var(--transition-normal);
  }

  .modal-close:hover {
    color: var(--text-primary);
    background: var(--bg-tertiary);
    transform: scale(1.1);
  }

  .modal-content {
    padding: var(--spacing-xl);
    position: relative;
    z-index: 1;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
    padding: var(--spacing-xl);
    border-top: 1px solid var(--bg-accent);
    position: relative;
    z-index: 1;
  }

  /* Share Modal específico - Mejorado */
  .share-section {
    margin-bottom: var(--spacing-xl);
  }

  .url-input {
    display: flex;
    gap: var(--spacing-sm);
  }

  .url-input input {
    flex: 1;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    padding: var(--spacing-md);
    transition: all var(--transition-normal);
  }

  .url-input input:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }

  .url-info {
    margin-top: var(--spacing-sm);
    font-size: var(--font-sm);
    color: var(--text-secondary);
  }

  .share-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--spacing-md);
  }

  .share-btn {
    padding: var(--spacing-md) var(--spacing-lg);
    border-radius: var(--radius-lg);
    text-decoration: none;
    color: var(--text-inverse);
    font-weight: var(--weight-medium);
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    transition: all var(--transition-normal);
    border: none;
    cursor: pointer;
  }

  .share-btn:hover {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .share-btn.twitter { 
    background: linear-gradient(135deg, #1da1f2, #0d8bd9);
  }
  .share-btn.facebook { 
    background: linear-gradient(135deg, #4267b2, #365899);
  }
  .share-btn.whatsapp { 
    background: linear-gradient(135deg, #25d366, #128c7e);
  }

  /* Responsive Overrides - Mejorados */
  @media (max-width: 768px) {
    .dashboard-header {
      padding: var(--spacing-2xl);
      margin-bottom: var(--spacing-2xl);
    }

    .meta-info {
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .meta-item {
      justify-content: center;
    }

    .dashboard-tabs {
      flex-direction: column;
    }

    .stats-overview {
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }

    .stat-card {
      padding: var(--spacing-lg);
    }

    .popular-link {
      flex-direction: column;
      align-items: stretch;
      text-align: center;
      gap: var(--spacing-md);
    }

    .modal {
      margin: var(--spacing-lg);
    }

    .share-buttons {
      grid-template-columns: 1fr;
    }

    .url-input {
      flex-direction: column;
    }

    .chart-section {
      padding: var(--spacing-xl);
    }

    .simple-chart {
      height: 150px;
    }
  }

  /* Estados usando el sistema global */
  .no-data {
    text-align: center;
    padding: var(--spacing-2xl);
    color: var(--text-secondary);
  }

  /* Botones danger - mejora específica */
  .btn-danger {
    background: var(--error);
    color: var(--text-inverse);
  }

  .btn-danger:hover:not(:disabled) {
    background: var(--error-light);
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
  }

  /* Accesibilidad */
  @media (prefers-reduced-motion: reduce) {
    .stat-card:hover,
    .popular-link:hover,
    .tab:hover,
    .meta-item:hover {
      transform: none;
    }

    .bar-fill {
      transition: none;
    }

    .modal-close:hover {
      transform: none;
    }
  }

  /* Dark mode - Aprovechando el sistema global */
  @media (prefers-color-scheme: dark) {
    .dashboard-header {
      background: linear-gradient(135deg, #1e293b, #334155);
    }

    .stat-card {
      background: linear-gradient(135deg, #1e293b, #334155);
    }

    .chart-section {
      background: linear-gradient(135deg, #1e293b, #334155);
    }

    .loading-state,
    .error-state,
    .empty-state {
      background: linear-gradient(135deg, #1e293b, #334155);
    }

    .chart-container {
      background: var(--bg-tertiary);
    }

    .url-input input {
      background: var(--bg-tertiary);
    }

    .meta-item {
      background: var(--bg-tertiary);
    }
  }
</style>