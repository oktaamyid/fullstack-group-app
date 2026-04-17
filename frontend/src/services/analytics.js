import { getAuthToken } from './auth'

async function request(path = '') {
  const token = getAuthToken()

  const response = await fetch(`/api/analytics${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  const payload = await response.json()

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Analytics request failed')
  }

  return payload.data
}

export function getAnalyticsOverview() {
  return request('/overview')
}
