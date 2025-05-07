// Este archivo contiene la lógica para el menú principal de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  console.log('menu-principal-logic.js cargado');

  // Elementos del DOM
  const btnCerrarSesion = document.querySelector('.cerrar-sesion');

  // Manejar el cierre de sesión
  btnCerrarSesion.addEventListener('click', () => {
    // Eliminar datos del usuario de localStorage
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('nombreKiosco');
    
    // Redirigir a index.html
    window.location.href = '/public/index.html';
  });
});