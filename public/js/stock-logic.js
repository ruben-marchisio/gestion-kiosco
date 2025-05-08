document.addEventListener('DOMContentLoaded', () => {
    console.log('stock-logic.js cargado');
  
    // Elementos del DOM
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
    const modalDetalles = document.querySelector('#modal-detalles');
    const btnEditarPrecios = document.querySelector('#modal-editar-precios');
    const btnAgregarStock = document.querySelector('#modal-agregar-stock');
    const btnDarBaja = document.querySelector('#modal-dar-baja');
    const btnCerrarModal = document.querySelector('#modal-cerrar');
    const modalEditarPrecios = document.querySelector('#modal-editar-precios');
    const editPrecioLista = document.querySelector('#edit-precio-lista');
    const editPorcentajeGanancia = document.querySelector('#edit-porcentaje-ganancia');
    const editPrecioFinal = document.querySelector('#edit-precio-final');
    const btnGuardarPrecios = document.querySelector('#edit-guardar-precios');
    const btnCancelarPrecios = document.querySelector('#edit-cancelar-precios');
    const modalAgregarStock = document.querySelector('#modal-agregar-stock');
    const agregarCantidad = document.querySelector('#agregar-cantidad');
    const agregarFechaVencimiento = document.querySelector('#agregar-fecha-vencimiento');
    const btnGuardarStock = document.querySelector('#agregar-guardar-stock');
    const btnCancelarStock = document.querySelector('#agregar-cancelar-stock');
    const modalDarBaja = document.querySelector('#modal-dar-baja');
    const bajaCantidad = document.querySelector('#baja-cantidad');
    const bajaMotivo = document.querySelector('#baja-motivo');
    const bajaNota = document.querySelector('#baja-nota');
    const btnConfirmarBaja = document.querySelector('#baja-confirmar');
    const btnCancelarBaja = document.querySelector('#baja-cancelar');
  
    // Estado
    let productos = []; // Lista completa de productos cargados desde el servidor
    let productosFiltrados = []; // Productos después de aplicar filtros
    let productoSeleccionado = null; // Producto actualmente seleccionado en el modal
  
    // Construcción de la URL base
    const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;
  
    // Cargar productos al iniciar
    async function cargarProductos() {
      try {
        const usuarioId = localStorage.getItem('usuarioId');
        const response = await fetch(`${BASE_URL}/api/productos?usuarioId=${usuarioId}`);
        productos = await response.json();
        productosFiltrados = [...productos];
        console.log('Productos cargados:', productos.length);
        actualizarListaProductos();
      } catch (error) {
        console.error('Error al cargar productos:', error);
        mostrarToast('Error al cargar el stock: ' + error.message, 'error');
      }
    }
  
    // Actualizar la lista de productos en la interfaz
    function actualizarListaProductos() {
      listaStock.innerHTML = '';
      productosFiltrados.forEach(producto => {
        const tarjeta = document.createElement('div');
        tarjeta.className = `tarjeta-producto ${producto.cantidadUnidades === 0 ? 'sin-stock' : ''}`;
        tarjeta.innerHTML = `
          <div class="tarjeta-icono">
            <i class="${producto.icono !== 'default' ? `fas fa-${producto.icono}` : ''}"></i>
          </div>
          <div class="tarjeta-info">
            <div class="tarjeta-nombre">${producto.nombre}</div>
            <div class="tarjeta-marca">Marca: ${producto.marca}</div>
            <div class="tarjeta-cantidad ${producto.cantidadUnidades === 0 ? 'sin-stock' : producto.cantidadUnidades < 5 ? 'stock-bajo' : ''}">
              Cantidad: ${producto.cantidadUnidades} ${producto.unidad}
            </div>
            <div class="tarjeta-precio">Precio Final: $${producto.precioFinal.toFixed(2)}</div>
          </div>
        `;
        tarjeta.addEventListener('click', () => abrirModalProducto(producto));
        listaStock.appendChild(tarjeta);
      });
    }
  
    // Abrir el modal con los detalles del producto
    function abrirModalProducto(producto) {
      productoSeleccionado = producto;
      modalDetalles.innerHTML = `
        <div class="detalle-item"><strong>Nombre:</strong> ${producto.nombre}</div>
        <div class="detalle-item"><strong>Marca:</strong> ${producto.marca}</div>
        <div class="detalle-item"><strong>Categoría:</strong> ${producto.categoria}</div>
        <div class="detalle-item"><strong>Subcategoría:</strong> ${producto.subcategoria || 'N/A'}</div>
        <div class="detalle-item"><strong>Cantidad:</strong> ${producto.cantidadUnidades} ${producto.unidad}</div>
        <div class="detalle-item"><strong>Precio de Lista:</strong> $${producto.precioLista.toFixed(2)}</div>
        <div class="detalle-item"><strong>Porcentaje de Ganancia:</strong> ${producto.porcentajeGanancia}%</div>
        <div class="detalle-item"><strong>Precio Final:</strong> $${producto.precioFinal.toFixed(2)}</div>
        <div class="detalle-item"><strong>Fecha de Vencimiento:</strong> ${new Date(producto.fechaVencimiento).toLocaleDateString()}</div>
      `;
      modalProducto.style.display = 'flex';
    }
  
    // Cerrar el modal de detalles
    btnCerrarModal.addEventListener('click', () => {
      modalProducto.style.display = 'none';
      productoSeleccionado = null;
    });
  
    // Buscador
    buscador.addEventListener('input', () => {
      const termino = buscador.value.toLowerCase();
      aplicarFiltros({ termino });
    });
  
    // Escáner
    btnEscanear.addEventListener('click', () => {
      const completarCallback = (producto) => {
        if (producto) {
          productosFiltrados = [producto];
          actualizarListaProductos();
          camaraStock.style.display = 'none';
          btnEscanear.style.display = 'block';
          btnDetenerEscaneo.style.display = 'none';
        } else {
          mostrarToast('Producto no encontrado con ese código de barras.', 'info');
        }
      };
  
      iniciarEscaneoContinuo(
        camaraStock,
        btnEscanear,
        btnDetenerEscaneo,
        { value: '' }, // Input ficticio para Quagga
        completarCallback,
        null
      );
    });
  
    // Mostrar/Ocultar el menú de filtros
    btnFiltros.addEventListener('click', () => {
      menuFiltros.style.display = menuFiltros.style.display === 'none' ? 'block' : 'none';
    });
  
    // Actualizar subcategorías según la categoría seleccionada
    filtroCategoria.addEventListener('change', () => {
      const categoria = filtroCategoria.value;
      const subcategorias = {
        bebidas: ['con-alcohol', 'gaseosas', 'agua', 'energizante'],
        golosinas: ['chocolate', 'caramelos', 'chicles'],
        lacteos: ['leche', 'yogures', 'quesos'],
        cigarrillos: ['comunes', 'convertibles', 'tabaco'],
        fiambre: ['primera-marca', 'segunda-marca'],
        congelados: ['carnes', 'helados'],
        panaderia: ['dulce', 'salado'],
        almacen: ['harinas', 'aceites-vinagres', 'aderezos-condimentos', 'fideos-arroz', 'enlatados-conservas'],
        verduleria: ['frutas', 'vegetales', 'huevos']
      };
  
      filtroSubcategoria.innerHTML = '<option value="">Todas</option>';
      if (categoria && subcategorias[categoria]) {
        subcategorias[categoria].forEach(sub => {
          const option = document.createElement('option');
          option.value = sub;
          option.textContent = sub.charAt(0).toUpperCase() + sub.slice(1).replace('-', ' ');
          filtroSubcategoria.appendChild(option);
        });
      }
  
      aplicarFiltros();
    });
  
    // Aplicar filtros
    function aplicarFiltros(opciones = {}) {
      const termino = opciones.termino !== undefined ? opciones.termino : buscador.value.toLowerCase();
      const categoria = filtroCategoria.value;
      const subcategoria = filtroSubcategoria.value;
      const sinStock = filtroSinStock.checked;
      const porVencer = filtroPorVencer.checked;
  
      productosFiltrados = productos.filter(producto => {
        // Filtro por término de búsqueda
        const coincideTermino = termino ? 
          producto.nombre.toLowerCase().includes(termino) || 
          producto.marca.toLowerCase().includes(termino) : true;
  
        // Filtro por categoría
        const coincideCategoria = categoria ? producto.categoria === categoria : true;
  
        // Filtro por subcategoría
        const coincideSubcategoria = subcategoria ? producto.subcategoria === subcategoria : true;
  
        // Filtro sin stock
        const coincideSinStock = sinStock ? producto.cantidadUnidades === 0 : true;
  
        // Filtro por vencer (próximos 7 días)
        const coincidePorVencer = porVencer ? 
          (new Date(producto.fechaVencimiento) >= new Date() && 
           new Date(producto.fechaVencimiento) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) : true;
  
        return coincideTermino && coincideCategoria && coincideSubcategoria && coincideSinStock && coincidePorVencer;
      });
  
      actualizarListaProductos();
    }
  
    // Evento para el botón "Mostrar Todo"
    btnFiltroTodo.addEventListener('click', () => {
      buscador.value = '';
      filtroCategoria.value = '';
      filtroSubcategoria.innerHTML = '<option value="">Todas</option>';
      filtroSubcategoria.value = '';
      filtroSinStock.checked = false;
      filtroPorVencer.checked = false;
      productosFiltrados = [...productos];
      actualizarListaProductos();
      menuFiltros.style.display = 'none';
    });
  
    // Eventos para los filtros
    [filtroCategoria, filtroSubcategoria, filtroSinStock, filtroPorVencer].forEach(filtro => {
      filtro.addEventListener('change', () => aplicarFiltros());
    });
  
    // Abrir el modal para editar precios
    btnEditarPrecios.addEventListener('click', () => {
      modalProducto.style.display = 'none';
      editPrecioLista.value = productoSeleccionado.precioLista;
      editPorcentajeGanancia.value = productoSeleccionado.porcentajeGanancia;
      editPrecioFinal.value = productoSeleccionado.precioFinal;
      modalEditarPrecios.style.display = 'flex';
    });
  
    // Recalcular precio final al cambiar precio de lista o porcentaje de ganancia
    [editPrecioLista, editPorcentajeGanancia].forEach(input => {
      input.addEventListener('input', () => {
        const precioLista = parseFloat(editPrecioLista.value) || 0;
        const porcentajeGanancia = parseFloat(editPorcentajeGanancia.value) || 0;
        const precioFinal = precioLista * (1 + porcentajeGanancia / 100);
        editPrecioFinal.value = precioFinal.toFixed(2);
      });
    });
  
    // Guardar los precios editados
    btnGuardarPrecios.addEventListener('click', async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/productos/${productoSeleccionado._id}/precios`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            precioLista: parseFloat(editPrecioLista.value),
            porcentajeGanancia: parseFloat(editPorcentajeGanancia.value),
            precioFinal: parseFloat(editPrecioFinal.value)
          })
        });
  
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Error al actualizar los precios');
  
        // Actualizar el producto localmente
        productoSeleccionado.precioLista = parseFloat(editPrecioLista.value);
        productoSeleccionado.porcentajeGanancia = parseFloat(editPorcentajeGanancia.value);
        productoSeleccionado.precioFinal = parseFloat(editPrecioFinal.value);
        actualizarListaProductos();
  
        modalEditarPrecios.style.display = 'none';
        mostrarToast('Precios actualizados con éxito.', 'success');
      } catch (error) {
        console.error('Error al guardar los precios:', error);
        mostrarToast('Error al guardar los precios: ' + error.message, 'error');
      }
    });
  
    // Cancelar edición de precios
    btnCancelarPrecios.addEventListener('click', () => {
      modalEditarPrecios.style.display = 'none';
    });
  
    // Abrir el modal para agregar stock
    btnAgregarStock.addEventListener('click', () => {
      modalProducto.style.display = 'none';
      agregarCantidad.value = '';
      agregarFechaVencimiento.value = productoSeleccionado.fechaVencimiento ? new Date(productoSeleccionado.fechaVencimiento).toISOString().split('T')[0] : '';
      modalAgregarStock.style.display = 'flex';
    });
  
    // Guardar el stock agregado
    btnGuardarStock.addEventListener('click', async () => {
      const cantidad = parseInt(agregarCantidad.value);
      if (!cantidad || cantidad <= 0) {
        mostrarToast('La cantidad a agregar debe ser mayor que 0.', 'error');
        return;
      }
  
      try {
        const response = await fetch(`${BASE_URL}/api/productos/${productoSeleccionado._id}/agregar-stock`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            cantidad,
            fechaVencimiento: agregarFechaVencimiento.value
          })
        });
  
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Error al agregar stock');
  
        // Actualizar el producto localmente
        productoSeleccionado.cantidadUnidades += cantidad;
        productoSeleccionado.fechaVencimiento = new Date(agregarFechaVencimiento.value);
        actualizarListaProductos();
  
        modalAgregarStock.style.display = 'none';
        mostrarToast('Stock agregado con éxito.', 'success');
      } catch (error) {
        console.error('Error al agregar stock:', error);
        mostrarToast('Error al agregar stock: ' + error.message, 'error');
      }
    });
  
    // Cancelar agregar stock
    btnCancelarStock.addEventListener('click', () => {
      modalAgregarStock.style.display = 'none';
    });
  
    // Abrir el modal para dar de baja
    btnDarBaja.addEventListener('click', () => {
      modalProducto.style.display = 'none';
      bajaCantidad.value = '';
      bajaMotivo.value = 'vencimiento';
      bajaNota.value = '';
      modalDarBaja.style.display = 'flex';
    });
  
    // Confirmar la baja
    btnConfirmarBaja.addEventListener('click', async () => {
      const cantidad = parseInt(bajaCantidad.value);
      if (!cantidad || cantidad <= 0) {
        mostrarToast('La cantidad a dar de baja debe ser mayor que 0.', 'error');
        return;
      }
  
      if (cantidad > productoSeleccionado.cantidadUnidades) {
        mostrarToast('La cantidad a dar de baja excede el stock disponible.', 'error');
        return;
      }
  
      try {
        const response = await fetch(`${BASE_URL}/api/productos/${productoSeleccionado._id}/dar-baja`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            usuarioId: localStorage.getItem('usuarioId'),
            cantidad,
            motivo: bajaMotivo.value,
            nota: bajaNota.value
          })
        });
  
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Error al dar de baja el producto');
  
        // Actualizar el producto localmente
        if (bajaMotivo.value === 'eliminacion-permanente' && cantidad === productoSeleccionado.cantidadUnidades) {
          productos = productos.filter(p => p._id !== productoSeleccionado._id);
          productosFiltrados = productosFiltrados.filter(p => p._id !== productoSeleccionado._id);
        } else {
          productoSeleccionado.cantidadUnidades -= cantidad;
        }
        actualizarListaProductos();
  
        modalDarBaja.style.display = 'none';
        mostrarToast('Producto dado de baja con éxito.', 'success');
      } catch (error) {
        console.error('Error al dar de baja el producto:', error);
        mostrarToast('Error al dar de baja el producto: ' + error.message, 'error');
      }
    });
  
    // Cancelar la baja
    btnCancelarBaja.addEventListener('click', () => {
      modalDarBaja.style.display = 'none';
    });
  
    // Cargar los productos al iniciar
    cargarProductos();
  });