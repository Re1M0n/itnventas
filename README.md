# Ventas App (MVP)

Este repositorio incluye un MVP con un backend API y una UI frontend simple.

- Backend API: Express + Lowdb (JSON) con autenticación básica y roles. Puerto por defecto: 3000.
- Frontend UI: React (UI ampliada) servido en 8008 cuando uses el stack de React; también hay versión estática en frontend/server.js para una prueba rápida. Puerto del API sigue en 4000 (configurable).

Ejecución recomendada
- Iniciar backend: npm install; npm run start
- Iniciar frontend: node frontend/server.js (o crear un script dedicado)

Despliegue con Portainer (Stack de Docker)
- Porta el stack usando Docker Compose disponible en el repo para desplegar API (4000), UI (8008) y MariaDB (3306).
- Portainer puede desplegar stacks desde un repositorio Git o pegar el contenido de docker-compose.yml.
- Recomendaciones:
  1) Si deseas evitar clonar manualmente, usa Portainer con la opción de Stack desde Git y apunta al repo https://github.com/Re1M0n/itnventas.git con el path correcto si es necesario.
  2) Si Portainer no maneja el installer por defecto, puedes usar un runner de instalación (installer-runner) dentro del stack para ejecutar migrations. El runner clonará el repo y ejecutará node installer/setup-single.js init. Este paso se puede desactivar si usas Docker para el stack completo, ya que el propio stack ya no requerirá migraciones desde fuera.
  3) Asegúrate de que el servicio de MariaDB tenga persistencia (volúmenes) y credenciales seguras.
- Pasos básicos:
  a) En Portainer, añade una nueva Stack y usa docker-compose.yml como fuente o pega el contenido del compose.
  b) Si usas Git como fuente, selecciona la rama main y aplica la pila.
  c) Despliega y verifica que los contenedores están corriendo: api (4000), ui (8008) y db (3306).
- Notas:
  - Si el stack ya incluye MariaDB, la migración de datos se puede hacer desde un contenedor de migración separado o manual (installer) si necesitas migraciones iniciales. En entornos Docker, el installer puede estar embebido en el flujo de inicio y omitirse si ya hay la base de datos configurada.
- Si necesitas un snippet de Stack específico para Portainer, te puedo pegar un ejemplo listo para pegar en la UI.

CI
- Se ha agregado un pipeline de CI con GitHub Actions que ejecuta npm ci y npm test en pushes y pull requests a main/master.

-Despliegue y migración
- Puedes usar el instalador de MariaDB (installer) para crear la base de datos y migrar las tablas iniciales. Si trabajas con Docker, este paso se evita.
- El flujo recomendado para migrar la API a MariaDB se puede activar a través del framework de migraciones de installer.
- Iniciar backend: npm install; npm run start
- Iniciar frontend: node frontend/server.js (o usar la UI React en Docker)

Ramas de funcionalidad
- Autenticación y roles (admin, sales)
- Campos de pedido completos y estados (Pendiente, Preparado, etc.)
- Endpoints para clientes, productos, pedidos e historial
- Tests unitarios/integration con Jest y Supertest
