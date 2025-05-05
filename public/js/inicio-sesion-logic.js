document.addEventListener('DOMContentLoaded', () => {
  console.log('inicio-sesion.js cargado');

  const formIniciarSesion = document.querySelector('#form-iniciar-sesion');
  const botonIrARegistro = document.querySelector('#ir-a-registro');

  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;
  console.log('URL base generada:', BASE_URL);

  if (botonIrARegistro) {
    botonIrARegistro.addEventListener('click', () => {
      console.log('Redirigiendo a registrarse.html');
      window.location.href = '/public/registrarse.html';
    });
  }

  if (formIniciarSesion) {
    formIniciarSesion.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Evento submit disparado para inicio de sesión');

      const formData = new FormData(formIniciarSesion);
      const email = formData.get('email');
      const contrasena = formData.get('contrasena');

      console.log('Intentando iniciar sesión con:', { email, contrasena });

      try {
        console.log('Enviando solicitud a:', `${BASE_URL}/api/iniciar-sesion`);
        const respuesta = await fetch(`${BASE_URL}/api/iniciar-sesion`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, contrasena }),
        });

        console.log('Estado de la respuesta:', respuesta.status);
        const resultado = await respuesta.json();
        console.log('Resultado del servidor:', resultado);

        if (respuesta.ok) {
          console.log('Inicio de sesión exitoso, redirigiendo...');
          alert(resultado.mensaje);
          localStorage.setItem('nombreKiosco', resultado.nombreKiosco || 'Kiosco Desconocido');
          window.location.href = '/public/index.html';
        } else {
          console.log('Error al iniciar sesión, mostrando mensaje de error...');
          alert(resultado.error || 'Error al iniciar sesión. Revisa los datos e intenta de nuevo.');
        }
      } catch (error) {
        console.error('Error detallado al conectar con el servidor:', error);
        alert('Error al conectar con el servidor: ' + error.message);
      }
    });
  }

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