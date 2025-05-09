document.addEventListener('DOMContentLoaded', () => {
  console.log('stock-logic.js cargado');
  /* Propósito: Inicializa el script cuando stock.html está cargado */
  /* Imprime un mensaje en la consola para confirmar la carga del script */

  /* Selección de elementos del DOM */
  const buscador = document.querySelector('#buscador');
  const btnEscanear = document.querySelector('#escanear');
  const btnDetenerEscaneo = document.querySelector('#detener-escaneo');
  const camaraStock = document.querySelector('#camara-stock');
  const btnFiltros = document.querySelector('#boton-filtros');
  const menuFiltros = document.querySelector('#menu-filtros');
  const btnFiltroTodo = document.querySelector('#filtro-todo');
  const filtroCategoria = document.querySelector('#filtro-categoria');
  const filtroSubcategoria = document.querySelector('#filtro-subcategoria');
  const filtroSinStock = document.querySelector('#filtro-sin-stock');
  const filtroPorVencer = document.querySelector('#filtro-por-vencer');
  const listaStock = document.querySelector('#lista-stock');
  const modalProducto = document.querySelector('#modal-producto');
  const modalTitulo = document.querySelector('#modal-titulo');
  const modalDetalles = document.querySelector('#modal-detalles');
  const btnModalEditarPrecios = document.querySelector('#modal-editar-precios');
  const btnModalAgregarStock = document.querySelector('#modal-agregar-stock');
  const btnModalDarBaja = document.querySelector('#modal-dar-baja');
  const btnModalCerrar = document.querySelector('#modal-cerrar');
  const modalEditarPrecios = document.querySelector('#modal-editar-precios');
  const inputEditPrecioLista = document.querySelector('#edit-precio-lista');
  const inputEditPorcentajeGanancia = document.querySelector('#edit-porcentaje-ganancia');
  const inputEditPrecioFinal = document.querySelector('#edit-precio-final');
  const btnEditGuardarPrecios = document.querySelector('#edit-guardar-precios');
  const btnEditCancelarPrecios = document.querySelector('#edit-cancelar-precios');
  const modalAgregarStock = document.querySelector('#modal-agregar-stock');
  const inputAgregarCantidad = document.querySelector('#agregar-cantidad');
  const inputAgregarFechaVencimiento = document.querySelector('#agregar-fecha-vencimiento');
  const btnAgregarGuardarStock = document.querySelector('#agregar-guardar-stock');
  const btnAgregarCancelarStock = document.querySelector('#agregar-cancelar-stock');
  const modalDarBaja = document.querySelector('#modal-dar-baja');
  const inputBajaCantidad = document.querySelector('#baja-cantidad');
  const selectBajaMotivo = document.querySelector('#baja-motivo');
  const textareaBajaNota = document.querySelector('#baja-nota');
  const btnBajaConfirmar = document.querySelector('#baja-confirmar');
  const btnBajaCancelar = document.querySelector('#baja-cancelar');
  /* Propósito: Obtiene referencias a elementos clave para búsqueda, filtros, escáner, lista de productos, y modales */
  /* Incluye inputs, botones, contenedores, y modales para gestionar el inventario */

  /* Construcción de la URL base */
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;
  /* Propósito: Crea una URL base dinámica (por ejemplo, http://localhost o https://gestion-kiosco.vercel.app) */
  /* Evita hardcodear el puerto para mayor portabilidad */

  /* Estado para manejar productos */
  let productos = [];
  let productoSeleccionado = null;
  /* Propósito: Almacena la lista de productos y el producto seleccionado para modales */

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
  /* Propósito: Define las subcategorías disponibles para cada categoría */
  /* Usado para poblar el selector de subcategorías dinámicamente */

  /* Obtener código inicial de la URL */
  const urlParams = new URLSearchParams(window.location.search);
  const codigoInicial = urlParams.get('codigo');
  console.log('Código inicial desde la URL:', codigoInicial);
  if (codigoInicial) {
    buscador.value = '';
    console.log('Campo de búsqueda limpiado debido a código inicial');
  }
  /* Propósito: Lee el parámetro 'codigo' de la URL (por ejemplo, tras escanear en cargar-producto.html) */
  /* Limpia el campo de búsqueda si hay un código inicial para priorizar el filtro por código */

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
  /* Propósito: Obtiene la lista de productos del usuario desde el backend */
  /* Verifica que exista usuarioId, hace una solicitud GET, y renderiza los productos filtrados */

  /* Filtrar y renderizar productos */
  function filtrarYRenderizarProductos() {
    let productosFiltrados = [...productos];
    if (codigoInicial) {
      productosFiltrados = productosFiltrados.filter(producto => producto.codigo === codigoInicial);
      console.log('Productos filtrados por código:', productosFiltrados);
    }
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
      productosFiltrados = productosFiltrados.filter(producto => producto.cantidadUnidades === 0);
    }
    if (filtroPorVencer.checked) {
      const hoy = new Date();
      const sieteDiasDesdeHoy = new Date(hoy);
      sieteDiasDesdeHoy.setDate(hoy.getDate() + 7);
      productosFiltrados = productosFiltrados.filter(producto => {
        const fechaVencimiento = new Date(producto.fechaVencimiento);
        return fechaVencimiento >= hoy && fechaVencimiento <= sieteDiasDesdeHoy;
      });
    }
    console.log('Productos filtrados:', productosFiltrados);
    renderizarProductos(productosFiltrados);
  }
  /* Propósito: Filtra productos según código inicial, búsqueda, categoría, subcategoría, stock, y vencimiento */
  /* Llama a renderizarProductos con los productos filtrados */

  /* Renderizar productos */
  function renderizarProductos(productosFiltrados) {
    listaStock.innerHTML = '';
    console.log('Renderizando productos:', productosFiltrados);
    if (productosFiltrados.length === 0) {
      listaStock.innerHTML = '<p>No se encontraron productos.</p>';
      return;
    }
    productosFiltrados.forEach(producto => {
      const tarjeta = document.createElement('div');
      tarjeta.className = `tarjeta-producto ${producto.cantidadUnidades === 0 ? 'sin-stock' : ''}`;
      tarjeta.dataset.id = producto._id;
      tarjeta.innerHTML = `
        <div class="tarjeta-icono">
          <i class="fas fa-box"></i>
        </div>
        <div class="tarjeta-info">
          <div class="tarjeta-nombre">${producto.nombre}</div>
          <div class="tarjeta-marca">${producto.marca}</div>
          <div class="tarjeta-cantidad ${producto.cantidadUnidades === 0 ? 'sin-stock' : producto.cantidadUnidades <= 5 ? 'stock-bajo' : ''}">
            Cantidad: ${producto.cantidadUnidades} ${producto.unidad}${producto.cantidadUnidades !== 1 ? 's' : ''}
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
  }
  /* Propósito: Muestra los productos como tarjetas en el DOM */
  /* Crea tarjetas con nombre, marca, cantidad, y precio, aplicando clases para stock bajo o sin stock */
  /* Asigna eventos de clic para abrir el modal de detalles */

  /* Cargar productos al iniciar */
  cargarProductos();
  /* Propósito: Carga los productos al cargar la página */

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
  /* Propósito: Pobla el selector de subcategorías según la categoría seleccionada */
  /* Actualiza la lista de productos al cambiar la categoría */

  /* Eventos de filtrado */
  buscador.addEventListener('input', filtrarYRenderizarProductos);
  filtroSubcategoria.addEventListener('change', filtrarYRenderizarProductos);
  filtroSinStock.addEventListener('change', filtrarYRenderizarProductos);
  filtroPorVencer.addEventListener('change', filtrarYRenderizarProductos);
  /* Propósito: Actualiza la lista de productos al cambiar el término de búsqueda o filtros */

  /* Mostrar/Ocultar menú de filtros */
  btnFiltros.addEventListener('click', () => {
    menuFiltros.style.display = menuFiltros.style.display === 'block' ? 'none' : 'block';
  });
  /* Propósito: Alterna la visibilidad del menú de filtros */

  /* Resetear filtros */
  btnFiltroTodo.addEventListener('click', () => {
    filtroCategoria.value = '';
    filtroSubcategoria.innerHTML = '<option value="">Todas</option>';
    filtroSinStock.checked = false;
    filtroPorVencer.checked = false;
    filtrarYRenderizarProductos();
  });
  /* Propósito: Resetea todos los filtros y muestra todos los productos */

  /* Manejo del escaneo continuo */
  btnEscanear.addEventListener('click', () => {
    const completarCallback = (producto) => {
      if (producto) {
        console.log('Producto encontrado durante escaneo:', producto);
        window.location.href = `/public/stock.html?codigo=${producto.codigo}`;
      }
    };
    iniciarEscaneoContinuo(
      camaraStock,
      btnEscanear,
      btnDetenerEscaneo,
      null,
      completarCallback,
      null
    );
  });
  /* Propósito: Configura el escaneo continuo de códigos de barras */
  /* Usa iniciarEscaneoContinuo de utils.js para escanear códigos */
  /* Redirige a stock.html con el código del producto escaneado */

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
      <div class="detalle-item"><span>Cantidad:</span> ${productoSeleccionado.cantidadUnidades} ${productoSeleccionado.unidad}${productoSeleccionado.cantidadUnidades !== 1 ? 's' : ''}</div>
      <div class="detalle-item"><span>Precio de Lista:</span> $${productoSeleccionado.precioLista.toFixed(2)}</div>
      <div class="detalle-item"><span>Porcentaje de Ganancia:</span> ${productoSeleccionado.porcentajeGanancia}%</div>
      <div class="detalle-item"><span>Precio Final:</span> $${productoSeleccionado.precioFinal.toFixed(2)}</div>
      <div class="detalle-item"><span>Fecha de Vencimiento:</span> ${new Date(productoSeleccionado.fechaVencimiento).toLocaleDateString()}</div>
      ${productoSeleccionado.codigo ? `<div class="detalle-item"><span>Código:</span> ${productoSeleccionado.codigo}</div>` : ''}
    `;
    modalProducto.style.display = 'flex';
  }
  /* Propósito: Muestra un modal con los detalles del producto seleccionado */
  /* Llena el modal con información como nombre, marca, cantidad, precios, y fecha de vencimiento */

  /* Cerrar modal de detalles */
  btnModalCerrar.addEventListener('click', () => {
    modalProducto.style.display = 'none';
    productoSeleccionado = null;
  });
  /* Propósito: Oculta el modal de detalles y limpia el producto seleccionado */

  /* Abrir modal para editar precios */
  btnModalEditarPrecios.addEventListener('click', () => {
    if (!productoSeleccionado) return;
    inputEditPrecioLista.value = productoSeleccionado.precioLista;
    inputEditPorcentajeGanancia.value = productoSeleccionado.porcentajeGanancia;
    inputEditPrecioFinal.value = productoSeleccionado.precioFinal;
    modalProducto.style.display = 'none';
    modalEditarPrecios.style.display = 'flex';
  });
  /* Propósito: Abre el modal para editar precios, precargando los valores actuales */

  /* Calcular precio final al editar */
  inputEditPorcentajeGanancia.addEventListener('input', () => {
    const precioLista = parseFloat(inputEditPrecioLista.value);
    const porcentajeGanancia = parseFloat(inputEditPorcentajeGanancia.value);
    if (precioLista && porcentajeGanancia) {
      const precioFinal = precioLista * (1 + porcentajeGanancia / 100);
      inputEditPrecioFinal.value = precioFinal.toFixed(2);
    }
  });
  /* Propósito: Actualiza el precio final en el modal según el precio de lista y porcentaje de ganancia */

  /* Guardar cambios en precios */
  btnEditGuardarPrecios.addEventListener('click', async () => {
    if (!productoSeleccionado) return;
    const precioLista = parseFloat(inputEditPrecioLista.value);
    const porcentajeGanancia = parseFloat(inputEditPorcentajeGanancia.value);
    const precioFinal = parseFloat(inputEditPrecioFinal.value);
    try {
      const response = await fetch(`${BASE_URL}/api/productos/${productoSeleccionado._id}/precios`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ precioLista, porcentajeGanancia, precioFinal })
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
  /* Propósito: Envía los nuevos precios al backend y recarga los productos */
  /* Oculta el modal tras guardar */

  /* Cancelar edición de precios */
  btnEditCancelarPrecios.addEventListener('click', () => {
    modalEditarPrecios.style.display = 'none';
    modalProducto.style.display = 'flex';
  });
  /* Propósito: Cancela la edición de precios y vuelve al modal de detalles */

  /* Abrir modal para agregar stock */
  btnModalAgregarStock.addEventListener('click', () => {
    if (!productoSeleccionado) return;
    inputAgregarCantidad.value = '';
    inputAgregarFechaVencimiento.value = productoSeleccionado.fechaVencimiento ? new Date(productoSeleccionado.fechaVencimiento).toISOString().split('T')[0] : '';
    modalProducto.style.display = 'none';
    modalAgregarStock.style.display = 'flex';
  });
  /* Propósito: Abre el modal para agregar stock, precargando la fecha de vencimiento */

  /* Guardar nuevo stock */
  btnAgregarGuardarStock.addEventListener('click', async () => {
    if (!productoSeleccionado) return;
    const cantidad = parseInt(inputAgregarCantidad.value);
    const fechaVencimiento = inputAgregarFechaVencimiento.value;
    try {
      const response = await fetch(`${BASE_URL}/api/productos/${productoSeleccionado._id}/agregar-stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad, fechaVencimiento })
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
  /* Propósito: Envía la nueva cantidad y fecha de vencimiento al backend y recarga los productos */
  /* Oculta el modal tras guardar */

  /* Cancelar agregar stock */
  btnAgregarCancelarStock.addEventListener('click', () => {
    modalAgregarStock.style.display = 'none';
    modalProducto.style.display = 'flex';
  });
  /* Propósito: Cancela la adición de stock y vuelve al modal de detalles */

  /* Abrir modal para dar de baja */
  btnModalDarBaja.addEventListener('click', () => {
    if (!productoSeleccionado) return;
    inputBajaCantidad.value = '';
    selectBajaMotivo.value = 'vencimiento';
    textareaBajaNota.value = '';
    modalProducto.style.display = 'none';
    modalDarBaja.style.display = 'flex';
  });
  /* Propósito: Abre el modal para dar de baja, precargando el motivo como 'vencimiento' */

  /* Confirmar baja de producto */
  btnBajaConfirmar.addEventListener('click', async () => {
    if (!productoSeleccionado) return;
    const cantidad = parseInt(inputBajaCantidad.value);
    const motivo = selectBajaMotivo.value;
    const nota = textareaBajaNota.value;
    const usuarioId = localStorage.getItem('usuarioId');
    try {
      const response = await fetch(`${BASE_URL}/api/productos/${productoSeleccionado._id}/dar-baja`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId, cantidad, motivo, nota })
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
  /* Propósito: Envía la solicitud para dar de baja un producto con cantidad, motivo, y nota */
  /* Recarga los productos y oculta el modal tras guardar */

  /* Cancelar baja de producto */
  btnBajaCancelar.addEventListener('click', () => {
    modalDarBaja.style.display = 'none';
    modalProducto.style.display = 'flex';
  });
  /* Propósito: Cancela la baja y vuelve al modal de detalles */
});