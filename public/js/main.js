document.addEventListener('DOMContentLoaded', () => {
  // Seleccionar todos los botones del menú
  const botonesMenu = document.querySelectorAll('.menu-boton');
  const botonCerrarSesion = document.querySelector('.cerrar-sesion');

  // Mostrar/Ocultar secciones al hacer clic en los botones
  botonesMenu.forEach(boton => {
    boton.addEventListener('click', () => {
      // Si el botón tiene un atributo onclick, no hacemos nada (la redirección se maneja en HTML)
      if (boton.hasAttribute('onclick')) {
        return;
      }

      const seccionId = boton.getAttribute('data-seccion');
      if (seccionId) {
        const seccion = document.querySelector(`#${seccionId}`);
        if (seccion) {
          seccion.style.display = seccion.style.display === 'none' ? 'block' : 'none';
        }
      } else {
        const textoBoton = boton.textContent.trim();
        let mensaje = '';

        switch (textoBoton) {
          case 'Ver Stock':
            mensaje = 'Mostrando inventario actual...';
            break;
          case 'Reportes':
            mensaje = 'Generando reporte de ventas...';
            break;
          case 'Pedidos':
            mensaje = 'Abriendo lista de pedidos...';
            break;
          case 'Configuración':
            mensaje = 'Abriendo ajustes de configuración...';
            break;
          default:
            mensaje = 'Función no implementada aún.';
        }

        alert(mensaje);
      }
    });
  });

  // Añadir evento de clic al botón de cerrar sesión
  if (botonCerrarSesion) {
    botonCerrarSesion.addEventListener('click', () => {
      window.location.href = '/public/presentacion.html';
    });
  }
});