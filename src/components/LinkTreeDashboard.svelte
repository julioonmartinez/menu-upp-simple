<!-- src/components/LinkTreeDashboard.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import type { LinkTree, Link, LinkTreeAnalytics } from '../interfaces/links.ts';
  import { 
    formatClickCount, 
    getLinkTreePublicUrl,
    getActiveLinks,
    groupLinksByType,
    LINK_TYPE_LABELS 
  } from '../interfaces/links.ts';
  import { useLinkTrees,  } from '../stores/linkTreeStore.ts';
  import LinkManager from './LinkManager.svelte';

  // Props
  export let restaurantId: string;
  export let linkTree: LinkTree | null = null;

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    editLinkTree: LinkTree;
    createLinkTree: string; // restaurantId
    deleteLinkTree: LinkTree;
    shareLink: string;
  }>();

  // Store state
  const {
    currentLinkTree,
    currentLinks,
    currentAnalytics,
    isLoadingCurrent,
    isLoadingAnalytics,
    isDeleting,
    error,
    loadLinkTreeByRestaurant,
    loadAnalytics,
    deleteLinkTree,
    createLinkTree // <-- Asegura que esté aquí
  } = useLinkTrees();

  // Local state
  let displayLinkTree: LinkTree | null = null;
  let analytics: LinkTreeAnalytics | null = null;
  let showDeleteConfirm = false;
  let showShareModal = false;
  let activeTab = 'overview';

  // Reactive statements
  $: displayLinkTree = linkTree || currentLinkTree;
  $: analytics = currentAnalytics;
  $: isLoading = isLoadingCurrent;
  $: analyticsLoading = isLoadingAnalytics;
  $: errorMessage = error;

  // Computed values
  $: publicUrl = displayLinkTree ? getLinkTreePublicUrl(displayLinkTree) : '';
  $: safeLinks = displayLinkTree && Array.isArray(displayLinkTree.links) ? displayLinkTree.links : [];
  $: activeLinks = displayLinkTree ? getActiveLinks(safeLinks) : [];
  $: linksByType = displayLinkTree ? groupLinksByType(safeLinks) : {};
  $: totalLinks = safeLinks.length;
  $: activeLinkCount = activeLinks.length;

  // Initialize
  onMount(async () => {
    if (!displayLinkTree) {
      await loadLinkTreeData();
    }
    
    if (displayLinkTree) {
      await loadAnalyticsData();
    }
  });

  // Load LinkTree data
  async function loadLinkTreeData() {
    try {
      await loadLinkTreeByRestaurant(restaurantId);
    } catch (err) {
      console.error('Error loading LinkTree:', err);
    }
  }

  // Load analytics data
  async function loadAnalyticsData() {
    if (!displayLinkTree?.id) return;
    
    try {
      await loadAnalytics(displayLinkTree.id);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  }

  // Handle edit LinkTree
  function handleEditLinkTree() {
    if (displayLinkTree) {
      dispatch('editLinkTree', displayLinkTree);
    }
  }

  // Handle create LinkTree
  async function handleCreateLinkTree() {
    try {
      const result = await createLinkTree({ restaurantId });
      if (result.success && result.linkTree) {
        // Actualiza el estado local y muestra el nuevo LinkTree
        await loadLinkTreeData();
      } else {
        alert(result.error || 'No se pudo crear el LinkTree');
      }
    } catch (err) {
      console.error('Error creando LinkTree:', err);
      alert('Error creando LinkTree');
    }
  }

  // Handle delete LinkTree
  async function handleDeleteLinkTree() {
    if (!displayLinkTree) return;
    
    showDeleteConfirm = false;
    
    try {
      const result = await deleteLinkTree(displayLinkTree.id!);
      
      if (result.success) {
        dispatch('deleteLinkTree', displayLinkTree);
      }
    } catch (err) {
      console.error('Error deleting LinkTree:', err);
    }
  }

  // Handle share
  function handleShare() {
    showShareModal = true;
  }

  // Copy to clipboard
  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert('¡Enlace copiado al portapapeles!');
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('¡Enlace copiado al portapapeles!');
    }
  }

  // Get analytics summary
  function getAnalyticsSummary() {
    if (!analytics) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const todayViews = analytics.views.daily.find(d => d.date === today)?.count || 0;
    const yesterdayViews = analytics.views.daily.find(d => d.date === yesterday)?.count || 0;
    
    const todayClicks = analytics.clicks.daily.find(d => d.date === today)?.count || 0;
    const yesterdayClicks = analytics.clicks.daily.find(d => d.date === yesterday)?.count || 0;
    
    return {
      todayViews,
      yesterdayViews,
      todayClicks,
      yesterdayClicks,
      viewsChange: yesterdayViews > 0 ? ((todayViews - yesterdayViews) / yesterdayViews * 100) : 0,
      clicksChange: yesterdayClicks > 0 ? ((todayClicks - yesterdayClicks) / yesterdayClicks * 100) : 0
    };
  }

  $: analyticsSummary = getAnalyticsSummary();
