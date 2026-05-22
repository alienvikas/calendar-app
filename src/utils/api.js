import { API_BASE_URL } from '../config/apiConfig';

async function request(method, path, body) {
  const options = { method, headers: {} };
  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE_URL}${path}`, options);
  if (!res.ok) {
    const text = await res.text().catch(() => res.status);
    throw new Error(`API ${method} ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// Returns { storageDate: [shift, ...], ... } for the given role
export const getShifts = (role) =>
  request('GET', `/api/shifts?role=${encodeURIComponent(role)}`);

export const createShift = (role, storageDate, shift) =>
  request('POST', '/api/shifts', { role, storageDate, ...shift });

export const updateShift = (role, storageDate, shift) =>
  request('PUT', `/api/shifts/${shift.id}`, { role, storageDate, ...shift });

export const deleteShift = (id) =>
  request('DELETE', `/api/shifts/${id}`);

export const acceptShiftApi = (id) =>
  request('PATCH', `/api/shifts/${id}/accept`);
