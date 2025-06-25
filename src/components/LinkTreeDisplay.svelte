<!-- src/components/LinkTreeDisplay.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { LinkTree, Link } from '../interfaces/links.ts';
  import { linkTreeStore, useLinkTrees } from '../stores/linkTreeStore.ts';
  import { 
    formatClickCount, 
    getActiveLinks, 
    sortLinksByOrder,
    groupLinksByType,
    LINK_TYPE_LABELS,
    LINK_TYPE_ICONS 
  } from '../interfaces/links.ts';
  
  // Props
  export let linkTree: LinkTree | null = null;
  export let linkTreeId: string | undefined = undefined;
  export let restaurantId: string | undefined = undefined;
  export let username: string | undefined = undefined;
  export let slug: string | undefined = undefined;
  export let showAnalytics = false;
  export let editable = false;
  export let onLinkClick: ((link: Link) => void) | undefined = undefined;
  export let onEdit: ((linkTree: LinkTree) => void) | undefined = undefined;

  // Store state
  const {
    currentLinkTree,
    currentLinks,
    isLoadingCurrent,
    isRegisteringClick,
    error,
    loadLinkTreeByRestaurant,
    loadLinkTreeByUsername,
    loadLinkTreeBySlug,
    loadLinkTree,
    registerLinkClick
  } = useLinkTrees();

  // Local state
  let displayLinkTree: LinkTree | null = null;
  let displayLinks: Link[] = [];
  let loading = false;
  let errorMessage = '';

  // Reactive statements
  $: if (linkTree) {
    displayLinkTree = linkTree;
    displayLinks = sortLinksByOrder(getActiveLinks(linkTree.links || []));
  } else if (currentLinkTree) {
    displayLinkTree = currentLinkTree;
    displayLinks = sortLinksByOrder(getActiveLinks(currentLinks || []));
  }

  $: loading = isLoadingCurrent;
  $: errorMessage = error || '';

  // Load LinkTree on mount
  onMount(async () => {
    if (linkTree) {
      return; // LinkTree provided as prop
    }

    try {
      if (linkTreeId) {
        await loadLinkTree(linkTreeId);
      } else if (restaurantId) {
        await loadLinkTreeByRestaurant(restaurantId);
      } else if (username) {
        await loadLinkTreeByUsername(username);
      } else if (slug) {
        await loadLinkTreeBySlug(slug);
      } else {
        console.warn('No identifier provided for LinkTree');
      }
    } catch (err) {
      console.error('Error loading LinkTree:', err);
    }
  });

  // Handle link click
  async function handleLinkClick(link: Link, event: Event) {
    // Prevent default if we have custom handler
    if (onLinkClick) {
      event.preventDefault();
      onLinkClick(link);
      return;
    }

    // Register click analytics if not in edit mode
    if (!editable && displayLinkTree?.id && link.id) {
      try {
        await registerLinkClick(displayLinkTree.id, link.id);
      } catch (err) {
        console.warn('Failed to register link click:', err);
      }
    }

    // Open link in new tab/window
    if (link.url) {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  }

  // Handle edit
  function handleEdit() {
    if (onEdit && displayLinkTree) {
      onEdit(displayLinkTree);
    }
  }

  // Get link icon class
  function getLinkIcon(link: Link): string {
    if (link.icon) return link.icon;
    return LINK_TYPE_ICONS[link.type] || 'link';
  }

  // Get theme classes
  function getThemeClasses(linkTree: LinkTree): string {
    const classes = ['linktree-container'];
    
    if (linkTree.theme) {
      classes.push(`theme-${linkTree.theme}`);
    }
    
    if (linkTree.buttonStyle) {
      classes.push(`buttons-${linkTree.buttonStyle}`);
    }
    
    return classes.join(' ');
  }

  // Get custom styles
  function getCustomStyles(linkTree: LinkTree): string {
    const styles: string[] = [];
    
    if (linkTree.backgroundColor) {
      styles.push(`--bg-color: ${linkTree.backgroundColor}`);
    }
    
    if (linkTree.textColor) {
      styles.push(`--text-color: ${linkTree.textColor}`);
    }
    
    if (linkTree.linksBackgroundColor) {
      styles.push(`--links-bg-color: ${linkTree.linksBackgroundColor}`);
    }
    
    if (linkTree.linksColor) {
      styles.push(`--links-text-color: ${linkTree.linksColor}`);
    }
    
    return styles.join('; ');
  }

  // Get link custom styles
  function getLinkStyles(link: Link): string {
    const styles: string[] = [];
    
    if (link.customColor) {
      styles.push(`--link-color: ${link.customColor}`);
    }
    
    return styles.join('; ');
  }
</script>

<!-- Loading State -->
{#if loading}
  <div class="linktree-loading">
    <div class="loading-spinner"></div>
    <p>Cargando...</p>
  </div>
{/if}

<!-- Error State -->
{#if errorMessage && !loading}
  <div class="linktree-error">
    <div class="error-icon">⚠️</div>
    <h3>Error</h3>
    <p>{errorMessage}</p>
  </div>
{/if}

<!-- LinkTree Display -->
{#if displayLinkTree && !loading && !errorMessage}
  <div 
    class={getThemeClasses(displayLinkTree)}
    style={getCustomStyles(displayLinkTree)}
  >
    <!-- Cover Image -->
    {#if displayLinkTree.coverImage?.url}
      <div class="cover-image">
        <img 
          src={displayLinkTree.coverImage.url} 
          alt="Cover" 
          loading="lazy"
        />
      </div>
    {/if}

    <!-- Header -->
    <header class="linktree-header">
      <!-- Profile Image -->
      {#if displayLinkTree.profileImage?.url}
        <div class="profile-image">
          <img 
            src={displayLinkTree.profileImage.url} 
            alt="Profile" 
            loading="lazy"
          />
        </div>
      {/if}

      <!-- Text Image or Title/Description -->
      {#if displayLinkTree.textImage?.url}
        <div class="text-image">
          <img 
            src={displayLinkTree.textImage.url} 
            alt="Title" 
            loading="lazy"
          />
        </div>
      {:else}
        <!-- Title -->
        {#if displayLinkTree.title}
          <h1 class="linktree-title">{displayLinkTree.title}</h1>
        {/if}

        <!-- Description -->
        {#if displayLinkTree.description}
          <p class="linktree-description">{displayLinkTree.description}</p>
        {/if}
      {/if}

      <!-- Edit Button -->
      {#if editable}
        <button 
          class="edit-button"
          on:click={handleEdit}
          title="Editar LinkTree"
        >
          <i class="icon-edit"></i>
          Editar
        </button>
      {/if}
    </header>

    <!-- Links -->
    {#if displayLinks.length > 0}
      <main class="linktree-links">
        {#each displayLinks as link (link.id)}
          <a 
            href={link.url}
            class="link-item"
            style={getLinkStyles(link)}
            on:click={(e) => handleLinkClick(link, e)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.description || link.title}
          >
            <div class="link-content">
              <!-- Icon -->
              {#if link.icon || link.type}
                <div class="link-icon">
                  <i class="icon-{getLinkIcon(link)}"></i>
                </div>
              {/if}

              <!-- Text -->
              <div class="link-text">
                <div class="link-title">{link.title}</div>
                {#if link.description}
                  <div class="link-description">{link.description}</div>
                {/if}
              </div>

              <!-- Analytics (if enabled) -->
              {#if showAnalytics && link.analytics}
                <div class="link-analytics">
                  <span class="click-count">
                    {formatClickCount(link.analytics.clicks)}
                  </span>
                </div>
              {/if}
            </div>
          </a>
        {/each}
      </main>
    {:else}
      <div class="no-links">
        <div class="no-links-icon">🔗</div>
        <h3>No hay enlaces</h3>
        <p>Aún no se han agregado enlaces a este LinkTree.</p>
      </div>
    {/if}

    <!-- Analytics Summary (if enabled) -->
    {#if showAnalytics && displayLinkTree.analytics}
      <footer class="linktree-analytics">
        <div class="analytics-item">
          <span class="analytics-value">{displayLinkTree.analytics.totalVisits}</span>
          <span class="analytics-label">Visitas</span>
        </div>
        <div class="analytics-item">
          <span class="analytics-value">{displayLinkTree.analytics.totalClicks}</span>
          <span class="analytics-label">Clics</span>
        </div>
        <div class="analytics-item">
          <span class="analytics-value">{displayLinkTree.analytics.uniqueVisitors}</span>
          <span class="analytics-label">Visitantes únicos</span>
        </div>
      </footer>
    {/if}

    <!-- Custom CSS -->
    {#if displayLinkTree.customCss}
      <style>
        {@html displayLinkTree.customCss}
      </style>
    {/if}
  </div>
{/if}

<style>
  .linktree-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top: 3px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .linktree-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
    color: #dc3545;
  }

  .error-icon {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .linktree-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 1rem;
    background-color: var(--bg-color, #ffffff);
    color: var(--text-color, #333333);
    min-height: 100vh;
  }

  .cover-image {
    width: 100%;
    height: 200px;
    margin-bottom: 1rem;
    border-radius: 12px;
    overflow: hidden;
  }

  .cover-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .linktree-header {
    text-align: center;
    margin-bottom: 2rem;
    position: relative;
  }

  .profile-image {
    width: 120px;
    height: 120px;
    margin: 0 auto 1rem;
    border-radius: 50%;
    overflow: hidden;
    border: 4px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .profile-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .text-image {
    margin-bottom: 1rem;
  }

  .text-image img {
    max-width: 100%;
    height: auto;
  }

  .linktree-title {
    font-size: 1.75rem;
    font-weight: bold;
    margin: 0 0 0.5rem 0;
    color: var(--text-color, #333);
  }

  .linktree-description {
    font-size: 1rem;
    margin: 0;
    opacity: 0.8;
    line-height: 1.5;
  }

  .edit-button {
    position: absolute;
    top: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background-color 0.2s;
  }

  .edit-button:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .linktree-links {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .link-item {
    background: var(--links-bg-color, #f8f9fa);
    color: var(--links-text-color, #333);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    padding: 1rem;
    text-decoration: none;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }

  .link-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: var(--link-color, #007bff);
  }

  .link-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .link-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--link-color, #007bff);
    color: white;
    border-radius: 8px;
    font-size: 1.25rem;
  }

  .link-text {
    flex: 1;
    min-width: 0;
  }

  .link-title {
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .link-description {
    font-size: 0.875rem;
    opacity: 0.7;
    line-height: 1.4;
  }

  .link-analytics {
    flex-shrink: 0;
    font-size: 0.75rem;
    color: #666;
    background: rgba(0, 0, 0, 0.05);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .no-links {
    text-align: center;
    padding: 3rem 1rem;
    color: #666;
  }

  .no-links-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .linktree-analytics {
    display: flex;
    justify-content: space-around;
    margin-top: 2rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 12px;
  }

  .analytics-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .analytics-value {
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 0.25rem;
  }

  .analytics-label {
    font-size: 0.75rem;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Theme variations */
  .theme-dark {
    background-color: #1a1a1a;
    color: #ffffff;
  }

  .theme-dark .link-item {
    background: #2a2a2a;
    color: #ffffff;
    border-color: #404040;
  }

  .theme-dark .linktree-analytics {
    background: rgba(255, 255, 255, 0.1);
  }

  /* Button style variations */
  .buttons-square .link-item {
    border-radius: 4px;
  }

  .buttons-pill .link-item {
    border-radius: 50px;
  }

  .buttons-pill .link-icon {
    border-radius: 50%;
  }

  /* Responsive design */
  @media (max-width: 480px) {
    .linktree-container {
      padding: 0.5rem;
    }

    .profile-image {
      width: 100px;
      height: 100px;
    }

    .linktree-title {
      font-size: 1.5rem;
    }

    .link-content {
      gap: 0.75rem;
    }

    .link-icon {
      width: 36px;
      height: 36px;
      font-size: 1.125rem;
    }
  }
</style>