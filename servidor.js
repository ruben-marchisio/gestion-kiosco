const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { Usuario, Producto, Cliente, ProductoComun, Baja } = require('./usuario');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Ajustar la ruta para servir archivos estáticos desde public/
const publicPath = path.join(__dirname, 'public');
console.log('Ruta del directorio public:', publicPath); // Depuración
app.use(express.static(publicPath));

// Manejar rutas bajo /public/ explícitamente
app.get('/public/*', (req, res) => {
  const filePath = path.join(publicPath, req.path.replace('/public', ''));
  console.log('Intentando servir archivo:', filePath); // Depuración
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error al servir archivo:', err);
      res.status(404).send('Archivo no encontrado');
    }
  });
});

// Configurar strictQuery para suprimir la advertencia de Mongoose
mongoose.set('strictQuery', true);

// Depuración: Mostrar el valor de MONGODB_URI
console.log('MONGODB_URI:', process.env.MONGODB_URI);

// Conectar a MongoDB
const startTime = Date.now();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    const connectionTime = Date.now() - startTime;
    console.log(`Conectado a MongoDB en ${connectionTime}ms`);
  })
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Servir index.html (antes presentacion.html) directamente en la ruta raíz
app.get('/', (req, res) => {
  console.log('Solicitud recibida para la ruta raíz: /');
  console.log('Sirviendo /public/index.html directamente');
  res.sendFile(path.join(publicPath, 'index.html'), (err) => {
    if (err) {
      console.error('Error al servir index.html:', err);
      res.status(500).send('Error al cargar la página de presentación');
    }
  });
});

// Ruta de prueba para verificar archivos estáticos
app.get('/test-static', (req, res) => {
  console.log('Solicitud recibida para /test-static'); // Depuración
  res.sendFile(path.join(publicPath, 'index.html'), (err) => {
    if (err) {
      console.error('Error al servir index.html:', err);
      res.status(500).send('Error al cargar el archivo estático');
    }
  });
});

// Rutas para usuarios
app.post('/api/registrar-usuario', async (req, res) => {
  console.log('Solicitud recibida en /api/registrar-usuario');
  try {
    const { nombreKiosco, email, contrasena } = req.body;
    console.log('Datos recibidos:', { nombreKiosco, email, contrasena });

    if (!nombreKiosco || !email || !contrasena) {
      console.log('Faltan campos requeridos:', { nombreKiosco, email, contrasena });
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }

    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      console.log('El email ya está registrado:', email);
      return res.status(400).json({ error: 'El email ya está registrado.' });
    }

    const nuevoUsuario = new Usuario({
      nombre: nombreKiosco, // Ajustado según el esquema
      nombreKiosco,
      email,
      contrasena
    });

    await nuevoUsuario.save();
    console.log('Usuario registrado con éxito:', email);
    res.status(201).json({ mensaje: 'Usuario registrado con éxito.' });
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(500).json({ error: 'Error al registrar el usuario: ' + error.message });
  }
});

app.post('/api/iniciar-sesion', async (req, res) => {
  console.log('Solicitud recibida en /api/iniciar-sesion');
  const startTime = Date.now();
  try {
    const { email, contrasena } = req.body;
    console.log('Datos recibidos:', { email, contrasena });

    if (!email || !contrasena) {
      console.log('Faltan campos requeridos:', { email, contrasena });
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }

    const usuario = await Usuario.findOne({ email, contrasena });
    const queryTime = Date.now() - startTime;
    console.log(`Consulta a MongoDB completada en ${queryTime}ms`);

    if (!usuario) {
      console.log('Credenciales incorrectas para:', email);
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    console.log('Inicio de sesión exitoso para:', email);
    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso.',
      usuarioId: usuario._id,
      nombreKiosco: usuario.nombreKiosco
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`Error al iniciar sesión después de ${totalTime}ms:`, error);
    res.status(500).json({ error: 'Error al iniciar sesión: ' + error.message });
  }
});

