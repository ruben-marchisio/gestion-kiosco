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
  }, 5000); // Reducir duración de toasts
}

// Función para detectar si es un dispositivo móvil
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Función de debounce para evitar clics rápidos
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
    console.log('Debounce activo, espera:', wait);
  };
}

// Función para iniciar el escaneo continuo de códigos de barras con QuaggaJS
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
  let frameCount = 0; // Contador para limitar logs
  let lastFrameTime = 0; // Tiempo del último frame procesado

  const beepSound = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

  console.log('Iniciando configuración de escaneo con QuaggaJS...');
  console.log('Protocolo actual:', window.location.protocol, 'URL:', window.location.href);

  // Verificar soporte para getUserMedia
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('getUserMedia no está soportado en este navegador o entorno.');
    mostrarToast('El escaneo no está disponible. Usa un navegador compatible con HTTPS.', 'error');
    return { inicializar: () => Promise.resolve(false), detener: () => {}, reset: () => {} };
  }

  // Verificar que el contenedor exista
  if (!contenedorCamara) {
    console.error('Contenedor de cámara no encontrado');
    mostrarToast('Error: Contenedor de cámara no encontrado.', 'error');
    return { inicializar: () => Promise.resolve(false), detener: () => {}, reset: () => {} };
  }

  // Verificar carga de QuaggaJS
  if (typeof Quagga === 'undefined') {
    console.error('QuaggaJS no está cargado');
    mostrarToast('Error: No se pudo cargar la librería de escaneo.', 'error');
    return { inicializar: () => Promise.resolve(false), detener: () => {}, reset: () => {} };
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
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 }, aspectRatio: { min: 1, max: 2 } }
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
      if (stream && stream.getTracks) {
        const tracks = stream.getTracks();
        tracks.forEach(track => {
          console.log('Deteniendo pista de video:', track);
          track.stop();
          track.enabled = false;
          if (track.readyState !== 'ended') {
            console.warn('Pista de video no terminó:', track.readyState);
            track.stop(); // Intentar detener nuevamente
          }
        });
        // Verificar estado del stream
        let attempts = 0;
        const maxAttempts = 5;
        const checkStream = setInterval(() => {
          console.log('Verificando estado del stream, intento:', attempts + 1);
          if (!stream || !stream.active || attempts >= maxAttempts) {
            clearInterval(checkStream);
            console.log('Estado final del stream:', { active: stream ? stream.active : 'null' });
            stream = null;
          }
          attempts++;
        }, 500);
      } else {
        console.log('No hay stream para detener');
      }
      if (videoElement) {
        videoElement.srcObject = null;
        videoElement.removeEventListener('loadedmetadata', null);
        videoElement.removeEventListener('error', null);
        videoElement.remove();
        videoElement = null;
      }
      contenedorCamara.innerHTML = '';
      contenedorCamara.style.display = 'none';
      console.log('Stream de video detenido y contenedor limpiado');
      // Forzar liberación de recursos en móvil
      if (isMobileDevice()) {
        console.log('Forzando liberación de recursos de cámara en móvil');
        setTimeout(() => {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(tempStream => {
              tempStream.getTracks().forEach(track => track.stop());
              console.log('Recursos de cámara liberados en móvil');
            })
            .catch(err => console.error('Error al liberar recursos en móvil:', err.message));
        }, 6000); // Aumentar retraso a 6000ms
      }
      // Detener procesamiento de frames
      if (Quagga) {
        Quagga.offProcessed();
        Quagga.stop();
      }
    } catch (error) {
      console.error('Error al detener el stream de video:', error.name, error.message);
      mostrarToast('Error al liberar recursos de la cámara: ' + error.message, 'error');
    }
  }

  function resetScanner() {
    console.log('Reiniciando escáner');
    try {
      if (Quagga) {
        Quagga.stop();
        Quagga.offDetected();
        Quagga.offProcessed();
      }
      if (videoElement) {
        videoElement.srcObject = null;
        videoElement.removeEventListener('loadedmetadata', null);
        videoElement.removeEventListener('error', null);
        videoElement.remove();
      }
      if (contenedorCamara) {
        contenedorCamara.innerHTML = '';
        contenedorCamara.style.display = 'none';
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
      frameCount = 0;
      lastFrameTime = 0;
      console.log('Escáner reiniciado correctamente');
    } catch (error) {
      console.error('Error al reiniciar el escáner:', error.name, error.message);
      mostrarToast('Error al reiniciar el escáner: ' + error.message, 'error');
    }
  }

  async function inicializarQuagga() {
    if (inicializando) {
      console.log('Ya se está inicializando QuaggaJS, ignorando nueva solicitud');
      return false;
    }
    if (intentos >= maxIntentos) {
      console.error('Máximo de intentos alcanzado para inicializar QuaggaJS');
      mostrarToast('Error: No se pudo inicializar el escáner tras varios intentos.', 'error');
      inicializando = false;
      return false;
    }
    inicializando = true;
    intentos++;

    console.log('Inicializando QuaggaJS, intento:', intentos);

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
    const numWorkers = isMobile ? 4 : navigator.hardwareConcurrency || 4;
    const frequency = 22;

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
            facingMode: "environment",
            width: { min: 640, ideal: 640 },
            height: { min: 480, ideal: 480 },
            aspectRatio: { min: 1, max: 2 }
          },
          area: { top: "5%", right: "5%", left: "5%", bottom: "5%" }
        },
        locator: {
          patchSize: "medium",
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
          console.error('Error al inicializar QuaggaJS:', err.name, err.message);
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

        console.log('QuaggaJS inicializado correctamente');
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
            console.log('Estado de QuaggaJS:', {
              isRunning: escaneoActivo,
              hasCamera: navigator.mediaDevices && navigator.mediaDevices.getUserMedia
            });
          }, 1000);
        } else {
          console.error('Elemento de video no encontrado después de inicializar QuaggaJS');
          mostrarToast('Error: No se encontró el elemento de video.', 'error');
          stopVideoStream();
          escaneoActivo = false;
        }
      });
    } catch (error) {
      console.error('Excepción al inicializar QuaggaJS:', error.name, error.message);
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
    }
  }

  // Callback nombrado para btnDetener
  function manejarClickDetener(e) {
    e.preventDefault();
    console.log('Click en btnDetener, escaneoActivo:', escaneoActivo, 'estaEscaneando:', estaEscaneando);
    if (escaneoActivo) {
      try {
        Quagga.stop();
        stopVideoStream();
        Quagga.offDetected();
        Quagga.offProcessed();
        escaneoActivo = false;
        estaEscaneando = false;
        btnEscanear.style.display = 'block';
        btnDetener.style.display = 'none';
        console.log('QuaggaJS detenido y eventos limpiados');
        mostrarToast('Escaneo detenido.', 'info');
        asignarEventosEscaneo();
      } catch (error) {
        console.error('Error al detener QuaggaJS:', error.name, error.message);
        mostrarToast('Error al detener el escáner: ' + error.message, 'error');
      }
    } else {
      console.log('Escaneo no activo, no hay nada que detener');
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
      if (Quagga) {
        Quagga.start(); // Mantener start simple
      }
    }
  }

  function manejarFinEscaneo(e) {
    e.preventDefault();
    console.log('Evento de fin de escaneo, tipo:', e.type);
    btnEscanear.classList.remove('boton-presionado');
    if (estaEscaneando) {
      estaEscaneando = false;
      if (Quagga && videoElement) {
        videoElement.srcObject = null; // Limpiar video para evitar congelamiento
        Quagga.stop();
        console.log('QuaggaJS detenido para evitar congelamiento');
      }
    }
  }

  asignarEventosEscaneo();

  // Configurar evento para el botón Detener
  btnDetener.removeEventListener('click', manejarClickDetener);
  btnDetener.addEventListener('click', manejarClickDetener);

  // Manejar detección de códigos
  Quagga.offDetected();
  Quagga.onDetected((result) => {
    if (!estaEscaneando) {
      console.log('Ignorando detección, estaEscaneando es false');
      return;
    }

    const code = result.codeResult.code;
    console.log('Código detectado por QuaggaJS:', code, 'Formato:', result.codeResult.format);

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
    estaEscaneando = false;
    btnEscanear.classList.remove('boton-presionado');

    beepSound.play().catch(err => {
      console.error('Error al reproducir el sonido:', err);
      mostrarToast('Error al reproducir el sonido: ' + err.message, 'error');
    });

    if (inputCodigo) {
      inputCodigo.value = code;
    }
    mostrarToast(`Código escaneado: ${code}`, 'success');

    const usuarioId = localStorage.getItem('usuarioId');
    console.log('Buscando código:', code, 'para usuario:', usuarioId);
    
    // Verificar en el stock local
    fetch(`${BASE_URL}/api/productos/codigo/${code}?usuarioId=${usuarioId}`, {
      signal: AbortSignal.timeout(3000)
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.producto) {
          console.log('Producto encontrado en el stock local:', data.producto);
          completarCallback(data.producto);
          mostrarToast(`Producto encontrado en tu stock. Redirigiendo a <a href="/public/stock.html?codigo=${code}" style="color: #3498db; text-decoration: underline;">Stock</a>.`, 'info');
          setTimeout(() => {
            window.location.href = `/public/stock.html?codigo=${code}`;
          }, 3000);
        } else {
          // Verificar en la base de datos común
          fetch(`${BASE_URL}/api/productos-comunes/codigo/${code}`, {
            signal: AbortSignal.timeout(3000)
          })
            .then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json();
            })
            .then(dataComun => {
              if (dataComun.producto) {
                console.log('Producto encontrado en la base de datos común:', dataComun.producto);
                completarCallback(dataComun.producto);
                mostrarToast(`Código escaneado: ${code}. Producto encontrado en la base de datos común. Completa los datos adicionales.`, 'info');
              } else {
                console.log('Producto no encontrado en ninguna base de datos para el código:', code);
                completarCallback(null);
                mostrarToast(`Código escaneado: ${code}. Producto no encontrado, ingresa los datos manualmente.`, 'info');
              }
            })
            .catch(err => {
              console.error('Error al buscar en la base de datos común:', err);
              completarCallback(null);
              mostrarToast(`Código escaneado: ${code}. Error de conexión, ingresa los datos manualmente.`, 'error');
            });
        }
      })
      .catch(err => {
        console.error('Error al buscar en el stock local:', err);
        // Verificar en la base de datos común como respaldo
        fetch(`${BASE_URL}/api/productos-comunes/codigo/${code}`, {
          signal: AbortSignal.timeout(3000)
        })
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then(dataComun => {
            if (dataComun.producto) {
              console.log('Producto encontrado en la base de datos común (respaldo):', dataComun.producto);
              completarCallback(dataComun.producto);
              mostrarToast(`Código escaneado: ${code}. Producto encontrado en la base de datos común. Completa los datos adicionales.`, 'info');
            } else {
              console.log('Producto no encontrado en ninguna base de datos (respaldo) para el código:', code);
              completarCallback(null);
              mostrarToast(`Código escaneado: ${code}. Producto no encontrado, ingresa los datos manualmente.`, 'info');
            }
          })
          .catch(err => {
            console.error('Error al buscar en la base de datos común (respaldo):', err);
            completarCallback(null);
            mostrarToast(`Código escaneado: ${code}. Error de conexión, ingresa los datos manualmente.`, 'error');
          });
      })
      .finally(() => {
        // Cerrar la cámara tras completar los fetch
        try {
          Quagga.stop();
          stopVideoStream();
          Quagga.offDetected();
          Quagga.offProcessed();
          escaneoActivo = false;
          estaEscaneando = false;
          btnEscanear.style.display = 'block';
          btnDetener.style.display = 'none';
          console.log('QuaggaJS detenido tras detectar código');
          mostrarToast('Cámara cerrada. Escanea otro producto o completa los datos.', 'info');
          asignarEventosEscaneo();
        } catch (error) {
          console.error('Error al detener QuaggaJS tras detección:', error.name, error.message);
          mostrarToast('Error al cerrar la cámara: ' + error.message, 'error');
        }
      });
  });

  // Depuración adicional para fallos en la detección
  Quagga.onProcessed((result) => {
    frameCount++;
    const now = Date.now();
    if (frameCount % 100 === 0 && now - lastFrameTime > 1000) {
      lastFrameTime = now;
      if (result && result.boxes) {
        console.log('Procesando frame, cajas detectadas:', result.boxes.length);
      } else {
        console.log('Procesando frame, sin cajas detectadas');
      }
    }
  });

  // Exponer inicializarQuagga, detener y reset para uso externo
  return {
    inicializar: inicializarQuagga,
    detener: () => {
      if (escaneoActivo) {
        try {
          Quagga.stop();
          stopVideoStream();
          Quagga.offDetected();
          Quagga.offProcessed();
          escaneoActivo = false;
          estaEscaneando = false;
          btnEscanear.style.display = 'block';
          btnDetener.style.display = 'none';
          console.log('QuaggaJS detenido y eventos limpiados');
          mostrarToast('Escaneo detenido.', 'info');
          asignarEventosEscaneo();
          resetScanner();
        } catch (error) {
          console.error('Error al detener QuaggaJS:', error);
          mostrarToast('Error al detener el escáner: ' + error.message, 'error');
        }
      }
    },
    reset: resetScanner
  };
}