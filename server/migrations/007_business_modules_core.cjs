exports.up = function (knex) {
  return knex.schema
    .createTable('assets', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.string('asset_tag', 50).notNullable();
      t.string('name', 200).notNullable();
      t.string('category', 100);
      t.enu('status', ['available', 'assigned', 'maintenance', 'retired']).notNullable().defaultTo('available');
      t.date('purchase_date');
      t.decimal('purchase_cost', 12, 2);
      t.enu('depreciation_method', ['straight_line', 'declining', 'none']).notNullable().defaultTo('straight_line');
      t.integer('depreciation_years');
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.unique(['company_id', 'asset_tag']);
    })
    .createTable('asset_assignments', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.integer('asset_id').unsigned().notNullable().references('id').inTable('assets').onDelete('CASCADE');
      t.integer('worker_id').unsigned().notNullable().references('id').inTable('workers').onDelete('CASCADE');
      t.integer('assigned_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.date('start_date').notNullable();
      t.date('end_date');
      t.enu('status', ['assigned', 'returned', 'transferred']).notNullable().defaultTo('assigned');
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('asset_maintenance', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.integer('asset_id').unsigned().notNullable().references('id').inTable('assets').onDelete('CASCADE');
      t.string('type', 100).notNullable();
      t.date('scheduled_date').notNullable();
      t.date('completed_date');
      t.enu('status', ['scheduled', 'in_progress', 'completed', 'cancelled']).notNullable().defaultTo('scheduled');
      t.string('vendor', 200);
      t.decimal('cost', 12, 2);
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('products', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.string('sku', 100).notNullable();
      t.string('name', 200).notNullable();
      t.text('description');
      t.string('uom', 20).notNullable().defaultTo('unit');
      t.decimal('cost', 12, 2).defaultTo(0);
      t.decimal('price', 12, 2).defaultTo(0);
      t.enu('status', ['active', 'inactive']).notNullable().defaultTo('active');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.unique(['company_id', 'sku']);
    })
    .createTable('warehouses', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.string('name', 150).notNullable();
      t.string('location', 200);
      t.boolean('is_default').notNullable().defaultTo(false);
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('inventory_levels', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      t.integer('warehouse_id').unsigned().notNullable().references('id').inTable('warehouses').onDelete('CASCADE');
      t.decimal('quantity', 12, 2).notNullable().defaultTo(0);
      t.decimal('reserved', 12, 2).notNullable().defaultTo(0);
      t.decimal('reorder_point', 12, 2).notNullable().defaultTo(0);
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.unique(['company_id', 'product_id', 'warehouse_id']);
    })
    .createTable('stock_moves', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      t.integer('warehouse_id_from').unsigned().references('id').inTable('warehouses').onDelete('SET NULL');
      t.integer('warehouse_id_to').unsigned().references('id').inTable('warehouses').onDelete('SET NULL');
      t.decimal('quantity', 12, 2).notNullable();
      t.enu('move_type', ['in', 'out', 'transfer', 'adjustment']).notNullable();
      t.enu('status', ['draft', 'posted', 'cancelled']).notNullable().defaultTo('draft');
      t.string('ref_type', 100);
      t.string('ref_id', 100);
      t.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('suppliers', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.string('name', 200).notNullable();
      t.string('email', 200);
      t.string('phone', 50);
      t.enu('status', ['active', 'inactive']).notNullable().defaultTo('active');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('purchase_requests', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.integer('requester_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.enu('status', ['draft', 'submitted', 'approved', 'rejected']).notNullable().defaultTo('draft');
      t.text('reason');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('purchase_request_lines', (t) => {
      t.increments('id').primary();
      t.integer('purchase_request_id').unsigned().notNullable().references('id').inTable('purchase_requests').onDelete('CASCADE');
      t.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      t.decimal('quantity', 12, 2).notNullable();
      t.date('required_date');
    })
    .createTable('purchase_orders', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.integer('supplier_id').unsigned().notNullable().references('id').inTable('suppliers').onDelete('CASCADE');
      t.enu('status', ['draft', 'approved', 'ordered', 'received', 'closed', 'cancelled']).notNullable().defaultTo('draft');
      t.decimal('total', 14, 2).notNullable().defaultTo(0);
      t.string('currency', 3).notNullable().defaultTo('USD');
      t.integer('requested_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.integer('approved_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.date('ordered_at');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('purchase_order_lines', (t) => {
      t.increments('id').primary();
      t.integer('purchase_order_id').unsigned().notNullable().references('id').inTable('purchase_orders').onDelete('CASCADE');
      t.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      t.decimal('quantity', 12, 2).notNullable();
      t.decimal('unit_price', 12, 2).notNullable();
      t.decimal('received_qty', 12, 2).notNullable().defaultTo(0);
    })
    .createTable('goods_receipts', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.integer('purchase_order_id').unsigned().notNullable().references('id').inTable('purchase_orders').onDelete('CASCADE');
      t.enu('status', ['draft', 'received', 'cancelled']).notNullable().defaultTo('draft');
      t.integer('received_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.date('received_at');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('goods_receipt_lines', (t) => {
      t.increments('id').primary();
      t.integer('goods_receipt_id').unsigned().notNullable().references('id').inTable('goods_receipts').onDelete('CASCADE');
      t.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      t.decimal('quantity', 12, 2).notNullable();
    })
    .createTable('customers', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.string('name', 200).notNullable();
      t.string('email', 200);
      t.string('phone', 50);
      t.enu('status', ['active', 'inactive']).notNullable().defaultTo('active');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('leads', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.string('source', 100);
      t.enu('status', ['new', 'qualified', 'converted', 'lost']).notNullable().defaultTo('new');
      t.integer('owner_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.integer('customer_id').unsigned().references('id').inTable('customers').onDelete('SET NULL');
      t.decimal('expected_value', 14, 2).defaultTo(0);
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('quotations', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.integer('customer_id').unsigned().notNullable().references('id').inTable('customers').onDelete('CASCADE');
      t.enu('status', ['draft', 'sent', 'accepted', 'rejected']).notNullable().defaultTo('draft');
      t.decimal('total', 14, 2).notNullable().defaultTo(0);
      t.string('currency', 3).notNullable().defaultTo('USD');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('quotation_lines', (t) => {
      t.increments('id').primary();
      t.integer('quotation_id').unsigned().notNullable().references('id').inTable('quotations').onDelete('CASCADE');
      t.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      t.decimal('quantity', 12, 2).notNullable();
      t.decimal('unit_price', 12, 2).notNullable();
    })
    .createTable('sales_orders', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.integer('customer_id').unsigned().notNullable().references('id').inTable('customers').onDelete('CASCADE');
      t.enu('status', ['draft', 'confirmed', 'fulfilled', 'cancelled']).notNullable().defaultTo('draft');
      t.decimal('total', 14, 2).notNullable().defaultTo(0);
      t.string('currency', 3).notNullable().defaultTo('USD');
      t.integer('approved_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('sales_order_lines', (t) => {
      t.increments('id').primary();
      t.integer('sales_order_id').unsigned().notNullable().references('id').inTable('sales_orders').onDelete('CASCADE');
      t.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      t.decimal('quantity', 12, 2).notNullable();
      t.decimal('unit_price', 12, 2).notNullable();
      t.decimal('delivered_qty', 12, 2).notNullable().defaultTo(0);
    })
    .createTable('invoices', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.integer('customer_id').unsigned().notNullable().references('id').inTable('customers').onDelete('CASCADE');
      t.integer('sales_order_id').unsigned().references('id').inTable('sales_orders').onDelete('SET NULL');
      t.enu('status', ['draft', 'issued', 'paid', 'cancelled']).notNullable().defaultTo('draft');
      t.decimal('total', 14, 2).notNullable().defaultTo(0);
      t.string('currency', 3).notNullable().defaultTo('USD');
      t.date('due_date');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('invoice_lines', (t) => {
      t.increments('id').primary();
      t.integer('invoice_id').unsigned().notNullable().references('id').inTable('invoices').onDelete('CASCADE');
      t.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      t.decimal('quantity', 12, 2).notNullable();
      t.decimal('unit_price', 12, 2).notNullable();
    })
    .createTable('payments', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.integer('invoice_id').unsigned().notNullable().references('id').inTable('invoices').onDelete('CASCADE');
      t.decimal('amount', 14, 2).notNullable();
      t.string('method', 50).notNullable();
      t.enu('status', ['pending', 'paid', 'failed']).notNullable().defaultTo('pending');
      t.date('paid_at');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('gl_accounts', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.string('code', 50).notNullable();
      t.string('name', 200).notNullable();
      t.enu('type', ['asset', 'liability', 'equity', 'income', 'expense']).notNullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.unique(['company_id', 'code']);
    })
    .createTable('journal_entries', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.string('ref_type', 100);
      t.string('ref_id', 100);
      t.date('entry_date').notNullable();
      t.enu('status', ['draft', 'posted']).notNullable().defaultTo('draft');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('journal_lines', (t) => {
      t.increments('id').primary();
      t.integer('journal_entry_id').unsigned().notNullable().references('id').inTable('journal_entries').onDelete('CASCADE');
      t.integer('account_id').unsigned().notNullable().references('id').inTable('gl_accounts').onDelete('CASCADE');
      t.decimal('debit', 14, 2).notNullable().defaultTo(0);
      t.decimal('credit', 14, 2).notNullable().defaultTo(0);
    })
    .createTable('projects', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.string('name', 200).notNullable();
      t.text('description');
      t.enu('status', ['planned', 'active', 'on_hold', 'closed']).notNullable().defaultTo('planned');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('tasks', (t) => {
      t.increments('id').primary();
      t.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
      t.integer('project_id').unsigned().notNullable().references('id').inTable('projects').onDelete('CASCADE');
      t.string('title', 200).notNullable();
      t.text('description');
      t.enu('status', ['todo', 'in_progress', 'done', 'blocked']).notNullable().defaultTo('todo');
      t.integer('assignee_id').unsigned().references('id').inTable('workers').onDelete('SET NULL');
      t.date('due_date');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('tasks')
    .dropTableIfExists('projects')
    .dropTableIfExists('journal_lines')
    .dropTableIfExists('journal_entries')
    .dropTableIfExists('gl_accounts')
    .dropTableIfExists('payments')
    .dropTableIfExists('invoice_lines')
    .dropTableIfExists('invoices')
    .dropTableIfExists('sales_order_lines')
    .dropTableIfExists('sales_orders')
    .dropTableIfExists('quotation_lines')
    .dropTableIfExists('quotations')
    .dropTableIfExists('leads')
    .dropTableIfExists('customers')
    .dropTableIfExists('goods_receipt_lines')
    .dropTableIfExists('goods_receipts')
    .dropTableIfExists('purchase_order_lines')
    .dropTableIfExists('purchase_orders')
    .dropTableIfExists('purchase_request_lines')
    .dropTableIfExists('purchase_requests')
    .dropTableIfExists('suppliers')
    .dropTableIfExists('stock_moves')
    .dropTableIfExists('inventory_levels')
    .dropTableIfExists('warehouses')
    .dropTableIfExists('products')
    .dropTableIfExists('asset_maintenance')
    .dropTableIfExists('asset_assignments')
    .dropTableIfExists('assets');
};
