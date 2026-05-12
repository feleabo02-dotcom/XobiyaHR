exports.up = function (knex) {
  return knex.schema
    .createTable('users', (t) => {
      t.increments('id').primary();
      t.string('email', 200).notNullable().unique();
      t.string('password_hash', 255).notNullable();
      t.string('display_name', 100).notNullable();
      t.string('photo_url', 500);
      t.enu('role', ['employee', 'manager', 'hr', 'payroll', 'finance']).notNullable().defaultTo('employee');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('departments', (t) => {
      t.increments('id').primary();
      t.string('name', 100).notNullable().unique();
      t.string('code', 20).notNullable().unique();
      t.string('cost_center_id', 50);
      t.integer('manager_id').unsigned();
      t.integer('parent_department_id').unsigned().references('id').inTable('departments').onDelete('SET NULL');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('departments').dropTableIfExists('users');
};
