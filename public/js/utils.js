console.log('utils.js cargado');
/* Propósito: Confirma la carga del script en la consola */
/* Nota: No está dentro de DOMContentLoaded, se ejecuta inmediatamente al cargar el archivo */

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
/* Propósito: Muestra notificaciones (toasts) en la interfaz */
/* Crea un contenedor si no existe, añade un toast con clase según el tipo (success, error, info) */
/* Muestra el mensaje durante 7 segundos antes de eliminarlo */
/* Usado en múltiples páginas (cargar-producto.html, stock.html) para feedback al usuario */

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
/* Propósito: Detecta si el dispositivo es móvil comprobando el userAgent */
/* Devuelve true para dispositivos móviles, false para escritorio */
/* Usado para ajustar eventos (touch vs. mouse) y configuración de Quagga */

function iniciarEscaneoContinuo(contenedorCamara, btnEscanear, btnDetener, inputCodigo, completarCallback, onCodeDetected) {
  let escaneoActivo = false;
  let estaEscaneando = false;
  let ultimoCodigoEscaneado = null;
  let videoElement = null;
  let inicializando = false;
  const beepSound = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;
  /* Propósito: Configura el escaneo continuo de códigos de barras usando QuaggaJS */
  /* Inicializa variables para controlar el estado del escáner */
  /* Define un sonido de confirmación y la URL base para solicitudes al backend */

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('getUserMedia no está soportado en este navegador o entorno.');
    mostrarToast('El escaneo no está disponible. Asegúrate de usar HTTPS o localhost.', 'error');
    return;
  }
  /* Verifica soporte para acceso a la cámara */
  /* Muestra un error si no está soportado (por ejemplo, en navegadores antiguos o entornos no seguros) */

  navigator.permissions.query({ name: 'camera' }).then((permissionStatus) => {
    console.log('Estado de permiso de la cámara:', permissionStatus.state);
    if (permissionStatus.state === 'denied') {
      mostrarToast('Permiso para acceder a la cámara denegado. Por favor, habilita el acceso en la configuración de tu navegador.', 'error');
    } else if (permissionStatus.state === 'prompt') {
      console.log('Solicitando permiso para acceder a la cámara...');
    }
  }).catch(err => {
    console.error('Error al verificar permisos de la cámara:', err);
    mostrarToast('Error al verificar permisos de la cámara: ' + err.message, 'error');
  });
  /* Propósito: Verifica el estado de los permisos de la cámara */
  /* Muestra un toast si el permiso está denegado o si hay un error */

  function stopVideoStream() {
    if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => {
        console.log('Deteniendo pista de video:', track);
        track.stop();
      });
      videoElement.srcObject = null;
      console.log('Stream de video detenido');
    } else {
      console.log('No se encontró un stream de video para detener');
    }
  }
  /* Propósito: Detiene el stream de video de la cámara */
  /* Finaliza todas las pistas de video para liberar la cámara */

  function inicializarQuagga() {
    if (inicializando) {
      console.log('Ya se está inicializando Quagga, ignorando nueva solicitud');
      return;
    }
    inicializando = true;
    console.log('Inicializando Quagga...');
    contenedorCamara.innerHTML = '';
    const isMobile = isMobileDevice();
    const numWorkers = isMobile ? 2 : navigator.hardwareConcurrency || 4;
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: contenedorCamara,
        constraints: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: "environment",
          focusMode: "continuous",
          focusDistance: { ideal: 0.5, min: 0.3, max: 0.7 },
          frameRate: { ideal: 30, min: 15 }
        },
        area: { top: "3%", right: "0.5%", left: "0.5%", bottom: "3%" }
      },
      locator: { patchSize: "x-large", halfSample: false },
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
      inicializando = false;
      if (err) {
        console.error('Error al inicializar Quagga:', err);
        mostrarToast('Error al inicializar la cámara: ' + err.message, 'error');
        escaneoActivo = false;
        estaEscaneando = false;
        contenedorCamara.style.display = 'none';
        btnEscanear.style.display = 'block';
        btnDetener.style.display = 'none';
        return;
      }
      console.log('Quagga inicializado correctamente');
      Quagga.start();
      escaneoActivo = true;
      estaEscaneando = false;
      contenedorCamara.style.display = 'block';
      btnEscanear.style.display = 'block';
      btnDetener.style.display = 'block';
      videoElement = contenedorCamara.querySelector('video');
      if (videoElement) {
        console.log('Elemento de video encontrado:', videoElement);
        videoElement.style.display = 'block';
        setTimeout(() => {
          console.log('Resolución real del video:', {
            width: videoElement.videoWidth,
            height: videoElement.videoHeight
          });
          console.log('Estado de Quagga:', {
            isRunning: Quagga.isRunning(),
            hasCamera: navigator.mediaDevices && navigator.mediaDevices.getUserMedia
          });
          console.log('Estilos aplicados al video:', window.getComputedStyle(videoElement));
        }, 1000);
      } else {
        console.error('Elemento de video no encontrado después de inicializar Quagga');
      }
    });
  }
  /* Propósito: Inicializa QuaggaJS para el escaneo de códigos */
  /* Configura la cámara con resolución ideal, enfoque continuo, y decodificadores para EAN, UPC, Code 128 */
  /* Ajusta el número de workers según si es móvil o escritorio */
  /* Muestra la cámara y botones, maneja errores de inicialización */

  /* Configurar eventos para el botón Escanear */
  const isMobile = isMobileDevice();
  if (isMobile) {
    btnEscanear.addEventListener('touchstart', (e) => {
      e.preventDefault();
      console.log('Touchstart en btnEscanear, escaneoActivo:', escaneoActivo, 'estaEscaneando:', estaEscaneando);
      btnEscanear.classList.add('boton-presionado');
      if (escaneoActivo) {
        estaEscaneando = true;
        ultimoCodigoEscaneado = null;
      } else {
        inicializarQuagga();
      }
    });
    btnEscanear.addEventListener('touchend', (e) => {
      e.preventDefault();
      console.log('Touchend en btnEscanear');
      btnEscanear.classList.remove('boton-presionado');
      estaEscaneando = false;
    });
  } else {
    btnEscanear.addEventListener('mousedown', (e) => {
      e.preventDefault();
      console.log('Mousedown en btnEscanear, escaneoActivo:', escaneoActivo, 'estaEscaneando:', estaEscaneando);
      btnEscanear.classList.add('boton-presionado');
      if (escaneoActivo) {
        estaEscaneando = true;
        ultimoCodigoEscaneado = null;
      } else {
        inicializarQuagga();
      }
    });
    btnEscanear.addEventListener('mouseup', (e) => {
      e.preventDefault();
      console.log('Mouseup en btnEscanear');
      btnEscanear.classList.remove('boton-presionado');
      estaEscaneando = false;
    });
    btnEscanear.addEventListener('mouseleave', (e) => {
      console.log('Mouseleave en btnEscanear');
      btnEscanear.classList.remove('boton-presionado');
      estaEscaneando = false;
    });
  }
  /* Propósito: Configura eventos para el botón Escanear */
  /* Diferencia entre móvil (touchstart/touchend) y escritorio (mousedown/mouseup/mouseleave) */
  /* Activa el escaneo continuo al presionar, detiene al soltar */

  /* Configurar evento para el botón Detener */
  btnDetener.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Click en btnDetener, escaneoActivo:', escaneoActivo, 'estaEscaneando:', estaEscaneando);
    if (escaneoActivo) {
      Quagga.stop();
      stopVideoStream();
      escaneoActivo = false;
      estaEscaneando = false;
      contenedorCamara.style.display = 'none';
      btnEscanear.style.display = 'block';
      btnDetener.style.display = 'none';
      ultimoCodigoEscaneado = null;
      Quagga.offDetected();
      console.log('Quagga detenido y eventos limpiados');
    } else {
      console.log('Escaneo no activo, no hay nada que detener');
    }
  });
  /* Propósito: Detiene el escaneo al hacer clic en el botón Detener */
  /* Para Quagga, detiene el stream de video, oculta la cámara, y limpia eventos */

  Quagga.offDetected();
  Quagga.onDetected((result) => {
    if (!estaEscaneando) {
      console.log('Ignorando detección, estaEscaneando es false');
      return;
    }
    const code = result.codeResult.code;
    console.log('Código detectado por Quagga:', code);
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
  /* Propósito: Maneja la detección de códigos por Quagga */
  /* Ignora detecciones si no está escaneando o si el código es repetido */
  /* Reproduce un sonido, actualiza el input (si existe), y busca el producto en el stock local y la base de datos común */
  /* Llama a completarCallback con el producto encontrado o null */
}