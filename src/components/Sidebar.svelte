<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { authStore } from '../stores/authStore';
  import { quintOut, elasticOut } from 'svelte/easing';

  // Props
  export let isOpen = false;
  export let onClose: () => void = () => {};

  // Estado local
  let user: any = null;
  let isAuthenticated = false;
  let isAdmin = false;
  let isOwner = false;
  let isCustomer = false;
  let userRole: string | null = null;
  let unsubscribeAuth: () => void;
  let sidebarElement: HTMLElement;
  let backdropElement: HTMLElement;

  // Navegación
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'fa-solid fa-chart-line',
      href: '/dashboard',
      description: 'Panel principal'
    },
    {
      id: 'restaurants',
      label: 'Mis Restaurantes',
      icon: 'fa-solid fa-store',
      href: '/dashboard/restaurant-create',
      description: 'Gestionar restaurantes'
    },
    {
      id: 'new-restaurant',
      label: 'Nuevo Restaurante',
      icon: 'fa-solid fa-plus-circle',
      href: '/dashboard/first-restaurant',
      description: 'Crear restaurante',
      highlight: true
    },
    // {
    //   id: 'profile',
    //   label: 'Mi Perfil',
    //   icon: 'fa-solid fa-user-circle',
    //   href: '/profile',
    //   description: 'Configuración personal'
    // },
    // {
    //   id: 'settings',
    //   label: 'Configuración',
    //   icon: 'fa-solid fa-cog',
    //   href: '/settings',
    //   description: 'Ajustes del sistema'
    // }
  ];

  // Navegación
  function navigateTo(href: string) {
    if (typeof window !== 'undefined') {
      window.location.href = href;
    }
    closeSidebar();
  }

  function closeSidebar() {
    onClose();
  }

  function handleLogout() {
    authStore.logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === backdropElement) {
      closeSidebar();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeSidebar();
    }
  }

  onMount(() => {
    // Suscribirse al store de autenticación
    unsubscribeAuth = authStore.subscribe((state) => {
      user = state.user;
      isAuthenticated = state.isAuthenticated;
      isAdmin = authStore.getCurrentState().user?.role === 'admin';
      isOwner = authStore.getCurrentState().user?.role === 'owner';
      isCustomer = authStore.getCurrentState().user?.role === 'customer';
      userRole = state.user?.role || null;
    });

    // Event listeners solo en el navegador
    if (typeof window !== 'undefined') {
      document.addEventListener('keydown', handleKeydown);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('keydown', handleKeydown);
        document.body.style.overflow = '';
      }
    };
  });

  onDestroy(() => {
    if (unsubscribeAuth) unsubscribeAuth();
    if (typeof window !== 'undefined') {
      document.body.style.overflow = '';
    }
  });

  // Actualizar overflow del body cuando cambie isOpen
  $: if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }
</script>

