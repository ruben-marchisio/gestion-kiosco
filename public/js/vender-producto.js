document.addEventListener('DOMContentLoaded', () => {
  // Lista para almacenar los productos de la venta
  let productosVenta = [];

  // Construcción de la URL base sin especificar el puerto
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;
  console.log('URL base generada:', BASE_URL);

  // Escaneo para vender producto
  const botonEscanearVenta = document.querySelector('#escanear-venta');
  if (botonEscanearVenta) {
    botonEscanearVenta.addEventListener('click', () => {
      console.log('Botón Escanear clickeado en Vender Producto'); // Depuración
      const camaraVenta = document.querySelector('#camara-venta');
      iniciarEscaneo(camaraVenta, async (codigo) => {
        try {
          console.log('Buscando producto con código:', codigo);
          const respuesta = await fetch(`${BASE_URL}/api/productos/codigo/${codigo}`);
          const resultado = await respuesta.json();
          console.log('Resultado de la búsqueda:', resultado);

          if (respuesta.ok && resultado.producto) {
            document.querySelector('#codigo-venta').value = codigo;
            document.querySelector('#nombre-venta').value = resultado.producto.nombre;
            document.querySelector('#producto-manual').value = resultado.producto._id;
            document.querySelector('#metodo-venta').value = resultado.producto.unidad;
          } else {
            alert('Producto no encontrado.');
            document.querySelector('#codigo-venta').value = '';
            document.querySelector('#nombre-venta').value = '';
            document.querySelector('#producto-manual').value = '';
          }
        } catch (error) {
          alert('Error al buscar el producto: ' + error.message);
          console.error('Error:', error);
        }
      });
    });
  }

  // Cargar productos no escaneados para selección manual
  const botonSeleccionarManual = document.querySelector('#seleccionar-manual');
  const listaProductosNoEscaneados = document.querySelector('#lista-productos-no-escaneados');
  const productoManualSelect = document.querySelector('#producto-manual');
  if (botonSeleccionarManual && listaProductosNoEscaneados && productoManualSelect) {
    botonSeleccionarManual.addEventListener('click', async () => {
      listaProductosNoEscaneados.style.display = 'block';
      try {
        const respuesta = await fetch(`${BASE_URL}/api/productos/no-escaneados?usuarioId=507f1f77bcf86cd799439011`);
        const resultado = await respuesta.json();
        if (respuesta.ok) {
          productoManualSelect.innerHTML = '<option value="">Selecciona un producto</option>';
          resultado.productos.forEach(producto => {
            const option = document.createElement('option');
            option.value = producto._id;
            option.textContent = `${producto.nombre} ($${producto.precioFinal})`;
            option.dataset.precio = producto.precioFinal;
            option.dataset.unidad = producto.unidad;
            productoManualSelect.appendChild(option);
          });
        } else {
          alert(resultado.error || 'Error al cargar los productos no escaneados.');
        }
      } catch (error) {
        alert('Error al conectar con el servidor: ' + error.message);
        console.error('Error:', error);
      }
    });

    productoManualSelect.addEventListener('change', () => {
      const selectedOption = productoManualSelect.options[productoManualSelect.selectedIndex];
      document.querySelector('#nombre-venta').value = selectedOption.textContent.split(' ($')[0];
      document.querySelector('#codigo-venta').value = '';
      document.querySelector('#metodo-venta').value = selectedOption.dataset.unidad || 'unidad';
    });
  }

  // Agregar producto a la lista de venta
  const botonAgregarProducto = document.querySelector('#agregar-producto');
  const listaVentaBody = document.querySelector('#lista-venta-body');
  const totalVenta = document.querySelector('#total-venta');
  const botonConfirmarVenta = document.querySelector('#confirmar-venta');

  if (botonAgregarProducto && listaVentaBody && totalVenta && botonConfirmarVenta) {
    botonAgregarProducto.addEventListener('click', () => {
      const codigo = document.querySelector('#codigo-venta').value;
      const productoId = document.querySelector('#producto-manual').value;
      const nombre = document.querySelector('#nombre-venta').value;
      const cantidad = document.querySelector('#cantidad-venta').value;
      const metodoVenta = document.querySelector('#metodo-venta').value;

      // Validación manual de los campos requeridos
      if (!cantidad || parseInt(cantidad) <= 0) {
        alert('Por favor, ingresa una cantidad válida para vender.');
        return;
      }
      if (!metodoVenta) {
        alert('Por favor, selecciona un método de venta.');
        return;
      }
      if (!codigo && !productoId) {
        alert('Por favor, selecciona un producto (mediante escaneo o manualmente).');
        return;
      }

      // Obtener el precio del producto (simulamos que lo tenemos desde el servidor o la selección manual)
      let precioUnitario = 0;
      const selectedOption = productoManualSelect.options[productoManualSelect.selectedIndex];
      if (selectedOption && selectedOption.dataset.precio) {
        precioUnitario = parseFloat(selectedOption.dataset.precio);
      }

      if (precioUnitario <= 0) {
        alert('Error: No se pudo obtener el precio del producto.');
        return;
      }

      const subtotal = precioUnitario * parseInt(cantidad);

      // Agregar el producto a la lista
      const producto = {
        codigo: codigo,
        productoId: productoId,
        nombre: nombre,
        cantidad: parseInt(cantidad),
        metodoVenta: metodoVenta,
        precioUnitario: precioUnitario,
        subtotal: subtotal
      };

      productosVenta.push(producto);
      actualizarListaVenta();

      // Limpiar el formulario
      document.querySelector('#codigo-venta').value = '';
      document.querySelector('#nombre-venta').value = '';
      document.querySelector('#producto-manual').value = '';
      document.querySelector('#cantidad-venta').value = '';
      document.querySelector('#metodo-venta').value = 'unidad';
      listaProductosNoEscaneados.style.display = 'none';
    });

    // Función para actualizar la lista de venta
    function actualizarListaVenta() {
      listaVentaBody.innerHTML = '';
      let total = 0;

      productosVenta.forEach((producto, index) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
          <td>${producto.nombre}</td>
          <td>${producto.metodoVenta}</td>
          <td>${producto.cantidad}</td>
          <td>$${producto.precioUnitario.toFixed(2)}</td>
          <td>$${producto.subtotal.toFixed(2)}</td>
          <td><button type="button" class="boton-eliminar" data-index="${index}"><i class="fas fa-trash"></i> Eliminar</button></td>
        `;
        listaVentaBody.appendChild(fila);
        total += producto.subtotal;
      });

      totalVenta.textContent = `$${total.toFixed(2)}`;
      botonConfirmarVenta.style.display = productosVenta.length > 0 ? 'inline-block' : 'none';

      // Agregar evento para eliminar productos
      const botonesEliminar = document.querySelectorAll('.boton-eliminar');
      botonesEliminar.forEach(boton => {
        boton.addEventListener('click', () => {
          const index = parseInt(boton.dataset.index);
          productosVenta.splice(index, 1);
          actualizarListaVenta();
        });
      });
    }

    // Confirmar la venta
    botonConfirmarVenta.addEventListener('click', async () => {
      if (productosVenta.length === 0) {
        alert('No hay productos para vender.');
        return;
      }

      try {
        const respuesta = await fetch(`${BASE_URL}/api/vender`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productos: productosVenta,
            usuarioId: '507f1f77bcf86cd799439011'
          }),
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
          alert(resultado.mensaje);
          productosVenta = [];
          actualizarListaVenta();
        } else {
          alert(resultado.error || 'Error al vender los productos. Revisa los datos e intenta de nuevo.');
        }
      } catch (error) {
        alert('Error al conectar con el servidor: ' + error.message);
        console.error('Error:', error);
      }
    });
  }
});