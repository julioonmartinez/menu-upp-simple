<!-- src/components/restaurant/CategoryList.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { categoryUtils } from '../../services/index.ts';
  import type { Category } from '../../interfaces/category.ts';

  // Props
  export let categories: Category[] = [];
  export let searchTerm: string = '';
  export let isDeleting: boolean = false;

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Local state
  let deletingId: string | null = null;

  // Methods
  function handleEdit(category: Category) {
    dispatch('edit', category);
  }

  function handleDelete(category: Category) {
    if (!category.id) return;
    
    deletingId = category.id;
    dispatch('delete', { 
      id: category.id,
      name: category.name 
    });
    
    // Reset deleting state after a delay
    setTimeout(() => {
      deletingId = null;
    }, 1000);
  }

  function highlightText(text: string, searchTerm: string): string {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  function truncateDescription(description: string, maxLength: number = 100): string {
    if (!description) return '';
    return description.length > maxLength
      ? description.slice(0, maxLength) + '...'
      : description;
  }

  function isBeingDeleted(categoryId: string): boolean {
    return isDeleting && deletingId === categoryId;
  }
</script>

<div class="category-list">
  {#each categories as category (category.id)}
    <div class="category-card" class:deleting={isBeingDeleted(category.id || '')}>
      <!-- Category Info -->
      <div class="category-info">
        <div class="category-header">
          <h4 class="category-name">
            {@html highlightText(category.name, searchTerm)}
          </h4>
          
          <!-- Category Badge -->
          <div class="category-badge">
            <svg class="badge-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Categoría
          </div>
        </div>

        {#if category.description}
          <p class="category-description">
            {@html highlightText(truncateDescription(category.description), searchTerm)}
          </p>
        {:else}
          <p class="category-description-empty">
            Sin descripción
          </p>
        {/if}

        <!-- Category Meta -->
        <div class="category-meta">
          <div class="meta-item">
            <svg class="meta-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span class="meta-text">ID: {category.id}</span>
          </div>
        </div>
      </div>

      <!-- Category Actions -->
      <div class="category-actions">
        <button
          type="button"
          class="action-btn action-edit"
          on:click={() => handleEdit(category)}
          disabled={isDeleting}
          title="Editar categoría"
        >
          <svg class="action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span class="action-text">Editar</span>
        </button>

        <button
          type="button"
          class="action-btn action-delete"
          on:click={() => handleDelete(category)}
          disabled={isDeleting}
          title="Eliminar categoría"
        >
          {#if isBeingDeleted(category.id || '')}
            <svg class="action-icon action-spinner" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="action-text">Eliminando...</span>
          {:else}
            <svg class="action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span class="action-text">Eliminar</span>
          {/if}
        </button>
      </div>
    </div>
  {/each}
</div>

<style>
  .category-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .category-card {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.5rem;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    transition: all 0.15s ease-in-out;
  }

  .category-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .category-card.deleting {
    opacity: 0.6;
    pointer-events: none;
    background-color: #fef2f2;
    border-color: #fecaca;
  }

  /* Category Info */
  .category-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
  }

  .category-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .category-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
    word-break: break-word;
  }

  .category-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background-color: #eff6ff;
    color: #1d4ed8;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .badge-icon {
    width: 0.875rem;
    height: 0.875rem;
  }

  .category-description {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
    word-break: break-word;
  }

  .category-description-empty {
    font-size: 0.875rem;
    color: #9ca3af;
    margin: 0;
    font-style: italic;
  }

  .category-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .meta-icon {
    width: 1rem;
    height: 1rem;
    color: #9ca3af;
  }

  .meta-text {
    font-size: 0.75rem;
    color: #6b7280;
  }

  /* Category Actions */
  .category-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    white-space: nowrap;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-edit {
    background-color: #ffffff;
    color: #3b82f6;
    border-color: #3b82f6;
  }

  .action-edit:hover:not(:disabled) {
    background-color: #3b82f6;
    color: #ffffff;
  }

  .action-delete {
    background-color: #ffffff;
    color: #dc2626;
    border-color: #dc2626;
  }

  .action-delete:hover:not(:disabled) {
    background-color: #dc2626;
    color: #ffffff;
  }

  .action-icon {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }

  .action-spinner {
    animation: spin 1s linear infinite;
  }

  .action-text {
    font-size: 0.75rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Highlight styles */
  :global(.category-list mark) {
    background-color: #fef3c7;
    color: #92400e;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-weight: 500;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .category-card {
      flex-direction: column;
      gap: 1rem;
    }

    .category-actions {
      align-self: stretch;
      justify-content: space-between;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .action-btn {
      flex: 1;
      justify-content: center;
    }

    .category-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .category-badge {
      align-self: flex-start;
    }
  }

  @media (max-width: 480px) {
    .category-card {
      padding: 1rem;
    }

    .action-text {
      display: none;
    }

    .action-btn {
      padding: 0.5rem;
      border-radius: 0.5rem;
    }

    .action-icon {
      width: 1.25rem;
      height: 1.25rem;
    }

    .category-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
</style>