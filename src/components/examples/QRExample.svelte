<!-- src/components/examples/QRExample.svelte -->
<script>
  import QRCodeGenerator from '../dashboard/edit-sections/QRCodeGenerator.svelte';
  
  // Ejemplos de URLs para diferentes propósitos
  let examples = [
    {
      title: 'Menú Digital',
      url: 'https://menu-upp.com/menu/restaurant-123',
      description: 'QR para acceder al menú digital del restaurante'
    },
    {
      title: 'Reservas Online',
      url: 'https://menu-upp.com/reservar/restaurant-123',
      description: 'QR para hacer reservas directamente'
    },
    {
      title: 'Pedidos a Domicilio',
      url: 'https://menu-upp.com/pedidos/restaurant-123',
      description: 'QR para pedidos a domicilio y delivery'
    },
    {
      title: 'Eventos Especiales',
      url: 'https://menu-upp.com/evento/happy-hour-2024',
      description: 'QR para eventos especiales y promociones'
    }
  ];

  let selectedExample = examples[0];
  let customUrl = '';
</script>

<div class="qr-examples">
  <h2 class="examples-title">
    <i class="fas fa-qrcode"></i>
    Ejemplos de Uso del Generador QR
  </h2>
  
  <p class="examples-description">
    Descubre diferentes formas de usar el generador de códigos QR para tu restaurante.
  </p>

  <!-- Selector de ejemplos -->
  <div class="example-selector">
    <label class="selector-label">Selecciona un ejemplo:</label>
    <select bind:value={selectedExample} class="example-select">
      {#each examples as example}
        <option value={example}>{example.title}</option>
      {/each}
    </select>
  </div>

  <!-- URL personalizada -->
  <div class="custom-url">
    <label class="url-label">O ingresa una URL personalizada:</label>
    <input
      type="url"
      bind:value={customUrl}
      placeholder="https://tu-restaurante.com/menu"
      class="url-input"
    />
  </div>

  <!-- Generador QR -->
  <div class="qr-section">
    <h3 class="section-title">
      {selectedExample.title}
    </h3>
    <p class="section-description">
      {selectedExample.description}
    </p>
    
    <QRCodeGenerator 
      url={customUrl || selectedExample.url}
      restaurantName="Restaurante Ejemplo"
      on:generated={(event) => {
        console.log('QR generado para:', event.detail.dataUrl);
      }}
    />
  </div>

  <!-- Casos de uso -->
  <div class="use-cases">
    <h3 class="cases-title">Casos de Uso Recomendados</h3>
    
    <div class="cases-grid">
      <div class="case-item">
        <div class="case-icon">
          <i class="fas fa-utensils"></i>
        </div>
        <h4 class="case-title">Menús Digitales</h4>
        <p class="case-description">
          Coloca QR en las mesas para que los clientes accedan al menú digital actualizado.
        </p>
      </div>

      <div class="case-item">
        <div class="case-icon">
          <i class="fas fa-calendar-check"></i>
        </div>
        <h4 class="case-title">Reservas</h4>
        <p class="case-description">
          QR en tarjetas de presentación o redes sociales para facilitar las reservas.
        </p>
      </div>

      <div class="case-item">
        <div class="case-icon">
          <i class="fas fa-truck"></i>
        </div>
        <h4 class="case-title">Delivery</h4>
        <p class="case-description">
          QR en folletos o redes sociales para pedidos a domicilio.
        </p>
      </div>

      <div class="case-item">
        <div class="case-icon">
          <i class="fas fa-star"></i>
        </div>
        <h4 class="case-title">Reseñas</h4>
        <p class="case-description">
          QR en recibos para que los clientes dejen reseñas y calificaciones.
        </p>
      </div>

      <div class="case-item">
        <div class="case-icon">
          <i class="fas fa-gift"></i>
        </div>
        <h4 class="case-title">Promociones</h4>
        <p class="case-description">
          QR en materiales promocionales para ofertas especiales.
        </p>
      </div>

      <div class="case-item">
        <div class="case-icon">
          <i class="fas fa-users"></i>
        </div>
        <h4 class="case-title">Eventos</h4>
        <p class="case-description">
          QR para eventos especiales, happy hours o cenas temáticas.
        </p>
      </div>
    </div>
  </div>

  <!-- Consejos de implementación -->
  <div class="implementation-tips">
    <h3 class="tips-title">
      <i class="fas fa-lightbulb"></i>
      Consejos de Implementación
    </h3>
    
    <div class="tips-list">
      <div class="tip-item">
        <i class="fas fa-check-circle"></i>
        <span>Imprime los QR en alta calidad para mejor escaneo</span>
      </div>
      <div class="tip-item">
        <i class="fas fa-check-circle"></i>
        <span>Coloca los QR en lugares bien iluminados</span>
      </div>
      <div class="tip-item">
        <i class="fas fa-check-circle"></i>
        <span>Usa colores que contrasten con el fondo</span>
      </div>
      <div class="tip-item">
        <i class="fas fa-check-circle"></i>
        <span>Incluye instrucciones claras junto al QR</span>
      </div>
      <div class="tip-item">
        <i class="fas fa-check-circle"></i>
        <span>Actualiza los QR cuando cambien las URLs</span>
      </div>
      <div class="tip-item">
        <i class="fas fa-check-circle"></i>
        <span>Prueba los QR antes de imprimir en grandes cantidades</span>
      </div>
    </div>
  </div>
</div>

<style>
  .qr-examples {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-2xl);
  }

  .examples-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    font-size: var(--font-3xl);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-lg) 0;
    text-align: center;
  }

  .examples-title i {
    color: var(--primary-color);
  }

  .examples-description {
    font-size: var(--font-lg);
    color: var(--text-secondary);
    text-align: center;
    margin: 0 0 var(--spacing-3xl) 0;
    line-height: var(--leading-relaxed);
  }

  /* Selector de ejemplos */
  .example-selector {
    margin-bottom: var(--spacing-2xl);
  }

  .selector-label {
    display: block;
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
  }

  .example-select {
    width: 100%;
    max-width: 400px;
    padding: var(--spacing-md);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: var(--font-base);
  }

  /* URL personalizada */
  .custom-url {
    margin-bottom: var(--spacing-3xl);
  }

  .url-label {
    display: block;
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
  }

  .url-input {
    width: 100%;
    max-width: 500px;
    padding: var(--spacing-md);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: var(--font-base);
  }

  .url-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--primary-bg);
  }

  /* Sección QR */
  .qr-section {
    background: var(--bg-tertiary);
    border-radius: var(--radius-xl);
    padding: var(--spacing-3xl);
    margin-bottom: var(--spacing-3xl);
    border: 1px solid var(--bg-accent);
  }

  .section-title {
    font-size: var(--font-xl);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-sm) 0;
  }

  .section-description {
    font-size: var(--font-sm);
    color: var(--text-secondary);
    margin: 0 0 var(--spacing-2xl) 0;
  }

  /* Casos de uso */
  .use-cases {
    margin-bottom: var(--spacing-3xl);
  }

  .cases-title {
    font-size: var(--font-2xl);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-2xl) 0;
    text-align: center;
  }

  .cases-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-2xl);
  }

  .case-item {
    background: var(--bg-tertiary);
    border-radius: var(--radius-xl);
    padding: var(--spacing-2xl);
    border: 1px solid var(--bg-accent);
    transition: all var(--transition-normal);
  }

  .case-item:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .case-icon {
    width: 60px;
    height: 60px;
    background: var(--primary-gradient);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--spacing-lg);
  }

  .case-icon i {
    font-size: var(--font-xl);
    color: var(--text-inverse);
  }

  .case-title {
    font-size: var(--font-lg);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-sm) 0;
  }

  .case-description {
    font-size: var(--font-sm);
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    margin: 0;
  }

  /* Consejos */
  .implementation-tips {
    background: var(--info-bg);
    border: 1px solid var(--info);
    border-radius: var(--radius-xl);
    padding: var(--spacing-3xl);
  }

  .tips-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-xl);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-2xl) 0;
  }

  .tips-title i {
    color: var(--info);
  }

  .tips-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-lg);
  }

  .tip-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-sm);
    color: var(--text-secondary);
  }

  .tip-item i {
    color: var(--success);
    font-size: var(--font-base);
    flex-shrink: 0;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .qr-examples {
      padding: var(--spacing-lg);
    }
    
    .examples-title {
      font-size: var(--font-2xl);
    }
    
    .cases-grid {
      grid-template-columns: 1fr;
    }
    
    .tips-list {
      grid-template-columns: 1fr;
    }
  }
</style> 