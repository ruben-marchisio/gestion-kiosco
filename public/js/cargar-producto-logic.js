// public/js/cargar-producto-logic.js
// Adaptación para usar utils.js iniciarEscaneoContinuo y un único flujo de toasts

document.addEventListener('DOMContentLoaded', () => {
  console.log('cargar-producto-logic.js cargado');

  // --- DOM ELEMENTS ---
  const form            = document.querySelector('#form-cargar-producto');
  const inputCodigo     = document.querySelector('#codigo');
  const inputNombre     = document.querySelector('#nombre');
  const inputMarca      = document.querySelector('#marca');
  const inputCategoria  = document.querySelector('#categoria');
  const inputUnidad     = document.querySelector('#unidad');
  const inputPacks      = document.querySelector('#packs');
  const inputUnidadesPorPack = document.querySelector('#unidadesPorPack');
  const inputDocenas    = document.querySelector('#docenas');
  const inputUnidadesSueltas = document.querySelector('#unidadesSueltas');
  const inputCantidadTotal  = document.querySelector('#cantidad-total');
  const inputPrecioLista    = document.querySelector('#precio-lista');
  const inputPorcentajeGanancia = document.querySelector('#porcentaje-ganancia');
  const inputPrecioFinal    = document.querySelector('#precio-final');
  const inputFechaVencimiento  = document.querySelector('#fecha-vencimiento');
  const inputIconoProducto     = document.querySelector('#icono');

  const btnAgregar      = document.querySelector('#agregar-producto');
  const btnCancelar     = document.querySelector('#cancelar-producto');
  const btnEscanear     = document.querySelector('#escanear');
  const btnEscanearAhora= document.querySelector('#escanear-ahora');
  const btnCerrarCamara = document.querySelector('#cerrar-camara');
  const camaraContainer = document.querySelector('#camara-carga');
  const btnConfirmarTodos = document.querySelector('#confirmar-todos');
  const btnCancelarTodo = document.querySelector('#cancelar-todo');
  const tablaBody       = document.querySelector('#lista-productos-body');

  const BASE_URL = `${location.protocol}//${location.hostname}`;

  let productosEnProceso = [];

  // --- UI INITIALIZATION ---
  // hide subcategories and unit fields
  document.querySelectorAll('[id^="subcategoria-"]').forEach(el => el.style.display = 'none');
  document.querySelector('#cantidad-packs').style.display = 'none';
  document.querySelector('#unidades-por-pack').style.display = 'none';
  document.querySelector('#cantidad-docenas').style.display = 'none';

  // --- HELPERS ---
  function actualizarCantidadTotal() {
    const packs = +inputPacks.value || 0;
    const upack = +inputUnidadesPorPack.value || 0;
    const doc  = +inputDocenas.value || 0;
    const suel = +inputUnidadesSueltas.value || 0;
    inputCantidadTotal.value = packs * upack + doc * 12 + suel;
  }
  [inputPacks, inputUnidadesPorPack, inputDocenas, inputUnidadesSueltas]
    .forEach(i => i.addEventListener('input', actualizarCantidadTotal));

  function actualizarPrecioFinal() {
    const lista = +inputPrecioLista.value || 0;
    const gan = +inputPorcentajeGanancia.value || 0;
    inputPrecioFinal.value = (lista * (1 + gan / 100)).toFixed(2);
  }
  [inputPrecioLista, inputPorcentajeGanancia]
    .forEach(i => i.addEventListener('input', actualizarPrecioFinal));

  // category / subcategory
  inputCategoria.addEventListener('change', () => {
    document.querySelectorAll('[id^="subcategoria-"]').forEach(el => el.style.display = 'none');
    const sub = document.querySelector(`#subcategoria-${inputCategoria.value}`);
    if (sub) sub.style.display = 'block';
  });
  // unit toggles
  inputUnidad.addEventListener('change', () => {
    const u = inputUnidad.value;
    document.querySelector('#cantidad-packs').style.display = u === 'pack' ? 'block': 'none';
    document.querySelector('#unidades-por-pack').style.display = u === 'pack' ? 'block': 'none';
    document.querySelector('#cantidad-docenas').style.display = u === 'docena' ? 'block': 'none';
    actualizarCantidadTotal();
  });

  function mostrarProductoEnTabla() {
    tablaBody.innerHTML = '';
    productosEnProceso.forEach((p, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.nombre}</td><td>${p.cantidadUnidades}</td>
        <td>
          <button data-i="${i}" class="confirmar">✓</button>
          <button data-i="${i}" class="eliminar">✕</button>
        </td>`;
      tablaBody.appendChild(tr);
    });
    tablaBody.querySelectorAll('.confirmar').forEach(b => b.onclick = e => confirmar(+e.target.dataset.i));
    tablaBody.querySelectorAll('.eliminar').forEach(b => b.onclick = e => eliminar(+e.target.dataset.i));
  }

  function validarCampos(producto) {
    const falt = [];
    ['nombre','marca','categoria','unidad','fechaVencimiento'].forEach(f => {
      if (!producto[f]) falt.push(f);
    });
    if (!producto.cantidadUnidades) falt.push('cantidad');
    return falt;
  }

  async function confirmar(idx) {
    const p = productosEnProceso[idx];
    try {
      const res = await fetch(`${BASE_URL}/api/productos`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ...p, usuarioId:localStorage.usuarioId })
      });
      if (!res.ok) throw new Error(res.statusText);
      mostrarToast('Producto confirmado','success');
      productosEnProceso.splice(idx,1);
      mostrarProductoEnTabla();
    } catch(err) {
      console.error(err);
      mostrarToast('Error al confirmar','error');
    }
  }
  function eliminar(idx) {
    productosEnProceso.splice(idx,1);
    mostrarProductoEnTabla();
    mostrarToast('Producto eliminado','info');
  }
  btnConfirmarTodos.addEventListener('click', async () => {
    if (!productosEnProceso.length) return mostrarToast('No hay productos','info');
    for (let i = productosEnProceso.length -1; i>=0; i--) await confirmar(i);
  });
  btnCancelarTodo.addEventListener('click', () => {
    productosEnProceso = [];
    mostrarProductoEnTabla();
    mostrarToast('Lista vaciada','info');
  });

  // --- COMPLETAR CALLBACK ---
  function completarCallback(producto) {
    if (producto) {
      inputNombre.value = producto.nombre||'';
      inputMarca.value  = producto.marca||'';
      inputCategoria.value = producto.categoria||'';
      inputCategoria.dispatchEvent(new Event('change'));
      inputPrecioLista.value = producto.precioLista||'';
      inputPorcentajeGanancia.value = producto.porcentajeGanancia||'';
      actualizarPrecioFinal();
      inputUnidad.value = producto.unidad||'unidad';
      inputUnidad.dispatchEvent(new Event('change'));
      inputPacks.value = producto.packs||0;
      inputUnidadesPorPack.value = producto.unidadesPorPack||0;
      inputDocenas.value = producto.docenas||0;
      inputUnidadesSueltas.value = producto.unidadesSueltas||0;
      actualizarCantidadTotal();
      inputFechaVencimiento.value = producto.fechaVencimiento
        ? new Date(producto.fechaVencimiento).toISOString().slice(0,10) : '';
      mostrarToast('Formulario autocompletado','success');
    } else {
      mostrarToast('Producto no encontrado','info');
    }
  }

  // --- FORM HANDLING ---
  btnAgregar.addEventListener('click', () => {
    const prod = {
      codigo: inputCodigo.value.trim(),
      nombre: inputNombre.value.trim(),
      marca: inputMarca.value.trim(),
      categoria: inputCategoria.value,
      subcategoria: document.querySelector(`#subcategoria-${inputCategoria.value}`)?.value||'',
      precioLista: +inputPrecioLista.value||0,
      porcentajeGanancia: +inputPorcentajeGanancia.value||0,
      precioFinal: +inputPrecioFinal.value||0,
      unidad: inputUnidad.value,
      packs: +inputPacks.value||0,
      unidadesPorPack: +inputUnidadesPorPack.value||0,
      docenas: +inputDocenas.value||0,
      unidadesSueltas: +inputUnidadesSueltas.value||0,
      cantidadUnidades: +inputCantidadTotal.value||0,
      fechaVencimiento: inputFechaVencimiento.value,
      icono: inputIconoProducto.value||'default'
    };
    const falt = validarCampos(prod);
    if (falt.length) return mostrarToast('Completa: '+falt.join(', '),'error');
    if (prod.codigo) {
      // verificar stock + comun en completarCallback del escaner
    }
    productosEnProceso.push(prod);
    mostrarProductoEnTabla();
    form.reset(); actualizarCantidadTotal(); actualizarPrecioFinal();
    mostrarToast('Añadido a lista','success');
  });
  btnCancelar.addEventListener('click', () => { form.reset(); mostrarToast('Formulario limpiado','info'); });

  // --- ESCANEO ---
  btnEscanear.addEventListener('click', () => {
    mostrarToast('Abriendo cámara...','info');
    iniciarEscaneoContinuo(
      camaraContainer, btnEscanear, btnEscanearAhora, btnCerrarCamara,
      inputCodigo, async (producto) => {
        if (!producto && inputCodigo.value) {
          // fetch común / stock si no vino en callback
          // omitted: util logic handles completions
        }
        completarCallback(producto);
      }
    );
  });
});
