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
  }, 5000); // 5s para mayor visibilidad
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

// Función para iniciar el escaneo continuo con @zxing/library
function iniciarEscaneoContinuo(contenedorCamara, btnEscanear, btnEscanearAhora, btnCerrarCamara, inputCodigo, completarCallback) {
  let camaraAbierta = false;
  let escaneando = false;
  let ultimoCodigoEscaneado = null;
  let videoElement = null;
  let inicializando = false;
  let stream = null;
  let intentos = 0;
  let frameCount = 0; // Contador de frames procesados
  const maxIntentos = 10; // Aumentado para más intentos
  let lastCodes = [];
  const confirmacionesRequeridas = 2; // Precisión
  let reader = null;
  let decodeController = null; // Controlador para detener decodificación

  const beepSound = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

  console.log('Iniciando configuración de escaneo con @zxing/library...');
  console.log('Protocolo actual:', window.location.protocol, 'URL:', window.location.href);
  console.log('ZXing cargado:', typeof ZXing); // Verificar carga de ZXing

  // Verificar soporte para getUserMedia
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('getUserMedia no soportado.');
    mostrarToast('El escaneo no está disponible. Usa un navegador compatible con HTTPS.', 'error');
    return { inicializar: () => Promise.resolve(false), detener: () => {}, reset: () => {} };
  }

  // Verificar contenedor
  if (!contenedorCamara) {
    console.error('Contenedor de cámara no encontrado.');
    mostrarToast('Error: Contenedor de cámara no encontrado.', 'error');
    return { inicializar: () => Promise.resolve(false), detener: () => {}, reset: () => {} };
  }

  // Verificar carga de ZXing
  if (typeof ZXing === 'undefined') {
    console.error('ZXing no está cargado.');
    mostrarToast('Error: No se pudo cargar la librería de escaneo.', 'error');
    return { inicializar: () => Promise.resolve(false), detener: () => {}, reset: () => {} };
  }

  // Función para verificar estado de la cámara
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
        console.error('Permiso de cámara denegado.');
        mostrarToast('Permiso de cámara denegado. Habilítalo en la configuración.', 'error');
        return false;
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          focusMode: 'continuous'
        }
      });
      console.log('Permiso de cámara concedido. Stream:', mediaStream);
      mediaStream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error('Error al solicitar permisos:', err.name, err.message);
      mostrarToast('Error al acceder a la cámara: ' + err.message, 'error');
      return false;
    }
  }

  // Función para detener el stream de video
  function stopVideoStream() {
    try {
      if (stream && stream.getTracks) {
        const tracks = stream.getTracks();
        tracks.forEach(track => {
          console.log('Deteniendo pista de video:', track);
          track.stop();
          track.enabled = false;
        });
        stream = null;
      }
      if (videoElement) {
        videoElement.srcObject = null;
        videoElement.pause();
        videoElement.remove();
        videoElement = null;
      }
      contenedorCamara.innerHTML = '<div class="guia-codigo"></div><svg id="circulo-progreso" width="30" height="30" style="position: absolute; top: 10px; right: 10px;"><circle cx="15" cy="15" r="12" stroke="#28a745" stroke-width="3" fill="none" stroke-dasharray="75.4" stroke-dashoffset="75.4" data-progress="0"></circle></svg>';
      contenedorCamara.style.display = 'none';
      console.log('Stream detenido y contenedor limpiado.');
      if (reader) {
        reader.reset();
        reader = null;
      }
      if (decodeController) {
        decodeController = null;
      }
      if (isMobileDevice()) {
        console.log('Forzando liberación de recursos en móvil.');
        setTimeout(() => {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(tempStream => {
              tempStream.getTracks().forEach(track => track.stop());
              console.log('Recursos liberados en móvil.');
            })
            .catch(err => console.error('Error al liberar recursos:', err.message));
        }, 2000);
      }
    } catch (error) {
      console.error('Error al detener el stream:', error.name, error.message);
      mostrarToast('Error al liberar la cámara: ' + error.message, 'error');
    }
  }

  // Función para detener solo la decodificación
  function stopDecoding() {
    if (decodeController) {
      console.log('Deteniendo decodificación...');
      decodeController = null;
      if (reader) {
        reader.reset(); // Resetear lector sin afectar video
      }
      escaneando = false;
      contenedorCamara.querySelector('.guia-codigo').classList.remove('escaneando');
      mostrarToast('Escaneo pausado. Mantén presionado para continuar.', 'info');
      // Evitar reasignar srcObject si ya está activo
      if (videoElement && stream && videoElement.srcObject === stream && !videoElement.paused) {
        console.log('Video ya activo, evitando reproducción innecesaria.');
      } else if (videoElement && stream) {
        videoElement.srcObject = stream;
        if (videoElement.paused) {
          videoElement.play().catch(err => console.error('Error al reanudar video:', err));
        }
      }
    }
  }

  // Función para reiniciar el escáner
  function resetScanner() {
    console.log('Reiniciando escáner.');
    try {
      stopDecoding();
      stopVideoStream();
      camaraAbierta = false;
      escaneando = false;
      ultimoCodigoEscaneado = null;
      lastCodes = [];
      inicializando = false;
      intentos = 0;
      frameCount = 0;
      console.log('Escáner reiniciado.');
    } catch (error) {
      console.error('Error al reiniciar:', error.name, error.message);
      mostrarToast('Error al reiniciar el escáner: ' + error.message, 'error');
    }
  }

  // Función para inicializar el escáner
  async function inicializarEscanner() {
    if (inicializando) {
      console.log('Ya inicializando, ignorando solicitud.');
      return false;
    }
    if (intentos >= maxIntentos) {
      console.error('Máximo de intentos alcanzado.');
      mostrarToast('Error: No se pudo inicializar el escáner.', 'error');
      inicializando = false;
      return false;
    }
    inicializando = true;
    intentos++;

    console.log('Inicializando ZXing, intento:', intentos);

    const camaraDisponible = await verificarEstadoCamara();
    if (!camaraDisponible) {
      console.error('No se detectaron cámaras.');
      mostrarToast('Error: No hay cámaras disponibles.', 'error');
      inicializando = false;
      intentos = 0;
      return false;
    }

    const permisosConcedidos = await solicitarPermisosCamara();
    if (!permisosConcedidos) {
      inicializando = false;
      intentos = 0;
      return false;
    }

    contenedorCamara.innerHTML = '<div class="guia-codigo"></div><svg id="circulo-progreso" width="30" height="30" style="position: absolute; top: 10px; right: 10px;"><circle cx="15" cy="15" r="12" stroke="#28a745" stroke-width="3" fill="none" stroke-dasharray="75.4" stroke-dashoffset="75.4" data-progress="0"></circle></svg>';
    videoElement = document.createElement('video');
    videoElement.setAttribute('autoplay', 'true');
    videoElement.setAttribute('muted', 'true');
    videoElement.setAttribute('playsinline', 'true');
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    videoElement.style.objectFit = 'cover';
    contenedorCamara.appendChild(videoElement);

    try {
      const hints = new Map();
      hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
        ZXing.BarcodeFormat.EAN_8,
        ZXing.BarcodeFormat.EAN_13
      ]);
      hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
      hints.set(ZXing.DecodeHintType.PURE_BARCODE, false); // Tolerancia
      // Intento de multi-orientación
      hints.set(ZXing.DecodeHintType.ALLOWED_ORIENTATIONS, true);
      reader = new ZXing.BrowserMultiFormatReader(hints);
      console.log('ZXing inicializado con formatos:', Array.from(hints.get(ZXing.DecodeHintType.POSSIBLE_FORMATS)));

      // Iniciar stream de video
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          focusMode: 'continuous'
        }
      });
      console.log('Stream de video iniciado:', stream);

      // Retrasar asignación del stream para asegurar inicialización
      await new Promise(resolve => setTimeout(resolve, 500));
      if (videoElement.srcObject) {
        console.log('Video ya tiene stream, evitando reasignación.');
      } else {
        videoElement.srcObject = stream;
      }

      // Esperar a que el video esté listo
      await new Promise((resolve, reject) => {
        videoElement.addEventListener('canplay', () => {
          console.log('Video listo para reproducir (canplay).');
          resolve();
        }, { once: true });
        videoElement.addEventListener('error', (err) => {
          console.error('Error en el video:', err);
          reject(err);
        }, { once: true });
        if (videoElement.paused) {
          videoElement.play().catch(err => {
            console.error('Error al reproducir video:', err);
            mostrarToast('Error al reproducir video: ' + err.message, 'error');
            reject(err);
          });
        } else {
          console.log('Video ya está reproduciendo.');
          resolve();
        }
      });

      camaraAbierta = true;
      contenedorCamara.style.display = 'block';
      btnEscanear.style.display = 'none';
      document.querySelector('#botones-camara').style.display = 'flex';
      mostrarToast('Cámara abierta. Mantén presionado el botón para escanear.', 'info');

      console.log('Elemento de video creado:', videoElement);
      setTimeout(() => {
        console.log('Estado del video:', {
          width: videoElement.videoWidth,
          height: videoElement.videoHeight,
          readyState: videoElement.readyState,
          paused: videoElement.paused
        });
      }, 1000);

      return true;
    } catch (error) {
      console.error('Error al inicializar ZXing o stream:', error.name, error.message);
      mostrarToast('Error al inicializar el escáner: ' + error.message, 'error');
      inicializando = false;
      stopVideoStream();
      return false;
    }
  }

  // Configurar eventos
  function limpiarEventos() {
    btnEscanear.removeEventListener('click', manejarClickEscanear);
    btnEscanearAhora.removeEventListener('mousedown', manejarMousedownEscanearAhora);
    btnEscanearAhora.removeEventListener('mouseup', manejarMouseupEscanearAhora);
    btnEscanearAhora.removeEventListener('touchstart', manejarMousedownEscanearAhora);
    btnEscanearAhora.removeEventListener('touchend', manejarMouseupEscanearAhora);
    btnCerrarCamara.removeEventListener('click', manejarClickCerrarCamara);
  }

  function asignarEventos() {
    limpiarEventos();
    btnEscanear.addEventListener('click', manejarClickEscanear);
    btnEscanearAhora.addEventListener('mousedown', manejarMousedownEscanearAhora);
    btnEscanearAhora.addEventListener('mouseup', manejarMouseupEscanearAhora);
    btnEscanearAhora.addEventListener('touchstart', manejarMousedownEscanearAhora);
    btnEscanearAhora.addEventListener('touchend', manejarMouseupEscanearAhora);
    btnCerrarCamara.addEventListener('click', manejarClickCerrarCamara);
  }

  const manejarClickEscanear = debounce(async () => {
    console.log('Evento click en #escanear, camaraAbierta:', camaraAbierta);
    if (!camaraAbierta) {
      mostrarToast('Iniciando escáner...', 'info');
      const success = await inicializarEscanner();
      if (!success) {
        inicializando = false;
      }
    } else {
      console.log('Cámara ya abierta, ignorando clic.');
    }
  }, 500);

  const manejarMousedownEscanearAhora = debounce(async (event) => {
    event.preventDefault(); // Evitar comportamiento por defecto en touch
    console.log('Evento mousedown/touchstart en #escanear-ahora, escaneando:', escaneando);
    if (camaraAbierta && !escaneando) {
      escaneando = true;
      frameCount = 0; // Reiniciar contador de frames
      contenedorCamara.querySelector('.guia-codigo').classList.add('escaneando');
      mostrarToast('Escaneando... Mantén presionado y alinea el código.', 'info');
      try {
        // Evitar reasignar srcObject o reproducir si ya está activo
        if (videoElement && stream && videoElement.srcObject === stream && !videoElement.paused) {
          console.log('Video ya activo, iniciando decodificación directamente.');
        } else if (videoElement && stream) {
          videoElement.srcObject = stream;
          if (videoElement.paused) {
            await videoElement.play().catch(err => {
              console.error('Error al reproducir video:', err);
              mostrarToast('Error al reproducir video: ' + err.message, 'error');
              throw err;
            });
          }
        }
        // Retrasar decodificación para estabilizar video
        await new Promise(resolve => setTimeout(resolve, 500));
        decodeController = {};
        reader.decodeFromVideoDevice(null, videoElement, (result, err) => {
          if (!decodeController) return; // Detener si decodeController es nulo
          frameCount++;
          if (frameCount % 10 === 1) { // Log cada 10 frames
            console.log(`Procesando frame de video #${frameCount}...`);
          }
          if (result && escaneando) {
            const code = result.text;
            console.log('Código detectado:', code, 'Formato:', result.format);

            lastCodes.push(code);
            const progress = lastCodes.length / confirmacionesRequeridas;
            const circulo = contenedorCamara.querySelector('#circulo-progreso circle');
            circulo.setAttribute('data-progress', progress);
            circulo.setAttribute('stroke-dashoffset', 75.4 * (1 - progress));

            if (lastCodes.length >= confirmacionesRequeridas) {
              const confirmedCode = lastCodes.every(c => c === code) ? code : null;
              if (confirmedCode && confirmedCode !== ultimoCodigoEscaneado) {
                ultimoCodigoEscaneado = confirmedCode;
                escaneando = false;
                contenedorCamara.querySelector('.guia-codigo').classList.remove('escaneando');
                stopDecoding();

                beepSound.play().catch(err => console.error('Error al reproducir beep:', err));
                if (navigator.vibrate) navigator.vibrate(200);

                if (inputCodigo) inputCodigo.value = confirmedCode;
                mostrarToast(`Código escaneado: ${confirmedCode}`, 'success');

                const usuarioId = localStorage.getItem('usuarioId');
                fetch(`${BASE_URL}/api/productos/codigo/${confirmedCode}?usuarioId=${usuarioId}`, {
                  signal: AbortSignal.timeout(3000)
                })
                  .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                  })
                  .then(data => {
                    if (data.producto) {
                      console.log('Producto en stock:', data.producto);
                      completarCallback(data.producto);
                      mostrarToast(`Producto encontrado en tu stock. Redirigiendo a <a href="/public/stock.html?codigo=${confirmedCode}">Stock</a>.`, 'info');
                      setTimeout(() => {
                        window.location.href = `/public/stock.html?codigo=${confirmedCode}`;
                      }, 3000);
                    } else {
                      fetch(`${BASE_URL}/api/productos-comunes/codigo/${confirmedCode}`, {
                        signal: AbortSignal.timeout(3000)
                      })
                        .then(res => {
                          if (!res.ok) throw new Error(`HTTP ${res.status}`);
                          return res.json();
                        })
                        .then(dataComun => {
                          if (dataComun.producto) {
                            console.log('Producto en base común:', dataComun.producto);
                            completarCallback(dataComun.producto);
                            mostrarToast(`Código escaneado: ${confirmedCode}. Producto encontrado. Completa los datos.`, 'info');
                          } else {
                            console.log('Producto no encontrado.');
                            completarCallback(null);
                            mostrarToast(`Código escaneado: ${confirmedCode}. Producto no encontrado, ingresa manualmente.`, 'info');
                          }
                        })
                        .catch(err => {
                          console.error('Error en base común:', err);
                          completarCallback(null);
                          mostrarToast(`Código escaneado: ${confirmedCode}. Error de conexión, ingresa manualmente.`, 'error');
                        });
                    }
                  })
                  .catch(err => {
                    console.error('Error en stock:', err);
                    fetch(`${BASE_URL}/api/productos-comunes/codigo/${confirmedCode}`, {
                      signal: AbortSignal.timeout(3000)
                    })
                      .then(res => {
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        return res.json();
                      })
                      .then(dataComun => {
                        if (dataComun.producto) {
                          console.log('Producto en base común (respaldo):', dataComun.producto);
                          completarCallback(dataComun.producto);
                          mostrarToast(`Código escaneado: ${confirmedCode}. Producto encontrado. Completa los datos.`, 'info');
                        } else {
                          console.log('Producto no encontrado (respaldo).');
                          completarCallback(null);
                          mostrarToast(`Código escaneado: ${confirmedCode}. Producto no encontrado, ingresa manualmente.`, 'info');
                        }
                      })
                      .catch(err => {
                        console.error('Error en base común (respaldo):', err);
                        completarCallback(null);
                        mostrarToast(`Código escaneado: ${confirmedCode}. Error de conexión, ingresa manualmente.`, 'error');
                      });
                  })
                  .finally(() => {
                    stopVideoStream();
                    camaraAbierta = false;
                    escaneando = false;
                    inicializando = false;
                    btnEscanear.style.display = 'block';
                    document.querySelector('#botones-camara').style.display = 'none';
                    console.log('Escaneo finalizado.');
                    asignarEventos();
                  });
              } else if (!confirmedCode) {
                lastCodes.shift();
              }
            }
          } else if (err && !(err instanceof ZXing.NotFoundException)) {
            console.error(`Error en escaneo (frame ${frameCount}):`, err);
            mostrarToast('Error al escanear: ' + err.message, 'error');
            stopDecoding();
            stopVideoStream();
            camaraAbierta = false;
            escaneando = false;
            inicializando = false;
            btnEscanear.style.display = 'block';
            document.querySelector('#botones-camara').style.display = 'none';
            asignarEventos();
          } else if (err && err instanceof ZXing.NotFoundException) {
            if (frameCount % 10 === 1) { // Log cada 10 frames
              console.log(`No se detectó código en frame ${frameCount}, continuando escaneo...`);
            }
            setTimeout(() => {
              if (escaneando && lastCodes.length === 0) {
                mostrarToast('Ajusta la luz o alinea mejor el código en el recuadro.', 'info');
              }
            }, 10000);
          }
        }, { maxDecodeInterval: 300 }); // Más rápido
      } catch (error) {
        console.error('Error al iniciar decodeFromVideoDevice:', error);
        mostrarToast('Error al iniciar escaneo: ' + error.message, 'error');
        stopDecoding();
        stopVideoStream();
        camaraAbierta = false;
        escaneando = false;
        inicializando = false;
        btnEscanear.style.display = 'block';
        document.querySelector('#botones-camara').style.display = 'none';
        asignarEventos();
      }
    }
  }, 500);

  const manejarMouseupEscanearAhora = debounce(() => {
    console.log('Evento mouseup/touchend en #escanear-ahora, escaneando:', escaneando);
    if (escaneando) {
      stopDecoding();
    }
  }, 100);

  const manejarClickCerrarCamara = debounce(() => {
    console.log('Evento click en #cerrar-camara, camaraAbierta:', camaraAbierta);
    if (camaraAbierta) {
      escaneando = false;
      stopDecoding();
      stopVideoStream();
      camaraAbierta = false;
      inicializando = false;
      btnEscanear.style.display = 'block';
      document.querySelector('#botones-camara').style.display = 'none';
      mostrarToast('Escaneo cancelado.', 'info');
      asignarEventos();
    }
  }, 500);

  asignarEventos();

  return {
    inicializar: inicializarEscanner,
    detener: () => {
      if (camaraAbierta) {
        escaneando = false;
        stopDecoding();
        stopVideoStream();
        camaraAbierta = false;
        inicializando = false;
        btnEscanear.style.display = 'block';
        document.querySelector('#botones-camara').style.display = 'none';
        console.log('Escáner detenido.');
        mostrarToast('Escaneo detenido.', 'info');
        asignarEventos();
        resetScanner();
      }
    },
    reset: resetScanner
  };
}