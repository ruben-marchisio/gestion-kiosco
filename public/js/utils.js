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

// Función para iniciar el escaneo continuo de códigos de barras
function iniciarEscaneoContinuo(contenedorCamara, btnEscanear, btnDetener, inputCodigo, completarCallback, onCodeDetected) {
  let escaneoActivo = false;
  let estaEscaneando = false;
  let ultimoCodigoEscaneado = null;
  let videoElement = null;
  let inicializando = false;
  let stream = null;
  let intentos = 0;
  const maxIntentos = 3;
  let codigoCandidato = null;
  let contadorConfirmaciones = 0;
  const confirmacionesRequeridas = 3; // Número de detecciones consecutivas para confirmar un código

  const beepSound = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');

  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

  console.log('Iniciando configuración de escaneo...');
  console.log('Protocolo actual:', window.location.protocol, 'URL:', window.location.href);

  // Verificar soporte para getUserMedia
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('getUserMedia no está soportado en este navegador o entorno.');
    mostrarToast('El escaneo no está disponible. Usa un navegador compatible con HTTPS.', 'error');
    return { inicializar: () => Promise.resolve(false), detener: () => {} };
  }

  // Verificar que el contenedor exista
  if (!contenedorCamara) {
    console.error('Contenedor de cámara no encontrado');
    mostrarToast('Error: Contenedor de cámara no encontrado.', 'error');
    return { inicializar: () => Promise.resolve(false), detener: () => {} };
  }

  // Verificar carga de QuaggaJS
  if (typeof Quagga === 'undefined') {
    console.error('QuaggaJS no está cargado');
    mostrarToast('Error: No se pudo cargar la librería de escaneo.', 'error');
    return { inicializar: () => Promise.resolve(false), detener: () => {} };
  }

  // Función para verificar el estado de la cámara
  async function verificarEstadoCamara() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Dispositivos de video disponibles:', videoDevices);
      return videoDevices.length > 0;
    } catch (err) {
      console.error('Error al verificar estado de la cámara:', err);
      return false;
    }
  }

  // Función para solicitar permisos de cámara
  async function solicitarPermisosCamara() {
    try {
      console.log('Solicitando permisos de cámara...');
      const permissionStatus = await navigator.permissions.query({ name: 'camera' });
      console.log('Estado de permiso de cámara:', permissionStatus.state);
      if (permissionStatus.state === 'denied') {
        console.error('Permiso de cámara denegado');
        mostrarToast('Permiso de cámara denegado. Habilítalo en la configuración del navegador.', 'error');
        return false;
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      console.log('Permiso de cámara concedido');
      mediaStream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error('Error al solicitar permisos de cámara:', err.name, err.message);
      mostrarToast('Error al solicitar acceso a la cámara: ' + err.message, 'error');
      return false;
    }
  }

  function stopVideoStream() {
    try {
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
      // Forzar liberación de recursos en móvil con retraso
      if (isMobileDevice()) {
        console.log('Forzando liberación de recursos de cámara en móvil');
        setTimeout(() => {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(tempStream => {
              tempStream.getTracks().forEach(track => track.stop());
              console.log('Recursos de cámara liberados en móvil');
            })
            .catch(err => console.error('Error al liberar recursos en móvil:', err));
        }, 2000);
      }
    } catch (error) {
      console.error('Error al detener el stream de video:', error);
      mostrarToast('Error al liberar recursos de la cámara: ' + error.message, 'error');
    }
  }

  function resetQuagga() {
    console.log('Reiniciando estado de Quagga');
    if (Quagga) {
      Quagga.stop();
      Quagga.offDetected();
      Quagga.offProcessed();
      // Finalizar workers y requestAnimationFrame
      if (Quagga.Worker) {
        Quagga.Worker.terminate();
      }
    }
    escaneoActivo = false;
    estaEscaneando = false;
    ultimoCodigoEscaneado = null;
    codigoCandidato = null;
    contadorConfirmaciones = 0;
    videoElement = null;
    stream = null;
    intentos = 0;
    inicializando = false;
  }

  async function inicializarQuagga() {
    if (inicializando) {
      console.log('Ya se está inicializando Quagga, ignorando nueva solicitud');
      return false;
    }
    if (intentos >= maxIntentos) {
      console.error('Máximo de intentos alcanzado para inicializar Quagga');
      mostrarToast('Error: No se pudo inicializar el escáner tras varios intentos.', 'error');
      inicializando = false;
      return false;
    }
    inicializando = true;
    intentos++;

    console.log('Inicializando Quagga, intento:', intentos);

    // Verificar estado de la cámara
    const camaraDisponible = await verificarEstadoCamara();
    if (!camaraDisponible) {
      console.error('No se detectaron dispositivos de video');
      mostrarToast('Error: No se detectaron cámaras disponibles.', 'error');
      inicializando = false;
      intentos = 0;
      return false;
    }

    // Solicitar permisos antes de inicializar
    const permisosConcedidos = await solicitarPermisosCamara();
    if (!permisosConcedidos) {
      inicializando = false;
      intentos = 0;
      return false;
    }

    contenedorCamara.innerHTML = '';

    const isMobile = isMobileDevice();
    const numWorkers = isMobile ? 1 : 4; // Reducir workers en móvil
    const frequency = isMobile ? 20 : 22; // Reducir frecuencia en móvil

    try {
      const videoContainer = document.createElement('div');
      videoContainer.style.width = '100%';
      videoContainer.style.height = '100%';
      contenedorCamara.appendChild(videoContainer);

      // Crear canvas con willReadFrequently: true
      const canvas = document.createElement('canvas');
      canvas.setAttribute('willReadFrequently', 'true');
      videoContainer.appendChild(canvas);

      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoContainer,
          constraints: {
            facingMode: "environment",
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          },
          area: { top: "5%", right: "5%", left: "5%", bottom: "5%" }
        },
        locator: {
          patchSize: "small",
          halfSample: true
        },
        numOfWorkers: numWorkers,
        frequency: frequency,
        decoder: {
          readers: ["ean_reader", "ean_8_reader", "upc_reader", "code_128_reader"],
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
          console.error('Error al inicializar Quagga:', err.name, err.message);
          mostrarToast('Error al inicializar la cámara: ' + err.message, 'error');
          escaneoActivo = false;
          estaEscaneando = false;
          contenedorCamara.style.display = 'none';
          btnEscanear.style.display = 'block';
          btnDetener.style.display = 'none';
          stopVideoStream();
          inicializando = false;
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
              isRunning: escaneoActivo,
              hasCamera: navigator.mediaDevices && navigator.mediaDevices.getUserMedia
            });
          }, 1000);
        } else {
          console.error('Elemento de video no encontrado después de inicializar Quagga');
          mostrarToast('Error: No se encontró el elemento de video.', 'error');
          stopVideoStream();
          escaneoActivo = false;
        }
      });
    } catch (error) {
      console.error('Excepción al inicializar Quagga:', error.name, error.message);
      mostrarToast('Excepción al inicializar el escáner: ' + error.message, 'error');
      inicializando = false;
      stopVideoStream();
      return false;
    }

    return true;
  }

  // Configurar eventos para el botón Escanear
  const isMobile = isMobileDevice();

  function limpiarEventos() {
    btnEscanear.removeEventListener('click', null);
    btnEscanear.removeEventListener('touchstart', null);
    btnEscanear.removeEventListener('touchend', null);
    btnEscanear.removeEventListener('mousedown', null);
    btnEscanear.removeEventListener('mouseup', null);
    btnEscanear.removeEventListener('mouseleave', null);
  }

  function asignarEventosEscaneo() {
    limpiarEventos();
    if (isMobile) {
      btnEscanear.addEventListener('touchstart', manejarInicioEscaneo);
      btnEscanear.addEventListener('touchend', manejarFinEscaneo);
    } else {
      btnEscanear.addEventListener('mousedown', manejarInicioEscaneo);
      btnEscanear.addEventListener('mouseup', manejarFinEscaneo);
      btnEscanear.addEventListener('mouseleave', manejarFinEscaneo);
    }
  }

  // Manejar mantener presionado para escanear
  function manejarInicioEscaneo(e) {
    e.preventDefault();
    console.log('Evento de inicio de escaneo, tipo:', e.type);
    btnEscanear.classList.add('boton-presionado');
    if (escaneoActivo) {
      estaEscaneando = true;
      ultimoCodigoEscaneado = null;
      codigoCandidato = null;
      contadorConfirmaciones = 0;
      if (Quagga && !Quagga.isPaused()) {
        Quagga.start();
      }
    }
  }

  function manejarFinEscaneo(e) {
    e.preventDefault();
    console.log('Evento de fin de escaneo, tipo:', e.type);
    btnEscanear.classList.remove('boton-presionado');
    estaEscaneando = false;
    if (Quagga) {
      Quagga.pause();
    }
  }

  asignarEventosEscaneo();

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
        asignarEventosEscaneo();
      } catch (error) {
        console.error('Error al detener Quagga:', error);
        mostrarToast('Error al detener el escáner: ' + error.message, 'error');
      }
    } else {
      console.log('Escaneo no activo, no hay nada que detener');
    }
  });

  // Manejar detección de códigos
  Quagga.offDetected();
  Quagga.onDetected((result) => {
    if (!estaEscaneando) {
      console.log('Ignorando detección, estaEscaneando es false');
      return;
    }

    const code = result.codeResult.code;
    console.log('Código detectado por Quagga:', code, 'Formato:', result.codeResult.format);

    // Confirmación de código
    if (code === codigoCandidato) {
      contadorConfirmaciones++;
      console.log(`Confirmación ${contadorConfirmaciones} para código: ${code}`);
    } else {
      codigoCandidato = code;
      contadorConfirmaciones = 1;
      console.log(`Nuevo candidato: ${code}, confirmación 1`);
    }

    if (contadorConfirmaciones < confirmacionesRequeridas) {
      return; // Esperar más confirmaciones
    }

    // Código confirmado
    if (code === ultimoCodigoEscaneado) {
      console.log('Código repetido, ignorando:', code);
      return;
    }

    ultimoCodigoEscaneado = code;
    estaEscaneando = false; // Pausar lectura tras detectar código
    btnEscanear.classList.remove('boton-presionado');

    beepSound.play().catch(err => {
      console.error('Error al reproducir el sonido:', err);
      mostrarToast('Error al reproducir el sonido: ' + err.message, 'error');
    });

    if (inputCodigo) {
      inputCodigo.value = code;
    }
    mostrarToast('Código escaneado: ' + code, 'success');

    // Cerrar la cámara tras detectar un código
    try {
      Quagga.stop();
      stopVideoStream();
      Quagga.offDetected();
      escaneoActivo = false;
      estaEscaneando = false;
      btnEscanear.style.display = 'block';
      btnDetener.style.display = 'none';
      console.log('Quagga detenido tras detectar código');
      mostrarToast('Cámara cerrada. Escanea otro producto o completa los datos.', 'info');
      asignarEventosEscaneo();
    } catch (error) {
      console.error('Error al detener Quagga tras detección:', error);
      mostrarToast('Error al cerrar la cámara: ' + error.message, 'error');
    }

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
          mostrarToast(`Producto encontrado en tu stock. Redirigiendo a <a href="/public/stock.html?codigo=${code}" style="color: #3498db; text-decoration: underline;">Stock</a>.`, 'info');
          setTimeout(() => {
            window.location.href = `/public/stock.html?codigo=${code}`;
          }, 3000);
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
                mostrarToast('Producto no encontrado con ese código de barras. Ingresa los datos manualmente.', 'info');
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

  // Exponer inicializarQuagga y detener para uso externo
  return {
    inicializar: inicializarQuagga,
    detener: () => {
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
          asignarEventosEscaneo();
        } catch (error) {
          console.error('Error al detener Quagga:', error);
          mostrarToast('Error al detener el escáner: ' + error.message, 'error');
        }
      }
    }
  };
}