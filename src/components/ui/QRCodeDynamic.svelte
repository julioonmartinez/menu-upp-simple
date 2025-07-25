<script>
  import QRCode from 'qrcode-generator';
  export let url = '';
  let dataUrl = '';

  $: {
    if (url) {
      const qr = QRCode(0, 'L');
      qr.addData(url);
      qr.make();
      dataUrl = qr.createDataURL(8); // 8 = tamaño de pixel
    } else {
      dataUrl = '';
    }
  }
</script>

<img src={dataUrl} alt="Código QR" class="qr-image" /> 