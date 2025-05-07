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
  toast.textContent = mensaje;
  toastContainer.appendChild(toast);

  // Eliminar el toast después de la animación
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Función para iniciar el escaneo continuo de códigos de barras con control manual
function iniciarEscaneoContinuo(contenedorCamara, btnEscanear, btnDetener, inputCodigo, completarInmediatamenteCallback, onCodeDetected) {
  let escaneoActivo = false;
  let estaEscaneando = false; // Estado para controlar si el botón está presionado
  let ultimoCodigoEscaneado = null;

  // Sonido de escaneo
  const beepSound = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3'); // URL del sonido (reemplaza con tu archivo si lo tienes)

  // Construcción de la URL base
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;
  console.log('URL base:', BASE_URL); // Depuración

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

  // Función para inicializar Quagga
  function inicializarQuagga() {
    console.log('Inicializando Quagga...'); // Depuración
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: contenedorCamara,
        constraints: {
          width: 1280, // Aumentado para mejor resolución
          height: 720, // Ajustado para proporción rectangular
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
      numOfWorkers: navigator.hardwareConcurrency || 4, // Usa más workers para mejor rendimiento
      decoder: {
        readers: ["ean_reader", "upc_reader", "code_128_reader"],
        multiple: false // Evita lecturas múltiples del mismo código
      },
      locate: true // Mejora la localización del código
    }, (err) => {
      if (err) {
        console.error('Error al inicializar Quagga:', err);
        mostrarToast('Error al inicializar la cámara: ' + err.message, 'error');
        return;
      }

      console.log('Quagga inicializado correctamente'); // Depuración
      Quagga.start();
      escaneoActivo = true;
      contenedorCamara.style.display = 'block';
      btnEscanear.style.display = 'block';
      btnDetener.style.display = 'block';
    });
  }

  // Abrir la cámara al inicializar
  inicializarQuagga();

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

    // Actualizar el input del código
    inputCodigo.value = code;
    mostrarToast('Código escaneado: ' + code, 'success');

    // Ejecutar callback para completar datos si está activado
    if (completarInmediatamenteCallback) {
      fetch(`${BASE_URL}/api/productos/codigo/${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.producto) {
            completarInmediatamenteCallback(data.producto);
          } else {
            mostrarToast('Producto no encontrado. Por favor, completa los datos manualmente.', 'info');
          }
        })
        .catch(err => {
          console.error('Error al buscar el producto:', err);
          mostrarToast('Error al buscar el producto: ' + err.message, 'error');
        });
    }

    // Ejecutar callback adicional si se proporciona
    if (onCodeDetected) {
      onCodeDetected(code);
    }
  });

  // Manejar el botón de escanear (mantener presionado)
  btnEscanear.addEventListener('mousedown', () => {
    if (!escaneoActivo) return;
    estaEscaneando = true;
    ultimoCodigoEscaneado = null; // Resetear para permitir un nuevo escaneo
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
    if (!escaneoActivo) return;
    estaEscaneando = true;
    ultimoCodigoEscaneado = null; // Resetear para permitir un nuevo escaneo
  });

  btnEscanear.addEventListener('touchend', (e) => {
    e.preventDefault(); // Prevenir comportamiento predeterminado
    estaEscaneando = false;
  });

  // Manejar el botón de detener
  btnDetener.addEventListener('click', () => {
    Quagga.stop();
    escaneoActivo = false;
    estaEscaneando = false;
    contenedorCamara.style.display = 'none';
    btnEscanear.style.display = 'block';
    btnDetener.style.display = 'none';
    ultimoCodigoEscaneado = null;
  });
}