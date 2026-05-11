const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function getToken() {
  const stored = localStorage.getItem('xobiya_token');
  return stored;
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('xobiya_token', token);
  } else {
    localStorage.removeItem('xobiya_token');
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    window.location.reload();
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (email, password, displayName, role) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName, role }) }),

  getMe: () => request('/auth/me'),

  // Workers
  getWorkers: () => request('/workers'),
  getWorker: (id) => request(`/workers/${id}`),
  createWorker: (data) => request('/workers', { method: 'POST', body: JSON.stringify(data) }),
  updateWorker: (id, data) => request(`/workers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWorker: (id) => request(`/workers/${id}`, { method: 'DELETE' }),

  // Positions
  getPositions: () => request('/positions'),
  getPosition: (id) => request(`/positions/${id}`),
  createPosition: (data) => request('/positions', { method: 'POST', body: JSON.stringify(data) }),
  updatePosition: (id, data) => request(`/positions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePosition: (id) => request(`/positions/${id}`, { method: 'DELETE' }),

  // Absences
  getAbsences: () => request('/absences'),
  createAbsence: (data) => request('/absences', { method: 'POST', body: JSON.stringify(data) }),
  updateAbsenceStatus: (id, status) => request(`/absences/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  cancelAbsence: (id) => request(`/absences/${id}/cancel`, { method: 'PUT' }),

  // Assignments
  getAssignments: () => request('/assignments'),
  createAssignment: (data) => request('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  updateAssignment: (id, data) => request(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Requisitions
  getRequisitions: () => request('/requisitions'),
  createRequisition: (data) => request('/requisitions', { method: 'POST', body: JSON.stringify(data) }),
  updateRequisitionStatus: (id, status) => request(`/requisitions/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Timesheets
  getTimesheets: (params) => request(`/timesheets${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  createTimesheet: (data) => request('/timesheets', { method: 'POST', body: JSON.stringify(data) }),
  updateTimesheet: (id, data) => request(`/timesheets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTimesheet: (id) => request(`/timesheets/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),
};
