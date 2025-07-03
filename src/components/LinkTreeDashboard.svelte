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

  // Props
  const { restaurantId= null } = $props<{
    restaurantId: string;
    // linkTree?: LinkTree | null;
  }>();

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Svelte 5 state
  let showDeleteConfirm = $state(false);
  let showShareModal = $state(false);
  let showEditModal = $state(false);
  let activeTab = $state('overview');
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
    console.log('🔄 Calculating appState:', {
      isInitialLoading,
      isLoadingData,
      loadResult: loadResult ? {
        success: loadResult.success,
        hasData: !!loadResult.data,
        hasRestaurant: !!loadResult.restaurant,
        errorType: loadResult.errorType
      } : null,
      currentLinkTree: !!currentLinkTree,
      currentRestaurant: !!currentRestaurant
    });

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
  let activeLinks = $derived(currentLinkTree ? getActiveLinks(safeLinks) : []);
  let linksByType = $derived(currentLinkTree ? groupLinksByType(safeLinks) : {});
  let totalLinks = $derived(safeLinks.length);
  let activeLinkCount = $derived(activeLinks.length);

  // onMount
  onMount(async () => {
    console.log('🚀 Component mounted, loading data...');
    await loadAllData();
  });

  // Función principal para cargar datos
  async function loadAllData() {
    try {
      isInitialLoading = true;
      
      // 1. Cargar restaurante
      console.log('📍 Loading restaurant:', restaurantId);
      await loadRestaurantData();
      
      // 2. Cargar LinkTree solo si no viene como prop
      if (!linkTree) {
        console.log('🔗 Loading LinkTree for restaurant:', restaurantId);
        await loadLinkTreeData();
      }
      
      // 3. Cargar analytics si tenemos LinkTree
      if (currentLinkTree) {
        console.log('📊 Loading analytics for LinkTree:', currentLinkTree.id);
        await loadAnalyticsData();
      }
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      isInitialLoading = false;
      console.log('✅ Initial loading complete');
    }
  }

  // Loaders individuales
  async function loadRestaurantData() {
    try {
      await loadRestaurant(restaurantId);
      console.log('✅ Restaurant loaded:', $currentRestaurantStore?.name);
    } catch (err) {
      console.error('❌ Error loading restaurant:', err);
    }
  }

  async function loadLinkTreeData() {
    try {
      const result = await loadLinkTreeByRestaurant(restaurantId);
      loadResult = result;
      console.log('📊 LinkTree load result:', {
        success: result.success,
        hasData: !!result.data,
        hasRestaurant: !!result.restaurant,
        errorType: result.errorType,
        result: result.data
      });
     if(result.data){
       linkTree = result.data
     }
    } catch (err) {
      console.error('❌ Error loading LinkTree:', err);
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
      console.log('📈 Analytics loaded');
    } catch (err) {
      console.error('❌ Error loading analytics:', err);
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
    console.log('✅ LinkTree updated successfully:', updatedLinkTree);
    
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
    console.log('Image upload:', event.detail);
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
      
      console.log('🆕 Creating LinkTree:', linkTreeData);
      const result = await createLinkTree(linkTreeData);
      
      if (result.success && result.linkTree) {
        console.log('✅ LinkTree created successfully');
        // Actualizar el estado local
        linkTree = result.linkTree;
        await loadLinkTreeData();
        
        // Toast de éxito
        toastStore.success('LinkTree creado correctamente');
      } else {
        toastStore.error(result.error || 'No se pudo crear el LinkTree');
      }
    } catch (err) {
      console.error('❌ Error creating LinkTree:', err);
      toastStore.error('Error creando LinkTree');
    }
  }

  async function handleDeleteLinkTree() {
    if (!currentLinkTree) return;
    showDeleteConfirm = false;
    try {
      const result = await deleteLinkTree(currentLinkTree.id!);
      if (result.success) {
        // Limpiar estado local
        linkTree = null;
        loadResult = {
          success: true,
          data: null,
          message: 'LinkTree eliminado correctamente'
        };
        dispatch('deleteLinkTree', currentLinkTree);
        
        // Toast de éxito
        toastStore.success('LinkTree eliminado correctamente');
      } else {
        // Toast de error si la operación falló
        toastStore.error(result.error || 'No se pudo eliminar el LinkTree');
      }
    } catch (err) {
      console.error('Error deleting LinkTree:', err);
      toastStore.error('Error al eliminar el LinkTree');
    }
  }

  function handleShare() {
    showShareModal = true;
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toastStore.success('¡Enlace copiado al portapapeles!');
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toastStore.success('¡Enlace copiado al portapapeles!');
    }
  }

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

  // Effect para debug (puedes comentar en producción)
  $effect(() => {
    console.log('🔄 Reactive state update:', {
      appState,
      currentLinkTree: !!currentLinkTree,
      currentRestaurant: !!currentRestaurant,
      isInitialLoading,
      isLoadingData,
      loadResult: loadResult ? {
        success: loadResult.success,
        hasData: !!loadResult.data,
        hasRestaurant: !!loadResult.restaurant,
        errorType: loadResult.errorType
      } : null
    });
  });

  // Effect para debug de links
  $effect(() => {
    console.log('🔗 Links updated:', {
      totalLinks,
      activeLinkCount,
      links: safeLinks.length,
      currentLinkTreeId: currentLinkTree?.id
    });
  });
