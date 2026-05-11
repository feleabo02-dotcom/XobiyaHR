exports.up = function (knex) {
  return knex.schema
    .createTable('absence_types', (t) => {
      t.increments('id').primary();
      t.string('code', 50).notNullable().unique();
      t.string('label', 100).notNullable();
      t.boolean('paid').notNullable().defaultTo(true);
      t.decimal('default_entitlement', 6, 2);
      t.boolean('carryover_allowed').defaultTo(false);
      t.decimal('max_carryover', 6, 2);
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('leave_balances', (t) => {
      t.increments('id').primary();
      t.integer('worker_id').unsigned().notNullable().references('id').inTable('workers').onDelete('CASCADE');
      t.integer('absence_type_id').unsigned().notNullable().references('id').inTable('absence_types').onDelete('CASCADE');
      t.decimal('total_entitled', 6, 2).notNullable();
      t.decimal('total_taken', 6, 2).notNullable().defaultTo(0);
      t.decimal('total_pending', 6, 2).notNullable().defaultTo(0);
      t.integer('year').notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.unique(['worker_id', 'absence_type_id', 'year']);
    })
    .createTable('absences', (t) => {
      t.increments('id').primary();
      t.integer('worker_id').unsigned().notNullable().references('id').inTable('workers').onDelete('CASCADE');
      t.integer('absence_type_id').unsigned().notNullable().references('id').inTable('absence_types').onDelete('CASCADE');
      t.date('start_date').notNullable();
      t.date('end_date').notNullable();
      t.decimal('duration_days', 5, 2).notNullable();
      t.enu('status', ['pending', 'approved', 'rejected', 'cancelled']).notNullable().defaultTo('pending');
      t.text('reason');
      t.integer('approved_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('timesheets', (t) => {
      t.increments('id').primary();
      t.integer('worker_id').unsigned().notNullable().references('id').inTable('workers').onDelete('CASCADE');
      t.integer('assignment_id').unsigned().references('id').inTable('assignments').onDelete('SET NULL');
      t.string('project_id', 100);
      t.date('date').notNullable();
      t.decimal('hours', 5, 2).notNullable();
      t.boolean('billable').notNullable().defaultTo(false);
      t.text('description');
      t.enu('status', ['draft', 'submitted', 'approved', 'rejected']).notNullable().defaultTo('draft');
      t.integer('approved_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('work_schedules', (t) => {
      t.increments('id').primary();
      t.string('name', 100).notNullable();
      t.integer('worker_id').unsigned().references('id').inTable('workers').onDelete('CASCADE');
      t.enu('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).notNullable();
      t.time('start_time').notNullable();
      t.time('end_time').notNullable();
      t.decimal('hours', 4, 2).notNullable();
      t.date('effective_from');
      t.date('effective_to');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('work_schedules')
    .dropTableIfExists('timesheets')
    .dropTableIfExists('absences')
    .dropTableIfExists('leave_balances')
    .dropTableIfExists('absence_types');
};
