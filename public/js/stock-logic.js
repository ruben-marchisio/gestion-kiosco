document.addEventListener('DOMContentLoaded', () => {
  console.log('stock-logic.js cargado');

  // Elementos del DOM
  const contenedorCamara = document.querySelector('#contenedor-camara');
  const btnEscanear = document.querySelector('#escanear');
  const btnDetener = document.querySelector('#detener');
  const inputBuscador = document.querySelector('#buscador');
  const selectCategoria = document.querySelector('#filtro-categoria');
  const selectSubcategoria = document.querySelector('#filtro-subcategoria');
  const checkboxSinStock = document.querySelector('#filtro-sin-stock');
  const checkboxPorVencer = document.querySelector('#filtro-por-vencer');
  const btnMostrarTodo = document.querySelector('#mostrar-todo');
  const listaProductos = document.querySelector('#lista-productos');
  const modalDetalles = document.querySelector('#modal-detalles');
  const modalContenido = document.querySelector('#modal-contenido');
  const modalEditarPrecios = document.querySelector('#modal-editar-precios');
  const formEditarPrecios = document.querySelector('#form-editar-precios');
  const modalAgregarStock = document.querySelector('#modal-agregar-stock');
  const formAgregarStock = document.querySelector('#form-agregar-stock');
  const modalDarBaja = document.querySelector('#modal-dar-baja');
  const formDarBaja = document.querySelector('#form-dar-baja');

  let productos = [];
  let productosFiltrados = [];
  let productoSeleccionado = null;

  // Construcción de la URL base
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

  // Obtener parámetros de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const codigoInicial = urlParams.get('codigo');

  // Cargar productos al iniciar
  async function cargarProductos() {
    try {
      const usuarioId = localStorage.getItem('usuarioId');
      const response = await fetch(`${BASE_URL}/api/productos?usuarioId=${usuarioId}`);
      productos = await response.json();
      productosFiltrados = [...productos];
      if (codigoInicial) {
        productosFiltrados = productos.filter(producto => producto.codigo === codigoInicial);
        if (productosFiltrados.length === 0) {
          mostrarToast('Producto no encontrado con ese código de barras.', 'info');
        }
      }
      actualizarListaProductos();
      actualizarFiltros();
    } catch (error) {
      console.error('Error al cargar productos:', error);
      mostrarToast('Error al cargar productos: ' + error.message, 'error');
    }
  }

  // Actualizar la lista de productos
  function actualizarListaProductos() {
    listaProductos.innerHTML = '';
    productosFiltrados.forEach(producto => {
      const tarjeta = document.createElement('div');
      tarjeta.className = 'tarjeta-producto';
      if (producto.cantidadUnidades === 0) {
        tarjeta.classList.add('sin-stock');
      }
      tarjeta.innerHTML = `
        <div class="icono-producto">
          <i class="${producto.icono !== 'default' ? `fas fa-${producto.icono}` : ''}"></i>
        </div>
        <h3>${producto.nombre}</h3>
        <p>Marca: ${producto.marca}</p>
        <p>Cantidad: ${producto.cantidadUnidades}</p>
        <p>Precio Final: $${producto.precioFinal.toFixed(2)}</p>
      `;
      tarjeta.addEventListener('click', () => mostrarDetallesProducto(producto));
      listaProductos.appendChild(tarjeta);
    });
  }

  // Actualizar los filtros de categoría y subcategoría
  function actualizarFiltros() {
    const categorias = [...new Set(productos.map(p => p.categoria))];
    selectCategoria.innerHTML = '<option value="">Todas las categorías</option>';
    categorias.forEach(categoria => {
      const option = document.createElement('option');
      option.value = categoria;
      option.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
      selectCategoria.appendChild(option);
    });

    selectCategoria.addEventListener('change', () => {
      const categoriaSeleccionada = selectCategoria.value;
      selectSubcategoria.innerHTML = '<option value="">Todas las subcategorías</option>';
      if (categoriaSeleccionada) {
        const subcategorias = [...new Set(productos.filter(p => p.categoria === categoriaSeleccionada).map(p => p.subcategoria).filter(s => s))];
        subcategorias.forEach(subcategoria => {
          const option = document.createElement('option');
          option.value = subcategoria;
          option.textContent = subcategoria;
          selectSubcategoria.appendChild(option);
        });
      }
      filtrarProductos();
    });

    selectSubcategoria.addEventListener('change', filtrarProductos);
    inputBuscador.addEventListener('input', filtrarProductos);
    checkboxSinStock.addEventListener('change', filtrarProductos);
    checkboxPorVencer.addEventListener('change', filtrarProductos);

    btnMostrarTodo.addEventListener('click', () => {
      inputBuscador.value = '';
      selectCategoria.value = '';
      selectSubcategoria.innerHTML = '<option value="">Todas las subcategorías</option>';
      checkboxSinStock.checked = false;
      checkboxPorVencer.checked = false;
      productosFiltrados = [...productos];
      actualizarListaProductos();
    });
  }

  // Filtrar productos según los criterios
  function filtrarProductos() {
    productosFiltrados = [...productos];

    // Filtro por buscador
    const terminoBusqueda = inputBuscador.value.toLowerCase();
    if (terminoBusqueda) {
      productosFiltrados = productosFiltrados.filter(producto =>
        producto.nombre.toLowerCase().includes(terminoBusqueda) ||
        producto.marca.toLowerCase().includes(terminoBusqueda)
      );
    }

    // Filtro por categoría
    const categoriaSeleccionada = selectCategoria.value;
    if (categoriaSeleccionada) {
      productosFiltrados = productosFiltrados.filter(producto => producto.categoria === categoriaSeleccionada);
    }

    // Filtro por subcategoría
    const subcategoriaSeleccionada = selectSubcategoria.value;
    if (subcategoriaSeleccionada) {
      productosFiltrados = productosFiltrados.filter(producto => producto.subcategoria === subcategoriaSeleccionada);
    }

    // Filtro por sin stock
    if (checkboxSinStock.checked) {
      productosFiltrados = productosFiltrados.filter(producto => producto.cantidadUnidades === 0);
    }

    // Filtro por productos por vencer
    if (checkboxPorVencer.checked) {
      const hoy = new Date();
      const limiteVencimiento = new Date();
      limiteVencimiento.setDate(hoy.getDate() + 7);
      productosFiltrados = productosFiltrados.filter(producto => {
        const fechaVencimiento = new Date(producto.fechaVencimiento);
        return fechaVencimiento >= hoy && fechaVencimiento <= limiteVencimiento;
      });
    }

    actualizarListaProductos();
  }

  // Mostrar detalles de un producto en un modal
  function mostrarDetallesProducto(producto) {
    productoSeleccionado = producto;
    modalContenido.innerHTML = `
      <h3>${producto.nombre}</h3>
      <p><strong>Marca:</strong> ${producto.marca}</p>
      <p><strong>Categoría:</strong> ${producto.categoria}${producto.subcategoria ? ` (${producto.subcategoria})` : ''}</p>
      <p><strong>Cantidad Total:</strong> ${producto.cantidadUnidades}</p>
      <p><strong>Unidad:</strong> ${producto.unidad}</p>
      <p><strong>Packs:</strong> ${producto.packs}</p>
      <p><strong>Unidades por Pack:</strong> ${producto.unidadesPorPack}</p>
      <p><strong>Docenas:</strong> ${producto.docenas}</p>
      <p><strong>Unidades Sueltas:</strong> ${producto.unidadesSueltas}</p>
      <p><strong>Precio de Lista:</strong> $${producto.precioLista.toFixed(2)}</p>
      <p><strong>Porcentaje de Ganancia:</strong> ${producto.porcentajeGanancia}%</p>
      <p><strong>Precio Final:</strong> $${producto.precioFinal.toFixed(2)}</p>
      <p><strong>Fecha de Vencimiento:</strong> ${new Date(producto.fechaVencimiento).toLocaleDateString()}</p>
      <p><strong>Código:</strong> ${producto.codigo || 'Sin código'}</p>
      <p><strong>Ícono:</strong> <i class="${producto.icono !== 'default' ? `fas fa-${producto.icono}` : ''}"></i></p>
      <div class="acciones-modal">
        <button id="editar-precios" class="boton-accion boton-primario"><i class="fas fa-edit"></i> Editar Precios</button>
        <button id="agregar-stock" class="boton-accion boton-primario"><i class="fas fa-plus"></i> Agregar Stock</button>
        <button id="dar-baja" class="boton-accion boton-secundario"><i class="fas fa-minus-circle"></i> Dar de Baja</button>
      </div>
    `;
    modalDetalles.style.display = 'flex';

    document.querySelector('#editar-precios').addEventListener('click', () => {
      modalDetalles.style.display = 'none';
      modalEditarPrecios.style.display = 'flex';
      document.querySelector('#editar-precio-lista').value = producto.precioLista;
      document.querySelector('#editar-porcentaje-ganancia').value = producto.porcentajeGanancia;
      document.querySelector('#editar-precio-final').value = producto.precioFinal;
    });

    document.querySelector('#agregar-stock').addEventListener('click', () => {
      modalDetalles.style.display = 'none';
      modalAgregarStock.style.display = 'flex';
      document.querySelector('#agregar-cantidad').value = 0;
      document.querySelector('#agregar-fecha-vencimiento').value = producto.fechaVencimiento ? new Date(producto.fechaVencimiento).toISOString().split('T')[0] : '';
    });

    document.querySelector('#dar-baja').addEventListener('click', () => {
      modalDetalles.style.display = 'none';
      modalDarBaja.style.display = 'flex';
      document.querySelector('#dar-baja-cantidad').value = 0;
    });
  }

  // Cerrar modales
  document.querySelectorAll('.modal .cerrar').forEach(cerrar => {
    cerrar.addEventListener('click', () => {
      cerrar.parentElement.parentElement.style.display = 'none';
    });
  });

  // Manejar el formulario de editar precios
  formEditarPrecios.addEventListener('submit', async (e) => {
    e.preventDefault();
    const precioLista = parseFloat(document.querySelector('#editar-precio-lista').value);
    const porcentajeGanancia = parseFloat(document.querySelector('#editar-porcentaje-ganancia').value);
    const precioFinal = parseFloat(document.querySelector('#editar-precio-final').value);

    try {
      const response = await fetch(`${BASE_URL}/api/productos/${productoSeleccionado._id}/precios`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ precioLista, porcentajeGanancia, precioFinal })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al actualizar los precios');

      mostrarToast('Precios actualizados con éxito.', 'success');
      productoSeleccionado.precioLista = precioLista;
      productoSeleccionado.porcentajeGanancia = porcentajeGanancia;
      productoSeleccionado.precioFinal = precioFinal;
      const index = productos.findIndex(p => p._id === productoSeleccionado._id);
      productos[index] = { ...productoSeleccionado };
      productosFiltrados = [...productos];
      actualizarListaProductos();
      modalEditarPrecios.style.display = 'none';
    } catch (error) {
      console.error('Error al actualizar precios:', error);
      mostrarToast('Error al actualizar precios: ' + error.message, 'error');
    }
  });

  // Actualizar precio final en el formulario de editar precios
  document.querySelector('#editar-precio-lista').addEventListener('input', actualizarPrecioFinalEditar);
  document.querySelector('#editar-porcentaje-ganancia').addEventListener('input', actualizarPrecioFinalEditar);

  function actualizarPrecioFinalEditar() {
    const precioLista = parseFloat(document.querySelector('#editar-precio-lista').value) || 0;
    const porcentajeGanancia = parseFloat(document.querySelector('#editar-porcentaje-ganancia').value) || 0;
    const precioFinal = precioLista * (1 + porcentajeGanancia / 100);
    document.querySelector('#editar-precio-final').value = precioFinal.toFixed(2);
  }

  // Manejar el formulario de agregar stock
  formAgregarStock.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cantidad = parseInt(document.querySelector('#agregar-cantidad').value);
    const fechaVencimiento = document.querySelector('#agregar-fecha-vencimiento').value;

    try {
      const response = await fetch(`${BASE_URL}/api/productos/${productoSeleccionado._id}/agregar-stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cantidad, fechaVencimiento })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al agregar stock');

      mostrarToast('Stock agregado con éxito.', 'success');
      productoSeleccionado.cantidadUnidades += cantidad;
      productoSeleccionado.fechaVencimiento = fechaVencimiento;
      const index = productos.findIndex(p => p._id === productoSeleccionado._id);
      productos[index] = { ...productoSeleccionado };
      productosFiltrados = [...productos];
      actualizarListaProductos();
      modalAgregarStock.style.display = 'none';
    } catch (error) {
      console.error('Error al agregar stock:', error);
      mostrarToast('Error al agregar stock: ' + error.message, 'error');
    }
  });

  // Manejar el formulario de dar de baja
  formDarBaja.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cantidad = parseInt(document.querySelector('#dar-baja-cantidad').value);
    const motivo = document.querySelector('#motivo-baja').value;
    const nota = document.querySelector('#nota-baja').value;

    try {
      const usuarioId = localStorage.getItem('usuarioId');
      const response = await fetch(`${BASE_URL}/api/productos/${productoSeleccionado._id}/dar-baja`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuarioId, cantidad, motivo, nota })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al dar de baja el producto');

      mostrarToast(result.mensaje || 'Producto dado de baja con éxito.', 'success');
      if (motivo === 'eliminacion-permanente' && productoSeleccionado.cantidadUnidades === cantidad) {
        productos = productos.filter(p => p._id !== productoSeleccionado._id);
      } else {
        productoSeleccionado.cantidadUnidades -= cantidad;
        const index = productos.findIndex(p => p._id === productoSeleccionado._id);
        productos[index] = { ...productoSeleccionado };
      }
      productosFiltrados = [...productos];
      actualizarListaProductos();
      modalDarBaja.style.display = 'none';
    } catch (error) {
      console.error('Error al dar de baja el producto:', error);
      mostrarToast('Error al dar de baja el producto: ' + error.message, 'error');
    }
  });

  // Manejar el escaneo continuo de códigos de barras
  btnEscanear.addEventListener('click', () => {
    iniciarEscaneoContinuo(
      contenedorCamara,
      btnEscanear,
      btnDetener,
      null,
      null,
      (code) => {
        productosFiltrados = productos.filter(producto => producto.codigo === code);
        if (productosFiltrados.length === 0) {
          mostrarToast('Producto no encontrado con ese código de barras.', 'info');
        }
        actualizarListaProductos();
      }
    );
  });

  // Cargar productos al iniciar
  cargarProductos();
});