</script>

<div class="container mx-auto p-lg md:p-xl">
  <!-- Loading State -->
  {#if appState === 'loading'}
    <div class="loading-state">
      <div class="animate-spin" style="width: 32px; height: 32px; border: 3px solid var(--bg-accent); border-top: 3px solid var(--primary-color); border-radius: 50%; margin-bottom: var(--spacing-md);"></div>
      <p class="text-muted">Cargando información...</p>
      <small class="text-light">Estado: {appState}</small>
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
      
      <!-- Debug info -->
      <details class="mt-lg text-xs text-muted">
        <summary>Debug Info</summary>
        <pre class="text-left mt-xs">{JSON.stringify({
          appState,
          hasCurrentRestaurant: !!currentRestaurant,
          restaurantName: currentRestaurant?.name,
          hasCurrentLinkTree: !!currentLinkTree,
          loadResultSuccess: loadResult?.success,
          loadResultData: loadResult?.data,
          hasLoadResultRestaurant: !!loadResult?.restaurant,
          isInitialLoading,
          isLoadingData
        }, null, 2)}</pre>
      </details>
    </div>
  
  <!-- Dashboard Content -->
  {:else if appState === 'dashboard'}
    <!-- Header -->
    <div class="dashboard-header">
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
          <button class="btn btn-secondary" on:click={handleShare}>
            <i class="icon-share"></i>
            Compartir
          </button>
          
          <button class="btn btn-primary" on:click={handleEditLinkTree}>
            <i class="icon-edit"></i>
            Editar
          </button>
          
          <button class="btn btn-danger" on:click={() => showDeleteConfirm = true}>
            <i class="icon-trash"></i>
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="dashboard-tabs">
      <button 
        class="tab"
        class:active={activeTab === 'overview'}
        on:click={() => activeTab = 'overview'}
      >
        <i class="icon-bar-chart"></i>
        Resumen
      </button>
      
      <button 
        class="tab"
        class:active={activeTab === 'links'}
        on:click={() => activeTab = 'links'}
      >
        <i class="icon-link"></i>
        Enlaces
      </button>
      
      <button 
        class="tab"
        class:active={activeTab === 'analytics'}
        on:click={() => activeTab = 'analytics'}
      >
        <i class="icon-trending-up"></i>
        Analíticas
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      {#if activeTab === 'overview'}
        <!-- Overview Tab -->
        <div class="p-2xl">
          <!-- Quick Stats -->
          <div class="stats-overview">
            <div class="stat-card visits">
              <div class="stat-icon">
                <i class="icon-eye"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{currentLinkTree?.analytics?.totalVisits || 0}</div>
                <div class="stat-label">Visitas Totales</div>
                {#if analyticsSummary}
                  <div class="stat-change" class:positive={(analyticsSummary.viewsChange || 0) > 0} class:negative={(analyticsSummary.viewsChange || 0) < 0}>
                    {(analyticsSummary.viewsChange || 0) > 0 ? '+' : ''}{analyticsSummary.viewsChange.toFixed(1)}% vs ayer
                  </div>
                {/if}
              </div>
            </div>
            
            <div class="stat-card clicks">
              <div class="stat-icon">
                <i class="icon-mouse-pointer"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{currentLinkTree?.analytics?.totalClicks || 0}</div>
                <div class="stat-label">Clics Totales</div>
                {#if analyticsSummary}
                  <div class="stat-change" class:positive={analyticsSummary.clicksChange > 0} class:negative={analyticsSummary.clicksChange < 0}>
                    {analyticsSummary.clicksChange > 0 ? '+' : ''}{analyticsSummary.clicksChange.toFixed(1)}% vs ayer
                  </div>
                {/if}
              </div>
            </div>
            
            <div class="stat-card visitors">
              <div class="stat-icon">
                <i class="icon-users"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{currentLinkTree?.analytics?.uniqueVisitors || 0}</div>
                <div class="stat-label">Visitantes Únicos</div>
              </div>
            </div>
            
            <div class="stat-card links">
              <div class="stat-icon">
                <i class="icon-link"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{activeLinkCount}</div>
                <div class="stat-label">Enlaces Activos</div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="popular-links-section">
            <h3 class="text-lg font-semibold mb-lg text-primary">Enlaces Populares</h3>
            {#if (currentAnalytics?.clicks.byLink.length || 0) > 0}
              <div class="popular-links">
                {#each (currentAnalytics?.clicks.byLink || []).slice(0, 5) as linkStat}
                  <div class="popular-link">
                    <div class="link-info">
                      <div class="link-name">{linkStat.linkTitle}</div>
                      <div class="click-count">{formatClickCount(linkStat.count)} clics</div>
                    </div>
                    <div class="click-bar">
                      <div 
                        class="click-fill" 
                        style="width: {(linkStat.count / Math.max(...(currentAnalytics?.clicks.byLink || []).map((l: any) => l.count))) * 100}%"
                      ></div>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="no-data">
                <p class="text-muted">No hay datos de clics disponibles aún.</p>
              </div>
            {/if}
          </div>
        </div>
      
      {:else if activeTab === 'links'}
        <!-- Links Tab -->
        <div class="">
          <LinkManager 
            linkTreeId={currentLinkTree?.id!}
            links={safeLinks.slice() }
            editable={true}
            showAnalytics={true}
            on:linkCreated={handleLinkChanged}
            on:linkUpdated={handleLinkChanged}
            on:linkDeleted={handleLinkChanged}
          />
        </div>
      
      {:else if activeTab === 'analytics'}
        <!-- Analytics Tab -->
        <div class="p-2xl">
          {#if isLoadingAnalytics}
            <div class="loading-state">
              <div class="animate-spin" style="width: 32px; height: 32px; border: 3px solid var(--bg-accent); border-top: 3px solid var(--primary-color); border-radius: 50%; margin-bottom: var(--spacing-md);"></div>
              <p class="text-muted">Cargando analíticas...</p>
            </div>
          {:else if currentAnalytics}
            <div class="analytics-content">
              <div class="chart-section">
                <h3 class="text-lg font-semibold mb-md text-primary">Visitas por Día</h3>
                <div class="chart-container">
                  {#if currentAnalytics?.views.daily && currentAnalytics.views.daily.length > 0}
                    <div class="simple-chart">
                      {#each currentAnalytics.views.daily.slice(-7) as day}
                        <div class="chart-bar">
                          <div 
                            class="bar-fill" 
                            style="height: {(day.count / Math.max(...currentAnalytics.views.daily.map((d: any) => d.count))) * 100}%"
                          ></div>
                          <div class="bar-label">{new Date(day.date).toLocaleDateString('es', { weekday: 'short' })}</div>
                          <div class="bar-value">{day.count}</div>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <div class="no-data">
                      <p class="text-muted">No hay datos de visitas disponibles.</p>
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Clicks Chart -->
              <div class="chart-section">
                <h3 class="text-lg font-semibold mb-md text-primary">Clics por Día</h3>
                <div class="chart-container">
                  {#if currentAnalytics?.clicks.daily && currentAnalytics.clicks.daily.length > 0}
                    <div class="simple-chart">
                      {#each currentAnalytics.clicks.daily.slice(-7) as day}
                        <div class="chart-bar">
                          <div 
                            class="bar-fill" 
                            style="height: {(day.count / Math.max(...currentAnalytics.clicks.daily.map((d: any) => d.count))) * 100}%"
                          ></div>
                          <div class="bar-label">{new Date(day.date).toLocaleDateString('es', { weekday: 'short' })}</div>
                          <div class="bar-value">{day.count}</div>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <div class="no-data">
                      <p class="text-muted">No hay datos de clics disponibles.</p>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {:else}
            <div class="no-data">
              <p class="text-muted mb-md">No se pudieron cargar las analíticas.</p>
              <button class="btn btn-primary" on:click={loadAnalyticsData}>
                Reintentar
              </button>
            </div>
          {/if}
        </div>
      {/if}
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

<!-- Delete Confirmation Modal -->
<ConfirmationModal 
  isOpen={showDeleteConfirm}
  title="Confirmar Eliminación"
  message={currentRestaurant 
    ? `¿Estás seguro de que quieres eliminar este LinkTree?\n\nEsta acción no se puede deshacer.\n\nSe eliminará el LinkTree de ${currentRestaurant.name} con URL: /${currentRestaurant.username}`
    : "¿Estás seguro de que quieres eliminar este LinkTree?\n\nEsta acción no se puede deshacer."
  }
  confirmText="Eliminar LinkTree"
  cancelText="Cancelar"
  type="danger"
  loading={$isDeletingStore}
  loadingText="Eliminando..."
  on:confirm={handleDeleteLinkTree}
  on:cancel={() => showDeleteConfirm = false}
/>

<!-- Share Modal -->
{#if showShareModal}
  <div class="modal-overlay" on:click={() => showShareModal = false}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3 class="text-lg font-semibold m-0 text-primary">Compartir LinkTree</h3>
        <button class="modal-close" on:click={() => showShareModal = false}>
          <i class="icon-x"></i>
        </button>
      </div>
      
      <div class="modal-content">
        <div class="share-section">
          <label class="block font-medium text-primary mb-xs">URL Pública</label>
          <div class="url-input">
            <input type="text" value={publicUrl} readonly class="input" />
            <button class="btn btn-primary" on:click={() => copyToClipboard(publicUrl)}>
              <i class="icon-copy"></i>
              Copiar
            </button>
          </div>
          {#if currentRestaurant}
            <p class="url-info">Tu LinkTree está disponible en: <strong>/{currentRestaurant.username}</strong></p>
          {/if}
        </div>
        
        <div class="share-buttons">
          <a 
            href="https://twitter.com/intent/tweet?url={encodeURIComponent(publicUrl)}&text={encodeURIComponent('Visita mi LinkTree')}"
            target="_blank"
            rel="noopener"
            class="share-btn twitter"
          >
            <i class="icon-twitter"></i>
            Twitter
          </a>
          
          <a 
            href="https://www.facebook.com/sharer/sharer.php?u={encodeURIComponent(publicUrl)}"
            target="_blank"
            rel="noopener"
            class="share-btn facebook"
          >
            <i class="icon-facebook"></i>
            Facebook
          </a>
          
          <a 
            href="https://wa.me/?text={encodeURIComponent(`Visita mi LinkTree: ${publicUrl}`)}"
            target="_blank"
            rel="noopener"
            class="share-btn whatsapp"
          >
            <i class="icon-message-circle"></i>
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  </div>
{/if}

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

  /* Dashboard Header */
  .dashboard-header {
    background: var(--bg-primary);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    padding: var(--spacing-2xl);
    margin-bottom: var(--spacing-2xl);
    border: 1px solid var(--bg-accent);
  }

  /* Meta Info */
  .meta-info {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-lg);
    font-size: var(--font-sm);
    color: var(--text-muted);
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  /* Dashboard Tabs */
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
    transition: var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    font-weight: var(--weight-medium);
    font-size: var(--font-base);
  }

  .tab:hover {
    color: var(--text-primary);
    background: var(--bg-tertiary);
  }

  .tab.active {
    background: var(--primary-color);
    color: var(--text-inverse);
  }

  /* Tab Content */
  .tab-content {
    background: var(--bg-primary);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    overflow: hidden;
    border: 1px solid var(--bg-accent);
  }

  /* Stats Overview - usando el sistema del CSS global */
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
    background: var(--bg-secondary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    padding: var(--spacing-lg);
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    transition: var(--transition-normal);
  }

  .stat-card:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
    border-color: rgba(255, 107, 53, 0.2);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-inverse);
    font-size: var(--font-lg);
  }

  .stat-card.visits .stat-icon { background: var(--primary-color); }
  .stat-card.clicks .stat-icon { background: var(--success); }
  .stat-card.visitors .stat-icon { background: var(--warning); }
  .stat-card.links .stat-icon { background: var(--info); }

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
    color: var(--text-muted);
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

  /* Popular Links Section */
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
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--bg-accent);
    transition: var(--transition-fast);
  }

  .popular-link:hover {
    background: var(--bg-tertiary);
    transform: translateX(4px);
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
    color: var(--text-muted);
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

  /* Analytics Content */
  .analytics-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xl);
  }

  .chart-section {
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    border: 1px solid var(--bg-accent);
  }

  .chart-container {
    background: var(--bg-tertiary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
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
    background: var(--primary-color);
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    min-height: 4px;
    margin-bottom: auto;
    transition: height var(--transition-normal);
  }

  .bar-label {
    font-size: var(--font-xs);
    color: var(--text-muted);
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

  /* Modal Styles - usando variables globales */
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
  }

  .modal {
    background: var(--bg-primary);
    border-radius: var(--radius-xl);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-2xl);
    border: 1px solid var(--bg-accent);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-xl);
    border-bottom: 1px solid var(--bg-accent);
  }

  .modal-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: var(--spacing-sm);
    border-radius: var(--radius-sm);
    transition: var(--transition-fast);
  }

  .modal-close:hover {
    color: var(--text-primary);
    background: var(--bg-tertiary);
  }

  .modal-content {
    padding: var(--spacing-xl);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
    padding: var(--spacing-xl);
    border-top: 1px solid var(--bg-accent);
  }

  /* Share Modal específico */
  .share-section {
    margin-bottom: var(--spacing-xl);
  }

  .url-input {
    display: flex;
    gap: var(--spacing-sm);
  }

  .url-input input {
    flex: 1;
    background: var(--bg-secondary);
    color: var(--text-muted);
  }

  .url-info {
    margin-top: var(--spacing-sm);
    font-size: var(--font-sm);
    color: var(--text-muted);
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
    transition: var(--transition-fast);
  }

  .share-btn:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }

  .share-btn.twitter { 
    background: #1da1f2; 
    color: var(--text-inverse);
  }
  .share-btn.facebook { 
    background: #4267b2; 
    color: var(--text-inverse);
  }
  .share-btn.whatsapp { 
    background: #25d366; 
    color: var(--text-inverse);
  }

  /* Responsive Overrides */
  @media (max-width: 768px) {
    .dashboard-header {
      padding: var(--spacing-lg);
    }

    .meta-info {
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .dashboard-tabs {
      flex-direction: column;
    }

    .stats-overview {
      grid-template-columns: 1fr;
    }

    .popular-link {
      flex-direction: column;
      align-items: stretch;
      text-align: center;
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
  }

  /* Estados usando el sistema global */
  .no-data {
    text-align: center;
    padding: var(--spacing-2xl);
    color: var(--text-muted);
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
    .tab {
      transform: none;
    }

    .bar-fill {
      transition: none;
    }
  }

  /* Dark mode - aprovechando el sistema global */
  @media (prefers-color-scheme: dark) {
    .chart-container {
      background: var(--bg-tertiary);
    }

    .url-input input {
      background: var(--bg-tertiary);
    }
  }
</style>