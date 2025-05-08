document.addEventListener('DOMContentLoaded', () => {
  console.log('inicio-sesion-logic.js cargado');

  // Elementos del DOM
  const formIniciarSesion = document.querySelector('#form-iniciar-sesion');
  const btnIniciarSesion = document.querySelector('#iniciar-sesion');

  // Construcción de la URL base
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

  // Función para alternar visibilidad de la contraseña
  window.togglePassword = function(id) {
    const input = document.getElementById(id);
    const icon = input.nextElementSibling;
    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  };

  // Función para realizar la solicitud con reintentos continuos hasta un tiempo máximo
  async function fetchWithRetry(url, options, maxDuration = 60000, delay = 2000) {
    const startTime = Date.now();
    let attempt = 1;

    while (Date.now() - startTime < maxDuration) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response;
      } catch (error) {
        console.log(`Intento ${attempt} fallido: ${error.message}. Reintentando en ${delay}ms...`);
        attempt++;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('No se pudo conectar al servidor después de varios intentos. Por favor, intenta de nuevo más tarde.');
  }

  // Manejar el inicio de sesión
  formIniciarSesion.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Mostrar estado de carga
    btnIniciarSesion.classList.add('cargando');
    btnIniciarSesion.disabled = true;

    const formData = new FormData(formIniciarSesion);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetchWithRetry(`${BASE_URL}/api/iniciar-sesion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: data.email,
          contrasena: data.contrasena
        })
      }, 60000, 2000); // Reintentar durante 60 segundos, con 2 segundos de espera entre intentos

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al iniciar sesión');

      // Guardar datos en localStorage
      localStorage.setItem('usuarioId', result.usuarioId);
      localStorage.setItem('nombreKiosco', result.nombreKiosco);

      // Redirigir al menú principal
      window.location.href = '/public/menu-principal.html';
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      alert(error.message);
    } finally {
      // Ocultar estado de carga
      btnIniciarSesion.classList.remove('cargando');
      btnIniciarSesion.disabled = false;
    }
  });
});