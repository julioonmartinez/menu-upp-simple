<!-- src/components/AnalyticsDashboard.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { LinkTreeAnalytics } from '../interfaces/links.ts';
  import { formatClickCount } from '../interfaces/links.ts';
  import { LinkTreeMetrics } from '../utils/linkTreeUtils.ts';
  import { useLinkTrees } from '../stores/linkTreeStore.ts';

  // Props
  export let linkTreeId: string;
  export let analytics: LinkTreeAnalytics | null = null;
  export let refreshInterval = 0; // 0 = no auto refresh, valor en ms

  // Store state
  const {
    currentAnalytics,
    isLoadingAnalytics,
    analyticsError,
    loadAnalytics
  } = useLinkTrees();

  // Local state
  let displayAnalytics: LinkTreeAnalytics | null = null;
  let selectedPeriod = '7'; // días
  let selectedMetric = 'views';
  let refreshTimer: NodeJS.Timeout | null = null;

  // Reactive statements
  $: displayAnalytics = analytics || currentAnalytics;
  $: isLoading = isLoadingAnalytics;
  $: error = analyticsError;

  // Computed analytics
  $: periodStats = displayAnalytics ? LinkTreeMetrics.getPeriodStats(displayAnalytics, parseInt(selectedPeriod)) : null;
  $: performanceReport = displayAnalytics ? LinkTreeMetrics.generatePerformanceReport(displayAnalytics) : null;
  $: clickThroughRate = displayAnalytics ? LinkTreeMetrics.getClickThroughRate(displayAnalytics) : 0;
  $: mostPopularLink = displayAnalytics ? LinkTreeMetrics.getMostPopularLink(displayAnalytics) : null;

  // Chart data
  $: chartData = getChartData();
  $: topLinksData = getTopLinksData();

  // Initialize
  onMount( () => {
     loadAnalyticsData();
    
    if (refreshInterval > 0) {
      startAutoRefresh();
    }
    
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  });

  // Load analytics data
  async function loadAnalyticsData() {
    try {
      await loadAnalytics(linkTreeId, true); // Force reload
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  }

  // Start auto refresh
  function startAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
    
    refreshTimer = setInterval(() => {
      loadAnalyticsData();
    }, refreshInterval);
  }

  // Stop auto refresh
  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  // Get chart data for selected period and metric
  function getChartData() {
    if (!displayAnalytics) return [];
    
    const days = parseInt(selectedPeriod);
    const data = selectedMetric === 'views' ? displayAnalytics.views.daily : displayAnalytics.clicks.daily;
    
    return data.slice(-days).map(item => ({
      date: item.date,
      value: item.count,
      formattedDate: formatDate(item.date)
    }));
  }

  // Get top links data
  function getTopLinksData() {
    if (!displayAnalytics) return [];
    
    return displayAnalytics.clicks.byLink
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(link => ({
        ...link,
        percentage: displayAnalytics!.clicks.total > 0 
          ? (link.count / displayAnalytics!.clicks.total) * 100 
          : 0
      }));
  }

  // Format date for display
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // Format percentage
  function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  // Get growth indicator
  function getGrowthIndicator(current: number, previous: number) {
    const growth = LinkTreeMetrics.getGrowthRate(current, previous);
    return {
      value: growth,
      isPositive: growth > 0,
      isNeutral: growth === 0,
      formatted: `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`
    };
  }

  // Handle period change
  function handlePeriodChange(period: string) {
    selectedPeriod = period;
  }

  // Handle metric change
  function handleMetricChange(metric: string) {
    selectedMetric = metric;
  }

  // Export data as CSV
  function exportToCsv() {
    if (!displayAnalytics) return;
    
    const csvData = [
      ['Fecha', 'Visitas', 'Clics'],
      ...displayAnalytics.views.daily.map(viewDay => {
        const clickDay = displayAnalytics!.clicks.daily.find(c => c.date === viewDay.date);
        return [viewDay.date, viewDay.count, clickDay?.count || 0];
      })
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `linktree-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

<div class="analytics-dashboard">
  <!-- Header -->
  <div class="dashboard-header">
    <div class="header-content">
      <h2>Analíticas</h2>
      <p>Métricas de rendimiento de tu LinkTree</p>
    </div>
    
    <div class="header-actions">
      <button 
        class="btn btn-secondary btn-sm"
        on:click={loadAnalyticsData}
        disabled={isLoading}
      >
        {#if isLoading}
          <i class="icon-loader spinning"></i>
        {:else}
          <i class="icon-refresh-cw"></i>
        {/if}
        Actualizar
      </button>
      
      <button 
        class="btn btn-secondary btn-sm"
        on:click={exportToCsv}
        disabled={!displayAnalytics}
      >
        <i class="icon-download"></i>
        Exportar
      </button>
    </div>
  </div>

  <!-- Loading State -->
  {#if isLoading && !displayAnalytics}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Cargando analíticas...</p>
    </div>
  
  <!-- Error State -->
  {:else if error}
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Error al cargar analíticas</h3>
      <p>{error}</p>
      <button class="btn btn-primary" on:click={loadAnalyticsData}>
        Reintentar
      </button>
    </div>
  
  <!-- No Data State -->
  {:else if !displayAnalytics}
    <div class="empty-state">
      <div class="empty-icon">📊</div>
      <h3>No hay datos disponibles</h3>
      <p>Las analíticas aparecerán aquí una vez que tengas visitantes en tu LinkTree.</p>
    </div>
  
  <!-- Analytics Content -->
  {:else}
    <!-- Period Selector -->
    <div class="period-selector">
      <div class="selector-group">
        <label>Período:</label>
        <div class="period-buttons">
          {#each [['7', '7 días'], ['30', '30 días'], ['90', '90 días']] as [value, label]}
            <button
              class="period-btn"
              class:active={selectedPeriod === value}
              on:click={() => handlePeriodChange(value)}
            >
              {label}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="metrics-grid">
      <!-- Total Views -->
      <div class="metric-card views">
        <div class="metric-header">
          <div class="metric-icon">
            <i class="icon-eye"></i>
          </div>
          <div class="metric-title">Visitas Totales</div>
        </div>
        <div class="metric-value">{displayAnalytics.views.total.toLocaleString()}</div>
        {#if periodStats}
          <div class="metric-subtitle">
            {periodStats.views.toLocaleString()} en últimos {selectedPeriod} días
          </div>
        {/if}
      </div>

      <!-- Total Clicks -->
      <div class="metric-card clicks">
        <div class="metric-header">
          <div class="metric-icon">
            <i class="icon-mouse-pointer"></i>
          </div>
          <div class="metric-title">Clics Totales</div>
        </div>
        <div class="metric-value">{displayAnalytics.clicks.total.toLocaleString()}</div>
        {#if periodStats}
          <div class="metric-subtitle">
            {periodStats.clicks.toLocaleString()} en últimos {selectedPeriod} días
          </div>
        {/if}
      </div>

      <!-- Unique Visitors -->
      <div class="metric-card visitors">
        <div class="metric-header">
          <div class="metric-icon">
            <i class="icon-users"></i>
          </div>
          <div class="metric-title">Visitantes Únicos</div>
        </div>
        <div class="metric-value">{displayAnalytics.views.unique.toLocaleString()}</div>
        <div class="metric-subtitle">
          {((displayAnalytics.views.unique / displayAnalytics.views.total) * 100).toFixed(1)}% del total
        </div>
      </div>

      <!-- Click Through Rate -->
      <div class="metric-card ctr">
        <div class="metric-header">
          <div class="metric-icon">
            <i class="icon-trending-up"></i>
          </div>
          <div class="metric-title">Tasa de Clics</div>
        </div>
        <div class="metric-value">{formatPercentage(clickThroughRate)}</div>
        {#if periodStats}
          <div class="metric-subtitle">
            {formatPercentage(periodStats.clickThroughRate)} en últimos {selectedPeriod} días
          </div>
        {/if}
      </div>
    </div>

    <!-- Performance Report -->
    {#if performanceReport}
      <div class="performance-section">
        <h3>Reporte de Rendimiento</h3>
        <div class="performance-grid">
          <div class="performance-card">
            <div class="performance-title">Últimos 7 días</div>
            <div class="performance-stats">
              <div class="stat">
                <span class="stat-label">Visitas:</span>
                <span class="stat-value">{performanceReport.last7Days.views}</span>
                {#if performanceReport.trends.viewsGrowth !== 0}
                  <span class="growth-indicator" class:positive={performanceReport.trends.viewsGrowth > 0} class:negative={performanceReport.trends.viewsGrowth < 0}>
                    {performanceReport.trends.viewsGrowth > 0 ? '+' : ''}{performanceReport.trends.viewsGrowth.toFixed(1)}%
                  </span>
                {/if}
              </div>
              <div class="stat">
                <span class="stat-label">Clics:</span>
                <span class="stat-value">{performanceReport.last7Days.clicks}</span>
                {#if performanceReport.trends.clicksGrowth !== 0}
                  <span class="growth-indicator" class:positive={performanceReport.trends.clicksGrowth > 0} class:negative={performanceReport.trends.clicksGrowth < 0}>
                    {performanceReport.trends.clicksGrowth > 0 ? '+' : ''}{performanceReport.trends.clicksGrowth.toFixed(1)}%
                  </span>
                {/if}
              </div>
            </div>
          </div>

          <div class="performance-card">
            <div class="performance-title">Últimos 30 días</div>
            <div class="performance-stats">
              <div class="stat">
                <span class="stat-label">Promedio diario:</span>
                <span class="stat-value">{performanceReport.last30Days.averageViewsPerDay.toFixed(1)} visitas</span>
              </div>
              <div class="stat">
                <span class="stat-label">Promedio diario:</span>
                <span class="stat-value">{performanceReport.last30Days.averageClicksPerDay.toFixed(1)} clics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Charts Section -->
    <div class="charts-section">
      <div class="chart-header">
        <h3>Tendencias</h3>
        <div class="metric-selector">
          <button
            class="metric-btn"
            class:active={selectedMetric === 'views'}
            on:click={() => handleMetricChange('views')}
          >
            Visitas
          </button>
          <button
            class="metric-btn"
            class:active={selectedMetric === 'clicks'}
            on:click={() => handleMetricChange('clicks')}
          >
            Clics
          </button>
        </div>
      </div>

      <!-- Chart -->
      <div class="chart-container">
        {#if chartData.length > 0}
          <div class="chart">
            <div class="chart-grid">
              {#each chartData as point, index}
                <div class="chart-bar">
                  <div 
                    class="bar-fill"
                    style="height: {chartData.length > 0 ? (point.value / Math.max(...chartData.map(p => p.value))) * 100 : 0}%"
                  ></div>
                  <div class="bar-label">{point.formattedDate}</div>
                  <div class="bar-value">{point.value}</div>
                </div>
              {/each}
            </div>
          </div>
        {:else}
          <div class="no-chart-data">
            <p>No hay datos suficientes para mostrar el gráfico</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Top Links Section -->
    <div class="top-links-section">
      <h3>Enlaces Más Populares</h3>
      
      {#if topLinksData.length > 0}
        <div class="top-links-list">
          {#each topLinksData as link, index}
            <div class="top-link-item">
              <div class="link-rank">#{index + 1}</div>
              <div class="link-info">
                <div class="link-title">{link.linkTitle}</div>
                <div class="link-stats">
                  <span class="click-count">{formatClickCount(link.count)} clics</span>
                  <span class="percentage">{formatPercentage(link.percentage)}</span>
                </div>
              </div>
              <div class="link-bar">
                <div 
                  class="bar-fill"
                  style="width: {link.percentage}%"
                ></div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="no-links-data">
          <p>No hay datos de clics en enlaces disponibles</p>
        </div>
      {/if}
    </div>

    <!-- Top Performer Highlight -->
    {#if mostPopularLink}
      <div class="highlight-section">
        <div class="highlight-card">
          <div class="highlight-icon">🏆</div>
          <div class="highlight-content">
            <h4>Enlace Estrella</h4>
            <p>
              <strong>{mostPopularLink.linkTitle}</strong> es tu enlace más popular con 
              <strong>{formatClickCount(mostPopularLink.count)} clics</strong>
            </p>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .analytics-dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .header-content h2 {
    margin: 0 0 0.5rem 0;
    color: #111827;
  }

  .header-content p {
    margin: 0;
    color: #6b7280;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
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

  .period-selector {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .selector-group {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .selector-group label {
    font-weight: 500;
    color: #374151;
  }

  .period-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .period-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background: white;
    color: #374151;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
  }

  .period-btn:hover {
    background: #f3f4f6;
  }

  .period-btn.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .metric-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    border-left: 4px solid;
  }

  .metric-card.views { border-left-color: #3b82f6; }
  .metric-card.clicks { border-left-color: #10b981; }
  .metric-card.visitors { border-left-color: #f59e0b; }
  .metric-card.ctr { border-left-color: #8b5cf6; }

  .metric-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .metric-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.125rem;
  }

  .metric-card.views .metric-icon { background: #3b82f6; }
  .metric-card.clicks .metric-icon { background: #10b981; }
  .metric-card.visitors .metric-icon { background: #f59e0b; }
  .metric-card.ctr .metric-icon { background: #8b5cf6; }

  .metric-title {
    font-weight: 500;
    color: #374151;
  }

  .metric-value {
    font-size: 2rem;
    font-weight: bold;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  .metric-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .performance-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .performance-section h3 {
    margin: 0 0 1rem 0;
    color: #111827;
  }

  .performance-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }

  .performance-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
  }

  .performance-title {
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.75rem;
  }

  .performance-stats {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-label {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .stat-value {
    font-weight: 600;
    color: #111827;
  }

  .growth-indicator {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
  }

  .growth-indicator.positive {
    background: #dcfce7;
    color: #16a34a;
  }

  .growth-indicator.negative {
    background: #fef2f2;
    color: #dc2626;
  }

  .charts-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .chart-header h3 {
    margin: 0;
    color: #111827;
  }

  .metric-selector {
    display: flex;
    gap: 0.25rem;
    background: #f3f4f6;
    padding: 0.25rem;
    border-radius: 6px;
  }

  .metric-btn {
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    color: #6b7280;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .metric-btn.active {
    background: white;
    color: #3b82f6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .chart-container {
    background: #f9fafb;
    border-radius: 8px;
    padding: 1.5rem;
  }

  .chart {
    height: 300px;
  }

  .chart-grid {
    display: flex;
    justify-content: space-between;
    align-items: end;
    height: 100%;
    gap: 0.5rem;
  }

  .chart-bar {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    max-width: 60px;
  }

  .bar-fill {
    width: 100%;
    background: #3b82f6;
    border-radius: 4px 4px 0 0;
    min-height: 4px;
    margin-bottom: auto;
    transition: height 0.3s ease;
  }

  .bar-label {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.5rem;
    text-align: center;
  }

  .bar-value {
    font-size: 0.75rem;
    font-weight: 600;
    color: #111827;
    margin-top: 0.25rem;
  }

  .no-chart-data,
  .no-links-data {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }

  .top-links-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .top-links-section h3 {
    margin: 0 0 1rem 0;
    color: #111827;
  }

  .top-links-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .top-link-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 8px;
  }

  .link-rank {
    width: 32px;
    height: 32px;
    background: #3b82f6;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .link-info {
    flex: 1;
    min-width: 0;
  }

  .link-title {
    font-weight: 600;
    color: #111827;
    margin-bottom: 0.25rem;
  }

  .link-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .link-bar {
    width: 100px;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .link-bar .bar-fill {
    height: 100%;
    background: #3b82f6;
    transition: width 0.3s ease;
  }

  .highlight-section {
    margin-bottom: 2rem;
  }

  .highlight-card {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: white;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .highlight-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }

  .highlight-content h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
  }

  .highlight-content p {
    margin: 0;
    opacity: 0.95;
    line-height: 1.4;
  }

  .btn {
    padding: 0.5rem 1rem;
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

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
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

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .analytics-dashboard {
      padding: 0.5rem;
    }

    .dashboard-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .selector-group {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }

    .period-buttons {
      justify-content: center;
    }

    .metrics-grid {
      grid-template-columns: 1fr;
    }

    .performance-grid {
      grid-template-columns: 1fr;
    }

    .chart-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .metric-selector {
      align-self: center;
    }

    .chart-bar {
      max-width: none;
    }

    .top-link-item {
      flex-direction: column;
      align-items: stretch;
      text-align: center;
    }

    .link-bar {
      width: 100%;
    }

    .highlight-card {
      flex-direction: column;
      text-align: center;
    }
  }
</style>