const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Esquema para productos (stock local de cada usuario)
const productoSchema = new Schema({
  nombre: { type: String, required: true },
  cantidadUnidades: { type: Number, required: true },
  packs: { type: Number, default: 0 },
  unidadesPorPack: { type: Number, default: 0 },
  docenas: { type: Number, default: 0 },
  unidadesSueltas: { type: Number, default: 0 },
  marca: { type: String, required: true },
  precioLista: { type: Number, required: true },
  porcentajeGanancia: { type: Number, required: true },
  precioFinal: { type: Number, required: true },
  categoria: { type: String, required: true },
  subcategoria: { type: String },
  unidad: { type: String, enum: ['kilo', 'unidad', 'docena', 'pack'], required: true },
  fechaVencimiento: { type: Date, required: true },
  imagen: { type: String, required: false },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  codigo: { type: String, default: '' }
});

// Esquema para productos comunes (base de datos común)
const productoComunSchema = new Schema({
  codigo: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  marca: { type: String, required: true },
  categoria: { type: String, required: true },
  subcategoria: { type: String, default: '' }
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

// Esquema para bajas (registro de acciones de dar de baja)
const bajaSchema = new Schema({
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  cantidad: { type: Number, required: true },
  motivo: { type: String, enum: ['vencimiento', 'rotura', 'regalo', 'eliminacion-permanente'], required: true },
  nota: { type: String, default: '' },
  fecha: { type: Date, default: Date.now }
});

// Exportar los modelos
module.exports = {
  Usuario: mongoose.model('Usuario', usuarioSchema),
  Producto: mongoose.model('Producto', productoSchema),
  Cliente: mongoose.model('Cliente', clienteSchema),
  ProductoComun: mongoose.model('ProductoComun', productoComunSchema),
  Baja: mongoose.model('Baja', bajaSchema)
};