document.addEventListener('DOMContentLoaded', () => {
  console.log('menu-principal-logic.js cargado');
  /* Propósito: Inicializa el script cuando menu-principal.html está cargado */
  /* Imprime un mensaje en la consola para confirmar la carga del script */

  /* Selección de elementos del DOM */
  const btnCerrarSesion = document.querySelector('.cerrar-sesion');
  /* Propósito: Obtiene la referencia al botón de cerrar sesión */

  /* Manejar el cierre de sesión */
  btnCerrarSesion.addEventListener('click', () => {
    /* Propósito: Maneja el evento de clic en el botón de cerrar sesión */
    
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('nombreKiosco');
    /* Elimina los datos de usuario (ID y nombre del kiosco) almacenados en localStorage */
    /* Esto finaliza la sesión del usuario */
    
    window.location.href = '/public/index.html';
    /* Redirige a la página de bienvenida (index.html) */
  });
});