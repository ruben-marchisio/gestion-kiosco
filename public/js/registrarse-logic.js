document.addEventListener('DOMContentLoaded', () => {
  console.log('registrarse-logic.js cargado');
  /* Propósito: Inicializa el script cuando registrarse.html está cargado */
  /* Imprime un mensaje en la consola para confirmar la carga del script */

  /* Selección de elementos del DOM */
  const formRegistrarse = document.querySelector('#form-registro');
  const btnRegistrarse = document.querySelector('#registrarse');
  const botonIrAInicioSesion = document.querySelector('#ir-a-inicio-sesion');
  const loadingMessage = document.querySelector('.loading-message');
  /* Propósito: Obtiene referencias a elementos clave del formulario */
  /* form-registro: Formulario de registro */
  /* registrarse: Botón de enviar */
  /* ir-a-inicio-sesion: Enlace para redirigir a inicio-sesion.html */
  /* loading-message: Mensaje de carga con spinner */

  /* Construcción de la URL base */
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;
  console.log('URL base generada:', BASE_URL);
  /* Propósito: Crea una URL base dinámica (por ejemplo, http://localhost o https://gestion-kiosco.vercel.app) */
  /* Evita hardcodear el puerto para mayor portabilidad */

  /* Redirección al hacer clic en "Iniciar Sesión" */
  if (botonIrAInicioSesion) {
    botonIrAInicioSesion.addEventListener('click', () => {
      console.log('Redirigiendo a inicio-sesion.html');
      window.location.href = '/public/inicio-sesion.html';
    });
  } else {
    console.error('Botón "ir-a-inicio-sesion" no encontrado');
  }
  /* Propósito: Redirige a inicio-sesion.html al hacer clic en el botón */
  /* Incluye verificación para evitar errores si el botón no existe */

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
  /* Lanza un error si no se conecta al servidor */

  /* Manejo del envío del formulario de registro */
  if (formRegistrarse) {
    formRegistrarse.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Evento submit disparado para registro');
      /* Propósito: Maneja el envío del formulario de registro */
      /* Evita el comportamiento predeterminado del formulario (recarga de página) */

      btnRegistrarse.disabled = true;
      loadingMessage.style.display = 'flex';
      /* Desactiva el botón y muestra el mensaje de carga */

      const formData = new FormData(formRegistrarse);
      const data = Object.fromEntries(formData);
      data.nombreKiosco = data['nombreKiosco'];
      console.log('Intentando registrarse con:', data);
      /* Recoge los datos del formulario (nombreKiosco, email, contrasena) */
      /* Ajusta el nombre del campo para coincidir con el backend */

      try {
        console.log('Enviando solicitud a:', `${BASE_URL}/api/registrar-usuario`);
        const respuesta = await fetchWithRetry(`${BASE_URL}/api/registrar-usuario`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }, 60000, 2000);
        /* Envía una solicitud POST al endpoint /api/registrar-usuario con los datos */
        /* Usa fetchWithRetry para manejar fallos de conexión */

        const resultado = await respuesta.json();
        console.log('Resultado del servidor:', resultado);
        if (respuesta.ok) {
          console.log('Registro exitoso, redirigiendo...');
          alert(resultado.mensaje);
          window.location.href = '/public/inicio-sesion.html';
        } else {
          console.log('Error al registrarse, mostrando mensaje de error...');
          alert(resultado.error || 'Error al registrarse. Revisa los datos e intenta de nuevo.');
        }
        /* Procesa la respuesta del servidor */
        /* Si es exitosa, muestra un mensaje y redirige a inicio-sesion.html */
        /* Si falla, muestra el error del servidor */
      } catch (error) {
        console.error('Error detallado al conectar con el servidor:', error);
        alert(error.message);
      } finally {
        btnRegistrarse.disabled = false;
        loadingMessage.style.display = 'none';
      }
      /* Maneja errores de conexión y siempre restaura el estado del botón y oculta el mensaje de carga */
    });
  } else {
    console.error('Formulario de registro no encontrado');
  }
  /* Propósito: Configura el evento de envío del formulario */
  /* Verifica que el formulario exista para evitar errores */

  /* Función para mostrar/ocultar contraseña */
  window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
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
  /* Actualiza el ícono de Font Awesome (ojo abierto/cerrado) */
});