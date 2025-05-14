// public/js/cargar-producto-logic.js
// Versión corregida: escáner se abre con un solo click y flujo de carga de productos estable

import { iniciarEscaneoContinuo, mostrarToast } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('cargar-producto-logic.js cargado');

  // DOM elements
  const form = document.querySelector('#form-cargar-producto');
  const inputCodigo = document.querySelector('#codigo');
  const inputNombre = document.querySelector('#nombre');
  const inputMarca = document.querySelector('#marca');
  const inputCategoria = document.querySelector('#categoria');
  const inputSubcategoria = (val) => document.querySelector(`#subcategoria-${val}`);
  const inputUnidad = document.querySelector('#unidad');
  const inputPacks = document.querySelector('#packs');
  const inputUnidadesPorPack = document.querySelector('#unidadesPorPack');
  const inputDocenas = document.querySelector('#docenas');
  const inputUnidadesSueltas = document.querySelector('#unidadesSueltas');
  const inputCantidadTotal = document.querySelector('#cantidad-total');
  const inputPrecioLista = document.querySelector('#precio-lista');
  const inputPorcentajeGanancia = document.querySelector('#porcentaje-ganancia');
  const inputPrecioFinal = document.querySelector('#precio-final');
  const inputFechaVencimiento = document.querySelector('#fecha-vencimiento');
  const inputIcono = document.querySelector('#icono-producto');

  const btnAgregar = document.querySelector('#agregar-producto');
  const btnCancelar = document.querySelector('#cancelar-producto');
  const btnEscanear = document.querySelector('#escanear');
  const btnEscanearAhora = document.querySelector('#escanear-ahora');
  const btnCerrarCamara = document.querySelector('#cerrar-camara');
  const camaraContainer = document.querySelector('#camara-carga');

  const btnConfirmarTodos = document.querySelector('#confirmar-todos');
  const btnCancelarTodo = document.querySelector('#cancelar-todo');
  const tablaBody = document.querySelector('#lista-productos-body');

  const BASE_URL = `${location.origin}`;
  let productosEnProceso = [];
  let scannerInstance = null;

  // Inicializar UI
  document.querySelectorAll('[id^="subcategoria-"]').forEach(el => el.style.display = 'none');
  ['#cantidad-packs','#unidades-por-pack','#cantidad-docenas'].forEach(sel => document.querySelector(sel).style.display='none');

  // Cálculo de cantidad total
  function actualizarCantidad() {
    const packs = +inputPacks.value || 0;
    const upack = +inputUnidadesPorPack.value || 0;
    const doc = +inputDocenas.value || 0;
    const suel = +inputUnidadesSueltas.value || 0;
    inputCantidadTotal.value = packs*upack + doc*12 + suel;
  }
  [inputPacks,inputUnidadesPorPack,inputDocenas,inputUnidadesSueltas].forEach(i => i.addEventListener('input', actualizarCantidad));

  // Cálculo precio final
  function actualizarPrecio() {
    const lista = +inputPrecioLista.value || 0;
    const gan = +inputPorcentajeGanancia.value || 0;
    inputPrecioFinal.value = (lista*(1+gan/100)).toFixed(2);
  }
  [inputPrecioLista,inputPorcentajeGanancia].forEach(i=>i.addEventListener('input', actualizarPrecio));

  // Categorías, subcategorías
  inputCategoria.addEventListener('change', ()=>{
    document.querySelectorAll('[id^="subcategoria-"]').forEach(el=>el.style.display='none');
    const subEl = inputSubcategoria(inputCategoria.value);
    if(subEl) subEl.style.display='block';
  });

  // Unidad
  inputUnidad.addEventListener('change', ()=>{
    const u = inputUnidad.value;
    document.querySelector('#cantidad-packs').style.display = u==='pack'?'block':'none';
    document.querySelector('#unidades-por-pack').style.display = u==='pack'?'block':'none';
    document.querySelector('#cantidad-docenas').style.display = u==='docena'?'block':'none';
    actualizarCantidad();
  });

  // Render tabla productos
  function renderTabla() {
    tablaBody.innerHTML='';
    productosEnProceso.forEach((p,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.nombre}</td>
        <td>${p.cantidadUnidades}</td>
        <td>
          <button data-i="${i}" class="confirmar">✓</button>
          <button data-i="${i}" class="eliminar">✕</button>
        </td>`;
      tablaBody.appendChild(tr);
    });
    tablaBody.querySelectorAll('.confirmar').forEach(b=>b.onclick=e=>confirmar(+e.target.dataset.i));
    tablaBody.querySelectorAll('.eliminar').forEach(b=>b.onclick=e=>eliminar(+e.target.dataset.i));
  }

  // Confirmar producto individual
  async function confirmar(idx) {
    const p = productosEnProceso[idx];
    try {
      const res = await fetch(`${BASE_URL}/api/productos`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...p,usuarioId:localStorage.usuarioId})
      });
      if(!res.ok) throw new Error(res.statusText);
      mostrarToast('Producto confirmado','success');
      productosEnProceso.splice(idx,1);
      renderTabla();
    } catch(err){
      console.error(err);
      mostrarToast('Error al confirmar','error');
    }
  }

  function eliminar(idx){
    productosEnProceso.splice(idx,1);
    renderTabla();
    mostrarToast('Producto eliminado','info');
  }

  btnConfirmarTodos.addEventListener('click', ()=>{
    productosEnProceso.slice().reverse().forEach((_,i)=>confirmar(productosEnProceso.length-1-i));
  });
  btnCancelarTodo.addEventListener('click', ()=>{
    productosEnProceso=[];
    renderTabla();
    mostrarToast('Lista vaciada','info');
  });

  // Lógica de formulario
  btnAgregar.addEventListener('click', ()=>{
    const prod = {
      codigo: inputCodigo.value.trim(),
      nombre: inputNombre.value.trim(),
      marca: inputMarca.value.trim(),
      categoria: inputCategoria.value,
      subcategoria: inputSubcategoria(inputCategoria.value)?.value||'',
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
      icono: inputIcono.value||'default'
    };
    // Validación
    const faltantes = [];
    ['nombre','marca','categoria','unidad','fechaVencimiento'].forEach(f=>{ if(!prod[f]) faltantes.push(f); });
    if(!prod.cantidadUnidades) faltantes.push('cantidad');
    if(faltantes.length) return mostrarToast('Completa: '+faltantes.join(', '),'error');
    productosEnProceso.push(prod);
    renderTabla();
    form.reset(); actualizarCantidad(); actualizarPrecio();
    mostrarToast('Producto agregado a lista','success');
  });
  btnCancelar.addEventListener('click', ()=>{ form.reset(); mostrarToast('Formulario limpio','info'); });

  // Escáner: abrir con un click
  btnEscanear.addEventListener('click', async ()=>{
    mostrarToast('Abriendo cámara...','info');
    if(scannerInstance) {
      scannerInstance.detener();
      scannerInstance = null;
    }
    scannerInstance = iniciarEscaneoContinuo(
      camaraContainer, btnEscanear, btnEscanearAhora, btnCerrarCamara,
      inputCodigo,
      producto => {
        if(producto) {
          inputCodigo.value = producto.codigo;
          btnAgregar.click();
        } else {
          mostrarToast('Código no reconocido','info');
        }
      }
    );
    const ok = await scannerInstance.inicializar();
    if(!ok) {
      mostrarToast('No se pudo iniciar la cámara','error');
      scannerInstance = null;
    }
  });
});
