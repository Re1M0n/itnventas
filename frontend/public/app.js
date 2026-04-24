// Cliente API base ( dinámica para Docker vs dev )
// En dev local: http://localhost:4000
// En docker (red de docker): http://api:4000
const host = (typeof window !== 'undefined') ? window.location.hostname : 'localhost';
const API_BASE = (host === 'localhost' || host === '127.0.0.1') ? 'http://localhost:4000' : 'http://api:4000';

let token = null;

function $(sel) { return document.querySelector(sel); }
function api(path, opts = {}) {
  const headers = opts.headers || {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...opts, headers: { ...headers, 'Content-Type': 'application/json' } }).then(res => res.json().then(data => ({ status: res.status, data })));
}

function renderLogin() {
  const html = `
    <div class="card">
      <h2>Iniciar Sesión</h2>
      <input id="username" placeholder="usuario" />
      <input id="password" placeholder="password" type="password" />
      <button id="loginBtn">Entrar</button>
      <div id="loginMsg" style="color:red"></div>
    </div>`;
  $('#app').innerHTML = html;
  $('#loginBtn').onclick = async () => {
    const u = $('#username').value;
    const p = $('#password').value;
    const res = await fetch(`${API_BASE}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
    const body = await res.json();
    if (res.ok) {
      token = body.token;
      renderDashboard();
    } else {
      $('#loginMsg').innerText = body.error || 'Login fallido';
    }
  };
};

async function renderDashboard() {
  const [clientesRes, productosRes] = await Promise.all([
    api('/clientes', { method:'GET' }),
    api('/productos', { method:'GET' })
  ]);
  const clientes = clientesRes?.data ?? [];
  const productos = productosRes?.data ?? [];
  const html = `
  <div class="card">
    <h2>Buscar Cliente</h2>
    <input id="searchClient" placeholder="Buscar cliente..." />
    <button id="btnSearch">Buscar</button>
    <div id="clients"></div>
  </div>
  <div class="card">
    <h2>Nuevo Pedido</h2>
    <select id="clienteSel"></select>
    <div id="pedidoItems"></div>
    <button id="btnAddItem">Agregar Producto</button>
    <div><button id="btnSavePedido">Guardar Pedido</button></div>
  </div>
  <div class="card">
    <h2>Pedidos</h2>
    <div id="pedidosList"></div>
  </div>`;
  $('#app').innerHTML = html;

  // populate clientes and products
  const clienteSel = $('#clienteSel');
  clientes.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id; opt.text = c.nombre; clienteSel.add(opt);
  });
  const pedidoItems = $('#pedidoItems');
  const addItem = () => {
    const div = document.createElement('div');
    div.innerHTML = `<select class="prodSel">${productos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}</select>
      <input type="number" min="1" value="1" class="qty"/>
      `;
    pedidoItems.appendChild(div);
  };
  $('#btnAddItem').onclick = addItem;
  addItem();
  $('#btnSavePedido').onclick = async () => {
    // gather items
    const items = [];
    pedidoItems.querySelectorAll(':scope > div').forEach(d => {
      const prod = d.querySelector('.prodSel').value;
      const qty = parseInt(d.querySelector('.qty').value || '1', 10);
      items.push({ producto_id: prod, cantidad: qty });
    });
    const cliente_id = $('#clienteSel').value;
    await api('/pedidos', { method:'POST', body: JSON.stringify({ cliente_id, notas:'UI', items }) }).then(r => console.log(r));
  };
  $('#btnSearch').onclick = async () => {
    const q = $('#searchClient').value;
    const res = await api('/clientes?q=' + encodeURIComponent(q));
    const list = res?.data ?? [];
    const div = document.getElementById('clients');
    div.innerHTML = '<h3>Resultados</h3>' + list.map(x => `<div>${x.nombre} - ${x.direccion || ''}</div>`).join('');
  };
  // fetch and display existing pedidos
  const pedidos = await api('/pedidos', { method:'GET' });
  const pedidosList = $('#pedidosList');
  pedidosList.innerHTML = (pedidos?.data ?? []).length ? pedidos.data.map(p => `<div>${p.id} - ${p.total}</div>`).join('') : '<div>No hay pedidos</div>';
}

(function init(){ renderLogin(); })();