</script>

<div class="linktree-dashboard">
  <!-- Loading State -->
  {#if isLoading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Cargando LinkTree...</p>
    </div>
  
  <!-- Error State -->
  {:else if errorMessage}
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Error</h3>
      <p>{errorMessage}</p>
      <button class="btn btn-primary" on:click={loadLinkTreeData}>
        Reintentar
      </button>
    </div>
  
  <!-- No LinkTree State -->
  {:else if !displayLinkTree}
    <div class="empty-state">
      <div class="empty-icon">🔗</div>
      <h3>No tienes un LinkTree</h3>
      <p>Crea tu primera página de enlaces para comenzar a compartir todos tus links importantes en un solo lugar.</p>
      <button class="btn btn-primary" on:click={handleCreateLinkTree}>
        <i class="icon-plus"></i>
        Crear LinkTree
      </button>
    </div>
  
  <!-- Dashboard Content -->
  {:else}
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="linktree-info">
          <div class="linktree-title">
            <h1>{displayLinkTree.title || 'Mi LinkTree'}</h1>
            <span class="status" class:public={displayLinkTree.isPublic} class:private={!displayLinkTree.isPublic}>
              {displayLinkTree.isPublic ? 'Público' : 'Privado'}
            </span>
          </div>
          
          {#if displayLinkTree.description}
            <p class="linktree-description">{displayLinkTree.description}</p>
          {/if}
          
          <div class="linktree-meta">
            <span class="meta-item">
              <i class="icon-link"></i>
              {activeLinkCount} de {totalLinks} enlaces activos
            </span>
            {#if publicUrl}
              <span class="meta-item">
                <i class="icon-globe"></i>
                <a href={publicUrl} target="_blank" rel="noopener">{publicUrl}</a>
              </span>
            {/if}
          </div>
        </div>
        
        <div class="header-actions">
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
        <div class="overview-tab">
          <!-- Quick Stats -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon visits">
                <i class="icon-eye"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{displayLinkTree.analytics?.totalVisits || 0}</div>
                <div class="stat-label">Visitas Totales</div>
                {#if analyticsSummary}
                  <div class="stat-change" class:positive={analyticsSummary.viewsChange > 0} class:negative={analyticsSummary.viewsChange < 0}>
                    {analyticsSummary.viewsChange > 0 ? '+' : ''}{analyticsSummary.viewsChange.toFixed(1)}% vs ayer
                  </div>
                {/if}
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon clicks">
                <i class="icon-mouse-pointer"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{displayLinkTree.analytics?.totalClicks || 0}</div>
                <div class="stat-label">Clics Totales</div>
                {#if analyticsSummary}
                  <div class="stat-change" class:positive={analyticsSummary.clicksChange > 0} class:negative={analyticsSummary.clicksChange < 0}>
                    {analyticsSummary.clicksChange > 0 ? '+' : ''}{analyticsSummary.clicksChange.toFixed(1)}% vs ayer
                  </div>
                {/if}
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon visitors">
                <i class="icon-users"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{displayLinkTree.analytics?.uniqueVisitors || 0}</div>
                <div class="stat-label">Visitantes Únicos</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon links">
                <i class="icon-link"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{activeLinkCount}</div>
                <div class="stat-label">Enlaces Activos</div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="recent-activity">
            <h3>Enlaces Populares</h3>
            {#if (analytics?.clicks.byLink.length || 0 ) > 0}
              <div class="popular-links">
                {#each (analytics?.clicks.byLink || [] ).slice(0, 5) as linkStat}
                  <div class="popular-link">
                    <div class="link-info">
                      <div class="link-name">{linkStat.linkTitle}</div>
                      <div class="click-count">{formatClickCount(linkStat.count)} clics</div>
                    </div>
                    <div class="click-bar">
                      <div 
                        class="click-fill" 
                        style="width: {(linkStat.count / Math.max(...(analytics?.clicks.byLink || [] ).map(l => l.count))) * 100}%"
                      ></div>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="no-data">
                <p>No hay datos de clics disponibles aún.</p>
              </div>
            {/if}
          </div>
        </div>
      
      {:else if activeTab === 'links'}
        <!-- Links Tab -->
        <LinkManager 
          linkTreeId={displayLinkTree.id!}
          links={safeLinks}
          editable={true}
          showAnalytics={true}
          on:linkCreated={loadAnalyticsData}
          on:linkUpdated={loadAnalyticsData}
          on:linkDeleted={loadAnalyticsData}
        />
      
      {:else if activeTab === 'analytics'}
        <!-- Analytics Tab -->
        <div class="analytics-tab">
          {#if analyticsLoading}
            <div class="loading-state">
              <div class="loading-spinner"></div>
              <p>Cargando analíticas...</p>
            </div>
          {:else if analytics}
            <div class="analytics-content">
              <!-- Views Chart -->
              <div class="chart-section">
                <h3>Visitas por Día</h3>
                <div class="chart-container">
                  {#if analytics.views.daily.length > 0}
                    <div class="simple-chart">
                      {#each analytics.views.daily.slice(-7) as day}
                        <div class="chart-bar">
                          <div 
                            class="bar-fill" 
                            style="height: {(day.count / Math.max(...analytics.views.daily.map(d => d.count))) * 100}%"
                          ></div>
                          <div class="bar-label">{new Date(day.date).toLocaleDateString('es', { weekday: 'short' })}</div>
                          <div class="bar-value">{day.count}</div>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <div class="no-data">
                      <p>No hay datos de visitas disponibles.</p>
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Clicks Chart -->
              <div class="chart-section">
                <h3>Clics por Día</h3>
                <div class="chart-container">
                  {#if analytics.clicks.daily.length > 0}
                    <div class="simple-chart">
                      {#each analytics.clicks.daily.slice(-7) as day}
                        <div class="chart-bar">
                          <div 
                            class="bar-fill" 
                            style="height: {(day.count / Math.max(...analytics.clicks.daily.map(d => d.count))) * 100}%"
                          ></div>
                          <div class="bar-label">{new Date(day.date).toLocaleDateString('es', { weekday: 'short' })}</div>
                          <div class="bar-value">{day.count}</div>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <div class="no-data">
                      <p>No hay datos de clics disponibles.</p>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {:else}
            <div class="no-data">
              <p>No se pudieron cargar las analíticas.</p>
              <button class="btn btn-primary" on:click={loadAnalyticsData}>
                Reintentar
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
  <div class="modal-overlay" on:click={() => showDeleteConfirm = false}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Confirmar Eliminación</h3>
        <button class="modal-close" on:click={() => showDeleteConfirm = false}>
          <i class="icon-x"></i>
        </button>
      </div>
      
      <div class="modal-content">
        <p>¿Estás seguro de que quieres eliminar este LinkTree?</p>
        <p><strong>Esta acción no se puede deshacer.</strong></p>
      </div>
      
      <div class="modal-actions">
        <button class="btn btn-secondary" on:click={() => showDeleteConfirm = false}>
          Cancelar
        </button>
        <button 
          class="btn btn-danger" 
          on:click={handleDeleteLinkTree}
          disabled={isDeleting}
        >
          {#if isDeleting}
            <i class="icon-loader spinning"></i>
            Eliminando...
          {:else}
            Eliminar LinkTree
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Share Modal -->
{#if showShareModal}
  <div class="modal-overlay" on:click={() => showShareModal = false}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Compartir LinkTree</h3>
        <button class="modal-close" on:click={() => showShareModal = false}>
          <i class="icon-x"></i>
        </button>
      </div>
      
      <div class="modal-content">
        <div class="share-section">
          <label>URL Pública</label>
          <div class="url-input">
            <input type="text" value={publicUrl} readonly />
            <button class="btn btn-primary" on:click={() => copyToClipboard(publicUrl)}>
              <i class="icon-copy"></i>
              Copiar
            </button>
          </div>
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
  .linktree-dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .error-icon,
  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .dashboard-header {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
  }

  .linktree-info {
    flex: 1;
  }

  .linktree-title {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .linktree-title h1 {
    margin: 0;
    color: #111827;
    font-size: 1.75rem;
  }

  .status {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status.public {
    background: #dcfce7;
    color: #16a34a;
  }

  .status.private {
    background: #fef3c7;
    color: #d97706;
  }

  .linktree-description {
    color: #6b7280;
    margin: 0 0 1rem 0;
    line-height: 1.5;
  }

  .linktree-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .meta-item a {
    color: #3b82f6;
    text-decoration: none;
  }

  .meta-item a:hover {
    text-decoration: underline;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .dashboard-tabs {
    display: flex;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 0.5rem;
    margin-bottom: 2rem;
  }

  .tab {
    flex: 1;
    padding: 0.75rem 1rem;
    border: none;
    background: transparent;
    color: #6b7280;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 500;
  }

  .tab:hover {
    color: #374151;
    background: #f3f4f6;
  }

  .tab.active {
    background: #3b82f6;
    color: white;
  }

  .tab-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .overview-tab {
    padding: 2rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
  }

  .stat-icon.visits { background: #3b82f6; }
  .stat-icon.clicks { background: #10b981; }
  .stat-icon.visitors { background: #f59e0b; }
  .stat-icon.links { background: #8b5cf6; }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 1.75rem;
    font-weight: bold;
    color: #111827;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    color: #6b7280;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .stat-change {
    font-size: 0.75rem;
    font-weight: 500;
  }

  .stat-change.positive { color: #16a34a; }
  .stat-change.negative { color: #dc2626; }

  .recent-activity h3 {
    margin: 0 0 1rem 0;
    color: #111827;
  }

  .popular-links {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .popular-link {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 8px;
  }

  .link-info {
    flex: 1;
  }

  .link-name {
    font-weight: 500;
    color: #111827;
    margin-bottom: 0.25rem;
  }

  .click-count {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .click-bar {
    width: 100px;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }

  .click-fill {
    height: 100%;
    background: #3b82f6;
    transition: width 0.3s ease;
  }

  .analytics-tab {
    padding: 2rem;
  }

  .analytics-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .chart-section h3 {
    margin: 0 0 1rem 0;
    color: #111827;
  }

  .chart-container {
    background: #f9fafb;
    border-radius: 8px;
    padding: 1.5rem;
  }

  .simple-chart {
    display: flex;
    justify-content: space-between;
    align-items: end;
    height: 200px;
    gap: 0.5rem;
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
    background: #3b82f6;
    border-radius: 4px 4px 0 0;
    min-height: 4px;
    margin-bottom: auto;
  }

  .bar-label {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.5rem;
    text-transform: uppercase;
  }

  .bar-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: #111827;
    margin-top: 0.25rem;
  }

  .no-data {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .btn-danger {
    background: #dc2626;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #b91c1c;
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
    z-index: 1000;
    padding: 1rem;
  }

  .modal {
    background: white;
    border-radius: 12px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
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
  }

  .modal-close:hover {
    color: #374151;
    background: #f3f4f6;
  }

  .modal-content {
    padding: 1.5rem;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .share-section {
    margin-bottom: 1.5rem;
  }

  .share-section label {
    display: block;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .url-input {
    display: flex;
    gap: 0.5rem;
  }

  .url-input input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #f9fafb;
    color: #6b7280;
  }

  .share-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
  }

  .share-btn {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    text-decoration: none;
    color: white;
    font-weight: 500;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: opacity 0.2s;
  }

  .share-btn:hover {
    opacity: 0.9;
  }

  .share-btn.twitter { background: #1da1f2; }
  .share-btn.facebook { background: #4267b2; }
  .share-btn.whatsapp { background: #25d366; }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .linktree-dashboard {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      gap: 1rem;
    }

    .header-actions {
      width: 100%;
      justify-content: center;
    }

    .dashboard-tabs {
      flex-direction: column;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .popular-link {
      flex-direction: column;
      align-items: stretch;
      text-align: center;
    }

    .modal {
      margin: 1rem;
    }

    .share-buttons {
      grid-template-columns: 1fr;
    }
  }
</style>