console.log('utils-quagga.js cargado');

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

// Función de debounce
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
    console.log('Debounce activo, espera:', wait);
  };
}

// Función para iniciar el escaneo continuo con QuaggaJS
function iniciarEscaneoContinuo(contenedorCamara, btnEscanear, btnEscanearAhora, btnCerrarCamara, inputCodigo, completarCallback) {
  let camaraAbierta = false;
  let escaneando = false;
  let videoElement = null;
  let stream = null;
  let lastCodes = [];
  const confirmacionesRequeridas = 3;

  const beepSound = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

  console.log('Iniciando configuración de escaneo con QuaggaJS...');

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

  // Verificar carga de Quagga
  if (typeof Quagga === 'undefined') {
    console.error('Quagga no está cargado.');
    mostrarToast('Error: No se pudo cargar la librería de escaneo.', 'error');
    return { inicializar: () => Promise.resolve(false), detener: () => {}, reset: () => {} };
  }

  // Función para detener el stream
  function stopVideoStream() {
    try {
      if (stream && stream.getTracks) {
        stream.getTracks().forEach(track => {
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
      if (Quagga.isRunning && Quagga.isRunning()) {
        Quagga.stop();
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

  // Función para reiniciar el escáner
  function resetScanner() {
    console.log('Reiniciando escáner.');
    try {
      stopVideoStream();
      camaraAbierta = false;
      escaneando = false;
      lastCodes = [];
      console.log('Escáner reiniciado.');
    } catch (error) {
      console.error('Error al reiniciar:', error.name, error.message);
      mostrarToast('Error al reiniciar el escáner: ' + error.message, 'error');
    }
  }

  // Función para inicializar el escáner
  async function inicializarEscanner() {
    if (camaraAbierta) {
      console.log('Cámara ya abierta, ignorando solicitud.');
      return true;
    }

    try {
      const camaraDisponible = await navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log('Dispositivos de video disponibles:', videoDevices);
        return videoDevices.length > 0;
      });
      if (!camaraDisponible) {
        console.error('No se detectaron cámaras.');
        mostrarToast('Error: No hay cámaras disponibles.', 'error');
        return false;
      }

      const permissionStatus = await navigator.permissions.query({ name: 'camera' });
      console.log('Estado de permiso de cámara:', permissionStatus.state);
      if (permissionStatus.state === 'denied') {
        console.error('Permiso de cámara denegado.');
        mostrarToast('Permiso de cámara denegado. Habilítalo en la configuración.', 'error');
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

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { min: 320 },
          height: { min: 240 }
        }
      });
      console.log('Stream de video iniciado:', stream);

      await new Promise(resolve => setTimeout(resolve, 2000)); // Aumentado a 2000ms
      videoElement.srcObject = stream;

      await new Promise((resolve, reject) => {
        videoElement.addEventListener('canplay', () => {
          console.log('Video listo para reproducir (canplay).');
          resolve();
        }, { once: true });
        videoElement.addEventListener('error', (err) => {
          console.error('Error en el video:', err);
          reject(err);
        }, { once: true });
        videoElement.play().catch(err => {
          console.error('Error al reproducir video:', err);
          mostrarToast('Error al reproducir video: ' + err.message, 'error');
          reject(err);
        });
      });

      return new Promise((resolve, reject) => {
        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoElement,
            constraints: {
              facingMode: "environment",
              width: { min: 320 },
              height: { min: 240 }
            },
            area: { top: "5%", bottom: "5%", left: "5%", right: "5%" }
          },
          decoder: {
            readers: ["ean_8_reader", "ean_13_reader"]
          },
          numOfWorkers: 0 // Deshabilitar Web Workers
        }, function(err) {
          if (err) {
            console.error('Error al iniciar Quagga:', err);
            mostrarToast('Error al iniciar el escáner Quagga: ' + err.message, 'error');
            stopVideoStream();
            reject(err);
            return;
          }
          console.log('Quagga inicializado correctamente.');
          camaraAbierta = true;
          contenedorCamara.style.display = 'block';
          btnEscanear.style.display = 'none';
          document.querySelector('#botones-camara').style.display = 'flex';
          mostrarToast('Cámara abierta. Alinea el código en el recuadro.', 'info');
          resolve(true);
        });
      });
    } catch (error) {
      console.error('Error al inicializar Quagga:', error);
      mostrarToast('Error al inicializar el escáner: ' + error.message, 'error');
      stopVideoStream();
      return false;
    }
  }

  // Configurar eventos
  function limpiarEventos() {
    btnEscanear.removeEventListener('click', manejarClickEscanear);
    btnEscanearAhora.removeEventListener('click', manejarClickEscanearAhora);
    btnCerrarCamara.removeEventListener('click', manejarClickCerrarCamara);
  }

  function asignarEventos() {
    limpiarEventos();
    btnEscanear.addEventListener('click', manejarClickEscanear);
    btnEscanearAhora.addEventListener('click', manejarClickEscanearAhora);
    btnCerrarCamara.addEventListener('click', manejarClickCerrarCamara);
  }

  const manejarClickEscanear = debounce(async () => {
    console.log('Evento click en #escanear, camaraAbierta:', camaraAbierta);
    if (!camaraAbierta) {
      mostrarToast('Iniciando escáner...', 'info');
      const success = await inicializarEscanner();
      if (!success) {
        mostrarToast('No se pudo inicializar el escáner.', 'error');
      }
    } else {
      console.log('Cámara ya abierta, ignorando clic.');
    }
  }, 500);

  const manejarClickEscanearAhora = debounce(() => {
    console.log('Evento click en #escanear-ahora, escaneando:', escaneando);
    if (camaraAbierta && !escaneando) {
      escaneando = true;
      contenedorCamara.querySelector('.guia-codigo').classList.add('escaneando');
      mostrarToast('Escaneando... Alinea el código en el recuadro.', 'info');
      try {
        Quagga.start();
      } catch (error) {
        console.error('Error al iniciar escaneo:', error);
        mostrarToast('Error al iniciar escaneo: ' + error.message, 'error');
        escaneando = false;
        contenedorCamara.querySelector('.guia-codigo').classList.remove('escaneando');
        return;
      }

      Quagga.onDetected(function(result) {
        const code = result.codeResult.code;
        console.log('Código detectado:', code);

        lastCodes.push(code);
        const progress = lastCodes.length / confirmacionesRequeridas;
        const circulo = contenedorCamara.querySelector('#circulo-progreso circle');
        circulo.setAttribute('data-progress', progress);
        circulo.setAttribute('stroke-dashoffset', 75.4 * (1 - progress));

        if (lastCodes.length >= confirmacionesRequeridas) {
          const confirmedCode = lastCodes.every(c => c === code) ? code : null;
          if (confirmedCode) {
            escaneando = false;
            contenedorCamara.querySelector('.guia-codigo').classList.remove('escaneando');
            try {
              Quagga.stop();
            } catch (error) {
              console.error('Error al detener Quagga:', error);
            }

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
                btnEscanear.style.display = 'block';
                document.querySelector('#botones-camara').style.display = 'none';
                console.log('Escaneo finalizado.');
                asignarEventos();
              });
          } else {
            lastCodes.shift();
          }
        }
      });
    }
  }, 500);

  const manejarClickCerrarCamara = debounce(() => {
    console.log('Evento click en #cerrar-camara, camaraAbierta:', camaraAbierta);
    if (camaraAbierta) {
      escaneando = false;
      stopVideoStream();
      camaraAbierta = false;
      btnEscanear.style.display = 'block';
      document.querySelector('#botones-camara').style.display = 'none';
      mostrarToast('Escaneo cancelado.', 'info');
      asignarEventos();
    }
  }, 500);

  asignarEventos();

  return {
    inicializar: inicializarEscanner,
    detener: stopVideoStream,
    reset: resetScanner
  };
}