// Rutas para productos
app.post('/api/productos', async (req, res) => {
  console.log('Solicitud recibida en /api/productos');
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
      codigo: codigo ? codigo.toString().trim() : '' // Normalizar el código
    });

    await nuevoProducto.save();

    // Si el producto tiene código de barras, guardarlo en la base de datos común (si no existe)
    if (codigo && codigo.trim() !== '') {
      const existeEnComunes = await ProductoComun.findOne({ codigo: codigo.toString().trim() });
      if (!existeEnComunes) {
        const nuevoProductoComun = new ProductoComun({
          codigo: codigo.toString().trim(),
          nombre,
          marca,
          categoria,
          subcategoria: subcategoria || ''
        });
        await nuevoProductoComun.save();
        console.log('Producto guardado en la base de datos común:', codigo);
      }
    }

    console.log('Producto cargado con éxito:', nombre);
    res.status(201).json({ mensaje: 'Producto cargado con éxito.' });
  } catch (error) {
    console.error('Error al cargar el producto:', error);
    res.status(500).json({ error: 'Error al cargar el producto: ' + error.message });
  }
});

app.get('/api/productos/codigo/:codigo', async (req, res) => {
  console.log('Solicitud recibida en /api/productos/codigo/:codigo');
  const startTime = Date.now();
  try {
    const { codigo } = req.params;
    const usuarioId = req.query.usuarioId; // Obtener usuarioId de los parámetros de consulta
    console.log('Buscando producto con código:', codigo, 'para usuario:', usuarioId);

    const producto = await Producto.findOne({ 
      codigo: codigo.toString().trim(), 
      usuarioId: new mongoose.Types.ObjectId(usuarioId) 
    });
    const queryTime = Date.now() - startTime;
    console.log(`Consulta a MongoDB completada en ${queryTime}ms`);

    if (!producto) {
      console.log('Producto no encontrado en el stock del usuario para el código:', codigo);
      // Mostrar todos los códigos para depuración
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
      // Mostrar todos los códigos para depuración
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

// Nueva ruta para obtener todos los productos de un usuario
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

// Nueva ruta para obtener un producto por ID
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

// Nueva ruta para actualizar los precios de un producto
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

// Nueva ruta para agregar stock a un producto existente
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

// Nueva ruta para dar de baja un producto
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

    // Registrar la baja
    const nuevaBaja = new Baja({
      productoId: id,
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      cantidad: parseInt(cantidad),
      motivo,
      nota: nota || ''
    });
    await nuevaBaja.save();

    // Actualizar la cantidad del producto
    producto.cantidadUnidades -= parseInt(cantidad);

    // Si la cantidad llega a 0 y el motivo es "eliminacion-permanente", eliminar el producto
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

// Rutas para clientes
app.post('/api/clientes', async (req, res) => {
  console.log('Solicitud recibida en /api/clientes');
  const startTime = Date.now();
  try {
    const { nombre, dni, telefono, direccion, usuarioId } = req.body;
    console.log('Datos recibidos:', { nombre, dni, telefono, direccion, usuarioId });

    if (!nombre || !dni || !usuarioId) {
      console.log('Faltan campos requeridos:', { nombre, dni, usuarioId });
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }

    const clienteExistente = await Cliente.findOne({ dni });
    if (usuarioId && clienteExistente && clienteExistente.usuarioId.toString() === usuarioId.toString()) {
      console.log('El DNI ya está registrado para este usuario:', dni);
      return res.status(400).json({ error: 'El DNI ya está registrado para este usuario.' });
    }

    const nuevoCliente = new Cliente({
      nombre,
      dni,
      telefono: telefono || '',
      direccion: direccion || '',
      usuarioId: new mongoose.Types.ObjectId(usuarioId)
    });

    await nuevoCliente.save();
    const totalTime = Date.now() - startTime;
    console.log(`Cliente guardado con éxito ${nombre} en ${totalTime}ms`);
    res.status(201).json({ mensaje: 'Cliente guardado con éxito.' });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`Error al guardar el cliente después de ${totalTime}ms:`, error);
    res.status(500).json({ error: 'Error al guardar el cliente: ' + error.message });
  }
});

app.get('/api/clientes', async (req, res) => {
  console.log('Solicitud recibida en /api/clientes');
  const startTime = Date.now();
  try {
    const usuarioId = req.query.usuarioId;
    if (!usuarioId) {
      return res.status(400).json({ error: 'Falta el usuarioId.' });
    }

    const clientes = await Cliente.find({ usuarioId });
    const queryTime = Date.now() - startTime;
    console.log(`Consulta a MongoDB completada en ${queryTime}ms`);
    console.log('Clientes encontrados:', clientes.length);
    res.status(200).json(clientes);
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`Error al obtener clientes después de ${totalTime}ms:`, error);
    res.status(500).json({ error: 'Error al obtener clientes: ' + error.message });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});