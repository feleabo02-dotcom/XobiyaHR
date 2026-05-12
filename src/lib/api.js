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

  getProducts: () => request('/inventory/products'),
  getWarehouses: () => request('/inventory/warehouses'),

  getSuppliers: () => request('/procurement/suppliers'),
  getPurchaseRequests: () => request('/procurement/purchase-requests'),
  createPurchaseRequest: (data) => request('/procurement/purchase-requests', { method: 'POST', body: JSON.stringify(data) }),
  submitPurchaseRequest: (id) => request(`/procurement/purchase-requests/${id}/submit`, { method: 'PUT' }),
  approvePurchaseRequest: (id) => request(`/procurement/purchase-requests/${id}/approve`, { method: 'PUT' }),
  rejectPurchaseRequest: (id) => request(`/procurement/purchase-requests/${id}/reject`, { method: 'PUT' }),
  getPurchaseOrders: () => request('/procurement/purchase-orders'),
  getPurchaseOrderLines: (id) => request(`/procurement/purchase-orders/${id}/lines`),
  createPurchaseOrder: (data) => request('/procurement/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  approvePurchaseOrder: (id) => request(`/procurement/purchase-orders/${id}/approve`, { method: 'PUT' }),
  orderPurchaseOrder: (id) => request(`/procurement/purchase-orders/${id}/order`, { method: 'PUT' }),
  cancelPurchaseOrder: (id) => request(`/procurement/purchase-orders/${id}/cancel`, { method: 'PUT' }),
  createGoodsReceipt: (data) => request('/procurement/goods-receipts', { method: 'POST', body: JSON.stringify(data) }),

  getCustomers: () => request('/sales/customers'),
  getSalesOrders: () => request('/sales/orders'),
  createSalesOrder: (data) => request('/sales/orders', { method: 'POST', body: JSON.stringify(data) }),
  confirmSalesOrder: (id, warehouseId) => request(`/sales/orders/${id}/confirm`, { method: 'POST', body: JSON.stringify({ warehouseId }) }),
  fulfillSalesOrder: (id) => request(`/sales/orders/${id}/fulfill`, { method: 'POST' }),
  cancelSalesOrder: (id) => request(`/sales/orders/${id}/cancel`, { method: 'POST' }),
  createInvoiceFromOrder: (id, dueDate) => request(`/sales/orders/${id}/invoice`, { method: 'POST', body: JSON.stringify({ dueDate }) }),
  getInvoices: () => request('/sales/invoices'),
  payInvoice: (id, method) => request(`/sales/invoices/${id}/pay`, { method: 'POST', body: JSON.stringify({ method }) }),
  cancelInvoice: (id) => request(`/sales/invoices/${id}/cancel`, { method: 'POST' }),
};
