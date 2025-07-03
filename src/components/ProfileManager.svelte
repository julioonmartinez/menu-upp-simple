<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '../stores/authStore';
  import { fade, fly } from 'svelte/transition';

  let user: any = null;
  let isEditing = false;
  let isLoading = false;
  let message = '';
  let messageType = '';

  // Form data
  let formData : any = {
    name: '',
    email: '',
    phone: '',
    bio: ''
  };

  onMount(() => {
    // Obtener datos del usuario actual
    const currentUser = authStore.getCurrentUser();
    if (currentUser) {
      user = currentUser;
      formData = {
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone:  '',
        bio:  ''
      };
    }
  });

  function handleEdit() {
    isEditing = true;
  }

  function handleCancel() {
    isEditing = false;
    // Restaurar datos originales
    if (user) {
      formData = {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || ''
      };
    }
  }

  async function handleSave() {
    isLoading = true;
    message = '';
    
    try {
      const result = await authStore.updateUser({
        name: formData.name,
        // phone: formData.phone,
        // bio: formData.bio
      });

      if (result.success) {
        message = 'Perfil actualizado correctamente';
        messageType = 'success';
        isEditing = false;
        user = result.user;
      } else {
        message = result.error || 'Error al actualizar el perfil';
        messageType = 'error';
      }
    } catch (error) {
      message = 'Error inesperado al actualizar el perfil';
      messageType = 'error';
    } finally {
      isLoading = false;
    }
  }

  function handleInputChange(field: string, value: string) {
    formData[field] = value;
  }
</script>

