document.addEventListener('DOMContentLoaded', () => {
  console.log('inicio-sesion-logic.js cargado');
  /* Propósito: Inicializa el script cuando inicio-sesion.html está cargado */
  /* Imprime un mensaje en la consola para confirmar la carga del script */

  /* Selección de elementos del DOM */
  const formIniciarSesion = document.querySelector('#form-iniciar-sesion');
  const btnIniciarSesion = document.querySelector('#iniciar-sesion');
  const loadingMessage = document.querySelector('.loading-message');
  /* Propósito: Obtiene referencias a elementos clave del formulario */
  /* form-iniciar-sesion: Formulario de inicio de sesión */
  /* iniciar-sesion: Botón de enviar */
  /* loading-message: Mensaje de carga con spinner */

  /* Construcción de la URL base */
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;
  /* Propósito: Crea una URL base dinámica (por ejemplo, http://localhost o https://gestion-kiosco.vercel.app) */
  /* Evita hardcodear el puerto para mayor portabilidad */

  /* Función para alternar visibilidad de la contraseña */
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
  /* Propósito: Alterna la visibilidad del campo de contraseña */
  /* Cambia el tipo del input entre 'password' y 'text' */
  /* Actualiza el ícono de Font Awesome (ojo abierto/cerrado), igual que en registrarse-logic.js */

  /* Función para realizar solicitudes con reintentos */
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
  /* Propósito: Maneja solicitudes HTTP con reintentos automáticos */
  /* Reintenta durante 60 segundos (maxDuration), con 2 segundos de espera entre intentos (delay) */
  /* Lanza un error si no se conecta al servidor, igual que en registrarse-logic.js */

  /* Manejo del inicio de sesión */
  formIniciarSesion.addEventListener('submit', async (e) => {
    e.preventDefault();
    /* Propósito: Maneja el envío del formulario de inicio de sesión */
    /* Evita el comportamiento predeterminado del formulario (recarga de página) */

    btnIniciarSesion.disabled = true;
    loadingMessage.style.display = 'flex';
    /* Desactiva el botón y muestra el mensaje de carga */

    const formData = new FormData(formIniciarSesion);
    const data = Object.fromEntries(formData);
    /* Recoge los datos del formulario (email, contrasena) */

    try {
      const response = await fetchWithRetry(`${BASE_URL}/api/iniciar-sesion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          contrasena: data.contrasena
        })
      }, 60000, 2000);
      /* Envía una solicitud POST al endpoint /api/iniciar-sesion con los datos */
      /* Usa fetchWithRetry para manejar fallos de conexión */

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al iniciar sesión');
      /* Procesa la respuesta del servidor */
      /* Lanza un error si la respuesta no es exitosa */

      localStorage.setItem('usuarioId', result.usuarioId);
      localStorage.setItem('nombreKiosco', result.nombreKiosco);
      /* Guarda el ID del usuario y el nombre del kiosco en localStorage para usarlos en otras páginas */
      
      window.location.href = '/public/menu-principal.html';
      /* Redirige al menú principal tras un inicio de sesión exitoso */
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      alert(error.message);
      /* Muestra un mensaje de error si falla la solicitud */
    } finally {
      btnIniciarSesion.disabled = false;
      loadingMessage.style.display = 'none';
      /* Restaura el estado del botón y oculta el mensaje de carga */
    }
  });
});