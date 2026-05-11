exports.up = function (knex) {
  return knex.schema
    .createTable('requisitions', (t) => {
      t.increments('id').primary();
      t.integer('position_id').unsigned().notNullable().references('id').inTable('positions').onDelete('CASCADE');
      t.decimal('budgeted_salary', 12, 2);
      t.string('currency', 3).defaultTo('USD');
      t.enu('status', ['open', 'closed', 'cancelled']).notNullable().defaultTo('open');
      t.integer('requested_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.integer('approved_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.date('open_date');
      t.date('close_date');
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('candidates', (t) => {
      t.increments('id').primary();
      t.string('first_name', 100).notNullable();
      t.string('last_name', 100).notNullable();
      t.string('email', 200).notNullable();
      t.string('phone', 50);
      t.string('linkedin_url', 500);
      t.string('current_company', 200);
      t.string('current_title', 200);
      t.text('resume_text');
      t.string('resume_file_url', 500);
      t.string('source', 50);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('applications', (t) => {
      t.increments('id').primary();
      t.integer('requisition_id').unsigned().notNullable().references('id').inTable('requisitions').onDelete('CASCADE');
      t.integer('candidate_id').unsigned().notNullable().references('id').inTable('candidates').onDelete('CASCADE');
      t.enu('stage', ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected']).notNullable().defaultTo('applied');
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('goals', (t) => {
      t.increments('id').primary();
      t.integer('worker_id').unsigned().notNullable().references('id').inTable('workers').onDelete('CASCADE');
      t.string('title', 200).notNullable();
      t.text('description');
      t.enu('type', ['okr', 'mbo', 'kpi']).notNullable().defaultTo('okr');
      t.enu('status', ['draft', 'active', 'completed', 'cancelled']).notNullable().defaultTo('draft');
      t.date('start_date');
      t.date('end_date');
      t.decimal('weight', 5, 2).defaultTo(1.0);
      t.decimal('progress', 5, 2).defaultTo(0);
      t.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('performance_reviews', (t) => {
      t.increments('id').primary();
      t.integer('worker_id').unsigned().notNullable().references('id').inTable('workers').onDelete('CASCADE');
      t.integer('reviewer_id').unsigned().notNullable().references('id').inTable('workers').onDelete('CASCADE');
      t.string('title', 200).notNullable();
      t.enu('type', ['annual', 'quarterly', 'probation', '360']).notNullable();
      t.enu('status', ['draft', 'in_progress', 'completed', 'acknowledged']).notNullable().defaultTo('draft');
      t.decimal('overall_rating', 3, 1);
      t.text('summary');
      t.date('review_date');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('performance_reviews')
    .dropTableIfExists('goals')
    .dropTableIfExists('applications')
    .dropTableIfExists('candidates')
    .dropTableIfExists('requisitions');
};
