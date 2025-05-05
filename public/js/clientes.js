document.addEventListener('DOMContentLoaded', () => {
  console.log('clientes.js cargado');

  // Verificar si el usuario ha iniciado sesión
  const usuarioId = localStorage.getItem('usuarioId');
  if (!usuarioId) {
    window.location.href = '/public/inicio-sesion.html';
    return;
  }

  // Elementos del DOM
  const formCargarCliente = document.querySelector('#form-cargar-cliente');
  const listaClientesBody = document.querySelector('#lista-clientes-body');
  const cerrarSesionBtn = document.querySelector('.cerrar-sesion');

  // Construcción de la URL base
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

  // Cargar clientes
  async function cargarClientes() {
    try {
      const respuesta = await fetch(`${BASE_URL}/api/clientes?usuarioId=${usuarioId}`);
      const clientes = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(clientes.error || 'Error al cargar clientes');
      }
      listaClientesBody.innerHTML = '';
      clientes.forEach(cliente => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${cliente.nombre}</td>
          <td>${cliente.dni}</td>
          <td>${cliente.telefono || 'N/A'}</td>
          <td>${cliente.direccion || 'N/A'}</td>
        `;
        listaClientesBody.appendChild(tr);
      });
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      alert('Error al cargar clientes: ' + error.message);
    }
  }

  // Guardar cliente
  formCargarCliente.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(formCargarCliente);
    formData.append('usuarioId', usuarioId);

    try {
      const respuesta = await fetch(`${BASE_URL}/api/clientes`, {
        method: 'POST',
        body: formData
      });

      if (respuesta.ok) {
        alert('Cliente guardado con éxito');
        formCargarCliente.reset();
        cargarClientes();
      } else {
        const resultado = await respuesta.json();
        throw new Error(resultado.error || 'Error al guardar el cliente');
      }
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      alert('Error al guardar el cliente: ' + error.message);
    }
  });

  // Cerrar sesión
  cerrarSesionBtn.addEventListener('click', () => {
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('nombreKiosco');
    window.location.href = '/public/inicio-sesion.html';
  });

  // Cargar clientes al iniciar
  cargarClientes();
});