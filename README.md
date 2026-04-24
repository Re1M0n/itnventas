# Ventas App (MVP)

Este repositorio incluye un MVP con un backend API y una UI frontend simple.

- Backend API: Express + Lowdb (JSON) con autenticación básica y roles. Puerto por defecto: 3000.
- Frontend UI: HTML/JS estático servido por un servidor independiente. Puerto: 8008.

Ejecución recomendada
- Iniciar backend: npm install; npm run start
- Iniciar frontend: node frontend/server.js (o crear un script dedicado)

CI
- Se ha agregado un pipeline de CI con GitHub Actions que ejecuta npm ci y npm test en pushes y pull requests a main/master.

Despliegue y migración
- Puedes usar el instalador de MariaDB (installer) para crear la base de datos y migrar las tablas iniciales.
- El flujo recomendado para migrar la API a MariaDB se puede activar a través del framework de migraciones de installer.
- Iniciar backend: npm install; npm run start
- Iniciar frontend: node frontend/server.js (o crear un script dedicado)

Ramas de funcionalidad
- Autenticación y roles (admin, sales)
- Campos de pedido completos y estados (Pendiente, Preparado, etc.)
- Endpoints para clientes, productos, pedidos e historial
- Tests unitarios/integration con Jest y Supertest
