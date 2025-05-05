document.addEventListener('DOMContentLoaded', () => {
  console.log('vender-producto-logic.js cargado');

  // Verificar si el usuario ha iniciado sesión
  const usuarioId = localStorage.getItem('usuarioId');
  if (!usuarioId) {
    window.location.href = '/public/inicio-sesion.html';
    return;
  }

  // Elementos del DOM
  const codigoVenta = document.querySelector('#codigo-venta');
  const nombreVenta = document.querySelector('#nombre-venta');
  const escanearVentaBtn = document.querySelector('#escanear-venta');
  const camaraVenta = document.querySelector('#camara-venta');
  const seleccionarManualBtn = document.querySelector('#seleccionar-manual');
  const listaProductosNoEscaneados = document.querySelector('#lista-productos-no-escaneados');
  const productoManualSelect = document.querySelector('#producto-manual');
  const metodoVentaSelect = document.querySelector('#metodo-venta');
  const cantidadVentaInput = document.querySelector('#cantidad-venta');
  const agregarProductoBtn = document.querySelector('#agregar-producto');
  const listaVentaBody = document.querySelector('#lista-venta-body');
  const totalVentaSpan = document.querySelector('#total-venta');
  const confirmarVentaBtn = document.querySelector('#confirmar-venta');

  // Variables globales
  let productosVenta = [];
  let totalVenta = 0;
  let escaneoActivo = false;
  let ultimoCodigoEscaneado = null;
  let ultimoEscaneoTiempo = 0;
  const DEBOUNCE_TIME = 2000; // 2 segundos para debounce

  // Construcción de la URL base
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

  // Crear sonido de escaneo
  const sonidoEscaneo = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');

  // Función para buscar producto por código
  async function buscarProductoPorCodigo(codigo) {
    try {
      const respuesta = await fetch(`${BASE_URL}/api/productos/codigo/${codigo}`);
      const resultado = await respuesta.json();

      if (respuesta.ok) {
        const producto = resultado.producto;
        codigoVenta.value = producto.codigo || '';
        nombreVenta.value = producto.nombre || '';
        return producto;
      } else {
        alert('Producto no encontrado');
        return null;
      }
    } catch (error) {
      console.error('Error al buscar producto:', error);
      alert('Error al buscar el producto');
      return null;
    }
  }

  // Inicializar escaneo
  function inicializarEscaneo() {
    escaneoActivo = true;
    camaraVenta.style.display = 'block';

    iniciarEscaneo(camaraVenta, async (codigo) => {
      const ahora = Date.now();

      // Evitar múltiples escaneos con debounce
      if (ultimoCodigoEscaneado === codigo && (ahora - ultimoEscaneoTiempo) < DEBOUNCE_TIME) {
        if (escaneoActivo) {
          setTimeout(inicializarEscaneo, 100);
        }
        return;
      }

      ultimoCodigoEscaneado = codigo;
      ultimoEscaneoTiempo = ahora;

      // Reproducir sonido de escaneo
      sonidoEscaneo.play().catch(err => console.error('Error al reproducir sonido:', err));

      const producto = await buscarProductoPorCodigo(codigo);
      if (producto && escaneoActivo) {
        setTimeout(inicializarEscaneo, DEBOUNCE_TIME);
      }
    });
  }

  // Detener escaneo
  function detenerEscaneo() {
    Quagga.stop();
    escaneoActivo = false;
    camaraVenta.style.display = 'none';
    ultimoCodigoEscaneado = null;
  }

  // Cargar productos para selección manual
  async function cargarProductosManual() {
    try {
      const respuesta = await fetch(`${BASE_URL}/api/productos?usuarioId=${usuarioId}`);
      const productos = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(productos.error || 'Error al cargar productos');
      }
      productoManualSelect.innerHTML = '<option value="">Selecciona un producto</option>';
      productos.forEach(producto => {
        const option = document.createElement('option');
        option.value = producto._id;
        option.textContent = producto.nombre;
        productoManualSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error al cargar productos:', error);
      alert('Error al cargar productos para selección manual: ' + error.message);
    }
  }

  // Agregar producto a la lista de venta
  function agregarProductoALista(producto, metodo, cantidad) {
    const subtotal = producto.precioFinal * cantidad;
    productosVenta.push({ producto, metodo, cantidad, subtotal });
    totalVenta += subtotal;
    actualizarListaVenta();
  }

  // Actualizar la lista de venta
  function actualizarListaVenta() {
    listaVentaBody.innerHTML = '';
    productosVenta.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.producto.nombre}</td>
        <td>${item.metodo}</td>
        <td>${item.cantidad}</td>
        <td>$${item.producto.precioFinal.toFixed(2)}</td>
        <td>$${item.subtotal.toFixed(2)}</td>
        <td><button class="eliminar" data-index="${index}"><i class="fas fa-trash"></i></button></td>
      `;
      listaVentaBody.appendChild(tr);
    });
    totalVentaSpan.textContent = `$${totalVenta.toFixed(2)}`;
    confirmarVentaBtn.style.display = productosVenta.length > 0 ? 'block' : 'none';
  }

  // Eventos
  escanearVentaBtn.addEventListener('click', () => {
    if (!escaneoActivo) {
      inicializarEscaneo();
    } else {
      detenerEscaneo();
    }
  });

  seleccionarManualBtn.addEventListener('click', () => {
    listaProductosNoEscaneados.style.display = 'block';
    cargarProductosManual();
  });

  agregarProductoBtn.addEventListener('click', async () => {
    const codigo = codigoVenta.value;
    const metodo = metodoVentaSelect.value;
    const cantidad = parseInt(cantidadVentaInput.value) || 1;

    if (!codigo && !productoManualSelect.value) {
      alert('Por favor, escanea un producto o selecciona uno manualmente');
      return;
    }

    let producto;
    if (codigo) {
      producto = await buscarProductoPorCodigo(codigo);
    } else {
      const respuesta = await fetch(`${BASE_URL}/api/productos/${productoManualSelect.value}`);
      const resultado = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(resultado.error || 'Error al obtener el producto');
      }
      producto = resultado;
    }

    if (producto) {
      agregarProductoALista(producto, metodo, cantidad);
      codigoVenta.value = '';
      nombreVenta.value = '';
      cantidadVentaInput.value = 1;
      listaProductosNoEscaneados.style.display = 'none';
    }
  });

  listaVentaBody.addEventListener('click', (e) => {
    if (e.target.closest('.eliminar')) {
      const index = parseInt(e.target.closest('.eliminar').dataset.index);
      totalVenta -= productosVenta[index].subtotal;
      productosVenta.splice(index, 1);
      actualizarListaVenta();
    }
  });

  confirmarVentaBtn.addEventListener('click', async () => {
    try {
      // Aquí implementarías la lógica para guardar la venta en el backend
      alert('Venta confirmada con éxito');
      productosVenta = [];
      totalVenta = 0;
      actualizarListaVenta();
    } catch (error) {
      console.error('Error al confirmar venta:', error);
      alert('Error al confirmar la venta');
    }
  });
});