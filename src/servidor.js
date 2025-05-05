const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configurar strictQuery para suprimir la advertencia de Mongoose
mongoose.set('strictQuery', true);

// Depuración: Mostrar el valor de MONGODB_URI
console.log('MONGODB_URI:', process.env.MONGODB_URI);

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Redirigir la ruta raíz a inicio-sesion.html
app.get('/', (req, res) => {
  res.redirect('/public/inicio-sesion.html');
});

// Esquema para el usuario
const usuarioSchema = new mongoose.Schema({
  nombreKiosco: String,
  email: { type: String, unique: true },
  contrasena: String,
  fechaCreacion: { type: Date, default: Date.now }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

// Esquema para el producto
const productoSchema = new mongoose.Schema({
  nombre: String,
  cantidadUnidades: Number,
  packs: Number,
  unidadesPorPack: Number,
  docenas: Number,
  unidadesSueltas: Number,
  marca: String,
  precioLista: Number,
  porcentajeGanancia: Number,
  precioFinal: Number,
  categoria: String,
  subcategoria: String,
  unidad: String,
  fechaVencimiento: Date,
  icono: String,
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  codigo: String
});

const Producto = mongoose.model('Producto', productoSchema);

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

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});