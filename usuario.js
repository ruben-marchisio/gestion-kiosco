const mongoose = require('mongoose');
const Schema = mongoose.Schema;
/* Propósito: Importa las dependencias necesarias */
/* mongoose: Para interactuar con MongoDB */
/* Schema: Clase para definir esquemas de documentos en MongoDB */

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
/* Propósito: Define el esquema para el modelo Producto (stock local de cada usuario) */
/* Campos: Incluye datos esenciales como nombre, cantidades (unidades, packs, docenas), marca, precios, categoría, unidad, fecha de vencimiento, y código */
/* usuarioId: Vincula el producto a un usuario mediante referencia al modelo Usuario */
/* Restricciones: Campos requeridos y valores por defecto para campos opcionales */
/* Nota: imagen no está implementada en el frontend actual, pero está preparada para futuras expansiones */

const productoComunSchema = new Schema({
  codigo: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  marca: { type: String, required: true },
  categoria: { type: String, required: true },
  subcategoria: { type: String, default: '' }
});
/* Propósito: Define el esquema para el modelo ProductoComun (base de datos común de productos) */
/* Campos: Código único, nombre, marca, categoría, y subcategoría opcional */
/* Restricciones: Código único para evitar duplicados */
/* Usado para autocompletar datos en el escáner cuando un producto no está en el stock local */

const usuarioSchema = new Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
  nombreKiosco: { type: String, required: true }
});
/* Propósito: Define el esquema para el modelo Usuario */
/* Campos: Nombre (coincide con nombreKiosco), email único, contraseña, y nombre del kiosco */
/* Restricciones: Email único para evitar usuarios duplicados */
/* Usado para registro y autenticación en rutas/usuarios.js */

const clienteSchema = new Schema({
  nombre: { type: String, required: true },
  dni: { type: String, required: true, unique: true },
  telefono: { type: String },
  direccion: { type: String },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true }
});
/* Propósito: Define el esquema para el modelo Cliente */
/* Campos: Nombre, DNI único, teléfono y dirección opcionales, y usuarioId para vincular al usuario */
/* Restricciones: DNI único para evitar clientes duplicados */
/* Usado para gestionar clientes en rutas/clientes.js */

const bajaSchema = new Schema({
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  cantidad: { type: Number, required: true },
  motivo: { type: String, enum: ['vencimiento', 'rotura', 'regalo', 'eliminacion-permanente'], required: true },
  nota: { type: String, default: '' },
  fecha: { type: Date, default: Date.now }
});
/* Propósito: Define el esquema para el modelo Baja (registro de bajas de productos) */
/* Campos: Referencias a producto y usuario, cantidad, motivo (con valores específicos), nota opcional, y fecha automática */
/* Restricciones: productoId, usuarioId, cantidad, y motivo son requeridos */
/* Usado para registrar bajas en rutas/productos.js */

module.exports = {
  Usuario: mongoose.model('Usuario', usuarioSchema),
  Producto: mongoose.model('Producto', productoSchema),
  Cliente: mongoose.model('Cliente', clienteSchema),
  ProductoComun: mongoose.model('ProductoComun', productoComunSchema),
  Baja: mongoose.model('Baja', bajaSchema)
};
/* Propósito: Exporta los modelos para usarlos en otros archivos */
/* Cada modelo se crea a partir de su esquema correspondiente */
/* Usado por rutas/usuarios.js, rutas/productos.js, y rutas/clientes.js */