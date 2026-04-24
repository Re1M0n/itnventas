const request = require('supertest');
const createApp = require('../server');

let app;
let token;

beforeAll(async () => {
  app = await createApp();
  const loginRes = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'admin' });
  token = loginRes.body?.token;
});

test('admin can login and receive token', () => {
  expect(token).toBeDefined();
});

test('GET /productos returns array', async () => {
  const res = await request(app)
    .get('/productos')
    .set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

test('POST /productos creates a product (admin)', async () => {
  const res = await request(app)
    .post('/productos')
    .set('Authorization', `Bearer ${token}`)
    .send({ nombre: 'Test Producto', categoria: 'test', precio: 1500, activo: true });
  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty('id');
});
