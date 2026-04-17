import { getAuthToken } from './auth'

const BASE_URL = '/api/split-bills'

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
    throw new Error(payload?.message || 'Split bill request failed')
  }

  return payload.data
}

export function getSplitBills() {
  return request()
}

export function createSplitBill(body) {
  return request('', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateSplitBill(id, body) {
  return request(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function updateSplitBillMemberStatus(id, memberId, status) {
  return request(`/${id}/members/${memberId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function deleteSplitBill(id) {
  return request(`/${id}`, {
    method: 'DELETE',
  })
}
