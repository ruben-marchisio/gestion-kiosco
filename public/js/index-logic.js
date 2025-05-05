document.addEventListener('DOMContentLoaded', () => {
  console.log('index.js cargado');

  // Obtener el nombre del kiosco desde localStorage
  const nombreKiosco = localStorage.getItem('nombreKiosco') || 'Kiosco Desconocido';
  document.getElementById('nombre-kiosco').textContent = nombreKiosco;
  document.title = `Gestión Kiosco - ${nombreKiosco}`;
  // Verificar si el usuario ha iniciado sesión
  const usuarioId = localStorage.getItem('usuarioId');
  if (!usuarioId) {
    window.location.href = '/public/inicio-sesion.html';
    return;
  }
});