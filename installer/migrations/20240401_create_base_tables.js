/**
 * Base tables for MariaDB migrations
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('usuarios', t => {
      t.increments('id').primary();
      t.string('username').notNullable().unique();
      t.string('password').notNullable();
      t.string('role').notNullable(); // admin, sales
      t.string('nombre');
      t.timestamps(true, true);
    })
    .createTable('clientes', t => {
      t.increments('id').primary();
      t.string('nombre');
      t.string('direccion');
      t.string('telefono');
      t.string('zona');
      t.text('notas');
      t.timestamp('fecha_creacion').defaultTo(knex.fn.now());
    })
    .createTable('productos', t => {
      t.increments('id').primary();
      t.string('nombre');
      t.string('categoria');
      t.integer('precio');
      t.boolean('activo').defaultTo(true);
    })
    .createTable('pedidos', t => {
      t.increments('id').primary();
      t.integer('cliente_id').unsigned().references('id').inTable('clientes').onDelete('CASCADE');
      t.timestamp('fecha').defaultTo(knex.fn.now());
      t.string('estado');
      t.text('notas');
      t.integer('total');
    })
    .createTable('pedido_items', t => {
      t.increments('id').primary();
      t.integer('pedido_id').unsigned().references('id').inTable('pedidos').onDelete('CASCADE');
      t.integer('producto_id').unsigned().references('id').inTable('productos');
      t.integer('cantidad');
      t.integer('precio_unitario');
      t.integer('subtotal');
    })
    .createTable('proveedores', t => {
      t.increments('id').primary();
      t.string('nombre');
      t.string('contacto');
      t.string('telefono');
      t.string('direccion');
      t.text('notas');
      t.timestamp('fecha_creacion').defaultTo(knex.fn.now());
    })
    .createTable('pedido_proveedores', t => {
      t.increments('id').primary();
      t.integer('proveedor_id').unsigned().references('id').inTable('proveedores').onDelete('SET NULL');
      t.timestamp('fecha').defaultTo(knex.fn.now());
      t.string('estado');
      t.text('notas');
      t.integer('total');
    })
    .createTable('pedido_proveedor_items', t => {
      t.increments('id').primary();
      t.integer('pedido_proveedor_id').unsigned().references('id').inTable('pedido_proveedores').onDelete('CASCADE');
      t.integer('producto_id').unsigned().references('id').inTable('productos');
      t.integer('cantidad');
      t.integer('precio_unitario');
      t.integer('subtotal');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('pedido_proveedor_items')
    .dropTableIfExists('pedido_proveedores')
    .dropTableIfExists('proveedores')
    .dropTableIfExists('pedido_items')
    .dropTableIfExists('pedidos')
    .dropTableIfExists('productos')
    .dropTableIfExists('clientes')
    .dropTableIfExists('usuarios');
};
