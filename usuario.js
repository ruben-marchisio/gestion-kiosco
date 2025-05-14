const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productoSchema = new Schema({
  nombre: { type: String, required: true },
  marca: { type: String, required: true },
  precioLista: { type: Number, required: true },
  porcentajeGanancia: { type: Number, required: true },
  precioFinal: { type: Number, required: true },
  categoria: { type: String, required: true },
  subcategoria: { type: String },
  unidad: { type: String, enum: ['kilo', 'unidad', 'docena', 'pack'], required: true },
  imagen: { type: String, required: false },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  codigo: { type: String, default: '' },
  batches: [{
    lotId: { type: String, required: true },
    quantity: { type: Number, required: true },
    expirationDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true }
  }],
  totalQuantity: { type: Number, default: 0 },
  notificationDays: { type: Number, default: 30 } // Days before expiration for notifications
});

const productoComunSchema = new Schema({
  codigo: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  marca: { type: String, required: true },
  categoria: { type: String, required: true },
  subcategoria: { type: String, default: '' }
});

const usuarioSchema = new Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
  nombreKiosco: { type: String, required: true }
});

const clienteSchema = new Schema({
  nombre: { type: String, required: true },
  dni: { type: String, required: true, unique: true },
  telefono: { type: String },
  direccion: { type: String },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true }
});

const bajaSchema = new Schema({
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  cantidad: { type: Number, required: true },
  motivo: { type: String, enum: ['vencimiento', 'rotura', 'regalo', 'eliminacion-permanente'], required: true },
  nota: { type: String, default: '' },
  fecha: { type: Date, default: Date.now }
});

module.exports = {
  Usuario: mongoose.model('Usuario', usuarioSchema),
  Producto: mongoose.model('Producto', productoSchema),
  Cliente: mongoose.model('Cliente', clienteSchema),
  ProductoComun: mongoose.model('ProductoComun', productoComunSchema),
  Baja: mongoose.model('Baja', bajaSchema)
};