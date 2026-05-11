exports.up = function (knex) {
  return knex.schema
    .createTable('compensation_grades', (t) => {
      t.increments('id').primary();
      t.string('code', 20).notNullable().unique();
      t.string('title', 100).notNullable();
      t.decimal('min_salary', 12, 2);
      t.decimal('mid_salary', 12, 2);
      t.decimal('max_salary', 12, 2);
      t.string('currency', 3).defaultTo('USD');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('positions', (t) => {
      t.increments('id').primary();
      t.string('title', 200).notNullable();
      t.integer('grade_id').unsigned().references('id').inTable('compensation_grades').onDelete('SET NULL');
      t.string('cost_center_id', 50).notNullable();
      t.integer('department_id').unsigned().references('id').inTable('departments').onDelete('SET NULL');
      t.string('location', 100);
      t.decimal('fte', 5, 2).notNullable().defaultTo(1.0);
      t.decimal('budgeted_salary', 12, 2);
      t.enu('status', ['filled', 'vacant', 'frozen']).notNullable().defaultTo('vacant');
      t.text('description');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('workers', (t) => {
      t.increments('id').primary();
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.string('employee_id', 50).unique();
      t.string('first_name', 100).notNullable();
      t.string('last_name', 100).notNullable();
      t.string('email', 200).notNullable().unique();
      t.string('phone', 50);
      t.enu('worker_type', ['employee', 'contractor', 'intern', 'contingent']).notNullable().defaultTo('employee');
      t.date('hire_date');
      t.date('termination_date');
      t.enu('status', ['active', 'onboarding', 'offboarding', 'terminated']).notNullable().defaultTo('onboarding');
      t.integer('department_id').unsigned().references('id').inTable('departments').onDelete('SET NULL');
      t.string('job_title', 200);
      t.integer('grade_id').unsigned().references('id').inTable('compensation_grades').onDelete('SET NULL');
      t.string('photo_url', 500);
      t.string('timezone', 50).defaultTo('UTC');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('assignments', (t) => {
      t.increments('id').primary();
      t.integer('worker_id').unsigned().notNullable().references('id').inTable('workers').onDelete('CASCADE');
      t.integer('position_id').unsigned().notNullable().references('id').inTable('positions').onDelete('CASCADE');
      t.date('start_date').notNullable();
      t.date('end_date');
      t.integer('manager_id').unsigned().references('id').inTable('workers').onDelete('SET NULL');
      t.boolean('is_primary').notNullable().defaultTo(true);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('assignments')
    .dropTableIfExists('workers')
    .dropTableIfExists('positions')
    .dropTableIfExists('compensation_grades');
};
