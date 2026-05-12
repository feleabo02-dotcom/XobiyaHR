exports.up = async function (knex) {
  await knex.schema.createTable('companies', (t) => {
    t.increments('id').primary();
    t.string('name', 150).notNullable();
    t.string('code', 30).notNullable().unique();
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.string('timezone', 50).notNullable().defaultTo('UTC');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  const existingCompany = await knex('companies').first();
  if (!existingCompany) {
    await knex('companies').insert({
      id: 1,
      name: 'Default Company',
      code: 'DEFAULT',
      currency: 'USD',
      timezone: 'UTC',
      is_active: true,
    });
  }

  await knex.schema.alterTable('users', (t) => {
    t.integer('default_company_id')
      .unsigned()
      .references('id')
      .inTable('companies')
      .onDelete('SET NULL');
    t.boolean('is_super_admin').notNullable().defaultTo(false);
  });

  await knex.schema.createTable('user_companies', (t) => {
    t.increments('id').primary();
    t.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
    t.boolean('is_default').notNullable().defaultTo(false);
    t.unique(['user_id', 'company_id']);
  });

  await knex.schema.createTable('roles', (t) => {
    t.increments('id').primary();
    t.integer('company_id').unsigned().references('id').inTable('companies').onDelete('CASCADE');
    t.string('name', 50).notNullable();
    t.string('description', 200);
    t.unique(['company_id', 'name']);
  });

  await knex.schema.createTable('permissions', (t) => {
    t.increments('id').primary();
    t.string('module', 50).notNullable();
    t.string('action', 50).notNullable();
    t.string('scope', 50).defaultTo('company');
    t.unique(['module', 'action', 'scope']);
  });

  await knex.schema.createTable('role_permissions', (t) => {
    t.increments('id').primary();
    t.integer('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('CASCADE');
    t.integer('permission_id').unsigned().notNullable().references('id').inTable('permissions').onDelete('CASCADE');
    t.unique(['role_id', 'permission_id']);
  });

  await knex.schema.createTable('user_roles', (t) => {
    t.increments('id').primary();
    t.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('CASCADE');
    t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
    t.unique(['user_id', 'role_id', 'company_id']);
  });

  await knex.schema.createTable('audit_logs', (t) => {
    t.increments('id').primary();
    t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
    t.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    t.string('action', 50).notNullable();
    t.string('table_name', 100).notNullable();
    t.string('record_id', 100).notNullable();
    t.json('old_data');
    t.json('new_data');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('activity_logs', (t) => {
    t.increments('id').primary();
    t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
    t.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    t.string('action', 100).notNullable();
    t.string('ref_type', 100).notNullable();
    t.string('ref_id', 100).notNullable();
    t.text('details');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('attachments', (t) => {
    t.increments('id').primary();
    t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
    t.string('ref_type', 100).notNullable();
    t.string('ref_id', 100).notNullable();
    t.string('file_name', 200).notNullable();
    t.string('file_url', 500).notNullable();
    t.string('mime_type', 100);
    t.integer('uploaded_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('workflow_states', (t) => {
    t.increments('id').primary();
    t.string('module', 50).notNullable();
    t.string('state', 50).notNullable();
    t.boolean('is_terminal').notNullable().defaultTo(false);
    t.integer('sequence').notNullable().defaultTo(0);
    t.unique(['module', 'state']);
  });

  await knex.schema.createTable('workflow_transitions', (t) => {
    t.increments('id').primary();
    t.string('module', 50).notNullable();
    t.string('from_state', 50).notNullable();
    t.string('to_state', 50).notNullable();
    t.string('role_required', 50);
    t.string('action', 50).notNullable();
    t.unique(['module', 'from_state', 'to_state', 'action']);
  });

  await knex.schema.createTable('status_history', (t) => {
    t.increments('id').primary();
    t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
    t.string('ref_type', 100).notNullable();
    t.string('ref_id', 100).notNullable();
    t.string('from_status', 50);
    t.string('to_status', 50).notNullable();
    t.integer('changed_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    t.text('notes');
    t.timestamp('changed_at').defaultTo(knex.fn.now());
  });

  const companyTables = [
    'departments',
    'compensation_grades',
    'positions',
    'workers',
    'assignments',
    'requisitions',
    'candidates',
    'applications',
    'goals',
    'performance_reviews',
    'absence_types',
    'leave_balances',
    'absences',
    'timesheets',
    'work_schedules',
    'payroll_periods',
    'payroll_results',
    'payroll_journal',
    'courses',
    'enrollments',
    'documents',
    'notifications',
  ];

  for (const tableName of companyTables) {
    // eslint-disable-next-line no-await-in-loop
    await knex.schema.alterTable(tableName, (t) => {
      t.integer('company_id')
        .unsigned()
        .notNullable()
        .defaultTo(1)
        .references('id')
        .inTable('companies')
        .onDelete('CASCADE');
    });
  }
};

exports.down = async function (knex) {
  const companyTables = [
    'notifications',
    'documents',
    'enrollments',
    'courses',
    'payroll_journal',
    'payroll_results',
    'payroll_periods',
    'work_schedules',
    'timesheets',
    'absences',
    'leave_balances',
    'absence_types',
    'performance_reviews',
    'goals',
    'applications',
    'candidates',
    'requisitions',
    'assignments',
    'workers',
    'positions',
    'compensation_grades',
    'departments',
  ];

  for (const tableName of companyTables) {
    // eslint-disable-next-line no-await-in-loop
    await knex.schema.alterTable(tableName, (t) => {
      t.dropColumn('company_id');
    });
  }

  await knex.schema.dropTableIfExists('status_history');
  await knex.schema.dropTableIfExists('workflow_transitions');
  await knex.schema.dropTableIfExists('workflow_states');
  await knex.schema.dropTableIfExists('attachments');
  await knex.schema.dropTableIfExists('activity_logs');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('user_companies');

  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('default_company_id');
    t.dropColumn('is_super_admin');
  });

  await knex.schema.dropTableIfExists('companies');
};
