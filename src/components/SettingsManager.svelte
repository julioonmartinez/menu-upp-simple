<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '../stores/authStore';
  import { fade, fly } from 'svelte/transition';

  let isLoading = false;
  let message = '';
  let messageType = '';

  // Configuraciones
  let settings : any = {
    notifications: {
      email: true,
      push: false,
      sms: false
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false
    },
    preferences: {
      language: 'es',
      theme: 'auto',
      timezone: 'America/Mexico_City'
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30
    }
  };

  onMount(() => {
    // Cargar configuraciones guardadas (aquí podrías cargar desde localStorage o API)
    loadSettings();
  });

  function loadSettings() {
    // Cargar desde localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        settings = { ...settings, ...JSON.parse(savedSettings) };
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }

  function saveSettings() {
    localStorage.setItem('userSettings', JSON.stringify(settings));
    showMessage('Configuración guardada correctamente', 'success');
  }

  function showMessage(text: string, type: string) {
    message = text;
    messageType = type;
    setTimeout(() => {
      message = '';
    }, 3000);
  }

  function handleSettingChange(category: string, key: string, value: any) {
    settings[category][key] = value;
    // Auto-save
    saveSettings();
  }

  function resetSettings() {
    if (confirm('¿Estás seguro de que quieres restablecer todas las configuraciones?')) {
      settings = {
        notifications: {
          email: true,
          push: false,
          sms: false
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false
        },
        preferences: {
          language: 'es',
          theme: 'auto',
          timezone: 'America/Mexico_City'
        },
        security: {
          twoFactorAuth: false,
          sessionTimeout: 30
        }
      };
      localStorage.removeItem('userSettings');
      showMessage('Configuración restablecida', 'success');
    }
  }
</script>

<div class="settings-manager">
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

  <!-- Notificaciones -->
  <div class="settings-section">
    <div class="section-header">
      <h2 class="section-title">
        <i class="fa-solid fa-bell"></i>
        Notificaciones
      </h2>
      <p class="section-description">Configura cómo recibir notificaciones</p>
    </div>

    <div class="settings-content">
      <div class="setting-item">
        <div class="setting-info">
          <h3 class="setting-label">Notificaciones por email</h3>
          <p class="setting-description">Recibe actualizaciones importantes por correo electrónico</p>
        </div>
        <label class="toggle">
          <input 
            type="checkbox" 
            bind:checked={settings.notifications.email}
            on:change={() => handleSettingChange('notifications', 'email', settings.notifications.email)}
          />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <h3 class="setting-label">Notificaciones push</h3>
          <p class="setting-description">Recibe notificaciones en tiempo real en tu navegador</p>
        </div>
        <label class="toggle">
          <input 
            type="checkbox" 
            bind:checked={settings.notifications.push}
            on:change={() => handleSettingChange('notifications', 'push', settings.notifications.push)}
          />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <h3 class="setting-label">Notificaciones SMS</h3>
          <p class="setting-description">Recibe alertas importantes por mensaje de texto</p>
        </div>
        <label class="toggle">
          <input 
            type="checkbox" 
            bind:checked={settings.notifications.sms}
            on:change={() => handleSettingChange('notifications', 'sms', settings.notifications.sms)}
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>
  </div>

  <!-- Privacidad -->
  <div class="settings-section">
    <div class="section-header">
      <h2 class="section-title">
        <i class="fa-solid fa-shield-alt"></i>
        Privacidad
      </h2>
      <p class="section-description">Controla la visibilidad de tu información</p>
    </div>

    <div class="settings-content">
      <div class="setting-item">
        <div class="setting-info">
          <h3 class="setting-label">Visibilidad del perfil</h3>
          <p class="setting-description">Quién puede ver tu perfil público</p>
        </div>
        <select 
          class="select"
          bind:value={settings.privacy.profileVisibility}
          on:change={() => handleSettingChange('privacy', 'profileVisibility', settings.privacy.profileVisibility)}
        >
          <option value="public">Público</option>
          <option value="private">Privado</option>
          <option value="friends">Solo amigos</option>
        </select>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <h3 class="setting-label">Mostrar email</h3>
          <p class="setting-description">Permitir que otros usuarios vean tu correo electrónico</p>
        </div>
        <label class="toggle">
          <input 
            type="checkbox" 
            bind:checked={settings.privacy.showEmail}
            on:change={() => handleSettingChange('privacy', 'showEmail', settings.privacy.showEmail)}
          />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <h3 class="setting-label">Mostrar teléfono</h3>
          <p class="setting-description">Permitir que otros usuarios vean tu número de teléfono</p>
        </div>
        <label class="toggle">
          <input 
            type="checkbox" 
            bind:checked={settings.privacy.showPhone}
            on:change={() => handleSettingChange('privacy', 'showPhone', settings.privacy.showPhone)}
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>
  </div>

  <!-- Preferencias -->
  <div class="settings-section">
    <div class="section-header">
      <h2 class="section-title">
        <i class="fa-solid fa-cog"></i>
        Preferencias
      </h2>
      <p class="section-description">Personaliza tu experiencia</p>
    </div>

    <div class="settings-content">
      <div class="setting-item">
        <div class="setting-info">
          <h3 class="setting-label">Idioma</h3>
          <p class="setting-description">Idioma de la interfaz</p>
        </div>
        <select 
          class="select"
          bind:value={settings.preferences.language}
          on:change={() => handleSettingChange('preferences', 'language', settings.preferences.language)}
        >
          <option value="es">Español</option>
          <option value="en">English</option>
          <option value="fr">Français</option>
        </select>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <h3 class="setting-label">Tema</h3>
          <p class="setting-description">Apariencia visual de la aplicación</p>
        </div>
        <select 
          class="select"
          bind:value={settings.preferences.theme}
          on:change={() => handleSettingChange('preferences', 'theme', settings.preferences.theme)}
        >
          <option value="auto">Automático</option>
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
        </select>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <h3 class="setting-label">Zona horaria</h3>
          <p class="setting-description">Tu zona horaria local</p>
        </div>
        <select 
          class="select"
          bind:value={settings.preferences.timezone}
          on:change={() => handleSettingChange('preferences', 'timezone', settings.preferences.timezone)}
        >
          <option value="America/Mexico_City">México (GMT-6)</option>
          <option value="America/New_York">Nueva York (GMT-5)</option>
          <option value="America/Los_Angeles">Los Ángeles (GMT-8)</option>
          <option value="Europe/Madrid">Madrid (GMT+1)</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Seguridad -->
  <div class="settings-section">
    <div class="section-header">
      <h2 class="section-title">
        <i class="fa-solid fa-lock"></i>
        Seguridad
      </h2>
      <p class="section-description">Configuración de seguridad de tu cuenta</p>
    </div>

    <div class="settings-content">
      <div class="setting-item">
        <div class="setting-info">
          <h3 class="setting-label">Autenticación de dos factores</h3>
          <p class="setting-description">Añade una capa extra de seguridad a tu cuenta</p>
        </div>
        <label class="toggle">
          <input 
            type="checkbox" 
            bind:checked={settings.security.twoFactorAuth}
            on:change={() => handleSettingChange('security', 'twoFactorAuth', settings.security.twoFactorAuth)}
          />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <h3 class="setting-label">Tiempo de sesión</h3>
          <p class="setting-description">Tiempo antes de cerrar sesión automáticamente (minutos)</p>
        </div>
        <select 
          class="select"
          bind:value={settings.security.sessionTimeout}
          on:change={() => handleSettingChange('security', 'sessionTimeout', settings.security.sessionTimeout)}
        >
          <option value={15}>15 minutos</option>
          <option value={30}>30 minutos</option>
          <option value={60}>1 hora</option>
          <option value={120}>2 horas</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Acciones -->
  <div class="settings-actions">
    <button class="btn btn-secondary" on:click={resetSettings}>
      <i class="fa-solid fa-undo"></i>
      Restablecer todo
    </button>
    <button class="btn btn-primary" on:click={saveSettings}>
      <i class="fa-solid fa-save"></i>
      Guardar cambios
    </button>
  </div>
