document.addEventListener('DOMContentLoaded', () => {
  console.log('cargar-producto-logic.js cargado');

  // Elementos del DOM
  const formCargarProducto = document.querySelector('#form-cargar-producto');
  const inputCategoria = document.querySelector('#categoria');
  const inputUnidad = document.querySelector('#unidad');
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
  const btnEscanearAhora = document.querySelector('#escanear-ahora');
  const btnCerrarCamara = document.querySelector('#cerrar-camara');
  let camaraCarga = document.querySelector('#camara-carga');
  const inputCodigo = document.querySelector('#codigo');

  // Estado para productos en proceso
  let productosEnProceso = [];

  // URL base
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

  // Ocultar elementos iniciales
  document.querySelectorAll('[id^="subcategoria-"]').forEach(el => el.style.display = 'none');
  document.querySelector('#cantidad-packs').style.display = 'none';
  document.querySelector('#unidades-por-pack').style.display = 'none';
  document.querySelector('#cantidad-docenas').style.display = 'none';

  // Verificar botón de escanear
  if (!btnEscanear || !btnEscanearAhora || !btnCerrarCamara) {
    console.error('Botones de escaneo no encontrados.');
    mostrarToast('Error: Botones de escaneo no encontrados.', 'error');
    return;
  }
  console.log('Botones encontrados:', btnEscanear, btnEscanearAhora, btnCerrarCamara);

  // Función para limpiar eventos del contenedor
  function limpiarEventosContenedor() {
    if (camaraCarga) {
      const clone = camaraCarga.cloneNode(true);
      camaraCarga.parentNode.replaceChild(clone, camaraCarga);
      camaraCarga = clone;
      console.log('Eventos del contenedor limpiados.');
    }
  }

  // Función para recrear el contenedor de la cámara
  function recrearContenedorCamara() {
    try {
      const oldContainer = document.querySelector('#camara-carga');
      if (!oldContainer || !oldContainer.parentNode) {
        console.error('Contenedor de cámara no encontrado.');
        return false;
      }
      const parent = oldContainer.parentNode;
      const newContainer = document.createElement('div');
      newContainer.id = 'camara-carga';
      newContainer.className = 'camara';
      newContainer.style.display = 'none';
      const guia = document.createElement('div');
      guia.className = 'guia-codigo';
      newContainer.appendChild(guia);
      const circulo = document.createElement('svg');
      circulo.id = 'circulo-progreso';
      circulo.setAttribute('width', '30');
      circulo.setAttribute('height', '30');
      circulo.style.position = 'absolute';
      circulo.style.top = '10px';
      circulo.style.right = '10px';
      circulo.innerHTML = '<circle cx="15" cy="15" r="12" stroke="#28a745" stroke-width="3" fill="none" stroke-dasharray="75.4" stroke-dashoffset="75.4" data-progress="0"></circle>';
      newContainer.appendChild(circulo);
      parent.replaceChild(newContainer, oldContainer);
      camaraCarga = newContainer;
      console.log('Contenedor de cámara recreado.');
      return true;
    } catch (error) {
      console.error('Error al recrear contenedor:', error);
      return false;
    }
  }

  // Función para mostrar subcategoría
  function mostrarSubcategoria(categoria) {
    document.querySelectorAll('[id^="subcategoria-"]').forEach(el => el.style.display = 'none');
    if (categoria) {
      const subcategoriaElement = document.querySelector(`#subcategoria-${categoria}`);
      if (subcategoriaElement) {
        subcategoriaElement.style.display = 'block';
        console.log('Mostrando subcategoría:', subcategoriaElement.id);
      }
    }
  }

  // Eventos para categoría y unidad
  inputCategoria.addEventListener('change', () => {
    const categoria = inputCategoria.value;
    console.log('Categoría seleccionada:', categoria);
    mostrarSubcategoria(categoria);
  });

  inputUnidad.addEventListener('change', () => {
    const unidad = inputUnidad.value;
    console.log('Unidad seleccionada:', unidad);
    document.querySelector('#cantidad-packs').style.display = unidad === 'pack' ? 'block' : 'none';
    document.querySelector('#unidades-por-pack').style.display = unidad === 'pack' ? 'block' : 'none';
    document.querySelector('#cantidad-docenas').style.display = unidad === 'docena' ? 'block' : 'none';
    actualizarCantidadTotal();
  });

  // Actualizar cantidad total
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

  // Calcular precio final
  [inputPrecioLista, inputPorcentajeGanancia].forEach(input => {
    input.addEventListener('input', () => {
      const precioLista = parseFloat(inputPrecioLista.value) || 0;
      const porcentajeGanancia = parseFloat(inputPorcentajeGanancia.value) || 0;
      const precioFinal = precioLista * (1 + porcentajeGanancia / 100);
      inputPrecioFinal.value = precioFinal.toFixed(2);
    });
  });

  // Manejar el formulario
  btnAgregarProducto.addEventListener('click', () => {
    const formData = new FormData(formCargarProducto);
    const data = Object.fromEntries(formData);

    if (!data.nombre || !data.marca || !data.categoria || !data.unidad || !data.fechaVencimiento) {
      mostrarToast('Completa todos los campos requeridos.', 'error');
      return;
    }

    const cantidadTotal = parseInt(inputCantidadTotal.value) || 0;
    if (cantidadTotal <= 0) {
      mostrarToast('La cantidad total debe ser mayor que 0.', 'error');
      return;
    }

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

    if (producto.codigo) {
      fetch(`${BASE_URL}/api/productos/codigo/${producto.codigo}?usuarioId=${localStorage.getItem('usuarioId')}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(result => {
          if (result.producto) {
            mostrarToast(`Producto ya en stock. Redirigiendo a <a href="/public/stock.html?codigo=${producto.codigo}">Stock</a>.`, 'info');
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
            mostrarToast('Producto agregado a la lista.', 'success');
          }
        })
        .catch(err => {
          console.error('Error al verificar producto:', err);
          mostrarToast('Error al verificar producto: ' + err.message, 'error');
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
      mostrarToast('Producto agregado a la lista.', 'success');
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

  // Actualizar tabla de productos
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

  // Confirmar producto
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

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      mostrarToast(result.mensaje || 'Producto confirmado.', 'success');
      productosEnProceso.splice(index, 1);
      actualizarTablaProductos();
    } catch (error) {
      console.error('Error al confirmar:', error);
      mostrarToast('Error al confirmar: ' + error.message, 'error');
      producto.estado = 'Pendiente';
      actualizarTablaProductos();
    }
  }

  // Eliminar producto
  function eliminarProducto(index) {
    productosEnProceso.splice(index, 1);
    actualizarTablaProductos();
    mostrarToast('Producto eliminado.', 'info');
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
      mostrarToast('No hay productos pendientes.', 'info');
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

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await response.json();
      }

      productosEnProceso = productosEnProceso.filter(p => p.estado !== 'Confirmado');
      actualizarTablaProductos();
      mostrarToast('Productos confirmados.', 'success');
    } catch (error) {
      console.error('Error al confirmar:', error);
      mostrarToast('Error al confirmar: ' + error.message, 'error');
      productosPendientes.forEach(p => p.estado = 'Pendiente');
      actualizarTablaProductos();
    }
  });

  // Cancelar todos los productos
  btnCancelarTodo.addEventListener('click', () => {
    productosEnProceso = [];
    actualizarTablaProductos();
    mostrarToast('Lista de productos limpiada.', 'info');
  });

  // Callback para autocompletar formulario
  const completarCallback = (producto) => {
    if (producto) {
      console.log('Producto detectado:', producto);
      fetch(`${BASE_URL}/api/productos/codigo/${producto.codigo}?usuarioId=${localStorage.getItem('usuarioId')}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(result => {
          if (result.producto) {
            mostrarToast(`Producto ya en stock. Redirigiendo a <a href="/public/stock.html?codigo=${producto.codigo}">Stock</a>.`, 'info');
            setTimeout(() => {
              window.location.href = `/public/stock.html?codigo=${producto.codigo}`;
            }, 3000);
          } else {
            console.log('Autocompletando formulario:', producto);
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
          console.error('Error al verificar:', err);
          mostrarToast('Error al verificar: ' + err.message, 'error');
        });
    } else {
      console.log('Producto no encontrado.');
      mostrarToast('Producto no encontrado. Ingresa los datos manualmente.', 'info');
    }
  };

  // Iniciar escáner
  let escaner = null;

  async function intentarInicializarEscanner(reintentosRestantes = 2) {
    if (reintentosRestantes <= 0) {
      console.error('Máximo de reintentos alcanzado.');
      mostrarToast('Error: No se pudo inicializar el escáner.', 'error');
      escaner = null;
      return;
    }

    console.log('Intentando inicializar escáner, reintentos:', reintentosRestantes);
    try {
      if (typeof ZXing === 'undefined') {
        console.error('ZXing no está cargado.');
        mostrarToast('Error: Librería ZXing no cargada.', 'error');
        return;
      }

      const permissionStatus = await navigator.permissions.query({ name: 'camera' });
      console.log('Estado de permiso de cámara:', permissionStatus.state);
      if (permissionStatus.state === 'denied') {
        mostrarToast('Permiso de cámara denegado. Habilítalo en la configuración.', 'error');
        return;
      }

      if (!document.querySelector('#camara-carga') || !recrearContenedorCamara()) {
        console.error('Fallo al recrear contenedor.');
        intentarInicializarEscanner(reintentosRestantes - 1);
        return;
      }

      limpiarEventosContenedor();

      if (escaner) {
        console.log('Reiniciando escáner existente.');
        escaner.detener();
        await new Promise(resolve => setTimeout(resolve, 7000));
        escaner.reset();
        escaner = null;
      }

      escaner = iniciarEscaneoContinuo(
        camaraCarga,
        btnEscanear,
        btnEscanearAhora,
        btnCerrarCamara,
        inputCodigo,
        completarCallback
      );
      const success = await escaner.inicializar();
      if (!success) {
        console.error('Fallo al inicializar, reintentando...');
        intentarInicializarEscanner(reintentosRestantes - 1);
      } else {
        console.log('Escáner inicializado correctamente.');
      }
    } catch (error) {
      console.error('Error al iniciar:', error.name, error.message);
      mostrarToast('Error al iniciar: ' + error.message, 'error');
      intentarInicializarEscanner(reintentosRestantes - 1);
    }
  }

  // Iniciar el escáner al cargar la página
  if (typeof ZXing === 'undefined') {
    console.error('ZXing no está cargado al iniciar.');
    mostrarToast('Error: No se pudo cargar la librería de escaneo.', 'error');
  } else {
    console.log('ZXing cargado, iniciando escáner...');
    intentarInicializarEscanner();
  }
});