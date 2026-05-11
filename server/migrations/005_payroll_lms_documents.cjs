exports.up = function (knex) {
  return knex.schema
    .createTable('payroll_periods', (t) => {
      t.increments('id').primary();
      t.string('code', 50).notNullable().unique();
      t.date('start_date').notNullable();
      t.date('end_date').notNullable();
      t.enu('status', ['open', 'processing', 'closed']).notNullable().defaultTo('open');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('payroll_results', (t) => {
      t.increments('id').primary();
      t.integer('worker_id').unsigned().notNullable().references('id').inTable('workers').onDelete('CASCADE');
      t.integer('payroll_period_id').unsigned().notNullable().references('id').inTable('payroll_periods').onDelete('CASCADE');
      t.decimal('gross_pay', 12, 2).notNullable().defaultTo(0);
      t.decimal('deductions', 12, 2).notNullable().defaultTo(0);
      t.decimal('net_pay', 12, 2).notNullable().defaultTo(0);
      t.decimal('employer_tax', 12, 2).notNullable().defaultTo(0);
      t.decimal('employer_benefits', 12, 2).notNullable().defaultTo(0);
      t.text('details_json');
      t.string('currency', 3).defaultTo('USD');
      t.enu('status', ['draft', 'approved', 'paid']).notNullable().defaultTo('draft');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('payroll_journal', (t) => {
      t.increments('id').primary();
      t.integer('payroll_result_id').unsigned().notNullable().references('id').inTable('payroll_results').onDelete('CASCADE');
      t.string('gl_account', 50).notNullable();
      t.decimal('debit', 12, 2).notNullable().defaultTo(0);
      t.decimal('credit', 12, 2).notNullable().defaultTo(0);
      t.string('cost_center_id', 50);
      t.text('description');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('courses', (t) => {
      t.increments('id').primary();
      t.string('title', 200).notNullable();
      t.text('description');
      t.enu('type', ['online', 'classroom', 'blended']).notNullable().defaultTo('online');
      t.string('provider', 200);
      t.decimal('duration_hours', 8, 2);
      t.boolean('mandatory').notNullable().defaultTo(false);
      t.enu('status', ['active', 'archived']).notNullable().defaultTo('active');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('enrollments', (t) => {
      t.increments('id').primary();
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('CASCADE');
      t.integer('worker_id').unsigned().notNullable().references('id').inTable('workers').onDelete('CASCADE');
      t.date('enrollment_date').notNullable();
      t.date('completion_date');
      t.enu('status', ['enrolled', 'in_progress', 'completed', 'failed']).notNullable().defaultTo('enrolled');
      t.decimal('score', 5, 2);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('documents', (t) => {
      t.increments('id').primary();
      t.integer('worker_id').unsigned().references('id').inTable('workers').onDelete('CASCADE');
      t.string('title', 200).notNullable();
      t.enu('category', ['contract', 'nda', 'review', 'certification', 'identification', 'other']).notNullable();
      t.string('file_url', 500).notNullable();
      t.string('mime_type', 100);
      t.boolean('is_signed').notNullable().defaultTo(false);
      t.date('expiry_date');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('notifications', (t) => {
      t.increments('id').primary();
      t.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('title', 200).notNullable();
      t.text('body');
      t.string('type', 50).defaultTo('info');
      t.string('link', 500);
      t.boolean('is_read').notNullable().defaultTo(false);
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('notifications')
    .dropTableIfExists('documents')
    .dropTableIfExists('enrollments')
    .dropTableIfExists('courses')
    .dropTableIfExists('payroll_journal')
    .dropTableIfExists('payroll_results')
    .dropTableIfExists('payroll_periods');
};
