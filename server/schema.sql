CREATE DATABASE IF NOT EXISTS xobiya_hr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE xobiya_hr;

-- Users (authentication)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  photo_url VARCHAR(500) DEFAULT NULL,
  role ENUM('hr', 'manager', 'employee') NOT NULL DEFAULT 'employee',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Workers (employee/contractor master records)
CREATE TABLE workers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  phone VARCHAR(50) DEFAULT NULL,
  worker_type ENUM('employee', 'contractor', 'intern', 'contingent') NOT NULL DEFAULT 'employee',
  hire_date DATE DEFAULT NULL,
  termination_date DATE DEFAULT NULL,
  status ENUM('active', 'onboarding', 'offboarding', 'terminated') NOT NULL DEFAULT 'onboarding',
  department VARCHAR(100) DEFAULT NULL,
  job_title VARCHAR(200) DEFAULT NULL,
  photo_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Positions (organizational seats)
CREATE TABLE positions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  grade_code VARCHAR(20) DEFAULT NULL,
  cost_center_id VARCHAR(50) NOT NULL,
  department VARCHAR(100) DEFAULT NULL,
  location VARCHAR(100) DEFAULT NULL,
  fte DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  status ENUM('filled', 'vacant', 'frozen') NOT NULL DEFAULT 'vacant',
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Assignments (worker-to-position mapping)
CREATE TABLE assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  worker_id INT NOT NULL,
  position_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE DEFAULT NULL,
  manager_id INT DEFAULT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
  FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES workers(id) ON DELETE SET NULL
);

-- Requisitions (hiring requests)
CREATE TABLE requisitions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  position_id INT NOT NULL,
  budgeted_salary DECIMAL(12,2) DEFAULT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status ENUM('open', 'closed', 'cancelled') NOT NULL DEFAULT 'open',
  requested_by INT DEFAULT NULL,
  approved_by INT DEFAULT NULL,
  open_date DATE DEFAULT NULL,
  close_date DATE DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Timesheets (logged work hours)
CREATE TABLE timesheets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  worker_id INT NOT NULL,
  project_id VARCHAR(100) DEFAULT NULL,
  date DATE NOT NULL,
  hours DECIMAL(5,2) NOT NULL,
  billable BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT DEFAULT NULL,
  status ENUM('draft', 'submitted', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
  approved_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Absence entries (leave requests)
CREATE TABLE absences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  worker_id INT NOT NULL,
  type ENUM('vacation', 'sick', 'personal', 'maternity', 'other') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  reason TEXT DEFAULT NULL,
  approved_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Departments lookup
CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  manager_id INT DEFAULT NULL,
  parent_department_id INT DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES workers(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_workers_email ON workers(email);
CREATE INDEX idx_workers_status ON workers(status);
CREATE INDEX idx_workers_department ON workers(department);
CREATE INDEX idx_positions_status ON positions(status);
CREATE INDEX idx_positions_cost_center ON positions(cost_center_id);
CREATE INDEX idx_assignments_worker ON assignments(worker_id);
CREATE INDEX idx_assignments_position ON assignments(position_id);
CREATE INDEX idx_assignments_manager ON assignments(manager_id);
CREATE INDEX idx_absences_worker ON absences(worker_id);
CREATE INDEX idx_absences_status ON absences(status);
CREATE INDEX idx_timesheets_worker ON timesheets(worker_id);
CREATE INDEX idx_timesheets_date ON timesheets(date);
CREATE INDEX idx_requisitions_status ON requisitions(status);
