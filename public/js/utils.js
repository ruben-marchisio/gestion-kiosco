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

  // Agregar una guía visual para alinear el código de barras
  const guia = document.createElement('div');
  guia.className = 'guia-codigo';
  guia.style.position = 'absolute';
  guia.style.top = '50%';
  guia.style.left = '50%';
  guia.style.transform = 'translate(-50%, -50%)';
  guia.style.width = '80%';
  guia.style.height = '50px';
  guia.style.border = '2px dashed #ff0000';
  guia.style.pointerEvents = 'none';
  contenedorCamara.appendChild(guia);

  contenedorCamara.style.display = 'block';
  console.log('Inicializando Quagga...'); // Depuración
  Quagga.init({
    inputStream: {
      name: 'Live',
      type: 'LiveStream',
      target: contenedorCamara,
      constraints: {
        facingMode: 'environment',
        width: 1280, // Aumentar resolución para mejor lectura
        height: 720
      }
    },
    locator: {
      patchSize: 'medium', // Ajustar tamaño de parche para mejor detección
      halfSample: true // Mejorar rendimiento
    },
    numOfWorkers: 4, // Aumentar número de workers para mejor procesamiento
    decoder: {
      readers: ['ean_reader', 'upc_reader', 'code_128_reader'], // Agregar más tipos de códigos
      multiple: false
    },
    locate: true // Habilitar localización automática
  }, (err) => {
    if (err) {
      console.error('Error al iniciar Quagga:', err); // Depuración
      alert('Error al iniciar la cámara: ' + err.message);
      contenedorCamara.style.display = 'none';
      guia.remove();
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
    guia.remove();
    callback(codigo);
  });
}