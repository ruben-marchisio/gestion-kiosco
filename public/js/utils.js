console.log('utils.js cargado'); // Depuración

function iniciarEscaneo(contenedorCamara, callback) {
  console.log('Función iniciarEscaneo llamada'); // Depuración
  console.log('Contenedor de cámara:', contenedorCamara); // Depuración

  // Verificar si getUserMedia está disponible
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.log('getUserMedia no está disponible'); // Depuración
    alert('El escaneo no está disponible. Asegúrate de usar HTTPS o localhost para acceder a la cámara. Verifica también que tu navegador sea compatible con getUserMedia.');
    return;
  }

  contenedorCamara.style.display = 'block';
  console.log('Inicializando Quagga...'); // Depuración
  Quagga.init({
    inputStream: {
      name: 'Live',
      type: 'LiveStream',
      target: contenedorCamara,
      constraints: {
        facingMode: 'environment'
      }
    },
    decoder: {
      readers: ['ean_reader', 'upc_reader']
    }
  }, (err) => {
    if (err) {
      console.error('Error al iniciar Quagga:', err); // Depuración
      alert('Error al iniciar la cámara: ' + err.message);
      contenedorCamara.style.display = 'none';
      return;
    }
    console.log('Quagga iniciado correctamente'); // Depuración
    Quagga.start();
  });

  Quagga.onDetected((data) => {
    console.log('Código detectado:', data.codeResult.code); // Depuración
    const codigo = data.codeResult.code;
    Quagga.stop();
    contenedorCamara.style.display = 'none';
    callback(codigo);
  });
}