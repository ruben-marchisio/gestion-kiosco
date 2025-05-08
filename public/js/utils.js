console.log('utils.js cargado'); // Depuración

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
  toast.innerHTML = mensaje; // Usar innerHTML para permitir enlaces
  toastContainer.appendChild(toast);

  // Eliminar el toast después de 7 segundos
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
  let estaEscaneando = false; // Estado para controlar si el botón está presionado
  let ultimoCodigoEscaneado = null;
  let videoElement = null; // Para almacenar el elemento de video

  // Sonido de escaneo
  const beepSound = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3'); // URL del sonido (reemplaza con tu archivo si lo tienes)

  // Construcción de la URL base
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

  // Verificar si el navegador soporta getUserMedia y si estamos en un entorno seguro
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('getUserMedia no está soportado en este navegador o entorno.');
    mostrarToast('El escaneo no está disponible. Asegúrate de usar HTTPS o localhost.', 'error');
    return;
  }

  // Verificar permisos de la cámara
  navigator.permissions.query({ name: 'camera' }).then((permissionStatus) => {
    console.log('Estado de permiso de la cámara:', permissionStatus.state); // Depuración
    if (permissionStatus.state === 'denied') {
      mostrarToast('Permiso para acceder a la cámara denegado. Por favor, habilita el acceso en la configuración de tu navegador.', 'error');
    }
  }).catch(err => {
    console.error('Error al verificar permisos de la cámara:', err);
    mostrarToast('Error al verificar permisos de la cámara: ' + err.message, 'error');
  });

  // Función para detener el stream de video
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

  // Función para inicializar Quagga
  function inicializarQuagga() {
    console.log('Inicializando Quagga...'); // Depuración
    // Limpiar el contenedor de la cámara para evitar duplicados
    contenedorCamara.innerHTML = '';

    // Configuración dinámica según el dispositivo
    const isMobile = isMobileDevice();
    const videoResolution = isMobile ? { width: 800, height: 600 } : { width: 1280, height: 720 };
    const numWorkers = isMobile ? 2 : navigator.hardwareConcurrency || 4;

    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: contenedorCamara,
        constraints: {
          width: videoResolution.width,
          height: videoResolution.height,
          facingMode: "environment"
        },
        area: { // Área de escaneo (rectangular)
          top: "40%",
          right: "10%",
          left: "10%",
          bottom: "40%"
        }
      },
      locator: {
        patchSize: "medium", // Tamaño del parche para mejorar la detección
        halfSample: true // Mejora el rendimiento
      },
      numOfWorkers: numWorkers, // Ajustado dinámicamente según el dispositivo
      decoder: {
        readers: ["ean_reader", "upc_reader", "code_128_reader"],
        multiple: false // Evita lecturas múltiples del mismo código
      },
      locate: true // Mejora la localización del código
    }, (err) => {
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

      console.log('Quagga inicializado correctamente'); // Depuración
      Quagga.start();
      escaneoActivo = true;
      contenedorCamara.style.display = 'block';
      btnEscanear.style.display = 'block';
      btnDetener.style.display = 'block';

      // Obtener el elemento de video creado por Quagga
      videoElement = contenedorCamara.querySelector('video');
      if (videoElement) {
        console.log('Elemento de video encontrado:', videoElement);
      } else {
        console.error('Elemento de video no encontrado después de inicializar Quagga');
      }
    });

    // Asegurarse de que los eventos de Quagga estén limpios
    Quagga.offDetected();
    Quagga.onDetected((result) => {
      if (!estaEscaneando) return; // Ignorar detecciones si el botón no está presionado

      const code = result.codeResult.code;

      // Evitar lecturas repetidas del mismo código
      if (code === ultimoCodigoEscaneado) {
        return;
      }

      ultimoCodigoEscaneado = code;
      estaEscaneando = false; // Pausar la detección hasta que el botón se presione de nuevo

      // Reproducir sonido de escaneo
      beepSound.play().catch(err => {
        console.error('Error al reproducir el sonido:', err);
        mostrarToast('Error al reproducir el sonido: ' + err.message, 'error');
      });

      // Actualizar el input del código si existe
      if (inputCodigo) {
        inputCodigo.value = code;
      }
      mostrarToast('Código escaneado: ' + code, 'success');

      // Primero buscar en el stock local del usuario
      const usuarioId = localStorage.getItem('usuarioId');
      console.log('Buscando código:', code, 'para usuario:', usuarioId); // Depuración
      fetch(`${BASE_URL}/api/productos/codigo/${code}?usuarioId=${usuarioId}`, {
        signal: AbortSignal.timeout(15000) // Aumentar el tiempo de espera a 15 segundos
      })
        .then(res => res.json())
        .then(data => {
          if (data.producto) {
            console.log('Producto encontrado en el stock local:', data.producto); // Depuración
            completarCallback(data.producto);
            mostrarToast('Producto encontrado en tu stock local. Verifica y completa los datos.', 'success');
          } else {
            // Si no se encuentra en el stock local, buscar en la base de datos común
            fetch(`${BASE_URL}/api/productos-comunes/codigo/${code}`, {
              signal: AbortSignal.timeout(15000) // Aumentar el tiempo de espera a 15 segundos
            })
              .then(res => res.json())
              .then(dataComun => {
                if (dataComun.producto) {
                  console.log('Producto encontrado en la base de datos común:', dataComun.producto); // Depuración
                  completarCallback(dataComun.producto);
                  mostrarToast('Producto encontrado en la base de datos común. Por favor, completa los datos adicionales.', 'info');
                } else {
                  console.log('Producto no encontrado en ninguna base de datos para el código:', code); // Depuración
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
          // Si falla la solicitud al stock local, intentar con la base de datos común
          fetch(`${BASE_URL}/api/productos-comunes/codigo/${code}`, {
            signal: AbortSignal.timeout(15000) // Aumentar el tiempo de espera a 15 segundos
          })
            .then(res => res.json())
            .then(dataComun => {
              if (dataComun.producto) {
                console.log('Producto encontrado en la base de datos común (respaldo):', dataComun.producto); // Depuración
                completarCallback(dataComun.producto);
                mostrarToast('Producto encontrado en la base de datos común (respaldo). Por favor, completa los datos adicionales.', 'info');
              } else {
                console.log('Producto no encontrado en ninguna base de datos (respaldo) para el código:', code); // Depuración
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

      // Ejecutar callback adicional si se proporciona
      if (onCodeDetected) {
        onCodeDetected(code);
      }
    });
  }

  // Manejar el botón de escanear (mantener presionado)
  btnEscanear.addEventListener('mousedown', () => {
    if (escaneoActivo) {
      estaEscaneando = true;
      ultimoCodigoEscaneado = null; // Resetear para permitir un nuevo escaneo
    } else {
      inicializarQuagga(); // Reintentar inicializar si no está activo
    }
  });

  btnEscanear.addEventListener('mouseup', () => {
    estaEscaneando = false;
  });

  btnEscanear.addEventListener('mouseleave', () => {
    estaEscaneando = false; // Si el usuario mueve el mouse fuera del botón mientras lo mantiene presionado
  });

  // Soporte para dispositivos táctiles
  btnEscanear.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevenir comportamiento predeterminado (como selección de texto)
    if (escaneoActivo) {
      estaEscaneando = true;
      ultimoCodigoEscaneado = null; // Resetear para permitir un nuevo escaneo
    } else {
      inicializarQuagga(); // Reintentar inicializar si no está activo
    }
  });

  btnEscanear.addEventListener('touchend', (e) => {
    e.preventDefault(); // Prevenir comportamiento predeterminado
    estaEscaneando = false;
  });

  // Manejar el botón de detener
  btnDetener.addEventListener('click', () => {
    console.log('Deteniendo Quagga y liberando la cámara...');
    Quagga.stop();
    stopVideoStream(); // Detener explícitamente el stream de video
    escaneoActivo = false;
    estaEscaneando = false;
    contenedorCamara.style.display = 'none';
    btnEscanear.style.display = 'block';
    btnDetener.style.display = 'none';
    ultimoCodigoEscaneado = null;
    // Limpiar eventos para evitar duplicados
    Quagga.offDetected();
    console.log('Quagga detenido y eventos limpiados');
  });
}