document.addEventListener('DOMContentLoaded', () => {
    console.log('registrarse-logic.js cargado');
  
    const formRegistrarse = document.querySelector('#form-registrarse');
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
    }
  
    // Manejar el envío del formulario de registro
    if (formRegistrarse) {
      formRegistrarse.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Evento submit disparado para registro');
  
        const formData = new FormData(formRegistrarse);
        const data = Object.fromEntries(formData);
  
        console.log('Intentando registrarse con:', data);
  
        try {
          console.log('Enviando solicitud a:', `${BASE_URL}/api/registrarse`);
          const respuesta = await fetch(`${BASE_URL}/api/registrarse`, {
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
        }
      });
    } else {
      console.error('Formulario de registro no encontrado');
    }
  });