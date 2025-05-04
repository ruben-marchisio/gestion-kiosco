document.addEventListener('DOMContentLoaded', () => {
  const formCargarProducto = document.querySelector('#form-cargar-producto');
  const categoriaSelect = document.querySelector('#categoria');
  const subcategoriaBebidas = document.querySelector('#subcategoria-bebidas');
  const subcategoriaGolosinas = document.querySelector('#subcategoria-golosinas');
  const subcategoriaLacteos = document.querySelector('#subcategoria-lacteos');
  const subcategoriaCigarrillos = document.querySelector('#subcategoria-cigarrillos');
  const subcategoriaFiambre = document.querySelector('#subcategoria-fiambre');
  const subcategoriaCongelados = document.querySelector('#subcategoria-congelados');
  const subcategoriaPanaderia = document.querySelector('#subcategoria-panaderia');
  const subcategoriaAlmacen = document.querySelector('#subcategoria-almacen');
  const subcategoriaVerduleria = document.querySelector('#subcategoria-verduleria');

  // Construcción de la URL base sin especificar el puerto
  const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;
  console.log('URL base generada:', BASE_URL);

  // Función para manejar la visibilidad de subcategorías
  const manejarSubcategorias = () => {
    console.log('Categoría seleccionada:', categoriaSelect.value); // Depuración
    // Ocultar todas las subcategorías
    subcategoriaBebidas.style.display = 'none';
    subcategoriaGolosinas.style.display = 'none';
    subcategoriaLacteos.style.display = 'none';
    subcategoriaCigarrillos.style.display = 'none';
    subcategoriaFiambre.style.display = 'none';
    subcategoriaCongelados.style.display = 'none';
    subcategoriaPanaderia.style.display = 'none';
    subcategoriaAlmacen.style.display = 'none';
    subcategoriaVerduleria.style.display = 'none';

    // Restablecer valores de subcategoría
    subcategoriaBebidas.value = '';
    subcategoriaGolosinas.value = '';
    subcategoriaLacteos.value = '';
    subcategoriaCigarrillos.value = '';
    subcategoriaFiambre.value = '';
    subcategoriaCongelados.value = '';
    subcategoriaPanaderia.value = '';
    subcategoriaAlmacen.value = '';
    subcategoriaVerduleria.value = '';

    // Mostrar la subcategoría correspondiente
    switch (categoriaSelect.value) {
      case 'Bebidas':
        console.log('Mostrando subcategoría Bebidas');
        subcategoriaBebidas.style.display = 'block';
        break;
      case 'Golosinas':
        console.log('Mostrando subcategoría Golosinas');
        subcategoriaGolosinas.style.display = 'block';
        break;
      case 'Lácteos':
        console.log('Mostrando subcategoría Lácteos');
        subcategoriaLacteos.style.display = 'block';
        break;
      case 'Cigarrillos':
        console.log('Mostrando subcategoría Cigarrillos');
        subcategoriaCigarrillos.style.display = 'block';
        break;
      case 'Fiambre':
        console.log('Mostrando subcategoría Fiambre');
        subcategoriaFiambre.style.display = 'block';
        break;
      case 'Congelados':
        console.log('Mostrando subcategoría Congelados');
        subcategoriaCongelados.style.display = 'block';
        break;
      case 'Panadería':
        console.log('Mostrando subcategoría Panadería');
        subcategoriaPanaderia.style.display = 'block';
        break;
      case 'Almacén':
        console.log('Mostrando subcategoría Almacén');
        subcategoriaAlmacen.style.display = 'block';
        break;
      case 'Verdulería':
        console.log('Mostrando subcategoría Verdulería');
        subcategoriaVerduleria.style.display = 'block';
        break;
      default:
        console.log('Categoría sin subcategorías:', categoriaSelect.value);
        break;
    }
  };

  // Mostrar/Ocultar subcategorías según la categoría seleccionada
  if (categoriaSelect && subcategoriaBebidas && subcategoriaGolosinas && subcategoriaLacteos && subcategoriaCigarrillos && subcategoriaFiambre && subcategoriaCongelados && subcategoriaPanaderia && subcategoriaAlmacen && subcategoriaVerduleria) {
    categoriaSelect.addEventListener('change', manejarSubcategorias);
    // Llamar a la función inicialmente para manejar la categoría por defecto
    manejarSubcategorias();
  } else {
    console.error('No se encontraron todos los elementos de subcategoría:', {
      categoriaSelect,
      subcategoriaBebidas,
      subcategoriaGolosinas,
      subcategoriaLacteos,
      subcategoriaCigarrillos,
      subcategoriaFiambre,
      subcategoriaCongelados,
      subcategoriaPanaderia,
      subcategoriaAlmacen,
      subcategoriaVerduleria
    });
  }

  // Manejar el cambio de unidad para mostrar campos de packs/docenas
  const unidadSelect = document.querySelector('#unidad');
  const cantidadPacks = document.querySelector('#cantidad-packs');
  const unidadesPorPack = document.querySelector('#unidades-por-pack');
  const cantidadDocenas = document.querySelector('#cantidad-docenas');
  const cantidadSueltas = document.querySelector('#unidadesSueltas');
  const cantidadTotalInput = document.querySelector('#cantidad-total');

  if (unidadSelect && cantidadPacks && unidadesPorPack && cantidadDocenas && cantidadSueltas && cantidadTotalInput) {
    const actualizarCamposUnidad = () => {
      cantidadPacks.style.display = 'none';
      unidadesPorPack.style.display = 'none';
      cantidadDocenas.style.display = 'none';
      const packsInput = document.querySelector('#packs');
      const unidadesPorPackInput = document.querySelector('#unidadesPorPack');
      const docenasInput = document.querySelector('#docenas');

      // Restablecer valores
      packsInput.value = '0';
      unidadesPorPackInput.value = '0';
      docenasInput.value = '0';

      switch (unidadSelect.value) {
        case 'pack':
          cantidadPacks.style.display = 'block';
          unidadesPorPack.style.display = 'block';
          break;
        case 'docena':
          cantidadDocenas.style.display = 'block';
          break;
        default: // unidad o kilo
          break;
      }
      calcularCantidadTotal();
    };

    const calcularCantidadTotal = () => {
      const packs = parseInt(document.querySelector('#packs').value) || 0;
      const unidadesPorPackValue = parseInt(document.querySelector('#unidadesPorPack').value) || 0;
      const docenas = parseInt(document.querySelector('#docenas').value) || 0;
      const sueltas = parseInt(document.querySelector('#unidadesSueltas').value) || 0;
      const total = (packs * unidadesPorPackValue) + (docenas * 12) + sueltas;
      cantidadTotalInput.value = total;
    };

    unidadSelect.addEventListener('change', actualizarCamposUnidad);
    document.querySelector('#packs').addEventListener('input', calcularCantidadTotal);
    document.querySelector('#unidadesPorPack').addEventListener('input', calcularCantidadTotal);
    document.querySelector('#docenas').addEventListener('input', calcularCantidadTotal);
    document.querySelector('#unidadesSueltas').addEventListener('input', calcularCantidadTotal);

    // Llamar a la función inicialmente para manejar la unidad por defecto
    actualizarCamposUnidad();
  }

  // Calcular el precio final dinámicamente
  const precioListaInput = document.querySelector('#precio-lista');
  const porcentajeGananciaInput = document.querySelector('#porcentaje-ganancia');
  const precioFinalInput = document.querySelector('#precio-final');

  if (precioListaInput && porcentajeGananciaInput && precioFinalInput) {
    const calcularPrecioFinal = () => {
      const precioLista = parseFloat(precioListaInput.value) || 0;
      const porcentajeGanancia = parseFloat(porcentajeGananciaInput.value) || 0;
      const precioFinal = precioLista * (1 + porcentajeGanancia / 100);
      precioFinalInput.value = precioFinal.toFixed(2);
    };

    precioListaInput.addEventListener('input', calcularPrecioFinal);
    porcentajeGananciaInput.addEventListener('input', calcularPrecioFinal);
  }

  // Escaneo para cargar producto
  const botonEscanearCarga = document.querySelector('#escanear-carga');
  if (botonEscanearCarga) {
    botonEscanearCarga.addEventListener('click', () => {
      console.log('Botón Escanear clickeado en Cargar Producto'); // Depuración
      const camaraCarga = document.querySelector('#camara-carga');
      iniciarEscaneo(camaraCarga, async (codigo) => {
        try {
          console.log('Buscando producto con código:', codigo);
          const respuesta = await fetch(`${BASE_URL}/api/productos/codigo/${codigo}`);
          const resultado = await respuesta.json();
          console.log('Resultado de la búsqueda:', resultado);

          if (respuesta.ok && resultado.producto) {
            document.querySelector('#nombre-producto').value = resultado.producto.nombre;
            document.querySelector('#marca').value = resultado.producto.marca;
            document.querySelector('#categoria').value = resultado.producto.categoria;
            categoriaSelect.dispatchEvent(new Event('change'));
            if (resultado.producto.subcategoria) {
              document.querySelector(`#subcategoria-${resultado.producto.categoria.toLowerCase()}`).value = resultado.producto.subcategoria;
            }
            document.querySelector('#precio-lista').value = resultado.producto.precioLista;
            document.querySelector('#porcentaje-ganancia').value = resultado.producto.porcentajeGanancia;
            document.querySelector('#precio-final').value = resultado.producto.precioFinal;
            document.querySelector('#unidad').value = resultado.producto.unidad;
            unidadSelect.dispatchEvent(new Event('change'));
            document.querySelector('#packs').value = resultado.producto.packs;
            document.querySelector('#unidadesPorPack').value = resultado.producto.unidadesPorPack;
            document.querySelector('#docenas').value = resultado.producto.docenas;
            document.querySelector('#unidadesSueltas').value = resultado.producto.unidadesSueltas;
            document.querySelector('#cantidad-total').value = resultado.producto.cantidadUnidades;
            document.querySelector('#fecha-vencimiento').value = new Date(resultado.producto.fechaVencimiento).toISOString().split('T')[0];
            formCargarProducto.dataset.codigo = codigo;
          } else {
            document.querySelector('#nombre-producto').value = '';
            alert('Producto no encontrado. Por favor, llena los campos manualmente para registrar el producto con el código escaneado (' + codigo + '). Luego, presiona "Guardar Producto" para añadirlo a la base de datos.');
            formCargarProducto.dataset.codigo = codigo;
          }
        } catch (error) {
          alert('Error al buscar el producto: ' + error.message);
          console.error('Error:', error);
        }
      });
    });
  }

  // Manejar el envío del formulario de cargar producto
  if (formCargarProducto) {
    formCargarProducto.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Formulario enviado'); // Depuración

      const formData = new FormData(formCargarProducto);
      formData.append('usuarioId', '507f1f77bcf86cd799439011');
      formData.append('codigo', formCargarProducto.dataset.codigo || '');

      // Validación manual de los campos requeridos
      const nombre = formData.get('nombre');
      const marca = formData.get('marca');
      const unidad = formData.get('unidad');
      const precioLista = parseFloat(formData.get('precioLista')) || 0;
      const porcentajeGanancia = parseFloat(formData.get('porcentajeGanancia')) || 0;
      const categoria = formData.get('categoria');
      const fechaVencimiento = formData.get('fechaVencimiento');
      const imagen = formData.get('imagen');

      if (!nombre) {
        alert('Por favor, completa el campo "Nombre".');
        return;
      }
      if (!marca) {
        alert('Por favor, completa el campo "Marca".');
        return;
      }
      if (!unidad) {
        alert('Por favor, selecciona una "Unidad".');
        return;
      }
      if (precioLista <= 0) {
        alert('Por favor, ingresa un "Precio de Lista" válido.');
        return;
      }
      if (porcentajeGanancia < 0) {
        alert('Por favor, ingresa un "Porcentaje de Ganancia" válido.');
        return;
      }
      if (!categoria) {
        alert('Por favor, selecciona una "Categoría".');
        return;
      }
      if (!fechaVencimiento) {
        alert('Por favor, selecciona una "Fecha de Vencimiento".');
        return;
      }
      if (!imagen || imagen.size === 0) {
        alert('Por favor, selecciona una "Imagen del Producto".');
        return;
      }

      // Validación manual de los campos según la unidad seleccionada
      const packs = parseInt(formData.get('packs')) || 0;
      const unidadesPorPack = parseInt(formData.get('unidadesPorPack')) || 0;
      const docenas = parseInt(formData.get('docenas')) || 0;
      const sueltas = parseInt(formData.get('unidadesSueltas')) || 0;

      if (unidad === 'pack' && (packs <= 0 || unidadesPorPack <= 0)) {
        alert('Por favor, completa los campos "Cantidad de Packs" y "Unidades por Pack".');
        return;
      }
      if (unidad === 'docena' && docenas <= 0) {
        alert('Por favor, completa el campo "Cantidad de Docenas".');
        return;
      }
      if ((unidad === 'unidad' || unidad === 'kilo') && sueltas <= 0) {
        alert('Por favor, completa el campo "Unidades Sueltas".');
        return;
      }

      // Obtener el valor correcto de subcategoria según la categoría seleccionada
      let subcategoria = '';
      switch (categoria) {
        case 'Bebidas':
          subcategoria = subcategoriaBebidas.value;
          break;
        case 'Golosinas':
          subcategoria = subcategoriaGolosinas.value;
          break;
        case 'Lácteos':
          subcategoria = subcategoriaLacteos.value;
          break;
        case 'Cigarrillos':
          subcategoria = subcategoriaCigarrillos.value;
          break;
        case 'Fiambre':
          subcategoria = subcategoriaFiambre.value;
          break;
        case 'Congelados':
          subcategoria = subcategoriaCongelados.value;
          break;
        case 'Panadería':
          subcategoria = subcategoriaPanaderia.value;
          break;
        case 'Almacén':
          subcategoria = subcategoriaAlmacen.value;
          break;
        case 'Verdulería':
          subcategoria = subcategoriaVerduleria.value;
          break;
        default:
          subcategoria = '';
      }

      // Reemplazar el valor de subcategoria en formData
      formData.delete('subcategoria');
      formData.append('subcategoria', subcategoria);

      // Depuración: Mostrar los datos que se están enviando
      console.log('Datos enviados:', Object.fromEntries(formData));

      try {
        const respuesta = await fetch(`${BASE_URL}/api/productos`, {
          method: 'POST',
          body: formData,
        });

        console.log('Estado de la respuesta:', respuesta.status);
        console.log('¿Respuesta OK?', respuesta.ok);

        const resultado = await respuesta.json();
        console.log('Resultado del servidor:', resultado);

        if (respuesta.ok) {
          alert(resultado.mensaje);
          formCargarProducto.reset();
          formCargarProducto.dataset.codigo = '';
          precioFinalInput.value = '';
          cantidadTotalInput.value = '';
          formCargarProducto.closest('.seccion-formulario').style.display = 'none';
          subcategoriaBebidas.style.display = 'none';
          subcategoriaGolosinas.style.display = 'none';
          subcategoriaLacteos.style.display = 'none';
          subcategoriaCigarrillos.style.display = 'none';
          subcategoriaFiambre.style.display = 'none';
          subcategoriaCongelados.style.display = 'none';
          subcategoriaPanaderia.style.display = 'none';
          subcategoriaAlmacen.style.display = 'none';
          subcategoriaVerduleria.style.display = 'none';
          subcategoriaBebidas.disabled = true;
          subcategoriaGolosinas.disabled = true;
          subcategoriaLacteos.disabled = true;
          subcategoriaCigarrillos.disabled = true;
          subcategoriaFiambre.disabled = true;
          subcategoriaCongelados.disabled = true;
          subcategoriaPanaderia.disabled = true;
          subcategoriaAlmacen.disabled = true;
          subcategoriaVerduleria.disabled = true;
          document.querySelector('#subcategoria-bebidas').value = '';
          document.querySelector('#subcategoria-golosinas').value = '';
          document.querySelector('#subcategoria-lacteos').value = '';
          document.querySelector('#subcategoria-cigarrillos').value = '';
          document.querySelector('#subcategoria-fiambre').value = '';
          document.querySelector('#subcategoria-congelados').value = '';
          document.querySelector('#subcategoria-panaderia').value = '';
          document.querySelector('#subcategoria-almacen').value = '';
          document.querySelector('#subcategoria-verduleria').value = '';
        } else {
          alert(resultado.error || 'Error al cargar el producto. Revisa los datos e intenta de nuevo.');
        }
      } catch (error) {
        alert('Error al conectar con el servidor: ' + error.message);
        console.error('Error:', error);
      }
    });
  }
});