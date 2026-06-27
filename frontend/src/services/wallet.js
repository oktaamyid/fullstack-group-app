import { getAuthToken } from './auth'

const BASE_URL = '/api/wallets'

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

export async function getWallets() {
  const data = await request();
  return data.wallets || [];
}

export async function createWallet(data) {
  return request('', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateWallet(id, data) {
  return request(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteWallet(id) {
  return request(`/${id}`, {
    method: 'DELETE',
  });
}

export async function transferBalance(data) {
  return request('/transfer', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
