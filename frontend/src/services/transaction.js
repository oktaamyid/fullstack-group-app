import { getAuthToken } from './auth'

const BASE_URL = '/api/transactions'

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
    throw new Error(payload?.message || 'Transaction request failed')
  }

  return payload.data
}

export function getTransactions() {
  return request()
}

export function createTransaction(body) {
  return request('', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateTransaction(id, body) {
  return request(`/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteTransaction(id) {
  return request(`/${id}`, {
    method: 'DELETE',
  })
}
