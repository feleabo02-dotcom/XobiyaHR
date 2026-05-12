const bcrypt = require('bcryptjs');

function permissionKey(moduleName, action) {
  return `${moduleName}:${action}`;
}

exports.seed = async function (knex) {
  await knex('status_history').del();
  await knex('activity_logs').del();
  await knex('audit_logs').del();
  await knex('attachments').del();
  await knex('tasks').del();
  await knex('projects').del();
  await knex('journal_lines').del();
  await knex('journal_entries').del();
  await knex('gl_accounts').del();
  await knex('payments').del();
  await knex('invoice_lines').del();
  await knex('invoices').del();
  await knex('sales_order_lines').del();
  await knex('sales_orders').del();
  await knex('quotation_lines').del();
  await knex('quotations').del();
  await knex('leads').del();
  await knex('customers').del();
  await knex('goods_receipt_lines').del();
  await knex('goods_receipts').del();
  await knex('purchase_order_lines').del();
  await knex('purchase_orders').del();
  await knex('purchase_request_lines').del();
  await knex('purchase_requests').del();
  await knex('suppliers').del();
  await knex('stock_moves').del();
  await knex('inventory_levels').del();
  await knex('warehouses').del();
  await knex('products').del();
  await knex('asset_maintenance').del();
  await knex('asset_assignments').del();
  await knex('assets').del();
  await knex('notifications').del();
  await knex('documents').del();
  await knex('enrollments').del();
  await knex('courses').del();
  await knex('payroll_journal').del();
  await knex('payroll_results').del();
  await knex('payroll_periods').del();
  await knex('work_schedules').del();
  await knex('timesheets').del();
  await knex('absences').del();
  await knex('leave_balances').del();
  await knex('absence_types').del();
  await knex('performance_reviews').del();
  await knex('goals').del();
  await knex('applications').del();
  await knex('candidates').del();
  await knex('requisitions').del();
  await knex('assignments').del();
  await knex('workers').del();
  await knex('positions').del();
  await knex('compensation_grades').del();
  await knex('departments').del();
  await knex('user_roles').del();
  await knex('role_permissions').del();
  await knex('permissions').del();
  await knex('roles').del();
  await knex('user_companies').del();
  await knex('users').del();
  await knex('companies').del();

  const hash = bcrypt.hashSync('admin123', 12);

  const [companyId] = await knex('companies').insert({
    id: 1,
    name: 'Xobiya Holdings',
    code: 'XOBIYA',
    currency: 'USD',
    timezone: 'UTC',
    is_active: true,
  });

  const roleRows = [
    { name: 'super_admin', description: 'Full access across the system' },
    { name: 'admin', description: 'System administrator' },
    { name: 'manager', description: 'Team manager with approvals' },
    { name: 'hr', description: 'HR operations' },
    { name: 'accountant', description: 'Finance and accounting' },
    { name: 'sales_rep', description: 'Sales operations' },
    { name: 'procurement_officer', description: 'Procurement operations' },
    { name: 'warehouse_staff', description: 'Warehouse operations' },
    { name: 'employee', description: 'Standard employee access' },
    { name: 'project_manager', description: 'Project delivery' },
  ].map((role) => ({ ...role, company_id: companyId }));

  await knex('roles').insert(roleRows);
  const roles = await knex('roles').select('id', 'name');
  const roleMap = roles.reduce((acc, role) => {
    acc[role.name] = role.id;
    return acc;
  }, {});

  const modules = ['hr', 'payroll', 'attendance', 'assets', 'inventory', 'procurement', 'sales', 'crm', 'accounting', 'projects', 'reporting', 'attachments', 'activity'];
  const actions = ['read', 'create', 'update', 'approve', 'delete'];

  const permissionRows = [
    { module: 'system', action: 'read', scope: 'company' },
    { module: 'system', action: 'manage', scope: 'company' },
  ];

  modules.forEach((moduleName) => {
    actions.forEach((action) => {
      permissionRows.push({ module: moduleName, action, scope: 'company' });
    });
  });

  await knex('permissions').insert(permissionRows);
  const permissions = await knex('permissions').select('id', 'module', 'action');
  const permMap = permissions.reduce((acc, perm) => {
    acc[permissionKey(perm.module, perm.action)] = perm.id;
    return acc;
  }, {});

  const rolePermissions = [];
  const addPerms = (roleName, entries) => {
    entries.forEach((entry) => {
      const permId = permMap[permissionKey(entry.module, entry.action)];
      if (permId) rolePermissions.push({ role_id: roleMap[roleName], permission_id: permId });
    });
  };

  const allPermissions = permissionRows
    .filter((perm) => perm.module !== 'system')
    .map((perm) => ({ module: perm.module, action: perm.action }))
    .concat([{ module: 'system', action: 'read' }, { module: 'system', action: 'manage' }]);

  addPerms('super_admin', allPermissions);
  addPerms('admin', allPermissions);
  addPerms('manager', [
    { module: 'hr', action: 'read' },
    { module: 'hr', action: 'approve' },
    { module: 'attendance', action: 'read' },
    { module: 'attendance', action: 'approve' },
    { module: 'projects', action: 'read' },
    { module: 'projects', action: 'update' },
  ]);
  addPerms('hr', [
    { module: 'hr', action: 'read' },
    { module: 'hr', action: 'create' },
    { module: 'hr', action: 'update' },
    { module: 'attendance', action: 'read' },
    { module: 'attendance', action: 'approve' },
    { module: 'payroll', action: 'read' },
  ]);
  addPerms('accountant', [
    { module: 'accounting', action: 'read' },
    { module: 'accounting', action: 'create' },
    { module: 'accounting', action: 'update' },
    { module: 'sales', action: 'read' },
    { module: 'payroll', action: 'read' },
  ]);
  addPerms('sales_rep', [
    { module: 'sales', action: 'read' },
    { module: 'sales', action: 'create' },
    { module: 'sales', action: 'update' },
    { module: 'crm', action: 'read' },
    { module: 'crm', action: 'create' },
  ]);
  addPerms('procurement_officer', [
    { module: 'procurement', action: 'read' },
    { module: 'procurement', action: 'create' },
    { module: 'procurement', action: 'approve' },
    { module: 'inventory', action: 'read' },
  ]);
  addPerms('warehouse_staff', [
    { module: 'inventory', action: 'read' },
    { module: 'inventory', action: 'create' },
    { module: 'inventory', action: 'update' },
  ]);
  addPerms('employee', [
    { module: 'hr', action: 'read' },
    { module: 'attendance', action: 'read' },
  ]);
  addPerms('project_manager', [
    { module: 'projects', action: 'read' },
    { module: 'projects', action: 'create' },
    { module: 'projects', action: 'update' },
  ]);

  await knex('role_permissions').insert(rolePermissions);

  // Users
  await knex('users').insert([
    {
      id: 1,
      email: 'admin@xobiya.com',
      password_hash: hash,
      display_name: 'Admin User',
      role: 'hr',
      is_active: true,
      default_company_id: companyId,
      is_super_admin: true,
    },
    {
      id: 2,
      email: 'manager@xobiya.com',
      password_hash: hash,
      display_name: 'Sarah Manager',
      role: 'manager',
      is_active: true,
      default_company_id: companyId,
      is_super_admin: false,
    },
    {
      id: 3,
      email: 'employee@xobiya.com',
      password_hash: hash,
      display_name: 'John Employee',
      role: 'employee',
      is_active: true,
      default_company_id: companyId,
      is_super_admin: false,
    },
    {
      id: 4,
      email: 'accountant@xobiya.com',
      password_hash: hash,
      display_name: 'Alex Accountant',
      role: 'finance',
      is_active: true,
      default_company_id: companyId,
      is_super_admin: false,
    },
    {
      id: 5,
      email: 'sales@xobiya.com',
      password_hash: hash,
      display_name: 'Dana Sales',
      role: 'employee',
      is_active: true,
      default_company_id: companyId,
      is_super_admin: false,
    },
  ]);

  await knex('user_companies').insert([
    { user_id: 1, company_id: companyId, is_default: true },
    { user_id: 2, company_id: companyId, is_default: true },
    { user_id: 3, company_id: companyId, is_default: true },
    { user_id: 4, company_id: companyId, is_default: true },
    { user_id: 5, company_id: companyId, is_default: true },
  ]);

  await knex('user_roles').insert([
    { user_id: 1, role_id: roleMap.super_admin, company_id: companyId },
    { user_id: 1, role_id: roleMap.admin, company_id: companyId },
    { user_id: 2, role_id: roleMap.manager, company_id: companyId },
    { user_id: 2, role_id: roleMap.project_manager, company_id: companyId },
    { user_id: 3, role_id: roleMap.employee, company_id: companyId },
    { user_id: 4, role_id: roleMap.accountant, company_id: companyId },
    { user_id: 5, role_id: roleMap.sales_rep, company_id: companyId },
  ]);

  // Departments
  await knex('departments').insert([
    { id: 1, name: 'Engineering', code: 'ENG', cost_center_id: 'CC-ENG-001', company_id: companyId },
    { id: 2, name: 'Sales', code: 'SALES', cost_center_id: 'CC-SALES-002', company_id: companyId },
    { id: 3, name: 'Marketing', code: 'MKTG', cost_center_id: 'CC-MKTG-003', company_id: companyId },
    { id: 4, name: 'Human Resources', code: 'HR', cost_center_id: 'CC-HR-004', company_id: companyId },
    { id: 5, name: 'Finance', code: 'FIN', cost_center_id: 'CC-FIN-005', company_id: companyId },
  ]);

  // Compensation Grades
  await knex('compensation_grades').insert([
    { id: 1, code: 'L3', title: 'Associate', min_salary: 40000, mid_salary: 55000, max_salary: 70000, company_id: companyId },
    { id: 2, code: 'L4', title: 'Senior Associate', min_salary: 55000, mid_salary: 75000, max_salary: 95000, company_id: companyId },
    { id: 3, code: 'L5', title: 'Manager', min_salary: 75000, mid_salary: 95000, max_salary: 120000, company_id: companyId },
    { id: 4, code: 'L6', title: 'Senior Manager', min_salary: 95000, mid_salary: 125000, max_salary: 160000, company_id: companyId },
    { id: 5, code: 'E1', title: 'Executive', min_salary: 150000, mid_salary: 200000, max_salary: 300000, company_id: companyId },
  ]);

  // Workers
  await knex('workers').insert([
    { id: 1, user_id: 1, employee_id: 'EMP-001', first_name: 'Admin', last_name: 'User', email: 'admin@xobiya.com', worker_type: 'employee', hire_date: '2020-01-15', status: 'active', department_id: 4, job_title: 'HR Director', grade_id: 5, company_id: companyId },
    { id: 2, user_id: 2, employee_id: 'EMP-002', first_name: 'Sarah', last_name: 'Manager', email: 'sarah@xobiya.com', worker_type: 'employee', hire_date: '2021-03-01', status: 'active', department_id: 1, job_title: 'Engineering Manager', grade_id: 4, company_id: companyId },
    { id: 3, user_id: 3, employee_id: 'EMP-003', first_name: 'John', last_name: 'Employee', email: 'john@xobiya.com', worker_type: 'employee', hire_date: '2022-06-15', status: 'active', department_id: 1, job_title: 'Software Engineer', grade_id: 3, company_id: companyId },
    { id: 4, employee_id: 'EMP-004', first_name: 'Alice', last_name: 'Johnson', email: 'alice@xobiya.com', worker_type: 'employee', hire_date: '2021-09-01', status: 'active', department_id: 1, job_title: 'Senior Developer', grade_id: 3, company_id: companyId },
    { id: 5, employee_id: 'EMP-005', first_name: 'Bob', last_name: 'Smith', email: 'bob@xobiya.com', worker_type: 'employee', hire_date: '2023-01-10', status: 'onboarding', department_id: 2, job_title: 'Sales Representative', grade_id: 2, company_id: companyId },
    { id: 6, employee_id: 'CON-001', first_name: 'Carol', last_name: 'Davis', email: 'carol@xobiya.com', worker_type: 'contractor', hire_date: '2024-03-01', status: 'active', department_id: 3, job_title: 'Marketing Consultant', grade_id: 3, company_id: companyId },
  ]);

  // Positions
  await knex('positions').insert([
    { id: 1, title: 'Engineering Manager', grade_id: 4, cost_center_id: 'CC-ENG-001', department_id: 1, location: 'London', fte: 1.0, budgeted_salary: 125000, status: 'filled', company_id: companyId },
    { id: 2, title: 'Senior Software Engineer', grade_id: 3, cost_center_id: 'CC-ENG-001', department_id: 1, location: 'London', fte: 1.0, budgeted_salary: 95000, status: 'filled', company_id: companyId },
    { id: 3, title: 'Software Engineer', grade_id: 2, cost_center_id: 'CC-ENG-001', department_id: 1, location: 'London', fte: 1.0, budgeted_salary: 75000, status: 'vacant', company_id: companyId },
    { id: 4, title: 'Sales Representative', grade_id: 2, cost_center_id: 'CC-SALES-002', department_id: 2, location: 'New York', fte: 1.0, budgeted_salary: 70000, status: 'filled', company_id: companyId },
    { id: 5, title: 'Marketing Manager', grade_id: 4, cost_center_id: 'CC-MKTG-003', department_id: 3, location: 'Remote', fte: 1.0, budgeted_salary: 110000, status: 'vacant', company_id: companyId },
    { id: 6, title: 'HR Director', grade_id: 5, cost_center_id: 'CC-HR-004', department_id: 4, location: 'London', fte: 1.0, budgeted_salary: 200000, status: 'filled', company_id: companyId },
    { id: 7, title: 'Financial Analyst', grade_id: 2, cost_center_id: 'CC-FIN-005', department_id: 5, location: 'London', fte: 0.5, budgeted_salary: 40000, status: 'frozen', company_id: companyId },
  ]);

  // Assignments
  await knex('assignments').insert([
    { id: 1, worker_id: 2, position_id: 1, start_date: '2021-03-01', manager_id: 1, is_primary: true, company_id: companyId },
    { id: 2, worker_id: 3, position_id: 2, start_date: '2022-06-15', manager_id: 2, is_primary: true, company_id: companyId },
    { id: 3, worker_id: 4, position_id: 2, start_date: '2021-09-01', manager_id: 2, is_primary: false, company_id: companyId },
    { id: 4, worker_id: 5, position_id: 4, start_date: '2023-01-10', manager_id: 1, is_primary: true, company_id: companyId },
    { id: 5, worker_id: 1, position_id: 6, start_date: '2020-01-15', is_primary: true, company_id: companyId },
    { id: 6, worker_id: 6, position_id: 2, start_date: '2024-03-01', manager_id: 2, is_primary: true, company_id: companyId },
  ]);

  // Requisitions
  await knex('requisitions').insert([
    { id: 1, position_id: 3, budgeted_salary: 75000, status: 'open', requested_by: 2, open_date: '2026-04-01', notes: 'Backfill for departed team member', company_id: companyId },
    { id: 2, position_id: 5, budgeted_salary: 110000, status: 'open', requested_by: 1, open_date: '2026-04-15', notes: 'New headcount approved in Q2 planning', company_id: companyId },
    { id: 3, position_id: 7, budgeted_salary: 40000, status: 'closed', requested_by: 1, approved_by: 1, open_date: '2026-01-10', close_date: '2026-02-01', notes: 'Budget frozen due to restructuring', company_id: companyId },
  ]);

  // Absence types
  await knex('absence_types').insert([
    { id: 1, code: 'vacation', label: 'Annual Leave', paid: true, default_entitlement: 20, carryover_allowed: true, max_carryover: 5, company_id: companyId },
    { id: 2, code: 'sick', label: 'Sick Leave', paid: true, default_entitlement: 10, carryover_allowed: false, company_id: companyId },
    { id: 3, code: 'personal', label: 'Personal Leave', paid: true, default_entitlement: 3, carryover_allowed: false, company_id: companyId },
    { id: 4, code: 'maternity', label: 'Maternity Leave', paid: true, default_entitlement: 180, carryover_allowed: false, company_id: companyId },
    { id: 5, code: 'other', label: 'Other Leave', paid: false, carryover_allowed: false, company_id: companyId },
  ]);

  // Leave balances
  await knex('leave_balances').insert([
    { worker_id: 1, absence_type_id: 1, total_entitled: 25, total_taken: 12, total_pending: 2, year: 2026, company_id: companyId },
    { worker_id: 2, absence_type_id: 1, total_entitled: 22, total_taken: 8, total_pending: 0, year: 2026, company_id: companyId },
    { worker_id: 3, absence_type_id: 1, total_entitled: 20, total_taken: 5, total_pending: 3, year: 2026, company_id: companyId },
    { worker_id: 4, absence_type_id: 1, total_entitled: 22, total_taken: 10, total_pending: 1, year: 2026, company_id: companyId },
    { worker_id: 5, absence_type_id: 1, total_entitled: 20, total_taken: 2, total_pending: 0, year: 2026, company_id: companyId },
  ]);

  // Absences
  await knex('absences').insert([
    { worker_id: 3, absence_type_id: 1, start_date: '2026-05-20', end_date: '2026-05-24', duration_days: 5, status: 'pending', reason: 'Family vacation', company_id: companyId },
    { worker_id: 4, absence_type_id: 2, start_date: '2026-05-12', end_date: '2026-05-13', duration_days: 2, status: 'approved', reason: 'Doctor appointment', company_id: companyId },
    { worker_id: 1, absence_type_id: 1, start_date: '2026-06-01', end_date: '2026-06-05', duration_days: 5, status: 'approved', reason: 'Annual leave', company_id: companyId },
  ]);

  // Goals
  await knex('goals').insert([
    { worker_id: 3, title: 'Complete microservices migration', description: 'Migrate 3 legacy services to microservices architecture', type: 'okr', status: 'active', start_date: '2026-01-01', end_date: '2026-06-30', weight: 0.4, progress: 60, created_by: 2, company_id: companyId },
    { worker_id: 3, title: 'Improve test coverage', description: 'Achieve 85% code coverage across all services', type: 'kpi', status: 'active', start_date: '2026-01-01', end_date: '2026-12-31', weight: 0.3, progress: 45, created_by: 2, company_id: companyId },
    { worker_id: 3, title: 'Mentor junior developers', description: 'Conduct weekly code reviews and pair programming sessions', type: 'mbo', status: 'active', start_date: '2026-03-01', end_date: '2026-09-30', weight: 0.3, progress: 35, created_by: 2, company_id: companyId },
  ]);

  // Courses
  await knex('courses').insert([
    { id: 1, title: 'AWS Cloud Practitioner Certification', description: 'Prepare for the AWS Cloud Practitioner exam', type: 'online', provider: 'AWS Training', duration_hours: 16, mandatory: false, status: 'active', company_id: companyId },
    { id: 2, title: 'Data Privacy & GDPR Compliance', description: 'Mandatory training on data protection regulations', type: 'online', provider: 'Compliance Team', duration_hours: 4, mandatory: true, status: 'active', company_id: companyId },
    { id: 3, title: 'Leadership Excellence Program', description: 'Advanced leadership skills for managers', type: 'classroom', provider: 'External', duration_hours: 24, mandatory: false, status: 'active', company_id: companyId },
  ]);

  // Enrollments
  await knex('enrollments').insert([
    { course_id: 1, worker_id: 3, enrollment_date: '2026-04-01', status: 'in_progress', company_id: companyId },
    { course_id: 2, worker_id: 1, enrollment_date: '2026-01-15', completion_date: '2026-02-01', status: 'completed', score: 95, company_id: companyId },
    { course_id: 2, worker_id: 2, enrollment_date: '2026-01-15', completion_date: '2026-01-20', status: 'completed', score: 88, company_id: companyId },
    { course_id: 2, worker_id: 3, enrollment_date: '2026-01-15', status: 'enrolled', company_id: companyId },
    { course_id: 3, worker_id: 2, enrollment_date: '2026-05-01', status: 'enrolled', company_id: companyId },
  ]);

  // Timesheets
  await knex('timesheets').insert([
    { worker_id: 3, assignment_id: 2, project_id: 'PROJ-001', date: '2026-05-05', hours: 8, billable: true, description: 'API development', status: 'approved', company_id: companyId },
    { worker_id: 3, assignment_id: 2, project_id: 'PROJ-001', date: '2026-05-06', hours: 7.5, billable: true, description: 'Code review', status: 'approved', company_id: companyId },
    { worker_id: 3, assignment_id: 2, project_id: 'PROJ-002', date: '2026-05-07', hours: 6, billable: false, description: 'Internal training', status: 'submitted', company_id: companyId },
    { worker_id: 4, assignment_id: 3, project_id: 'PROJ-001', date: '2026-05-05', hours: 8, billable: true, description: 'Feature implementation', status: 'approved', company_id: companyId },
    { worker_id: 4, assignment_id: 3, project_id: 'PROJ-003', date: '2026-05-06', hours: 4, billable: true, description: 'Bug fixes', status: 'draft', company_id: companyId },
  ]);

  // Payroll periods
  await knex('payroll_periods').insert([
    { id: 1, code: '2026-04', start_date: '2026-04-01', end_date: '2026-04-30', status: 'closed', company_id: companyId },
    { id: 2, code: '2026-05', start_date: '2026-05-01', end_date: '2026-05-31', status: 'open', company_id: companyId },
  ]);

  // Payroll results
  await knex('payroll_results').insert([
    { worker_id: 1, payroll_period_id: 1, gross_pay: 16666.67, deductions: 4333.33, net_pay: 12333.34, employer_tax: 3333.33, employer_benefits: 1500.00, currency: 'USD', status: 'paid', company_id: companyId },
    { worker_id: 2, payroll_period_id: 1, gross_pay: 10416.67, deductions: 2604.17, net_pay: 7812.50, employer_tax: 2083.33, employer_benefits: 1200.00, currency: 'USD', status: 'paid', company_id: companyId },
    { worker_id: 3, payroll_period_id: 1, gross_pay: 7916.67, deductions: 1979.17, net_pay: 5937.50, employer_tax: 1583.33, employer_benefits: 1000.00, currency: 'USD', status: 'paid', company_id: companyId },
  ]);

  // Payroll journal entries
  await knex('payroll_journal').insert([
    { payroll_result_id: 1, gl_account: '6000-SALARY', debit: 16666.67, credit: 0, cost_center_id: 'CC-HR-004', description: 'Salary expense - Admin User', company_id: companyId },
    { payroll_result_id: 1, gl_account: '2000-PAYABLE', debit: 0, credit: 12333.34, cost_center_id: 'CC-HR-004', description: 'Net pay liability', company_id: companyId },
    { payroll_result_id: 1, gl_account: '2000-TAX-PAYABLE', debit: 0, credit: 4333.33, cost_center_id: 'CC-HR-004', description: 'Tax withholding liability', company_id: companyId },
    { payroll_result_id: 2, gl_account: '6000-SALARY', debit: 10416.67, credit: 0, cost_center_id: 'CC-ENG-001', description: 'Salary expense - Sarah Manager', company_id: companyId },
    { payroll_result_id: 2, gl_account: '2000-PAYABLE', debit: 0, credit: 7812.50, cost_center_id: 'CC-ENG-001', description: 'Net pay liability', company_id: companyId },
    { payroll_result_id: 3, gl_account: '6000-SALARY', debit: 7916.67, credit: 0, cost_center_id: 'CC-ENG-001', description: 'Salary expense - John Employee', company_id: companyId },
    { payroll_result_id: 3, gl_account: '2000-PAYABLE', debit: 0, credit: 5937.50, cost_center_id: 'CC-ENG-001', description: 'Net pay liability', company_id: companyId },
  ]);

  // Notifications
  await knex('notifications').insert([
    { user_id: 2, title: 'Pending Leave Request', body: 'John Employee has requested 5 days of annual leave starting May 20', type: 'approval', link: '/absences', is_read: false, company_id: companyId },
    { user_id: 1, title: 'Requisition Needs Review', body: 'A new requisition for Software Engineer requires your approval', type: 'approval', link: '/requisitions', is_read: false, company_id: companyId },
    { user_id: 3, title: 'Course Reminder', body: 'GDPR Compliance training is due by June 30', type: 'reminder', link: '/learning', is_read: false, company_id: companyId },
  ]);

  // Assets
  await knex('assets').insert([
    { id: 1, company_id: companyId, asset_tag: 'LAP-001', name: 'MacBook Pro 14', category: 'Laptop', status: 'assigned', purchase_date: '2025-09-01', purchase_cost: 2200 },
    { id: 2, company_id: companyId, asset_tag: 'PHN-001', name: 'iPhone 15', category: 'Phone', status: 'available', purchase_date: '2025-11-10', purchase_cost: 1200 },
  ]);

  await knex('asset_assignments').insert([
    { company_id: companyId, asset_id: 1, worker_id: 3, assigned_by: 1, start_date: '2025-09-02', status: 'assigned' },
  ]);

  // Inventory
  await knex('warehouses').insert([
    { id: 1, company_id: companyId, name: 'Main Warehouse', location: 'London', is_default: true },
  ]);

  await knex('products').insert([
    { id: 1, company_id: companyId, sku: 'LAP-STD', name: 'Standard Laptop', uom: 'unit', cost: 1200, price: 1600 },
    { id: 2, company_id: companyId, sku: 'LIC-CRM', name: 'CRM License', uom: 'license', cost: 200, price: 400 },
  ]);

  await knex('inventory_levels').insert([
    { company_id: companyId, product_id: 1, warehouse_id: 1, quantity: 25, reserved: 2, reorder_point: 5 },
    { company_id: companyId, product_id: 2, warehouse_id: 1, quantity: 200, reserved: 20, reorder_point: 50 },
  ]);

  // Procurement
  await knex('suppliers').insert([
    { id: 1, company_id: companyId, name: 'Tech Supplier Ltd', email: 'orders@techsupplier.com', phone: '+44-555-0101' },
  ]);

  await knex('purchase_orders').insert([
    { id: 1, company_id: companyId, supplier_id: 1, status: 'approved', total: 12000, currency: 'USD', requested_by: 1, approved_by: 1, ordered_at: '2026-04-10' },
  ]);

  await knex('purchase_order_lines').insert([
    { purchase_order_id: 1, product_id: 1, quantity: 10, unit_price: 1200, received_qty: 5 },
  ]);

  // Sales & CRM
  await knex('customers').insert([
    { id: 1, company_id: companyId, name: 'Northwind Trading', email: 'ops@northwind.com', phone: '+1-555-0111' },
  ]);

  await knex('leads').insert([
    { id: 1, company_id: companyId, source: 'Webinar', status: 'qualified', owner_id: 5, expected_value: 25000 },
  ]);

  await knex('sales_orders').insert([
    { id: 1, company_id: companyId, customer_id: 1, status: 'draft', total: 3200, currency: 'USD' },
  ]);

  await knex('sales_order_lines').insert([
    { sales_order_id: 1, product_id: 1, quantity: 2, unit_price: 1600, delivered_qty: 0 },
  ]);

  // Accounting
  await knex('gl_accounts').insert([
    { id: 1, company_id: companyId, code: '1000', name: 'Cash', type: 'asset', is_active: true },
    { id: 2, company_id: companyId, code: '4000', name: 'Sales Revenue', type: 'income', is_active: true },
  ]);

  await knex('journal_entries').insert([
    { id: 1, company_id: companyId, ref_type: 'seed', ref_id: 'init', entry_date: '2026-05-01', status: 'posted' },
  ]);

  await knex('journal_lines').insert([
    { journal_entry_id: 1, account_id: 1, debit: 5000, credit: 0 },
    { journal_entry_id: 1, account_id: 2, debit: 0, credit: 5000 },
  ]);

  // Projects
  await knex('projects').insert([
    { id: 1, company_id: companyId, name: 'Client Onboarding', description: 'Deliver initial rollout for Northwind', status: 'active' },
  ]);

  await knex('tasks').insert([
    { company_id: companyId, project_id: 1, title: 'Kickoff workshop', status: 'in_progress', assignee_id: 2, due_date: '2026-05-30' },
  ]);
};
