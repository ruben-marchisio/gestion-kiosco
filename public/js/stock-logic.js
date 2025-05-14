document.addEventListener('DOMContentLoaded', () => {
  console.log('stock-logic.js cargado');

  /* Selección de elementos del DOM */
  const buscador = document.querySelector('#buscador');
  const btnEscanear = document.querySelector('#escanear');
  const btnEscanearAhora = document.querySelector('#escanear-ahora');
  const btnCerrarCamara = document.querySelector('#cerrar-camara');
  const camaraStock = document.querySelector('#camara-stock');
  const btnFiltros = document.querySelector('#boton-filtros');
  const menuFiltros = document.querySelector('#menu-filtros');
  const btnFiltroTodo = document.querySelector('#filtro-todo');
  const filtroCategoria = document.querySelector('#filtro-categoria');
  const filtroSubcategoria = document.querySelector('#filtro-subcategoria');
  const filtroSinStock = document.querySelector('#filtro-sin-stock');
  const filtroPorVencer = document.querySelector('#filtro-por-vencer');
  const filtroSinCodigo = document.querySelector('#filtro-sin-codigo');
  const listaStock = document.querySelector('#lista-stock');
  const modalProducto = document.querySelector('#=Mmodal-producto');
  const modalTitulo = document.querySelector('#modal-titulo');
  const modalDetalles = document.querySelector('#modal-detalles');
  const btnModalEditarPrecios = document.querySelector('#modal-editar-precios');
  const btnModalAgregarStock = document.querySelector('#modal-agregar-stock');
  const btnModalDarBaja = document.querySelector('#modal-dar-baja');
  const btnModalEliminarProducto = document.querySelector('#modal-eliminar-producto');
  const btnModalCerrar = document.querySelector('#modal-cerrar');
  const modalEditarPrecios = document.querySelector('#modal-editar-precios');
  const inputEditPrecioLista = document.querySelector('#edit-precio-lista');
  const inputEditPorcentajeGanancia = document.querySelector('#edit-porcentaje-ganancia');
  const inputEditPrecioFinal = document.querySelector('#edit-precio-final');
  const inputEditNotificationDays = document.querySelector('#edit-notification-days');
  const btnEditGuardarPrecios = document.querySelector('#edit-guardar-precios');
  const btnEditCancelarPrecios = document.querySelector('#edit-cancelar-precios');
  const modalAgregarStock = document.querySelector('#modal-agregar-stock');
  const inputAgregarLotId = document.querySelector('#agregar-lot-id');
  const inputAgregarCantidad = document.querySelector('#agregar-cantidad');
  const inputAgregarFechaVencimiento = document.querySelector('#agregar-fecha-vencimiento');
  const btnAgregarGuardarStock = document.querySelector('#agregar-guardar-stock');
  const btnAgregarCancelarStock = document.querySelector('#agregar-cancelar-stock');
  const modalDarBaja = document.querySelector('#modal-dar-baja');
  const inputBajaLotId = document.querySelector('#baja-lot-id');
  const inputBajaCantidad = document.querySelector('#baja-cantidad');
  const selectBajaMotivo = document.querySelector('#baja-motivo');
  const textareaBajaNota = document.querySelector('#baja-nota');
  const btnBajaConfirmar = document.querySelector('#baja-confirmar');
  const btnBajaCancelar = document.querySelector('#baja-cancelar');
  const modalEliminarProducto = document.querySelector('#modal-eliminar-producto');
  const btnEliminarConfirmar = document.querySelector('#eliminar-confirmar');
  const btnEliminarCancelar = document.querySelector('#eliminar-cancelar');

  /* Construcción de la URL base */
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

  /* Estado para manejar productos */
  let productos = [];
  let productoSeleccionado = null;

  /* Subcategorías por categoría */
  const subcategorias = {
    bebidas: ["Agua", "Gaseosa", "Jugo", "Energizante", "Alcohol"],
    golosinas: ["Chocolates", "Caramelos", "Chicles", "Galletitas"],
    lacteos: ["Leche", "Yogur", "Queso", "Manteca"],
    cigarrillos: [],
    fiambre: ["Queso", "Jamón", "Salame"],
    congelados: ["Helados", "Hamburguesas", "Pizzas"],
    panaderia: ["Pan", "Facturas", "Tortas"],
    almacen: ["Harinas", "Aceites vinagres", "Aderezos condimentos", "Fideos arroz", "Enlatados conservas", "Infusiones"],
    verduleria: ["Frutas", "Verduras"],
    limpieza: ["Detergente", "Lavandina", "Esponjas"],
    "higiene-personal": ["Jabón", "Shampoo", "Pasta Dental"],
    "sin-tacc": [],
    "productos-varios": []
  };

  /* Obtener código inicial de la URL */
  const urlParams = new URLSearchParams(window.location.search);
  const codigoInicial = urlParams.get('codigo');
  console.log('Código inicial desde la URL:', codigoInicial);
  if (codigoInicial) {
    buscador.value = '';
    console.log('Campo de búsqueda limpiado debido a código inicial');
  }

  /* Cargar productos del usuario */
  async function cargarProductos() {
    try {
      const usuarioId = localStorage.getItem('usuarioId');
      if (!usuarioId) {
        console.error('No se encontró usuarioId en localStorage');
        mostrarToast('Por favor, inicia sesión nuevamente.', 'error');
        return;
      }
      console.log('Solicitando productos para usuarioId:', usuarioId);
      const response = await fetch(`${BASE_URL}/api/productos?usuarioId=${usuarioId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      productos = await response.json();
      console.log('Productos obtenidos:', productos);
      filtrarYRenderizarProductos();
    } catch (error) {
      console.error('Error al cargar los productos:', error);
      mostrarToast('Error al cargar los productos: ' + error.message, 'error');
    }
  }

  /* Filtrar y renderizar productos */
  function filtrarYRenderizarProductos() {
    let productosFiltrados = [...productos];
    let productoPorCodigo = null;

    // Handle codigoInicial
    if (codigoInicial) {
      productoPorCodigo = productos.find(producto => producto.codigo === codigoInicial);
      if (productoPorCodigo) {
        // Clear all filters to ensure the product is shown
        filtroCategoria.value = '';
        filtroSubcategoria.innerHTML = '<option value="">Todas</option>';
        filtroSinStock.checked = false;
        filtroPorVencer.checked = false;
        filtroSinCodigo.checked = false;
        buscador.value = '';
        productosFiltrados = [productoPorCodigo];
        console.log('Producto encontrado por código:', productoPorCodigo);
        mostrarToast(`Producto encontrado: ${productoPorCodigo.nombre}`, 'success');
      } else {
        console.log('Producto no encontrado para código:', codigoInicial);
        mostrarToast('Producto no encontrado en tu stock.', 'info');
        productosFiltrados = [...productos];
      }
    }

    // Apply other filters only if no codigoInicial or product not found
    if (!productoPorCodigo) {
      const terminoBusqueda = buscador.value.toLowerCase();
      if (terminoBusqueda) {
        productosFiltrados = productosFiltrados.filter(producto =>
          producto.nombre.toLowerCase().includes(terminoBusqueda) ||
          producto.marca.toLowerCase().includes(terminoBusqueda) ||
          (producto.codigo && producto.codigo.toLowerCase().includes(terminoBusqueda))
        );
      }
      const categoria = filtroCategoria.value;
      if (categoria) {
        productosFiltrados = productosFiltrados.filter(producto => producto.categoria === categoria);
      }
      const subcategoria = filtroSubcategoria.value;
      if (subcategoria) {
        productosFiltrados = productosFiltrados.filter(producto => producto.subcategoria === subcategoria);
      }
      if (filtroSinStock.checked) {
        productosFiltrados = productosFiltrados.filter(producto => producto.totalQuantity === 0);
      }
      if (filtroPorVencer.checked) {
        const hoy = new Date();
        const treintaDiasDesdeHoy = new Date(hoy);
        treintaDiasDesdeHoy.setDate(hoy.getDate() + 30);
        productosFiltrados = productosFiltrados.filter(producto =>
          producto.batches.some(batch => {
            const fechaVencimiento = new Date(batch.expirationDate);
            return fechaVencimiento >= hoy && fechaVencimiento <= treintaDiasDesdeHoy;
          })
        );
      }
      if (filtroSinCodigo.checked) {
        productosFiltrados = productosFiltrados.filter(producto => !producto.codigo || producto.codigo === '');
      }
    }

    console.log('Productos filtrados:', productosFiltrados);
    renderizarProductos(productosFiltrados, productoPorCodigo ? productoPorCodigo._id : null);
  }

  /* Renderizar productos */
  function renderizarProductos(productosFiltrados, highlightId) {
    listaStock.innerHTML = '';
    console.log('Renderizando productos:', productosFiltrados);
    if (productosFiltrados.length === 0) {
      listaStock.innerHTML = '<p>No se encontraron productos.</p>';
      return;
    }
    productosFiltrados.forEach(producto => {
      const tarjeta = document.createElement('div');
      tarjeta.className = `tarjeta-producto ${producto.totalQuantity === 0 ? 'sin-stock' : ''} ${producto._id === highlightId ? 'highlight' : ''}`;
      tarjeta.dataset.id = producto._id;
      tarjeta.innerHTML = `
        <div class="tarjeta-icono">
          <i class="fas fa-${producto.icono || 'box'}"></i>
        </div>
        <div class="tarjeta-info">
          <div class="tarjeta-nombre">${producto.nombre}</div>
          <div class="tarjeta-marca">${producto.marca}</div>
          <div class="tarjeta-cantidad ${producto.totalQuantity === 0 ? 'sin-stock' : producto.totalQuantity <= 5 ? 'stock-bajo' : ''}">
            Cantidad: ${producto.totalQuantity} ${producto.unidad}${producto.totalQuantity !== 1 ? 's' : ''}
          </div>
          <div class="tarjeta-precio">Precio: $${producto.precioFinal.toFixed(2)}</div>
        </div>
      `;
      listaStock.appendChild(tarjeta);
    });
    document.querySelectorAll('.tarjeta-producto').forEach(tarjeta => {
      tarjeta.addEventListener('click', () => {
        const id = tarjeta.dataset.id;
        abrirModalProducto(id);
      });
    });
    if (highlightId) {
      const highlightedCard = document.querySelector(`.tarjeta-producto[data-id="${highlightId}"]`);
      if (highlightedCard) {
        highlightedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  /* Cargar productos al iniciar */
  cargarProductos();

  /* Actualizar subcategorías */
  filtroCategoria.addEventListener('change', () => {
    const categoria = filtroCategoria.value;
    filtroSubcategoria.innerHTML = '<option value="">Todas</option>';
    if (categoria && subcategorias[categoria]) {
      subcategorias[categoria].forEach(subcat => {
        const option = document.createElement('option');
        option.value = subcat;
        option.textContent = subcat;
        filtroSubcategoria.appendChild(option);
      });
    }
    filtrarYRenderizarProductos();
  });

  /* Eventos de filtrado */
  buscador.addEventListener('input', filtrarYRenderizarProductos);
  filtroSubcategoria.addEventListener('change', filtrarYRenderizarProductos);
  filtroSinStock.addEventListener('change', filtrarYRenderizarProductos);
  filtroPorVencer.addEventListener('change', filtrarYRenderizarProductos);
  filtroSinCodigo.addEventListener('change', filtrarYRenderizarProductos);

  /* Mostrar/Ocultar menú de filtros */
  btnFiltros.addEventListener('click', () => {
    menuFiltros.style.display = menuFiltros.style.display === 'block' ? 'none' : 'block';
  });

  /* Resetear filtros */
  btnFiltroTodo.addEventListener('click', () => {
    filtroCategoria.value = '';
    filtroSubcategoria.innerHTML = '<option value="">Todas</option>';
    filtroSinStock.checked = false;
    filtroPorVencer.checked = false;
    filtroSinCodigo.checked = false;
    buscador.value = '';
    filtrarYRenderizarProductos();
  });

  /* Manejo del escaneo continuo */
  btnEscanear.addEventListener('click', () => {
    const completarCallback = (producto) => {
      if (producto) {
        console.log('Producto encontrado durante escaneo:', producto);
        buscador.value = producto.codigo;
        filtrarYRenderizarProductos();
      } else {
        mostrarToast('Producto no encontrado. Ingresa manualmente.', 'info');
      }
    };
    iniciarEscaneoContinuo(
      camaraStock,
      btnEscanear,
      btnEscanearAhora,
      btnCerrarCamara,
      null,
      completarCallback
    );
  });

  /* Abrir modal de detalles */
  function abrirModalProducto(id) {
    productoSeleccionado = productos.find(p => p._id === id);
    if (!productoSeleccionado) {
      mostrarToast('Producto no encontrado.', 'error');
      return;
    }
    console.log('Abriendo modal para producto:', productoSeleccionado);
    modalTitulo.textContent = productoSeleccionado.nombre;
    modalDetalles.innerHTML = `
      <div class="detalle-item"><span>Marca:</span> ${productoSeleccionado.marca}</div>
      <div class="detalle-item"><span>Categoría:</span> ${productoSeleccionado.categoria}${productoSeleccionado.subcategoria ? ` (${productoSeleccionado.subcategoria})` : ''}</div>
      <div class="detalle-item"><span>Cantidad Total:</span> ${productoSeleccionado.totalQuantity} ${productoSeleccionado.unidad}${productoSeleccionado.totalQuantity !== 1 ? 's' : ''}</div>
      <div class="detalle-item"><span>Lotes:</span>
        <table class="batch-table">
          <thead>
            <tr>
              <th>Lote</th>
              <th>Cantidad</th>
              <th>Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            ${productoSeleccionado.batches.map(batch => `
              <tr>
                <td>${batch.lotId}</td>
                <td>${batch.quantity}</td>
                <td>${new Date(batch.expirationDate).toLocaleDateString()}</td>
              </tr>
            `).join('') || '<tr><td colspan="3">Sin lotes</td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="detalle-item"><span>Precio de Lista:</span> $${productoSeleccionado.precioLista.toFixed(2)}</div>
      <div class="detalle-item"><span>Porcentaje de Ganancia:</span> ${productoSeleccionado.porcentajeGanancia}%</div>
      <div class="detalle-item"><span>Precio Final:</span> $${productoSeleccionado.precioFinal.toFixed(2)}</div>
      ${productoSeleccionado.codigo ? `<div class="detalle-item"><span>Código:</span> ${productoSeleccionado.codigo}</div>` : ''}
      <div class="detalle-item"><span>Notificar Vencimiento:</span> ${productoSeleccionado.notificationDays} días antes</div>
    `;
    modalProducto.style.display = 'flex';
  }

  /* Cerrar modal de detalles */
  btnModalCerrar.addEventListener('click', () => {
    modalProducto.style.display = 'none';
    productoSeleccionado = null;
  });

  /* Abrir modal para editar precios */
  btnModalEditarPrecios.addEventListener('click', () => {
    if (!productoSeleccionado) return;
    inputEditPrecioLista.value = productoSeleccionado.precioLista;
    inputEditPorcentajeGanancia.value = productoSeleccionado.porcentajeGanancia;
    inputEditPrecioFinal.value = productoSeleccionado.precioFinal;
    inputEditNotificationDays.value = productoSeleccionado.notificationDays;
    modalProducto.style.display = 'none';
    modalEditarPrecios.style.display = 'flex';
  });

  /* Calcular precio final al editar */
  inputEditPorcentajeGanancia.addEventListener('input', () => {
    const precioLista = parseFloat(inputEditPrecioLista.value);
    const porcentajeGanancia = parseFloat(inputEditPorcentajeGanancia.value);
    if (precioLista && porcentajeGanancia) {
      const precioFinal = precioLista * (1 + porcentajeGanancia / 100);
      inputEditPrecioFinal.value = precioFinal.toFixed(2);
    }
  });

  /* Guardar cambios en precios y notificaciones */
  btnEditGuardarPrecios.addEventListener('click', async () => {
    if (!productoSeleccionado) return;
    const precioLista = parseFloat(inputEditPrecioLista.value);
    const porcentajeGanancia = parseFloat(inputEditPorcentajeGanancia.value);
    const precioFinal = parseFloat(inputEditPrecioFinal.value);
    const notificationDays = parseInt(inputEditNotificationDays.value);
    try {
      const response = await fetch(`${BASE_URL}/api/productos/${productoSeleccionado._id}/precios`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ precioLista, porcentajeGanancia, precioFinal, notificationDays })
      });
      if (!response.ok) throw new Error('Error al actualizar los precios');
      const result = await response.json();
      mostrarToast(result.mensaje, 'success');
      modalEditarPrecios.style.display = 'none';
      await cargarProductos();
    } catch (error) {
      console.error('Error al actualizar los precios:', error);
      mostrarToast('Error al actualizar los precios: ' + error.message, 'error');
    }
  });

  /* Cancelar edición de precios */
  btnEditCancelarPrecios.addEventListener('click', () => {
    modalEditarPrecios.style.display = 'none';
    modalProducto.style.display = 'flex';
  });

  /* Abrir modal para agregar stock */
  btnModalAgregarStock.addEventListener('click', () => {
    if (!productoSeleccionado) return;
    inputAgregarLotId.value = '';
    inputAgregarCantidad.value = '';
    inputAgregarFechaVencimiento.value = '';
    modalProducto.style.display = 'none';
    modalAgregarStock.style.display = 'flex';
  });

  /* Guardar nuevo stock */
  btnAgregarGuardarStock.addEventListener('click', async () => {
    if (!productoSeleccionado) return;
    const lotId = inputAgregarLotId.value.trim();
    const cantidad = parseInt(inputAgregarCantidad.value);
    const fechaVencimiento = inputAgregarFechaVencimiento.value;
    if (!lotId || cantidad <= 0 || !fechaVencimiento) {
      mostrarToast('Completa todos los campos correctamente.', 'error');
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}/api/productos/${productoSeleccionado._id}/add-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lotId, quantity: cantidad, expirationDate: fechaVencimiento })
      });
      if (!response.ok) throw new Error('Error al agregar stock');
      const result = await response.json();
      mostrarToast(result.mensaje, 'success');
      modalAgregarStock.style.display = 'none';
      await cargarProductos();
    } catch (error) {
      console.error('Error al agregar stock:', error);
      mostrarToast('Error al agregar stock: ' + error.message, 'error');
    }
  });

  /* Cancelar agregar stock */
  btnAgregarCancelarStock.addEventListener('click', () => {
    modalAgregarStock.style.display = 'none';
    modalProducto.style.display = 'flex';
  });

  /* Abrir modal para dar de baja */
  btnModalDarBaja.addEventListener('click', () => {
    if (!productoSeleccionado) return;
    inputBajaLotId.innerHTML = '<option value="">Selecciona un lote</option>';
    productoSeleccionado.batches.forEach(batch => {
      if (batch.isActive && batch.quantity > 0) {
        const option = document.createElement('option');
        option.value = batch.lotId;
        option.textContent = `${batch.lotId} (Expira ${new Date(batch.expirationDate).toLocaleDateString()})`;
        inputBajaLotId.appendChild(option);
      }
    });
    inputBajaCantidad.value = '';
    selectBajaMotivo.value = 'vencimiento';
    textareaBajaNota.value = '';
    modalProducto.style.display = 'none';
    modalDarBaja.style.display = 'flex';
  });

  /* Confirmar baja de producto */
  btnBajaConfirmar.addEventListener('click', async () => {
    if (!productoSeleccionado) return;
    const lotId = inputBajaLotId.value;
    const cantidad = parseInt(inputBajaCantidad.value);
    const motivo = selectBajaMotivo.value;
    const nota = textareaBajaNota.value;
    const usuarioId = localStorage.getItem('usuarioId');
    if (!lotId || cantidad <= 0) {
      mostrarToast('Selecciona un lote y cantidad válida.', 'error');
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}/api/productos/${productoSeleccionado._id}/remove-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId, lotId, quantity: cantidad, motivo, nota })
      });
      if (!response.ok) throw new Error('Error al dar de baja el producto');
      const result = await response.json();
      mostrarToast(result.mensaje, 'success');
      modalDarBaja.style.display = 'none';
      await cargarProductos();
    } catch (error) {
      console.error('Error al dar de baja el producto:', error);
      mostrarToast('Error al dar de baja el producto: ' + error.message, 'error');
    }
  });

  /* Cancelar baja de producto */
  btnBajaCancelar.addEventListener('click', () => {
    modalDarBaja.style.display = 'none';
    modalProducto.style.display = 'flex';
  });

  /* Abrir modal para eliminar producto */
  btnModalEliminarProducto.addEventListener('click', () => {
    if (!productoSeleccionado) return;
    modalProducto.style.display = 'none';
    modalEliminarProducto.style.display = 'flex';
  });

  /* Confirmar eliminación de producto */
  btnEliminarConfirmar.addEventListener('click', async () => {
    if (!productoSeleccionado) return;
    try {
      const response = await fetch(`${BASE_URL}/api/productos/${productoSeleccionado._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Error al eliminar el producto');
      const result = await response.json();
      mostrarToast(result.mensaje, 'success');
      modalEliminarProducto.style.display = 'none';
      await cargarProductos();
    } catch (error) {
      console.error('Error al eliminar el producto:', error);
      mostrarToast('Error al eliminar el producto: ' + error.message, 'error');
    }
  });

  /* Cancelar eliminación de producto */
  btnEliminarCancelar.addEventListener('click', () => {
    modalEliminarProducto.style.display = 'none';
    modalProducto.style.display = 'flex';
  });
});