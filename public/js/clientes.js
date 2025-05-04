document.addEventListener('DOMContentLoaded', () => {
  const formCargarCliente = document.querySelector('#form-cargar-cliente');
  const listaClientesBody = document.querySelector('#lista-clientes-body');

  // Construcción de la URL base sin especificar el puerto
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;
  console.log('URL base generada:', BASE_URL);

  // Cargar la lista de clientes al iniciar
  async function cargarClientes() {
    try {
      const respuesta = await fetch(`${BASE_URL}/api/clientes?usuarioId=507f1f77bcf86cd799439011`);
      const resultado = await respuesta.json();
      if (respuesta.ok) {
        listaClientesBody.innerHTML = '';
        resultado.clientes.forEach(cliente => {
          const fila = document.createElement('tr');
          fila.innerHTML = `
            <td>${cliente.nombre}</td>
            <td>${cliente.dni}</td>
            <td>${cliente.telefono || '-'}</td>
            <td>${cliente.direccion || '-'}</td>
          `;
          listaClientesBody.appendChild(fila);
        });
      } else {
        alert(resultado.error || 'Error al cargar los clientes.');
      }
    } catch (error) {
      alert('Error al conectar con el servidor: ' + error.message);
      console.error('Error:', error);
    }
  }

  // Enviar el formulario para cargar un cliente
  if (formCargarCliente) {
    formCargarCliente.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(formCargarCliente);
      formData.append('usuarioId', '507f1f77bcf86cd799439011');

      try {
        const respuesta = await fetch(`${BASE_URL}/api/clientes`, {
          method: 'POST',
          body: formData,
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
          alert(resultado.mensaje);
          formCargarCliente.reset();
          cargarClientes();
        } else {
          alert(resultado.error || 'Error al cargar el cliente. Revisa los datos e intenta de nuevo.');
        }
      } catch (error) {
        alert('Error al conectar con el servidor: ' + error.message);
        console.error('Error:', error);
      }
    });
  }

  // Cargar la lista de clientes al iniciar la página
  cargarClientes();
});