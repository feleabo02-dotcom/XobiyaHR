const bcrypt = require('bcryptjs');

exports.seed = async function (knex) {
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
  await knex('users').del();

  const hash = bcrypt.hashSync('admin123', 12);

  // Users
  await knex('users').insert([
    { id: 1, email: 'admin@xobiya.com', password_hash: hash, display_name: 'Admin User', role: 'hr', is_active: true },
    { id: 2, email: 'manager@xobiya.com', password_hash: hash, display_name: 'Sarah Manager', role: 'manager', is_active: true },
    { id: 3, email: 'employee@xobiya.com', password_hash: hash, display_name: 'John Employee', role: 'employee', is_active: true },
  ]);

  // Departments
  await knex('departments').insert([
    { id: 1, name: 'Engineering', code: 'ENG', cost_center_id: 'CC-ENG-001' },
    { id: 2, name: 'Sales', code: 'SALES', cost_center_id: 'CC-SALES-002' },
    { id: 3, name: 'Marketing', code: 'MKTG', cost_center_id: 'CC-MKTG-003' },
    { id: 4, name: 'Human Resources', code: 'HR', cost_center_id: 'CC-HR-004' },
    { id: 5, name: 'Finance', code: 'FIN', cost_center_id: 'CC-FIN-005' },
  ]);

  // Compensation Grades
  await knex('compensation_grades').insert([
    { id: 1, code: 'L3', title: 'Associate', min_salary: 40000, mid_salary: 55000, max_salary: 70000 },
    { id: 2, code: 'L4', title: 'Senior Associate', min_salary: 55000, mid_salary: 75000, max_salary: 95000 },
    { id: 3, code: 'L5', title: 'Manager', min_salary: 75000, mid_salary: 95000, max_salary: 120000 },
    { id: 4, code: 'L6', title: 'Senior Manager', min_salary: 95000, mid_salary: 125000, max_salary: 160000 },
    { id: 5, code: 'E1', title: 'Executive', min_salary: 150000, mid_salary: 200000, max_salary: 300000 },
  ]);

  // Workers
  await knex('workers').insert([
    { id: 1, user_id: 1, employee_id: 'EMP-001', first_name: 'Admin', last_name: 'User', email: 'admin@xobiya.com', worker_type: 'employee', hire_date: '2020-01-15', status: 'active', department_id: 4, job_title: 'HR Director', grade_id: 5 },
    { id: 2, user_id: 2, employee_id: 'EMP-002', first_name: 'Sarah', last_name: 'Manager', email: 'sarah@xobiya.com', worker_type: 'employee', hire_date: '2021-03-01', status: 'active', department_id: 1, job_title: 'Engineering Manager', grade_id: 4 },
    { id: 3, user_id: 3, employee_id: 'EMP-003', first_name: 'John', last_name: 'Employee', email: 'john@xobiya.com', worker_type: 'employee', hire_date: '2022-06-15', status: 'active', department_id: 1, job_title: 'Software Engineer', grade_id: 3 },
    { id: 4, employee_id: 'EMP-004', first_name: 'Alice', last_name: 'Johnson', email: 'alice@xobiya.com', worker_type: 'employee', hire_date: '2021-09-01', status: 'active', department_id: 1, job_title: 'Senior Developer', grade_id: 3 },
    { id: 5, employee_id: 'EMP-005', first_name: 'Bob', last_name: 'Smith', email: 'bob@xobiya.com', worker_type: 'employee', hire_date: '2023-01-10', status: 'onboarding', department_id: 2, job_title: 'Sales Representative', grade_id: 2 },
    { id: 6, employee_id: 'CON-001', first_name: 'Carol', last_name: 'Davis', email: 'carol@xobiya.com', worker_type: 'contractor', hire_date: '2024-03-01', status: 'active', department_id: 3, job_title: 'Marketing Consultant', grade_id: 3 },
  ]);

  // Positions
  await knex('positions').insert([
    { id: 1, title: 'Engineering Manager', grade_id: 4, cost_center_id: 'CC-ENG-001', department_id: 1, location: 'London', fte: 1.0, budgeted_salary: 125000, status: 'filled' },
    { id: 2, title: 'Senior Software Engineer', grade_id: 3, cost_center_id: 'CC-ENG-001', department_id: 1, location: 'London', fte: 1.0, budgeted_salary: 95000, status: 'filled' },
    { id: 3, title: 'Software Engineer', grade_id: 2, cost_center_id: 'CC-ENG-001', department_id: 1, location: 'London', fte: 1.0, budgeted_salary: 75000, status: 'vacant' },
    { id: 4, title: 'Sales Representative', grade_id: 2, cost_center_id: 'CC-SALES-002', department_id: 2, location: 'New York', fte: 1.0, budgeted_salary: 70000, status: 'filled' },
    { id: 5, title: 'Marketing Manager', grade_id: 4, cost_center_id: 'CC-MKTG-003', department_id: 3, location: 'Remote', fte: 1.0, budgeted_salary: 110000, status: 'vacant' },
    { id: 6, title: 'HR Director', grade_id: 5, cost_center_id: 'CC-HR-004', department_id: 4, location: 'London', fte: 1.0, budgeted_salary: 200000, status: 'filled' },
    { id: 7, title: 'Financial Analyst', grade_id: 2, cost_center_id: 'CC-FIN-005', department_id: 5, location: 'London', fte: 0.5, budgeted_salary: 40000, status: 'frozen' },
  ]);

  // Assignments
  await knex('assignments').insert([
    { id: 1, worker_id: 2, position_id: 1, start_date: '2021-03-01', manager_id: 1, is_primary: true },
    { id: 2, worker_id: 3, position_id: 2, start_date: '2022-06-15', manager_id: 2, is_primary: true },
    { id: 3, worker_id: 4, position_id: 2, start_date: '2021-09-01', manager_id: 2, is_primary: false },
    { id: 4, worker_id: 5, position_id: 4, start_date: '2023-01-10', manager_id: 1, is_primary: true },
    { id: 5, worker_id: 1, position_id: 6, start_date: '2020-01-15', is_primary: true },
    { id: 6, worker_id: 6, position_id: 2, start_date: '2024-03-01', manager_id: 2, is_primary: true },
  ]);

  // Requisitions
  await knex('requisitions').insert([
    { id: 1, position_id: 3, budgeted_salary: 75000, status: 'open', requested_by: 2, open_date: '2026-04-01', notes: 'Backfill for departed team member' },
    { id: 2, position_id: 5, budgeted_salary: 110000, status: 'open', requested_by: 1, open_date: '2026-04-15', notes: 'New headcount approved in Q2 planning' },
    { id: 3, position_id: 7, budgeted_salary: 40000, status: 'closed', requested_by: 1, approved_by: 1, open_date: '2026-01-10', close_date: '2026-02-01', notes: 'Budget frozen due to restructuring' },
  ]);

  // Absence types
  await knex('absence_types').insert([
    { id: 1, code: 'vacation', label: 'Annual Leave', paid: true, default_entitlement: 20, carryover_allowed: true, max_carryover: 5 },
    { id: 2, code: 'sick', label: 'Sick Leave', paid: true, default_entitlement: 10, carryover_allowed: false },
    { id: 3, code: 'personal', label: 'Personal Leave', paid: true, default_entitlement: 3, carryover_allowed: false },
    { id: 4, code: 'maternity', label: 'Maternity Leave', paid: true, default_entitlement: 180, carryover_allowed: false },
    { id: 5, code: 'other', label: 'Other Leave', paid: false, carryover_allowed: false },
  ]);

  // Leave balances
  await knex('leave_balances').insert([
    { worker_id: 1, absence_type_id: 1, total_entitled: 25, total_taken: 12, total_pending: 2, year: 2026 },
    { worker_id: 2, absence_type_id: 1, total_entitled: 22, total_taken: 8, total_pending: 0, year: 2026 },
    { worker_id: 3, absence_type_id: 1, total_entitled: 20, total_taken: 5, total_pending: 3, year: 2026 },
    { worker_id: 4, absence_type_id: 1, total_entitled: 22, total_taken: 10, total_pending: 1, year: 2026 },
    { worker_id: 5, absence_type_id: 1, total_entitled: 20, total_taken: 2, total_pending: 0, year: 2026 },
  ]);

  // Absences
  await knex('absences').insert([
    { worker_id: 3, absence_type_id: 1, start_date: '2026-05-20', end_date: '2026-05-24', duration_days: 5, status: 'pending', reason: 'Family vacation' },
    { worker_id: 4, absence_type_id: 2, start_date: '2026-05-12', end_date: '2026-05-13', duration_days: 2, status: 'approved', reason: 'Doctor appointment' },
    { worker_id: 1, absence_type_id: 1, start_date: '2026-06-01', end_date: '2026-06-05', duration_days: 5, status: 'approved', reason: 'Annual leave' },
  ]);

  // Goals
  await knex('goals').insert([
    { worker_id: 3, title: 'Complete microservices migration', description: 'Migrate 3 legacy services to microservices architecture', type: 'okr', status: 'active', start_date: '2026-01-01', end_date: '2026-06-30', weight: 0.4, progress: 60, created_by: 2 },
    { worker_id: 3, title: 'Improve test coverage', description: 'Achieve 85% code coverage across all services', type: 'kpi', status: 'active', start_date: '2026-01-01', end_date: '2026-12-31', weight: 0.3, progress: 45, created_by: 2 },
    { worker_id: 3, title: 'Mentor junior developers', description: 'Conduct weekly code reviews and pair programming sessions', type: 'mbo', status: 'active', start_date: '2026-03-01', end_date: '2026-09-30', weight: 0.3, progress: 35, created_by: 2 },
  ]);

  // Courses
  await knex('courses').insert([
    { id: 1, title: 'AWS Cloud Practitioner Certification', description: 'Prepare for the AWS Cloud Practitioner exam', type: 'online', provider: 'AWS Training', duration_hours: 16, mandatory: false, status: 'active' },
    { id: 2, title: 'Data Privacy & GDPR Compliance', description: 'Mandatory training on data protection regulations', type: 'online', provider: 'Compliance Team', duration_hours: 4, mandatory: true, status: 'active' },
    { id: 3, title: 'Leadership Excellence Program', description: 'Advanced leadership skills for managers', type: 'classroom', provider: 'External', duration_hours: 24, mandatory: false, status: 'active' },
  ]);

  // Enrollments
  await knex('enrollments').insert([
    { course_id: 1, worker_id: 3, enrollment_date: '2026-04-01', status: 'in_progress' },
    { course_id: 2, worker_id: 1, enrollment_date: '2026-01-15', completion_date: '2026-02-01', status: 'completed', score: 95 },
    { course_id: 2, worker_id: 2, enrollment_date: '2026-01-15', completion_date: '2026-01-20', status: 'completed', score: 88 },
    { course_id: 2, worker_id: 3, enrollment_date: '2026-01-15', status: 'enrolled' },
    { course_id: 3, worker_id: 2, enrollment_date: '2026-05-01', status: 'enrolled' },
  ]);

  // Timesheets
  await knex('timesheets').insert([
    { worker_id: 3, assignment_id: 2, project_id: 'PROJ-001', date: '2026-05-05', hours: 8, billable: true, description: 'API development', status: 'approved' },
    { worker_id: 3, assignment_id: 2, project_id: 'PROJ-001', date: '2026-05-06', hours: 7.5, billable: true, description: 'Code review', status: 'approved' },
    { worker_id: 3, assignment_id: 2, project_id: 'PROJ-002', date: '2026-05-07', hours: 6, billable: false, description: 'Internal training', status: 'submitted' },
    { worker_id: 4, assignment_id: 3, project_id: 'PROJ-001', date: '2026-05-05', hours: 8, billable: true, description: 'Feature implementation', status: 'approved' },
    { worker_id: 4, assignment_id: 3, project_id: 'PROJ-003', date: '2026-05-06', hours: 4, billable: true, description: 'Bug fixes', status: 'draft' },
  ]);

  // Payroll periods
  await knex('payroll_periods').insert([
    { id: 1, code: '2026-04', start_date: '2026-04-01', end_date: '2026-04-30', status: 'closed' },
    { id: 2, code: '2026-05', start_date: '2026-05-01', end_date: '2026-05-31', status: 'open' },
  ]);

  // Payroll results
  await knex('payroll_results').insert([
    { worker_id: 1, payroll_period_id: 1, gross_pay: 16666.67, deductions: 4333.33, net_pay: 12333.34, employer_tax: 3333.33, employer_benefits: 1500.00, currency: 'USD', status: 'paid' },
    { worker_id: 2, payroll_period_id: 1, gross_pay: 10416.67, deductions: 2604.17, net_pay: 7812.50, employer_tax: 2083.33, employer_benefits: 1200.00, currency: 'USD', status: 'paid' },
    { worker_id: 3, payroll_period_id: 1, gross_pay: 7916.67, deductions: 1979.17, net_pay: 5937.50, employer_tax: 1583.33, employer_benefits: 1000.00, currency: 'USD', status: 'paid' },
  ]);

  // Payroll journal entries
  await knex('payroll_journal').insert([
    { payroll_result_id: 1, gl_account: '6000-SALARY', debit: 16666.67, credit: 0, cost_center_id: 'CC-HR-004', description: 'Salary expense - Admin User' },
    { payroll_result_id: 1, gl_account: '2000-PAYABLE', debit: 0, credit: 12333.34, cost_center_id: 'CC-HR-004', description: 'Net pay liability' },
    { payroll_result_id: 1, gl_account: '2000-TAX-PAYABLE', debit: 0, credit: 4333.33, cost_center_id: 'CC-HR-004', description: 'Tax withholding liability' },
    { payroll_result_id: 2, gl_account: '6000-SALARY', debit: 10416.67, credit: 0, cost_center_id: 'CC-ENG-001', description: 'Salary expense - Sarah Manager' },
    { payroll_result_id: 2, gl_account: '2000-PAYABLE', debit: 0, credit: 7812.50, cost_center_id: 'CC-ENG-001', description: 'Net pay liability' },
    { payroll_result_id: 3, gl_account: '6000-SALARY', debit: 7916.67, credit: 0, cost_center_id: 'CC-ENG-001', description: 'Salary expense - John Employee' },
    { payroll_result_id: 3, gl_account: '2000-PAYABLE', debit: 0, credit: 5937.50, cost_center_id: 'CC-ENG-001', description: 'Net pay liability' },
  ]);

  // Notifications
  await knex('notifications').insert([
    { user_id: 2, title: 'Pending Leave Request', body: 'John Employee has requested 5 days of annual leave starting May 20', type: 'approval', link: '/absences', is_read: false },
    { user_id: 1, title: 'Requisition Needs Review', body: 'A new requisition for Software Engineer requires your approval', type: 'approval', link: '/requisitions', is_read: false },
    { user_id: 3, title: 'Course Reminder', body: 'GDPR Compliance training is due by June 30', type: 'reminder', link: '/learning', is_read: false },
  ]);
};
