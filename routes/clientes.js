const mongoose = require('mongoose');
const { Cliente } = require('../usuario');

module.exports = (app) => {
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
};