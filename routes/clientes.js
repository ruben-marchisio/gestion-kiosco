const mongoose = require('mongoose');
const { Cliente } = require('../usuario');
/* Propósito: Importa las dependencias necesarias */
/* mongoose: Para interactuar con MongoDB */
/* Cliente: Modelo de cliente definido en el archivo usuario.js */

module.exports = (app) => {
  /* Propósito: Exporta una función que configura las rutas para la aplicación Express */
  /* Recibe la instancia de la app Express como parámetro */

  /* Ruta POST para crear un nuevo cliente */
  app.post('/api/clientes', async (req, res) => {
    console.log('Solicitud recibida en /api/clientes');
    const startTime = Date.now();
    try {
      const { nombre, dni, telefono, direccion, usuarioId } = req.body;
      console.log('Datos recibidos:', { nombre, dni, telefono, direccion, usuarioId });
      /* Extrae los datos del cuerpo de la solicitud (nombre, DNI, teléfono, dirección, usuarioId) */
      /* Registra la solicitud y los datos recibidos para depuración */

      if (!nombre || !dni || !usuarioId) {
        console.log('Faltan campos requeridos:', { nombre, dni, usuarioId });
        return res.status(400).json({ error: 'Faltan campos requeridos.' });
      }
      /* Valida que los campos requeridos (nombre, DNI, usuarioId) estén presentes */
      /* Devuelve un error 400 si faltan */

      const clienteExistente = await Cliente.findOne({ dni });
      if (usuarioId && clienteExistente && clienteExistente.usuarioId.toString() === usuarioId.toString()) {
        console.log('El DNI ya está registrado para este usuario:', dni);
        return res.status(400).json({ error: 'El DNI ya está registrado para este usuario.' });
      }
      /* Verifica si ya existe un cliente con el mismo DNI para el usuario */
      /* Devuelve un error 400 si el DNI ya está registrado */

      const nuevoCliente = new Cliente({
        nombre,
        dni,
        telefono: telefono || '',
        direccion: direccion || '',
        usuarioId: new mongoose.Types.ObjectId(usuarioId)
      });
      /* Crea un nuevo documento de cliente con los datos proporcionados */
      /* Usa valores predeterminados para teléfono y dirección si no se proporcionan */
      /* Convierte usuarioId a ObjectId para MongoDB */

      await nuevoCliente.save();
      const totalTime = Date.now() - startTime;
      console.log(`Cliente guardado con éxito ${nombre} en ${totalTime}ms`);
      res.status(201).json({ mensaje: 'Cliente guardado con éxito.' });
      /* Guarda el cliente en la base de datos */
      /* Registra el tiempo de procesamiento y responde con un mensaje de éxito */
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`Error al guardar el cliente después de ${totalTime}ms:`, error);
      res.status(500).json({ error: 'Error al guardar el cliente: ' + error.message });
      /* Maneja errores durante la operación, registrando el tiempo y el error */
      /* Devuelve un error 500 con el mensaje del error */
    }
  });

  /* Ruta GET para obtener todos los clientes de un usuario */
  app.get('/api/clientes', async (req, res) => {
    console.log('Solicitud recibida en /api/clientes');
    const startTime = Date.now();
    try {
      const usuarioId = req.query.usuarioId;
      if (!usuarioId) {
        return res.status(400).json({ error: 'Falta el usuarioId.' });
      }
      /* Extrae el usuarioId de los parámetros de la consulta */
      /* Devuelve un error 400 si falta usuarioId */

      const clientes = await Cliente.find({ usuarioId });
      const queryTime = Date.now() - startTime;
      console.log(`Consulta a MongoDB completada en ${queryTime}ms`);
      console.log('Clientes encontrados:', clientes.length);
      res.status(200).json(clientes);
      /* Busca todos los clientes asociados al usuarioId en la base de datos */
      /* Registra el tiempo de la consulta y el número de clientes encontrados */
      /* Devuelve la lista de clientes */
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`Error al obtener clientes después de ${totalTime}ms:`, error);
      res.status(500).json({ error: 'Error al obtener clientes: ' + error.message });
      /* Maneja errores durante la operación, registrando el tiempo y el error */
      /* Devuelve un error 500 con el mensaje del error */
    }
  });
};