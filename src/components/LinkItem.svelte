<!-- src/components/LinkItem.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Link } from '../interfaces/links.ts';
  import { 
    formatClickCount, 
    LINK_TYPE_ICONS,
    LINK_TYPE_LABELS 
  } from '../interfaces/links.ts';

  // Props
  export let link: Link;
  export let editable = false;
  export let showAnalytics = false;
  export let showDescription = true;
  export let showIcon = true;
  export let compact = false;
  export let customStyle = '';
  export let onClick: ((link: Link, event: MouseEvent) => void) | undefined = undefined;

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    click: { link: Link; event: MouseEvent };
    edit: Link;
    delete: Link;
    toggle: Link;
  }>();

  // Handle click
  function handleClick(event: MouseEvent) {
    if (onClick) {
      onClick(link, event);
    } else {
      dispatch('click', { link, event });
    }
  }

  // Handle edit
  function handleEdit(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    dispatch('edit', link);
  }

  // Handle delete
  function handleDelete(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    if (confirm(`¿Estás seguro de que quieres eliminar "${link.title}"?`)) {
      dispatch('delete', link);
    }
  }

  // Handle toggle active
  function handleToggle(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    dispatch('toggle', link);
  }

  // Get icon class
  function getIconClass(): string {
    if (link.icon) return link.icon;
    return LINK_TYPE_ICONS[link.type] || 'link';
  }

  // Get custom styles
  function getLinkStyles(): string {
    const styles: string[] = [];
    
    if (link.customColor) {
      styles.push(`--link-color: ${link.customColor}`);
    }
    
    if (customStyle) {
      styles.push(customStyle);
    }
    
    return styles.join('; ');
  }

  // Check if link is external
  function isExternalLink(): boolean {
    try {
      const url = new URL(link.url);
      return url.hostname !== window.location.hostname;
    } catch {
      return false;
    }
  }

  // Get target and rel attributes
  function getLinkTarget(): string {
    return isExternalLink() ? '_blank' : '_self';
  }

  function getLinkRel(): string {
    return isExternalLink() ? 'noopener noreferrer' : '';
  }
</script>

<div 
  class="link-item"
  class:compact
  class:inactive={!link.active}
  class:editable
  style={getLinkStyles()}
