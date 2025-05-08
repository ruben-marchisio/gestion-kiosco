const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Importar rutas
const usuarioRoutes = require('./routes/usuarios');
const productoRoutes = require('./routes/productos');
const clienteRoutes = require('./routes/clientes');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Ajustar la ruta para servir archivos estáticos desde public/
const publicPath = path.join(__dirname, 'public');
console.log('Ruta del directorio public:', publicPath);
app.use(express.static(publicPath));

// Manejar rutas bajo /public/ explícitamente
app.get('/public/*', (req, res) => {
  const filePath = path.join(publicPath, req.path.replace('/public', ''));
  console.log('Intentando servir archivo:', filePath);
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

// Conectar a MongoDB con opciones de reconexión y mayor tiempo de espera
const startTime = Date.now();
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority',
})
  .then(() => {
    const connectionTime = Date.now() - startTime;
    console.log(`Conectado a MongoDB en ${connectionTime}ms`);
  })
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Servir index.html directamente en la ruta raíz
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
  console.log('Solicitud recibida para /test-static');
  res.sendFile(path.join(publicPath, 'index.html'), (err) => {
    if (err) {
      console.error('Error al servir index.html:', err);
      res.status(500).send('Error al cargar el archivo estático');
    }
  });
});

// Usar las rutas
usuarioRoutes(app);
productoRoutes(app);
clienteRoutes(app);

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});