</div>

<style>
  .settings-manager {
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
  .settings-section {
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    padding: var(--spacing-2xl);
    box-shadow: var(--shadow-md);
  }

  .section-header {
    margin-bottom: var(--spacing-2xl);
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    font-size: var(--font-xl);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-sm) 0;
  }

  .section-description {
    color: var(--text-muted);
    margin: 0;
  }

  /* Contenido */
  .settings-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-xl);
    padding: var(--spacing-lg);
    background: var(--bg-tertiary);
    border-radius: var(--radius-lg);
    transition: all var(--transition-fast);
  }

  .setting-item:hover {
    background: var(--bg-accent);
  }

  .setting-info {
    flex: 1;
  }

  .setting-label {
    font-size: var(--font-base);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-xs) 0;
  }

  .setting-description {
    font-size: var(--font-sm);
    color: var(--text-muted);
    margin: 0;
  }

  /* Toggle switch */
  .toggle {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
  }

  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--bg-accent);
    transition: all var(--transition-fast);
    border-radius: 24px;
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: all var(--transition-fast);
    border-radius: 50%;
  }

  input:checked + .toggle-slider {
    background-color: var(--primary-color);
  }

  input:checked + .toggle-slider:before {
    transform: translateX(26px);
  }

  /* Select */
  .select {
    padding: var(--spacing-md) var(--spacing-lg);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: var(--font-base);
    cursor: pointer;
    min-width: 150px;
  }

  .select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }

  /* Acciones */
  .settings-actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: flex-end;
    padding: var(--spacing-2xl);
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .setting-item {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-lg);
    }

    .settings-actions {
      flex-direction: column;
    }

    .select {
      width: 100%;
    }
  }

  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    .settings-section {
      background: var(--bg-primary);
      border-color: var(--bg-accent);
    }

    .setting-item {
      background: var(--bg-tertiary);
    }

    .setting-item:hover {
      background: var(--bg-accent);
    }

    .settings-actions {
      background: var(--bg-primary);
      border-color: var(--bg-accent);
    }
  }
</style> 