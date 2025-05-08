const mongoose = require('mongoose');
const { Usuario } = require('../usuario');

module.exports = (app) => {
  // Rutas para usuarios
  app.post('/api/registrar-usuario', async (req, res) => {
    console.log('Solicitud recibida en /api/registrar-usuario');
    const startTime = Date.now();
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
        nombre: nombreKiosco,
        nombreKiosco,
        email,
        contrasena
      });

      await nuevoUsuario.save();
      const totalTime = Date.now() - startTime;
      console.log(`Usuario registrado con éxito ${email} en ${totalTime}ms`);
      res.status(201).json({ mensaje: 'Usuario registrado con éxito.' });
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`Error al registrar el usuario después de ${totalTime}ms:`, error);
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

      const usuario = await Usuario.findOne({ email, contrasena }, null, { timeout: 30000 });
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
};