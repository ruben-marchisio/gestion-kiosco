document.addEventListener('DOMContentLoaded', () => {
  console.log('cargar-producto-logic.js cargado');

  // Elementos del DOM
  const formCargarProducto = document.querySelector('#form-cargar-producto');
  const inputCategoria = document.querySelector('#categoria');
  const inputUnidad = document.querySelector('#unidad');
  const subcategoriaBebidas = document.querySelector('#subcategoria-bebidas');
  const subcategoriaGolosinas = document.querySelector('#subcategoria-golosinas');
  const subcategoriaLacteos = document.querySelector('#subcategoria-lacteos');
  const subcategoriaCigarrillos = document.querySelector('#subcategoria-cigarrillos');
  const subcategoriaFiambre = document.querySelector('#subcategoria-fiambre');
  const subcategoriaCongelados = document.querySelector('#subcategoria-congelados');
  const subcategoriaPanaderia = document.querySelector('#subcategoria-panaderia');
  const subcategoriaAlmacen = document.querySelector('#subcategoria-almacen');
  const subcategoriaVerduleria = document.querySelector('#subcategoria-verduleria');
  const inputPacks = document.querySelector('#packs');
  const inputUnidadesPorPack = document.querySelector('#unidadesPorPack');
  const inputDocenas = document.querySelector('#docenas');
  const inputUnidadesSueltas = document.querySelector('#unidadesSueltas');
  const inputCantidadTotal = document.querySelector('#cantidad-total');
  const inputPrecioLista = document.querySelector('#precio-lista');
  const inputPorcentajeGanancia = document.querySelector('#porcentaje-ganancia');
  const inputPrecioFinal = document.querySelector('#precio-final');
  const btnAgregarProducto = document.querySelector('#agregar-producto');
  const btnCancelarProducto = document.querySelector('#cancelar-producto');
  const btnConfirmarTodos = document.querySelector('#confirmar-todos');
  const btnCancelarTodo = document.querySelector('#cancelar-todo');
  const tablaProductosProceso = document.querySelector('#lista-productos-body');
  const btnEscanear = document.querySelector('#escanear');
  const btnDetenerEscaneo = document.querySelector('#detener-escaneo');
  const camaraCarga = document.querySelector('#camara-carga');
  const inputCodigo = document.querySelector('#codigo');

  // Estado para manejar los productos en proceso
  let productosEnProceso = [];

  // Construcción de la URL base
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

  // Ocultar inicialmente todos los elementos que deben estar ocultos
  document.querySelectorAll('[id^="subcategoria-"]').forEach(el => el.style.display = 'none');
  document.querySelector('#cantidad-packs').style.display = 'none';
  document.querySelector('#unidades-por-pack').style.display = 'none';
  document.querySelector('#cantidad-docenas').style.display = 'none';

  // Verificar que el botón de escanear existe
  if (!btnEscanear) {
    console.error('Botón #escanear no encontrado en el DOM');
    mostrarToast('Error: Botón de escanear no encontrado.', 'error');
    return;
  }
  console.log('Botón #escanear encontrado:', btnEscanear);

  // Función para mostrar la subcategoría según la categoría seleccionada
  function mostrarSubcategoria(categoria) {
    document.querySelectorAll('[id^="subcategoria-"]').forEach(el => {
      console.log('Ocultando elemento:', el.id);
      el.style.display = 'none';
    });
    if (categoria) {
      const subcategoriaElement = document.querySelector(`#subcategoria-${categoria}`);
      if (subcategoriaElement) {
        console.log('Mostrando subcategoría:', subcategoriaElement.id);
        subcategoriaElement.style.display = 'block';
        console.log('Estilo display después de cambiar:', subcategoriaElement.style.display);
      } else {
        console.log(`No se encontró subcategoría para la categoría: ${categoria}`);
      }
    }
  }

  // Mostrar u ocultar subcategorías según la categoría seleccionada
  inputCategoria.addEventListener('change', () => {
    const categoria = inputCategoria.value;
    console.log('Categoría seleccionada:', categoria);
    mostrarSubcategoria(categoria);
  });

  // Mostrar u ocultar campos de cantidad según la unidad seleccionada
  inputUnidad.addEventListener('change', () => {
    const unidad = inputUnidad.value;
    console.log('Unidad seleccionada:', unidad);
    document.querySelector('#cantidad-packs').style.display = unidad === 'pack' ? 'block' : 'none';
    document.querySelector('#unidades-por-pack').style.display = unidad === 'pack' ? 'block' : 'none';
    document.querySelector('#cantidad-docenas').style.display = unidad === 'docena' ? 'block' : 'none';
    actualizarCantidadTotal();
  });

  // Actualizar cantidad total al cambiar los valores
  [inputPacks, inputUnidadesPorPack, inputDocenas, inputUnidadesSueltas].forEach(input => {
    input.addEventListener('input', actualizarCantidadTotal);
  });

  function actualizarCantidadTotal() {
    const packs = parseInt(inputPacks.value) || 0;
    const unidadesPorPack = parseInt(inputUnidadesPorPack.value) || 0;
    const docenas = parseInt(inputDocenas.value) || 0;
    const unidadesSueltas = parseInt(inputUnidadesSueltas.value) || 0;
    const total = (packs * unidadesPorPack) + (docenas * 12) + unidadesSueltas;
    inputCantidadTotal.value = total;
  }

  // Calcular precio final al cambiar precio de lista o porcentaje de ganancia
  [inputPrecioLista, inputPorcentajeGanancia].forEach(input => {
    input.addEventListener('input', () => {
      const precioLista = parseFloat(inputPrecioLista.value) || 0;
      const porcentajeGanancia = parseFloat(inputPorcentajeGanancia.value) || 0;
      const precioFinal = precioLista * (1 + porcentajeGanancia / 100);
      inputPrecioFinal.value = precioFinal.toFixed(2);
    });
  });

  // Manejar el envío del formulario
  btnAgregarProducto.addEventListener('click', () => {
    const formData = new FormData(formCargarProducto);
    const data = Object.fromEntries(formData);

    // Validar datos
    if (!data.nombre || !data.marca || !data.categoria || !data.unidad || !data.fechaVencimiento) {
      mostrarToast('Por favor, completa todos los campos requeridos.', 'error');
      return;
    }

    const cantidadTotal = parseInt(inputCantidadTotal.value) || 0;
    if (cantidadTotal <= 0) {
      mostrarToast('La cantidad total debe ser mayor que 0.', 'error');
      return;
    }

    // Agregar producto a la lista de productos en proceso
    const producto = {
      nombre: data.nombre,
      marca: data.marca,
      categoria: data.categoria,
      subcategoria: data.subcategoria || '',
      precioLista: parseFloat(data.precioLista),
      porcentajeGanancia: parseFloat(data.porcentajeGanancia),
      precioFinal: parseFloat(inputPrecioFinal.value),
      unidad: data.unidad,
      packs: parseInt(data.packs) || 0,
      unidadesPorPack: parseInt(data.unidadesPorPack) || 0,
      docenas: parseInt(data.docenas) || 0,
      unidadesSueltas: parseInt(data.unidadesSueltas) || 0,
      cantidadUnidades: cantidadTotal,
      fechaVencimiento: data.fechaVencimiento,
      codigo: data.codigo || '',
      icono: data.icono || 'default',
      estado: 'Pendiente'
    };

    // Verificar si el producto ya existe
    if (producto.codigo) {
      fetch(`${BASE_URL}/api/productos/codigo/${producto.codigo}?usuarioId=${localStorage.getItem('usuarioId')}`)
        .then(res => res.json())
        .then(result => {
          if (result.producto) {
            mostrarToast(`Este producto ya existe en tu stock. Serás redirigido a la sección de <a href="/public/stock.html?codigo=${producto.codigo}" style="color: #3498db; text-decoration: underline;">Stock</a> para modificarlo.`, 'info');
            setTimeout(() => {
              window.location.href = `/public/stock.html?codigo=${producto.codigo}`;
            }, 3000);
          } else {
            productosEnProceso.push(producto);
            actualizarTablaProductos();
            formCargarProducto.reset();
            inputPrecioFinal.value = '';
            document.querySelectorAll('[id^="subcategoria-"]').forEach(el => el.style.display = 'none');
            document.querySelector('#cantidad-packs').style.display = 'none';
            document.querySelector('#unidades-por-pack').style.display = 'none';
            document.querySelector('#cantidad-docenas').style.display = 'none';
            mostrarToast('Producto agregado a la lista en proceso.', 'success');
          }
        })
        .catch(err => {
          console.error('Error al verificar el producto:', err);
          mostrarToast('Error al verificar el producto.', 'error');
        });
    } else {
      productosEnProceso.push(producto);
      actualizarTablaProductos();
      formCargarProducto.reset();
      inputPrecioFinal.value = '';
      document.querySelectorAll('[id^="subcategoria-"]').forEach(el => el.style.display = 'none');
      document.querySelector('#cantidad-packs').style.display = 'none';
      document.querySelector('#unidades-por-pack').style.display = 'none';
      document.querySelector('#cantidad-docenas').style.display = 'none';
      mostrarToast('Producto agregado a la lista en proceso.', 'success');
    }
  });

  // Cancelar producto
  btnCancelarProducto.addEventListener('click', () => {
    formCargarProducto.reset();
    inputPrecioFinal.value = '';
    document.querySelectorAll('[id^="subcategoria-"]').forEach(el => el.style.display = 'none');
    document.querySelector('#cantidad-packs').style.display = 'none';
    document.querySelector('#unidades-por-pack').style.display = 'none';
    document.querySelector('#cantidad-docenas').style.display = 'none';
  });

  // Actualizar la tabla de productos en proceso
  function actualizarTablaProductos() {
    tablaProductosProceso.innerHTML = '';
    productosEnProceso.forEach((producto, index) => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${producto.nombre}</td>
        <td>${producto.marca}</td>
        <td>${producto.categoria}${producto.subcategoria ? ` (${producto.subcategoria})` : ''}</td>
        <td>${producto.cantidadUnidades}</td>
        <td class="estado">${producto.estado}</td>
        <td><i class="${producto.icono !== 'default' ? `fas fa-${producto.icono}` : ''}"></i></td>
        <td class="acciones">
          <button class="boton-accion editar confirmar-producto" data-index="${index}"><i class="fas fa-check"></i></button>
          <button class="boton-accion eliminar eliminar-producto" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
        </td>
      `;
      if (producto.estado === 'Pendiente') {
        fila.classList.add('pendiente');
      } else if (producto.estado === 'Confirmado') {
        fila.classList.add('completo');
      }
      tablaProductosProceso.appendChild(fila);
    });

    document.querySelectorAll('.confirmar-producto').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.getAttribute('data-index'));
        confirmarProducto(index);
      });
    });

    document.querySelectorAll('.eliminar-producto').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.getAttribute('data-index'));
        eliminarProducto(index);
      });
    });
  }

  // Confirmar un producto individual
  async function confirmarProducto(index) {
    const producto = productosEnProceso[index];
    producto.estado = 'Confirmado';

    try {
      const usuarioId = localStorage.getItem('usuarioId');
      const response = await fetch(`${BASE_URL}/api/productos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...producto, usuarioId })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al confirmar el producto');

      mostrarToast(result.mensaje || 'Producto confirmado con éxito.', 'success');
      productosEnProceso.splice(index, 1);
      actualizarTablaProductos();
    } catch (error) {
      console.error('Error al confirmar el producto:', error);
      mostrarToast('Error al confirmar el producto: ' + error.message, 'error');
      producto.estado = 'Pendiente';
      actualizarTablaProductos();
    }
  }

  // Eliminar un producto de la lista
  function eliminarProducto(index) {
    productosEnProceso.splice(index, 1);
    actualizarTablaProductos();
    mostrarToast('Producto eliminado de la lista.', 'info');
  }

  // Confirmar todos los productos
  btnConfirmarTodos.addEventListener('click', async () => {
    if (productosEnProceso.length === 0) {
      mostrarToast('No hay productos para confirmar.', 'info');
      return;
    }

    const usuarioId = localStorage.getItem('usuarioId');
    const productosPendientes = productosEnProceso.filter(p => p.estado === 'Pendiente');

    if (productosPendientes.length === 0) {
      mostrarToast('No hay productos pendientes para confirmar.', 'info');
      return;
    }

    try {
      for (let i = 0; i < productosPendientes.length; i++) {
        const producto = productosPendientes[i];
        producto.estado = 'Confirmado';
        const response = await fetch(`${BASE_URL}/api/productos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...producto, usuarioId })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Error al confirmar el producto');
      }

      productosEnProceso = productosEnProceso.filter(p => p.estado !== 'Confirmado');
      actualizarTablaProductos();
      mostrarToast('Todos los productos fueron confirmados con éxito.', 'success');
    } catch (error) {
      console.error('Error al confirmar los productos:', error);
      mostrarToast('Error al confirmar los productos: ' + error.message, 'error');
      productosPendientes.forEach(p => p.estado = 'Pendiente');
      actualizarTablaProductos();
    }
  });

  // Cancelar todos los productos
  btnCancelarTodo.addEventListener('click', () => {
    productosEnProceso = [];
    actualizarTablaProductos();
    mostrarToast('Lista de productos en proceso limpiada.', 'info');
  });

  // Manejar el escaneo continuo de códigos de barras
  const completarCallback = (producto) => {
    if (producto) {
      console.log('Producto detectado:', producto);
      fetch(`${BASE_URL}/api/productos/codigo/${producto.codigo}?usuarioId=${localStorage.getItem('usuarioId')}`)
        .then(res => res.json())
        .then(result => {
          if (result.producto) {
            mostrarToast(`Este producto ya existe en tu stock. Serás redirigido a la sección de <a href="/public/stock.html?codigo=${producto.codigo}" style="color: #3498db; text-decoration: underline;">Stock</a> para modificarlo.`, 'info');
            setTimeout(() => {
              window.location.href = `/public/stock.html?codigo=${producto.codigo}`;
            }, 3000);
          } else {
            console.log('Autocompletando formulario con producto:', producto);
            document.querySelector('#nombre-producto').value = producto.nombre;
            document.querySelector('#marca').value = producto.marca;
            document.querySelector('#categoria').value = producto.categoria;
            mostrarSubcategoria(producto.categoria);
            const subcategoriaSelect = document.querySelector(`#select-subcategoria-${producto.categoria}`);
            if (subcategoriaSelect) {
              subcategoriaSelect.value = producto.subcategoria || '';
            }
            document.querySelector('#precio-lista').value = producto.precioLista || '';
            document.querySelector('#porcentaje-ganancia').value = producto.porcentajeGanancia || '';
            document.querySelector('#precio-final').value = producto.precioFinal || '';
            document.querySelector('#unidad').value = producto.unidad || 'unidad';
            document.querySelector('#packs').value = producto.packs || 0;
            document.querySelector('#unidadesPorPack').value = producto.unidadesPorPack || 0;
            document.querySelector('#docenas').value = producto.docenas || 0;
            document.querySelector('#unidadesSueltas').value = producto.unidadesSueltas || 0;
            document.querySelector('#cantidad-total').value = producto.cantidadUnidades || 0;
            document.querySelector('#fecha-vencimiento').value = producto.fechaVencimiento ? new Date(producto.fechaVencimiento).toISOString().split('T')[0] : '';
            document.querySelector('#icono-producto').value = producto.icono || 'default';
          }
        })
        .catch(err => {
          console.error('Error al verificar el producto:', err);
          mostrarToast('Error al verificar el producto.', 'error');
        });
    } else {
      console.log('No se encontró producto para el código escaneado');
      mostrarToast('Producto no encontrado. Ingresa los datos manualmente.', 'info');
    }
  };

  // Iniciar escaneo al hacer clic en el botón
  btnEscanear.addEventListener('click', () => {
    console.log('Evento click en btnEscanear disparado');
    mostrarToast('Iniciando escaneo...', 'info');
    try {
      iniciarEscaneoContinuo(
        camaraCarga,
        btnEscanear,
        btnDetenerEscaneo,
        inputCodigo,
        completarCallback,
        null
      );
    } catch (error) {
      console.error('Error al iniciar el escaneo:', error);
      mostrarToast('Error al iniciar el escaneo: ' + error.message, 'error');
    }
  });
});