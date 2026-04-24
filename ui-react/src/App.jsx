import React, { useEffect, useState } from 'react'

async function loginUsuario(username, password) {
  const res = await fetch('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
  return res.json();
}

function Login({ onLogin }) {
  const [u, setU] = useState('admin');
  const [p, setP] = useState('admin');
  const [err, setErr] = useState('');
  const handle = async () => {
    const r = await loginUsuario(u, p);
    if (r.token) {
      onLogin(r.token);
    } else {
      setErr(r.error || 'Login fallido');
    }
  };
  return (
    <div className="card">
      <h2>Iniciar Sesión</h2>
      <input value={u} onChange={e => setU(e.target.value)} placeholder="usuario" />
      <input value={p} onChange={e => setP(e.target.value)} placeholder="password" type="password" />
      <button onClick={handle}>Entrar</button>
      {err && <div style={{color:'red'}}>{err}</div>}
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(null);
  const [view, setView] = useState('home');
  // Simple data cache
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  useEffect(() => {
    if (token) {
      // load basic data
      fetch('/clientes', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setClientes);
      fetch('/productos', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setProductos);
      fetch('/proveedores', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setProveedores);
    }
  }, [token]);
  if (!token) {
    return <Login onLogin={t => setToken(t)} />;
  }
  return (
    <div className="container">
      <h1>Ventas UI (React)</h1>
      <nav>
        <button onClick={() => setView('home')}>Inicio</button>
        <button onClick={() => setView('clientes')}>Clientes</button>
        <button onClick={() => setView('pedidos')}>Pedidos</button>
        <button onClick={() => setView('proveedores')}>Proveedores</button>
      </nav>
      {view === 'home' && (
        <div className="card">
          <h2>Bienvenido</h2>
          <p>UI ampliada basada en la maqueta. Usa las pestañas para gestionar clientes, pedidos y proveedores.</p>
        </div>
      )}
      {view === 'clientes' && (
        <ClientesTab onRefresh={() => fetch('/clientes', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setClientes)} clientes={clientes} token={token} />
      )}
      {view === 'pedidos' && (
        <PedidosTab clientes={clientes} productos={productos} token={token} />
      )}
      {view === 'proveedores' && (
        <ProveedoresTab proveedores={proveedores} token={token} />
      )}
    </div>
  );
}

function ClientesTab({ onRefresh, clientes, token }) {
  const [form, setForm] = useState({ nombre:'', direccion:'', telefono:'', zona:'', notas:'' });
  const submit = async (e) => {
    e.preventDefault();
    const res = await fetch('/clientes', { method:'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
    if (res.ok) {
      onRefresh?.();
      setForm({ nombre:'', direccion:'', telefono:'', zona:'', notas:'' });
    }
  };
  return (
    <div className="card">
      <h2>Clientes</h2>
      <form onSubmit={submit}>
        <input placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
        <input placeholder="Dirección" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
        <input placeholder="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
        <input placeholder="Zona" value={form.zona} onChange={e => setForm({ ...form, zona: e.target.value })} />
        <input placeholder="Notas" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
        <button type="submit">Nuevo Cliente</button>
      </form>
      <div>
        {clientes?.length ? clientes.map(c => (
          <div key={c.id}>{c.nombre} - {c.direccion}</div>
        )) : <div>No hay clientes</div>}
      </div>
    </div>
  );
}

function PedidosTab({ clientes, productos, token }) {
  const [clienteId, setClienteId] = useState('');
  const [items, setItems] = useState([{ producto_id: '', cantidad: 1 }]);
  const [notas, setNotas] = useState('');
  useEffect(() => {
    if (clientes.length && !clienteId) setClienteId(clientes[0].id);
  }, [clientes]);
  const addItem = () => setItems([...items, { producto_id: '', cantidad: 1 }]);
  const updateItem = (idx, key, value) => {
    const next = items.slice(); next[idx] = { ...next[idx], [key]: value }; setItems(next);
  };
  const submit = async () => {
    const payload = { cliente_id: clienteId, notas, items };
    await fetch('/pedidos', { method:'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
  };
  return (
    <div className="card">
      <h2>Nuevo Pedido</h2>
      <select value={clienteId} onChange={e => setClienteId(e.target.value)}>
        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
      </select>
      {items.map((it, idx) => (
        <div key={idx}>
          <select value={it.producto_id} onChange={e => updateItem(idx, 'producto_id', e.target.value)}>
            <option value="">Seleccionar producto</option>
            {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <input type="number" min="1" value={it.cantidad} onChange={e => updateItem(idx, 'cantidad', Number(e.target.value))} />
        </div>
      ))}
      <button onClick={addItem}>Agregar producto</button>
      <div>
        <textarea placeholder="Notas" value={notas} onChange={e => setNotas(e.target.value)} />
      </div>
      <button onClick={submit}>Guardar Pedido</button>
    </div>
  );
}

function ProveedoresTab({ proveedores, token }) {
  const [form, setForm] = useState({ nombre:'', contacto:'', telefono:'', direccion:'', notas:'' });
  const [list, setList] = useState(proveedores);
  useEffect(() => { setList(proveedores); }, [proveedores]);
  const submit = async (e) => {
    e.preventDefault();
    const res = await fetch('/proveedores', { method:'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
    if (res.ok) setForm({ nombre:'', contacto:'', telefono:'', direccion:'', notas:'' });
  };
  return (
    <div className="card">
      <h2>Proveedores</h2>
      <form onSubmit={submit}>
        <input placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
        <input placeholder="Contacto" value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} />
        <input placeholder="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
        <input placeholder="Dirección" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
        <input placeholder="Notas" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
        <button type="submit">Nuevo Proveedor</button>
      </form>
      <div>
        {list?.length ? list.map(p => <div key={p.id}>{p.nombre} - {p.contacto}</div>) : <div>No hay proveedores</div>}
      </div>
    </div>
  );
}
