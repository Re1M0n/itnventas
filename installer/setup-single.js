const knexLib = require('knex');
const bcrypt = require('bcryptjs');
const config = require('./knexfile');
const fs = require('fs');

async function isDockerEnvironment() {
  try {
    const data = fs.readFileSync('/proc/1/cgroup', 'utf8');
    return data.includes('docker') || data.includes('kubepods');
  } catch (e) {
    return process.env.DOCKER_ENV === '1';
  }
}

async function migrateAll() {
  const knex = knexLib({ client: 'mariadb', connection: config.connection });
  await knex.migrate.latest();
  // Seed minimal users if needed
  try {
    const count = await knex('usuarios').count('* as c');
    if (count[0].c === 0) {
      const admin = { username: 'admin', password: bcrypt.hashSync('admin', 10), role: 'admin', nombre: 'Administrador' };
      const seller = { username: 'vendedor', password: bcrypt.hashSync('vendedor', 10), role: 'sales', nombre: 'Vendedor' };
      await knex('usuarios').insert([admin, seller]);
    }
  } catch (e) {
    // If table/structure not yet exists, ignore here; migrate should have created it.
  }
  await knex.destroy();
}

module.exports = async function installer(arg) {
  // If running inside Docker, skip installation by default (handled by Docker stack).
  const FORCE_RUN = process.env.FORCE_INSTALLER_RUN === '1';
  const inDocker = await isDockerEnvironment() || process.env.DOCKER_ENV === '1';
  if (inDocker && !FORCE_RUN) {
    console.log('Docker environment detected. Skipping MariaDB installation steps. Set FORCE_INSTALLER_RUN=1 to override.');
    return;
  }
  // Check if MariaDB is reachable
  const knexCheck = knexLib({ client: 'mariadb', connection: config.connection });
  try {
    await knexCheck.raw('SELECT 1');
  } catch (e) {
    console.log('MariaDB no disponible o no accesible. Asegúrate de que el servicio está corriendo.');
    await knexCheck.destroy();
    return;
  }
  await knexCheck.destroy();

  // Si se llama con init o migrate, ejecutamos migraciones y seeds
  if (arg === 'init' || arg === 'migrate') {
    await migrateAll();
    console.log('MariaDB installer: migraciones y seeds ejecutados (si no existían).');
  } else {
    console.log('Uso: node installer/setup-single.js init|migrate');
  }
};
