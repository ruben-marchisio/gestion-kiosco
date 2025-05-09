const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
/* Propósito: Importa las dependencias necesarias */
/* mongoose: Para interactuar con MongoDB */
/* express: Framework para crear el servidor web */
/* cors: Middleware para habilitar solicitudes entre dominios */
/* dotenv: Carga variables de entorno desde .env */
/* path: Maneja rutas de archivos en el sistema */

const usuarioRoutes = require('./routes/usuarios');
const productoRoutes = require('./routes/productos');
const clienteRoutes = require('./routes/clientes');
/* Propósito: Importa las rutas definidas en otros archivos */
/* usuarioRoutes: Maneja registro y autenticación de usuarios */
/* productoRoutes: Gestiona productos (crear, buscar, actualizar, dar de baja) */
/* clienteRoutes: Gestiona clientes (crear, listar) */

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
/* Propósito: Configura la aplicación Express */
/* Carga variables de entorno desde .env */
/* Crea una instancia de Express */
/* Habilita CORS para permitir solicitudes desde el frontend */
/* Configura el middleware para parsear cuerpos JSON */

const publicPath = path.join(__dirname, 'public');
console.log('Ruta del directorio public:', publicPath);
app.use(express.static(publicPath));
/* Propósito: Configura el directorio estático para servir archivos */
/* publicPath: Apunta al directorio public/ donde están los archivos frontend (HTML, CSS, JS) */
/* Sirve archivos estáticos (por ejemplo, index.html, cargar-producto.html) directamente */

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
/* Propósito: Maneja rutas bajo /public/ explícitamente */
/* Sirve archivos desde public/ eliminando el prefijo /public de la URL */
/* Devuelve un error 404 si el archivo no se encuentra */

mongoose.set('strictQuery', true);
/* Propósito: Configura Mongoose para suprimir advertencias de consultas estrictas */
/* Asegura compatibilidad con versiones recientes de Mongoose */

console.log('MONGODB_URI:', process.env.MONGODB_URI);
/* Propósito: Muestra la URI de MongoDB para depuración */
/* Ayuda a verificar que la variable de entorno MONGODB_URI está configurada */

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
/* Propósito: Conecta a la base de datos MongoDB */
/* Usa la URI definida en .env con opciones de reconexión y tiempos de espera */
/* Registra el tiempo de conexión o cualquier error */

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
/* Propósito: Sirve index.html en la ruta raíz (/) */
/* Asegura que la página de bienvenida se cargue directamente */

app.get('/test-static', (req, res) => {
  console.log('Solicitud recibida para /test-static');
  res.sendFile(path.join(publicPath, 'index.html'), (err) => {
    if (err) {
      console.error('Error al servir index.html:', err);
      res.status(500).send('Error al cargar el archivo estático');
    }
  });
});
/* Propósito: Ruta de prueba para verificar el manejo de archivos estáticos */
/* Sirve index.html como ejemplo, útil para depuración */

usuarioRoutes(app);
productoRoutes(app);
clienteRoutes(app);
/* Propósito: Aplica las rutas importadas a la aplicación Express */
/* Configura los endpoints definidos en usuarios.js, productos.js, y clientes.js */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
/* Propósito: Inicia el servidor en el puerto especificado */
/* Usa el puerto definido en .env o el predeterminado (3000) */
/* Registra que el servidor está corriendo */