>
  <!-- Main Link Content -->
  <a
    href={link.url}
    class="link-content"
    target={getLinkTarget()}
    rel={getLinkRel()}
    on:click={handleClick}
    aria-label={link.description || link.title}
  >
    <!-- Icon -->
    {#if showIcon}
      <div class="link-icon">
        <i class="icon-{getIconClass()}"></i>
      </div>
    {/if}

    <!-- Text Content -->
    <div class="link-text">
      <div class="link-title">{link.title}</div>
      
      {#if showDescription && link.description && !compact}
        <div class="link-description">{link.description}</div>
      {/if}
      
      <!-- Type Badge -->
      {#if !compact}
        <div class="link-meta">
          <span class="link-type">{LINK_TYPE_LABELS[link.type]}</span>
          
          {#if showAnalytics && link.analytics}
            <span class="link-analytics">
              {formatClickCount(link.analytics.clicks)} clics
            </span>
          {/if}
        </div>
      {/if}
    </div>

    <!-- External Link Indicator -->
    {#if isExternalLink()}
      <div class="external-indicator">
        <i class="icon-external-link"></i>
      </div>
    {/if}
  </a>

  <!-- Edit Controls -->
  {#if editable}
    <div class="edit-controls">
      <!-- Active Toggle -->
      <button
        class="control-btn toggle-btn"
        class:active={link.active}
        on:click={handleToggle}
        title={link.active ? 'Desactivar enlace' : 'Activar enlace'}
      >
        <i class="icon-{link.active ? 'eye' : 'eye-off'}"></i>
      </button>

      <!-- Edit Button -->
      <button
        class="control-btn edit-btn"
        on:click={handleEdit}
        title="Editar enlace"
      >
        <i class="icon-edit"></i>
      </button>

      <!-- Delete Button -->
      <button
        class="control-btn delete-btn"
        on:click={handleDelete}
        title="Eliminar enlace"
      >
        <i class="icon-trash"></i>
      </button>
    </div>
  {/if}

  <!-- Status Indicator -->
  {#if !link.active}
    <div class="status-badge inactive">
      Inactivo
    </div>
  {/if}
</div>

<style>
  .link-item {
    position: relative;
    border: 2px solid transparent;
    border-radius: 12px;
    background: var(--link-bg, #f8f9fa);
    transition: all 0.3s ease;
    overflow: hidden;
    group: link-item;
  }

  .link-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: var(--link-color, #3b82f6);
  }

  .link-item.compact {
    border-radius: 8px;
  }

  .link-item.inactive {
    opacity: 0.6;
  }

  .link-item.inactive:hover {
    opacity: 0.8;
  }

  .link-item.editable:hover .edit-controls {
    opacity: 1;
    transform: translateX(0);
  }

  .link-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    text-decoration: none;
    color: inherit;
    position: relative;
    width: 100%;
    min-height: 60px;
  }

  .link-item.compact .link-content {
    padding: 0.75rem;
    min-height: 48px;
    gap: 0.75rem;
  }

  .link-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--link-color, #3b82f6);
    color: white;
    font-size: 1.25rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .link-item.compact .link-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    font-size: 1rem;
  }

  .link-text {
    flex: 1;
    min-width: 0;
  }

  .link-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--link-text-color, #1f2937);
    margin-bottom: 0.25rem;
    line-height: 1.3;
  }

  .link-item.compact .link-title {
    font-size: 1rem;
    margin-bottom: 0;
  }

  .link-description {
    font-size: 0.875rem;
    color: var(--link-description-color, #6b7280);
    line-height: 1.4;
    margin-bottom: 0.5rem;
  }

  .link-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }

  .link-type {
    background: var(--link-color, #3b82f6);
    color: white;
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    text-transform: uppercase;
    font-weight: 500;
    letter-spacing: 0.5px;
  }

  .link-analytics {
    color: var(--link-description-color, #6b7280);
    font-weight: 500;
  }

  .external-indicator {
    flex-shrink: 0;
    color: var(--link-description-color, #6b7280);
    font-size: 0.875rem;
    opacity: 0.7;
  }

  .edit-controls {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transform: translateX(10px);
    transition: all 0.2s ease;
    z-index: 10;
  }

  .control-btn {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    transition: all 0.2s ease;
  }

  .control-btn:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }

  .control-btn.toggle-btn.active {
    background: #16a34a;
  }

  .control-btn.toggle-btn:not(.active) {
    background: #dc2626;
  }

  .control-btn.edit-btn:hover {
    background: #3b82f6;
  }

  .control-btn.delete-btn:hover {
    background: #dc2626;
  }

  .status-badge {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    z-index: 5;
  }

  .status-badge.inactive {
    background: #fef3c7;
    color: #d97706;
  }

  /* Link Animations */
  .link-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    transition: left 0.5s ease;
    z-index: 1;
  }

  .link-item:hover::before {
    left: 100%;
  }

  /* Click Animation */
  .link-content:active {
    transform: scale(0.98);
  }

  /* Theme Variations */
  .link-item.theme-dark {
    background: #374151;
    color: #f9fafb;
  }

  .link-item.theme-dark .link-title {
    color: #f9fafb;
  }

  .link-item.theme-dark .link-description {
    color: #d1d5db;
  }

  .link-item.theme-minimal {
    background: transparent;
    border: 2px solid #e5e7eb;
  }

  .link-item.theme-minimal:hover {
    background: #f9fafb;
  }

  /* Responsive Design */
  @media (max-width: 640px) {
    .link-content {
      padding: 0.875rem;
    }

    .link-icon {
      width: 40px;
      height: 40px;
      font-size: 1.125rem;
    }

    .link-title {
      font-size: 1rem;
    }

    .link-description {
      font-size: 0.8125rem;
    }

    .edit-controls {
      position: static;
      opacity: 1;
      transform: none;
      margin-top: 0.5rem;
      padding: 0 1rem 0.5rem;
      justify-content: flex-end;
    }

    .control-btn {
      width: 32px;
      height: 32px;
      font-size: 0.875rem;
    }
  }

  /* Print Styles */
  @media print {
    .edit-controls,
    .status-badge {
      display: none;
    }

    .link-item {
      border: 1px solid #e5e7eb;
      box-shadow: none;
      transform: none;
    }

    .link-content::after {
      content: ' (' attr(href) ')';
      font-size: 0.75rem;
      color: #6b7280;
    }
  }

  /* High Contrast Mode */
  @media (prefers-contrast: high) {
    .link-item {
      border: 2px solid #000;
    }

    .link-icon {
      border: 1px solid #000;
    }

    .control-btn {
      border: 1px solid #fff;
    }
  }

  /* Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    .link-item,
    .link-content,
    .control-btn,
    .edit-controls,
    .link-item::before {
      transition: none;
    }

    .link-item:hover {
      transform: none;
    }

    .link-item::before {
      display: none;
    }
  }
</style>