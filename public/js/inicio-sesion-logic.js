document.addEventListener('DOMContentLoaded', () => {
  console.log('inicio-sesion-logic.js cargado');

  // Elementos del DOM
  const formIniciarSesion = document.querySelector('#form-iniciar-sesion');
  const irARegistroBtn = document.querySelector('#ir-a-registro');

  // Construcción de la URL base
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

  // Función para alternar visibilidad de la contraseña
  window.togglePassword = function(id) {
    const input = document.querySelector(`#${id}`);
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

  // Manejar el inicio de sesión
  formIniciarSesion.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(formIniciarSesion);
    const data = Object.fromEntries(formData);

    try {
      const respuesta = await fetch(`${BASE_URL}/api/iniciar-sesion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const resultado = await respuesta.json();

      if (respuesta.ok) {
        localStorage.setItem('usuarioId', resultado.usuarioId);
        localStorage.setItem('nombreKiosco', resultado.nombreKiosco);
        window.location.href = '/public/menu-principal.html';
      } else {
        throw new Error(resultado.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      alert('Error al iniciar sesión: ' + error.message);
    }
  });

  // Redirigir a la página de registro
  irARegistroBtn.addEventListener('click', () => {
    window.location.href = '/public/registrarse.html';
  });
});