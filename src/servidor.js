const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const { Usuario, Producto, Cliente } = require('./modelos/usuario');

const app = express();
const port = process.env.PORT || 3000;

// Configura strictQuery para suprimir la advertencia de Mongoose
mongoose.set('strictQuery', false);

// Conectar a MongoDB usando una variable de entorno con opciones de tiempo de espera
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/gestion-kiosco';
console.log('Intentando conectar a MongoDB con URI:', mongoURI.replace(/:.*@/, ':****@')); // Ocultar credenciales en los logs
mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 5000, // Tiempo de espera para la selección del servidor
  socketTimeoutMS: 45000, // Tiempo de espera para operaciones de socket
})
  .then(() => console.log('Conectado a MongoDB exitosamente'))
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err.message);
    process.exit(1); // Termina el proceso si no se puede conectar a MongoDB
  });

// Configuración del servidor
app.use(cors({ origin: '*' })); // Permitir solicitudes desde cualquier origen (para pruebas)
app.use(express.json());

// Servir archivos estáticos desde la carpeta public, montados en /public
app.use('/public', express.static(path.join(__dirname, '../public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css') || path.endsWith('.js') || path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Configuración de multer para la subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/imagenes/productos/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `producto-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB para las imágenes
});

// Ruta de salud para verificar que el servidor está funcionando
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

// Ruta para registrar un nuevo usuario
app.post('/api/registrarse', async (req, res) => {
  console.log('Solicitud recibida en /api/registrarse:', req.body);
  const { nombre, email, contrasena, 'nombre-kiosco': nombreKiosco } = req.body;

  try {
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      console.log('Usuario ya registrado:', email);
      return res.status(400).json({ error: 'El email ya está registrado.' });
    }

    const nuevoUsuario = new Usuario({ nombre, email, contrasena, nombreKiosco });
    await nuevoUsuario.save();

    console.log('Usuario registrado con éxito:', email);
    res.status(201).json({ mensaje: 'Usuario registrado con éxito.' });
  } catch (error) {
    console.error('Error al registrar el usuario:', error.message);
    res.status(500).json({ error: 'Error al registrar el usuario: ' + error.message });
  }
});

// Ruta para iniciar sesión
app.post('/api/iniciar-sesion', async (req, res) => {
  console.log('Solicitud recibida en /api/iniciar-sesion:', req.body);
  const { email, contrasena } = req.body;

  try {
    const usuario = await Usuario.findOne({ email, contrasena });
    if (!usuario) {
      console.log('Usuario no encontrado:', { email, contrasena });
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    }

    console.log('Inicio de sesión exitoso:', { usuarioId: usuario._id });
    res.status(200).json({ mensaje: 'Inicio de sesión exitoso.', usuarioId: usuario._id });
  } catch (error) {
    console.error('Error al procesar /api/iniciar-sesion:', error.message);
    res.status(500).json({ error: 'Error al iniciar sesión: ' + error.message });
  }
});

// Ruta para cargar un nuevo producto
app.post('/api/productos', upload.single('imagen'), async (req, res) => {
  console.log('Solicitud recibida en /api/productos');
  try {
    console.log('Datos recibidos:', req.body);
    console.log('Archivo recibido:', req.file);

    if (!req.file) {
      console.log('Falta la imagen del producto');
      return res.status(400).json({ error: 'Falta la imagen del producto.' });
    }

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
      cantidadUnidades
    } = req.body;

    if (!nombre || !marca || !precioLista || !porcentajeGanancia || !precioFinal || !categoria || !unidad || !fechaVencimiento || !usuarioId || !cantidadUnidades) {
      console.log('Faltan campos requeridos:', req.body);
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }

    const imagen = `/imagenes/productos/${req.file.filename}`;

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
      imagen,
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      codigo: codigo || ''
    });

    await nuevoProducto.save();

    console.log('Producto cargado con éxito:', nombre);
    res.status(201).json({ mensaje: 'Producto cargado con éxito.' });
  } catch (error) {
    console.error('Error al cargar el producto:', error.message);
    res.status(500).json({ error: 'Error al cargar el producto: ' + error.message });
  }
});

// Ruta para buscar un producto por código
app.get('/api/productos/codigo/:codigo', async (req, res) => {
  console.log('Solicitud recibida en /api/productos/codigo:', req.params.codigo);
  try {
    const producto = await Producto.findOne({ codigo: req.params.codigo });
    if (!producto) {
      console.log('Producto no encontrado:', req.params.codigo);
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.status(200).json({ producto });
  } catch (error) {
    console.error('Error al buscar el producto:', error.message);
    res.status(500).json({ error: 'Error al buscar el producto: ' + error.message });
  }
});

// Ruta para obtener todos los productos del usuario
app.get('/api/productos/no-escaneados', async (req, res) => {
  console.log('Solicitud recibida en /api/productos/no-escaneados:', req.query);
  try {
    const usuarioId = req.query.usuarioId;
    const productos = await Producto.find({ usuarioId: new mongoose.Types.ObjectId(usuarioId) });
    res.status(200).json({ productos });
  } catch (error) {
    console.error('Error al obtener los productos:', error.message);
    res.status(500).json({ error: 'Error al obtener los productos: ' + error.message });
  }
});

// Ruta para vender múltiples productos
app.post('/api/vender', async (req, res) => {
  console.log('Solicitud recibida en /api/vender:', req.body);
  try {
    const { productos, usuarioId } = req.body;

    if (!productos || !Array.isArray(productos) || productos.length === 0 || !usuarioId) {
      console.log('Faltan campos requeridos:', req.body);
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }

    for (let item of productos) {
      const { codigo, productoId, cantidad, metodoVenta } = item;

      if (!cantidad || (!codigo && !productoId)) {
        console.log('Faltan campos requeridos para un producto:', item);
        return res.status(400).json({ error: 'Faltan campos requeridos para uno de los productos.' });
      }

      let producto;
      if (codigo) {
        producto = await Producto.findOne({ codigo, usuarioId: new mongoose.Types.ObjectId(usuarioId) });
      } else if (productoId) {
        producto = await Producto.findOne({ _id: new mongoose.Types.ObjectId(productoId), usuarioId: new mongoose.Types.ObjectId(usuarioId) });
      }

      if (!producto) {
        console.log('Producto no encontrado:', item);
        return res.status(404).json({ error: `Producto ${item.nombre} no encontrado.` });
      }

      let cantidadVendidaUnidades = parseInt(cantidad);
      if (metodoVenta === 'pack') {
        cantidadVendidaUnidades = cantidadVendidaUnidades * producto.unidadesPorPack;
      } else if (metodoVenta === 'docena') {
        cantidadVendidaUnidades = cantidadVendidaUnidades * 12;
      } else if (metodoVenta === 'kilo') {
        cantidadVendidaUnidades = cantidadVendidaUnidades;
      }

      if (producto.cantidadUnidades < cantidadVendidaUnidades) {
        console.log('Cantidad insuficiente:', { producto: item.nombre, stock: producto.cantidadUnidades, solicitado: cantidadVendidaUnidades });
        return res.status(400).json({ error: `Cantidad insuficiente en stock para ${item.nombre}.` });
      }

      producto.cantidadUnidades -= cantidadVendidaUnidades;

      // Recalcular packs, docenas y sueltas
      let unidadesRestantes = producto.cantidadUnidades;
      if (producto.unidad === 'pack' && producto.unidadesPorPack > 0) {
        producto.packs = Math.floor(unidadesRestantes / producto.unidadesPorPack);
        unidadesRestantes = unidadesRestantes % producto.unidadesPorPack;
      } else {
        producto.packs = 0;
      }

      if (producto.unidad === 'docena') {
        producto.docenas = Math.floor(unidadesRestantes / 12);
        unidadesRestantes = unidadesRestantes % 12;
      } else {
        producto.docenas = 0;
      }

      producto.unidadesSueltas = unidadesRestantes;

      await producto.save();
    }

    console.log('Venta realizada con éxito');
    res.status(200).json({ mensaje: 'Venta realizada con éxito. Stock actualizado.' });
  } catch (error) {
    console.error('Error al vender los productos:', error.message);
    res.status(500).json({ error: 'Error al vender los productos: ' + error.message });
  }
});

// Ruta para listar todos los usuarios (para pruebas)
app.get('/api/usuarios', async (req, res) => {
  console.log('Solicitud recibida en /api/usuarios');
  try {
    const usuarios = await Usuario.find();
    res.status(200).json(usuarios);
  } catch (error) {
    console.error('Error al listar los usuarios:', error.message);
    res.status(500).json({ error: 'Error al listar los usuarios: ' + error.message });
  }
});

// Ruta para cargar un nuevo cliente
app.post('/api/clientes', async (req, res) => {
  console.log('Solicitud recibida en /api/clientes:', req.body);
  const { nombre, dni, telefono, direccion, usuarioId } = req.body;

  try {
    if (!nombre || !dni || !usuarioId) {
      console.log('Faltan campos requeridos:', req.body);
      return res.status(400).json({ error: 'Faltan campos requeridos: nombre, DNI y usuarioId son obligatorios.' });
    }

    const clienteExistente = await Cliente.findOne({ dni });
    if (clienteExistente) {
      console.log('DNI ya registrado:', dni);
      return res.status(400).json({ error: 'El DNI ya está registrado.' });
    }

    const nuevoCliente = new Cliente({
      nombre,
      dni,
      telefono: telefono || '',
      direccion: direccion || '',
      usuarioId: new mongoose.Types.ObjectId(usuarioId)
    });

    await nuevoCliente.save();

    console.log('Cliente registrado con éxito:', nombre);
    res.status(201).json({ mensaje: 'Cliente registrado con éxito.' });
  } catch (error) {
    console.error('Error al registrar el cliente:', error.message);
    res.status(500).json({ error: 'Error al registrar el cliente: ' + error.message });
  }
});

// Ruta para obtener la lista de clientes
app.get('/api/clientes', async (req, res) => {
  console.log('Solicitud recibida en /api/clientes:', req.query);
  try {
    const usuarioId = req.query.usuarioId;
    if (!usuarioId) {
      console.log('Falta usuarioId');
      return res.status(400).json({ error: 'Faltan campos requeridos: usuarioId es obligatorio.' });
    }

    const clientes = await Cliente.find({ usuarioId: new mongoose.Types.ObjectId(usuarioId) });
    res.status(200).json({ clientes });
  } catch (error) {
    console.error('Error al obtener los clientes:', error.message);
    res.status(500).json({ error: 'Error al obtener los clientes: ' + error.message });
  }
});

// Ruta para la página de presentación como página principal
app.get('/', (req, res) => {
  console.log('Solicitud recibida en /');
  res.sendFile(path.join(__dirname, '../public/presentacion.html'));
});

// Rutas para las nuevas páginas
app.get('/public/cargar-producto.html', (req, res) => {
  console.log('Solicitud recibida en /public/cargar-producto.html');
  res.sendFile(path.join(__dirname, '../public/cargar-producto.html'));
});

app.get('/public/vender-producto.html', (req, res) => {
  console.log('Solicitud recibida en /public/vender-producto.html');
  res.sendFile(path.join(__dirname, '../public/vender-producto.html'));
});

app.get('/public/clientes.html', (req, res) => {
  console.log('Solicitud recibida en /public/clientes.html');
  res.sendFile(path.join(__dirname, '../public/clientes.html'));
});

// Iniciar el servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});