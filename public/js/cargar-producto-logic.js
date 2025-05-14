// public/js/cargar-producto-logic.js

// Este script gestiona el escaneo de códigos y la carga de productos con mensajes únicos.
// Requiere que utils.js exponga la función global mostrarToast() y, opcionalmente, una función iniciarEscaneoContinuo().

document.addEventListener('DOMContentLoaded', () => {
  console.log('cargar-producto-logic.js cargado');

  // Elementos del DOM
  const formCargarProducto     = document.querySelector('#form-cargar-producto');
  const inputCodigo            = document.querySelector('#codigo');
  const inputNombre            = document.querySelector('#nombre');
  const inputMarca             = document.querySelector('#marca');
  const inputCategoria         = document.querySelector('#categoria');
  const inputUnidad            = document.querySelector('#unidad');
  const inputPacks             = document.querySelector('#packs');
  const inputUnidadesPorPack   = document.querySelector('#unidadesPorPack');
  const inputDocenas           = document.querySelector('#docenas');
  const inputUnidadesSueltas   = document.querySelector('#unidadesSueltas');
  const inputCantidadTotal     = document.querySelector('#cantidad-total');
  const inputPrecioLista       = document.querySelector('#precio-lista');
  const inputPorcentajeGanancia= document.querySelector('#porcentaje-ganancia');
  const inputPrecioFinal       = document.querySelector('#precio-final');
  const inputFechaVencimiento  = document.querySelector('#fecha-vencimiento');
  const inputIconoProducto     = document.querySelector('#icono-producto');

  const btnAgregarProducto     = document.querySelector('#agregar-producto');
  const btnCancelarProducto    = document.querySelector('#cancelar-producto');
  const btnConfirmarTodos      = document.querySelector('#confirmar-todos');
  const btnCancelarTodo        = document.querySelector('#cancelar-todo');

  const btnEscanear            = document.querySelector('#escanear');
  const btnEscanearAhora       = document.querySelector('#escanear-ahora');
  const btnCerrarCamara        = document.querySelector('#cerrar-camara');
  let camaraCarga              = document.querySelector('#camara-carga');

  const tablaProductosProceso  = document.querySelector('#lista-productos-body');
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

  let productosEnProceso = [];
  let escaner = null;

  // Ocultar inicialmente subcategorías y campos de unidades
  document.querySelectorAll('[id^="subcategoria-"]').forEach(el => el.style.display = 'none');
  ['#cantidad-packs','#unidades-por-pack','#cantidad-docenas'].forEach(sel => document.querySelector(sel).style.display='none');

  // Verificar botones de escaneo
  if (!btnEscanear || !btnEscanearAhora || !btnCerrarCamara) {
    console.error('Botones de escaneo no encontrados.');
    mostrarToast('Error interno: botones de escaneo no encontrados.', 'error');
    return;
  }

  // Función para recrear contenedor de cámara
  function recrearContenedorCamara() {
    try {
      const old = document.querySelector('#camara-carga');
      if (!old || !old.parentNode) return false;
      const parent = old.parentNode;
      const nuevo = document.createElement('div');
      nuevo.id = 'camara-carga';
      nuevo.className = 'camara';
      nuevo.style.display = 'none';
      nuevo.innerHTML = `
        <div class="guia-codigo"></div>
        <svg id="circulo-progreso" width="30" height="30" style="position:absolute;top:10px;right:10px;">
          <circle cx="15" cy="15" r="12" stroke="#00ddeb" stroke-width="3"
                  fill="none" stroke-dasharray="75.4" stroke-dashoffset="75.4" data-progress="0" />
        </svg>`;
      parent.replaceChild(nuevo, old);
      camaraCarga = nuevo;
      return true;
    } catch (error) {
      console.error('Error al recrear contenedor:', error);
      return false;
    }
  }

  // Limpiar eventos del contenedor
  function limpiarEventosContenedor() {
    if (camaraCarga?.parentNode) {
      const clone = camaraCarga.cloneNode(true);
      camaraCarga.parentNode.replaceChild(clone, camaraCarga);
      camaraCarga = clone;
    }
  }

  // Mostrar/ocultar subcategorías
  inputCategoria.addEventListener('change', () => {
    document.querySelectorAll('[id^="subcategoria-"]').forEach(el => el.style.display = 'none');
    const cat = inputCategoria.value;
    const subEl = document.querySelector(`#subcategoria-${cat}`);
    if (subEl) subEl.style.display='block';
  });

  // Mostrar campos según unidad
  inputUnidad.addEventListener('change', () => {
    const u = inputUnidad.value;
    document.querySelector('#cantidad-packs').style.display = u==='pack' ? 'block' : 'none';
    document.querySelector('#unidades-por-pack').style.display = u==='pack'? 'block':'none';
    document.querySelector('#cantidad-docenas').style.display = u==='docena'?'block':'none';
    actualizarCantidadTotal();
  });

  // Calcular cantidad total
  [inputPacks,inputUnidadesPorPack,inputDocenas,inputUnidadesSueltas].forEach(i=>i.addEventListener('input', actualizarCantidadTotal));
  function actualizarCantidadTotal() {
    const packs       = parseInt(inputPacks.value)||0;
    const upack       = parseInt(inputUnidadesPorPack.value)||0;
    const docenas     = parseInt(inputDocenas.value)||0;
    const sueltas     = parseInt(inputUnidadesSueltas.value)||0;
    inputCantidadTotal.value = (packs*upack)+(docenas*12)+sueltas;
  }

  // Calcular precio final
  [inputPrecioLista,inputPorcentajeGanancia].forEach(i=>i.addEventListener('input',()=>{
    const pl = parseFloat(inputPrecioLista.value)||0;
    const pg = parseFloat(inputPorcentajeGanancia.value)||0;
    inputPrecioFinal.value = (pl*(1+pg/100)).toFixed(2);
  }));

  // Manejo del formulario de carga
  btnAgregarProducto.addEventListener('click', async ()=>{
    // Campos obligatorios
    if (!inputNombre.value.trim() || !inputMarca.value.trim() || !inputCategoria.value || !inputUnidad.value || !inputFechaVencimiento.value) {
      mostrarToast('Completa todos los campos requeridos.', 'error');
      return;
    }
    if ((parseInt(inputCantidadTotal.value)||0) <= 0) {
      mostrarToast('La cantidad total debe ser mayor que cero.', 'error');
      return;
    }
    // Construir objeto
    const producto = {
      codigo:             inputCodigo.value.trim(),
      nombre:             inputNombre.value.trim(),
      marca:              inputMarca.value.trim(),
      categoria:          inputCategoria.value,
      subcategoria:       document.querySelector(`#subcategoria-${inputCategoria.value}`)?.value||'',
      precioLista:        parseFloat(inputPrecioLista.value)||0,
      porcentajeGanancia: parseFloat(inputPorcentajeGanancia.value)||0,
      precioFinal:        parseFloat(inputPrecioFinal.value)||0,
      unidad:             inputUnidad.value,
      packs:              parseInt(inputPacks.value)||0,
      unidadesPorPack:    parseInt(inputUnidadesPorPack.value)||0,
      docenas:            parseInt(inputDocenas.value)||0,
      unidadesSueltas:    parseInt(inputUnidadesSueltas.value)||0,
      cantidadUnidades:   parseInt(inputCantidadTotal.value)||0,
      fechaVencimiento:   inputFechaVencimiento.value,
      icono:              inputIconoProducto?.value||'default',
      estado:             'Pendiente'
    };

    try {
      // Verificar existencia en stock
      if (producto.codigo) {
        const res = await fetch(`${BASE_URL}/api/productos/codigo/${producto.codigo}?usuarioId=${localStorage.getItem('usuarioId')}`);
        if (res.ok) {
          const { producto: existe } = await res.json();
          if (existe) {
            mostrarToast('Producto ya en tu inventario. Redirigiendo a stock.', 'info');
            setTimeout(()=>location.href = '/public/stock.html', 800);
            return;
          }
        }
      }
      // Agregar a lista de proceso
      productosEnProceso.push(producto);
      actualizarTablaProductos();
      formCargarProducto.reset();
      inputPrecioFinal.value = '';
      document.querySelectorAll('[id^="subcategoria-"]').forEach(el=>el.style.display='none');
      ['#cantidad-packs','#unidades-por-pack','#cantidad-docenas'].forEach(sel=>document.querySelector(sel).style.display='none');
      mostrarToast('Producto agregado a la lista.', 'success');
    } catch(err) {
      console.error('Error al agregar producto:', err);
      mostrarToast('Error al verificar producto: '+ err.message, 'error');
    }
  });

  // Cancelar formulario
  btnCancelarProducto.addEventListener('click', ()=>{
    formCargarProducto.reset();
    inputPrecioFinal.value='';
    document.querySelectorAll('[id^="subcategoria-"]').forEach(el=>el.style.display='none');
    ['#cantidad-packs','#unidades-por-pack','#cantidad-docenas'].forEach(sel=>document.querySelector(sel).style.display='none');
  });

  // Actualizar tabla de productos en proceso
  function actualizarTablaProductos() {
    tablaProductosProceso.innerHTML = '';
    productosEnProceso.forEach((p,i)=>{
      const tr = document.createElement('tr');
      tr.className = p.estado==='Pendiente'?'pendiente':'completo';
      tr.innerHTML = `
        <td class="p-3">${p.nombre}</td>
        <td class="p-3">${p.cantidadUnidades}</td>
        <td class="acciones p-3">
          <button class="confirmar-producto" data-index="${i}"><i class="fas fa-check"></i></button>
          <button class="eliminar-producto" data-index="${i}"><i class="fas fa-trash-alt"></i></button>
        </td>`;
      tablaProductosProceso.appendChild(tr);
    });
    document.querySelectorAll('.confirmar-producto').forEach(btn=>btn.addEventListener('click',e=>confirmarProducto(+e.currentTarget.dataset.index)));
    document.querySelectorAll('.eliminar-producto').forEach(btn=>btn.addEventListener('click',e=>eliminarProducto(+e.currentTarget.dataset.index)));
  }

  // Confirmar un producto
  async function confirmarProducto(idx) {
    const p = productosEnProceso[idx];
    try {
      const res = await fetch(`${BASE_URL}/api/productos`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ...p, usuarioId: localStorage.getItem('usuarioId') })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { mensaje } = await res.json();
      mostrarToast(mensaje||'Producto confirmado.', 'success');
      productosEnProceso.splice(idx,1);
      actualizarTablaProductos();
    } catch(err) {
      console.error('Error al confirmar:', err);
      mostrarToast('Error al confirmar: '+err.message, 'error');
    }
  }

  // Eliminar producto de la lista
  function eliminarProducto(idx) {
    productosEnProceso.splice(idx,1);
    actualizarTablaProductos();
    mostrarToast('Producto eliminado.', 'info');
  }

  // Confirmar todos los productos
  btnConfirmarTodos.addEventListener('click', async ()=>{
    if (!productosEnProceso.length) {
      mostrarToast('No hay productos para confirmar.', 'info');
      return;
    }
    try {
      for (const p of productosEnProceso) {
        await fetch(`${BASE_URL}/api/productos`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ ...p, usuarioId: localStorage.getItem('usuarioId') })
        });
      }
      productosEnProceso = [];
      actualizarTablaProductos();
      mostrarToast('Todos los productos confirmados.', 'success');
    } catch(err) {
      console.error('Error al confirmar todos:', err);
      mostrarToast('Error en confirmar todos: '+err.message, 'error');
    }
  });

  // Cancelar todos los productos
  btnCancelarTodo.addEventListener('click', ()=>{
    productosEnProceso = [];
    actualizarTablaProductos();
    mostrarToast('Lista de productos vaciada.', 'info');
  });

  // Completar formulario desde base común
  function completarCallback(producto) {
    if (!producto) {
      mostrarToast('Producto no encontrado. Ingresa los datos manualmente.', 'info');
      return;
    }
    mostrarToast('Autocompletando formulario.', 'info');
    inputNombre.value     = producto.nombre || '';
    inputMarca.value      = producto.marca || '';
    inputCategoria.value  = producto.categoria || '';
    inputCategoria.dispatchEvent(new Event('change'));
    document.querySelector(`#subcategoria-${producto.categoria}`)?.value = producto.subcategoria || '';
    inputPrecioLista.value= producto.precioLista || '';
    inputPorcentajeGanancia.value = producto.porcentajeGanancia || '';
    inputPrecioFinal.value= producto.precioFinal || '';
    inputUnidad.value     = producto.unidad    || 'unidad';
    inputUnidad.dispatchEvent(new Event('change'));
    inputPacks.value      = producto.packs     || 0;
    inputUnidadesPorPack.value = producto.unidadesPorPack || 0;
    inputDocenas.value    = producto.docenas   || 0;
    inputUnidadesSueltas.value = producto.unidadesSueltas || 0;
    actualizarCantidadTotal();
    inputFechaVencimiento.value = producto.fechaVencimiento ? new Date(producto.fechaVencimiento).toISOString().split('T')[0] : '';
    inputIconoProducto.value    = producto.icono   || 'default';
  }

  // Inicializar escáner con reintentos y hints TRY_HARDER
  async function intentarInicializarEscaner(intentos=5) {
    if (intentos<=0) {
      mostrarToast('No se pudo inicializar el escáner.', 'error');
      return false;
    }
    try {
      if (typeof ZXing === 'undefined') {
        mostrarToast('Error: ZXing no cargado.', 'error');
        return false;
      }
      const hintMap = new Map(); hintMap.set(ZXing.DecodeHintType.TRY_HARDER, true);
      const codeReader = new ZXing.BrowserMultiFormatReader(hintMap);
      recrearContenedorCamara(); limpiarEventosContenedor();
      camaraCarga.style.display = 'block';
      // Leer continuamente
      codeReader.decodeFromVideoDevice(null, camaraCarga, (result, err) => {
        if (result) {
          const codigo = result.getText();
          inputCodigo.value = codigo;
          completarCallback({ codigo }); // sólo dispara autocompletar
          codeReader.reset();
        }
      }).catch(() => {});
      // Botón cerrar cámara
      btnCerrarCamara.addEventListener('click', ()=>{
        codeReader.reset();
        camaraCarga.style.display = 'none';
      });
      return true;
    } catch(e) {
      console.warn('Error al inicializar escáner:', e);
      return intentarInicializarEscaner(intentos-1);
    }
  }

  // Evento para iniciar escaneo
  btnEscanear.addEventListener('click', ()=>{
    mostrarToast('Iniciando escáner...', 'info');
    intentarInicializarEscaner();
  });
});
