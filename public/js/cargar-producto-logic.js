document.addEventListener('DOMContentLoaded', () => {
  console.log('cargar-producto-logic.js cargado');
  /* Propósito: Inicializa el script cuando cargar-producto.html está cargado */
  /* Imprime un mensaje en la consola para confirmar la carga del script */

  /* Selección de elementos del DOM */
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
  /* Propósito: Obtiene referencias a elementos clave del formulario, tabla, y escáner */
  /* Incluye inputs, selectores, botones, y el contenedor de la cámara para gestionar productos y escaneo */

  /* Estado para manejar productos en proceso */
  let productosEnProceso = [];
  /* Propósito: Almacena temporalmente los productos antes de confirmarlos en el backend */

  /* Construcción de la URL base */
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;
  /* Propósito: Crea una URL base dinámica (por ejemplo, http://localhost o https://gestion-kiosco.vercel.app) */
  /* Evita hardcodear el puerto para mayor portabilidad */

  /* Inicialización de visibilidad */
  document.querySelectorAll('[id^="subcategoria-"]').forEach(el => el.style.display = 'none');
  document.querySelector('#cantidad-packs').style.display = 'none';
  document.querySelector('#unidades-por-pack').style.display = 'none';
  document.querySelector('#cantidad-docenas').style.display = 'none';
  /* Propósito: Oculta inicialmente los campos de subcategorías y cantidades específicas (packs, docenas) */
  /* Asegura que solo se muestren según la selección del usuario */

  /* Función para mostrar subcategorías */
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
  /* Propósito: Muestra el campo de subcategoría correspondiente a la categoría seleccionada */
  /* Oculta todos los campos de subcategorías y muestra solo el relevante, con depuración para rastrear cambios */

  /* Evento para mostrar subcategorías */
  inputCategoria.addEventListener('change', () => {
    const categoria = inputCategoria.value;
    console.log('Categoría seleccionada:', categoria);
    mostrarSubcategoria(categoria);
  });
  /* Propósito: Actualiza la visibilidad de subcategorías al cambiar la categoría seleccionada */

  /* Evento para mostrar campos de cantidad */
  inputUnidad.addEventListener('change', () => {
    const unidad = inputUnidad.value;
    console.log('Unidad seleccionada:', unidad);
    document.querySelector('#cantidad-packs').style.display = unidad === 'pack' ? 'block' : 'none';
    document.querySelector('#unidades-por-pack').style.display = unidad === 'pack' ? 'block' : 'none';
    document.querySelector('#cantidad-docenas').style.display = unidad === 'docena' ? 'block' : 'none';
    actualizarCantidadTotal();
  });
  /* Propósito: Muestra u oculta campos de cantidad (packs, unidades por pack, docenas) según la unidad seleccionada */
  /* Actualiza la cantidad total al cambiar la unidad */

  /* Actualización de cantidad total */
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
  /* Propósito: Calcula y actualiza la cantidad total de unidades */
  /* Suma packs (multiplicados por unidades por pack), docenas (x12), y unidades sueltas */

  /* Cálculo de precio final */
  [inputPrecioLista, inputPorcentajeGanancia].forEach(input => {
    input.addEventListener('input', () => {
      const precioLista = parseFloat(inputPrecioLista.value) || 0;
      const porcentajeGanancia = parseFloat(inputPorcentajeGanancia.value) || 0;
      const precioFinal = precioLista * (1 + porcentajeGanancia / 100);
      inputPrecioFinal.value = precioFinal.toFixed(2);
    });
  });
  /* Propósito: Calcula el precio final basado en el precio de lista y el porcentaje de ganancia */
  /* Actualiza el campo precio-final con dos decimales */

  /* Agregar producto a la lista en proceso */
  btnAgregarProducto.addEventListener('click', () => {
    const formData = new FormData(formCargarProducto);
    const data = Object.fromEntries(formData);
    /* Recoge los datos del formulario */

    if (!data.nombre || !data.marca || !data.categoria || !data.unidad || !data.fechaVencimiento) {
      mostrarToast('Por favor, completa todos los campos requeridos.', 'error');
      return;
    }
    const cantidadTotal = parseInt(inputCantidadTotal.value) || 0;
    if (cantidadTotal <= 0) {
      mostrarToast('La cantidad total debe ser mayor que 0.', 'error');
      return;
    }
    /* Valida que los campos requeridos estén completos y la cantidad sea válida */

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
    /* Crea un objeto con los datos del producto, incluyendo valores predeterminados */

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
    /* Propósito: Agrega un producto a la lista temporal */
    /* Verifica si el producto ya existe en el stock (si tiene código) */
    /* Si existe, redirige a stock.html; si no, lo añade a productosEnProceso, actualiza la tabla, y limpia el formulario */
  });

  /* Cancelar producto */
  btnCancelarProducto.addEventListener('click', () => {
    formCargarProducto.reset();
    inputPrecioFinal.value = '';
    document.querySelectorAll('[id^="subcategoria-"]').forEach(el => el.style.display = 'none');
    document.querySelector('#cantidad-packs').style.display = 'none';
    document.querySelector('#unidades-por-pack').style.display = 'none';
    document.querySelector('#cantidad-docenas').style.display = 'none';
  });
  /* Propósito: Limpia el formulario y restablece la visibilidad de campos */

  /* Actualizar la tabla de productos en proceso */
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
  /* Propósito: Actualiza la tabla de productos en proceso */
  /* Genera filas con datos de productos, aplicando clases según el estado (pendiente, confirmado) */
  /* Añade eventos a botones de confirmar y eliminar */

  /* Confirmar un producto individual */
  async function confirmarProducto(index) {
    const producto = productosEnProceso[index];
    producto.estado = 'Confirmado';
    try {
      const usuarioId = localStorage.getItem('usuarioId');
      const response = await fetch(`${BASE_URL}/api/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  /* Propósito: Envía un producto al backend para guardarlo */
  /* Marca el producto como confirmado, hace una solicitud POST, y actualiza la tabla */
  /* Maneja errores restaurando el estado pendiente si falla */

  /* Eliminar un producto */
  function eliminarProducto(index) {
    productosEnProceso.splice(index, 1);
    actualizarTablaProductos();
    mostrarToast('Producto eliminado de la lista.', 'info');
  }
  /* Propósito: Elimina un producto de la lista temporal y actualiza la tabla */

  /* Confirmar todos los productos */
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
          headers: { 'Content-Type': 'application/json' },
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
  /* Propósito: Envía todos los productos pendientes al backend */
  /* Marca cada producto como confirmado, hace solicitudes POST, y actualiza la tabla */
  /* Maneja errores restaurando el estado pendiente si falla */

  /* Cancelar todos los productos */
  btnCancelarTodo.addEventListener('click', () => {
    productosEnProceso = [];
    actualizarTablaProductos();
    mostrarToast('Lista de productos en proceso limpiada.', 'info');
  });
  /* Propósito: Limpia la lista de productos en proceso y actualiza la tabla */

  /* Manejo del escaneo continuo */
  btnEscanear.addEventListener('click', () => {
    const completarCallback = (producto) => {
      if (producto) {
        fetch(`${BASE_URL}/api/productos/codigo/${producto.codigo}?usuarioId=${localStorage.getItem('usuarioId')}`)
          .then(res => res.json())
          .then(result => {
            if (result.producto) {
              mostrarToast(`Este producto ya existe en tu stock. Serás redirigido a la sección de <a href="/public/stock.html?codigo=${producto.codigo}" style="color: #3498db; text-decoration: underline;">Stock</a> para modificarlo.`, 'info');
              setTimeout(() => {
                window.location.href = `/public/stock.html?codigo=${producto.codigo}`;
              }, 3000);
            } else {
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
      }
    };
    iniciarEscaneoContinuo(
      camaraCarga,
      btnEscanear,
      btnDetenerEscaneo,
      inputCodigo,
      completarCallback,
      null
    );
  });
  /* Propósito: Configura el escaneo continuo de códigos de barras */
  /* Usa iniciarEscaneoContinuo de utils.js para escanear códigos */
  /* Verifica si el código ya existe en el stock; si sí, redirige a stock.html; si no, autocompleta el formulario */
});