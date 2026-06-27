import { getAuthToken } from './auth'

const BASE_URL = '/api/debts'

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

export async function getDebts(type, status) {
  const query = new URLSearchParams();
  if (type) query.append('type', type);
  if (status) query.append('status', status);
  
  const queryString = query.toString();
  const path = queryString ? `?${queryString}` : '';
  
  const data = await request(path);
  return data.debts || [];
}

export async function createDebt(data) {
  return request('', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDebt(id, data) {
  return request(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteDebt(id) {
  return request(`/${id}`, {
    method: 'DELETE',
  });
}

export async function payDebt(id, walletId) {
  return request(`/${id}/pay`, {
    method: 'PUT',
    body: JSON.stringify({ walletId }),
  });
}
