const { Low, JSONFile } = require('lowdb');

async function createDB() {
  const adapter = new JSONFile('db.json');
  const db = new Low(adapter);
  await db.read();
  db.data ||= { clientes: [], pedidos: [], pedido_items: [], productos: [], proveedores: [], pedido_proveedores: [], pedido_proveedor_items: [] };

  // Seed some productos si están vacíos (opcional, para pruebas rápidas)
  if (db.data.productos.length === 0) {
    db.data.productos.push({ id: 'p1', nombre: 'Gel Fijador', categoria: 'cosmetico', precio: 5000, activo: true });
    db.data.productos.push({ id: 'p2', nombre: 'Capa de Corte', categoria: 'herramientas', precio: 3000, activo: true });
  }

  // Seed proveedores si no existen
  if ((db.data.proveedores?.length ?? 0) === 0) {
    db.data.proveedores.push({ id: 'prov1', nombre: 'Proveedor A', contacto: 'María', telefono: '+1 555 0001', direccion: 'Calle 1 123', notas: 'principal', fecha_creacion: new Date().toISOString() });
    db.data.proveedores.push({ id: 'prov2', nombre: 'Proveedor B', contacto: 'Carlos', telefono: '+1 555 0002', direccion: 'Avenida 2 456', notas: '', fecha_creacion: new Date().toISOString() });
  }

  await db.write();
  return db;
}

module.exports = createDB;