<!-- Backdrop -->
{#if isOpen}
  <div 
    class="sidebar-backdrop"
    bind:this={backdropElement}
    on:click={handleBackdropClick}
    transition:fade={{ duration: 200 }}
    role="presentation"
    aria-hidden="true"
  />
{/if}

<!-- Sidebar -->
<div 
  class="sidebar"
  class:open={isOpen}
  bind:this={sidebarElement}
  role="navigation"
  aria-label="Menú de navegación principal"
  transition:fly={{ x: -300, duration: 300, easing: quintOut }}
>
  <!-- Header del Sidebar -->
  <div class="sidebar-header">
    <div class="brand-section">
      <div class="brand-logo">
        <span class="brand-text">Menu</span><span class="brand-accent">Upp</span>
      </div>
      <p class="brand-subtitle">Panel de Control</p>
    </div>
    
    <button 
      class="close-btn"
      on:click={closeSidebar}
      aria-label="Cerrar menú"
    >
      <i class="fa-solid fa-times"></i>
    </button>
  </div>

  <!-- Información del Usuario -->
  {#if user}
    <div class="user-section flex gap-sm " in:fly={{ y: 20, duration: 300, delay: 100 }}>
      <div class="user-avatar">
        <i class="fa-solid fa-user"></i>
      </div>
      <div class="user-info">
        <h3 class="user-name">{user.name || user.email}</h3>
        <p class="user-role">
          {#if isAdmin}
            <i class="fa-solid fa-shield-alt"></i> Administrador
          {:else if isOwner}
            <i class="fa-solid fa-crown"></i> Propietario
          {:else if isCustomer}
            <i class="fa-solid fa-user"></i> Cliente
          {:else}
            <i class="fa-solid fa-user"></i> Usuario
          {/if}
        </p>
      </div>
    </div>
  {/if}

  <!-- Navegación Principal -->
  <nav class="sidebar-nav" in:fly={{ y: 20, duration: 300, delay: 200 }}>
    <ul class="nav-list">
      {#each menuItems as item}
        <li class="nav-item">
          <button 
            class="nav-link"
            class:highlight={item.highlight}
            on:click={() => navigateTo(item.href)}
            aria-label={item.description}
          >
            <div class="nav-icon">
              <i class={item.icon}></i>
            </div>
            <div class="nav-content">
              <span class="nav-label">{item.label}</span>
              <span class="nav-description">{item.description}</span>
            </div>
            <div class="nav-arrow">
              <i class="fa-solid fa-chevron-right"></i>
            </div>
          </button>
        </li>
      {/each}
    </ul>
  </nav>

  <!-- Sección de Acciones -->
  <!-- <div class="sidebar-actions" in:fly={{ y: 20, duration: 300, delay: 300 }}>
    <div class="action-divider">
      <span>Acciones</span>
    </div>
    
    <button 
      class="action-btn help-btn"
      on:click={() => navigateTo('/help')}
    >
      <i class="fa-solid fa-question-circle"></i>
      <span>Ayuda</span>
    </button>
    
    <button 
      class="action-btn feedback-btn"
      on:click={() => navigateTo('/feedback')}
    >
      <i class="fa-solid fa-comment"></i>
      <span>Feedback</span>
    </button>
  </div> -->

  <!-- Footer con Logout -->
  <div class="sidebar-footer" in:fly={{ y: 20, duration: 300, delay: 400 }}>
    <button 
      class="logout-btn"
      on:click={handleLogout}
      aria-label="Cerrar sesión"
    >
      <i class="fa-solid fa-sign-out-alt"></i>
      <span>Cerrar Sesión</span>
    </button>
    
    <div class="footer-info">
      <p class="version">v1.0.0</p>
      <p class="copyright">© 2024 MenuUpp</p>
    </div>
  </div>
</div>

<style>
  .sidebar-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 9998;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 320px;
    height: 100vh;
    background: var(--bg-primary);
    border-right: 1px solid var(--bg-accent);
    box-shadow: var(--shadow-xl);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform: translateX(-100%);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  /* Header */
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xl);
    border-bottom: 1px solid var(--bg-accent);
    background: var(--bg-glass);
    backdrop-filter: var(--backdrop-blur);
    flex-shrink: 0;
  }

  .brand-section {
    flex: 1;
  }

  .brand-logo {
    display: flex;
    align-items: center;
    font-weight: var(--weight-bold);
    font-size: var(--font-xl);
    letter-spacing: -0.025em;
    margin-bottom: var(--spacing-xs);
  }

  .brand-text {
    color: var(--text-primary);
  }

  .brand-accent {
    color: var(--primary-color);
  }

  .brand-subtitle {
    font-size: var(--font-sm);
    color: var(--text-muted);
    margin: 0;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: var(--bg-tertiary);
    color: var(--text-muted);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .close-btn:hover {
    background: var(--bg-accent);
    color: var(--text-primary);
    transform: scale(1.05);
  }

  /* User Section - Reducido */
  .user-section {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--bg-accent);
    background: var(--bg-secondary);
    flex-shrink: 0;
    
  }

  .user-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: var(--primary-gradient);
    border-radius: var(--radius-full);
    /* margin-bottom: var(--spacing-md); */
    color: var(--text-inverse);
    font-size: var(--font-xl);
  }

  .user-info {
    text-align: center;
  }

  .user-name {
    font-size: var(--font-base);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-xs) 0;
  }

  .user-role {
    font-size: var(--font-sm);
    color: var(--text-muted);
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
  }

  /* Navigation - Mejorado */
  .sidebar-nav {
    flex: 1;
    padding: var(--spacing-lg) 0;
    overflow-y: auto;
  }

  .nav-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .nav-item {
    margin: 0;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    width: 100%;
    padding: var(--spacing-lg) var(--spacing-xl);
    border: none;
    background: none;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition-normal);
    text-align: left;
    position: relative;
    overflow: hidden;
    font-size: var(--font-base);
  }

  .nav-link::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 107, 53, 0.1), transparent);
    transition: left 0.6s ease;
  }

  .nav-link:hover::before {
    left: 100%;
  }

  .nav-link:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    transform: translateX(4px);
  }

  .nav-link.highlight {
    /* background: var(--primary-gradient); */
    /* color: var(--text-inverse); */
    /* margin: var(--spacing-md) var(--spacing-xl); */
    border-radius: var(--radius-xl);
    /* box-shadow: var(--primary-glow); */
  }

  .nav-link.highlight:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-lg);
    background: var(--bg-tertiary);
    color: var(--text-muted);
    transition: all var(--transition-fast);
    flex-shrink: 0;
    font-size: var(--font-lg);
  }

  .nav-link:hover .nav-icon {
    background: var(--primary-color);
    color: var(--text-inverse);
    transform: scale(1.1);
  }

  .nav-link.highlight .nav-icon {
    /* background: rgba(255, 255, 255, 0.2);
    color: var(--text-inverse); */
  }

  .nav-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .nav-label {
    font-size: var(--font-base);
    font-weight: var(--weight-medium);
  }

  .nav-description {
    font-size: var(--font-sm);
    color: var(--text-light);
    opacity: 0.8;
  }

  .nav-arrow {
    color: var(--text-light);
    transition: all var(--transition-fast);
  }

  .nav-link:hover .nav-arrow {
    color: var(--primary-color);
    transform: translateX(4px);
  }

  /* Actions Section */
  .sidebar-actions {
    padding: var(--spacing-lg) var(--spacing-xl);
    border-top: 1px solid var(--bg-accent);
    flex-shrink: 0;
  }

  .action-divider {
    display: flex;
    align-items: center;
    margin-bottom: var(--spacing-md);
    font-size: var(--font-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .action-divider::before {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--bg-accent);
    margin-right: var(--spacing-md);
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    border: none;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-fast);
    margin-bottom: var(--spacing-sm);
  }

  .action-btn:hover {
    background: var(--bg-accent);
    color: var(--text-primary);
    transform: translateX(4px);
  }

  .help-btn:hover {
    background: var(--info-bg);
    color: var(--info);
  }

  .feedback-btn:hover {
    background: var(--success-bg);
    color: var(--success);
  }

  /* Footer */
  .sidebar-footer {
    padding: var(--spacing-lg) var(--spacing-xl);
    border-top: 1px solid var(--bg-accent);
    background: var(--bg-secondary);
    flex-shrink: 0;
  }

  .logout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    border: none;
    background: var(--error-bg);
    color: var(--error);
    border-radius: var(--radius-xl);
    cursor: pointer;
    transition: all var(--transition-normal);
    font-weight: var(--weight-semibold);
    margin-bottom: var(--spacing-md);
  }

  .logout-btn:hover {
    background: var(--error);
    color: var(--text-inverse);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .footer-info {
    text-align: center;
  }

  .version,
  .copyright {
    font-size: var(--font-xs);
    color: var(--text-light);
    margin: var(--spacing-xs) 0;
  }

  /* Scrollbar personalizado */
  .sidebar-nav::-webkit-scrollbar {
    width: 6px;
  }

  .sidebar-nav::-webkit-scrollbar-track {
    background: var(--bg-tertiary);
  }

  .sidebar-nav::-webkit-scrollbar-thumb {
    background: var(--bg-accent);
    border-radius: var(--radius-full);
  }

  .sidebar-nav::-webkit-scrollbar-thumb:hover {
    background: var(--text-light);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .sidebar {
      width: 100%;
      max-width: 320px;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .sidebar {
      background: var(--bg-primary);
      border-right-color: var(--bg-accent);
    }

    .sidebar-header {
      background: var(--bg-glass);
    }

    .user-section {
      background: var(--bg-secondary);
    }

    .sidebar-footer {
      background: var(--bg-secondary);
    }
  }

  /* Focus styles for accessibility */
  .close-btn:focus-visible,
  .nav-link:focus-visible,
  .action-btn:focus-visible,
  .logout-btn:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .nav-link::before,
    .nav-link:hover,
    .action-btn:hover,
    .logout-btn:hover {
      transition: none;
      transform: none;
    }
  }
</style> 