const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { Usuario, Producto, Cliente } = require('./usuario');

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
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Redirigir la ruta raíz a presentacion.html
app.get('/', (req, res) => {
  console.log('Solicitud recibida para la ruta raíz: /'); // Depuración adicional
  console.log('Redirigiendo a /public/presentacion.html');
  res.redirect('/public/presentacion.html');
});

// Ruta de prueba para verificar archivos estáticos
app.get('/test-static', (req, res) => {
  console.log('Solicitud recibida para /test-static'); // Depuración
  res.sendFile(path.join(publicPath, 'presentacion.html'), (err) => {
    if (err) {
      console.error('Error al servir presentacion.html:', err);
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
  try {
    const { email, contrasena } = req.body;
    console.log('Datos recibidos:', { email, contrasena });

    if (!email || !contrasena) {
      console.log('Faltan campos requeridos:', { email, contrasena });
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }

    const usuario = await Usuario.findOne({ email, contrasena });
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
    console.error('Error al iniciar sesión:', error);
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
      codigo: codigo || ''
    });

    await nuevoProducto.save();

    console.log('Producto cargado con éxito:', nombre);
    res.status(201).json({ mensaje: 'Producto cargado con éxito.' });
  } catch (error) {
    console.error('Error al cargar el producto:', error);
    res.status(500).json({ error: 'Error al cargar el producto: ' + error.message });
  }
});

app.get('/api/productos/codigo/:codigo', async (req, res) => {
  console.log('Solicitud recibida en /api/productos/codigo/:codigo');
  try {
    const { codigo } = req.params;
    console.log('Buscando producto con código:', codigo);

    const producto = await Producto.findOne({ codigo });
    if (!producto) {
      console.log('Producto no encontrado para el código:', codigo);
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    console.log('Producto encontrado:', producto);
    res.status(200).json({ producto });
  } catch (error) {
    console.error('Error al buscar el producto:', error);
    res.status(500).json({ error: 'Error al buscar el producto: ' + error.message });
  }
});

// Nueva ruta para obtener todos los productos de un usuario
app.get('/api/productos', async (req, res) => {
  console.log('Solicitud recibida en /api/productos');
  try {
    const usuarioId = req.query.usuarioId;
    if (!usuarioId) {
      return res.status(400).json({ error: 'Falta el usuarioId.' });
    }

    const productos = await Producto.find({ usuarioId });
    console.log('Productos encontrados:', productos.length);
    res.status(200).json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos: ' + error.message });
  }
});

// Nueva ruta para obtener un producto por ID
app.get('/api/productos/:id', async (req, res) => {
  console.log('Solicitud recibida en /api/productos/:id');
  try {
    const { id } = req.params;
    console.log('Buscando producto con ID:', id);

    const producto = await Producto.findById(id);
    if (!producto) {
      console.log('Producto no encontrado para el ID:', id);
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    console.log('Producto encontrado:', producto);
    res.status(200).json(producto);
  } catch (error) {
    console.error('Error al buscar el producto:', error);
    res.status(500).json({ error: 'Error al buscar el producto: ' + error.message });
  }
});

// Rutas para clientes
app.post('/api/clientes', async (req, res) => {
  console.log('Solicitud recibida en /api/clientes');
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
    console.log('Cliente guardado con éxito:', nombre);
    res.status(201).json({ mensaje: 'Cliente guardado con éxito.' });
  } catch (error) {
    console.error('Error al guardar el cliente:', error);
    res.status(500).json({ error: 'Error al guardar el cliente: ' + error.message });
  }
});

app.get('/api/clientes', async (req, res) => {
  console.log('Solicitud recibida en /api/clientes');
  try {
    const usuarioId = req.query.usuarioId;
    if (!usuarioId) {
      return res.status(400).json({ error: 'Falta el usuarioId.' });
    }

    const clientes = await Cliente.find({ usuarioId });
    console.log('Clientes encontrados:', clientes.length);
    res.status(200).json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes: ' + error.message });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});