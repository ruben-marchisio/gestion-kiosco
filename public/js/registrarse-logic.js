document.addEventListener('DOMContentLoaded', () => {
  console.log('registrarse-logic.js cargado');

  const formRegistrarse = document.querySelector('#form-registro'); // Corregido: #form-registrarse -> #form-registro
  const btnRegistrarse = document.querySelector('#registrarse');
  const botonIrAInicioSesion = document.querySelector('#ir-a-inicio-sesion');

  // Construcción de la URL base sin especificar el puerto
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;
  console.log('URL base generada:', BASE_URL);

  // Mostrar formulario de inicio de sesión
  if (botonIrAInicioSesion) {
    botonIrAInicioSesion.addEventListener('click', () => {
      console.log('Redirigiendo a inicio-sesion.html');
      window.location.href = '/public/inicio-sesion.html';
    });
  } else {
    console.error('Botón "ir-a-inicio-sesion" no encontrado');
  }

  // Manejar el envío del formulario de registro
  if (formRegistrarse) {
    formRegistrarse.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Evento submit disparado para registro');

      // Mostrar estado de carga
      btnRegistrarse.classList.add('cargando');
      btnRegistrarse.disabled = true;

      const formData = new FormData(formRegistrarse);
      const data = Object.fromEntries(formData);
      // Ajustar el nombre del campo para que coincida con lo que espera el backend
      data.nombreKiosco = data['nombreKiosco'];

      console.log('Intentando registrarse con:', data);

      try {
        console.log('Enviando solicitud a:', `${BASE_URL}/api/registrar-usuario`);
        const respuesta = await fetch(`${BASE_URL}/api/registrar-usuario`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        console.log('Estado de la respuesta:', respuesta.status);
        console.log('¿Respuesta OK?', respuesta.ok);

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
      } catch (error) {
        console.error('Error detallado al conectar con el servidor:', error);
        alert('Error al conectar con el servidor: ' + error.message);
      } finally {
        // Ocultar estado de carga
        btnRegistrarse.classList.remove('cargando');
        btnRegistrarse.disabled = false;
      }
    });
  } else {
    console.error('Formulario de registro no encontrado');
  }

  // Función para mostrar/ocultar contraseña
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
});