<div class="profile-manager">
  <!-- Mensaje de estado -->
  {#if message}
    <div 
      class="message"
      class:success={messageType === 'success'}
      class:error={messageType === 'error'}
      transition:fly={{ y: -20, duration: 300 }}
    >
      <i class="fa-solid {messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>{message}</span>
    </div>
  {/if}

  <!-- Información del perfil -->
  <div class="profile-section">
    <div class="section-header">
      <h2 class="section-title">Información Personal</h2>
      {#if !isEditing}
        <button class="edit-btn" on:click={handleEdit}>
          <i class="fa-solid fa-edit"></i>
          Editar
        </button>
      {/if}
    </div>

    <div class="profile-content">
      <!-- Avatar -->
      <div class="avatar-section">
        <div class="avatar">
          <i class="fa-solid fa-user"></i>
        </div>
        {#if isEditing}
          <button class="avatar-upload-btn">
            <i class="fa-solid fa-camera"></i>
            Cambiar foto
          </button>
        {/if}
      </div>

      <!-- Formulario -->
      <div class="form-section">
        <div class="form-group">
          <label for="name">Nombre completo</label>
          {#if isEditing}
            <input
              id="name"
              type="text"
              class="input"
              bind:value={formData.name}
              placeholder="Tu nombre completo"
            />
          {:else}
            <p class="field-value">{formData.name || 'No especificado'}</p>
          {/if}
        </div>

        <div class="form-group">
          <label for="email">Correo electrónico</label>
          <p class="field-value email">{formData.email}</p>
          <small class="field-note">El correo electrónico no se puede cambiar</small>
        </div>

        <div class="form-group">
          <label for="phone">Teléfono</label>
          {#if isEditing}
            <input
              id="phone"
              type="tel"
              class="input"
              bind:value={formData.phone}
              placeholder="Tu número de teléfono"
            />
          {:else}
            <p class="field-value">{formData.phone || 'No especificado'}</p>
          {/if}
        </div>

        <div class="form-group">
          <label for="bio">Biografía</label>
          {#if isEditing}
            <textarea
              id="bio"
              class="input"
              bind:value={formData.bio}
              placeholder="Cuéntanos sobre ti..."
              rows="4"
            ></textarea>
          {:else}
            <p class="field-value">{formData.bio || 'No especificado'}</p>
          {/if}
        </div>

        <!-- Acciones -->
        {#if isEditing}
          <div class="form-actions">
            <button 
              class="btn btn-secondary"
              on:click={handleCancel}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button 
              class="btn btn-primary"
              on:click={handleSave}
              disabled={isLoading}
            >
              {#if isLoading}
                <i class="fa-solid fa-spinner fa-spin"></i>
                Guardando...
              {:else}
                <i class="fa-solid fa-save"></i>
                Guardar cambios
              {/if}
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Información de la cuenta -->
  <div class="account-section">
    <h2 class="section-title">Información de la Cuenta</h2>
    
    <div class="account-info">
      <div class="info-item">
        <span class="info-label">Rol:</span>
        <span class="info-value">
          {#if user?.role === 'admin'}
            <i class="fa-solid fa-shield-alt"></i> Administrador
          {:else if user?.role === 'owner'}
            <i class="fa-solid fa-crown"></i> Propietario
          {:else if user?.role === 'customer'}
            <i class="fa-solid fa-user"></i> Cliente
          {:else}
            <i class="fa-solid fa-user"></i> Usuario
          {/if}
        </span>
      </div>
      
      <div class="info-item">
        <span class="info-label">Miembro desde:</span>
        <span class="info-value">
          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : 'No disponible'}
        </span>
      </div>
      
      <div class="info-item">
        <span class="info-label">Última actividad:</span>
        <span class="info-value">
          {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('es-ES') : 'No disponible'}
        </span>
      </div>
    </div>
  </div>
</div>

<style>
  .profile-manager {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3xl);
  }

  /* Mensaje */
  .message {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    font-weight: var(--weight-medium);
  }

  .message.success {
    background: var(--success-bg);
    color: var(--success);
    border: 1px solid var(--success);
  }

  .message.error {
    background: var(--error-bg);
    color: var(--error);
    border: 1px solid var(--error);
  }

  /* Secciones */
  .profile-section,
  .account-section {
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    padding: var(--spacing-2xl);
    box-shadow: var(--shadow-md);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-2xl);
  }

  .section-title {
    font-size: var(--font-2xl);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
    margin: 0;
  }

  .edit-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-weight: var(--weight-medium);
  }

  .edit-btn:hover {
    background: var(--bg-accent);
    color: var(--text-primary);
    border-color: var(--primary-color);
  }

  /* Contenido del perfil */
  .profile-content {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--spacing-3xl);
    align-items: start;
  }

  /* Avatar */
  .avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-lg);
  }

  .avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 120px;
    background: var(--primary-gradient);
    border-radius: var(--radius-full);
    color: var(--text-inverse);
    font-size: var(--font-4xl);
    box-shadow: var(--shadow-lg);
  }

  .avatar-upload-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: var(--font-sm);
  }

  .avatar-upload-btn:hover {
    background: var(--bg-accent);
    color: var(--text-primary);
  }

  /* Formulario */
  .form-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .form-group label {
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    font-size: var(--font-sm);
  }

  .field-value {
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--bg-tertiary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    color: var(--text-primary);
    margin: 0;
  }

  .field-value.email {
    color: var(--primary-color);
    font-weight: var(--weight-medium);
  }

  .field-note {
    font-size: var(--font-xs);
    color: var(--text-muted);
    margin: 0;
  }

  /* Acciones del formulario */
  .form-actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: flex-end;
    margin-top: var(--spacing-lg);
  }

  /* Información de la cuenta */
  .account-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
    background: var(--bg-tertiary);
    border-radius: var(--radius-lg);
  }

  .info-label {
    font-weight: var(--weight-medium);
    color: var(--text-secondary);
  }

  .info-value {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-weight: var(--weight-medium);
    color: var(--text-primary);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .profile-content {
      grid-template-columns: 1fr;
      gap: var(--spacing-2xl);
    }

    .avatar-section {
      order: -1;
    }

    .section-header {
      flex-direction: column;
      gap: var(--spacing-lg);
      align-items: stretch;
    }

    .form-actions {
      flex-direction: column;
    }

    .info-item {
      flex-direction: column;
      gap: var(--spacing-sm);
      align-items: flex-start;
    }
  }

  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    .profile-section,
    .account-section {
      background: var(--bg-primary);
      border-color: var(--bg-accent);
    }

    .field-value {
      background: var(--bg-tertiary);
      border-color: var(--bg-accent);
    }

    .info-item {
      background: var(--bg-tertiary);
    }
  }
</style> 