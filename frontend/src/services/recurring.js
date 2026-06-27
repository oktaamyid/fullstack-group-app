import { getAuthToken } from './auth'

const BASE_URL = '/api/recurring'

async function request(path = '', options = {}) {
  const token = getAuthToken()

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })

  const payload = await response.json()

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Request failed')
  }

  return payload.data
}

export async function getRecurring() {
  const data = await request();
  return data.recurrings || [];
}

export async function createRecurring(data) {
  return request('', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRecurringStatus(id, status) {
  return request(`/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function deleteRecurring(id) {
  return request(`/${id}`, {
    method: 'DELETE',
  });
}
