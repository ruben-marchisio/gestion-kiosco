console.log('utils.js cargado');

// Función para mostrar toasts
function mostrarToast(mensaje, tipo = 'info') {
  const toastContainer = document.querySelector('#toast-container') || document.createElement('div');
  if (!toastContainer.id) {
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${tipo === 'success' ? 'exito' : tipo === 'error' ? 'error' : 'info'}`;
  toast.innerHTML = mensaje;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 7000);
}

// Función para detectar si es un dispositivo móvil
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Función para iniciar el escaneo continuo de códigos de barras con control manual
function iniciarEscaneoContinuo(contenedorCamara, btnEscanear, btnDetener, inputCodigo, completarCallback, onCodeDetected) {
  let escaneoActivo = false;
  let estaEscaneando = false;
  let ultimoCodigoEscaneado = null;
  let videoElement = null;
  let inicializando = false;
  let stream = null;
  let intentos = 0;
  const maxIntentos = 3;

  const beepSound = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');

  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

  console.log('Iniciando escaneo continuo...');

  // Verificar soporte para getUserMedia
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('getUserMedia no está soportado en este navegador o entorno.');
    mostrarToast('El escaneo no está disponible. Usa un navegador compatible con HTTPS.', 'error');
    return;
  }

  // Verificar que el contenedor exista
  if (!contenedorCamara) {
    console.error('Contenedor de cámara no encontrado');
    mostrarToast('Error: Contenedor de cámara no encontrado.', 'error');
    return;
  }

  // Verificar carga de QuaggaJS
  if (typeof Quagga === 'undefined') {
    console.error('QuaggaJS no está cargado');
    mostrarToast('Error: No se pudo cargar la librería de escaneo.', 'error');
    return;
  }

  // Verificar HTTPS
  if (window.location.protocol !== 'https:') {
    console.error('El escaneo requiere HTTPS');
    mostrarToast('Error: El escaneo solo funciona en HTTPS.', 'error');
    return;
  }

  // Función para solicitar permisos de cámara
  async function solicitarPermisosCamara() {
    try {
      console.log('Solicitando permisos de cámara...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      console.log('Permiso de cámara concedido');
      mediaStream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error('Error al solicitar permisos de cámara:', err);
      mostrarToast('Error al solicitar acceso a la cámara: ' + err.message, 'error');
      return false;
    }
  }

  function stopVideoStream() {
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => {
        console.log('Deteniendo pista de video:', track);
        track.stop();
      });
      stream = null;
    }
    if (videoElement) {
      videoElement.srcObject = null;
      videoElement = null;
    }
    contenedorCamara.innerHTML = '';
    contenedorCamara.style.display = 'none';
    console.log('Stream de video detenido y contenedor limpiado');
  }

  async function inicializarQuagga() {
    if (inicializando) {
      console.log('Ya se está inicializando Quagga, ignorando nueva solicitud');
      return;
    }
    if (intentos >= maxIntentos) {
      console.error('Máximo de intentos alcanzado para inicializar Quagga');
      mostrarToast('Error: No se pudo inicializar el escáner tras varios intentos.', 'error');
      inicializando = false;
      return;
    }
    inicializando = true;
    intentos++;

    console.log('Inicializando Quagga, intento:', intentos);

    // Solicitar permisos antes de inicializar
    const permisosConcedidos = await solicitarPermisosCamara();
    if (!permisosConcedidos) {
      inicializando = false;
      intentos = 0; // Resetear intentos si falla por permisos
      return;
    }

    contenedorCamara.innerHTML = '';

    const isMobile = isMobileDevice();
    const numWorkers = isMobile ? 2 : 4;

    try {
      const videoContainer = document.createElement('div');
      videoContainer.style.width = '100%';
      videoContainer.style.height = '100%';
      contenedorCamara.appendChild(videoContainer);

      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoContainer,
          constraints: {
            facingMode: "environment"
          },
          area: { top: "10%", right: "10%", left: "10%", bottom: "10%" }
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: numWorkers,
        frequency: 18,
        decoder: {
          readers: ["ean_reader", "upc_reader", "code_128_reader"],
          multiple: false,
          debug: {
            drawBoundingBox: true,
            showFrequency: true,
            drawScanline: true,
            showPattern: true
          }
        },
        locate: true
      }, (err) => {
        if (err) {
          console.error('Error al inicializar Quagga:', err);
          mostrarToast('Error al inicializar la cámara: ' + err.message, 'error');
          escaneoActivo = false;
          estaEscaneando = false;
          contenedorCamara.style.display = 'none';
          btnEscanear.style.display = 'block';
          btnDetener.style.display = 'none';
          stopVideoStream();
          // Reintentar inicialización
          setTimeout(() => {
            console.log('Reintentando inicialización de Quagga...');
            inicializarQuagga();
          }, 1000);
          return;
        }

        console.log('Quagga inicializado correctamente');
        inicializando = false;
        intentos = 0;
        Quagga.start();
        escaneoActivo = true;
        estaEscaneando = false;
        contenedorCamara.style.display = 'block';
        btnEscanear.style.display = 'block';
        btnDetener.style.display = 'block';
        mostrarToast('Escáner activado. Mantén presionado para escanear.', 'success');

        videoElement = contenedorCamara.querySelector('video');
        if (videoElement) {
          console.log('Elemento de video encontrado:', videoElement);
          videoElement.style.display = 'block';
          stream = videoElement.srcObject;
          setTimeout(() => {
            console.log('Resolución real del video:', {
              width: videoElement.videoWidth,
              height: videoElement.videoHeight
            });
            console.log('Estado de Quagga:', {
              isRunning: Quagga.isRunning(),
              hasCamera: navigator.mediaDevices && navigator.mediaDevices.getUserMedia
            });
          }, 1000);
        } else {
          console.error('Elemento de video no encontrado después de inicializar Quagga');
          mostrarToast('Error: No se encontró el elemento de video.', 'error');
          stopVideoStream();
        }
      });

      // Timeout para evitar bloqueos
      setTimeout(() => {
        if (inicializando) {
          console.error('Timeout en inicialización de Quagga');
          mostrarToast('Error: Tiempo de espera agotado al inicializar el escáner.', 'error');
          inicializando = false;
          stopVideoStream();
          setTimeout(() => {
            console.log('Reintentando inicialización tras timeout...');
            inicializarQuagga();
          }, 1000);
        }
      }, 5000);
    } catch (error) {
      console.error('Excepción al inicializar Quagga:', error);
      mostrarToast('Excepción al inicializar el escáner: ' + error.message, 'error');
      inicializando = false;
      stopVideoStream();
      setTimeout(() => {
        console.log('Reintentando inicialización tras excepción...');
        inicializarQuagga();
      }, 1000);
    }
  }

  // Configurar eventos para el botón Escanear
  const isMobile = isMobileDevice();

  // Limpiar eventos previos
  btnEscanear.removeEventListener('click', null);
  btnEscanear.removeEventListener('touchstart', null);
  btnEscanear.removeEventListener('touchend', null);
  btnEscanear.removeEventListener('mousedown', null);
  btnEscanear.removeEventListener('mouseup', null);
  btnEscanear.removeEventListener('mouseleave', null);

  // Forzar inicialización al primer clic/touch
  function manejarInicioEscaneo(e) {
    e.preventDefault();
    console.log('Evento en btnEscanear, tipo:', e.type, 'escaneoActivo:', escaneoActivo, 'inicializando:', inicializando);
    btnEscanear.classList.add('boton-presionado');
    if (!escaneoActivo && !inicializando) {
      inicializando = true;
      inicializarQuagga();
    } else if (escaneoActivo) {
      estaEscaneando = true;
      ultimoCodigoEscaneado = null;
    }
  }

  function manejarFinEscaneo(e) {
    e.preventDefault();
    console.log('Fin de evento en btnEscanear, tipo:', e.type);
    btnEscanear.classList.remove('boton-presionado');
    estaEscaneando = false;
  }

  if (isMobile) {
    btnEscanear.addEventListener('touchstart', manejarInicioEscaneo);
    btnEscanear.addEventListener('touchend', manejarFinEscaneo);
  } else {
    btnEscanear.addEventListener('click', manejarInicioEscaneo);
    btnEscanear.addEventListener('mouseup', manejarFinEscaneo);
    btnEscanear.addEventListener('mouseleave', manejarFinEscaneo);
  }

  // Configurar evento para el botón Detener
  btnDetener.removeEventListener('click', null);
  btnDetener.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Click en btnDetener, escaneoActivo:', escaneoActivo, 'estaEscaneando:', estaEscaneando);
    if (escaneoActivo) {
      try {
        Quagga.stop();
        stopVideoStream();
        Quagga.offDetected();
        escaneoActivo = false;
        estaEscaneando = false;
        btnEscanear.style.display = 'block';
        btnDetener.style.display = 'none';
        console.log('Quagga detenido y eventos limpiados');
        mostrarToast('Escaneo detenido.', 'info');
      } catch (error) {
        console.error('Error al detener Quagga:', error);
        mostrarToast('Error al detener el escáner: ' + error.message, 'error');
      }
    } else {
      console.log('Escaneo no activo, no hay nada que detener');
    }
  });

  Quagga.offDetected();
  Quagga.onDetected((result) => {
    if (!estaEscaneando) {
      console.log('Ignorando detección, estaEscaneando es false');
      return;
    }

    const code = result.codeResult.code;
    console.log('Código detectado por Quagga:', code, 'Formato:', result.codeResult.format);

    if (code === ultimoCodigoEscaneado) {
      console.log('Código repetido, ignorando:', code);
      return;
    }

    ultimoCodigoEscaneado = code;
    estaEscaneando = false;

    beepSound.play().catch(err => {
      console.error('Error al reproducir el sonido:', err);
      mostrarToast('Error al reproducir el sonido: ' + err.message, 'error');
    });

    if (inputCodigo) {
      inputCodigo.value = code;
    }
    mostrarToast('Código escaneado: ' + code, 'success');

    const usuarioId = localStorage.getItem('usuarioId');
    console.log('Buscando código:', code, 'para usuario:', usuarioId);
    fetch(`${BASE_URL}/api/productos/codigo/${code}?usuarioId=${usuarioId}`, {
      signal: AbortSignal.timeout(15000)
    })
      .then(res => res.json())
      .then(data => {
        if (data.producto) {
          console.log('Producto encontrado en el stock local:', data.producto);
          completarCallback(data.producto);
          mostrarToast('Producto encontrado en tu stock local. Verifica y completa los datos.', 'success');
        } else {
          fetch(`${BASE_URL}/api/productos-comunes/codigo/${code}`, {
            signal: AbortSignal.timeout(15000)
          })
            .then(res => res.json())
            .then(dataComun => {
              if (dataComun.producto) {
                console.log('Producto encontrado en la base de datos común:', dataComun.producto);
                completarCallback(dataComun.producto);
                mostrarToast('Producto encontrado en la base de datos común. Por favor, completa los datos adicionales.', 'info');
              } else {
                console.log('Producto no encontrado en ninguna base de datos para el código:', code);
                completarCallback(null);
                mostrarToast('Producto no encontrado con ese código de barras. Intenta cargarlo manualmente.', 'info');
              }
            })
            .catch(err => {
              console.error('Error al buscar en la base de datos común:', err);
              mostrarToast('Error de conexión al buscar en la base de datos común. Intenta de nuevo en unos segundos.', 'error');
              completarCallback(null);
            });
        }
      })
      .catch(err => {
        console.error('Error al buscar en el stock local:', err);
        mostrarToast('Error de conexión al buscar en el stock local. Intenta de nuevo en unos segundos.', 'error');
        fetch(`${BASE_URL}/api/productos-comunes/codigo/${code}`, {
          signal: AbortSignal.timeout(15000)
        })
          .then(res => res.json())
          .then(dataComun => {
            if (dataComun.producto) {
              console.log('Producto encontrado en la base de datos común (respaldo):', dataComun.producto);
              completarCallback(dataComun.producto);
              mostrarToast('Producto encontrado en la base de datos común (respaldo). Por favor, completa los datos adicionales.', 'info');
            } else {
              console.log('Producto no encontrado en ninguna base de datos (respaldo) para el código:', code);
              completarCallback(null);
              mostrarToast('Error de conexión al servidor. Intenta de nuevo en unos segundos.', 'error');
            }
          })
          .catch(err => {
            console.error('Error al buscar en la base de datos común (respaldo):', err);
            mostrarToast('Error de conexión al servidor. Intenta de nuevo en unos segundos.', 'error');
            completarCallback(null);
          });
      });

    if (onCodeDetected) {
      onCodeDetected(code);
    }
  });

  // Depuración adicional para fallos en la detección
  Quagga.onProcessed((result) => {
    if (result && result.boxes) {
      console.log('Procesando frame, cajas detectadas:', result.boxes.length);
    } else {
      console.log('Procesando frame, sin cajas detectadas');
    }
  });
}