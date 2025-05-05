document.addEventListener('DOMContentLoaded', () => {
  console.log('cargar-producto-logic.js cargado');

  // Elementos del DOM
  const formCargarProducto = document.querySelector('#form-cargar-producto');
  const completarInmediatamente = document.querySelector('#completar-inmediatamente');
  const activarEscaneoBtn = document.querySelector('#activar-escaneo');
  const detenerEscaneoBtn = document.querySelector('#detener-escaneo');
  const camaraCarga = document.querySelector('#camara-carga');
  const listaProductosBody = document.querySelector('#lista-productos-body');
  const confirmarTodosBtn = document.querySelector('#confirmar-todos');
  const cancelarTodoBtn = document.querySelector('#cancelar-todo');
  const toastContainer = document.querySelector('#toast-container');
  const agregarProductoBtn = document.querySelector('#agregar-producto');
  const cancelarProductoBtn = document.querySelector('#cancelar-producto');

  // Variables globales
  let productosEnProceso = [];
  let escaneoActivo = false;
  let productoEditandoIndex = null;
  let ultimoCodigoEscaneado = null;
  let ultimoEscaneoTiempo = 0;
  const DEBOUNCE_TIME = 2000; // 2 segundos para dar más tiempo

  // Construcción de la URL base
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

  // Crear sonido de escaneo
  const sonidoEscaneo = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');

  // Función para validar ObjectId (24 caracteres hexadecimales)
  function isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  // Función para mostrar toasts
  function mostrarToast(mensaje, tipo) {
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.textContent = mensaje;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // Inicializar escaneo usando utils.js
  function inicializarEscaneo() {
    escaneoActivo = true;
    activarEscaneoBtn.style.display = 'none';
    detenerEscaneoBtn.style.display = 'inline-block';

    const escanear = () => {
      iniciarEscaneo(camaraCarga, (codigo) => {
        const ahora = Date.now();

        // Evitar múltiples escaneos con debounce
        if (ultimoCodigoEscaneado === codigo && (ahora - ultimoEscaneoTiempo) < DEBOUNCE_TIME) {
          if (escaneoActivo) {
            setTimeout(escanear, 100); // Reanudar escaneo después de un pequeño retraso
          }
          return;
        }

        ultimoCodigoEscaneado = codigo;
        ultimoEscaneoTiempo = ahora;

        // Reproducir sonido de escaneo
        sonidoEscaneo.play().catch(err => console.error('Error al reproducir sonido:', err));

        document.querySelector('#codigo').value = codigo;
        buscarProductoPorCodigo(codigo);

        // Reanudar escaneo si está activo
        if (escaneoActivo) {
          setTimeout(escanear, DEBOUNCE_TIME);
        }
      });
    };

    escanear();
  }

  // Detener escaneo
  function detenerEscaneo() {
    Quagga.stop();
    escaneoActivo = false;
    activarEscaneoBtn.style.display = 'inline-block';
    detenerEscaneoBtn.style.display = 'none';
    camaraCarga.style.display = 'none';
    ultimoCodigoEscaneado = null; // Resetear para permitir nuevos escaneos
  }

  // Buscar producto por código
  async function buscarProductoPorCodigo(codigo) {
    try {
      // Primero buscar en la base de datos local
      const respuestaLocal = await fetch(`${BASE_URL}/api/productos/codigo/${codigo}`);
      const resultadoLocal = await respuestaLocal.json();

      if (respuestaLocal.ok) {
        // Producto encontrado en la base de datos local
        const producto = resultadoLocal.producto;
        mostrarToast(`Producto encontrado localmente: ${producto.nombre}`, 'exito');
        cargarProductoExistente(producto);
        return;
      }

      // Si no se encuentra localmente, buscar en Open Food Facts
      const respuestaExterna = await fetch(`https://world.openfoodfacts.org/api/v0/product/${codigo}.json`);
      const resultadoExterna = await respuestaExterna.json();

      if (resultadoExterna.status === 1) {
        // Producto encontrado en Open Food Facts
        const productData = resultadoExterna.product;
        const producto = {
          codigo: codigo,
          nombre: productData.product_name || 'Producto Desconocido',
          marca: productData.brands || 'Sin Marca',
          categoria: productData.categories_tags ? productData.categories_tags[0] || '' : '',
          subcategoria: productData.categories_tags ? productData.categories_tags[1] || '' : '',
          icono: 'default',
          estado: 'Completo'
        };
        mostrarToast(`Producto encontrado en Open Food Facts: ${producto.nombre}`, 'exito');
        cargarProductoExistente(producto);
      } else {
        // Producto no encontrado, completar manualmente
        mostrarToast('Producto no encontrado, por favor completa los datos manualmente', 'error');
        const producto = { codigo, estado: 'Pendiente' };
        agregarProductoALista(producto, true);

        if (completarInmediatamente.checked) {
          detenerEscaneo();
          cargarProductoEnFormulario(producto, productosEnProceso.length - 1);
        }
      }
    } catch (error) {
      console.error('Error al buscar producto:', error);
      mostrarToast('Error al buscar el producto', 'error');
    }
  }

  // Cargar producto existente en el formulario
  function cargarProductoExistente(producto) {
    document.querySelector('#codigo').value = producto.codigo || '';
    document.querySelector('#nombre-producto').value = producto.nombre || '';
    document.querySelector('#marca').value = producto.marca || '';
    document.querySelector('#categoria').value = producto.categoria || '';
    manejarCambioCategoria();
    const subcategoriaSelect = document.querySelector(`#subcategoria-${producto.categoria ? producto.categoria.toLowerCase() : ''}`);
    if (subcategoriaSelect) {
      subcategoriaSelect.value = producto.subcategoria || '';
    }
    document.querySelector('#icono-producto').value = producto.icono || 'default';
    document.querySelector('#unidad').value = producto.unidad || 'unidad';
    manejarCambioUnidad();

    // Deshabilitar campos que no deben editarse
    document.querySelector('#nombre-producto').disabled = true;
    document.querySelector('#marca').disabled = true;
    document.querySelector('#categoria').disabled = true;
    if (subcategoriaSelect) subcategoriaSelect.disabled = true;
    document.querySelector('#icono-producto').disabled = true;

    // Mostrar campos de cantidad existente si aplica
    if (producto.cantidadUnidades !== undefined) {
      document.querySelectorAll('.cantidad-existente').forEach(el => el.style.display = 'block');
      document.querySelector('#cantidad-actual').value = producto.cantidadUnidades;
      document.querySelector('#cantidad-a-anadir').value = 0;
      document.querySelector('#nuevo-total').value = producto.cantidadUnidades;
    }

    agregarProductoALista(producto, false);
  }

  // Agregar producto a la lista
  function agregarProductoALista(producto, esNuevo) {
    const index = productosEnProceso.findIndex(p => p.codigo === producto.codigo);
    if (index !== -1) {
      // Producto ya está en la lista, incrementar cantidad
      productosEnProceso[index].cantidadAAnadir = (productosEnProceso[index].cantidadAAnadir || 0) + 1;
      productosEnProceso[index].nuevoTotal = (producto.cantidadUnidades || 0) + productosEnProceso[index].cantidadAAnadir;
    } else {
      // Nuevo producto en la lista
      producto.cantidadAAnadir = 1;
      producto.nuevoTotal = (producto.cantidadUnidades || 0) + 1;
      producto.estado = esNuevo ? 'Pendiente' : 'Completo';
      productosEnProceso.push(producto);
    }
    actualizarListaProductos();
  }

  // Actualizar la tabla de productos en proceso
  function actualizarListaProductos() {
    listaProductosBody.innerHTML = ''; // Limpiar la tabla antes de agregar productos
    productosEnProceso.forEach((producto, index) => {
      const tr = document.createElement('tr');
      tr.className = producto.estado.toLowerCase();
      tr.innerHTML = `
        <td>${producto.nombre || 'N/A'}</td>
        <td>${producto.marca || 'N/A'}</td>
        <td>${producto.categoria || 'N/A'}</td>
        <td>
          ${producto.cantidadUnidades ? `Actual: ${producto.cantidadUnidades}, Añadir: ${producto.cantidadAAnadir}, Total: ${producto.nuevoTotal}` : producto.cantidadAAnadir}
        </td>
        <td class="estado">${producto.estado}</td>
        <td><i class="fas fa-${producto.icono || 'default'}"></i></td>
        <td class="acciones">
          <button class="editar" data-index="${index}"><i class="fas fa-edit"></i></button>
          <button class="eliminar" data-index="${index}"><i class="fas fa-trash"></i></button>
        </td>
      `;
      listaProductosBody.appendChild(tr);
    });

    // Habilitar/deshabilitar botón "Confirmar Todos"
    const hayPendientes = productosEnProceso.some(p => p.estado === 'Pendiente');
    confirmarTodosBtn.disabled = hayPendientes;
  }

  // Cargar producto en el formulario para editar
  function cargarProductoEnFormulario(producto, index) {
    productoEditandoIndex = index;
    document.querySelector('#codigo').value = producto.codigo || '';
    document.querySelector('#nombre-producto').value = producto.nombre || '';
    document.querySelector('#marca').value = producto.marca || '';
    document.querySelector('#categoria').value = producto.categoria || '';
    manejarCambioCategoria();
    const subcategoriaSelect = document.querySelector(`#subcategoria-${producto.categoria ? producto.categoria.toLowerCase() : ''}`);
    if (subcategoriaSelect) {
      subcategoriaSelect.value = producto.subcategoria || '';
    }
    document.querySelector('#precio-lista').value = producto.precioLista || '';
    document.querySelector('#porcentaje-ganancia').value = producto.porcentajeGanancia || '';
    document.querySelector('#precio-final').value = producto.precioFinal || '';
    document.querySelector('#unidad').value = producto.unidad || 'unidad';
    manejarCambioUnidad();
    document.querySelector('#packs').value = producto.packs || 0;
    document.querySelector('#unidadesPorPack').value = producto.unidadesPorPack || 0;
    document.querySelector('#docenas').value = producto.docenas || 0;
    document.querySelector('#unidadesSueltas').value = producto.unidadesSueltas || 0;
    document.querySelector('#cantidad-total').value = producto.cantidadUnidades || 0;
    document.querySelector('#fecha-vencimiento').value = producto.fechaVencimiento ? new Date(producto.fechaVencimiento).toISOString().split('T')[0] : '';
    document.querySelector('#icono-producto').value = producto.icono || 'default';

    // Habilitar campos para edición manual
    document.querySelector('#nombre-producto').disabled = false;
    document.querySelector('#marca').disabled = false;
    document.querySelector('#categoria').disabled = false;
    if (subcategoriaSelect) subcategoriaSelect.disabled = false;
    document.querySelector('#icono-producto').disabled = false;

    // Mostrar campos de cantidad existente si aplica
    if (producto.cantidadUnidades !== undefined) {
      document.querySelectorAll('.cantidad-existente').forEach(el => el.style.display = 'block');
      document.querySelector('#cantidad-actual').value = producto.cantidadUnidades;
      document.querySelector('#cantidad-a-anadir').value = producto.cantidadAAnadir || 0;
      document.querySelector('#nuevo-total').value = producto.nuevoTotal || producto.cantidadUnidades;
    } else {
      document.querySelectorAll('.cantidad-existente').forEach(el => el.style.display = 'none');
    }

    agregarProductoBtn.textContent = 'Actualizar Producto';
  }

  // Limpiar formulario
  function limpiarFormulario() {
    formCargarProducto.reset();
    document.querySelectorAll('.cantidad-existente').forEach(el => el.style.display = 'none');
    productoEditandoIndex = null;
    agregarProductoBtn.textContent = 'Agregar Producto';
    document.querySelector('#nombre-producto').disabled = false;
    document.querySelector('#marca').disabled = false;
    document.querySelector('#categoria').disabled = false;
    const subcategoriaSelect = document.querySelector(`#subcategoria-${document.querySelector('#categoria').value.toLowerCase()}`);
    if (subcategoriaSelect) subcategoriaSelect.disabled = false;
    document.querySelector('#icono-producto').disabled = false;
    manejarCambioCategoria();
    manejarCambioUnidad();
  }

  // Manejar cambio de categoría
  function manejarCambioCategoria() {
    const categoria = document.querySelector('#categoria').value.toLowerCase();
    document.querySelectorAll('.form-campo[id^="subcategoria-"]').forEach(el => {
      el.style.display = 'none';
      const select = el.querySelector('select');
      if (select) select.value = '';
    });
    const subcategoriaCampo = document.querySelector(`#subcategoria-${categoria}`);
    if (subcategoriaCampo) {
      subcategoriaCampo.style.display = 'block';
    }
  }

  // Manejar cambio de unidad
  function manejarCambioUnidad() {
    const unidad = document.querySelector('#unidad').value;
    document.querySelector('#cantidad-packs').style.display = unidad === 'pack' ? 'block' : 'none';
    document.querySelector('#unidades-por-pack').style.display = unidad === 'pack' ? 'block' : 'none';
    document.querySelector('#cantidad-docenas').style.display = unidad === 'docena' ? 'block' : 'none';
    actualizarCantidadTotal();
  }

  // Actualizar cantidad total
  function actualizarCantidadTotal() {
    const unidad = document.querySelector('#unidad').value;
    let totalUnidades = 0;
    const unidadesSueltas = parseInt(document.querySelector('#unidadesSueltas').value) || 0;

    if (unidad === 'pack') {
      const packs = parseInt(document.querySelector('#packs').value) || 0;
      const unidadesPorPack = parseInt(document.querySelector('#unidadesPorPack').value) || 0;
      totalUnidades = (packs * unidadesPorPack) + unidadesSueltas;
    } else if (unidad === 'docena') {
      const docenas = parseInt(document.querySelector('#docenas').value) || 0;
      totalUnidades = (docenas * 12) + unidadesSueltas;
    } else if (unidad === 'kilo') {
      totalUnidades = unidadesSueltas;
    } else {
      totalUnidades = unidadesSueltas;
    }

    document.querySelector('#cantidad-total').value = totalUnidades;
  }

  // Calcular precio final
  function calcularPrecioFinal() {
    const precioLista = parseFloat(document.querySelector('#precio-lista').value) || 0;
    const porcentajeGanancia = parseFloat(document.querySelector('#porcentaje-ganancia').value) || 0;
    const precioFinal = precioLista * (1 + porcentajeGanancia / 100);
    document.querySelector('#precio-final').value = precioFinal.toFixed(2);
  }

  // Eventos del formulario
  document.querySelector('#categoria').addEventListener('change', manejarCambioCategoria);
  document.querySelector('#unidad').addEventListener('change', manejarCambioUnidad);
  document.querySelector('#packs').addEventListener('input', actualizarCantidadTotal);
  document.querySelector('#unidadesPorPack').addEventListener('input', actualizarCantidadTotal);
  document.querySelector('#docenas').addEventListener('input', actualizarCantidadTotal);
  document.querySelector('#unidadesSueltas').addEventListener('input', actualizarCantidadTotal);
  document.querySelector('#precio-lista').addEventListener('input', calcularPrecioFinal);
  document.querySelector('#porcentaje-ganancia').addEventListener('input', calcularPrecioFinal);
  document.querySelector('#cantidad-a-anadir').addEventListener('input', () => {
    if (productoEditandoIndex !== null) {
      const cantidadActual = parseInt(document.querySelector('#cantidad-actual').value) || 0;
      const cantidadAAnadir = parseInt(document.querySelector('#cantidad-a-anadir').value) || 0;
      document.querySelector('#nuevo-total').value = cantidadActual + cantidadAAnadir;
    }
  });

  // Activar/Detener escaneo
  activarEscaneoBtn.addEventListener('click', inicializarEscaneo);
  detenerEscaneoBtn.addEventListener('click', detenerEscaneo);

  // Agregar producto a la lista
  agregarProductoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const formData = new FormData(formCargarProducto);
    const producto = Object.fromEntries(formData);
    producto.cantidadUnidades = parseInt(producto.cantidadUnidades) || 0;
    producto.packs = parseInt(producto.packs) || 0;
    producto.unidadesPorPack = parseInt(producto.unidadesPorPack) || 0;
    producto.docenas = parseInt(producto.docenas) || 0;
    producto.unidadesSueltas = parseInt(producto.unidadesSueltas) || 0;
    producto.precioLista = parseFloat(producto.precioLista) || 0;
    producto.porcentajeGanancia = parseFloat(producto.porcentajeGanancia) || 0;
    producto.precioFinal = parseFloat(producto.precioFinal) || 0;
    producto.estado = 'Completo';
    producto.icono = producto.icono || 'default';

    // Manejar cantidades para productos existentes
    if (productoEditandoIndex !== null && productosEnProceso[productoEditandoIndex].cantidadUnidades !== undefined) {
      producto.cantidadUnidades = productosEnProceso[productoEditandoIndex].cantidadUnidades;
      producto.cantidadAAnadir = parseInt(document.querySelector('#cantidad-a-anadir').value) || 0;
      producto.nuevoTotal = parseInt(document.querySelector('#nuevo-total').value) || 0;
    }

    if (productoEditandoIndex !== null) {
      productosEnProceso[productoEditandoIndex] = producto;
    } else {
      const index = productosEnProceso.findIndex(p => p.codigo === producto.codigo);
      if (index !== -1) {
        productosEnProceso[index].cantidadAAnadir = (productosEnProceso[index].cantidadAAnadir || 0) + (producto.cantidadAAnadir || 1);
        productosEnProceso[index].nuevoTotal = (productosEnProceso[index].cantidadUnidades || 0) + productosEnProceso[index].cantidadAAnadir;
      } else {
        productosEnProceso.push(producto);
      }
    }

    actualizarListaProductos();
    limpiarFormulario();
    mostrarToast('Producto añadido a la lista', 'exito');

    // Reanudar escaneo si estaba activo
    if (escaneoActivo) {
      inicializarEscaneo();
    }
  });

  // Cancelar producto
  cancelarProductoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    limpiarFormulario();
    if (escaneoActivo) {
      inicializarEscaneo();
    }
  });

  // Editar/Eliminar productos de la lista
  listaProductosBody.addEventListener('click', (e) => {
    if (e.target.closest('.editar')) {
      const index = parseInt(e.target.closest('.editar').dataset.index);
      detenerEscaneo();
      cargarProductoEnFormulario(productosEnProceso[index], index);
    } else if (e.target.closest('.eliminar')) {
      const index = parseInt(e.target.closest('.eliminar').dataset.index);
      productosEnProceso.splice(index, 1);
      actualizarListaProductos();
      mostrarToast('Producto eliminado de la lista', 'exito');
    }
  });

  // Confirmar todos los productos
  confirmarTodosBtn.addEventListener('click', async () => {
    try {
      const usuarioId = localStorage.getItem('usuarioId');
      if (!usuarioId || !isValidObjectId(usuarioId)) {
        throw new Error('ID de usuario inválido. Por favor, inicia sesión nuevamente.');
      }

      for (const producto of productosEnProceso) {
        const formData = new FormData();
        formData.append('nombre', producto.nombre || '');
        formData.append('marca', producto.marca || '');
        formData.append('precioLista', producto.precioLista || 0);
        formData.append('porcentajeGanancia', producto.porcentajeGanancia || 0);
        formData.append('precioFinal', producto.precioFinal || 0);
        formData.append('categoria', producto.categoria || '');
        formData.append('subcategoria', producto.subcategoria || '');
        formData.append('unidad', producto.unidad || 'unidad');
        formData.append('fechaVencimiento', producto.fechaVencimiento || new Date().toISOString().split('T')[0]);
        formData.append('usuarioId', usuarioId);
        formData.append('codigo', producto.codigo || '');
        formData.append('packs', producto.packs || 0);
        formData.append('unidadesPorPack', producto.unidadesPorPack || 0);
        formData.append('docenas', producto.docenas || 0);
        formData.append('unidadesSueltas', producto.unidadesSueltas || 0);
        formData.append('icono', producto.icono || 'default');

        // Manejar cantidadUnidades
        if (producto.cantidadUnidades !== undefined && producto.nuevoTotal !== undefined) {
          formData.append('cantidadUnidades', producto.nuevoTotal);
        } else {
          formData.append('cantidadUnidades', producto.cantidadUnidades || 0);
        }

        const respuesta = await fetch(`${BASE_URL}/api/productos`, {
          method: 'POST',
          body: formData
        });

        if (!respuesta.ok) {
          const resultado = await respuesta.json();
          throw new Error(resultado.error || 'Error al guardar el producto');
        }
      }
      mostrarToast('Productos guardados con éxito', 'exito');
      productosEnProceso = [];
      actualizarListaProductos();
      limpiarFormulario();
    } catch (error) {
      console.error('Error al confirmar productos:', error);
      mostrarToast('Error al guardar los productos: ' + error.message, 'error');
    }
  });

  // Cancelar todo
  cancelarTodoBtn.addEventListener('click', () => {
    productosEnProceso = [];
    actualizarListaProductos();
    limpiarFormulario();
    mostrarToast('Lista de productos cancelada', 'exito');
  });

  // Inicializar estado
  manejarCambioCategoria();
  manejarCambioUnidad();
});