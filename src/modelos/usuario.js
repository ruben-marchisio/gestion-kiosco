const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Esquema para productos
const productoSchema = new Schema({
  nombre: { type: String, required: true },
  cantidadUnidades: { type: Number, required: true }, // Total de unidades (calculado)
  packs: { type: Number, default: 0 }, // Cantidad de packs
  unidadesPorPack: { type: Number, default: 0 }, // Unidades por pack
  docenas: { type: Number, default: 0 }, // Cantidad de docenas
  unidadesSueltas: { type: Number, default: 0 }, // Unidades sueltas
  marca: { type: String, required: true },
  precioLista: { type: Number, required: true },
  porcentajeGanancia: { type: Number, required: true },
  precioFinal: { type: Number, required: true },
  categoria: { type: String, required: true },
  subcategoria: { type: String },
  unidad: { type: String, enum: ['kilo', 'unidad', 'docena', 'pack'], required: true },
  fechaVencimiento: { type: Date, required: true },
  imagen: { type: String, required: true },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  codigo: { type: String, default: '' } // Código del producto (vacío si no tiene)
});

// Esquema para usuarios
const usuarioSchema = new Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
  nombreKiosco: { type: String, required: true }
});

// Esquema para clientes
const clienteSchema = new Schema({
  nombre: { type: String, required: true },
  dni: { type: String, required: true, unique: true },
  telefono: { type: String },
  direccion: { type: String },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true }
});

// Exportar los modelos
module.exports = {
  Usuario: mongoose.model('Usuario', usuarioSchema),
  Producto: mongoose.model('Producto', productoSchema),
  Cliente: mongoose.model('Cliente', clienteSchema)
};