const mongoose = require('mongoose');
const { Producto, ProductoComun, Baja } = require('../usuario');

module.exports = (app) => {
  // Rutas para productos
  app.post('/api/productos', async (req, res) => {
    console.log('Solicitud recibida en /api/productos');
    const startTime = Date.now();
    try {
      console.log('Datos recibidos:', req.body);

      const {
        nombre,
        marca,
        precioLista,
        porcentajeGanancia,
        precioFinal,
        categoria,
        subcategoria,
        unidad,
        fechaVencimiento,
        usuarioId,
        codigo,
        packs,
        unidadesPorPack,
        docenas,
        unidadesSueltas,
        cantidadUnidades,
        icono
      } = req.body;

      if (!nombre || !marca || !precioLista || !porcentajeGanancia || !precioFinal || !categoria || !unidad || !fechaVencimiento || !usuarioId || !cantidadUnidades) {
        console.log('Faltan campos requeridos:', req.body);
        return res.status(400).json({ error: 'Faltan campos requeridos.' });
      }

      const normalizedCodigo = codigo ? codigo.toString().trim() : '';

      let productoExistente = null;
      if (normalizedCodigo) {
        productoExistente = await Producto.findOne({ 
          codigo: normalizedCodigo, 
          usuarioId: new mongoose.Types.ObjectId(usuarioId) 
        });
      }

      if (productoExistente) {
        console.log('Producto existente encontrado:', productoExistente);
        productoExistente.cantidadUnidades += parseInt(cantidadUnidades);
        productoExistente.packs += parseInt(packs) || 0;
        productoExistente.unidadesPorPack = parseInt(unidadesPorPack) || 0;
        productoExistente.docenas += parseInt(docenas) || 0;
        productoExistente.unidadesSueltas += parseInt(unidadesSueltas) || 0;
        productoExistente.marca = marca;
        productoExistente.precioLista = parseFloat(precioLista);
        productoExistente.porcentajeGanancia = parseFloat(porcentajeGanancia);
        productoExistente.precioFinal = parseFloat(precioFinal);
        productoExistente.categoria = categoria;
        productoExistente.subcategoria = subcategoria || '';
        productoExistente.unidad = unidad;
        productoExistente.fechaVencimiento = new Date(fechaVencimiento);
        productoExistente.icono = icono || 'default';

        await productoExistente.save();
        console.log('Producto existente actualizado:', productoExistente);
      } else {
        const nuevoProducto = new Producto({
          nombre,
          cantidadUnidades: parseInt(cantidadUnidades),
          packs: parseInt(packs) || 0,
          unidadesPorPack: parseInt(unidadesPorPack) || 0,
          docenas: parseInt(docenas) || 0,
          unidadesSueltas: parseInt(unidadesSueltas) || 0,
          marca,
          precioLista: parseFloat(precioLista),
          porcentajeGanancia: parseFloat(porcentajeGanancia),
          precioFinal: parseFloat(precioFinal),
          categoria,
          subcategoria: subcategoria || '',
          unidad,
          fechaVencimiento: new Date(fechaVencimiento),
          icono: icono || 'default',
          usuarioId: new mongoose.Types.ObjectId(usuarioId),
          codigo: normalizedCodigo
        });

        await nuevoProducto.save();

        if (normalizedCodigo && normalizedCodigo !== '') {
          const existeEnComunes = await ProductoComun.findOne({ codigo: normalizedCodigo });
          if (!existeEnComunes) {
            const nuevoProductoComun = new ProductoComun({
              codigo: normalizedCodigo,
              nombre,
              marca,
              categoria,
              subcategoria: subcategoria || ''
            });
            await nuevoProductoComun.save();
            console.log('Producto guardado en la base de datos común:', normalizedCodigo);
          }
        }
      }

      const totalTime = Date.now() - startTime;
      console.log(`Producto ${productoExistente ? 'actualizado' : 'cargado'} con éxito ${nombre} en ${totalTime}ms`);
      res.status(201).json({ mensaje: productoExistente ? 'Producto actualizado con éxito.' : 'Producto cargado con éxito.' });
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`Error al cargar el producto después de ${totalTime}ms:`, error);
      res.status(500).json({ error: 'Error al cargar el producto: ' + error.message });
    }
  });

  app.get('/api/productos/codigo/:codigo', async (req, res) => {
    console.log('Solicitud recibida en /api/productos/codigo/:codigo');
    const startTime = Date.now();
    try {
      const { codigo } = req.params;
      const usuarioId = req.query.usuarioId;
      console.log('Buscando producto con código:', codigo, 'para usuario:', usuarioId);

      const producto = await Producto.findOne({ 
        codigo: codigo.toString().trim(), 
        usuarioId: new mongoose.Types.ObjectId(usuarioId) 
      });
      const queryTime = Date.now() - startTime;
      console.log(`Consulta a MongoDB completada en ${queryTime}ms`);

      if (!producto) {
        console.log('Producto no encontrado en el stock del usuario para el código:', codigo);
        const productos = await Producto.find({ usuarioId: new mongoose.Types.ObjectId(usuarioId) });
        console.log('Códigos en la colección Producto para este usuario:', productos.map(p => p.codigo));
        return res.json({ producto: null });
      }

      console.log('Producto encontrado en el stock del usuario:', producto);
      res.status(200).json({ producto });
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`Error al buscar el producto después de ${totalTime}ms:`, error);
      res.status(500).json({ error: 'Error al buscar el producto: ' + error.message });
    }
  });

  app.get('/api/productos-comunes/codigo/:codigo', async (req, res) => {
    console.log('Solicitud recibida en /api/productos-comunes/codigo/:codigo');
    const startTime = Date.now();
    try {
      const { codigo } = req.params;
      console.log('Buscando producto en la base de datos común con código:', codigo);

      const producto = await ProductoComun.findOne({ codigo: codigo.toString().trim() });
      const queryTime = Date.now() - startTime;
      console.log(`Consulta a MongoDB completada en ${queryTime}ms`);

      if (!producto) {
        console.log('Producto no encontrado en la base de datos común para el código:', codigo);
        const productosComunes = await ProductoComun.find();
        console.log('Códigos en la colección ProductoComun:', productosComunes.map(p => p.codigo));
        return res.json({ producto: null });
      }

      console.log('Producto encontrado en la base de datos común:', producto);
      res.status(200).json({ producto });
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`Error al buscar en la base de datos común después de ${totalTime}ms:`, error);
      res.status(500).json({ error: 'Error al buscar en la base de datos común: ' + error.message });
    }
  });

  app.get('/api/productos', async (req, res) => {
    console.log('Solicitud recibida en /api/productos');
    const startTime = Date.now();
    try {
      const usuarioId = req.query.usuarioId;
      if (!usuarioId) {
        return res.status(400).json({ error: 'Falta el usuarioId.' });
      }

      const productos = await Producto.find({ usuarioId });
      const queryTime = Date.now() - startTime;
      console.log(`Consulta a MongoDB completada en ${queryTime}ms`);
      console.log('Productos encontrados:', productos.length);
      res.status(200).json(productos);
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`Error al obtener productos después de ${totalTime}ms:`, error);
      res.status(500).json({ error: 'Error al obtener productos: ' + error.message });
    }
  });

  app.get('/api/productos/:id', async (req, res) => {
    console.log('Solicitud recibida en /api/productos/:id');
    const startTime = Date.now();
    try {
      const { id } = req.params;
      console.log('Buscando producto con ID:', id);

      const producto = await Producto.findById(id);
      const queryTime = Date.now() - startTime;
      console.log(`Consulta a MongoDB completada en ${queryTime}ms`);

      if (!producto) {
        console.log('Producto no encontrado para el ID:', id);
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }

      console.log('Producto encontrado:', producto);
      res.status(200).json(producto);
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`Error al buscar el producto después de ${totalTime}ms:`, error);
      res.status(500).json({ error: 'Error al buscar el producto: ' + error.message });
    }
  });

  app.put('/api/productos/:id/precios', async (req, res) => {
    console.log('Solicitud recibida en /api/productos/:id/precios');
    const startTime = Date.now();
    try {
      const { id } = req.params;
      const { precioLista, porcentajeGanancia, precioFinal } = req.body;

      if (!precioLista || !porcentajeGanancia || !precioFinal) {
        console.log('Faltan campos requeridos:', req.body);
        return res.status(400).json({ error: 'Faltan campos requeridos.' });
      }

      const producto = await Producto.findById(id);
      if (!producto) {
        console.log('Producto no encontrado para el ID:', id);
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }

      producto.precioLista = parseFloat(precioLista);
      producto.porcentajeGanancia = parseFloat(porcentajeGanancia);
      producto.precioFinal = parseFloat(precioFinal);

      await producto.save();
      const totalTime = Date.now() - startTime;
      console.log(`Precios actualizados con éxito para el producto ${id} en ${totalTime}ms`);
      res.status(200).json({ mensaje: 'Precios actualizados con éxito.' });
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`Error al actualizar los precios después de ${totalTime}ms:`, error);
      res.status(500).json({ error: 'Error al actualizar los precios: ' + error.message });
    }
  });

  app.put('/api/productos/:id/agregar-stock', async (req, res) => {
    console.log('Solicitud recibida en /api/productos/:id/agregar-stock');
    const startTime = Date.now();
    try {
      const { id } = req.params;
      const { cantidad, fechaVencimiento } = req.body;

      if (!cantidad || !fechaVencimiento) {
        console.log('Faltan campos requeridos:', req.body);
        return res.status(400).json({ error: 'Faltan campos requeridos.' });
      }

      const producto = await Producto.findById(id);
      if (!producto) {
        console.log('Producto no encontrado para el ID:', id);
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }

      producto.cantidadUnidades += parseInt(cantidad);
      producto.fechaVencimiento = new Date(fechaVencimiento);

      await producto.save();
      const totalTime = Date.now() - startTime;
      console.log(`Stock agregado con éxito para el producto ${id} en ${totalTime}ms`);
      res.status(200).json({ mensaje: 'Stock agregado con éxito.' });
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`Error al agregar stock después de ${totalTime}ms:`, error);
      res.status(500).json({ error: 'Error al agregar stock: ' + error.message });
    }
  });

  app.post('/api/productos/:id/dar-baja', async (req, res) => {
    console.log('Solicitud recibida en /api/productos/:id/dar-baja');
    const startTime = Date.now();
    try {
      const { id } = req.params;
      const { usuarioId, cantidad, motivo, nota } = req.body;

      if (!usuarioId || !cantidad || !motivo) {
        console.log('Faltan campos requeridos:', req.body);
        return res.status(400).json({ error: 'Faltan campos requeridos.' });
      }

      const producto = await Producto.findById(id);
      if (!producto) {
        console.log('Producto no encontrado para el ID:', id);
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }

      if (cantidad > producto.cantidadUnidades) {
        console.log('Cantidad a dar de baja excede el stock disponible:', cantidad, producto.cantidadUnidades);
        return res.status(400).json({ error: 'La cantidad a dar de baja excede el stock disponible.' });
      }

      const nuevaBaja = new Baja({
        productoId: id,
        usuarioId: new mongoose.Types.ObjectId(usuarioId),
        cantidad: parseInt(cantidad),
        motivo,
        nota: nota || ''
      });
      await nuevaBaja.save();

      producto.cantidadUnidades -= parseInt(cantidad);

      if (producto.cantidadUnidades === 0 && motivo === 'eliminacion-permanente') {
        await Producto.findByIdAndDelete(id);
        console.log('Producto eliminado permanentemente:', id);
        return res.status(200).json({ mensaje: 'Producto eliminado permanentemente.' });
      }

      await producto.save();
      const totalTime = Date.now() - startTime;
      console.log(`Producto dado de baja con éxito para el ID ${id} en ${totalTime}ms`);
      res.status(200).json({ mensaje: 'Producto dado de baja con éxito.' });
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`Error al dar de baja el producto después de ${totalTime}ms:`, error);
      res.status(500).json({ error: 'Error al dar de baja el producto: ' + error.message });
    }
  });
};