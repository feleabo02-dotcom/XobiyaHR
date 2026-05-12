const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function getToken() {
  return localStorage.getItem('xobiya_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('xobiya_token', token);
  else localStorage.removeItem('xobiya_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    window.location.reload();
    throw new Error('Session expired');
  }

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email, password, displayName) => request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName }) }),
  getMe: () => request('/auth/me'),

  getWorkers: () => request('/workers'),
  getWorker: (id) => request(`/workers/${id}`),
  createWorker: (data) => request('/workers', { method: 'POST', body: JSON.stringify(data) }),
  updateWorker: (id, data) => request(`/workers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWorker: (id) => request(`/workers/${id}`, { method: 'DELETE' }),

  getDepartments: () => request('/departments'),
  createDepartment: (data) => request('/departments', { method: 'POST', body: JSON.stringify(data) }),
  updateDepartment: (id, data) => request(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getPositions: () => request('/positions'),
  getPosition: (id) => request(`/positions/${id}`),
  createPosition: (data) => request('/positions', { method: 'POST', body: JSON.stringify(data) }),
  updatePosition: (id, data) => request(`/positions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePosition: (id) => request(`/positions/${id}`, { method: 'DELETE' }),

  getAssignments: () => request('/assignments'),
  createAssignment: (data) => request('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  updateAssignment: (id, data) => request(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getAbsences: () => request('/absences'),
  getAbsenceTypes: () => request('/absences/types'),
  getLeaveBalances: () => request('/absences/balances'),
  createAbsence: (data) => request('/absences', { method: 'POST', body: JSON.stringify(data) }),
  updateAbsenceStatus: (id, status) => request(`/absences/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  cancelAbsence: (id) => request(`/absences/${id}/cancel`, { method: 'PUT' }),

  getRequisitions: () => request('/requisitions'),
  createRequisition: (data) => request('/requisitions', { method: 'POST', body: JSON.stringify(data) }),
  updateRequisitionStatus: (id, status) => request(`/requisitions/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  getTimesheets: (params) => request(`/timesheets${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  createTimesheet: (data) => request('/timesheets', { method: 'POST', body: JSON.stringify(data) }),
  updateTimesheet: (id, data) => request(`/timesheets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTimesheet: (id) => request(`/timesheets/${id}`, { method: 'DELETE' }),
  submitTimesheet: (id) => request(`/timesheets/${id}/submit`, { method: 'PUT' }),
  approveTimesheet: (id) => request(`/timesheets/${id}/approve`, { method: 'PUT' }),

  getGoals: (params) => request(`/goals${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  createGoal: (data) => request('/goals', { method: 'POST', body: JSON.stringify(data) }),
  updateGoal: (id, data) => request(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGoal: (id) => request(`/goals/${id}`, { method: 'DELETE' }),

  getCourses: () => request('/courses'),
  createCourse: (data) => request('/courses', { method: 'POST', body: JSON.stringify(data) }),
  getEnrollments: () => request('/courses/enrollments'),
  enrollCourse: (courseId) => request('/courses/enroll', { method: 'POST', body: JSON.stringify({ courseId }) }),
  updateEnrollment: (id, data) => request(`/courses/enrollments/${id}/progress`, { method: 'PUT', body: JSON.stringify(data) }),

  getPayrollPeriods: () => request('/payroll/periods'),
  getPayrollResults: () => request('/payroll/results'),
  getPayrollJournal: () => request('/payroll/journal'),

  getPerformanceReviews: () => request('/performance'),
  createPerformanceReview: (data) => request('/performance', { method: 'POST', body: JSON.stringify(data) }),
  updatePerformanceReview: (id, data) => request(`/performance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getDashboardStats: () => request('/dashboard/stats'),
  getErpBridge: () => request('/dashboard/erp-bridge'),

  getNotifications: () => request('/notifications'),
  getUnreadCount: () => request('/notifications/unread-count'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),
};
