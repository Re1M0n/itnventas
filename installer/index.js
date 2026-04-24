const knexLib = require('knex');
const path = require('path');
const config = require('./knexfile');

async function createDatabaseIfNotExists(knexRoot, dbName) {
  // Connect to system database to create the target database
  const tmpConfig = { ...config.connection, database: 'mysql' };
  const knex = knexLib({ client: 'mariadb', connection: tmpConfig });
  await knex.raw('CREATE DATABASE IF NOT EXISTS ??', [dbName]);
  await knex.destroy();
}

async function migrate() {
  const targetDb = process.env.MARIA_DATABASE || 'ventas';
  await createDatabaseIfNotExists(knexLib, targetDb);
  const knex = knexLib({ client: 'mariadb', connection: { ...config.connection, database: targetDb } });
  await knex.migrate.latest();
  // Seed minimal users if needed
  const exists = await knex('usuarios').count('* as c');
  if (exists[0].c == 0) {
    const bcrypt = require('bcryptjs');
    const admin = { username: 'admin', password: bcrypt.hashSync('admin', 10), role: 'admin', nombre: 'Administrador' };
    const seller = { username: 'vendedor', password: bcrypt.hashSync('vendedor', 10), role: 'sales', nombre: 'Vendedor' };
    await knex('usuarios').insert([admin, seller]);
  }
  await knex.destroy();
}

function main(){
  const arg = process.argv[2];
  if (arg === 'init') {
    migrate().then(() => console.log('MariaDB: migraciones y seeds ejecutados')).catch(e =>{ console.error(e); process.exit(1);});
  } else if (arg === 'migrate') {
    migrate().then(() => console.log('MariaDB: migraciones ejecutadas')).catch(e =>{ console.error(e); process.exit(1);});
  } else {
    console.log('Uso: node installer/index.js init|migrate');
  }
}

main();
