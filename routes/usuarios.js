const mongoose = require('mongoose');
const { Usuario } = require('../usuario');
/* Propósito: Importa las dependencias necesarias */
/* mongoose: Para interactuar con MongoDB */
/* Usuario: Modelo de usuario definido en usuario.js */

module.exports = (app) => {
  /* Propósito: Exporta una función que configura las rutas para la aplicación Express */
  /* Recibe la instancia de la app Express como parámetro */

  /* Ruta POST para registrar un nuevo usuario */
  app.post('/api/registrar-usuario', async (req, res) => {
    console.log('Solicitud recibida en /api/registrar-usuario');
    const startTime = Date.now();
    try {
      const { nombreKiosco, email, contrasena } = req.body;
      console.log('Datos recibidos:', { nombreKiosco, email, contrasena });
      /* Extrae los datos del cuerpo de la solicitud (nombre del kiosco, email, contraseña) */
      /* Registra la solicitud y los datos recibidos para depuración */

      if (!nombreKiosco || !email || !contrasena) {
        console.log('Faltan campos requeridos:', { nombreKiosco, email, contrasena });
        return res.status(400).json({ error: 'Faltan campos requeridos.' });
      }
      /* Valida que los campos requeridos estén presentes */
      /* Devuelve un error 400 si falta algún campo */

      const usuarioExistente = await Usuario.findOne({ email });
      if (usuarioExistente) {
        console.log('El email ya está registrado:', email);
        return res.status(400).json({ error: 'El email ya está registrado.' });
      }
      /* Verifica si ya existe un usuario con el mismo email */
      /* Devuelve un error 400 si el email está registrado */

      const nuevoUsuario = new Usuario({
        nombre: nombreKiosco,
        nombreKiosco,
        email,
        contrasena
      });
      /* Crea un nuevo documento de usuario con los datos proporcionados */
      /* Asigna nombreKiosco a los campos nombre y nombreKiosco del modelo */

      await nuevoUsuario.save();
      const totalTime = Date.now() - startTime;
      console.log(`Usuario registrado con éxito ${email} en ${totalTime}ms`);
      res.status(201).json({ mensaje: 'Usuario registrado con éxito.' });
      /* Guarda el usuario en la base de datos */
      /* Registra el tiempo de procesamiento y responde con un mensaje de éxito */
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`Error al registrar el usuario después de ${totalTime}ms:`, error);
      res.status(500).json({ error: 'Error al registrar el usuario: ' + error.message });
      /* Maneja errores, registrando el tiempo y el error */
      /* Devuelve un error 500 con el mensaje del error */
    }
  });

  /* Ruta POST para iniciar sesión */
  app.post('/api/iniciar-sesion', async (req, res) => {
    console.log('Solicitud recibida en /api/iniciar-sesion');
    const startTime = Date.now();
    try {
      const { email, contrasena } = req.body;
      console.log('Datos recibidos:', { email, contrasena });
      /* Extrae los datos del cuerpo de la solicitud (email, contraseña) */
      /* Registra la solicitud y los datos recibidos para depuración */

      if (!email || !contrasena) {
        console.log('Faltan campos requeridos:', { email, contrasena });
        return res.status(400).json({ error: 'Faltan campos requeridos.' });
      }
      /* Valida que los campos requeridos estén presentes */
      /* Devuelve un error 400 si falta algún campo */

      const usuario = await Usuario.findOne({ email, contrasena }, null, { timeout: 30000 });
      const queryTime = Date.now() - startTime;
      console.log(`Consulta a MongoDB completada en ${queryTime}ms`);
      /* Busca un usuario con el email y contraseña proporcionados */
      /* Establece un tiempo de espera de 30 segundos para la consulta */

      if (!usuario) {
        console.log('Credenciales incorrectas para:', email);
        return res.status(401).json({ error: 'Credenciales incorrectas.' });
      }
      /* Devuelve un error 401 si no se encuentra el usuario o las credenciales no coinciden */

      console.log('Inicio de sesión exitoso para:', email);
      res.status(200).json({
        mensaje: 'Inicio de sesión exitoso.',
        usuarioId: usuario._id,
        nombreKiosco: usuario.nombreKiosco
      });
      /* Responde con un mensaje de éxito, el ID del usuario, y el nombre del kiosco */
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`Error al iniciar sesión después de ${totalTime}ms:`, error);
      res.status(500).json({ error: 'Error al iniciar sesión: ' + error.message });
      /* Maneja errores, registrando el tiempo y el error */
      /* Devuelve un error 500 con el mensaje del error */
    }
  });
};