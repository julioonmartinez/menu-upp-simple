<!-- src/components/dashboard/edit-sections/TechnicalConfigForm.svelte -->
<script>
  import QRCodeGeneratorComponent from './QRCodeGenerator.svelte';
  export let restaurant;
  export let restaurantId;
  // Solo conservamos lo necesario para el QR
  $: publicUrl = restaurant?.customDomain 
    ? `https://${restaurant.customDomain}`
    : `${typeof window !== 'undefined' ? `https://menuupp.com` : ''}/${restaurant?.username}`;
</script>

<div class="technical-config-form">
  <!-- Header -->
  <div class="form-header">
    <h2>Configuraciones Técnicas</h2>
    <p class="subtitle">
      Gestiona códigos QR, dominios personalizados y configuraciones avanzadas
    </p>
  </div>

  <!-- Código QR -->
  <div class="form-section">
    <h3 class="section-title">
      <i class="fas fa-qrcode"></i>
      Código QR
    </h3>
    <p class="section-description">
      Genera un código QR personalizado para que tus clientes accedan fácilmente a tu página.
    </p>

    <QRCodeGeneratorComponent 
      url={publicUrl}
      restaurantName={restaurant?.username}
      restaurantId={restaurantId}
      qrCodeData={restaurant?.qrCode_data || null}
    />
  </div>
</div>

<style>
  .technical-config-form {
    width: 100%;
  }

  .form-header h2 {
    color: var(--primary-color);
    font-size: var(--font-3xl);
    font-weight: var(--weight-bold);
    margin: 0 0 var(--spacing-md) 0;
  }

  .form-header .subtitle {
    color: var(--text-muted);
    font-size: var(--font-base);
    margin: 0;
  }
  .form-section {
    padding: var(--spacing-2xl);
    /* background: var(--bg-tertiary); */
    /* border-radius: var(--radius-xl); */
    /* border: 1px solid var(--bg-accent); */
    margin-bottom: var(--spacing-2xl);
  }
  .section-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-xl);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-sm) 0;
  }
  .section-title i {
    color: var(--primary-color);
  }
  .section-description {
    font-size: var(--font-sm);
    color: var(--text-secondary);
    margin: 0 0 var(--spacing-2xl) 0;
    line-height: var(--leading-relaxed);
  }
</style>