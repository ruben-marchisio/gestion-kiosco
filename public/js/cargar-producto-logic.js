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
  const cargarImagenBtn = document.querySelector('#cargar-imagen');
  const tomarFotoBtn = document.querySelector('#tomar-foto');
  const imagenInput = document.querySelector('#imagen');
  const vistaPreviaImagen = document.querySelector('#vista-previa-imagen');
  const imagenPrevia = document.querySelector('#imagen-previa');
  const eliminarImagenBtn = document.querySelector('#eliminar-imagen');
  const agregarProductoBtn = document.querySelector('#agregar-producto');
  const cancelarProductoBtn = document.querySelector('#cancelar-producto');
  const toastContainer = document.querySelector('#toast-container');

  // Variables globales
  let productosEnProceso = [];
  let escaneoActivo = false;
  let productoEditandoIndex = null;
  let ultimoCodigoEscaneado = null;
  let ultimoEscaneoTiempo = 0;
  const DEBOUNCE_TIME = 1000; // 1 segundo de debounce

  // Construcción de la URL base
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

  // Crear sonido de escaneo
  const sonidoEscaneo = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');

  // Función para mostrar toasts
  function mostrarToast(mensaje, tipo) {
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.textContent = mensaje;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // Inicializar QuaggaJS
  function inicializarEscaneo() {
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: camaraCarga,
        constraints: {
          facingMode: "environment"
        }
      },
      decoder: {
        readers: ["ean_reader", "code_128_reader"]
      }
    }, (err) => {
      if (err) {
        console.error('Error al inicializar Quagga:', err);
        mostrarToast('Error al iniciar el escáner', 'error');
        return;
      }
      Quagga.start();
      escaneoActivo = true;
      activarEscaneoBtn.style.display = 'none';
      detenerEscaneoBtn.style.display = 'inline-block';
      camaraCarga.style.display = 'block';
    });

    Quagga.onDetected((result) => {
      const codigo = result.codeResult.code;
      const ahora = Date.now();

      // Evitar múltiples escaneos con debounce
      if (ultimoCodigoEscaneado === codigo && (ahora - ultimoEscaneoTiempo) < DEBOUNCE_TIME) {
        return;
      }

      ultimoCodigoEscaneado = codigo;
      ultimoEscaneoTiempo = ahora;

      // Reproducir sonido de escaneo
      sonidoEscaneo.play().catch(err => console.error('Error al reproducir sonido:', err));

      document.querySelector('#codigo').value = codigo;
      buscarProductoPorCodigo(codigo);
    });
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
      const respuesta = await fetch(`${BASE_URL}/api/productos/codigo/${codigo}`);
      const resultado = await respuesta.json();

      if (respuesta.ok) {
        // Producto existente
        const producto = resultado.producto;
        mostrarToast(`Producto encontrado: ${producto.nombre}`, 'exito');
        agregarProductoALista(producto, false);
      } else {
        // Producto nuevo
        mostrarToast('Producto nuevo añadido, completar datos', 'exito');
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
    listaProductosBody.innerHTML = '';
    productosEnProceso.forEach((producto, index) => {
      const tr = document.createElement('tr');
      tr.className = producto.estado.toLowerCase();
      tr.innerHTML = `
        <td>${producto.codigo}</td>
        <td>${producto.nombre || 'N/A'}</td>
        <td>${producto.marca || 'N/A'}</td>
        <td>${producto.categoria || 'N/A'}</td>
        <td>
          ${producto.cantidadUnidades ? `Actual: ${producto.cantidadUnidades}, Añadir: ${producto.cantidadAAnadir}, Total: ${producto.nuevoTotal}` : producto.cantidadAAnadir}
        </td>
        <td class="estado">${producto.estado}</td>
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
    
    // Mostrar campos de cantidad existente
    if (producto.cantidadUnidades !== undefined) {
      document.querySelectorAll('.cantidad-existente').forEach(el => el.style.display = 'block');
      document.querySelector('#cantidad-actual').value = producto.cantidadUnidades;
      document.querySelector('#cantidad-a-anadir').value = producto.cantidadAAnadir || 0;
      document.querySelector('#nuevo-total').value = producto.nuevoTotal || producto.cantidadUnidades;
    } else {
      document.querySelectorAll('.cantidad-existente').forEach(el => el.style.display = 'none');
    }

    // Manejar imagen
    if (producto.imagen) {
      imagenPrevia.src = producto.imagen;
      vistaPreviaImagen.style.display = 'block';
    } else {
      vistaPreviaImagen.style.display = 'none';
    }

    agregarProductoBtn.textContent = 'Actualizar Producto';
  }

  // Limpiar formulario
  function limpiarFormulario() {
    formCargarProducto.reset();
    document.querySelectorAll('.cantidad-existente').forEach(el => el.style.display = 'none');
    vistaPreviaImagen.style.display = 'none';
    productoEditandoIndex = null;
    agregarProductoBtn.textContent = 'Agregar Producto';
    manejarCambioCategoria();
    manejarCambioUnidad();
  }

  // Manejar cambio de categoría
  function manejarCambioCategoria() {
    const categoria = document.querySelector('#categoria').value.toLowerCase();
    document.querySelectorAll('.form-campo[id^="subcategoria-"]').forEach(el => {
      el.style.display = 'none';
      const select = el.querySelector('select');
      if (select) select.value = ''; // Resetear subcategoría
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
    document.querySelector('#unidadesSueltas').style.display = unidad !== 'pack' && unidad !== 'docena' ? 'block' : 'none';
    actualizarCantidadTotal();
  }

  // Actualizar cantidad total
  function actualizarCantidadTotal() {
    const unidad = document.querySelector('#unidad').value;
    let totalUnidades = 0;
    if (unidad === 'pack') {
      const packs = parseInt(document.querySelector('#packs').value) || 0;
      const unidadesPorPack = parseInt(document.querySelector('#unidadesPorPack').value) || 0;
      totalUnidades = packs * unidadesPorPack;
    } else if (unidad === 'docena') {
      const docenas = parseInt(document.querySelector('#docenas').value) || 0;
      totalUnidades = docenas * 12;
    } else {
      totalUnidades = parseInt(document.querySelector('#unidadesSueltas').value) || 0;
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

  // Manejar carga de imagen
  cargarImagenBtn.addEventListener('click', () => {
    imagenInput.removeAttribute('capture');
    imagenInput.click();
  });

  tomarFotoBtn.addEventListener('click', () => {
    imagenInput.setAttribute('capture', 'environment');
    imagenInput.click();
  });

  imagenInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        imagenPrevia.src = event.target.result;
        vistaPreviaImagen.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  eliminarImagenBtn.addEventListener('click', () => {
    imagenInput.value = '';
    vistaPreviaImagen.style.display = 'none';
  });

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

    // Manejar imagen
    if (imagenInput.files[0]) {
      producto.imagenFile = imagenInput.files[0];
      producto.imagen = imagenPrevia.src;
    } else {
      producto.imagenFile = null;
      producto.imagen = null;
    }

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
      Quagga.start();
    }
  });

  // Cancelar producto
  cancelarProductoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    limpiarFormulario();
    if (escaneoActivo) {
      Quagga.start();
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
      for (const producto of productosEnProceso) {
        const formData = new FormData();
        formData.append('nombre', producto.nombre);
        formData.append('marca', producto.marca);
        formData.append('precioLista', producto.precioLista);
        formData.append('porcentajeGanancia', producto.porcentajeGanancia);
        formData.append('precioFinal', producto.precioFinal);
        formData.append('categoria', producto.categoria);
        formData.append('subcategoria', producto.subcategoria || '');
        formData.append('unidad', producto.unidad);
        formData.append('fechaVencimiento', producto.fechaVencimiento);
        formData.append('usuarioId', localStorage.getItem('usuarioId') || 'default');
        formData.append('codigo', producto.codigo || '');
        formData.append('packs', producto.packs || 0);
        formData.append('unidadesPorPack', producto.unidadesPorPack || 0);
        formData.append('docenas', producto.docenas || 0);
        formData.append('unidadesSueltas', producto.unidadesSueltas || 0);
        if (producto.cantidadUnidades !== undefined) {
          formData.append('cantidadUnidades', producto.nuevoTotal);
        } else {
          formData.append('cantidadUnidades', producto.cantidadUnidades || 0);
        }
        if (producto.imagenFile) {
          formData.append('imagen', producto.imagenFile);
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