const express = require('express');
const createDB = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

async function createApp() {
  const db = await createDB();
  const app = express();
  app.use(cors());
  app.use(express.json());

  // simple id generator
  const idGen = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  const SECRET = process.env.JWT_SECRET || 'secret';

  // Seed default users if not present
  await db.read();
  db.data ||= { clientes: [], pedidos: [], pedido_items: [], productos: [], usuarios: [] };
  if (db.data.usuarios.length === 0) {
    const passAdmin = bcrypt.hashSync('admin', 10);
    const passUser = bcrypt.hashSync('vendedor', 10);
    db.data.usuarios.push({ id: idGen(), username: 'admin', password: passAdmin, role: 'admin', nombre: 'Administrador' });
    db.data.usuarios.push({ id: idGen(), username: 'vendedor', password: passUser, role: 'sales', nombre: 'Vendedor' });
  }
  await db.write();

  // Auth helpers
  function authenticate(req, res, next) {
    const header = req.headers['authorization'];
    if (!header) return res.status(401).json({ error: 'auth required' });
    const token = header.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'auth required' });
    jwt.verify(token, SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'invalid token' });
      req.user = user;
      next();
    });
  }
  function authorize(roles) {
    return (req, res, next) => {
      if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
      next();
    };
  }

  // Public login
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = db.data.usuarios.find(u => u.username === username);
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    const ok = bcrypt.compareSync(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });
    const token = jwt.sign({ sub: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, nombre: user.nombre } });
  });

  // Protected routes
  app.use(authenticate);

  // Clientes
  app.get('/clientes', authorize(['admin','sales']), (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    const list = db.data.clientes.filter(c =>
      c.nombre?.toLowerCase().includes(q) || (c.direccion || '').toLowerCase().includes(q)
    );
    res.json(list);
  });

  app.post('/clientes', authorize(['admin','sales']), (req, res) => {
    const { nombre, direccion, telefono, zona, notas } = req.body;
    if (!nombre) return res.status(400).json({ error: 'nombre requerido' });
    const cliente = {
      id: idGen(),
      nombre,
      direccion,
      telefono,
      zona,
      notas,
      fecha_creacion: new Date().toISOString()
    };
    db.data.clientes.push(cliente);
    db.write().then(() => res.status(201).json(cliente));
  });

  app.get('/clientes/:id', authorize(['admin','sales']), (req, res) => {
    const c = db.data.clientes.find(x => x.id === req.params.id);
    if (!c) return res.status(404).json({ error: 'no encontrado' });
    res.json(c);
  });

  app.put('/clientes/:id', authorize(['admin','sales']), (req, res) => {
    const idx = db.data.clientes.findIndex(x => x.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'no encontrado' });
    Object.assign(db.data.clientes[idx], req.body);
    db.write().then(() => res.json(db.data.clientes[idx]));
  });

  // Productos
  app.get('/productos', authorize(['admin','sales']), (req, res) => {
    res.json(db.data.productos);
  });

  app.post('/productos', authorize(['admin']), (req, res) => {
    const { nombre, categoria, precio, activo } = req.body;
    const p = { id: idGen(), nombre, categoria, precio, activo: activo ?? true };
    db.data.productos.push(p);
    db.write().then(() => res.status(201).json(p));
  });

  // Pedidos
  app.get('/pedidos', authorize(['admin','sales']), (req, res) => {
    res.json(db.data.pedidos);
  });

  app.post('/pedidos', authorize(['admin','sales']), (req, res) => {
    const { cliente_id, notas, items } = req.body;
    const cliente = db.data.clientes.find(c => c.id === cliente_id);
    if (!cliente) return res.status(400).json({ error: 'cliente invalido' });
    if (!items || items.length === 0) return res.status(400).json({ error: 'items requeridos' });

    const pedido_id = idGen();
    let total = 0;
    const pedido_items = items.map(it => {
      const prod = db.data.productos.find(p => p.id === it.producto_id);
      const precio = prod ? prod.precio : 0;
      const cantidad = Number(it.cantidad) || 1;
      const subtotal = precio * cantidad;
      total += subtotal;
      return {
        id: idGen(),
        pedido_id,
        producto_id: it.producto_id,
        cantidad,
        precio_unitario: precio,
        subtotal
      };
    });

    const pedido = {
      id: pedido_id,
      cliente_id,
      fecha: new Date().toISOString(),
      estado: 'Pendiente',
      notas,
      total
    };

    db.data.pedidos.push(pedido);
    db.data.pedido_items.push(...pedido_items);
    db.write().then(() => res.status(201).json({ pedido, items: pedido_items }));
  });

  // Proveedores
  app.get('/proveedores', authorize(['admin','sales']), (req, res) => {
    res.json(db.data.proveedores);
  });

  app.post('/proveedores', authorize(['admin']), (req, res) => {
    const { nombre, contacto, telefono, direccion, notas } = req.body;
    if (!nombre) return res.status(400).json({ error: 'nombre requerido' });
    const prov = { id: idGen(), nombre, contacto, telefono, direccion, notas, fecha_creacion: new Date().toISOString() };
    db.data.proveedores.push(prov);
    db.write().then(() => res.status(201).json(prov));
  });

  app.get('/proveedores/:id', authorize(['admin','sales']), (req, res) => {
    const p = db.data.proveedores.find(x => x.id === req.params.id);
    if (!p) return res.status(404).json({ error: 'no encontrado' });
    res.json(p);
  });

  app.get('/proveedores/:id/pedidos', authorize(['admin','sales']), (req, res) => {
    const prov_id = req.params.id;
    const pedidos = db.data.pedido_proveedores.filter(pp => pp.proveedor_id === prov_id);
    const withItems = pedidos.map(pp => ({ ...pp, items: db.data.pedido_proveedor_items.filter(i => i.pedido_proveedor_id === pp.id) }));
    res.json(withItems);
  });

  app.post('/proveedores/:id/pedidos', authorize(['admin','sales']), (req, res) => {
    const prov_id = req.params.id;
    const proveedor = db.data.proveedores.find(p => p.id === prov_id);
    if (!proveedor) return res.status(400).json({ error: 'proveedor invalido' });
    const { notas, items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'items requeridos' });
    const pedido_id = idGen();
    let total = 0;
    const pedido_items = items.map(it => {
      const prod = db.data.productos.find(p => p.id === it.producto_id);
      const precio = prod ? prod.precio : 0;
      const cantidad = Number(it.cantidad) || 1;
      const subtotal = precio * cantidad;
      total += subtotal;
      return {
        id: idGen(),
        pedido_proveedor_id: pedido_id,
        producto_id: it.producto_id,
        cantidad,
        precio_unitario: precio,
        subtotal
      };
    });
    const pedido = {
      id: pedido_id,
      proveedor_id: prov_id,
      fecha: new Date().toISOString(),
      estado: 'Pendiente',
      notas,
      total
    };
    db.data.pedido_proveedores.push(pedido);
    db.data.pedido_proveedor_items.push(...pedido_items.map(pi => ({ ...pi, pedido_proveedor_id: pedido_id })));
    db.write().then(() => res.status(201).json({ pedido, items: pedido_items }));
  });

  // Historial por cliente
  app.get('/clientes/:id/pedidos', authorize(['admin','sales']), (req, res) => {
    const cliente_id = req.params.id;
    const pedidos = db.data.pedidos.filter(p => p.cliente_id === cliente_id);
    const withItems = pedidos.map(p => ({ ...p, items: db.data.pedido_items.filter(i => i.pedido_id === p.id) }));
    res.json(withItems);
  });

  // end of createApp
  return app;
}

if (require.main === module) {
  (async () => {
    const app = await createApp();
    const port = process.env.API_PORT || process.env.PORT || 4000;
    app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
  })();
}
module.exports = createApp;
